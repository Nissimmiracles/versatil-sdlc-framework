/**
 * VELOCITY Automatic Reactions - Validation Tests
 *
 * Validates all claims made in VELOCITY_AUTOMATIC_REACTIONS.md:
 * - Phase auto-transitions work correctly
 * - Agent auto-activation triggers properly
 * - Proactive monitoring functions as documented
 * - Timing/performance metrics are accurate
 *
 * Guardian-approved test suite for verifying automatic reactions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VelocityWorkflowOrchestrator } from '../../src/workflows/velocity-workflow-orchestrator';
import { VelocityPhaseTransitions } from '../../src/workflows/velocity-phase-transitions';
import { ProactiveAgentOrchestrator } from '../../src/orchestration/proactive-agent-orchestrator';
import { ProactiveDaemon } from '../../src/daemon/proactive-daemon';
import { MCPHealthMonitor } from '../../src/mcp/mcp-health-monitor';

describe('VELOCITY Automatic Reactions - Validation Suite', () => {

  // ============================================================================
  // PHASE 1: PLAN - Automatic Reactions
  // ============================================================================
  describe('Phase 1: PLAN Automatic Reactions', () => {
    let orchestrator: VelocityWorkflowOrchestrator;
    let workflowId: string;

    beforeEach(async () => {
      orchestrator = new VelocityWorkflowOrchestrator();
      workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-workflow-1',
        target: 'Add user authentication',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });
    });

    afterEach(async () => {
      await orchestrator.cleanup();
    });

    it('[CLAIM] should automatically generate plan with todos', async () => {
      // CLAIM: "Auto-detect project tech stack, generate todos with effort estimates"

      const context = orchestrator.getWorkflowContext(workflowId);
      const planResult = await orchestrator.executePlan(workflowId, context);

      expect(planResult.success).toBe(true);
      expect(context.plan).toBeDefined();
      expect(context.plan?.todos).toBeDefined();
      expect(context.plan?.todos.length).toBeGreaterThan(0);
      expect(context.plan?.estimates).toBeDefined();
      expect(context.plan?.estimates.total).toBeGreaterThan(0);
    });

    it('[CLAIM] should complete Plan phase in <3 seconds', async () => {
      // CLAIM: "Plan Generation (0-3 seconds)"

      const context = orchestrator.getWorkflowContext(workflowId);
      const startTime = Date.now();

      await orchestrator.executePlan(workflowId, context);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // 3 seconds
    });

    it('[CLAIM] should automatically load RAG context', async () => {
      // CLAIM: "Auto-retrieves similar past plans, loads relevant code patterns"

      const context = orchestrator.getWorkflowContext(workflowId);
      await orchestrator.executePlan(workflowId, context);

      expect(context.plan?.historicalContext).toBeDefined();
      expect(Array.isArray(context.plan?.historicalContext)).toBe(true);
    });

    it('[CLAIM] should auto-transition to Assess when config.autoTransition = true', async () => {
      // CLAIM: "IF VALID: Auto-transition to Assess"

      const context = orchestrator.getWorkflowContext(workflowId);
      await orchestrator.executePlan(workflowId, context);

      // Wait for auto-transition
      await new Promise(resolve => setTimeout(resolve, 600));

      const state = await orchestrator.getWorkflowState(workflowId);
      expect(state?.currentPhase).toBe('Assess');
    });

    it('[CLAIM] should NOT auto-transition when config.autoTransition = false', async () => {
      // Create workflow with autoTransition disabled
      const manualWorkflowId = await orchestrator.startWorkflow({
        workflowId: 'test-workflow-manual',
        target: 'Test feature',
        autoTransition: false,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(manualWorkflowId);
      await orchestrator.executePlan(manualWorkflowId, context);

      await new Promise(resolve => setTimeout(resolve, 600));

      const state = await orchestrator.getWorkflowState(manualWorkflowId);
      expect(state?.currentPhase).toBe('Plan'); // Should stay in Plan
    });

    it('[CLAIM] should validate plan completeness before transition', async () => {
      // CLAIM: "Validates plan completeness: todos.length > 0, estimates.total > 0"

      const transitions = new VelocityPhaseTransitions();

      // Valid plan
      const validContext = {
        target: 'Test',
        plan: {
          todos: [{ id: '1', title: 'Task 1' }],
          estimates: { total: 2, byPhase: {} },
          templates: [],
          historicalContext: []
        }
      };

      const validResult = await transitions.canTransitionFromPlanToAssess(validContext);
      expect(validResult.allowed).toBe(true);

      // Invalid plan (no todos)
      const invalidContext = {
        target: 'Test',
        plan: {
          todos: [],
          estimates: { total: 0, byPhase: {} },
          templates: [],
          historicalContext: []
        }
      };

      const invalidResult = await transitions.canTransitionFromPlanToAssess(invalidContext);
      expect(invalidResult.allowed).toBe(false);
    });
  });

  // ============================================================================
  // PHASE 2: ASSESS - Automatic Reactions
  // ============================================================================
  describe('Phase 2: ASSESS Automatic Reactions', () => {
    let orchestrator: VelocityWorkflowOrchestrator;
    let workflowId: string;

    beforeEach(async () => {
      orchestrator = new VelocityWorkflowOrchestrator();
      workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-workflow-assess',
        target: 'Test assessment',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });
    });

    afterEach(async () => {
      await orchestrator.cleanup();
    });

    it('[CLAIM] should perform framework health check in 1-2 seconds', async () => {
      // CLAIM: "Framework Health Check (1-2 seconds)"

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [{ id: '1', title: 'Test' }],
        estimates: { total: 1, byPhase: {} },
        templates: [],
        historicalContext: []
      };

      const startTime = Date.now();
      await orchestrator.executeAssess(workflowId, context);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('[CLAIM] should calculate health score 0-100%', async () => {
      // CLAIM: "Calculates health score (0-100%)"

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [{ id: '1', title: 'Test' }],
        estimates: { total: 1, byPhase: {} },
        templates: [],
        historicalContext: []
      };

      await orchestrator.executeAssess(workflowId, context);

      expect(context.assessment).toBeDefined();
      expect(context.assessment?.health).toBeGreaterThanOrEqual(0);
      expect(context.assessment?.health).toBeLessThanOrEqual(100);
    });

    it('[CLAIM] should determine readiness: ready/caution/blocked', async () => {
      // CLAIM: "Determines readiness level: ready, caution, blocked"

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [{ id: '1', title: 'Test' }],
        estimates: { total: 1, byPhase: {} },
        templates: [],
        historicalContext: []
      };

      await orchestrator.executeAssess(workflowId, context);

      expect(context.assessment).toBeDefined();
      expect(['ready', 'caution', 'blocked']).toContain(context.assessment?.readiness);
    });

    it('[CLAIM] should auto-transition to Delegate if health ≥70% and no blockers', async () => {
      // CLAIM: "IF readiness = ready OR caution: Automatically transition to Delegate"

      const transitions = new VelocityPhaseTransitions();

      const goodHealthContext = {
        target: 'Test',
        plan: {
          todos: [{ id: '1', title: 'Test' }],
          estimates: { total: 1, byPhase: {} },
          templates: [],
          historicalContext: []
        },
        assessment: {
          health: 85,
          readiness: 'ready' as const,
          blockers: [],
          warnings: []
        }
      };

      const result = await transitions.canTransitionFromAssessToDelegate(goodHealthContext);
      expect(result.allowed).toBe(true);
    });

    it('[CLAIM] should BLOCK transition if health <70%', async () => {
      // CLAIM: "Framework health below 70% - fix issues before delegating"

      const transitions = new VelocityPhaseTransitions();

      const lowHealthContext = {
        target: 'Test',
        plan: {
          todos: [{ id: '1', title: 'Test' }],
          estimates: { total: 1, byPhase: {} },
          templates: [],
          historicalContext: []
        },
        assessment: {
          health: 65, // Below 70%
          readiness: 'blocked' as const,
          blockers: ['Health too low'],
          warnings: []
        }
      };

      const result = await transitions.canTransitionFromAssessToDelegate(lowHealthContext);
      expect(result.allowed).toBe(false);
      expect(result.blockers).toBeDefined();
      expect(result.blockers!.length).toBeGreaterThan(0);
    });

    it('[CLAIM] should BLOCK transition if critical blockers exist', async () => {
      // CLAIM: "IF readiness = blocked: STOP, display blockers"

      const transitions = new VelocityPhaseTransitions();

      const blockedContext = {
        target: 'Test',
        plan: {
          todos: [{ id: '1', title: 'Test' }],
          estimates: { total: 1, byPhase: {} },
          templates: [],
          historicalContext: []
        },
        assessment: {
          health: 90,
          readiness: 'blocked' as const,
          blockers: ['MCP server unreachable', 'Missing configuration'],
          warnings: []
        }
      };

      const result = await transitions.canTransitionFromAssessToDelegate(blockedContext);
      expect(result.allowed).toBe(false);
    });
  });

  // ============================================================================
  // PHASE 3: DELEGATE - Automatic Reactions
  // ============================================================================
  describe('Phase 3: DELEGATE Automatic Reactions', () => {
    let orchestrator: VelocityWorkflowOrchestrator;

    beforeEach(() => {
      orchestrator = new VelocityWorkflowOrchestrator();
    });

    afterEach(async () => {
      await orchestrator.cleanup();
    });

    it('[CLAIM] should complete delegation in 1-3 seconds', async () => {
      // CLAIM: "Smart Agent Assignment (1-3 seconds)"

      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-delegate',
        target: 'Test delegation',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [
          { id: '1', title: 'Create UI component', files: ['src/App.tsx'] },
          { id: '2', title: 'Create API endpoint', files: ['src/api/users.ts'] }
        ],
        estimates: { total: 4, byPhase: {} },
        templates: [],
        historicalContext: []
      };
      context.assessment = {
        health: 90,
        readiness: 'ready',
        blockers: [],
        warnings: []
      };

      const startTime = Date.now();
      await orchestrator.executeDelegate(workflowId, context);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000); // 3 seconds
    });

    it('[CLAIM] should assign agents based on file patterns', async () => {
      // CLAIM: "*.tsx → James-Frontend, *.api.ts → Marcus-Backend"

      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-assignment',
        target: 'Test agent assignment',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [
          { id: '1', title: 'Frontend task', files: ['src/components/Button.tsx'] },
          { id: '2', title: 'Backend task', files: ['src/api/auth.ts'] },
          { id: '3', title: 'Test task', files: ['tests/auth.test.ts'] }
        ],
        estimates: { total: 6, byPhase: {} },
        templates: [],
        historicalContext: []
      };
      context.assessment = {
        health: 90,
        readiness: 'ready',
        blockers: [],
        warnings: []
      };

      await orchestrator.executeDelegate(workflowId, context);

      expect(context.delegation).toBeDefined();
      expect(context.delegation?.assignments.size).toBeGreaterThan(0);

      // Verify agents assigned based on file patterns
      const assignments = Array.from(context.delegation?.assignments.entries() || []);
      const agentIds = assignments.map(([agentId, _]) => agentId);

      expect(agentIds).toContain('james-frontend'); // For .tsx file
      expect(agentIds).toContain('marcus-backend');  // For .api.ts file
      expect(agentIds).toContain('maria-qa');        // For .test.ts file
    });

    it('[CLAIM] should create parallel execution groups', async () => {
      // CLAIM: "Groups independent tasks: Group 1: [Frontend + Backend] (parallel)"

      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-parallel',
        target: 'Test parallel groups',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [
          { id: '1', title: 'Frontend', files: ['src/App.tsx'], dependencies: [] },
          { id: '2', title: 'Backend', files: ['src/api/users.ts'], dependencies: [] },
          { id: '3', title: 'Tests', files: ['tests/users.test.ts'], dependencies: ['1', '2'] }
        ],
        estimates: { total: 6, byPhase: {} },
        templates: [],
        historicalContext: []
      };
      context.assessment = {
        health: 90,
        readiness: 'ready',
        blockers: [],
        warnings: []
      };

      await orchestrator.executeDelegate(workflowId, context);

      expect(context.delegation).toBeDefined();
      expect(context.delegation?.parallelGroups).toBeDefined();
      expect(context.delegation?.parallelGroups.length).toBeGreaterThan(0);

      // First group should have frontend + backend (no dependencies)
      const firstGroup = context.delegation?.parallelGroups[0] || [];
      expect(firstGroup.length).toBeGreaterThanOrEqual(2);
    });

    it('[CLAIM] should auto-transition to Work when delegation complete', async () => {
      // CLAIM: "IF all tasks assigned: Auto-proceed to Work"

      const transitions = new VelocityPhaseTransitions();

      const completeContext = {
        target: 'Test',
        plan: {
          todos: [{ id: '1', title: 'Test', files: ['test.ts'] }],
          estimates: { total: 1, byPhase: {} },
          templates: [],
          historicalContext: []
        },
        assessment: {
          health: 90,
          readiness: 'ready' as const,
          blockers: [],
          warnings: []
        },
        delegation: {
          assignments: new Map([['maria-qa', ['1']]]),
          parallelGroups: [['1']],
          dependencies: new Map()
        }
      };

      const result = await transitions.canTransitionFromDelegateToWork(completeContext);
      expect(result.allowed).toBe(true);
    });
  });

  // ============================================================================
  // PHASE 4: WORK - Automatic Reactions (Agent Auto-Activation)
  // ============================================================================
  describe('Phase 4: WORK Automatic Reactions', () => {
    let proactiveOrchestrator: ProactiveAgentOrchestrator;
    let daemon: ProactiveDaemon;

    beforeEach(async () => {
      proactiveOrchestrator = new ProactiveAgentOrchestrator({
        enabled: true,
        autoActivation: true,
        backgroundMonitoring: true,
        inlineSuggestions: true,
        statuslineUpdates: true,
        slashCommandsFallback: true
      });

      daemon = new ProactiveDaemon(process.cwd());
    });

    afterEach(async () => {
      await daemon.stop();
    });

    it('[CLAIM] should activate Maria-QA on test file save', async () => {
      // CLAIM: "SAVE: tests/Button.test.tsx → Maria-QA activates (2s)"

      const activationSpy = vi.fn();
      proactiveOrchestrator.on('agent:activated', activationSpy);

      const testFilePath = 'tests/Button.test.tsx';
      await proactiveOrchestrator.handleFileChange(testFilePath, 'save');

      expect(activationSpy).toHaveBeenCalled();

      const activationEvent = activationSpy.mock.calls[0][0];
      expect(activationEvent.agentId).toBe('maria-qa');
    });

    it('[CLAIM] should activate James-Frontend on .tsx file save', async () => {
      // CLAIM: "SAVE: src/components/Button.tsx → James-Frontend activates"

      const activationSpy = vi.fn();
      proactiveOrchestrator.on('agent:activated', activationSpy);

      const componentPath = 'src/components/Button.tsx';
      await proactiveOrchestrator.handleFileChange(componentPath, 'save');

      expect(activationSpy).toHaveBeenCalled();

      const activationEvent = activationSpy.mock.calls[0][0];
      expect(activationEvent.agentId).toBe('james-frontend');
    });

    it('[CLAIM] should activate Marcus-Backend on API file save', async () => {
      // CLAIM: "SAVE: src/api/auth.ts → Marcus-Backend activates"

      const activationSpy = vi.fn();
      proactiveOrchestrator.on('agent:activated', activationSpy);

      const apiPath = 'src/api/auth.ts';
      await proactiveOrchestrator.handleFileChange(apiPath, 'save');

      expect(activationSpy).toHaveBeenCalled();

      const activationEvent = activationSpy.mock.calls[0][0];
      expect(activationEvent.agentId).toBe('marcus-backend');
    });

    it('[CLAIM] should activate Dana-Database on .sql file save', async () => {
      // CLAIM: "SAVE: prisma/schema.prisma → Dana-Database activates"

      const activationSpy = vi.fn();
      proactiveOrchestrator.on('agent:activated', activationSpy);

      const schemaPath = 'prisma/schema.prisma';
      await proactiveOrchestrator.handleFileChange(schemaPath, 'save');

      expect(activationSpy).toHaveBeenCalled();

      const activationEvent = activationSpy.mock.calls[0][0];
      expect(activationEvent.agentId).toBe('dana-database');
    });

    it('[CLAIM] should detect file changes in <100ms', async () => {
      // CLAIM: "File watching: <100ms detection"

      await daemon.start();

      const detectionSpy = vi.fn();
      daemon.on('file:changed', detectionSpy);

      const testFile = 'test-file.ts';
      const startTime = Date.now();

      // Simulate file change
      await daemon['handleFileChange'](testFile, 'change');

      const detectionTime = Date.now() - startTime;

      expect(detectionSpy).toHaveBeenCalled();
      expect(detectionTime).toBeLessThan(100); // <100ms
    });

    it('[CLAIM] should complete agent activation in <150ms', async () => {
      // CLAIM: "File save → Agent activation: <150ms"

      const startTime = Date.now();

      await proactiveOrchestrator.activateAgent('maria-qa', {
        trigger: 'file-save',
        filePath: 'test.test.ts',
        agentId: 'maria-qa',
        timestamp: Date.now()
      });

      const activationTime = Date.now() - startTime;

      expect(activationTime).toBeLessThan(150); // <150ms
    });
  });

  // ============================================================================
  // PHASE 5: CODIFY - Automatic Reactions
  // ============================================================================
  describe('Phase 5: CODIFY Automatic Reactions', () => {
    let orchestrator: VelocityWorkflowOrchestrator;

    beforeEach(() => {
      orchestrator = new VelocityWorkflowOrchestrator();
    });

    afterEach(async () => {
      await orchestrator.cleanup();
    });

    it('[CLAIM] should complete learning extraction in 2-5 seconds', async () => {
      // CLAIM: "Learning Extraction (2-5 seconds)"

      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-codify',
        target: 'Test codification',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [{ id: '1', title: 'Test task' }],
        estimates: { total: 2, byPhase: {} },
        templates: [],
        historicalContext: []
      };
      context.work = {
        completedTodos: ['1'],
        actualDuration: 1.5,
        testsAdded: 10,
        filesModified: ['src/test.ts']
      };

      const startTime = Date.now();
      await orchestrator.executeCodify(workflowId, context);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('[CLAIM] should automatically store patterns to RAG', async () => {
      // CLAIM: "Stores patterns to vector memory automatically"

      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-rag-storage',
        target: 'Test RAG storage',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [{ id: '1', title: 'Test task' }],
        estimates: { total: 2, byPhase: {} },
        templates: [],
        historicalContext: []
      };
      context.work = {
        completedTodos: ['1'],
        actualDuration: 1.5,
        testsAdded: 10,
        filesModified: ['src/test.ts']
      };

      await orchestrator.executeCodify(workflowId, context);

      expect(context.learnings).toBeDefined();
      expect(context.learnings?.ragStored).toBe(true);
      expect(context.learnings?.patterns).toBeDefined();
      expect(context.learnings?.patterns.length).toBeGreaterThan(0);
    });

    it('[CLAIM] should calculate effort accuracy metrics', async () => {
      // CLAIM: "Calculates accuracy percentage per task type"

      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-accuracy',
        target: 'Test accuracy calculation',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [{ id: '1', title: 'Test task' }],
        estimates: { total: 2, byPhase: {} },
        templates: [],
        historicalContext: []
      };
      context.work = {
        completedTodos: ['1'],
        actualDuration: 1.5, // 25% under estimate
        testsAdded: 10,
        filesModified: ['src/test.ts']
      };

      await orchestrator.executeCodify(workflowId, context);

      expect(context.learnings).toBeDefined();
      expect(context.learnings?.effortAccuracy).toBeDefined();
      expect(context.learnings?.effortAccuracy).toBeGreaterThan(0);
      expect(context.learnings?.effortAccuracy).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // MCP HEALTH MONITORING - Continuous Automatic Reactions
  // ============================================================================
  describe('MCP Health Monitoring - Automatic Reactions', () => {
    let healthMonitor: MCPHealthMonitor;

    beforeEach(() => {
      healthMonitor = new MCPHealthMonitor({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000,
        backoffMultiplier: 2
      });
    });

    afterEach(() => {
      healthMonitor.stopMonitoring();
    });

    it('[CLAIM] should monitor all 11 MCPs automatically', () => {
      // CLAIM: "Checks all 11 MCP servers"

      healthMonitor.startMonitoring(60000);

      const allHealth = healthMonitor.getAllHealthStatus();
      expect(allHealth.size).toBe(11);

      const mcpIds = Array.from(allHealth.keys());
      expect(mcpIds).toContain('chrome_mcp');
      expect(mcpIds).toContain('playwright_mcp');
      expect(mcpIds).toContain('github_mcp');
      expect(mcpIds).toContain('versatil_mcp');
    });

    it('[CLAIM] should achieve 95% reliability target', async () => {
      // CLAIM: "95% reliability target"

      healthMonitor.startMonitoring(1000);

      // Simulate 100 health checks
      for (let i = 0; i < 100; i++) {
        await healthMonitor.executeMCPWithRetry('chrome_mcp', async () => ({
          success: Math.random() > 0.05, // 95% success rate
          data: 'ok',
          latency: 50
        }));
      }

      const health = healthMonitor.getHealthStatus('chrome_mcp');
      expect(health?.successRate).toBeGreaterThanOrEqual(95);
    });

    it('[CLAIM] should circuit break after 5 consecutive failures', async () => {
      // CLAIM: "Circuit breaker on 5 consecutive failures"

      const mcpId = 'test_mcp';

      // Trigger 5 consecutive failures
      for (let i = 0; i < 5; i++) {
        await healthMonitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Failed');
        });
      }

      const health = healthMonitor.getHealthStatus(mcpId);
      expect(health?.circuitOpen).toBe(true);
    });

    it('[CLAIM] should retry with exponential backoff', async () => {
      // CLAIM: "Auto-retry with exponential backoff (1s, 2s, 4s)"

      const timestamps: number[] = [];
      let attemptCount = 0;

      await healthMonitor.executeMCPWithRetry('test_mcp', async () => {
        timestamps.push(Date.now());
        attemptCount++;
        if (attemptCount < 4) {
          throw new Error('Temporary failure');
        }
        return { success: true, data: 'ok', latency: 50 };
      });

      expect(attemptCount).toBe(4); // Initial + 3 retries

      // Verify exponential backoff (approximately)
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];

        expect(delay2).toBeGreaterThan(delay1); // Exponential increase
      }
    });
  });

  // ============================================================================
  // PERFORMANCE METRICS - Validation
  // ============================================================================
  describe('Performance Metrics - Validation', () => {
    it('[CLAIM] should achieve <500ms phase transitions', async () => {
      // CLAIM: "Auto-transition speed: <500ms between phases"

      const orchestrator = new VelocityWorkflowOrchestrator();
      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-transition-speed',
        target: 'Test transition speed',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      context.plan = {
        todos: [{ id: '1', title: 'Test' }],
        estimates: { total: 1, byPhase: {} },
        templates: [],
        historicalContext: []
      };

      await orchestrator.executePlan(workflowId, context);

      const startTransition = Date.now();

      // Wait for auto-transition
      await new Promise(resolve => setTimeout(resolve, 600));

      const state = await orchestrator.getWorkflowState(workflowId);
      const transitionTime = Date.now() - startTransition;

      expect(state?.currentPhase).toBe('Assess');
      expect(transitionTime).toBeLessThan(500); // <500ms
    });

    it('[CLAIM] should use <1% CPU for background monitoring', async () => {
      // CLAIM: "Proactive Daemon CPU: <1% (idle)"

      const daemon = new ProactiveDaemon(process.cwd());
      await daemon.start();

      const initialCpuUsage = process.cpuUsage();

      // Let daemon run for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalCpuUsage = process.cpuUsage(initialCpuUsage);
      const cpuPercent = (finalCpuUsage.user + finalCpuUsage.system) / 1000000; // Convert to seconds

      await daemon.stop();

      expect(cpuPercent).toBeLessThan(0.01); // <1%
    });
  });
});
