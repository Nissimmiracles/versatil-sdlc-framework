/**
 * VERSATIL SDLC Framework - User Feedback Collection System
 * Collects, analyzes, and routes user feedback for continuous improvement
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
export var FeedbackCategory;
(function (FeedbackCategory) {
    FeedbackCategory["AGENT_PERFORMANCE"] = "agent_performance";
    FeedbackCategory["USER_EXPERIENCE"] = "user_experience";
    FeedbackCategory["FEATURE_REQUEST"] = "feature_request";
    FeedbackCategory["BUG_REPORT"] = "bug_report";
    FeedbackCategory["DOCUMENTATION"] = "documentation";
    FeedbackCategory["INTEGRATION"] = "integration";
    FeedbackCategory["PERFORMANCE"] = "performance";
    FeedbackCategory["SECURITY"] = "security";
})(FeedbackCategory || (FeedbackCategory = {}));
export var FeedbackType;
(function (FeedbackType) {
    FeedbackType["PRAISE"] = "praise";
    FeedbackType["COMPLAINT"] = "complaint";
    FeedbackType["SUGGESTION"] = "suggestion";
    FeedbackType["QUESTION"] = "question";
    FeedbackType["BUG"] = "bug";
    FeedbackType["FEATURE"] = "feature";
})(FeedbackType || (FeedbackType = {}));
export class VERSATILFeedbackCollector extends EventEmitter {
    constructor(projectPath) {
        super();
        this.feedbackStorage = new Map();
        this.analyticsData = {
            totalFeedback: 0,
            categoryBreakdown: new Map(),
            averageRating: 0,
            urgentIssues: 0,
            trendingTags: new Map()
        };
        this.logger = new VERSATILLogger();
        this.feedbackDir = path.join(projectPath, '.versatil', 'feedback');
        this.initializeFeedbackSystem();
    }
    /**
     * Initialize feedback collection system
     */
    async initializeFeedbackSystem() {
        try {
            await fs.mkdir(this.feedbackDir, { recursive: true });
            await this.loadExistingFeedback();
            this.setupAutoSave();
            this.logger.info('Feedback collection system initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize feedback system:', error);
        }
    }
    /**
     * Collect user feedback
     */
    async collectFeedback(feedback) {
        const feedbackId = this.generateFeedbackId();
        const completeFeedback = {
            ...feedback,
            id: feedbackId,
            timestamp: new Date()
        };
        // Store feedback
        this.feedbackStorage.set(feedbackId, completeFeedback);
        // Update analytics
        this.updateAnalytics(completeFeedback);
        // Emit event for real-time processing
        this.emit('feedback_received', completeFeedback);
        // Handle urgent feedback immediately
        if (completeFeedback.urgent) {
            await this.handleUrgentFeedback(completeFeedback);
        }
        // Auto-route feedback based on category
        await this.routeFeedback(completeFeedback);
        this.logger.info(`Feedback collected: ${feedbackId} - ${feedback.category}`);
        return feedbackId;
    }
    /**
     * Quick feedback collection for common scenarios
     */
    async quickFeedback(rating, message, category) {
        return this.collectFeedback({
            sessionId: this.generateSessionId(),
            category: category || FeedbackCategory.USER_EXPERIENCE,
            type: rating >= 4 ? FeedbackType.PRAISE : FeedbackType.COMPLAINT,
            rating,
            message,
            context: await this.generateContext(),
            metadata: {
                source: 'quick_feedback',
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * Collect feedback with automatic context detection
     */
    async contextualFeedback(rating, message, agentId, operation) {
        const context = await this.generateContext();
        return this.collectFeedback({
            sessionId: this.generateSessionId(),
            category: this.detectCategory(message, agentId),
            type: this.detectType(message, rating),
            rating,
            message,
            context: {
                ...context,
                ...(agentId ? { agentId } : {}),
                ...(operation ? { operation } : {})
            },
            metadata: {
                autoDetected: true,
                confidence: this.calculateConfidence(message)
            }
        });
    }
    /**
     * Get feedback analytics and insights
     */
    getFeedbackAnalytics() {
        return {
            ...this.analyticsData,
            recentTrends: this.calculateRecentTrends(),
            topIssues: this.getTopIssues(),
            improvementSuggestions: this.generateImprovementSuggestions()
        };
    }
    /**
     * Get feedback by category
     */
    getFeedbackByCategory(category) {
        return Array.from(this.feedbackStorage.values())
            .filter(feedback => feedback.category === category)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get urgent feedback requiring immediate attention
     */
    getUrgentFeedback() {
        return Array.from(this.feedbackStorage.values())
            .filter(feedback => feedback.urgent &&
            (!feedback.resolution || feedback.resolution.status === 'open'))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Generate improvement roadmap based on feedback
     */
    generateImprovementRoadmap() {
        const feedback = Array.from(this.feedbackStorage.values());
        return {
            criticalIssues: this.extractCriticalIssues(feedback),
            featureRequests: this.prioritizeFeatureRequests(feedback),
            userExperienceImprovements: this.identifyUXImprovements(feedback),
            performanceOptimizations: this.identifyPerformanceIssues(feedback),
            documentationGaps: this.identifyDocumentationNeeds(feedback)
        };
    }
    /**
     * Export feedback data for external analysis
     */
    async exportFeedback(format = 'json') {
        const feedback = Array.from(this.feedbackStorage.values());
        const exportPath = path.join(this.feedbackDir, `feedback_export_${Date.now()}.${format}`);
        if (format === 'json') {
            await fs.writeFile(exportPath, JSON.stringify(feedback, null, 2));
        }
        else {
            const csvData = this.convertToCSV(feedback);
            await fs.writeFile(exportPath, csvData);
        }
        return exportPath;
    }
    // Private helper methods
    generateFeedbackId() {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    async generateContext() {
        // Read version from package.json
        let frameworkVersion = '5.0.0'; // Fallback
        try {
            const { readFile } = await import('fs/promises');
            const { join } = await import('path');
            const pkgPath = join(process.cwd(), 'package.json');
            const pkgData = JSON.parse(await readFile(pkgPath, 'utf-8'));
            frameworkVersion = pkgData.version;
        }
        catch (error) {
            console.warn('Could not read package.json version, using fallback');
        }
        return {
            projectPath: process.cwd(),
            frameworkVersion,
            systemInfo: {
                platform: process.platform,
                nodeVersion: process.version,
                timestamp: new Date()
            }
        };
    }
    detectCategory(message, agentId) {
        const messageLower = message.toLowerCase();
        if (agentId)
            return FeedbackCategory.AGENT_PERFORMANCE;
        if (messageLower.includes('bug') || messageLower.includes('error'))
            return FeedbackCategory.BUG_REPORT;
        if (messageLower.includes('feature') || messageLower.includes('add'))
            return FeedbackCategory.FEATURE_REQUEST;
        if (messageLower.includes('slow') || messageLower.includes('performance'))
            return FeedbackCategory.PERFORMANCE;
        if (messageLower.includes('documentation') || messageLower.includes('docs'))
            return FeedbackCategory.DOCUMENTATION;
        return FeedbackCategory.USER_EXPERIENCE;
    }
    detectType(message, rating) {
        const messageLower = message.toLowerCase();
        if (messageLower.includes('bug') || messageLower.includes('error'))
            return FeedbackType.BUG;
        if (messageLower.includes('feature') || messageLower.includes('add'))
            return FeedbackType.FEATURE;
        if (messageLower.includes('?') || messageLower.includes('how'))
            return FeedbackType.QUESTION;
        if (rating >= 4)
            return FeedbackType.PRAISE;
        return rating <= 2 ? FeedbackType.COMPLAINT : FeedbackType.SUGGESTION;
    }
    calculateConfidence(message) {
        // Simple confidence calculation based on message clarity
        const words = message.split(' ').length;
        const hasSpecifics = /\b(version|agent|error|file|line)\b/i.test(message);
        let confidence = Math.min(words / 10, 1);
        if (hasSpecifics)
            confidence += 0.2;
        return Math.min(confidence, 1);
    }
    updateAnalytics(feedback) {
        this.analyticsData.totalFeedback++;
        // Update category breakdown
        const categoryCount = this.analyticsData.categoryBreakdown.get(feedback.category) || 0;
        this.analyticsData.categoryBreakdown.set(feedback.category, categoryCount + 1);
        // Update average rating
        const totalRating = Array.from(this.feedbackStorage.values())
            .reduce((sum, f) => sum + f.rating, 0);
        this.analyticsData.averageRating = totalRating / this.feedbackStorage.size;
        // Update urgent issues count
        if (feedback.urgent) {
            this.analyticsData.urgentIssues++;
        }
        // Update trending tags
        feedback.tags?.forEach(tag => {
            const tagCount = this.analyticsData.trendingTags.get(tag) || 0;
            this.analyticsData.trendingTags.set(tag, tagCount + 1);
        });
    }
    async handleUrgentFeedback(feedback) {
        this.logger.warn(`URGENT FEEDBACK: ${feedback.message}`);
        // Emit urgent event
        this.emit('urgent_feedback', feedback);
        // Auto-create resolution entry
        feedback.resolution = {
            status: 'open',
            priority: 'critical',
        };
        // Create issue in configured tracker
        try {
            const issueUrl = await this.createIssueInTracker(feedback);
            feedback.resolution.resolution = `Issue created: ${issueUrl}`;
            this.logger.info('Urgent feedback tracked', { feedbackId: feedback.id, issueUrl });
        }
        catch (error) {
            this.logger.error('Failed to create tracking issue', { feedbackId: feedback.id, error });
        }
        // Send notifications
        await this.notifyDevelopmentTeam(feedback);
    }
    async createIssueInTracker(feedback) {
        const issueTracker = process.env.ISSUE_TRACKER || 'github';
        try {
            switch (issueTracker) {
                case 'github':
                    return await this.createGitHubIssue(feedback);
                case 'jira':
                    return await this.createJiraIssue(feedback);
                default:
                    this.logger.warn('Unknown issue tracker, skipping', { issueTracker });
                    return 'no-tracker-configured';
            }
        }
        catch (error) {
            this.logger.error('Failed to create issue', { issueTracker, error });
            throw error;
        }
    }
    async createGitHubIssue(feedback) {
        const { VERSATILMCPClient } = await import('../mcp/mcp-client.js');
        const mcpClient = new VERSATILMCPClient();
        const result = await mcpClient.executeTool({
            tool: 'github_create_issue',
            arguments: {
                owner: process.env.GITHUB_OWNER,
                repo: process.env.GITHUB_REPO,
                title: `[Feedback-${feedback.category}] ${feedback.message.substring(0, 80)}`,
                body: `## User Feedback\n\n**Category**: ${feedback.category}\n**Message**: ${feedback.message}\n\n**Context**: ${JSON.stringify(feedback.context, null, 2)}\n\n**Type**: ${feedback.type}\n**User ID**: ${feedback.userId || 'anonymous'}\n**Timestamp**: ${feedback.timestamp}`,
                labels: ['feedback', feedback.category.toLowerCase(), feedback.urgent ? 'urgent' : 'normal']
            }
        });
        if (!result.success) {
            throw new Error(result.error || 'Failed to create GitHub issue');
        }
        return result.data?.issue_url || result.data?.html_url || 'github-issue-created';
    }
    async createJiraIssue(feedback) {
        if (!process.env.JIRA_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
            throw new Error('Jira credentials not configured');
        }
        const response = await fetch(`${process.env.JIRA_URL}/rest/api/2/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    project: { key: process.env.JIRA_PROJECT_KEY },
                    summary: `[Feedback-${feedback.category}] ${feedback.message.substring(0, 80)}`,
                    description: `h2. User Feedback\n\n*Category*: ${feedback.category}\n*Message*: ${feedback.message}\n\n*Context*: ${JSON.stringify(feedback.context)}\n\n*Type*: ${feedback.type}\n*User ID*: ${feedback.userId || 'anonymous'}`,
                    issuetype: { name: 'Task' },
                    priority: { name: feedback.urgent ? 'Highest' : 'High' }
                }
            })
        });
        if (!response.ok) {
            throw new Error(`Jira API error: ${response.status}`);
        }
        const data = await response.json();
        return `${process.env.JIRA_URL}/browse/${data.key}`;
    }
    async notifyDevelopmentTeam(feedback) {
        const notificationChannel = process.env.NOTIFICATION_CHANNEL || 'slack';
        try {
            switch (notificationChannel) {
                case 'slack':
                    await this.sendSlackNotification(feedback);
                    break;
                case 'email':
                    this.logger.info('Email notifications not yet implemented');
                    break;
                default:
                    this.logger.warn('Unknown notification channel', { notificationChannel });
            }
        }
        catch (error) {
            this.logger.error('Failed to send notification', { notificationChannel, error });
        }
    }
    async sendSlackNotification(feedback) {
        if (!process.env.SLACK_WEBHOOK_URL) {
            this.logger.warn('Slack webhook not configured, skipping notification');
            return;
        }
        const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `🚨 Urgent Feedback: ${feedback.category}`,
                blocks: [
                    {
                        type: 'header',
                        text: { type: 'plain_text', text: `${feedback.urgent ? '🚨' : '⚠️'} ${feedback.category}: Urgent Feedback` }
                    },
                    {
                        type: 'section',
                        text: { type: 'mrkdwn', text: `*Message*: ${feedback.message}` }
                    },
                    {
                        type: 'section',
                        fields: [
                            { type: 'mrkdwn', text: `*Type*: ${feedback.type}` },
                            { type: 'mrkdwn', text: `*User*: ${feedback.userId || 'anonymous'}` },
                            { type: 'mrkdwn', text: `*Timestamp*: ${feedback.timestamp.toISOString()}` }
                        ]
                    },
                    {
                        type: 'context',
                        elements: [{ type: 'mrkdwn', text: `Feedback ID: ${feedback.id}` }]
                    }
                ]
            })
        });
        if (!response.ok) {
            throw new Error(`Slack notification failed: ${response.status}`);
        }
    }
    async routeFeedback(feedback) {
        // Route feedback to appropriate handlers based on category
        switch (feedback.category) {
            case FeedbackCategory.BUG_REPORT:
                this.emit('bug_report', feedback);
                break;
            case FeedbackCategory.FEATURE_REQUEST:
                this.emit('feature_request', feedback);
                break;
            case FeedbackCategory.AGENT_PERFORMANCE:
                this.emit('agent_feedback', feedback);
                break;
            // Add more routing logic as needed
        }
    }
    calculateRecentTrends() {
        // Calculate trending feedback categories over last 7 days
        const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentFeedback = Array.from(this.feedbackStorage.values())
            .filter(f => f.timestamp > recentDate);
        const trends = new Map();
        recentFeedback.forEach(feedback => {
            trends.set(feedback.category, (trends.get(feedback.category) || 0) + 1);
        });
        return Array.from(trends.entries())
            .map(([category, count]) => ({ category, trend: count }))
            .sort((a, b) => b.trend - a.trend);
    }
    getTopIssues() {
        // Extract most common issues from feedback
        const issues = new Map();
        Array.from(this.feedbackStorage.values()).forEach(feedback => {
            if (feedback.type === FeedbackType.BUG || feedback.type === FeedbackType.COMPLAINT) {
                const key = feedback.message.toLowerCase();
                const existing = issues.get(key) || { count: 0, severity: 'medium' };
                issues.set(key, {
                    count: existing.count + 1,
                    severity: feedback.urgent ? 'high' : existing.severity
                });
            }
        });
        return Array.from(issues.entries())
            .map(([issue, data]) => ({ issue, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    generateImprovementSuggestions() {
        const suggestions = [];
        // Analyze feedback patterns and generate suggestions
        if (this.analyticsData.averageRating < 3.5) {
            suggestions.push('Focus on improving overall user experience');
        }
        if (this.analyticsData.urgentIssues > 0) {
            suggestions.push('Address urgent issues immediately');
        }
        // Add more intelligent suggestions based on feedback analysis
        return suggestions;
    }
    async loadExistingFeedback() {
        try {
            const files = await fs.readdir(this.feedbackDir);
            for (const file of files) {
                if (file.endsWith('.json') && file.startsWith('feedback_')) {
                    const filePath = path.join(this.feedbackDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const feedback = JSON.parse(content);
                    this.feedbackStorage.set(feedback.id, feedback);
                }
            }
        }
        catch (error) {
            // Directory might not exist yet, that's okay
        }
    }
    setupAutoSave() {
        // Save feedback data every 5 minutes
        setInterval(() => {
            this.saveFeedbackData();
        }, 5 * 60 * 1000);
    }
    async saveFeedbackData() {
        try {
            for (const [id, feedback] of this.feedbackStorage) {
                const filePath = path.join(this.feedbackDir, `${id}.json`);
                await fs.writeFile(filePath, JSON.stringify(feedback, null, 2));
            }
        }
        catch (error) {
            this.logger.error('Failed to save feedback data:', error);
        }
    }
    extractCriticalIssues(feedback) {
        return feedback
            .filter(f => f.urgent || f.rating <= 2)
            .map(f => f.message)
            .slice(0, 5);
    }
    prioritizeFeatureRequests(feedback) {
        const requests = new Map();
        feedback
            .filter(f => f.category === FeedbackCategory.FEATURE_REQUEST)
            .forEach(f => {
            requests.set(f.message, (requests.get(f.message) || 0) + 1);
        });
        return Array.from(requests.entries())
            .map(([feature, votes]) => ({ feature, votes }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 10);
    }
    identifyUXImprovements(feedback) {
        return feedback
            .filter(f => f.category === FeedbackCategory.USER_EXPERIENCE && f.rating <= 3)
            .map(f => f.message)
            .slice(0, 5);
    }
    identifyPerformanceIssues(feedback) {
        return feedback
            .filter(f => f.category === FeedbackCategory.PERFORMANCE)
            .map(f => f.message)
            .slice(0, 5);
    }
    identifyDocumentationNeeds(feedback) {
        return feedback
            .filter(f => f.category === FeedbackCategory.DOCUMENTATION)
            .map(f => f.message)
            .slice(0, 5);
    }
    convertToCSV(feedback) {
        const headers = ['id', 'timestamp', 'category', 'type', 'rating', 'message', 'agentId', 'urgent'];
        const rows = feedback.map(f => [
            f.id,
            f.timestamp.toISOString(),
            f.category,
            f.type,
            f.rating,
            `"${f.message.replace(/"/g, '""')}"`,
            f.context.agentId || '',
            f.urgent ? 'true' : 'false'
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
}
//# sourceMappingURL=feedback-collector.js.map