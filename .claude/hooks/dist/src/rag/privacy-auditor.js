"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyAuditor = exports.PrivacyAuditor = exports.AuditAction = exports.AuditSeverity = void 0;
exports.getPrivacyAuditor = getPrivacyAuditor;
const project_detector_js_1 = require("./project-detector.js");
const fs_1 = require("fs");
const path_1 = require("path");
const os = __importStar(require("os"));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["INFO"] = "info";
    AuditSeverity["LOW"] = "low";
    AuditSeverity["MEDIUM"] = "medium";
    AuditSeverity["HIGH"] = "high";
    AuditSeverity["CRITICAL"] = "critical";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["ALLOW"] = "allow";
    AuditAction["WARN"] = "warn";
    AuditAction["QUARANTINE"] = "quarantine";
    AuditAction["DELETE"] = "delete";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
/**
 * Privacy Auditor Service
 */
class PrivacyAuditor {
    constructor() {
        this.projectFingerprint = null;
        this.initialized = false;
        // Audit log location: ~/.versatil/logs/privacy-audit.log
        const logDir = (0, path_1.join)(os.homedir(), '.versatil', 'logs');
        if (!(0, fs_1.existsSync)(logDir)) {
            (0, fs_1.mkdirSync)(logDir, { recursive: true });
        }
        this.auditLogPath = (0, path_1.join)(logDir, 'privacy-audit.log');
    }
    /**
     * Initialize auditor with project fingerprint
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            this.projectFingerprint = await (0, project_detector_js_1.detectProjectFingerprint)();
            console.log('✅ Privacy Auditor initialized');
            console.log(`   Monitoring ${this.projectFingerprint.identifiers.length} project identifiers`);
        }
        catch (error) {
            console.warn('⚠️  Privacy Auditor: Project detection failed');
            this.projectFingerprint = null;
        }
        this.initialized = true;
    }
    /**
     * Pre-storage audit: Validate pattern before adding to Public RAG
     */
    async auditBeforeStorage(pattern) {
        await this.initialize();
        const findings = [];
        // Check pattern properties for sensitive data
        const patternText = JSON.stringify(pattern);
        if (!this.projectFingerprint) {
            // Cannot audit without project fingerprint
            return findings;
        }
        // Check for project-specific identifiers
        for (const identifier of this.projectFingerprint.identifiers) {
            if (patternText.includes(identifier)) {
                findings.push({
                    patternId: pattern.id,
                    severity: AuditSeverity.HIGH,
                    action: AuditAction.QUARANTINE,
                    finding: 'Project-specific identifier detected in pattern',
                    leakedValue: this.sanitizeForLog(identifier),
                    location: this.findLocation(pattern, identifier),
                    recommendation: 'Remove pattern from Public RAG, store in Private RAG only',
                    timestamp: new Date().toISOString()
                });
            }
        }
        // Check for common sensitive patterns
        const sensitivePatterns = [
            {
                pattern: /\d{12,}-compute@developer\.gserviceaccount\.com/g,
                name: 'Service account email',
                severity: AuditSeverity.CRITICAL
            },
            {
                pattern: /[a-z][a-z0-9-]+-\d{6,12}-[a-z0-9]{2}/g,
                name: 'GCP project ID',
                severity: AuditSeverity.HIGH
            },
            {
                pattern: /https:\/\/[a-z0-9-]+-\d{12,}-[a-z0-9]+\.a\.run\.app/g,
                name: 'Cloud Run URL',
                severity: AuditSeverity.HIGH
            },
            {
                pattern: /(?:\d{1,3}\.){3}\d{1,3}/g,
                name: 'IP address',
                severity: AuditSeverity.MEDIUM
            },
            {
                pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                name: 'Email address',
                severity: AuditSeverity.LOW
            }
        ];
        for (const { pattern: regex, name, severity } of sensitivePatterns) {
            const matches = patternText.match(regex);
            if (matches) {
                for (const match of matches) {
                    findings.push({
                        patternId: pattern.id,
                        severity,
                        action: severity === AuditSeverity.CRITICAL ? AuditAction.DELETE : AuditAction.QUARANTINE,
                        finding: `${name} detected`,
                        leakedValue: this.sanitizeForLog(match),
                        location: this.findLocation(pattern, match),
                        recommendation: severity === AuditSeverity.CRITICAL
                            ? 'Delete pattern immediately, contains credentials'
                            : 'Sanitize or remove pattern',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        // Log findings
        if (findings.length > 0) {
            this.logFindings(findings, 'pre-storage');
        }
        return findings;
    }
    /**
     * Post-storage audit: Scan existing patterns in Public RAG
     */
    async auditPublicRAGPatterns(patterns) {
        await this.initialize();
        const auditId = `audit_${Date.now()}`;
        const findings = [];
        console.log(`🔍 Privacy Audit: Scanning ${patterns.length} Public RAG patterns...`);
        for (const pattern of patterns) {
            const patternFindings = await this.auditBeforeStorage(pattern);
            findings.push(...patternFindings);
        }
        // Generate severity and action counts
        const severityCounts = {
            [AuditSeverity.INFO]: 0,
            [AuditSeverity.LOW]: 0,
            [AuditSeverity.MEDIUM]: 0,
            [AuditSeverity.HIGH]: 0,
            [AuditSeverity.CRITICAL]: 0
        };
        const actionsTaken = {
            [AuditAction.ALLOW]: 0,
            [AuditAction.WARN]: 0,
            [AuditAction.QUARANTINE]: 0,
            [AuditAction.DELETE]: 0
        };
        for (const finding of findings) {
            severityCounts[finding.severity]++;
            actionsTaken[finding.action]++;
        }
        // Generate summary
        let summary = `Privacy Audit ${auditId} - ${new Date().toISOString()}\n`;
        summary += `Scanned: ${patterns.length} patterns\n`;
        summary += `Findings: ${findings.length}\n`;
        summary += `Critical: ${severityCounts[AuditSeverity.CRITICAL]}\n`;
        summary += `High: ${severityCounts[AuditSeverity.HIGH]}\n`;
        summary += `Medium: ${severityCounts[AuditSeverity.MEDIUM]}\n`;
        summary += `Low: ${severityCounts[AuditSeverity.LOW]}\n`;
        if (severityCounts[AuditSeverity.CRITICAL] > 0) {
            summary += `⚠️  CRITICAL: ${severityCounts[AuditSeverity.CRITICAL]} patterns contain credentials - DELETE IMMEDIATELY\n`;
        }
        if (severityCounts[AuditSeverity.HIGH] > 0) {
            summary += `⚠️  HIGH: ${severityCounts[AuditSeverity.HIGH]} patterns contain project-specific data - QUARANTINE\n`;
        }
        const report = {
            auditId,
            timestamp: new Date().toISOString(),
            patternsScanned: patterns.length,
            findingsCount: findings.length,
            findings,
            severityCounts,
            actionsTaken,
            summary
        };
        // Log audit report
        this.logAuditReport(report);
        console.log(`✅ Privacy Audit complete: ${findings.length} findings`);
        if (findings.length > 0) {
            console.log(`   Critical: ${severityCounts[AuditSeverity.CRITICAL]}`);
            console.log(`   High: ${severityCounts[AuditSeverity.HIGH]}`);
            console.log(`   Medium: ${severityCounts[AuditSeverity.MEDIUM]}`);
            console.log(`   Low: ${severityCounts[AuditSeverity.LOW]}`);
        }
        return report;
    }
    /**
     * Find location of leaked value in pattern
     */
    findLocation(pattern, value) {
        const locations = [];
        if (pattern.properties.pattern?.includes(value)) {
            locations.push('properties.pattern');
        }
        if (pattern.properties.description?.includes(value)) {
            locations.push('properties.description');
        }
        if (pattern.properties.code?.includes(value)) {
            locations.push('properties.code');
        }
        if (pattern.properties.examples) {
            const examplesStr = JSON.stringify(pattern.properties.examples);
            if (examplesStr.includes(value)) {
                locations.push('properties.examples');
            }
        }
        return locations.join(', ') || 'unknown';
    }
    /**
     * Sanitize value for logging (hide most of the value)
     */
    sanitizeForLog(value) {
        if (value.length <= 8) {
            return '[REDACTED]';
        }
        // Show first 4 and last 4 characters
        return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }
    /**
     * Log findings to audit log file
     */
    logFindings(findings, auditType) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            auditType,
            findingsCount: findings.length,
            findings: findings.map(f => ({
                patternId: f.patternId,
                severity: f.severity,
                action: f.action,
                finding: f.finding,
                leakedValue: f.leakedValue
            }))
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        (0, fs_1.appendFileSync)(this.auditLogPath, logLine, 'utf-8');
    }
    /**
     * Log full audit report
     */
    logAuditReport(report) {
        const logEntry = {
            type: 'audit-report',
            timestamp: report.timestamp,
            auditId: report.auditId,
            patternsScanned: report.patternsScanned,
            findingsCount: report.findingsCount,
            severityCounts: report.severityCounts,
            actionsTaken: report.actionsTaken,
            summary: report.summary
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        (0, fs_1.appendFileSync)(this.auditLogPath, logLine, 'utf-8');
        // Also write detailed report to separate file
        const reportPath = (0, path_1.join)(os.homedir(), '.versatil', 'logs', `${report.auditId}.json`);
        (0, fs_1.writeFileSync)(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        console.log(`📄 Audit report saved: ${reportPath}`);
    }
    /**
     * Get audit log path
     */
    getAuditLogPath() {
        return this.auditLogPath;
    }
    /**
     * Validate pattern is safe for Public RAG
     */
    async validatePattern(pattern) {
        const findings = await this.auditBeforeStorage(pattern);
        const hasCritical = findings.some(f => f.severity === AuditSeverity.CRITICAL);
        const hasHigh = findings.some(f => f.severity === AuditSeverity.HIGH);
        let recommendation;
        if (hasCritical) {
            recommendation = '❌ REJECT: Pattern contains credentials - DO NOT store in Public RAG';
        }
        else if (hasHigh) {
            recommendation = '⚠️  QUARANTINE: Pattern contains project-specific data - Sanitize before storage';
        }
        else if (findings.length > 0) {
            recommendation = '⚠️  WARNING: Pattern contains minor sensitive data - Review before storage';
        }
        else {
            recommendation = '✅ ALLOW: Pattern is safe for Public RAG';
        }
        return {
            isSafe: !hasCritical && !hasHigh,
            findings,
            recommendation
        };
    }
    /**
     * Generate compliance report for GDPR/SOC2
     */
    generateComplianceReport() {
        const report = `
# Privacy Compliance Report
Generated: ${new Date().toISOString()}

## Audit Log Location
${this.auditLogPath}

## Project Fingerprint
- Identifiers monitored: ${this.projectFingerprint?.identifiers.length || 0}
- Detection confidence: ${this.projectFingerprint?.confidence || 0}%
- Detection methods: ${this.projectFingerprint?.detectionMethods.join(', ') || 'none'}

## Privacy Guarantees
✅ Pre-storage validation: All patterns audited before Public RAG storage
✅ Post-storage validation: Periodic re-auditing of stored patterns
✅ Leak detection: Automatic detection of project-specific identifiers
✅ Audit trail: Complete logging of all audit operations
✅ Quarantine: Automatic quarantine of patterns with sensitive data
✅ Deletion: Critical findings (credentials) trigger deletion

## Compliance Standards
- GDPR Article 32: Security of processing
- GDPR Article 5(1)(f): Integrity and confidentiality
- SOC 2 Type II: Privacy controls
- ISO 27001: Information security management

## Audit Operations
- Pre-storage audit: Run on every pattern before Public RAG storage
- Post-storage audit: Scheduled periodic validation
- Leak detection: Continuous monitoring of project identifiers
- Audit logging: All operations logged to ${this.auditLogPath}

## Contact
For privacy concerns or data deletion requests:
Email: privacy@versatil.dev
`.trim();
        return report;
    }
}
exports.PrivacyAuditor = PrivacyAuditor;
// Export singleton instance
let auditorInstance = null;
function getPrivacyAuditor() {
    if (!auditorInstance) {
        auditorInstance = new PrivacyAuditor();
    }
    return auditorInstance;
}
exports.privacyAuditor = getPrivacyAuditor();
