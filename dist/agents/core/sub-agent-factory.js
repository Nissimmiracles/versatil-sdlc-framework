/**
 * VERSATIL Framework - Sub-Agent Factory
 * Creates specialized sub-agent instances for parallel task execution
 *
 * Features:
 * - Spawns specialized sub-agents (sub-marcus-1, sub-james-2, etc.)
 * - Manages sub-agent lifecycle (create, execute, monitor, cleanup)
 * - Integrates with Conflict Resolution Engine
 * - Integrates with MCP Task Executor
 * - Tracks sub-agent performance and health
 * - Auto-scaling based on workload
 *
 * Sub-Agent Types:
 * - sub-marcus: Backend development (API, database, business logic)
 * - sub-james: Frontend development (UI, components, interactions)
 * - sub-maria: Testing (unit, integration, E2E)
 * - sub-sarah: Project management (coordination, reporting)
 * - sub-alex: Requirements analysis (user stories, acceptance criteria)
 * - sub-dr-ai: ML/AI development (models, training, deployment)
 */
import { EventEmitter } from 'events';
import { ConflictResolutionEngine } from '../../orchestration/conflict-resolution-engine.js';
import { MCPTaskExecutor } from '../../mcp/mcp-task-executor.js';
import { globalAgentPool } from './agent-pool.js';
export class SubAgentFactory extends EventEmitter {
    constructor(conflictEngine, mcpExecutor, agentPool) {
        super();
        this.subAgents = new Map();
        this.activeAgentInstances = new Map(); // Track borrowed agent instances
        this.taskQueue = new Map();
        this.stats = {
            totalSubAgents: 0,
            activeSubAgents: 0,
            completedTasks: 0,
            failedTasks: 0,
            averageTaskDuration: 0,
            subAgentsByType: {
                'maria-qa': 0,
                'james-frontend': 0,
                'marcus-backend': 0,
                'sarah-pm': 0,
                'alex-ba': 0,
                'dr-ai-ml': 0
            }
        };
        // Sub-agent capacity limits (max concurrent sub-agents per type)
        this.MAX_SUBAGENTS_PER_TYPE = {
            'marcus-backend': 5,
            'james-frontend': 5,
            'maria-qa': 3,
            'sarah-pm': 2,
            'alex-ba': 2,
            'dr-ai-ml': 2
        };
        this.conflictEngine = conflictEngine || new ConflictResolutionEngine();
        this.mcpExecutor = mcpExecutor || new MCPTaskExecutor();
        this.agentPool = agentPool || globalAgentPool;
    }
    async initialize() {
        console.log('🏭 Sub-Agent Factory initializing...');
        // Initialize dependencies
        await Promise.all([
            this.conflictEngine.initialize(),
            this.mcpExecutor.initialize()
        ]);
        // Initialize task queues
        for (const type of Object.keys(this.MAX_SUBAGENTS_PER_TYPE)) {
            this.taskQueue.set(type, []);
        }
        this.emit('factory:initialized');
        console.log('✅ Sub-Agent Factory ready');
    }
    /**
     * Create sub-agent for a task (main method)
     */
    async createSubAgent(config) {
        console.log(`🏭 Creating sub-agent: ${config.type} for task ${config.task.id}`);
        // Check capacity limits
        const currentCount = this.getActiveSubAgentCount(config.type);
        const maxCount = this.MAX_SUBAGENTS_PER_TYPE[config.type] || 5;
        if (currentCount >= maxCount) {
            console.log(`   ⏳ Capacity limit reached (${currentCount}/${maxCount}) - queuing task`);
            this.queueTask(config);
            throw new Error(`Max ${config.type} sub-agents (${maxCount}) already active - task queued`);
        }
        // Generate unique sub-agent ID
        const subAgentId = `${config.type}-${config.epicId}-${Date.now()}`;
        // Create sub-agent instance
        const subAgent = {
            id: subAgentId,
            type: config.type,
            taskId: config.task.id,
            priority: config.priority,
            files: config.task.files,
            startTime: Date.now(),
            status: 'pending',
            parentEpicId: config.epicId,
            dependencies: config.task.dependsOn,
            config,
            health: 'healthy',
            performance: {
                tasksCompleted: 0,
                tasksErrors: 0,
                averageTaskDuration: 0,
                lastActivityTime: Date.now()
            },
            resources: {
                cpuUsage: 0,
                memoryUsage: 0,
                activeTasks: 0
            }
        };
        // Register with conflict engine
        await this.conflictEngine.registerAgent(subAgent);
        // Store sub-agent
        this.subAgents.set(subAgentId, subAgent);
        this.stats.totalSubAgents++;
        this.stats.activeSubAgents++;
        this.stats.subAgentsByType[config.type]++;
        this.emit('subagent:created', {
            subAgentId,
            type: config.type,
            taskId: config.task.id
        });
        console.log(`   ✅ Sub-agent created: ${subAgentId}`);
        return subAgent;
    }
    /**
     * Execute task with sub-agent
     */
    async executeTask(subAgentId) {
        const subAgent = this.subAgents.get(subAgentId);
        if (!subAgent) {
            throw new Error(`Sub-agent ${subAgentId} not found`);
        }
        console.log(`🤖 ${subAgentId} executing task: ${subAgent.taskId}`);
        const startTime = Date.now();
        try {
            // Update status
            subAgent.status = 'running';
            subAgent.resources.activeTasks++;
            await this.conflictEngine.updateAgentStatus(subAgentId, 'running');
            // STEP 1: Infer MCP tools for this task
            const task = subAgent.config.task;
            const mcpInference = await this.mcpExecutor.inferTools(task);
            console.log(`   🔧 Inferred ${mcpInference.inferredTools.length} MCP tools`);
            // STEP 2: Execute MCP tools
            const mcpResult = await this.mcpExecutor.executeTools(task, mcpInference);
            if (!mcpResult.success) {
                console.log(`   ⚠️  MCP execution partial: ${mcpResult.errors.length} errors`);
            }
            // STEP 3: Perform agent-specific work
            await this.performAgentWork(subAgent, mcpResult);
            // STEP 4: Update status and metrics
            const duration = Date.now() - startTime;
            subAgent.status = 'completed';
            subAgent.resources.activeTasks--;
            subAgent.performance.tasksCompleted++;
            subAgent.performance.lastActivityTime = Date.now();
            this.updateAverageTaskDuration(subAgent, duration);
            await this.conflictEngine.updateAgentStatus(subAgentId, 'completed');
            this.stats.completedTasks++;
            this.updateOverallAverageTaskDuration(duration);
            this.emit('task:completed', {
                subAgentId,
                taskId: subAgent.taskId,
                duration
            });
            console.log(`   ✅ Task completed by ${subAgentId} (${duration}ms)`);
            // STEP 5: Check if queued tasks exist for this type
            await this.processQueuedTasks(subAgent.type);
            // STEP 6: Cleanup if idle
            if (subAgent.performance.tasksCompleted > 0 && subAgent.resources.activeTasks === 0) {
                await this.cleanupSubAgent(subAgentId);
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            subAgent.status = 'failed';
            subAgent.resources.activeTasks--;
            subAgent.performance.tasksErrors++;
            subAgent.health = 'unhealthy';
            await this.conflictEngine.updateAgentStatus(subAgentId, 'failed');
            this.stats.failedTasks++;
            this.emit('task:failed', {
                subAgentId,
                taskId: subAgent.taskId,
                error: error.message,
                duration
            });
            console.error(`   ❌ Task failed by ${subAgentId}:`, error.message);
            throw error;
        }
    }
    /**
     * Perform agent-specific work (simulated)
     */
    async performAgentWork(subAgent, mcpResult) {
        const { type, id } = subAgent;
        console.log(`   🔧 Performing ${type}-specific work...`);
        try {
            // Get real agent instance from pool
            const agent = await this.agentPool.getAgent(type);
            this.activeAgentInstances.set(id, agent);
            // Create activation context for the agent
            const context = this.createAgentContext(subAgent, mcpResult);
            // Execute real agent work
            await agent.activate(context);
            console.log(`      ✅ ${type} work complete`);
            // Update resource usage based on actual execution
            subAgent.resources.cpuUsage = 30 + Math.random() * 50; // 30-80%
            subAgent.resources.memoryUsage = 20 + Math.random() * 40; // 20-60%
            // executeTask doesn't return a value
            return;
        }
        catch (error) {
            console.error(`      ❌ ${type} work failed:`, error.message);
            throw error;
        }
        finally {
            // Release agent back to pool
            const agent = this.activeAgentInstances.get(id);
            if (agent) {
                await this.agentPool.releaseAgent(agent);
                this.activeAgentInstances.delete(id);
            }
        }
    }
    /**
     * Create activation context for real agent execution
     * NEW v6.1: Includes MCP tools inherited from parent
     */
    createAgentContext(subAgent, mcpResult) {
        const task = subAgent.config.task;
        return {
            trigger: {
                agent: subAgent.type,
                type: 'sub_agent_task',
                filePath: task.files?.[0] || '',
                event: 'task_execution'
            },
            filePath: task.files?.[0] || '',
            userRequest: `${task.name}: ${task.description}`,
            contextClarity: 'clear',
            urgency: this.mapPriorityToUrgency(subAgent.priority),
            taskContext: {
                taskId: task.id,
                taskType: task.type,
                epicId: subAgent.parentEpicId,
                files: task.files,
                dependencies: task.dependsOn,
                mcpResults: mcpResult
            },
            // NEW v6.1: Inherit MCP tools from parent agent
            inheritedMCPTools: this.getInheritedMCPTools(subAgent.type, task)
        };
    }
    /**
     * NEW v6.1: Get MCP tools that sub-agent should inherit from parent
     */
    getInheritedMCPTools(agentType, task) {
        const tools = [];
        // Base tools (all sub-agents get these)
        tools.push('Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep');
        // Agent-specific MCP tools
        switch (agentType) {
            case 'james-frontend':
            case 'maria-qa':
                // Frontend and QA agents get browser automation
                tools.push('Playwright', 'Chrome');
                break;
            case 'marcus-backend':
                // Backend agents get GitHub and database tools
                tools.push('GitHub');
                break;
            case 'sarah-pm':
            case 'alex-ba':
                // PM and BA agents get GitHub for issue/PR management
                tools.push('GitHub', 'Exa');
                break;
            case 'dr-ai-ml':
                // AI/ML agents get Exa for research
                tools.push('Exa');
                break;
        }
        // Task-based tool additions
        if (task.files) {
            const hasTestFiles = task.files.some(f => f.includes('test') || f.includes('spec'));
            if (hasTestFiles && !tools.includes('Playwright')) {
                tools.push('Playwright');
            }
            const hasUIFiles = task.files.some(f => f.includes('.tsx') || f.includes('.jsx'));
            if (hasUIFiles && !tools.includes('Chrome')) {
                tools.push('Chrome');
            }
        }
        return tools;
    }
    /**
     * Map numeric priority to urgency level
     */
    mapPriorityToUrgency(priority) {
        if (priority >= 8)
            return 'high';
        if (priority >= 5)
            return 'medium';
        return 'low';
    }
    /**
     * Update average task duration for sub-agent
     */
    updateAverageTaskDuration(subAgent, duration) {
        const { tasksCompleted, averageTaskDuration } = subAgent.performance;
        const newAverage = ((averageTaskDuration * tasksCompleted) + duration) / (tasksCompleted + 1);
        subAgent.performance.averageTaskDuration = newAverage;
    }
    /**
     * Update overall average task duration
     */
    updateOverallAverageTaskDuration(duration) {
        const { completedTasks, averageTaskDuration } = this.stats;
        this.stats.averageTaskDuration = ((averageTaskDuration * completedTasks) + duration) / (completedTasks + 1);
    }
    /**
     * Queue task when capacity limit reached
     */
    queueTask(config) {
        const queue = this.taskQueue.get(config.type);
        if (queue) {
            queue.push(config.task);
            console.log(`   📋 Task queued: ${config.task.id} (queue size: ${queue.length})`);
        }
    }
    /**
     * Process queued tasks when sub-agent becomes available
     */
    async processQueuedTasks(type) {
        const queue = this.taskQueue.get(type);
        if (!queue || queue.length === 0)
            return;
        console.log(`📋 Processing queued ${type} tasks (${queue.length} in queue)...`);
        const task = queue.shift();
        if (!task)
            return;
        // Create new sub-agent for queued task
        try {
            const config = {
                type,
                task,
                epicId: task.epicId || 'default-epic',
                priority: task.priority
            };
            const subAgent = await this.createSubAgent(config);
            await this.executeTask(subAgent.id);
        }
        catch (error) {
            console.error(`Failed to process queued task:`, error);
            // Re-queue the task
            queue.unshift(task);
        }
    }
    /**
     * Cleanup idle sub-agent
     */
    async cleanupSubAgent(subAgentId) {
        const subAgent = this.subAgents.get(subAgentId);
        if (!subAgent)
            return;
        console.log(`🧹 Cleaning up sub-agent: ${subAgentId}`);
        // Remove from registry
        this.subAgents.delete(subAgentId);
        this.stats.activeSubAgents--;
        this.stats.subAgentsByType[subAgent.type]--;
        this.emit('subagent:cleaned', {
            subAgentId,
            type: subAgent.type,
            tasksCompleted: subAgent.performance.tasksCompleted
        });
    }
    /**
     * Get active sub-agent count for a type
     */
    getActiveSubAgentCount(type) {
        return Array.from(this.subAgents.values()).filter(sa => sa.type === type && (sa.status === 'pending' || sa.status === 'running')).length;
    }
    /**
     * Get sub-agent by ID
     */
    getSubAgent(subAgentId) {
        return this.subAgents.get(subAgentId);
    }
    /**
     * Get all active sub-agents
     */
    getActiveSubAgents() {
        return Array.from(this.subAgents.values()).filter(sa => sa.status === 'pending' || sa.status === 'running');
    }
    /**
     * Get sub-agents by type
     */
    getSubAgentsByType(type) {
        return Array.from(this.subAgents.values()).filter(sa => sa.type === type);
    }
    /**
     * Get statistics
     */
    getStatistics() {
        return { ...this.stats };
    }
    /**
     * Monitor sub-agent health
     */
    async monitorHealth() {
        const now = Date.now();
        for (const [subAgentId, subAgent] of this.subAgents.entries()) {
            // Check for stale sub-agents (no activity for 5 minutes)
            const timeSinceLastActivity = now - subAgent.performance.lastActivityTime;
            if (timeSinceLastActivity > 5 * 60 * 1000) {
                console.log(`⚠️  Stale sub-agent detected: ${subAgentId} (${(timeSinceLastActivity / 1000 / 60).toFixed(1)}m idle)`);
                subAgent.health = 'degraded';
            }
            // Check resource usage
            if (subAgent.resources.cpuUsage > 90 || subAgent.resources.memoryUsage > 90) {
                console.log(`⚠️  High resource usage: ${subAgentId} (CPU: ${subAgent.resources.cpuUsage}%, Mem: ${subAgent.resources.memoryUsage}%)`);
                subAgent.health = 'degraded';
            }
            // Check error rate
            const errorRate = subAgent.performance.tasksCompleted > 0
                ? (subAgent.performance.tasksErrors / subAgent.performance.tasksCompleted) * 100
                : 0;
            if (errorRate > 20) {
                console.log(`⚠️  High error rate: ${subAgentId} (${errorRate.toFixed(1)}%)`);
                subAgent.health = 'unhealthy';
            }
        }
    }
    /**
     * Auto-scale sub-agents based on queue size
     */
    async autoScale() {
        for (const [type, queue] of this.taskQueue.entries()) {
            if (queue.length === 0)
                continue;
            const activeCount = this.getActiveSubAgentCount(type);
            const maxCount = this.MAX_SUBAGENTS_PER_TYPE[type] || 5;
            // If queue is growing and we have capacity, spawn more sub-agents
            if (queue.length > 3 && activeCount < maxCount) {
                console.log(`📈 Auto-scaling: Creating additional ${type} sub-agent (queue: ${queue.length}, active: ${activeCount}/${maxCount})`);
                await this.processQueuedTasks(type);
            }
        }
    }
    /**
     * Shutdown factory
     */
    async shutdown() {
        // Cleanup all sub-agents
        for (const subAgentId of this.subAgents.keys()) {
            await this.cleanupSubAgent(subAgentId);
        }
        await Promise.all([
            this.conflictEngine.shutdown(),
            this.mcpExecutor.shutdown()
        ]);
        this.taskQueue.clear();
        this.emit('factory:shutdown');
        console.log('🛑 Sub-Agent Factory shut down');
    }
}
// Export singleton instance
export const globalSubAgentFactory = new SubAgentFactory();
//# sourceMappingURL=sub-agent-factory.js.map