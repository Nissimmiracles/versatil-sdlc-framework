/** Offline file-event dispatch and activation-report integration; no provider execution. */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { watch } from 'fs';
vi.mock('fs', async importOriginal => ({ ...await importOriginal<typeof import('fs')>(), watch: vi.fn() }));
import { ProactiveAgentOrchestrator } from '../../src/orchestration/proactive-agent-orchestrator.js';
import { ActivationTracker } from '../../src/agents/activation-tracker.js';
vi.mock('../../src/rag/cag-prompt-cache.js', () => ({ cagPromptCache: { query: vi.fn().mockRejectedValue(new Error('Offline fixture')) } }));
let orchestrator: ProactiveAgentOrchestrator;
let tracker: ActivationTracker;
let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'activation-report-'));
  orchestrator = new ProactiveAgentOrchestrator({ enabled: true, autoActivation: true, backgroundMonitoring: false });
  tracker = new ActivationTracker(root);
  // Await constructor initialization without invoking a second timer-producing initialization.
  await vi.waitFor(() => expect((tracker as any).autosaveInterval).not.toBeNull());
});
afterEach(async () => {
  orchestrator.stopMonitoring(); orchestrator.removeAllListeners();
  await tracker.shutdown();
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});
describe('File change dispatch', () => {
  it.each([['Login.test.tsx', ['maria-qa', 'james-frontend']], ['Button.tsx', ['james-frontend']], ['users.api.ts', ['marcus-backend']]])('dispatches %s to matching agents', async (filename, expected) => {
    const file = join(root, filename);
    const activate = vi.spyOn(orchestrator as any, 'activateAgent').mockResolvedValue({ message: 'Offline dispatch fixture' });
    const completed = vi.fn(); orchestrator.on('agents-completed', completed);
    await (orchestrator as any).handleFileChange('change', file);
    expect(activate.mock.calls.map(call => call[0])).toEqual(expected);
    expect(activate.mock.calls.every(call => call[1] === file)).toBe(true);
    expect(completed).toHaveBeenCalledWith(expect.objectContaining({ agentIds: expected, filePath: file, results: expected.map(() => ({ message: 'Offline dispatch fixture' })) }));
  });
  it.each([['rename', 'Button.tsx'], ['change', 'notes.txt'], ['change', 'migration.sql']])('does not dispatch %s for %s', async (event, file) => {
    const activate = vi.spyOn(orchestrator as any, 'activateAgent');
    await (orchestrator as any).handleFileChange(event, join(root, file));
    expect(activate).not.toHaveBeenCalled();
  });
  it('emits failure rather than a successful completion when a provider rejects', async () => {
    const error = new Error('Offline provider failure');
    vi.spyOn(orchestrator as any, 'activateAgent').mockRejectedValue(error);
    const failed = vi.fn(), completed = vi.fn();
    orchestrator.on('agents-failed', failed); orchestrator.on('agents-completed', completed);
    await (orchestrator as any).handleFileChange('change', join(root, 'Button.tsx'));
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ error, agentIds: ['james-frontend'] }));
    expect(completed).not.toHaveBeenCalled();
  });
  it('registers, dispatches, filters, and closes the supported watcher callback contract', async () => {
    // Callback fixture: native fs.watch event semantics vary by host. This is not OS watcher proof.
    const close = vi.fn();
    vi.mocked(watch).mockReturnValue({ close } as any);
    orchestrator = new ProactiveAgentOrchestrator({ enabled: true, autoActivation: true, backgroundMonitoring: true });
    const file = join(root, 'Watched.tsx');
    const activate = vi.spyOn(orchestrator as any, 'activateAgent').mockResolvedValue({ message: 'Offline watcher fixture' });
    const completed = vi.fn(); orchestrator.on('agents-completed', completed);
    orchestrator.startMonitoring(root);
    expect(watch).toHaveBeenCalledWith(root, { recursive: true }, expect.any(Function));
    const callback = vi.mocked(watch).mock.lastCall![2] as Function;
    callback('change', 'node_modules/Watched.tsx');
    callback('rename', 'Watched.tsx');
    callback('change', null);
    expect(activate).not.toHaveBeenCalled();
    callback('change', 'Watched.tsx');
    await vi.waitFor(() => expect(completed).toHaveBeenCalledWith(expect.objectContaining({ filePath: file, agentIds: ['james-frontend'] })));
    expect(activate).toHaveBeenCalledWith('james-frontend', file);
    orchestrator.stopMonitoring(root);
    expect(close).toHaveBeenCalledOnce();
    expect((orchestrator as any).watchers.size).toBe(0);
  });
  it('passes manual file context to an injected agent and clears active status', async () => {
    const response = { message: 'Offline manual fixture' };
    const activate = vi.fn().mockResolvedValue(response);
    (orchestrator as any).agents.set('fixture-agent', { activate });
    vi.spyOn(orchestrator as any, 'enhanceAgentForTask').mockResolvedValue(undefined);
    const file = join(root, 'Manual.ts');
    expect(await orchestrator.manualActivation('fixture-agent', file)).toBe(response);
    expect(activate).toHaveBeenCalledWith(expect.objectContaining({ filePath: file, language: 'typescript', metadata: expect.objectContaining({ proactiveMode: true }) }));
    expect(orchestrator.getActiveAgentsStatus().size).toBe(0);
  });
  it('rejects unknown manual agent IDs', async () => {
    await expect(orchestrator.manualActivation('missing-fixture', join(root, 'Manual.ts'))).rejects.toThrow('Agent not found: missing-fixture');
  });
  it('does not create watchers merely by construction or when monitoring is disabled', () => {
    orchestrator.startMonitoring(root);
    expect((orchestrator as any).watchers.size).toBe(0);
  });
});
describe('Reports computed from explicit fixture events', () => {
  it('reports an empty corpus without claiming successful activations', () => {
    expect(tracker.generateReport()).toMatchObject({ totalActivations: 0, overallAccuracy: 0, overallLatency: 0 });
  });
  it('computes accuracy and slow/failing agents from both passing and failing evidence', () => {
    for (const [agentId, accuracy, latency] of [['maria-qa', 'correct', 100], ['maria-qa', 'incorrect', 300], ['james-frontend', 'correct', 2500]] as const) {
      tracker.trackActivation({ agentId, trigger: { type: 'file_pattern', filePath: join(root, 'fixture.ts') }, accuracy, latency, confidence: 90 });
    }
    const report = tracker.generateReport();
    expect(report.totalActivations).toBe(3);
    expect(report.agentMetrics.get('maria-qa')).toMatchObject({ accuracy: 50, averageLatency: 200, incorrectActivations: 1 });
    expect(report.agentMetrics.get('james-frontend')).toMatchObject({ accuracy: 100, averageLatency: 2500 });
    expect(report.overallAccuracy).toBe(75);
    expect(report.failedAgents).toEqual(['maria-qa']);
    expect(report.slowAgents).toEqual(['james-frontend']);
  });
});
