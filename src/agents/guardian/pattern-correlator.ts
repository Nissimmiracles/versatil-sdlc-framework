/**
 * VERSATIL SDLC Framework - Pattern Correlator
 *
 * Analyzes metrics across multiple health checks to detect:
 * - Degradation trends (latency increasing over time)
 * - Metric correlations (memory ↑ → latency ↑ → failures ↑)
 * - Predictive patterns (crash imminent based on trajectory)
 *
 * Enables predictive alerting and proactive remediation before critical failures.
 *
 * @version 7.11.0
 */

import { GuardianLogger } from './guardian-logger.js';
import type { HealthCheckResult, ComponentHealth } from './types.js';

export interface MetricCorrelation {
  metric1: string;
  metric2: string;
  correlation_coefficient: number; // -1 to 1 (1 = perfect positive correlation)
  confidence: number; // 0-100
  sample_size: number;
  relationship: 'positive' | 'negative' | 'none';
  description: string;
}

export interface DegradationTrend {
  component: string;
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  rate_of_change: number; // Percent change per hour
  current_value: number;
  predicted_value_1h: number;
  predicted_value_24h: number;
  threshold_breach_eta_hours?: number; // Hours until threshold breach
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-100
}

export interface PredictiveAlert {
  id: string;
  type: 'threshold_breach' | 'correlation_cascade' | 'degradation_pattern';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  eta_hours: number; // Estimated time until critical failure
  confidence: number; // 0-100
  supporting_evidence: string[];
  recommended_action: string;
  auto_remediable: boolean;
  created_at: string;
}

export interface PatternCorrelationResult {
  correlations: MetricCorrelation[];
  degradation_trends: DegradationTrend[];
  predictive_alerts: PredictiveAlert[];
  analysis_window_hours: number;
  health_checks_analyzed: number;
}

/**
 * Pattern Correlator
 */
export class PatternCorrelator {
  private logger: GuardianLogger;

  constructor() {
    this.logger = GuardianLogger.getInstance();
  }

  /**
   * Analyze health check history for correlations and trends
   */
  public async analyzePatterns(
    healthHistory: HealthCheckResult[]
  ): Promise<PatternCorrelationResult> {
    const startTime = Date.now();

    this.logger.info(`🔍 [Pattern Correlator] Analyzing ${healthHistory.length} health checks`);

    // Ensure we have at least 3 data points
    if (healthHistory.length < 3) {
      this.logger.warn('[Pattern Correlator] Insufficient data for correlation analysis (need ≥3 checks)');
      return {
        correlations: [],
        degradation_trends: [],
        predictive_alerts: [],
        analysis_window_hours: 0,
        health_checks_analyzed: healthHistory.length
      };
    }

    // Step 1: Extract metrics time series
    const metricsSeries = this.extractMetricsTimeSeries(healthHistory);

    // Step 2: Detect metric correlations
    const correlations = this.detectMetricCorrelations(metricsSeries);

    // Step 3: Detect degradation trends
    const degradationTrends = this.detectDegradationTrends(metricsSeries);

    // Step 4: Generate predictive alerts
    const predictiveAlerts = this.generatePredictiveAlerts(
      degradationTrends,
      correlations
    );

    // Step 5: Calculate analysis window
    const oldestCheck = new Date(healthHistory[0].timestamp).getTime();
    const newestCheck = new Date(healthHistory[healthHistory.length - 1].timestamp).getTime();
    const analysisWindowHours = (newestCheck - oldestCheck) / (1000 * 60 * 60);

    const duration = Date.now() - startTime;

    this.logger.info(`✅ [Pattern Correlator] Analysis complete`, {
      correlations: correlations.length,
      degradation_trends: degradationTrends.length,
      predictive_alerts: predictiveAlerts.length,
      analysis_window_hours: Math.round(analysisWindowHours * 10) / 10,
      duration_ms: duration
    });

    return {
      correlations,
      degradation_trends: degradationTrends,
      predictive_alerts: predictiveAlerts,
      analysis_window_hours: Math.round(analysisWindowHours * 10) / 10,
      health_checks_analyzed: healthHistory.length
    };
  }

  /**
   * Extract metrics time series from health history
   */
  private extractMetricsTimeSeries(
    healthHistory: HealthCheckResult[]
  ): Map<string, Array<{ timestamp: number; value: number }>> {
    const series = new Map<string, Array<{ timestamp: number; value: number }>>();

    for (const check of healthHistory) {
      const timestamp = new Date(check.timestamp).getTime();

      // Overall health score
      if (!series.has('overall_health')) {
        series.set('overall_health', []);
      }
      series.get('overall_health')!.push({ timestamp, value: check.overall_health });

      // Component-specific metrics
      for (const [componentName, component] of Object.entries(check.components)) {
        const metricKey = `${componentName}_score`;

        if (!series.has(metricKey)) {
          series.set(metricKey, []);
        }

        series.get(metricKey)!.push({
          timestamp,
          value: component.score
        });

        // Extract additional metrics if available
        if (component.metrics) {
          for (const [metricName, metricValue] of Object.entries(component.metrics)) {
            if (typeof metricValue === 'number') {
              const fullMetricKey = `${componentName}_${metricName}`;

              if (!series.has(fullMetricKey)) {
                series.set(fullMetricKey, []);
              }

              series.get(fullMetricKey)!.push({ timestamp, value: metricValue });
            }
          }
        }
      }
    }

    return series;
  }

  /**
   * Detect metric correlations (e.g., memory ↑ → latency ↑)
   */
  private detectMetricCorrelations(
    metricsSeries: Map<string, Array<{ timestamp: number; value: number }>>
  ): MetricCorrelation[] {
    const correlations: MetricCorrelation[] = [];
    const metricPairs: Array<[string, string]> = [];

    // Generate metric pairs to analyze
    const metrics = Array.from(metricsSeries.keys());
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        metricPairs.push([metrics[i], metrics[j]]);
      }
    }

    // Calculate correlation for each pair
    for (const [metric1, metric2] of metricPairs) {
      const series1 = metricsSeries.get(metric1)!;
      const series2 = metricsSeries.get(metric2)!;

      // Need same length time series
      if (series1.length !== series2.length) {
        continue;
      }

      const correlation = this.calculatePearsonCorrelation(
        series1.map(s => s.value),
        series2.map(s => s.value)
      );

      // Only report significant correlations (|r| ≥ 0.7)
      if (Math.abs(correlation) >= 0.7) {
        const relationship = correlation > 0 ? 'positive' : 'negative';
        const confidence = Math.round(Math.abs(correlation) * 100);

        correlations.push({
          metric1,
          metric2,
          correlation_coefficient: Math.round(correlation * 100) / 100,
          confidence,
          sample_size: series1.length,
          relationship,
          description: this.describeCorrelation(metric1, metric2, relationship)
        });
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient));
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;

    if (n === 0) return 0;

    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;

      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    if (denomX === 0 || denomY === 0) return 0;

    return numerator / Math.sqrt(denomX * denomY);
  }

  /**
   * Describe correlation relationship
   */
  private describeCorrelation(metric1: string, metric2: string, relationship: string): string {
    if (relationship === 'positive') {
      return `${metric1} increases → ${metric2} increases`;
    } else {
      return `${metric1} increases → ${metric2} decreases`;
    }
  }

  /**
   * Detect degradation trends (values changing over time)
   */
  private detectDegradationTrends(
    metricsSeries: Map<string, Array<{ timestamp: number; value: number }>>
  ): DegradationTrend[] {
    const trends: DegradationTrend[] = [];

    for (const [metricKey, series] of metricsSeries.entries()) {
      // Need at least 3 data points for trend analysis
      if (series.length < 3) {
        continue;
      }

      const [component, metric] = metricKey.split('_', 2);

      // Calculate linear regression
      const regression = this.calculateLinearRegression(series);

      // Determine trend direction
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (regression.slope > 0.1) {
        trend = 'increasing';
      } else if (regression.slope < -0.1) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      // Skip stable trends
      if (trend === 'stable') {
        continue;
      }

      // Calculate rate of change (percent per hour)
      const timeSpanHours = (series[series.length - 1].timestamp - series[0].timestamp) / (1000 * 60 * 60);
      const valueChange = series[series.length - 1].value - series[0].value;
      const rateOfChange = timeSpanHours > 0 ? (valueChange / series[0].value * 100) / timeSpanHours : 0;

      // Predict future values
      const currentTime = series[series.length - 1].timestamp;
      const currentValue = series[series.length - 1].value;
      const predicted1h = regression.slope * (currentTime + 3600000) + regression.intercept;
      const predicted24h = regression.slope * (currentTime + 86400000) + regression.intercept;

      // Check for threshold breach (assuming 100 = healthy, 0 = critical)
      let thresholdBreachEtaHours: number | undefined;
      const criticalThreshold = metric.includes('health') || metric.includes('score') ? 70 : undefined;

      if (criticalThreshold && trend === 'decreasing' && currentValue > criticalThreshold) {
        const hoursUntilBreach = (currentValue - criticalThreshold) / Math.abs(rateOfChange);
        thresholdBreachEtaHours = Math.round(hoursUntilBreach * 10) / 10;
      }

      // Determine severity
      let severity: 'critical' | 'high' | 'medium' | 'low';
      if (thresholdBreachEtaHours && thresholdBreachEtaHours < 1) {
        severity = 'critical';
      } else if (Math.abs(rateOfChange) > 10) {
        severity = 'high';
      } else if (Math.abs(rateOfChange) > 5) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      trends.push({
        component: component || 'unknown',
        metric: metric || metricKey,
        trend,
        rate_of_change: Math.round(rateOfChange * 100) / 100,
        current_value: Math.round(currentValue * 10) / 10,
        predicted_value_1h: Math.round(predicted1h * 10) / 10,
        predicted_value_24h: Math.round(predicted24h * 10) / 10,
        threshold_breach_eta_hours: thresholdBreachEtaHours,
        severity,
        confidence: Math.round(regression.r_squared * 100)
      });
    }

    return trends.sort((a, b) => {
      // Sort by severity first, then by rate of change
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return Math.abs(b.rate_of_change) - Math.abs(a.rate_of_change);
    });
  }

  /**
   * Calculate linear regression (least squares)
   */
  private calculateLinearRegression(
    series: Array<{ timestamp: number; value: number }>
  ): { slope: number; intercept: number; r_squared: number } {
    const n = series.length;
    const x = series.map(s => s.timestamp);
    const y = series.map(s => s.value);

    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;

      numerator += diffX * diffY;
      denominator += diffX * diffX;
      ssTotal += diffY * diffY;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Calculate R² (coefficient of determination)
    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      const residual = y[i] - predicted;
      ssResidual += residual * residual;
    }

    const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;

    return {
      slope,
      intercept,
      r_squared: Math.max(0, rSquared) // Ensure non-negative
    };
  }

  /**
   * Generate predictive alerts based on trends and correlations
   */
  private generatePredictiveAlerts(
    degradationTrends: DegradationTrend[],
    correlations: MetricCorrelation[]
  ): PredictiveAlert[] {
    const alerts: PredictiveAlert[] = [];

    // Alert 1: Threshold breach imminent
    for (const trend of degradationTrends) {
      if (trend.threshold_breach_eta_hours && trend.threshold_breach_eta_hours < 24) {
        alerts.push({
          id: `threshold-breach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'threshold_breach',
          title: `${trend.component} ${trend.metric} threshold breach imminent`,
          description: `${trend.component} ${trend.metric} is degrading at ${Math.abs(trend.rate_of_change)}%/h. Critical threshold breach in ${trend.threshold_breach_eta_hours}h.`,
          severity: trend.severity,
          eta_hours: trend.threshold_breach_eta_hours,
          confidence: trend.confidence,
          supporting_evidence: [
            `Current value: ${trend.current_value}`,
            `Rate of change: ${trend.rate_of_change}%/h`,
            `Predicted 1h: ${trend.predicted_value_1h}`,
            `Predicted 24h: ${trend.predicted_value_24h}`
          ],
          recommended_action: this.getRecommendedAction(trend),
          auto_remediable: trend.severity !== 'critical', // Critical requires human review
          created_at: new Date().toISOString()
        });
      }
    }

    // Alert 2: Correlation cascade (one metric affects another)
    for (const correlation of correlations) {
      // Find trends for correlated metrics
      const trend1 = degradationTrends.find(t => `${t.component}_${t.metric}` === correlation.metric1);
      const trend2 = degradationTrends.find(t => `${t.component}_${t.metric}` === correlation.metric2);

      if (trend1 && !trend2 && correlation.relationship === 'positive') {
        // Metric1 is degrading, metric2 will follow due to correlation
        alerts.push({
          id: `correlation-cascade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'correlation_cascade',
          title: `${correlation.metric2} degradation predicted`,
          description: `${correlation.metric1} degradation (${trend1.rate_of_change}%/h) will likely cascade to ${correlation.metric2} due to strong ${correlation.relationship} correlation (${correlation.correlation_coefficient}).`,
          severity: 'high',
          eta_hours: 1, // Assume cascade happens quickly
          confidence: correlation.confidence,
          supporting_evidence: [
            `${correlation.metric1} degrading: ${trend1.rate_of_change}%/h`,
            `Correlation: ${correlation.description}`,
            `Confidence: ${correlation.confidence}%`
          ],
          recommended_action: `Address ${correlation.metric1} degradation to prevent cascade`,
          auto_remediable: false, // Cascades require analysis
          created_at: new Date().toISOString()
        });
      }
    }

    return alerts.sort((a, b) => {
      // Sort by severity, then by ETA
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.eta_hours - b.eta_hours;
    });
  }

  /**
   * Get recommended action for degradation trend
   */
  private getRecommendedAction(trend: DegradationTrend): string {
    if (trend.component === 'rag' && trend.metric.includes('latency')) {
      return 'Restart Neo4j to clear memory, consider increasing Docker memory limits';
    }

    if (trend.component === 'build' && trend.trend === 'increasing') {
      return 'Clear node_modules and rebuild, check for circular dependencies';
    }

    if (trend.component === 'tests' && trend.trend === 'decreasing') {
      return 'Investigate test failures, check for flaky tests';
    }

    if (trend.metric.includes('memory') && trend.trend === 'increasing') {
      return 'Investigate memory leak, restart affected service';
    }

    return `Investigate ${trend.component} ${trend.metric} degradation`;
  }
}
