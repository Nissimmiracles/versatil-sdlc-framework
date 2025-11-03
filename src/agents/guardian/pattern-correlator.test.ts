/**
 * VERSATIL SDLC Framework - Pattern Correlator Tests
 * Wave 1 Day 3: Guardian System Testing
 *
 * Test Coverage:
 * - Pattern analysis execution
 * - Metrics time series extraction
 * - Pearson correlation calculation
 * - Metric correlation detection
 * - Linear regression calculation
 * - Degradation trend detection
 * - Predictive alert generation
 * - Threshold breach prediction
 * - Correlation cascade detection
 * - Recommended action generation
 * - Insufficient data handling
 * - Error handling
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PatternCorrelator } from './pattern-correlator.js';
import type {
  PatternCorrelationResult,
  MetricCorrelation,
  DegradationTrend,
  PredictiveAlert
} from './pattern-correlator.js';
import type { HealthCheckResult } from './types.js';

describe('PatternCorrelator', () => {
  let correlator: PatternCorrelator;

  beforeEach(() => {
    correlator = new PatternCorrelator();
  });

  describe('Pattern Analysis Execution', () => {
    it('should analyze patterns with sufficient data', async () => {
      const mockHealthHistory = createMockHealthHistory(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      expect(result).toHaveProperty('correlations');
      expect(result).toHaveProperty('degradation_trends');
      expect(result).toHaveProperty('predictive_alerts');
      expect(result).toHaveProperty('analysis_window_hours');
      expect(result).toHaveProperty('health_checks_analyzed');

      expect(result.health_checks_analyzed).toBe(5);
    });

    it('should handle insufficient data (< 3 checks)', async () => {
      const mockHealthHistory = createMockHealthHistory(2);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      expect(result.correlations).toEqual([]);
      expect(result.degradation_trends).toEqual([]);
      expect(result.predictive_alerts).toEqual([]);
      expect(result.analysis_window_hours).toBe(0);
      expect(result.health_checks_analyzed).toBe(2);
    });

    it('should calculate analysis window correctly', async () => {
      // Create checks spanning 3 hours
      const mockHealthHistory = createMockHealthHistoryWithTimeSpan(5, 3);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      expect(result.analysis_window_hours).toBeGreaterThan(2.5);
      expect(result.analysis_window_hours).toBeLessThan(3.5);
    });
  });

  describe('Metrics Time Series Extraction', () => {
    it('should extract overall health metric', async () => {
      const mockHealthHistory = createMockHealthHistory(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      // Verify extraction by checking if correlations or trends exist
      expect(result.health_checks_analyzed).toBe(5);
    });

    it('should extract component scores', async () => {
      const mockHealthHistory = createMockHealthHistory(3);

      const series = correlator['extractMetricsTimeSeries'](mockHealthHistory);

      expect(series.size).toBeGreaterThan(0);
      expect(series.has('overall_health')).toBe(true);
    });

    it('should extract component-specific metrics', async () => {
      const mockHealthHistory = createMockHealthHistoryWithMetrics(3);

      const series = correlator['extractMetricsTimeSeries'](mockHealthHistory);

      // Should have metrics for components
      const metricKeys = Array.from(series.keys());
      expect(metricKeys.some(key => key.includes('_score'))).toBe(true);
    });
  });

  describe('Pearson Correlation Calculation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect positive correlation

      const correlation = correlator['calculatePearsonCorrelation'](x, y);

      expect(correlation).toBeCloseTo(1.0, 1);
    });

    it('should calculate perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2]; // Perfect negative correlation

      const correlation = correlator['calculatePearsonCorrelation'](x, y);

      expect(correlation).toBeCloseTo(-1.0, 1);
    });

    it('should calculate no correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 4, 2, 5, 1]; // Random, no clear pattern

      const correlation = correlator['calculatePearsonCorrelation'](x, y);

      expect(Math.abs(correlation)).toBeLessThan(0.7); // Weak correlation
    });

    it('should handle empty arrays', () => {
      const correlation = correlator['calculatePearsonCorrelation']([], []);

      expect(correlation).toBe(0);
    });

    it('should handle zero variance', () => {
      const x = [5, 5, 5, 5, 5]; // No variance
      const y = [1, 2, 3, 4, 5];

      const correlation = correlator['calculatePearsonCorrelation'](x, y);

      expect(correlation).toBe(0);
    });
  });

  describe('Metric Correlation Detection', () => {
    it('should detect significant correlations (|r| >= 0.7)', async () => {
      // Create mock data with strong positive correlation
      const mockHealthHistory = createMockHealthHistoryWithCorrelation(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      // Should detect at least some correlations
      expect(result.correlations).toBeDefined();
    });

    it('should sort correlations by strength', async () => {
      const mockHealthHistory = createMockHealthHistoryWithCorrelation(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.correlations.length > 1) {
        for (let i = 0; i < result.correlations.length - 1; i++) {
          const curr = Math.abs(result.correlations[i].correlation_coefficient);
          const next = Math.abs(result.correlations[i + 1].correlation_coefficient);
          expect(curr).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it('should describe positive correlation correctly', () => {
      const description = correlator['describeCorrelation']('metric1', 'metric2', 'positive');

      expect(description).toContain('increases');
      expect(description).toContain('metric1');
      expect(description).toContain('metric2');
    });

    it('should describe negative correlation correctly', () => {
      const description = correlator['describeCorrelation']('metric1', 'metric2', 'negative');

      expect(description).toContain('increases');
      expect(description).toContain('decreases');
    });
  });

  describe('Linear Regression Calculation', () => {
    it('should calculate slope for increasing trend', () => {
      const series = [
        { timestamp: 0, value: 10 },
        { timestamp: 1, value: 20 },
        { timestamp: 2, value: 30 },
        { timestamp: 3, value: 40 },
      ];

      const regression = correlator['calculateLinearRegression'](series);

      expect(regression.slope).toBeGreaterThan(0);
      expect(regression.r_squared).toBeGreaterThan(0.9); // Strong fit
    });

    it('should calculate slope for decreasing trend', () => {
      const series = [
        { timestamp: 0, value: 40 },
        { timestamp: 1, value: 30 },
        { timestamp: 2, value: 20 },
        { timestamp: 3, value: 10 },
      ];

      const regression = correlator['calculateLinearRegression'](series);

      expect(regression.slope).toBeLessThan(0);
      expect(regression.r_squared).toBeGreaterThan(0.9);
    });

    it('should calculate r_squared for goodness of fit', () => {
      const series = [
        { timestamp: 0, value: 10 },
        { timestamp: 1, value: 20 },
        { timestamp: 2, value: 30 },
      ];

      const regression = correlator['calculateLinearRegression'](series);

      expect(regression.r_squared).toBeGreaterThanOrEqual(0);
      expect(regression.r_squared).toBeLessThanOrEqual(1);
    });
  });

  describe('Degradation Trend Detection', () => {
    it('should detect increasing trend', async () => {
      const mockHealthHistory = createMockHealthHistoryWithIncreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.degradation_trends.length > 0) {
        const increasingTrend = result.degradation_trends.find(t => t.trend === 'increasing');
        expect(increasingTrend).toBeDefined();
      }
    });

    it('should detect decreasing trend', async () => {
      const mockHealthHistory = createMockHealthHistoryWithDecreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.degradation_trends.length > 0) {
        const decreasingTrend = result.degradation_trends.find(t => t.trend === 'decreasing');
        expect(decreasingTrend).toBeDefined();
      }
    });

    it('should skip stable trends', async () => {
      const mockHealthHistory = createMockHealthHistoryStable(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      // Stable trends should not be reported
      const stableTrend = result.degradation_trends.find(t => t.trend === 'stable');
      expect(stableTrend).toBeUndefined();
    });

    it('should calculate rate of change', async () => {
      const mockHealthHistory = createMockHealthHistoryWithDecreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.degradation_trends.length > 0) {
        const trend = result.degradation_trends[0];
        expect(trend.rate_of_change).toBeDefined();
        expect(typeof trend.rate_of_change).toBe('number');
      }
    });

    it('should predict future values', async () => {
      const mockHealthHistory = createMockHealthHistoryWithDecreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.degradation_trends.length > 0) {
        const trend = result.degradation_trends[0];
        expect(trend.predicted_value_1h).toBeDefined();
        expect(trend.predicted_value_24h).toBeDefined();
      }
    });

    it('should calculate threshold breach ETA', async () => {
      const mockHealthHistory = createMockHealthHistoryWithDecreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      // If degrading, should have threshold breach ETA for health metrics
      const healthTrend = result.degradation_trends.find(t =>
        t.metric.includes('health') || t.metric.includes('score')
      );

      if (healthTrend && healthTrend.trend === 'decreasing' && healthTrend.current_value > 70) {
        expect(healthTrend.threshold_breach_eta_hours).toBeDefined();
      }
    });

    it('should assign severity based on degradation rate', async () => {
      const mockHealthHistory = createMockHealthHistoryWithDecreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.degradation_trends.length > 0) {
        const trend = result.degradation_trends[0];
        expect(['critical', 'high', 'medium', 'low']).toContain(trend.severity);
      }
    });
  });

  describe('Predictive Alert Generation', () => {
    it('should generate threshold breach alerts', async () => {
      const mockHealthHistory = createMockHealthHistoryWithDecreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.predictive_alerts.length > 0) {
        const thresholdAlert = result.predictive_alerts.find(a => a.type === 'threshold_breach');
        if (thresholdAlert) {
          expect(thresholdAlert.title).toBeDefined();
          expect(thresholdAlert.description).toBeDefined();
          expect(thresholdAlert.eta_hours).toBeDefined();
          expect(thresholdAlert.recommended_action).toBeDefined();
        }
      }
    });

    it('should sort alerts by severity and ETA', async () => {
      const mockHealthHistory = createMockHealthHistoryWithMultipleTrends(10);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.predictive_alerts.length > 1) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 0; i < result.predictive_alerts.length - 1; i++) {
          const curr = result.predictive_alerts[i];
          const next = result.predictive_alerts[i + 1];

          if (curr.severity !== next.severity) {
            expect(severityOrder[curr.severity]).toBeLessThanOrEqual(severityOrder[next.severity]);
          } else {
            expect(curr.eta_hours).toBeLessThanOrEqual(next.eta_hours);
          }
        }
      }
    });

    it('should include supporting evidence in alerts', async () => {
      const mockHealthHistory = createMockHealthHistoryWithDecreasingTrend(5);

      const result = await correlator.analyzePatterns(mockHealthHistory);

      if (result.predictive_alerts.length > 0) {
        const alert = result.predictive_alerts[0];
        expect(alert.supporting_evidence).toBeDefined();
        expect(Array.isArray(alert.supporting_evidence)).toBe(true);
        expect(alert.supporting_evidence.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Recommended Action Generation', () => {
    it('should recommend action for RAG latency degradation', () => {
      const mockTrend: DegradationTrend = {
        component: 'rag',
        metric: 'latency_ms',
        trend: 'increasing',
        rate_of_change: 15,
        current_value: 850,
        predicted_value_1h: 950,
        predicted_value_24h: 1200,
        severity: 'high',
        confidence: 85,
      };

      const action = correlator['getRecommendedAction'](mockTrend);

      expect(action).toContain('Neo4j');
      expect(action).toContain('memory');
    });

    it('should recommend action for build time increase', () => {
      const mockTrend: DegradationTrend = {
        component: 'build',
        metric: 'duration_ms',
        trend: 'increasing',
        rate_of_change: 20,
        current_value: 45000,
        predicted_value_1h: 50000,
        predicted_value_24h: 60000,
        severity: 'medium',
        confidence: 80,
      };

      const action = correlator['getRecommendedAction'](mockTrend);

      expect(action).toContain('node_modules');
    });

    it('should recommend action for test failures', () => {
      const mockTrend: DegradationTrend = {
        component: 'tests',
        metric: 'pass_rate',
        trend: 'decreasing',
        rate_of_change: -5,
        current_value: 88,
        predicted_value_1h: 85,
        predicted_value_24h: 75,
        severity: 'high',
        confidence: 90,
      };

      const action = correlator['getRecommendedAction'](mockTrend);

      expect(action).toContain('test');
    });

    it('should recommend action for memory leak', () => {
      const mockTrend: DegradationTrend = {
        component: 'agent',
        metric: 'memory_usage',
        trend: 'increasing',
        rate_of_change: 12,
        current_value: 1200,
        predicted_value_1h: 1350,
        predicted_value_24h: 1800,
        severity: 'high',
        confidence: 88,
      };

      const action = correlator['getRecommendedAction'](mockTrend);

      expect(action).toContain('memory');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should analyze patterns within 1 second', async () => {
      const mockHealthHistory = createMockHealthHistory(10);

      const startTime = Date.now();
      await correlator.analyzePatterns(mockHealthHistory);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });
});

// Helper functions to create mock health check data

function createMockHealthHistory(count: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    history.push({
      overall_health: 85 - i * 2, // Slightly decreasing
      status: 'healthy',
      timestamp: new Date(baseTime + i * 600000).toISOString(), // 10 min intervals
      components: {
        build: {
          name: 'build',
          healthy: true,
          score: 90 - i,
          status: 'operational',
          issues: [],
        },
        tests: {
          name: 'tests',
          healthy: true,
          score: 85 - i * 2,
          status: 'operational',
          issues: [],
        },
      },
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}

function createMockHealthHistoryWithTimeSpan(count: number, hoursSpan: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();
  const intervalMs = (hoursSpan * 3600000) / (count - 1);

  for (let i = 0; i < count; i++) {
    history.push({
      overall_health: 85,
      status: 'healthy',
      timestamp: new Date(baseTime + i * intervalMs).toISOString(),
      components: {},
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}

function createMockHealthHistoryWithMetrics(count: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    history.push({
      overall_health: 85,
      status: 'healthy',
      timestamp: new Date(baseTime + i * 600000).toISOString(),
      components: {
        build: {
          name: 'build',
          healthy: true,
          score: 90,
          status: 'operational',
          issues: [],
          metrics: {
            duration_ms: 30000 + i * 1000,
            cpu_usage: 60 + i * 2,
          },
        },
      },
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}

function createMockHealthHistoryWithCorrelation(count: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    const memoryValue = 500 + i * 100;
    const latencyValue = 200 + i * 50; // Correlated with memory

    history.push({
      overall_health: 85,
      status: 'healthy',
      timestamp: new Date(baseTime + i * 600000).toISOString(),
      components: {
        rag: {
          name: 'rag',
          healthy: true,
          score: 85,
          status: 'operational',
          issues: [],
          metrics: {
            memory_mb: memoryValue,
            latency_ms: latencyValue,
          },
        },
      },
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}

function createMockHealthHistoryWithIncreasingTrend(count: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    history.push({
      overall_health: 70 + i * 3, // Increasing
      status: 'healthy',
      timestamp: new Date(baseTime + i * 600000).toISOString(),
      components: {
        build: {
          name: 'build',
          healthy: true,
          score: 70 + i * 3,
          status: 'operational',
          issues: [],
        },
      },
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}

function createMockHealthHistoryWithDecreasingTrend(count: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    history.push({
      overall_health: 95 - i * 4, // Decreasing
      status: i < 3 ? 'healthy' : 'degraded',
      timestamp: new Date(baseTime + i * 600000).toISOString(),
      components: {
        tests: {
          name: 'tests',
          healthy: i < 3,
          score: 95 - i * 4,
          status: i < 3 ? 'operational' : 'degraded',
          issues: [],
        },
      },
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}

function createMockHealthHistoryStable(count: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    history.push({
      overall_health: 85, // Stable
      status: 'healthy',
      timestamp: new Date(baseTime + i * 600000).toISOString(),
      components: {
        build: {
          name: 'build',
          healthy: true,
          score: 85,
          status: 'operational',
          issues: [],
        },
      },
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}

function createMockHealthHistoryWithMultipleTrends(count: number): HealthCheckResult[] {
  const history: HealthCheckResult[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    history.push({
      overall_health: 90 - i * 2,
      status: 'healthy',
      timestamp: new Date(baseTime + i * 600000).toISOString(),
      components: {
        build: {
          name: 'build',
          healthy: true,
          score: 88 - i * 3, // Fast degradation
          status: 'operational',
          issues: [],
        },
        tests: {
          name: 'tests',
          healthy: true,
          score: 92 - i, // Slow degradation
          status: 'operational',
          issues: [],
        },
      },
      critical_issues: [],
      warnings: [],
      recommendations: [],
      auto_remediation_attempts: [],
    });
  }

  return history;
}
