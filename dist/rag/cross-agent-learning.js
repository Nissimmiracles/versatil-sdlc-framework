/**
 * Cross-Agent Learning System
 * Enables agents to learn from each other's successes and failures
 */
export class CrossAgentLearning {
    constructor(vectorStore) {
        this.interactionHistory = [];
        this.vectorStore = vectorStore;
    }
    /**
     * Learn from agent interaction
     */
    async learnFromAgentInteraction(sourceAgent, targetAgent, context, outcome, metadata) {
        const interaction = {
            sourceAgent,
            targetAgent,
            context,
            outcome,
            timestamp: Date.now(),
            metadata
        };
        this.interactionHistory.push(interaction);
        // Store interaction pattern
        await this.vectorStore.storeMemory({
            content: `${sourceAgent} → ${targetAgent}: ${outcome} (${context})`,
            contentType: 'text',
            metadata: {
                agentId: 'cross-agent-learning',
                timestamp: Date.now(),
                tags: ['cross-agent', sourceAgent, targetAgent, outcome],
                source_agent: sourceAgent,
                target_agent: targetAgent,
                context,
                outcome,
                ...metadata
            }
        });
        // If successful, store as a reusable pattern
        if (outcome === 'success') {
            await this.storeSuccessPattern(sourceAgent, targetAgent, context, metadata);
        }
    }
    /**
     * Store successful pattern for future use
     */
    async storeSuccessPattern(sourceAgent, targetAgent, context, metadata) {
        await this.vectorStore.storeMemory({
            content: `Successful handoff: ${sourceAgent} → ${targetAgent}`,
            contentType: 'text',
            metadata: {
                agentId: 'cross-agent-learning',
                timestamp: Date.now(),
                tags: ['cross-agent', 'success-pattern', sourceAgent, targetAgent],
                source_agent: sourceAgent,
                target_agent: targetAgent,
                pattern_type: 'handoff-success',
                context,
                reusable: true,
                ...metadata
            }
        });
    }
    /**
     * Query for similar successful interactions
     */
    async querySimilarSuccesses(sourceAgent, targetAgent, limit = 5) {
        const result = await this.vectorStore.queryMemories({
            query: `${sourceAgent} ${targetAgent} success`,
            queryType: 'semantic',
            agentId: 'cross-agent-learning',
            topK: limit,
            filters: {
                tags: ['cross-agent', 'success'],
                contentTypes: ['text']
            }
        });
        return result.documents || [];
    }
    /**
     * Get recommended next agent based on history
     */
    async getRecommendedNextAgent(currentAgent, context) {
        // Query for successful patterns from this agent
        const successfulHandoffs = await this.vectorStore.queryMemories({
            query: `${currentAgent} successful handoff ${context}`,
            queryType: 'hybrid',
            agentId: 'cross-agent-learning',
            topK: 10,
            filters: {
                tags: ['cross-agent', 'success-pattern'],
                contentTypes: ['text']
            }
        });
        if (!successfulHandoffs.documents || successfulHandoffs.documents.length === 0) {
            return null;
        }
        // Count target agents and their success rates
        const targetAgentCounts = new Map();
        for (const doc of successfulHandoffs.documents) {
            const targetAgent = doc.metadata?.target_agent;
            if (targetAgent && doc.metadata?.source_agent === currentAgent) {
                const existing = targetAgentCounts.get(targetAgent) || { count: 0, totalConfidence: 0 };
                targetAgentCounts.set(targetAgent, {
                    count: existing.count + 1,
                    totalConfidence: existing.totalConfidence + (doc.metadata?.relevanceScore || 0.5)
                });
            }
        }
        // Find best candidate
        let bestAgent = null;
        let bestScore = 0;
        for (const [agentId, stats] of targetAgentCounts.entries()) {
            const score = stats.totalConfidence / stats.count;
            if (score > bestScore) {
                bestScore = score;
                bestAgent = agentId;
            }
        }
        if (bestAgent) {
            return {
                agentId: bestAgent,
                confidence: bestScore
            };
        }
        return null;
    }
    /**
     * Extract learning insights from interaction history
     */
    async extractLearningInsights() {
        const insights = [];
        // Analyze interaction patterns
        const agentPairs = new Map();
        for (const interaction of this.interactionHistory) {
            const key = `${interaction.sourceAgent}->${interaction.targetAgent}`;
            const stats = agentPairs.get(key) || { success: 0, failure: 0 };
            if (interaction.outcome === 'success')
                stats.success++;
            if (interaction.outcome === 'failure')
                stats.failure++;
            agentPairs.set(key, stats);
        }
        // Generate insights from patterns
        for (const [pair, stats] of agentPairs.entries()) {
            const total = stats.success + stats.failure;
            if (total >= 3) { // Minimum sample size
                const successRate = stats.success / total;
                const [source, target] = pair.split('->');
                if (successRate > 0.7) {
                    insights.push({
                        pattern: `High success rate for ${source} → ${target}`,
                        confidence: successRate,
                        applicability: [source, target],
                        description: `${source} successfully hands off to ${target} in ${Math.round(successRate * 100)}% of cases`
                    });
                }
                else if (successRate < 0.3) {
                    insights.push({
                        pattern: `Low success rate for ${source} → ${target}`,
                        confidence: 1 - successRate,
                        applicability: [source, target],
                        description: `${source} → ${target} handoff may need review (${Math.round(successRate * 100)}% success)`
                    });
                }
            }
        }
        return insights;
    }
    /**
     * Get interaction statistics
     */
    getStatistics() {
        const totalInteractions = this.interactionHistory.length;
        const successful = this.interactionHistory.filter(i => i.outcome === 'success').length;
        const failed = this.interactionHistory.filter(i => i.outcome === 'failure').length;
        return {
            totalInteractions,
            successful,
            failed,
            successRate: totalInteractions > 0 ? successful / totalInteractions : 0,
            agentPairs: this.getAgentPairStatistics()
        };
    }
    /**
     * Get statistics by agent pair
     */
    getAgentPairStatistics() {
        const pairs = new Map();
        for (const interaction of this.interactionHistory) {
            const key = `${interaction.sourceAgent}->${interaction.targetAgent}`;
            const stats = pairs.get(key) || { success: 0, failure: 0, initiated: 0 };
            stats[interaction.outcome]++;
            pairs.set(key, stats);
        }
        return Object.fromEntries(pairs);
    }
}
//# sourceMappingURL=cross-agent-learning.js.map