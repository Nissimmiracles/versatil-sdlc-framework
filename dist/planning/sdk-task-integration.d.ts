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
import { TaskPlanManager, Task } from './task-plan-manager.js';
import type { AgentTask, AgentRole, SDLCPhase } from '../agents/sdk/versatil-orchestrator-agent.js';
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
export declare class SDKTaskIntegration extends EventEmitter {
    private taskPlanManager;
    private config;
    /** Map of agent task IDs to plan IDs */
    private agentTaskToPlan;
    /** Map of plan IDs to agent tasks */
    private planToAgentTasks;
    /** Captured historical activities */
    private historicalActivities;
    constructor(config: SDKIntegrationConfig);
    /**
     * Setup listeners for TaskPlanManager and orchestrator events
     */
    private setupEventListeners;
    /**
     * Capture an agent task and potentially create a plan
     *
     * @param agentTask - Agent task from orchestrator
     * @returns Created plan ID (if plan was created)
     */
    captureAgentTask(agentTask: AgentTask): Promise<string | null>;
    /**
     * Determine if agent task should generate a plan
     */
    private shouldCreatePlan;
    /**
     * Generate TaskPlan from AgentTask
     */
    private generatePlanFromAgentTask;
    /**
     * Generate task breakdown from agent task
     */
    private generateTaskBreakdown;
    /**
     * Generate subtasks based on agent role
     */
    private generateSubtasksForAgent;
    /**
     * Reconstruct task plans from historical agent activities
     *
     * Use case: User wants to see what was done in past sessions
     *
     * @param timeRange - Optional time range filter
     * @returns Reconstructed historical plans
     */
    reconstructHistoricalPlans(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<HistoricalTaskReconstruction[]>;
    /**
     * Group activities into logical task groupings
     */
    private groupActivitiesByTask;
    /**
     * Reconstruct a single task group as a plan
     */
    private reconstructTaskGroup;
    /**
     * Summarize a group of activities into a root task description
     */
    private summarizeTaskGroup;
    /**
     * Calculate activity duration
     */
    private calculateActivityDuration;
    /**
     * Update task progress from agent task status
     */
    syncAgentTaskProgress(agentTask: AgentTask): Promise<void>;
    /**
     * Find task in plan by agent task ID
     */
    private findTaskByAgentTaskId;
    /**
     * Map agent task status to task status
     */
    private mapAgentTaskStatus;
    /**
     * Map priority level to plan priority
     */
    private mapPriorityLevel;
    /**
     * Calculate agent task progress
     */
    private calculateAgentTaskProgress;
    /**
     * Estimate task duration based on agent and priority
     */
    private estimateTaskDuration;
    /**
     * Get plan ID for an agent task
     */
    getPlanIdForAgentTask(agentTaskId: string): string | undefined;
    /**
     * Get agent tasks for a plan
     */
    getAgentTasksForPlan(planId: string): AgentTask[];
    /**
     * Get all historical activities
     */
    getHistoricalActivities(): CapturedAgentActivity[];
    /**
     * Clear historical activities
     */
    clearHistory(): void;
}
export default SDKTaskIntegration;
