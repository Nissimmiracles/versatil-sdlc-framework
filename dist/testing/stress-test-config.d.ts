/**
 * VERSATIL SDLC Framework - Stress Test Configuration
 * Configuration for automatic stress test execution (Rule 2)
 */
export interface StressTestRunnerConfig {
    enabled: boolean;
    blockOnFailure: boolean;
    timeout: number;
    minTestDuration: number;
    maxTestDuration: number;
    logPath: string;
    statusPath: string;
    apiFilePatterns: string[];
    frameworkDetection: FrameworkDetectionConfig;
    testSelection: TestSelectionConfig;
    reporting: ReportingConfig;
}
export interface FrameworkDetectionConfig {
    express: {
        patterns: RegExp[];
        enabled: boolean;
    };
    fastify: {
        patterns: RegExp[];
        enabled: boolean;
    };
    nestjs: {
        patterns: RegExp[];
        enabled: boolean;
    };
    nextjs: {
        pathPatterns: string[];
        enabled: boolean;
    };
}
export interface TestSelectionConfig {
    strategy: 'smart' | 'all' | 'critical-only';
    smartSelection: {
        affectedOnly: boolean;
        includeRelated: boolean;
        maxTests: number;
    };
}
export interface ReportingConfig {
    statusline: boolean;
    logFile: boolean;
    console: boolean;
    metrics: boolean;
}
/**
 * Default configuration
 */
export declare const DEFAULT_CONFIG: StressTestRunnerConfig;
/**
 * Load configuration from environment or file
 */
export declare function loadConfig(): Promise<StressTestRunnerConfig>;
/**
 * Endpoint relationship detection for smart test selection
 */
export interface EndpointRelationship {
    endpoint: string;
    method: string;
    relatedEndpoints: Array<{
        endpoint: string;
        method: string;
        relationship: 'crud-sibling' | 'parent-child' | 'dependency';
    }>;
}
/**
 * Detect related endpoints for smart test selection
 * Example: If POST /api/users changes, also test GET /api/users, GET /api/users/:id
 */
export declare function detectRelatedEndpoints(changedEndpoint: {
    method: string;
    path: string;
}): EndpointRelationship;
/**
 * Severity thresholds for test results
 */
export declare const SEVERITY_THRESHOLDS: {
    errorRate: {
        info: number;
        warning: number;
        medium: number;
        high: number;
        critical: number;
    };
    responseTime: {
        info: number;
        warning: number;
        medium: number;
        high: number;
        critical: number;
    };
    throughput: {
        info: number;
        warning: number;
        medium: number;
        high: number;
        critical: number;
    };
};
