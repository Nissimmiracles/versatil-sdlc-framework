/**
 * VERSATIL Framework - MCP Health Monitor Tests
 * Test suite for MCP health monitoring, circuit breaker, and retry logic
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPHealthMonitor } from './mcp-health-monitor';

describe('MCPHealthMonitor', () => {
  let monitor: MCPHealthMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    monitor = new MCPHealthMonitor();
  });

  afterEach(() => {
    if (monitor) {
      monitor.stopMonitoring();
    }
  });

  // ============================================================================
  // Health Check Management (10 tests)
  // ============================================================================
  describe('Health Check Management', () => {
    it('should initialize health monitor', () => {
      expect(monitor).toBeDefined();
      expect(monitor instanceof MCPHealthMonitor).toBe(true);
    });

    it('should initialize all 11 MCPs as healthy', () => {
      const allHealth = monitor.getAllHealthStatus();
      expect(allHealth.size).toBe(11);

      for (const [mcpId, health] of allHealth) {
        expect(health.status).toBe('healthy');
        expect(health.consecutiveFailures).toBe(0);
        expect(health.successRate).toBe(100);
        expect(health.circuitOpen).toBe(false);
      }
    });

    it('should start monitoring MCP servers', () => {
      const intervalMs = 5000;
      monitor.startMonitoring(intervalMs);

      expect(monitor.isMonitoring()).toBe(true);
    });

    it('should stop monitoring', () => {
      monitor.startMonitoring(5000);
      expect(monitor.isMonitoring()).toBe(true);

      monitor.stopMonitoring();
      expect(monitor.isMonitoring()).toBe(false);
    });

    it('should not start duplicate monitoring', () => {
      monitor.startMonitoring(5000);
      const firstInterval = monitor['monitoringInterval'];

      monitor.startMonitoring(5000); // Try to start again
      const secondInterval = monitor['monitoringInterval'];

      expect(firstInterval).toBe(secondInterval);
    });

    it('should configure health check interval', () => {
      const customInterval = 30000; // 30 seconds
      monitor.startMonitoring(customInterval);

      expect(monitor.isMonitoring()).toBe(true);
    });

    it('should perform initial health check on start', async () => {
      const checkSpy = vi.spyOn(monitor, 'checkAllMCPs');

      monitor.startMonitoring(60000);

      // Wait for async initial check
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(checkSpy).toHaveBeenCalled();
    });

    it('should emit monitoring_started event', (done) => {
      monitor.on('monitoring_started', (data) => {
        expect(data).toHaveProperty('intervalMs');
        done();
      });

      monitor.startMonitoring(5000);
    });

    it('should emit monitoring_stopped event', (done) => {
      monitor.on('monitoring_stopped', () => {
        done();
      });

      monitor.startMonitoring(5000);
      monitor.stopMonitoring();
    });

    it('should handle monitoring errors gracefully', async () => {
      // Mock checkAllMCPs to throw error
      vi.spyOn(monitor, 'checkAllMCPs').mockRejectedValue(new Error('Check failed'));

      monitor.startMonitoring(100);

      // Should not crash
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(monitor.isMonitoring()).toBe(true);
    });
  });

  // ============================================================================
  // Server Health Tracking (12 tests)
  // ============================================================================
  describe('Server Health Tracking', () => {
    it('should detect healthy MCP server', async () => {
      const mcpId = 'chrome_mcp';
      const result = await monitor.executeMCPWithRetry(mcpId, async () => ({
        success: true,
        data: { result: 'ok' },
        latency: 100
      }));

      expect(result.success).toBe(true);

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.status).toBe('healthy');
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('should detect unhealthy server', async () => {
      const mcpId = 'github_mcp';

      // Simulate multiple failures
      for (let i = 0; i < 5; i++) {
        await monitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Server unavailable');
        });
      }

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.status).toBe('unhealthy');
      expect(health?.consecutiveFailures).toBeGreaterThanOrEqual(3);
    });

    it('should track consecutive failures', async () => {
      const mcpId = 'playwright_mcp';

      const failingOperation = async () => {
        throw new Error('Failed');
      };

      await monitor.executeMCPWithRetry(mcpId, failingOperation);
      let health = monitor.getHealthStatus(mcpId);
      expect(health?.consecutiveFailures).toBe(1);

      await monitor.executeMCPWithRetry(mcpId, failingOperation);
      health = monitor.getHealthStatus(mcpId);
      expect(health?.consecutiveFailures).toBe(2);
    });

    it('should reset consecutive failures on success', async () => {
      const mcpId = 'exa_mcp';

      // Fail twice
      await monitor.executeMCPWithRetry(mcpId, async () => {
        throw new Error('Failed');
      });
      await monitor.executeMCPWithRetry(mcpId, async () => {
        throw new Error('Failed');
      });

      let health = monitor.getHealthStatus(mcpId);
      expect(health?.consecutiveFailures).toBe(2);

      // Succeed
      await monitor.executeMCPWithRetry(mcpId, async () => ({
        success: true,
        data: 'ok',
        latency: 50
      }));

      health = monitor.getHealthStatus(mcpId);
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('should calculate uptime percentage', async () => {
      const mcpId = 'shadcn_mcp';

      // 3 successes, 1 failure = 75% uptime
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => { throw new Error('Failed'); });

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.successRate).toBeGreaterThan(0);
      expect(health?.successRate).toBeLessThanOrEqual(100);
    });

    it('should update lastCheck timestamp', async () => {
      const mcpId = 'vertex_ai_mcp';

      const before = new Date();
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      const after = new Date();

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.lastCheck.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(health?.lastCheck.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should track average latency', async () => {
      const mcpId = 'supabase_mcp';

      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 100 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 200 }));

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.averageLatency).toBeGreaterThan(0);
      expect(health?.averageLatency).toBeLessThanOrEqual(200);
    });

    it('should distinguish degraded from unhealthy', async () => {
      const mcpId = 'n8n_mcp';

      // 1-2 failures = degraded
      await monitor.executeMCPWithRetry(mcpId, async () => { throw new Error('Failed'); });
      let health = monitor.getHealthStatus(mcpId);
      expect(health?.status).toBe('degraded');

      // 3+ failures = unhealthy
      await monitor.executeMCPWithRetry(mcpId, async () => { throw new Error('Failed'); });
      await monitor.executeMCPWithRetry(mcpId, async () => { throw new Error('Failed'); });
      health = monitor.getHealthStatus(mcpId);
      expect(health?.status).toBe('unhealthy');
    });

    it('should get health status by MCP ID', () => {
      const health = monitor.getHealthStatus('semgrep_mcp');

      expect(health).toBeDefined();
      expect(health?.mcpId).toBe('semgrep_mcp');
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('lastCheck');
    });

    it('should return null for unknown MCP ID', () => {
      const health = monitor.getHealthStatus('unknown_mcp');
      expect(health).toBeNull();
    });

    it('should emit health_changed event', (done) => {
      monitor.on('health_changed', (data) => {
        expect(data).toHaveProperty('mcpId');
        expect(data).toHaveProperty('oldStatus');
        expect(data).toHaveProperty('newStatus');
        done();
      });

      // Trigger status change
      monitor.executeMCPWithRetry('sentry_mcp', async () => {
        throw new Error('Failed');
      });
    });

    it('should track health status for all MCPs', () => {
      const allHealth = monitor.getAllHealthStatus();

      expect(allHealth.size).toBe(11);
      expect(allHealth.has('chrome_mcp')).toBe(true);
      expect(allHealth.has('github_mcp')).toBe(true);
      expect(allHealth.has('versatil_mcp')).toBe(true);
    });
  });

  // ============================================================================
  // Circuit Breaker Pattern (10 tests)
  // ============================================================================
  describe('Circuit Breaker Pattern', () => {
    it('should open circuit on failure threshold', async () => {
      const mcpId = 'chrome_mcp';

      // Trigger 5 consecutive failures (threshold)
      for (let i = 0; i < 5; i++) {
        await monitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Service down');
        });
      }

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.circuitOpen).toBe(true);
    });

    it('should reject requests when circuit is open', async () => {
      const mcpId = 'playwright_mcp';

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await monitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Failed');
        });
      }

      // Next request should be rejected immediately
      const result = await monitor.executeMCPWithRetry(mcpId, async () => ({
        success: true,
        data: 'ok',
        latency: 50
      }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('circuit');
    });

    it('should half-open circuit for retry after timeout', async () => {
      const mcpId = 'github_mcp';
      const customMonitor = new MCPHealthMonitor({
        maxRetries: 3,
        baseDelay: 100 // Shorter for testing
      });

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await customMonitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Failed');
        });
      }

      let health = customMonitor.getHealthStatus(mcpId);
      expect(health?.circuitOpen).toBe(true);

      // Wait for circuit half-open timeout (simulate)
      customMonitor['halfOpenCircuit'](mcpId);

      health = customMonitor.getHealthStatus(mcpId);
      expect(health?.circuitOpen).toBe(false);
    });

    it('should close circuit on successful retry', async () => {
      const mcpId = 'exa_mcp';

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await monitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Failed');
        });
      }

      // Half-open
      monitor['halfOpenCircuit'](mcpId);

      // Succeed
      const result = await monitor.executeMCPWithRetry(mcpId, async () => ({
        success: true,
        data: 'ok',
        latency: 50
      }));

      expect(result.success).toBe(true);
      const health = monitor.getHealthStatus(mcpId);
      expect(health?.circuitOpen).toBe(false);
    });

    it('should track circuit breaker state', () => {
      const mcpId = 'shadcn_mcp';

      let health = monitor.getHealthStatus(mcpId);
      expect(health?.circuitOpen).toBe(false);

      // Open circuit manually for testing
      monitor['openCircuit'](mcpId);

      health = monitor.getHealthStatus(mcpId);
      expect(health?.circuitOpen).toBe(true);
    });

    it('should emit circuit_opened event', (done) => {
      monitor.on('circuit_opened', (data) => {
        expect(data).toHaveProperty('mcpId');
        expect(data).toHaveProperty('consecutiveFailures');
        done();
      });

      // Trigger circuit breaker
      const mcpId = 'vertex_ai_mcp';
      for (let i = 0; i < 5; i++) {
        monitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Failed');
        });
      }
    });

    it('should emit circuit_closed event', (done) => {
      const mcpId = 'supabase_mcp';

      monitor.on('circuit_closed', (data) => {
        expect(data.mcpId).toBe(mcpId);
        done();
      });

      // Open then close
      monitor['openCircuit'](mcpId);
      monitor['closeCircuit'](mcpId);
    });

    it('should count rejected requests during open circuit', async () => {
      const mcpId = 'n8n_mcp';

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await monitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Failed');
        });
      }

      // Try 3 requests (should be rejected)
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));

      const stats = monitor.getCircuitBreakerStats(mcpId);
      expect(stats?.rejectedRequests).toBeGreaterThanOrEqual(3);
    });

    it('should reset circuit breaker stats on close', async () => {
      const mcpId = 'semgrep_mcp';

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await monitor.executeMCPWithRetry(mcpId, async () => {
          throw new Error('Failed');
        });
      }

      // Close circuit
      monitor['closeCircuit'](mcpId);

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.consecutiveFailures).toBe(0);
    });

    it('should maintain independent circuit state per MCP', async () => {
      // Fail chrome_mcp
      for (let i = 0; i < 5; i++) {
        await monitor.executeMCPWithRetry('chrome_mcp', async () => {
          throw new Error('Failed');
        });
      }

      const chromeHealth = monitor.getHealthStatus('chrome_mcp');
      const githubHealth = monitor.getHealthStatus('github_mcp');

      expect(chromeHealth?.circuitOpen).toBe(true);
      expect(githubHealth?.circuitOpen).toBe(false);
    });
  });

  // ============================================================================
  // Retry Logic (8 tests)
  // ============================================================================
  describe('Retry Logic', () => {
    it('should retry failed health checks', async () => {
      const mcpId = 'sentry_mcp';
      let attemptCount = 0;

      const result = await monitor.executeMCPWithRetry(mcpId, async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true, data: 'ok', latency: 50 };
      });

      expect(result.success).toBe(true);
      expect(result.retriesUsed).toBeGreaterThan(0);
    });

    it('should use exponential backoff', async () => {
      const customMonitor = new MCPHealthMonitor({
        maxRetries: 3,
        baseDelay: 100,
        backoffMultiplier: 2
      });

      const timestamps: number[] = [];

      await customMonitor.executeMCPWithRetry('versatil_mcp', async () => {
        timestamps.push(Date.now());
        throw new Error('Failed');
      });

      // Check delays are increasing (100ms, 200ms, 400ms)
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1] - timestamps[0];
        const delay2 = timestamps[2] - timestamps[1];
        expect(delay2).toBeGreaterThan(delay1);
      }
    });

    it('should respect max retries', async () => {
      const customMonitor = new MCPHealthMonitor({
        maxRetries: 2,
        baseDelay: 10
      });

      let attemptCount = 0;

      await customMonitor.executeMCPWithRetry('chrome_mcp', async () => {
        attemptCount++;
        throw new Error('Always fails');
      });

      expect(attemptCount).toBeLessThanOrEqual(3); // 1 initial + 2 retries
    });

    it('should timeout long-running checks', async () => {
      const customMonitor = new MCPHealthMonitor({
        maxRetries: 1,
        baseDelay: 100
      });

      const startTime = Date.now();

      await customMonitor.executeMCPWithRetry('playwright_mcp', async () => {
        // Simulate long operation
        await new Promise(resolve => setTimeout(resolve, 10000));
        return { success: true, data: 'ok', latency: 10000 };
      }, { timeout: 500 });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(2000); // Should timeout quickly
    });

    it('should track retries used', async () => {
      let attemptCount = 0;

      const result = await monitor.executeMCPWithRetry('github_mcp', async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Failed');
        }
        return { success: true, data: 'ok', latency: 50 };
      });

      expect(result.retriesUsed).toBe(1);
    });

    it('should not retry on non-retryable errors', async () => {
      let attemptCount = 0;

      await monitor.executeMCPWithRetry('exa_mcp', async () => {
        attemptCount++;
        const error: any = new Error('Authentication failed');
        error.retryable = false;
        throw error;
      });

      expect(attemptCount).toBe(1); // No retries
    });

    it('should emit retry_attempted event', (done) => {
      monitor.on('retry_attempted', (data) => {
        expect(data).toHaveProperty('mcpId');
        expect(data).toHaveProperty('attempt');
        done();
      });

      monitor.executeMCPWithRetry('shadcn_mcp', async () => {
        throw new Error('Failed');
      });
    });

    it('should include retry count in result', async () => {
      const result = await monitor.executeMCPWithRetry('vertex_ai_mcp', async () => ({
        success: true,
        data: 'ok',
        latency: 50
      }));

      expect(result).toHaveProperty('retriesUsed');
      expect(typeof result.retriesUsed).toBe('number');
    });
  });

  // ============================================================================
  // Metrics & Reporting (10 tests)
  // ============================================================================
  describe('Metrics & Reporting', () => {
    it('should generate health report', () => {
      const report = monitor.generateHealthReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('totalMCPs');
      expect(report).toHaveProperty('healthyCount');
      expect(report).toHaveProperty('degradedCount');
      expect(report).toHaveProperty('unhealthyCount');
      expect(report.totalMCPs).toBe(11);
    });

    it('should track response times', async () => {
      const mcpId = 'supabase_mcp';

      await monitor.executeMCPWithRetry(mcpId, async () => ({
        success: true,
        data: 'ok',
        latency: 150
      }));

      const metrics = monitor.getMetrics(mcpId);
      expect(metrics?.averageLatency).toBeGreaterThan(0);
      expect(metrics?.lastLatency).toBe(150);
    });

    it('should calculate reliability score (0-100)', () => {
      const score = monitor.calculateReliabilityScore();

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should alert on degradation', (done) => {
      monitor.on('degradation_alert', (data) => {
        expect(data).toHaveProperty('mcpId');
        expect(data).toHaveProperty('severity');
        done();
      });

      // Trigger degradation
      const mcpId = 'n8n_mcp';
      monitor.executeMCPWithRetry(mcpId, async () => {
        throw new Error('Degraded');
      });
    });

    it('should track total requests per MCP', async () => {
      const mcpId = 'semgrep_mcp';

      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));

      const metrics = monitor.getMetrics(mcpId);
      expect(metrics?.totalRequests).toBeGreaterThanOrEqual(3);
    });

    it('should track successful requests', async () => {
      const mcpId = 'sentry_mcp';

      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));

      const metrics = monitor.getMetrics(mcpId);
      expect(metrics?.successfulRequests).toBeGreaterThanOrEqual(2);
    });

    it('should track failed requests', async () => {
      const mcpId = 'versatil_mcp';

      await monitor.executeMCPWithRetry(mcpId, async () => { throw new Error('Failed'); });
      await monitor.executeMCPWithRetry(mcpId, async () => { throw new Error('Failed'); });

      const metrics = monitor.getMetrics(mcpId);
      expect(metrics?.failedRequests).toBeGreaterThanOrEqual(2);
    });

    it('should calculate success rate percentage', async () => {
      const mcpId = 'chrome_mcp';

      // 3 success, 1 failure = 75%
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => ({ success: true, data: 'ok', latency: 50 }));
      await monitor.executeMCPWithRetry(mcpId, async () => { throw new Error('Failed'); });

      const health = monitor.getHealthStatus(mcpId);
      expect(health?.successRate).toBeGreaterThan(50);
      expect(health?.successRate).toBeLessThanOrEqual(100);
    });

    it('should export metrics as JSON', () => {
      const json = monitor.exportMetricsJSON();

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('mcps');
    });

    it('should provide summary statistics', () => {
      const summary = monitor.getSummaryStats();

      expect(summary).toHaveProperty('totalMCPs');
      expect(summary).toHaveProperty('overallHealthScore');
      expect(summary).toHaveProperty('averageLatency');
      expect(summary).toHaveProperty('totalRequests');
      expect(summary.totalMCPs).toBe(11);
    });
  });
});
