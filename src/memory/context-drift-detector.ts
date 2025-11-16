/**
 * VERSATIL Context Drift Detector
 *
 * Detects when conversation context becomes stale, irrelevant, or drifted
 * from the current task, enabling proactive context management.
 *
 * Research Findings:
 * - Long conversations (500k+ tokens) accumulate stale context
 * - File access patterns reveal drift (editing file A, but discussing file B)
 * - Task switches create context misalignment
 * - Obsolete patterns waste tokens (old code examples no longer relevant)
 * - Early drift detection allows targeted clearing vs. blanket clears
 *
 * Drift Indicators:
 * 1. **File Staleness**: Files discussed but not accessed in 50+ messages
 * 2. **Task Switching**: Multiple unrelated topics in short time span
 * 3. **Obsolete Patterns**: Patterns referencing deleted/renamed files
 * 4. **Agent Switching**: Frequent agent changes without completion
 * 5. **Conversation Depth**: Very long conversations (200+ messages)
 *
 * Integration: Works with ContextSentinel for proactive management
 */

import { VERSATILLogger } from '../utils/logger.js';
import { ContextStatsTracker } from './context-stats-tracker.js';

/**
 * Drift severity levels
 */
export enum DriftSeverity {
  NONE = 'none',           // No drift detected
  LOW = 'low',             // Minor drift, monitor only
  MEDIUM = 'medium',       // Moderate drift, suggest clearing
  HIGH = 'high',           // Significant drift, recommend clearing
  CRITICAL = 'critical'    // Severe drift, immediate clearing needed
}

/**
 * Drift indicator type
 */
export interface DriftIndicator {
  type: 'file_staleness' | 'task_switch' | 'obsolete_pattern' | 'agent_switch' | 'conversation_depth';
  severity: DriftSeverity;
  description: string;
  affectedFiles?: string[];
  affectedAgents?: string[];
  timestamp: Date;
  recommendation: string;
}

/**
 * Drift detection result
 */
export interface DriftDetectionResult {
  overallSeverity: DriftSeverity;
  driftScore: number; // 0-100, higher = more drift
  indicators: DriftIndicator[];
  recommendations: string[];
  shouldClearContext: boolean;
  tokenWasteEstimate: number; // Estimated tokens wasted on stale context
}

/**
 * Drift detection configuration
 */
export interface DriftDetectionConfig {
  /** Max messages before considering file stale */
  fileStalenessThreshold: number;

  /** Max task switches before flagging drift */
  taskSwitchThreshold: number;

  /** Max conversation depth before flagging */
  conversationDepthThreshold: number;

  /** Enable obsolete pattern detection */
  detectObsoletePatterns: boolean;

  /** Enable agent switch detection */
  detectAgentSwitches: boolean;
}

export class ContextDriftDetector {
  private logger: VERSATILLogger;
  private statsTracker: ContextStatsTracker;
  private config: DriftDetectionConfig;

  // Tracking state
  private fileAccessHistory: Map<string, { lastAccess: Date; accessCount: number }> = new Map();
  private taskHistory: { task: string; timestamp: Date }[] = [];
  private agentHistory: { agentId: string; timestamp: Date }[] = [];
  private conversationMessageCount: number = 0;

  constructor(
    statsTracker: ContextStatsTracker,
    config?: Partial<DriftDetectionConfig>
  ) {
    this.logger = new VERSATILLogger();
    this.statsTracker = statsTracker;

    this.config = {
      fileStalenessThreshold: 50,     // 50 messages
      taskSwitchThreshold: 5,         // 5 task switches
      conversationDepthThreshold: 200, // 200 messages
      detectObsoletePatterns: true,
      detectAgentSwitches: true,
      ...config
    };
  }

  /**
   * Detect context drift and return analysis
   *
   * @param currentTokens - Current input token count
   * @returns Drift detection result with recommendations
   */
  async detectDrift(currentTokens: number): Promise<DriftDetectionResult> {
    this.logger.info('Running drift detection', {
      currentTokens,
      messageCount: this.conversationMessageCount
    }, 'drift-detector');

    const indicators: DriftIndicator[] = [];

    // Indicator 1: File Staleness
    const fileDrift = this.detectFileStaleness();
    if (fileDrift) {
      indicators.push(fileDrift);
    }

    // Indicator 2: Task Switching
    const taskDrift = this.detectTaskSwitching();
    if (taskDrift) {
      indicators.push(taskDrift);
    }

    // Indicator 3: Conversation Depth
    const depthDrift = this.detectConversationDepth();
    if (depthDrift) {
      indicators.push(depthDrift);
    }

    // Indicator 4: Agent Switching
    if (this.config.detectAgentSwitches) {
      const agentDrift = this.detectAgentSwitching();
      if (agentDrift) {
        indicators.push(agentDrift);
      }
    }

    // Indicator 5: Obsolete Patterns
    if (this.config.detectObsoletePatterns) {
      const obsoleteDrift = await this.detectObsoletePatterns();
      if (obsoleteDrift) {
        indicators.push(obsoleteDrift);
      }
    }

    // Calculate overall drift
    const driftScore = this.calculateDriftScore(indicators);
    const overallSeverity = this.calculateOverallSeverity(driftScore);
    const recommendations = this.generateRecommendations(indicators, driftScore, currentTokens);
    const shouldClearContext = driftScore >= 70 || overallSeverity === DriftSeverity.CRITICAL;
    const tokenWasteEstimate = this.estimateTokenWaste(indicators, currentTokens);

    const result: DriftDetectionResult = {
      overallSeverity,
      driftScore,
      indicators,
      recommendations,
      shouldClearContext,
      tokenWasteEstimate
    };

    this.logger.info('Drift detection complete', {
      overallSeverity,
      driftScore,
      indicatorCount: indicators.length,
      shouldClear: shouldClearContext
    }, 'drift-detector');

    return result;
  }

  /**
   * Track file access (called by file operations)
   */
  trackFileAccess(filePath: string): void {
    const now = new Date();
    const existing = this.fileAccessHistory.get(filePath);

    if (existing) {
      existing.lastAccess = now;
      existing.accessCount++;
    } else {
      this.fileAccessHistory.set(filePath, {
        lastAccess: now,
        accessCount: 1
      });
    }
  }

  /**
   * Track task change (called on user prompts)
   */
  trackTask(task: string): void {
    this.taskHistory.push({
      task,
      timestamp: new Date()
    });

    // Keep only recent history (last 20 tasks)
    if (this.taskHistory.length > 20) {
      this.taskHistory = this.taskHistory.slice(-20);
    }
  }

  /**
   * Track agent activation
   */
  trackAgentActivation(agentId: string): void {
    this.agentHistory.push({
      agentId,
      timestamp: new Date()
    });

    // Keep only recent history (last 20 activations)
    if (this.agentHistory.length > 20) {
      this.agentHistory = this.agentHistory.slice(-20);
    }
  }

  /**
   * Track message (called on each user message)
   */
  trackMessage(): void {
    this.conversationMessageCount++;
  }

  /**
   * Reset drift tracking (called after context clear)
   */
  reset(): void {
    this.fileAccessHistory.clear();
    this.taskHistory = [];
    this.agentHistory = [];
    this.conversationMessageCount = 0;
    this.logger.info('Drift tracking reset', {}, 'drift-detector');
  }

  /**
   * Detect file staleness
   */
  private detectFileStaleness(): DriftIndicator | null {
    const now = new Date();
    const staleFiles: string[] = [];

    for (const [file, data] of this.fileAccessHistory) {
      const messagesSinceAccess = this.conversationMessageCount - data.accessCount;

      if (messagesSinceAccess > this.config.fileStalenessThreshold) {
        staleFiles.push(file);
      }
    }

    if (staleFiles.length === 0) {
      return null;
    }

    const severity = staleFiles.length > 10
      ? DriftSeverity.HIGH
      : staleFiles.length > 5
        ? DriftSeverity.MEDIUM
        : DriftSeverity.LOW;

    return {
      type: 'file_staleness',
      severity,
      description: `${staleFiles.length} files not accessed in ${this.config.fileStalenessThreshold}+ messages`,
      affectedFiles: staleFiles,
      timestamp: now,
      recommendation: severity === DriftSeverity.HIGH
        ? 'Clear context and re-establish current file focus'
        : 'Consider clearing stale file context if working on new area'
    };
  }

  /**
   * Detect task switching
   */
  private detectTaskSwitching(): DriftIndicator | null {
    if (this.taskHistory.length < this.config.taskSwitchThreshold) {
      return null;
    }

    // Count unique tasks in recent history
    const recentTasks = this.taskHistory.slice(-10);
    const uniqueTasks = new Set(recentTasks.map(t => t.task));

    if (uniqueTasks.size < this.config.taskSwitchThreshold) {
      return null; // Not enough switching
    }

    const severity = uniqueTasks.size > 8
      ? DriftSeverity.HIGH
      : uniqueTasks.size > 5
        ? DriftSeverity.MEDIUM
        : DriftSeverity.LOW;

    return {
      type: 'task_switch',
      severity,
      description: `${uniqueTasks.size} different tasks in recent conversation`,
      timestamp: new Date(),
      recommendation: 'Context is fragmented. Consider clearing and focusing on single task.'
    };
  }

  /**
   * Detect conversation depth
   */
  private detectConversationDepth(): DriftIndicator | null {
    if (this.conversationMessageCount < this.config.conversationDepthThreshold) {
      return null;
    }

    const severity = this.conversationMessageCount > 300
      ? DriftSeverity.CRITICAL
      : this.conversationMessageCount > 250
        ? DriftSeverity.HIGH
        : DriftSeverity.MEDIUM;

    return {
      type: 'conversation_depth',
      severity,
      description: `Very long conversation (${this.conversationMessageCount} messages)`,
      timestamp: new Date(),
      recommendation: severity === DriftSeverity.CRITICAL
        ? '⚠️ CRITICAL: Context likely degraded. Clear immediately and start fresh.'
        : 'Long conversation detected. Consider clearing to maintain context quality.'
    };
  }

  /**
   * Detect agent switching
   */
  private detectAgentSwitching(): DriftIndicator | null {
    if (this.agentHistory.length < 10) {
      return null; // Not enough data
    }

    const recentAgents = this.agentHistory.slice(-10);
    const uniqueAgents = new Set(recentAgents.map(a => a.agentId));

    if (uniqueAgents.size < 4) {
      return null; // Normal switching
    }

    const severity = uniqueAgents.size > 6
      ? DriftSeverity.HIGH
      : uniqueAgents.size > 4
        ? DriftSeverity.MEDIUM
        : DriftSeverity.LOW;

    return {
      type: 'agent_switch',
      severity,
      description: `${uniqueAgents.size} different agents in recent history`,
      affectedAgents: Array.from(uniqueAgents),
      timestamp: new Date(),
      recommendation: 'Frequent agent switching detected. Consider focusing workflow or clearing context.'
    };
  }

  /**
   * Detect obsolete patterns
   */
  private async detectObsoletePatterns(): Promise<DriftIndicator | null> {
    // In production, this would:
    // 1. Check memory operations for file references
    // 2. Verify those files still exist
    // 3. Flag patterns referencing deleted/renamed files

    // For now, return null (not implemented in this phase)
    return null;
  }

  /**
   * Calculate overall drift score (0-100)
   */
  private calculateDriftScore(indicators: DriftIndicator[]): number {
    if (indicators.length === 0) {
      return 0;
    }

    let score = 0;

    for (const indicator of indicators) {
      switch (indicator.severity) {
        case DriftSeverity.CRITICAL:
          score += 40;
          break;
        case DriftSeverity.HIGH:
          score += 25;
          break;
        case DriftSeverity.MEDIUM:
          score += 15;
          break;
        case DriftSeverity.LOW:
          score += 5;
          break;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate overall severity from score
   */
  private calculateOverallSeverity(score: number): DriftSeverity {
    if (score >= 80) return DriftSeverity.CRITICAL;
    if (score >= 60) return DriftSeverity.HIGH;
    if (score >= 30) return DriftSeverity.MEDIUM;
    if (score >= 10) return DriftSeverity.LOW;
    return DriftSeverity.NONE;
  }

  /**
   * Generate recommendations based on drift indicators
   */
  private generateRecommendations(
    indicators: DriftIndicator[],
    score: number,
    currentTokens: number
  ): string[] {
    const recommendations: string[] = [];

    if (score >= 70) {
      recommendations.push('🚨 HIGH DRIFT DETECTED: Clear context immediately to restore focus');
    } else if (score >= 50) {
      recommendations.push('⚠️ MODERATE DRIFT: Consider clearing context soon');
    } else if (score >= 30) {
      recommendations.push('💡 MINOR DRIFT: Monitor and clear if needed');
    } else {
      recommendations.push('✅ NO SIGNIFICANT DRIFT: Context is healthy');
    }

    // Add specific recommendations from indicators
    for (const indicator of indicators) {
      if (indicator.severity === DriftSeverity.HIGH || indicator.severity === DriftSeverity.CRITICAL) {
        recommendations.push(`→ ${indicator.recommendation}`);
      }
    }

    // Token-based recommendation
    if (currentTokens > 150_000) {
      recommendations.push('→ High token usage combined with drift. Clear context now.');
    }

    return recommendations;
  }

  /**
   * Estimate wasted tokens from drift
   */
  private estimateTokenWaste(indicators: DriftIndicator[], currentTokens: number): number {
    let wasteEstimate = 0;

    for (const indicator of indicators) {
      switch (indicator.type) {
        case 'file_staleness':
          // Estimate 500 tokens per stale file
          wasteEstimate += (indicator.affectedFiles?.length || 0) * 500;
          break;
        case 'task_switch':
          // Estimate 10% of context is stale tasks
          wasteEstimate += currentTokens * 0.1;
          break;
        case 'conversation_depth':
          // Estimate 20-30% of very long conversations is stale
          wasteEstimate += currentTokens * 0.25;
          break;
        case 'agent_switch':
          // Estimate 5% waste from agent context switching
          wasteEstimate += currentTokens * 0.05;
          break;
      }
    }

    return Math.round(wasteEstimate);
  }

  /**
   * Generate drift report
   */
  generateReport(result: DriftDetectionResult): string {
    let report = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    report += '  📊 Context Drift Detection Report\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    report += '📈 Overall Assessment\n\n';
    report += `  Drift Score: ${result.driftScore}/100\n`;
    report += `  Severity: ${result.overallSeverity.toUpperCase()}\n`;
    report += `  Should Clear: ${result.shouldClearContext ? 'YES ⚠️' : 'NO ✅'}\n`;
    report += `  Wasted Tokens: ~${result.tokenWasteEstimate.toLocaleString()}\n\n`;

    if (result.indicators.length > 0) {
      report += '🔍 Drift Indicators\n\n';
      for (const indicator of result.indicators) {
        const icon = indicator.severity === DriftSeverity.CRITICAL ? '🔴'
          : indicator.severity === DriftSeverity.HIGH ? '🟠'
            : indicator.severity === DriftSeverity.MEDIUM ? '🟡'
              : '🟢';

        report += `  ${icon} ${indicator.type.toUpperCase()}\n`;
        report += `     ${indicator.description}\n`;
        if (indicator.affectedFiles && indicator.affectedFiles.length > 0) {
          report += `     Files: ${indicator.affectedFiles.slice(0, 5).join(', ')}${indicator.affectedFiles.length > 5 ? '...' : ''}\n`;
        }
        report += '\n';
      }
    }

    report += '💡 Recommendations\n\n';
    for (const rec of result.recommendations) {
      report += `  ${rec}\n`;
    }
    report += '\n';

    return report;
  }
}

/**
 * Factory function for ContextDriftDetector
 */
export function createContextDriftDetector(
  statsTracker: ContextStatsTracker,
  config?: Partial<DriftDetectionConfig>
): ContextDriftDetector {
  return new ContextDriftDetector(statsTracker, config);
}
