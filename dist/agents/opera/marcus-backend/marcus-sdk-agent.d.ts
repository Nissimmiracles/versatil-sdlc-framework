/**
 * Marcus-Backend SDK Agent
 * SDK-native version of Enhanced Marcus that uses Claude Agent SDK for execution
 * while preserving all existing backend functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class MarcusSDKAgent extends SDKAgentAdapter {
    private legacyAgent;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Marcus-specific validations
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Detect API type from content
     */
    private detectAPIType;
    /**
     * Detect database type from content
     */
    private detectDatabaseType;
    /**
     * Calculate security score from suggestions
     */
    private calculateSecurityScore;
    /**
     * Run backend validation (delegated to legacy agent)
     */
    runBackendValidation(context: any): Promise<any>;
    /**
     * Validate API integration (delegated to legacy agent)
     */
    validateAPIIntegration(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Validate service consistency (delegated to legacy agent)
     */
    validateServiceConsistency(context: any): {
        score: number;
        issues: any[];
    };
    /**
     * Check configuration consistency (delegated to legacy agent)
     */
    checkConfigurationConsistency(context: any): {
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
     * Identify critical issues (delegated to legacy agent)
     */
    identifyCriticalIssues(issues: any[]): any[];
    /**
     * Validate database queries (delegated to legacy agent)
     */
    validateDatabaseQueries(context: any): any[];
    /**
     * Check API security (delegated to legacy agent)
     */
    checkAPISecurity(context: any): any[];
    /**
     * Analyze cache strategy (delegated to legacy agent)
     */
    analyzeCacheStrategy(context: any): any;
    /**
     * Check authentication patterns (delegated to legacy agent)
     */
    checkAuthenticationPatterns(context: any): any[];
    /**
     * Validate error handling (delegated to legacy agent)
     */
    validateErrorHandling(context: any): any[];
    /**
     * Check input validation (delegated to legacy agent)
     */
    checkInputValidation(context: any): any[];
    /**
     * Analyze rate limiting (delegated to legacy agent)
     */
    analyzeRateLimiting(context: any): any;
    /**
     * Check CORS configuration (delegated to legacy agent)
     */
    checkCORSConfiguration(context: any): any[];
    /**
     * Validate API versioning (delegated to legacy agent)
     */
    validateAPIVersioning(context: any): any;
    /**
     * Check database indexes (delegated to legacy agent)
     */
    checkDatabaseIndexes(context: any): any[];
    /**
     * Check configuration inconsistencies (delegated to legacy agent)
     */
    hasConfigurationInconsistencies(context: any): boolean;
}
