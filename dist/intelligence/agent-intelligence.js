/**
 * VERSATIL SDLC Framework - Agent Intelligence Integration
 *
 * Integrates adaptive learning and usage analytics with Enhanced OPERA agents
 * to enable continuous improvement based on real user interactions.
 */
import { usageAnalytics } from './usage-analytics.js';
import { adaptiveLearning } from './adaptive-learning.js';
import { VERSATILLogger } from '../utils/logger.js';
export class AgentIntelligenceManager {
    constructor() {
        this.wrappedAgents = new Map();
        this.isLearningEnabled = true;
        this.logger = new VERSATILLogger();
        this.initializeIntelligence();
    }
    /**
     * Initialize the intelligence system
     */
    initializeIntelligence() {
        // Start learning engines
        if (this.isLearningEnabled) {
            usageAnalytics.startTracking();
            adaptiveLearning.startLearning();
            this.logger.info('Agent intelligence system initialized', {}, 'agent-intelligence');
        }
        // Listen for adaptation proposals
        adaptiveLearning.on('adaptation_proposed', this.handleAdaptationProposal.bind(this));
        adaptiveLearning.on('pattern_discovered', this.handlePatternDiscovery.bind(this));
    }
    /**
     * Wrap an agent with intelligence capabilities
     */
    wrapAgent(agent) {
        const agentId = agent['id'];
        // Create intelligent wrapper
        const wrapper = {
            agent,
            learningEnabled: this.isLearningEnabled,
            adaptations: new Map(),
            performanceMetrics: {
                activations: 0,
                successRate: 0,
                avgExecutionTime: 0,
                userSatisfactionScore: 0
            }
        };
        this.wrappedAgents.set(agentId, wrapper);
        // Create intelligent proxy
        return this.createIntelligentProxy(agent, wrapper);
    }
    /**
     * Create an intelligent proxy that intercepts agent calls
     */
    createIntelligentProxy(agent, wrapper) {
        const agentId = agent['id'];
        const manager = this;
        return new Proxy(agent, {
            get(target, prop, receiver) {
                if (prop === 'activate') {
                    return async (context) => {
                        // Track activation
                        const activationId = usageAnalytics.trackAgentActivation(agentId, context.filePath, context);
                        const startTime = Date.now();
                        try {
                            // Apply any learned adaptations
                            const adaptedContext = manager.applyAdaptations(agentId, context);
                            // Execute original agent
                            const response = await target.activate.call(this, adaptedContext);
                            // Track performance
                            const executionTime = Date.now() - startTime;
                            const issuesDetected = response.suggestions?.length || 0;
                            usageAnalytics.trackPerformance(agentId, executionTime, issuesDetected, 0.8 // Default quality score, could be calculated
                            );
                            // Update wrapper metrics
                            wrapper.performanceMetrics.activations++;
                            wrapper.performanceMetrics.avgExecutionTime =
                                (wrapper.performanceMetrics.avgExecutionTime + executionTime) / 2;
                            // Enhanced response with learning context
                            const enhancedResponse = manager.enhanceResponse(response, wrapper, activationId);
                            manager.logger.debug('Intelligent agent activation completed', {
                                agentId,
                                executionTime,
                                issuesDetected,
                                activationId
                            }, 'agent-intelligence');
                            return enhancedResponse;
                        }
                        catch (error) {
                            manager.logger.error('Intelligent agent activation failed', {
                                agentId,
                                error: error instanceof Error ? error.message : String(error),
                                activationId
                            }, 'agent-intelligence');
                            throw error;
                        }
                    };
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }
    /**
     * Apply learned adaptations to the context
     */
    applyAdaptations(agentId, context) {
        const wrapper = this.wrappedAgents.get(agentId);
        if (!wrapper || wrapper.adaptations.size === 0) {
            return context;
        }
        const adaptedContext = { ...context };
        // Apply learned adaptations
        for (const [adaptationType, adaptation] of wrapper.adaptations) {
            switch (adaptationType) {
                case 'context_enhancement':
                    // Enhance context based on learned patterns
                    adaptedContext.matchedKeywords = [
                        ...(adaptedContext.matchedKeywords || []),
                        ...adaptation.additionalKeywords
                    ];
                    break;
                case 'priority_adjustment':
                    // Adjust urgency based on learned user preferences
                    if (adaptation.increasePriority) {
                        adaptedContext.urgency = 'high';
                    }
                    break;
                case 'file_type_specialization':
                    // Add specialized handling for certain file types
                    if (adaptedContext.filePath && adaptation.fileTypeRules) {
                        const fileExt = adaptedContext.filePath.split('.').pop();
                        if (fileExt && adaptation.fileTypeRules[fileExt]) {
                            adaptedContext.contextClarity = 'clear';
                        }
                    }
                    break;
            }
        }
        return adaptedContext;
    }
    /**
     * Enhance agent response with learning capabilities
     */
    enhanceResponse(response, wrapper, activationId) {
        // Add learning feedback mechanisms to suggestions
        const enhancedSuggestions = response.suggestions.map((suggestion, index) => ({
            ...suggestion,
            metadata: {
                activationId,
                suggestionId: `${activationId}_${index}`,
                feedbackEnabled: true,
                learningSource: 'enhanced_opera'
            }
        }));
        // Add intelligence context
        const enhancedResponse = {
            ...response,
            suggestions: enhancedSuggestions,
            context: {
                ...response.context,
                intelligence: {
                    learningEnabled: wrapper.learningEnabled,
                    activationId,
                    adaptationsApplied: wrapper.adaptations.size,
                    performanceMetrics: wrapper.performanceMetrics
                }
            }
        };
        return enhancedResponse;
    }
    /**
     * Record user feedback for learning
     */
    recordUserFeedback(agentId, suggestionId, feedback) {
        // Track suggestion interaction
        usageAnalytics.trackSuggestion(agentId, 'general', // Could be extracted from suggestionId
        feedback.wasFollowed, {
            helpful: feedback.wasHelpful,
            accurate: feedback.wasAccurate,
            rating: feedback.rating,
            ...(feedback.comments ? { comments: feedback.comments } : {})
        });
        // Update agent performance metrics
        const wrapper = this.wrappedAgents.get(agentId);
        if (wrapper) {
            const newScore = feedback.rating / 5.0; // Convert to 0-1 scale
            wrapper.performanceMetrics.userSatisfactionScore =
                (wrapper.performanceMetrics.userSatisfactionScore + newScore) / 2;
            if (feedback.wasHelpful && feedback.wasAccurate) {
                wrapper.performanceMetrics.successRate =
                    (wrapper.performanceMetrics.successRate + 1) / 2;
            }
        }
        this.logger.info('User feedback recorded', {
            agentId,
            suggestionId,
            rating: feedback.rating,
            wasFollowed: feedback.wasFollowed
        }, 'agent-intelligence');
    }
    /**
     * Report false positive for learning
     */
    reportFalsePositive(agentId, issueType, filePath, userComments) {
        usageAnalytics.trackFalsePositive(agentId, issueType, filePath, userComments);
        this.logger.info('False positive reported', {
            agentId,
            issueType,
            filePath
        }, 'agent-intelligence');
    }
    /**
     * Handle adaptation proposals from learning engine
     */
    handleAdaptationProposal(data) {
        const { agentId, adaptation } = data;
        const wrapper = this.wrappedAgents.get(agentId);
        if (!wrapper)
            return;
        // Auto-apply low-risk adaptations
        if (adaptation.confidence > 0.8 && adaptation.expectedImprovement > 0.1) {
            this.applyAdaptationToAgent(agentId, adaptation);
        }
        else {
            // Queue for manual review
            this.logger.info('Adaptation proposal queued for review', {
                agentId,
                adaptationType: adaptation.adaptationType,
                confidence: adaptation.confidence,
                expectedImprovement: adaptation.expectedImprovement
            }, 'agent-intelligence');
        }
    }
    /**
     * Handle pattern discovery
     */
    handlePatternDiscovery(pattern) {
        this.logger.info('Learning pattern discovered', {
            patternId: pattern.id,
            agentId: pattern.agentId,
            confidence: pattern.confidence,
            successRate: pattern.successRate
        }, 'agent-intelligence');
        // Automatically apply high-confidence patterns
        if (pattern.confidence > 0.9 && pattern.successRate > 0.8) {
            this.applyPatternToAgent(pattern);
        }
    }
    /**
     * Apply adaptation to agent
     */
    applyAdaptationToAgent(agentId, adaptation) {
        const wrapper = this.wrappedAgents.get(agentId);
        if (!wrapper)
            return;
        wrapper.adaptations.set(adaptation.adaptationType, adaptation.changes);
        this.logger.info('Adaptation applied to agent', {
            agentId,
            adaptationType: adaptation.adaptationType
        }, 'agent-intelligence');
    }
    /**
     * Apply learned pattern to agent
     */
    applyPatternToAgent(pattern) {
        const wrapper = this.wrappedAgents.get(pattern.agentId);
        if (!wrapper)
            return;
        // Convert pattern recommendations to adaptations
        const adaptations = this.convertPatternToAdaptations(pattern);
        for (const adaptation of adaptations) {
            wrapper.adaptations.set(adaptation.type, adaptation.config);
        }
        this.logger.info('Pattern applied to agent', {
            agentId: pattern.agentId,
            patternId: pattern.id,
            adaptationsApplied: adaptations.length
        }, 'agent-intelligence');
    }
    /**
     * Convert learning pattern to adaptations
     */
    convertPatternToAdaptations(pattern) {
        const adaptations = [];
        // File type specialization
        if (pattern.context.fileTypes.length > 0) {
            adaptations.push({
                type: 'file_type_specialization',
                config: {
                    fileTypeRules: pattern.context.fileTypes.reduce((rules, fileType) => {
                        rules[fileType] = { specialized: true, confidence: pattern.confidence };
                        return rules;
                    }, {})
                }
            });
        }
        // Context enhancement
        if (pattern.recommendations.detectionRules.length > 0) {
            adaptations.push({
                type: 'context_enhancement',
                config: {
                    additionalKeywords: pattern.recommendations.detectionRules,
                    confidence: pattern.confidence
                }
            });
        }
        return adaptations;
    }
    /**
     * Get intelligence dashboard data
     */
    getIntelligenceDashboard() {
        const wrappedAgents = this.wrappedAgents.size;
        let totalAdaptations = 0;
        let totalSuccessRate = 0;
        let totalSatisfaction = 0;
        let totalExecutionTime = 0;
        for (const wrapper of this.wrappedAgents.values()) {
            totalAdaptations += wrapper.adaptations.size;
            totalSuccessRate += wrapper.performanceMetrics.successRate;
            totalSatisfaction += wrapper.performanceMetrics.userSatisfactionScore;
            totalExecutionTime += wrapper.performanceMetrics.avgExecutionTime;
        }
        const avgPerformance = wrappedAgents > 0 ? {
            successRate: totalSuccessRate / wrappedAgents,
            userSatisfaction: totalSatisfaction / wrappedAgents,
            avgExecutionTime: totalExecutionTime / wrappedAgents
        } : { successRate: 0, userSatisfaction: 0, avgExecutionTime: 0 };
        return {
            wrappedAgents,
            totalAdaptations,
            averagePerformance: avgPerformance,
            usageAnalytics: usageAnalytics.getAnalyticsDashboard(),
            learningInsights: adaptiveLearning.getLearningInsights()
        };
    }
    /**
     * Enable/disable learning for all agents
     */
    setLearningEnabled(enabled) {
        this.isLearningEnabled = enabled;
        if (enabled) {
            usageAnalytics.startTracking();
            adaptiveLearning.startLearning();
        }
        else {
            usageAnalytics.stopTracking();
        }
        // Update all wrapped agents
        for (const wrapper of this.wrappedAgents.values()) {
            wrapper.learningEnabled = enabled;
        }
        this.logger.info('Agent learning toggled', { enabled }, 'agent-intelligence');
    }
}
// Export singleton instance
export const agentIntelligence = new AgentIntelligenceManager();
export default agentIntelligence;
//# sourceMappingURL=agent-intelligence.js.map