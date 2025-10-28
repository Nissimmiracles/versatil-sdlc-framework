import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export declare class EnhancedMarcus extends RAGEnabledAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to provide backend-specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Backend-specific RAG configuration
     */
    protected getDefaultRAGConfig(): RAGConfig;
    /**
     * Run backend-specific pattern analysis
     */
    protected runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Override message generation to include agent name
     */
    protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: any): string;
    /**
     * Generate backend-specific base prompt template
     */
    protected getBasePromptTemplate(): string;
    /**
     * Generate backend-specific handoffs based on analysis
     */
    protected generateDomainHandoffs(analysis: AnalysisResult): string[];
    /**
     * Enhanced backend analysis with RAG context specialization using Edge Functions
     */
    protected retrieveRelevantContext(context: AgentActivationContext, analysis: AnalysisResult): Promise<AgentRAGContext>;
    /**
     * Generate optimized RAG query for Marcus's Backend domain
     */
    private generateRAGQuery;
    /**
     * Retrieve backend API patterns and architecture examples
     */
    private retrieveAPIPatterns;
    /**
     * Retrieve security patterns and implementations
     */
    private retrieveSecurityPatterns;
    /**
     * Retrieve performance optimization patterns
     */
    private retrievePerformancePatterns;
    /**
     * Detect API type for better RAG retrieval
     */
    private detectAPIType;
    /**
     * Detect database type for optimization patterns
     */
    private detectDatabaseType;
    /**
     * Validate API integration
     */
    validateAPIIntegration(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Validate service consistency
     */
    validateServiceConsistency(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Check configuration consistency
     */
    checkConfigurationConsistency(context: any): {
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
     * Identify critical issues from issue list
     */
    identifyCriticalIssues(issues: any[]): any[];
    /**
     * Validate database queries
     */
    validateDatabaseQueries(context: any): any[];
    /**
     * Check API security
     */
    checkAPISecurity(context: any): any[];
    /**
     * Analyze cache strategy
     */
    analyzeCacheStrategy(context: any): any;
    /**
     * Check authentication patterns
     */
    checkAuthenticationPatterns(context: any): any[];
    /**
     * Validate error handling
     */
    validateErrorHandling(context: any): any[];
    /**
     * Check input validation
     */
    checkInputValidation(context: any): any[];
    /**
     * Analyze rate limiting
     */
    analyzeRateLimiting(context: any): any;
    /**
     * Check CORS configuration
     */
    checkCORSConfiguration(context: any): any[];
    /**
     * Validate API versioning
     */
    validateAPIVersioning(context: any): any;
    /**
     * Check database indexes
     */
    checkDatabaseIndexes(context: any): any[];
    /**
     * Run backend-specific validation using PatternAnalyzer
     */
    runBackendValidation(context: any): Promise<any>;
    /**
     * Detect framework from content
     */
    protected detectFramework(content: string): string;
}
