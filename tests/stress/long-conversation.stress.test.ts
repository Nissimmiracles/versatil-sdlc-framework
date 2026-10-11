// Keep stress fixtures away from account memory and statistics.
jest.mock('os', () => {
  const os = jest.requireActual('os');
  const fs = jest.requireActual('fs');
  const path = jest.requireActual('path');
  const fixtureHome = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-stress-home-'));
  return { ...os, homedir: () => fixtureHome };
});
afterAll(() => {
  const fs = jest.requireActual('fs');
  fs.rmSync(require('os').homedir(), { recursive: true, force: true });
});

/** Explicit event persistence over repeated clears, not a live conversation benchmark. */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContextStatsTracker } from '../../src/memory/context-stats-tracker.js';
import { AgentMemoryManager } from '../../src/memory/agent-memory-manager.js';
import { join } from 'path';
import { homedir } from 'os';
let tracker: ContextStatsTracker;
beforeEach(async () => { tracker = new ContextStatsTracker(join(homedir(), 'fixture-stats')); await tracker.initialize(); });
afterEach(() => { tracker.clearPreClearHooks(); jest.restoreAllMocks(); });
const event = () => ({ inputTokens: 100000, toolUsesCleared: 10, tokensSaved: 30000, triggerType: 'input_tokens' as const, triggerValue: 100000, agentId: 'maria-qa' });
describe('Repeated clear persistence', () => {
  test('preserves caller-recorded clear events across reload', async () => {
    for (let i = 0; i < 5; i++) await tracker.trackClearEvent(event());
    expect(tracker.getStatistics()).toMatchObject({ totalClearEvents: 5, totalTokensProcessed: 500000, totalTokensSaved: 150000 });
    const reloaded = new ContextStatsTracker(join(homedir(), 'fixture-stats')); await reloaded.initialize();
    expect(reloaded.getClearEvents()).toHaveLength(5);
    expect(reloaded.getClearEvents()[0].timestamp).toBeInstanceOf(Date);
  });
  test('calls preservation hooks before each clear and persists their real memory artifact', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const memory = new AgentMemoryManager(); await memory.initialize();
    let count = 0;
    tracker.registerPreClearHook(async () => { await memory.storePattern('maria-qa', `preserved-${count++}`, '# Critical fixture'); return 1; });
    for (let i = 0; i < 5; i++) await tracker.trackClearEvent(event());
    expect((await memory.loadPatterns('maria-qa')).filter(value => value === '# Critical fixture')).toHaveLength(5);
    expect(tracker.getClearEvents().slice(-5).every(value => value.patternsPreserved === 1 && value.preClearHookExecuted)).toBe(true);
  });
  test('records failed preservation explicitly without inventing a preserved pattern', async () => {
    tracker.registerPreClearHook(async () => { throw new Error('Fixture preservation failure'); });
    await tracker.trackClearEvent(event());
    expect(tracker.getClearEvents().at(-1)).toMatchObject({ preClearHookExecuted: true, patternsPreserved: 0 });
  });
  test('does not create clear events solely from session token accounting', () => {
    tracker.startSession('maria-qa'); const before = tracker.getClearEvents().length;
    tracker.updateTokenUsage(500000, 2000);
    expect(tracker.getClearEvents()).toHaveLength(before);
  });
});
