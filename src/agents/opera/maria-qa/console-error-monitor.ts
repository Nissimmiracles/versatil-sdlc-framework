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

import { Page, ConsoleMessage } from 'playwright';
import { VERSATILLogger } from '../../../utils/logger.js';

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
export class ConsoleErrorMonitor {
  private logger: VERSATILLogger;
  private errors: ConsoleError[] = [];
  private isMonitoring: boolean = false;
  private errorIdCounter: number = 0;

  constructor() {
    this.logger = new VERSATILLogger('ConsoleErrorMonitor');
  }

  /**
   * Start monitoring console errors on a Playwright page
   */
  async startMonitoring(page: Page): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Console monitoring already active');
      return;
    }

    this.logger.info('Starting console error monitoring');
    this.isMonitoring = true;
    this.errors = [];
    this.errorIdCounter = 0;

    // Capture console messages
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        this.captureConsoleMessage(msg);
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error: Error) => {
      this.capturePageError(error);
    });

    // Capture request failures (API errors)
    page.on('requestfailed', (request) => {
      this.captureRequestFailure(request);
    });

    this.logger.debug('Console monitoring listeners attached');
  }

  /**
   * Stop monitoring and return results
   */
  async stopMonitoring(): Promise<ConsoleMonitoringResult> {
    if (!this.isMonitoring) {
      this.logger.warn('Console monitoring not active');
      return this.getEmptyResult();
    }

    this.logger.info('Stopping console error monitoring', {
      totalErrors: this.errors.length,
    });

    this.isMonitoring = false;

    return this.generateResult();
  }

  /**
   * Get current monitoring status
   */
  getStatus(): { isMonitoring: boolean; errorCount: number } {
    return {
      isMonitoring: this.isMonitoring,
      errorCount: this.errors.length,
    };
  }

  /**
   * Clear all captured errors
   */
  clearErrors(): void {
    this.errors = [];
    this.errorIdCounter = 0;
    this.logger.debug('Cleared all captured errors');
  }

  /**
   * Capture console message (error or warning)
   */
  private captureConsoleMessage(msg: ConsoleMessage): void {
    const error: ConsoleError = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      type: msg.type() === 'error' ? 'error' : 'warning',
      message: msg.text(),
      location: msg.location(),
      severity: this.calculateSeverity(msg.text(), msg.type()),
      category: this.categorizeError(msg.text()),
      source: msg.location()?.url || 'unknown',
    };

    this.errors.push(error);
    this.logger.debug('Captured console message', {
      type: error.type,
      category: error.category,
      severity: error.severity,
    });
  }

  /**
   * Capture page error (uncaught exception)
   */
  private capturePageError(error: Error): void {
    const consoleError: ConsoleError = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      severity: 'critical', // Uncaught exceptions are always critical
      category: this.categorizeError(error.message),
      source: 'page',
    };

    this.errors.push(consoleError);
    this.logger.debug('Captured page error', {
      message: error.message,
      category: consoleError.category,
    });
  }

  /**
   * Capture request failure (API error)
   */
  private captureRequestFailure(request: any): void {
    const error: ConsoleError = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      type: 'error',
      message: `Request failed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`,
      severity: 'high',
      category: 'api',
      source: request.url(),
    };

    this.errors.push(error);
    this.logger.debug('Captured request failure', {
      url: request.url(),
      error: request.failure()?.errorText,
    });
  }

  /**
   * Calculate error severity
   */
  private calculateSeverity(
    message: string,
    type: string
  ): 'critical' | 'high' | 'medium' | 'low' {
    // Critical severity indicators
    const criticalPatterns = [
      'uncaught',
      'fatal',
      'cannot read property',
      'is not a function',
      'is not defined',
      'maximum call stack',
      'out of memory',
    ];

    // High severity indicators
    const highPatterns = [
      'failed to fetch',
      'network error',
      'timeout',
      '500',
      '503',
      'server error',
    ];

    // Medium severity indicators
    const mediumPatterns = [
      'deprecated',
      '404',
      'not found',
      'warning',
      'invalid prop',
    ];

    const lowerMessage = message.toLowerCase();

    if (criticalPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return 'critical';
    }

    if (highPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return 'high';
    }

    if (mediumPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return 'medium';
    }

    return type === 'error' ? 'medium' : 'low';
  }

  /**
   * Categorize error by type
   */
  private categorizeError(
    message: string
  ): 'react' | 'api' | 'javascript' | 'third_party' | 'unknown' {
    const lowerMessage = message.toLowerCase();

    // React errors
    const reactPatterns = [
      'react',
      'jsx',
      'hook',
      'component',
      'render',
      'useeffect',
      'usestate',
      'props',
      'state',
    ];

    // API errors
    const apiPatterns = [
      'fetch',
      'api',
      'request',
      'response',
      'http',
      'xhr',
      'ajax',
      'network',
      '404',
      '500',
      '503',
    ];

    // Third-party errors
    const thirdPartyPatterns = [
      'node_modules',
      'cdn',
      'google',
      'facebook',
      'analytics',
      'gtag',
      'ga(',
    ];

    if (reactPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return 'react';
    }

    if (apiPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return 'api';
    }

    if (thirdPartyPatterns.some((pattern) => lowerMessage.includes(pattern))) {
      return 'third_party';
    }

    // Check if it's a standard JavaScript error
    if (
      lowerMessage.includes('error') ||
      lowerMessage.includes('exception') ||
      lowerMessage.includes('is not')
    ) {
      return 'javascript';
    }

    return 'unknown';
  }

  /**
   * Generate monitoring result
   */
  private generateResult(): ConsoleMonitoringResult {
    // Count by type
    const errorsByType = {
      error: 0,
      warning: 0,
      pageerror: 0,
      uncaught: 0,
    };

    // Count by category
    const errorsByCategory = {
      react: 0,
      api: 0,
      javascript: 0,
      third_party: 0,
      unknown: 0,
    };

    // Count by severity
    const errorsBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    // Categorized errors
    const categorizedErrors: ErrorCategory = {
      react_errors: [],
      api_errors: [],
      javascript_errors: [],
      third_party_errors: [],
      unknown_errors: [],
    };

    // Process all errors
    this.errors.forEach((error) => {
      // Count by type
      errorsByType[error.type as keyof typeof errorsByType]++;

      // Count by category
      errorsByCategory[error.category]++;

      // Count by severity
      errorsBySeverity[error.severity]++;

      // Categorize
      switch (error.category) {
        case 'react':
          categorizedErrors.react_errors.push(error);
          break;
        case 'api':
          categorizedErrors.api_errors.push(error);
          break;
        case 'javascript':
          categorizedErrors.javascript_errors.push(error);
          break;
        case 'third_party':
          categorizedErrors.third_party_errors.push(error);
          break;
        default:
          categorizedErrors.unknown_errors.push(error);
      }
    });

    // Generate summary
    const summary = this.generateSummary(errorsByCategory, errorsBySeverity);

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsByCategory,
      errorsBySeverity,
      errors: this.errors,
      categorizedErrors,
      hasReactErrors: errorsByCategory.react > 0,
      hasAPIErrors: errorsByCategory.api > 0,
      hasCriticalErrors: errorsBySeverity.critical > 0,
      summary,
    };
  }

  /**
   * Generate summary text
   */
  private generateSummary(
    errorsByCategory: Record<string, number>,
    errorsBySeverity: Record<string, number>
  ): string {
    const parts: string[] = [];

    if (this.errors.length === 0) {
      return '✅ No console errors detected';
    }

    parts.push(`⚠️ Detected ${this.errors.length} console error(s)`);

    // Severity breakdown
    const severityParts: string[] = [];
    if (errorsBySeverity.critical > 0)
      severityParts.push(`${errorsBySeverity.critical} critical`);
    if (errorsBySeverity.high > 0)
      severityParts.push(`${errorsBySeverity.high} high`);
    if (errorsBySeverity.medium > 0)
      severityParts.push(`${errorsBySeverity.medium} medium`);
    if (errorsBySeverity.low > 0)
      severityParts.push(`${errorsBySeverity.low} low`);

    if (severityParts.length > 0) {
      parts.push(`Severity: ${severityParts.join(', ')}`);
    }

    // Category breakdown
    const categoryParts: string[] = [];
    if (errorsByCategory.react > 0)
      categoryParts.push(`${errorsByCategory.react} React`);
    if (errorsByCategory.api > 0)
      categoryParts.push(`${errorsByCategory.api} API`);
    if (errorsByCategory.javascript > 0)
      categoryParts.push(`${errorsByCategory.javascript} JavaScript`);
    if (errorsByCategory.third_party > 0)
      categoryParts.push(`${errorsByCategory.third_party} 3rd party`);

    if (categoryParts.length > 0) {
      parts.push(`Categories: ${categoryParts.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Get empty result (when monitoring not active)
   */
  private getEmptyResult(): ConsoleMonitoringResult {
    return {
      totalErrors: 0,
      errorsByType: { error: 0, warning: 0, pageerror: 0, uncaught: 0 },
      errorsByCategory: {
        react: 0,
        api: 0,
        javascript: 0,
        third_party: 0,
        unknown: 0,
      },
      errorsBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      errors: [],
      categorizedErrors: {
        react_errors: [],
        api_errors: [],
        javascript_errors: [],
        third_party_errors: [],
        unknown_errors: [],
      },
      hasReactErrors: false,
      hasAPIErrors: false,
      hasCriticalErrors: false,
      summary: '⚠️ Monitoring not active',
    };
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${this.errorIdCounter++}_${Date.now()}`;
  }
}

/**
 * Singleton instance
 */
let consoleErrorMonitorInstance: ConsoleErrorMonitor | null = null;

/**
 * Get singleton instance
 */
export function getConsoleErrorMonitor(): ConsoleErrorMonitor {
  if (!consoleErrorMonitorInstance) {
    consoleErrorMonitorInstance = new ConsoleErrorMonitor();
  }
  return consoleErrorMonitorInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetConsoleErrorMonitor(): void {
  consoleErrorMonitorInstance = null;
}
