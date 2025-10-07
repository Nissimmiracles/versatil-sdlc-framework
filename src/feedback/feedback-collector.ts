/**
 * VERSATIL SDLC Framework - User Feedback Collection System
 * Collects, analyzes, and routes user feedback for continuous improvement
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';

export interface UserFeedback {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  category: FeedbackCategory;
  type: FeedbackType;
  rating: number; // 1-5 scale
  message: string;
  context: FeedbackContext;
  metadata: Record<string, any>;
  urgent?: boolean;
  tags?: string[];
  resolution?: FeedbackResolution;
}

export enum FeedbackCategory {
  AGENT_PERFORMANCE = 'agent_performance',
  USER_EXPERIENCE = 'user_experience',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  DOCUMENTATION = 'documentation',
  INTEGRATION = 'integration',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

export enum FeedbackType {
  PRAISE = 'praise',
  COMPLAINT = 'complaint',
  SUGGESTION = 'suggestion',
  QUESTION = 'question',
  BUG = 'bug',
  FEATURE = 'feature'
}

export interface FeedbackContext {
  agentId?: string;
  projectPath: string;
  projectType?: string;
  ideType?: 'cursor' | 'vscode' | 'claude_desktop';
  frameworkVersion: string;
  operation?: string;
  errorStack?: string;
  userAction?: string;
  systemInfo: {
    platform: string;
    nodeVersion: string;
    timestamp: Date;
  };
}

export interface FeedbackResolution {
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class VERSATILFeedbackCollector extends EventEmitter {
  private logger: VERSATILLogger;
  private feedbackStorage: Map<string, UserFeedback> = new Map();
  private feedbackDir: string;
  private analyticsData: FeedbackAnalytics = {
    totalFeedback: 0,
    categoryBreakdown: new Map(),
    averageRating: 0,
    urgentIssues: 0,
    trendingTags: new Map()
  };

  constructor(projectPath: string) {
    super();
    this.logger = new VERSATILLogger();
    this.feedbackDir = path.join(projectPath, '.versatil', 'feedback');
    this.initializeFeedbackSystem();
  }

  /**
   * Initialize feedback collection system
   */
  private async initializeFeedbackSystem(): Promise<void> {
    try {
      await fs.mkdir(this.feedbackDir, { recursive: true });
      await this.loadExistingFeedback();
      this.setupAutoSave();
      this.logger.info('Feedback collection system initialized');
    } catch (error) {
      this.logger.error('Failed to initialize feedback system:', error as any);
    }
  }

  /**
   * Collect user feedback
   */
  async collectFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<string> {
    const feedbackId = this.generateFeedbackId();
    const completeFeedback: UserFeedback = {
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
  async quickFeedback(rating: number, message: string, category?: FeedbackCategory): Promise<string> {
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
  async contextualFeedback(
    rating: number,
    message: string,
    agentId?: string,
    operation?: string
  ): Promise<string> {
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
  getFeedbackAnalytics(): FeedbackAnalytics {
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
  getFeedbackByCategory(category: FeedbackCategory): UserFeedback[] {
    return Array.from(this.feedbackStorage.values())
      .filter(feedback => feedback.category === category)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get urgent feedback requiring immediate attention
   */
  getUrgentFeedback(): UserFeedback[] {
    return Array.from(this.feedbackStorage.values())
      .filter(feedback => feedback.urgent &&
        (!feedback.resolution || feedback.resolution.status === 'open'))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate improvement roadmap based on feedback
   */
  generateImprovementRoadmap(): ImprovementRoadmap {
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
  async exportFeedback(format: 'json' | 'csv' = 'json'): Promise<string> {
    const feedback = Array.from(this.feedbackStorage.values());
    const exportPath = path.join(this.feedbackDir, `feedback_export_${Date.now()}.${format}`);

    if (format === 'json') {
      await fs.writeFile(exportPath, JSON.stringify(feedback, null, 2));
    } else {
      const csvData = this.convertToCSV(feedback);
      await fs.writeFile(exportPath, csvData);
    }

    return exportPath;
  }

  // Private helper methods
  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private async generateContext(): Promise<FeedbackContext> {
    // Read version from package.json
    let frameworkVersion = '5.0.0'; // Fallback
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const pkgPath = join(process.cwd(), 'package.json');
      const pkgData = JSON.parse(await readFile(pkgPath, 'utf-8'));
      frameworkVersion = pkgData.version;
    } catch (error) {
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

  private detectCategory(message: string, agentId?: string): FeedbackCategory {
    const messageLower = message.toLowerCase();

    if (agentId) return FeedbackCategory.AGENT_PERFORMANCE;
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

  private detectType(message: string, rating: number): FeedbackType {
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

  private calculateConfidence(message: string): number {
    // Simple confidence calculation based on message clarity
    const words = message.split(' ').length;
    const hasSpecifics = /\b(version|agent|error|file|line)\b/i.test(message);

    let confidence = Math.min(words / 10, 1);
    if (hasSpecifics) confidence += 0.2;

    return Math.min(confidence, 1);
  }

  private updateAnalytics(feedback: UserFeedback): void {
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

  private async handleUrgentFeedback(feedback: UserFeedback): Promise<void> {
    this.logger.warn(`URGENT FEEDBACK: ${feedback.message}`);

    // Emit urgent event
    this.emit('urgent_feedback', feedback);

    // Auto-create resolution entry
    feedback.resolution = {
      status: 'open',
      priority: 'critical',
    };

    // TODO: Integration with issue tracking system
    // TODO: Automated notifications to development team
  }

  private async routeFeedback(feedback: UserFeedback): Promise<void> {
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

  private calculateRecentTrends(): Array<{category: string, trend: number}> {
    // Calculate trending feedback categories over last 7 days
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentFeedback = Array.from(this.feedbackStorage.values())
      .filter(f => f.timestamp > recentDate);

    const trends = new Map<string, number>();
    recentFeedback.forEach(feedback => {
      trends.set(feedback.category, (trends.get(feedback.category) || 0) + 1);
    });

    return Array.from(trends.entries())
      .map(([category, count]) => ({ category, trend: count }))
      .sort((a, b) => b.trend - a.trend);
  }

  private getTopIssues(): Array<{issue: string, count: number, severity: string}> {
    // Extract most common issues from feedback
    const issues = new Map<string, {count: number, severity: string}>();

    Array.from(this.feedbackStorage.values()).forEach(feedback => {
      if (feedback.type === FeedbackType.BUG || feedback.type === FeedbackType.COMPLAINT) {
        const key = feedback.message.toLowerCase();
        const existing = issues.get(key) || {count: 0, severity: 'medium'};
        issues.set(key, {
          count: existing.count + 1,
          severity: feedback.urgent ? 'high' : existing.severity
        });
      }
    });

    return Array.from(issues.entries())
      .map(([issue, data]) => ({issue, ...data}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateImprovementSuggestions(): string[] {
    const suggestions: string[] = [];

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

  private async loadExistingFeedback(): Promise<void> {
    try {
      const files = await fs.readdir(this.feedbackDir);
      for (const file of files) {
        if (file.endsWith('.json') && file.startsWith('feedback_')) {
          const filePath = path.join(this.feedbackDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const feedback: UserFeedback = JSON.parse(content);
          this.feedbackStorage.set(feedback.id, feedback);
        }
      }
    } catch (error) {
      // Directory might not exist yet, that's okay
    }
  }

  private setupAutoSave(): void {
    // Save feedback data every 5 minutes
    setInterval(() => {
      this.saveFeedbackData();
    }, 5 * 60 * 1000);
  }

  private async saveFeedbackData(): Promise<void> {
    try {
      for (const [id, feedback] of this.feedbackStorage) {
        const filePath = path.join(this.feedbackDir, `${id}.json`);
        await fs.writeFile(filePath, JSON.stringify(feedback, null, 2));
      }
    } catch (error) {
      this.logger.error('Failed to save feedback data:', error as any);
    }
  }

  private extractCriticalIssues(feedback: UserFeedback[]): string[] {
    return feedback
      .filter(f => f.urgent || f.rating <= 2)
      .map(f => f.message)
      .slice(0, 5);
  }

  private prioritizeFeatureRequests(feedback: UserFeedback[]): Array<{feature: string, votes: number}> {
    const requests = new Map<string, number>();

    feedback
      .filter(f => f.category === FeedbackCategory.FEATURE_REQUEST)
      .forEach(f => {
        requests.set(f.message, (requests.get(f.message) || 0) + 1);
      });

    return Array.from(requests.entries())
      .map(([feature, votes]) => ({feature, votes}))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);
  }

  private identifyUXImprovements(feedback: UserFeedback[]): string[] {
    return feedback
      .filter(f => f.category === FeedbackCategory.USER_EXPERIENCE && f.rating <= 3)
      .map(f => f.message)
      .slice(0, 5);
  }

  private identifyPerformanceIssues(feedback: UserFeedback[]): string[] {
    return feedback
      .filter(f => f.category === FeedbackCategory.PERFORMANCE)
      .map(f => f.message)
      .slice(0, 5);
  }

  private identifyDocumentationNeeds(feedback: UserFeedback[]): string[] {
    return feedback
      .filter(f => f.category === FeedbackCategory.DOCUMENTATION)
      .map(f => f.message)
      .slice(0, 5);
  }

  private convertToCSV(feedback: UserFeedback[]): string {
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

// Supporting interfaces
interface FeedbackAnalytics {
  totalFeedback: number;
  categoryBreakdown: Map<string, number>;
  averageRating: number;
  urgentIssues: number;
  trendingTags: Map<string, number>;
  recentTrends?: Array<{category: string, trend: number}>;
  topIssues?: Array<{issue: string, count: number, severity: string}>;
  improvementSuggestions?: string[];
}

interface ImprovementRoadmap {
  criticalIssues: string[];
  featureRequests: Array<{feature: string, votes: number}>;
  userExperienceImprovements: string[];
  performanceOptimizations: string[];
  documentationGaps: string[];
}

export type { FeedbackAnalytics, ImprovementRoadmap };