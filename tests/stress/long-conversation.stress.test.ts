/**
 * VERSATIL Context Engineering - Stress Test 2: Long Conversation (500k+ Tokens)
 *
 * Tests multi-clear conversations with memory persistence
 *
 * Critical Success Criteria:
 * - Support 500k+ token conversations
 * - <0.5% information loss across clears
 * - Compounding learning (50+ patterns after 500k tokens)
 * - Maintains context integrity through 5+ clear cycles
 *
 * @stress-test HIGH_PRIORITY
 * @phase Phase-2-Week-3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextSentinel } from '../../src/agents/monitoring/context-sentinel.js';
import { getGlobalContextTracker, type ContextClearEvent } from '../../src/memory/context-stats-tracker.js';
import { getAgentMemoryAPI } from '../../src/memory/agent-memory-manager.js';

describe('Stress Test 2: Long Conversation Handling', () => {
  let contextSentinel: ContextSentinel;
  let statsTracker: ReturnType<typeof getGlobalContextTracker>;

  const CLEAR_THRESHOLD = 100_000; // Context clears at 100k tokens
  const TARGET_TOKENS = 500_000; // Test 500k token conversation

  beforeEach(async () => {
    contextSentinel = new ContextSentinel();
    statsTracker = getGlobalContextTracker();
    await statsTracker.initialize();
    contextSentinel.startMonitoring();
  });

  afterEach(() => {
    contextSentinel.stopMonitoring();
  });

  /**
   * Test 2.1: Multi-Clear Conversation
   *
   * Validates context persistence through multiple clears
   */
  test('Maintains context through 5+ clears (500k tokens)', async () => {
    console.log('📊 Test 2.1: Simulating 500k token conversation (5 clear cycles)');

    let totalTokens = 0;
    const clearEvents: ContextClearEvent[] = [];
    const agentWork: Array<{ agent: string; task: string; tokens: number }> = [];

    // Simulate 6-hour conversation (500k tokens)
    let iteration = 0;
    while (totalTokens < TARGET_TOKENS) {
      iteration++;

      // Simulate agent work (10k tokens per iteration)
      const workload = simulateAgentWork(10_000);
      totalTokens += workload.tokens;
      agentWork.push(workload);

      console.log(`  Iteration ${iteration}: ${totalTokens.toLocaleString()} / ${TARGET_TOKENS.toLocaleString()} tokens (${(totalTokens/TARGET_TOKENS*100).toFixed(1)}%)`);

      // Check for clear events every 100k tokens
      if (totalTokens % CLEAR_THRESHOLD === 0 || totalTokens >= TARGET_TOKENS) {
        const events = statsTracker.getClearEvents();
        if (events.length > clearEvents.length) {
          const newEvents = events.slice(clearEvents.length);
          clearEvents.push(...newEvents);

          console.log(`    ✓ Clear event #${clearEvents.length}: Saved ${newEvents[0].tokensSaved.toLocaleString()} tokens`);
        }

        // Run context check
        await contextSentinel.runContextCheck();
      }

      // Small delay to simulate real conversation
      await sleep(50);
    }

    console.log(`\n📊 Conversation Complete:`);
    console.log(`  Total tokens: ${totalTokens.toLocaleString()}`);
    console.log(`  Clear events: ${clearEvents.length}`);
    console.log(`  Agent work items: ${agentWork.length}`);

    // Verify 5+ clears occurred (500k / 100k = 5)
    expect(clearEvents.length).toBeGreaterThanOrEqual(5);

    // Verify patterns persisted across clears
    const storedPatterns = await getAllStoredPatterns();
    console.log(`  Stored patterns: ${storedPatterns.length}`);

    // Should have 50+ cumulative patterns (compounding learning)
    expect(storedPatterns.length).toBeGreaterThan(50);

    // Verify no context loss
    const lossRate = calculateContextLossRate(clearEvents, agentWork);
    console.log(`  Context loss rate: ${(lossRate * 100).toFixed(3)}%`);

    expect(lossRate).toBeLessThan(0.005); // <0.5%

    // Verify token savings
    const totalSaved = clearEvents.reduce((sum, e) => sum + e.tokensSaved, 0);
    console.log(`  Total tokens saved: ${totalSaved.toLocaleString()}`);

    expect(totalSaved).toBeGreaterThan(50_000); // At least 50k saved over 500k conversation
  }, 120000); // 120 second timeout

  /**
   * Test 2.2: Pattern Accumulation
   *
   * Validates compounding learning over long conversations
   */
  test('Accumulates 100+ patterns across 500k tokens', async () => {
    console.log('📊 Test 2.2: Pattern accumulation stress test');

    const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'dana-database'];
    let totalTokens = 0;
    const patternsPerCheckpoint: number[] = [];

    // Simulate work with explicit pattern storage
    while (totalTokens < TARGET_TOKENS) {
      // Each agent does 25k tokens of work
      for (const agentId of agents) {
        const memory = getAgentMemoryAPI(agentId as any);

        // Simulate discovering new pattern
        await memory.storePattern({
          title: `Pattern discovered at ${totalTokens} tokens`,
          category: 'long_conversation_test',
          description: `Pattern from ${agentId} during long conversation`,
          code: `// Pattern code at ${totalTokens} tokens`,
          language: 'typescript',
          successRate: '95%'
        });

        totalTokens += 25_000;

        // Checkpoint every 100k tokens
        if (totalTokens % 100_000 === 0) {
          const currentPatterns = await getAllStoredPatterns();
          patternsPerCheckpoint.push(currentPatterns.length);

          console.log(`  Checkpoint at ${totalTokens.toLocaleString()} tokens: ${currentPatterns.length} patterns stored`);
        }
      }
    }

    // Verify pattern growth
    const finalPatterns = await getAllStoredPatterns();
    console.log(`\n📊 Pattern Accumulation Results:`);
    console.log(`  Final pattern count: ${finalPatterns.length}`);
    console.log(`  Pattern growth: ${patternsPerCheckpoint.join(' → ')}`);

    // Should have 100+ patterns after 500k tokens
    expect(finalPatterns.length).toBeGreaterThan(100);

    // Verify compounding (each checkpoint should have more patterns)
    for (let i = 1; i < patternsPerCheckpoint.length; i++) {
      expect(patternsPerCheckpoint[i]).toBeGreaterThan(patternsPerCheckpoint[i-1]);
    }
  }, 120000);

  /**
   * Test 2.3: Information Retention
   *
   * Validates critical information preserved across clears
   */
  test('Retains critical information across 5 clears', async () => {
    console.log('📊 Test 2.3: Information retention across clears');

    const criticalInfo = [
      { type: 'requirement', content: 'User authentication must support OAuth2' },
      { type: 'architecture', content: 'Use three-tier architecture (DB → API → UI)' },
      { type: 'security', content: 'All passwords must be hashed with bcrypt (12 rounds)' },
      { type: 'performance', content: 'API response time must be <200ms' },
      { type: 'quality', content: 'Test coverage must be ≥80%' }
    ];

    // Store critical information at start
    const alexMemory = getAgentMemoryAPI('alex-ba');
    for (const info of criticalInfo) {
      await alexMemory.storePattern({
        title: info.type,
        category: 'critical_requirement',
        description: info.content,
        code: '',
        language: 'markdown',
        successRate: '100%'
      });
    }

    console.log(`  Stored ${criticalInfo.length} critical information items`);

    // Simulate conversation with 5 clears
    let totalTokens = 0;
    let clearCount = 0;

    while (clearCount < 5) {
      // Simulate 100k tokens to trigger clear
      totalTokens += 100_000;
      simulateConversation(100_000);

      // Trigger context check (will clear at threshold)
      const dashboard = await contextSentinel.runContextCheck();

      // Count clear events
      const events = statsTracker.getClearEvents();
      if (events.length > clearCount) {
        clearCount = events.length;
        console.log(`  Clear #${clearCount} at ${totalTokens.toLocaleString()} tokens`);
      }

      await sleep(100);
    }

    // Verify all critical information still accessible
    const memories = await alexMemory.view('**/critical_requirement*.md');
    console.log(`\n📊 Information Retention:`);
    console.log(`  Critical items preserved: ${memories ? 'All' : 'None'}`);

    expect(memories).toBeTruthy();

    // Verify content matches original
    for (const info of criticalInfo) {
      expect(memories).toContain(info.content);
    }

    console.log(`  ✓ All ${criticalInfo.length} critical items intact after ${clearCount} clears`);
  }, 120000);

  /**
   * Test 2.4: Clear Event Analysis
   *
   * Validates clear event patterns and efficiency
   */
  test('Clear events show consistent efficiency', async () => {
    console.log('📊 Test 2.4: Clear event efficiency analysis');

    // Simulate 500k token conversation
    let totalTokens = 0;
    while (totalTokens < TARGET_TOKENS) {
      simulateConversation(10_000);
      totalTokens += 10_000;

      if (totalTokens % 100_000 === 0) {
        await contextSentinel.runContextCheck();
      }

      await sleep(50);
    }

    // Analyze clear events
    const clearEvents = statsTracker.getClearEvents();
    console.log(`\n📊 Clear Event Analysis:`);
    console.log(`  Total clears: ${clearEvents.length}`);

    // Calculate metrics
    const avgTokensSaved = clearEvents.reduce((sum, e) => sum + e.tokensSaved, 0) / clearEvents.length;
    const avgToolsCleared = clearEvents.reduce((sum, e) => sum + e.toolUsesCleared, 0) / clearEvents.length;

    console.log(`  Average tokens saved: ${avgTokensSaved.toLocaleString()}`);
    console.log(`  Average tools cleared: ${avgToolsCleared.toFixed(1)}`);

    // Verify consistency
    expect(avgTokensSaved).toBeGreaterThan(3_000); // At least 3k per clear
    expect(avgToolsCleared).toBeGreaterThan(5); // At least 5 tools per clear

    // Verify efficiency doesn't degrade over time
    const firstHalfAvg = clearEvents.slice(0, Math.floor(clearEvents.length / 2))
      .reduce((sum, e) => sum + e.tokensSaved, 0) / Math.floor(clearEvents.length / 2);

    const secondHalfAvg = clearEvents.slice(Math.floor(clearEvents.length / 2))
      .reduce((sum, e) => sum + e.tokensSaved, 0) / Math.ceil(clearEvents.length / 2);

    console.log(`  First half avg: ${firstHalfAvg.toLocaleString()} tokens`);
    console.log(`  Second half avg: ${secondHalfAvg.toLocaleString()} tokens`);

    // Second half should not be significantly worse (within 20%)
    expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg * 0.8);
  }, 120000);

  /**
   * Test 2.5: Memory Operations at Scale
   *
   * Validates memory tool performance in long conversations
   */
  test('Handles 500+ memory operations efficiently', async () => {
    console.log('📊 Test 2.5: Memory operations at scale');

    const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'dana-database'];
    let operationCount = 0;
    const operationLatencies: number[] = [];

    // Simulate 500 memory operations across conversation
    for (let i = 0; i < 500; i++) {
      const agentId = agents[i % agents.length];
      const memory = getAgentMemoryAPI(agentId as any);

      // Measure operation latency
      const start = Date.now();

      await memory.storePattern({
        title: `Pattern ${i}`,
        category: 'scale_test',
        description: `Pattern from long conversation iteration ${i}`,
        code: `function pattern${i}() { return ${i}; }`,
        language: 'typescript',
        successRate: '95%'
      });

      const latency = Date.now() - start;
      operationLatencies.push(latency);
      operationCount++;

      if (operationCount % 100 === 0) {
        const avgLatency = operationLatencies.slice(-100).reduce((a, b) => a + b, 0) / 100;
        console.log(`  ${operationCount} operations: ${avgLatency.toFixed(1)}ms avg latency`);
      }

      // Simulate conversation tokens
      if (i % 10 === 0) {
        simulateConversation(10_000);
      }
    }

    // Calculate final metrics
    const avgLatency = operationLatencies.reduce((a, b) => a + b, 0) / operationLatencies.length;
    const p95Latency = operationLatencies.sort((a, b) => a - b)[Math.floor(operationLatencies.length * 0.95)];

    console.log(`\n📊 Memory Operation Performance:`);
    console.log(`  Total operations: ${operationCount}`);
    console.log(`  Average latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  P95 latency: ${p95Latency}ms`);

    // Verify performance targets
    expect(avgLatency).toBeLessThan(100); // <100ms average
    expect(p95Latency).toBeLessThan(250); // <250ms P95
  }, 180000); // 3 minute timeout
});

// Helper Functions

interface AgentWorkload {
  agent: string;
  task: string;
  tokens: number;
}

/**
 * Simulate agent work with token usage
 */
function simulateAgentWork(tokens: number): AgentWorkload {
  const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'dana-database'];
  const tasks = ['testing', 'ui_development', 'api_implementation', 'schema_design'];

  const agent = agents[Math.floor(Math.random() * agents.length)];
  const task = tasks[agents.indexOf(agent)];

  // Track tokens via global tracker
  const tracker = getGlobalContextTracker();
  tracker.updateTokenUsage(tokens, 0);

  return { agent, task, tokens };
}

/**
 * Simulate conversation activity
 */
function simulateConversation(tokens: number): void {
  const tracker = getGlobalContextTracker();
  tracker.updateTokenUsage(tokens, tokens * 0.3); // Input + output tokens
}

/**
 * Get all stored patterns across all agents
 */
async function getAllStoredPatterns(): Promise<string[]> {
  const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'dana-database', 'alex-ba', 'sarah-pm', 'dr-ai-ml'];
  const allPatterns: string[] = [];

  for (const agentId of agents) {
    const memory = getAgentMemoryAPI(agentId as any);
    const patterns = await memory.view('**/*.md');

    if (patterns) {
      // Count patterns in memory files
      const patternCount = patterns.split('\n').filter(l => l.includes('###')).length;
      for (let i = 0; i < patternCount; i++) {
        allPatterns.push(`${agentId}/pattern-${i}`);
      }
    }
  }

  return allPatterns;
}

/**
 * Calculate context loss rate from clear events and work
 */
function calculateContextLossRate(
  clearEvents: ContextClearEvent[],
  agentWork: AgentWorkload[]
): number {
  // Total tokens processed
  const totalTokens = agentWork.reduce((sum, w) => sum + w.tokens, 0);

  // Tokens saved by clears
  const tokensSaved = clearEvents.reduce((sum, e) => sum + e.tokensSaved, 0);

  // Loss rate = (tokens cleared - tokens saved) / total tokens
  // Assuming cleared tokens = tokens at clear threshold
  const tokensCleared = clearEvents.length * 100_000; // 100k per clear
  const tokensLost = Math.max(0, tokensCleared - tokensSaved);

  return tokensLost / totalTokens;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
