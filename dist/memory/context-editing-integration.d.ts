/**
 * VERSATIL Context Editing Integration
 *
 * Monitors context token usage and auto-clears at 100k tokens
 * - Tracks tool use count and input tokens
 * - Stores cleared context to memory before clearing
 * - Tracks what was cleared (tool results, old messages)
 * - Integrates with Memory Tool for pattern preservation
 *
 * Features:
 * - Auto-clear at 100k tokens (configurable)
 * - Preserve recent tool uses (last 10 by default)
 * - Store important context to agent memory before clear
 * - Statistics tracking (clear events, tokens saved)
 *
 * Reference: https://docs.claude.com/en/docs/build-with-claude/context-editing
 */
import { AgentId } from './memory-tool-config.js';
import { MemoryToolOperation } from './memory-tool-handler.js';
/**
 * Context clear event
 */
export interface ContextClearEvent {
    /** Timestamp of clear event */
    timestamp: string;
    /** Input tokens at time of clear */
    inputTokens: number;
    /** Number of tool uses cleared */
    toolUsesCleared: number;
    /** Number of tool uses preserved */
    toolUsesPreserved: number;
    /** Estimated tokens saved by clearing */
    tokensSaved: number;
    /** Agent that triggered the clear */
    agentId?: string;
    /** Reason for clear */
    reason: 'auto' | 'manual';
    /** What was stored to memory before clear */
    storedToMemory: string[];
}
/**
 * Context statistics
 */
export interface ContextStats {
    /** Total clear events */
    totalClearEvents: number;
    /** Total tokens saved */
    totalTokensSaved: number;
    /** Average tokens saved per clear */
    avgTokensSaved: number;
    /** Last clear event */
    lastClearEvent?: ContextClearEvent;
    /** Recent clear events (last 5) */
    recentClearEvents: ContextClearEvent[];
}
/**
 * Context Editing Manager
 *
 * Handles automatic context clearing at 100k tokens
 */
export declare class ContextEditingManager {
    private readonly tokenThreshold;
    private readonly keepToolUses;
    private readonly minTokensToClear;
    private clearEvents;
    private initialized;
    constructor();
    /**
     * Initialize context editing manager
     */
    initialize(): Promise<void>;
    /**
     * Track memory operation to check if context clear is needed
     *
     * @param agentId - Agent performing operation
     * @param operation - Memory operation
     */
    trackOperation(agentId: AgentId, operation: MemoryToolOperation): Promise<void>;
    /**
     * Clear context and store important information to memory
     *
     * @param agentId - Agent to clear context for
     * @param reason - Reason for clear ('auto' or 'manual')
     */
    clearContext(agentId: AgentId, reason?: 'auto' | 'manual'): Promise<void>;
    /**
     * Store important context to agent memory before clearing
     *
     * @param agentId - Agent ID
     * @returns List of memory files created
     */
    private storeContextToMemory;
    /**
     * Get context statistics
     */
    getStats(): Promise<ContextStats>;
    /**
     * Estimate tokens for an operation
     *
     * This is a rough approximation. In a real implementation,
     * this would query Claude API for actual token count.
     */
    private estimateOperationTokens;
    /**
     * Load clear events from file
     */
    private loadClearEvents;
    /**
     * Save clear events to file
     */
    private saveClearEvents;
}
/**
 * Global context editing manager instance
 */
export declare const contextEditingManager: ContextEditingManager;
export default contextEditingManager;
