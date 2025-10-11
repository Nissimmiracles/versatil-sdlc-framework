/**
 * VERSATIL SDLC Framework - SDK Execution Monitor
 * Real-time monitoring and performance tracking for Claude SDK parallel execution
 *
 * Features:
 * - Real-time execution metrics
 * - Performance comparison (SDK vs Legacy)
 * - Health monitoring
 * - Metrics export for logging/analysis
 */

export interface ExecutionMetric {
  taskId: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'failed' | 'timeout';
  method: 'SDK' | 'Legacy';
  taskCount?: number;
  error?: string;
}

export interface PerformanceStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  successRate: number;
  tasksPerSecond: number;
  sdkVsLegacyComparison: ComparisonMetrics;
}

export interface ComparisonMetrics {
  sdkAverageTime: number;
  legacyAverageTime: number;
  speedupFactor: number;
  sdkSuccessRate: number;
  legacySuccessRate: number;
  recommendation: 'use-sdk' | 'use-legacy' | 'mixed';
}

export interface SDKHealth {
  sdkAvailable: boolean;
  averageResponseTime: number;
  errorRate: number;
  lastExecutionTime: number;
  consecutiveFailures: number;
  recommendSwitchToLegacy: boolean;
  healthScore: number; // 0-100
}

export interface MetricsReport {
  timestamp: number;
  performanceStats: PerformanceStats;
  sdkHealth: SDKHealth;
  recentExecutions: ExecutionMetric[];
  recommendations: string[];
}

export class SDKExecutionMonitor {
  private executionMetrics: ExecutionMetric[] = [];
  private readonly MAX_METRICS_STORED = 1000;
  private readonly CONSECUTIVE_FAILURES_THRESHOLD = 3;
  private readonly ERROR_RATE_THRESHOLD = 0.1; // 10%

  private consecutiveFailures = 0;
  private lastExecutionTime = 0;

  /**
   * Track SDK execution
   */
  trackExecution(
    taskId: string,
    startTime: number,
    endTime: number,
    status: 'completed' | 'failed' | 'timeout',
    method: 'SDK' | 'Legacy' = 'SDK',
    taskCount: number = 1,
    error?: string
  ): void {
    const metric: ExecutionMetric = {
      taskId,
      startTime,
      endTime,
      duration: endTime - startTime,
      status,
      method,
      taskCount,
      error
    };

    this.executionMetrics.push(metric);
    this.lastExecutionTime = endTime;

    // Update consecutive failures counter
    if (status === 'failed' && method === 'SDK') {
      this.consecutiveFailures++;
    } else if (status === 'completed') {
      this.consecutiveFailures = 0;
    }

    // Maintain metrics size limit
    if (this.executionMetrics.length > this.MAX_METRICS_STORED) {
      this.executionMetrics.shift();
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    if (this.executionMetrics.length === 0) {
      return this.getEmptyStats();
    }

    const completed = this.executionMetrics.filter(m => m.status === 'completed');
    const failed = this.executionMetrics.filter(m => m.status === 'failed');

    const durations = completed.map(m => m.duration).sort((a, b) => a - b);
    const averageTime = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const medianTime = durations.length > 0
      ? durations[Math.floor(durations.length / 2)]
      : 0;

    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    const successRate = this.executionMetrics.length > 0
      ? completed.length / this.executionMetrics.length
      : 0;

    // Calculate tasks per second (last 60 seconds)
    const now = Date.now();
    const recentMetrics = this.executionMetrics.filter(m => now - m.endTime < 60000);
    const totalTasks = recentMetrics.reduce((sum, m) => sum + (m.taskCount || 1), 0);
    const tasksPerSecond = totalTasks / 60;

    return {
      totalExecutions: this.executionMetrics.length,
      successfulExecutions: completed.length,
      failedExecutions: failed.length,
      averageExecutionTime: Math.round(averageTime),
      medianExecutionTime: Math.round(medianTime),
      p95ExecutionTime: Math.round(durations[p95Index] || 0),
      p99ExecutionTime: Math.round(durations[p99Index] || 0),
      successRate: Math.round(successRate * 1000) / 10, // percentage with 1 decimal
      tasksPerSecond: Math.round(tasksPerSecond * 10) / 10,
      sdkVsLegacyComparison: this.getComparisonMetrics()
    };
  }

  /**
   * Compare SDK vs Legacy performance
   */
  private getComparisonMetrics(): ComparisonMetrics {
    const sdkMetrics = this.executionMetrics.filter(m => m.method === 'SDK' && m.status === 'completed');
    const legacyMetrics = this.executionMetrics.filter(m => m.method === 'Legacy' && m.status === 'completed');

    const sdkAvg = sdkMetrics.length > 0
      ? sdkMetrics.reduce((sum, m) => sum + m.duration, 0) / sdkMetrics.length
      : 0;

    const legacyAvg = legacyMetrics.length > 0
      ? legacyMetrics.reduce((sum, m) => sum + m.duration, 0) / legacyMetrics.length
      : 0;

    const speedup = legacyAvg > 0 ? legacyAvg / sdkAvg : 1;

    const sdkTotal = this.executionMetrics.filter(m => m.method === 'SDK').length;
    const legacyTotal = this.executionMetrics.filter(m => m.method === 'Legacy').length;

    const sdkSuccessRate = sdkTotal > 0 ? (sdkMetrics.length / sdkTotal) : 0;
    const legacySuccessRate = legacyTotal > 0 ? (legacyMetrics.length / legacyTotal) : 0;

    let recommendation: 'use-sdk' | 'use-legacy' | 'mixed' = 'use-sdk';
    if (sdkSuccessRate < 0.9 && legacySuccessRate > sdkSuccessRate) {
      recommendation = 'use-legacy';
    } else if (speedup < 1.5 && sdkSuccessRate < 0.95) {
      recommendation = 'mixed';
    }

    return {
      sdkAverageTime: Math.round(sdkAvg),
      legacyAverageTime: Math.round(legacyAvg),
      speedupFactor: Math.round(speedup * 10) / 10,
      sdkSuccessRate: Math.round(sdkSuccessRate * 1000) / 10,
      legacySuccessRate: Math.round(legacySuccessRate * 1000) / 10,
      recommendation
    };
  }

  /**
   * Monitor SDK health
   */
  monitorSDKHealth(): SDKHealth {
    const recentMetrics = this.executionMetrics.slice(-20);
    const sdkMetrics = recentMetrics.filter(m => m.method === 'SDK');

    const failedCount = sdkMetrics.filter(m => m.status === 'failed').length;
    const errorRate = sdkMetrics.length > 0 ? failedCount / sdkMetrics.length : 0;

    const avgResponseTime = sdkMetrics.length > 0
      ? sdkMetrics.reduce((sum, m) => sum + m.duration, 0) / sdkMetrics.length
      : 0;

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= errorRate * 100; // Subtract error percentage
    healthScore -= this.consecutiveFailures * 10; // Subtract 10 points per consecutive failure
    if (avgResponseTime > 1000) {
      healthScore -= 20; // Subtract 20 points if slow
    }
    healthScore = Math.max(0, Math.min(100, healthScore));

    const recommendSwitchToLegacy =
      this.consecutiveFailures >= this.CONSECUTIVE_FAILURES_THRESHOLD ||
      errorRate > this.ERROR_RATE_THRESHOLD ||
      healthScore < 50;

    return {
      sdkAvailable: this.consecutiveFailures < this.CONSECUTIVE_FAILURES_THRESHOLD,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 1000) / 10,
      lastExecutionTime: this.lastExecutionTime,
      consecutiveFailures: this.consecutiveFailures,
      recommendSwitchToLegacy,
      healthScore: Math.round(healthScore)
    };
  }

  /**
   * Export metrics for logging
   */
  exportMetrics(): MetricsReport {
    const performanceStats = this.getPerformanceStats();
    const sdkHealth = this.monitorSDKHealth();
    const recentExecutions = this.executionMetrics.slice(-10);

    const recommendations: string[] = [];

    // Generate recommendations
    if (sdkHealth.recommendSwitchToLegacy) {
      recommendations.push('⚠️  High SDK failure rate detected - consider switching to legacy ParallelTaskManager');
    }

    if (performanceStats.sdkVsLegacyComparison.speedupFactor > 3) {
      recommendations.push('✅ SDK execution is 3x+ faster than legacy - excellent performance');
    }

    if (performanceStats.successRate < 95) {
      recommendations.push('⚠️  Success rate below 95% - investigate recent failures');
    }

    if (sdkHealth.averageResponseTime > 500) {
      recommendations.push('⏱️  Average response time > 500ms - consider optimizing task definitions');
    }

    if (performanceStats.tasksPerSecond < 10 && this.executionMetrics.length > 20) {
      recommendations.push('📉 Low throughput detected - check for bottlenecks');
    }

    return {
      timestamp: Date.now(),
      performanceStats,
      sdkHealth,
      recentExecutions,
      recommendations
    };
  }

  /**
   * Reset monitoring statistics
   */
  reset(): void {
    this.executionMetrics = [];
    this.consecutiveFailures = 0;
    this.lastExecutionTime = 0;
  }

  /**
   * Get recent execution history
   */
  getRecentExecutions(limit: number = 10): ExecutionMetric[] {
    return this.executionMetrics.slice(-limit);
  }

  private getEmptyStats(): PerformanceStats {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      medianExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      successRate: 0,
      tasksPerSecond: 0,
      sdkVsLegacyComparison: {
        sdkAverageTime: 0,
        legacyAverageTime: 0,
        speedupFactor: 1,
        sdkSuccessRate: 0,
        legacySuccessRate: 0,
        recommendation: 'use-sdk'
      }
    };
  }
}

export default SDKExecutionMonitor;
