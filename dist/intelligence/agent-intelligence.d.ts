/**
 * VERSATIL SDLC Framework - Agent Intelligence Integration
 *
 * Integrates adaptive learning and usage analytics with Enhanced OPERA agents
 * to enable continuous improvement based on real user interactions.
 */
import { BaseAgent } from '../agents/core/base-agent.js';
export interface IntelligentAgentWrapper {
    agent: BaseAgent;
    learningEnabled: boolean;
    adaptations: Map<string, any>;
    performanceMetrics: {
        activations: number;
        successRate: number;
        avgExecutionTime: number;
        userSatisfactionScore: number;
    };
}
export declare class AgentIntelligenceManager {
    private logger;
    private wrappedAgents;
    private isLearningEnabled;
    constructor();
    /**
     * Initialize the intelligence system
     */
    private initializeIntelligence;
    /**
     * Wrap an agent with intelligence capabilities
     */
    wrapAgent(agent: BaseAgent): BaseAgent;
    /**
     * Create an intelligent proxy that intercepts agent calls
     */
    private createIntelligentProxy;
    /**
     * Apply learned adaptations to the context
     */
    private applyAdaptations;
    /**
     * Enhance agent response with learning capabilities
     */
    private enhanceResponse;
    /**
     * Record user feedback for learning
     */
    recordUserFeedback(agentId: string, suggestionId: string, feedback: {
        wasHelpful: boolean;
        wasAccurate: boolean;
        rating: number;
        wasFollowed: boolean;
        comments?: string;
    }): void;
    /**
     * Report false positive for learning
     */
    reportFalsePositive(agentId: string, issueType: string, filePath?: string, userComments?: string): void;
    /**
     * Handle adaptation proposals from learning engine
     */
    private handleAdaptationProposal;
    /**
     * Handle pattern discovery
     */
    private handlePatternDiscovery;
    /**
     * Apply adaptation to agent
     */
    private applyAdaptationToAgent;
    /**
     * Apply learned pattern to agent
     */
    private applyPatternToAgent;
    /**
     * Convert learning pattern to adaptations
     */
    private convertPatternToAdaptations;
    /**
     * Get intelligence dashboard data
     */
    getIntelligenceDashboard(): {
        wrappedAgents: number;
        totalAdaptations: number;
        averagePerformance: {
            successRate: number;
            userSatisfaction: number;
            avgExecutionTime: number;
        };
        usageAnalytics: any;
        learningInsights: any;
    };
    /**
     * Enable/disable learning for all agents
     */
    setLearningEnabled(enabled: boolean): void;
}
export declare const agentIntelligence: AgentIntelligenceManager;
export default agentIntelligence;
