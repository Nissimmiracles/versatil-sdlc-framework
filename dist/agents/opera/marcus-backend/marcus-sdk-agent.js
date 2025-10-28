/**
 * Marcus-Backend SDK Agent
 * SDK-native version of Enhanced Marcus that uses Claude Agent SDK for execution
 * while preserving all existing backend functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { EnhancedMarcus } from './enhanced-marcus.js';
export class MarcusSDKAgent extends SDKAgentAdapter {
    constructor(vectorStore) {
        super({
            agentId: 'marcus-backend',
            vectorStore,
            model: 'sonnet'
        });
        // Keep legacy agent for specialized methods
        this.legacyAgent = new EnhancedMarcus(vectorStore);
    }
    /**
     * Override activate to add Marcus-specific validations
     */
    async activate(context) {
        // 1. Run SDK activation (core analysis)
        const response = await super.activate(context);
        // 2. Add Marcus-specific context
        if (response.context) {
            response.context = {
                ...response.context,
                backendHealth: response.context.analysisScore,
                apiType: this.detectAPIType(context.content || ''),
                dbType: this.detectDatabaseType(context.content || ''),
                securityScore: this.calculateSecurityScore(response.suggestions || [])
            };
        }
        return response;
    }
    /**
     * Detect API type from content
     */
    detectAPIType(content) {
        if (content.includes('GraphQL') || content.includes('gql`'))
            return 'graphql';
        if (content.includes('tRPC') || content.includes('trpc'))
            return 'trpc';
        if (content.includes('app.get') || content.includes('app.post'))
            return 'rest';
        if (content.includes('router.') || content.includes('route'))
            return 'rest';
        if (content.includes('websocket') || content.includes('ws'))
            return 'websocket';
        return 'api';
    }
    /**
     * Detect database type from content
     */
    detectDatabaseType(content) {
        if (content.includes('mongoose') || content.includes('MongoDB'))
            return 'mongodb';
        if (content.includes('prisma') || content.includes('Prisma'))
            return 'prisma';
        if (content.includes('sequelize') || content.includes('Sequelize'))
            return 'sequelize';
        if (content.includes('typeorm') || content.includes('TypeORM'))
            return 'typeorm';
        if (content.includes('postgresql') || content.includes('pg'))
            return 'postgresql';
        if (content.includes('mysql') || content.includes('MySQL'))
            return 'mysql';
        if (content.includes('redis') || content.includes('Redis'))
            return 'redis';
        return 'database';
    }
    /**
     * Calculate security score from suggestions
     */
    calculateSecurityScore(suggestions) {
        const securityIssues = suggestions.filter(s => s.type === 'security' ||
            s.type === 'security-risk' ||
            s.message?.toLowerCase().includes('security'));
        if (securityIssues.length === 0)
            return 100;
        if (securityIssues.some(i => i.priority === 'critical'))
            return 30;
        if (securityIssues.some(i => i.priority === 'high'))
            return 60;
        return 80;
    }
    /**
     * Run backend validation (delegated to legacy agent)
     */
    async runBackendValidation(context) {
        return this.legacyAgent.runBackendValidation(context);
    }
    /**
     * Validate API integration (delegated to legacy agent)
     */
    validateAPIIntegration(context) {
        return this.legacyAgent.validateAPIIntegration(context);
    }
    /**
     * Validate service consistency (delegated to legacy agent)
     */
    validateServiceConsistency(context) {
        return this.legacyAgent.validateServiceConsistency(context);
    }
    /**
     * Check configuration consistency (delegated to legacy agent)
     */
    checkConfigurationConsistency(context) {
        return this.legacyAgent.checkConfigurationConsistency(context);
    }
    /**
     * Calculate priority (delegated to legacy agent)
     */
    calculatePriority(issues) {
        const priority = this.legacyAgent.calculatePriority(issues);
        return priority;
    }
    /**
     * Determine handoffs (delegated to legacy agent)
     */
    determineHandoffs(issues) {
        return this.legacyAgent.determineHandoffs(issues);
    }
    /**
     * Generate actionable recommendations (delegated to legacy agent)
     */
    generateActionableRecommendations(issues) {
        return this.legacyAgent.generateActionableRecommendations(issues);
    }
    /**
     * Generate enhanced report (delegated to legacy agent)
     */
    generateEnhancedReport(issues, metadata = {}) {
        return this.legacyAgent.generateEnhancedReport(issues, metadata);
    }
    /**
     * Get score emoji (delegated to legacy agent)
     */
    getScoreEmoji(score) {
        return this.legacyAgent.getScoreEmoji(score);
    }
    /**
     * Extract agent name (delegated to legacy agent)
     */
    extractAgentName(text) {
        return this.legacyAgent.extractAgentName(text);
    }
    /**
     * Identify critical issues (delegated to legacy agent)
     */
    identifyCriticalIssues(issues) {
        return this.legacyAgent.identifyCriticalIssues(issues);
    }
    /**
     * Validate database queries (delegated to legacy agent)
     */
    validateDatabaseQueries(context) {
        return this.legacyAgent.validateDatabaseQueries(context);
    }
    /**
     * Check API security (delegated to legacy agent)
     */
    checkAPISecurity(context) {
        return this.legacyAgent.checkAPISecurity(context);
    }
    /**
     * Analyze cache strategy (delegated to legacy agent)
     */
    analyzeCacheStrategy(context) {
        return this.legacyAgent.analyzeCacheStrategy(context);
    }
    /**
     * Check authentication patterns (delegated to legacy agent)
     */
    checkAuthenticationPatterns(context) {
        return this.legacyAgent.checkAuthenticationPatterns(context);
    }
    /**
     * Validate error handling (delegated to legacy agent)
     */
    validateErrorHandling(context) {
        return this.legacyAgent.validateErrorHandling(context);
    }
    /**
     * Check input validation (delegated to legacy agent)
     */
    checkInputValidation(context) {
        return this.legacyAgent.checkInputValidation(context);
    }
    /**
     * Analyze rate limiting (delegated to legacy agent)
     */
    analyzeRateLimiting(context) {
        return this.legacyAgent.analyzeRateLimiting(context);
    }
    /**
     * Check CORS configuration (delegated to legacy agent)
     */
    checkCORSConfiguration(context) {
        return this.legacyAgent.checkCORSConfiguration(context);
    }
    /**
     * Validate API versioning (delegated to legacy agent)
     */
    validateAPIVersioning(context) {
        return this.legacyAgent.validateAPIVersioning(context);
    }
    /**
     * Check database indexes (delegated to legacy agent)
     */
    checkDatabaseIndexes(context) {
        return this.legacyAgent.checkDatabaseIndexes(context);
    }
    /**
     * Check configuration inconsistencies (delegated to legacy agent)
     */
    hasConfigurationInconsistencies(context) {
        return this.legacyAgent.hasConfigurationInconsistencies(context);
    }
}
//# sourceMappingURL=marcus-sdk-agent.js.map