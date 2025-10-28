/**
 * Comprehensive Audit Trail for VERSATIL MCP Documentation Tools
 *
 * Integrates all security features into a unified audit trail:
 * - Security logging (Phase 4.1)
 * - Rate limiting (Phase 4.2)
 * - IP access control (Phase 4.3)
 * - Complete request/response logging
 * - Performance metrics tracking
 *
 * Part of Phase 4.4: Comprehensive Audit Trail
 */
import { SecurityLogger } from './docs-security-logger.js';
import { RateLimiter, RateLimitResult } from './docs-rate-limiter.js';
import { IPAccessControl, AccessCheckResult } from './docs-ip-access-control.js';
/**
 * Audit event types
 */
export declare enum AuditEventType {
    REQUEST = "request",
    RESPONSE = "response",
    ACCESS_DENIED = "access_denied",
    RATE_LIMITED = "rate_limited",
    ERROR = "error",
    SEARCH = "search",
    INDEX_BUILD = "index_build"
}
/**
 * Audit event interface
 */
export interface AuditEvent {
    id: string;
    timestamp: Date;
    type: AuditEventType;
    ip: string;
    user?: string;
    action: string;
    result: 'success' | 'failure';
    duration?: number;
    metadata?: {
        path?: string;
        query?: string;
        error?: string;
        statusCode?: number;
        rateLimit?: RateLimitResult;
        accessControl?: AccessCheckResult;
        [key: string]: unknown;
    };
}
/**
 * Audit trail options
 */
export interface AuditTrailOptions {
    securityLogger?: SecurityLogger;
    rateLimiter?: RateLimiter;
    ipAccessControl?: IPAccessControl;
    enableDetailedLogging?: boolean;
}
/**
 * Request context for audit tracking
 */
export interface RequestContext {
    id: string;
    ip: string;
    user?: string;
    action: string;
    startTime: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Comprehensive Audit Trail
 */
export declare class AuditTrail {
    private securityLogger?;
    private rateLimiter?;
    private ipAccessControl?;
    private enableDetailedLogging;
    private activeRequests;
    private eventIdCounter;
    constructor(options?: AuditTrailOptions);
    /**
     * Start tracking a request
     */
    startRequest(ip: string, action: string, user?: string, metadata?: Record<string, unknown>): Promise<RequestContext>;
    /**
     * Check access controls for a request
     */
    checkAccess(context: RequestContext): Promise<{
        allowed: boolean;
        reason: string;
        event?: AuditEvent;
    }>;
    /**
     * Complete a request
     */
    completeRequest(context: RequestContext, result: 'success' | 'failure', metadata?: Record<string, unknown>): Promise<AuditEvent>;
    /**
     * Log a search query
     */
    logSearch(ip: string, query: string, resultCount: number, duration: number, user?: string): Promise<AuditEvent>;
    /**
     * Log an index build
     */
    logIndexBuild(duration: number, fileCount: number, success: boolean, error?: string): Promise<AuditEvent>;
    /**
     * Get active requests count
     */
    getActiveRequestCount(): number;
    /**
     * Get active requests
     */
    getActiveRequests(): RequestContext[];
    /**
     * Get statistics from all integrated systems
     */
    getComprehensiveStatistics(): Promise<any>;
    /**
     * Query security logs
     */
    querySecurityLogs(options?: any): Promise<import("./docs-security-logger.js").SecurityEvent[]>;
    /**
     * Private: Log audit event
     */
    private logAuditEvent;
    /**
     * Private: Generate unique event ID
     */
    private generateEventId;
}
/**
 * Helper to format audit event for display
 */
export declare function formatAuditEvent(event: AuditEvent): string;
/**
 * Helper to create audit trail with all security features
 */
export declare function createFullAuditTrail(options: {
    securityLogDir?: string;
    rateLimitConfig?: {
        maxRequests: number;
        windowMs: number;
    };
    ipAccessMode?: string;
}): Promise<AuditTrail>;
