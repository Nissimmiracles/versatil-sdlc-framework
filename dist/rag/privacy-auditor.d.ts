/**
 * Privacy Auditor - Post-Storage Leak Detection and Compliance
 *
 * Validates Public RAG patterns for privacy compliance:
 * - Pre-storage audit: Scan pattern before adding to Public RAG
 * - Post-storage audit: Periodic re-validation of stored patterns
 * - Leak detection: Check for accidentally leaked private data
 * - Compliance reporting: Generate audit logs for GDPR/SOC2
 *
 * Ensures zero data leaks and maintains audit trail.
 */
import { PatternNode } from '../lib/graphrag-store.js';
export declare enum AuditSeverity {
    INFO = "info",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum AuditAction {
    ALLOW = "allow",
    WARN = "warn",
    QUARANTINE = "quarantine",
    DELETE = "delete"
}
export interface AuditFinding {
    patternId: string;
    severity: AuditSeverity;
    action: AuditAction;
    finding: string;
    leakedValue: string;
    location: string;
    recommendation: string;
    timestamp: string;
}
export interface AuditReport {
    auditId: string;
    timestamp: string;
    patternsScanned: number;
    findingsCount: number;
    findings: AuditFinding[];
    severityCounts: Record<AuditSeverity, number>;
    actionsTaken: Record<AuditAction, number>;
    summary: string;
}
/**
 * Privacy Auditor Service
 */
export declare class PrivacyAuditor {
    private projectFingerprint;
    private auditLogPath;
    private initialized;
    constructor();
    /**
     * Initialize auditor with project fingerprint
     */
    initialize(): Promise<void>;
    /**
     * Pre-storage audit: Validate pattern before adding to Public RAG
     */
    auditBeforeStorage(pattern: PatternNode): Promise<AuditFinding[]>;
    /**
     * Post-storage audit: Scan existing patterns in Public RAG
     */
    auditPublicRAGPatterns(patterns: PatternNode[]): Promise<AuditReport>;
    /**
     * Find location of leaked value in pattern
     */
    private findLocation;
    /**
     * Sanitize value for logging (hide most of the value)
     */
    private sanitizeForLog;
    /**
     * Log findings to audit log file
     */
    private logFindings;
    /**
     * Log full audit report
     */
    private logAuditReport;
    /**
     * Get audit log path
     */
    getAuditLogPath(): string;
    /**
     * Validate pattern is safe for Public RAG
     */
    validatePattern(pattern: PatternNode): Promise<{
        isSafe: boolean;
        findings: AuditFinding[];
        recommendation: string;
    }>;
    /**
     * Generate compliance report for GDPR/SOC2
     */
    generateComplianceReport(): string;
}
export declare function getPrivacyAuditor(): PrivacyAuditor;
export declare const privacyAuditor: PrivacyAuditor;
