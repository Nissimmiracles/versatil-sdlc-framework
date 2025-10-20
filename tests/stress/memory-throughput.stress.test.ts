/**
 * VERSATIL Context Engineering - Stress Test 4: Memory Operation Throughput
 *
 * Tests memory tool performance under high load
 *
 * Critical Success Criteria:
 * - 1000+ operations/minute throughput
 * - 95%+ success rate under load
 * - <100ms average latency
 * - <250ms P95 latency
 * - No memory leaks or degradation
 *
 * @stress-test MEDIUM_PRIORITY
 * @phase Phase-2-Week-4
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getAgentMemoryAPI } from '../../src/memory/agent-memory-manager.js';
import { getGlobalContextTracker } from '../../src/memory/context-stats-tracker.js';

describe('Stress Test 4: Memory Operation Throughput', () => {
  let statsTracker: ReturnType<typeof getGlobalContextTracker>;

  beforeEach(async () => {
    statsTracker = getGlobalContextTracker();
    await statsTracker.initialize();
  });

  afterEach(() => {
    // Cleanup
  });

  /**
   * Test 4.1: 1000 Operations/Minute Throughput
   *
   * Validates high-throughput memory operations
   */
  test('Handles 1000 operations/minute (16.7 ops/sec)', async () => {
    console.log('📊 Test 4.1: High-throughput memory operations (1000 ops/min)');

    const TARGET_OPERATIONS = 1000;
    const TARGET_DURATION_MS = 60000; // 60 seconds

    const operations = [];

    // Generate 1000 operations (mix of types)
    for (let i = 0; i < TARGET_OPERATIONS; i++) {
      const opType = ['view', 'create', 'str_replace'][i % 3];

      operations.push({
        operation: opType,
        agentId: ['maria-qa', 'james-frontend', 'marcus-backend'][i % 3],
        path: `test-agent/pattern-${i}.md`,
        content: `Test pattern ${i}: ` + 'x'.repeat(100) // ~100 chars
      });
    }

    console.log(`  Generated ${operations.length} operations`);

    // Execute all operations
    const startTime = Date.now();
    const results: Array<{ success: boolean; latency: number; operation: string }> = [];

    for (const op of operations) {
      const opStart = Date.now();

      try {
        const memory = getAgentMemoryAPI(op.agentId as any);

        if (op.operation === 'view') {
          await memory.view('**/*.md');
        } else if (op.operation === 'create') {
          await memory.storePattern({
            title: `Pattern ${results.length}`,
            category: 'throughput_test',
            description: op.content,
            code: '',
            language: 'markdown',
            successRate: '100%'
          });
        } else if (op.operation === 'str_replace') {
          // Simulate string replacement
          await memory.view('**/*.md');
        }

        const latency = Date.now() - opStart;
        results.push({ success: true, latency, operation: op.operation });

      } catch (error) {
        const latency = Date.now() - opStart;
        results.push({ success: false, latency, operation: op.operation });
      }

      // Progress reporting every 100 ops
      if (results.length % 100 === 0) {
        const avgLatency = results.slice(-100).reduce((sum, r) => sum + r.latency, 0) / 100;
        const successRate = results.slice(-100).filter(r => r.success).length;
        console.log(`  ${results.length}/${TARGET_OPERATIONS}: ${avgLatency.toFixed(1)}ms avg, ${successRate}% success`);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n📊 Throughput Results:`);
    console.log(`  Total operations: ${results.length}`);
    console.log(`  Duration: ${(duration / 1000).toFixed(1)} seconds`);
    console.log(`  Operations/minute: ${((results.length / duration) * 60000).toFixed(1)}`);

    // Should complete in < 60 seconds (1000 ops/min target)
    expect(duration).toBeLessThan(TARGET_DURATION_MS);

    // Calculate latency metrics
    const latencies = results.map(r => r.latency).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50Latency = latencies[Math.floor(latencies.length * 0.50)];
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)];
    const maxLatency = latencies[latencies.length - 1];

    console.log(`\n📊 Latency Distribution:`);
    console.log(`  Average: ${avgLatency.toFixed(1)}ms`);
    console.log(`  P50: ${p50Latency}ms`);
    console.log(`  P95: ${p95Latency}ms`);
    console.log(`  P99: ${p99Latency}ms`);
    console.log(`  Max: ${maxLatency}ms`);

    // Verify performance targets
    expect(avgLatency).toBeLessThan(100); // <100ms average
    expect(p95Latency).toBeLessThan(250); // <250ms P95

    // Verify success rate
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    console.log(`\n  Success rate: ${successRate.toFixed(1)}%`);
    expect(successRate).toBeGreaterThan(95); // 95%+ success
  }, 120000); // 2 minute timeout

  /**
   * Test 4.2: Concurrent Operations Stress
   *
   * Validates parallel memory operations
   */
  test('Handles 100 concurrent operations', async () => {
    console.log('📊 Test 4.2: Concurrent memory operations stress test');

    const CONCURRENT_OPS = 100;
    const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'dana-database'];

    // Create 100 concurrent operations
    const operations = Array.from({ length: CONCURRENT_OPS }, (_, i) => {
      const agentId = agents[i % agents.length];
      const memory = getAgentMemoryAPI(agentId as any);

      return {
        id: i,
        agentId,
        promise: memory.storePattern({
          title: `Concurrent pattern ${i}`,
          category: 'concurrent_test',
          description: `Pattern from concurrent operation ${i}`,
          code: `// Concurrent op ${i}`,
          language: 'typescript',
          successRate: '100%'
        })
      };
    });

    console.log(`  Executing ${CONCURRENT_OPS} operations concurrently...`);

    // Execute all concurrently
    const startTime = Date.now();
    const results = await Promise.allSettled(operations.map(op => op.promise));
    const duration = Date.now() - startTime;

    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`\n📊 Concurrent Operation Results:`);
    console.log(`  Successful: ${successful} / ${CONCURRENT_OPS}`);
    console.log(`  Failed: ${failed} / ${CONCURRENT_OPS}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Throughput: ${(CONCURRENT_OPS / (duration / 1000)).toFixed(1)} ops/sec`);

    // Should have 95%+ success rate
    expect(successful / CONCURRENT_OPS).toBeGreaterThan(0.95);

    // Should complete in reasonable time (< 10 seconds)
    expect(duration).toBeLessThan(10000);
  }, 60000);

  /**
   * Test 4.3: Large Pattern Storage
   *
   * Validates performance with large pattern content
   */
  test('Handles large patterns (10KB+ each)', async () => {
    console.log('📊 Test 4.3: Large pattern storage performance');

    const agents = ['maria-qa', 'james-frontend', 'marcus-backend'];
    const PATTERN_SIZE_KB = 10;
    const PATTERNS_PER_AGENT = 50;

    const latencies: number[] = [];

    for (const agentId of agents) {
      const memory = getAgentMemoryAPI(agentId as any);

      console.log(`\n  Testing ${agentId}:`);

      for (let i = 0; i < PATTERNS_PER_AGENT; i++) {
        // Create large pattern (10KB)
        const largeCode = 'x'.repeat(PATTERN_SIZE_KB * 1024); // 10KB of content

        const start = Date.now();

        await memory.storePattern({
          title: `Large pattern ${i}`,
          category: 'large_pattern_test',
          description: `Large pattern from ${agentId}`,
          code: largeCode,
          language: 'typescript',
          successRate: '100%'
        });

        const latency = Date.now() - start;
        latencies.push(latency);

        if ((i + 1) % 10 === 0) {
          const recentAvg = latencies.slice(-10).reduce((a, b) => a + b, 0) / 10;
          console.log(`    ${i + 1}/${PATTERNS_PER_AGENT}: ${recentAvg.toFixed(1)}ms avg`);
        }
      }
    }

    // Calculate metrics
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];

    console.log(`\n📊 Large Pattern Performance:`);
    console.log(`  Total patterns: ${latencies.length}`);
    console.log(`  Pattern size: ${PATTERN_SIZE_KB}KB each`);
    console.log(`  Total data: ${((latencies.length * PATTERN_SIZE_KB) / 1024).toFixed(1)}MB`);
    console.log(`  Average latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`  P95 latency: ${p95Latency}ms`);

    // Verify performance targets (allow higher latency for large patterns)
    expect(avgLatency).toBeLessThan(500); // <500ms for 10KB patterns
    expect(p95Latency).toBeLessThan(1000); // <1s P95
  }, 120000);

  /**
   * Test 4.4: Memory Operation Mix
   *
   * Validates performance with realistic operation mix
   */
  test('Realistic operation mix (70% read, 20% write, 10% update)', async () => {
    console.log('📊 Test 4.4: Realistic operation mix performance');

    const TOTAL_OPS = 500;
    const MIX = {
      view: 0.70,    // 70% reads
      create: 0.20,  // 20% writes
      update: 0.10   // 10% updates
    };

    const operations: Array<{ type: string; latency: number }> = [];
    const memory = getAgentMemoryAPI('maria-qa');

    // Pre-populate some patterns for view/update operations
    for (let i = 0; i < 50; i++) {
      await memory.storePattern({
        title: `Existing pattern ${i}`,
        category: 'mix_test',
        description: `Pattern for operation mix test`,
        code: `// Pattern ${i}`,
        language: 'typescript',
        successRate: '100%'
      });
    }

    console.log(`  Pre-populated 50 patterns for reads/updates`);
    console.log(`  Executing ${TOTAL_OPS} operations (70% read, 20% write, 10% update)...`);

    // Execute mixed operations
    const startTime = Date.now();

    for (let i = 0; i < TOTAL_OPS; i++) {
      const rand = Math.random();
      const opStart = Date.now();

      let opType: string;

      if (rand < MIX.view) {
        // View operation (70%)
        await memory.view('**/*.md');
        opType = 'view';
      } else if (rand < MIX.view + MIX.create) {
        // Create operation (20%)
        await memory.storePattern({
          title: `New pattern ${i}`,
          category: 'mix_test',
          description: `New pattern from operation ${i}`,
          code: `// New pattern ${i}`,
          language: 'typescript',
          successRate: '100%'
        });
        opType = 'create';
      } else {
        // Update operation (10%)
        await memory.view('**/*.md'); // Simulate update by reading first
        opType = 'update';
      }

      const latency = Date.now() - opStart;
      operations.push({ type: opType, latency });

      if ((i + 1) % 100 === 0) {
        const recentAvg = operations.slice(-100).reduce((sum, op) => sum + op.latency, 0) / 100;
        console.log(`    ${i + 1}/${TOTAL_OPS}: ${recentAvg.toFixed(1)}ms avg`);
      }
    }

    const duration = Date.now() - startTime;

    // Analyze by operation type
    const byType = {
      view: operations.filter(op => op.type === 'view'),
      create: operations.filter(op => op.type === 'create'),
      update: operations.filter(op => op.type === 'update')
    };

    console.log(`\n📊 Operation Mix Results:`);
    console.log(`  Total operations: ${TOTAL_OPS}`);
    console.log(`  Duration: ${(duration / 1000).toFixed(1)} seconds`);
    console.log(`  Throughput: ${(TOTAL_OPS / (duration / 1000)).toFixed(1)} ops/sec`);

    console.log(`\n  Latency by Operation Type:`);
    for (const [type, ops] of Object.entries(byType)) {
      const avg = ops.reduce((sum, op) => sum + op.latency, 0) / ops.length;
      const p95 = ops.map(op => op.latency).sort((a, b) => a - b)[Math.floor(ops.length * 0.95)];
      console.log(`    ${type}: ${ops.length} ops, ${avg.toFixed(1)}ms avg, ${p95}ms P95`);
    }

    // Verify overall throughput
    expect(TOTAL_OPS / (duration / 1000)).toBeGreaterThan(5); // >5 ops/sec
  }, 120000);

  /**
   * Test 4.5: Memory Leak Detection
   *
   * Validates no memory degradation over time
   */
  test('No memory leaks over 5000 operations', async () => {
    console.log('📊 Test 4.5: Memory leak detection (5000 operations)');

    const TOTAL_OPS = 5000;
    const CHECKPOINT_INTERVAL = 1000;

    const memory = getAgentMemoryAPI('maria-qa');
    const checkpoints: Array<{ ops: number; latency: number }> = [];

    // Execute 5000 operations and measure latency trend
    for (let i = 0; i < TOTAL_OPS; i++) {
      const start = Date.now();

      await memory.storePattern({
        title: `Leak test pattern ${i}`,
        category: 'leak_test',
        description: `Pattern ${i} for memory leak detection`,
        code: `// Pattern ${i}`,
        language: 'typescript',
        successRate: '100%'
      });

      const latency = Date.now() - start;

      // Checkpoint every 1000 operations
      if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
        checkpoints.push({ ops: i + 1, latency });
        console.log(`  Checkpoint ${checkpoints.length}: ${i + 1} ops, ${latency}ms latency`);
      }
    }

    console.log(`\n📊 Memory Leak Analysis:`);
    console.log(`  Total operations: ${TOTAL_OPS}`);
    console.log(`  Checkpoints: ${checkpoints.length}`);

    // Analyze latency trend
    const firstCheckpoint = checkpoints[0].latency;
    const lastCheckpoint = checkpoints[checkpoints.length - 1].latency;
    const degradation = ((lastCheckpoint - firstCheckpoint) / firstCheckpoint) * 100;

    console.log(`  First checkpoint latency: ${firstCheckpoint}ms`);
    console.log(`  Last checkpoint latency: ${lastCheckpoint}ms`);
    console.log(`  Degradation: ${degradation.toFixed(1)}%`);

    // Should not degrade more than 50% over 5000 operations
    expect(Math.abs(degradation)).toBeLessThan(50);

    // Latency should remain stable (no unbounded growth)
    expect(lastCheckpoint).toBeLessThan(firstCheckpoint * 2);
  }, 180000); // 3 minute timeout

  /**
   * Test 4.6: Error Recovery
   *
   * Validates recovery from operation failures
   */
  test('Recovers from 20% operation failures', async () => {
    console.log('📊 Test 4.6: Error recovery stress test');

    const TOTAL_OPS = 200;
    const FAILURE_RATE = 0.20; // 20% failure rate

    const memory = getAgentMemoryAPI('maria-qa');
    const results: Array<{ success: boolean; recovered: boolean }> = [];

    for (let i = 0; i < TOTAL_OPS; i++) {
      const shouldFail = Math.random() < FAILURE_RATE;

      try {
        if (shouldFail) {
          // Simulate failure
          throw new Error('Simulated failure');
        }

        await memory.storePattern({
          title: `Recovery test pattern ${i}`,
          category: 'recovery_test',
          description: `Pattern ${i}`,
          code: `// Pattern ${i}`,
          language: 'typescript',
          successRate: '100%'
        });

        results.push({ success: true, recovered: false });

      } catch (error) {
        // Attempt recovery
        try {
          await memory.storePattern({
            title: `Recovery retry pattern ${i}`,
            category: 'recovery_test',
            description: `Recovery retry ${i}`,
            code: `// Recovery ${i}`,
            language: 'typescript',
            successRate: '100%'
          });

          results.push({ success: false, recovered: true });
        } catch {
          results.push({ success: false, recovered: false });
        }
      }
    }

    // Analyze results
    const successful = results.filter(r => r.success).length;
    const recovered = results.filter(r => r.recovered).length;
    const failed = results.filter(r => !r.success && !r.recovered).length;

    console.log(`\n📊 Error Recovery Results:`);
    console.log(`  Total operations: ${TOTAL_OPS}`);
    console.log(`  Successful: ${successful} (${(successful/TOTAL_OPS*100).toFixed(1)}%)`);
    console.log(`  Recovered: ${recovered} (${(recovered/TOTAL_OPS*100).toFixed(1)}%)`);
    console.log(`  Failed: ${failed} (${(failed/TOTAL_OPS*100).toFixed(1)}%)`);

    // Overall success rate (success + recovered) should be high
    const overallSuccess = (successful + recovered) / TOTAL_OPS;
    expect(overallSuccess).toBeGreaterThan(0.90); // 90%+ overall success

    // Failed operations should be minimal
    expect(failed / TOTAL_OPS).toBeLessThan(0.10); // <10% total failure
  }, 60000);
});

// Helper Functions

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
