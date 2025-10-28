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
import type { TodoFileSpec } from '../planning/todo-file-generator.js';
export interface ExecutionWave {
    wave_number: number;
    agents: string[];
    estimated_duration: string;
    blocking: boolean;
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
    parallel_efficiency: number;
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
    velocity: number;
    quality_gates: string[];
}
/**
 * Sarah-PM - Project Management Agent
 */
export declare class SarahPM {
    private static instance;
    private orchestrator;
    private taskManager;
    private workingDir;
    private constructor();
    /**
     * Singleton instance
     */
    static getInstance(workingDir?: string): SarahPM;
    /**
     * Generate execution waves with dependency analysis
     *
     * Takes a list of todos and organizes them into parallel execution waves
     * based on dependencies, collision risks, and SDLC phases.
     *
     * @param todos List of todo items to orchestrate
     * @returns Orchestration plan with execution waves
     */
    generateExecutionWaves(todos: TodoFileSpec[]): Promise<OrchestrationPlan>;
    /**
     * Coordinate multiple agents working in parallel
     *
     * @param agents List of agent IDs to coordinate
     * @param context Coordination context
     */
    coordinateAgents(agents: string[], context: {
        goal: string;
        coordination_strategy: 'sequential' | 'parallel' | 'phased';
        quality_gates: string[];
    }): Promise<void>;
    /**
     * Detect and resolve agent conflicts
     *
     * @param agents List of active agents
     * @returns List of detected conflicts with resolutions
     */
    detectConflicts(agents: string[]): Promise<AgentConflict[]>;
    /**
     * Generate sprint plan from backlog
     *
     * @param stories List of user stories
     * @param durationDays Sprint duration in days
     * @returns Sprint plan with agent assignments
     */
    planSprint(stories: Array<{
        title: string;
        points: number;
        agent?: string;
    }>, durationDays: number): Promise<SprintPlan>;
    private inferTaskType;
    private mapPriorityFromTodo;
    private estimateDuration;
    private inferResources;
    private inferSDLCPhase;
    private assessCollisionRisk;
    private groupTasksByAgent;
    private generateCheckpoints;
    private identifyCoordinationCheckpoints;
    private calculateCriticalPath;
    private identifyCollisionRisks;
}
export declare const sarahPM: SarahPM;
