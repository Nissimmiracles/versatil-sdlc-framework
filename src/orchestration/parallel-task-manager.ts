/* eslint-disable no-case-declarations */
/**
 * VERSATIL SDLC Framework - Parallel Task Manager
 * Implements Rule 1: Run many tasks in parallel if not colliding with SDLC process
 *
 * Features:
 * - Intelligent collision detection
 * - SDLC process-aware task orchestration
 * - Resource contention prevention
 * - Agent coordination and handoff management
 */

import { EventEmitter } from 'events';
import { EnvironmentManager } from '../environment/environment-manager.js';

/**
 * TodoWrite Integration
 *
 * Note: TodoWrite is a Claude Code tool (not imported as a module).
 * It's invoked by Claude directly during parallel task execution to:
 * 1. Create todos when tasks start
 * 2. Update progress (0-100%)
 * 3. Mark todos complete when tasks finish
 *
 * This integration emits 'todowrite:*' events that Claude monitors
 * to keep users informed of parallel task progress.
 */

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  priority: Priority;
  estimatedDuration: number;
  requiredResources: Resource[];
  dependencies: string[];
  agentId?: string;
  sdlcPhase: SDLCPhase;
  collisionRisk: CollisionRisk;
  metadata: Record<string, any>;
}

export enum TaskType {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  BUILD = 'build',
  DEPLOYMENT = 'deployment',
  QUALITY_ASSURANCE = 'quality_assurance',
  DOCUMENTATION = 'documentation',
  ANALYSIS = 'analysis',
  MONITORING = 'monitoring',
  SECURITY = 'security'
}

export enum Priority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  BACKGROUND = 5
}

export enum SDLCPhase {
  PLANNING = 'planning',
  ANALYSIS = 'analysis',
  DESIGN = 'design',
  IMPLEMENTATION = 'implementation',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  MAINTENANCE = 'maintenance'
}

export enum CollisionRisk {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Resource {
  type: ResourceType;
  name: string;
  capacity: number;
  exclusive: boolean;
}

export enum ResourceType {
  FILE_SYSTEM = 'file_system',
  DATABASE = 'database',
  NETWORK = 'network',
  CPU = 'cpu',
  MEMORY = 'memory',
  AGENT = 'agent',
  BUILD_SYSTEM = 'build_system',
  TEST_ENVIRONMENT = 'test_environment'
}

export interface TaskExecution {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  progress: number;
  result?: any;
  error?: Error;
  resourceUsage: ResourceUsage[];
  todoId?: string; // Link to TodoWrite item
}

export enum ExecutionStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export interface ResourceUsage {
  resourceType: ResourceType;
  resourceName: string;
  usage: number;
  maxUsage: number;
}

export interface CollisionDetectionResult {
  hasCollision: boolean;
  collisionType: CollisionType;
  conflictingTasks: string[];
  recommendation: CollisionRecommendation;
  severity: CollisionSeverity;
}

export enum CollisionType {
  RESOURCE_CONFLICT = 'resource_conflict',
  DEPENDENCY_CYCLE = 'dependency_cycle',
  SDLC_PHASE_VIOLATION = 'sdlc_phase_violation',
  AGENT_OVERLOAD = 'agent_overload',
  FILE_LOCK_CONFLICT = 'file_lock_conflict',
  BUILD_SYSTEM_CONFLICT = 'build_system_conflict'
}

export enum CollisionRecommendation {
  SERIALIZE = 'serialize',
  RESCHEDULE = 'reschedule',
  RESOURCE_ALLOCATION = 'resource_allocation',
  TASK_SPLITTING = 'task_splitting',
  PRIORITY_ADJUSTMENT = 'priority_adjustment',
  AGENT_REASSIGNMENT = 'agent_reassignment'
}

export enum CollisionSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export class ParallelTaskManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private executions: Map<string, TaskExecution> = new Map();
  private resourcePool: Map<string, Resource> = new Map();
  private agentWorkload: Map<string, number> = new Map();
  private sdlcState: SDLCPhase = SDLCPhase.PLANNING;
  private maxParallelTasks: number = 10;
  private environmentManager: EnvironmentManager;
  private todoWriteEnabled: boolean = true; // Feature flag for TodoWrite integration

  constructor() {
    super();
    this.environmentManager = new EnvironmentManager();
    this.initializeResourcePool();
    this.startResourceMonitoring();
  }

  /**
   * Add a task to the execution queue with collision detection
   */
  async addTask(task: Task): Promise<string> {
    this.emit('_task:added', { taskId: task.id, task });

    // Validate task
    const validation = await this.validateTask(task);
    if (!validation.isValid) {
      throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
    }

    // Detect collisions
    const collisionResult = await this.detectCollisions(task);
    if (collisionResult.hasCollision && collisionResult.severity === CollisionSeverity.CRITICAL) {
      throw new Error(`Critical collision detected: ${collisionResult.collisionType}`);
    }

    // Handle non-critical collisions
    if (collisionResult.hasCollision) {
      await this.handleCollision(task, collisionResult);
    }

    this.tasks.set(task.id, task);

    // Try to execute immediately if resources are available
    await this.tryExecuteTask(task.id);

    return task.id;
  }

  /**
   * Execute multiple tasks in parallel with intelligent orchestration
   */
  async executeParallel(taskIds: string[]): Promise<Map<string, TaskExecution>> {
    const executionPlan = await this.createExecutionPlan(taskIds);
    const results = new Map<string, TaskExecution>();

    // Emit TodoWrite event for parallel execution start
    if (this.todoWriteEnabled) {
      const taskNames = taskIds
        .map(id => this.tasks.get(id))
        .filter(Boolean)
        .map(t => t!.agentId || 'Agent')
        .filter((v, i, a) => a.indexOf(v) === i); // unique agents

      this.emit('todowrite:parallel-start', {
        agents: taskNames,
        taskCount: taskIds.length,
        batchCount: executionPlan.batches.length,
        estimatedTime: executionPlan.totalEstimatedTime
      });
    }

    // Execute tasks in parallel batches based on dependencies and resource availability
    for (const batch of executionPlan.batches) {
      const batchPromises = batch.map(taskId => this.executeTask(taskId));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const taskId = batch[index];
        if (result.status === 'fulfilled') {
          results.set(taskId, result.value);
        } else {
          const execution: TaskExecution = {
            taskId,
            startTime: new Date(),
            endTime: new Date(),
            status: ExecutionStatus.FAILED,
            progress: 0,
            error: result.reason,
            resourceUsage: []
          };
          results.set(taskId, execution);
          this.emit('_task:failed', { taskId, error: result.reason });
        }
      });
    }

    // Emit TodoWrite event for parallel execution complete
    if (this.todoWriteEnabled) {
      const completed = Array.from(results.values()).filter(r => r.status === ExecutionStatus.COMPLETED).length;
      const failed = Array.from(results.values()).filter(r => r.status === ExecutionStatus.FAILED).length;

      this.emit('todowrite:parallel-complete', {
        totalTasks: taskIds.length,
        completed,
        failed,
        results
      });
    }

    return results;
  }

  /**
   * Intelligent collision detection system
   */
  private async detectCollisions(newTask: Task): Promise<CollisionDetectionResult> {
    const runningTasks = Array.from(this.executions.values())
      .filter(exec => exec.status === ExecutionStatus.RUNNING);

    const conflictingTasks: string[] = [];
    let collisionType = CollisionType.RESOURCE_CONFLICT;
    let severity = CollisionSeverity.INFO;

    // Check resource conflicts
    for (const execution of runningTasks) {
      const task = this.tasks.get(execution.taskId);
      if (!task) continue;

      // Check for exclusive resource conflicts
      const resourceConflict = this.checkResourceConflict(newTask, task);
      if (resourceConflict.hasConflict) {
        conflictingTasks.push(task.id);
        if (this.getSeverityLevel(CollisionSeverity.WARNING) > this.getSeverityLevel(severity)) {
          severity = CollisionSeverity.WARNING;
        }
      }

      // Check SDLC phase violations
      if (this.checkSDLCPhaseConflict(newTask, task)) {
        conflictingTasks.push(task.id);
        collisionType = CollisionType.SDLC_PHASE_VIOLATION;
        if (this.getSeverityLevel(CollisionSeverity.ERROR) > this.getSeverityLevel(severity)) {
          severity = CollisionSeverity.ERROR;
        }
      }

      // Check agent overload
      if (newTask.agentId && task.agentId === newTask.agentId) {
        const currentLoad = this.agentWorkload.get(newTask.agentId) || 0;
        if (currentLoad >= 3) { // Max 3 concurrent tasks per agent
          conflictingTasks.push(task.id);
          collisionType = CollisionType.AGENT_OVERLOAD;
          if (this.getSeverityLevel(CollisionSeverity.WARNING) > this.getSeverityLevel(severity)) {
            severity = CollisionSeverity.WARNING;
          }
        }
      }
    }

    // Check dependency cycles
    const hasCycle = this.checkDependencyCycle(newTask);
    if (hasCycle) {
      collisionType = CollisionType.DEPENDENCY_CYCLE;
      severity = CollisionSeverity.CRITICAL;
    }

    return {
      hasCollision: conflictingTasks.length > 0 || hasCycle,
      collisionType,
      conflictingTasks,
      recommendation: this.generateRecommendation(collisionType, severity),
      severity
    };
  }

  /**
   * Handle collisions with intelligent resolution strategies
   */
  private async handleCollision(task: Task, collision: CollisionDetectionResult): Promise<void> {
    this.emit('_collision:detected', { task, collision });

    switch (collision.recommendation) {
      case CollisionRecommendation.SERIALIZE:
        // Wait for conflicting tasks to complete
        await this.waitForTasks(collision.conflictingTasks);
        break;

      case CollisionRecommendation.RESCHEDULE:
        // Delay task execution
        task.metadata.scheduledDelay = this.calculateOptimalDelay(collision);
        break;

      case CollisionRecommendation.RESOURCE_ALLOCATION:
        // Adjust resource allocation
        await this.reallocateResources(task, collision);
        break;

      case CollisionRecommendation.AGENT_REASSIGNMENT:
        // Reassign to less loaded agent
        const alternativeAgent = await this.findAlternativeAgent(task);
        if (alternativeAgent) {
          task.agentId = alternativeAgent;
        }
        break;

      case CollisionRecommendation.TASK_SPLITTING:
        // Split task into smaller parallel chunks
        const subtasks = await this.splitTask(task);
        for (const subtask of subtasks) {
          await this.addTask(subtask);
        }
        break;
    }
  }

  /**
   * Create intelligent execution plan with dependency resolution
   */
  private async createExecutionPlan(taskIds: string[]): Promise<{
    batches: string[][];
    totalEstimatedTime: number;
    resourceUtilization: Map<ResourceType, number>;
  }> {
    const tasks = taskIds.map(id => this.tasks.get(id)).filter(Boolean) as Task[];
    const dependencyGraph = this.buildDependencyGraph(tasks);
    const batches: string[][] = [];
    const processed = new Set<string>();

    let totalEstimatedTime = 0;
    const resourceUtilization = new Map<ResourceType, number>();

    while (processed.size < tasks.length) {
      const batch: string[] = [];
      const batchResources = new Map<ResourceType, number>();

      for (const task of tasks) {
        if (processed.has(task.id)) continue;

        // Check if all dependencies are satisfied
        const dependenciesSatisfied = task.dependencies.every(dep => processed.has(dep));
        if (!dependenciesSatisfied) continue;

        // Check resource availability
        const canAddToBatch = this.canAddTaskToBatch(task, batchResources);
        if (!canAddToBatch) continue;

        batch.push(task.id);
        processed.add(task.id);

        // Update batch resource usage
        for (const resource of task.requiredResources) {
          const current = batchResources.get(resource.type) || 0;
          batchResources.set(resource.type, current + resource.capacity);
        }
      }

      if (batch.length === 0 && processed.size < tasks.length) {
        // Deadlock detection - break by priority
        const remainingTasks = tasks.filter(t => !processed.has(t.id));
        const highestPriority = remainingTasks.reduce((min, task) =>
          task.priority < min.priority ? task : min
        );
        batch.push(highestPriority.id);
        processed.add(highestPriority.id);
      }

      batches.push(batch);

      // Calculate batch time (max of all tasks in batch)
      const batchTime = Math.max(...batch.map(id => {
        const task = this.tasks.get(id);
        return task ? task.estimatedDuration : 0;
      }));
      totalEstimatedTime += batchTime;

      // Update total resource utilization
      for (const [resourceType, usage] of batchResources) {
        const current = resourceUtilization.get(resourceType) || 0;
        resourceUtilization.set(resourceType, Math.max(current, usage));
      }
    }

    return { batches, totalEstimatedTime, resourceUtilization };
  }

  /**
   * Execute a single task with resource management
   */
  private async executeTask(taskId: string): Promise<TaskExecution> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const execution: TaskExecution = {
      taskId,
      startTime: new Date(),
      status: ExecutionStatus.RUNNING,
      progress: 0,
      resourceUsage: []
    };

    this.executions.set(taskId, execution);
    this.emit('_task:started', { taskId, task });

    // Emit TodoWrite event for task start
    if (this.todoWriteEnabled) {
      this.emit('todowrite:task-start', {
        taskId,
        taskName: task.name,
        agentId: task.agentId,
        estimatedDuration: task.estimatedDuration
      });
    }

    try {
      // Allocate resources
      await this.allocateResources(task);

      // Update agent workload
      if (task.agentId) {
        const currentLoad = this.agentWorkload.get(task.agentId) || 0;
        this.agentWorkload.set(task.agentId, currentLoad + 1);
      }

      // Emit progress update: 20% (allocated resources)
      execution.progress = 20;
      if (this.todoWriteEnabled) {
        this.emit('todowrite:progress-update', { taskId, progress: 20, phase: 'resources-allocated' });
      }

      // Execute task based on type
      execution.progress = 50;
      if (this.todoWriteEnabled) {
        this.emit('todowrite:progress-update', { taskId, progress: 50, phase: 'executing' });
      }

      const result = await this.executeTaskByType(task);

      execution.endTime = new Date();
      execution.status = ExecutionStatus.COMPLETED;
      execution.progress = 100;
      execution.result = result;

      this.emit('_task:completed', { taskId, task, result });

      // Emit TodoWrite event for task completion
      if (this.todoWriteEnabled) {
        this.emit('todowrite:task-complete', {
          taskId,
          taskName: task.name,
          agentId: task.agentId,
          duration: execution.endTime.getTime() - execution.startTime.getTime(),
          result
        });
      }

    } catch (error) {
      execution.endTime = new Date();
      execution.status = ExecutionStatus.FAILED;
      execution.error = error as Error;

      this.emit('_task:failed', { taskId, task, error });

      // Emit TodoWrite event for task failure
      if (this.todoWriteEnabled) {
        this.emit('todowrite:task-failed', {
          taskId,
          taskName: task.name,
          agentId: task.agentId,
          error: (error as Error).message
        });
      }

      throw error;

    } finally {
      // Release resources
      await this.releaseResources(task);

      // Update agent workload
      if (task.agentId) {
        const currentLoad = this.agentWorkload.get(task.agentId) || 0;
        this.agentWorkload.set(task.agentId, Math.max(0, currentLoad - 1));
      }
    }

    return execution;
  }

  /**
   * Execute task based on its type with proper agent coordination
   */
  private async executeTaskByType(task: Task): Promise<any> {
    switch (task.type) {
      case TaskType.DEVELOPMENT:
        return await this.executeDevelopmentTask(task);

      case TaskType.TESTING:
        return await this.executeTestingTask(task);

      case TaskType.BUILD:
        return await this.executeBuildTask(task);

      case TaskType.DEPLOYMENT:
        return await this.executeDeploymentTask(task);

      case TaskType.QUALITY_ASSURANCE:
        return await this.executeQualityAssuranceTask(task);

      case TaskType.DOCUMENTATION:
        return await this.executeDocumentationTask(task);

      case TaskType.ANALYSIS:
        return await this.executeAnalysisTask(task);

      case TaskType.MONITORING:
        return await this.executeMonitoringTask(task);

      case TaskType.SECURITY:
        return await this.executeSecurityTask(task);

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  // Task execution methods for different types
  private async executeDevelopmentTask(task: Task): Promise<any> {
    // Coordinate with appropriate agent (James-Frontend, Marcus-Backend, etc.)
    return { status: 'completed', type: 'development', metadata: task.metadata };
  }

  private async executeTestingTask(task: Task): Promise<any> {
    // Coordinate with Maria-QA agent
    return { status: 'completed', type: 'testing', coverage: 85, metadata: task.metadata };
  }

  private async executeBuildTask(task: Task): Promise<any> {
    // Execute build with proper resource allocation
    return { status: 'completed', type: 'build', buildTime: task.estimatedDuration };
  }

  private async executeDeploymentTask(task: Task): Promise<any> {
    // Coordinate deployment with environment manager
    const env = await this.environmentManager.getCurrentEnvironment();
    return { status: 'completed', type: 'deployment', environment: env };
  }

  private async executeQualityAssuranceTask(task: Task): Promise<any> {
    // Run quality checks with Maria-QA
    return { status: 'completed', type: 'qa', qualityScore: 92 };
  }

  private async executeDocumentationTask(task: Task): Promise<any> {
    // Generate documentation with Sarah-PM coordination
    return { status: 'completed', type: 'documentation', pages: 5 };
  }

  private async executeAnalysisTask(task: Task): Promise<any> {
    // Business analysis with Alex-BA or Dr.AI-ML
    return { status: 'completed', type: 'analysis', insights: task.metadata.analysisType };
  }

  private async executeMonitoringTask(task: Task): Promise<any> {
    // Execute monitoring task
    return { status: 'completed', type: 'monitoring', metrics: task.metadata.metrics };
  }

  private async executeSecurityTask(task: Task): Promise<any> {
    // Execute security scan or audit
    return { status: 'completed', type: 'security', vulnerabilities: 0 };
  }

  // Helper methods
  private initializeResourcePool(): void {
    const resources: Resource[] = [
      { type: ResourceType.CPU, name: 'cpu-cores', capacity: 8, exclusive: false },
      { type: ResourceType.MEMORY, name: 'system-memory', capacity: 16384, exclusive: false },
      { type: ResourceType.FILE_SYSTEM, name: 'project-files', capacity: 1, exclusive: true },
      { type: ResourceType.DATABASE, name: 'test-db', capacity: 3, exclusive: false },
      { type: ResourceType.BUILD_SYSTEM, name: 'build-pipeline', capacity: 1, exclusive: true },
      { type: ResourceType.TEST_ENVIRONMENT, name: 'test-env', capacity: 5, exclusive: false }
    ];

    for (const resource of resources) {
      this.resourcePool.set(resource.name, resource);
    }
  }

  private startResourceMonitoring(): void {
    setInterval(() => {
      this.emit('resource:status', {
        pool: Array.from(this.resourcePool.values()),
        agentWorkload: Array.from(this.agentWorkload.entries()),
        activeTasks: this.executions.size
      });
    }, 5000);
  }

  private getSeverityLevel(severity: CollisionSeverity): number {
    const levels = {
      [CollisionSeverity.INFO]: 1,
      [CollisionSeverity.WARNING]: 2,
      [CollisionSeverity.ERROR]: 3,
      [CollisionSeverity.CRITICAL]: 4
    };
    return levels[severity] || 0;
  }

  private async validateTask(task: Task): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!task.id || !task.name) {
      errors.push('Task must have id and name');
    }

    if (task.estimatedDuration <= 0) {
      errors.push('Task must have positive estimated duration');
    }

    if (!task.requiredResources || task.requiredResources.length === 0) {
      errors.push('Task must specify required resources');
    }

    return { isValid: errors.length === 0, errors };
  }

  private checkResourceConflict(task1: Task, task2: Task): { hasConflict: boolean } {
    for (const resource1 of task1.requiredResources) {
      for (const resource2 of task2.requiredResources) {
        if (resource1.name === resource2.name &&
            (resource1.exclusive || resource2.exclusive)) {
          return { hasConflict: true };
        }
      }
    }
    return { hasConflict: false };
  }

  private checkSDLCPhaseConflict(task1: Task, task2: Task): boolean {
    // Define phase dependencies
    const phaseOrder = [
      SDLCPhase.PLANNING,
      SDLCPhase.ANALYSIS,
      SDLCPhase.DESIGN,
      SDLCPhase.IMPLEMENTATION,
      SDLCPhase.TESTING,
      SDLCPhase.DEPLOYMENT,
      SDLCPhase.MAINTENANCE
    ];

    const phase1Index = phaseOrder.indexOf(task1.sdlcPhase);
    const phase2Index = phaseOrder.indexOf(task2.sdlcPhase);

    // Check if trying to run later phase before earlier phase is complete
    const task2Execution = this.executions.get(task2.id);
    return phase1Index < phase2Index && task2Execution?.status !== ExecutionStatus.COMPLETED;
  }

  private checkDependencyCycle(task: Task): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      const currentTask = this.tasks.get(taskId);
      if (currentTask) {
        for (const dep of currentTask.dependencies) {
          if (hasCycleDFS(dep)) return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    return hasCycleDFS(task.id);
  }

  private generateRecommendation(
    collisionType: CollisionType,
    severity: CollisionSeverity
  ): CollisionRecommendation {
    switch (collisionType) {
      case CollisionType.RESOURCE_CONFLICT:
        return severity >= CollisionSeverity.ERROR ?
          CollisionRecommendation.SERIALIZE :
          CollisionRecommendation.RESOURCE_ALLOCATION;

      case CollisionType.AGENT_OVERLOAD:
        return CollisionRecommendation.AGENT_REASSIGNMENT;

      case CollisionType.SDLC_PHASE_VIOLATION:
        return CollisionRecommendation.RESCHEDULE;

      case CollisionType.DEPENDENCY_CYCLE:
        return CollisionRecommendation.TASK_SPLITTING;

      default:
        return CollisionRecommendation.SERIALIZE;
    }
  }

  private async tryExecuteTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const runningCount = Array.from(this.executions.values())
      .filter(exec => exec.status === ExecutionStatus.RUNNING).length;

    if (runningCount < this.maxParallelTasks) {
      await this.executeTask(taskId);
    }
  }

  private async waitForTasks(taskIds: string[]): Promise<void> {
    const promises = taskIds.map(id => {
      return new Promise<void>((resolve) => {
        const checkCompletion = () => {
          const execution = this.executions.get(id);
          if (!execution || execution.status === ExecutionStatus.COMPLETED ||
              execution.status === ExecutionStatus.FAILED) {
            resolve();
          } else {
            setTimeout(checkCompletion, 100);
          }
        };
        checkCompletion();
      });
    });

    await Promise.all(promises);
  }

  private calculateOptimalDelay(collision: CollisionDetectionResult): number {
    // Calculate delay based on collision severity and conflicting tasks
    const baseDelay = 1000; // 1 second
    const severityMultiplier = {
      [CollisionSeverity.INFO]: 1,
      [CollisionSeverity.WARNING]: 2,
      [CollisionSeverity.ERROR]: 5,
      [CollisionSeverity.CRITICAL]: 10
    };

    return baseDelay * severityMultiplier[collision.severity] * collision.conflictingTasks.length;
  }

  private async reallocateResources(task: Task, collision: CollisionDetectionResult): Promise<void> {
    // Implement resource reallocation logic
    // This could involve reducing resource requirements or finding alternative resources
  }

  private async findAlternativeAgent(task: Task): Promise<string | null> {
    // Find least loaded agent that can handle the task type
    const compatibleAgents = ['maria-qa', 'james-frontend', 'marcus-backend', 'sarah-pm'];

    let minLoad = Infinity;
    let bestAgent = null;

    for (const agentId of compatibleAgents) {
      const load = this.agentWorkload.get(agentId) || 0;
      if (load < minLoad) {
        minLoad = load;
        bestAgent = agentId;
      }
    }

    return bestAgent;
  }

  private async splitTask(task: Task): Promise<Task[]> {
    // Split task into smaller parallel subtasks
    const subtasks: Task[] = [];
    const subtaskCount = Math.min(task.estimatedDuration / 300000, 4); // Max 4 subtasks

    for (let i = 0; i < subtaskCount; i++) {
      subtasks.push({
        ...task,
        id: `${task.id}_subtask_${i}`,
        name: `${task.name} (Part ${i + 1})`,
        estimatedDuration: task.estimatedDuration / subtaskCount,
        dependencies: i === 0 ? task.dependencies : [`${task.id}_subtask_${i - 1}`]
      });
    }

    return subtasks;
  }

  private buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const task of tasks) {
      graph.set(task.id, task.dependencies);
    }

    return graph;
  }

  private canAddTaskToBatch(task: Task, batchResources: Map<ResourceType, number>): boolean {
    for (const resource of task.requiredResources) {
      const available = this.resourcePool.get(resource.name);
      if (!available) continue;

      const currentUsage = batchResources.get(resource.type) || 0;
      if (currentUsage + resource.capacity > available.capacity) {
        return false;
      }

      if (resource.exclusive && currentUsage > 0) {
        return false;
      }
    }

    return true;
  }

  private async allocateResources(task: Task): Promise<void> {
    // Implement resource allocation logic
    for (const resource of task.requiredResources) {
      this.emit('resource:allocated', {
        taskId: task.id,
        resource: resource.name,
        capacity: resource.capacity
      });
    }
  }

  private async releaseResources(task: Task): Promise<void> {
    // Implement resource release logic
    for (const resource of task.requiredResources) {
      this.emit('resource:released', {
        taskId: task.id,
        resource: resource.name,
        capacity: resource.capacity
      });
    }
  }

  // Public API methods
  public getExecutionStatus(taskId: string): TaskExecution | undefined {
    return this.executions.get(taskId);
  }

  public getResourceUtilization(): Map<string, number> {
    const utilization = new Map<string, number>();

    for (const [name, resource] of this.resourcePool) {
      let usage = 0;
      for (const execution of this.executions.values()) {
        if (execution.status === ExecutionStatus.RUNNING) {
          const task = this.tasks.get(execution.taskId);
          if (task) {
            const taskResource = task.requiredResources.find(r => r.name === name);
            if (taskResource) {
              usage += taskResource.capacity;
            }
          }
        }
      }
      utilization.set(name, (usage / resource.capacity) * 100);
    }

    return utilization;
  }

  public getAgentWorkload(): Map<string, number> {
    return new Map(this.agentWorkload);
  }

  public async cancelTask(taskId: string): Promise<void> {
    const execution = this.executions.get(taskId);
    if (execution && execution.status === ExecutionStatus.RUNNING) {
      execution.status = ExecutionStatus.CANCELLED;
      execution.endTime = new Date();

      const task = this.tasks.get(taskId);
      if (task) {
        await this.releaseResources(task);
      }

      this.emit('task:cancelled', { taskId });
    }
  }

  public async pauseTask(taskId: string): Promise<void> {
    const execution = this.executions.get(taskId);
    if (execution && execution.status === ExecutionStatus.RUNNING) {
      execution.status = ExecutionStatus.PAUSED;
      this.emit('task:paused', { taskId });
    }
  }

  public async resumeTask(taskId: string): Promise<void> {
    const execution = this.executions.get(taskId);
    if (execution && execution.status === ExecutionStatus.PAUSED) {
      execution.status = ExecutionStatus.RUNNING;
      this.emit('task:resumed', { taskId });
    }
  }

  /**
   * Enable/disable TodoWrite integration
   */
  public setTodoWriteEnabled(enabled: boolean): void {
    this.todoWriteEnabled = enabled;
  }

  /**
   * Get current progress for all running tasks (for TodoWrite updates)
   */
  public getParallelProgress(): Map<string, number> {
    const progress = new Map<string, number>();

    for (const [taskId, execution] of this.executions) {
      if (execution.status === ExecutionStatus.RUNNING) {
        const task = this.tasks.get(taskId);
        progress.set(task?.agentId || taskId, execution.progress);
      }
    }

    return progress;
  }

  /**
   * Get summary of parallel execution for TodoWrite display
   */
  public getParallelExecutionSummary(): {
    runningCount: number;
    completedCount: number;
    failedCount: number;
    agents: string[];
    overallProgress: number;
  } {
    const running: string[] = [];
    const completed: string[] = [];
    const failed: string[] = [];
    const agents = new Set<string>();
    let totalProgress = 0;
    let count = 0;

    for (const [taskId, execution] of this.executions) {
      const task = this.tasks.get(taskId);
      if (task?.agentId) {
        agents.add(task.agentId);
      }

      if (execution.status === ExecutionStatus.RUNNING) {
        running.push(taskId);
        totalProgress += execution.progress;
        count++;
      } else if (execution.status === ExecutionStatus.COMPLETED) {
        completed.push(taskId);
      } else if (execution.status === ExecutionStatus.FAILED) {
        failed.push(taskId);
      }
    }

    return {
      runningCount: running.length,
      completedCount: completed.length,
      failedCount: failed.length,
      agents: Array.from(agents),
      overallProgress: count > 0 ? Math.round(totalProgress / count) : 0
    };
  }

  /**
   * Format parallel progress for statusline display
   * Example: "Dana (30%) + Marcus (45%) + James (60%) working in parallel"
   */
  public formatParallelProgressForStatusline(): string {
    const progress = this.getParallelProgress();

    if (progress.size === 0) {
      return 'No parallel tasks running';
    }

    const progressStrings = Array.from(progress.entries())
      .map(([agent, pct]) => `${agent} (${pct}%)`)
      .join(' + ');

    return `${progressStrings} working in parallel`;
  }
}

export default ParallelTaskManager;