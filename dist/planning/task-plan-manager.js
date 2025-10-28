/**
 * @fileoverview Task Plan Manager - Hierarchical task planning and execution tracking
 *
 * Provides complete visibility into:
 * - Agent plans (what will be done before execution)
 * - Task hierarchy (agent tasks → subagent tasks)
 * - Live execution progress
 * - Historical plan tracking
 * - Dependency management
 *
 * @module planning/task-plan-manager
 * @version 6.1.0
 */
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// TASK PLAN MANAGER
// ============================================================================
/**
 * Manages hierarchical task planning and execution tracking
 *
 * Features:
 * - Pre-execution plan generation
 * - User approval workflow
 * - Real-time progress tracking
 * - Subagent task visibility
 * - Dependency management
 * - Historical plan storage
 *
 * Events emitted:
 * - plan-created: New plan generated
 * - plan-approval-requested: Plan awaiting user approval
 * - plan-approved: Plan approved by user
 * - plan-rejected: Plan rejected by user
 * - plan-started: Plan execution started
 * - plan-completed: Plan execution completed
 * - plan-failed: Plan execution failed
 * - task-started: Individual task started
 * - task-progress: Task progress updated
 * - task-completed: Task completed
 * - task-failed: Task failed
 * - task-blocked: Task blocked by dependency
 */
export class TaskPlanManager extends EventEmitter {
    constructor() {
        super();
        /** Active plans (in-memory) */
        this.plans = new Map();
        /** Currently executing tasks */
        this.activeTasks = new Map();
        /** Historical plans (recently completed) */
        this.history = [];
        /** Maximum history size */
        this.MAX_HISTORY = 100;
    }
    // ==========================================================================
    // PLAN CREATION & APPROVAL
    // ==========================================================================
    /**
     * Create a new task plan
     *
     * @param config - Plan configuration
     * @returns Created plan (pending approval unless autoApprove=true)
     */
    async createPlan(config) {
        const plan = {
            id: this.generatePlanId(),
            agent: config.agent,
            rootTask: config.rootTask,
            status: 'planning',
            createdAt: new Date(),
            // Use provided tasks or generate from rootTask
            tasks: config.tasks || await this.generateTaskBreakdown(config),
            dependencies: [],
            estimatedDuration: config.estimatedDuration || 0,
            estimatedCost: config.estimatedCost || 0,
            involvedAgents: this.extractInvolvedAgents(config.tasks || []),
            subagentCount: this.countSubagents(config.tasks || []),
            metadata: config.metadata
        };
        // Calculate dependencies
        plan.dependencies = this.analyzeDependencies(plan.tasks);
        // Recalculate estimates if not provided
        if (!config.estimatedDuration) {
            plan.estimatedDuration = this.calculateEstimatedDuration(plan.tasks);
        }
        if (!config.estimatedCost) {
            plan.estimatedCost = this.calculateEstimatedCost(plan.tasks);
        }
        // Store plan
        this.plans.set(plan.id, plan);
        // Emit creation event
        this.emit('plan-created', plan);
        // Handle approval workflow
        if (config.autoApprove) {
            await this.approvePlan(plan.id);
        }
        else {
            plan.status = 'approval_requested';
            this.emit('plan-approval-requested', {
                plan,
                visualization: this.generatePlanVisualization(plan)
            });
        }
        return plan;
    }
    /**
     * Approve a plan for execution
     */
    async approvePlan(planId) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        plan.status = 'approved';
        plan.approvedAt = new Date();
        this.emit('plan-approved', plan);
    }
    /**
     * Reject a plan
     */
    async rejectPlan(planId, reason) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        plan.status = 'rejected';
        this.emit('plan-rejected', { plan, reason });
        // Move to history
        this.archivePlan(plan);
    }
    // ==========================================================================
    // PLAN EXECUTION
    // ==========================================================================
    /**
     * Execute an approved plan
     *
     * @param planId - Plan identifier
     * @returns Execution result
     */
    async executePlan(planId) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        if (plan.status !== 'approved') {
            throw new Error(`Plan ${planId} is not approved (status: ${plan.status})`);
        }
        plan.status = 'executing';
        plan.startedAt = new Date();
        this.emit('plan-started', plan);
        const completedTasks = [];
        const failedTasks = [];
        const outputs = [];
        try {
            // Build execution queue respecting dependencies
            const taskQueue = this.buildExecutionQueue(plan);
            // Execute tasks
            for (const task of taskQueue) {
                // Check if dependencies are satisfied
                if (!this.areDependenciesSatisfied(task, plan)) {
                    task.status = 'blocked';
                    task.blockedBy = this.getBlockingTasks(task, plan);
                    this.emit('task-blocked', { task, plan });
                    continue;
                }
                // Execute task
                try {
                    const result = await this.executeTask(task, plan);
                    completedTasks.push(task);
                    outputs.push(...task.outputs);
                }
                catch (error) {
                    task.status = 'failed';
                    task.error = {
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        timestamp: new Date()
                    };
                    failedTasks.push(task);
                    this.emit('task-failed', { task, plan, error });
                    // Stop execution on critical task failure
                    if (this.isCriticalTask(task)) {
                        throw error;
                    }
                }
            }
            plan.status = 'completed';
            plan.completedAt = new Date();
            plan.actualDuration = this.calculateActualDuration(plan);
            this.emit('plan-completed', plan);
            // Archive to history
            this.archivePlan(plan);
            return {
                success: failedTasks.length === 0,
                plan,
                completedTasks,
                failedTasks,
                duration: plan.actualDuration || 0,
                cost: plan.actualCost || 0,
                outputs
            };
        }
        catch (error) {
            plan.status = 'failed';
            plan.completedAt = new Date();
            this.emit('plan-failed', { plan, error });
            // Archive to history
            this.archivePlan(plan);
            throw error;
        }
    }
    /**
     * Execute an individual task
     */
    async executeTask(task, plan) {
        task.status = 'in_progress';
        task.startedAt = new Date();
        task.progress = 0;
        this.activeTasks.set(task.id, task);
        this.emit('task-started', { task, plan });
        // Execute subtasks first
        for (const subtask of task.subtasks) {
            await this.executeTask(subtask, plan);
        }
        // Simulate task execution (actual implementation would delegate to agents)
        // This is a placeholder - real implementation will integrate with agent system
        await this.simulateTaskExecution(task);
        task.status = 'completed';
        task.completedAt = new Date();
        task.progress = 100;
        task.actualDuration = this.calculateTaskDuration(task);
        this.activeTasks.delete(task.id);
        this.emit('task-completed', { task, plan });
    }
    /**
     * Placeholder for actual task execution
     * Real implementation will delegate to agent system
     */
    async simulateTaskExecution(task) {
        // This will be replaced with actual agent/subagent execution
        // For now, just simulate progress
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            task.progress = (i / steps) * 100;
            this.emit('task-progress', { task, progress: task.progress });
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        }
    }
    // ==========================================================================
    // PLAN QUERIES & STATUS
    // ==========================================================================
    /**
     * Get current status of a plan
     */
    getPlanStatus(planId) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        const allTasks = this.flattenTaskHierarchy(plan.tasks);
        return {
            plan,
            activeTasks: allTasks.filter(t => t.status === 'in_progress'),
            completedTasks: allTasks.filter(t => t.status === 'completed'),
            blockedTasks: allTasks.filter(t => t.status === 'blocked'),
            failedTasks: allTasks.filter(t => t.status === 'failed'),
            progress: this.calculatePlanProgress(plan),
            estimatedTimeRemaining: this.estimateTimeRemaining(plan)
        };
    }
    /**
     * Get all active plans
     */
    getActivePlans() {
        return Array.from(this.plans.values()).filter(p => p.status === 'executing' || p.status === 'approval_requested' || p.status === 'approved');
    }
    /**
     * Get plan history
     */
    getHistory(limit = 10) {
        return this.history.slice(0, limit);
    }
    /**
     * Get plan by ID (including history)
     */
    getPlan(planId) {
        return this.plans.get(planId) || this.history.find(p => p.id === planId);
    }
    // ==========================================================================
    // DEPENDENCY MANAGEMENT
    // ==========================================================================
    /**
     * Check if task dependencies are satisfied
     */
    areDependenciesSatisfied(task, plan) {
        if (task.dependsOn.length === 0)
            return true;
        const allTasks = this.flattenTaskHierarchy(plan.tasks);
        const dependencies = allTasks.filter(t => task.dependsOn.includes(t.id));
        return dependencies.every(dep => dep.status === 'completed');
    }
    /**
     * Get tasks blocking this task
     */
    getBlockingTasks(task, plan) {
        if (task.dependsOn.length === 0)
            return [];
        const allTasks = this.flattenTaskHierarchy(plan.tasks);
        const dependencies = allTasks.filter(t => task.dependsOn.includes(t.id));
        return dependencies
            .filter(dep => dep.status !== 'completed')
            .map(dep => dep.id);
    }
    /**
     * Analyze task dependencies
     */
    analyzeDependencies(tasks) {
        const dependencies = [];
        const allTasks = this.flattenTaskHierarchy(tasks);
        // Parent-child dependencies
        for (const task of allTasks) {
            if (task.parentTaskId) {
                dependencies.push({
                    from: task.parentTaskId,
                    to: task.id,
                    type: 'enables',
                    description: 'Parent task enables child task'
                });
            }
        }
        // Explicit dependencies
        for (const task of allTasks) {
            for (const depId of task.dependsOn) {
                const depTask = allTasks.find(t => t.id === depId);
                if (depTask) {
                    dependencies.push({
                        from: depId,
                        to: task.id,
                        type: 'blocks',
                        description: `${depTask.description} must complete before ${task.description}`
                    });
                }
            }
        }
        return dependencies;
    }
    /**
     * Build task execution queue respecting dependencies
     */
    buildExecutionQueue(plan) {
        const allTasks = this.flattenTaskHierarchy(plan.tasks);
        const queue = [];
        const visited = new Set();
        // Topological sort
        const visit = (task) => {
            if (visited.has(task.id))
                return;
            // Visit dependencies first
            const deps = allTasks.filter(t => task.dependsOn.includes(t.id));
            for (const dep of deps) {
                visit(dep);
            }
            visited.add(task.id);
            queue.push(task);
        };
        for (const task of allTasks) {
            visit(task);
        }
        return queue;
    }
    // ==========================================================================
    // TASK BREAKDOWN & GENERATION
    // ==========================================================================
    /**
     * Generate task breakdown from high-level description
     *
     * This is a placeholder - real implementation will use:
     * - Agent planning capabilities
     * - RAG pattern retrieval
     * - Historical task patterns
     */
    async generateTaskBreakdown(config) {
        // Placeholder: Generate simple task structure
        // Real implementation will delegate to agent planning system
        const rootTask = {
            id: this.generateTaskId(),
            description: config.rootTask,
            status: 'pending',
            assignedAgent: config.agent,
            isSubagentTask: false,
            subtasks: [],
            depth: 0,
            estimatedDuration: config.estimatedDuration || 10,
            progress: 0,
            outputs: [],
            dependsOn: [],
            blockedBy: []
        };
        return [rootTask];
    }
    // ==========================================================================
    // VISUALIZATION
    // ==========================================================================
    /**
     * Generate text visualization of plan
     */
    generatePlanVisualization(plan) {
        return `
┌─────────────────────────────────────────────────────────┐
│ Task Plan: ${plan.rootTask.slice(0, 45).padEnd(45)}│
│ Agent: ${plan.agent.padEnd(49)} │
│ Estimated Duration: ${String(plan.estimatedDuration).padEnd(37)} min │
│ Estimated Cost: ${String(plan.estimatedCost).padEnd(41)} tokens │
└─────────────────────────────────────────────────────────┘

Task Breakdown:
${this.renderTaskTree(plan.tasks, 0)}

Dependencies:
${this.renderDependencies(plan.dependencies)}

Involved Agents: ${plan.involvedAgents.join(', ')}
Subagents: ${plan.subagentCount}

⏸️  Waiting for approval...
`;
    }
    /**
     * Render task hierarchy as ASCII tree
     */
    renderTaskTree(tasks, depth) {
        return tasks.map(task => {
            const indent = '  '.repeat(depth);
            const icon = this.getTaskIcon(task.status);
            const agent = task.assignedAgent ? `[${task.assignedAgent}]` : '';
            const subagentMarker = task.isSubagentTask ? '↳ ' : '';
            const duration = task.estimatedDuration ? ` (~${task.estimatedDuration}min)` : '';
            let output = `${indent}${icon} ${subagentMarker}${task.description} ${agent}${duration}`;
            if (task.subtasks.length > 0) {
                output += '\n' + this.renderTaskTree(task.subtasks, depth + 1);
            }
            return output;
        }).join('\n');
    }
    /**
     * Render dependencies
     */
    renderDependencies(dependencies) {
        if (dependencies.length === 0)
            return 'None';
        return dependencies.map(dep => `• ${dep.type}: ${dep.description}`).join('\n');
    }
    /**
     * Get task status icon
     */
    getTaskIcon(status) {
        const icons = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'failed': '❌',
            'blocked': '🚫'
        };
        return icons[status];
    }
    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    /**
     * Generate unique plan ID
     */
    generatePlanId() {
        return `plan_${uuidv4().split('-')[0]}`;
    }
    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${uuidv4().split('-')[0]}`;
    }
    /**
     * Flatten task hierarchy into single array
     */
    flattenTaskHierarchy(tasks) {
        const flat = [];
        const flatten = (task) => {
            flat.push(task);
            task.subtasks.forEach(flatten);
        };
        tasks.forEach(flatten);
        return flat;
    }
    /**
     * Extract involved agents from tasks
     */
    extractInvolvedAgents(tasks) {
        const agents = new Set();
        const extract = (task) => {
            if (task.assignedAgent)
                agents.add(task.assignedAgent);
            task.subtasks.forEach(extract);
        };
        tasks.forEach(extract);
        return Array.from(agents);
    }
    /**
     * Count subagent tasks
     */
    countSubagents(tasks) {
        let count = 0;
        const countSubtasks = (task) => {
            if (task.isSubagentTask)
                count++;
            task.subtasks.forEach(countSubtasks);
        };
        tasks.forEach(countSubtasks);
        return count;
    }
    /**
     * Calculate estimated duration
     */
    calculateEstimatedDuration(tasks) {
        const allTasks = this.flattenTaskHierarchy(tasks);
        return allTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    }
    /**
     * Calculate estimated cost
     */
    calculateEstimatedCost(tasks) {
        // Placeholder: rough estimate based on task count
        const allTasks = this.flattenTaskHierarchy(tasks);
        return allTasks.length * 1000; // ~1k tokens per task
    }
    /**
     * Calculate actual duration
     */
    calculateActualDuration(plan) {
        if (!plan.startedAt || !plan.completedAt)
            return 0;
        return (plan.completedAt.getTime() - plan.startedAt.getTime()) / (1000 * 60);
    }
    /**
     * Calculate task duration
     */
    calculateTaskDuration(task) {
        if (!task.startedAt || !task.completedAt)
            return 0;
        return (task.completedAt.getTime() - task.startedAt.getTime()) / (1000 * 60);
    }
    /**
     * Calculate plan progress (0-100)
     */
    calculatePlanProgress(plan) {
        const allTasks = this.flattenTaskHierarchy(plan.tasks);
        if (allTasks.length === 0)
            return 0;
        const totalProgress = allTasks.reduce((sum, task) => sum + task.progress, 0);
        return Math.round(totalProgress / allTasks.length);
    }
    /**
     * Estimate time remaining
     */
    estimateTimeRemaining(plan) {
        if (plan.status !== 'executing')
            return plan.estimatedDuration;
        const progress = this.calculatePlanProgress(plan);
        if (progress === 0)
            return plan.estimatedDuration;
        const elapsed = this.calculateActualDuration(plan);
        const totalEstimated = (elapsed / progress) * 100;
        return Math.max(0, totalEstimated - elapsed);
    }
    /**
     * Check if task is critical (failure should stop execution)
     */
    isCriticalTask(task) {
        // Tasks with dependents are critical
        return task.subtasks.length > 0;
    }
    /**
     * Archive completed plan to history
     */
    archivePlan(plan) {
        this.plans.delete(plan.id);
        this.history.unshift(plan);
        // Trim history if needed
        if (this.history.length > this.MAX_HISTORY) {
            this.history = this.history.slice(0, this.MAX_HISTORY);
        }
    }
}
// ============================================================================
// EXPORTS
// ============================================================================
export default TaskPlanManager;
//# sourceMappingURL=task-plan-manager.js.map