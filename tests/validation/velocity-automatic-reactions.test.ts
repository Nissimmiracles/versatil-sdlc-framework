/** Local workflow guards and automatic phase dispatch, with explicit command fixtures. */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { VelocityWorkflowOrchestrator } from '../../src/workflows/velocity-workflow-orchestrator';
import { VelocityWorkflowStateMachine } from '../../src/workflows/velocity-workflow-state-machine';
import { VelocityPhaseTransitions } from '../../src/workflows/velocity-phase-transitions';

const plan = () => ({ todos: [{ id: 'task', description: 'Implement fixture' }], estimates: { total: 1, byPhase: {} }, templates: [], historicalContext: [] });
const config = (autoTransition: boolean) => ({ workflowId: 'fixture', target: 'Local fixture', autoTransition, requireApprovalPerPhase: false, continuousMonitoring: false, qualityGateLevel: 'normal' as const, maxExecutionHours: 1, codifyToRAG: false });
let root: string;
let orchestrator: VelocityWorkflowOrchestrator;
let guards: VelocityPhaseTransitions;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'velocity-reactions-'));
  vi.spyOn(VelocityWorkflowStateMachine.prototype as any, 'ensureStateStorage').mockResolvedValue(undefined);
  orchestrator = new VelocityWorkflowOrchestrator();
  (orchestrator as any).stateMachine.stateStoragePath = root;
  guards = new VelocityPhaseTransitions();
});
afterEach(async () => { orchestrator.removeAllListeners(); vi.restoreAllMocks(); await rm(root, { recursive: true, force: true }); });

describe('Automatic phase dispatch', () => {
  it('retains the current empty plan stub and blocks automatic assessment', async () => {
    const assess = vi.spyOn(orchestrator, 'executeAssess');
    const id = await orchestrator.startWorkflow(config(true));
    const context = orchestrator.getWorkflowContext(id)!;
    expect(context.plan).toEqual({ todos: [], estimates: { total: 0, byPhase: {} }, templates: [], historicalContext: [] });
    expect((await guards.canTransitionFromPlanToAssess(context)).allowed).toBe(false);
    expect(assess).not.toHaveBeenCalled();
    expect((await orchestrator.getWorkflowState(id))?.currentPhase).toBe('Plan');
  });
  it('dispatches assessment only when a supplied command fixture passes real guards', async () => {
    vi.spyOn(orchestrator as any, 'invokePlanCommand').mockResolvedValue(plan());
    const phases: string[] = [];
    orchestrator.on('phaseCompleted', ({ result }) => phases.push(result.phase));
    const id = await orchestrator.startWorkflow(config(true));
    expect(phases).toEqual(['Plan', 'Assess', 'Delegate']);
    // The current delegate command has no assignments, so Work remains blocked.
    expect((await orchestrator.getWorkflowState(id))?.currentPhase).toBe('Delegate');
    expect(orchestrator.getWorkflowContext(id)?.assessment?.health).toBe(100);
    expect(orchestrator.getWorkflowContext(id)?.delegation?.assignments.size).toBe(0);
  });
  it('does not dispatch assessment with automatic transitions disabled', async () => {
    const invoke = vi.spyOn(orchestrator as any, 'invokePlanCommand').mockResolvedValue(plan());
    const assess = vi.spyOn(orchestrator, 'executeAssess');
    const id = await orchestrator.startWorkflow(config(false));
    const result = await orchestrator.executePlan(id, orchestrator.getWorkflowContext(id)!);
    expect(invoke).toHaveBeenCalledWith('Local fixture');
    expect(result.success).toBe(true);
    expect(result.outputs).toEqual(plan());
    expect(assess).not.toHaveBeenCalled();
  });
  it('returns command failures and never assesses a failed plan', async () => {
    vi.spyOn(orchestrator as any, 'invokePlanCommand').mockRejectedValue(new Error('Fixture command failure'));
    const assess = vi.spyOn(orchestrator, 'executeAssess');
    const id = await orchestrator.startWorkflow(config(false));
    const result = await orchestrator.executePlan(id, orchestrator.getWorkflowContext(id)!);
    expect(result).toMatchObject({ success: false, errors: ['Fixture command failure'] });
    expect(orchestrator.getWorkflowContext(id)?.plan).toBeUndefined();
    expect(assess).not.toHaveBeenCalled();
  });
});
describe('Real transition preconditions', () => {
  it.each([
    [undefined, 'Plan phase must complete'],
    [{ ...plan(), todos: [] }, 'at least one todo'],
    [{ ...plan(), estimates: { total: 0 } }, 'effort estimates'],
  ])('blocks incomplete plan evidence %#', async (input, reason) => {
    const result = await guards.canTransitionFromPlanToAssess({ target: 'fixture', plan: input } as any);
    expect(result.allowed).toBe(false);
    expect(result.blockers?.join(' ')).toContain(reason);
  });
  it('permits a nonempty estimated plan and names the next phase', async () => {
    expect(await guards.transitionPlanToAssess({ target: 'fixture', plan: plan() } as any)).toMatchObject({ allowed: true, success: true, nextPhase: 'Assess' });
  });
  it.each([
    [undefined, 'must complete'],
    [{ health: 100, readiness: 'blocked', blockers: [], warnings: [] }, 'shows blockers'],
    [{ health: 69, readiness: 'ready', blockers: [], warnings: [] }, 'below 70%'],
    [{ health: 100, readiness: 'ready', blockers: ['Missing credential'], warnings: [] }, 'found blockers'],
  ])('blocks unsafe assessment evidence %#', async (assessment, reason) => {
    const result = await guards.canTransitionFromAssessToDelegate({ target: 'fixture', assessment } as any);
    expect(result.allowed).toBe(false); expect(result.blockers?.join(' ')).toContain(reason);
  });
  it('allows the health boundary with a caution warning', async () => {
    const result = await guards.canTransitionFromAssessToDelegate({ target: 'fixture', assessment: { health: 70, readiness: 'ready', blockers: [], warnings: ['Review fixture'] } } as any);
    expect(result.allowed).toBe(true); expect(result.warnings).toEqual(['Framework health at 70% (below 90%)', 'Review fixture']);
  });
  it('allows a healthy assessment without caution warnings', async () => {
    expect(await guards.canTransitionFromAssessToDelegate({ target: 'fixture', assessment: { health: 90, readiness: 'ready', blockers: [], warnings: [] } } as any)).toMatchObject({ allowed: true, warnings: undefined });
  });
  it.each([undefined, { assignments: new Map(), dependencies: new Map() }])('blocks unassigned delegation %#', async delegation => {
    expect((await guards.canTransitionFromDelegateToWork({ target: 'fixture', plan: plan(), delegation } as any)).allowed).toBe(false);
  });
  it('allows assignments only when todos exist', async () => {
    const delegation = { assignments: new Map([['marcus-backend', ['task']]]), dependencies: new Map() };
    expect((await guards.canTransitionFromDelegateToWork({ target: 'fixture', plan: plan(), delegation } as any)).allowed).toBe(true);
    expect((await guards.canTransitionFromDelegateToWork({ target: 'fixture', plan: { ...plan(), todos: [] }, delegation } as any)).allowed).toBe(false);
  });
  it.each([undefined, { completedTodos: [], testsAdded: 0, filesModified: [] }])('blocks codification without completed work %#', async work => {
    expect((await guards.canTransitionFromWorkToCodify({ target: 'fixture', work } as any)).allowed).toBe(false);
  });
  it('warns when completed todos have no concrete artifacts', async () => {
    const result = await guards.canTransitionFromWorkToCodify({ target: 'fixture', work: { completedTodos: ['task'], testsAdded: 0, filesModified: [] } } as any);
    expect(result.allowed).toBe(true); expect(result.warnings).toContain('No concrete work produced - nothing to codify');
  });
  it('accepts concrete completed work without warnings', async () => {
    const result = await guards.canTransitionFromWorkToCodify({ target: 'fixture', plan: plan(), work: { completedTodos: ['task'], testsAdded: 1, filesModified: ['fixture.ts'] } } as any);
    expect(result).toMatchObject({ allowed: true, warnings: undefined });
  });
});
