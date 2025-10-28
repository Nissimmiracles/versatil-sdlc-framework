/**
 * James-Frontend SDK Agent
 * SDK-native version of Enhanced James that uses Claude Agent SDK for execution
 * while preserving all existing frontend functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class JamesSDKAgent extends SDKAgentAdapter {
    private legacyAgent;
    private uxReviewer;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add James-specific validations
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Detect component type for better context
     */
    private detectComponentType;
    /**
     * Run frontend validation (delegated to legacy agent)
     */
    runFrontendValidation(context: any): Promise<any>;
    /**
     * Validate context flow (delegated to legacy agent)
     */
    validateContextFlow(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Validate navigation integrity (delegated to legacy agent)
     */
    validateNavigationIntegrity(context: any): {
        score: number;
        issues: any[];
        warnings: any[];
    };
    /**
     * Check route consistency (delegated to legacy agent)
     */
    checkRouteConsistency(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Calculate priority (delegated to legacy agent)
     */
    calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Determine handoffs (delegated to legacy agent)
     */
    determineHandoffs(issues: any[]): string[];
    /**
     * Generate actionable recommendations (delegated to legacy agent)
     */
    generateActionableRecommendations(issues: any[]): Array<{
        type: string;
        message: string;
        priority: string;
    }>;
    /**
     * Generate enhanced report (delegated to legacy agent)
     */
    generateEnhancedReport(issues: any[], metadata?: any): string;
    /**
     * Get score emoji (delegated to legacy agent)
     */
    getScoreEmoji(score: number): string;
    /**
     * Extract agent name (delegated to legacy agent)
     */
    extractAgentName(text: string): string;
    /**
     * Validate component accessibility (delegated to legacy agent)
     */
    validateComponentAccessibility(context: any): any[];
    /**
     * Check responsive design (delegated to legacy agent)
     */
    checkResponsiveDesign(context: any): any[];
    /**
     * Analyze bundle size (delegated to legacy agent)
     */
    analyzeBundleSize(context: any): any;
    /**
     * Validate CSS consistency (delegated to legacy agent)
     */
    validateCSSConsistency(context: any): any[];
    /**
     * Check browser compatibility (delegated to legacy agent)
     */
    checkBrowserCompatibility(context: any): any[];
    /**
     * Identify critical issues (delegated to legacy agent)
     */
    identifyCriticalIssues(issues: any[]): any[];
    /**
     * Check configuration inconsistencies (delegated to legacy agent)
     */
    hasConfigurationInconsistencies(context: any): boolean;
    /**
     * NEW v6.1: Run visual regression tests using Playwright MCP
     */
    runVisualTest(options: {
        url?: string;
        selector?: string;
        testName: string;
        viewport?: {
            width: number;
            height: number;
        };
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * NEW v6.1: Implement design from Figma/Sketch using Chrome MCP
     */
    implementFromDesign(options: {
        designUrl: string;
        componentName: string;
        outputPath: string;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * NEW v6.1: Run accessibility audit using Playwright MCP
     */
    runAccessibilityAudit(options: {
        url?: string;
        selector?: string;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * NEW v6.2: Run comprehensive UX review using UX Excellence Reviewer sub-agent
     *
     * Auto-triggers on:
     * - UI component changes (*.tsx, *.jsx, *.vue, *.css)
     * - Markdown updates (*.md)
     * - Manual review requests
     *
     * @example
     * const review = await jamesAgent.runUXReview({
     *   filePaths: ['src/components/LoginForm.tsx', 'src/pages/Dashboard.tsx'],
     *   fileContents: new Map([
     *     ['src/components/LoginForm.tsx', loginFormCode],
     *     ['src/pages/Dashboard.tsx', dashboardCode]
     *   ]),
     *   framework: 'react'
     * });
     *
     * console.log(review.overallScore); // 85
     * console.log(review.criticalIssues); // [...]
     */
    runUXReview(context: {
        filePaths: string[];
        fileContents: Map<string, string>;
        userRole?: 'admin' | 'user' | 'super_admin';
        deviceSize?: 'mobile' | 'tablet' | 'desktop';
        framework?: 'react' | 'vue' | 'svelte' | 'angular';
        designSystem?: any;
    }): Promise<any>;
    /**
     * NEW v6.2: Generate formatted UX review report
     *
     * Creates a comprehensive markdown report with:
     * - Executive summary
     * - What's working well
     * - Critical issues
     * - Design recommendations
     * - Implementation roadmap
     *
     * @example
     * const review = await jamesAgent.runUXReview(context);
     * const report = jamesAgent.generateUXReport(review);
     * console.log(report); // Markdown formatted report
     */
    generateUXReport(reviewResult: any): string;
    /**
     * NEW v6.2: Auto-detect if UX review should be triggered
     *
     * Returns true if file changes warrant a UX review:
     * - UI components (*.tsx, *.jsx, *.vue)
     * - Stylesheets (*.css, *.scss, *.less)
     * - Markdown documentation (*.md)
     * - Design files
     *
     * @example
     * if (jamesAgent.shouldTriggerUXReview(['LoginForm.tsx', 'styles.css'])) {
     *   const review = await jamesAgent.runUXReview(context);
     * }
     */
    shouldTriggerUXReview(filePaths: string[]): boolean;
}
