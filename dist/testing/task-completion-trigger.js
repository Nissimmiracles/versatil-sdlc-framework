/**
 * Task Completion Trigger
 * Watches TodoWrite status changes and triggers appropriate tests
 *
 * Version: 1.0.0
 * Purpose: Auto-trigger tests within 30 seconds of task completion
 */
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SmartTestSelector } from './smart-test-selector.js';
import { findTestTriggers, getRequiredTestTypes, getQualityGateRequirements, getResponsibleAgent, TestType } from './test-trigger-matrix.js';
const execAsync = promisify(exec);
export class TaskCompletionTrigger extends EventEmitter {
    constructor(projectRoot) {
        super();
        this.activeTasks = new Map();
        this.testQueue = [];
        this.isProcessingQueue = false;
        this.projectRoot = projectRoot;
        this.testSelector = new SmartTestSelector(projectRoot);
    }
    /**
     * Initialize and start watching for task completion events
     */
    async initialize() {
        console.log('[TaskCompletionTrigger] Initializing task completion monitoring...');
        // Listen for TodoWrite status changes
        this.on('todo-status-changed', this.handleTodoStatusChange.bind(this));
        // Start processing test queue
        this.startQueueProcessor();
        console.log('[TaskCompletionTrigger] Ready to monitor task completions');
    }
    /**
     * Handle TodoWrite status changes
     */
    async handleTodoStatusChange(todo, previousStatus) {
        // Only trigger on completion attempts
        if (todo.status !== 'completed' || previousStatus === 'completed') {
            return;
        }
        console.log(`[TaskCompletionTrigger] Task completion detected: ${todo.id}`);
        try {
            // Get changed files for this task
            const changedFiles = await this.getChangedFilesForTask(todo);
            if (changedFiles.length === 0) {
                console.log(`[TaskCompletionTrigger] No changed files detected for task ${todo.id}`);
                this.emit('todo-completion-approved', todo);
                return;
            }
            // Determine test types and agent
            const testTypes = this.getTestTypesForFiles(changedFiles);
            const agent = this.getResponsibleAgentForFiles(changedFiles);
            const estimatedDuration = this.estimateTestDuration(changedFiles);
            const event = {
                todo,
                changedFiles,
                testTypes,
                agent,
                estimatedDuration
            };
            // Add to active tasks and test queue
            this.activeTasks.set(todo.id, event);
            this.testQueue.push(event);
            console.log(`[TaskCompletionTrigger] Queued tests for task ${todo.id}: ` +
                `${testTypes.length} test types, ~${(estimatedDuration / 1000).toFixed(1)}s`);
            // Emit event for logging/monitoring
            this.emit('test-queued', event);
        }
        catch (error) {
            console.error(`[TaskCompletionTrigger] Error processing task ${todo.id}:`, error);
            // On error, block completion
            this.emit('todo-completion-blocked', {
                todo,
                failures: ['Error analyzing task changes'],
                message: `Failed to analyze task changes: ${error}`
            });
        }
    }
    /**
     * Get changed files for a task
     */
    async getChangedFilesForTask(todo) {
        // If metadata already has changedFiles, use those
        if (todo.metadata?.changedFiles && todo.metadata.changedFiles.length > 0) {
            return todo.metadata.changedFiles;
        }
        // Otherwise, get files changed since task started
        try {
            // Get files changed in working directory (unstaged + staged)
            const { stdout: unstaged } = await execAsync('git diff --name-only', {
                cwd: this.projectRoot
            });
            const { stdout: staged } = await execAsync('git diff --cached --name-only', {
                cwd: this.projectRoot
            });
            const changedFiles = [
                ...unstaged.split('\n').filter(Boolean),
                ...staged.split('\n').filter(Boolean)
            ];
            // Deduplicate
            return Array.from(new Set(changedFiles));
        }
        catch (error) {
            console.warn('[TaskCompletionTrigger] Error getting changed files:', error);
            return [];
        }
    }
    /**
     * Get test types required for changed files
     */
    getTestTypesForFiles(files) {
        const testTypes = new Set();
        files.forEach(file => {
            const fileTestTypes = getRequiredTestTypes(file);
            fileTestTypes.forEach(type => testTypes.add(type));
        });
        return Array.from(testTypes);
    }
    /**
     * Get responsible agent for changed files
     */
    getResponsibleAgentForFiles(files) {
        // Get agent with highest priority trigger
        const agents = files.map(file => getResponsibleAgent(file));
        // Count agent occurrences
        const agentCounts = agents.reduce((acc, agent) => {
            acc[agent] = (acc[agent] || 0) + 1;
            return acc;
        }, {});
        // Return most common agent
        const sortedAgents = Object.entries(agentCounts)
            .sort((a, b) => b[1] - a[1]);
        return sortedAgents[0]?.[0] || 'maria-qa';
    }
    /**
     * Estimate test duration for changed files
     */
    estimateTestDuration(files) {
        const durations = files.map(file => {
            const triggers = findTestTriggers(file);
            return Math.max(...triggers.map(t => t.estimatedDuration), 0);
        });
        return Math.max(...durations, 0);
    }
    /**
     * Start processing test queue
     */
    startQueueProcessor() {
        setInterval(async () => {
            if (!this.isProcessingQueue && this.testQueue.length > 0) {
                await this.processNextTest();
            }
        }, 1000); // Check every second
    }
    /**
     * Process next test in queue
     */
    async processNextTest() {
        if (this.testQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        try {
            const event = this.testQueue.shift();
            console.log(`[TaskCompletionTrigger] Processing test for task ${event.todo.id}...`);
            // Emit start event
            this.emit('test-execution-started', event);
            // Run tests
            const result = await this.executeTests(event);
            // Update active tasks
            this.activeTasks.delete(event.todo.id);
            // Emit result
            if (result.qualityGatePassed) {
                console.log(`[TaskCompletionTrigger] ✅ Task ${event.todo.id}: All quality gates passed`);
                this.emit('todo-completion-approved', event.todo);
            }
            else {
                console.log(`[TaskCompletionTrigger] ❌ Task ${event.todo.id}: Quality gate failed`);
                this.emit('todo-completion-blocked', {
                    todo: event.todo,
                    failures: [result.message],
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('[TaskCompletionTrigger] Error processing test:', error);
        }
        finally {
            this.isProcessingQueue = false;
        }
    }
    /**
     * Execute tests for a task completion event
     */
    async executeTests(event) {
        const startTime = Date.now();
        try {
            // Get smart test selection
            const testSelection = await this.testSelector.selectTests(event.changedFiles, event.testTypes);
            console.log(`[TaskCompletionTrigger] Running ${testSelection.all.length} tests ` +
                `(${testSelection.direct.length} direct + ${testSelection.indirect.length} indirect)`);
            // Run selected tests
            const testCommand = this.buildTestCommand(testSelection.all, event.testTypes);
            const { stdout, stderr } = await execAsync(testCommand, {
                cwd: this.projectRoot,
                timeout: event.estimatedDuration + 60000 // Add 1 minute buffer
            });
            // Parse test results
            const testResults = this.parseTestResults(stdout, stderr);
            // Check quality gates
            const qualityGateResult = await this.checkQualityGates(testResults, event.changedFiles);
            const duration = Date.now() - startTime;
            return {
                success: qualityGateResult.passed,
                testResults,
                duration,
                qualityGatePassed: qualityGateResult.passed,
                message: qualityGateResult.message
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                testResults: [],
                duration,
                qualityGatePassed: false,
                message: `Test execution failed: ${error.message}`
            };
        }
    }
    /**
     * Build test command based on selected tests and types
     */
    buildTestCommand(testFiles, testTypes) {
        // Base command
        let command = 'npm test';
        // Add test files if specific selection
        if (testFiles.length > 0 && !testFiles.includes('**/*')) {
            command += ` -- ${testFiles.join(' ')}`;
        }
        // Add coverage if needed
        if (testTypes.includes(TestType.UNIT) || testTypes.includes(TestType.INTEGRATION)) {
            command += ' --coverage';
        }
        return command;
    }
    /**
     * Parse test results from stdout/stderr
     */
    parseTestResults(stdout, _stderr) {
        // Simple parser - in production, use proper test reporter
        const results = [];
        // Look for Jest/Vitest output patterns
        const passMatch = stdout.match(/Tests:\s+(\d+)\s+passed/);
        const failMatch = stdout.match(/(\d+)\s+failed/);
        const coverageMatch = stdout.match(/All files\s+\|\s+(\d+\.?\d*)/);
        if (passMatch || failMatch) {
            results.push({
                testType: TestType.UNIT,
                passed: !failMatch || parseInt(failMatch[1]) === 0,
                failed: failMatch ? parseInt(failMatch[1]) : 0,
                total: passMatch ? parseInt(passMatch[1]) : 0,
                coverage: coverageMatch ? parseFloat(coverageMatch[1]) : undefined,
                duration: 0 // TODO: Parse from output
            });
        }
        return results;
    }
    /**
     * Check quality gates
     */
    async checkQualityGates(testResults, changedFiles) {
        // Get quality gate requirements for changed files
        const requirements = changedFiles.map(file => getQualityGateRequirements(file));
        // Use most strict requirements
        const strictestReqs = {
            minCoverage: Math.max(...requirements.map(r => r.minCoverage)),
            requirePassingTests: requirements.some(r => r.requirePassingTests),
            requireSecurityScan: requirements.some(r => r.requireSecurityScan),
            requireAccessibilityScan: requirements.some(r => r.requireAccessibilityScan)
        };
        // Check requirements
        const failures = [];
        // Check test pass rate
        const totalFailed = testResults.reduce((sum, r) => sum + (r.failed || 0), 0);
        if (strictestReqs.requirePassingTests && totalFailed > 0) {
            failures.push(`${totalFailed} tests failed`);
        }
        // Check coverage
        const avgCoverage = testResults
            .filter(r => r.coverage !== undefined)
            .reduce((sum, r) => sum + r.coverage, 0) / testResults.length;
        if (avgCoverage < strictestReqs.minCoverage) {
            failures.push(`Coverage ${avgCoverage.toFixed(1)}% < ${strictestReqs.minCoverage}%`);
        }
        return {
            passed: failures.length === 0,
            message: failures.length > 0
                ? `Quality gate failed: ${failures.join(', ')}`
                : 'All quality gates passed ✅'
        };
    }
    /**
     * Get active tasks count
     */
    getActiveTasks() {
        return this.activeTasks.size;
    }
    /**
     * Get queue length
     */
    getQueueLength() {
        return this.testQueue.length;
    }
    /**
     * Clear queue (for testing/debugging)
     */
    clearQueue() {
        this.testQueue = [];
        this.activeTasks.clear();
    }
}
export default TaskCompletionTrigger;
//# sourceMappingURL=task-completion-trigger.js.map