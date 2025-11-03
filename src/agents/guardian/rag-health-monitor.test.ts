/**
 * VERSATIL SDLC Framework - RAG Health Monitor Tests
 * Wave 1 Day 3: Guardian System Testing
 *
 * Test Coverage:
 * - Singleton pattern
 * - Health check execution
 * - GraphRAG health monitoring
 * - Vector Store health monitoring
 * - RAG Router health monitoring
 * - Pattern Search health monitoring
 * - Overall health calculation
 * - Issue detection and creation
 * - Auto-remediation execution
 * - Recommendation generation
 * - Error handling
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RAGHealthMonitor, getRAGHealthMonitor } from './rag-health-monitor.js';
import type { RAGHealthReport, RAGIssue, RAGComponentHealth } from './rag-health-monitor.js';

describe('RAGHealthMonitor', () => {
  let monitor: RAGHealthMonitor;

  beforeEach(() => {
    monitor = RAGHealthMonitor.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RAGHealthMonitor.getInstance();
      const instance2 = RAGHealthMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should return instance via getRAGHealthMonitor', () => {
      const instance1 = getRAGHealthMonitor();
      const instance2 = RAGHealthMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Health Check Execution', () => {
    it('should perform comprehensive health check', async () => {
      const report = await monitor.performHealthCheck();

      expect(report).toBeDefined();
      expect(report).toHaveProperty('overall_health');
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('components');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');

      expect(typeof report.overall_health).toBe('number');
      expect(report.overall_health).toBeGreaterThanOrEqual(0);
      expect(report.overall_health).toBeLessThanOrEqual(100);

      expect(['healthy', 'degraded', 'critical']).toContain(report.status);
    });

    it('should check all RAG components', async () => {
      const report = await monitor.performHealthCheck();

      expect(report.components).toHaveProperty('graphrag');
      expect(report.components).toHaveProperty('vector');
      expect(report.components).toHaveProperty('router');
      expect(report.components).toHaveProperty('pattern_search');
    });

    it('should store last health check result', async () => {
      const report = await monitor.performHealthCheck();
      const lastCheck = monitor.getLastHealthCheck();

      expect(lastCheck).toBe(report);
      expect(lastCheck?.timestamp).toBe(report.timestamp);
    });

    it('should handle health check failures gracefully', async () => {
      // Mock a failure scenario by forcing an error
      // This tests the catch block in performHealthCheck
      const originalMethod = monitor['checkGraphRAGHealth'];
      monitor['checkGraphRAGHealth'] = async () => {
        throw new Error('Simulated health check failure');
      };

      const report = await monitor.performHealthCheck();

      expect(report.overall_health).toBe(0);
      expect(report.status).toBe('critical');
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.recommendations).toContain('Investigate RAG Health Monitor implementation');

      // Restore original method
      monitor['checkGraphRAGHealth'] = originalMethod;
    });
  });

  describe('Component Health Structure', () => {
    it('should return valid GraphRAG health structure', async () => {
      const report = await monitor.performHealthCheck();
      const graphrag = report.components.graphrag;

      expect(graphrag.component).toBe('graphrag');
      expect(typeof graphrag.healthy).toBe('boolean');
      expect(typeof graphrag.latency_ms).toBe('number');
      expect(['operational', 'degraded', 'down', 'unknown']).toContain(graphrag.status);
      expect(graphrag).toHaveProperty('details');
    });

    it('should return valid Vector Store health structure', async () => {
      const report = await monitor.performHealthCheck();
      const vector = report.components.vector;

      expect(vector.component).toBe('vector');
      expect(typeof vector.healthy).toBe('boolean');
      expect(typeof vector.latency_ms).toBe('number');
      expect(['operational', 'degraded', 'down', 'unknown']).toContain(vector.status);
      expect(vector).toHaveProperty('details');
    });

    it('should return valid RAG Router health structure', async () => {
      const report = await monitor.performHealthCheck();
      const router = report.components.router;

      expect(router.component).toBe('router');
      expect(typeof router.healthy).toBe('boolean');
      expect(typeof router.latency_ms).toBe('number');
      expect(['operational', 'degraded', 'down', 'unknown']).toContain(router.status);
      expect(router).toHaveProperty('details');
    });

    it('should return valid Pattern Search health structure', async () => {
      const report = await monitor.performHealthCheck();
      const patternSearch = report.components.pattern_search;

      expect(patternSearch.component).toBe('pattern_search');
      expect(typeof patternSearch.healthy).toBe('boolean');
      expect(typeof patternSearch.latency_ms).toBe('number');
      expect(['operational', 'degraded', 'down', 'unknown']).toContain(patternSearch.status);
      expect(patternSearch).toHaveProperty('details');
    });
  });

  describe('Overall Health Calculation', () => {
    it('should calculate healthy status (80-100%)', async () => {
      const report = await monitor.performHealthCheck();

      // If all components are healthy, status should be 'healthy'
      const allHealthy = Object.values(report.components).every(c => c.healthy);
      if (allHealthy) {
        expect(report.status).toBe('healthy');
        expect(report.overall_health).toBeGreaterThanOrEqual(80);
      }
    });

    it('should calculate health as average of component health', async () => {
      const report = await monitor.performHealthCheck();

      const healthyCount = Object.values(report.components).filter(c => c.healthy).length;
      const totalCount = Object.values(report.components).length;
      const expectedHealth = Math.round((healthyCount / totalCount) * 100);

      expect(report.overall_health).toBe(expectedHealth);
    });
  });

  describe('Issue Detection', () => {
    it('should detect issues for unhealthy components', async () => {
      const report = await monitor.performHealthCheck();

      const unhealthyComponents = Object.values(report.components).filter(c => !c.healthy);

      if (unhealthyComponents.length > 0) {
        expect(report.issues.length).toBe(unhealthyComponents.length);

        report.issues.forEach(issue => {
          expect(issue).toHaveProperty('component');
          expect(issue).toHaveProperty('severity');
          expect(issue).toHaveProperty('description');
          expect(issue).toHaveProperty('confidence');
          expect(issue).toHaveProperty('auto_fix_available');

          expect(['critical', 'high', 'medium', 'low']).toContain(issue.severity);
          expect(issue.confidence).toBeGreaterThanOrEqual(0);
          expect(issue.confidence).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should have no issues when all components are healthy', async () => {
      const report = await monitor.performHealthCheck();

      const allHealthy = Object.values(report.components).every(c => c.healthy);
      if (allHealthy) {
        expect(report.issues.length).toBe(0);
      }
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate recommendations for issues', async () => {
      const report = await monitor.performHealthCheck();

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate "no action needed" when all healthy', async () => {
      const report = await monitor.performHealthCheck();

      const allHealthy = Object.values(report.components).every(c => c.healthy);
      if (allHealthy) {
        expect(report.recommendations).toContain('All RAG components healthy - no action needed');
      }
    });

    it('should generate GraphRAG-specific recommendations', async () => {
      // Create a mock unhealthy GraphRAG issue
      const mockIssue: RAGIssue = {
        component: 'graphrag',
        severity: 'critical',
        description: 'GraphRAG connection failed',
        confidence: 90,
        auto_fix_available: true,
      };

      const recommendations = monitor['generateRecommendations']([mockIssue]);

      expect(recommendations.some(r => r.includes('Neo4j'))).toBe(true);
      expect(recommendations.some(r => r.includes('docker'))).toBe(true);
    });

    it('should generate Vector Store-specific recommendations', async () => {
      const mockIssue: RAGIssue = {
        component: 'vector',
        severity: 'critical',
        description: 'Vector Store connection failed',
        confidence: 88,
        auto_fix_available: true,
      };

      const recommendations = monitor['generateRecommendations']([mockIssue]);

      expect(recommendations.some(r => r.includes('Supabase'))).toBe(true);
    });
  });

  describe('Auto-Remediation', () => {
    it('should have auto-remediation structure', async () => {
      const mockIssue: RAGIssue = {
        component: 'vector',
        severity: 'medium',
        description: 'Vector Store connection lost',
        confidence: 85,
        auto_fix_available: true,
        fix_action: 'Reinitialize Vector Store',
      };

      const result = await monitor.remediateIssue(mockIssue);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('action_taken');
      expect(result).toHaveProperty('component');
      expect(result).toHaveProperty('before_state');
      expect(result).toHaveProperty('after_state');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('duration_ms');
      expect(result).toHaveProperty('learned');

      expect(typeof result.success).toBe('boolean');
      expect(result.component).toBe('vector');
      expect(result.duration_ms).toBeGreaterThan(0);
    });

    it('should handle vector store connection loss', async () => {
      const mockIssue: RAGIssue = {
        component: 'vector',
        severity: 'medium',
        description: 'Vector Store connection lost',
        confidence: 88,
        auto_fix_available: true,
        fix_action: 'Reinitialize Vector Store',
      };

      const result = await monitor.remediateIssue(mockIssue);

      expect(result.action_taken).toContain('Vector Store');
      expect(result.before_state).toContain('Supabase');
    });

    it('should handle router issues', async () => {
      const mockIssue: RAGIssue = {
        component: 'router',
        severity: 'high',
        description: 'RAG Router malfunction',
        confidence: 85,
        auto_fix_available: true,
        fix_action: 'Reinitialize RAG Router',
      };

      const result = await monitor.remediateIssue(mockIssue);

      expect(result.action_taken).toContain('RAG Router');
      expect(result.before_state).toContain('Router');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown component gracefully', async () => {
      const unknownComponent = monitor['createUnknownComponent']('graphrag');

      expect(unknownComponent.component).toBe('graphrag');
      expect(unknownComponent.healthy).toBe(false);
      expect(unknownComponent.status).toBe('unknown');
      expect(unknownComponent.details.error).toBe('Health check failed');
    });

    it('should handle failed component checks', async () => {
      // Force a GraphRAG check failure
      const originalMethod = monitor['checkGraphRAGHealth'];
      monitor['checkGraphRAGHealth'] = async () => {
        throw new Error('GraphRAG connection failed');
      };

      const report = await monitor.performHealthCheck();

      expect(report.status).toBe('critical');
      expect(report.overall_health).toBe(0);

      // Restore
      monitor['checkGraphRAGHealth'] = originalMethod;
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete health check within 5 seconds', async () => {
      const startTime = Date.now();
      await monitor.performHealthCheck();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should track component latency', async () => {
      const report = await monitor.performHealthCheck();

      Object.values(report.components).forEach(component => {
        expect(component.latency_ms).toBeGreaterThanOrEqual(0);
        // Healthy components should be under 1 second
        if (component.healthy && component.component !== 'graphrag') {
          expect(component.latency_ms).toBeLessThan(1000);
        }
      });
    });

    it('should track remediation duration', async () => {
      const mockIssue: RAGIssue = {
        component: 'router',
        severity: 'medium',
        description: 'RAG Router malfunction',
        confidence: 85,
        auto_fix_available: true,
      };

      const result = await monitor.remediateIssue(mockIssue);

      expect(result.duration_ms).toBeGreaterThan(0);
      expect(result.duration_ms).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
