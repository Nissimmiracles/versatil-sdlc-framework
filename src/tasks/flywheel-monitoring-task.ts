/**
 * VERSATIL OPERA v6.0 - Flywheel Monitoring Background Task
 *
 * Continuously monitors all 6 SDLC flywheels for health, momentum, and performance.
 * Runs as an SDK Background Task with 30-second intervals.
 *
 * Integrates with:
 * - FlywheelHealthMonitor (the actual monitoring agent)
 * - SynchronizationDashboard (existing monitoring infrastructure)
 * - VersatilOrchestratorAgent (main orchestrator)
 *
 * @module FlywheelMonitoringTask
 * @version 6.0.0
 */

import { EventEmitter } from 'events';
import { FlywheelHealthMonitor, HealthDashboard, HealthIssue } from '../agents/monitoring/flywheel-health-monitor.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import type { TaskPlanManager, TaskPlan } from '../planning/task-plan-manager.js';

export interface MonitoringTaskConfig {
  vectorStore: EnhancedVectorMemoryStore;  // Required for monitor
  monitoringInterval?: number;  // Milliseconds (default: 30000 = 30 seconds)
  enableAutoOptimization?: boolean;  // Auto-fix recoverable issues

  // NEW v6.1.0: Task tracking integration
  taskPlanManager?: TaskPlanManager;  // Optional: Connect to task tracking

  alertThresholds?: {
    criticalIssueCount: number;  // Alert if >= this many critical issues
    highIssueCount: number;      // Alert if >= this many high issues
    lowMomentumThreshold: number; // Alert if momentum < this value
  };
  integrations?: {
    syncDashboard: boolean;  // Update SynchronizationDashboard
    userNotifications: boolean;  // Send user notifications
    ragLogging: boolean;  // Log to RAG for pattern learning
    taskTracking: boolean;  // NEW v6.1.0: Track plan executions
  };
}

export interface MonitoringTaskStatus {
  running: boolean;
  lastCheck: number;
  totalChecks: number;
  issuesDetected: number;
  autoOptimizationsRun: number;
  currentDashboard: HealthDashboard | null;
  uptimeSeconds: number;
}

export interface MonitoringAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  issues?: HealthIssue[];
  actionTaken?: string;
}

export class FlywheelMonitoringTask extends EventEmitter {
  private monitor: FlywheelHealthMonitor;
  private taskInterval: NodeJS.Timeout | null = null;
  private config: MonitoringTaskConfig;
  private status: MonitoringTaskStatus;
  private startTime: number = 0;
  private alertHistory: MonitoringAlert[] = [];

  // NEW v6.1.0: Task tracking integration
  private taskPlanManager?: TaskPlanManager;
  private trackedPlans = new Map<string, { agent: string; startTime: number }>();

  constructor(config: MonitoringTaskConfig) {
    super();

    if (!config.vectorStore) {
      throw new Error('[FlywheelMonitoringTask] vectorStore is required in config');
    }

    // Initialize monitoring agent with vector store
    this.monitor = new FlywheelHealthMonitor(config.vectorStore);

    // NEW v6.1.0: Store TaskPlanManager reference
    this.taskPlanManager = config.taskPlanManager;

    // Default configuration
    this.config = {
      vectorStore: config.vectorStore,
      monitoringInterval: config.monitoringInterval || 30000, // 30 seconds
      enableAutoOptimization: config.enableAutoOptimization ?? true,
      taskPlanManager: config.taskPlanManager,
      alertThresholds: {
        criticalIssueCount: config.alertThresholds?.criticalIssueCount || 1,
        highIssueCount: config.alertThresholds?.highIssueCount || 3,
        lowMomentumThreshold: config.alertThresholds?.lowMomentumThreshold || 30
      },
      integrations: {
        syncDashboard: config.integrations?.syncDashboard ?? true,
        userNotifications: config.integrations?.userNotifications ?? true,
        ragLogging: config.integrations?.ragLogging ?? true,
        taskTracking: config.integrations?.taskTracking ?? true  // NEW v6.1.0
      }
    };

    // Initialize status
    this.status = {
      running: false,
      lastCheck: 0,
      totalChecks: 0,
      issuesDetected: 0,
      autoOptimizationsRun: 0,
      currentDashboard: null,
      uptimeSeconds: 0
    };

    // Subscribe to monitor events
    this.setupMonitorListeners();

    // NEW v6.1.0: Subscribe to TaskPlanManager events
    if (this.taskPlanManager && this.config.integrations.taskTracking) {
      this.setupTaskPlanListeners();
    }
  }

  /**
   * Setup event listeners for the monitor
   */
  private setupMonitorListeners(): void {
    this.monitor.on('health-check', (dashboard: HealthDashboard) => {
      this.emit('dashboard-updated', dashboard);
    });

    this.monitor.on('health-warning', (data: { health: number; issues: HealthIssue[] }) => {
      console.log(`[FlywheelMonitoringTask] Health warning: ${data.health}% (${data.issues.length} issues)`);
      this.emit('health-warning', data.issues);
    });

    this.monitor.on('health-critical', (issues: HealthIssue[]) => {
      console.error(`[FlywheelMonitoringTask] Health CRITICAL: ${issues.length} critical issue(s)`);
      this.emit('health-critical', issues);
    });

    this.monitor.on('auto-optimization', (result: any) => {
      this.status.autoOptimizationsRun++;
      this.emit('auto-optimization-complete', result);
    });
  }

  /**
   * Start the background monitoring task
   */
  async start(): Promise<void> {
    if (this.taskInterval) {
      console.log('[FlywheelMonitoringTask] Already running');
      return;
    }

    console.log(`[FlywheelMonitoringTask] Starting with ${this.config.monitoringInterval}ms intervals`);

    this.startTime = Date.now();
    this.status.running = true;

    // Start the FlywheelHealthMonitor
    this.monitor.startMonitoring();

    // Run our background task loop
    this.taskInterval = setInterval(async () => {
      await this.runMonitoringCycle();
    }, this.config.monitoringInterval);

    // Run first check immediately
    await this.runMonitoringCycle();

    // Emit start event
    this.emit('task-started', {
      interval: this.config.monitoringInterval,
      timestamp: Date.now()
    });
  }

  /**
   * Stop the background monitoring task
   */
  async stop(): Promise<void> {
    if (!this.taskInterval) {
      console.log('[FlywheelMonitoringTask] Not running');
      return;
    }

    console.log('[FlywheelMonitoringTask] Stopping...');

    // Stop interval
    clearInterval(this.taskInterval);
    this.taskInterval = null;

    // Stop monitor
    this.monitor.stopMonitoring();

    // Update status
    this.status.running = false;

    // Emit stop event
    this.emit('task-stopped', {
      totalChecks: this.status.totalChecks,
      issuesDetected: this.status.issuesDetected,
      autoOptimizationsRun: this.status.autoOptimizationsRun,
      uptimeSeconds: this.status.uptimeSeconds,
      timestamp: Date.now()
    });
  }

  /**
   * Run a single monitoring cycle
   */
  private async runMonitoringCycle(): Promise<void> {
    try {
      // Update uptime
      if (this.startTime > 0) {
        this.status.uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      }

      // Run health check
      const dashboard = await this.monitor.runHealthCheck();

      // Update status
      this.status.lastCheck = Date.now();
      this.status.totalChecks++;
      this.status.currentDashboard = dashboard;
      this.status.issuesDetected += dashboard.issues.length;

      // Analyze dashboard and take actions
      await this.analyzeDashboard(dashboard);

      // Integration: Update SynchronizationDashboard
      if (this.config.integrations.syncDashboard) {
        this.updateSyncDashboard(dashboard);
      }

      // Integration: Log to RAG for pattern learning
      if (this.config.integrations.ragLogging) {
        await this.logToRAG(dashboard);
      }

    } catch (error) {
      console.error('[FlywheelMonitoringTask] Monitoring cycle failed:', error);
      this.emit('monitoring-error', { error, timestamp: Date.now() });
    }
  }

  /**
   * Analyze dashboard and trigger alerts/actions
   */
  private async analyzeDashboard(dashboard: HealthDashboard): Promise<void> {
    const { issues, overall, recommendations } = dashboard;

    // Count issues by severity
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    // Check alert thresholds
    if (criticalIssues.length >= this.config.alertThresholds.criticalIssueCount) {
      await this.sendAlert({
        severity: 'critical',
        title: '🚨 Critical Flywheel Issues Detected',
        message: `${criticalIssues.length} critical issue(s) require immediate attention`,
        timestamp: Date.now(),
        issues: criticalIssues
      });
    } else if (highIssues.length >= this.config.alertThresholds.highIssueCount) {
      await this.sendAlert({
        severity: 'warning',
        title: '⚠️ Multiple Flywheel Health Issues',
        message: `${highIssues.length} high-severity issue(s) detected`,
        timestamp: Date.now(),
        issues: highIssues
      });
    }

    // Check overall health (overall is 0-100 health score)
    if (overall < this.config.alertThresholds.lowMomentumThreshold) {
      await this.sendAlert({
        severity: 'warning',
        title: '📉 Low Overall Flywheel Health',
        message: `System health at ${Math.round(overall)}% (target: >${this.config.alertThresholds.lowMomentumThreshold}%)`,
        timestamp: Date.now()
      });
    }

    // Auto-optimization if enabled
    if (this.config.enableAutoOptimization && issues.length > 0) {
      const recoverableIssues = issues.filter(i => i.autoRecoverable);
      if (recoverableIssues.length > 0) {
        console.log(`[FlywheelMonitoringTask] Auto-optimizing ${recoverableIssues.length} recoverable issue(s)`);
        // Note: AutoOptimize is called internally by FlywheelHealthMonitor
        // We just track that it happened
      }
    }
  }

  /**
   * Send alert to user
   */
  private async sendAlert(alert: MonitoringAlert): Promise<void> {
    // Store in history
    this.alertHistory.push(alert);

    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    // Emit alert event
    this.emit('alert', alert);

    // User notification if enabled
    if (this.config.integrations.userNotifications) {
      this.emit('user-notification', {
        level: alert.severity === 'critical' ? 'error' : alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp
      });
    }

    console.log(`[FlywheelMonitoringTask] Alert: ${alert.title}`);
  }

  /**
   * Update SynchronizationDashboard (existing monitoring infrastructure)
   */
  private updateSyncDashboard(dashboard: HealthDashboard): void {
    // Integration point with existing SynchronizationDashboard
    // In real implementation, would call SynchronizationDashboard.updateFlywheelHealth()

    this.emit('sync-dashboard-update', {
      flywheelHealth: dashboard.flywheels,
      overallHealth: dashboard.overall,
      issues: dashboard.issues,
      timestamp: dashboard.timestamp
    });
  }

  /**
   * Log monitoring data to RAG for pattern learning
   */
  private async logToRAG(dashboard: HealthDashboard): Promise<void> {
    // Integration point with RAGEnabledAgent
    // Store patterns about:
    // - Which flywheels tend to have issues
    // - What optimizations work
    // - Momentum trends over time

    const ragEntry = {
      type: 'flywheel_health_log',
      timestamp: dashboard.timestamp,
      overallHealth: dashboard.overall,
      issueCount: dashboard.issues.length,
      criticalIssueCount: dashboard.issues.filter(i => i.severity === 'critical').length,
      topRecommendations: dashboard.recommendations.slice(0, 3),
      flywheelStates: Object.entries(dashboard.flywheels).map(([name, metrics]) => ({
        name,
        momentum: metrics.momentum,
        successRate: metrics.successRate
      }))
    };

    this.emit('rag-log', ragEntry);
  }

  /**
   * Get current task status
   */
  getStatus(): MonitoringTaskStatus {
    return { ...this.status };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): MonitoringAlert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get current dashboard
   */
  getCurrentDashboard(): HealthDashboard | null {
    return this.status.currentDashboard;
  }

  /**
   * Manual trigger of health check (outside normal schedule)
   */
  async triggerManualCheck(): Promise<HealthDashboard> {
    console.log('[FlywheelMonitoringTask] Manual health check triggered');
    const dashboard = await this.monitor.runHealthCheck();
    this.status.currentDashboard = dashboard;
    return dashboard;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<MonitoringTaskConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      alertThresholds: {
        ...this.config.alertThresholds,
        ...updates.alertThresholds
      },
      integrations: {
        ...this.config.integrations,
        ...updates.integrations
      }
    };

    console.log('[FlywheelMonitoringTask] Configuration updated');
    this.emit('config-updated', this.config);
  }

  // ==========================================================================
  // NEW v6.1.0: TASK PLAN TRACKING INTEGRATION
  // ==========================================================================

  /**
   * Setup event listeners for TaskPlanManager
   */
  private setupTaskPlanListeners(): void {
    if (!this.taskPlanManager) return;

    console.log('[FlywheelMonitoringTask] 🔗 Task tracking integration enabled');

    // Listen to plan lifecycle events
    this.taskPlanManager.on('plan-started', (plan: TaskPlan) => {
      this.onPlanStarted(plan);
    });

    this.taskPlanManager.on('plan-completed', (plan: TaskPlan) => {
      this.onPlanCompleted(plan);
    });

    this.taskPlanManager.on('plan-failed', ({ plan, error }: { plan: TaskPlan; error: Error }) => {
      this.onPlanFailed(plan, error);
    });

    this.taskPlanManager.on('task-completed', ({ task, plan }: { task: any; plan: TaskPlan }) => {
      this.onTaskCompleted(task, plan);
    });
  }

  /**
   * Handle plan started event
   */
  private onPlanStarted(plan: TaskPlan): void {
    console.log(`[FlywheelMonitoringTask] 📋 Plan started: ${plan.rootTask} (${plan.agent})`);

    // Track plan for metrics
    this.trackedPlans.set(plan.id, {
      agent: plan.agent,
      startTime: Date.now()
    });

    // Emit event
    this.emit('plan-tracking-started', {
      planId: plan.id,
      agent: plan.agent,
      taskCount: plan.tasks.length,
      estimatedDuration: plan.estimatedDuration
    });
  }

  /**
   * Handle plan completed event - Record execution metrics for flywheel
   */
  private async onPlanCompleted(plan: TaskPlan): Promise<void> {
    const tracked = this.trackedPlans.get(plan.id);
    if (!tracked) return;

    const duration = plan.actualDuration || 0;
    const success = plan.status === 'completed';
    const patternsLearned = plan.tasks.length; // Each task represents a potential pattern

    console.log(`[FlywheelMonitoringTask] ✅ Plan completed: ${plan.rootTask}`);
    console.log(`   Duration: ${duration.toFixed(1)}min | Tasks: ${plan.tasks.length} | Agent: ${plan.agent}`);

    // Record flywheel execution metrics
    await this.recordFlywheelExecution({
      flywheel: this.mapAgentToFlywheel(plan.agent),
      agent: plan.agent,
      duration,
      success,
      patterns: patternsLearned,
      estimationAccuracy: this.calculateEstimationAccuracy(plan)
    });

    // Store metrics in RAG for pattern learning
    if (this.config.integrations.ragLogging) {
      await this.logPlanExecutionToRAG(plan);
    }

    // Cleanup
    this.trackedPlans.delete(plan.id);

    // Emit event
    this.emit('plan-tracking-completed', {
      planId: plan.id,
      agent: plan.agent,
      duration,
      success,
      patterns: patternsLearned
    });
  }

  /**
   * Handle plan failed event
   */
  private async onPlanFailed(plan: TaskPlan, error: Error): Promise<void> {
    const tracked = this.trackedPlans.get(plan.id);
    if (!tracked) return;

    const duration = (Date.now() - tracked.startTime) / 60000; // Convert to minutes

    console.error(`[FlywheelMonitoringTask] ❌ Plan failed: ${plan.rootTask}`);
    console.error(`   Reason: ${error.message}`);

    // Record failure for flywheel metrics
    await this.recordFlywheelExecution({
      flywheel: this.mapAgentToFlywheel(plan.agent),
      agent: plan.agent,
      duration,
      success: false,
      patterns: 0, // Failed execution doesn't add patterns
      estimationAccuracy: 0
    });

    // Cleanup
    this.trackedPlans.delete(plan.id);

    // Emit event
    this.emit('plan-tracking-failed', {
      planId: plan.id,
      agent: plan.agent,
      error: error.message
    });
  }

  /**
   * Handle task completed event (optional granular tracking)
   */
  private onTaskCompleted(task: any, plan: TaskPlan): void {
    // Optional: Track individual task completion for more granular metrics
    // Currently just logging, can be expanded for detailed flywheel metrics
    if (task.isSubagentTask) {
      console.log(`[FlywheelMonitoringTask]    ↳ Subtask: ${task.description} (${task.progress}%)`);
    }
  }

  /**
   * Record flywheel execution metrics
   */
  private async recordFlywheelExecution(metrics: {
    flywheel: string;
    agent: string;
    duration: number;
    success: boolean;
    patterns: number;
    estimationAccuracy: number;
  }): Promise<void> {
    try {
      // Store execution metrics in RAG for flywheel health monitor to query
      await this.config.vectorStore.storeMemory({
        content: JSON.stringify({
          type: 'flywheel_execution',
          flywheel: metrics.flywheel,
          agent: metrics.agent,
          executionTime: metrics.duration,
          success: metrics.success,
          patternsAdded: metrics.patterns,
          accuracy: metrics.estimationAccuracy,
          timestamp: Date.now()
        }),
        contentType: 'text' as const,  // v6.1: Use 'text' for metrics
        metadata: {
          agentId: 'flywheel-monitor',
          tags: [metrics.flywheel, 'metrics', 'execution', metrics.agent],
          executionTime: metrics.duration,
          success: metrics.success,
          timestamp: Date.now()
        }
      });

      console.log(`[FlywheelMonitoringTask] 📊 Recorded ${metrics.flywheel} flywheel execution`);

    } catch (error) {
      console.error('[FlywheelMonitoringTask] Failed to record flywheel execution:', error);
    }
  }

  /**
   * Log plan execution to RAG for pattern learning
   */
  private async logPlanExecutionToRAG(plan: TaskPlan): Promise<void> {
    try {
      // Store complete plan execution for pattern learning
      await this.config.vectorStore.storeMemory({
        content: `Plan: ${plan.rootTask}\nAgent: ${plan.agent}\nTasks: ${plan.tasks.length}\nDuration: ${plan.actualDuration}min\nSuccess: ${plan.status === 'completed'}`,
        contentType: 'text' as const,
        metadata: {
          agentId: plan.agent,
          tags: ['plan_execution', plan.agent, plan.status, 'pattern'],
          planId: plan.id,
          rootTask: plan.rootTask,
          taskCount: plan.tasks.length,
          duration: plan.actualDuration,
          estimatedDuration: plan.estimatedDuration,
          accuracy: this.calculateEstimationAccuracy(plan),
          involvedAgents: plan.involvedAgents,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('[FlywheelMonitoringTask] Failed to log plan to RAG:', error);
    }
  }

  /**
   * Map agent ID to flywheel name
   */
  private mapAgentToFlywheel(agent: string): string {
    const mapping: Record<string, string> = {
      'alex-ba': 'requirements',
      'sarah-pm': 'requirements',
      'james-frontend': 'design',
      'marcus-backend': 'design',
      'maria-qa': 'testing',
      'dr-ai-ml': 'development',
      'oliver-onboarding': 'evolution'
    };

    return mapping[agent] || 'development';
  }

  /**
   * Calculate estimation accuracy (0-1)
   */
  private calculateEstimationAccuracy(plan: TaskPlan): number {
    if (!plan.actualDuration || !plan.estimatedDuration) return 0;

    const difference = Math.abs(plan.actualDuration - plan.estimatedDuration);
    const accuracy = 1 - (difference / plan.estimatedDuration);

    return Math.max(0, Math.min(1, accuracy)); // Clamp to 0-1
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.stop();
    this.monitor.destroy();
    this.removeAllListeners();

    // Cleanup task plan listeners
    if (this.taskPlanManager) {
      this.taskPlanManager.removeAllListeners();
    }
  }
}
