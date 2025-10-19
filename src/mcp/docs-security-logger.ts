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
export enum SecurityEventType {
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  FILE_SIZE_VIOLATION = 'file_size_violation',
  INVALID_PATH = 'invalid_path',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  INDEX_BUILD = 'index_build',
  SEARCH_QUERY = 'search_query',
}

/**
 * Security event severity
 */
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
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
export class SecurityLogger extends EventEmitter {
  private logDir: string;
  private currentLogFile: string;
  private maxLogSize: number;
  private retentionDays: number;
  private autoRotate: boolean;
  private eventIdCounter: number = 0;
  private isInitialized: boolean = false;

  constructor(options: SecurityLoggerOptions = {}) {
    super();
    this.logDir = options.logDir || path.join(process.cwd(), '.versatil', 'security-logs');
    this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB default
    this.retentionDays = options.retentionDays || 90; // 90 days default
    this.autoRotate = options.autoRotate !== false;
    this.currentLogFile = this.getLogFileName();
  }

  /**
   * Initialize the security logger
   */
  async initialize(): Promise<void> {
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
  async logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    message: string,
    details: SecurityEvent['details'] = {}
  ): Promise<string> {
    await this.ensureInitialized();

    const event: SecurityEvent = {
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
  async logAccessGranted(path: string, user?: string): Promise<string> {
    return this.logEvent(
      SecurityEventType.ACCESS_GRANTED,
      SecuritySeverity.LOW,
      `Access granted to ${path}`,
      { path, user, result: 'success' }
    );
  }

  /**
   * Log access denied event
   */
  async logAccessDenied(path: string, reason: string, user?: string): Promise<string> {
    return this.logEvent(
      SecurityEventType.ACCESS_DENIED,
      SecuritySeverity.MEDIUM,
      `Access denied to ${path}: ${reason}`,
      { path, user, result: 'failure', metadata: { reason } }
    );
  }

  /**
   * Log path traversal attempt
   */
  async logPathTraversalAttempt(path: string, user?: string, ip?: string): Promise<string> {
    return this.logEvent(
      SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
      SecuritySeverity.CRITICAL,
      `Path traversal attempt detected: ${path}`,
      { path, user, ip, result: 'failure' }
    );
  }

  /**
   * Log file size violation
   */
  async logFileSizeViolation(path: string, size: number, maxSize: number): Promise<string> {
    return this.logEvent(
      SecurityEventType.FILE_SIZE_VIOLATION,
      SecuritySeverity.MEDIUM,
      `File size violation: ${path} (${size} bytes exceeds ${maxSize} bytes)`,
      { path, result: 'failure', metadata: { size, maxSize } }
    );
  }

  /**
   * Query security logs
   */
  async queryLogs(options: LogQueryOptions = {}): Promise<SecurityEvent[]> {
    await this.ensureInitialized();

    const allEvents = await this.readAllLogs();
    let filtered = allEvents;

    // Filter by date range
    if (options.startDate) {
      filtered = filtered.filter(e => e.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter(e => e.timestamp <= options.endDate!);
    }

    // Filter by types
    if (options.types && options.types.length > 0) {
      filtered = filtered.filter(e => options.types!.includes(e.type));
    }

    // Filter by severities
    if (options.severities && options.severities.length > 0) {
      filtered = filtered.filter(e => options.severities!.includes(e.severity));
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || filtered.length;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get security log statistics
   */
  async getStatistics(): Promise<LogStatistics> {
    await this.ensureInitialized();

    const allEvents = await this.readAllLogs();

    const eventsByType: Record<SecurityEventType, number> = {} as any;
    Object.values(SecurityEventType).forEach(type => {
      eventsByType[type] = 0;
    });

    const eventsBySeverity: Record<SecuritySeverity, number> = {} as any;
    Object.values(SecuritySeverity).forEach(severity => {
      eventsBySeverity[severity] = 0;
    });

    let suspiciousActivityCount = 0;
    let earliest: Date | null = null;
    let latest: Date | null = null;

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
  async clearLogs(): Promise<void> {
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
  getLogFilePath(): string {
    return path.join(this.logDir, this.currentLogFile);
  }

  /**
   * Private: Ensure logger is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Private: Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${this.eventIdCounter++}`;
  }

  /**
   * Private: Get log file name for current date
   */
  private getLogFileName(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `security-${dateStr}.log`;
  }

  /**
   * Private: Write event to log file
   */
  private async writeEventToLog(event: SecurityEvent): Promise<void> {
    const logLine = JSON.stringify(event) + '\n';
    const logPath = this.getLogFilePath();

    await fs.appendFile(logPath, logLine, 'utf-8');
  }

  /**
   * Private: Check if log rotation is needed
   */
  private async checkAndRotateLog(): Promise<void> {
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
    } catch (error) {
      // Log file doesn't exist yet, no rotation needed
    }
  }

  /**
   * Private: Clean up old logs based on retention policy
   */
  private async cleanupOldLogs(): Promise<void> {
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
  private async readAllLogs(): Promise<SecurityEvent[]> {
    const files = await fs.readdir(this.logDir);
    const logFiles = files.filter(f => f.startsWith('security-') && f.endsWith('.log'));

    const allEvents: SecurityEvent[] = [];

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
        } catch (error) {
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
export function formatSecurityEvent(event: SecurityEvent): string {
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
