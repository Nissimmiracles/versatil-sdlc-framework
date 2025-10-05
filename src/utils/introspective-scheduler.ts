/**
 * IntrospectiveScheduler - Automated scheduling system for IntrospectiveAgent
 *
 * This scheduler manages periodic execution of the IntrospectiveAgent to ensure
 * continuous framework monitoring and optimization without user intervention.
 */

import { IntrospectiveAgent } from '../agents/introspective-agent.js';
import { VERSATILLogger } from './logger.js';
import { EventEmitter } from 'events';

export interface SchedulerConfig {
  interval: number; // Interval in milliseconds
  maxConcurrentRuns: number; // Maximum concurrent introspection runs
  autoStart: boolean; // Whether to start automatically
  conditions: {
    minInterval: number; // Minimum time between runs
    maxExecutionTime: number; // Maximum allowed execution time
    skipOnHighLoad: boolean; // Skip if system is under high load
    skipOnLowActivity: boolean; // Skip if no recent framework activity
  };
}

export interface SchedulerMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageExecutionTime: number;
  lastRunTime: number;
  nextScheduledRun: number;
  currentlyRunning: boolean;
}

export class IntrospectiveScheduler extends EventEmitter {
  private agent: IntrospectiveAgent;
  private logger: VERSATILLogger;
  private config: SchedulerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private metrics: SchedulerMetrics;
  private runHistory: Array<{
    startTime: number;
    endTime: number;
    success: boolean;
    executionTime: number;
    improvements: number;
  }> = [];

  constructor(agent: IntrospectiveAgent, config?: Partial<SchedulerConfig>) {
    super();

    this.agent = agent;
    this.logger = VERSATILLogger.getInstance();

    // Default configuration
    this.config = {
      interval: 300000, // 5 minutes
      maxConcurrentRuns: 1,
      autoStart: true,
      conditions: {
        minInterval: 180000, // 3 minutes minimum
        maxExecutionTime: 120000, // 2 minutes maximum
        skipOnHighLoad: true,
        skipOnLowActivity: false
      },
      ...config
    };

    this.metrics = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageExecutionTime: 0,
      lastRunTime: 0,
      nextScheduledRun: Date.now() + this.config.interval,
      currentlyRunning: false
    };

    this.logger.info('IntrospectiveScheduler initialized', {
      interval: `${this.config.interval / 1000}s`,
      autoStart: this.config.autoStart,
      maxConcurrentRuns: this.config.maxConcurrentRuns
    }, 'IntrospectiveScheduler');

    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.intervalId) {
      this.logger.warning('Scheduler already running', {}, 'IntrospectiveScheduler');
      return;
    }

    this.logger.info('Starting IntrospectiveAgent scheduler', {
      interval: `${this.config.interval / 1000}s`,
      nextRun: new Date(this.metrics.nextScheduledRun).toISOString()
    }, 'IntrospectiveScheduler');

    this.intervalId = setInterval(() => {
      this.executeIntrospection();
    }, this.config.interval);

    this.emit('scheduler-started');
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;

      this.logger.info('IntrospectiveAgent scheduler stopped', {
        totalRuns: this.metrics.totalRuns,
        successRate: this.getSuccessRate()
      }, 'IntrospectiveScheduler');

      this.emit('scheduler-stopped');
    }
  }

  /**
   * Execute immediate introspection (bypasses scheduling)
   */
  public async executeNow(): Promise<void> {
    await this.executeIntrospection(true);
  }

  /**
   * Internal method to execute introspection with conditions
   */
  private async executeIntrospection(force: boolean = false): Promise<void> {
    // Check if already running
    if (this.isRunning && !force) {
      this.logger.info('Skipping introspection - already running', {}, 'IntrospectiveScheduler');
      return;
    }

    // Check minimum interval condition
    const timeSinceLastRun = Date.now() - this.metrics.lastRunTime;
    if (!force && timeSinceLastRun < this.config.conditions.minInterval) {
      this.logger.info('Skipping introspection - minimum interval not met', {
        timeSinceLastRun: `${timeSinceLastRun / 1000}s`,
        minInterval: `${this.config.conditions.minInterval / 1000}s`
      }, 'IntrospectiveScheduler');
      return;
    }

    // Check system load condition
    if (!force && this.config.conditions.skipOnHighLoad && this.isSystemUnderHighLoad()) {
      this.logger.info('Skipping introspection - system under high load', {}, 'IntrospectiveScheduler');
      return;
    }

    // Check activity condition
    if (!force && this.config.conditions.skipOnLowActivity && this.isLowActivity()) {
      this.logger.info('Skipping introspection - low framework activity', {}, 'IntrospectiveScheduler');
      return;
    }

    this.isRunning = true;
    this.metrics.currentlyRunning = true;
    this.metrics.totalRuns++;

    const startTime = Date.now();
    let success = false;
    let improvements = 0;

    try {
      this.logger.info('🔍 Executing scheduled introspection', {
        runNumber: this.metrics.totalRuns,
        forced: force
      }, 'IntrospectiveScheduler');

      this.emit('introspection-started', { runNumber: this.metrics.totalRuns });

      // Execute introspection with timeout
      const introspectionPromise = this.agent.activate({
        trigger: 'scheduled-introspection',
        content: '',
        userRequest: 'Scheduled framework health and performance analysis'
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Introspection timeout')), this.config.conditions.maxExecutionTime);
      });

      const result = await Promise.race([introspectionPromise, timeoutPromise]);

      if (result && typeof result === 'object' && 'context' in result) {
        improvements = (result as any).context?.optimizationsApplied || 0;
      }

      success = true;
      this.metrics.successfulRuns++;

      this.logger.info('✅ Scheduled introspection completed', {
        executionTime: `${Date.now() - startTime}ms`,
        improvements,
        confidence: result && typeof result === 'object' && 'context' in result ? (result as any).context?.confidence || 0 : 0
      }, 'IntrospectiveScheduler');

      this.emit('introspection-completed', {
        runNumber: this.metrics.totalRuns,
        success: true,
        executionTime: Date.now() - startTime,
        improvements
      });

    } catch (error) {
      this.metrics.failedRuns++;
      success = false;

      this.logger.error('❌ Scheduled introspection failed', {
        error: error instanceof Error ? error.message : String(error),
        executionTime: `${Date.now() - startTime}ms`,
        runNumber: this.metrics.totalRuns
      }, 'IntrospectiveScheduler');

      this.emit('introspection-failed', {
        runNumber: this.metrics.totalRuns,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      });

    } finally {
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Update metrics
      this.metrics.lastRunTime = endTime;
      this.metrics.nextScheduledRun = endTime + this.config.interval;
      this.metrics.currentlyRunning = false;
      this.isRunning = false;

      // Update average execution time
      this.metrics.averageExecutionTime = this.calculateAverageExecutionTime(executionTime);

      // Store run history
      this.runHistory.push({
        startTime,
        endTime,
        success,
        executionTime,
        improvements
      });

      // Keep only last 100 runs
      if (this.runHistory.length > 100) {
        this.runHistory = this.runHistory.slice(-100);
      }
    }
  }

  /**
   * Check if system is under high load
   */
  private isSystemUnderHighLoad(): boolean {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
      const cpuUsage = process.cpuUsage();

      // Simple heuristic: high load if heap usage > 80%
      return heapUsedPercent > 0.8;
    } catch {
      return false; // If we can't determine load, assume it's okay
    }
  }

  /**
   * Check if there's been low framework activity
   */
  private isLowActivity(): boolean {
    // Simple heuristic: check if there have been recent successful runs
    const recentRuns = this.runHistory.slice(-5);
    const recentSuccessfulRuns = recentRuns.filter(run => run.success && run.improvements > 0);

    // Consider low activity if last 5 runs had no improvements
    return recentSuccessfulRuns.length === 0 && recentRuns.length >= 3;
  }

  /**
   * Calculate rolling average execution time
   */
  private calculateAverageExecutionTime(newExecutionTime: number): number {
    const recentRuns = this.runHistory.slice(-10);
    const totalTime = recentRuns.reduce((sum, run) => sum + run.executionTime, 0) + newExecutionTime;
    return totalTime / (recentRuns.length + 1);
  }

  /**
   * Get success rate percentage
   */
  private getSuccessRate(): number {
    if (this.metrics.totalRuns === 0) return 0;
    return (this.metrics.successfulRuns / this.metrics.totalRuns) * 100;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): SchedulerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get run history
   */
  public getRunHistory(): typeof this.runHistory {
    return [...this.runHistory];
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const oldInterval = this.config.interval;
    this.config = { ...this.config, ...newConfig };

    this.logger.info('Scheduler configuration updated', {
      oldInterval: `${oldInterval / 1000}s`,
      newInterval: `${this.config.interval / 1000}s`,
      changes: Object.keys(newConfig)
    }, 'IntrospectiveScheduler');

    // Restart scheduler if interval changed and it's running
    if (newConfig.interval && newConfig.interval !== oldInterval && this.intervalId) {
      this.stop();
      this.start();
    }

    this.emit('config-updated', newConfig);
  }

  /**
   * Get health status of the scheduler
   */
  public getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check success rate
    const successRate = this.getSuccessRate();
    if (successRate < 80 && this.metrics.totalRuns > 5) {
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
      recommendations.push('Review introspection errors and adjust configuration');
    }

    // Check average execution time
    if (this.metrics.averageExecutionTime > this.config.conditions.maxExecutionTime * 0.8) {
      issues.push('High average execution time approaching timeout');
      recommendations.push('Consider increasing maxExecutionTime or optimizing introspection logic');
    }

    // Check if scheduler is stuck
    const timeSinceLastRun = Date.now() - this.metrics.lastRunTime;
    if (this.intervalId && timeSinceLastRun > this.config.interval * 2) {
      issues.push('Scheduler appears to be stuck or delayed');
      recommendations.push('Restart scheduler or check system performance');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Generate scheduler dashboard data
   */
  public generateDashboard(): {
    status: string;
    metrics: SchedulerMetrics;
    recentActivity: Array<{
      time: string;
      success: boolean;
      executionTime: number;
      improvements: number;
    }>;
    health: any;
    nextActions: string[];
  } {
    const recentActivity = this.runHistory.slice(-10).map(run => ({
      time: new Date(run.startTime).toISOString(),
      success: run.success,
      executionTime: run.executionTime,
      improvements: run.improvements
    }));

    const health = this.getHealthStatus();

    const nextActions: string[] = [];
    if (!this.intervalId) {
      nextActions.push('Start scheduler to enable automatic monitoring');
    }
    if (health.issues.length > 0) {
      nextActions.push('Address health issues for optimal performance');
    }
    if (this.metrics.totalRuns === 0) {
      nextActions.push('Execute initial introspection to establish baseline');
    }

    return {
      status: this.intervalId ? 'running' : 'stopped',
      metrics: this.getMetrics(),
      recentActivity,
      health,
      nextActions
    };
  }
}

// Export singleton instance creator
export function createIntrospectiveScheduler(
  agent: IntrospectiveAgent,
  config?: Partial<SchedulerConfig>
): IntrospectiveScheduler {
  return new IntrospectiveScheduler(agent, config);
}