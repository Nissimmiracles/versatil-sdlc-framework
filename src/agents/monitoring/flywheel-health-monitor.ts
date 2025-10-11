/**
 * VERSATIL OPERA v6.1 - Flywheel Health Monitor Agent
 *
 * Monitors all 6 flywheels (agent coordination patterns) for:
 * - Momentum degradation
 * - Bottlenecks and slow execution
 * - Knowledge accumulation issues
 * - Performance anomalies
 * - Cross-flywheel inefficiencies
 * - Task-level execution metrics (NEW v6.1)
 *
 * Auto-optimizes and alerts on critical issues.
 *
 * @module FlywheelHealthMonitor
 * @version 6.1.0
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
import type { TaskPlan, Task } from '../../planning/task-plan-manager.js';

export interface FlywheelMetrics {
  requirements: FlywheelHealth;
  design: FlywheelHealth;
  development: FlywheelHealth;
  testing: FlywheelHealth;
  deployment: FlywheelHealth;
  evolution: FlywheelHealth;
}

export interface FlywheelHealth {
  momentum: number;           // 0-100 (how fast it's spinning)
  patternCount: number;       // Total patterns learned
  avgExecutionTime: number;   // Milliseconds
  successRate: number;        // 0-1 (success ratio)
  lastActivation: number;     // Timestamp
  turns: number;              // Total activations

  // NEW v6.1: Task-level metrics
  taskMetrics?: {
    avgTasksPerPlan: number;
    avgSubtasksPerTask: number;
    taskCompletionRate: number;
    estimationAccuracy: number;  // 0-1 (how accurate duration estimates are)
    parallelTasksAvg: number;    // Average parallel task count
  };
}

export interface HealthIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  flywheel: string;
  type: 'low_momentum' | 'high_failure_rate' | 'slow_execution' | 'stagnant_learning';
  description: string;
  impact: string;
  recommendation: string;
  autoRecoverable: boolean;
}

export interface HealthDashboard {
  overall: number;            // 0-100 overall health
  flywheels: FlywheelMetrics;
  issues: HealthIssue[];
  recommendations: string[];
  timestamp: number;
}

export class FlywheelHealthMonitor extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: Map<string, FlywheelHealth[]> = new Map();
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds
  private readonly HISTORY_RETENTION = 100; // Keep last 100 data points per flywheel

  // NEW v6.1: Task plan integration
  private taskPlanManager?: any;
  private taskLevelMetrics: Map<string, any[]> = new Map();  // flywheel -> task metrics

  constructor(vectorStore: EnhancedVectorMemoryStore, taskPlanManager?: any) {
    super();
    this.vectorStore = vectorStore;

    // NEW v6.1: Task plan integration
    if (taskPlanManager) {
      this.taskPlanManager = taskPlanManager;
      this.setupTaskPlanListeners();
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.log('[FlywheelHealthMonitor] Already monitoring');
      return;
    }

    console.log('[FlywheelHealthMonitor] Starting continuous monitoring (30s intervals)');

    this.monitoringInterval = setInterval(async () => {
      await this.runHealthCheck();
    }, this.MONITORING_INTERVAL);

    // Run immediately
    this.runHealthCheck().catch(console.error);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[FlywheelHealthMonitor] Monitoring stopped');
    }
  }

  /**
   * Run complete health check
   */
  async runHealthCheck(): Promise<HealthDashboard> {
    try {
      // 1. Collect metrics for all flywheels
      const flywheelMetrics = await this.collectFlywheelMetrics();

      // 2. Store in history
      this.storeMetricsHistory(flywheelMetrics);

      // 3. Detect issues
      const issues = this.detectIssues(flywheelMetrics);

      // 4. Auto-optimize if recoverable
      if (issues.length > 0) {
        await this.autoOptimize(issues.filter(i => i.autoRecoverable));
      }

      // 5. Generate recommendations
      const recommendations = this.generateRecommendations(flywheelMetrics, issues);

      // 6. Calculate overall health
      const overallHealth = this.calculateOverallHealth(flywheelMetrics, issues);

      // 7. Create dashboard
      const dashboard: HealthDashboard = {
        overall: overallHealth,
        flywheels: flywheelMetrics,
        issues,
        recommendations,
        timestamp: Date.now()
      };

      // 8. Emit events
      this.emit('health-check', dashboard);

      if (overallHealth < 70) {
        this.emit('health-warning', { health: overallHealth, issues });
      }

      if (issues.some(i => i.severity === 'critical')) {
        this.emit('health-critical', issues.filter(i => i.severity === 'critical'));
      }

      return dashboard;

    } catch (error) {
      console.error('[FlywheelHealthMonitor] Health check failed:', error);
      throw error;
    }
  }

  /**
   * Collect metrics for all flywheels
   */
  private async collectFlywheelMetrics(): Promise<FlywheelMetrics> {
    return {
      requirements: await this.collectFlywheelHealth(['alex-ba', 'sarah-pm'], 'requirements'),
      design: await this.collectFlywheelHealth(['james-frontend', 'marcus-backend'], 'design'),
      development: await this.collectFlywheelHealth(['all'], 'development'),
      testing: await this.collectFlywheelHealth(['maria-qa'], 'testing'),
      deployment: await this.collectFlywheelHealth(['marcus-backend', 'sarah-pm'], 'deployment'),
      evolution: await this.collectFlywheelHealth(['introspective'], 'evolution')
    };
  }

  /**
   * Collect health metrics for a specific flywheel
   */
  private async collectFlywheelHealth(agents: string[], flywheelName: string): Promise<FlywheelHealth> {
    try {
      // Query RAG for execution metrics
      const metricsQuery = {
        query: `${flywheelName} flywheel execution metrics success rate`,
        queryType: 'semantic' as const,
        agentId: 'flywheel-monitor',
        topK: 50,
        filters: {
          tags: [flywheelName, 'metrics', ...agents],
          contentTypes: ['metrics' as const]
        }
      };

      const metricsResult = await this.vectorStore.queryMemories(metricsQuery);
      const metrics = metricsResult.documents || [];

      // Calculate from metrics
      const patternCount = await this.getPatternCount(flywheelName);
      const avgExecutionTime = this.calculateAvgExecutionTime(metrics);
      const successRate = this.calculateSuccessRate(metrics);
      const lastActivation = this.getLastActivation(metrics);
      const turns = metrics.length;

      // Calculate momentum
      const momentum = await this.calculateMomentum(patternCount, turns, successRate);

      return {
        momentum,
        patternCount,
        avgExecutionTime,
        successRate,
        lastActivation,
        turns
      };

    } catch (error) {
      console.warn(`[FlywheelHealthMonitor] Failed to collect health for ${flywheelName}:`, error);
      return {
        momentum: 0,
        patternCount: 0,
        avgExecutionTime: 0,
        successRate: 0,
        lastActivation: 0,
        turns: 0
      };
    }
  }

  /**
   * Calculate momentum
   * Formula: (patterns / turns) * successRate * 100
   */
  private async calculateMomentum(
    patternCount: number,
    turns: number,
    successRate: number
  ): Promise<number> {
    if (turns === 0) return 0;

    // Patterns per turn * success rate * 100
    const rawMomentum = (patternCount / turns) * successRate * 100;

    // Normalize to 0-100 scale
    return Math.min(Math.max(rawMomentum, 0), 100);
  }

  /**
   * Get pattern count for flywheel
   */
  private async getPatternCount(flywheelName: string): Promise<number> {
    try {
      const patternsQuery = {
        query: `${flywheelName} patterns learned`,
        queryType: 'semantic' as const,
        agentId: 'flywheel-monitor',
        topK: 1000,
        filters: {
          tags: [flywheelName, 'pattern'],
          contentTypes: ['code' as const, 'text' as const]
        }
      };

      const result = await this.vectorStore.queryMemories(patternsQuery);
      return result.documents?.length || 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate average execution time from metrics
   */
  private calculateAvgExecutionTime(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const times = metrics
      .filter(m => m.metadata?.executionTime)
      .map(m => m.metadata.executionTime);

    if (times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * Calculate success rate from metrics
   */
  private calculateSuccessRate(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const successes = metrics.filter(m => m.metadata?.success === true).length;
    return successes / metrics.length;
  }

  /**
   * Get last activation timestamp
   */
  private getLastActivation(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const timestamps = metrics
      .filter(m => m.metadata?.timestamp)
      .map(m => m.metadata.timestamp);

    return timestamps.length > 0 ? Math.max(...timestamps) : 0;
  }

  /**
   * Store metrics in history for trend analysis
   */
  private storeMetricsHistory(metrics: FlywheelMetrics): void {
    for (const [flywheel, health] of Object.entries(metrics)) {
      if (!this.metricsHistory.has(flywheel)) {
        this.metricsHistory.set(flywheel, []);
      }

      const history = this.metricsHistory.get(flywheel)!;
      history.push(health);

      // Keep only last N data points
      if (history.length > this.HISTORY_RETENTION) {
        history.shift();
      }
    }
  }

  /**
   * Detect health issues
   */
  private detectIssues(metrics: FlywheelMetrics): HealthIssue[] {
    const issues: HealthIssue[] = [];

    for (const [flywheelName, health] of Object.entries(metrics)) {
      // Issue 1: Low momentum after 50 turns
      if (health.momentum < 20 && health.turns > 50) {
        issues.push({
          severity: 'critical',
          flywheel: flywheelName,
          type: 'low_momentum',
          description: `${flywheelName} flywheel momentum critically low (${Math.round(health.momentum)}%)`,
          impact: 'Slow performance, poor pattern reuse, user frustration',
          recommendation: 'Investigate pattern library quality, enrich with more examples',
          autoRecoverable: true
        });
      }

      // Issue 2: High failure rate
      if (health.successRate < 0.80 && health.turns > 10) {
        issues.push({
          severity: 'high',
          flywheel: flywheelName,
          type: 'high_failure_rate',
          description: `${flywheelName} success rate ${Math.round(health.successRate * 100)}% (target: >= 95%)`,
          impact: 'User frustration, wasted tokens, poor reliability',
          recommendation: 'Review agent configurations, check recent error logs',
          autoRecoverable: false
        });
      }

      // Issue 3: Slow execution
      if (health.avgExecutionTime > 3000) {
        issues.push({
          severity: 'medium',
          flywheel: flywheelName,
          type: 'slow_execution',
          description: `${flywheelName} execution ${Math.round(health.avgExecutionTime)}ms (target: < 2000ms)`,
          impact: 'Poor user experience, IDE slowdown',
          recommendation: 'Enable prompt caching, optimize context retrieval',
          autoRecoverable: true
        });
      }

      // Issue 4: Stagnant learning
      if (health.turns > 100 && health.patternCount < health.turns * 0.1) {
        issues.push({
          severity: 'low',
          flywheel: flywheelName,
          type: 'stagnant_learning',
          description: `${flywheelName} learning stagnant (${health.patternCount} patterns in ${health.turns} turns)`,
          impact: 'Momentum won\'t improve, limited value over time',
          recommendation: 'Review pattern storage logic, encourage diverse usage',
          autoRecoverable: false
        });
      }
    }

    return issues;
  }

  /**
   * Auto-optimize recoverable issues
   */
  private async autoOptimize(issues: HealthIssue[]): Promise<void> {
    for (const issue of issues) {
      try {
        console.log(`[FlywheelHealthMonitor] Auto-optimizing ${issue.type} for ${issue.flywheel}`);

        switch (issue.type) {
          case 'low_momentum':
            await this.enrichPatternLibrary(issue.flywheel);
            break;

          case 'slow_execution':
            // Log recommendation for user to enable caching
            this.emit('optimization-recommendation', {
              flywheel: issue.flywheel,
              action: 'enable_prompt_caching',
              reason: 'Slow execution detected'
            });
            break;
        }

      } catch (error) {
        console.error(`[FlywheelHealthMonitor] Auto-optimization failed:`, error);
      }
    }
  }

  /**
   * Enrich pattern library for flywheel
   */
  private async enrichPatternLibrary(flywheelName: string): Promise<void> {
    // Query for successful patterns from other flywheels
    const crossFlywheelPatterns = await this.vectorStore.queryMemories({
      query: `successful patterns examples best practices`,
      queryType: 'semantic',
      agentId: 'flywheel-monitor',
      topK: 20,
      filters: {
        tags: ['pattern', 'success'],
        contentTypes: ['code', 'text']
      }
    });

    // Tag them for the target flywheel
    for (const pattern of crossFlywheelPatterns.documents || []) {
      if (pattern.metadata?.tags) {
        pattern.metadata.tags.push(flywheelName);
        // Note: In real implementation, would update in vector store
      }
    }

    this.emit('pattern-library-enriched', { flywheel: flywheelName, count: crossFlywheelPatterns.documents?.length || 0 });
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(metrics: FlywheelMetrics, issues: HealthIssue[]): string[] {
    const recommendations: string[] = [];

    // General health recommendations
    const avgMomentum = Object.values(metrics).reduce((sum, h) => sum + h.momentum, 0) / 6;

    if (avgMomentum < 40) {
      recommendations.push('📈 Overall momentum low - Continue using framework to build pattern library');
    }

    if (avgMomentum >= 70) {
      recommendations.push('🔥 High momentum! Framework is running efficiently');
    }

    // Issue-specific recommendations
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`⚠️ ${criticalIssues.length} critical issue(s) require attention`);
    }

    return recommendations;
  }

  /**
   * Calculate overall framework health
   */
  private calculateOverallHealth(metrics: FlywheelMetrics, issues: HealthIssue[]): number {
    // Average momentum across all flywheels
    const avgMomentum = Object.values(metrics).reduce((sum, h) => sum + h.momentum, 0) / 6;

    // Penalty for issues
    let penalty = 0;
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': penalty += 20; break;
        case 'high': penalty += 10; break;
        case 'medium': penalty += 5; break;
        case 'low': penalty += 2; break;
      }
    });

    return Math.max(avgMomentum - penalty, 0);
  }

  /**
   * Get current health dashboard
   */
  async getCurrentHealth(): Promise<HealthDashboard> {
    return this.runHealthCheck();
  }

  /**
   * NEW v6.1: Setup task plan listeners to collect task-level metrics
   */
  private setupTaskPlanListeners(): void {
    if (!this.taskPlanManager) return;

    console.log('[FlywheelHealthMonitor] Setting up TaskPlanManager listeners for task-level metrics');

    this.taskPlanManager.on('plan-completed', (plan: TaskPlan) => {
      this.recordTaskLevelMetrics(plan).catch(console.error);
    });
  }

  /**
   * NEW v6.1: Record task-level metrics from plan execution
   */
  private async recordTaskLevelMetrics(plan: TaskPlan): Promise<void> {
    try {
      const flywheel = this.mapAgentToFlywheel(plan.agent);

      // Calculate task-level metrics
      const metrics = {
        planId: plan.id,
        agent: plan.agent,
        taskCount: plan.tasks.length,
        subtaskCount: this.countSubtasks(plan.tasks),
        completedTasks: plan.tasks.filter(t => t.status === 'completed').length,
        failedTasks: plan.tasks.filter(t => t.status === 'failed').length,
        estimatedDuration: plan.estimatedDuration,
        actualDuration: plan.actualDuration || 0,
        parallelTasks: this.countParallelTasks(plan.tasks),
        timestamp: Date.now()
      };

      // Store in history
      if (!this.taskLevelMetrics.has(flywheel)) {
        this.taskLevelMetrics.set(flywheel, []);
      }
      const history = this.taskLevelMetrics.get(flywheel)!;
      history.push(metrics);

      // Keep only last 100 data points
      if (history.length > 100) {
        history.shift();
      }

      // Store in RAG for pattern learning
      await this.vectorStore.storeMemory({
        content: JSON.stringify({
          type: 'task_level_metrics',
          flywheel,
          ...metrics
        }),
        contentType: 'text',  // v6.1: Use 'text' for metrics
        metadata: {
          agentId: 'flywheel-monitor',
          tags: [flywheel, 'task-metrics', plan.agent, 'v6.1'],
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('[FlywheelHealthMonitor] Failed to record task-level metrics:', error);
    }
  }

  /**
   * NEW v6.1: Count total subtasks in plan
   */
  private countSubtasks(tasks: Task[]): number {
    let count = 0;

    const traverse = (task: Task) => {
      if (task.subtasks) {
        count += task.subtasks.length;
        task.subtasks.forEach(traverse);
      }
    };

    tasks.forEach(traverse);
    return count;
  }

  /**
   * NEW v6.1: Count parallel tasks in plan
   */
  private countParallelTasks(tasks: Task[]): number {
    // Tasks without dependencies can run in parallel
    // Note: Task type may not have dependencies field, count all for now
    return tasks.length;
  }

  /**
   * NEW v6.1: Map agent to flywheel (7 agents → 6 flywheels)
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
   * NEW v6.1: Calculate task-level metrics for flywheel
   */
  private calculateTaskMetrics(flywheelName: string): FlywheelHealth['taskMetrics'] {
    const metrics = this.taskLevelMetrics.get(flywheelName);
    if (!metrics || metrics.length === 0) {
      return {
        avgTasksPerPlan: 0,
        avgSubtasksPerTask: 0,
        taskCompletionRate: 0,
        estimationAccuracy: 0,
        parallelTasksAvg: 0
      };
    }

    const avgTasksPerPlan = metrics.reduce((sum, m) => sum + m.taskCount, 0) / metrics.length;
    const avgSubtasksPerTask = metrics.reduce((sum, m) => {
      return sum + (m.taskCount > 0 ? m.subtaskCount / m.taskCount : 0);
    }, 0) / metrics.length;
    const taskCompletionRate = metrics.reduce((sum, m) => {
      return sum + (m.taskCount > 0 ? m.completedTasks / m.taskCount : 0);
    }, 0) / metrics.length;

    // Estimation accuracy: 1 - avg(|actual - estimated| / estimated)
    const estimationAccuracy = 1 - (metrics.reduce((sum, m) => {
      if (m.estimatedDuration === 0) return sum;
      return sum + Math.abs(m.actualDuration - m.estimatedDuration) / m.estimatedDuration;
    }, 0) / metrics.length);

    const parallelTasksAvg = metrics.reduce((sum, m) => sum + m.parallelTasks, 0) / metrics.length;

    return {
      avgTasksPerPlan: Math.round(avgTasksPerPlan * 10) / 10,
      avgSubtasksPerTask: Math.round(avgSubtasksPerTask * 10) / 10,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      estimationAccuracy: Math.max(0, Math.round(estimationAccuracy * 100) / 100),
      parallelTasksAvg: Math.round(parallelTasksAvg * 10) / 10
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMonitoring();

    // NEW v6.1: Remove task plan listeners
    if (this.taskPlanManager) {
      this.taskPlanManager.removeAllListeners('plan-completed');
    }

    this.removeAllListeners();
  }
}
