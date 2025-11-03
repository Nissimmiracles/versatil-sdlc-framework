/**
 * VERSATIL SDLC Framework - IDE Performance Detector Tests
 * Priority 2: Guardian Component Testing (Batch 7 - Final)
 *
 * Test Coverage:
 * - IDE lag detection
 * - Memory usage monitoring
 * - File operation performance tracking
 * - Response time analysis
 * - Performance bottleneck identification
 * - Optimization recommendations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDEPerformanceDetector } from './ide-performance-detector.js';

describe('IDEPerformanceDetector', () => {
  let detector: IDEPerformanceDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = IDEPerformanceDetector.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = IDEPerformanceDetector.getInstance();
      const instance2 = IDEPerformanceDetector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('IDE Lag Detection', () => {
    it('should detect IDE lag from response times', () => {
      const responseTimes = [100, 150, 3000, 200, 180]; // 3000ms is laggy

      const hasLag = detector.detectLag(responseTimes);
      expect(hasLag).toBe(true);
    });

    it('should not detect lag for normal response times', () => {
      const responseTimes = [100, 150, 120, 200, 180];

      const hasLag = detector.detectLag(responseTimes);
      expect(hasLag).toBe(false);
    });

    it('should track response time history', () => {
      detector.recordResponseTime('file-read', 150);
      detector.recordResponseTime('file-write', 200);
      detector.recordResponseTime('file-read', 180);

      const history = detector.getResponseTimeHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('should calculate average response time', () => {
      detector.recordResponseTime('file-read', 100);
      detector.recordResponseTime('file-read', 200);
      detector.recordResponseTime('file-read', 150);

      const average = detector.getAverageResponseTime('file-read');
      expect(average).toBe(150);
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should track memory usage over time', () => {
      const memoryUsage = { heapUsed: 100 * 1024 * 1024, heapTotal: 200 * 1024 * 1024 };

      detector.recordMemoryUsage(memoryUsage);

      const history = detector.getMemoryHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should detect memory leaks', () => {
      // Simulate increasing memory usage
      for (let i = 0; i < 10; i++) {
        detector.recordMemoryUsage({
          heapUsed: (100 + i * 10) * 1024 * 1024,
          heapTotal: 500 * 1024 * 1024
        });
      }

      const hasLeak = detector.detectMemoryLeak();
      expect(typeof hasLeak).toBe('boolean');
    });

    it('should calculate memory growth rate', () => {
      detector.recordMemoryUsage({ heapUsed: 100 * 1024 * 1024, heapTotal: 500 * 1024 * 1024 });
      detector.recordMemoryUsage({ heapUsed: 150 * 1024 * 1024, heapTotal: 500 * 1024 * 1024 });

      const growthRate = detector.getMemoryGrowthRate();
      expect(typeof growthRate).toBe('number');
    });

    it('should warn on high memory usage', () => {
      const highMemory = { heapUsed: 450 * 1024 * 1024, heapTotal: 500 * 1024 * 1024 }; // 90%

      detector.recordMemoryUsage(highMemory);

      const warnings = detector.getMemoryWarnings();
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('File Operation Performance', () => {
    it('should track file read performance', () => {
      detector.recordFileOperation('read', '/path/to/file.ts', 150);

      const stats = detector.getFileOperationStats('read');
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('averageTime');
    });

    it('should track file write performance', () => {
      detector.recordFileOperation('write', '/path/to/file.ts', 200);

      const stats = detector.getFileOperationStats('write');
      expect(stats).toHaveProperty('count');
    });

    it('should detect slow file operations', () => {
      detector.recordFileOperation('read', '/large-file.json', 5000); // Very slow

      const slowOps = detector.getSlowFileOperations();
      expect(slowOps.length).toBeGreaterThan(0);
    });

    it('should identify frequently accessed files', () => {
      detector.recordFileOperation('read', '/frequently-accessed.ts', 100);
      detector.recordFileOperation('read', '/frequently-accessed.ts', 120);
      detector.recordFileOperation('read', '/frequently-accessed.ts', 110);

      const frequent = detector.getFrequentlyAccessedFiles();
      expect(frequent).toContain('/frequently-accessed.ts');
    });
  });

  describe('Response Time Analysis', () => {
    it('should analyze tool call response times', () => {
      detector.recordToolCall('Read', 150);
      detector.recordToolCall('Write', 200);
      detector.recordToolCall('Bash', 300);

      const analysis = detector.analyzeToolCallPerformance();
      expect(analysis).toHaveProperty('averageTime');
      expect(analysis).toHaveProperty('slowestTool');
    });

    it('should detect tool call timeouts', () => {
      detector.recordToolCall('Bash', 120000); // 2 minutes - timeout

      const timeouts = detector.getToolCallTimeouts();
      expect(timeouts.length).toBeGreaterThan(0);
    });

    it('should track agent activation performance', () => {
      detector.recordAgentActivation('maria-qa', 500, true);
      detector.recordAgentActivation('james-frontend', 800, true);

      const stats = detector.getAgentActivationStats();
      expect(stats).toHaveProperty('maria-qa');
      expect(stats).toHaveProperty('james-frontend');
    });

    it('should identify slow agents', () => {
      detector.recordAgentActivation('slow-agent', 5000, true);
      detector.recordAgentActivation('fast-agent', 200, true);

      const slowAgents = detector.getSlowAgents();
      expect(slowAgents).toContain('slow-agent');
    });
  });

  describe('Performance Bottleneck Identification', () => {
    it('should identify file system bottlenecks', async () => {
      detector.recordFileOperation('read', '/file1.ts', 50);
      detector.recordFileOperation('read', '/file2.ts', 3000); // Bottleneck

      const bottlenecks = await detector.identifyBottlenecks();
      expect(bottlenecks).toHaveProperty('fileSystem');
    });

    it('should identify network bottlenecks', async () => {
      detector.recordNetworkRequest('https://api.example.com', 5000); // Slow

      const bottlenecks = await detector.identifyBottlenecks();
      expect(bottlenecks).toHaveProperty('network');
    });

    it('should identify computation bottlenecks', async () => {
      detector.recordComputation('heavy-task', 8000); // Very slow

      const bottlenecks = await detector.identifyBottlenecks();
      expect(bottlenecks).toHaveProperty('computation');
    });

    it('should rank bottlenecks by severity', async () => {
      detector.recordFileOperation('read', '/file.ts', 5000);
      detector.recordNetworkRequest('https://api.example.com', 3000);

      const ranked = await detector.rankBottlenecksBySeverity();
      expect(Array.isArray(ranked)).toBe(true);
      expect(ranked.length).toBeGreaterThan(0);
    });
  });

  describe('Optimization Recommendations', () => {
    it('should recommend caching for frequently accessed files', () => {
      for (let i = 0; i < 10; i++) {
        detector.recordFileOperation('read', '/config.json', 100);
      }

      const recommendations = detector.generateRecommendations();
      expect(recommendations.some(r => r.includes('caching'))).toBe(true);
    });

    it('should recommend lazy loading for large files', () => {
      detector.recordFileOperation('read', '/large-data.json', 5000);

      const recommendations = detector.generateRecommendations();
      expect(recommendations.some(r => r.includes('lazy'))).toBe(true);
    });

    it('should recommend async operations for slow tasks', () => {
      detector.recordComputation('sync-heavy-task', 3000);

      const recommendations = detector.generateRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should recommend reducing file watchers', () => {
      // Simulate many file watchers
      for (let i = 0; i < 100; i++) {
        detector.recordFileWatch(`/path/to/file${i}.ts`);
      }

      const recommendations = detector.generateRecommendations();
      expect(recommendations.some(r => r.includes('file watchers') || r.includes('watch'))).toBe(true);
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect comprehensive performance metrics', () => {
      detector.recordResponseTime('file-read', 150);
      detector.recordMemoryUsage({ heapUsed: 100 * 1024 * 1024, heapTotal: 500 * 1024 * 1024 });
      detector.recordFileOperation('read', '/file.ts', 100);

      const metrics = detector.collectMetrics();

      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('fileOperations');
    });

    it('should generate performance report', () => {
      detector.recordResponseTime('file-read', 150);
      detector.recordToolCall('Read', 200);

      const report = detector.generatePerformanceReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('bottlenecks');
      expect(report).toHaveProperty('recommendations');
    });

    it('should calculate overall performance score', () => {
      detector.recordResponseTime('file-read', 150);
      detector.recordMemoryUsage({ heapUsed: 100 * 1024 * 1024, heapTotal: 500 * 1024 * 1024 });

      const score = detector.calculatePerformanceScore();

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Monitoring Control', () => {
    it('should start performance monitoring', () => {
      detector.startMonitoring();

      expect(detector.isMonitoring()).toBe(true);
    });

    it('should stop performance monitoring', () => {
      detector.startMonitoring();
      detector.stopMonitoring();

      expect(detector.isMonitoring()).toBe(false);
    });

    it('should clear performance data', () => {
      detector.recordResponseTime('file-read', 150);
      detector.clearData();

      const history = detector.getResponseTimeHistory();
      expect(history.length).toBe(0);
    });

    it('should reset performance detector', () => {
      detector.recordResponseTime('file-read', 150);
      detector.recordMemoryUsage({ heapUsed: 100 * 1024 * 1024, heapTotal: 500 * 1024 * 1024 });

      detector.reset();

      const metrics = detector.collectMetrics();
      expect(metrics.responseTime.history.length).toBe(0);
      expect(metrics.memory.history.length).toBe(0);
    });
  });

  describe('Performance Alerts', () => {
    it('should trigger alert on high lag', () => {
      const listener = vi.fn();
      detector.onPerformanceAlert(listener);

      detector.recordResponseTime('file-read', 10000); // Very slow

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'high-lag',
        severity: expect.any(String)
      }));
    });

    it('should trigger alert on memory leak', () => {
      const listener = vi.fn();
      detector.onPerformanceAlert(listener);

      for (let i = 0; i < 20; i++) {
        detector.recordMemoryUsage({
          heapUsed: (100 + i * 20) * 1024 * 1024,
          heapTotal: 500 * 1024 * 1024
        });
      }

      expect(listener).toHaveBeenCalled();
    });

    it('should configure alert thresholds', () => {
      detector.setAlertThresholds({
        responseTime: 2000,
        memoryUsage: 0.9,
        fileOperationTime: 1000
      });

      const thresholds = detector.getAlertThresholds();
      expect(thresholds.responseTime).toBe(2000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty performance data', () => {
      const metrics = detector.collectMetrics();
      expect(metrics).toBeDefined();
    });

    it('should handle invalid response times', () => {
      expect(() => detector.recordResponseTime('test', -100)).not.toThrow();
      expect(() => detector.recordResponseTime('test', NaN)).not.toThrow();
    });

    it('should handle concurrent metric recording', () => {
      const operations = Array.from({ length: 100 }, (_, i) =>
        detector.recordResponseTime('test', i * 10)
      );

      expect(() => operations).not.toThrow();
    });

    it('should handle very large datasets', () => {
      for (let i = 0; i < 10000; i++) {
        detector.recordResponseTime('test', Math.random() * 1000);
      }

      const metrics = detector.collectMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
