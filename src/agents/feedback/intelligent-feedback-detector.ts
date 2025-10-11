/**
 * VERSATIL v6.1 - Intelligent Feedback Detector
 *
 * Automatically detects negative user experiences WITHOUT requiring slash commands.
 * Uses passive monitoring, pattern detection, and sentiment analysis.
 *
 * Detection Methods:
 * 1. Passive Monitoring - Detect frustration patterns automatically
 * 2. Active Prompts - Ask for feedback at key moments
 * 3. Sentiment Analysis - Analyze user messages for negative sentiment
 * 4. Behavioral Signals - Track rejection patterns (immediate edits, retries, etc.)
 */

import { EventEmitter } from 'events';
import { getGitPRFeedbackAgent } from './git-pr-feedback-agent.js';
import type { UserFeedback } from './git-pr-feedback-agent.js';

export interface FrustrationPattern {
  userId?: string;
  agentId: string;
  taskType: string;
  retryCount: number;
  consecutiveFailures: number;
  avgExecutionTime: number;
  lastErrorTimestamp: number;
  rejectionSignals: number; // Immediate edits after agent response
}

export interface DetectorConfig {
  enabled: boolean;
  retryThreshold: number; // Trigger feedback after N retries (default: 3)
  executionTimeThreshold: number; // Trigger feedback after N ms (default: 30000)
  errorSpikeThreshold: number; // Consecutive errors to trigger (default: 3)
  rejectionSignalThreshold: number; // Immediate edits to trigger (default: 2)
  activeFeedbackPrompts: boolean; // Show feedback prompts to user
}

export class IntelligentFeedbackDetector extends EventEmitter {
  private config: DetectorConfig;
  private frustrationPatterns: Map<string, FrustrationPattern> = new Map();
  private recentInteractions: Array<{
    agentId: string;
    timestamp: number;
    success: boolean;
    duration: number;
  }> = [];

  constructor(config?: Partial<DetectorConfig>) {
    super();
    this.config = {
      enabled: true,
      retryThreshold: 3,
      executionTimeThreshold: 30000,
      errorSpikeThreshold: 3,
      rejectionSignalThreshold: 2,
      activeFeedbackPrompts: true,
      ...config
    };
  }

  /**
   * Monitor agent activation for frustration patterns
   */
  async monitorAgentActivation(event: {
    agentId: string;
    taskType: string;
    success: boolean;
    duration: number;
    errorMessage?: string;
    userId?: string;
  }): Promise<void> {
    if (!this.config.enabled) return;

    const key = `${event.userId || 'default'}-${event.agentId}-${event.taskType}`;

    // Get or create pattern
    let pattern = this.frustrationPatterns.get(key);
    if (!pattern) {
      pattern = {
        userId: event.userId,
        agentId: event.agentId,
        taskType: event.taskType,
        retryCount: 0,
        consecutiveFailures: 0,
        avgExecutionTime: 0,
        lastErrorTimestamp: 0,
        rejectionSignals: 0
      };
      this.frustrationPatterns.set(key, pattern);
    }

    // Update pattern
    if (!event.success) {
      pattern.consecutiveFailures++;
      pattern.retryCount++;
      pattern.lastErrorTimestamp = Date.now();
    } else {
      pattern.consecutiveFailures = 0; // Reset on success
    }

    // Update average execution time
    pattern.avgExecutionTime =
      (pattern.avgExecutionTime * pattern.retryCount + event.duration) / (pattern.retryCount + 1);

    // Track recent interactions
    this.recentInteractions.push({
      agentId: event.agentId,
      timestamp: Date.now(),
      success: event.success,
      duration: event.duration
    });

    // Keep only last 50 interactions
    if (this.recentInteractions.length > 50) {
      this.recentInteractions.shift();
    }

    // Check for frustration triggers
    await this.checkFrustrationTriggers(pattern, event);
  }

  /**
   * Monitor user edits after agent response (rejection signal)
   */
  async monitorUserEdit(event: {
    filePath: string;
    agentId?: string;
    timeSinceAgentResponse: number; // ms since last agent activation
    userId?: string;
  }): Promise<void> {
    if (!this.config.enabled) return;

    // If user edits immediately after agent response (<5s), it's a rejection signal
    if (event.timeSinceAgentResponse < 5000 && event.agentId) {
      const key = `${event.userId || 'default'}-${event.agentId}-edit`;
      const pattern = this.frustrationPatterns.get(key);

      if (pattern) {
        pattern.rejectionSignals++;

        if (pattern.rejectionSignals >= this.config.rejectionSignalThreshold) {
          await this.triggerFeedbackCollection({
            reason: 'rejection_signal',
            pattern,
            message: `User repeatedly edited immediately after ${event.agentId} response`
          });
        }
      }
    }
  }

  /**
   * Check for frustration triggers and collect feedback
   */
  private async checkFrustrationTriggers(
    pattern: FrustrationPattern,
    event: { errorMessage?: string; duration: number }
  ): Promise<void> {
    // Trigger 1: Multiple retries
    if (pattern.retryCount >= this.config.retryThreshold) {
      await this.triggerFeedbackCollection({
        reason: 'retry_threshold',
        pattern,
        message: `Task retried ${pattern.retryCount} times`
      });
    }

    // Trigger 2: Long execution time
    if (event.duration >= this.config.executionTimeThreshold) {
      await this.triggerFeedbackCollection({
        reason: 'slow_execution',
        pattern,
        message: `Task took ${(event.duration / 1000).toFixed(1)}s (threshold: ${this.config.executionTimeThreshold / 1000}s)`
      });
    }

    // Trigger 3: Consecutive errors
    if (pattern.consecutiveFailures >= this.config.errorSpikeThreshold) {
      await this.triggerFeedbackCollection({
        reason: 'error_spike',
        pattern,
        message: `${pattern.consecutiveFailures} consecutive failures`,
        errorMessage: event.errorMessage
      });
    }

    // Trigger 4: Error spike across all agents
    const recentErrors = this.recentInteractions
      .filter(i => i.timestamp > Date.now() - 60000) // Last minute
      .filter(i => !i.success);

    if (recentErrors.length >= 5) {
      await this.triggerFeedbackCollection({
        reason: 'system_error_spike',
        pattern,
        message: `${recentErrors.length} errors in last minute`
      });
    }
  }

  /**
   * Trigger feedback collection
   */
  private async triggerFeedbackCollection(trigger: {
    reason: string;
    pattern: FrustrationPattern;
    message: string;
    errorMessage?: string;
  }): Promise<void> {
    console.log(`[IntelligentFeedbackDetector] 🚨 Frustration detected: ${trigger.reason}`);
    console.log(`   ${trigger.message}`);

    try {
      const feedbackAgent = getGitPRFeedbackAgent();

      // Determine category
      let category: UserFeedback['category'] = 'other';
      if (trigger.reason === 'error_spike' || trigger.errorMessage) {
        category = 'bug';
      } else if (trigger.reason === 'slow_execution') {
        category = 'performance';
      } else if (trigger.reason === 'rejection_signal') {
        category = 'ux';
      }

      await feedbackAgent.collectFeedback({
        agentId: trigger.pattern.agentId,
        taskDescription: `${trigger.pattern.taskType} (auto-detected frustration)`,
        userMessage: trigger.message,
        category,
        context: {
          errorMessage: trigger.errorMessage,
          duration: trigger.pattern.avgExecutionTime,
          retryCount: trigger.pattern.retryCount,
          success: false
        },
        keywords: [trigger.reason, trigger.pattern.taskType],
        suggestedFix: this.generateSuggestedFix(trigger)
      });

      this.emit('feedback-auto-collected', {
        reason: trigger.reason,
        agentId: trigger.pattern.agentId,
        pattern: trigger.pattern
      });

      // Show active feedback prompt if enabled
      if (this.config.activeFeedbackPrompts) {
        await this.showFeedbackPrompt(trigger);
      }

    } catch (error) {
      console.error('[IntelligentFeedbackDetector] Failed to collect feedback:', error);
    }
  }

  /**
   * Show active feedback prompt to user
   */
  private async showFeedbackPrompt(trigger: {
    reason: string;
    pattern: FrustrationPattern;
    message: string;
  }): Promise<void> {
    // This would integrate with UI to show a feedback dialog
    // For now, log to console
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  🤔 We noticed something went wrong                    ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`\n${trigger.message}`);
    console.log(`\nAgent: ${trigger.pattern.agentId}`);
    console.log(`Task: ${trigger.pattern.taskType}`);
    console.log('\n💡 Your feedback helps improve the framework!');
    console.log('   Feedback automatically collected for review.\n');

    this.emit('feedback-prompt-shown', trigger);
  }

  /**
   * Generate suggested fix based on trigger
   */
  private generateSuggestedFix(trigger: {
    reason: string;
    pattern: FrustrationPattern;
  }): string {
    switch (trigger.reason) {
      case 'retry_threshold':
        return `Improve ${trigger.pattern.agentId} reliability to reduce retry attempts`;
      case 'slow_execution':
        return `Optimize ${trigger.pattern.agentId} performance for ${trigger.pattern.taskType} tasks`;
      case 'error_spike':
        return `Add error handling and validation to prevent consecutive failures`;
      case 'rejection_signal':
        return `Improve ${trigger.pattern.agentId} output quality to reduce user corrections`;
      case 'system_error_spike':
        return 'Investigate system-wide stability issues';
      default:
        return 'Improve overall user experience';
    }
  }

  /**
   * Analyze sentiment of user message
   */
  async analyzeSentiment(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative' | 'critical';
    score: number;
    keywords: string[];
  }> {
    const msg = message.toLowerCase();
    const keywords: string[] = [];

    // Negative keywords
    const negativeKeywords = [
      'broken', 'fail', 'error', 'bug', 'slow', 'stuck', 'crash', 'wrong',
      'confusing', 'frustrating', 'annoying', 'terrible', 'awful', 'hate',
      "doesn't work", 'not working', 'issue', 'problem', 'useless', 'bad'
    ];

    // Critical keywords
    const criticalKeywords = [
      'unusable', 'disaster', 'worst', 'completely broken', 'total failure'
    ];

    // Positive keywords
    const positiveKeywords = [
      'great', 'good', 'works', 'love', 'excellent', 'perfect', 'awesome',
      'helpful', 'fast', 'easy', 'nice', 'thank', 'amazing', 'wonderful'
    ];

    let negativeCount = 0;
    let criticalCount = 0;
    let positiveCount = 0;

    for (const kw of criticalKeywords) {
      if (msg.includes(kw)) {
        criticalCount++;
        keywords.push(kw);
      }
    }

    for (const kw of negativeKeywords) {
      if (msg.includes(kw)) {
        negativeCount++;
        keywords.push(kw);
      }
    }

    for (const kw of positiveKeywords) {
      if (msg.includes(kw)) {
        positiveCount++;
        keywords.push(kw);
      }
    }

    // Calculate score
    const totalSignals = negativeCount + criticalCount + positiveCount || 1;
    const score = (positiveCount - negativeCount - criticalCount * 2) / totalSignals;

    // Determine sentiment
    let sentiment: 'positive' | 'neutral' | 'negative' | 'critical';
    if (criticalCount > 0 || score <= -0.8) sentiment = 'critical';
    else if (score <= -0.3) sentiment = 'negative';
    else if (score < 0.3) sentiment = 'neutral';
    else sentiment = 'positive';

    return { sentiment, score, keywords };
  }

  /**
   * Reset patterns for user/agent
   */
  resetPattern(userId: string | undefined, agentId: string): void {
    const keys = Array.from(this.frustrationPatterns.keys()).filter(
      key => key.includes(`${userId || 'default'}-${agentId}`)
    );
    keys.forEach(key => this.frustrationPatterns.delete(key));
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activePatterns: this.frustrationPatterns.size,
      recentInteractions: this.recentInteractions.length,
      recentErrors: this.recentInteractions.filter(i => !i.success).length
    };
  }
}

// Export singleton
let _detectorInstance: IntelligentFeedbackDetector | null = null;

export function getIntelligentFeedbackDetector(config?: Partial<DetectorConfig>): IntelligentFeedbackDetector {
  if (!_detectorInstance) {
    _detectorInstance = new IntelligentFeedbackDetector(config);
  }
  return _detectorInstance;
}
