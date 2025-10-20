/**
 * VERSATIL Context Engineering - Stress Test 1: Context Overflow Simulation
 *
 * Tests framework resilience at 85%, 95%, and 100% token usage
 *
 * Critical Success Criteria:
 * - Zero context overflows
 * - <0.5% critical pattern loss during emergency clears
 * - Auto-recovery within 5 seconds
 * - Emergency buffer (15k tokens) remains untouched
 *
 * @stress-test HIGH_PRIORITY
 * @phase Phase-2-Week-2
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ContextSentinel } from '../../src/agents/monitoring/context-sentinel.js';
import { ContextBudgetManager } from '../../src/tracking/context-budget-manager.js';
import { getGlobalContextTracker } from '../../src/memory/context-stats-tracker.js';
import { getAgentMemoryAPI } from '../../src/memory/agent-memory-manager.js';

describe('Stress Test 1: Context Overflow Resilience', () => {
  let contextSentinel: ContextSentinel;
  let budgetManager: ContextBudgetManager;
  let statsTracker: ReturnType<typeof getGlobalContextTracker>;

  const TOTAL_CONTEXT = 200_000;
  const EMERGENCY_BUFFER = 15_000;
  const CRITICAL_THRESHOLD = 170_000; // 85%
  const DANGER_THRESHOLD = 185_000; // 92.5%
  const MAX_THRESHOLD = 195_000; // 97.5%

  beforeEach(async () => {
    contextSentinel = new ContextSentinel();
    budgetManager = new ContextBudgetManager();
    statsTracker = getGlobalContextTracker();
    await statsTracker.initialize();

    // Start monitoring
    contextSentinel.startMonitoring();
  });

  afterEach(() => {
    contextSentinel.stopMonitoring();
  });

  /**
   * Test 1.1: 85% Token Usage (Critical Threshold)
   *
   * Validates emergency compaction triggers at 85% usage
   */
  test('Handles 85% token usage gracefully', async () => {
    console.log('📊 Test 1.1: Simulating 85% token usage (170,000 tokens)');

    // Simulate 170k tokens (85% of 200k)
    const tokensBefore = await fillContextTo(CRITICAL_THRESHOLD);
    expect(tokensBefore).toBe(CRITICAL_THRESHOLD);

    // Wait for emergency compaction to trigger
    await sleep(6000); // ContextSentinel checks every 5 seconds

    // Verify emergency compaction occurred
    const dashboard = await contextSentinel.runContextCheck();
    const tokensAfter = dashboard.usage.totalTokens;

    console.log(`  Before: ${tokensBefore.toLocaleString()} tokens (${(tokensBefore/TOTAL_CONTEXT*100).toFixed(1)}%)`);
    console.log(`  After:  ${tokensAfter.toLocaleString()} tokens (${(tokensAfter/TOTAL_CONTEXT*100).toFixed(1)}%)`);
    console.log(`  Reclaimed: ${(tokensBefore - tokensAfter).toLocaleString()} tokens`);

    // Should clear to ~75% (150k tokens)
    expect(tokensAfter).toBeLessThan(150_000);
    expect(tokensAfter).toBeGreaterThan(130_000); // Don't over-clear

    // Verify critical risk detected
    expect(dashboard.risks).toContainEqual(
      expect.objectContaining({
        severity: 'critical',
        type: 'high_usage'
      })
    );

    // Verify no critical pattern loss
    const mariaMemory = getAgentMemoryAPI('maria-qa');
    const patterns = await mariaMemory.view('**/test-patterns.md');
    expect(patterns).toBeTruthy();
    expect(patterns.length).toBeGreaterThan(0);

    // Check stats tracking
    const stats = statsTracker.getStatistics();
    expect(stats.totalClearEvents).toBeGreaterThan(0);
    expect(stats.totalTokensSaved).toBeGreaterThan(10_000); // At least 10k reclaimed
  }, 30000); // 30 second timeout

  /**
   * Test 1.2: 95% Token Usage (Danger Zone)
   *
   * Validates aggressive compaction at 95% usage
   */
  test('Aggressive compaction at 95% token usage', async () => {
    console.log('📊 Test 1.2: Simulating 95% token usage (190,000 tokens)');

    const tokensBefore = await fillContextTo(190_000);

    // Immediate check (don't wait for interval)
    const dashboard = await contextSentinel.runContextCheck();
    const tokensAfter = dashboard.usage.totalTokens;

    console.log(`  Before: ${tokensBefore.toLocaleString()} tokens (${(tokensBefore/TOTAL_CONTEXT*100).toFixed(1)}%)`);
    console.log(`  After:  ${tokensAfter.toLocaleString()} tokens (${(tokensAfter/TOTAL_CONTEXT*100).toFixed(1)}%)`);

    // Should aggressively clear to ~60% (120k tokens)
    expect(tokensAfter).toBeLessThan(130_000);

    // Verify multiple risks detected
    expect(dashboard.risks.length).toBeGreaterThan(0);
    expect(dashboard.risks.filter(r => r.severity === 'critical').length).toBeGreaterThan(0);

    // Verify recommendations provided
    expect(dashboard.recommendations.length).toBeGreaterThan(0);
    expect(dashboard.recommendations).toContain(
      expect.stringContaining('context')
    );
  }, 30000);

  /**
   * Test 1.3: 97.5% Token Usage (Near Overflow)
   *
   * Validates maximum safety with emergency buffer
   */
  test('Prevents 100% overflow with buffer', async () => {
    console.log('📊 Test 1.3: Simulating 97.5% token usage (195,000 tokens)');

    // Attempt to use 195k tokens (97.5%)
    const tokensBefore = await fillContextTo(MAX_THRESHOLD);

    // Force immediate compaction
    const dashboard = await contextSentinel.runContextCheck();
    const tokensAfter = dashboard.usage.totalTokens;

    console.log(`  Before: ${tokensBefore.toLocaleString()} tokens (${(tokensBefore/TOTAL_CONTEXT*100).toFixed(1)}%)`);
    console.log(`  After:  ${tokensAfter.toLocaleString()} tokens (${(tokensAfter/TOTAL_CONTEXT*100).toFixed(1)}%)`);
    console.log(`  Emergency buffer: ${EMERGENCY_BUFFER.toLocaleString()} tokens (preserved)`);

    // Should auto-clear to well below 185k
    expect(tokensAfter).toBeLessThan(DANGER_THRESHOLD);

    // Emergency buffer remains untouched
    const budget = await budgetManager.getBudgetStatus();
    expect(budget.reserved).toBe(EMERGENCY_BUFFER);
    expect(budget.status).not.toBe('critical'); // Should have recovered

    // Verify auto-recovery time
    const clearEvent = statsTracker.getClearEvents()[0];
    expect(clearEvent).toBeTruthy();

    // Recovery should be instant (< 5 seconds)
    const recoveryTime = Date.now() - clearEvent.timestamp.getTime();
    expect(recoveryTime).toBeLessThan(5000);
  }, 30000);

  /**
   * Test 1.4: Zero Context Overflows (Stress)
   *
   * Simulates rapid token accumulation to test overflow prevention
   */
  test('Never exceeds 200k token limit', async () => {
    console.log('📊 Test 1.4: Rapid token accumulation stress test');

    const measurements: number[] = [];

    // Simulate aggressive token growth
    for (let i = 0; i < 20; i++) {
      await fillContextTo((i + 1) * 10_000); // 10k, 20k, 30k, ... 200k

      const dashboard = await contextSentinel.runContextCheck();
      measurements.push(dashboard.usage.totalTokens);

      console.log(`  Iteration ${i+1}: ${dashboard.usage.totalTokens.toLocaleString()} tokens (${dashboard.usage.percentage.toFixed(1)}%)`);

      // Should NEVER exceed 200k
      expect(dashboard.usage.totalTokens).toBeLessThanOrEqual(TOTAL_CONTEXT);

      await sleep(100); // Small delay between iterations
    }

    // Verify automatic compaction occurred
    const maxTokens = Math.max(...measurements);
    console.log(`  Peak usage: ${maxTokens.toLocaleString()} tokens (${(maxTokens/TOTAL_CONTEXT*100).toFixed(1)}%)`);

    // Should have triggered at least 1 compaction
    expect(statsTracker.getStatistics().totalClearEvents).toBeGreaterThan(0);

    // Final token count should be well below limit
    const finalTokens = measurements[measurements.length - 1];
    expect(finalTokens).toBeLessThan(DANGER_THRESHOLD);
  }, 60000); // 60 second timeout for 20 iterations

  /**
   * Test 1.5: Critical Pattern Preservation
   *
   * Validates <0.5% pattern loss during emergency clears
   */
  test('Preserves 99.5%+ critical patterns during clears', async () => {
    console.log('📊 Test 1.5: Critical pattern preservation test');

    // Store 100 critical patterns across agents
    const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'dana-database'];
    const storedPatterns: string[] = [];

    for (let i = 0; i < 100; i++) {
      const agent = agents[i % agents.length];
      const memory = getAgentMemoryAPI(agent as any);

      const pattern = {
        title: `Critical Pattern ${i}`,
        category: 'test',
        description: `Test pattern for overflow stress testing`,
        code: `function testPattern${i}() { return ${i}; }`,
        language: 'typescript',
        successRate: '95%'
      };

      await memory.storePattern(pattern);
      storedPatterns.push(`${agent}/pattern-${i}`);
    }

    console.log(`  Stored ${storedPatterns.length} critical patterns`);

    // Trigger emergency clear at 95% usage
    await fillContextTo(190_000);
    await contextSentinel.runContextCheck();

    // Verify pattern retention
    let preservedCount = 0;
    for (const agent of agents) {
      const memory = getAgentMemoryAPI(agent as any);
      const patterns = await memory.view('**/*.md');

      if (patterns && patterns.length > 0) {
        preservedCount += patterns.split('\n').filter(l => l.includes('Critical Pattern')).length;
      }
    }

    console.log(`  Preserved: ${preservedCount}/${storedPatterns.length} patterns`);

    // Should preserve 99.5%+ patterns (at most 0.5 lost out of 100)
    const lossRate = (storedPatterns.length - preservedCount) / storedPatterns.length;
    expect(lossRate).toBeLessThan(0.005); // <0.5% loss
    expect(preservedCount).toBeGreaterThanOrEqual(99); // At least 99/100 preserved
  }, 60000);

  /**
   * Test 1.6: Recovery Performance
   *
   * Validates <5 second recovery time from critical state
   */
  test('Recovers from critical state in <5 seconds', async () => {
    console.log('📊 Test 1.6: Recovery performance benchmark');

    // Fill to critical threshold
    await fillContextTo(CRITICAL_THRESHOLD);

    // Measure recovery time
    const recoveryStart = Date.now();

    await contextSentinel.runContextCheck();

    const recoveryTime = Date.now() - recoveryStart;
    console.log(`  Recovery time: ${recoveryTime}ms`);

    // Should complete in < 5 seconds
    expect(recoveryTime).toBeLessThan(5000);

    // Verify system is healthy after recovery
    const budget = await budgetManager.getBudgetStatus();
    expect(budget.status).not.toBe('critical');
    expect(budget.usagePercent).toBeLessThan(80);
  }, 30000);
});

// Helper Functions

/**
 * Simulate filling context to specified token count
 */
async function fillContextTo(targetTokens: number): Promise<number> {
  // Simulate context filling by creating large strings
  // In real implementation, would trigger actual tool uses

  const chunkSize = 5000; // 5k tokens per chunk
  const chunks = Math.floor(targetTokens / chunkSize);

  for (let i = 0; i < chunks; i++) {
    // Simulate tool output (e.g., Read result)
    simulateToolOutput('Read', generateLargeString(chunkSize));
  }

  return targetTokens;
}

/**
 * Simulate tool output for context tracking
 */
function simulateToolOutput(tool: string, content: string): void {
  // In real implementation, would integrate with actual context tracking
  // For testing, we'll simulate the effect

  // Estimate tokens (4 chars ≈ 1 token)
  const estimatedTokens = Math.floor(content.length / 4);

  // Track via global tracker
  const tracker = getGlobalContextTracker();
  tracker.updateTokenUsage(estimatedTokens, 0);
}

/**
 * Generate large string of specified token count
 */
function generateLargeString(tokens: number): string {
  // 1 token ≈ 4 characters
  const chars = tokens * 4;
  return 'x'.repeat(chars);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
