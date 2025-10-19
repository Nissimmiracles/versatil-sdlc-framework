/**
 * Tests for DocsPerformanceMonitor - Query timing and metrics
 */

import { DocsPerformanceMonitor } from '../../src/mcp/docs-performance-monitor.js';

describe('DocsPerformanceMonitor', () => {
  let monitor: DocsPerformanceMonitor;

  beforeEach(() => {
    monitor = new DocsPerformanceMonitor({ maxMetrics: 100 });
  });

  describe('Query Tracking', () => {
    it('should track query metrics', () => {
      monitor.trackQuery('maria testing', 45, false, 5);

      const metrics = monitor.getMetrics();

      expect(metrics.totalQueries).toBe(1);
      expect(metrics.avgQueryDuration).toBe(45);
    });

    it('should track multiple queries', () => {
      monitor.trackQuery('query1', 50, false);
      monitor.trackQuery('query2', 100, true);
      monitor.trackQuery('query3', 75, false);

      const metrics = monitor.getMetrics();

      expect(metrics.totalQueries).toBe(3);
      expect(metrics.avgQueryDuration).toBeCloseTo(75, 1); // (50+100+75)/3 = 75
    });

    it('should calculate cache hit rate correctly', () => {
      monitor.trackQuery('query1', 50, true); // Cache hit
      monitor.trackQuery('query2', 100, false); // Cache miss
      monitor.trackQuery('query3', 75, true); // Cache hit

      const metrics = monitor.getMetrics();

      expect(metrics.cacheHitRate).toBeCloseTo(0.667, 2); // 2/3 = 66.7%
    });

    it('should respect maxMetrics limit', () => {
      const smallMonitor = new DocsPerformanceMonitor({ maxMetrics: 5 });

      for (let i = 0; i < 10; i++) {
        smallMonitor.trackQuery(`query${i}`, 50, false);
      }

      const metrics = smallMonitor.getMetrics();

      expect(metrics.totalQueries).toBe(5); // Should only keep last 5
    });
  });

  describe('Index Build Tracking', () => {
    it('should track index build metrics', () => {
      monitor.trackIndexBuild(500, 123);

      const metrics = monitor.getMetrics();

      expect(metrics.totalIndexBuilds).toBe(1);
      expect(metrics.avgIndexBuildDuration).toBe(500);
    });

    it('should track multiple index builds', () => {
      monitor.trackIndexBuild(500, 100);
      monitor.trackIndexBuild(600, 110);
      monitor.trackIndexBuild(550, 105);

      const metrics = monitor.getMetrics();

      expect(metrics.totalIndexBuilds).toBe(3);
      expect(metrics.avgIndexBuildDuration).toBeCloseTo(550, 1); // (500+600+550)/3
    });

    it('should keep last index build timestamp', () => {
      const before = new Date();

      monitor.trackIndexBuild(500, 100);

      const after = new Date();
      const metrics = monitor.getMetrics();

      expect(metrics.lastIndexBuild).not.toBeNull();
      expect(metrics.lastIndexBuild!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(metrics.lastIndexBuild!.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Percentile Calculation', () => {
    it('should calculate p50 (median) correctly', () => {
      // Track queries with known durations
      [10, 20, 30, 40, 50].forEach(duration => {
        monitor.trackQuery('test', duration, false);
      });

      const metrics = monitor.getMetrics();

      expect(metrics.p50QueryDuration).toBe(30); // Median of [10, 20, 30, 40, 50]
    });

    it('should calculate p95 correctly', () => {
      // Track 100 queries with durations 1-100
      for (let i = 1; i <= 100; i++) {
        monitor.trackQuery('test', i, false);
      }

      const metrics = monitor.getMetrics();

      expect(metrics.p95QueryDuration).toBeGreaterThanOrEqual(95);
      expect(metrics.p95QueryDuration).toBeLessThanOrEqual(100);
    });

    it('should calculate p99 correctly', () => {
      // Track 100 queries
      for (let i = 1; i <= 100; i++) {
        monitor.trackQuery('test', i, false);
      }

      const metrics = monitor.getMetrics();

      expect(metrics.p99QueryDuration).toBeGreaterThanOrEqual(99);
      expect(metrics.p99QueryDuration).toBeLessThanOrEqual(100);
    });

    it('should handle empty metrics gracefully', () => {
      const metrics = monitor.getMetrics();

      expect(metrics.p50QueryDuration).toBe(0);
      expect(metrics.p95QueryDuration).toBe(0);
      expect(metrics.p99QueryDuration).toBe(0);
    });
  });

  describe('Prometheus Export', () => {
    it('should export metrics in Prometheus format', () => {
      monitor.trackQuery('test1', 50, true);
      monitor.trackQuery('test2', 100, false);
      monitor.trackIndexBuild(500, 100);

      const prometheus = monitor.exportPrometheus();

      expect(prometheus).toContain('versatil_docs_queries_total 2');
      expect(prometheus).toContain('versatil_docs_cache_hit_rate');
      expect(prometheus).toContain('versatil_docs_query_duration_ms');
      expect(prometheus).toContain('versatil_docs_index_builds_total 1');
      expect(prometheus).toContain('versatil_docs_uptime_seconds');
    });

    it('should include quantiles in Prometheus export', () => {
      for (let i = 1; i <= 100; i++) {
        monitor.trackQuery('test', i, false);
      }

      const prometheus = monitor.exportPrometheus();

      expect(prometheus).toContain('quantile="0.5"');
      expect(prometheus).toContain('quantile="0.95"');
      expect(prometheus).toContain('quantile="0.99"');
    });

    it('should format Prometheus metrics correctly', () => {
      monitor.trackQuery('test', 50, false);

      const prometheus = monitor.exportPrometheus();

      // Check format: # HELP, # TYPE, metric_name value
      expect(prometheus).toMatch(/# HELP versatil_docs_queries_total/);
      expect(prometheus).toMatch(/# TYPE versatil_docs_queries_total counter/);
      expect(prometheus).toMatch(/versatil_docs_queries_total \d+/);
    });
  });

  describe('Recent Queries', () => {
    it('should return recent queries in reverse chronological order', () => {
      monitor.trackQuery('query1', 50, false);
      monitor.trackQuery('query2', 100, true);
      monitor.trackQuery('query3', 75, false);

      const recent = monitor.getRecentQueries(3);

      expect(recent.length).toBe(3);
      expect(recent[0].query).toBe('query3'); // Most recent first
      expect(recent[1].query).toBe('query2');
      expect(recent[2].query).toBe('query1');
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        monitor.trackQuery(`query${i}`, 50, false);
      }

      const recent = monitor.getRecentQueries(5);

      expect(recent.length).toBe(5);
    });

    it('should include query metadata', () => {
      monitor.trackQuery('test query', 45, true, 10);

      const recent = monitor.getRecentQueries(1);

      expect(recent[0].query).toBe('test query');
      expect(recent[0].duration).toBe(45);
      expect(recent[0].cacheHit).toBe(true);
      expect(recent[0].resultCount).toBe(10);
      expect(recent[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Slowest Queries', () => {
    it('should return slowest queries sorted by duration', () => {
      monitor.trackQuery('fast', 10, false);
      monitor.trackQuery('slow', 200, false);
      monitor.trackQuery('medium', 100, false);

      const slowest = monitor.getSlowestQueries(3);

      expect(slowest.length).toBe(3);
      expect(slowest[0].query).toBe('slow'); // Slowest first
      expect(slowest[0].duration).toBe(200);
      expect(slowest[1].query).toBe('medium');
      expect(slowest[2].query).toBe('fast');
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        monitor.trackQuery(`query${i}`, i * 10, false);
      }

      const slowest = monitor.getSlowestQueries(3);

      expect(slowest.length).toBe(3);
      expect(slowest[0].duration).toBe(90); // query9: 9*10
      expect(slowest[1].duration).toBe(80);
      expect(slowest[2].duration).toBe(70);
    });
  });

  describe('Time Window Queries', () => {
    it('should count queries within time window', async () => {
      monitor.trackQuery('query1', 50, false);
      monitor.trackQuery('query2', 100, false);

      // Wait 100ms
      await new Promise(resolve => setTimeout(resolve, 100));

      monitor.trackQuery('query3', 75, false);

      // Count queries in last 50ms (should be 1)
      const recentCount = monitor.getQueryCountByWindow(50);
      expect(recentCount).toBe(1);

      // Count queries in last 200ms (should be 3)
      const allCount = monitor.getQueryCountByWindow(200);
      expect(allCount).toBe(3);
    });

    it('should calculate cache hit rate by time window', async () => {
      monitor.trackQuery('query1', 50, true); // Hit
      monitor.trackQuery('query2', 100, false); // Miss

      await new Promise(resolve => setTimeout(resolve, 100));

      monitor.trackQuery('query3', 75, true); // Hit

      // Last 50ms: 1 query, 1 hit = 100% hit rate
      const recentHitRate = monitor.getCacheHitRateByWindow(50);
      expect(recentHitRate).toBe(1.0);

      // Last 200ms: 3 queries, 2 hits = 66.7% hit rate
      const overallHitRate = monitor.getCacheHitRateByWindow(200);
      expect(overallHitRate).toBeCloseTo(0.667, 2);
    });
  });

  describe('Reset Metrics', () => {
    it('should reset all metrics', () => {
      monitor.trackQuery('query1', 50, false);
      monitor.trackQuery('query2', 100, true);
      monitor.trackIndexBuild(500, 100);

      monitor.reset();

      const metrics = monitor.getMetrics();

      expect(metrics.totalQueries).toBe(0);
      expect(metrics.totalIndexBuilds).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('should reset uptime on reset', () => {
      const before = new Date();

      monitor.reset();

      const after = new Date();
      const metrics = monitor.getMetrics();

      expect(metrics.startTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(metrics.startTime.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(metrics.uptimeMs).toBeLessThan(100); // Should be very close to 0
    });
  });

  describe('Uptime Tracking', () => {
    it('should track uptime in milliseconds', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = monitor.getMetrics();

      expect(metrics.uptimeMs).toBeGreaterThanOrEqual(100);
      expect(metrics.uptimeMs).toBeLessThan(200); // Some buffer for test execution
    });

    it('should export uptime in seconds for Prometheus', async () => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const prometheus = monitor.exportPrometheus();

      expect(prometheus).toMatch(/versatil_docs_uptime_seconds \d+\.\d+/);
    });
  });
});
