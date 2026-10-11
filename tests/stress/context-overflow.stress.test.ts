/** Sentinel risk thresholds with explicit measurements; no SDK token reclamation claim. */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContextSentinel } from '../../src/agents/monitoring/context-sentinel.js';
let sentinel: ContextSentinel;
beforeEach(() => { sentinel = new ContextSentinel(); });
afterEach(() => { sentinel.destroy(); jest.restoreAllMocks(); });
const usage = (tokens: number, cacheHitRate = 0.8, wastePercentage = 0) => ({ totalTokens: tokens, maxTokens: 200000, percentage: tokens / 2000, breakdown: { cachedTokens: 0, dynamicTokens: tokens, toolOutputTokens: 0, conversationTokens: 0 }, perFlywheel: {}, cacheHitRate, wastePercentage });

describe('Context threshold dispatch', () => {
  test.each([170000, 190000, 200000])('invokes compaction at %i measured tokens and remeasures', async tokens => {
    const measure = jest.spyOn(sentinel as any, 'measureContextUsage').mockResolvedValueOnce(usage(tokens)).mockResolvedValueOnce(usage(100000));
    const compact = jest.spyOn(sentinel as any, 'emergencyCompaction').mockResolvedValue({ tokensReclaimed: tokens - 100000 });
    const critical = jest.fn(); sentinel.on('context-critical', critical);
    const result = await sentinel.runContextCheck();
    expect(compact).toHaveBeenCalledWith(expect.objectContaining({ totalTokens: 100000 }));
    expect(measure).toHaveBeenCalledTimes(2);
    expect(result.usage.totalTokens).toBe(100000);
    expect(critical).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ type: 'high_usage', severity: 'critical' })]));
  });
  test('does not compact below the emergency threshold', async () => {
    jest.spyOn(sentinel as any, 'measureContextUsage').mockResolvedValue(usage(169000));
    const compact = jest.spyOn(sentinel as any, 'emergencyCompaction');
    expect((await sentinel.runContextCheck()).risks).toContainEqual(expect.objectContaining({ type: 'high_usage', severity: 'high' }));
    expect(compact).not.toHaveBeenCalled();
  });
  test('propagates failed measurement without emitting success', async () => {
    jest.spyOn(sentinel as any, 'measureContextUsage').mockRejectedValue(new Error('Unavailable fixture measurement'));
    const checked = jest.fn(); sentinel.on('context-check', checked);
    await expect(sentinel.runContextCheck()).rejects.toThrow('Unavailable fixture measurement');
    expect(checked).not.toHaveBeenCalled();
  });
});
