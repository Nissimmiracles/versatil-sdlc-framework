/**
 * Context Budget Manager
 *
 * Manages context token budget and provides smart task deferral
 * Integrates with ContextSentinel for real-time token tracking
 *
 * Features:
 * - Real-time token usage monitoring via ContextSentinel
 * - Smart task deferral when approaching limits
 * - Context allocation prediction
 * - Priority-based task scheduling
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */
export interface ContextBudget {
    available: number;
    allocated: number;
    reserved: number;
    remaining: number;
    used: number;
    usagePercent: number;
    status: 'healthy' | 'warning' | 'critical';
    message: string;
}
export interface TaskContextRequirement {
    taskId: string;
    description: string;
    estimatedTokens: number;
    priority: 'high' | 'medium' | 'low';
    canDefer: boolean;
}
export interface ContextAllocation {
    taskId: string;
    allocatedTokens: number;
    timestamp: Date;
    priority: 'high' | 'medium' | 'low';
}
export interface DeferralRecommendation {
    shouldDefer: boolean;
    tasksToDefer: string[];
    reason: string;
    alternativeSuggestion?: string;
}
export declare class ContextBudgetManager {
    private readonly TOTAL_CONTEXT;
    private readonly SAFE_THRESHOLD;
    private readonly EMERGENCY_BUFFER;
    private readonly CRITICAL_THRESHOLD;
    private allocations;
    private deferredTasks;
    private contextSentinel;
    constructor();
    /**
     * Get current context budget status
     */
    getBudgetStatus(): Promise<ContextBudget>;
    /**
     * Get current context usage from ContextSentinel
     */
    private getCurrentContextUsage;
    /**
     * Get total allocated tokens
     */
    private getAllocatedTokens;
    /**
     * Request context allocation for a task
     */
    requestAllocation(task: TaskContextRequirement): Promise<boolean>;
    /**
     * Release context allocation for a completed task
     */
    deallocate(taskId: string): void;
    /**
     * Recommend which tasks to defer
     */
    recommendDeferral(newTasks: TaskContextRequirement[]): Promise<DeferralRecommendation>;
    /**
     * Get priority numeric value for sorting
     */
    private priorityValue;
    /**
     * Estimate context tokens needed for a task
     */
    estimateTaskTokens(task: {
        description: string;
        codeFiles?: string[];
        dependencies?: string[];
    }): number;
    /**
     * Get list of deferred tasks
     */
    getDeferredTasks(): string[];
    /**
     * Clear all allocations (reset)
     */
    clear(): void;
    /**
     * Stop context monitoring and cleanup resources
     */
    destroy(): void;
    /**
     * Get allocation summary
     */
    getAllocationSummary(): {
        total: number;
        byPriority: Record<string, number>;
        topAllocations: Array<{
            taskId: string;
            tokens: number;
            priority: string;
        }>;
    };
    /**
     * Predict if task set will fit in context
     */
    predictAllocation(tasks: TaskContextRequirement[]): Promise<{
        canFitAll: boolean;
        canFitWithDeferral: boolean;
        tokensNeeded: number;
        tokensAvailable: number;
        deferralNeeded: string[];
    }>;
    /**
     * Generate context budget visualization (ASCII art)
     */
    visualizeBudget(width?: number): Promise<string>;
    /**
     * Utility: Center text
     */
    private centerText;
    /**
     * Utility: Format number with commas
     */
    private formatNumber;
}
export declare function getContextBudgetManager(): ContextBudgetManager;
