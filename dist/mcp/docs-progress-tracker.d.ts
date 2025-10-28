/**
 * VERSATIL Documentation Progress Tracker
 * Provides progress tracking for long-running documentation operations
 */
export interface ProgressEvent {
    operation: string;
    phase: string;
    current: number;
    total: number;
    percentage: number;
    message: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface ProgressCallback {
    (event: ProgressEvent): void;
}
export interface ProgressOperation {
    id: string;
    operation: string;
    startTime: Date;
    endTime?: Date;
    events: ProgressEvent[];
    status: 'running' | 'completed' | 'failed';
    error?: Error;
}
/**
 * Tracks progress of long-running documentation operations
 */
export declare class DocsProgressTracker {
    private operations;
    private callbacks;
    private nextOperationId;
    constructor();
    /**
     * Start tracking a new operation
     */
    startOperation(operation: string): string;
    /**
     * Report progress for an operation
     */
    reportProgress(operationId: string, phase: string, current: number, total: number, message: string, metadata?: Record<string, unknown>): void;
    /**
     * Complete an operation successfully
     */
    completeOperation(operationId: string): void;
    /**
     * Mark an operation as failed
     */
    failOperation(operationId: string, error: Error): void;
    /**
     * Subscribe to progress updates for an operation
     */
    subscribe(operationId: string, callback: ProgressCallback): void;
    /**
     * Unsubscribe from progress updates
     */
    unsubscribe(operationId: string, callback: ProgressCallback): void;
    /**
     * Get operation details
     */
    getOperation(operationId: string): ProgressOperation | undefined;
    /**
     * Get current progress for an operation
     */
    getCurrentProgress(operationId: string): ProgressEvent | null;
    /**
     * Get all progress events for an operation
     */
    getProgressHistory(operationId: string): ProgressEvent[];
    /**
     * Get operation duration in milliseconds
     */
    getOperationDuration(operationId: string): number | null;
    /**
     * Get all active operations
     */
    getActiveOperations(): ProgressOperation[];
    /**
     * Get operation summary
     */
    getOperationSummary(operationId: string): string | null;
    /**
     * Format progress event as string
     */
    formatProgressEvent(event: ProgressEvent): string;
    /**
     * Create a text-based progress bar
     */
    private createProgressBar;
    /**
     * Cleanup completed operations older than specified time
     */
    cleanup(olderThanMs?: number): void;
    /**
     * Get statistics about tracked operations
     */
    getStatistics(): {
        total: number;
        running: number;
        completed: number;
        failed: number;
        avgDuration: number;
    };
    /**
     * Reset all tracked operations
     */
    reset(): void;
}
