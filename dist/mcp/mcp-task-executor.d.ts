/**
 * MCP Task Executor - Enhanced Implementation
 *
 * Provides advanced task execution capabilities with:
 * - Parallel execution
 * - Timeout/retry logic
 * - Queue management
 * - Event-driven architecture
 * - Metrics tracking
 */
import { EventEmitter } from 'events';
export interface MCPToolInference {
    taskId: string;
    inferredTools: string[];
    confidence: number;
    reasoning: string;
}
export interface MCPExecutionResult {
    success: boolean;
    toolsExecuted: string[];
    results: Map<string, any>;
    errors: Array<{
        tool: string;
        error: string;
    }>;
}
export interface Task {
    id: string;
    name: string;
    description?: string;
    type: string;
    files: string[];
    dependencies?: string[];
    [key: string]: any;
}
export interface TaskMetrics {
    totalExecuted: number;
    successful: number;
    failed: number;
    averageExecutionTime: number;
    queuedTasks: number;
}
export interface ExecutionSummary {
    taskId: string;
    status: 'completed' | 'failed' | 'cancelled';
    duration: number;
    toolsUsed: string[];
    errors: string[];
}
export declare class MCPTaskExecutor extends EventEmitter {
    private taskQueue;
    private maxConcurrency;
    private maxQueueSize;
    private metrics;
    private executionSummaries;
    private cancelledTasks;
    constructor();
    inferTools(task: Task): Promise<MCPToolInference>;
    executeTools(task: Task, inference: MCPToolInference): Promise<MCPExecutionResult>;
    cancelTask(taskId: string): Promise<void>;
    /**
     * Execute tools with timeout
     */
    executeToolsWithTimeout(task: Task, inference: MCPToolInference, timeoutMs?: number): Promise<MCPExecutionResult>;
    /**
     * Execute tools with retry logic
     */
    executeToolsWithRetry(task: Task, inference: MCPToolInference, maxRetries?: number): Promise<MCPExecutionResult>;
    /**
     * Execute tasks in parallel
     */
    executeTasksInParallel(tasks: Task[]): Promise<MCPExecutionResult[]>;
    /**
     * Execute tasks in batches
     */
    executeInBatches(tasks: Task[], batchSize: number): Promise<MCPExecutionResult[]>;
    /**
     * Queue a task for execution
     */
    queueTask(task: Task): Promise<void>;
    /**
     * Set maximum concurrency
     */
    setMaxConcurrency(max: number): void;
    /**
     * Set maximum queue size
     */
    setMaxQueueSize(max: number): void;
    /**
     * Get task metrics
     */
    getTaskMetrics(): TaskMetrics;
    /**
     * Get execution summary for a task
     */
    getExecutionSummary(taskId: string): ExecutionSummary | undefined;
    /**
     * Provide feedback on task execution
     */
    provideFeedback(taskId: string, feedback: {
        rating: number;
        comment?: string;
    }): Promise<void>;
    /**
     * Process queued tasks
     */
    processQueue(): Promise<void>;
    /**
     * Get current queue size
     */
    getQueueSize(): number;
    /**
     * Initialize the executor
     */
    initialize(): Promise<void>;
    /**
     * Shared state storage for persistence (static to share across instances)
     */
    private static sharedSavedState;
    /**
     * Save queue state to disk
     */
    saveQueueState(): Promise<void>;
    /**
     * Load queue state from disk
     */
    loadQueueState(): Promise<void>;
    /**
     * Process queue by priority
     */
    processQueueByPriority(): Promise<void>;
    /**
     * Pause queue processing
     */
    private queuePaused;
    pauseQueue(): void;
    /**
     * Resume queue processing
     */
    resumeQueue(): void;
    /**
     * Start processing queue automatically
     */
    private processingInterval?;
    startProcessingQueue(intervalMs?: number): void;
    /**
     * Clear the task queue
     */
    clearQueue(): void;
    /**
     * Get queue statistics
     */
    getQueueStats(): {
        queueSize: number;
        paused: boolean;
        processing: boolean;
        totalProcessed: number;
        completed: number;
        successRate: number;
    };
    /**
     * Get queue statistics (alias for getQueueStats)
     */
    getQueueStatistics(): {
        queueSize: number;
        paused: boolean;
        processing: boolean;
        totalProcessed: number;
        completed: number;
        successRate: number;
    };
    /**
     * Get number of processed tasks
     */
    getProcessedCount(): number;
    /**
     * Check if queue is currently being processed
     */
    isQueueProcessing(): boolean;
    shutdown(): Promise<void>;
}
export default MCPTaskExecutor;
