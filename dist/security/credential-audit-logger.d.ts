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
    id: string;
    timestamp: string;
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
    hash: string;
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
    riskScore: number;
    recommendations: string[];
}
export declare class CredentialAuditLogger {
    private logger;
    private auditLogPath;
    private retentionDays;
    private lastEntryHash;
    constructor(options?: {
        retentionDays?: number;
    });
    /**
     * Initialize audit logger
     */
    private initialize;
    /**
     * Load hash of last log entry (for chain integrity)
     */
    private loadLastEntryHash;
    /**
     * Log credential access event
     */
    logAccess(event: CredentialAccessEvent): Promise<void>;
    /**
     * Compute hash for entry (includes previous hash for chain integrity)
     */
    private computeEntryHash;
    /**
     * Get audit summary for a project
     */
    getProjectSummary(projectId: string, days?: number): Promise<AuditSummary>;
    /**
     * Detect anomalous credential access patterns
     */
    detectAnomalies(projectId: string): Promise<AnomalyDetection>;
    /**
     * Read all log entries from file
     */
    private readLogEntries;
    /**
     * Verify log chain integrity
     */
    verifyLogIntegrity(): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Schedule cleanup of old log entries
     */
    private scheduleCleanup;
    /**
     * Remove log entries older than retention period
     */
    private cleanupOldLogs;
    /**
     * Export audit logs for compliance/analysis
     */
    exportLogs(outputPath: string, projectId?: string): Promise<void>;
}
export declare function getCredentialAuditLogger(): CredentialAuditLogger;
