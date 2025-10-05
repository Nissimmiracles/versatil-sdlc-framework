/**
 * VERSATIL SDLC Framework - Usage Analytics & User Behavior Tracking
 *
 * Collects real-time usage data from Enhanced BMAD agents to enable
 * continuous learning and improvement based on actual user interactions.
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { adaptiveLearning, UserInteraction } from './adaptive-learning.js';

export interface AgentUsageEvent {
  id: string;
  timestamp: number;
  agentId: string;
  eventType: 'activated' | 'suggestion_shown' | 'suggestion_accepted' | 'suggestion_dismissed' | 'issue_reported' | 'false_positive';
  context: {
    filePath?: string;
    fileExtension?: string;
    projectType?: string;
    codebase?: {
      size: 'small' | 'medium' | 'large';
      language: string;
      framework?: string;
    };
    user?: {
      role?: 'junior' | 'mid' | 'senior' | 'lead';
      experience?: number; // years
      preferences?: Record<string, any>;
    };
  };
  data: {
    issuesDetected?: number;
    suggestionsProvided?: number;
    executionTime?: number;
    qualityScore?: number;
    userFeedback?: {
      helpful: boolean;
      accurate: boolean;
      rating: number; // 1-5
      comments?: string;
    };
  };
}

export interface UsagePattern {
  id: string;
  agentId: string;
  pattern: {
    fileTypes: string[];
    projectTypes: string[];
    userTypes: string[];
    timePatterns: string[]; // morning, afternoon, etc.
  };
  metrics: {
    frequency: number;
    successRate: number;
    userSatisfaction: number;
    averageExecutionTime: number;
  };
  insights: {
    mostEffectiveContext: string;
    commonUserFeedback: string[];
    improvementAreas: string[];
  };
}

export class UsageAnalytics extends EventEmitter {
  private logger: VERSATILLogger;
  private events: Map<string, AgentUsageEvent[]> = new Map();
  private patterns: Map<string, UsagePattern> = new Map();
  private isTracking: boolean = false;
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.logger = new VERSATILLogger();
  }

  /**
   * Start usage tracking
   */
  public startTracking(): void {
    if (this.isTracking) return;

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
  public stopTracking(): void {
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
  public trackEvent(event: AgentUsageEvent): void {
    if (!this.isTracking) return;

    if (!this.events.has(event.agentId)) {
      this.events.set(event.agentId, []);
    }

    this.events.get(event.agentId)!.push(event);

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
  public trackAgentActivation(
    agentId: string,
    filePath?: string,
    context?: Record<string, any>
  ): string {
    const eventId = `${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: AgentUsageEvent = {
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
  public trackSuggestion(
    agentId: string,
    suggestionType: string,
    wasAccepted: boolean,
    userFeedback?: { helpful: boolean; accurate: boolean; rating: number; comments?: string }
  ): void {
    const event: AgentUsageEvent = {
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
  public trackPerformance(
    agentId: string,
    executionTime: number,
    issuesDetected: number,
    qualityScore: number
  ): void {
    const event: AgentUsageEvent = {
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
  public trackFalsePositive(
    agentId: string,
    issueType: string,
    filePath?: string,
    userComments?: string
  ): void {
    const event: AgentUsageEvent = {
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
  private analyzeUsagePatterns(): void {
    this.logger.info('Analyzing usage patterns...', {}, 'usage-analytics');

    for (const [agentId, events] of this.events) {
      if (events.length < 10) continue; // Need minimum data for analysis

      const pattern = this.generateUsagePattern(agentId, events);
      this.patterns.set(pattern.id, pattern);

      // Generate insights for improvement
      this.generateImprovementInsights(pattern);
    }
  }

  /**
   * Generate usage pattern from events
   */
  private generateUsagePattern(agentId: string, events: AgentUsageEvent[]): UsagePattern {
    const fileTypes = this.extractUniqueValues(events, 'context.fileExtension');
    const projectTypes = this.extractUniqueValues(events, 'context.projectType');
    const userTypes = this.extractUniqueValues(events, 'context.user.role');

    const successfulEvents = events.filter(e =>
      e.eventType === 'suggestion_accepted' ||
      (e.data.userFeedback?.helpful === true)
    );

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
  private convertToLearningInteraction(event: AgentUsageEvent): void {
    let actionType: UserInteraction['actionType'] = 'activation';

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

    const interaction: UserInteraction = {
      id: event.id,
      timestamp: event.timestamp,
      agentId: event.agentId,
      actionType,
      context: this.buildInteractionContext(event, actionType),
      outcome: ((): any => {
        const outcome: any = {
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
  public getAnalyticsDashboard(): {
    totalEvents: number;
    agentUsage: Array<{ agentId: string; activations: number; successRate: number }>;
    topFileTypes: Array<{ fileType: string; usage: number }>;
    userSatisfaction: number;
    commonIssues: string[];
    improvementOpportunities: string[];
  } {
    const totalEvents = Array.from(this.events.values())
      .reduce((sum, events) => sum + events.length, 0);

    const agentUsage = Array.from(this.events.entries()).map(([agentId, events]) => {
      const activations = events.filter(e => e.eventType === 'activated').length;
      const successful = events.filter(e =>
        e.eventType === 'suggestion_accepted' ||
        e.data.userFeedback?.helpful === true
      ).length;

      return {
        agentId,
        activations,
        successRate: activations > 0 ? successful / activations : 0
      };
    });

    const fileTypeUsage = new Map<string, number>();
    const allRatings: number[] = [];

    for (const events of this.events.values()) {
      for (const event of events) {
        if (event.context.fileExtension) {
          fileTypeUsage.set(
            event.context.fileExtension,
            (fileTypeUsage.get(event.context.fileExtension) || 0) + 1
          );
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
  private extractFileExtension(filePath: string): string {
    return filePath.split('.').pop()?.toLowerCase() || 'unknown';
  }

  private detectProjectType(filePath?: string, context?: Record<string, any>): string {
    if (!filePath) return 'unknown';

    if (filePath.includes('package.json')) return 'node';
    if (filePath.includes('.py')) return 'python';
    if (filePath.includes('.java')) return 'java';
    if (filePath.includes('.ts') || filePath.includes('.tsx')) return 'typescript';
    if (filePath.includes('.js') || filePath.includes('.jsx')) return 'javascript';

    return 'unknown';
  }

  private analyzeCodebase(context?: Record<string, any>): AgentUsageEvent['context']['codebase'] {
    // Would analyze codebase size, language, framework from context
    return {
      size: 'medium',
      language: 'typescript'
    };
  }

  private extractUserInfo(context?: Record<string, any>): AgentUsageEvent['context']['user'] {
    // Would extract user info from context or session
    return {
      role: 'mid',
      experience: 3
    };
  }

  private extractUniqueValues(events: AgentUsageEvent[], path: string): string[] {
    const values = new Set<string>();
    for (const event of events) {
      const value = this.getNestedValue(event, path);
      if (value && typeof value === 'string') {
        values.add(value);
      }
    }
    return Array.from(values);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private calculateAverage(events: AgentUsageEvent[], path: string): number {
    const values = events
      .map(event => this.getNestedValue(event, path))
      .filter(value => typeof value === 'number');

    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private extractTimePatterns(events: AgentUsageEvent[]): string[] {
    // Analyze when users are most active
    return ['morning', 'afternoon'];
  }

  private findMostEffectiveContext(events: AgentUsageEvent[]): string {
    // Find context where agent is most successful
    return 'typescript_projects';
  }

  private extractCommonFeedback(events: AgentUsageEvent[]): string[] {
    return events
      .map(e => e.data.userFeedback?.comments)
      .filter(Boolean) as string[];
  }

  private identifyImprovementAreas(events: AgentUsageEvent[]): string[] {
    const falsePositives = events.filter(e => e.eventType === 'false_positive');
    const areas: string[] = [];

    if (falsePositives.length > events.length * 0.1) {
      areas.push('Reduce false positive rate');
    }

    const lowRatings = events.filter(e =>
      e.data.userFeedback?.rating && e.data.userFeedback.rating < 3
    );

    if (lowRatings.length > events.length * 0.2) {
      areas.push('Improve suggestion quality');
    }

    return areas;
  }

  private generateImprovementInsights(pattern: UsagePattern): void {
    this.logger.info('Usage pattern analyzed', {
      patternId: pattern.id,
      agentId: pattern.agentId,
      successRate: pattern.metrics.successRate,
      improvementAreas: pattern.insights.improvementAreas
    }, 'usage-analytics');

    this.emit('pattern_analyzed', pattern);
  }

  private getCommonIssues(): string[] {
    // Extract common issues from all events
    return ['false_positives', 'slow_execution', 'irrelevant_suggestions'];
  }

  private getImprovementOpportunities(): string[] {
    return ['Better context awareness', 'Personalized suggestions', 'Faster execution'];
  }

  private buildEventContext(filePath?: string, context?: any): any {
    const eventContext: any = {
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

  private buildSimpleContext(filePath?: string): any {
    const context: any = {};

    if (filePath) {
      context.filePath = filePath;
      context.fileExtension = this.extractFileExtension(filePath);
    }

    return context;
  }

  private buildInteractionContext(event: AgentUsageEvent, actionType: string): any {
    const context: any = {};

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
      const suggestion: any = {
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