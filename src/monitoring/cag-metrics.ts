/**
 * CAG Metrics Tracker
 *
 * Tracks and reports on Cache Augmented Generation performance:
 * - Cache hit rates by agent
 * - Cost savings over time
 * - Latency improvements
 * - Cache health indicators
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { VERSATILLogger } from '../utils/logger.js';
import type { CAGMetrics, CAGQueryResponse } from '../rag/cag-prompt-cache.js';

export interface CAGHealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  hitRate: {
    current: number;
    target: number;
    status: 'good' | 'warning' | 'critical';
  };
  costSavings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    projected: number; // Projected monthly savings
  };
  latency: {
    avgCached: number;
    avgUncached: number;
    speedup: number;
    status: 'good' | 'warning' | 'critical';
  };
  topAgents: Array<{
    agentId: string;
    hitRate: number;
    queries: number;
    savings: number;
  }>;
  issues: string[];
  recommendations: string[];
}

export interface CAGTimeSeriesData {
  timestamp: number;
  hitRate: number;
  totalQueries: number;
  costSavings: number;
  avgLatency: number;
}

export class CAGMetricsTracker extends EventEmitter {
  private logger: VERSATILLogger;
  private metricsPath: string;
  private currentMetrics: CAGMetrics;
  private timeSeries: CAGTimeSeriesData[] = [];
  private maxTimeSeriesPoints: number = 1440; // 24 hours at 1 min intervals

  // Daily cost tracking
  private dailyCosts: Map<string, number> = new Map(); // date -> cost
  private dailyQueries: Map<string, number> = new Map(); // date -> query count

  constructor() {
    super();
    this.logger = new VERSATILLogger('CAGMetrics');
    this.metricsPath = join(process.cwd(), '.versatil', 'cag-metrics');

    this.currentMetrics = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheErrors: 0,
      hitRate: 0,
      totalCostSavings: 0,
      avgLatency: {
        cached: 0,
        uncached: 0,
        speedup: 1
      },
      tokensSaved: 0,
      byAgent: new Map()
    };
  }

  /**
   * Initialize metrics tracker
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.metricsPath, { recursive: true });
    await this.loadHistoricalMetrics();

    // Start periodic snapshots (every minute)
    setInterval(() => this.captureSnapshot(), 60 * 1000);

    // Daily rollover (reset daily metrics at midnight)
    setInterval(() => this.dailyRollover(), 60 * 60 * 1000); // Check every hour

    this.logger.info('CAG Metrics Tracker initialized');
  }

  /**
   * Record a CAG query result
   */
  recordQuery(response: CAGQueryResponse, agentId?: string): void {
    // Update current metrics
    this.currentMetrics.totalQueries++;

    if (response.cacheStatus === 'hit') {
      this.currentMetrics.cacheHits++;
    } else if (response.cacheStatus === 'miss') {
      this.currentMetrics.cacheMisses++;
    } else if (response.cacheStatus === 'error') {
      this.currentMetrics.cacheErrors++;
    }

    this.currentMetrics.hitRate = this.currentMetrics.totalQueries > 0
      ? (this.currentMetrics.cacheHits / this.currentMetrics.totalQueries) * 100
      : 0;

    this.currentMetrics.totalCostSavings += response.costSavings.savings;
    this.currentMetrics.tokensSaved += response.tokenUsage.cacheRead;

    // Update latency averages
    if (response.cacheStatus === 'hit') {
      const { cached } = this.currentMetrics.avgLatency;
      this.currentMetrics.avgLatency.cached =
        (cached * (this.currentMetrics.cacheHits - 1) + response.latency) / this.currentMetrics.cacheHits;
    } else if (response.cacheStatus === 'miss') {
      const { uncached } = this.currentMetrics.avgLatency;
      this.currentMetrics.avgLatency.uncached =
        (uncached * (this.currentMetrics.cacheMisses - 1) + response.latency) / this.currentMetrics.cacheMisses;
    }

    if (this.currentMetrics.avgLatency.cached > 0 && this.currentMetrics.avgLatency.uncached > 0) {
      this.currentMetrics.avgLatency.speedup =
        this.currentMetrics.avgLatency.uncached / this.currentMetrics.avgLatency.cached;
    }

    // Track by agent
    if (agentId) {
      if (!this.currentMetrics.byAgent.has(agentId)) {
        this.currentMetrics.byAgent.set(agentId, { queries: 0, hits: 0, savings: 0 });
      }
      const agentMetrics = this.currentMetrics.byAgent.get(agentId)!;
      agentMetrics.queries++;
      if (response.cacheStatus === 'hit') agentMetrics.hits++;
      agentMetrics.savings += response.costSavings.savings;
    }

    // Track daily costs
    const today = new Date().toISOString().split('T')[0];
    this.dailyCosts.set(today, (this.dailyCosts.get(today) || 0) + response.costSavings.cachedCost);
    this.dailyQueries.set(today, (this.dailyQueries.get(today) || 0) + 1);

    this.emit('query:recorded', { response, agentId });
  }

  /**
   * Get current health status
   */
  getHealthStatus(): CAGHealthStatus {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check hit rate
    const hitRateTarget = 70; // 70% target
    let hitRateStatus: 'good' | 'warning' | 'critical' = 'good';

    if (this.currentMetrics.hitRate < 50) {
      hitRateStatus = 'critical';
      issues.push(`Cache hit rate critically low (${this.currentMetrics.hitRate.toFixed(1)}%)`);
      recommendations.push('Review prompt structures to maximize cache reuse');
      recommendations.push('Consider increasing cache TTL for stable contexts');
    } else if (this.currentMetrics.hitRate < hitRateTarget) {
      hitRateStatus = 'warning';
      issues.push(`Cache hit rate below target (${this.currentMetrics.hitRate.toFixed(1)}% < ${hitRateTarget}%)`);
      recommendations.push('Analyze query patterns to identify caching opportunities');
    }

    // Check latency
    let latencyStatus: 'good' | 'warning' | 'critical' = 'good';
    const maxLatency = 2000; // 2 seconds

    if (this.currentMetrics.avgLatency.cached > maxLatency) {
      latencyStatus = 'critical';
      issues.push(`Cached query latency too high (${this.currentMetrics.avgLatency.cached.toFixed(0)}ms)`);
      recommendations.push('Investigate Anthropic API performance');
    } else if (this.currentMetrics.avgLatency.speedup < 2) {
      latencyStatus = 'warning';
      issues.push(`Cache speedup less than 2x (${this.currentMetrics.avgLatency.speedup.toFixed(1)}x)`);
      recommendations.push('Verify prompt caching is configured correctly');
    }

    // Calculate cost savings
    const today = new Date().toISOString().split('T')[0];
    const costToday = this.dailyCosts.get(today) || 0;

    // Get weekly and monthly costs
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let costThisWeek = 0;
    let costThisMonth = 0;

    for (const [date, cost] of this.dailyCosts) {
      if (date >= weekAgo) costThisWeek += cost;
      if (date >= monthAgo) costThisMonth += cost;
    }

    const projectedMonthlyCost = costToday > 0 ? (costThisMonth / 30) * 30 : 0;

    // Get top agents by hit rate
    const topAgents = Array.from(this.currentMetrics.byAgent.entries())
      .map(([agentId, metrics]) => ({
        agentId,
        hitRate: metrics.queries > 0 ? (metrics.hits / metrics.queries) * 100 : 0,
        queries: metrics.queries,
        savings: metrics.savings
      }))
      .sort((a, b) => b.hitRate - a.hitRate)
      .slice(0, 5);

    // Determine overall status
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (hitRateStatus === 'critical' || latencyStatus === 'critical') {
      overall = 'critical';
    } else if (hitRateStatus === 'warning' || latencyStatus === 'warning') {
      overall = 'degraded';
    }

    return {
      overall,
      hitRate: {
        current: this.currentMetrics.hitRate,
        target: hitRateTarget,
        status: hitRateStatus
      },
      costSavings: {
        today: costToday,
        thisWeek: costThisWeek,
        thisMonth: costThisMonth,
        projected: projectedMonthlyCost
      },
      latency: {
        avgCached: this.currentMetrics.avgLatency.cached,
        avgUncached: this.currentMetrics.avgLatency.uncached,
        speedup: this.currentMetrics.avgLatency.speedup,
        status: latencyStatus
      },
      topAgents,
      issues,
      recommendations
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): CAGMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get time series data
   */
  getTimeSeries(points?: number): CAGTimeSeriesData[] {
    if (points) {
      return this.timeSeries.slice(-points);
    }
    return [...this.timeSeries];
  }

  /**
   * Capture metrics snapshot
   */
  private captureSnapshot(): void {
    const snapshot: CAGTimeSeriesData = {
      timestamp: Date.now(),
      hitRate: this.currentMetrics.hitRate,
      totalQueries: this.currentMetrics.totalQueries,
      costSavings: this.currentMetrics.totalCostSavings,
      avgLatency: this.currentMetrics.avgLatency.cached
    };

    this.timeSeries.push(snapshot);

    // Keep only last N points
    if (this.timeSeries.length > this.maxTimeSeriesPoints) {
      this.timeSeries.shift();
    }

    this.emit('snapshot:captured', snapshot);
  }

  /**
   * Daily rollover - reset daily metrics at midnight
   */
  private dailyRollover(): void {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      this.logger.info('Daily CAG metrics rollover');

      // Persist yesterday's metrics
      this.persistMetrics();

      // Clear old daily data (keep last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      for (const [date] of this.dailyCosts) {
        if (date < ninetyDaysAgo) {
          this.dailyCosts.delete(date);
          this.dailyQueries.delete(date);
        }
      }

      this.emit('daily:rollover');
    }
  }

  /**
   * Persist metrics to disk
   */
  private async persistMetrics(): Promise<void> {
    try {
      const data = {
        metrics: {
          ...this.currentMetrics,
          byAgent: Array.from(this.currentMetrics.byAgent.entries())
        },
        timeSeries: this.timeSeries,
        dailyCosts: Array.from(this.dailyCosts.entries()),
        dailyQueries: Array.from(this.dailyQueries.entries()),
        timestamp: Date.now()
      };

      const filePath = join(this.metricsPath, `metrics-${Date.now()}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));

      this.logger.debug('Persisted CAG metrics', { filePath });
    } catch (error: any) {
      this.logger.error('Failed to persist CAG metrics', { error: error.message });
    }
  }

  /**
   * Load historical metrics
   */
  private async loadHistoricalMetrics(): Promise<void> {
    try {
      const files = await fs.readdir(this.metricsPath);
      const metricsFiles = files.filter(f => f.startsWith('metrics-') && f.endsWith('.json'));

      if (metricsFiles.length === 0) {
        this.logger.info('No historical CAG metrics found');
        return;
      }

      // Load most recent metrics file
      const latestFile = metricsFiles.sort().reverse()[0];
      const filePath = join(this.metricsPath, latestFile);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Restore metrics
      if (data.metrics) {
        this.currentMetrics = {
          ...data.metrics,
          byAgent: new Map(data.metrics.byAgent || [])
        };
      }

      if (data.timeSeries) {
        this.timeSeries = data.timeSeries;
      }

      if (data.dailyCosts) {
        this.dailyCosts = new Map(data.dailyCosts);
      }

      if (data.dailyQueries) {
        this.dailyQueries = new Map(data.dailyQueries);
      }

      this.logger.info('Loaded historical CAG metrics', { file: latestFile });
    } catch (error: any) {
      this.logger.warn('Failed to load historical CAG metrics', { error: error.message });
    }
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.currentMetrics = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheErrors: 0,
      hitRate: 0,
      totalCostSavings: 0,
      avgLatency: {
        cached: 0,
        uncached: 0,
        speedup: 1
      },
      tokensSaved: 0,
      byAgent: new Map()
    };

    this.timeSeries = [];
    this.dailyCosts.clear();
    this.dailyQueries.clear();

    this.emit('metrics:reset');
    this.logger.info('CAG metrics reset');
  }
}

// Export singleton instance
export const cagMetricsTracker = new CAGMetricsTracker();
