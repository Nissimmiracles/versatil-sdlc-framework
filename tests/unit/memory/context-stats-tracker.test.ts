/** Tests the implemented context/session statistics contract with isolated persistence. */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ContextStatsTracker, type ContextClearEvent } from '../../../src/memory/context-stats-tracker.js';

const event = (extra: Partial<Omit<ContextClearEvent, 'timestamp'>> = {}) => ({
  inputTokens: 100000, tokensSaved: 60000, toolUsesCleared: 10,
  triggerType: 'input_tokens' as const, triggerValue: 100000, agentId: 'maria-qa', ...extra,
});
const memory = (extra = {}) => ({operation: 'view' as const, path: 'fixture.md', success: true, agentId: 'alex-ba', ...extra});

describe('ContextStatsTracker implemented contract', () => {
  let tracker: ContextStatsTracker;
  let dir: string;
  beforeEach(async () => { dir = await fs.mkdtemp(path.join(os.tmpdir(), 'context-stats-')); tracker = new ContextStatsTracker(dir); await tracker.initialize(); });
  afterEach(async () => { jest.restoreAllMocks(); await fs.rm(dir, {recursive: true, force: true}); });

  it('creates a missing statistics directory', async () => {
    const nested = path.join(dir, 'nested'); await new ContextStatsTracker(nested).initialize(); expect((await fs.stat(nested)).isDirectory()).toBe(true);
  });
  it('returns finite zero totals for an empty tracker', () => {
    expect(tracker.getStatistics()).toMatchObject({totalClearEvents: 0, totalTokensProcessed: 0, totalTokensSaved: 0, totalMemoryOperations: 0, avgTokensPerClear: 0, memoryOperationsByType: {}, clearEventsByAgent: {}});
  });
  it('tracks real input and saved tokens separately', async () => {
    await tracker.trackClearEvent(event()); expect(tracker.getStatistics()).toMatchObject({totalClearEvents: 1, totalTokensProcessed: 100000, totalTokensSaved: 60000, avgTokensPerClear: 60000, clearEventsByAgent: {'maria-qa': 1}});
  });
  it('computes the mean saved tokens across distinct agents', async () => {
    await tracker.trackClearEvent(event()); await tracker.trackClearEvent(event({inputTokens: 120000, tokensSaved: 70000, agentId: 'james-frontend'}));
    expect(tracker.getStatistics()).toMatchObject({totalClearEvents: 2, totalTokensProcessed: 220000, totalTokensSaved: 130000, avgTokensPerClear: 65000, clearEventsByAgent: {'maria-qa': 1, 'james-frontend': 1}});
  });
  it('persists and reloads clear events including Date values', async () => {
    await tracker.trackClearEvent(event()); const records = JSON.parse(await fs.readFile(path.join(dir, 'clear-events.json'), 'utf8')); expect(records).toHaveLength(1); expect(records[0].tokensSaved).toBe(60000);
    const fresh = new ContextStatsTracker(dir); await fresh.initialize(); expect(fresh.getStatistics().totalTokensSaved).toBe(60000); expect(fresh.getClearEvents()[0].timestamp).toBeInstanceOf(Date);
  });
  it('tolerates corrupt persisted data without inventing events', async () => {
    await fs.writeFile(path.join(dir, 'clear-events.json'), 'corrupt'); const fresh = new ContextStatsTracker(dir); await fresh.initialize(); expect(fresh.getClearEvents()).toEqual([]);
  });
  it.each([0, 60000, 900000])('records saved token value %i without a fabricated duration metric', async tokensSaved => {
    await tracker.trackClearEvent(event({tokensSaved, inputTokens: 1000000})); expect(tracker.getStatistics().avgTokensPerClear).toBe(tokensSaved);
  });
  it('caps a fully persisted clear-event window when one more event arrives', async () => {
    const records=Array.from({length:1000},(_,i)=>({...event({tokensSaved:i}),timestamp:new Date()}));
    await fs.writeFile(path.join(dir,'clear-events.json'),JSON.stringify(records)); tracker=new ContextStatsTracker(dir); await tracker.initialize(); await tracker.trackClearEvent(event({tokensSaved:1000}));
    expect(tracker.getClearEvents()).toHaveLength(1000); expect(tracker.getClearEvents()[0].tokensSaved).toBe(1);
  });
  it('tracks memory operations by their actual operation type', async () => {
    await tracker.trackMemoryOperation(memory()); await tracker.trackMemoryOperation(memory({operation: 'create'})); expect(tracker.getStatistics()).toMatchObject({totalMemoryOperations: 2, memoryOperationsByType: {view: 1, create: 1}});
  });
  it('preserves failed operations as failed evidence', async () => {
    await tracker.trackMemoryOperation(memory({success: false})); expect(tracker.getMemoryOperations()[0].success).toBe(false);
  });
  it('retains agent identity on memory operations', async () => {
    await tracker.trackMemoryOperation(memory()); expect(tracker.getMemoryOperations().filter(op => op.agentId === 'alex-ba')).toHaveLength(1);
  });
  it('persists and reloads the memory operation JSON array', async () => {
    await tracker.trackMemoryOperation(memory()); expect(JSON.parse(await fs.readFile(path.join(dir, 'memory-ops.json'), 'utf8'))).toHaveLength(1);
    const fresh = new ContextStatsTracker(dir); await fresh.initialize(); expect(fresh.getMemoryOperations()[0]).toMatchObject(memory()); expect(fresh.getMemoryOperations()[0].timestamp).toBeInstanceOf(Date);
  });
  it('caps a fully persisted memory-operation window when one more operation arrives', async () => {
    const records=Array.from({length:5000},(_,i)=>({...memory({path:String(i)}),timestamp:new Date()}));
    await fs.writeFile(path.join(dir,'memory-ops.json'),JSON.stringify(records)); tracker=new ContextStatsTracker(dir); await tracker.initialize(); await tracker.trackMemoryOperation(memory({path:'5000'})); expect(tracker.getMemoryOperations()).toHaveLength(5000); expect(tracker.getMemoryOperations()[0].path).toBe('1');
  });
  it('returns null when no session is active', async () => { expect(await tracker.getSessionMetrics()).toBeNull(); expect(await tracker.endSession()).toBeNull(); });
  it('starts a session with the caller agent and tracks token usage', async () => {
    const id=tracker.startSession('maria-qa'); tracker.updateTokenUsage(100,20); tracker.updateTokenUsage(200,30);
    expect(await tracker.getSessionMetrics()).toMatchObject({sessionId:id,agentId:'maria-qa',totalInputTokens:300,totalOutputTokens:50,peakTokens:200});
  });
  it('accumulates actual clear and memory events into the active session', async () => {
    tracker.startSession('maria-qa'); await tracker.trackClearEvent(event()); await tracker.trackMemoryOperation(memory()); expect(await tracker.getSessionMetrics()).toMatchObject({clearEvents:1,tokensSaved:60000,memoryOperations:1});
  });
  it('persists completed sessions as JSONL and clears the active session', async () => {
    const id=tracker.startSession('maria-qa'); tracker.updateTokenUsage(100,20); const completed=await tracker.endSession(); expect(completed?.endTime).toBeInstanceOf(Date); expect(await tracker.getSessionMetrics()).toBeNull();
    const stored=JSON.parse((await fs.readFile(path.join(dir,'sessions.jsonl'),'utf8')).trim()); expect(stored.sessionId).toBe(id); expect(await tracker.getSessionMetrics(id)).toMatchObject({sessionId:id,totalInputTokens:100});
  });
  it('registers hooks and records their actual preserved pattern count', async () => {
    const hook=jest.fn(async()=>3); tracker.registerPreClearHook(hook); await tracker.trackClearEvent(event()); expect(hook).toHaveBeenCalledWith(100000,'maria-qa'); expect(tracker.getClearEvents()[0]).toMatchObject({patternsPreserved:3,preClearHookExecuted:true});
  });
  it('records a failing hook without claiming preserved patterns', async () => {
    tracker.registerPreClearHook(async()=>{throw new Error('fixture failure');}); await tracker.trackClearEvent(event()); expect(tracker.getClearEvents()[0]).toMatchObject({patternsPreserved:0,preClearHookExecuted:true});
  });
  it('unregisters and clears hooks', () => { const id=tracker.registerPreClearHook(async()=>1); tracker.unregisterPreClearHook(id); expect(tracker.getPreClearHookCount()).toBe(0); tracker.registerPreClearHook(async()=>1); tracker.clearPreClearHooks(); expect(tracker.getPreClearHookCount()).toBe(0); });
  it('propagates persistence errors rather than claiming durability', async () => {
    jest.spyOn(require('fs/promises'),'writeFile').mockRejectedValueOnce(new Error('WRITE_FAILED')); await expect(tracker.trackClearEvent(event())).rejects.toThrow('WRITE_FAILED');
  });
  it('generates a report from recorded totals', async () => {
    await tracker.trackClearEvent(event()); await tracker.trackMemoryOperation(memory()); const report=await tracker.generateReport(); expect(report).toContain('Context Management Report'); expect(report).toContain('**Total Clear Events**: 1'); expect(report).toContain('**Total Tokens Saved**: 60,000'); expect(report).toContain('maria-qa');
  });
  it('generates a finite empty report', async () => { const report=await tracker.generateReport(); expect(report).toContain('**Total Clear Events**: 0'); expect(report).not.toMatch(/NaN|Infinity/); });
  it('filters events by actual timestamps', async () => {
    await tracker.trackClearEvent(event()); const timestamp=tracker.getClearEvents()[0].timestamp; expect(tracker.getClearEvents(new Date(timestamp.getTime()+1))).toEqual([]); expect(tracker.getClearEvents(undefined,new Date(timestamp.getTime()-1))).toEqual([]); expect(tracker.getClearEvents(timestamp,timestamp)).toHaveLength(1);
  });
  it('cleanup persists valid arrays for the retained time window', async () => {
    await tracker.trackClearEvent(event()); await tracker.trackMemoryOperation(memory()); await tracker.cleanup(30); expect(JSON.parse(await fs.readFile(path.join(dir,'clear-events.json'),'utf8'))).toHaveLength(1); expect(JSON.parse(await fs.readFile(path.join(dir,'memory-ops.json'),'utf8'))).toHaveLength(1);
  });
});
