/**
 * VERSATIL SDLC Framework - Real-Time Statusline Manager
 *
 * Sprint 1 Day 7: Real-time statusline for live agent visibility
 * v6.1.0: Enhanced with hierarchical task tracking
 *
 * Features:
 * - Progress bars with emoji indicators
 * - Multi-agent display (shows +N more)
 * - RAG indicator (🧠 + retrieval count)
 * - MCP indicator (🔧 + tool names)
 * - Activity descriptions
 * - Performance metrics
 * - **NEW: Multi-level task hierarchy display**
 * - **NEW: Subagent task tracking**
 * - **NEW: Plan progress visualization**
 * - **NEW: Timeline view**
 */
import { EventEmitter } from 'events';
import type { Task, PlanStatusSnapshot } from '../planning/task-plan-manager.js';
export interface AgentProgress {
    agentId: string;
    activity: string;
    progress: number;
    startTime: number;
    ragRetrievals?: number;
    mcpTools?: string[];
    status: 'idle' | 'active' | 'completed' | 'error';
    taskId?: string;
    parentTaskId?: string;
    subtasks?: SubtaskProgress[];
    isSubagent?: boolean;
}
export interface SubtaskProgress {
    id: string;
    description: string;
    progress: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
}
export interface StatuslineOptions {
    maxWidth?: number;
    maxAgents?: number;
    showRAG?: boolean;
    showMCP?: boolean;
    showProgress?: boolean;
    refreshRate?: number;
}
export declare class StatuslineManager extends EventEmitter {
    private activeAgents;
    private options;
    private lastRender;
    private renderInterval;
    constructor(options?: StatuslineOptions);
    /**
     * Start tracking an agent's progress
     */
    startAgent(agentId: string, activity: string): void;
    /**
     * Update agent progress
     */
    updateProgress(agentId: string, progress: number, activity?: string): void;
    /**
     * Add RAG retrieval indicator
     */
    addRAGRetrieval(agentId: string, count?: number): void;
    /**
     * Add MCP tool indicator
     */
    addMCPTool(agentId: string, toolName: string): void;
    /**
     * Mark agent as completed
     */
    completeAgent(agentId: string): void;
    /**
     * Mark agent as error
     */
    errorAgent(agentId: string, error: string): void;
    /**
     * Clear all agents
     */
    clear(): void;
    /**
     * Get current statusline as string
     */
    getStatusline(): string;
    /**
     * Format a single agent line
     */
    private formatAgentLine;
    /**
     * Get emoji for agent status
     */
    private getAgentEmoji;
    /**
     * Render progress bar
     */
    private renderProgressBar;
    /**
     * Truncate string to max length
     */
    private truncate;
    /**
     * Render statusline (called internally on updates)
     */
    private render;
    /**
     * Start auto-refresh interval
     */
    startAutoRefresh(): void;
    /**
     * Stop auto-refresh interval
     */
    stopAutoRefresh(): void;
    /**
     * Get statistics
     */
    getStats(): {
        activeAgents: number;
        completedAgents: number;
        totalRAGRetrievals: number;
        totalMCPCalls: number;
    };
    /**
     * Cleanup (call on shutdown)
     */
    destroy(): void;
    /**
     * Track task hierarchy from a plan
     *
     * @param task - Task to track
     * @param parentAgentId - Parent agent ID (for subagents)
     */
    trackTask(task: Task, parentAgentId?: string): void;
    /**
     * Update task progress from plan
     */
    updateTaskProgress(taskId: string, progress: number, status?: Task['status']): void;
    /**
     * Render plan status as statusline
     *
     * @param planStatus - Plan status snapshot
     * @returns Formatted statusline string
     */
    renderPlanStatus(planStatus: PlanStatusSnapshot): string;
    /**
     * Format a task from a plan for display
     */
    private formatPlanTask;
    /**
     * Get icon for task status
     */
    private getTaskStatusIcon;
    /**
     * Render enhanced statusline with task hierarchy
     *
     * Includes:
     * - Main agent tasks
     * - Subagent tasks (indented)
     * - Timeline view
     * - Collaboration graph
     */
    getEnhancedStatusline(): string;
    /**
     * Format a subtask line (indented)
     */
    private formatSubtaskLine;
    /**
     * Render timeline view (last N activities)
     */
    renderTimeline(maxEvents?: number): string;
    /**
     * Render collaboration graph (ASCII art)
     */
    renderCollaborationGraph(): string;
}
export declare function getGlobalStatusline(): StatuslineManager;
export declare function setGlobalStatusline(manager: StatuslineManager): void;
