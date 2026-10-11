/** Real orchestrator routing with SDK/storage/subsystem doubles. No model or speed benchmark. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const doubles = vi.hoisted(() => ({ sdk: vi.fn(), search: vi.fn(), addTask: vi.fn(), parallel: vi.fn() }));
vi.mock('../../src/agents/sdk/versatil-query.js', () => ({ executeWithSDK: doubles.sdk }));
vi.mock('../../src/rag/enhanced-vector-memory-store.js', () => ({ EnhancedVectorMemoryStore: class { searchMemories = doubles.search; } }));
vi.mock('../../src/orchestration/parallel-task-manager.js', async () => {
  const events = await vi.importActual<any>('node:events');
  const actual = await vi.importActual<any>('../../src/orchestration/parallel-task-manager.js');
  return { ...actual, ParallelTaskManager: class extends events.EventEmitter { addTask = doubles.addTask; executeParallel = doubles.parallel; } };
});
vi.mock('../../src/testing/automated-stress-test-generator.js', async () => ({ AutomatedStressTestGenerator: (await vi.importActual<any>('node:events')).EventEmitter, TargetType: { API_ENDPOINT: 'api_endpoint' } }));
vi.mock('../../src/audit/daily-audit-system.js', async () => ({ DailyAuditSystem: (await vi.importActual<any>('node:events')).EventEmitter }));
vi.mock('../../src/agents/enhanced-opera-config.js', async () => ({ EnhancedOPERAConfigManager: (await vi.importActual<any>('node:events')).EventEmitter }));
vi.mock('../../src/environment/environment-manager.js', () => ({ EnvironmentManager: class {} }));
import { VersatilOrchestrator } from '../../src/core/versatil-orchestrator.js';

const tasks = [
  { id: 'test-1', name: 'Test authentication', type: 'testing', priority: 2, sdlcPhase: 'testing', estimatedDuration: 100, requiredResources: [], dependencies: [], collisionRisk: 'low', metadata: {} },
  { id: 'doc-1', name: 'Document API', type: 'documentation', priority: 4, sdlcPhase: 'implementation', estimatedDuration: 100, requiredResources: [], dependencies: [], collisionRisk: 'low', metadata: {} },
] as any;
beforeEach(() => {
  vi.resetAllMocks(); doubles.search.mockResolvedValue([]); doubles.sdk.mockResolvedValue(new Map());
  doubles.addTask.mockImplementation(async (task: any) => task.id); doubles.parallel.mockResolvedValue(new Map());
});
describe('SDK parallel orchestration contract', () => {
  it('passes tasks, relevant context and deduplicated tools, then maps SDK results', async () => {
    doubles.search.mockResolvedValue([{ similarity: 0.9, content: 'authorized fixture context' }]);
    doubles.sdk.mockResolvedValue(new Map([['test-1', { taskId: 'test-1', status: 'completed', result: { summary: 'fixture' }, executionTime: 12 }], ['doc-1', { taskId: 'doc-1', status: 'failed', error: 'fixture failure', executionTime: 3 }]]));
    const orchestrator = new VersatilOrchestrator(); const completed = vi.fn(); orchestrator.on('rule1:execution_completed', completed);
    const results = await orchestrator.executeRule1(tasks);
    expect(doubles.search).toHaveBeenCalledWith('Test authentication testing Document API documentation', 10);
    const call = doubles.sdk.mock.calls[0][0];
    expect(call.tasks).toBe(tasks); expect(call.ragContext).toContain('authorized fixture context');
    expect(call.mcpTools).toEqual(['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Chrome', 'Playwright', 'WebFetch']);
    expect(call.vectorStore).toBeDefined();
    expect(results.get('test-1')).toMatchObject({ taskId: 'test-1', status: 'completed', result: { summary: 'fixture' }, duration: 12, executionMethod: 'Claude SDK' });
    expect(results.get('doc-1')).toMatchObject({ status: 'failed', error: 'fixture failure', duration: 3 });
    expect(completed).toHaveBeenCalledWith({ taskCount: 2, successCount: 1, executionMethod: 'Claude SDK' });
    expect(doubles.parallel).not.toHaveBeenCalled();
  });
  it('continues with explicit empty context when RAG lookup rejects', async () => {
    doubles.search.mockRejectedValue(new Error('fixture index unavailable'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try { await new VersatilOrchestrator().executeRule1(tasks); expect(doubles.sdk.mock.calls[0][0].ragContext).toBe(''); }
    finally { warn.mockRestore(); }
  });
  it('propagates SDK rejection and emits failure without silently retrying legacy', async () => {
    const failure = new Error('fixture provider failure'); doubles.sdk.mockRejectedValue(failure);
    const orchestrator = new VersatilOrchestrator(); const failed = vi.fn(); orchestrator.on('rule1:execution_failed', failed);
    await expect(orchestrator.executeRule1(tasks)).rejects.toBe(failure);
    expect(failed).toHaveBeenCalledWith({ error: failure, taskCount: 2, executionMethod: 'Claude SDK' });
    expect(doubles.parallel).not.toHaveBeenCalled();
  });
  it('uses the explicit legacy branch and returns its results unchanged', async () => {
    const results = new Map([['test-1', { status: 'completed' }]]); doubles.parallel.mockResolvedValue(results);
    const orchestrator = new VersatilOrchestrator(); orchestrator.setSDKParallelization(false);
    expect(await orchestrator.executeRule1(tasks)).toBe(results);
    expect(doubles.addTask.mock.calls.map(call => call[0])).toEqual(tasks);
    expect(doubles.parallel).toHaveBeenCalledWith(['test-1', 'doc-1']); expect(doubles.sdk).not.toHaveBeenCalled(); expect(doubles.search).not.toHaveBeenCalled();
  });
  it('refuses a disabled rule before calling either executor', async () => {
    const orchestrator = new VersatilOrchestrator(); await orchestrator.disableRule(1);
    await expect(orchestrator.executeRule1(tasks)).rejects.toThrow('not enabled');
    expect(doubles.sdk).not.toHaveBeenCalled(); expect(doubles.parallel).not.toHaveBeenCalled();
  });
});
