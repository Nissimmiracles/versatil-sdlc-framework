/**
 * James-Frontend Design Research Module
 *
 * Provides design intelligence through ethical web scraping:
 * - Extract design systems (colors, fonts, spacing)
 * - Analyze component patterns (buttons, cards, forms)
 * - Benchmark accessibility (WCAG compliance)
 * - Compare performance (load times, bundle sizes)
 *
 * Uses Playwright Stealth for 92% bot detection bypass.
 */
import { type DesignResearchReport } from '../../../mcp/design-scraper.js';
export interface DesignResearchOptions {
    saveReport?: boolean;
    outputFormat?: 'json' | 'markdown' | 'both';
    includeDesignSystem?: boolean;
    includeComponents?: boolean;
    includeAccessibility?: boolean;
    includePerformance?: boolean;
}
export declare class JamesDesignResearch {
    private reportsDir;
    constructor();
    /**
     * Research competitor/inspiration site for design patterns
     *
     * @param url - URL to research
     * @param options - Research configuration
     * @returns Design research report
     */
    research(url: string, options?: DesignResearchOptions): Promise<DesignResearchReport>;
    /**
     * Quick design system extraction
     */
    extractDesignSystem(url: string): Promise<any>;
    /**
     * Quick component analysis
     */
    analyzeComponents(url: string): Promise<any>;
    /**
     * Quick accessibility check
     */
    checkAccessibility(url: string): Promise<any>;
    /**
     * Quick performance benchmark
     */
    benchmarkPerformance(url: string): Promise<any>;
    /**
     * Save design research report
     */
    private saveReport;
    /**
     * Display research summary
     */
    private displaySummary;
    /**
     * List all saved research reports
     */
    listReports(): Promise<string[]>;
    /**
     * Load a saved report
     */
    loadReport(filename: string): Promise<DesignResearchReport | null>;
}
export declare const jamesDesignResearch: JamesDesignResearch;
export declare function researchDesign(url: string, options?: DesignResearchOptions): Promise<DesignResearchReport>;
export declare function extractDesignSystem(url: string): Promise<any>;
export declare function analyzeComponents(url: string): Promise<any>;
export declare function checkAccessibility(url: string): Promise<any>;
export declare function benchmarkPerformance(url: string): Promise<any>;
