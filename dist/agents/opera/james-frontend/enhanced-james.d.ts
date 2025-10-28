import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from '../../core/rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import { AnalysisResult } from '../../../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class EnhancedJames extends RAGEnabledAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to provide frontend-specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Frontend-specific RAG configuration
     */
    protected getDefaultRAGConfig(): RAGConfig;
    /**
     * Run frontend-specific pattern analysis
     */
    protected runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Override message generation to include agent name
     */
    protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: any): string;
    /**
     * Generate frontend-specific base prompt template
     */
    protected getBasePromptTemplate(): string;
    /**
     * Generate frontend-specific handoffs based on analysis
     */
    protected generateDomainHandoffs(analysis: AnalysisResult): string[];
    /**
     * Enhanced frontend analysis with RAG context specialization using Edge Functions
     */
    protected retrieveRelevantContext(context: AgentActivationContext, analysis: AnalysisResult): Promise<AgentRAGContext>;
    /**
     * Generate optimized RAG query for James's Frontend domain
     */
    private generateRAGQuery;
    /**
     * Retrieve frontend component patterns
     */
    private retrieveComponentPatterns;
    /**
     * Retrieve UI/UX patterns and best practices
     */
    private retrieveUIPatterns;
    /**
     * Retrieve performance optimization patterns
     */
    private retrievePerformancePatterns;
    /**
     * Detect component type for better RAG retrieval
     */
    private detectComponentType;
    /**
     * Run frontend validation on context
     */
    runFrontendValidation(context: any): Promise<any>;
    /**
     * Validate context flow
     */
    validateContextFlow(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Validate navigation integrity
     */
    validateNavigationIntegrity(context: any): {
        score: number;
        issues: any[];
        warnings: any[];
    };
    /**
     * Enforce route registration for page components
     *
     * This method is called when James detects a new page component being created.
     * It validates that the component has a corresponding route registration.
     *
     * @see docs/audit/production-audit-report.md - Failure #1 (Orphaned Pages)
     */
    enforceRouteRegistration(context: any): Promise<{
        hasRoute: boolean;
        violations: any[];
        suggestions: string[];
    }>;
    /**
     * Infer route path from file path
     * e.g., src/pages/dealflow/DealFlowSimplified.tsx -> /dealflow/simplified
     */
    private inferRoutePath;
    /**
     * Check route consistency
     */
    checkRouteConsistency(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Calculate priority based on issues
     */
    calculatePriority(issues: any[]): string;
    /**
     * Determine agent handoffs based on issues
     */
    determineHandoffs(issues: any[]): string[];
    /**
     * Generate actionable recommendations from issues
     */
    generateActionableRecommendations(issues: any[]): Array<{
        type: string;
        message: string;
        priority: string;
    }>;
    /**
     * Generate enhanced report with metadata
     */
    generateEnhancedReport(issues: any[], metadata?: any): string;
    /**
     * Get emoji representation of score
     */
    getScoreEmoji(score: number): string;
    /**
     * Extract agent name from text
     */
    extractAgentName(text: string): string;
    /**
     * Analyze cross-file consistency
     */
    protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string>;
    /**
     * Check for configuration inconsistencies
     */
    hasConfigurationInconsistencies(context: any): boolean;
    /**
     * Validate component accessibility
     */
    validateComponentAccessibility(context: any): any[];
    /**
     * Check responsive design
     */
    checkResponsiveDesign(context: any): any[];
    /**
     * Analyze bundle size
     */
    analyzeBundleSize(context: any): any;
    /**
     * Validate CSS consistency
     */
    validateCSSConsistency(context: any): any[];
    /**
     * Check browser compatibility
     */
    checkBrowserCompatibility(context: any): any[];
    /**
     * Identify critical issues from issue list
     */
    identifyCriticalIssues(issues: any[]): any[];
}
