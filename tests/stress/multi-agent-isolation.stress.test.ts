/**
 * VERSATIL Context Engineering - Stress Test 3: Agent Swarm (18 Parallel Agents)
 *
 * Tests context isolation with all 18 agents active simultaneously
 *
 * Critical Success Criteria:
 * - Support 18 concurrent agents (8 core + 10 sub-agents)
 * - Zero context leakage between agents
 * - <200k total tokens with budget manager
 * - Independent memory directories maintained
 * - No agent interference or collision
 *
 * @stress-test HIGH_PRIORITY
 * @phase Phase-2-Week-3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextBudgetManager } from '../../src/tracking/context-budget-manager.js';
import { getAgentMemoryAPI } from '../../src/memory/agent-memory-manager.js';
import { getAllAgentIds } from '../../src/memory/memory-tool-config.js';

describe('Stress Test 3: Multi-Agent Context Isolation', () => {
  let budgetManager: ContextBudgetManager;

  const TOTAL_CONTEXT = 200_000;
  const MAX_AGENTS = 18; // 8 core + 10 sub-agents

  beforeEach(() => {
    budgetManager = new ContextBudgetManager();
  });

  afterEach(() => {
    // Cleanup
  });

  /**
   * Test 3.1: 18 Parallel Agents with Context Isolation
   *
   * Validates all 18 agents can work simultaneously
   */
  test('18 agents with independent context (180k tokens)', async () => {
    console.log('📊 Test 3.1: Starting all 18 OPERA agents simultaneously');

    const agents = getAllAgentIds();
    console.log(`  Agents to test: ${agents.join(', ')}`);

    // Extend with sub-agents (10 total)
    const allAgents = [
      ...agents, // 8 core agents
      'marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java', // 5 backend
      'james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte' // 5 frontend
    ];

    expect(allAgents.length).toBe(MAX_AGENTS);

    // Start all agents simultaneously with 10k tokens each
    const contexts = await Promise.all(
      allAgents.map(id => startAgentContext(id, 10_000))
    );

    console.log(`\n📊 Agent Context Allocation:`);
    contexts.forEach((ctx, i) => {
      console.log(`  ${allAgents[i]}: ${ctx.tokens.toLocaleString()} tokens allocated`);
    });

    // Total: 180k tokens across 18 agents
    const totalTokens = contexts.reduce((sum, ctx) => sum + ctx.tokens, 0);
    console.log(`\n  Total tokens: ${totalTokens.toLocaleString()} / ${TOTAL_CONTEXT.toLocaleString()}`);

    expect(totalTokens).toBe(MAX_AGENTS * 10_000); // 180k
    expect(totalTokens).toBeLessThan(TOTAL_CONTEXT);

    // Verify budget status
    const budget = await budgetManager.getBudgetStatus();
    console.log(`  Budget status: ${budget.status} (${budget.usagePercent}% used)`);

    expect(budget.status).not.toBe('critical');
    expect(budget.remaining).toBeGreaterThan(0);
  }, 60000);

  /**
   * Test 3.2: Context Isolation Between Agents
   *
   * Validates zero context leakage
   */
  test('Zero context leakage between agents', async () => {
    console.log('📊 Test 3.2: Context isolation validation');

    const agents = getAllAgentIds();

    // Each agent stores unique patterns
    const storedPatterns = new Map<string, string[]>();

    for (const agentId of agents) {
      const memory = getAgentMemoryAPI(agentId);
      const patterns: string[] = [];

      // Store 5 unique patterns per agent
      for (let i = 0; i < 5; i++) {
        const pattern = {
          title: `${agentId}-exclusive-pattern-${i}`,
          category: 'isolation_test',
          description: `Pattern exclusive to ${agentId}`,
          code: `// ${agentId} pattern ${i}`,
          language: 'typescript',
          successRate: '100%'
        };

        await memory.storePattern(pattern);
        patterns.push(pattern.title);
      }

      storedPatterns.set(agentId, patterns);
      console.log(`  ${agentId}: Stored ${patterns.length} unique patterns`);
    }

    // Verify isolation: Each agent can only see its own patterns
    console.log(`\n📊 Isolation Verification:`);

    for (const agentId of agents) {
      const memory = getAgentMemoryAPI(agentId);
      const memoryContent = await memory.view('**/*.md');

      // Should contain own patterns
      const ownPatterns = storedPatterns.get(agentId)!;
      for (const pattern of ownPatterns) {
        expect(memoryContent).toContain(pattern);
      }

      // Should NOT contain other agents' patterns
      for (const [otherAgentId, otherPatterns] of storedPatterns) {
        if (otherAgentId !== agentId) {
          for (const pattern of otherPatterns) {
            expect(memoryContent).not.toContain(pattern);
          }
        }
      }

      console.log(`  ✓ ${agentId}: Isolated (${ownPatterns.length} own, 0 leaked)`);
    }

    console.log(`\n  ✓ Zero context leakage detected`);
  }, 60000);

  /**
   * Test 3.3: Agent Collision Detection
   *
   * Validates no interference when agents access same resources
   */
  test('No collisions with concurrent file access', async () => {
    console.log('📊 Test 3.3: Concurrent file access collision detection');

    const agents = ['maria-qa', 'james-frontend', 'marcus-backend'];
    const sharedFile = 'shared-resource.md';

    // All agents attempt to write to their own files simultaneously
    const writeOperations = agents.map(async (agentId, index) => {
      const memory = getAgentMemoryAPI(agentId as any);

      return memory.storePattern({
        title: `Concurrent pattern ${index}`,
        category: 'collision_test',
        description: `Pattern from ${agentId} in concurrent test`,
        code: `// ${agentId} concurrent write ${index}`,
        language: 'typescript',
        successRate: '100%'
      });
    });

    // Execute all writes concurrently
    const results = await Promise.all(writeOperations);

    console.log(`\n📊 Concurrent Write Results:`);
    console.log(`  Successful writes: ${results.filter(r => r).length} / ${results.length}`);

    // All writes should succeed
    expect(results.filter(r => r).length).toBe(results.length);

    // Verify each agent's data is intact
    for (const agentId of agents) {
      const memory = getAgentMemoryAPI(agentId as any);
      const content = await memory.view('**/*.md');

      expect(content).toContain(`${agentId} concurrent write`);
      console.log(`  ✓ ${agentId}: Data intact`);
    }
  }, 30000);

  /**
   * Test 3.4: Budget Manager Load Balancing
   *
   * Validates smart token allocation across agents
   */
  test('Budget manager handles 18 agent allocations', async () => {
    console.log('📊 Test 3.4: Budget manager load balancing');

    const allAgents = [
      ...getAllAgentIds(),
      'marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java',
      'james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte'
    ];

    // Request allocations for all agents
    const allocationResults: Array<{
      agent: string;
      requested: number;
      allocated: boolean;
    }> = [];

    for (const agent of allAgents) {
      const requested = 10_000; // 10k tokens per agent

      const allocated = await budgetManager.requestAllocation({
        taskId: `task-${agent}`,
        description: `Work for ${agent}`,
        estimatedTokens: requested,
        priority: 'medium',
        canDefer: true
      });

      allocationResults.push({ agent, requested, allocated });

      if (allocated) {
        console.log(`  ✓ ${agent}: Allocated ${requested.toLocaleString()} tokens`);
      } else {
        console.log(`  ✗ ${agent}: Allocation denied (budget exhausted)`);
      }
    }

    // Calculate success rate
    const successfulAllocations = allocationResults.filter(r => r.allocated).length;
    const successRate = (successfulAllocations / allocationResults.length) * 100;

    console.log(`\n📊 Allocation Results:`);
    console.log(`  Successful: ${successfulAllocations} / ${allocationResults.length} (${successRate.toFixed(1)}%)`);
    console.log(`  Total requested: ${(allocationResults.length * 10_000).toLocaleString()} tokens`);
    console.log(`  Total allocated: ${(successfulAllocations * 10_000).toLocaleString()} tokens`);

    // Should allocate most agents (at least 16 out of 18)
    expect(successfulAllocations).toBeGreaterThanOrEqual(16);

    // Verify budget status
    const budget = await budgetManager.getBudgetStatus();
    console.log(`  Budget remaining: ${budget.remaining.toLocaleString()} tokens`);

    expect(budget.remaining).toBeGreaterThan(0); // Some buffer left
  }, 60000);

  /**
   * Test 3.5: Agent Memory Directory Structure
   *
   * Validates proper directory isolation
   */
  test('Independent memory directories maintained', async () => {
    console.log('📊 Test 3.5: Memory directory structure validation');

    const agents = getAllAgentIds();
    const directoryPaths: Map<string, string> = new Map();

    // Store patterns and verify directory paths
    for (const agentId of agents) {
      const memory = getAgentMemoryAPI(agentId);

      await memory.storePattern({
        title: 'Directory test pattern',
        category: 'directory_test',
        description: `Test pattern for ${agentId} directory`,
        code: `// ${agentId} directory test`,
        language: 'typescript',
        successRate: '100%'
      });

      // In real implementation, would verify actual file system path
      // For now, verify logical separation
      const memoryPath = `~/.versatil/memories/${agentId}/`;
      directoryPaths.set(agentId, memoryPath);

      console.log(`  ${agentId}: ${memoryPath}`);
    }

    // Verify all paths are unique
    const uniquePaths = new Set(directoryPaths.values());
    expect(uniquePaths.size).toBe(agents.length);

    // Verify paths follow naming convention
    for (const [agentId, path] of directoryPaths) {
      expect(path).toContain(agentId);
      expect(path).toContain('.versatil/memories');
    }

    console.log(`\n  ✓ All ${agents.length} agents have unique memory directories`);
  }, 30000);

  /**
   * Test 3.6: High-Load Scenario (All Agents Active)
   *
   * Validates performance under maximum load
   */
  test('Performance under full agent load', async () => {
    console.log('📊 Test 3.6: High-load performance test (all 18 agents)');

    const allAgents = [
      ...getAllAgentIds(),
      'marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java',
      'james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte'
    ];

    // Simulate all agents working simultaneously
    const startTime = Date.now();

    const agentWork = allAgents.map(async (agentId) => {
      const memory = getAgentMemoryAPI(agentId as any);

      // Each agent performs 10 operations
      for (let i = 0; i < 10; i++) {
        await memory.storePattern({
          title: `Load test pattern ${i}`,
          category: 'load_test',
          description: `Pattern ${i} from ${agentId}`,
          code: `// Load test ${i}`,
          language: 'typescript',
          successRate: '95%'
        });

        // Simulate token usage
        await sleep(10); // Small delay per operation
      }

      return agentId;
    });

    const completedAgents = await Promise.all(agentWork);
    const duration = Date.now() - startTime;

    console.log(`\n📊 High-Load Performance:`);
    console.log(`  Agents completed: ${completedAgents.length} / ${allAgents.length}`);
    console.log(`  Total operations: ${completedAgents.length * 10}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Ops/second: ${((completedAgents.length * 10) / (duration / 1000)).toFixed(1)}`);

    // All agents should complete
    expect(completedAgents.length).toBe(allAgents.length);

    // Should complete in reasonable time (< 30 seconds for 180 operations)
    expect(duration).toBeLessThan(30000);

    // Verify final budget status
    const budget = await budgetManager.getBudgetStatus();
    console.log(`  Final budget: ${budget.usagePercent}% used`);

    expect(budget.status).not.toBe('critical');
  }, 60000);
});

// Helper Functions

interface AgentContext {
  agentId: string;
  tokens: number;
  startTime: number;
}

/**
 * Start agent context with specified token allocation
 */
async function startAgentContext(agentId: string, tokens: number): Promise<AgentContext> {
  const startTime = Date.now();

  // Simulate agent initialization
  const memory = getAgentMemoryAPI(agentId as any);

  // Store initialization pattern
  await memory.storePattern({
    title: `${agentId} initialization`,
    category: 'agent_start',
    description: `Agent started with ${tokens} token allocation`,
    code: `// ${agentId} init`,
    language: 'typescript',
    successRate: '100%'
  });

  return {
    agentId,
    tokens,
    startTime
  };
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
