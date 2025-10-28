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
import { VERSATILLogger } from '../../../utils/logger.js';
/**
 * Network Request Tracker
 *
 * Monitors and analyzes network requests during frontend testing.
 */
export class NetworkRequestTracker {
    constructor(config) {
        this.requests = new Map();
        this.responses = new Map();
        this.failures = [];
        this.isTracking = false;
        this.requestIdCounter = 0;
        this.logger = new VERSATILLogger('NetworkRequestTracker');
        this.config = {
            slowRequestThreshold: config?.slowRequestThreshold || 1000, // 1 second
            largePayloadThreshold: config?.largePayloadThreshold || 500000, // 500KB
            trackCaching: config?.trackCaching ?? true,
            groupByEndpoint: config?.groupByEndpoint ?? true,
        };
    }
    /**
     * Start tracking network requests on a Playwright page
     */
    async startTracking(page) {
        if (this.isTracking) {
            this.logger.warn('Network tracking already active');
            return;
        }
        this.logger.info('Starting network request tracking');
        this.isTracking = true;
        this.requests.clear();
        this.responses.clear();
        this.failures = [];
        this.requestIdCounter = 0;
        // Track requests
        page.on('request', (request) => {
            this.captureRequest(request);
        });
        // Track responses
        page.on('response', async (response) => {
            await this.captureResponse(response);
        });
        // Track request failures
        page.on('requestfailed', (request) => {
            this.captureFailure(request);
        });
        this.logger.debug('Network tracking listeners attached');
    }
    /**
     * Stop tracking and return analysis
     */
    async stopTracking() {
        if (!this.isTracking) {
            this.logger.warn('Network tracking not active');
            return this.getEmptyAnalysis();
        }
        this.logger.info('Stopping network request tracking', {
            totalRequests: this.requests.size,
            totalResponses: this.responses.size,
            failures: this.failures.length,
        });
        this.isTracking = false;
        return this.generateAnalysis();
    }
    /**
     * Get current tracking status
     */
    getStatus() {
        return {
            isTracking: this.isTracking,
            requestCount: this.requests.size,
            responseCount: this.responses.size,
            failureCount: this.failures.length,
        };
    }
    /**
     * Clear all tracked data
     */
    clearData() {
        this.requests.clear();
        this.responses.clear();
        this.failures = [];
        this.requestIdCounter = 0;
        this.logger.debug('Cleared all tracked network data');
    }
    /**
     * Capture outgoing request
     */
    captureRequest(request) {
        const id = this.generateRequestId();
        const networkRequest = {
            id,
            timestamp: new Date(),
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData() || undefined,
            resourceType: request.resourceType(),
        };
        this.requests.set(request.url(), networkRequest);
        this.logger.debug('Captured request', {
            method: networkRequest.method,
            url: networkRequest.url,
            type: networkRequest.resourceType,
        });
    }
    /**
     * Capture response
     */
    async captureResponse(response) {
        const timing = response.request().timing();
        const id = this.generateRequestId();
        const networkResponse = {
            id,
            timestamp: new Date(),
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            timing: {
                startTime: timing?.startTime || 0,
                responseEnd: timing?.responseEnd || 0,
                duration: timing?.responseEnd
                    ? timing.responseEnd - timing.startTime
                    : 0,
            },
            size: parseInt(response.headers()['content-length'] || '0', 10),
            fromCache: response.fromServiceWorker(),
        };
        this.responses.set(response.url(), networkResponse);
        this.logger.debug('Captured response', {
            status: networkResponse.status,
            url: networkResponse.url,
            duration: networkResponse.timing.duration.toFixed(2) + 'ms',
            cached: networkResponse.fromCache,
        });
    }
    /**
     * Capture request failure
     */
    captureFailure(request) {
        const failure = {
            url: request.url(),
            method: request.method(),
            error: request.failure()?.errorText || 'Unknown error',
            timestamp: new Date(),
        };
        this.failures.push(failure);
        this.logger.debug('Captured request failure', {
            url: failure.url,
            error: failure.error,
        });
    }
    /**
     * Generate comprehensive network analysis
     */
    generateAnalysis() {
        const responsesArray = Array.from(this.responses.values());
        // Identify slow requests
        const slowRequests = responsesArray
            .filter((response) => response.timing.duration > this.config.slowRequestThreshold)
            .map((response) => ({
            url: response.url,
            method: this.requests.get(response.url)?.method || 'GET',
            duration: response.timing.duration,
            threshold: this.config.slowRequestThreshold,
            timestamp: response.timestamp,
        }));
        // Identify large payloads
        const largePayloads = responsesArray
            .filter((response) => response.size > this.config.largePayloadThreshold)
            .map((response) => ({
            url: response.url,
            method: this.requests.get(response.url)?.method || 'GET',
            size: response.size,
            threshold: this.config.largePayloadThreshold,
            timestamp: response.timestamp,
        }));
        // Group by API endpoint
        const apiEndpoints = this.config.groupByEndpoint
            ? this.groupByEndpoint(responsesArray)
            : [];
        // Calculate performance metrics
        const performanceMetrics = this.calculatePerformanceMetrics(responsesArray);
        // Count by method
        const requestsByMethod = this.countByMethod();
        // Count by status
        const requestsByStatus = this.countByStatus(responsesArray);
        // Calculate cache hit rate
        const cacheHitRate = this.calculateCacheHitRate(responsesArray);
        // Generate summary
        const summary = this.generateSummary({
            totalRequests: this.requests.size,
            failedCount: this.failures.length,
            slowCount: slowRequests.length,
            largePayloadCount: largePayloads.length,
            averageResponseTime: performanceMetrics.averageResponseTime,
            successRate: performanceMetrics.successRate,
        });
        return {
            totalRequests: this.requests.size,
            totalResponses: this.responses.size,
            failedRequests: this.failures,
            slowRequests,
            largePayloads,
            apiEndpoints,
            performanceMetrics,
            requestsByMethod,
            requestsByStatus,
            cacheHitRate,
            summary,
        };
    }
    /**
     * Group responses by API endpoint
     */
    groupByEndpoint(responses) {
        const groups = new Map();
        responses.forEach((response) => {
            // Extract endpoint (remove query parameters and hashes)
            const endpoint = this.extractEndpoint(response.url);
            const method = this.requests.get(response.url)?.method || 'GET';
            if (!groups.has(endpoint)) {
                groups.set(endpoint, {
                    endpoint,
                    count: 0,
                    methods: [],
                    averageResponseTime: 0,
                    successRate: 0,
                    failureCount: 0,
                });
            }
            const group = groups.get(endpoint);
            group.count++;
            if (!group.methods.includes(method)) {
                group.methods.push(method);
            }
            // Update success rate
            if (response.status >= 200 && response.status < 400) {
                group.successRate =
                    ((group.successRate * (group.count - 1)) + 100) / group.count;
            }
            else {
                group.successRate = (group.successRate * (group.count - 1)) / group.count;
                group.failureCount++;
            }
            // Update average response time
            group.averageResponseTime =
                ((group.averageResponseTime * (group.count - 1)) +
                    response.timing.duration) /
                    group.count;
        });
        return Array.from(groups.values()).sort((a, b) => b.count - a.count);
    }
    /**
     * Extract endpoint from URL
     */
    extractEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.origin + urlObj.pathname;
        }
        catch {
            return url.split('?')[0].split('#')[0];
        }
    }
    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics(responses) {
        if (responses.length === 0) {
            return {
                averageResponseTime: 0,
                medianResponseTime: 0,
                p95ResponseTime: 0,
                successRate: 0,
                totalDataTransferred: 0,
            };
        }
        // Response times
        const responseTimes = responses.map((r) => r.timing.duration);
        const sortedTimes = [...responseTimes].sort((a, b) => a - b);
        const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const medianResponseTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
        const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
        // Success rate
        const successCount = responses.filter((r) => r.status >= 200 && r.status < 400).length;
        const successRate = (successCount / responses.length) * 100;
        // Total data transferred
        const totalDataTransferred = responses.reduce((sum, r) => sum + r.size, 0);
        return {
            averageResponseTime,
            medianResponseTime,
            p95ResponseTime,
            successRate,
            totalDataTransferred,
        };
    }
    /**
     * Count requests by method
     */
    countByMethod() {
        const counts = {};
        this.requests.forEach((request) => {
            counts[request.method] = (counts[request.method] || 0) + 1;
        });
        return counts;
    }
    /**
     * Count requests by status code
     */
    countByStatus(responses) {
        const counts = {};
        responses.forEach((response) => {
            counts[response.status] = (counts[response.status] || 0) + 1;
        });
        return counts;
    }
    /**
     * Calculate cache hit rate
     */
    calculateCacheHitRate(responses) {
        if (responses.length === 0)
            return 0;
        const cachedCount = responses.filter((r) => r.fromCache).length;
        return (cachedCount / responses.length) * 100;
    }
    /**
     * Generate summary text
     */
    generateSummary(stats) {
        const parts = [];
        if (stats.totalRequests === 0) {
            return '✅ No network requests tracked';
        }
        parts.push(`📊 Tracked ${stats.totalRequests} request(s)`);
        // Success rate
        parts.push(`Success: ${stats.successRate.toFixed(1)}%`);
        // Average response time
        parts.push(`Avg: ${stats.averageResponseTime.toFixed(0)}ms`);
        // Issues
        const issues = [];
        if (stats.failedCount > 0)
            issues.push(`${stats.failedCount} failed`);
        if (stats.slowCount > 0)
            issues.push(`${stats.slowCount} slow`);
        if (stats.largePayloadCount > 0)
            issues.push(`${stats.largePayloadCount} large`);
        if (issues.length > 0) {
            parts.push(`⚠️ Issues: ${issues.join(', ')}`);
        }
        return parts.join(' | ');
    }
    /**
     * Get empty analysis (when tracking not active)
     */
    getEmptyAnalysis() {
        return {
            totalRequests: 0,
            totalResponses: 0,
            failedRequests: [],
            slowRequests: [],
            largePayloads: [],
            apiEndpoints: [],
            performanceMetrics: {
                averageResponseTime: 0,
                medianResponseTime: 0,
                p95ResponseTime: 0,
                successRate: 0,
                totalDataTransferred: 0,
            },
            requestsByMethod: {},
            requestsByStatus: {},
            cacheHitRate: 0,
            summary: '⚠️ Tracking not active',
        };
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `request_${this.requestIdCounter++}_${Date.now()}`;
    }
}
/**
 * Singleton instance
 */
let networkRequestTrackerInstance = null;
/**
 * Get singleton instance
 */
export function getNetworkRequestTracker(config) {
    if (!networkRequestTrackerInstance) {
        networkRequestTrackerInstance = new NetworkRequestTracker(config);
    }
    return networkRequestTrackerInstance;
}
/**
 * Reset singleton (for testing)
 */
export function resetNetworkRequestTracker() {
    networkRequestTrackerInstance = null;
}
//# sourceMappingURL=network-request-tracker.js.map