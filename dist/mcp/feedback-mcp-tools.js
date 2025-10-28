/**
 * VERSATIL SDLC Framework - Feedback MCP Tools
 * MCP tool definitions for user feedback collection and analysis
 */
import { VERSATILFeedbackCollector, FeedbackCategory, FeedbackType } from '../feedback/feedback-collector.js';
export class FeedbackMCPHandler {
    constructor(projectPath) {
        this.feedbackCollector = new VERSATILFeedbackCollector(projectPath);
    }
    /**
     * Handle versatil_submit_feedback tool
     */
    async handleSubmitFeedback(params) {
        try {
            const feedbackId = await this.feedbackCollector.collectFeedback({
                sessionId: this.generateSessionId(),
                category: params.category || FeedbackCategory.USER_EXPERIENCE,
                type: this.determineFeedbackType(params.rating, params.message),
                rating: params.rating,
                message: params.message,
                context: await this.generateContext(params.agentId),
                metadata: {
                    source: 'mcp_tool',
                    timestamp: new Date().toISOString()
                },
                ...(params.urgent !== undefined ? { urgent: params.urgent } : {})
            });
            let responseMessage = `Thank you for your feedback! Your input helps improve VERSATIL.`;
            const nextSteps = [];
            // Provide contextual response based on rating and content
            if (params.rating <= 2) {
                responseMessage += ` We're sorry to hear about your poor experience. Your feedback has been flagged for immediate review.`;
                nextSteps.push('Development team will review this feedback within 24 hours');
                nextSteps.push('You may be contacted for additional details');
            }
            else if (params.rating >= 4) {
                responseMessage += ` We're glad you're having a positive experience!`;
                if (params.message.toLowerCase().includes('feature') || params.message.toLowerCase().includes('suggestion')) {
                    nextSteps.push('Your suggestion will be considered for the next release');
                }
            }
            if (params.urgent) {
                nextSteps.push('Urgent feedback has been escalated to the development team');
            }
            return {
                success: true,
                feedbackId,
                message: responseMessage,
                ...(nextSteps.length > 0 ? { nextSteps } : {})
            };
        }
        catch (error) {
            return {
                success: false,
                feedbackId: '',
                message: `Failed to submit feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Handle versatil_quick_feedback tool
     */
    async handleQuickFeedback(params) {
        try {
            const feedbackId = await this.feedbackCollector.quickFeedback(params.rating, params.message);
            return {
                success: true,
                feedbackId,
                message: `Quick feedback received (${params.rating}/5). Thank you for helping improve VERSATIL!`
            };
        }
        catch (error) {
            return {
                success: false,
                feedbackId: '',
                message: `Failed to submit quick feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Handle versatil_feedback_analytics tool
     */
    async handleFeedbackAnalytics(params) {
        try {
            const analytics = this.feedbackCollector.getFeedbackAnalytics();
            const insights = [];
            const recommendations = [];
            // Generate insights based on analytics
            if (analytics.averageRating < 3.0) {
                insights.push(`⚠️ Below average user satisfaction (${analytics.averageRating.toFixed(1)}/5.0)`);
                recommendations.push('Focus on critical issues affecting user experience');
            }
            else if (analytics.averageRating >= 4.0) {
                insights.push(`✅ High user satisfaction (${analytics.averageRating.toFixed(1)}/5.0)`);
                recommendations.push('Continue current development approach');
            }
            if (analytics.urgentIssues > 0) {
                insights.push(`🚨 ${analytics.urgentIssues} urgent issues requiring immediate attention`);
                recommendations.push('Address urgent issues before new feature development');
            }
            // Category-specific insights
            const topCategories = Array.from(analytics.categoryBreakdown.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);
            if (topCategories.length > 0) {
                insights.push(`📊 Top feedback categories: ${topCategories.map(([cat, count]) => `${cat} (${count})`).join(', ')}`);
            }
            return {
                success: true,
                analytics: {
                    totalFeedback: analytics.totalFeedback,
                    averageRating: analytics.averageRating,
                    categoryBreakdown: Object.fromEntries(analytics.categoryBreakdown),
                    urgentIssues: analytics.urgentIssues,
                    recentTrends: analytics.recentTrends,
                    topIssues: analytics.topIssues
                },
                insights,
                recommendations
            };
        }
        catch (error) {
            return {
                success: false,
                analytics: {},
                insights: [`Error retrieving analytics: ${error instanceof Error ? error.message : 'Unknown error'}`],
                recommendations: []
            };
        }
    }
    /**
     * Handle versatil_improvement_roadmap tool
     */
    async handleImprovementRoadmap(params) {
        try {
            const roadmap = this.feedbackCollector.generateImprovementRoadmap();
            const priorities = [];
            // Prioritize improvements based on feedback
            if (roadmap.criticalIssues.length > 0) {
                priorities.push(`🚨 CRITICAL: ${roadmap.criticalIssues.length} critical issues to address immediately`);
            }
            if (roadmap.featureRequests.length > 0) {
                const topRequest = roadmap.featureRequests[0];
                if (topRequest) {
                    priorities.push(`🎯 TOP REQUEST: "${topRequest.feature}" (${topRequest.votes} votes)`);
                }
            }
            if (roadmap.userExperienceImprovements.length > 0) {
                priorities.push(`✨ UX: ${roadmap.userExperienceImprovements.length} user experience improvements identified`);
            }
            // Generate timeline if requested
            const timelineData = params.includeTimeline ? {
                'Critical Issues': 'Next 1-2 weeks',
                'Top Feature Requests': 'Next 1-2 months',
                'UX Improvements': 'Next 2-3 months',
                'Performance Optimizations': 'Next 3-6 months',
                'Documentation Updates': 'Ongoing'
            } : undefined;
            return {
                success: true,
                roadmap,
                priorities,
                ...(timelineData ? { estimatedTimeline: timelineData } : {})
            };
        }
        catch (error) {
            return {
                success: false,
                roadmap: {},
                priorities: [`Error generating roadmap: ${error instanceof Error ? error.message : 'Unknown error'}`],
            };
        }
    }
    // Helper methods
    generateSessionId() {
        return `mcp_session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    determineFeedbackType(rating, message) {
        const messageLower = message.toLowerCase();
        if (messageLower.includes('bug') || messageLower.includes('error')) {
            return FeedbackType.BUG;
        }
        if (messageLower.includes('feature') || messageLower.includes('add') || messageLower.includes('wish')) {
            return FeedbackType.FEATURE;
        }
        if (messageLower.includes('?') || messageLower.includes('how') || messageLower.includes('help')) {
            return FeedbackType.QUESTION;
        }
        if (rating >= 4) {
            return FeedbackType.PRAISE;
        }
        if (rating <= 2) {
            return FeedbackType.COMPLAINT;
        }
        return FeedbackType.SUGGESTION;
    }
    async generateContext(agentId) {
        return {
            agentId,
            projectPath: process.cwd(),
            frameworkVersion: '1.0.0',
            ideType: process.env['VERSATIL_IDE_TYPE'] || 'unknown',
            systemInfo: {
                platform: process.platform,
                nodeVersion: process.version,
                timestamp: new Date()
            }
        };
    }
}
//# sourceMappingURL=feedback-mcp-tools.js.map