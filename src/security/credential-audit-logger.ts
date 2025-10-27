/**
 * VERSATIL SDLC Framework - Credential Audit Logger
 * Comprehensive audit trail for all credential access
 *
 * Features:
 * - Log all credential load/read/write operations
 * - Track access patterns and anomalies
 * - GDPR-compliant (no credential values stored)
 * - Tamper-evident log format
 * - Retention policy (90 days default)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { VERSATILLogger } from '../utils/logger.js';

export interface CredentialAccessEvent {
  timestamp: Date;
  projectId: string;
  projectPath: string;
  service: string;
  credentialKey: string;
  action: 'load' | 'read' | 'write' | 'delete' | 'export' | 'import';
  success: boolean;
  user?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string; // Unique event ID
  timestamp: string; // ISO 8601
  projectId: string;
  projectPath: string;
  service: string;
  credentialKey: string;
  action: string;
  success: boolean;
  user: string;
  hostname: string;
  error?: string;
  metadata?: Record<string, any>;
  hash: string; // SHA-256 hash of previous entry (chain integrity)
}

export interface AuditSummary {
  totalEvents: number;
  successfulAccesses: number;
  failedAccesses: number;
  uniqueProjects: Set<string>;
  uniqueServices: Set<string>;
  accessesByAction: Record<string, number>;
  recentEvents: AuditLogEntry[];
}

export interface AnomalyDetection {
  isAnomalous: boolean;
  reasons: string[];
  riskScore: number; // 0-100
  recommendations: string[];
}

export class CredentialAuditLogger {
  private logger: VERSATILLogger;
  private auditLogPath: string;
  private retentionDays: number;
  private lastEntryHash: string = '';

  constructor(options: { retentionDays?: number } = {}) {
    this.logger = new VERSATILLogger('CredentialAuditLogger');
    this.retentionDays = options.retentionDays ?? 90;

    // Store audit logs in ~/.versatil/logs/credential-audit.jsonl
    const versatilHome = path.join(os.homedir(), '.versatil');
    const logsDir = path.join(versatilHome, 'logs');
    this.auditLogPath = path.join(logsDir, 'credential-audit.jsonl');

    this.initialize();
  }

  /**
   * Initialize audit logger
   */
  private async initialize(): Promise<void> {
    try {
      // Ensure logs directory exists
      const logsDir = path.dirname(this.auditLogPath);
      await fs.mkdir(logsDir, { recursive: true });

      // Load last entry hash for chain integrity
      await this.loadLastEntryHash();

      // Schedule cleanup of old logs
      this.scheduleCleanup();

      this.logger.info('Credential audit logger initialized', {
        logPath: this.auditLogPath,
        retentionDays: this.retentionDays
      });

    } catch (error) {
      this.logger.error('Failed to initialize audit logger', { error });
    }
  }

  /**
   * Load hash of last log entry (for chain integrity)
   */
  private async loadLastEntryHash(): Promise<void> {
    try {
      const content = await fs.readFile(this.auditLogPath, 'utf8');
      const lines = content.trim().split('\n');

      if (lines.length > 0) {
        const lastEntry = JSON.parse(lines[lines.length - 1]) as AuditLogEntry;
        this.lastEntryHash = lastEntry.hash;
      }

    } catch (error) {
      // File doesn't exist or is empty - start fresh
      this.lastEntryHash = '';
    }
  }

  /**
   * Log credential access event
   */
  async logAccess(event: CredentialAccessEvent): Promise<void> {
    try {
      // Create audit log entry
      const entry: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: event.timestamp.toISOString(),
        projectId: event.projectId,
        projectPath: event.projectPath,
        service: event.service,
        credentialKey: event.credentialKey,
        action: event.action,
        success: event.success,
        user: event.user || os.userInfo().username,
        hostname: os.hostname(),
        error: event.error,
        metadata: event.metadata,
        hash: this.computeEntryHash(event)
      };

      // Append to log file (JSONL format - one JSON object per line)
      await fs.appendFile(
        this.auditLogPath,
        JSON.stringify(entry) + '\n',
        { encoding: 'utf8' }
      );

      // Update last entry hash
      this.lastEntryHash = entry.hash;

      // Log to main logger (info level for success, warn for failures)
      if (event.success) {
        this.logger.info('Credential access logged', {
          action: event.action,
          service: event.service,
          projectId: event.projectId
        });
      } else {
        this.logger.warn('Failed credential access logged', {
          action: event.action,
          service: event.service,
          projectId: event.projectId,
          error: event.error
        });
      }

    } catch (error) {
      this.logger.error('Failed to log credential access', { error, event });
    }
  }

  /**
   * Compute hash for entry (includes previous hash for chain integrity)
   */
  private computeEntryHash(event: CredentialAccessEvent): string {
    const data = {
      timestamp: event.timestamp.toISOString(),
      projectId: event.projectId,
      service: event.service,
      action: event.action,
      success: event.success,
      previousHash: this.lastEntryHash
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Get audit summary for a project
   */
  async getProjectSummary(projectId: string, days: number = 30): Promise<AuditSummary> {
    const entries = await this.readLogEntries();

    // Filter by project and time range
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const projectEntries = entries.filter(e =>
      e.projectId === projectId &&
      new Date(e.timestamp) >= cutoffDate
    );

    // Calculate summary statistics
    const summary: AuditSummary = {
      totalEvents: projectEntries.length,
      successfulAccesses: projectEntries.filter(e => e.success).length,
      failedAccesses: projectEntries.filter(e => !e.success).length,
      uniqueProjects: new Set(projectEntries.map(e => e.projectId)),
      uniqueServices: new Set(projectEntries.map(e => e.service)),
      accessesByAction: {},
      recentEvents: projectEntries.slice(-10) // Last 10 events
    };

    // Count by action type
    for (const entry of projectEntries) {
      summary.accessesByAction[entry.action] = (summary.accessesByAction[entry.action] || 0) + 1;
    }

    return summary;
  }

  /**
   * Detect anomalous credential access patterns
   */
  async detectAnomalies(projectId: string): Promise<AnomalyDetection> {
    const entries = await this.readLogEntries();
    const projectEntries = entries.filter(e => e.projectId === projectId);

    const reasons: string[] = [];
    let riskScore = 0;

    // Check for high failure rate
    const failureRate = projectEntries.filter(e => !e.success).length / projectEntries.length;
    if (failureRate > 0.3) {
      reasons.push(`High failure rate: ${(failureRate * 100).toFixed(1)}% (normal < 10%)`);
      riskScore += 30;
    }

    // Check for unusual access times (middle of night)
    const nightAccesses = projectEntries.filter(e => {
      const hour = new Date(e.timestamp).getHours();
      return hour >= 2 && hour <= 5; // 2-5 AM
    });

    if (nightAccesses.length > projectEntries.length * 0.2) {
      reasons.push(`Unusual access times: ${nightAccesses.length} accesses during 2-5 AM`);
      riskScore += 20;
    }

    // Check for rapid successive accesses (potential brute force)
    const recentHour = entries.filter(e =>
      e.projectId === projectId &&
      new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    );

    if (recentHour.length > 50) {
      reasons.push(`Unusually high access rate: ${recentHour.length} accesses in last hour`);
      riskScore += 25;
    }

    // Check for multiple failed attempts
    const recentFailed = entries.filter(e =>
      e.projectId === projectId &&
      !e.success &&
      new Date(e.timestamp) > new Date(Date.now() - 10 * 60 * 1000)
    );

    if (recentFailed.length >= 3) {
      reasons.push(`Multiple failed access attempts: ${recentFailed.length} in last 10 minutes`);
      riskScore += 25;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskScore >= 50) {
      recommendations.push('Review recent credential access logs');
      recommendations.push('Verify all access is from authorized users');
      recommendations.push('Consider rotating credentials');
    }

    if (failureRate > 0.3) {
      recommendations.push('Check for configuration issues or permission problems');
    }

    return {
      isAnomalous: riskScore >= 30,
      reasons,
      riskScore: Math.min(riskScore, 100),
      recommendations
    };
  }

  /**
   * Read all log entries from file
   */
  private async readLogEntries(): Promise<AuditLogEntry[]> {
    try {
      const content = await fs.readFile(this.auditLogPath, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());

      return lines.map(line => JSON.parse(line) as AuditLogEntry);

    } catch (error) {
      // File doesn't exist or is empty
      return [];
    }
  }

  /**
   * Verify log chain integrity
   */
  async verifyLogIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const entries = await this.readLogEntries();
    const errors: string[] = [];

    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];

      // Recompute expected hash
      const expectedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          timestamp: current.timestamp,
          projectId: current.projectId,
          service: current.service,
          action: current.action,
          success: current.success,
          previousHash: previous.hash
        }))
        .digest('hex');

      if (current.hash !== expectedHash) {
        errors.push(`Integrity violation at entry ${i} (${current.id}): hash mismatch`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Schedule cleanup of old log entries
   */
  private scheduleCleanup(): void {
    // Run cleanup daily
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);

    // Run cleanup on startup
    this.cleanupOldLogs();
  }

  /**
   * Remove log entries older than retention period
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const entries = await this.readLogEntries();
      const cutoffDate = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);

      // Keep only entries within retention period
      const retainedEntries = entries.filter(e => new Date(e.timestamp) >= cutoffDate);

      if (retainedEntries.length < entries.length) {
        // Rewrite log file with retained entries
        const content = retainedEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
        await fs.writeFile(this.auditLogPath, content, { encoding: 'utf8' });

        this.logger.info('Cleaned up old audit logs', {
          removed: entries.length - retainedEntries.length,
          retained: retainedEntries.length
        });
      }

    } catch (error) {
      this.logger.error('Failed to cleanup old logs', { error });
    }
  }

  /**
   * Export audit logs for compliance/analysis
   */
  async exportLogs(outputPath: string, projectId?: string): Promise<void> {
    try {
      const entries = await this.readLogEntries();

      // Filter by project if specified
      const filteredEntries = projectId
        ? entries.filter(e => e.projectId === projectId)
        : entries;

      // Write to output file
      await fs.writeFile(
        outputPath,
        JSON.stringify(filteredEntries, null, 2),
        { encoding: 'utf8' }
      );

      this.logger.info('Audit logs exported', {
        outputPath,
        projectId,
        count: filteredEntries.length
      });

    } catch (error) {
      this.logger.error('Failed to export audit logs', { error, outputPath });
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
let auditLoggerInstance: CredentialAuditLogger | null = null;

export function getCredentialAuditLogger(): CredentialAuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new CredentialAuditLogger();
  }
  return auditLoggerInstance;
}
