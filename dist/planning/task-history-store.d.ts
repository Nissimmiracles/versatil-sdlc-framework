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
    tasks: string;
    dependencies: string;
    metadata?: string;
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
    mostCommonTasks: Array<{
        description: string;
        count: number;
    }>;
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
export declare class TaskHistoryStore extends EventEmitter {
    private db;
    private tableName;
    private cache;
    private readonly CACHE_TTL;
    constructor(supabaseClient?: any);
    /**
     * Store a completed task plan
     *
     * @param plan - Completed task plan
     */
    storePlan(plan: TaskPlan): Promise<void>;
    /**
     * Retrieve a plan by ID
     *
     * @param planId - Plan identifier
     * @returns Stored plan or null
     */
    getPlan(planId: string): Promise<TaskPlan | null>;
    /**
     * Query plans with filters
     *
     * @param options - Query options
     * @returns Matching plans
     */
    queryPlans(options?: QueryOptions): Promise<TaskPlan[]>;
    /**
     * Analyze overall task performance
     *
     * @param agent - Optional agent filter
     * @returns Task analytics
     */
    analyzeTaskPerformance(agent?: string): Promise<TaskAnalytics>;
    /**
     * Analyze agent performance with trends
     *
     * @param agent - Agent identifier
     * @returns Agent performance metrics
     */
    analyzeAgent(agent: string): Promise<AgentPerformance>;
    /**
     * Generate improvement recommendations based on analytics
     */
    private generateRecommendations;
    /**
     * Calculate analytics for a set of plans (helper)
     */
    private calculateAnalyticsForPlans;
    /**
     * Compare metric trend (improving/stable/degrading)
     */
    private compareTrend;
    /**
     * Get empty analytics (no data)
     */
    private getEmptyAnalytics;
    /**
     * Deserialize stored plan to TaskPlan
     */
    private deserializePlan;
    private inMemoryStore;
    private setupInMemoryFallback;
}
export default TaskHistoryStore;
