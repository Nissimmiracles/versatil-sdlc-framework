/**
 * Tests for Performance Monitor System
 */

import { PerformanceMonitor } from '../../src/analytics/performance-monitor';
import { EventEmitter } from 'events';

// Mock VERSATILLogger
jest.mock('../../src/utils/logger', () => ({
  VERSATILLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
  });

  afterEach(() => {
    performanceMonitor.stop();
  });

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
      expect(performanceMonitor).toBeInstanceOf(EventEmitter);
      expect(performanceMonitor['isMonitoring']).toBe(false);
      expect(performanceMonitor['agentMetrics']).toBeDefined();
      expect(performanceMonitor['systemMetrics']).toBeDefined();
    });

    it('should initialize with empty metrics', () => {
      expect(performanceMonitor['agentMetrics'].size).toBe(0);
      expect(performanceMonitor['systemMetrics'].cpuUsage).toBe(0);
      expect(performanceMonitor['systemMetrics'].memoryUsage.used).toBe(0);
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring successfully', () => {
      performanceMonitor.start();
      expect(performanceMonitor['isMonitoring']).toBe(true);
    });

    it('should stop monitoring successfully', () => {
      performanceMonitor.start();
      performanceMonitor.stop();
      expect(performanceMonitor['isMonitoring']).toBe(false);
    });

    it('should handle multiple start calls gracefully', () => {
      performanceMonitor.start();
      performanceMonitor.start();
      expect(performanceMonitor['isMonitoring']).toBe(true);
    });

    it('should handle stop without start gracefully', () => {
      expect(() => performanceMonitor.stop()).not.toThrow();
      expect(performanceMonitor['isMonitoring']).toBe(false);
    });
  });

  describe('Agent Execution Recording', () => {
    beforeEach(() => {
      performanceMonitor.start();
    });

    it('should record agent execution successfully', () => {
      performanceMonitor.recordAgentExecution('enhanced-maria', 1500, 3, 0.95);

      const agentMetrics = performanceMonitor['agentMetrics'].get('enhanced-maria');
      expect(agentMetrics).toBeDefined();
      expect(agentMetrics?.activations).toBe(1);
      expect(agentMetrics?.totalExecutionTime).toBe(1500);
      expect(agentMetrics?.issuesDetected).toBe(3);
      expect(agentMetrics?.avgQualityScore).toBe(0.95);
    });

    it('should accumulate multiple executions for same agent', () => {
      performanceMonitor.recordAgentExecution('enhanced-maria', 1000, 2, 0.9);
      performanceMonitor.recordAgentExecution('enhanced-maria', 2000, 4, 0.8);

      const agentMetrics = performanceMonitor['agentMetrics'].get('enhanced-maria');
      expect(agentMetrics?.activations).toBe(2);
      expect(agentMetrics?.totalExecutionTime).toBe(3000);
      expect(agentMetrics?.issuesDetected).toBe(6);
      expect(agentMetrics?.avgQualityScore).toBe(0.85); // (0.9 + 0.8) / 2
    });

    it('should track different agents separately', () => {
      performanceMonitor.recordAgentExecution('enhanced-maria', 1000, 2, 0.9);
      performanceMonitor.recordAgentExecution('enhanced-james', 1500, 3, 0.85);

      expect(performanceMonitor['agentMetrics'].size).toBe(2);

      const mariaMetrics = performanceMonitor['agentMetrics'].get('enhanced-maria');
      const jamesMetrics = performanceMonitor['agentMetrics'].get('enhanced-james');

      expect(mariaMetrics?.activations).toBe(1);
      expect(jamesMetrics?.activations).toBe(1);
      expect(mariaMetrics?.avgQualityScore).toBe(0.9);
      expect(jamesMetrics?.avgQualityScore).toBe(0.85);
    });

    it('should not record when monitoring is stopped', () => {
      performanceMonitor.stop();
      performanceMonitor.recordAgentExecution('enhanced-maria', 1000, 2, 0.9);

      expect(performanceMonitor['agentMetrics'].size).toBe(0);
    });

    it('should emit performance_alert for slow executions', (done) => {
      performanceMonitor.on('performance_alert', (alert) => {
        expect(alert).toMatchObject({
          type: 'slow_execution',
          agentId: 'enhanced-maria',
          executionTime: 10000,
          threshold: 5000
        });
        done();
      });

      performanceMonitor.recordAgentExecution('enhanced-maria', 10000, 1, 0.9);
    });

    it('should emit performance_alert for low quality scores', (done) => {
      performanceMonitor.on('performance_alert', (alert) => {
        expect(alert).toMatchObject({
          type: 'low_quality',
          agentId: 'enhanced-maria',
          qualityScore: 0.3,
          threshold: 0.7
        });
        done();
      });

      performanceMonitor.recordAgentExecution('enhanced-maria', 1000, 1, 0.3);
    });
  });

  describe('System Metrics Collection', () => {
    beforeEach(() => {
      performanceMonitor.start();
    });

    it('should collect system metrics periodically', (done) => {
      // Trigger system metrics collection manually
      performanceMonitor['collectSystemMetrics']();

      setTimeout(() => {
        const systemMetrics = performanceMonitor['systemMetrics'];
        expect(systemMetrics.uptime).toBeGreaterThan(0);
        expect(systemMetrics.memoryUsage.total).toBeGreaterThan(0);
        expect(systemMetrics.memoryUsage.used).toBeGreaterThanOrEqual(0);
        expect(systemMetrics.memoryUsage.percentage).toBeGreaterThanOrEqual(0);
        done();
      }, 100);
    });

    it('should update system metrics over time', (done) => {
      const initialUptime = performanceMonitor['systemMetrics'].uptime;

      setTimeout(() => {
        performanceMonitor['collectSystemMetrics']();
        const updatedUptime = performanceMonitor['systemMetrics'].uptime;
        expect(updatedUptime).toBeGreaterThanOrEqual(initialUptime);
        done();
      }, 100);
    });
  });

  describe('Performance Dashboard', () => {
    beforeEach(() => {
      performanceMonitor.start();
      // Add some test data
      performanceMonitor.recordAgentExecution('enhanced-maria', 1200, 3, 0.95);
      performanceMonitor.recordAgentExecution('enhanced-james', 800, 1, 0.88);
      performanceMonitor.recordAgentExecution('enhanced-marcus', 1500, 5, 0.92);
    });

    it('should generate comprehensive dashboard data', () => {
      const dashboard = performanceMonitor.getPerformanceDashboard();

      expect(dashboard).toMatchObject({
        timestamp: expect.any(String),
        system: expect.objectContaining({
          overallHealth: expect.any(Number),
          uptime: expect.any(Number),
          memoryUsage: expect.objectContaining({
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number)
          }),
          cpuUsage: expect.any(Number),
          responseTime: expect.any(Number)
        }),
        agents: expect.any(Array)
      });
    });

    it('should include all recorded agents in dashboard', () => {
      const dashboard = performanceMonitor.getPerformanceDashboard();

      expect(dashboard.agents).toHaveLength(3);

      const agentIds = dashboard.agents.map(agent => agent.agentId);
      expect(agentIds).toContain('enhanced-maria');
      expect(agentIds).toContain('enhanced-james');
      expect(agentIds).toContain('enhanced-marcus');
    });

    it('should calculate correct agent metrics', () => {
      const dashboard = performanceMonitor.getPerformanceDashboard();

      const mariaAgent = dashboard.agents.find(agent => agent.agentId === 'enhanced-maria');
      expect(mariaAgent).toMatchObject({
        agentId: 'enhanced-maria',
        activations: 1,
        avgExecutionTime: 1200,
        totalIssuesDetected: 3,
        avgQualityScore: 0.95,
        successRate: expect.any(Number),
        lastActive: expect.any(String)
      });
    });

    it('should calculate overall system health', () => {
      const dashboard = performanceMonitor.getPerformanceDashboard();

      expect(dashboard.system.overallHealth).toBeGreaterThan(0);
      expect(dashboard.system.overallHealth).toBeLessThanOrEqual(100);
    });
  });

  describe('Prometheus Metrics', () => {
    beforeEach(() => {
      performanceMonitor.start();
      performanceMonitor.recordAgentExecution('enhanced-maria', 1200, 3, 0.95);
      performanceMonitor.recordAgentExecution('enhanced-james', 800, 1, 0.88);
    });

    it('should generate Prometheus-compatible metrics', () => {
      const metrics = performanceMonitor.getPrometheusMetrics();

      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
      expect(metrics).toContain('versatil_agent_activations_total');
      expect(metrics).toContain('versatil_agent_execution_time_ms');
      expect(metrics).toContain('versatil_agent_quality_score');
    });

    it('should include agent-specific metrics', () => {
      const metrics = performanceMonitor.getPrometheusMetrics();

      expect(metrics).toContain('enhanced-maria');
      expect(metrics).toContain('enhanced-james');
      expect(metrics).toContain('1200'); // Maria's execution time
      expect(metrics).toContain('800');  // James's execution time
    });

    it('should include system metrics', () => {
      const metrics = performanceMonitor.getPrometheusMetrics();

      expect(metrics).toContain('versatil_system_memory_usage_bytes');
      expect(metrics).toContain('versatil_system_cpu_usage_percent');
      expect(metrics).toContain('versatil_system_uptime_seconds');
    });

    it('should format metrics correctly for Prometheus', () => {
      const metrics = performanceMonitor.getPrometheusMetrics();

      // Check for proper Prometheus format
      const lines = metrics.split('\n');
      const metricLines = lines.filter(line => !line.startsWith('#') && line.trim() !== '');

      metricLines.forEach(line => {
        expect(line).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*(\{[^}]*\})?\s+[\d.]+$/);
      });
    });
  });

  describe('Performance Alerts', () => {
    beforeEach(() => {
      performanceMonitor.start();
    });

    it('should detect performance degradation', (done) => {
      let alertCount = 0;

      performanceMonitor.on('performance_alert', (alert) => {
        alertCount++;
        expect(alert.type).toBeDefined();
        expect(alert.agentId).toBeDefined();

        if (alertCount === 2) {
          done();
        }
      });

      // Trigger multiple alerts
      performanceMonitor.recordAgentExecution('enhanced-maria', 8000, 1, 0.5); // Slow + low quality
    });

    it('should track agent performance trends', () => {
      // Record multiple executions with declining performance
      performanceMonitor.recordAgentExecution('enhanced-maria', 1000, 2, 0.9);
      performanceMonitor.recordAgentExecution('enhanced-maria', 2000, 1, 0.8);
      performanceMonitor.recordAgentExecution('enhanced-maria', 3000, 0, 0.7);

      const dashboard = performanceMonitor.getPerformanceDashboard();
      const mariaAgent = dashboard.agents.find(agent => agent.agentId === 'enhanced-maria');

      expect(mariaAgent?.avgExecutionTime).toBe(2000); // (1000 + 2000 + 3000) / 3
      expect(mariaAgent?.avgQualityScore).toBeCloseTo(0.8); // (0.9 + 0.8 + 0.7) / 3
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      performanceMonitor.start();
    });

    it('should handle large numbers of agent executions', () => {
      // Record many executions
      for (let i = 0; i < 1000; i++) {
        performanceMonitor.recordAgentExecution(`agent-${i % 10}`, 1000 + i, i % 5, 0.8 + (i % 20) * 0.01);
      }

      const dashboard = performanceMonitor.getPerformanceDashboard();
      expect(dashboard.agents.length).toBe(10); // 10 unique agents
    });

    it('should clean up old metrics when needed', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Add lots of data
      for (let i = 0; i < 10000; i++) {
        performanceMonitor.recordAgentExecution(`test-agent-${i}`, 1000, 1, 0.8);
      }

      const afterMemory = process.memoryUsage().heapUsed;
      expect(afterMemory).toBeLessThan(initialMemory * 2); // Should not double memory usage
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid agent execution data', () => {
      performanceMonitor.start();

      expect(() => {
        performanceMonitor.recordAgentExecution('', -1, -1, -1);
      }).not.toThrow();
    });

    it('should handle system metrics collection errors', () => {
      performanceMonitor.start();

      expect(() => {
        performanceMonitor['collectSystemMetrics']();
      }).not.toThrow();
    });

    it('should handle dashboard generation errors', () => {
      expect(() => {
        performanceMonitor.getPerformanceDashboard();
      }).not.toThrow();
    });
  });

  describe('Event Emission', () => {
    beforeEach(() => {
      performanceMonitor.start();
    });

    it('should emit agent_execution event', (done) => {
      performanceMonitor.on('agent_execution', (data) => {
        expect(data).toMatchObject({
          agentId: 'enhanced-maria',
          executionTime: 1200,
          issuesDetected: 3,
          qualityScore: 0.95,
          timestamp: expect.any(Number)
        });
        done();
      });

      performanceMonitor.recordAgentExecution('enhanced-maria', 1200, 3, 0.95);
    });

    it('should emit system_metrics event', (done) => {
      performanceMonitor.on('system_metrics', (metrics) => {
        expect(metrics).toMatchObject({
          uptime: expect.any(Number),
          memoryUsage: expect.any(Object),
          cpuUsage: expect.any(Number),
          timestamp: expect.any(Number)
        });
        done();
      });

      performanceMonitor['collectSystemMetrics']();
    });
  });
});