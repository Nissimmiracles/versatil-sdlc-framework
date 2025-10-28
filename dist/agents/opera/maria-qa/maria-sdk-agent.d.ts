/**
 * Maria-QA SDK Agent
 * SDK-native version of Enhanced Maria that uses Claude Agent SDK for execution
 * while preserving all existing QA functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class MariaSDKAgent extends SDKAgentAdapter {
    private legacyAgent;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Maria-specific validations
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Check if emergency mode should be activated
     */
    private isEmergencyMode;
    /**
     * Generate quality dashboard (delegated to legacy agent)
     */
    generateQualityDashboard(results: any): any;
    /**
     * Identify critical issues (delegated to legacy agent)
     */
    identifyCriticalIssues(results: any): any[];
    /**
     * Generate enhanced report (delegated to legacy agent)
     */
    generateEnhancedReport(results: any, dashboard?: any, criticalIssues?: any[]): string;
    /**
     * Generate actionable recommendations (delegated to legacy agent)
     */
    generateActionableRecommendations(results: any): Array<{
        type: string;
        message: string;
        priority: string;
    }>;
    /**
     * Determine handoffs (delegated to legacy agent)
     */
    determineHandoffs(results: any): string[];
    /**
     * Calculate priority (delegated to legacy agent)
     */
    calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Generate fix suggestion (delegated to legacy agent)
     */
    generateFix(issue: any): string;
    /**
     * Generate prevention strategy (delegated to legacy agent)
     */
    generatePreventionStrategy(issue: any): string;
    /**
     * Get score emoji (delegated to legacy agent)
     */
    getScoreEmoji(score: number): string;
    /**
     * Validate route-navigation consistency (delegated to legacy agent)
     */
    validateRouteNavigationConsistency(context: any): {
        score: number;
        issues: any[];
        warnings: any[];
    };
    /**
     * Check configuration inconsistencies (delegated to legacy agent)
     */
    hasConfigurationInconsistencies(context: any): boolean;
    /**
     * Extract agent name (delegated to legacy agent)
     */
    extractAgentName(text: string): string;
    /**
     * NEW v6.1: Run E2E tests using Playwright MCP
     */
    runE2ETests(options: {
        testFile?: string;
        testPattern?: string;
        headless?: boolean;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * NEW v6.1: Run visual regression tests using Playwright MCP
     */
    runVisualRegressionTests(options: {
        baselineDir: string;
        testDir: string;
        threshold?: number;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * NEW v6.1: Run performance tests using Chrome MCP
     */
    runPerformanceTests(options: {
        url: string;
        metrics: string[];
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
