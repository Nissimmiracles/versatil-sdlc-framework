/**
 * VERSATIL SDLC Framework - Update Validator
 * Post-update validation and health checks
 */
export interface ValidationResult {
    passed: boolean;
    score: number;
    checks: ValidationCheck[];
    errors: string[];
    warnings: string[];
    recommendations: string[];
}
export interface ValidationCheck {
    category: string;
    name: string;
    passed: boolean;
    score: number;
    message: string;
    details?: string;
    critical: boolean;
}
export interface PerformanceMetrics {
    startupTime: number;
    memoryUsage: number;
    commandResponseTime: number;
    fileAccessTime: number;
}
export interface PerformanceComparison {
    before: PerformanceMetrics;
    after: PerformanceMetrics;
    improvements: string[];
    regressions: string[];
}
export interface FeatureStatus {
    feature: string;
    working: boolean;
    message: string;
}
export declare class UpdateValidator {
    private versatilHome;
    constructor();
    /**
     * Run complete post-update validation
     */
    validatePostUpdate(): Promise<ValidationResult>;
    /**
     * Run health checks
     */
    runHealthChecks(): Promise<ValidationCheck[]>;
    /**
     * Compare performance before/after update
     */
    comparePerformance(before: PerformanceMetrics, after: PerformanceMetrics): Promise<PerformanceComparison>;
    /**
     * Verify all features still work
     */
    verifyFeatures(): Promise<FeatureStatus[]>;
    /**
     * Check framework integrity
     */
    private checkFrameworkIntegrity;
    /**
     * Check command availability
     */
    private checkCommandAvailability;
    /**
     * Check agent configurations
     */
    private checkAgentConfigurations;
    /**
     * Check dependency resolution
     */
    private checkDependencyResolution;
    /**
     * Check file permissions
     */
    private checkFilePermissions;
    /**
     * Check configuration validity
     */
    private checkConfigurationValidity;
    /**
     * Check isolation integrity
     */
    private checkIsolationIntegrity;
    /**
     * Check memory system
     */
    private checkMemorySystem;
    /**
     * Test feature availability
     */
    private testFeature;
    /**
     * Generate recommendations based on checks
     */
    private generateRecommendations;
    /**
     * Measure performance metrics
     */
    measurePerformance(): Promise<PerformanceMetrics>;
}
/**
 * Default validator instance
 */
export declare const defaultUpdateValidator: UpdateValidator;
