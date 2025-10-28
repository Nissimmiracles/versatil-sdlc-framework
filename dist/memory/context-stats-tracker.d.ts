/**
 * Context Statistics Tracker
 *
 * Tracks token usage, context clearing events, and memory operations
 * to provide insights into context management effectiveness.
 *
 * Part of Phase 2: Context Editing Enhancement
 */
export interface ContextClearEvent {
    timestamp: Date;
    inputTokens: number;
    toolUsesCleared: number;
    tokensSaved: number;
    triggerType: 'input_tokens' | 'manual';
    triggerValue: number;
    agentId?: string;
    patternsPreserved?: number;
    preClearHookExecuted?: boolean;
}
export interface MemoryOperation {
    timestamp: Date;
    operation: 'view' | 'create' | 'str_replace' | 'insert' | 'delete' | 'rename';
    path: string;
    success: boolean;
    agentId?: string;
    tokensUsed?: number;
}
export interface ContextStatistics {
    totalTokensProcessed: number;
    totalClearEvents: number;
    totalTokensSaved: number;
    totalMemoryOperations: number;
    avgTokensPerClear: number;
    memoryOperationsByType: Record<string, number>;
    clearEventsByAgent: Record<string, number>;
    lastClearEvent?: ContextClearEvent;
    uptime: number;
}
export interface SessionMetrics {
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    totalInputTokens: number;
    totalOutputTokens: number;
    clearEvents: number;
    tokensSaved: number;
    memoryOperations: number;
    agentId?: string;
    peakTokens: number;
}
/**
 * Pre-clear hook function type
 * Called before context clearing to extract and preserve critical patterns
 *
 * @param inputTokens - Current token count before clear
 * @param agentId - Agent triggering the clear (if any)
 * @returns Number of patterns preserved
 */
export type PreClearHook = (inputTokens: number, agentId?: string) => Promise<number>;
export declare class ContextStatsTracker {
    private statsDir;
    private currentSession;
    private clearEvents;
    private memoryOps;
    private startTime;
    private preClearHooks;
    constructor(baseDir?: string);
    /**
     * Initialize statistics directory and load existing stats
     */
    initialize(): Promise<void>;
    /**
     * Start a new session for tracking
     */
    startSession(agentId?: string): string;
    /**
     * End the current session
     */
    endSession(): Promise<SessionMetrics | null>;
    /**
     * Track a context clear event
     * Executes pre-clear hooks before recording the event
     */
    trackClearEvent(event: Omit<ContextClearEvent, 'timestamp'>): Promise<void>;
    /**
     * Track a context clear event (with optional pre-clear hook execution)
     */
    trackContextClear(event: Omit<ContextClearEvent, 'timestamp'> & {
        timestamp?: string;
        reason?: 'auto' | 'manual';
    }): Promise<void>;
    /**
     * Track a memory operation
     */
    trackMemoryOperation(op: Omit<MemoryOperation, 'timestamp'>): Promise<void>;
    /**
     * Update token usage for current session
     */
    updateTokenUsage(inputTokens: number, outputTokens: number): void;
    /**
     * Get current statistics
     */
    getStatistics(): ContextStatistics;
    /**
     * Get session metrics (current or specific session ID)
     */
    getSessionMetrics(sessionId?: string): Promise<SessionMetrics | null>;
    /**
     * Get clear events within time range
     */
    getClearEvents(since?: Date, until?: Date): ContextClearEvent[];
    /**
     * Get memory operations within time range
     */
    getMemoryOperations(since?: Date, until?: Date): MemoryOperation[];
    /**
     * Generate a report for a time period
     */
    generateReport(since?: Date, until?: Date): Promise<string>;
    /**
     * Clear old statistics (keep last N days)
     */
    cleanup(daysToKeep?: number): Promise<void>;
    private persistClearEvents;
    private persistMemoryOps;
    private fileExists;
    private dateReviver;
    /**
     * Register a pre-clear hook
     * Hooks are called before context clearing to extract and preserve patterns
     *
     * @param hook - Function that preserves patterns before clear
     * @returns ID of the registered hook for later removal
     */
    registerPreClearHook(hook: PreClearHook): number;
    /**
     * Unregister a pre-clear hook by ID
     *
     * @param hookId - ID returned from registerPreClearHook
     */
    unregisterPreClearHook(hookId: number): void;
    /**
     * Clear all pre-clear hooks
     */
    clearPreClearHooks(): void;
    /**
     * Get number of registered pre-clear hooks
     */
    getPreClearHookCount(): number;
}
export declare function getGlobalContextTracker(): ContextStatsTracker;
