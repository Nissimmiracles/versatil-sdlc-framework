/**
 * VERSATIL SDLC Framework - Intelligence Dashboard
 *
 * Provides real-time insights into adaptive learning system performance,
 * agent intelligence metrics, and user interaction patterns.
 */

import { agentIntelligence } from './agent-intelligence.js';
import { usageAnalytics } from './usage-analytics.js';
import { adaptiveLearning } from './adaptive-learning.js';
import { VERSATILLogger } from '../utils/logger.js';

export interface IntelligenceDashboardData {
  systemOverview: {
    totalAgentsWrapped: number;
    learningEnabled: boolean;
    totalInteractions: number;
    avgUserSatisfaction: number;
    systemUptime: number;
  };
  agentMetrics: Array<{
    agentId: string;
    adaptationsApplied: number;
    successRate: number;
    avgExecutionTime: number;
    userSatisfactionScore: number;
    activationCount: number;
    learningInsights: string[];
  }>;
  usageInsights: {
    topFileTypes: Array<{ fileType: string; usage: number; successRate: number }>;
    peakUsageHours: string[];
    commonUserFeedback: string[];
    improvementOpportunities: string[];
    falsePositiveRate: number;
    userEngagementTrend: 'increasing' | 'stable' | 'decreasing';
  };
  learningProgress: {
    patternsDiscovered: number;
    adaptationsProposed: number;
    adaptationsApplied: number;
    learningEffectiveness: number;
    recentImprovements: Array<{
      agentId: string;
      improvement: string;
      impact: number;
      timestamp: number;
    }>;
  };
  realTimeMetrics: {
    activeUsers: number;
    currentActivations: number;
    systemLoad: number;
    responseTime: number;
    errorRate: number;
  };
}

export class IntelligenceDashboard {
  private logger: VERSATILLogger;
  private startTime: number;
  private lastUpdateTime: number;
  private cachedData: IntelligenceDashboardData | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.logger = new VERSATILLogger();
    this.startTime = Date.now();
    this.lastUpdateTime = 0;
  }

  /**
   * Get comprehensive intelligence dashboard data
   */
  public getDashboardData(forceRefresh: boolean = false): IntelligenceDashboardData {
    const now = Date.now();

    if (!forceRefresh && this.cachedData && (now - this.lastUpdateTime) < this.cacheExpiry) {
      return this.cachedData;
    }

    this.logger.info('Generating intelligence dashboard data', {}, 'intelligence-dashboard');

    const agentIntelligenceData = agentIntelligence.getIntelligenceDashboard();
    const usageAnalyticsData = usageAnalytics.getAnalyticsDashboard();
    const learningInsightsData = adaptiveLearning.getLearningInsights();

    this.cachedData = {
      systemOverview: {
        totalAgentsWrapped: agentIntelligenceData.wrappedAgents,
        learningEnabled: process.env.VERSATIL_LEARNING_ENABLED !== 'false', // Default: true, can be disabled via env
        totalInteractions: usageAnalyticsData.totalEvents,
        avgUserSatisfaction: usageAnalyticsData.userSatisfaction,
        systemUptime: now - this.startTime
      },

      agentMetrics: this.buildAgentMetrics(agentIntelligenceData, usageAnalyticsData),

      usageInsights: {
        topFileTypes: usageAnalyticsData.topFileTypes.map(ft => ({
          ...ft,
          successRate: this.calculateFileTypeSuccessRate(ft.fileType, usageAnalyticsData)
        })),
        peakUsageHours: this.extractPeakUsageHours(usageAnalyticsData),
        commonUserFeedback: usageAnalyticsData.commonIssues,
        improvementOpportunities: usageAnalyticsData.improvementOpportunities,
        falsePositiveRate: this.calculateFalsePositiveRate(usageAnalyticsData),
        userEngagementTrend: this.calculateEngagementTrend(usageAnalyticsData)
      },

      learningProgress: {
        patternsDiscovered: learningInsightsData.patternsDiscovered,
        adaptationsProposed: learningInsightsData.adaptationsProposed,
        adaptationsApplied: learningInsightsData.adaptationsApplied,
        learningEffectiveness: learningInsightsData.adaptationsApplied / Math.max(1, learningInsightsData.adaptationsProposed),
        recentImprovements: (learningInsightsData.recentLearnings || []).map(learning => ({
          agentId: learning.agentId,
          improvement: learning.pattern,
          impact: learning.confidence,
          timestamp: Date.now() // Use current time as learning patterns don't have timestamps
        }))
      },

      realTimeMetrics: {
        activeUsers: this.estimateActiveUsers(),
        currentActivations: this.getCurrentActivations(),
        systemLoad: agentIntelligenceData.averagePerformance.avgExecutionTime,
        responseTime: agentIntelligenceData.averagePerformance.avgExecutionTime,
        errorRate: 1 - agentIntelligenceData.averagePerformance.successRate
      }
    };

    this.lastUpdateTime = now;
    return this.cachedData;
  }

  /**
   * Get real-time system health status
   */
  public getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    recommendations: string[];
    overallScore: number;
  } {
    const dashboardData = this.getDashboardData();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let healthScore = 100;

    // Check user satisfaction
    if (dashboardData.systemOverview.avgUserSatisfaction < 3.0) {
      issues.push('Low user satisfaction score');
      recommendations.push('Review recent user feedback and agent performance');
      healthScore -= 30;
    } else if (dashboardData.systemOverview.avgUserSatisfaction < 4.0) {
      issues.push('Moderate user satisfaction');
      recommendations.push('Identify areas for agent improvement');
      healthScore -= 15;
    }

    // Check error rate
    if (dashboardData.realTimeMetrics.errorRate > 0.1) {
      issues.push('High error rate detected');
      recommendations.push('Investigate agent failures and system issues');
      healthScore -= 25;
    }

    // Check false positive rate
    if (dashboardData.usageInsights.falsePositiveRate > 0.2) {
      issues.push('High false positive rate');
      recommendations.push('Retrain agents to reduce false positives');
      healthScore -= 20;
    }

    // Check learning effectiveness
    if (dashboardData.learningProgress.learningEffectiveness < 0.5) {
      issues.push('Low learning effectiveness');
      recommendations.push('Review adaptive learning parameters');
      healthScore -= 15;
    }

    // Check response time
    if (dashboardData.realTimeMetrics.responseTime > 5000) {
      issues.push('Slow response times');
      recommendations.push('Optimize agent performance and system resources');
      healthScore -= 20;
    }

    const status = healthScore >= 80 ? 'healthy' :
                  healthScore >= 60 ? 'degraded' : 'critical';

    return {
      status,
      issues,
      recommendations,
      overallScore: Math.max(0, healthScore)
    };
  }

  /**
   * Generate learning insights report
   */
  public generateLearningReport(): string {
    const data = this.getDashboardData();
    const health = this.getSystemHealth();

    return `
# 🧠 VERSATIL Intelligence Dashboard Report

## System Overview
- **Agents with Intelligence**: ${data.systemOverview.totalAgentsWrapped}
- **Learning Status**: ${data.systemOverview.learningEnabled ? '✅ Active' : '❌ Disabled'}
- **Total Interactions**: ${data.systemOverview.totalInteractions.toLocaleString()}
- **User Satisfaction**: ${(data.systemOverview.avgUserSatisfaction * 20).toFixed(1)}% (${data.systemOverview.avgUserSatisfaction.toFixed(1)}/5.0)
- **System Uptime**: ${this.formatUptime(data.systemOverview.systemUptime)}

## System Health: ${health.status.toUpperCase()} (${health.overallScore}%)
${health.issues.length > 0 ? `
### Issues Detected:
${health.issues.map(issue => `- ⚠️ ${issue}`).join('\n')}

### Recommendations:
${health.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}
` : '✅ All systems operating normally'}

## Agent Performance Metrics
${data.agentMetrics.map(agent => `
### ${agent.agentId}
- **Adaptations Applied**: ${agent.adaptationsApplied}
- **Success Rate**: ${(agent.successRate * 100).toFixed(1)}%
- **Avg Execution Time**: ${agent.avgExecutionTime.toFixed(0)}ms
- **User Satisfaction**: ${(agent.userSatisfactionScore * 20).toFixed(1)}%
- **Activations**: ${agent.activationCount}
`).join('')}

## Learning Progress
- **Patterns Discovered**: ${data.learningProgress.patternsDiscovered}
- **Adaptations Proposed**: ${data.learningProgress.adaptationsProposed}
- **Adaptations Applied**: ${data.learningProgress.adaptationsApplied}
- **Learning Effectiveness**: ${(data.learningProgress.learningEffectiveness * 100).toFixed(1)}%

${data.learningProgress.recentImprovements.length > 0 ? `
### Recent Improvements:
${data.learningProgress.recentImprovements.map(imp =>
  `- **${imp.agentId}**: ${imp.improvement} (Impact: ${(imp.impact * 100).toFixed(1)}%)`
).join('\n')}
` : ''}

## Usage Insights
- **Top File Types**: ${data.usageInsights.topFileTypes.slice(0, 3).map(ft =>
    `${ft.fileType} (${ft.usage} uses, ${(ft.successRate * 100).toFixed(1)}% success)`
  ).join(', ')}
- **False Positive Rate**: ${(data.usageInsights.falsePositiveRate * 100).toFixed(1)}%
- **Engagement Trend**: ${data.usageInsights.userEngagementTrend}

### Improvement Opportunities:
${data.usageInsights.improvementOpportunities.map(opp => `- ${opp}`).join('\n')}

---
*Generated at ${new Date().toISOString()}*
*Next update in ${Math.ceil((this.cacheExpiry - (Date.now() - this.lastUpdateTime)) / 60000)} minutes*
    `.trim();
  }

  // Helper methods
  private buildAgentMetrics(agentData: any, usageData: any): any[] {
    const agentMetrics = [];

    for (const agentUsage of usageData.agentUsage) {
      // Calculate real adaptations from agent intelligence data
      const agentSpecificData = agentData.agentMetrics?.find((m: any) => m.agentId === agentUsage.agentId);
      const adaptationsApplied = agentSpecificData?.adaptationsApplied || 0;

      // Calculate average execution time from recent activations
      const avgExecutionTime = agentUsage.avgResponseTime || agentData.averagePerformance?.avgExecutionTime || 0;

      // Extract learning insights from agent-specific patterns
      const learningInsights: string[] = [];
      if (agentUsage.successRate > 0.9) {
        learningInsights.push('High success rate - performing well');
      }
      if (avgExecutionTime < 1000) {
        learningInsights.push('Fast response times - optimized performance');
      }
      if (agentUsage.activations > 100) {
        learningInsights.push('Frequently activated - core workflow agent');
      }

      agentMetrics.push({
        agentId: agentUsage.agentId,
        adaptationsApplied,
        successRate: agentUsage.successRate,
        avgExecutionTime,
        userSatisfactionScore: usageData.userSatisfaction / 5, // Convert to 0-1 scale
        activationCount: agentUsage.activations,
        learningInsights
      });
    }

    return agentMetrics;
  }

  private calculateFileTypeSuccessRate(fileType: string, usageData: any): number {
    // Calculate actual success rate from events by file type
    const fileTypeEvents = (usageData.recentEvents || []).filter((e: any) =>
      e.metadata?.filePath?.endsWith(fileType)
    );

    if (fileTypeEvents.length === 0) {
      return 0.85; // Default 85% if no data
    }

    const successfulEvents = fileTypeEvents.filter((e: any) => e.outcome === 'success');
    return successfulEvents.length / fileTypeEvents.length;
  }

  private extractPeakUsageHours(usageData: any): string[] {
    // Analyze actual event timestamps to find peak usage hours
    const hourlyUsage: Map<number, number> = new Map();

    for (const event of (usageData.recentEvents || [])) {
      if (event.timestamp) {
        const hour = new Date(event.timestamp).getHours();
        hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + 1);
      }
    }

    if (hourlyUsage.size === 0) {
      return ['09:00-11:00', '14:00-16:00']; // Default business hours
    }

    // Get top 3 hours by usage
    const sortedHours = Array.from(hourlyUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => {
        const endHour = (hour + 2) % 24;
        return `${hour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`;
      });

    return sortedHours;
  }

  private calculateFalsePositiveRate(usageData: any): number {
    // Calculate from actual false positive feedback
    const totalEvents = usageData.totalEvents || 0;
    const falsePositives = (usageData.recentEvents || []).filter((e: any) =>
      e.feedback === 'false_positive' || e.outcome === 'false_positive'
    ).length;

    if (totalEvents === 0) return 0.05; // Default 5% if no data

    return Math.min(1.0, falsePositives / totalEvents);
  }

  private calculateEngagementTrend(usageData: any): 'increasing' | 'stable' | 'decreasing' {
    // Analyze event frequency over time periods
    const events = (usageData.recentEvents || []).filter((e: any) => e.timestamp);

    if (events.length < 10) return 'stable'; // Not enough data

    // Sort by timestamp
    events.sort((a: any, b: any) => a.timestamp - b.timestamp);

    const midpoint = Math.floor(events.length / 2);
    const firstHalfCount = events.slice(0, midpoint).length;
    const secondHalfCount = events.slice(midpoint).length;

    const firstHalfTime = (events[midpoint - 1]?.timestamp || 0) - (events[0]?.timestamp || 0);
    const secondHalfTime = (events[events.length - 1]?.timestamp || 0) - (events[midpoint]?.timestamp || 0);

    if (firstHalfTime === 0 || secondHalfTime === 0) return 'stable';

    const firstHalfRate = firstHalfCount / firstHalfTime;
    const secondHalfRate = secondHalfCount / secondHalfTime;

    const changeRatio = secondHalfRate / firstHalfRate;

    if (changeRatio > 1.2) return 'increasing';
    if (changeRatio < 0.8) return 'decreasing';
    return 'stable';
  }

  private estimateActiveUsers(): number {
    // Track unique sessions in recent time window (last 15 minutes)
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentSessions = new Set();

    // This would ideally track actual sessions, for now estimate from system state
    const dashboardData = this.cachedData;
    if (!dashboardData) return 1; // At least the current user

    // Estimate based on recent activity level
    const recentActivations = dashboardData.realTimeMetrics?.currentActivations || 0;
    return Math.max(1, Math.ceil(recentActivations / 3)); // Rough estimate: 3 activations per user
  }

  private getCurrentActivations(): number {
    // Track number of currently executing agent operations
    // This would ideally integrate with agent execution tracking
    // For now, return 0 as we don't have real-time execution state
    return 0;
  }

  private formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Export singleton instance
export const intelligenceDashboard = new IntelligenceDashboard();
export default intelligenceDashboard;