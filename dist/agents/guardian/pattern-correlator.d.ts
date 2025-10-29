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
import type { HealthCheckResult } from './types.js';
export interface MetricCorrelation {
    metric1: string;
    metric2: string;
    correlation_coefficient: number;
    confidence: number;
    sample_size: number;
    relationship: 'positive' | 'negative' | 'none';
    description: string;
}
export interface DegradationTrend {
    component: string;
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    rate_of_change: number;
    current_value: number;
    predicted_value_1h: number;
    predicted_value_24h: number;
    threshold_breach_eta_hours?: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
}
export interface PredictiveAlert {
    id: string;
    type: 'threshold_breach' | 'correlation_cascade' | 'degradation_pattern';
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    eta_hours: number;
    confidence: number;
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
export declare class PatternCorrelator {
    private logger;
    constructor();
    /**
     * Analyze health check history for correlations and trends
     */
    analyzePatterns(healthHistory: HealthCheckResult[]): Promise<PatternCorrelationResult>;
    /**
     * Extract metrics time series from health history
     */
    private extractMetricsTimeSeries;
    /**
     * Detect metric correlations (e.g., memory ↑ → latency ↑)
     */
    private detectMetricCorrelations;
    /**
     * Calculate Pearson correlation coefficient
     */
    private calculatePearsonCorrelation;
    /**
     * Describe correlation relationship
     */
    private describeCorrelation;
    /**
     * Detect degradation trends (values changing over time)
     */
    private detectDegradationTrends;
    /**
     * Calculate linear regression (least squares)
     */
    private calculateLinearRegression;
    /**
     * Generate predictive alerts based on trends and correlations
     */
    private generatePredictiveAlerts;
    /**
     * Get recommended action for degradation trend
     */
    private getRecommendedAction;
}
