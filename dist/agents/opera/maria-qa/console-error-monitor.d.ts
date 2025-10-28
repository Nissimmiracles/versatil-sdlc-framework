/**
 * Console Error Monitor
 *
 * Advanced console error monitoring for frontend testing.
 * Captures, categorizes, and analyzes console errors during browser automation.
 *
 * Features:
 * - Real-time console error capture
 * - Error categorization (React, API, JS, 3rd party)
 * - Severity calculation
 * - Stack trace analysis
 * - Pattern recognition
 * - Historical error tracking
 *
 * @module agents/opera/maria-qa/console-error-monitor
 * @version 6.2.0
 */
import { Page } from 'playwright';
/**
 * Console error interface
 */
export interface ConsoleError {
    id: string;
    timestamp: Date;
    type: 'error' | 'warning' | 'pageerror' | 'uncaught';
    message: string;
    stack?: string;
    location?: {
        url: string;
        lineNumber?: number;
        columnNumber?: number;
    };
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'react' | 'api' | 'javascript' | 'third_party' | 'unknown';
    source?: string;
}
/**
 * Error category interface
 */
export interface ErrorCategory {
    react_errors: ConsoleError[];
    api_errors: ConsoleError[];
    javascript_errors: ConsoleError[];
    third_party_errors: ConsoleError[];
    unknown_errors: ConsoleError[];
}
/**
 * Console monitoring result
 */
export interface ConsoleMonitoringResult {
    totalErrors: number;
    errorsByType: {
        error: number;
        warning: number;
        pageerror: number;
        uncaught: number;
    };
    errorsByCategory: {
        react: number;
        api: number;
        javascript: number;
        third_party: number;
        unknown: number;
    };
    errorsBySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    errors: ConsoleError[];
    categorizedErrors: ErrorCategory;
    hasReactErrors: boolean;
    hasAPIErrors: boolean;
    hasCriticalErrors: boolean;
    summary: string;
}
/**
 * Console Error Monitor
 *
 * Monitors and analyzes console errors during frontend testing.
 */
export declare class ConsoleErrorMonitor {
    private logger;
    private errors;
    private isMonitoring;
    private errorIdCounter;
    constructor();
    /**
     * Start monitoring console errors on a Playwright page
     */
    startMonitoring(page: Page): Promise<void>;
    /**
     * Stop monitoring and return results
     */
    stopMonitoring(): Promise<ConsoleMonitoringResult>;
    /**
     * Get current monitoring status
     */
    getStatus(): {
        isMonitoring: boolean;
        errorCount: number;
    };
    /**
     * Clear all captured errors
     */
    clearErrors(): void;
    /**
     * Capture console message (error or warning)
     */
    private captureConsoleMessage;
    /**
     * Capture page error (uncaught exception)
     */
    private capturePageError;
    /**
     * Capture request failure (API error)
     */
    private captureRequestFailure;
    /**
     * Calculate error severity
     */
    private calculateSeverity;
    /**
     * Categorize error by type
     */
    private categorizeError;
    /**
     * Generate monitoring result
     */
    private generateResult;
    /**
     * Generate summary text
     */
    private generateSummary;
    /**
     * Get empty result (when monitoring not active)
     */
    private getEmptyResult;
    /**
     * Generate unique error ID
     */
    private generateErrorId;
}
/**
 * Get singleton instance
 */
export declare function getConsoleErrorMonitor(): ConsoleErrorMonitor;
/**
 * Reset singleton (for testing)
 */
export declare function resetConsoleErrorMonitor(): void;
