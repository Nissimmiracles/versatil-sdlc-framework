/**
 * Task Completion Trigger
 * Watches TodoWrite status changes and triggers appropriate tests
 *
 * Version: 1.0.0
 * Purpose: Auto-trigger tests within 30 seconds of task completion
 */
import { EventEmitter } from 'events';
import { TestType } from './test-trigger-matrix.js';
export interface Todo {
    id: string;
    content: string;
    activeForm: string;
    status: 'pending' | 'in_progress' | 'completed';
    metadata?: {
        changedFiles?: string[];
        startTime?: Date;
        endTime?: Date;
    };
}
export interface TaskCompletionEvent {
    todo: Todo;
    changedFiles: string[];
    testTypes: TestType[];
    agent: string;
    estimatedDuration: number;
}
export interface TestExecutionResult {
    success: boolean;
    testResults: any[];
    duration: number;
    qualityGatePassed: boolean;
    message: string;
}
export declare class TaskCompletionTrigger extends EventEmitter {
    private projectRoot;
    private testSelector;
    private activeTasks;
    private testQueue;
    private isProcessingQueue;
    constructor(projectRoot: string);
    /**
     * Initialize and start watching for task completion events
     */
    initialize(): Promise<void>;
    /**
     * Handle TodoWrite status changes
     */
    private handleTodoStatusChange;
    /**
     * Get changed files for a task
     */
    private getChangedFilesForTask;
    /**
     * Get test types required for changed files
     */
    private getTestTypesForFiles;
    /**
     * Get responsible agent for changed files
     */
    private getResponsibleAgentForFiles;
    /**
     * Estimate test duration for changed files
     */
    private estimateTestDuration;
    /**
     * Start processing test queue
     */
    private startQueueProcessor;
    /**
     * Process next test in queue
     */
    private processNextTest;
    /**
     * Execute tests for a task completion event
     */
    private executeTests;
    /**
     * Build test command based on selected tests and types
     */
    private buildTestCommand;
    /**
     * Parse test results from stdout/stderr
     */
    private parseTestResults;
    /**
     * Check quality gates
     */
    private checkQualityGates;
    /**
     * Get active tasks count
     */
    getActiveTasks(): number;
    /**
     * Get queue length
     */
    getQueueLength(): number;
    /**
     * Clear queue (for testing/debugging)
     */
    clearQueue(): void;
}
export default TaskCompletionTrigger;
