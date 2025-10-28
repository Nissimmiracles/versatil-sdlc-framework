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
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
/**
 * Security event types
 */
export var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["ACCESS_GRANTED"] = "access_granted";
    SecurityEventType["ACCESS_DENIED"] = "access_denied";
    SecurityEventType["PATH_TRAVERSAL_ATTEMPT"] = "path_traversal_attempt";
    SecurityEventType["FILE_SIZE_VIOLATION"] = "file_size_violation";
    SecurityEventType["INVALID_PATH"] = "invalid_path";
    SecurityEventType["SUSPICIOUS_PATTERN"] = "suspicious_pattern";
    SecurityEventType["INDEX_BUILD"] = "index_build";
    SecurityEventType["SEARCH_QUERY"] = "search_query";
})(SecurityEventType || (SecurityEventType = {}));
/**
 * Security event severity
 */
export var SecuritySeverity;
(function (SecuritySeverity) {
    SecuritySeverity["LOW"] = "low";
    SecuritySeverity["MEDIUM"] = "medium";
    SecuritySeverity["HIGH"] = "high";
    SecuritySeverity["CRITICAL"] = "critical";
})(SecuritySeverity || (SecuritySeverity = {}));
/**
 * Security Logger
 */
export class SecurityLogger extends EventEmitter {
    constructor(options = {}) {
        super();
        this.eventIdCounter = 0;
        this.isInitialized = false;
        this.logDir = options.logDir || path.join(process.cwd(), '.versatil', 'security-logs');
        this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB default
        this.retentionDays = options.retentionDays || 90; // 90 days default
        this.autoRotate = options.autoRotate !== false;
        this.currentLogFile = this.getLogFileName();
    }
    /**
     * Initialize the security logger
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        // Create log directory if it doesn't exist
        await fs.mkdir(this.logDir, { recursive: true });
        // Clean up old logs
        if (this.autoRotate) {
            await this.cleanupOldLogs();
        }
        this.isInitialized = true;
        this.emit('initialized');
    }
    /**
     * Log a security event
     */
    async logEvent(type, severity, message, details = {}) {
        await this.ensureInitialized();
        const event = {
            id: this.generateEventId(),
            timestamp: new Date(),
            type,
            severity,
            message,
            details,
        };
        // Write to log file
        await this.writeEventToLog(event);
        // Check if rotation is needed
        if (this.autoRotate) {
            await this.checkAndRotateLog();
        }
        // Emit event for real-time monitoring
        this.emit('event', event);
        // Emit high-severity events separately
        if (severity === SecuritySeverity.HIGH || severity === SecuritySeverity.CRITICAL) {
            this.emit('high-severity', event);
        }
        return event.id;
    }
    /**
     * Log access granted event
     */
    async logAccessGranted(path, user) {
        return this.logEvent(SecurityEventType.ACCESS_GRANTED, SecuritySeverity.LOW, `Access granted to ${path}`, { path, user, result: 'success' });
    }
    /**
     * Log access denied event
     */
    async logAccessDenied(path, reason, user) {
        return this.logEvent(SecurityEventType.ACCESS_DENIED, SecuritySeverity.MEDIUM, `Access denied to ${path}: ${reason}`, { path, user, result: 'failure', metadata: { reason } });
    }
    /**
     * Log path traversal attempt
     */
    async logPathTraversalAttempt(path, user, ip) {
        return this.logEvent(SecurityEventType.PATH_TRAVERSAL_ATTEMPT, SecuritySeverity.CRITICAL, `Path traversal attempt detected: ${path}`, { path, user, ip, result: 'failure' });
    }
    /**
     * Log file size violation
     */
    async logFileSizeViolation(path, size, maxSize) {
        return this.logEvent(SecurityEventType.FILE_SIZE_VIOLATION, SecuritySeverity.MEDIUM, `File size violation: ${path} (${size} bytes exceeds ${maxSize} bytes)`, { path, result: 'failure', metadata: { size, maxSize } });
    }
    /**
     * Query security logs
     */
    async queryLogs(options = {}) {
        await this.ensureInitialized();
        const allEvents = await this.readAllLogs();
        let filtered = allEvents;
        // Filter by date range
        if (options.startDate) {
            filtered = filtered.filter(e => e.timestamp >= options.startDate);
        }
        if (options.endDate) {
            filtered = filtered.filter(e => e.timestamp <= options.endDate);
        }
        // Filter by types
        if (options.types && options.types.length > 0) {
            filtered = filtered.filter(e => options.types.includes(e.type));
        }
        // Filter by severities
        if (options.severities && options.severities.length > 0) {
            filtered = filtered.filter(e => options.severities.includes(e.severity));
        }
        // Apply pagination
        const offset = options.offset || 0;
        const limit = options.limit || filtered.length;
        return filtered.slice(offset, offset + limit);
    }
    /**
     * Get security log statistics
     */
    async getStatistics() {
        await this.ensureInitialized();
        const allEvents = await this.readAllLogs();
        const eventsByType = {};
        Object.values(SecurityEventType).forEach(type => {
            eventsByType[type] = 0;
        });
        const eventsBySeverity = {};
        Object.values(SecuritySeverity).forEach(severity => {
            eventsBySeverity[severity] = 0;
        });
        let suspiciousActivityCount = 0;
        let earliest = null;
        let latest = null;
        allEvents.forEach(event => {
            eventsByType[event.type]++;
            eventsBySeverity[event.severity]++;
            if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
                suspiciousActivityCount++;
            }
            if (!earliest || event.timestamp < earliest) {
                earliest = event.timestamp;
            }
            if (!latest || event.timestamp > latest) {
                latest = event.timestamp;
            }
        });
        return {
            totalEvents: allEvents.length,
            eventsByType,
            eventsBySeverity,
            suspiciousActivityCount,
            timeRange: { earliest, latest },
        };
    }
    /**
     * Clear all logs (use with caution)
     */
    async clearLogs() {
        await this.ensureInitialized();
        const files = await fs.readdir(this.logDir);
        const logFiles = files.filter(f => f.startsWith('security-') && f.endsWith('.log'));
        for (const file of logFiles) {
            await fs.unlink(path.join(this.logDir, file));
        }
        this.emit('logs-cleared');
    }
    /**
     * Get log file path
     */
    getLogFilePath() {
        return path.join(this.logDir, this.currentLogFile);
    }
    /**
     * Private: Ensure logger is initialized
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }
    /**
     * Private: Generate unique event ID
     */
    generateEventId() {
        return `sec_${Date.now()}_${this.eventIdCounter++}`;
    }
    /**
     * Private: Get log file name for current date
     */
    getLogFileName() {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        return `security-${dateStr}.log`;
    }
    /**
     * Private: Write event to log file
     */
    async writeEventToLog(event) {
        const logLine = JSON.stringify(event) + '\n';
        const logPath = this.getLogFilePath();
        await fs.appendFile(logPath, logLine, 'utf-8');
    }
    /**
     * Private: Check if log rotation is needed
     */
    async checkAndRotateLog() {
        const logPath = this.getLogFilePath();
        try {
            const stats = await fs.stat(logPath);
            if (stats.size >= this.maxLogSize) {
                // Rotate log by renaming with timestamp
                const timestamp = Date.now();
                const rotatedName = this.currentLogFile.replace('.log', `-${timestamp}.log`);
                const rotatedPath = path.join(this.logDir, rotatedName);
                await fs.rename(logPath, rotatedPath);
                // Update current log file name
                this.currentLogFile = this.getLogFileName();
                this.emit('log-rotated', { oldFile: rotatedName, newFile: this.currentLogFile });
            }
        }
        catch (error) {
            // Log file doesn't exist yet, no rotation needed
        }
    }
    /**
     * Private: Clean up old logs based on retention policy
     */
    async cleanupOldLogs() {
        const files = await fs.readdir(this.logDir);
        const logFiles = files.filter(f => f.startsWith('security-') && f.endsWith('.log'));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        for (const file of logFiles) {
            const filePath = path.join(this.logDir, file);
            const stats = await fs.stat(filePath);
            if (stats.mtime < cutoffDate) {
                await fs.unlink(filePath);
                this.emit('log-deleted', { file });
            }
        }
    }
    /**
     * Private: Read all log files and parse events
     */
    async readAllLogs() {
        const files = await fs.readdir(this.logDir);
        const logFiles = files.filter(f => f.startsWith('security-') && f.endsWith('.log'));
        const allEvents = [];
        for (const file of logFiles) {
            const filePath = path.join(this.logDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line.length > 0);
            for (const line of lines) {
                try {
                    const event = JSON.parse(line);
                    // Convert timestamp string back to Date object
                    event.timestamp = new Date(event.timestamp);
                    allEvents.push(event);
                }
                catch (error) {
                    // Skip malformed lines
                    console.error(`Failed to parse log line: ${line}`);
                }
            }
        }
        // Sort by timestamp descending (most recent first)
        allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return allEvents;
    }
}
/**
 * Helper to format security event for display
 */
export function formatSecurityEvent(event) {
    const severityEmoji = {
        [SecuritySeverity.LOW]: '🟢',
        [SecuritySeverity.MEDIUM]: '🟡',
        [SecuritySeverity.HIGH]: '🟠',
        [SecuritySeverity.CRITICAL]: '🔴',
    };
    const timestamp = event.timestamp.toISOString();
    const emoji = severityEmoji[event.severity];
    let formatted = `${emoji} [${timestamp}] ${event.type.toUpperCase()}\n`;
    formatted += `   ${event.message}\n`;
    if (event.details.path) {
        formatted += `   Path: ${event.details.path}\n`;
    }
    if (event.details.user) {
        formatted += `   User: ${event.details.user}\n`;
    }
    if (event.details.ip) {
        formatted += `   IP: ${event.details.ip}\n`;
    }
    return formatted;
}
//# sourceMappingURL=docs-security-logger.js.map