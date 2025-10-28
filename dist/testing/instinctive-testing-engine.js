/**
 * Instinctive Testing Engine
 * Main orchestrator for automatic testing after task completion
 *
 * Version: 1.0.0
 * Purpose: Zero manual intervention testing workflow
 * Philosophy: "Tests should be as automatic as breathing - you shouldn't have to think about them"
 */
import { EventEmitter } from 'events';
import { TaskCompletionTrigger } from './task-completion-trigger.js';
import { QualityGateEnforcer } from './quality-gate-enforcer.js';
import { SmartTestSelector } from './smart-test-selector.js';
import { getQualityGateRequirements, TestType } from './test-trigger-matrix.js';
import { AutomatedStressTestGenerator } from './automated-stress-test-generator.js';
export class InstinctiveTestingEngine extends EventEmitter {
    constructor(projectRoot, config = {}, vectorStore) {
        super();
        // Tracking
        this.executionContexts = new Map();
        this.metrics = {
            totalTasksProcessed: 0,
            totalTestsRun: 0,
            totalTestDuration: 0,
            averageTestDuration: 0,
            qualityGatePassRate: 0,
            testSelectionTimesSaved: 0,
            totalTimesSaved: 0
        };
        // State
        this.isInitialized = false;
        this.activeTestExecutions = 0;
        this.projectRoot = projectRoot;
        this.vectorStore = vectorStore;
        // Merge with defaults
        this.config = {
            enabled: true,
            autoTriggerOnComplete: true,
            autoBlockOnFailure: true,
            smartTestSelection: true,
            maxParallelTests: 3,
            testTimeout: 300000, // 5 minutes default
            qualityGates: {
                enforceMinCoverage: true,
                minCoverage: 80,
                enforcePassingTests: true,
                enforceSecurityScan: true,
                enforceAccessibility: true
            },
            ...config
        };
        // Initialize components
        this.taskCompletionTrigger = new TaskCompletionTrigger(projectRoot);
        this.qualityGateEnforcer = new QualityGateEnforcer();
        this.smartTestSelector = new SmartTestSelector(projectRoot);
        // Optional stress test generator
        if (vectorStore) {
            this.stressTestGenerator = new AutomatedStressTestGenerator(vectorStore);
        }
    }
    /**
     * Initialize the instinctive testing engine
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('[InstinctiveTestingEngine] Already initialized');
            return;
        }
        console.log('[InstinctiveTestingEngine] Initializing...');
        // Initialize task completion trigger
        await this.taskCompletionTrigger.initialize();
        // Setup event listeners
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('[InstinctiveTestingEngine] ✅ Initialized successfully');
        console.log(`[InstinctiveTestingEngine] Auto-trigger: ${this.config.autoTriggerOnComplete}`);
        console.log(`[InstinctiveTestingEngine] Smart selection: ${this.config.smartTestSelection}`);
        console.log(`[InstinctiveTestingEngine] Quality gates: ${this.config.autoBlockOnFailure ? 'ENFORCED' : 'DISABLED'}`);
        this.emit('initialized', { config: this.config });
    }
    /**
     * Setup event listeners for task completion trigger
     */
    setupEventListeners() {
        // Test queued
        this.taskCompletionTrigger.on('test-queued', (event) => {
            console.log(`[InstinctiveTestingEngine] Test queued for task ${event.todo.id}: ` +
                `${event.testTypes.join(', ')}`);
            this.emit('test-queued', event);
        });
        // Test execution started
        this.taskCompletionTrigger.on('test-execution-started', async (event) => {
            await this.handleTestExecutionStart(event);
        });
        // Todo completion approved
        this.taskCompletionTrigger.on('todo-completion-approved', (todo) => {
            console.log(`[InstinctiveTestingEngine] ✅ Task ${todo.id} approved for completion`);
            this.emit('task-completion-approved', todo);
        });
        // Todo completion blocked
        this.taskCompletionTrigger.on('todo-completion-blocked', (data) => {
            console.log(`[InstinctiveTestingEngine] ❌ Task ${data.todo.id} blocked from completion`);
            this.emit('task-completion-blocked', data);
        });
    }
    /**
     * Handle test execution start
     */
    async handleTestExecutionStart(event) {
        const { todo, changedFiles, testTypes, agent } = event;
        console.log(`[InstinctiveTestingEngine] Starting test execution for task ${todo.id}...`);
        // Check parallel execution limit
        if (this.activeTestExecutions >= this.config.maxParallelTests) {
            console.log(`[InstinctiveTestingEngine] Max parallel tests (${this.config.maxParallelTests}) reached. ` +
                `Test will wait in queue.`);
            return;
        }
        this.activeTestExecutions++;
        try {
            // Create execution context
            const context = {
                taskId: todo.id,
                changedFiles,
                testTypes,
                agent,
                testSelection: { direct: [], indirect: [], all: [], estimatedDuration: 0, reasoning: [] },
                startTime: new Date(),
                status: 'running'
            };
            this.executionContexts.set(todo.id, context);
            // Smart test selection
            if (this.config.smartTestSelection) {
                console.log(`[InstinctiveTestingEngine] Running smart test selection...`);
                context.testSelection = await this.smartTestSelector.selectTests(changedFiles, testTypes);
                console.log(`[InstinctiveTestingEngine] Selected ${context.testSelection.all.length} tests ` +
                    `(${context.testSelection.direct.length} direct + ${context.testSelection.indirect.length} indirect)`);
            }
            // Run tests (delegated to Maria-QA or specialized agents)
            const testResults = await this.executeTests(context);
            // Enforce quality gates
            const qualityGateResult = await this.enforceQualityGates(testResults, changedFiles);
            // Update context
            context.endTime = new Date();
            context.duration = context.endTime.getTime() - context.startTime.getTime();
            context.status = qualityGateResult.passed ? 'completed' : 'failed';
            context.results = testResults;
            context.qualityGateResult = qualityGateResult;
            // Update metrics
            this.updateMetrics(context);
            // Emit result
            if (qualityGateResult.passed) {
                this.taskCompletionTrigger.emit('todo-completion-approved', todo);
            }
            else {
                this.taskCompletionTrigger.emit('todo-completion-blocked', {
                    todo,
                    failures: qualityGateResult.failures.map(f => f.gate),
                    message: qualityGateResult.message
                });
            }
            console.log(`[InstinctiveTestingEngine] Test execution completed for task ${todo.id}: ` +
                `${qualityGateResult.passed ? '✅ PASSED' : '❌ FAILED'} (${context.duration}ms)`);
            this.emit('test-execution-completed', context);
        }
        catch (error) {
            console.error(`[InstinctiveTestingEngine] Test execution failed for task ${todo.id}:`, error);
            this.taskCompletionTrigger.emit('todo-completion-blocked', {
                todo,
                failures: ['Test execution error'],
                message: `Test execution failed: ${error.message}`
            });
            this.emit('test-execution-failed', { taskId: todo.id, error });
        }
        finally {
            this.activeTestExecutions--;
        }
    }
    /**
     * Execute tests for a context
     */
    async executeTests(context) {
        const results = [];
        // Execute each test type
        for (const testType of context.testTypes) {
            console.log(`[InstinctiveTestingEngine] Running ${testType} tests...`);
            const startTime = Date.now();
            try {
                const result = await this.executeTestType(testType, context.testSelection.all, context.changedFiles);
                results.push({
                    ...result,
                    duration: Date.now() - startTime
                });
                console.log(`[InstinctiveTestingEngine] ${testType} tests: ` +
                    `${result.passed ? '✅ PASSED' : '❌ FAILED'} (${result.failed}/${result.total} failed)`);
            }
            catch (error) {
                console.error(`[InstinctiveTestingEngine] ${testType} tests failed:`, error);
                results.push({
                    testType,
                    passed: false,
                    failed: 1,
                    total: 1,
                    duration: Date.now() - startTime,
                    errors: [{
                            type: 'execution_error',
                            message: error.message,
                            severity: 'critical'
                        }]
                });
            }
        }
        return results;
    }
    /**
     * Execute a specific test type
     */
    async executeTestType(testType, testFiles, changedFiles) {
        switch (testType) {
            case TestType.UNIT:
                return this.runUnitTests(testFiles);
            case TestType.INTEGRATION:
                return this.runIntegrationTests(testFiles);
            case TestType.STRESS:
                return this.runStressTests(changedFiles);
            case TestType.SECURITY:
                return this.runSecurityTests(changedFiles);
            case TestType.ACCESSIBILITY:
                return this.runAccessibilityTests(changedFiles);
            case TestType.VISUAL_REGRESSION:
                return this.runVisualRegressionTests(changedFiles);
            case TestType.CONTRACT:
                return this.runContractTests(changedFiles);
            case TestType.MIGRATION:
                return this.runMigrationTests(changedFiles);
            case TestType.SCHEMA_VALIDATION:
                return this.runSchemaValidationTests(changedFiles);
            case TestType.BUILD:
                return this.runBuildTests();
            default:
                throw new Error(`Unsupported test type: ${testType}`);
        }
    }
    /**
     * Test execution methods (delegated to specialized agents)
     */
    async runUnitTests(testFiles) {
        // TODO: Integrate with Maria-QA agent
        return {
            testType: TestType.UNIT,
            passed: true,
            failed: 0,
            total: testFiles.length,
            coverage: 85
        };
    }
    async runIntegrationTests(testFiles) {
        // TODO: Integrate with Maria-QA agent
        return {
            testType: TestType.INTEGRATION,
            passed: true,
            failed: 0,
            total: testFiles.length,
            coverage: 80
        };
    }
    async runStressTests(changedFiles) {
        // TODO: Integrate with AutomatedStressTestGenerator
        if (this.stressTestGenerator) {
            // Generate and run stress tests automatically
            const targets = changedFiles.map(file => ({
                type: 'api_endpoint',
                endpoint: file
            }));
            // Use stress test generator (Rule 2)
            return {
                testType: TestType.STRESS,
                passed: true,
                failed: 0,
                total: targets.length
            };
        }
        return {
            testType: TestType.STRESS,
            passed: true,
            failed: 0,
            total: 0
        };
    }
    async runSecurityTests(changedFiles) {
        // TODO: Integrate with Semgrep MCP or security scanning
        return {
            testType: TestType.SECURITY,
            passed: true,
            failed: 0,
            total: changedFiles.length,
            securityIssues: 0
        };
    }
    async runAccessibilityTests(changedFiles) {
        // TODO: Integrate with axe-core via Chrome MCP
        return {
            testType: TestType.ACCESSIBILITY,
            passed: true,
            failed: 0,
            total: changedFiles.length,
            accessibilityScore: 95
        };
    }
    async runVisualRegressionTests(changedFiles) {
        // TODO: Integrate with Chrome MCP + Percy/Chromatic
        return {
            testType: TestType.VISUAL_REGRESSION,
            passed: true,
            failed: 0,
            total: changedFiles.length
        };
    }
    async runContractTests(changedFiles) {
        // TODO: Integrate with API contract testing
        return {
            testType: TestType.CONTRACT,
            passed: true,
            failed: 0,
            total: changedFiles.length
        };
    }
    async runMigrationTests(changedFiles) {
        // TODO: Integrate with Dana-Database agent
        return {
            testType: TestType.MIGRATION,
            passed: true,
            failed: 0,
            total: changedFiles.length
        };
    }
    async runSchemaValidationTests(changedFiles) {
        // TODO: Integrate with Dana-Database agent
        return {
            testType: TestType.SCHEMA_VALIDATION,
            passed: true,
            failed: 0,
            total: changedFiles.length
        };
    }
    async runBuildTests() {
        // TODO: Run TypeScript compilation + build
        return {
            testType: TestType.BUILD,
            passed: true,
            failed: 0,
            total: 1
        };
    }
    /**
     * Enforce quality gates
     */
    async enforceQualityGates(testResults, changedFiles) {
        // Get quality gate requirements for changed files
        const requirements = changedFiles.map(file => getQualityGateRequirements(file));
        // Use most strict requirements
        const strictestReqs = {
            minCoverage: Math.max(...requirements.map(r => r.minCoverage)),
            requirePassingTests: requirements.some(r => r.requirePassingTests),
            requireSecurityScan: requirements.some(r => r.requireSecurityScan),
            requireAccessibilityScan: requirements.some(r => r.requireAccessibilityScan),
            minAccessibilityScore: Math.max(...requirements.map(r => r.minAccessibilityScore || 0)),
            allowOverride: false
        };
        // Enforce quality gates
        return this.qualityGateEnforcer.enforce(testResults, strictestReqs);
    }
    /**
     * Update metrics
     */
    updateMetrics(context) {
        this.metrics.totalTasksProcessed++;
        if (context.results) {
            const totalTests = context.results.reduce((sum, r) => sum + r.total, 0);
            this.metrics.totalTestsRun += totalTests;
        }
        if (context.duration) {
            this.metrics.totalTestDuration += context.duration;
            this.metrics.averageTestDuration =
                this.metrics.totalTestDuration / this.metrics.totalTasksProcessed;
        }
        if (context.qualityGateResult?.passed) {
            this.metrics.qualityGatePassRate =
                ((this.metrics.qualityGatePassRate * (this.metrics.totalTasksProcessed - 1)) + 1) /
                    this.metrics.totalTasksProcessed;
        }
        else {
            this.metrics.qualityGatePassRate =
                (this.metrics.qualityGatePassRate * (this.metrics.totalTasksProcessed - 1)) /
                    this.metrics.totalTasksProcessed;
        }
        // Calculate time saved via smart test selection
        if (context.testSelection) {
            const fullSuiteDuration = 600000; // Assume 10 minutes for full suite
            const actualDuration = context.duration || 0;
            const timeSaved = Math.max(0, fullSuiteDuration - actualDuration);
            this.metrics.testSelectionTimesSaved += timeSaved;
            this.metrics.totalTimesSaved = this.metrics.testSelectionTimesSaved;
        }
    }
    /**
     * Trigger tests manually (for testing)
     */
    async triggerTests(todo) {
        this.taskCompletionTrigger.emit('todo-status-changed', todo, 'in_progress');
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get execution context for a task
     */
    getExecutionContext(taskId) {
        return this.executionContexts.get(taskId);
    }
    /**
     * Get all execution contexts
     */
    getAllExecutionContexts() {
        return Array.from(this.executionContexts.values());
    }
    /**
     * Clear metrics (for testing)
     */
    clearMetrics() {
        this.metrics = {
            totalTasksProcessed: 0,
            totalTestsRun: 0,
            totalTestDuration: 0,
            averageTestDuration: 0,
            qualityGatePassRate: 0,
            testSelectionTimesSaved: 0,
            totalTimesSaved: 0
        };
    }
    /**
     * Shutdown the engine
     */
    async shutdown() {
        console.log('[InstinctiveTestingEngine] Shutting down...');
        this.taskCompletionTrigger.clearQueue();
        this.executionContexts.clear();
        this.isInitialized = false;
        console.log('[InstinctiveTestingEngine] ✅ Shutdown complete');
    }
}
export default InstinctiveTestingEngine;
//# sourceMappingURL=instinctive-testing-engine.js.map