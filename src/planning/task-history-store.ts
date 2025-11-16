/**
 * @fileoverview Task History Store - Persistent task analytics with Supabase
 *
 * Stores and analyzes task execution history for:
 * - Performance tracking (actual vs estimated)
 * - Pattern learning (common task breakdowns)
 * - Estimation improvement (learn from past accuracy)
 * - Agent performance analysis
 * - Trend detection
 *
 * @module planning/task-history-store
 * @version 6.1.0
 */

import { EventEmitter } from 'events';
import type { TaskPlan } from './task-plan-manager.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Stored plan record (database schema)
 */
export interface StoredPlan {
  id: string;
  agent: string;
  root_task: string;
  status: string;
  created_at: string;
  approved_at?: string;
  started_at?: string;
  completed_at?: string;
  estimated_duration: number;
  actual_duration?: number;
  estimated_cost: number;
  actual_cost?: number;
  involved_agents: string[];
  subagent_count: number;
  tasks: string; // JSON
  dependencies: string; // JSON
  metadata?: string; // JSON
}

/**
 * Task analytics aggregation
 */
export interface TaskAnalytics {
  /** Total completed plans */
  totalPlans: number;

  /** Average duration (minutes) */
  averageDuration: number;

  /** Average cost (tokens) */
  averageCost: number;

  /** Estimation accuracy (0-1, 1 = perfect) */
  estimationAccuracy: number;

  /** Most common task patterns */
  mostCommonTasks: Array<{ description: string; count: number }>;

  /** Success rate (completed / total) */
  successRate: number;

  /** Failure rate (failed / total) */
  failureRate: number;

  /** Average tasks per plan */
  averageTasksPerPlan: number;

  /** Average subagents per plan */
  averageSubagentsPerPlan: number;
}

/**
 * Agent performance metrics
 */
export interface AgentPerformance {
  agent: string;
  analytics: TaskAnalytics;
  trends: {
    durationTrend: 'improving' | 'stable' | 'degrading';
    accuracyTrend: 'improving' | 'stable' | 'degrading';
    successRateTrend: 'improving' | 'stable' | 'degrading';
  };
  recommendations: string[];
}

/**
 * Query options for historical plans
 */
export interface QueryOptions {
  agent?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// TASK HISTORY STORE
// ============================================================================

/**
 * Persistent storage and analytics for task execution history
 *
 * Features:
 * - Store completed plans in Supabase
 * - Query historical execution data
 * - Analyze agent performance
 * - Generate improvement recommendations
 * - Track estimation accuracy trends
 * - Learn common task patterns
 *
 * Integration:
 * - Works with TaskPlanManager
 * - Uses existing Supabase instance
 * - Auto-stores on plan completion
 *
 * Usage:
 * ```typescript
 * const historyStore = new TaskHistoryStore(supabaseClient);
 *
 * // Auto-store completed plan
 * await historyStore.storePlan(completedPlan);
 *
 * // Analyze agent performance
 * const analytics = await historyStore.analyzeAgent('maria-qa');
 * console.log(`Estimation accuracy: ${analytics.estimationAccuracy * 100}%`);
 * ```
 */
export class TaskHistoryStore extends EventEmitter {
  private db: any; // Supabase client (any type to avoid dependency)
  private tableName = 'versatil_task_plans';

  // In-memory cache for recent queries
  private cache = new Map<string, StoredPlan[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(supabaseClient?: any) {
    super();
    this.db = supabaseClient;

    // If no Supabase client provided, use in-memory fallback
    if (!this.db) {
      console.warn('[TaskHistoryStore] No Supabase client provided, using in-memory storage');
      this.setupInMemoryFallback();
    }
  }

  // ==========================================================================
  // STORAGE OPERATIONS
  // ==========================================================================

  /**
   * Store a completed task plan
   *
   * @param plan - Completed task plan
   */
  async storePlan(plan: TaskPlan): Promise<void> {
    const record: StoredPlan = {
      id: plan.id,
      agent: plan.agent,
      root_task: plan.rootTask,
      status: plan.status,
      created_at: plan.createdAt.toISOString(),
      approved_at: plan.approvedAt?.toISOString(),
      started_at: plan.startedAt?.toISOString(),
      completed_at: plan.completedAt?.toISOString(),
      estimated_duration: plan.estimatedDuration,
      actual_duration: plan.actualDuration,
      estimated_cost: plan.estimatedCost,
      actual_cost: plan.actualCost,
      involved_agents: plan.involvedAgents,
      subagent_count: plan.subagentCount,
      tasks: JSON.stringify(plan.tasks),
      dependencies: JSON.stringify(plan.dependencies),
      metadata: plan.metadata ? JSON.stringify(plan.metadata) : undefined
    };

    if (this.db && this.db.from) {
      // Use Supabase
      const { error } = await this.db
        .from(this.tableName)
        .insert(record);

      if (error) {
        console.error('[TaskHistoryStore] Failed to store plan:', error);
        this.emit('storage-error', { plan, error });
        return;
      }
    } else {
      // Use in-memory fallback
      this.inMemoryStore.set(plan.id, record);
    }

    // Clear cache
    this.cache.clear();

    this.emit('plan-stored', plan);
  }

  /**
   * Retrieve a plan by ID
   *
   * @param planId - Plan identifier
   * @returns Stored plan or null
   */
  async getPlan(planId: string): Promise<TaskPlan | null> {
    let record: StoredPlan | null = null;

    if (this.db && this.db.from) {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('id', planId)
        .single();

      if (error || !data) return null;
      record = data;
    } else {
      record = this.inMemoryStore.get(planId) || null;
    }

    return record ? this.deserializePlan(record) : null;
  }

  /**
   * Query plans with filters
   *
   * @param options - Query options
   * @returns Matching plans
   */
  async queryPlans(options: QueryOptions = {}): Promise<TaskPlan[]> {
    // Check cache
    const cacheKey = JSON.stringify(options);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached.map(r => this.deserializePlan(r));
    }

    let records: StoredPlan[] = [];

    if (this.db && this.db.from) {
      let query = this.db.from(this.tableName).select('*');

      // Apply filters
      if (options.agent) {
        query = query.eq('agent', options.agent);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('[TaskHistoryStore] Query error:', error);
        return [];
      }

      records = data || [];
    } else {
      // In-memory fallback
      records = Array.from(this.inMemoryStore.values());

      // Apply filters
      if (options.agent) {
        records = records.filter(r => r.agent === options.agent);
      }

      if (options.status) {
        records = records.filter(r => r.status === options.status);
      }

      // Sort by created_at descending
      records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply pagination
      if (options.offset) {
        records = records.slice(options.offset);
      }

      if (options.limit) {
        records = records.slice(0, options.limit);
      }
    }

    // Cache results
    this.cache.set(cacheKey, records);

    return records.map(r => this.deserializePlan(r));
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  /**
   * Analyze overall task performance
   *
   * @param agent - Optional agent filter
   * @returns Task analytics
   */
  async analyzeTaskPerformance(agent?: string): Promise<TaskAnalytics> {
    const plans = await this.queryPlans({
      agent,
      status: 'completed',
      limit: 100 // Last 100 completed plans
    });

    if (plans.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalPlans = plans.length;
    const totalDuration = plans.reduce((sum, p) => sum + (p.actualDuration || 0), 0);
    const totalCost = plans.reduce((sum, p) => sum + (p.actualCost || 0), 0);

    // Calculate estimation accuracy
    let accuracySum = 0;
    let accuracyCount = 0;

    for (const plan of plans) {
      if (plan.estimatedDuration && plan.actualDuration) {
        const accuracy = 1 - Math.abs(plan.estimatedDuration - plan.actualDuration) / plan.estimatedDuration;
        accuracySum += Math.max(0, accuracy); // Clamp to 0-1
        accuracyCount++;
      }
    }

    const estimationAccuracy = accuracyCount > 0 ? accuracySum / accuracyCount : 0;

    // Find most common tasks
    const taskCounts = new Map<string, number>();

    for (const plan of plans) {
      for (const task of plan.tasks) {
        const desc = task.description;
        taskCounts.set(desc, (taskCounts.get(desc) || 0) + 1);
      }
    }

    const mostCommonTasks = Array.from(taskCounts.entries())
      .map(([description, count]) => ({ description, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate success/failure rates
    const allPlansIncludingFailed = await this.queryPlans({ agent, limit: 100 });
    const failedPlans = allPlansIncludingFailed.filter(p => p.status === 'failed').length;
    const totalPlansIncludingFailed = allPlansIncludingFailed.length;

    const successRate = totalPlansIncludingFailed > 0
      ? (totalPlansIncludingFailed - failedPlans) / totalPlansIncludingFailed
      : 0;

    const failureRate = totalPlansIncludingFailed > 0
      ? failedPlans / totalPlansIncludingFailed
      : 0;

    return {
      totalPlans,
      averageDuration: totalPlans > 0 ? totalDuration / totalPlans : 0,
      averageCost: totalPlans > 0 ? totalCost / totalPlans : 0,
      estimationAccuracy,
      mostCommonTasks,
      successRate,
      failureRate,
      averageTasksPerPlan: totalPlans > 0
        ? plans.reduce((sum, p) => sum + p.tasks.length, 0) / totalPlans
        : 0,
      averageSubagentsPerPlan: totalPlans > 0
        ? plans.reduce((sum, p) => sum + p.subagentCount, 0) / totalPlans
        : 0
    };
  }

  /**
   * Analyze agent performance with trends
   *
   * @param agent - Agent identifier
   * @returns Agent performance metrics
   */
  async analyzeAgent(agent: string): Promise<AgentPerformance> {
    const analytics = await this.analyzeTaskPerformance(agent);

    // Analyze trends (compare recent vs historical)
    const recentPlans = await this.queryPlans({ agent, status: 'completed', limit: 20 });
    const historicalPlans = await this.queryPlans({ agent, status: 'completed', limit: 100 });

    const recentAnalytics = this.calculateAnalyticsForPlans(recentPlans);
    const historicalAnalytics = this.calculateAnalyticsForPlans(historicalPlans);

    const trends = {
      durationTrend: this.compareTrend(recentAnalytics.averageDuration, historicalAnalytics.averageDuration, false),
      accuracyTrend: this.compareTrend(recentAnalytics.estimationAccuracy, historicalAnalytics.estimationAccuracy, true),
      successRateTrend: this.compareTrend(recentAnalytics.successRate, historicalAnalytics.successRate, true)
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(agent, analytics, trends);

    return {
      agent,
      analytics,
      trends,
      recommendations
    };
  }

  /**
   * Generate improvement recommendations based on analytics
   */
  private generateRecommendations(
    agent: string,
    analytics: TaskAnalytics,
    trends: AgentPerformance['trends']
  ): string[] {
    const recommendations: string[] = [];

    // Estimation accuracy
    if (analytics.estimationAccuracy < 0.7) {
      recommendations.push(
        `⚠️ ${agent}: Estimation accuracy is ${(analytics.estimationAccuracy * 100).toFixed(0)}%. ` +
        `Consider breaking down tasks more granularly for better estimates.`
      );
    }

    // Failure rate
    if (analytics.failureRate > 0.1) {
      recommendations.push(
        `⚠️ ${agent}: ${(analytics.failureRate * 100).toFixed(0)}% failure rate detected. ` +
        `Review error patterns and add defensive checks.`
      );
    }

    // Duration trend
    if (trends.durationTrend === 'degrading') {
      recommendations.push(
        `📈 ${agent}: Task duration is increasing. ` +
        `Investigate performance bottlenecks or workload complexity.`
      );
    }

    // Accuracy trend
    if (trends.accuracyTrend === 'degrading') {
      recommendations.push(
        `📉 ${agent}: Estimation accuracy is declining. ` +
        `Re-calibrate time estimates based on recent data.`
      );
    }

    // Positive feedback
    if (analytics.successRate > 0.95 && analytics.estimationAccuracy > 0.8) {
      recommendations.push(
        `✅ ${agent}: Excellent performance! ${(analytics.successRate * 100).toFixed(0)}% success rate ` +
        `with ${(analytics.estimationAccuracy * 100).toFixed(0)}% estimation accuracy.`
      );
    }

    return recommendations;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Calculate analytics for a set of plans (helper)
   */
  private calculateAnalyticsForPlans(plans: TaskPlan[]): TaskAnalytics {
    if (plans.length === 0) return this.getEmptyAnalytics();

    const totalDuration = plans.reduce((sum, p) => sum + (p.actualDuration || 0), 0);
    const totalCost = plans.reduce((sum, p) => sum + (p.actualCost || 0), 0);

    let accuracySum = 0;
    let accuracyCount = 0;

    for (const plan of plans) {
      if (plan.estimatedDuration && plan.actualDuration) {
        const accuracy = 1 - Math.abs(plan.estimatedDuration - plan.actualDuration) / plan.estimatedDuration;
        accuracySum += Math.max(0, accuracy);
        accuracyCount++;
      }
    }

    return {
      totalPlans: plans.length,
      averageDuration: plans.length > 0 ? totalDuration / plans.length : 0,
      averageCost: plans.length > 0 ? totalCost / plans.length : 0,
      estimationAccuracy: accuracyCount > 0 ? accuracySum / accuracyCount : 0,
      mostCommonTasks: [],
      successRate: 1, // Only completed plans passed in
      failureRate: 0,
      averageTasksPerPlan: plans.length > 0
        ? plans.reduce((sum, p) => sum + p.tasks.length, 0) / plans.length
        : 0,
      averageSubagentsPerPlan: plans.length > 0
        ? plans.reduce((sum, p) => sum + p.subagentCount, 0) / plans.length
        : 0
    };
  }

  /**
   * Compare metric trend (improving/stable/degrading)
   */
  private compareTrend(
    recent: number,
    historical: number,
    higherIsBetter: boolean
  ): 'improving' | 'stable' | 'degrading' {
    const threshold = 0.05; // 5% change threshold

    const change = (recent - historical) / (historical || 1);

    if (Math.abs(change) < threshold) return 'stable';

    if (higherIsBetter) {
      return change > 0 ? 'improving' : 'degrading';
    } else {
      return change < 0 ? 'improving' : 'degrading';
    }
  }

  /**
   * Get empty analytics (no data)
   */
  private getEmptyAnalytics(): TaskAnalytics {
    return {
      totalPlans: 0,
      averageDuration: 0,
      averageCost: 0,
      estimationAccuracy: 0,
      mostCommonTasks: [],
      successRate: 0,
      failureRate: 0,
      averageTasksPerPlan: 0,
      averageSubagentsPerPlan: 0
    };
  }

  /**
   * Deserialize stored plan to TaskPlan
   */
  private deserializePlan(record: StoredPlan): TaskPlan {
    return {
      id: record.id,
      agent: record.agent,
      rootTask: record.root_task,
      status: record.status as any,
      createdAt: new Date(record.created_at),
      approvedAt: record.approved_at ? new Date(record.approved_at) : undefined,
      startedAt: record.started_at ? new Date(record.started_at) : undefined,
      completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
      tasks: JSON.parse(record.tasks),
      dependencies: JSON.parse(record.dependencies),
      estimatedDuration: record.estimated_duration,
      actualDuration: record.actual_duration,
      estimatedCost: record.estimated_cost,
      actualCost: record.actual_cost,
      involvedAgents: record.involved_agents,
      subagentCount: record.subagent_count,
      metadata: record.metadata ? JSON.parse(record.metadata) : undefined
    };
  }

  // ==========================================================================
  // IN-MEMORY FALLBACK
  // ==========================================================================

  private inMemoryStore = new Map<string, StoredPlan>();

  private setupInMemoryFallback(): void {
    this.db = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TaskHistoryStore;
