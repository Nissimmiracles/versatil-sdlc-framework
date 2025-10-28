/**
 * VERSATIL Session Report Generator
 *
 * Generates comprehensive markdown reports from session analysis and learnings.
 * Reports are stored in ~/.versatil/sessions/SESSION_ID/report.md
 *
 * Features:
 * - Markdown report with metrics, patterns, lessons
 * - Brief mode for terminal display
 * - Detailed mode for file storage
 * - Recommendations for next session
 */
import { SessionAnalysis } from './session-analyzer.js';
import { ExtractedLearnings } from './learning-extractor.js';
import { CodificationResult } from './learning-codifier.js';
export interface SessionReport {
    sessionId: string;
    markdown: string;
    brief: string;
    summary: {
        timeSaved: number;
        qualityScore: number;
        impactScore: number;
        compoundingScore: number;
        topPatterns: string[];
        recommendations: string[];
    };
}
export declare class SessionReportGenerator {
    /**
     * Generate complete session report
     */
    generateReport(analysis: SessionAnalysis, learnings: ExtractedLearnings, codificationResult: CodificationResult): Promise<SessionReport>;
    /**
     * Generate full markdown report
     */
    private generateMarkdownReport;
    /**
     * Generate brief terminal-friendly report
     */
    private generateBriefReport;
    /**
     * Generate summary object
     */
    private generateSummary;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Format code changes table
     */
    private formatCodeChanges;
    /**
     * Format status with emoji
     */
    private formatStatus;
    /**
     * Save report to disk
     */
    private saveReport;
}
/**
 * Factory function
 */
export declare function createSessionReportGenerator(): SessionReportGenerator;
