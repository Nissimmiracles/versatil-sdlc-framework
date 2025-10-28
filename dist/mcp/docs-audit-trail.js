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
import { SecurityLogger, SecurityEventType, SecuritySeverity } from './docs-security-logger.js';
import { RateLimiter } from './docs-rate-limiter.js';
import { IPAccessControl } from './docs-ip-access-control.js';
/**
 * Audit event types
 */
export var AuditEventType;
(function (AuditEventType) {
    AuditEventType["REQUEST"] = "request";
    AuditEventType["RESPONSE"] = "response";
    AuditEventType["ACCESS_DENIED"] = "access_denied";
    AuditEventType["RATE_LIMITED"] = "rate_limited";
    AuditEventType["ERROR"] = "error";
    AuditEventType["SEARCH"] = "search";
    AuditEventType["INDEX_BUILD"] = "index_build";
})(AuditEventType || (AuditEventType = {}));
/**
 * Comprehensive Audit Trail
 */
export class AuditTrail {
    constructor(options = {}) {
        this.eventIdCounter = 0;
        this.securityLogger = options.securityLogger;
        this.rateLimiter = options.rateLimiter;
        this.ipAccessControl = options.ipAccessControl;
        this.enableDetailedLogging = options.enableDetailedLogging !== false;
        this.activeRequests = new Map();
    }
    /**
     * Start tracking a request
     */
    async startRequest(ip, action, user, metadata) {
        const context = {
            id: this.generateEventId(),
            ip,
            user,
            action,
            startTime: new Date(),
            metadata,
        };
        this.activeRequests.set(context.id, context);
        // Log request start
        if (this.enableDetailedLogging && this.securityLogger) {
            await this.securityLogger.logEvent(SecurityEventType.SEARCH_QUERY, SecuritySeverity.LOW, `Request started: ${action}`, { path: action, user, ip });
        }
        return context;
    }
    /**
     * Check access controls for a request
     */
    async checkAccess(context) {
        const checks = [];
        let allowed = true;
        let reason = 'Access granted';
        let auditEvent;
        // Check IP access control
        if (this.ipAccessControl) {
            const ipCheck = await this.ipAccessControl.checkAccess(context.ip, context.user);
            if (!ipCheck.allowed) {
                allowed = false;
                reason = `IP access denied: ${ipCheck.reason}`;
                auditEvent = await this.logAuditEvent({
                    type: AuditEventType.ACCESS_DENIED,
                    ip: context.ip,
                    user: context.user,
                    action: context.action,
                    result: 'failure',
                    metadata: { accessControl: ipCheck },
                });
                return { allowed, reason, event: auditEvent };
            }
            checks.push('IP check passed');
        }
        // Check rate limit
        if (this.rateLimiter) {
            const rateCheck = this.rateLimiter.check(context.ip);
            if (!rateCheck.allowed) {
                allowed = false;
                reason = `Rate limit exceeded: ${rateCheck.retryAfter}s retry after`;
                auditEvent = await this.logAuditEvent({
                    type: AuditEventType.RATE_LIMITED,
                    ip: context.ip,
                    user: context.user,
                    action: context.action,
                    result: 'failure',
                    metadata: { rateLimit: rateCheck },
                });
                // Log rate limit violation
                if (this.securityLogger) {
                    await this.securityLogger.logEvent(SecurityEventType.SUSPICIOUS_PATTERN, SecuritySeverity.MEDIUM, `Rate limit exceeded for IP: ${context.ip}`, { ip: context.ip, user: context.user, metadata: { retryAfter: rateCheck.retryAfter } });
                }
                return { allowed, reason, event: auditEvent };
            }
            checks.push('Rate limit check passed');
        }
        return { allowed, reason };
    }
    /**
     * Complete a request
     */
    async completeRequest(context, result, metadata) {
        const duration = Date.now() - context.startTime.getTime();
        const event = await this.logAuditEvent({
            type: result === 'success' ? AuditEventType.RESPONSE : AuditEventType.ERROR,
            ip: context.ip,
            user: context.user,
            action: context.action,
            result,
            duration,
            metadata: { ...context.metadata, ...metadata },
        });
        this.activeRequests.delete(context.id);
        return event;
    }
    /**
     * Log a search query
     */
    async logSearch(ip, query, resultCount, duration, user) {
        const event = await this.logAuditEvent({
            type: AuditEventType.SEARCH,
            ip,
            user,
            action: 'search',
            result: 'success',
            duration,
            metadata: { query, resultCount },
        });
        if (this.securityLogger) {
            await this.securityLogger.logEvent(SecurityEventType.SEARCH_QUERY, SecuritySeverity.LOW, `Search query: ${query}`, { user, ip, metadata: { query, resultCount, duration } });
        }
        return event;
    }
    /**
     * Log an index build
     */
    async logIndexBuild(duration, fileCount, success, error) {
        const event = await this.logAuditEvent({
            type: AuditEventType.INDEX_BUILD,
            ip: 'system',
            action: 'build_index',
            result: success ? 'success' : 'failure',
            duration,
            metadata: { fileCount, error },
        });
        if (this.securityLogger) {
            await this.securityLogger.logEvent(SecurityEventType.INDEX_BUILD, success ? SecuritySeverity.LOW : SecuritySeverity.HIGH, `Index build ${success ? 'completed' : 'failed'}`, { metadata: { fileCount, duration, error } });
        }
        return event;
    }
    /**
     * Get active requests count
     */
    getActiveRequestCount() {
        return this.activeRequests.size;
    }
    /**
     * Get active requests
     */
    getActiveRequests() {
        return Array.from(this.activeRequests.values());
    }
    /**
     * Get statistics from all integrated systems
     */
    async getComprehensiveStatistics() {
        const stats = {
            activeRequests: this.getActiveRequestCount(),
        };
        // Security logger stats
        if (this.securityLogger) {
            stats.security = await this.securityLogger.getStatistics();
        }
        // IP access control stats
        if (this.ipAccessControl) {
            stats.ipAccess = this.ipAccessControl.getStatistics();
        }
        // Rate limiter stats
        if (this.rateLimiter) {
            stats.rateLimit = {
                trackedKeys: this.rateLimiter.getKeyCount(),
            };
        }
        return stats;
    }
    /**
     * Query security logs
     */
    async querySecurityLogs(options) {
        if (!this.securityLogger) {
            return [];
        }
        return this.securityLogger.queryLogs(options);
    }
    /**
     * Private: Log audit event
     */
    async logAuditEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            timestamp: new Date(),
            ...event,
        };
        // Log to console in detailed mode
        if (this.enableDetailedLogging) {
            console.log(`[AUDIT] ${auditEvent.type.toUpperCase()}: ${auditEvent.action}`);
        }
        return auditEvent;
    }
    /**
     * Private: Generate unique event ID
     */
    generateEventId() {
        return `audit_${Date.now()}_${this.eventIdCounter++}`;
    }
}
/**
 * Helper to format audit event for display
 */
export function formatAuditEvent(event) {
    const typeEmoji = {
        [AuditEventType.REQUEST]: '📥',
        [AuditEventType.RESPONSE]: '📤',
        [AuditEventType.ACCESS_DENIED]: '🚫',
        [AuditEventType.RATE_LIMITED]: '⏱️',
        [AuditEventType.ERROR]: '❌',
        [AuditEventType.SEARCH]: '🔍',
        [AuditEventType.INDEX_BUILD]: '🏗️',
    };
    const emoji = typeEmoji[event.type] || '📋';
    let formatted = `${emoji} [${event.timestamp.toISOString()}] ${event.type.toUpperCase()}\n`;
    formatted += `   IP: ${event.ip}\n`;
    if (event.user) {
        formatted += `   User: ${event.user}\n`;
    }
    formatted += `   Action: ${event.action}\n`;
    formatted += `   Result: ${event.result}\n`;
    if (event.duration !== undefined) {
        formatted += `   Duration: ${event.duration}ms\n`;
    }
    return formatted;
}
/**
 * Helper to create audit trail with all security features
 */
export async function createFullAuditTrail(options) {
    // Create security logger
    const securityLogger = new SecurityLogger({
        logDir: options.securityLogDir,
    });
    await securityLogger.initialize();
    // Create rate limiter
    const rateLimiter = options.rateLimitConfig
        ? new RateLimiter(options.rateLimitConfig)
        : undefined;
    // Create IP access control
    const ipAccessControl = new IPAccessControl();
    await ipAccessControl.initialize();
    return new AuditTrail({
        securityLogger,
        rateLimiter,
        ipAccessControl,
    });
}
//# sourceMappingURL=docs-audit-trail.js.map