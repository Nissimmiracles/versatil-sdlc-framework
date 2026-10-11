/** Cache risk classification from supplied measurements, not provider cache performance. */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContextSentinel } from '../../src/agents/monitoring/context-sentinel.js';
let sentinel: ContextSentinel;
beforeEach(() => { sentinel = new ContextSentinel(); });
afterEach(() => { sentinel.destroy(); jest.restoreAllMocks(); });
const usage = (tokens: number, cacheHitRate = 0.8, wastePercentage = 0) => ({ totalTokens: tokens, maxTokens: 200000, percentage: tokens / 2000, breakdown: { cachedTokens: 0, dynamicTokens: tokens, toolOutputTokens: 0, conversationTokens: 0 }, perFlywheel: {}, cacheHitRate, wastePercentage });

describe('Cache risk and monitoring lifecycle', () => {
  test.each([[0.69, true], [0.70, false], [0.95, false]])('classifies cache hit rate %f', async (rate, risk) => {
    jest.spyOn(sentinel as any, 'measureContextUsage').mockResolvedValue(usage(50000, rate as number));
    const result = await sentinel.runContextCheck();
    expect(result.usage.cacheHitRate).toBe(rate);
    expect(result.risks.some(value => value.type === 'low_cache_efficiency')).toBe(risk);
  });
  test.each([[15, false], [16, true]])('classifies waste %i', async (waste, risk) => {
    jest.spyOn(sentinel as any, 'measureContextUsage').mockResolvedValue(usage(50000, 0.8, waste as number));
    expect((await sentinel.runContextCheck()).risks.some(value => value.type === 'high_waste')).toBe(risk);
  });
  test('bounds history after many checks', async () => {
    jest.spyOn(sentinel as any, 'measureContextUsage').mockResolvedValue(usage(50000));
    for (let i = 0; i < 100; i++) await sentinel.runContextCheck();
    expect((sentinel as any).contextHistory).toHaveLength(60);
  });
  test('starts one monitor and stops its timer', async () => {
    jest.useFakeTimers();
    try {
      const check = jest.spyOn(sentinel, 'runContextCheck').mockResolvedValue({} as any);
      sentinel.startMonitoring(); sentinel.startMonitoring();
      expect(check).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(5000); expect(check).toHaveBeenCalledTimes(2);
      sentinel.stopMonitoring(); await jest.advanceTimersByTimeAsync(10000);
      expect(check).toHaveBeenCalledTimes(2);
    } finally { jest.useRealTimers(); }
  });
});
