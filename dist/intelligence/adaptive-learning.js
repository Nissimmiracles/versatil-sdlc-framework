/**
 * VERSATIL SDLC Framework - Adaptive Learning & Auto-Improvement System
 *
 * This system learns from user interactions and automatically improves
 * the Enhanced OPERA agents based on real usage patterns, feedback, and outcomes.
 */
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger.js';
export class AdaptiveLearningEngine extends EventEmitter {
    constructor() {
        super();
        this.interactions = new Map();
        this.patterns = new Map();
        this.adaptations = new Map();
        this.isLearning = false;
        this.logger = new VERSATILLogger();
        this.dataPath = path.join(process.cwd(), '.versatil', 'learning');
        this.learningConfig = {
            minInteractionsForPattern: 10,
            confidenceThreshold: 0.7,
            adaptationInterval: 24 * 60 * 60 * 1000, // 24 hours
            maxAdaptationsPerAgent: 5
        };
        this.initializeLearning();
    }
    /**
     * Start the adaptive learning process
     */
    startLearning() {
        if (this.isLearning)
            return;
        this.isLearning = true;
        this.logger.info('Adaptive learning engine started', {}, 'adaptive-learning');
        // Load historical data
        this.loadLearningData();
        // Start periodic pattern analysis
        setInterval(() => {
            this.analyzePatterns();
        }, this.learningConfig.adaptationInterval);
        // Start real-time adaptation
        this.on('interaction', this.handleInteraction.bind(this));
        this.on('pattern_discovered', this.handlePatternDiscovery.bind(this));
    }
    /**
     * Stop the learning engine
     */
    stopLearning() {
        this.isLearning = false;
        this.logger.info('Adaptive learning stopped', {}, 'adaptive-learning');
    }
    /**
     * Record a user interaction with an agent
     */
    recordInteraction(interaction) {
        if (!this.isLearning)
            return;
        if (!this.interactions.has(interaction.agentId)) {
            this.interactions.set(interaction.agentId, []);
        }
        this.interactions.get(interaction.agentId).push(interaction);
        this.logger.info('User interaction recorded', {
            agentId: interaction.agentId,
            actionType: interaction.actionType,
            context: interaction.context
        }, 'adaptive-learning');
        this.emit('interaction', interaction);
        this.saveInteraction(interaction);
    }
    /**
     * Analyze user interactions to discover learning patterns
     */
    async analyzePatterns() {
        this.logger.info('Analyzing user interaction patterns...', {}, 'adaptive-learning');
        for (const [agentId, interactions] of this.interactions) {
            if (interactions.length < this.learningConfig.minInteractionsForPattern) {
                continue;
            }
            // Analyze success/failure patterns
            const successPatterns = this.findSuccessPatterns(agentId, interactions);
            const failurePatterns = this.findFailurePatterns(agentId, interactions);
            const userPreferences = this.extractUserPreferences(interactions);
            // Create learning patterns
            for (const pattern of [...successPatterns, ...failurePatterns]) {
                this.patterns.set(pattern.id, pattern);
                this.emit('pattern_discovered', pattern);
            }
            // Generate agent adaptations
            const adaptations = await this.generateAdaptations(agentId, interactions, userPreferences);
            for (const adaptation of adaptations) {
                this.proposeAdaptation(agentId, adaptation);
            }
        }
    }
    /**
     * Find patterns that lead to successful outcomes
     */
    findSuccessPatterns(agentId, interactions) {
        const patterns = [];
        const successfulInteractions = interactions.filter(i => i.outcome?.problemSolved &&
            (i.outcome?.userSatisfaction ?? 0) >= 4);
        // Group by file type
        const fileTypeGroups = this.groupByFileType(successfulInteractions);
        for (const [fileType, groupInteractions] of fileTypeGroups) {
            if (groupInteractions.length >= 5) {
                const pattern = {
                    id: `${agentId}_success_${fileType}_${Date.now()}`,
                    agentId,
                    pattern: `Successful detection in ${fileType} files`,
                    confidence: this.calculateConfidence(groupInteractions),
                    usageCount: groupInteractions.length,
                    successRate: this.calculateSuccessRate(groupInteractions),
                    context: {
                        fileTypes: [fileType],
                        projectTypes: this.extractProjectTypes(groupInteractions),
                        commonIssues: this.extractCommonIssues(groupInteractions),
                        userPreferences: this.extractUserPreferences(groupInteractions)
                    },
                    recommendations: {
                        agentImprovements: this.generateAgentImprovements(groupInteractions),
                        detectionRules: this.generateDetectionRules(groupInteractions),
                        suggestionTypes: this.generateSuggestionTypes(groupInteractions)
                    }
                };
                patterns.push(pattern);
            }
        }
        return patterns;
    }
    /**
     * Find patterns that lead to failed outcomes
     */
    findFailurePatterns(agentId, interactions) {
        const patterns = [];
        const failedInteractions = interactions.filter(i => !i.outcome?.problemSolved ||
            (i.outcome?.userSatisfaction ?? 5) < 3 ||
            i.context.issue?.wasAccurate === false);
        // Analyze false positives
        const falsePositives = failedInteractions.filter(i => i.context.issue?.wasAccurate === false);
        if (falsePositives.length >= 3) {
            const pattern = {
                id: `${agentId}_false_positive_${Date.now()}`,
                agentId,
                pattern: 'False positive detection pattern',
                confidence: this.calculateConfidence(falsePositives),
                usageCount: falsePositives.length,
                successRate: 0,
                context: {
                    fileTypes: this.extractFileTypes(falsePositives),
                    projectTypes: this.extractProjectTypes(falsePositives),
                    commonIssues: this.extractCommonIssues(falsePositives),
                    userPreferences: {}
                },
                recommendations: {
                    agentImprovements: ['Reduce false positive rate for these patterns'],
                    detectionRules: this.generateAntiPatterns(falsePositives),
                    suggestionTypes: ['Add confidence scoring to suggestions']
                }
            };
            patterns.push(pattern);
        }
        return patterns;
    }
    /**
     * Generate adaptive improvements for agents
     */
    async generateAdaptations(agentId, interactions, userPreferences) {
        const adaptations = [];
        // Analyze suggestion follow-through rates
        const suggestionAnalysis = this.analyzeSuggestionEffectiveness(interactions);
        if (suggestionAnalysis.lowFollowThroughSuggestions.length > 0) {
            adaptations.push({
                agentId,
                adaptationType: 'suggestion_algorithm',
                changes: {
                    deprioritizeSuggestions: suggestionAnalysis.lowFollowThroughSuggestions,
                    prioritizeSuggestions: suggestionAnalysis.highFollowThroughSuggestions
                },
                confidence: 0.8,
                expectedImprovement: 0.15
            });
        }
        // Analyze detection accuracy
        const detectionAnalysis = this.analyzeDetectionAccuracy(interactions);
        if (detectionAnalysis.falsePositiveRate > 0.2) {
            adaptations.push({
                agentId,
                adaptationType: 'detection_rule',
                changes: {
                    addExclusions: detectionAnalysis.falsePositivePatterns,
                    increaseConfidenceThreshold: true
                },
                confidence: 0.7,
                expectedImprovement: 0.25
            });
        }
        // Adapt to user preferences
        if (userPreferences['preferredSeverityLevel']) {
            adaptations.push({
                agentId,
                adaptationType: 'priority_weighting',
                changes: {
                    adjustSeverityWeights: userPreferences['preferredSeverityLevel'],
                    personalizeAlerts: userPreferences['alertPreferences']
                },
                confidence: 0.9,
                expectedImprovement: 0.1
            });
        }
        return adaptations;
    }
    /**
     * Propose an adaptation to an agent
     */
    proposeAdaptation(agentId, adaptation) {
        if (!this.adaptations.has(agentId)) {
            this.adaptations.set(agentId, []);
        }
        const agentAdaptations = this.adaptations.get(agentId);
        // Don't exceed max adaptations per agent
        if (agentAdaptations.length >= this.learningConfig.maxAdaptationsPerAgent) {
            // Remove least confident adaptation
            const leastConfident = agentAdaptations.reduce((min, curr) => curr.confidence < min.confidence ? curr : min);
            const index = agentAdaptations.indexOf(leastConfident);
            agentAdaptations.splice(index, 1);
        }
        agentAdaptations.push(adaptation);
        this.logger.info('Agent adaptation proposed', {
            agentId,
            adaptationType: adaptation.adaptationType,
            confidence: adaptation.confidence,
            expectedImprovement: adaptation.expectedImprovement
        }, 'adaptive-learning');
        this.emit('adaptation_proposed', { agentId, adaptation });
    }
    /**
     * Apply approved adaptations to agents
     */
    async applyAdaptation(agentId, adaptationId) {
        const agentAdaptations = this.adaptations.get(agentId);
        if (!agentAdaptations)
            return false;
        const adaptation = agentAdaptations.find(a => `${a.agentId}_${a.adaptationType}_${a.confidence}` === adaptationId);
        if (!adaptation)
            return false;
        try {
            // Store rollback data
            adaptation.rollbackData = await this.createRollbackData(agentId);
            // Apply the adaptation
            await this.applyAdaptationChanges(agentId, adaptation);
            this.logger.info('Agent adaptation applied successfully', {
                agentId,
                adaptationType: adaptation.adaptationType
            }, 'adaptive-learning');
            this.emit('adaptation_applied', { agentId, adaptation });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to apply agent adaptation', {
                agentId,
                adaptationType: adaptation.adaptationType,
                error: error instanceof Error ? error.message : String(error)
            }, 'adaptive-learning');
            return false;
        }
    }
    /**
     * Get learning insights for dashboard
     */
    getLearningInsights() {
        const totalInteractions = Array.from(this.interactions.values())
            .reduce((sum, interactions) => sum + interactions.length, 0);
        const patternsDiscovered = this.patterns.size;
        const adaptationsProposed = Array.from(this.adaptations.values())
            .reduce((sum, adaptations) => sum + adaptations.length, 0);
        const topPerformingAgents = this.calculateTopPerformingAgents();
        const recentLearnings = Array.from(this.patterns.values())
            .sort((a, b) => parseInt(b.id.split('_').pop()) - parseInt(a.id.split('_').pop()))
            .slice(0, 5);
        return {
            totalInteractions,
            patternsDiscovered,
            adaptationsProposed,
            adaptationsApplied: 0, // Would track from applied adaptations log
            topPerformingAgents,
            recentLearnings
        };
    }
    // Helper methods
    initializeLearning() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }
    loadLearningData() {
        try {
            const interactionsFile = path.join(this.dataPath, 'interactions.json');
            const patternsFile = path.join(this.dataPath, 'patterns.json');
            if (fs.existsSync(interactionsFile)) {
                const data = JSON.parse(fs.readFileSync(interactionsFile, 'utf8'));
                this.interactions = new Map(Object.entries(data));
            }
            if (fs.existsSync(patternsFile)) {
                const data = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
                this.patterns = new Map(Object.entries(data));
            }
        }
        catch (error) {
            this.logger.error('Failed to load learning data', { error: error instanceof Error ? error.message : String(error) }, 'adaptive-learning');
        }
    }
    saveInteraction(interaction) {
        // Save to persistent storage for learning
        const interactionsFile = path.join(this.dataPath, 'interactions.json');
        const data = Object.fromEntries(this.interactions);
        fs.writeFileSync(interactionsFile, JSON.stringify(data, null, 2));
    }
    handleInteraction(interaction) {
        // Real-time learning from interactions
        if (interaction.outcome?.problemSolved && interaction.outcome.userSatisfaction && interaction.outcome.userSatisfaction >= 4) {
            this.reinforceSuccessfulBehavior(interaction);
        }
        else if (interaction.context.issue?.wasAccurate === false) {
            this.adjustForFalsePositive(interaction);
        }
    }
    handlePatternDiscovery(pattern) {
        this.logger.info('New learning pattern discovered', {
            patternId: pattern.id,
            agentId: pattern.agentId,
            confidence: pattern.confidence,
            successRate: pattern.successRate
        }, 'adaptive-learning');
    }
    // Additional helper methods would be implemented here...
    groupByFileType(interactions) {
        const groups = new Map();
        // Implementation...
        return groups;
    }
    calculateConfidence(interactions) {
        // Implementation based on interaction quality and outcomes
        return 0.8;
    }
    calculateSuccessRate(interactions) {
        const successful = interactions.filter(i => i.outcome?.problemSolved);
        return successful.length / interactions.length;
    }
    extractProjectTypes(interactions) {
        return interactions.map(i => i.context.projectType).filter(Boolean);
    }
    extractCommonIssues(interactions) {
        return interactions.map(i => i.context.issue?.type).filter(Boolean);
    }
    extractUserPreferences(interactions) {
        // Analyze user behavior patterns to extract preferences
        return {};
    }
    generateAgentImprovements(interactions) {
        return ['Improve detection accuracy for this file type'];
    }
    generateDetectionRules(interactions) {
        return ['Add specialized rules for successful patterns'];
    }
    generateSuggestionTypes(interactions) {
        return ['Prioritize suggestion types that users follow'];
    }
    extractFileTypes(interactions) {
        return interactions.map(i => i.context.fileType).filter(Boolean);
    }
    generateAntiPatterns(interactions) {
        return ['Exclude patterns that cause false positives'];
    }
    analyzeSuggestionEffectiveness(interactions) {
        return { lowFollowThroughSuggestions: [], highFollowThroughSuggestions: [] };
    }
    analyzeDetectionAccuracy(interactions) {
        return { falsePositiveRate: 0.1, falsePositivePatterns: [] };
    }
    calculateTopPerformingAgents() {
        return [];
    }
    reinforceSuccessfulBehavior(interaction) {
        // Implement reinforcement learning
    }
    adjustForFalsePositive(interaction) {
        // Implement negative feedback learning
    }
    async createRollbackData(agentId) {
        return {};
    }
    async applyAdaptationChanges(agentId, adaptation) {
        // Apply changes to the agent's configuration/behavior
    }
}
// Export singleton instance
export const adaptiveLearning = new AdaptiveLearningEngine();
export default adaptiveLearning;
//# sourceMappingURL=adaptive-learning.js.map