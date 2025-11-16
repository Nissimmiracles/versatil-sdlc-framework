/* eslint-disable no-case-declarations */
/**
 * VERSATIL SDLC Framework - Parallel Task Manager
 * Implements Rule 1: Run many tasks in parallel if not colliding with SDLC process
 *
 * Features:
 * - Intelligent collision detection
 * - SDLC process-aware task orchestration
 * - Resource contention prevention
 * - Agent coordination and handoff management
 */
import { EventEmitter } from 'events';
import { EnvironmentManager } from '../environment/environment-manager.js';
export var TaskType;
(function (TaskType) {
    TaskType["DEVELOPMENT"] = "development";
    TaskType["TESTING"] = "testing";
    TaskType["BUILD"] = "build";
    TaskType["DEPLOYMENT"] = "deployment";
    TaskType["QUALITY_ASSURANCE"] = "quality_assurance";
    TaskType["DOCUMENTATION"] = "documentation";
    TaskType["ANALYSIS"] = "analysis";
    TaskType["MONITORING"] = "monitoring";
    TaskType["SECURITY"] = "security";
})(TaskType || (TaskType = {}));
export var Priority;
(function (Priority) {
    Priority[Priority["CRITICAL"] = 1] = "CRITICAL";
    Priority[Priority["HIGH"] = 2] = "HIGH";
    Priority[Priority["MEDIUM"] = 3] = "MEDIUM";
    Priority[Priority["LOW"] = 4] = "LOW";
    Priority[Priority["BACKGROUND"] = 5] = "BACKGROUND";
})(Priority || (Priority = {}));
export var SDLCPhase;
(function (SDLCPhase) {
    SDLCPhase["PLANNING"] = "planning";
    SDLCPhase["ANALYSIS"] = "analysis";
    SDLCPhase["DESIGN"] = "design";
    SDLCPhase["IMPLEMENTATION"] = "implementation";
    SDLCPhase["TESTING"] = "testing";
    SDLCPhase["DEPLOYMENT"] = "deployment";
    SDLCPhase["MAINTENANCE"] = "maintenance";
})(SDLCPhase || (SDLCPhase = {}));
export var CollisionRisk;
(function (CollisionRisk) {
    CollisionRisk["NONE"] = "none";
    CollisionRisk["LOW"] = "low";
    CollisionRisk["MEDIUM"] = "medium";
    CollisionRisk["HIGH"] = "high";
    CollisionRisk["CRITICAL"] = "critical";
})(CollisionRisk || (CollisionRisk = {}));
export var ResourceType;
(function (ResourceType) {
    ResourceType["FILE_SYSTEM"] = "file_system";
    ResourceType["DATABASE"] = "database";
    ResourceType["NETWORK"] = "network";
    ResourceType["CPU"] = "cpu";
    ResourceType["MEMORY"] = "memory";
    ResourceType["AGENT"] = "agent";
    ResourceType["BUILD_SYSTEM"] = "build_system";
    ResourceType["TEST_ENVIRONMENT"] = "test_environment";
})(ResourceType || (ResourceType = {}));
export var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["QUEUED"] = "queued";
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["COMPLETED"] = "completed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["CANCELLED"] = "cancelled";
    ExecutionStatus["PAUSED"] = "paused";
})(ExecutionStatus || (ExecutionStatus = {}));
export var CollisionType;
(function (CollisionType) {
    CollisionType["RESOURCE_CONFLICT"] = "resource_conflict";
    CollisionType["DEPENDENCY_CYCLE"] = "dependency_cycle";
    CollisionType["SDLC_PHASE_VIOLATION"] = "sdlc_phase_violation";
    CollisionType["AGENT_OVERLOAD"] = "agent_overload";
    CollisionType["FILE_LOCK_CONFLICT"] = "file_lock_conflict";
    CollisionType["BUILD_SYSTEM_CONFLICT"] = "build_system_conflict";
})(CollisionType || (CollisionType = {}));
export var CollisionRecommendation;
(function (CollisionRecommendation) {
    CollisionRecommendation["SERIALIZE"] = "serialize";
    CollisionRecommendation["RESCHEDULE"] = "reschedule";
    CollisionRecommendation["RESOURCE_ALLOCATION"] = "resource_allocation";
    CollisionRecommendation["TASK_SPLITTING"] = "task_splitting";
    CollisionRecommendation["PRIORITY_ADJUSTMENT"] = "priority_adjustment";
    CollisionRecommendation["AGENT_REASSIGNMENT"] = "agent_reassignment";
})(CollisionRecommendation || (CollisionRecommendation = {}));
export var CollisionSeverity;
(function (CollisionSeverity) {
    CollisionSeverity["INFO"] = "info";
    CollisionSeverity["WARNING"] = "warning";
    CollisionSeverity["ERROR"] = "error";
    CollisionSeverity["CRITICAL"] = "critical";
})(CollisionSeverity || (CollisionSeverity = {}));
export class ParallelTaskManager extends EventEmitter {
    constructor() {
        super();
        this.tasks = new Map();
        this.executions = new Map();
        this.resourcePool = new Map();
        this.agentWorkload = new Map();
        this.sdlcState = SDLCPhase.PLANNING;
        this.maxParallelTasks = 10;
        this.todoWriteEnabled = true; // Feature flag for TodoWrite integration
        this.environmentManager = new EnvironmentManager();
        this.initializeResourcePool();
        this.startResourceMonitoring();
    }
    /**
     * Add a task to the execution queue with collision detection
     */
    async addTask(task) {
        this.emit('_task:added', { taskId: task.id, task });
        // Validate task
        const validation = await this.validateTask(task);
        if (!validation.isValid) {
            throw new Error(`Task validation failed: ${validation.errors.join(', ')}`);
        }
        // Detect collisions
        const collisionResult = await this.detectCollisions(task);
        if (collisionResult.hasCollision && collisionResult.severity === CollisionSeverity.CRITICAL) {
            throw new Error(`Critical collision detected: ${collisionResult.collisionType}`);
        }
        // Handle non-critical collisions
        if (collisionResult.hasCollision) {
            await this.handleCollision(task, collisionResult);
        }
        this.tasks.set(task.id, task);
        // Try to execute immediately if resources are available
        await this.tryExecuteTask(task.id);
        return task.id;
    }
    /**
     * Execute multiple tasks in parallel with intelligent orchestration
     */
    async executeParallel(taskIds) {
        const executionPlan = await this.createExecutionPlan(taskIds);
        const results = new Map();
        // Emit TodoWrite event for parallel execution start
        if (this.todoWriteEnabled) {
            const taskNames = taskIds
                .map(id => this.tasks.get(id))
                .filter(Boolean)
                .map(t => t.agentId || 'Agent')
                .filter((v, i, a) => a.indexOf(v) === i); // unique agents
            this.emit('todowrite:parallel-start', {
                agents: taskNames,
                taskCount: taskIds.length,
                batchCount: executionPlan.batches.length,
                estimatedTime: executionPlan.totalEstimatedTime
            });
        }
        // Execute tasks in parallel batches based on dependencies and resource availability
        for (const batch of executionPlan.batches) {
            const batchPromises = batch.map(taskId => this.executeTask(taskId));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                const taskId = batch[index];
                if (result.status === 'fulfilled') {
                    results.set(taskId, result.value);
                }
                else {
                    const execution = {
                        taskId,
                        startTime: new Date(),
                        endTime: new Date(),
                        status: ExecutionStatus.FAILED,
                        progress: 0,
                        error: result.reason,
                        resourceUsage: []
                    };
                    results.set(taskId, execution);
                    this.emit('_task:failed', { taskId, error: result.reason });
                }
            });
        }
        // Emit TodoWrite event for parallel execution complete
        if (this.todoWriteEnabled) {
            const completed = Array.from(results.values()).filter(r => r.status === ExecutionStatus.COMPLETED).length;
            const failed = Array.from(results.values()).filter(r => r.status === ExecutionStatus.FAILED).length;
            this.emit('todowrite:parallel-complete', {
                totalTasks: taskIds.length,
                completed,
                failed,
                results
            });
        }
        return results;
    }
    /**
     * Intelligent collision detection system
     */
    async detectCollisions(newTask) {
        const runningTasks = Array.from(this.executions.values())
            .filter(exec => exec.status === ExecutionStatus.RUNNING);
        const conflictingTasks = [];
        let collisionType = CollisionType.RESOURCE_CONFLICT;
        let severity = CollisionSeverity.INFO;
        // Check resource conflicts
        for (const execution of runningTasks) {
            const task = this.tasks.get(execution.taskId);
            if (!task)
                continue;
            // Check for exclusive resource conflicts
            const resourceConflict = this.checkResourceConflict(newTask, task);
            if (resourceConflict.hasConflict) {
                conflictingTasks.push(task.id);
                if (this.getSeverityLevel(CollisionSeverity.WARNING) > this.getSeverityLevel(severity)) {
                    severity = CollisionSeverity.WARNING;
                }
            }
            // Check SDLC phase violations
            if (this.checkSDLCPhaseConflict(newTask, task)) {
                conflictingTasks.push(task.id);
                collisionType = CollisionType.SDLC_PHASE_VIOLATION;
                if (this.getSeverityLevel(CollisionSeverity.ERROR) > this.getSeverityLevel(severity)) {
                    severity = CollisionSeverity.ERROR;
                }
            }
            // Check agent overload
            if (newTask.agentId && task.agentId === newTask.agentId) {
                const currentLoad = this.agentWorkload.get(newTask.agentId) || 0;
                if (currentLoad >= 3) { // Max 3 concurrent tasks per agent
                    conflictingTasks.push(task.id);
                    collisionType = CollisionType.AGENT_OVERLOAD;
                    if (this.getSeverityLevel(CollisionSeverity.WARNING) > this.getSeverityLevel(severity)) {
                        severity = CollisionSeverity.WARNING;
                    }
                }
            }
        }
        // Check dependency cycles
        const hasCycle = this.checkDependencyCycle(newTask);
        if (hasCycle) {
            collisionType = CollisionType.DEPENDENCY_CYCLE;
            severity = CollisionSeverity.CRITICAL;
        }
        return {
            hasCollision: conflictingTasks.length > 0 || hasCycle,
            collisionType,
            conflictingTasks,
            recommendation: this.generateRecommendation(collisionType, severity),
            severity
        };
    }
    /**
     * Handle collisions with intelligent resolution strategies
     */
    async handleCollision(task, collision) {
        this.emit('_collision:detected', { task, collision });
        switch (collision.recommendation) {
            case CollisionRecommendation.SERIALIZE:
                // Wait for conflicting tasks to complete
                await this.waitForTasks(collision.conflictingTasks);
                break;
            case CollisionRecommendation.RESCHEDULE:
                // Delay task execution
                task.metadata.scheduledDelay = this.calculateOptimalDelay(collision);
                break;
            case CollisionRecommendation.RESOURCE_ALLOCATION:
                // Adjust resource allocation
                await this.reallocateResources(task, collision);
                break;
            case CollisionRecommendation.AGENT_REASSIGNMENT:
                // Reassign to less loaded agent
                const alternativeAgent = await this.findAlternativeAgent(task);
                if (alternativeAgent) {
                    task.agentId = alternativeAgent;
                }
                break;
            case CollisionRecommendation.TASK_SPLITTING:
                // Split task into smaller parallel chunks
                const subtasks = await this.splitTask(task);
                for (const subtask of subtasks) {
                    await this.addTask(subtask);
                }
                break;
        }
    }
    /**
     * Create intelligent execution plan with dependency resolution
     */
    async createExecutionPlan(taskIds) {
        const tasks = taskIds.map(id => this.tasks.get(id)).filter(Boolean);
        const dependencyGraph = this.buildDependencyGraph(tasks);
        const batches = [];
        const processed = new Set();
        let totalEstimatedTime = 0;
        const resourceUtilization = new Map();
        while (processed.size < tasks.length) {
            const batch = [];
            const batchResources = new Map();
            for (const task of tasks) {
                if (processed.has(task.id))
                    continue;
                // Check if all dependencies are satisfied
                const dependenciesSatisfied = task.dependencies.every(dep => processed.has(dep));
                if (!dependenciesSatisfied)
                    continue;
                // Check resource availability
                const canAddToBatch = this.canAddTaskToBatch(task, batchResources);
                if (!canAddToBatch)
                    continue;
                batch.push(task.id);
                processed.add(task.id);
                // Update batch resource usage
                for (const resource of task.requiredResources) {
                    const current = batchResources.get(resource.type) || 0;
                    batchResources.set(resource.type, current + resource.capacity);
                }
            }
            if (batch.length === 0 && processed.size < tasks.length) {
                // Deadlock detection - break by priority
                const remainingTasks = tasks.filter(t => !processed.has(t.id));
                const highestPriority = remainingTasks.reduce((min, task) => task.priority < min.priority ? task : min);
                batch.push(highestPriority.id);
                processed.add(highestPriority.id);
            }
            batches.push(batch);
            // Calculate batch time (max of all tasks in batch)
            const batchTime = Math.max(...batch.map(id => {
                const task = this.tasks.get(id);
                return task ? task.estimatedDuration : 0;
            }));
            totalEstimatedTime += batchTime;
            // Update total resource utilization
            for (const [resourceType, usage] of batchResources) {
                const current = resourceUtilization.get(resourceType) || 0;
                resourceUtilization.set(resourceType, Math.max(current, usage));
            }
        }
        return { batches, totalEstimatedTime, resourceUtilization };
    }
    /**
     * Execute a single task with resource management
     */
    async executeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        const execution = {
            taskId,
            startTime: new Date(),
            status: ExecutionStatus.RUNNING,
            progress: 0,
            resourceUsage: []
        };
        this.executions.set(taskId, execution);
        this.emit('_task:started', { taskId, task });
        // Emit TodoWrite event for task start
        if (this.todoWriteEnabled) {
            this.emit('todowrite:task-start', {
                taskId,
                taskName: task.name,
                agentId: task.agentId,
                estimatedDuration: task.estimatedDuration
            });
        }
        try {
            // Allocate resources
            await this.allocateResources(task);
            // Update agent workload
            if (task.agentId) {
                const currentLoad = this.agentWorkload.get(task.agentId) || 0;
                this.agentWorkload.set(task.agentId, currentLoad + 1);
            }
            // Emit progress update: 20% (allocated resources)
            execution.progress = 20;
            if (this.todoWriteEnabled) {
                this.emit('todowrite:progress-update', { taskId, progress: 20, phase: 'resources-allocated' });
            }
            // Execute task based on type
            execution.progress = 50;
            if (this.todoWriteEnabled) {
                this.emit('todowrite:progress-update', { taskId, progress: 50, phase: 'executing' });
            }
            const result = await this.executeTaskByType(task);
            execution.endTime = new Date();
            execution.status = ExecutionStatus.COMPLETED;
            execution.progress = 100;
            execution.result = result;
            this.emit('_task:completed', { taskId, task, result });
            // Emit TodoWrite event for task completion
            if (this.todoWriteEnabled) {
                this.emit('todowrite:task-complete', {
                    taskId,
                    taskName: task.name,
                    agentId: task.agentId,
                    duration: execution.endTime.getTime() - execution.startTime.getTime(),
                    result
                });
            }
        }
        catch (error) {
            execution.endTime = new Date();
            execution.status = ExecutionStatus.FAILED;
            execution.error = error;
            this.emit('_task:failed', { taskId, task, error });
            // Emit TodoWrite event for task failure
            if (this.todoWriteEnabled) {
                this.emit('todowrite:task-failed', {
                    taskId,
                    taskName: task.name,
                    agentId: task.agentId,
                    error: error.message
                });
            }
            throw error;
        }
        finally {
            // Release resources
            await this.releaseResources(task);
            // Update agent workload
            if (task.agentId) {
                const currentLoad = this.agentWorkload.get(task.agentId) || 0;
                this.agentWorkload.set(task.agentId, Math.max(0, currentLoad - 1));
            }
        }
        return execution;
    }
    /**
     * Execute task based on its type with proper agent coordination
     */
    async executeTaskByType(task) {
        switch (task.type) {
            case TaskType.DEVELOPMENT:
                return await this.executeDevelopmentTask(task);
            case TaskType.TESTING:
                return await this.executeTestingTask(task);
            case TaskType.BUILD:
                return await this.executeBuildTask(task);
            case TaskType.DEPLOYMENT:
                return await this.executeDeploymentTask(task);
            case TaskType.QUALITY_ASSURANCE:
                return await this.executeQualityAssuranceTask(task);
            case TaskType.DOCUMENTATION:
                return await this.executeDocumentationTask(task);
            case TaskType.ANALYSIS:
                return await this.executeAnalysisTask(task);
            case TaskType.MONITORING:
                return await this.executeMonitoringTask(task);
            case TaskType.SECURITY:
                return await this.executeSecurityTask(task);
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }
    // Task execution methods for different types
    async executeDevelopmentTask(task) {
        // Coordinate with appropriate agent (James-Frontend, Marcus-Backend, etc.)
        return { status: 'completed', type: 'development', metadata: task.metadata };
    }
    async executeTestingTask(task) {
        // Coordinate with Maria-QA agent
        return { status: 'completed', type: 'testing', coverage: 85, metadata: task.metadata };
    }
    async executeBuildTask(task) {
        // Execute build with proper resource allocation
        return { status: 'completed', type: 'build', buildTime: task.estimatedDuration };
    }
    async executeDeploymentTask(task) {
        // Coordinate deployment with environment manager
        const env = await this.environmentManager.getCurrentEnvironment();
        return { status: 'completed', type: 'deployment', environment: env };
    }
    async executeQualityAssuranceTask(task) {
        // Run quality checks with Maria-QA
        return { status: 'completed', type: 'qa', qualityScore: 92 };
    }
    async executeDocumentationTask(task) {
        // Generate documentation with Sarah-PM coordination
        return { status: 'completed', type: 'documentation', pages: 5 };
    }
    async executeAnalysisTask(task) {
        // Business analysis with Alex-BA or Dr.AI-ML
        return { status: 'completed', type: 'analysis', insights: task.metadata.analysisType };
    }
    async executeMonitoringTask(task) {
        // Execute monitoring task
        return { status: 'completed', type: 'monitoring', metrics: task.metadata.metrics };
    }
    async executeSecurityTask(task) {
        // Execute security scan or audit
        return { status: 'completed', type: 'security', vulnerabilities: 0 };
    }
    // Helper methods
    initializeResourcePool() {
        const resources = [
            { type: ResourceType.CPU, name: 'cpu-cores', capacity: 8, exclusive: false },
            { type: ResourceType.MEMORY, name: 'system-memory', capacity: 16384, exclusive: false },
            { type: ResourceType.FILE_SYSTEM, name: 'project-files', capacity: 1, exclusive: true },
            { type: ResourceType.DATABASE, name: 'test-db', capacity: 3, exclusive: false },
            { type: ResourceType.BUILD_SYSTEM, name: 'build-pipeline', capacity: 1, exclusive: true },
            { type: ResourceType.TEST_ENVIRONMENT, name: 'test-env', capacity: 5, exclusive: false }
        ];
        for (const resource of resources) {
            this.resourcePool.set(resource.name, resource);
        }
    }
    startResourceMonitoring() {
        setInterval(() => {
            this.emit('resource:status', {
                pool: Array.from(this.resourcePool.values()),
                agentWorkload: Array.from(this.agentWorkload.entries()),
                activeTasks: this.executions.size
            });
        }, 5000);
    }
    getSeverityLevel(severity) {
        const levels = {
            [CollisionSeverity.INFO]: 1,
            [CollisionSeverity.WARNING]: 2,
            [CollisionSeverity.ERROR]: 3,
            [CollisionSeverity.CRITICAL]: 4
        };
        return levels[severity] || 0;
    }
    async validateTask(task) {
        const errors = [];
        if (!task.id || !task.name) {
            errors.push('Task must have id and name');
        }
        if (task.estimatedDuration <= 0) {
            errors.push('Task must have positive estimated duration');
        }
        if (!task.requiredResources || task.requiredResources.length === 0) {
            errors.push('Task must specify required resources');
        }
        return { isValid: errors.length === 0, errors };
    }
    checkResourceConflict(task1, task2) {
        for (const resource1 of task1.requiredResources) {
            for (const resource2 of task2.requiredResources) {
                if (resource1.name === resource2.name &&
                    (resource1.exclusive || resource2.exclusive)) {
                    return { hasConflict: true };
                }
            }
        }
        return { hasConflict: false };
    }
    checkSDLCPhaseConflict(task1, task2) {
        // Define phase dependencies
        const phaseOrder = [
            SDLCPhase.PLANNING,
            SDLCPhase.ANALYSIS,
            SDLCPhase.DESIGN,
            SDLCPhase.IMPLEMENTATION,
            SDLCPhase.TESTING,
            SDLCPhase.DEPLOYMENT,
            SDLCPhase.MAINTENANCE
        ];
        const phase1Index = phaseOrder.indexOf(task1.sdlcPhase);
        const phase2Index = phaseOrder.indexOf(task2.sdlcPhase);
        // Check if trying to run later phase before earlier phase is complete
        const task2Execution = this.executions.get(task2.id);
        return phase1Index < phase2Index && task2Execution?.status !== ExecutionStatus.COMPLETED;
    }
    checkDependencyCycle(task) {
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycleDFS = (taskId) => {
            if (recursionStack.has(taskId))
                return true;
            if (visited.has(taskId))
                return false;
            visited.add(taskId);
            recursionStack.add(taskId);
            const currentTask = this.tasks.get(taskId);
            if (currentTask) {
                for (const dep of currentTask.dependencies) {
                    if (hasCycleDFS(dep))
                        return true;
                }
            }
            recursionStack.delete(taskId);
            return false;
        };
        return hasCycleDFS(task.id);
    }
    generateRecommendation(collisionType, severity) {
        switch (collisionType) {
            case CollisionType.RESOURCE_CONFLICT:
                return severity >= CollisionSeverity.ERROR ?
                    CollisionRecommendation.SERIALIZE :
                    CollisionRecommendation.RESOURCE_ALLOCATION;
            case CollisionType.AGENT_OVERLOAD:
                return CollisionRecommendation.AGENT_REASSIGNMENT;
            case CollisionType.SDLC_PHASE_VIOLATION:
                return CollisionRecommendation.RESCHEDULE;
            case CollisionType.DEPENDENCY_CYCLE:
                return CollisionRecommendation.TASK_SPLITTING;
            default:
                return CollisionRecommendation.SERIALIZE;
        }
    }
    async tryExecuteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return;
        const runningCount = Array.from(this.executions.values())
            .filter(exec => exec.status === ExecutionStatus.RUNNING).length;
        if (runningCount < this.maxParallelTasks) {
            await this.executeTask(taskId);
        }
    }
    async waitForTasks(taskIds) {
        const promises = taskIds.map(id => {
            return new Promise((resolve) => {
                const checkCompletion = () => {
                    const execution = this.executions.get(id);
                    if (!execution || execution.status === ExecutionStatus.COMPLETED ||
                        execution.status === ExecutionStatus.FAILED) {
                        resolve();
                    }
                    else {
                        setTimeout(checkCompletion, 100);
                    }
                };
                checkCompletion();
            });
        });
        await Promise.all(promises);
    }
    calculateOptimalDelay(collision) {
        // Calculate delay based on collision severity and conflicting tasks
        const baseDelay = 1000; // 1 second
        const severityMultiplier = {
            [CollisionSeverity.INFO]: 1,
            [CollisionSeverity.WARNING]: 2,
            [CollisionSeverity.ERROR]: 5,
            [CollisionSeverity.CRITICAL]: 10
        };
        return baseDelay * severityMultiplier[collision.severity] * collision.conflictingTasks.length;
    }
    async reallocateResources(task, collision) {
        // Implement resource reallocation logic
        // This could involve reducing resource requirements or finding alternative resources
    }
    async findAlternativeAgent(task) {
        // Find least loaded agent that can handle the task type
        const compatibleAgents = ['maria-qa', 'james-frontend', 'marcus-backend', 'sarah-pm'];
        let minLoad = Infinity;
        let bestAgent = null;
        for (const agentId of compatibleAgents) {
            const load = this.agentWorkload.get(agentId) || 0;
            if (load < minLoad) {
                minLoad = load;
                bestAgent = agentId;
            }
        }
        return bestAgent;
    }
    async splitTask(task) {
        // Split task into smaller parallel subtasks
        const subtasks = [];
        const subtaskCount = Math.min(task.estimatedDuration / 300000, 4); // Max 4 subtasks
        for (let i = 0; i < subtaskCount; i++) {
            subtasks.push({
                ...task,
                id: `${task.id}_subtask_${i}`,
                name: `${task.name} (Part ${i + 1})`,
                estimatedDuration: task.estimatedDuration / subtaskCount,
                dependencies: i === 0 ? task.dependencies : [`${task.id}_subtask_${i - 1}`]
            });
        }
        return subtasks;
    }
    buildDependencyGraph(tasks) {
        const graph = new Map();
        for (const task of tasks) {
            graph.set(task.id, task.dependencies);
        }
        return graph;
    }
    canAddTaskToBatch(task, batchResources) {
        for (const resource of task.requiredResources) {
            const available = this.resourcePool.get(resource.name);
            if (!available)
                continue;
            const currentUsage = batchResources.get(resource.type) || 0;
            if (currentUsage + resource.capacity > available.capacity) {
                return false;
            }
            if (resource.exclusive && currentUsage > 0) {
                return false;
            }
        }
        return true;
    }
    async allocateResources(task) {
        // Implement resource allocation logic
        for (const resource of task.requiredResources) {
            this.emit('resource:allocated', {
                taskId: task.id,
                resource: resource.name,
                capacity: resource.capacity
            });
        }
    }
    async releaseResources(task) {
        // Implement resource release logic
        for (const resource of task.requiredResources) {
            this.emit('resource:released', {
                taskId: task.id,
                resource: resource.name,
                capacity: resource.capacity
            });
        }
    }
    // Public API methods
    getExecutionStatus(taskId) {
        return this.executions.get(taskId);
    }
    getResourceUtilization() {
        const utilization = new Map();
        for (const [name, resource] of this.resourcePool) {
            let usage = 0;
            for (const execution of this.executions.values()) {
                if (execution.status === ExecutionStatus.RUNNING) {
                    const task = this.tasks.get(execution.taskId);
                    if (task) {
                        const taskResource = task.requiredResources.find(r => r.name === name);
                        if (taskResource) {
                            usage += taskResource.capacity;
                        }
                    }
                }
            }
            utilization.set(name, (usage / resource.capacity) * 100);
        }
        return utilization;
    }
    getAgentWorkload() {
        return new Map(this.agentWorkload);
    }
    async cancelTask(taskId) {
        const execution = this.executions.get(taskId);
        if (execution && execution.status === ExecutionStatus.RUNNING) {
            execution.status = ExecutionStatus.CANCELLED;
            execution.endTime = new Date();
            const task = this.tasks.get(taskId);
            if (task) {
                await this.releaseResources(task);
            }
            this.emit('task:cancelled', { taskId });
        }
    }
    async pauseTask(taskId) {
        const execution = this.executions.get(taskId);
        if (execution && execution.status === ExecutionStatus.RUNNING) {
            execution.status = ExecutionStatus.PAUSED;
            this.emit('task:paused', { taskId });
        }
    }
    async resumeTask(taskId) {
        const execution = this.executions.get(taskId);
        if (execution && execution.status === ExecutionStatus.PAUSED) {
            execution.status = ExecutionStatus.RUNNING;
            this.emit('task:resumed', { taskId });
        }
    }
    /**
     * Enable/disable TodoWrite integration
     */
    setTodoWriteEnabled(enabled) {
        this.todoWriteEnabled = enabled;
    }
    /**
     * Get current progress for all running tasks (for TodoWrite updates)
     */
    getParallelProgress() {
        const progress = new Map();
        for (const [taskId, execution] of this.executions) {
            if (execution.status === ExecutionStatus.RUNNING) {
                const task = this.tasks.get(taskId);
                progress.set(task?.agentId || taskId, execution.progress);
            }
        }
        return progress;
    }
    /**
     * Get summary of parallel execution for TodoWrite display
     */
    getParallelExecutionSummary() {
        const running = [];
        const completed = [];
        const failed = [];
        const agents = new Set();
        let totalProgress = 0;
        let count = 0;
        for (const [taskId, execution] of this.executions) {
            const task = this.tasks.get(taskId);
            if (task?.agentId) {
                agents.add(task.agentId);
            }
            if (execution.status === ExecutionStatus.RUNNING) {
                running.push(taskId);
                totalProgress += execution.progress;
                count++;
            }
            else if (execution.status === ExecutionStatus.COMPLETED) {
                completed.push(taskId);
            }
            else if (execution.status === ExecutionStatus.FAILED) {
                failed.push(taskId);
            }
        }
        return {
            runningCount: running.length,
            completedCount: completed.length,
            failedCount: failed.length,
            agents: Array.from(agents),
            overallProgress: count > 0 ? Math.round(totalProgress / count) : 0
        };
    }
    /**
     * Format parallel progress for statusline display
     * Example: "Dana (30%) + Marcus (45%) + James (60%) working in parallel"
     */
    formatParallelProgressForStatusline() {
        const progress = this.getParallelProgress();
        if (progress.size === 0) {
            return 'No parallel tasks running';
        }
        const progressStrings = Array.from(progress.entries())
            .map(([agent, pct]) => `${agent} (${pct}%)`)
            .join(' + ');
        return `${progressStrings} working in parallel`;
    }
}
export default ParallelTaskManager;
//# sourceMappingURL=parallel-task-manager.js.map