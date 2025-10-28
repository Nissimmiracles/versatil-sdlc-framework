/**
 * VERSATIL v6.1 - Git PR Feedback Agent
 *
 * Automatically collects negative user experiences/sentiments about the framework
 * and submits them as Pull Requests to the public GitHub repository.
 *
 * Features:
 * - Sentiment analysis on user interactions
 * - Automatic issue/PR creation for negative feedback
 * - Groups similar feedback into single PRs
 * - Prioritizes critical issues
 * - Links to relevant framework code
 *
 * Purpose: Continuous improvement loop from real user experiences
 */
import { EventEmitter } from 'events';
import { getMCPToolRouter } from '../../mcp/mcp-tool-router.js';
export class GitPRFeedbackAgent extends EventEmitter {
    constructor(config) {
        super();
        this.feedbackQueue = [];
        this.submittedPRs = new Map(); // prId -> githubUrl
        this.feedbackClusters = new Map();
        this.config = config;
    }
    /**
     * Start collecting user feedback
     */
    async start() {
        if (!this.config.enabled) {
            console.log('[GitPRFeedbackAgent] Disabled in config');
            return;
        }
        console.log('[GitPRFeedbackAgent] 🚀 Starting feedback collection...');
        // Start periodic collection
        this.collectionTimer = setInterval(() => this.processFeedbackQueue(), this.config.collectionInterval);
        this.emit('started');
        console.log('[GitPRFeedbackAgent] ✅ Feedback collection active');
    }
    /**
     * Stop collecting feedback
     */
    async stop() {
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = undefined;
        }
        // Process remaining feedback before stopping
        if (this.feedbackQueue.length > 0) {
            await this.processFeedbackQueue();
        }
        this.emit('stopped');
        console.log('[GitPRFeedbackAgent] 🛑 Feedback collection stopped');
    }
    /**
     * Collect feedback from user interaction
     */
    async collectFeedback(feedback) {
        // Analyze sentiment
        const sentimentAnalysis = await this.analyzeSentiment(feedback);
        const fullFeedback = {
            id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            sentiment: sentimentAnalysis.sentiment,
            sentimentScore: sentimentAnalysis.score,
            ...feedback
        };
        // Only queue negative feedback
        if (fullFeedback.sentimentScore <= this.config.sentimentThreshold) {
            this.feedbackQueue.push(fullFeedback);
            console.log(`[GitPRFeedbackAgent] 📝 Negative feedback collected: ${fullFeedback.category} (score: ${fullFeedback.sentimentScore.toFixed(2)})`);
            this.emit('feedback-collected', fullFeedback);
            // Store in RAG for learning
            if (this.config.vectorStore) {
                await this.storeFeedbackInRAG(fullFeedback);
            }
        }
        return fullFeedback;
    }
    /**
     * Analyze sentiment of feedback
     */
    async analyzeSentiment(feedback) {
        let score = 0;
        let negativeSignals = 0;
        let positiveSignals = 0;
        // Analyze context for negative indicators
        if (!feedback.context?.success)
            negativeSignals += 2;
        if (feedback.context?.errorMessage)
            negativeSignals += 2;
        if ((feedback.context?.retryCount || 0) > 1)
            negativeSignals += 1;
        if ((feedback.context?.duration || 0) > 30000)
            negativeSignals += 1; // >30s
        // Analyze user message for sentiment (simple keyword-based)
        if (feedback.userMessage) {
            const msg = feedback.userMessage.toLowerCase();
            // Negative keywords
            const negativeKeywords = [
                'broken', 'fail', 'error', 'bug', 'slow', 'stuck', 'crash', 'wrong',
                'confusing', 'frustrating', 'annoying', 'terrible', 'awful', 'hate',
                "doesn't work", 'not working', 'issue', 'problem'
            ];
            negativeSignals += negativeKeywords.filter(kw => msg.includes(kw)).length;
            // Positive keywords
            const positiveKeywords = [
                'great', 'good', 'works', 'love', 'excellent', 'perfect', 'awesome',
                'helpful', 'fast', 'easy', 'nice', 'thank'
            ];
            positiveSignals += positiveKeywords.filter(kw => msg.includes(kw)).length;
        }
        // Calculate score (-1 to 1)
        const totalSignals = negativeSignals + positiveSignals || 1;
        score = (positiveSignals - negativeSignals) / totalSignals;
        // Determine sentiment category
        let sentiment;
        if (score <= -0.7)
            sentiment = 'critical';
        else if (score <= -0.3)
            sentiment = 'negative';
        else if (score < 0.3)
            sentiment = 'neutral';
        else
            sentiment = 'positive';
        return { sentiment, score };
    }
    /**
     * Process feedback queue and create PRs
     */
    async processFeedbackQueue() {
        if (this.feedbackQueue.length === 0)
            return;
        console.log(`[GitPRFeedbackAgent] 🔍 Processing ${this.feedbackQueue.length} feedback items...`);
        // Group feedback into clusters
        const clusters = await this.clusterFeedback(this.feedbackQueue);
        // Create PRs for clusters that meet threshold
        for (const cluster of clusters) {
            if (cluster.feedbackItems.length >= this.config.minFeedbackForPR) {
                await this.createPRForCluster(cluster);
            }
        }
        // Clear processed feedback
        this.feedbackQueue = [];
    }
    /**
     * Cluster similar feedback into groups
     */
    async clusterFeedback(feedback) {
        const clusters = new Map();
        for (const item of feedback) {
            // Generate cluster key based on category and keywords
            const clusterKey = `${item.category}-${item.keywords.slice(0, 3).sort().join('-')}`;
            if (clusters.has(clusterKey)) {
                const cluster = clusters.get(clusterKey);
                cluster.feedbackItems.push(item);
                // Update priority (highest priority wins)
                if (this.getPriorityValue(item.sentiment) > this.getPriorityValue(cluster.priority)) {
                    cluster.priority = this.mapSentimentToPriority(item.sentiment);
                }
            }
            else {
                // Create new cluster
                const cluster = {
                    id: `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    category: item.category,
                    commonKeywords: item.keywords,
                    feedbackItems: [item],
                    priority: this.mapSentimentToPriority(item.sentiment),
                    affectedComponent: this.inferComponent(item),
                    suggestedTitle: this.generateClusterTitle(item),
                    suggestedDescription: ''
                };
                clusters.set(clusterKey, cluster);
            }
        }
        // Generate descriptions for each cluster
        for (const cluster of clusters.values()) {
            cluster.suggestedDescription = await this.generateClusterDescription(cluster);
        }
        return Array.from(clusters.values());
    }
    /**
     * Create GitHub PR for feedback cluster
     */
    async createPRForCluster(cluster) {
        console.log(`[GitPRFeedbackAgent] 📤 Creating PR for cluster: ${cluster.suggestedTitle}`);
        try {
            const router = getMCPToolRouter();
            const { owner, repo, baseBranch, autoCreateBranch, prLabels } = this.config.githubConfig;
            // 1. Create branch
            let branchName = `feedback/${cluster.category}/${Date.now()}`;
            if (autoCreateBranch) {
                await router.handleToolCall({
                    tool: 'GitHub',
                    action: 'create_branch',
                    params: {
                        owner,
                        repo,
                        branch: branchName,
                        from: baseBranch
                    },
                    agentId: 'git-pr-feedback-agent'
                });
            }
            // 2. Create improvement proposal file
            const proposalContent = this.generateProposalFile(cluster);
            const proposalPath = `feedback-proposals/${cluster.id}.md`;
            await router.handleToolCall({
                tool: 'GitHub',
                action: 'update_file',
                params: {
                    owner,
                    repo,
                    file: {
                        path: proposalPath,
                        content: proposalContent,
                        message: `Add feedback proposal: ${cluster.suggestedTitle}`,
                        branch: branchName
                    }
                },
                agentId: 'git-pr-feedback-agent'
            });
            // 3. Create Pull Request
            const prResult = await router.handleToolCall({
                tool: 'GitHub',
                action: 'create_pr',
                params: {
                    owner,
                    repo,
                    pr: {
                        title: `[User Feedback] ${cluster.suggestedTitle}`,
                        body: this.generatePRBody(cluster),
                        head: branchName,
                        base: baseBranch,
                        draft: !this.config.autoSubmitPR
                    }
                },
                agentId: 'git-pr-feedback-agent'
            });
            if (prResult.success) {
                const prUrl = prResult.data.html_url;
                this.submittedPRs.set(cluster.id, prUrl);
                console.log(`[GitPRFeedbackAgent] ✅ PR created: ${prUrl}`);
                this.emit('pr-created', {
                    cluster,
                    prUrl,
                    feedbackCount: cluster.feedbackItems.length
                });
                // 4. Add labels
                if (prLabels.length > 0) {
                    await router.handleToolCall({
                        tool: 'GitHub',
                        action: 'add_labels',
                        params: {
                            owner,
                            repo,
                            issue_number: prResult.data.number,
                            labels: [...prLabels, `priority-${cluster.priority}`, `category-${cluster.category}`]
                        },
                        agentId: 'git-pr-feedback-agent'
                    });
                }
            }
        }
        catch (error) {
            console.error(`[GitPRFeedbackAgent] ❌ Failed to create PR:`, error.message);
            this.emit('pr-failed', { cluster, error: error.message });
        }
    }
    /**
     * Generate proposal markdown file
     */
    generateProposalFile(cluster) {
        const timestamp = new Date().toISOString();
        return `# User Feedback Proposal: ${cluster.suggestedTitle}

**Generated**: ${timestamp}
**Priority**: ${cluster.priority.toUpperCase()}
**Category**: ${cluster.category}
**Affected Component**: ${cluster.affectedComponent}
**Feedback Count**: ${cluster.feedbackItems.length}

---

## Summary

${cluster.suggestedDescription}

---

## User Feedback Details

${cluster.feedbackItems.map((item, idx) => `
### Feedback #${idx + 1} (${item.sentiment}, score: ${item.sentimentScore.toFixed(2)})

**Task**: ${item.taskDescription}
**Agent**: ${item.agentId}
**Timestamp**: ${new Date(item.timestamp).toISOString()}

${item.userMessage ? `**User Message**: "${item.userMessage}"` : ''}

**Context**:
- Success: ${item.context.success ? '✅' : '❌'}
${item.context.errorMessage ? `- Error: ${item.context.errorMessage}` : ''}
${item.context.duration ? `- Duration: ${(item.context.duration / 1000).toFixed(1)}s` : ''}
${item.context.retryCount ? `- Retries: ${item.context.retryCount}` : ''}
${item.context.filePath ? `- File: ${item.context.filePath}` : ''}

**Keywords**: ${item.keywords.join(', ')}

${item.suggestedFix ? `**Suggested Fix**: ${item.suggestedFix}` : ''}
`).join('\n---\n')}

---

## Proposed Improvements

### Short-term Fixes
- [ ] Improve error messages for this use case
- [ ] Add validation to prevent this failure mode
- [ ] Update documentation with examples

### Long-term Improvements
- [ ] Refactor ${cluster.affectedComponent} for better reliability
- [ ] Add automated tests covering this scenario
- [ ] Implement proactive detection for this issue type

---

## Testing Plan

1. **Reproduce Issue**: Use feedback context to recreate the problem
2. **Implement Fix**: Apply proposed changes
3. **Validate**: Ensure fix resolves all ${cluster.feedbackItems.length} feedback cases
4. **Regression Test**: Verify no side effects
5. **User Validation**: Deploy to staging for user testing

---

**Auto-generated by VERSATIL Git PR Feedback Agent**
`;
    }
    /**
     * Generate PR body
     */
    generatePRBody(cluster) {
        return `## 📊 User Feedback Analysis

**Priority**: ${cluster.priority.toUpperCase()}
**Category**: ${cluster.category}
**Feedback Count**: ${cluster.feedbackItems.length}

### Summary

${cluster.suggestedDescription}

### Affected Component

\`${cluster.affectedComponent}\`

### Common Keywords

${cluster.commonKeywords.map(kw => `- \`${kw}\``).join('\n')}

### Sentiment Breakdown

${this.generateSentimentBreakdown(cluster)}

---

## 📋 Details

See \`feedback-proposals/${cluster.id}.md\` for complete analysis of all ${cluster.feedbackItems.length} feedback items.

---

## ✅ Acceptance Criteria

- [ ] All ${cluster.feedbackItems.length} feedback scenarios resolved
- [ ] Error messages improved
- [ ] Documentation updated
- [ ] Tests added
- [ ] No regressions

---

**🤖 Auto-generated from real user experiences by VERSATIL Framework**
**Framework Version**: v6.1.0
**Generated**: ${new Date().toISOString()}
`;
    }
    /**
     * Generate sentiment breakdown for PR
     */
    generateSentimentBreakdown(cluster) {
        const counts = {
            critical: 0,
            negative: 0,
            neutral: 0,
            positive: 0
        };
        for (const item of cluster.feedbackItems) {
            counts[item.sentiment]++;
        }
        return Object.entries(counts)
            .filter(([_, count]) => count > 0)
            .map(([sentiment, count]) => {
            const emoji = sentiment === 'critical' ? '🚨' : sentiment === 'negative' ? '⚠️' : sentiment === 'neutral' ? 'ℹ️' : '✅';
            return `${emoji} **${sentiment}**: ${count}`;
        })
            .join('\n');
    }
    /**
     * Store feedback in RAG for learning
     */
    async storeFeedbackInRAG(feedback) {
        if (!this.config.vectorStore)
            return;
        try {
            await this.config.vectorStore.storeMemory({
                content: JSON.stringify({
                    type: 'user_feedback',
                    sentiment: feedback.sentiment,
                    score: feedback.sentimentScore,
                    category: feedback.category,
                    task: feedback.taskDescription,
                    context: feedback.context,
                    keywords: feedback.keywords
                }),
                contentType: 'text',
                metadata: {
                    agentId: 'git-pr-feedback-agent',
                    tags: ['feedback', feedback.sentiment, feedback.category],
                    timestamp: feedback.timestamp
                }
            });
        }
        catch (error) {
            console.warn('[GitPRFeedbackAgent] Failed to store feedback in RAG:', error);
        }
    }
    // ========== Helper Methods ==========
    mapSentimentToPriority(sentiment) {
        switch (sentiment) {
            case 'critical': return 'critical';
            case 'negative': return 'high';
            case 'neutral': return 'medium';
            case 'positive': return 'low';
        }
    }
    getPriorityValue(priority) {
        const map = { critical: 4, high: 3, medium: 2, low: 1 };
        return map[priority] || 0;
    }
    inferComponent(feedback) {
        // Infer component from agent, file path, or keywords
        if (feedback.agentId)
            return feedback.agentId;
        if (feedback.context.filePath) {
            const parts = feedback.context.filePath.split('/');
            return parts[parts.length - 2] || parts[parts.length - 1];
        }
        return 'framework-core';
    }
    generateClusterTitle(feedback) {
        const categoryMap = {
            bug: 'Fix',
            ux: 'Improve UX',
            performance: 'Optimize',
            documentation: 'Update Docs',
            feature_request: 'Add Feature',
            other: 'Improve'
        };
        const action = categoryMap[feedback.category] || 'Fix';
        const component = this.inferComponent(feedback);
        return `${action} ${component} issues (${feedback.keywords[0] || 'general'})`;
    }
    async generateClusterDescription(cluster) {
        const uniqueErrors = new Set(cluster.feedbackItems
            .map(f => f.context.errorMessage)
            .filter(Boolean));
        let description = `Users reported ${cluster.feedbackItems.length} similar issues with **${cluster.affectedComponent}**.\n\n`;
        description += `**Common problems:**\n`;
        description += cluster.commonKeywords.slice(0, 5).map(kw => `- ${kw}`).join('\n');
        if (uniqueErrors.size > 0) {
            description += `\n\n**Error messages seen:**\n`;
            description += Array.from(uniqueErrors).slice(0, 3).map(err => `- "${err}"`).join('\n');
        }
        return description;
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            queuedFeedback: this.feedbackQueue.length,
            submittedPRs: this.submittedPRs.size,
            clusters: this.feedbackClusters.size
        };
    }
}
// Export singleton instance
let _feedbackAgentInstance = null;
export function getGitPRFeedbackAgent(config) {
    if (!_feedbackAgentInstance && config) {
        _feedbackAgentInstance = new GitPRFeedbackAgent(config);
    }
    if (!_feedbackAgentInstance) {
        throw new Error('GitPRFeedbackAgent not initialized. Provide config on first call.');
    }
    return _feedbackAgentInstance;
}
//# sourceMappingURL=git-pr-feedback-agent.js.map