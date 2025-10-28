/**
 * VERSATIL Framework - Sub-Agent Factory
 * Creates specialized sub-agent instances for parallel task execution
 *
 * Features:
 * - Spawns specialized sub-agents (sub-marcus-1, sub-james-2, etc.)
 * - Manages sub-agent lifecycle (create, execute, monitor, cleanup)
 * - Integrates with Conflict Resolution Engine
 * - Integrates with MCP Task Executor
 * - Tracks sub-agent performance and health
 * - Auto-scaling based on workload
 *
 * Sub-Agent Types:
 * - sub-marcus: Backend development (API, database, business logic)
 * - sub-james: Frontend development (UI, components, interactions)
 * - sub-maria: Testing (unit, integration, E2E)
 * - sub-sarah: Project management (coordination, reporting)
 * - sub-alex: Requirements analysis (user stories, acceptance criteria)
 * - sub-dr-ai: ML/AI development (models, training, deployment)
 */
import { EventEmitter } from 'events';
import { ConflictResolutionEngine } from '../../orchestration/conflict-resolution-engine.js';
import { MCPTaskExecutor } from '../../mcp/mcp-task-executor.js';
import { type AgentPool } from './agent-pool.js';
import type { SubAgent } from '../../orchestration/conflict-resolution-engine.js';
import type { Task } from '../../orchestration/epic-workflow-orchestrator.js';
export interface SubAgentConfig {
    type: SubAgent['type'];
    task: Task;
    epicId: string;
    priority: number;
    maxConcurrency?: number;
}
export interface SubAgentInstance extends SubAgent {
    config: SubAgentConfig;
    health: 'healthy' | 'degraded' | 'unhealthy';
    performance: {
        tasksCompleted: number;
        tasksErrors: number;
        averageTaskDuration: number;
        lastActivityTime: number;
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        activeTasks: number;
    };
}
export interface SubAgentStats {
    totalSubAgents: number;
    activeSubAgents: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    subAgentsByType: Record<SubAgent['type'], number>;
}
export declare class SubAgentFactory extends EventEmitter {
    private conflictEngine;
    private mcpExecutor;
    private agentPool;
    private subAgents;
    private activeAgentInstances;
    private taskQueue;
    private stats;
    private readonly MAX_SUBAGENTS_PER_TYPE;
    constructor(conflictEngine?: ConflictResolutionEngine, mcpExecutor?: MCPTaskExecutor, agentPool?: AgentPool);
    initialize(): Promise<void>;
    /**
     * Create sub-agent for a task (main method)
     */
    createSubAgent(config: SubAgentConfig): Promise<SubAgentInstance>;
    /**
     * Execute task with sub-agent
     */
    executeTask(subAgentId: string): Promise<void>;
    /**
     * Perform agent-specific work (simulated)
     */
    private performAgentWork;
    /**
     * Create activation context for real agent execution
     * NEW v6.1: Includes MCP tools inherited from parent
     */
    private createAgentContext;
    /**
     * NEW v6.1: Get MCP tools that sub-agent should inherit from parent
     */
    private getInheritedMCPTools;
    /**
     * Map numeric priority to urgency level
     */
    private mapPriorityToUrgency;
    /**
     * Update average task duration for sub-agent
     */
    private updateAverageTaskDuration;
    /**
     * Update overall average task duration
     */
    private updateOverallAverageTaskDuration;
    /**
     * Queue task when capacity limit reached
     */
    private queueTask;
    /**
     * Process queued tasks when sub-agent becomes available
     */
    private processQueuedTasks;
    /**
     * Cleanup idle sub-agent
     */
    private cleanupSubAgent;
    /**
     * Get active sub-agent count for a type
     */
    private getActiveSubAgentCount;
    /**
     * Get sub-agent by ID
     */
    getSubAgent(subAgentId: string): SubAgentInstance | undefined;
    /**
     * Get all active sub-agents
     */
    getActiveSubAgents(): SubAgentInstance[];
    /**
     * Get sub-agents by type
     */
    getSubAgentsByType(type: SubAgent['type']): SubAgentInstance[];
    /**
     * Get statistics
     */
    getStatistics(): SubAgentStats;
    /**
     * Monitor sub-agent health
     */
    monitorHealth(): Promise<void>;
    /**
     * Auto-scale sub-agents based on queue size
     */
    autoScale(): Promise<void>;
    /**
     * Shutdown factory
     */
    shutdown(): Promise<void>;
}
export declare const globalSubAgentFactory: SubAgentFactory;
