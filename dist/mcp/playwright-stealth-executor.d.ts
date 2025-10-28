/**
 * Playwright Stealth Executor - Bot Detection Avoidance + Design Scraping
 *
 * Capabilities:
 * - 92% bot detection bypass rate (playwright-extra + stealth plugin)
 * - Design system extraction (colors, fonts, spacing)
 * - Component structure analysis
 * - Accessibility benchmarking
 * - Performance comparison
 *
 * Used by:
 * - James-Frontend: Design research and UI pattern extraction
 * - Maria-QA: Reliable E2E testing against anti-bot systems
 */
import type { MCPExecutionResult } from './chrome-mcp-executor.js';
export interface DesignSystemData {
    colors: {
        primary: string[];
        secondary: string[];
        neutral: string[];
        semantic: {
            success: string;
            warning: string;
            error: string;
            info: string;
        };
    };
    typography: {
        fontFamilies: string[];
        fontSizes: string[];
        fontWeights: string[];
        lineHeights: string[];
    };
    spacing: {
        scale: string[];
        commonPatterns: string[];
    };
    layout: {
        maxWidth: string;
        breakpoints: string[];
        gridSystem: string;
    };
    components: {
        buttons: ComponentPattern[];
        cards: ComponentPattern[];
        forms: ComponentPattern[];
        modals: ComponentPattern[];
    };
}
export interface ComponentPattern {
    selector: string;
    styles: Record<string, string>;
    structure: string;
    accessibility: {
        hasAriaLabel: boolean;
        hasRole: boolean;
        keyboardNavigable: boolean;
    };
}
export interface PerformanceBenchmark {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    bundleSize: {
        js: number;
        css: number;
        images: number;
        total: number;
    };
    requests: {
        total: number;
        failed: number;
        cached: number;
    };
}
export declare class PlaywrightStealthExecutor {
    private browser;
    private context;
    private page;
    private rateLimitDelay;
    private lastRequestTime;
    /**
     * Execute stealth action with bot detection avoidance
     */
    executeStealthAction(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Scrape design system (colors, fonts, spacing, layout)
     */
    private scrapeDesignSystem;
    /**
     * Analyze component structure and patterns
     */
    private analyzeComponents;
    /**
     * Benchmark performance metrics
     */
    private benchmarkPerformance;
    /**
     * Extract accessibility patterns
     */
    private extractAccessibility;
    /**
     * Calculate accessibility score (0-100)
     */
    private calculateAccessibilityScore;
    /**
     * Launch browser with stealth mode if not already running
     */
    private launchBrowserIfNeeded;
    /**
     * Enforce rate limiting (ethical scraping)
     */
    private enforceRateLimit;
    /**
     * Close browser session
     */
    private close;
}
export declare const playwrightStealthExecutor: PlaywrightStealthExecutor;
