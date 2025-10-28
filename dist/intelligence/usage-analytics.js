/**
 * VERSATIL SDLC Framework - Usage Analytics & User Behavior Tracking
 *
 * Collects real-time usage data from Enhanced OPERA agents to enable
 * continuous learning and improvement based on actual user interactions.
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { adaptiveLearning } from './adaptive-learning.js';
export class UsageAnalytics extends EventEmitter {
    constructor() {
        super();
        this.events = new Map();
        this.patterns = new Map();
        this.isTracking = false;
        this.analysisInterval = null;
        this.logger = new VERSATILLogger();
    }
    /**
     * Start usage tracking
     */
    startTracking() {
        if (this.isTracking)
            return;
        this.isTracking = true;
        this.logger.info('Usage analytics tracking started', {}, 'usage-analytics');
        // Start periodic pattern analysis
        this.analysisInterval = setInterval(() => {
            this.analyzeUsagePatterns();
        }, 60 * 60 * 1000); // Every hour
    }
    /**
     * Stop usage tracking
     */
    stopTracking() {
        this.isTracking = false;
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        this.logger.info('Usage analytics tracking stopped', {}, 'usage-analytics');
    }
    /**
     * Track agent usage event
     */
    trackEvent(event) {
        if (!this.isTracking)
            return;
        if (!this.events.has(event.agentId)) {
            this.events.set(event.agentId, []);
        }
        this.events.get(event.agentId).push(event);
        this.logger.debug('Usage event tracked', {
            agentId: event.agentId,
            eventType: event.eventType,
            timestamp: event.timestamp
        }, 'usage-analytics');
        // Convert to learning system format
        this.convertToLearningInteraction(event);
        this.emit('usage_event', event);
    }
    /**
     * Track agent activation with context
     */
    trackAgentActivation(agentId, filePath, context) {
        const eventId = `${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const event = {
            id: eventId,
            timestamp: Date.now(),
            agentId,
            eventType: 'activated',
            context: this.buildEventContext(filePath, context),
            data: {}
        };
        this.trackEvent(event);
        return eventId;
    }
    /**
     * Track suggestion interaction
     */
    trackSuggestion(agentId, suggestionType, wasAccepted, userFeedback) {
        const event = {
            id: `${agentId}_suggestion_${Date.now()}`,
            timestamp: Date.now(),
            agentId,
            eventType: wasAccepted ? 'suggestion_accepted' : 'suggestion_dismissed',
            context: {},
            data: userFeedback ? { userFeedback } : {}
        };
        this.trackEvent(event);
    }
    /**
     * Track agent performance
     */
    trackPerformance(agentId, executionTime, issuesDetected, qualityScore) {
        const event = {
            id: `${agentId}_performance_${Date.now()}`,
            timestamp: Date.now(),
            agentId,
            eventType: 'activated',
            context: {},
            data: {
                executionTime,
                issuesDetected,
                qualityScore
            }
        };
        this.trackEvent(event);
    }
    /**
     * Track false positive reports
     */
    trackFalsePositive(agentId, issueType, filePath, userComments) {
        const event = {
            id: `${agentId}_false_positive_${Date.now()}`,
            timestamp: Date.now(),
            agentId,
            eventType: 'false_positive',
            context: this.buildSimpleContext(filePath),
            data: {
                userFeedback: userComments ? {
                    helpful: false,
                    accurate: false,
                    rating: 1,
                    comments: userComments
                } : {
                    helpful: false,
                    accurate: false,
                    rating: 1
                }
            }
        };
        this.trackEvent(event);
    }
    /**
     * Analyze usage patterns to discover insights
     */
    analyzeUsagePatterns() {
        this.logger.info('Analyzing usage patterns...', {}, 'usage-analytics');
        for (const [agentId, events] of this.events) {
            if (events.length < 10)
                continue; // Need minimum data for analysis
            const pattern = this.generateUsagePattern(agentId, events);
            this.patterns.set(pattern.id, pattern);
            // Generate insights for improvement
            this.generateImprovementInsights(pattern);
        }
    }
    /**
     * Generate usage pattern from events
     */
    generateUsagePattern(agentId, events) {
        const fileTypes = this.extractUniqueValues(events, 'context.fileExtension');
        const projectTypes = this.extractUniqueValues(events, 'context.projectType');
        const userTypes = this.extractUniqueValues(events, 'context.user.role');
        const successfulEvents = events.filter(e => e.eventType === 'suggestion_accepted' ||
            (e.data.userFeedback?.helpful === true));
        const avgExecutionTime = this.calculateAverage(events, 'data.executionTime');
        const avgSatisfaction = this.calculateAverage(events, 'data.userFeedback.rating');
        return {
            id: `${agentId}_pattern_${Date.now()}`,
            agentId,
            pattern: {
                fileTypes,
                projectTypes,
                userTypes,
                timePatterns: this.extractTimePatterns(events)
            },
            metrics: {
                frequency: events.length,
                successRate: successfulEvents.length / events.length,
                userSatisfaction: avgSatisfaction || 0,
                averageExecutionTime: avgExecutionTime || 0
            },
            insights: {
                mostEffectiveContext: this.findMostEffectiveContext(events),
                commonUserFeedback: this.extractCommonFeedback(events),
                improvementAreas: this.identifyImprovementAreas(events)
            }
        };
    }
    /**
     * Convert usage event to adaptive learning interaction
     */
    convertToLearningInteraction(event) {
        let actionType = 'activation';
        switch (event.eventType) {
            case 'suggestion_accepted':
                actionType = 'follow_suggestion';
                break;
            case 'suggestion_dismissed':
                actionType = 'ignore_suggestion';
                break;
            case 'false_positive':
                actionType = 'dismissal';
                break;
        }
        const interaction = {
            id: event.id,
            timestamp: event.timestamp,
            agentId: event.agentId,
            actionType,
            context: this.buildInteractionContext(event, actionType),
            outcome: (() => {
                const outcome = {
                    problemSolved: event.eventType === 'suggestion_accepted',
                    agentAccuracy: event.eventType === 'false_positive' ? 0 : 1
                };
                if (event.data.executionTime !== undefined) {
                    outcome.timeToResolution = event.data.executionTime;
                }
                if (event.data.userFeedback?.rating !== undefined) {
                    outcome.userSatisfaction = event.data.userFeedback.rating;
                }
                return outcome;
            })()
        };
        // Send to adaptive learning engine
        adaptiveLearning.recordInteraction(interaction);
    }
    /**
     * Get usage analytics dashboard data
     */
    getAnalyticsDashboard() {
        const totalEvents = Array.from(this.events.values())
            .reduce((sum, events) => sum + events.length, 0);
        const agentUsage = Array.from(this.events.entries()).map(([agentId, events]) => {
            const activations = events.filter(e => e.eventType === 'activated').length;
            const successful = events.filter(e => e.eventType === 'suggestion_accepted' ||
                e.data.userFeedback?.helpful === true).length;
            return {
                agentId,
                activations,
                successRate: activations > 0 ? successful / activations : 0
            };
        });
        const fileTypeUsage = new Map();
        const allRatings = [];
        for (const events of this.events.values()) {
            for (const event of events) {
                if (event.context.fileExtension) {
                    fileTypeUsage.set(event.context.fileExtension, (fileTypeUsage.get(event.context.fileExtension) || 0) + 1);
                }
                if (event.data.userFeedback?.rating) {
                    allRatings.push(event.data.userFeedback.rating);
                }
            }
        }
        const topFileTypes = Array.from(fileTypeUsage.entries())
            .map(([fileType, usage]) => ({ fileType, usage }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 10);
        const userSatisfaction = allRatings.length > 0
            ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
            : 0;
        return {
            totalEvents,
            agentUsage,
            topFileTypes,
            userSatisfaction,
            commonIssues: this.getCommonIssues(),
            improvementOpportunities: this.getImprovementOpportunities()
        };
    }
    // Helper methods
    extractFileExtension(filePath) {
        return filePath.split('.').pop()?.toLowerCase() || 'unknown';
    }
    detectProjectType(filePath, context) {
        if (!filePath)
            return 'unknown';
        if (filePath.includes('package.json'))
            return 'node';
        if (filePath.includes('.py'))
            return 'python';
        if (filePath.includes('.java'))
            return 'java';
        if (filePath.includes('.ts') || filePath.includes('.tsx'))
            return 'typescript';
        if (filePath.includes('.js') || filePath.includes('.jsx'))
            return 'javascript';
        return 'unknown';
    }
    analyzeCodebase(context) {
        // Would analyze codebase size, language, framework from context
        return {
            size: 'medium',
            language: 'typescript'
        };
    }
    extractUserInfo(context) {
        // Would extract user info from context or session
        return {
            role: 'mid',
            experience: 3
        };
    }
    extractUniqueValues(events, path) {
        const values = new Set();
        for (const event of events) {
            const value = this.getNestedValue(event, path);
            if (value && typeof value === 'string') {
                values.add(value);
            }
        }
        return Array.from(values);
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    calculateAverage(events, path) {
        const values = events
            .map(event => this.getNestedValue(event, path))
            .filter(value => typeof value === 'number');
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }
    extractTimePatterns(events) {
        // Analyze when users are most active
        return ['morning', 'afternoon'];
    }
    findMostEffectiveContext(events) {
        // Find context where agent is most successful
        return 'typescript_projects';
    }
    extractCommonFeedback(events) {
        return events
            .map(e => e.data.userFeedback?.comments)
            .filter(Boolean);
    }
    identifyImprovementAreas(events) {
        const falsePositives = events.filter(e => e.eventType === 'false_positive');
        const areas = [];
        if (falsePositives.length > events.length * 0.1) {
            areas.push('Reduce false positive rate');
        }
        const lowRatings = events.filter(e => e.data.userFeedback?.rating && e.data.userFeedback.rating < 3);
        if (lowRatings.length > events.length * 0.2) {
            areas.push('Improve suggestion quality');
        }
        return areas;
    }
    generateImprovementInsights(pattern) {
        this.logger.info('Usage pattern analyzed', {
            patternId: pattern.id,
            agentId: pattern.agentId,
            successRate: pattern.metrics.successRate,
            improvementAreas: pattern.insights.improvementAreas
        }, 'usage-analytics');
        this.emit('pattern_analyzed', pattern);
    }
    getCommonIssues() {
        // Extract common issues from all events
        return ['false_positives', 'slow_execution', 'irrelevant_suggestions'];
    }
    getImprovementOpportunities() {
        return ['Better context awareness', 'Personalized suggestions', 'Faster execution'];
    }
    buildEventContext(filePath, context) {
        const eventContext = {
            projectType: this.detectProjectType(filePath, context)
        };
        if (filePath) {
            eventContext.filePath = filePath;
            eventContext.fileExtension = this.extractFileExtension(filePath);
        }
        const codebase = this.analyzeCodebase(context);
        if (codebase) {
            eventContext.codebase = codebase;
        }
        const user = this.extractUserInfo(context);
        if (user) {
            eventContext.user = user;
        }
        return eventContext;
    }
    buildSimpleContext(filePath) {
        const context = {};
        if (filePath) {
            context.filePath = filePath;
            context.fileExtension = this.extractFileExtension(filePath);
        }
        return context;
    }
    buildInteractionContext(event, actionType) {
        const context = {};
        if (event.context.filePath) {
            context.filePath = event.context.filePath;
        }
        if (event.context.fileExtension) {
            context.fileType = event.context.fileExtension;
        }
        if (event.context.projectType) {
            context.projectType = event.context.projectType;
        }
        if (event.context.user?.role) {
            context.userRole = event.context.user.role;
        }
        if (event.eventType === 'false_positive') {
            context.issue = {
                type: 'unknown',
                severity: 'medium',
                wasAccurate: false,
                userVerified: true
            };
        }
        if (event.eventType.includes('suggestion')) {
            const suggestion = {
                id: event.id,
                type: 'general',
                wasFollowed: event.eventType === 'suggestion_accepted',
                wasHelpful: event.data.userFeedback?.helpful || false
            };
            if (event.data.userFeedback?.rating !== undefined) {
                suggestion.userRating = event.data.userFeedback.rating;
            }
            context.suggestion = suggestion;
        }
        return context;
    }
}
// Export singleton instance
export const usageAnalytics = new UsageAnalytics();
export default usageAnalytics;
//# sourceMappingURL=usage-analytics.js.map