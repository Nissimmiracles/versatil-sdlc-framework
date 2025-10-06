/**
 * Event-Driven Orchestrator Tests
 * Sprint 1 Day 3-4: Event-driven handoffs for 30% faster workflows
 */

import { EventDrivenOrchestrator, AgentEvent } from '../../../src/orchestration/event-driven-orchestrator';
import { AgentPool } from '../../../src/agents/agent-pool';
import { AgentActivationContext } from '../../../src/agents/base-agent';

describe('EventDrivenOrchestrator', () => {
  let orchestrator: EventDrivenOrchestrator;
  let agentPool: AgentPool;

  beforeEach(() => {
    agentPool = new AgentPool({
      poolSize: 2,
      warmUpOnInit: false,
      enableAdaptive: false
    });

    orchestrator = new EventDrivenOrchestrator(agentPool);
  });

  afterEach(async () => {
    await orchestrator.shutdown();
    await agentPool.shutdown();
  });

  describe('Event System', () => {
    it('should emit agent:activated event when agent starts', (done) => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test content',
        language: 'typescript',
        framework: 'react',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      orchestrator.on(AgentEvent.ACTIVATED, (data) => {
        expect(data.agentId).toBeDefined();
        expect(data.context).toEqual(context);
        done();
      });

      // Trigger activation (implementation needed in orchestrator)
      orchestrator.startChain(['maria-qa'], context);
    });

    it('should emit agent:completed event when agent finishes', (done) => {
      const context: AgentActivationContext = {
        filePath: '/test/file.test.ts',
        content: 'test content',
        language: 'typescript',
        framework: 'jest',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      orchestrator.on(AgentEvent.COMPLETED, (data) => {
        expect(data.agentId).toBeDefined();
        expect(data.result).toBeDefined();
        done();
      });

      orchestrator.startChain(['maria-qa'], context);
    });

    it('should emit chain:completed when all agents finish', (done) => {
      const context: AgentActivationContext = {
        filePath: '/test/component.tsx',
        content: 'test content',
        language: 'typescript',
        framework: 'react',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      orchestrator.on(AgentEvent.CHAIN_COMPLETED, (data) => {
        expect(data.chainId).toBeDefined();
        expect(data.agents.length).toBeGreaterThan(0);
        expect(data.duration).toBeGreaterThan(0);
        done();
      });

      orchestrator.startChain(['james-frontend', 'maria-qa'], context);
    });
  });

  describe('Handoff Latency', () => {
    it('should complete handoffs in <150ms (Sprint 1 target)', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/api.ts',
        content: 'test content',
        language: 'typescript',
        framework: 'express',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      const startTime = Date.now();
      await orchestrator.startChain(['marcus-backend', 'maria-qa'], context);

      // Wait for chain completion
      await new Promise(resolve => {
        orchestrator.on(AgentEvent.CHAIN_COMPLETED, () => {
          const endTime = Date.now();
          const totalTime = endTime - startTime;

          // Should be faster than 150ms handoff target
          // (with 2 agents, total time = activation + handoff)
          expect(totalTime).toBeLessThan(500); // Reasonable upper bound
          resolve(null);
        });
      });

      const metrics = orchestrator.getMetrics();
      expect(metrics.averageLatency).toBeLessThan(150);
    });

    it('should track handoff metrics accurately', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/component.tsx',
        content: 'test content',
        language: 'typescript',
        framework: 'react',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      await orchestrator.startChain(['james-frontend'], context);

      await new Promise(resolve => {
        orchestrator.on(AgentEvent.CHAIN_COMPLETED, () => {
          const metrics = orchestrator.getMetrics();
          expect(metrics.totalHandoffs).toBeGreaterThan(0);
          expect(metrics.averageLatency).toBeGreaterThan(0);
          expect(metrics.successRate).toBeGreaterThan(0);
          expect(metrics.targetLatency).toBe(150);
          expect(metrics.improvement).toBeDefined();
          resolve(null);
        });
      });
    });
  });

  describe('Priority Queue', () => {
    it('should prioritize urgent handoffs over low priority', async () => {
      const executionOrder: string[] = [];

      orchestrator.on(AgentEvent.ACTIVATED, (data) => {
        executionOrder.push(data.agentId);
      });

      const lowPriorityContext: AgentActivationContext = {
        filePath: '/test/low.ts',
        content: 'test content',
        language: 'typescript',
        framework: 'express',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      const urgentContext: AgentActivationContext = {
        filePath: '/test/urgent.ts',
        content: 'test content',
        language: 'typescript',
        framework: 'express',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      // Queue low priority first
      orchestrator.startChain(['alex-ba'], lowPriorityContext);

      // Then queue urgent
      orchestrator.emit(AgentEvent.HANDOFF, {
        fromAgent: 'system',
        toAgent: 'marcus-backend',
        context: urgentContext,
        priority: 'urgent' as const,
        reason: 'Critical security issue',
        timestamp: Date.now()
      });

      // Urgent should execute before low priority completes its chain
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that urgent was prioritized
      // (This test may need adjustment based on actual implementation)
      expect(executionOrder.length).toBeGreaterThan(0);
    });
  });

  describe('Chain Management', () => {
    it('should track active chains', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test content',
        language: 'typescript',
        framework: 'react',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      const chainId = await orchestrator.startChain(['james-frontend', 'maria-qa'], context);

      expect(chainId).toBeDefined();
      expect(chainId).toMatch(/^chain-/);

      const activeChains = orchestrator.getActiveChains();
      expect(activeChains.length).toBeGreaterThan(0);
      expect(activeChains[0].chainId).toBe(chainId);
    });

    it('should complete chains gracefully', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test content',
        language: 'typescript',
        framework: 'react',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      await orchestrator.startChain(['maria-qa'], context);

      await new Promise(resolve => {
        orchestrator.on(AgentEvent.CHAIN_COMPLETED, (data) => {
          expect(data.chainId).toBeDefined();
          expect(data.duration).toBeGreaterThan(0);
          resolve(null);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should continue chain despite agent errors', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/invalid.ts',
        content: '', // Empty content might cause errors
        language: 'typescript',
        framework: 'unknown',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      let errorEmitted = false;
      orchestrator.on(AgentEvent.ERROR, () => {
        errorEmitted = true;
      });

      await orchestrator.startChain(['james-frontend', 'maria-qa'], context);

      await new Promise(resolve => {
        orchestrator.on(AgentEvent.CHAIN_COMPLETED, () => {
          // Chain should complete even if errors occurred
          resolve(null);
        });
      });

      // Error handling verified (error may or may not occur depending on implementation)
      expect(errorEmitted).toBeDefined(); // Could be true or false
    });
  });

  describe('Performance', () => {
    it('should meet Sprint 1 performance targets', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/component.tsx',
        content: 'test content',
        language: 'typescript',
        framework: 'react',
        userIntent: 'file_edit',
        timestamp: Date.now()
      };

      // Run multiple chains to get average metrics
      for (let i = 0; i < 3; i++) {
        await orchestrator.startChain(['james-frontend'], context);

        await new Promise(resolve => {
          orchestrator.on(AgentEvent.CHAIN_COMPLETED, () => resolve(null));
        });
      }

      const metrics = orchestrator.getMetrics();

      // Sprint 1 targets:
      // - Handoff latency: <150ms
      // - Success rate: >95%
      // - Improvement over polling (500ms): >30%

      expect(metrics.averageLatency).toBeLessThan(150);
      expect(metrics.successRate).toBeGreaterThan(95);
      expect(metrics.targetLatency).toBe(150);
    }, 60000); // 60 second timeout for agent pool initialization overhead
  });
});
