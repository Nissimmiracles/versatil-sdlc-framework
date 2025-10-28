/**
 * Security Report Generator
 * Generates comprehensive security reports from Observatory scans
 * Outputs: JSON, Markdown, HTML, CSV formats
 */
import { ObservatoryScanResult, SecurityHeaderValidation } from './observatory-scanner.js';
export interface SecurityReport {
    id: string;
    timestamp: number;
    url: string;
    grade: string;
    score: number;
    pass: boolean;
    summary: {
        tests_passed: number;
        tests_failed: number;
        tests_total: number;
        pass_percentage: number;
    };
    headers: {
        present: string[];
        missing: string[];
        invalid: string[];
    };
    vulnerabilities: ReportVulnerability[];
    recommendations: ReportRecommendation[];
    remediation_steps: RemediationStep[];
}
export interface ReportVulnerability {
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    impact: string;
    affected_components: string[];
    cwe?: string;
}
export interface ReportRecommendation {
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    implementation_time: string;
    effort: 'quick' | 'medium' | 'complex';
}
export interface RemediationStep {
    step: number;
    action: string;
    code_example?: string;
    verification: string;
    resources: string[];
}
export declare class SecurityReportGenerator {
    private logger;
    private outputDir;
    constructor(outputDir?: string);
    /**
     * Generate comprehensive security report
     */
    generateReport(scanResult: ObservatoryScanResult, validations: SecurityHeaderValidation[]): Promise<SecurityReport>;
    /**
     * Determine if grade passes minimum threshold
     */
    private determinePass;
    /**
     * Analyze header presence and validity
     */
    private analyzeHeaders;
    /**
     * Extract vulnerabilities from scan results
     */
    private extractVulnerabilities;
    /**
     * Generate prioritized recommendations
     */
    private generateRecommendations;
    /**
     * Generate step-by-step remediation guide
     */
    private generateRemediationSteps;
    /**
     * Export report to JSON
     */
    exportJSON(report: SecurityReport, filename?: string): Promise<string>;
    /**
     * Export report to Markdown
     */
    exportMarkdown(report: SecurityReport, filename?: string): Promise<string>;
    /**
     * Generate Markdown report
     */
    private generateMarkdown;
    /**
     * Helper: Get grade emoji
     */
    private getGradeEmoji;
    /**
     * Helper: Get severity badge
     */
    private getSeverityBadge;
    /**
     * Helper: Get priority badge
     */
    private getPriorityBadge;
    /**
     * Helper: Map score modifier to severity
     */
    private mapScoreToSeverity;
    /**
     * Helper: Format test name
     */
    private formatTestName;
    /**
     * Helper: Map test to CWE
     */
    private mapTestToCWE;
    /**
     * Helper: Get header severity
     */
    private getHeaderSeverity;
    /**
     * Helper: Get middleware installation example
     */
    private getMiddlewareExample;
    /**
     * Helper: Ensure directory exists
     */
    private ensureDirectoryExists;
}
export declare const securityReportGenerator: SecurityReportGenerator;
