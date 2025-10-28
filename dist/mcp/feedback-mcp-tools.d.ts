/**
 * VERSATIL SDLC Framework - Feedback MCP Tools
 * MCP tool definitions for user feedback collection and analysis
 */
export interface FeedbackMCPTools {
    versatil_submit_feedback: {
        name: 'versatil_submit_feedback';
        description: 'Submit user feedback about VERSATIL framework experience';
        inputSchema: {
            type: 'object';
            properties: {
                rating: {
                    type: 'number';
                    minimum: 1;
                    maximum: 5;
                    description: 'Rating from 1 (very poor) to 5 (excellent)';
                };
                message: {
                    type: 'string';
                    description: 'Detailed feedback message';
                };
                category: {
                    type: 'string';
                    enum: [
                        'agent_performance',
                        'user_experience',
                        'feature_request',
                        'bug_report',
                        'documentation',
                        'integration',
                        'performance',
                        'security'
                    ];
                    description: 'Feedback category';
                };
                agentId?: {
                    type: 'string';
                    description: 'Specific agent the feedback relates to (optional)';
                };
                urgent?: {
                    type: 'boolean';
                    description: 'Mark as urgent if requiring immediate attention';
                };
            };
            required: ['rating', 'message'];
        };
    };
    versatil_quick_feedback: {
        name: 'versatil_quick_feedback';
        description: 'Submit quick feedback with minimal information';
        inputSchema: {
            type: 'object';
            properties: {
                rating: {
                    type: 'number';
                    minimum: 1;
                    maximum: 5;
                    description: 'Quick rating from 1-5';
                };
                message: {
                    type: 'string';
                    description: 'Brief feedback message';
                };
            };
            required: ['rating', 'message'];
        };
    };
    versatil_feedback_analytics: {
        name: 'versatil_feedback_analytics';
        description: 'Get comprehensive feedback analytics and insights';
        inputSchema: {
            type: 'object';
            properties: {
                timeframe?: {
                    type: 'string';
                    enum: ['week', 'month', 'quarter', 'all'];
                    description: 'Analytics timeframe (default: all)';
                };
                category?: {
                    type: 'string';
                    enum: [
                        'agent_performance',
                        'user_experience',
                        'feature_request',
                        'bug_report',
                        'documentation',
                        'integration',
                        'performance',
                        'security'
                    ];
                    description: 'Filter by specific category (optional)';
                };
            };
        };
    };
    versatil_improvement_roadmap: {
        name: 'versatil_improvement_roadmap';
        description: 'Generate improvement roadmap based on user feedback';
        inputSchema: {
            type: 'object';
            properties: {
                priority?: {
                    type: 'string';
                    enum: ['critical', 'high', 'medium', 'low', 'all'];
                    description: 'Priority level filter (default: all)';
                };
                includeTimeline?: {
                    type: 'boolean';
                    description: 'Include estimated timeline for improvements';
                };
            };
        };
    };
}
export declare class FeedbackMCPHandler {
    private feedbackCollector;
    constructor(projectPath: string);
    /**
     * Handle versatil_submit_feedback tool
     */
    handleSubmitFeedback(params: {
        rating: number;
        message: string;
        category?: string;
        agentId?: string;
        urgent?: boolean;
    }): Promise<{
        success: boolean;
        feedbackId: string;
        message: string;
        nextSteps?: string[];
    }>;
    /**
     * Handle versatil_quick_feedback tool
     */
    handleQuickFeedback(params: {
        rating: number;
        message: string;
    }): Promise<{
        success: boolean;
        feedbackId: string;
        message: string;
    }>;
    /**
     * Handle versatil_feedback_analytics tool
     */
    handleFeedbackAnalytics(params: {
        timeframe?: string;
        category?: string;
    }): Promise<{
        success: boolean;
        analytics: any;
        insights: string[];
        recommendations: string[];
    }>;
    /**
     * Handle versatil_improvement_roadmap tool
     */
    handleImprovementRoadmap(params: {
        priority?: string;
        includeTimeline?: boolean;
    }): Promise<{
        success: boolean;
        roadmap: any;
        priorities: string[];
        estimatedTimeline?: Record<string, string>;
    }>;
    private generateSessionId;
    private determineFeedbackType;
    private generateContext;
}
