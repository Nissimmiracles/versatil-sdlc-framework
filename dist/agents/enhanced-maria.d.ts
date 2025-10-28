import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export declare class EnhancedMaria extends RAGEnabledAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    private configValidators;
    private qualityMetrics;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to provide QA-specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * QA-specific RAG configuration
     */
    protected getDefaultRAGConfig(): RAGConfig;
    /**
     * Run QA-specific pattern analysis
     */
    protected runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Override message generation to include agent name
     */
    protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: any): string;
    /**
     * Generate QA-specific base prompt template
     */
    protected getBasePromptTemplate(): string;
    /**
     * Generate QA-specific handoffs based on analysis
     */
    protected generateDomainHandoffs(analysis: AnalysisResult): string[];
    /**
     * Enhanced QA analysis with RAG context specialization using Edge Functions
     */
    protected retrieveRelevantContext(context: AgentActivationContext, analysis: AnalysisResult): Promise<AgentRAGContext>;
    /**
     * Generate optimized RAG query for Maria's QA domain
     */
    private generateRAGQuery;
    /**
     * Retrieve QA-specific test patterns
     */
    private retrieveTestPatterns;
    /**
     * Retrieve QA best practices for the current context
     */
    private retrieveQABestPractices;
    /**
     * Generate quality dashboard for analysis results
     */
    generateQualityDashboard(results: any): any;
    /**
     * Generate fix suggestion for an issue
     */
    generateFix(issue: any): string;
    /**
     * Generate prevention strategy for an issue
     */
    generatePreventionStrategy(issue: any): string;
    /**
     * Identify critical issues from issue list and enhance with fixes/prevention
     */
    identifyCriticalIssues(results: any): any[];
    /**
     * Calculate priority based on issues
     */
    calculatePriority(issues: any[]): string;
    /**
     * Determine agent handoffs based on results object
     */
    determineHandoffs(results: any): string[];
    /**
     * Generate actionable recommendations from results
     */
    generateActionableRecommendations(results: any): Array<{
        type: string;
        message: string;
        priority: string;
    }>;
    /**
     * Generate comprehensive enhanced report with dashboard and critical issues
     */
    generateEnhancedReport(results: any, dashboard?: any, criticalIssues?: any[]): string;
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
     * Validate route-navigation consistency (similar to James)
     */
    validateRouteNavigationConsistency(context: any): {
        score: number;
        issues: any[];
        warnings: any[];
    };
}
