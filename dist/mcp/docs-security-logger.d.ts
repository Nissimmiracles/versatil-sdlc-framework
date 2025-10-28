/**
 * Security Logger for VERSATIL MCP Documentation Tools
 *
 * Provides persistent security audit logging with:
 * - Security event tracking (access, errors, suspicious activity)
 * - Persistent file-based storage
 * - Query and analysis capabilities
 * - Automatic log rotation
 *
 * Part of Phase 4.1: Persistent Security Logs
 */
import { EventEmitter } from 'events';
/**
 * Security event types
 */
export declare enum SecurityEventType {
    ACCESS_GRANTED = "access_granted",
    ACCESS_DENIED = "access_denied",
    PATH_TRAVERSAL_ATTEMPT = "path_traversal_attempt",
    FILE_SIZE_VIOLATION = "file_size_violation",
    INVALID_PATH = "invalid_path",
    SUSPICIOUS_PATTERN = "suspicious_pattern",
    INDEX_BUILD = "index_build",
    SEARCH_QUERY = "search_query"
}
/**
 * Security event severity
 */
export declare enum SecuritySeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Security event interface
 */
export interface SecurityEvent {
    id: string;
    timestamp: Date;
    type: SecurityEventType;
    severity: SecuritySeverity;
    message: string;
    details: {
        path?: string;
        user?: string;
        ip?: string;
        action?: string;
        result?: 'success' | 'failure';
        metadata?: Record<string, unknown>;
    };
}
/**
 * Log query options
 */
export interface LogQueryOptions {
    startDate?: Date;
    endDate?: Date;
    types?: SecurityEventType[];
    severities?: SecuritySeverity[];
    limit?: number;
    offset?: number;
}
/**
 * Log statistics
 */
export interface LogStatistics {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecuritySeverity, number>;
    suspiciousActivityCount: number;
    timeRange: {
        earliest: Date | null;
        latest: Date | null;
    };
}
/**
 * Security Logger Options
 */
export interface SecurityLoggerOptions {
    logDir?: string;
    maxLogSize?: number;
    retentionDays?: number;
    autoRotate?: boolean;
}
/**
 * Security Logger
 */
export declare class SecurityLogger extends EventEmitter {
    private logDir;
    private currentLogFile;
    private maxLogSize;
    private retentionDays;
    private autoRotate;
    private eventIdCounter;
    private isInitialized;
    constructor(options?: SecurityLoggerOptions);
    /**
     * Initialize the security logger
     */
    initialize(): Promise<void>;
    /**
     * Log a security event
     */
    logEvent(type: SecurityEventType, severity: SecuritySeverity, message: string, details?: SecurityEvent['details']): Promise<string>;
    /**
     * Log access granted event
     */
    logAccessGranted(path: string, user?: string): Promise<string>;
    /**
     * Log access denied event
     */
    logAccessDenied(path: string, reason: string, user?: string): Promise<string>;
    /**
     * Log path traversal attempt
     */
    logPathTraversalAttempt(path: string, user?: string, ip?: string): Promise<string>;
    /**
     * Log file size violation
     */
    logFileSizeViolation(path: string, size: number, maxSize: number): Promise<string>;
    /**
     * Query security logs
     */
    queryLogs(options?: LogQueryOptions): Promise<SecurityEvent[]>;
    /**
     * Get security log statistics
     */
    getStatistics(): Promise<LogStatistics>;
    /**
     * Clear all logs (use with caution)
     */
    clearLogs(): Promise<void>;
    /**
     * Get log file path
     */
    getLogFilePath(): string;
    /**
     * Private: Ensure logger is initialized
     */
    private ensureInitialized;
    /**
     * Private: Generate unique event ID
     */
    private generateEventId;
    /**
     * Private: Get log file name for current date
     */
    private getLogFileName;
    /**
     * Private: Write event to log file
     */
    private writeEventToLog;
    /**
     * Private: Check if log rotation is needed
     */
    private checkAndRotateLog;
    /**
     * Private: Clean up old logs based on retention policy
     */
    private cleanupOldLogs;
    /**
     * Private: Read all log files and parse events
     */
    private readAllLogs;
}
/**
 * Helper to format security event for display
 */
export declare function formatSecurityEvent(event: SecurityEvent): string;
