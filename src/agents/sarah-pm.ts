/**
 * Sarah-PM Agent
 *
 * Project Management & Orchestration Specialist
 *
 * Role:
 * - Coordinate multi-agent workflows
 * - Generate execution waves with dependency analysis
 * - Detect and resolve agent conflicts
 * - Plan sprints and track milestones
 * - Generate project reports and dashboards
 *
 * Activation:
 * - FRAMEWORK CONTEXT ONLY (not available in user projects)
 * - AUTO: When coordinating multiple agents
 * - MANUAL: /sarah-pm command
 *
 * Responsibilities:
 * - Create execution waves for parallel task execution
 * - Coordinate handoffs between agents
 * - Detect collision risks and prevent conflicts
 * - Track SDLC phase progression
 * - Generate architectural decisions and reports
 *
 * IMPORTANT: Sarah-PM is a framework-only agent for coordinating the OPERA
 * agent system itself. For user project coordination, use the standard OPERA
 * agents (Maria-QA, Marcus-Backend, James-Frontend, etc.)
 */

import { ProactiveAgentOrchestrator, type AgentTrigger } from '../orchestration/proactive-agent-orchestrator.js';
import { ParallelTaskManager, type Task, type SDLCPhase, Priority, CollisionRisk } from '../orchestration/parallel-task-manager.js';
import type { TodoFileSpec } from '../planning/todo-file-generator.js';

export interface ExecutionWave {
  wave_number: number;
  agents: string[];
  estimated_duration: string;
  blocking: boolean; // Must complete before next wave
  coordination_checkpoints: string[];
}

export interface OrchestrationPlan {
  execution_waves: ExecutionWave[];
  coordination_checkpoints: Array<{
    checkpoint_name: string;
    blocking: boolean;
    quality_gates: string[];
    agents_involved: string[];
  }>;
  critical_path: Array<{
    task_id: string;
    task_name: string;
    agent: string;
    duration: string;
    blocking_dependency: boolean;
  }>;
  total_duration_estimate: string;
  parallel_efficiency: number; // 0-100% (how much parallelism achieved)
  collision_risks: Array<{
    risk_type: string;
    affected_agents: string[];
    mitigation: string;
  }>;
}

export interface AgentConflict {
  conflict_id: string;
  conflict_type: 'resource' | 'handoff' | 'priority' | 'timing';
  agents_involved: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_strategy: string;
  auto_resolvable: boolean;
}

export interface SprintPlan {
  sprint_number: number;
  start_date: string;
  end_date: string;
  duration_days: number;
  stories: Array<{
    story_id: string;
    title: string;
    points: number;
    agent: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  total_points: number;
  velocity: number; // Points per day
  quality_gates: string[];
}

/**
 * Sarah-PM - Project Management Agent
 */
export class SarahPM {
  private static instance: SarahPM;
  private orchestrator: ProactiveAgentOrchestrator;
  private taskManager: ParallelTaskManager;
  private workingDir: string;

  private constructor(workingDir: string = process.cwd()) {
    this.workingDir = workingDir;
    this.orchestrator = new ProactiveAgentOrchestrator({
      enabled: true,
      autoActivation: true,
      backgroundMonitoring: true
    });
    this.taskManager = new ParallelTaskManager();
  }

  /**
   * Singleton instance
   */
  static getInstance(workingDir?: string): SarahPM {
    if (!SarahPM.instance) {
      SarahPM.instance = new SarahPM(workingDir);
    }
    return SarahPM.instance;
  }

  /**
   * Generate execution waves with dependency analysis
   *
   * Takes a list of todos and organizes them into parallel execution waves
   * based on dependencies, collision risks, and SDLC phases.
   *
   * @param todos List of todo items to orchestrate
   * @returns Orchestration plan with execution waves
   */
  async generateExecutionWaves(todos: TodoFileSpec[]): Promise<OrchestrationPlan> {
    // Step 1: Convert todos to tasks
    const tasks: Task[] = todos.map((todo, index) => ({
      id: `task-${index}`,
      name: todo.title || `Task ${index + 1}`,
      type: this.inferTaskType(todo),
      priority: this.mapPriorityFromTodo(todo),
      estimatedDuration: this.estimateDuration(todo),
      requiredResources: this.inferResources(todo),
      dependencies: todo.dependencies?.depends_on || [],
      agentId: todo.assigned_agent,
      sdlcPhase: this.inferSDLCPhase(todo),
      collisionRisk: this.assessCollisionRisk(todo),
      metadata: {
        original_todo: todo
      }
    }));

    // Step 2: Analyze dependencies and create execution waves
    const waves: ExecutionWave[] = [];
    let remainingTasks = [...tasks];
    let waveNumber = 1;

    while (remainingTasks.length > 0) {
      // Find tasks with no unresolved dependencies
      const readyTasks = remainingTasks.filter(task => {
        return task.dependencies.every(depId => {
          return !remainingTasks.some(t => t.id === depId);
        });
      });

      if (readyTasks.length === 0) {
        // Circular dependency detected - break with warning
        console.warn('⚠️  Circular dependency detected in todos');
        break;
      }

      // Group tasks by agent to prevent conflicts
      const agentGroups = this.groupTasksByAgent(readyTasks);

      // Create wave
      const agents = Array.from(new Set(readyTasks.map(t => t.agentId).filter(Boolean))) as string[];
      const maxDuration = Math.max(...readyTasks.map(t => t.estimatedDuration));

      waves.push({
        wave_number: waveNumber,
        agents,
        estimated_duration: `${maxDuration} min`,
        blocking: readyTasks.some(t => t.priority <= Priority.HIGH),
        coordination_checkpoints: this.generateCheckpoints(readyTasks)
      });

      // Remove completed tasks
      remainingTasks = remainingTasks.filter(task => !readyTasks.includes(task));
      waveNumber++;
    }

    // Step 3: Identify coordination checkpoints
    const checkpoints = this.identifyCoordinationCheckpoints(waves, tasks);

    // Step 4: Calculate critical path
    const criticalPath = this.calculateCriticalPath(tasks);

    // Step 5: Estimate total duration and parallel efficiency
    const sequentialDuration = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
    const parallelDuration = waves.reduce((sum, w) => {
      const waveDuration = parseInt(w.estimated_duration.split(' ')[0]);
      return sum + waveDuration;
    }, 0);
    const parallelEfficiency = Math.round(((sequentialDuration - parallelDuration) / sequentialDuration) * 100);

    // Step 6: Identify collision risks
    const collisionRisks = this.identifyCollisionRisks(waves, tasks);

    return {
      execution_waves: waves,
      coordination_checkpoints: checkpoints,
      critical_path: criticalPath,
      total_duration_estimate: `${parallelDuration} min (vs ${sequentialDuration} min sequential)`,
      parallel_efficiency: parallelEfficiency,
      collision_risks: collisionRisks
    };
  }

  /**
   * Coordinate multiple agents working in parallel
   *
   * @param agents List of agent IDs to coordinate
   * @param context Coordination context
   */
  async coordinateAgents(
    agents: string[],
    context: {
      goal: string;
      coordination_strategy: 'sequential' | 'parallel' | 'phased';
      quality_gates: string[];
    }
  ): Promise<void> {
    console.log(`🎯 Coordinating ${agents.length} agents: ${agents.join(', ')}`);
    console.log(`   Goal: ${context.goal}`);
    console.log(`   Strategy: ${context.coordination_strategy}`);

    // Activate orchestrator for agent coordination
    // Note: startWatching removed in latest version - orchestrator starts automatically

    // TODO: Implement actual agent coordination logic
    // This would involve:
    // 1. Activating each agent with appropriate context
    // 2. Managing handoffs between agents
    // 3. Monitoring quality gates
    // 4. Resolving conflicts if they arise
  }

  /**
   * Detect and resolve agent conflicts
   *
   * @param agents List of active agents
   * @returns List of detected conflicts with resolutions
   */
  async detectConflicts(agents: string[]): Promise<AgentConflict[]> {
    const conflicts: AgentConflict[] = [];

    // TODO: Implement conflict detection logic
    // This would analyze:
    // - Resource contention (same files being modified)
    // - Handoff failures (agent expecting input from another)
    // - Priority conflicts (two high-priority tasks competing)
    // - Timing conflicts (agent blocked waiting for another)

    return conflicts;
  }

  /**
   * Generate sprint plan from backlog
   *
   * @param stories List of user stories
   * @param durationDays Sprint duration in days
   * @returns Sprint plan with agent assignments
   */
  async planSprint(
    stories: Array<{ title: string; points: number; agent?: string }>,
    durationDays: number
  ): Promise<SprintPlan> {
    const sprintNumber = 1; // TODO: Track sprint count
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + durationDays);

    const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);
    const velocity = totalPoints / durationDays;

    return {
      sprint_number: sprintNumber,
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      duration_days: durationDays,
      stories: stories.map((story, index) => ({
        story_id: `story-${index + 1}`,
        title: story.title,
        points: story.points,
        agent: story.agent || 'unassigned',
        status: 'pending' as const
      })),
      total_points: totalPoints,
      velocity,
      quality_gates: ['80%+ test coverage', 'TypeScript compile', 'No critical bugs']
    };
  }

  // Private helper methods

  private inferTaskType(todo: TodoFileSpec): any {
    const content = (todo.title || '').toLowerCase();
    if (content.includes('test')) return 'testing';
    if (content.includes('build')) return 'build';
    if (content.includes('deploy')) return 'deployment';
    if (content.includes('document')) return 'documentation';
    return 'development';
  }

  private mapPriorityFromTodo(todo: TodoFileSpec): Priority {
    if (todo.priority === 'p1') return Priority.CRITICAL;
    if (todo.priority === 'p2') return Priority.HIGH;
    if (todo.priority === 'p3') return Priority.MEDIUM;
    if (todo.priority === 'p4') return Priority.LOW;
    return Priority.BACKGROUND;
  }

  private estimateDuration(todo: TodoFileSpec): number {
    // Extract duration from todo.title if present, otherwise default
    const match = (todo.title || '').match(/(\d+)\s*(min|hour|h)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit === 'hour' || unit === 'h' ? value * 60 : value;
    }
    return 30; // Default 30 minutes
  }

  private inferResources(todo: TodoFileSpec): any[] {
    // Infer required resources from todo.title
    return [];
  }

  private inferSDLCPhase(todo: TodoFileSpec): SDLCPhase {
    const content = (todo.title || '').toLowerCase();
    if (content.includes('plan')) return 'planning' as SDLCPhase;
    if (content.includes('analyze')) return 'analysis' as SDLCPhase;
    if (content.includes('design')) return 'design' as SDLCPhase;
    if (content.includes('test')) return 'testing' as SDLCPhase;
    if (content.includes('deploy')) return 'deployment' as SDLCPhase;
    return 'implementation' as SDLCPhase;
  }

  private assessCollisionRisk(todo: TodoFileSpec): CollisionRisk {
    // Assess collision risk based on todo.title
    return CollisionRisk.LOW;
  }

  private groupTasksByAgent(tasks: Task[]): Map<string, Task[]> {
    const groups = new Map<string, Task[]>();
    for (const task of tasks) {
      const agent = task.agentId || 'unassigned';
      if (!groups.has(agent)) {
        groups.set(agent, []);
      }
      groups.get(agent)!.push(task);
    }
    return groups;
  }

  private generateCheckpoints(tasks: Task[]): string[] {
    // Generate coordination checkpoints for this wave
    const checkpoints: string[] = [];
    if (tasks.some(t => t.type === 'testing')) {
      checkpoints.push('Quality validation complete');
    }
    if (tasks.some(t => t.type === 'build')) {
      checkpoints.push('Build artifacts validated');
    }
    return checkpoints;
  }

  private identifyCoordinationCheckpoints(
    waves: ExecutionWave[],
    tasks: Task[]
  ): Array<{
    checkpoint_name: string;
    blocking: boolean;
    quality_gates: string[];
    agents_involved: string[];
  }> {
    return waves
      .filter(w => w.blocking)
      .map(w => ({
        checkpoint_name: `Wave ${w.wave_number} completion`,
        blocking: true,
        quality_gates: ['All tasks complete', 'No errors'],
        agents_involved: w.agents
      }));
  }

  private calculateCriticalPath(
    tasks: Task[]
  ): Array<{
    task_id: string;
    task_name: string;
    agent: string;
    duration: string;
    blocking_dependency: boolean;
  }> {
    // Simplified critical path calculation
    return tasks
      .filter(t => t.priority <= Priority.HIGH)
      .map(t => ({
        task_id: t.id,
        task_name: t.name,
        agent: t.agentId || 'unassigned',
        duration: `${t.estimatedDuration} min`,
        blocking_dependency: t.dependencies.length > 0
      }));
  }

  private identifyCollisionRisks(
    waves: ExecutionWave[],
    tasks: Task[]
  ): Array<{
    risk_type: string;
    affected_agents: string[];
    mitigation: string;
  }> {
    const risks: Array<{
      risk_type: string;
      affected_agents: string[];
      mitigation: string;
    }> = [];

    // Check for waves with many agents (potential resource contention)
    for (const wave of waves) {
      if (wave.agents.length > 3) {
        risks.push({
          risk_type: 'Resource contention',
          affected_agents: wave.agents,
          mitigation: 'Stagger agent activation by 30 seconds each'
        });
      }
    }

    return risks;
  }
}

// Export singleton instance
export const sarahPM = SarahPM.getInstance();
