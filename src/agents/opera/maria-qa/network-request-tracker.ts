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

import { Page, Request, Response } from 'playwright';
import { VERSATILLogger } from '../../../utils/logger.js';

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
  slowRequestThreshold: number; // milliseconds
  largePayloadThreshold: number; // bytes
  trackCaching: boolean;
  groupByEndpoint: boolean;
}

/**
 * Network Request Tracker
 *
 * Monitors and analyzes network requests during frontend testing.
 */
export class NetworkRequestTracker {
  private logger: VERSATILLogger;
  private requests: Map<string, NetworkRequest> = new Map();
  private responses: Map<string, NetworkResponse> = new Map();
  private failures: FailedRequest[] = [];
  private isTracking: boolean = false;
  private requestIdCounter: number = 0;
  private config: TrackerConfig;

  constructor(config?: Partial<TrackerConfig>) {
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
  async startTracking(page: Page): Promise<void> {
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
    page.on('request', (request: Request) => {
      this.captureRequest(request);
    });

    // Track responses
    page.on('response', async (response: Response) => {
      await this.captureResponse(response);
    });

    // Track request failures
    page.on('requestfailed', (request: Request) => {
      this.captureFailure(request);
    });

    this.logger.debug('Network tracking listeners attached');
  }

  /**
   * Stop tracking and return analysis
   */
  async stopTracking(): Promise<NetworkAnalysis> {
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
  getStatus(): {
    isTracking: boolean;
    requestCount: number;
    responseCount: number;
    failureCount: number;
  } {
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
  clearData(): void {
    this.requests.clear();
    this.responses.clear();
    this.failures = [];
    this.requestIdCounter = 0;
    this.logger.debug('Cleared all tracked network data');
  }

  /**
   * Capture outgoing request
   */
  private captureRequest(request: Request): void {
    const id = this.generateRequestId();
    const networkRequest: NetworkRequest = {
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
  private async captureResponse(response: Response): Promise<void> {
    const timing = response.request().timing();
    const id = this.generateRequestId();

    const networkResponse: NetworkResponse = {
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
  private captureFailure(request: Request): void {
    const failure: FailedRequest = {
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
  private generateAnalysis(): NetworkAnalysis {
    const responsesArray = Array.from(this.responses.values());

    // Identify slow requests
    const slowRequests: SlowRequest[] = responsesArray
      .filter(
        (response) => response.timing.duration > this.config.slowRequestThreshold
      )
      .map((response) => ({
        url: response.url,
        method: this.requests.get(response.url)?.method || 'GET',
        duration: response.timing.duration,
        threshold: this.config.slowRequestThreshold,
        timestamp: response.timestamp,
      }));

    // Identify large payloads
    const largePayloads: LargePayload[] = responsesArray
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
  private groupByEndpoint(responses: NetworkResponse[]): APIEndpointGroup[] {
    const groups = new Map<string, APIEndpointGroup>();

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

      const group = groups.get(endpoint)!;
      group.count++;

      if (!group.methods.includes(method)) {
        group.methods.push(method);
      }

      // Update success rate
      if (response.status >= 200 && response.status < 400) {
        group.successRate =
          ((group.successRate * (group.count - 1)) + 100) / group.count;
      } else {
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
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname;
    } catch {
      return url.split('?')[0].split('#')[0];
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(responses: NetworkResponse[]): {
    averageResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    totalDataTransferred: number;
  } {
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

    const averageResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const medianResponseTime =
      sortedTimes[Math.floor(sortedTimes.length / 2)];
    const p95ResponseTime =
      sortedTimes[Math.floor(sortedTimes.length * 0.95)];

    // Success rate
    const successCount = responses.filter(
      (r) => r.status >= 200 && r.status < 400
    ).length;
    const successRate = (successCount / responses.length) * 100;

    // Total data transferred
    const totalDataTransferred = responses.reduce(
      (sum, r) => sum + r.size,
      0
    );

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
  private countByMethod(): Record<string, number> {
    const counts: Record<string, number> = {};

    this.requests.forEach((request) => {
      counts[request.method] = (counts[request.method] || 0) + 1;
    });

    return counts;
  }

  /**
   * Count requests by status code
   */
  private countByStatus(responses: NetworkResponse[]): Record<number, number> {
    const counts: Record<number, number> = {};

    responses.forEach((response) => {
      counts[response.status] = (counts[response.status] || 0) + 1;
    });

    return counts;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(responses: NetworkResponse[]): number {
    if (responses.length === 0) return 0;

    const cachedCount = responses.filter((r) => r.fromCache).length;
    return (cachedCount / responses.length) * 100;
  }

  /**
   * Generate summary text
   */
  private generateSummary(stats: {
    totalRequests: number;
    failedCount: number;
    slowCount: number;
    largePayloadCount: number;
    averageResponseTime: number;
    successRate: number;
  }): string {
    const parts: string[] = [];

    if (stats.totalRequests === 0) {
      return '✅ No network requests tracked';
    }

    parts.push(`📊 Tracked ${stats.totalRequests} request(s)`);

    // Success rate
    parts.push(`Success: ${stats.successRate.toFixed(1)}%`);

    // Average response time
    parts.push(`Avg: ${stats.averageResponseTime.toFixed(0)}ms`);

    // Issues
    const issues: string[] = [];
    if (stats.failedCount > 0) issues.push(`${stats.failedCount} failed`);
    if (stats.slowCount > 0) issues.push(`${stats.slowCount} slow`);
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
  private getEmptyAnalysis(): NetworkAnalysis {
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
  private generateRequestId(): string {
    return `request_${this.requestIdCounter++}_${Date.now()}`;
  }
}

/**
 * Singleton instance
 */
let networkRequestTrackerInstance: NetworkRequestTracker | null = null;

/**
 * Get singleton instance
 */
export function getNetworkRequestTracker(
  config?: Partial<TrackerConfig>
): NetworkRequestTracker {
  if (!networkRequestTrackerInstance) {
    networkRequestTrackerInstance = new NetworkRequestTracker(config);
  }
  return networkRequestTrackerInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetNetworkRequestTracker(): void {
  networkRequestTrackerInstance = null;
}
