/**
 * VERSATIL Session Manager
 *
 * Manages coding sessions and tracks cumulative metrics across sessions.
 * Provides historical analysis and trend data for framework impact.
 *
 * Features:
 * - Track session start/end times
 * - Persist session summaries to disk
 * - Calculate cumulative time saved
 * - Generate daily/weekly/monthly reports
 */

import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import { SessionMetrics, getUsageLogger } from './usage-logger.js';

export interface SessionSummary extends SessionMetrics {
  date: string; // YYYY-MM-DD
  productivity: {
    timeSaved: number; // minutes
    productivityGain: number; // percentage (compared to manual)
    efficiency: number; // 0-100 (tasks completed / tasks started)
  };
  topPatterns: string[];
  recommendations: string[];
}

export interface CumulativeStats {
  totalSessions: number;
  totalDuration: number; // minutes
  totalTimeSaved: number; // minutes
  totalAgentActivations: number;
  totalTasksCompleted: number;
  averageImpactScore: number;
  frameworkROI: number; // time saved / time invested
  topAgents: Array<{
    agentId: string;
    activations: number;
    timeSaved: number;
  }>;
  trend: 'improving' | 'stable' | 'declining';
}

export class SessionManager {
  private sessionsDir: string;
  private currentSessionPath: string;
  private usageLogger = getUsageLogger();

  constructor() {
    this.sessionsDir = path.join(homedir(), '.versatil', 'sessions');
    const today = new Date().toISOString().split('T')[0];
    this.currentSessionPath = path.join(this.sessionsDir, `session-${today}.json`);
  }

  /**
   * Initialize session manager
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
      console.log('[SessionManager] ✅ Initialized');
    } catch (error: any) {
      console.error('[SessionManager] Failed to initialize:', error.message);
    }
  }

  /**
   * End current session and save summary
   */
  async endSession(): Promise<SessionSummary> {
    const metrics = this.usageLogger.getSessionMetrics();
    const summary = this.createSessionSummary(metrics);

    // Persist to disk
    await this.saveSessionSummary(summary);

    console.log('[SessionManager] ✅ Session ended');
    console.log(`  - Duration: ${Math.round(summary.duration! / 60000)} minutes`);
    console.log(`  - Time Saved: ${summary.totalTimeSaved} minutes`);
    console.log(`  - Impact Score: ${summary.impactScore}/10`);

    return summary;
  }

  /**
   * Get current session summary (without ending session)
   */
  async getCurrentSessionSummary(): Promise<SessionSummary> {
    const metrics = this.usageLogger.getSessionMetrics();
    return this.createSessionSummary(metrics);
  }

  /**
   * Create session summary from metrics
   */
  private createSessionSummary(metrics: SessionMetrics): SessionSummary {
    const sessionDuration = (metrics.endTime! - metrics.startTime) / 60000; // minutes
    const productivity = this.calculateProductivity(metrics);
    const topPatterns = this.extractTopPatterns(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      ...metrics,
      date: new Date(metrics.startTime).toISOString().split('T')[0],
      productivity,
      topPatterns,
      recommendations,
    };
  }

  /**
   * Calculate productivity metrics
   */
  private calculateProductivity(metrics: SessionMetrics): SessionSummary['productivity'] {
    const sessionDuration = (metrics.endTime! - metrics.startTime) / 60000; // minutes
    const productivityGain = sessionDuration > 0
      ? Math.round((metrics.totalTimeSaved / sessionDuration) * 100)
      : 0;

    const efficiency = metrics.agentActivations > 0
      ? Math.round((metrics.tasksCompleted / metrics.agentActivations) * 100)
      : 0;

    return {
      timeSaved: metrics.totalTimeSaved,
      productivityGain,
      efficiency,
    };
  }

  /**
   * Extract top patterns used this session
   */
  private extractTopPatterns(metrics: SessionMetrics): string[] {
    // Extract from agent breakdown (mock implementation)
    // In real implementation, would analyze sessionEvents for patterns
    const patterns: string[] = [];

    if (metrics.agentBreakdown['maria-qa']?.activations > 0) {
      patterns.push('React Testing Library patterns');
    }
    if (metrics.agentBreakdown['marcus-backend']?.activations > 0) {
      patterns.push('API security best practices');
    }
    if (metrics.agentBreakdown['james-frontend']?.activations > 0) {
      patterns.push('Component optimization techniques');
    }

    return patterns.slice(0, 5); // Top 5
  }

  /**
   * Generate recommendations for next session
   */
  private generateRecommendations(metrics: SessionMetrics): string[] {
    const recommendations: string[] = [];

    // Check for low quality
    if (metrics.averageQuality < 70) {
      recommendations.push('Review failed tasks and adjust agent configuration for better quality');
    }

    // Check for low agent usage
    if (metrics.agentActivations < 3) {
      recommendations.push('Consider using more agents to maximize framework benefits');
    }

    // Check for specific agent gaps
    if (!metrics.agentBreakdown['maria-qa']) {
      recommendations.push('Run /maria review coverage to ensure test quality');
    }

    // Success message
    if (metrics.impactScore >= 8) {
      recommendations.push('Excellent session! You\'re using VERSATIL effectively');
    }

    return recommendations;
  }

  /**
   * Save session summary to disk
   */
  private async saveSessionSummary(summary: SessionSummary): Promise<void> {
    try {
      const content = JSON.stringify(summary, null, 2);
      await fs.writeFile(this.currentSessionPath, content, 'utf-8');
    } catch (error: any) {
      console.error('[SessionManager] Failed to save session:', error.message);
    }
  }

  /**
   * Load session summary from disk
   */
  async loadSessionSummary(date: string): Promise<SessionSummary | null> {
    try {
      const sessionPath = path.join(this.sessionsDir, `session-${date}.json`);
      const content = await fs.readFile(sessionPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // Session doesn't exist
      }
      throw error;
    }
  }

  /**
   * Get all session summaries
   */
  async getAllSessions(): Promise<SessionSummary[]> {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));

      const summaries = await Promise.all(
        sessionFiles.map(async (file) => {
          const content = await fs.readFile(path.join(this.sessionsDir, file), 'utf-8');
          return JSON.parse(content) as SessionSummary;
        })
      );

      // Sort by date (newest first)
      return summaries.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error: any) {
      console.error('[SessionManager] Failed to load sessions:', error.message);
      return [];
    }
  }

  /**
   * Calculate cumulative stats across all sessions
   */
  async getCumulativeStats(): Promise<CumulativeStats> {
    const sessions = await this.getAllSessions();

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        totalTimeSaved: 0,
        totalAgentActivations: 0,
        totalTasksCompleted: 0,
        averageImpactScore: 0,
        frameworkROI: 0,
        topAgents: [],
        trend: 'stable',
      };
    }

    // Calculate totals
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration ?? 0) / 60000, 0); // minutes
    const totalTimeSaved = sessions.reduce((sum, s) => sum + s.totalTimeSaved, 0);
    const totalAgentActivations = sessions.reduce((sum, s) => sum + s.agentActivations, 0);
    const totalTasksCompleted = sessions.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const averageImpactScore = sessions.reduce((sum, s) => sum + s.impactScore, 0) / sessions.length;

    // Calculate framework ROI (time saved / time invested)
    // Assume average framework overhead is 5% of session time
    const frameworkOverhead = totalDuration * 0.05;
    const frameworkROI = frameworkOverhead > 0 ? totalTimeSaved / frameworkOverhead : 0;

    // Aggregate agent stats
    const agentStats: Record<string, { activations: number; timeSaved: number }> = {};
    for (const session of sessions) {
      for (const [agentId, breakdown] of Object.entries(session.agentBreakdown)) {
        if (!agentStats[agentId]) {
          agentStats[agentId] = { activations: 0, timeSaved: 0 };
        }
        agentStats[agentId].activations += breakdown.activations;
        agentStats[agentId].timeSaved += breakdown.timeSaved;
      }
    }

    const topAgents = Object.entries(agentStats)
      .map(([agentId, stats]) => ({ agentId, ...stats }))
      .sort((a, b) => b.timeSaved - a.timeSaved)
      .slice(0, 5);

    // Calculate trend (last 7 days vs previous 7 days)
    const trend = this.calculateTrend(sessions);

    return {
      totalSessions: sessions.length,
      totalDuration,
      totalTimeSaved,
      totalAgentActivations,
      totalTasksCompleted,
      averageImpactScore: Math.round(averageImpactScore * 10) / 10,
      frameworkROI: Math.round(frameworkROI * 10) / 10,
      topAgents,
      trend,
    };
  }

  /**
   * Calculate trend (improving/stable/declining)
   */
  private calculateTrend(sessions: SessionSummary[]): 'improving' | 'stable' | 'declining' {
    if (sessions.length < 5) {
      return 'stable'; // Not enough data
    }

    // Compare last 7 sessions to previous 7 sessions
    const recent = sessions.slice(0, 7);
    const previous = sessions.slice(7, 14);

    if (previous.length === 0) {
      return 'stable';
    }

    const recentAvg = recent.reduce((sum, s) => sum + s.impactScore, 0) / recent.length;
    const previousAvg = previous.reduce((sum, s) => sum + s.impactScore, 0) / previous.length;

    const diff = recentAvg - previousAvg;

    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }

  /**
   * Get weekly report (last 7 days)
   */
  async getWeeklyReport(): Promise<{
    startDate: string;
    endDate: string;
    sessions: SessionSummary[];
    stats: CumulativeStats;
  }> {
    const allSessions = await this.getAllSessions();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const weeklySessions = allSessions.filter(s => s.date >= sevenDaysAgoStr);

    // Calculate stats for weekly sessions only
    const totalDuration = weeklySessions.reduce((sum, s) => sum + (s.duration ?? 0) / 60000, 0);
    const totalTimeSaved = weeklySessions.reduce((sum, s) => sum + s.totalTimeSaved, 0);

    return {
      startDate: sevenDaysAgoStr,
      endDate: new Date().toISOString().split('T')[0],
      sessions: weeklySessions,
      stats: {
        totalSessions: weeklySessions.length,
        totalDuration,
        totalTimeSaved,
        totalAgentActivations: weeklySessions.reduce((sum, s) => sum + s.agentActivations, 0),
        totalTasksCompleted: weeklySessions.reduce((sum, s) => sum + s.tasksCompleted, 0),
        averageImpactScore: weeklySessions.reduce((sum, s) => sum + s.impactScore, 0) / (weeklySessions.length || 1),
        frameworkROI: totalDuration > 0 ? totalTimeSaved / (totalDuration * 0.05) : 0,
        topAgents: [], // TODO: implement
        trend: 'stable',
      },
    };
  }
}

// Export singleton instance
let _sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!_sessionManagerInstance) {
    _sessionManagerInstance = new SessionManager();
    _sessionManagerInstance.initialize().catch(console.error);
  }
  return _sessionManagerInstance;
}
