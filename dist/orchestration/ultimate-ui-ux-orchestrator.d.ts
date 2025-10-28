/**
 * VERSATIL SDLC Framework - Ultimate UI/UX Orchestrator
 * Advanced frontend capabilities with Playwright, Chrome DevTools, shadcn, and more
 */
import { EventEmitter } from 'events';
import { IsolatedPaths } from './isolated-versatil-orchestrator.js';
export interface UITestResult {
    score: number;
    issues: UIIssue[];
    suggestions: UISuggestion[];
    a11yReport: AccessibilityReport;
    performanceMetrics: PerformanceMetrics;
    visualRegressions: VisualRegression[];
    userFlowResults: UserFlowResult[];
}
export interface UIIssue {
    type: 'accessibility' | 'performance' | 'visual' | 'interaction' | 'responsive';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    element?: string;
    recommendation: string;
}
export interface UISuggestion {
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    implementation: string;
    example?: string;
}
export interface AccessibilityReport {
    score: number;
    violations: A11yViolation[];
    passes: number;
    warnings: A11yWarning[];
}
export interface PerformanceMetrics {
    FCP: number;
    LCP: number;
    CLS: number;
    TTI: number;
    TBT: number;
    SI: number;
}
export interface VisualRegression {
    component: string;
    baseline: string;
    current: string;
    diff: string;
    mismatchPercentage: number;
}
export interface UserFlowResult {
    flowName: string;
    steps: FlowStep[];
    success: boolean;
    duration: number;
    screenshots: string[];
    issues: string[];
}
interface A11yViolation {
    rule: string;
    impact: string;
    elements: string[];
    help: string;
}
interface A11yWarning {
    rule: string;
    elements: string[];
    help: string;
}
interface FlowStep {
    name: string;
    success: boolean;
    duration: number;
    screenshot?: string;
    error?: string;
}
export declare class UltimateUIUXOrchestrator extends EventEmitter {
    private logger;
    private paths;
    private uiTools;
    private testConfig;
    private componentLibrary;
    constructor(paths: IsolatedPaths);
    initialize(): Promise<void>;
    /**
     * Initialize MCP tools for UI/UX
     */
    private initializeMCPTools;
    /**
     * Comprehensive UI/UX testing for a component
     */
    testUserExperience(component: {
        name: string;
        path: string;
        props?: any;
        routes?: string[];
    }): Promise<UITestResult>;
    /**
     * Test visual regression across browsers and themes
     */
    private testVisualRegression;
    /**
     * Test accessibility with multiple tools
     */
    private testAccessibility;
    /**
     * Test performance metrics
     */
    private testPerformance;
    /**
     * Test user flows with real interactions
     */
    private testUserFlows;
    /**
     * Execute a single user flow
     */
    private executeUserFlow;
    /**
     * Test responsiveness across devices
     */
    private testResponsiveness;
    /**
     * Test interactions and animations
     */
    private testInteractions;
    /**
     * Test theme switching and consistency
     */
    private testThemes;
    /**
     * Test animations and transitions
     */
    private testAnimations;
    /**
     * Generate improvement suggestions using AI
     */
    private generateImprovements;
    /**
     * Create optimized UI component
     */
    createOptimizedComponent(spec: {
        name: string;
        type: string;
        requirements: string[];
        theme?: string;
        accessibility?: boolean;
        animations?: boolean;
    }): Promise<any>;
    /**
     * Apply automatic fixes to component
     */
    private applyAutoFixes;
    /**
     * Fix accessibility issue in code
     */
    private fixAccessibilityIssue;
    /**
     * Fix performance issue in code
     */
    private fixPerformanceIssue;
    /**
     * Fix responsive issue in code
     */
    private fixResponsiveIssue;
    /**
     * Helper methods
     */
    private calculateUXScore;
    private calculatePerformanceScore;
    private extractIssues;
    private parseChromeA11y;
    private getDefaultPerformanceMetrics;
    private storeTestResults;
    private loadComponentLibrary;
    private loadUIPatterns;
    /**
     * Cleanup
     */
    shutdown(): Promise<void>;
}
export {};
