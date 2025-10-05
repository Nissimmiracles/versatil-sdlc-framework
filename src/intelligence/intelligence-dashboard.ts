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
        learningEnabled: true, // TODO: Get from configuration
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
      agentMetrics.push({
        agentId: agentUsage.agentId,
        adaptationsApplied: 0, // TODO: Get from agent intelligence data
        successRate: agentUsage.successRate,
        avgExecutionTime: 0, // TODO: Calculate from performance data
        userSatisfactionScore: usageData.userSatisfaction / 5, // Convert to 0-1 scale
        activationCount: agentUsage.activations,
        learningInsights: [] // TODO: Extract from learning data
      });
    }

    return agentMetrics;
  }

  private calculateFileTypeSuccessRate(fileType: string, usageData: any): number {
    // TODO: Calculate actual success rate per file type
    return Math.random() * 0.3 + 0.7; // Mock data: 70-100% success rate
  }

  private extractPeakUsageHours(usageData: any): string[] {
    // TODO: Analyze usage patterns to find peak hours
    return ['09:00-11:00', '14:00-16:00', '20:00-22:00'];
  }

  private calculateFalsePositiveRate(usageData: any): number {
    // TODO: Calculate from actual false positive reports
    return 0.1; // Mock: 10% false positive rate
  }

  private calculateEngagementTrend(usageData: any): 'increasing' | 'stable' | 'decreasing' {
    // TODO: Analyze engagement trends over time
    return 'increasing';
  }

  private estimateActiveUsers(): number {
    // TODO: Track active user sessions
    return Math.floor(Math.random() * 10) + 5; // Mock: 5-15 active users
  }

  private getCurrentActivations(): number {
    // TODO: Track current agent activations
    return Math.floor(Math.random() * 5); // Mock: 0-5 current activations
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