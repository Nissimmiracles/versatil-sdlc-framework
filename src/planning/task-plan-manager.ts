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
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes

  /** Progress percentage (0-100) */
  progress: number;

  /** Task deliverables */
  outputs: TaskOutput[];

  /** Dependencies */
  dependsOn: string[]; // Task IDs this task depends on
  blockedBy: string[]; // Task IDs currently blocking this task

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
  from: string; // Source task ID
  to: string; // Target task ID
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
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  estimatedCost: number; // API tokens
  actualCost?: number; // API tokens

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
  duration: number; // minutes
  cost: number; // tokens
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
  progress: number; // 0-100
  estimatedTimeRemaining: number; // minutes
}

// ============================================================================
// TASK PLAN MANAGER
// ============================================================================

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
export class TaskPlanManager extends EventEmitter {
  /** Active plans (in-memory) */
  private plans = new Map<string, TaskPlan>();

  /** Currently executing tasks */
  private activeTasks = new Map<string, Task>();

  /** Historical plans (recently completed) */
  private history: TaskPlan[] = [];

  /** Maximum history size */
  private readonly MAX_HISTORY = 100;

  constructor() {
    super();
  }

  // ==========================================================================
  // PLAN CREATION & APPROVAL
  // ==========================================================================

  /**
   * Create a new task plan
   *
   * @param config - Plan configuration
   * @returns Created plan (pending approval unless autoApprove=true)
   */
  async createPlan(config: CreatePlanConfig): Promise<TaskPlan> {
    const plan: TaskPlan = {
      id: this.generatePlanId(),
      agent: config.agent,
      rootTask: config.rootTask,
      status: 'planning',
      createdAt: new Date(),

      // Use provided tasks or generate from rootTask
      tasks: config.tasks || await this.generateTaskBreakdown(config),

      dependencies: [],

      estimatedDuration: config.estimatedDuration || 0,
      estimatedCost: config.estimatedCost || 0,

      involvedAgents: this.extractInvolvedAgents(config.tasks || []),
      subagentCount: this.countSubagents(config.tasks || []),

      metadata: config.metadata
    };

    // Calculate dependencies
    plan.dependencies = this.analyzeDependencies(plan.tasks);

    // Recalculate estimates if not provided
    if (!config.estimatedDuration) {
      plan.estimatedDuration = this.calculateEstimatedDuration(plan.tasks);
    }
    if (!config.estimatedCost) {
      plan.estimatedCost = this.calculateEstimatedCost(plan.tasks);
    }

    // Store plan
    this.plans.set(plan.id, plan);

    // Emit creation event
    this.emit('plan-created', plan);

    // Handle approval workflow
    if (config.autoApprove) {
      await this.approvePlan(plan.id);
    } else {
      plan.status = 'approval_requested';
      this.emit('plan-approval-requested', {
        plan,
        visualization: this.generatePlanVisualization(plan)
      });
    }

    return plan;
  }

  /**
   * Approve a plan for execution
   */
  async approvePlan(planId: string): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    plan.status = 'approved';
    plan.approvedAt = new Date();

    this.emit('plan-approved', plan);
  }

  /**
   * Reject a plan
   */
  async rejectPlan(planId: string, reason?: string): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    plan.status = 'rejected';

    this.emit('plan-rejected', { plan, reason });

    // Move to history
    this.archivePlan(plan);
  }

  // ==========================================================================
  // PLAN EXECUTION
  // ==========================================================================

  /**
   * Execute an approved plan
   *
   * @param planId - Plan identifier
   * @returns Execution result
   */
  async executePlan(planId: string): Promise<PlanExecutionResult> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    if (plan.status !== 'approved') {
      throw new Error(`Plan ${planId} is not approved (status: ${plan.status})`);
    }

    plan.status = 'executing';
    plan.startedAt = new Date();

    this.emit('plan-started', plan);

    const completedTasks: Task[] = [];
    const failedTasks: Task[] = [];
    const outputs: TaskOutput[] = [];

    try {
      // Build execution queue respecting dependencies
      const taskQueue = this.buildExecutionQueue(plan);

      // Execute tasks
      for (const task of taskQueue) {
        // Check if dependencies are satisfied
        if (!this.areDependenciesSatisfied(task, plan)) {
          task.status = 'blocked';
          task.blockedBy = this.getBlockingTasks(task, plan);
          this.emit('task-blocked', { task, plan });
          continue;
        }

        // Execute task
        try {
          const result = await this.executeTask(task, plan);
          completedTasks.push(task);
          outputs.push(...task.outputs);
        } catch (error) {
          task.status = 'failed';
          task.error = {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date()
          };
          failedTasks.push(task);
          this.emit('task-failed', { task, plan, error });

          // Stop execution on critical task failure
          if (this.isCriticalTask(task)) {
            throw error;
          }
        }
      }

      plan.status = 'completed';
      plan.completedAt = new Date();
      plan.actualDuration = this.calculateActualDuration(plan);

      this.emit('plan-completed', plan);

      // Archive to history
      this.archivePlan(plan);

      return {
        success: failedTasks.length === 0,
        plan,
        completedTasks,
        failedTasks,
        duration: plan.actualDuration || 0,
        cost: plan.actualCost || 0,
        outputs
      };

    } catch (error) {
      plan.status = 'failed';
      plan.completedAt = new Date();

      this.emit('plan-failed', { plan, error });

      // Archive to history
      this.archivePlan(plan);

      throw error;
    }
  }

  /**
   * Execute an individual task
   */
  private async executeTask(task: Task, plan: TaskPlan): Promise<void> {
    task.status = 'in_progress';
    task.startedAt = new Date();
    task.progress = 0;

    this.activeTasks.set(task.id, task);

    this.emit('task-started', { task, plan });

    // Execute subtasks first
    for (const subtask of task.subtasks) {
      await this.executeTask(subtask, plan);
    }

    // Simulate task execution (actual implementation would delegate to agents)
    // This is a placeholder - real implementation will integrate with agent system
    await this.simulateTaskExecution(task);

    task.status = 'completed';
    task.completedAt = new Date();
    task.progress = 100;
    task.actualDuration = this.calculateTaskDuration(task);

    this.activeTasks.delete(task.id);

    this.emit('task-completed', { task, plan });
  }

  /**
   * Placeholder for actual task execution
   * Real implementation will delegate to agent system
   */
  private async simulateTaskExecution(task: Task): Promise<void> {
    // This will be replaced with actual agent/subagent execution
    // For now, just simulate progress
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      task.progress = (i / steps) * 100;
      this.emit('task-progress', { task, progress: task.progress });
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    }
  }

  // ==========================================================================
  // PLAN QUERIES & STATUS
  // ==========================================================================

  /**
   * Get current status of a plan
   */
  getPlanStatus(planId: string): PlanStatusSnapshot {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const allTasks = this.flattenTaskHierarchy(plan.tasks);

    return {
      plan,
      activeTasks: allTasks.filter(t => t.status === 'in_progress'),
      completedTasks: allTasks.filter(t => t.status === 'completed'),
      blockedTasks: allTasks.filter(t => t.status === 'blocked'),
      failedTasks: allTasks.filter(t => t.status === 'failed'),
      progress: this.calculatePlanProgress(plan),
      estimatedTimeRemaining: this.estimateTimeRemaining(plan)
    };
  }

  /**
   * Get all active plans
   */
  getActivePlans(): TaskPlan[] {
    return Array.from(this.plans.values()).filter(
      p => p.status === 'executing' || p.status === 'approval_requested' || p.status === 'approved'
    );
  }

  /**
   * Get plan history
   */
  getHistory(limit: number = 10): TaskPlan[] {
    return this.history.slice(0, limit);
  }

  /**
   * Get plan by ID (including history)
   */
  getPlan(planId: string): TaskPlan | undefined {
    return this.plans.get(planId) || this.history.find(p => p.id === planId);
  }

  // ==========================================================================
  // DEPENDENCY MANAGEMENT
  // ==========================================================================

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesSatisfied(task: Task, plan: TaskPlan): boolean {
    if (task.dependsOn.length === 0) return true;

    const allTasks = this.flattenTaskHierarchy(plan.tasks);
    const dependencies = allTasks.filter(t => task.dependsOn.includes(t.id));

    return dependencies.every(dep => dep.status === 'completed');
  }

  /**
   * Get tasks blocking this task
   */
  private getBlockingTasks(task: Task, plan: TaskPlan): string[] {
    if (task.dependsOn.length === 0) return [];

    const allTasks = this.flattenTaskHierarchy(plan.tasks);
    const dependencies = allTasks.filter(t => task.dependsOn.includes(t.id));

    return dependencies
      .filter(dep => dep.status !== 'completed')
      .map(dep => dep.id);
  }

  /**
   * Analyze task dependencies
   */
  private analyzeDependencies(tasks: Task[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];
    const allTasks = this.flattenTaskHierarchy(tasks);

    // Parent-child dependencies
    for (const task of allTasks) {
      if (task.parentTaskId) {
        dependencies.push({
          from: task.parentTaskId,
          to: task.id,
          type: 'enables',
          description: 'Parent task enables child task'
        });
      }
    }

    // Explicit dependencies
    for (const task of allTasks) {
      for (const depId of task.dependsOn) {
        const depTask = allTasks.find(t => t.id === depId);
        if (depTask) {
          dependencies.push({
            from: depId,
            to: task.id,
            type: 'blocks',
            description: `${depTask.description} must complete before ${task.description}`
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Build task execution queue respecting dependencies
   */
  private buildExecutionQueue(plan: TaskPlan): Task[] {
    const allTasks = this.flattenTaskHierarchy(plan.tasks);
    const queue: Task[] = [];
    const visited = new Set<string>();

    // Topological sort
    const visit = (task: Task) => {
      if (visited.has(task.id)) return;

      // Visit dependencies first
      const deps = allTasks.filter(t => task.dependsOn.includes(t.id));
      for (const dep of deps) {
        visit(dep);
      }

      visited.add(task.id);
      queue.push(task);
    };

    for (const task of allTasks) {
      visit(task);
    }

    return queue;
  }

  // ==========================================================================
  // TASK BREAKDOWN & GENERATION
  // ==========================================================================

  /**
   * Generate task breakdown from high-level description
   *
   * This is a placeholder - real implementation will use:
   * - Agent planning capabilities
   * - RAG pattern retrieval
   * - Historical task patterns
   */
  private async generateTaskBreakdown(config: CreatePlanConfig): Promise<Task[]> {
    // Placeholder: Generate simple task structure
    // Real implementation will delegate to agent planning system

    const rootTask: Task = {
      id: this.generateTaskId(),
      description: config.rootTask,
      status: 'pending',
      assignedAgent: config.agent,
      isSubagentTask: false,
      subtasks: [],
      depth: 0,
      estimatedDuration: config.estimatedDuration || 10,
      progress: 0,
      outputs: [],
      dependsOn: [],
      blockedBy: []
    };

    return [rootTask];
  }

  // ==========================================================================
  // VISUALIZATION
  // ==========================================================================

  /**
   * Generate text visualization of plan
   */
  private generatePlanVisualization(plan: TaskPlan): string {
    return `
┌─────────────────────────────────────────────────────────┐
│ Task Plan: ${plan.rootTask.slice(0, 45).padEnd(45)}│
│ Agent: ${plan.agent.padEnd(49)} │
│ Estimated Duration: ${String(plan.estimatedDuration).padEnd(37)} min │
│ Estimated Cost: ${String(plan.estimatedCost).padEnd(41)} tokens │
└─────────────────────────────────────────────────────────┘

Task Breakdown:
${this.renderTaskTree(plan.tasks, 0)}

Dependencies:
${this.renderDependencies(plan.dependencies)}

Involved Agents: ${plan.involvedAgents.join(', ')}
Subagents: ${plan.subagentCount}

⏸️  Waiting for approval...
`;
  }

  /**
   * Render task hierarchy as ASCII tree
   */
  private renderTaskTree(tasks: Task[], depth: number): string {
    return tasks.map(task => {
      const indent = '  '.repeat(depth);
      const icon = this.getTaskIcon(task.status);
      const agent = task.assignedAgent ? `[${task.assignedAgent}]` : '';
      const subagentMarker = task.isSubagentTask ? '↳ ' : '';
      const duration = task.estimatedDuration ? ` (~${task.estimatedDuration}min)` : '';

      let output = `${indent}${icon} ${subagentMarker}${task.description} ${agent}${duration}`;

      if (task.subtasks.length > 0) {
        output += '\n' + this.renderTaskTree(task.subtasks, depth + 1);
      }

      return output;
    }).join('\n');
  }

  /**
   * Render dependencies
   */
  private renderDependencies(dependencies: TaskDependency[]): string {
    if (dependencies.length === 0) return 'None';

    return dependencies.map(dep =>
      `• ${dep.type}: ${dep.description}`
    ).join('\n');
  }

  /**
   * Get task status icon
   */
  private getTaskIcon(status: TaskStatus): string {
    const icons = {
      'pending': '⏳',
      'in_progress': '🔄',
      'completed': '✅',
      'failed': '❌',
      'blocked': '🚫'
    };
    return icons[status];
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Generate unique plan ID
   */
  private generatePlanId(): string {
    return `plan_${uuidv4().split('-')[0]}`;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${uuidv4().split('-')[0]}`;
  }

  /**
   * Flatten task hierarchy into single array
   */
  private flattenTaskHierarchy(tasks: Task[]): Task[] {
    const flat: Task[] = [];

    const flatten = (task: Task) => {
      flat.push(task);
      task.subtasks.forEach(flatten);
    };

    tasks.forEach(flatten);
    return flat;
  }

  /**
   * Extract involved agents from tasks
   */
  private extractInvolvedAgents(tasks: Task[]): string[] {
    const agents = new Set<string>();

    const extract = (task: Task) => {
      if (task.assignedAgent) agents.add(task.assignedAgent);
      task.subtasks.forEach(extract);
    };

    tasks.forEach(extract);
    return Array.from(agents);
  }

  /**
   * Count subagent tasks
   */
  private countSubagents(tasks: Task[]): number {
    let count = 0;

    const countSubtasks = (task: Task) => {
      if (task.isSubagentTask) count++;
      task.subtasks.forEach(countSubtasks);
    };

    tasks.forEach(countSubtasks);
    return count;
  }

  /**
   * Calculate estimated duration
   */
  private calculateEstimatedDuration(tasks: Task[]): number {
    const allTasks = this.flattenTaskHierarchy(tasks);
    return allTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
  }

  /**
   * Calculate estimated cost
   */
  private calculateEstimatedCost(tasks: Task[]): number {
    // Placeholder: rough estimate based on task count
    const allTasks = this.flattenTaskHierarchy(tasks);
    return allTasks.length * 1000; // ~1k tokens per task
  }

  /**
   * Calculate actual duration
   */
  private calculateActualDuration(plan: TaskPlan): number {
    if (!plan.startedAt || !plan.completedAt) return 0;
    return (plan.completedAt.getTime() - plan.startedAt.getTime()) / (1000 * 60);
  }

  /**
   * Calculate task duration
   */
  private calculateTaskDuration(task: Task): number {
    if (!task.startedAt || !task.completedAt) return 0;
    return (task.completedAt.getTime() - task.startedAt.getTime()) / (1000 * 60);
  }

  /**
   * Calculate plan progress (0-100)
   */
  private calculatePlanProgress(plan: TaskPlan): number {
    const allTasks = this.flattenTaskHierarchy(plan.tasks);
    if (allTasks.length === 0) return 0;

    const totalProgress = allTasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / allTasks.length);
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(plan: TaskPlan): number {
    if (plan.status !== 'executing') return plan.estimatedDuration;

    const progress = this.calculatePlanProgress(plan);
    if (progress === 0) return plan.estimatedDuration;

    const elapsed = this.calculateActualDuration(plan);
    const totalEstimated = (elapsed / progress) * 100;

    return Math.max(0, totalEstimated - elapsed);
  }

  /**
   * Check if task is critical (failure should stop execution)
   */
  private isCriticalTask(task: Task): boolean {
    // Tasks with dependents are critical
    return task.subtasks.length > 0;
  }

  /**
   * Archive completed plan to history
   */
  private archivePlan(plan: TaskPlan): void {
    this.plans.delete(plan.id);
    this.history.unshift(plan);

    // Trim history if needed
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(0, this.MAX_HISTORY);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TaskPlanManager;
