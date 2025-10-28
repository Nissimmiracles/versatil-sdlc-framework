/**
 * Network Request Tracker
 *
 * Advanced network request monitoring for frontend testing.
 * Tracks, analyzes, and reports on HTTP requests and responses.
 *
 * Features:
 * - Real-time request/response tracking
 * - Failed request detection
 * - Slow request identification
 * - Large payload warnings
 * - API endpoint grouping
 * - Performance metrics
 * - Request timing analysis
 *
 * @module agents/opera/maria-qa/network-request-tracker
 * @version 6.2.0
 */
import { Page } from 'playwright';
/**
 * Network request interface
 */
export interface NetworkRequest {
    id: string;
    timestamp: Date;
    url: string;
    method: string;
    headers: Record<string, string>;
    postData?: string;
    resourceType: string;
}
/**
 * Network response interface
 */
export interface NetworkResponse {
    id: string;
    timestamp: Date;
    url: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    timing: {
        startTime: number;
        responseEnd: number;
        duration: number;
    };
    size: number;
    fromCache: boolean;
}
/**
 * Failed request interface
 */
export interface FailedRequest {
    url: string;
    method: string;
    error: string;
    timestamp: Date;
}
/**
 * Slow request interface
 */
export interface SlowRequest {
    url: string;
    method: string;
    duration: number;
    threshold: number;
    timestamp: Date;
}
/**
 * Large payload interface
 */
export interface LargePayload {
    url: string;
    method: string;
    size: number;
    threshold: number;
    timestamp: Date;
}
/**
 * API endpoint grouping
 */
export interface APIEndpointGroup {
    endpoint: string;
    count: number;
    methods: string[];
    averageResponseTime: number;
    successRate: number;
    failureCount: number;
}
/**
 * Network analysis result
 */
export interface NetworkAnalysis {
    totalRequests: number;
    totalResponses: number;
    failedRequests: FailedRequest[];
    slowRequests: SlowRequest[];
    largePayloads: LargePayload[];
    apiEndpoints: APIEndpointGroup[];
    performanceMetrics: {
        averageResponseTime: number;
        medianResponseTime: number;
        p95ResponseTime: number;
        successRate: number;
        totalDataTransferred: number;
    };
    requestsByMethod: Record<string, number>;
    requestsByStatus: Record<number, number>;
    cacheHitRate: number;
    summary: string;
}
/**
 * Tracker configuration
 */
export interface TrackerConfig {
    slowRequestThreshold: number;
    largePayloadThreshold: number;
    trackCaching: boolean;
    groupByEndpoint: boolean;
}
/**
 * Network Request Tracker
 *
 * Monitors and analyzes network requests during frontend testing.
 */
export declare class NetworkRequestTracker {
    private logger;
    private requests;
    private responses;
    private failures;
    private isTracking;
    private requestIdCounter;
    private config;
    constructor(config?: Partial<TrackerConfig>);
    /**
     * Start tracking network requests on a Playwright page
     */
    startTracking(page: Page): Promise<void>;
    /**
     * Stop tracking and return analysis
     */
    stopTracking(): Promise<NetworkAnalysis>;
    /**
     * Get current tracking status
     */
    getStatus(): {
        isTracking: boolean;
        requestCount: number;
        responseCount: number;
        failureCount: number;
    };
    /**
     * Clear all tracked data
     */
    clearData(): void;
    /**
     * Capture outgoing request
     */
    private captureRequest;
    /**
     * Capture response
     */
    private captureResponse;
    /**
     * Capture request failure
     */
    private captureFailure;
    /**
     * Generate comprehensive network analysis
     */
    private generateAnalysis;
    /**
     * Group responses by API endpoint
     */
    private groupByEndpoint;
    /**
     * Extract endpoint from URL
     */
    private extractEndpoint;
    /**
     * Calculate performance metrics
     */
    private calculatePerformanceMetrics;
    /**
     * Count requests by method
     */
    private countByMethod;
    /**
     * Count requests by status code
     */
    private countByStatus;
    /**
     * Calculate cache hit rate
     */
    private calculateCacheHitRate;
    /**
     * Generate summary text
     */
    private generateSummary;
    /**
     * Get empty analysis (when tracking not active)
     */
    private getEmptyAnalysis;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
}
/**
 * Get singleton instance
 */
export declare function getNetworkRequestTracker(config?: Partial<TrackerConfig>): NetworkRequestTracker;
/**
 * Reset singleton (for testing)
 */
export declare function resetNetworkRequestTracker(): void;
