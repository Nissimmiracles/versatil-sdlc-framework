/**
 * UX Excellence Reviewer Sub-Agent for James-Frontend
 *
 * A senior UI/UX expert with 15+ years of experience that conducts comprehensive
 * UI/UX reviews focusing on visual consistency, user experience excellence,
 * markdown perfection, simplification, and holistic design.
 *
 * Auto-triggers on:
 * - UI component changes (*.tsx, *.jsx, *.vue, *.css)
 * - Markdown updates (*.md)
 * - Design file changes (Figma, Sketch, Adobe XD)
 * - Manual review requests
 *
 * @module UXExcellenceReviewer
 */
import { EventEmitter } from 'events';
export interface UXReviewContext {
    filePaths: string[];
    fileContents: Map<string, string>;
    userRole?: 'admin' | 'user' | 'super_admin';
    deviceSize?: 'mobile' | 'tablet' | 'desktop';
    framework?: 'react' | 'vue' | 'svelte' | 'angular';
    designSystem?: DesignSystemInfo;
}
export interface DesignSystemInfo {
    colorPalette: string[];
    typography: TypographyScale;
    spacing: SpacingScale;
    breakpoints: Breakpoint[];
}
export interface TypographyScale {
    fontFamily: string;
    sizes: {
        [key: string]: string;
    };
    weights: {
        [key: string]: number;
    };
    lineHeights: {
        [key: string]: number;
    };
}
export interface SpacingScale {
    unit: string;
    scale: number[];
}
export interface Breakpoint {
    name: string;
    minWidth: number;
    maxWidth?: number;
}
export interface UXReviewResult {
    overallScore: number;
    criticalIssues: UXIssue[];
    recommendations: UXRecommendation[];
    whatWorksWell: string[];
    priorityRoadmap: PriorityRoadmap;
}
export interface UXIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'visual-consistency' | 'user-experience' | 'accessibility' | 'performance' | 'markdown';
    title: string;
    description: string;
    impact: string;
    affectedUserRoles: string[];
    currentState: string;
    recommendedSolution: string;
    file?: string;
    line?: number;
}
export interface UXRecommendation {
    id: string;
    type: 'immediate' | 'systematic' | 'enhancement';
    category: string;
    title: string;
    description: string;
    implementation: ImplementationDetails;
    estimatedEffort: 'quick-win' | 'small' | 'medium' | 'large';
    expectedImpact: 'high' | 'medium' | 'low';
}
export interface ImplementationDetails {
    steps: string[];
    codeExamples?: CodeExample[];
    cssChanges?: string;
    componentRefactoring?: string;
}
export interface CodeExample {
    language: string;
    before?: string;
    after: string;
    description: string;
}
export interface PriorityRoadmap {
    priority1: RoadmapItem[];
    priority2: RoadmapItem[];
    priority3: RoadmapItem[];
}
export interface RoadmapItem {
    title: string;
    description: string;
    estimatedTime: string;
    dependencies: string[];
}
export interface VisualConsistencyAnalysis {
    score: number;
    tableViews: ConsistencyCheck;
    actionButtons: ConsistencyCheck;
    formElements: ConsistencyCheck;
    spacing: ConsistencyCheck;
    typography: ConsistencyCheck;
    colorUsage: ConsistencyCheck;
}
export interface ConsistencyCheck {
    score: number;
    issues: string[];
    recommendations: string[];
}
export interface UXEvaluationResult {
    score: number;
    navigationFlow: FlowAnalysis;
    feedbackMechanisms: FeedbackAnalysis;
    accessibility: AccessibilityAnalysis;
    roleBasedExperience: RoleAnalysis;
    mobileResponsiveness: ResponsivenessAnalysis;
    performancePerception: PerformanceAnalysis;
}
export interface FlowAnalysis {
    score: number;
    clickDepth: number;
    unusedComponents: string[];
    navigationIssues: string[];
}
export interface FeedbackAnalysis {
    score: number;
    loadingStates: boolean;
    successMessages: boolean;
    errorHandling: string[];
}
export interface AccessibilityAnalysis {
    score: number;
    wcagCompliance: 'A' | 'AA' | 'AAA' | 'non-compliant';
    keyboardNavigation: boolean;
    screenReaderSupport: string[];
    ariaLabels: boolean;
}
export interface RoleAnalysis {
    score: number;
    roleAdaptations: Map<string, string[]>;
    missingAdaptations: string[];
}
export interface ResponsivenessAnalysis {
    score: number;
    breakpointCoverage: string[];
    mobileIssues: string[];
    tabletIssues: string[];
}
export interface PerformanceAnalysis {
    score: number;
    perceivedSpeed: 'instant' | 'fast' | 'acceptable' | 'slow';
    loadingIndicators: boolean;
    optimizationOpportunities: string[];
}
export interface MarkdownAnalysisResult {
    score: number;
    headingHierarchy: HierarchyCheck;
    listFormatting: FormattingCheck;
    codeBlocks: CodeBlockCheck;
    tables: TableCheck;
    links: LinkCheck;
    images: ImageCheck;
    blockquotes: BlockquoteCheck;
}
export interface HierarchyCheck {
    score: number;
    issues: string[];
    structure: string;
}
export interface FormattingCheck {
    score: number;
    issues: string[];
    consistency: boolean;
}
export interface CodeBlockCheck {
    score: number;
    syntaxHighlighting: boolean;
    copyButton: boolean;
    overflow: 'scroll' | 'wrap' | 'none';
}
export interface TableCheck {
    score: number;
    borders: boolean;
    padding: boolean;
    responsive: boolean;
}
export interface LinkCheck {
    score: number;
    internalExternal: boolean;
    brokenLinks: string[];
}
export interface ImageCheck {
    score: number;
    altText: boolean;
    lazyLoading: boolean;
    captions: boolean;
}
export interface BlockquoteCheck {
    score: number;
    visuallyDistinct: boolean;
    appropriate: boolean;
}
export interface SimplificationRecommendations {
    progressiveDisclosure: string[];
    cognitiveLoadReduction: string[];
    visualHierarchy: string[];
    whitespaceUtilization: string[];
    consistentPatterns: string[];
}
export declare class UXExcellenceReviewer extends EventEmitter {
    private reviewHistory;
    constructor();
    /**
     * Conduct comprehensive UX review
     */
    reviewComprehensive(context: UXReviewContext): Promise<UXReviewResult>;
    /**
     * Review visual consistency (uses dedicated checker)
     */
    reviewVisualConsistency(context: UXReviewContext): Promise<VisualConsistencyAnalysis>;
    /**
     * Evaluate user experience
     */
    evaluateUserExperience(context: UXReviewContext): Promise<UXEvaluationResult>;
    /**
     * Analyze markdown rendering (uses dedicated analyzer)
     */
    analyzeMarkdownRendering(context: UXReviewContext): Promise<MarkdownAnalysisResult>;
    /**
     * Suggest simplifications
     */
    suggestSimplifications(context: UXReviewContext): Promise<SimplificationRecommendations>;
    /**
     * Generate formatted report
     */
    generateFormattedReport(result: UXReviewResult): string;
    private analyzeTableViews;
    private analyzeActionButtons;
    private analyzeFormElements;
    private analyzeSpacing;
    private analyzeTypography;
    private analyzeColorUsage;
    private analyzeNavigationFlow;
    private analyzeFeedbackMechanisms;
    private analyzeAccessibility;
    private analyzeRoleBasedExperience;
    private analyzeMobileResponsiveness;
    private analyzePerformancePerception;
    private checkHeadingHierarchy;
    private checkListFormatting;
    private checkCodeBlocks;
    private checkTables;
    private checkLinks;
    private checkImages;
    private checkBlockquotes;
    private identifyProgressiveDisclosureOpportunities;
    private identifyCognitiveLoadIssues;
    private identifyVisualHierarchyIssues;
    private identifyWhitespaceOpportunities;
    private identifyInconsistentPatterns;
    private calculateOverallScore;
    private collectCriticalIssues;
    private generateRecommendations;
    private identifyStrengths;
    private createRoadmap;
    private calculateAverageScore;
    private filterMarkdownFiles;
    private emptyMarkdownAnalysis;
    private hasTableElements;
    private detectTableIssues;
    private detectButtonInconsistencies;
    private detectFormInconsistencies;
    private detectSpacingInconsistencies;
    private detectTypographyInconsistencies;
    private detectColorInconsistencies;
    private calculateClickDepth;
    private generateReviewKey;
    private getScoreEmoji;
    private formatRecommendations;
    private estimateTimeFromEffort;
}
