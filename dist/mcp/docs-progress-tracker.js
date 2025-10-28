/**
 * VERSATIL Documentation Progress Tracker
 * Provides progress tracking for long-running documentation operations
 */
/**
 * Tracks progress of long-running documentation operations
 */
export class DocsProgressTracker {
    constructor() {
        this.nextOperationId = 1;
        this.operations = new Map();
        this.callbacks = new Map();
    }
    /**
     * Start tracking a new operation
     */
    startOperation(operation) {
        const id = `op_${this.nextOperationId++}`;
        const op = {
            id,
            operation,
            startTime: new Date(),
            events: [],
            status: 'running',
        };
        this.operations.set(id, op);
        return id;
    }
    /**
     * Report progress for an operation
     */
    reportProgress(operationId, phase, current, total, message, metadata) {
        const op = this.operations.get(operationId);
        if (!op) {
            throw new Error(`Operation ${operationId} not found`);
        }
        if (op.status !== 'running') {
            throw new Error(`Operation ${operationId} is not running (status: ${op.status})`);
        }
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        const event = {
            operation: op.operation,
            phase,
            current,
            total,
            percentage,
            message,
            timestamp: new Date(),
            metadata,
        };
        op.events.push(event);
        // Notify callbacks
        const callbacks = this.callbacks.get(operationId) || [];
        callbacks.forEach(callback => {
            try {
                callback(event);
            }
            catch (error) {
                console.error(`Progress callback error for ${operationId}:`, error);
            }
        });
    }
    /**
     * Complete an operation successfully
     */
    completeOperation(operationId) {
        const op = this.operations.get(operationId);
        if (!op) {
            throw new Error(`Operation ${operationId} not found`);
        }
        op.status = 'completed';
        op.endTime = new Date();
        // Clear callbacks for this operation
        this.callbacks.delete(operationId);
    }
    /**
     * Mark an operation as failed
     */
    failOperation(operationId, error) {
        const op = this.operations.get(operationId);
        if (!op) {
            throw new Error(`Operation ${operationId} not found`);
        }
        op.status = 'failed';
        op.endTime = new Date();
        op.error = error;
        // Clear callbacks for this operation
        this.callbacks.delete(operationId);
    }
    /**
     * Subscribe to progress updates for an operation
     */
    subscribe(operationId, callback) {
        if (!this.operations.has(operationId)) {
            throw new Error(`Operation ${operationId} not found`);
        }
        const callbacks = this.callbacks.get(operationId) || [];
        callbacks.push(callback);
        this.callbacks.set(operationId, callbacks);
    }
    /**
     * Unsubscribe from progress updates
     */
    unsubscribe(operationId, callback) {
        const callbacks = this.callbacks.get(operationId);
        if (!callbacks) {
            return;
        }
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
            this.callbacks.delete(operationId);
        }
    }
    /**
     * Get operation details
     */
    getOperation(operationId) {
        return this.operations.get(operationId);
    }
    /**
     * Get current progress for an operation
     */
    getCurrentProgress(operationId) {
        const op = this.operations.get(operationId);
        if (!op || op.events.length === 0) {
            return null;
        }
        return op.events[op.events.length - 1];
    }
    /**
     * Get all progress events for an operation
     */
    getProgressHistory(operationId) {
        const op = this.operations.get(operationId);
        return op ? [...op.events] : [];
    }
    /**
     * Get operation duration in milliseconds
     */
    getOperationDuration(operationId) {
        const op = this.operations.get(operationId);
        if (!op) {
            return null;
        }
        const endTime = op.endTime || new Date();
        return endTime.getTime() - op.startTime.getTime();
    }
    /**
     * Get all active operations
     */
    getActiveOperations() {
        const active = [];
        for (const op of this.operations.values()) {
            if (op.status === 'running') {
                active.push(op);
            }
        }
        return active;
    }
    /**
     * Get operation summary
     */
    getOperationSummary(operationId) {
        const op = this.operations.get(operationId);
        if (!op) {
            return null;
        }
        const duration = this.getOperationDuration(operationId);
        const durationStr = duration ? `${Math.round(duration / 1000)}s` : 'N/A';
        let statusEmoji = '🔄';
        if (op.status === 'completed') {
            statusEmoji = '✅';
        }
        else if (op.status === 'failed') {
            statusEmoji = '❌';
        }
        const currentProgress = this.getCurrentProgress(operationId);
        const progressStr = currentProgress
            ? `${currentProgress.percentage}% (${currentProgress.current}/${currentProgress.total})`
            : 'N/A';
        return `${statusEmoji} ${op.operation} - ${op.status} (${durationStr}) - Progress: ${progressStr}`;
    }
    /**
     * Format progress event as string
     */
    formatProgressEvent(event) {
        const bar = this.createProgressBar(event.percentage, 20);
        return `[${bar}] ${event.percentage}% - ${event.message}`;
    }
    /**
     * Create a text-based progress bar
     */
    createProgressBar(percentage, width = 20) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
    /**
     * Cleanup completed operations older than specified time
     */
    cleanup(olderThanMs = 60000) {
        const now = new Date();
        const idsToDelete = [];
        for (const [id, op] of this.operations.entries()) {
            if (op.status !== 'running' && op.endTime) {
                const age = now.getTime() - op.endTime.getTime();
                if (age > olderThanMs) {
                    idsToDelete.push(id);
                }
            }
        }
        idsToDelete.forEach(id => {
            this.operations.delete(id);
            this.callbacks.delete(id);
        });
    }
    /**
     * Get statistics about tracked operations
     */
    getStatistics() {
        let total = 0;
        let running = 0;
        let completed = 0;
        let failed = 0;
        let totalDuration = 0;
        let completedCount = 0;
        for (const op of this.operations.values()) {
            total++;
            if (op.status === 'running') {
                running++;
            }
            else if (op.status === 'completed') {
                completed++;
                if (op.endTime) {
                    totalDuration += op.endTime.getTime() - op.startTime.getTime();
                    completedCount++;
                }
            }
            else if (op.status === 'failed') {
                failed++;
            }
        }
        const avgDuration = completedCount > 0 ? totalDuration / completedCount : 0;
        return {
            total,
            running,
            completed,
            failed,
            avgDuration,
        };
    }
    /**
     * Reset all tracked operations
     */
    reset() {
        this.operations.clear();
        this.callbacks.clear();
    }
}
//# sourceMappingURL=docs-progress-tracker.js.map