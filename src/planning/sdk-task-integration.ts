/**
 * @fileoverview SDK Task Integration - Connect TaskPlanManager with Claude Agent SDK
 *
 * Provides bidirectional integration between:
 * - VERSATIL TaskPlanManager (our hierarchical planning system)
 * - Claude Agent SDK (native subagent system)
 * - VERSATIL Orchestrator (agent coordination)
 *
 * Features:
 * - Auto-capture SDK subagent creation as task plan events
 * - Track existing agent activities retroactively
 * - Convert agent tasks into visual plan hierarchies
 * - Real-time progress synchronization
 *
 * @module planning/sdk-task-integration
 * @version 6.1.0
 */

import { EventEmitter } from 'events';
import { TaskPlanManager, Task, TaskPlan, CreatePlanConfig } from './task-plan-manager.js';
import type { AgentTask, AgentRole, SDLCPhase } from '../agents/sdk/versatil-orchestrator-agent.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration for SDK integration
 */
export interface SDKIntegrationConfig {
  /** TaskPlanManager instance */
  taskPlanManager: TaskPlanManager;

  /** Whether to auto-capture existing agent tasks */
  captureExistingTasks?: boolean;

  /** Whether to auto-approve agent-generated plans */
  autoApprove?: boolean;

  /** Minimum task complexity to create a plan (1-10) */
  minComplexityThreshold?: number;
}

/**
 * Agent activity captured from orchestrator
 */
export interface CapturedAgentActivity {
  agent: AgentRole;
  phase: SDLCPhase;
  taskDescription: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  metadata?: any;
}

/**
 * Historical task reconstruction
 */
export interface HistoricalTaskReconstruction {
  planId: string;
  rootTask: string;
  tasks: Task[];
  startedAt: Date;
  completedAt?: Date;
  involvedAgents: string[];
}

// ============================================================================
// SDK TASK INTEGRATION
// ============================================================================

/**
 * Integrates TaskPlanManager with Claude Agent SDK and VERSATIL Orchestrator
 *
 * Responsibilities:
 * - Auto-capture agent task creation
 * - Generate plans from existing agent activities
 * - Track SDK subagent lifecycle
 * - Synchronize progress between systems
 * - Reconstruct historical task plans
 *
 * Events emitted:
 * - agent-task-captured: Agent task detected and captured
 * - plan-generated-from-agent: Plan auto-generated from agent activity
 * - subagent-created: SDK subagent creation detected
 * - historical-plan-reconstructed: Past activity reconstructed as plan
 */
export class SDKTaskIntegration extends EventEmitter {
  private taskPlanManager: TaskPlanManager;
  private config: Required<SDKIntegrationConfig>;

  /** Map of agent task IDs to plan IDs */
  private agentTaskToPlan = new Map<string, string>();

  /** Map of plan IDs to agent tasks */
  private planToAgentTasks = new Map<string, AgentTask[]>();

  /** Captured historical activities */
  private historicalActivities: CapturedAgentActivity[] = [];

  constructor(config: SDKIntegrationConfig) {
    super();

    this.taskPlanManager = config.taskPlanManager;

    this.config = {
      taskPlanManager: config.taskPlanManager,
      captureExistingTasks: config.captureExistingTasks ?? true,
      autoApprove: config.autoApprove ?? false,
      minComplexityThreshold: config.minComplexityThreshold ?? 3
    };

    this.setupEventListeners();
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  /**
   * Setup listeners for TaskPlanManager and orchestrator events
   */
  private setupEventListeners(): void {
    // Listen to TaskPlanManager events
    this.taskPlanManager.on('plan-created', (plan: TaskPlan) => {
      this.emit('plan-created-sdk', plan);
    });

    this.taskPlanManager.on('task-started', ({ task, plan }) => {
      this.emit('task-progress-sdk', { task, plan });
    });

    this.taskPlanManager.on('task-completed', ({ task, plan }) => {
      this.emit('task-completed-sdk', { task, plan });
    });
  }

  // ==========================================================================
  // AGENT TASK CAPTURE
  // ==========================================================================

  /**
   * Capture an agent task and potentially create a plan
   *
   * @param agentTask - Agent task from orchestrator
   * @returns Created plan ID (if plan was created)
   */
  async captureAgentTask(agentTask: AgentTask): Promise<string | null> {
    const activity: CapturedAgentActivity = {
      agent: agentTask.agent,
      phase: agentTask.phase,
      taskDescription: agentTask.description,
      status: agentTask.status,
      startTime: agentTask.startTime,
      endTime: agentTask.endTime,
      metadata: agentTask.context
    };

    this.emit('agent-task-captured', activity);

    // Store for historical reconstruction
    if (this.config.captureExistingTasks) {
      this.historicalActivities.push(activity);
    }

    // Generate plan if task is complex enough
    if (this.shouldCreatePlan(agentTask)) {
      const plan = await this.generatePlanFromAgentTask(agentTask);

      if (plan) {
        this.agentTaskToPlan.set(agentTask.id, plan.id);

        const existingTasks = this.planToAgentTasks.get(plan.id) || [];
        existingTasks.push(agentTask);
        this.planToAgentTasks.set(plan.id, existingTasks);

        this.emit('plan-generated-from-agent', { agentTask, plan });

        return plan.id;
      }
    }

    return null;
  }

  /**
   * Determine if agent task should generate a plan
   */
  private shouldCreatePlan(agentTask: AgentTask): boolean {
    // Create plan if task has sufficient priority/complexity
    return agentTask.priority >= this.config.minComplexityThreshold;
  }

  /**
   * Generate TaskPlan from AgentTask
   */
  private async generatePlanFromAgentTask(agentTask: AgentTask): Promise<TaskPlan | null> {
    try {
      // Convert agent task to plan config
      const planConfig: CreatePlanConfig = {
        agent: agentTask.agent,
        rootTask: agentTask.description,
        autoApprove: this.config.autoApprove,
        metadata: {
          userRequest: agentTask.description,
          context: JSON.stringify(agentTask.context),
          priority: this.mapPriorityLevel(agentTask.priority),
          tags: [agentTask.phase, agentTask.agent]
        },
        tasks: await this.generateTaskBreakdown(agentTask)
      };

      const plan = await this.taskPlanManager.createPlan(planConfig);

      return plan;

    } catch (error) {
      console.error('[SDKTaskIntegration] Failed to generate plan from agent task:', error);
      return null;
    }
  }

  /**
   * Generate task breakdown from agent task
   */
  private async generateTaskBreakdown(agentTask: AgentTask): Promise<Task[]> {
    // Create root task
    const rootTask: Task = {
      id: `task_${agentTask.id}`,
      description: agentTask.description,
      status: this.mapAgentTaskStatus(agentTask.status),
      assignedAgent: agentTask.agent,
      isSubagentTask: false,
      subtasks: [],
      depth: 0,
      estimatedDuration: this.estimateTaskDuration(agentTask),
      progress: this.calculateAgentTaskProgress(agentTask),
      outputs: [],
      dependsOn: [],
      blockedBy: []
    };

    // Generate subtasks based on agent role and task type
    rootTask.subtasks = this.generateSubtasksForAgent(agentTask, rootTask.id);

    return [rootTask];
  }

  /**
   * Generate subtasks based on agent role
   */
  private generateSubtasksForAgent(agentTask: AgentTask, parentId: string): Task[] {
    const subtasks: Task[] = [];

    // Agent-specific subtask patterns
    const subtaskPatterns: Record<AgentRole, string[]> = {
      'maria-qa': [
        'Run test coverage analysis',
        'Execute test suite',
        'Generate test report',
        'Identify failing tests'
      ],
      'james-frontend': [
        'Validate component structure',
        'Check accessibility (WCAG 2.1)',
        'Verify responsive design',
        'Optimize performance'
      ],
      'marcus-backend': [
        'Validate security patterns',
        'Check API response times',
        'Run OWASP compliance scan',
        'Generate stress tests'
      ],
      'sarah-pm': [
        'Update project timeline',
        'Track milestone progress',
        'Generate status report',
        'Identify blockers'
      ],
      'alex-ba': [
        'Extract requirements',
        'Create user stories',
        'Define acceptance criteria',
        'Validate business logic'
      ],
      'dr-ai-ml': [
        'Validate model performance',
        'Run inference tests',
        'Monitor latency',
        'Check accuracy metrics'
      ]
    };

    const patterns = subtaskPatterns[agentTask.agent] || [];

    // Create subtasks
    patterns.forEach((pattern, index) => {
      subtasks.push({
        id: `subtask_${agentTask.id}_${index}`,
        description: pattern,
        status: 'pending',
        assignedAgent: agentTask.agent,
        isSubagentTask: true,
        parentTaskId: parentId,
        subtasks: [],
        depth: 1,
        estimatedDuration: 2, // 2 minutes per subtask
        progress: 0,
        outputs: [],
        dependsOn: index > 0 ? [`subtask_${agentTask.id}_${index - 1}`] : [],
        blockedBy: []
      });
    });

    return subtasks;
  }

  // ==========================================================================
  // HISTORICAL RECONSTRUCTION
  // ==========================================================================

  /**
   * Reconstruct task plans from historical agent activities
   *
   * Use case: User wants to see what was done in past sessions
   *
   * @param timeRange - Optional time range filter
   * @returns Reconstructed historical plans
   */
  async reconstructHistoricalPlans(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<HistoricalTaskReconstruction[]> {
    const reconstructions: HistoricalTaskReconstruction[] = [];

    // Filter activities by time range
    let activities = this.historicalActivities;
    if (timeRange) {
      activities = activities.filter(a =>
        a.startTime &&
        a.startTime >= timeRange.start.getTime() &&
        a.startTime <= timeRange.end.getTime()
      );
    }

    // Group activities by logical task groupings
    const taskGroups = this.groupActivitiesByTask(activities);

    // Reconstruct plan for each group
    for (const group of taskGroups) {
      const reconstruction = await this.reconstructTaskGroup(group);
      if (reconstruction) {
        reconstructions.push(reconstruction);
      }
    }

    this.emit('historical-plans-reconstructed', {
      count: reconstructions.length,
      timeRange
    });

    return reconstructions;
  }

  /**
   * Group activities into logical task groupings
   */
  private groupActivitiesByTask(activities: CapturedAgentActivity[]): CapturedAgentActivity[][] {
    const groups: CapturedAgentActivity[][] = [];
    let currentGroup: CapturedAgentActivity[] = [];

    // Group by time proximity and phase
    activities.forEach((activity, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(activity);
        return;
      }

      const lastActivity = currentGroup[currentGroup.length - 1];

      // Same group if within 5 minutes and same phase
      const timeDiff = (activity.startTime || 0) - (lastActivity.endTime || lastActivity.startTime || 0);
      const samePhase = activity.phase === lastActivity.phase;

      if (timeDiff < 5 * 60 * 1000 && samePhase) {
        currentGroup.push(activity);
      } else {
        groups.push(currentGroup);
        currentGroup = [activity];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Reconstruct a single task group as a plan
   */
  private async reconstructTaskGroup(
    group: CapturedAgentActivity[]
  ): Promise<HistoricalTaskReconstruction | null> {
    if (group.length === 0) return null;

    const planId = `historical_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Reconstruct root task
    const rootTask = group[0];
    const rootTaskDescription = this.summarizeTaskGroup(group);

    // Convert activities to tasks
    const tasks: Task[] = group.map((activity, index) => ({
      id: `historical_task_${index}`,
      description: activity.taskDescription,
      status: activity.status === 'completed' ? 'completed' : 'failed',
      assignedAgent: activity.agent,
      isSubagentTask: index > 0, // First task is root, rest are subagents
      parentTaskId: index > 0 ? 'historical_task_0' : undefined,
      subtasks: [],
      depth: index > 0 ? 1 : 0,
      estimatedDuration: 5,
      actualDuration: this.calculateActivityDuration(activity),
      startedAt: activity.startTime ? new Date(activity.startTime) : undefined,
      completedAt: activity.endTime ? new Date(activity.endTime) : undefined,
      progress: activity.status === 'completed' ? 100 : 0,
      outputs: [],
      dependsOn: [],
      blockedBy: []
    }));

    // Build hierarchy
    const rootTaskObj = tasks[0];
    rootTaskObj.subtasks = tasks.slice(1);

    const reconstruction: HistoricalTaskReconstruction = {
      planId,
      rootTask: rootTaskDescription,
      tasks: [rootTaskObj],
      startedAt: rootTask.startTime ? new Date(rootTask.startTime) : new Date(),
      completedAt: group[group.length - 1].endTime ? new Date(group[group.length - 1].endTime) : undefined,
      involvedAgents: Array.from(new Set(group.map(a => a.agent)))
    };

    return reconstruction;
  }

  /**
   * Summarize a group of activities into a root task description
   */
  private summarizeTaskGroup(group: CapturedAgentActivity[]): string {
    const agents = Array.from(new Set(group.map(a => a.agent)));
    const phase = group[0].phase;

    if (group.length === 1) {
      return group[0].taskDescription;
    }

    return `${phase} phase collaboration (${agents.join(', ')})`;
  }

  /**
   * Calculate activity duration
   */
  private calculateActivityDuration(activity: CapturedAgentActivity): number {
    if (!activity.startTime || !activity.endTime) return 0;
    return (activity.endTime - activity.startTime) / (1000 * 60); // minutes
  }

  // ==========================================================================
  // PROGRESS SYNCHRONIZATION
  // ==========================================================================

  /**
   * Update task progress from agent task status
   */
  async syncAgentTaskProgress(agentTask: AgentTask): Promise<void> {
    const planId = this.agentTaskToPlan.get(agentTask.id);
    if (!planId) return;

    const plan = this.taskPlanManager.getPlan(planId);
    if (!plan) return;

    // Find corresponding task in plan
    const task = this.findTaskByAgentTaskId(plan, agentTask.id);
    if (!task) return;

    // Update task progress
    task.status = this.mapAgentTaskStatus(agentTask.status);
    task.progress = this.calculateAgentTaskProgress(agentTask);

    if (agentTask.status === 'completed' && agentTask.endTime) {
      task.completedAt = new Date(agentTask.endTime);
    }

    this.emit('task-progress-synced', { agentTask, task, plan });
  }

  /**
   * Find task in plan by agent task ID
   */
  private findTaskByAgentTaskId(plan: TaskPlan, agentTaskId: string): Task | null {
    const taskId = `task_${agentTaskId}`;

    const findTask = (tasks: Task[]): Task | null => {
      for (const task of tasks) {
        if (task.id === taskId) return task;
        const found = findTask(task.subtasks);
        if (found) return found;
      }
      return null;
    };

    return findTask(plan.tasks);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Map agent task status to task status
   */
  private mapAgentTaskStatus(status: AgentTask['status']): Task['status'] {
    const mapping: Record<AgentTask['status'], Task['status']> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'failed': 'failed'
    };
    return mapping[status];
  }

  /**
   * Map priority level to plan priority
   */
  private mapPriorityLevel(priority: number): 'low' | 'medium' | 'high' | 'critical' {
    if (priority >= 8) return 'critical';
    if (priority >= 6) return 'high';
    if (priority >= 4) return 'medium';
    return 'low';
  }

  /**
   * Calculate agent task progress
   */
  private calculateAgentTaskProgress(agentTask: AgentTask): number {
    if (agentTask.status === 'completed') return 100;
    if (agentTask.status === 'failed') return 0;
    if (agentTask.status === 'in_progress') return 50;
    return 0;
  }

  /**
   * Estimate task duration based on agent and priority
   */
  private estimateTaskDuration(agentTask: AgentTask): number {
    // Base duration by priority
    const baseDuration = 10 - agentTask.priority; // Higher priority = faster

    // Agent-specific multipliers
    const agentMultipliers: Record<AgentRole, number> = {
      'maria-qa': 1.2, // Testing takes time
      'james-frontend': 1.0,
      'marcus-backend': 1.1,
      'sarah-pm': 0.8, // Coordination is quick
      'alex-ba': 0.9,
      'dr-ai-ml': 1.5  // ML tasks take longer
    };

    const multiplier = agentMultipliers[agentTask.agent] || 1.0;

    return Math.round(baseDuration * multiplier);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Get plan ID for an agent task
   */
  getPlanIdForAgentTask(agentTaskId: string): string | undefined {
    return this.agentTaskToPlan.get(agentTaskId);
  }

  /**
   * Get agent tasks for a plan
   */
  getAgentTasksForPlan(planId: string): AgentTask[] {
    return this.planToAgentTasks.get(planId) || [];
  }

  /**
   * Get all historical activities
   */
  getHistoricalActivities(): CapturedAgentActivity[] {
    return [...this.historicalActivities];
  }

  /**
   * Clear historical activities
   */
  clearHistory(): void {
    this.historicalActivities = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SDKTaskIntegration;
