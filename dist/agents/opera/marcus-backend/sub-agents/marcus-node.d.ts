/**
 * Marcus-Node: Node.js Backend Specialist
 *
 * Language-specific sub-agent for Node.js 18+ backend development.
 * Specializes in Express/Fastify, async/await patterns, and NPM package management.
 *
 * Auto-activates on: package.json with node version, .js/.ts backend files
 *
 * @module marcus-node
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export interface NodeJSBestPractices {
    asyncPatterns: string[];
    errorHandling: string[];
    securityPatterns: string[];
    performanceOptimizations: string[];
}
export declare class MarcusNode extends EnhancedMarcus {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Node.js-specific validation
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Analyze Node.js-specific patterns
     */
    analyzeNodePatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: Array<{
            type: string;
            message: string;
            priority: string;
        }>;
        bestPractices: NodeJSBestPractices;
    }>;
    private analyzeNodeJSPatterns;
    /**
     * Detect callback hell pattern
     */
    private hasCallbackHell;
    /**
     * Detect unhandled promises
     */
    private hasUnhandledPromises;
    /**
     * Detect blocking operations
     */
    private hasBlockingOperations;
    /**
     * Detect vulnerable patterns
     */
    private hasVulnerablePatterns;
    /**
     * Check for Express error middleware
     */
    private hasErrorMiddleware;
    /**
     * Check for proper environment variable handling
     */
    private hasProperEnvHandling;
    /**
     * Check if content is an API route
     */
    private isAPIRoute;
    /**
     * Check for structured logging
     */
    private hasProperLogging;
    /**
     * Generate Node.js-specific recommendations
     */
    generateNodeRecommendations(content: string): string[];
    /**
     * Override RAG configuration for Node.js domain
     */
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
    /**
     * Detect Node.js framework
     */
    detectNodeFramework(content: string): string;
    detectSQLInjection(content: string): boolean;
    detectMissingValidation(content: string): boolean;
    detectExposedSecrets(content: string): boolean;
    detectMissingAuth(content: string): boolean;
    detectMissingErrorHandling(content: string): boolean;
    detectNPlusOne(content: string): boolean;
    detectBlockingOperations(content: string): boolean;
    detectMissingSecurityMiddleware(content: string): boolean;
    detectMissingEnvValidation(content: string): boolean;
    detectMissingConnectionPooling(content: string): boolean;
    hasGlobalErrorHandler(content: string): boolean;
}
