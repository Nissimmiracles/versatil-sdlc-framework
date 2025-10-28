/**
 * @fileoverview Task Plan Manager - Hierarchical task planning and execution tracking
 *
 * Provides complete visibility into:
 * - Agent plans (what will be done before execution)
 * - Task hierarchy (agent tasks → subagent tasks)
 * - Live execution progress
 * - Historical plan tracking
 * - Dependency management
 *
 * @module planning/task-plan-manager
 * @version 6.1.0
 */
import { EventEmitter } from 'events';
/**
 * Task status lifecycle
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
/**
 * Plan status lifecycle
 */
export type PlanStatus = 'planning' | 'approval_requested' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
/**
 * Task dependency types
 */
export type DependencyType = 'blocks' | 'enables' | 'handoff';
/**
 * Task output types
 */
export type TaskOutputType = 'file' | 'test_result' | 'report' | 'metric' | 'diagram' | 'config';
/**
 * Individual task in the plan hierarchy
 */
export interface Task {
    /** Unique task identifier */
    id: string;
    /** Human-readable task description */
    description: string;
    /** Current task status */
    status: TaskStatus;
    /** Agent responsible for this task */
    assignedAgent: string;
    /** Whether this task is executed by a subagent */
    isSubagentTask: boolean;
    /** Parent task ID (for hierarchy) */
    parentTaskId?: string;
    /** Child subtasks */
    subtasks: Task[];
    /** Depth in hierarchy (0 = root, 1 = agent task, 2+ = subagent) */
    depth: number;
    /** Execution timing */
    startedAt?: Date;
    completedAt?: Date;
    estimatedDuration: number;
    actualDuration?: number;
    /** Progress percentage (0-100) */
    progress: number;
    /** Task deliverables */
    outputs: TaskOutput[];
    /** Dependencies */
    dependsOn: string[];
    blockedBy: string[];
    /** Error information (if failed) */
    error?: {
        message: string;
        stack?: string;
        timestamp: Date;
    };
    /** Metadata */
    metadata?: Record<string, any>;
}
/**
 * Task output/deliverable
 */
export interface TaskOutput {
    type: TaskOutputType;
    path?: string;
    content?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}
/**
 * Task dependency relationship
 */
export interface TaskDependency {
    from: string;
    to: string;
    type: DependencyType;
    description: string;
}
/**
 * Complete task plan
 */
export interface TaskPlan {
    /** Unique plan identifier */
    id: string;
    /** Primary agent coordinating this plan */
    agent: string;
    /** High-level task description */
    rootTask: string;
    /** Current plan status */
    status: PlanStatus;
    /** Timestamps */
    createdAt: Date;
    approvedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    /** Task hierarchy */
    tasks: Task[];
    /** Inter-task dependencies */
    dependencies: TaskDependency[];
    /** Estimation vs actual */
    estimatedDuration: number;
    actualDuration?: number;
    estimatedCost: number;
    actualCost?: number;
    /** Agents involved in this plan */
    involvedAgents: string[];
    /** Total subagent count */
    subagentCount: number;
    /** Plan metadata */
    metadata?: {
        userRequest?: string;
        context?: string;
        tags?: string[];
        priority?: 'low' | 'medium' | 'high' | 'critical';
    };
}
/**
 * Plan creation configuration
 */
export interface CreatePlanConfig {
    /** Primary agent creating the plan */
    agent: string;
    /** High-level task description */
    rootTask: string;
    /** Task breakdown (can be auto-generated or provided) */
    tasks?: Task[];
    /** Whether to auto-approve without user interaction */
    autoApprove?: boolean;
    /** Estimated duration in minutes */
    estimatedDuration?: number;
    /** Estimated API token cost */
    estimatedCost?: number;
    /** Additional metadata */
    metadata?: {
        userRequest?: string;
        context?: string;
        tags?: string[];
        priority?: 'low' | 'medium' | 'high' | 'critical';
    };
}
/**
 * Plan execution result
 */
export interface PlanExecutionResult {
    success: boolean;
    plan: TaskPlan;
    completedTasks: Task[];
    failedTasks: Task[];
    duration: number;
    cost: number;
    outputs: TaskOutput[];
}
/**
 * Current plan status snapshot
 */
export interface PlanStatusSnapshot {
    plan: TaskPlan;
    activeTasks: Task[];
    completedTasks: Task[];
    blockedTasks: Task[];
    failedTasks: Task[];
    progress: number;
    estimatedTimeRemaining: number;
}
/**
 * Manages hierarchical task planning and execution tracking
 *
 * Features:
 * - Pre-execution plan generation
 * - User approval workflow
 * - Real-time progress tracking
 * - Subagent task visibility
 * - Dependency management
 * - Historical plan storage
 *
 * Events emitted:
 * - plan-created: New plan generated
 * - plan-approval-requested: Plan awaiting user approval
 * - plan-approved: Plan approved by user
 * - plan-rejected: Plan rejected by user
 * - plan-started: Plan execution started
 * - plan-completed: Plan execution completed
 * - plan-failed: Plan execution failed
 * - task-started: Individual task started
 * - task-progress: Task progress updated
 * - task-completed: Task completed
 * - task-failed: Task failed
 * - task-blocked: Task blocked by dependency
 */
export declare class TaskPlanManager extends EventEmitter {
    /** Active plans (in-memory) */
    private plans;
    /** Currently executing tasks */
    private activeTasks;
    /** Historical plans (recently completed) */
    private history;
    /** Maximum history size */
    private readonly MAX_HISTORY;
    constructor();
    /**
     * Create a new task plan
     *
     * @param config - Plan configuration
     * @returns Created plan (pending approval unless autoApprove=true)
     */
    createPlan(config: CreatePlanConfig): Promise<TaskPlan>;
    /**
     * Approve a plan for execution
     */
    approvePlan(planId: string): Promise<void>;
    /**
     * Reject a plan
     */
    rejectPlan(planId: string, reason?: string): Promise<void>;
    /**
     * Execute an approved plan
     *
     * @param planId - Plan identifier
     * @returns Execution result
     */
    executePlan(planId: string): Promise<PlanExecutionResult>;
    /**
     * Execute an individual task
     */
    private executeTask;
    /**
     * Placeholder for actual task execution
     * Real implementation will delegate to agent system
     */
    private simulateTaskExecution;
    /**
     * Get current status of a plan
     */
    getPlanStatus(planId: string): PlanStatusSnapshot;
    /**
     * Get all active plans
     */
    getActivePlans(): TaskPlan[];
    /**
     * Get plan history
     */
    getHistory(limit?: number): TaskPlan[];
    /**
     * Get plan by ID (including history)
     */
    getPlan(planId: string): TaskPlan | undefined;
    /**
     * Check if task dependencies are satisfied
     */
    private areDependenciesSatisfied;
    /**
     * Get tasks blocking this task
     */
    private getBlockingTasks;
    /**
     * Analyze task dependencies
     */
    private analyzeDependencies;
    /**
     * Build task execution queue respecting dependencies
     */
    private buildExecutionQueue;
    /**
     * Generate task breakdown from high-level description
     *
     * This is a placeholder - real implementation will use:
     * - Agent planning capabilities
     * - RAG pattern retrieval
     * - Historical task patterns
     */
    private generateTaskBreakdown;
    /**
     * Generate text visualization of plan
     */
    private generatePlanVisualization;
    /**
     * Render task hierarchy as ASCII tree
     */
    private renderTaskTree;
    /**
     * Render dependencies
     */
    private renderDependencies;
    /**
     * Get task status icon
     */
    private getTaskIcon;
    /**
     * Generate unique plan ID
     */
    private generatePlanId;
    /**
     * Generate unique task ID
     */
    private generateTaskId;
    /**
     * Flatten task hierarchy into single array
     */
    private flattenTaskHierarchy;
    /**
     * Extract involved agents from tasks
     */
    private extractInvolvedAgents;
    /**
     * Count subagent tasks
     */
    private countSubagents;
    /**
     * Calculate estimated duration
     */
    private calculateEstimatedDuration;
    /**
     * Calculate estimated cost
     */
    private calculateEstimatedCost;
    /**
     * Calculate actual duration
     */
    private calculateActualDuration;
    /**
     * Calculate task duration
     */
    private calculateTaskDuration;
    /**
     * Calculate plan progress (0-100)
     */
    private calculatePlanProgress;
    /**
     * Estimate time remaining
     */
    private estimateTimeRemaining;
    /**
     * Check if task is critical (failure should stop execution)
     */
    private isCriticalTask;
    /**
     * Archive completed plan to history
     */
    private archivePlan;
}
export default TaskPlanManager;
