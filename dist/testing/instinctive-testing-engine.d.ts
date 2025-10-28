/**
 * Instinctive Testing Engine
 * Main orchestrator for automatic testing after task completion
 *
 * Version: 1.0.0
 * Purpose: Zero manual intervention testing workflow
 * Philosophy: "Tests should be as automatic as breathing - you shouldn't have to think about them"
 */
import { EventEmitter } from 'events';
import { Todo } from './task-completion-trigger.js';
import { TestResult, QualityGateResult } from './quality-gate-enforcer.js';
import { TestSelection } from './smart-test-selector.js';
import { TestType } from './test-trigger-matrix.js';
import type { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export interface InstinctiveTestingConfig {
    enabled: boolean;
    autoTriggerOnComplete: boolean;
    autoBlockOnFailure: boolean;
    smartTestSelection: boolean;
    maxParallelTests: number;
    testTimeout: number;
    qualityGates: {
        enforceMinCoverage: boolean;
        minCoverage: number;
        enforcePassingTests: boolean;
        enforceSecurityScan: boolean;
        enforceAccessibility: boolean;
    };
}
export interface TestExecutionContext {
    taskId: string;
    changedFiles: string[];
    testTypes: TestType[];
    agent: string;
    testSelection: TestSelection;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: 'queued' | 'running' | 'completed' | 'failed';
    results?: TestResult[];
    qualityGateResult?: QualityGateResult;
}
export interface InstinctiveTestingMetrics {
    totalTasksProcessed: number;
    totalTestsRun: number;
    totalTestDuration: number;
    averageTestDuration: number;
    qualityGatePassRate: number;
    testSelectionTimesSaved: number;
    totalTimesSaved: number;
}
export declare class InstinctiveTestingEngine extends EventEmitter {
    private config;
    private projectRoot;
    private taskCompletionTrigger;
    private qualityGateEnforcer;
    private smartTestSelector;
    private stressTestGenerator?;
    private vectorStore?;
    private executionContexts;
    private metrics;
    private isInitialized;
    private activeTestExecutions;
    constructor(projectRoot: string, config?: Partial<InstinctiveTestingConfig>, vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Initialize the instinctive testing engine
     */
    initialize(): Promise<void>;
    /**
     * Setup event listeners for task completion trigger
     */
    private setupEventListeners;
    /**
     * Handle test execution start
     */
    private handleTestExecutionStart;
    /**
     * Execute tests for a context
     */
    private executeTests;
    /**
     * Execute a specific test type
     */
    private executeTestType;
    /**
     * Test execution methods (delegated to specialized agents)
     */
    private runUnitTests;
    private runIntegrationTests;
    private runStressTests;
    private runSecurityTests;
    private runAccessibilityTests;
    private runVisualRegressionTests;
    private runContractTests;
    private runMigrationTests;
    private runSchemaValidationTests;
    private runBuildTests;
    /**
     * Enforce quality gates
     */
    private enforceQualityGates;
    /**
     * Update metrics
     */
    private updateMetrics;
    /**
     * Trigger tests manually (for testing)
     */
    triggerTests(todo: Todo): Promise<void>;
    /**
     * Get current metrics
     */
    getMetrics(): InstinctiveTestingMetrics;
    /**
     * Get execution context for a task
     */
    getExecutionContext(taskId: string): TestExecutionContext | undefined;
    /**
     * Get all execution contexts
     */
    getAllExecutionContexts(): TestExecutionContext[];
    /**
     * Clear metrics (for testing)
     */
    clearMetrics(): void;
    /**
     * Shutdown the engine
     */
    shutdown(): Promise<void>;
}
export default InstinctiveTestingEngine;
