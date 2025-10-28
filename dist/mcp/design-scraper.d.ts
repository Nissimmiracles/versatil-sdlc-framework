/**
 * Design Scraper Utilities
 *
 * Provides high-level design research capabilities for James-Frontend agent.
 * All scraping is rate-limited and ethical (respects robots.txt).
 */
import type { MCPExecutionResult } from './chrome-mcp-executor.js';
export interface DesignResearchReport {
    url: string;
    timestamp: Date;
    designSystem?: any;
    components?: any;
    accessibility?: any;
    performance?: any;
    recommendations: string[];
    ethicalCompliance: {
        rateLimit: boolean;
        robotsTxtChecked: boolean;
        publicDataOnly: boolean;
    };
}
export declare class DesignScraper {
    /**
     * Comprehensive design research (all analysis types)
     */
    researchDesign(url: string, options?: {
        includeDesignSystem?: boolean;
        includeComponents?: boolean;
        includeAccessibility?: boolean;
        includePerformance?: boolean;
    }): Promise<DesignResearchReport>;
    /**
     * Quick design system extraction only
     */
    extractDesignSystem(url: string): Promise<MCPExecutionResult>;
    /**
     * Quick component analysis only
     */
    analyzeComponents(url: string): Promise<MCPExecutionResult>;
    /**
     * Quick accessibility check only
     */
    checkAccessibility(url: string): Promise<MCPExecutionResult>;
    /**
     * Quick performance benchmark only
     */
    benchmarkPerformance(url: string): Promise<MCPExecutionResult>;
    /**
     * Format design research report as markdown
     */
    formatReportAsMarkdown(report: DesignResearchReport): string;
}
export declare const designScraper: DesignScraper;
