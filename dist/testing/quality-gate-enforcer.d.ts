/**
 * Quality Gate Enforcer
 * Enforces quality standards before allowing task completion
 *
 * Version: 1.0.0
 * Purpose: Block task completion if quality gates fail
 */
import { TestType } from './test-trigger-matrix.js';
export interface QualityGateConfig {
    minCoverage: number;
    requirePassingTests: boolean;
    requireSecurityScan: boolean;
    requireAccessibilityScan: boolean;
    minAccessibilityScore?: number;
    allowedFailures?: number;
    allowOverride: boolean;
}
export interface TestResult {
    testType: TestType;
    passed: boolean;
    failed: number;
    total: number;
    coverage?: number;
    securityIssues?: number;
    accessibilityScore?: number;
    duration: number;
    errors?: TestError[];
    warnings?: TestWarning[];
}
export interface TestError {
    type: string;
    message: string;
    file?: string;
    line?: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface TestWarning {
    type: string;
    message: string;
    file?: string;
    suggestion?: string;
}
export interface QualityGateResult {
    passed: boolean;
    failures: QualityGateFailure[];
    warnings: QualityGateWarning[];
    metrics: QualityMetrics;
    message: string;
    recommendations: string[];
    blockCompletion: boolean;
}
export interface QualityGateFailure {
    gate: string;
    expected: any;
    actual: any;
    severity: 'critical' | 'high' | 'medium' | 'low';
    impact: string;
    fixSuggestion: string;
}
export interface QualityGateWarning {
    gate: string;
    message: string;
    suggestion: string;
}
export interface QualityMetrics {
    testsPassed: number;
    testsFailed: number;
    testsTotal: number;
    coverage: number;
    accessibilityScore: number;
    securityIssues: number;
    performanceScore: number;
    overallScore: number;
}
export declare class QualityGateEnforcer {
    private readonly DEFAULT_CONFIG;
    /**
     * Enforce quality gates on test results
     */
    enforce(testResults: TestResult[], config?: Partial<QualityGateConfig>): Promise<QualityGateResult>;
    /**
     * Calculate overall quality metrics
     */
    private calculateMetrics;
    /**
     * Check test pass rate
     */
    private checkTestPassRate;
    /**
     * Check code coverage
     */
    private checkCoverage;
    /**
     * Check security scan results
     */
    private checkSecurity;
    /**
     * Check accessibility compliance
     */
    private checkAccessibility;
    /**
     * Helper methods for calculating metrics
     */
    private calculateAverageCoverage;
    private calculateAccessibilityScore;
    private countSecurityIssues;
    private calculatePerformanceScore;
    /**
     * Recommendation generation methods
     */
    private generateTestFailureRecommendations;
    private generateCoverageRecommendations;
    private generateSecurityRecommendations;
    private generateAccessibilityRecommendations;
    /**
     * Generate summary message
     */
    private generateSummaryMessage;
    /**
     * Format quality gate result for display
     */
    formatResult(result: QualityGateResult): string;
}
export default QualityGateEnforcer;
