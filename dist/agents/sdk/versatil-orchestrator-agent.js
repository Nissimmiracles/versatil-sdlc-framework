/**
 * VERSATIL OPERA v6.0 - Main Orchestrator Agent (SDK-Native)
 *
 * The central intelligence that coordinates all VERSATIL operations using Claude Agent SDK.
 *
 * Architecture:
 * - Uses SDK Subagents for 6 OPERA agents (Maria, James, Marcus, Sarah, Alex, Dr.AI-ML)
 * - Uses SDK Background Tasks for monitoring (Flywheel Health, Context Sentinel, Evolution)
 * - Uses SDK Hooks for phase detection, knowledge storage, and status updates
 *
 * Responsibilities:
 * 1. Phase Detection - Identify current SDLC phase from context
 * 2. Agent Selection - Route tasks to appropriate OPERA agents
 * 3. Flywheel Coordination - Manage parallel flywheels per phase
 * 4. Context Management - Prevent context loss, optimize token usage
 * 5. User Communication - Real-time status updates and guidance
 *
 * @module VersatilOrchestratorAgent
 * @version 6.0.0
 */
import { EventEmitter } from 'events';
import { FlywheelMonitoringTask } from '../../tasks/flywheel-monitoring-task.js';
import { ContextMonitoringTask } from '../../tasks/context-monitoring-task.js';
import { EvolutionBackgroundTask } from '../../tasks/evolution-background-task.js';
export class VersatilOrchestratorAgent extends EventEmitter {
    constructor(config) {
        super();
        // Background monitoring tasks
        this.flywheelMonitor = null;
        this.contextMonitor = null;
        this.evolutionTask = null;
        // Flywheel management
        this.flywheels = new Map();
        // Task management
        this.taskQueue = [];
        this.taskCounter = 0;
        if (!config.vectorStore) {
            throw new Error('[VersatilOrchestrator] vectorStore is required in config');
        }
        // Default configuration
        this.config = {
            vectorStore: config.vectorStore,
            monitoring: {
                flywheelHealth: config.monitoring?.flywheelHealth ?? true,
                contextSentinel: config.monitoring?.contextSentinel ?? true,
                evolution: config.monitoring?.evolution ?? true
            },
            orchestration: {
                enableParallelFlywheels: config.orchestration?.enableParallelFlywheels ?? true,
                maxConcurrentAgents: config.orchestration?.maxConcurrentAgents || 3,
                autoPhaseDetection: config.orchestration?.autoPhaseDetection ?? true
            },
            userCommunication: {
                statuslineEnabled: config.userCommunication?.statuslineEnabled ?? true,
                notificationsEnabled: config.userCommunication?.notificationsEnabled ?? true,
                dashboardEnabled: config.userCommunication?.dashboardEnabled ?? true
            },
            ragIntegration: {
                enabled: config.ragIntegration?.enabled ?? true,
                autoPatternStorage: config.ragIntegration?.autoPatternStorage ?? true,
                retrievalThreshold: config.ragIntegration?.retrievalThreshold || 0.75
            }
        };
        // Initialize flywheels for all 6 SDLC phases
        this.initializeFlywheels();
        // Initialize status
        this.status = {
            running: false,
            currentPhase: {
                currentPhase: 'requirements',
                previousPhase: null,
                confidence: 0.5,
                triggers: [],
                timestamp: Date.now()
            },
            flywheels: this.flywheels,
            activeAgents: new Set(),
            taskQueue: [],
            monitoring: {
                flywheelHealth: false,
                contextSentinel: false,
                evolution: false
            },
            metrics: {
                totalTasksCompleted: 0,
                avgTaskDuration: 0,
                overallSuccessRate: 0,
                contextUsagePercent: 0,
                flywheelMomentumAvg: 0
            }
        };
    }
    /**
     * Initialize all 6 SDLC phase flywheels
     */
    initializeFlywheels() {
        const phases = ['requirements', 'design', 'development', 'testing', 'deployment', 'evolution'];
        for (const phase of phases) {
            this.flywheels.set(phase, {
                phase,
                active: false,
                momentum: 0,
                activeAgents: [],
                taskQueue: [],
                metrics: {
                    tasksCompleted: 0,
                    avgExecutionTime: 0,
                    successRate: 1.0
                }
            });
        }
    }
    /**
     * Start the orchestrator and all background tasks
     */
    async start() {
        if (this.status.running) {
            console.log('[VersatilOrchestrator] Already running');
            return;
        }
        console.log('[VersatilOrchestrator] Starting VERSATIL OPERA v6.0...');
        // Start monitoring tasks
        if (this.config.monitoring.flywheelHealth) {
            this.flywheelMonitor = new FlywheelMonitoringTask({
                vectorStore: this.config.vectorStore
            });
            this.setupFlywheelMonitorListeners();
            await this.flywheelMonitor.start();
            this.status.monitoring.flywheelHealth = true;
            console.log('[VersatilOrchestrator] ✅ Flywheel Health Monitor started');
        }
        if (this.config.monitoring.contextSentinel) {
            this.contextMonitor = new ContextMonitoringTask();
            this.setupContextMonitorListeners();
            await this.contextMonitor.start();
            this.status.monitoring.contextSentinel = true;
            console.log('[VersatilOrchestrator] ✅ Context Sentinel started');
        }
        if (this.config.monitoring.evolution) {
            this.evolutionTask = new EvolutionBackgroundTask();
            this.setupEvolutionTaskListeners();
            await this.evolutionTask.start();
            this.status.monitoring.evolution = true;
            console.log('[VersatilOrchestrator] ✅ Evolution Engine started');
        }
        // Update status
        this.status.running = true;
        // Emit start event
        this.emit('orchestrator-started', {
            monitoring: this.status.monitoring,
            timestamp: Date.now()
        });
        // Send user notification
        this.notifyUser({
            level: 'info',
            title: '🚀 VERSATIL OPERA v6.0 Started',
            message: 'All systems operational. Monitoring active.',
            timestamp: Date.now()
        });
        console.log('[VersatilOrchestrator] 🚀 VERSATIL OPERA v6.0 operational');
    }
    /**
     * Stop the orchestrator and all background tasks
     */
    async stop() {
        if (!this.status.running) {
            console.log('[VersatilOrchestrator] Not running');
            return;
        }
        console.log('[VersatilOrchestrator] Stopping...');
        // Stop monitoring tasks
        if (this.flywheelMonitor) {
            await this.flywheelMonitor.stop();
            await this.flywheelMonitor.destroy();
            this.flywheelMonitor = null;
            this.status.monitoring.flywheelHealth = false;
        }
        if (this.contextMonitor) {
            await this.contextMonitor.stop();
            await this.contextMonitor.destroy();
            this.contextMonitor = null;
            this.status.monitoring.contextSentinel = false;
        }
        if (this.evolutionTask) {
            await this.evolutionTask.stop();
            await this.evolutionTask.destroy();
            this.evolutionTask = null;
            this.status.monitoring.evolution = false;
        }
        // Update status
        this.status.running = false;
        // Emit stop event
        this.emit('orchestrator-stopped', { timestamp: Date.now() });
        console.log('[VersatilOrchestrator] Stopped');
    }
    /**
     * Setup listeners for Flywheel Health Monitor
     */
    setupFlywheelMonitorListeners() {
        if (!this.flywheelMonitor)
            return;
        this.flywheelMonitor.on('dashboard-updated', (dashboard) => {
            // Update flywheel momentum from health monitor
            for (const [flywheel, metrics] of Object.entries(dashboard.flywheels)) {
                const flywheelState = this.flywheels.get(flywheel);
                if (flywheelState) {
                    flywheelState.momentum = metrics.momentum;
                }
            }
            this.updateMetrics();
        });
        this.flywheelMonitor.on('alert', (alert) => {
            this.notifyUser({
                level: alert.severity === 'critical' ? 'error' : 'warning',
                title: alert.title,
                message: alert.message,
                timestamp: alert.timestamp
            });
        });
        this.flywheelMonitor.on('user-notification', (notification) => {
            this.notifyUser(notification);
        });
    }
    /**
     * Setup listeners for Context Sentinel
     */
    setupContextMonitorListeners() {
        if (!this.contextMonitor)
            return;
        this.contextMonitor.on('dashboard-updated', (dashboard) => {
            // Update context usage metric
            this.status.metrics.contextUsagePercent = dashboard.usage.percentage;
        });
        this.contextMonitor.on('alert', (alert) => {
            this.notifyUser({
                level: alert.severity === 'critical' ? 'error' : 'warning',
                title: alert.title,
                message: alert.message,
                timestamp: alert.timestamp
            });
        });
        this.contextMonitor.on('statusline-update', (update) => {
            if (this.config.userCommunication.statuslineEnabled) {
                this.emit('statusline-update', update);
            }
        });
        this.contextMonitor.on('user-notification', (notification) => {
            this.notifyUser(notification);
        });
    }
    /**
     * Setup listeners for Evolution Task
     */
    setupEvolutionTaskListeners() {
        if (!this.evolutionTask)
            return;
        this.evolutionTask.on('research-complete', (data) => {
            this.notifyUser({
                level: 'info',
                title: '🔬 Research Complete',
                message: `${data.results.length} topics researched, ${data.recommendations.length} recommendations generated`,
                timestamp: data.timestamp
            });
        });
        this.evolutionTask.on('pattern-learned', (pattern) => {
            console.log(`[VersatilOrchestrator] Pattern learned: ${pattern.pattern}`);
            this.emit('pattern-learned', pattern);
        });
        this.evolutionTask.on('optimization-complete', (data) => {
            if (data.autoApplied && data.recommendations.length > 0) {
                this.notifyUser({
                    level: 'info',
                    title: '⚡ Auto-Optimization Applied',
                    message: `${data.recommendations.length} optimization(s) applied`,
                    timestamp: data.timestamp
                });
            }
        });
    }
    /**
     * Detect current SDLC phase from context
     */
    async detectPhase(context) {
        const triggers = [];
        const scores = new Map();
        // Initialize scores
        for (const phase of this.flywheels.keys()) {
            scores.set(phase, 0);
        }
        // File pattern analysis
        if (context.filePatterns) {
            for (const pattern of context.filePatterns) {
                if (pattern.includes('requirements') || pattern.includes('.feature')) {
                    scores.set('requirements', (scores.get('requirements') || 0) + 2);
                    triggers.push('requirements file pattern');
                }
                if (pattern.includes('design') || pattern.includes('architecture')) {
                    scores.set('design', (scores.get('design') || 0) + 2);
                    triggers.push('design file pattern');
                }
                if (pattern.includes('.ts') || pattern.includes('.js') || pattern.includes('.py')) {
                    scores.set('development', (scores.get('development') || 0) + 1);
                    triggers.push('source code file');
                }
                if (pattern.includes('.test.') || pattern.includes('.spec.')) {
                    scores.set('testing', (scores.get('testing') || 0) + 2);
                    triggers.push('test file pattern');
                }
                if (pattern.includes('deploy') || pattern.includes('.yml')) {
                    scores.set('deployment', (scores.get('deployment') || 0) + 1);
                    triggers.push('deployment file');
                }
            }
        }
        // Keyword analysis
        if (context.keywords) {
            for (const keyword of context.keywords) {
                const lower = keyword.toLowerCase();
                if (lower.includes('requirement') || lower.includes('user story')) {
                    scores.set('requirements', (scores.get('requirements') || 0) + 3);
                    triggers.push('requirements keyword');
                }
                if (lower.includes('design') || lower.includes('architect')) {
                    scores.set('design', (scores.get('design') || 0) + 3);
                    triggers.push('design keyword');
                }
                if (lower.includes('implement') || lower.includes('code') || lower.includes('develop')) {
                    scores.set('development', (scores.get('development') || 0) + 3);
                    triggers.push('development keyword');
                }
                if (lower.includes('test') || lower.includes('coverage') || lower.includes('qa')) {
                    scores.set('testing', (scores.get('testing') || 0) + 3);
                    triggers.push('testing keyword');
                }
                if (lower.includes('deploy') || lower.includes('release') || lower.includes('production')) {
                    scores.set('deployment', (scores.get('deployment') || 0) + 3);
                    triggers.push('deployment keyword');
                }
                if (lower.includes('optimize') || lower.includes('improve') || lower.includes('refactor')) {
                    scores.set('evolution', (scores.get('evolution') || 0) + 2);
                    triggers.push('evolution keyword');
                }
            }
        }
        // Git state analysis
        if (context.gitState) {
            // Would analyze branch names, commits, etc.
            // For now, simplified
        }
        // Find phase with highest score
        let maxScore = 0;
        let detectedPhase = 'development'; // Default
        for (const [phase, score] of scores.entries()) {
            if (score > maxScore) {
                maxScore = score;
                detectedPhase = phase;
            }
        }
        // Calculate confidence (0-1)
        const totalScore = Array.from(scores.values()).reduce((a, b) => a + b, 0);
        const confidence = totalScore > 0 ? maxScore / totalScore : 0.5;
        const phaseContext = {
            currentPhase: detectedPhase,
            previousPhase: this.status.currentPhase.currentPhase,
            confidence,
            triggers: Array.from(new Set(triggers)), // Deduplicate
            timestamp: Date.now()
        };
        // Update status if phase changed
        if (phaseContext.currentPhase !== this.status.currentPhase.currentPhase) {
            this.status.currentPhase = phaseContext;
            this.emit('phase-changed', phaseContext);
            this.notifyUser({
                level: 'info',
                title: `📍 Phase Transition: ${phaseContext.previousPhase} → ${phaseContext.currentPhase}`,
                message: `Confidence: ${Math.round(confidence * 100)}% (${triggers.length} trigger(s))`,
                timestamp: Date.now()
            });
        }
        return phaseContext;
    }
    /**
     * Route a task to the appropriate agent(s)
     */
    async routeTask(task) {
        // Generate task ID
        const taskId = `task-${++this.taskCounter}-${Date.now()}`;
        // Create full task
        const fullTask = {
            ...task,
            id: taskId,
            status: 'pending'
        };
        // Add to queue
        this.taskQueue.push(fullTask);
        // Add to flywheel queue
        const flywheel = this.flywheels.get(task.phase);
        if (flywheel) {
            flywheel.taskQueue.push(fullTask);
        }
        // Emit task created event
        this.emit('task-created', fullTask);
        // Execute task (in real implementation, would use SDK Subagent)
        await this.executeTask(fullTask);
        return fullTask;
    }
    /**
     * Execute a task (simplified - would use SDK Subagent)
     */
    async executeTask(task) {
        // Update status
        task.status = 'in_progress';
        task.startTime = Date.now();
        this.status.activeAgents.add(task.agent);
        // Activate flywheel
        const flywheel = this.flywheels.get(task.phase);
        if (flywheel) {
            flywheel.active = true;
            if (!flywheel.activeAgents.includes(task.agent)) {
                flywheel.activeAgents.push(task.agent);
            }
        }
        // Emit task started event
        this.emit('task-started', task);
        try {
            // In real implementation, would:
            // 1. Create SDK Subagent for the OPERA agent
            // 2. Delegate task to subagent
            // 3. Wait for completion
            // 4. Store result in RAG
            // Simulate execution
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Mark as completed
            task.status = 'completed';
            task.endTime = Date.now();
            task.result = { success: true };
            // Update metrics
            this.updateTaskMetrics(task, true);
            // Learn from execution (evolution task)
            if (this.evolutionTask) {
                await this.evolutionTask.learnFromExecution({
                    agent: task.agent,
                    task: task.description,
                    success: true,
                    duration: task.endTime - task.startTime,
                    context: JSON.stringify(task.context)
                });
            }
            // Emit task completed event
            this.emit('task-completed', task);
        }
        catch (error) {
            task.status = 'failed';
            task.endTime = Date.now();
            task.result = { success: false, error };
            // Update metrics
            this.updateTaskMetrics(task, false);
            // Emit task failed event
            this.emit('task-failed', { task, error });
            console.error(`[VersatilOrchestrator] Task ${task.id} failed:`, error);
        }
        finally {
            // Remove from active agents
            this.status.activeAgents.delete(task.agent);
            // Update flywheel
            if (flywheel) {
                const index = flywheel.activeAgents.indexOf(task.agent);
                if (index > -1) {
                    flywheel.activeAgents.splice(index, 1);
                }
                if (flywheel.activeAgents.length === 0) {
                    flywheel.active = false;
                }
            }
        }
    }
    /**
     * Update task metrics
     */
    updateTaskMetrics(task, success) {
        const flywheel = this.flywheels.get(task.phase);
        if (!flywheel || !task.startTime || !task.endTime)
            return;
        const duration = task.endTime - task.startTime;
        // Update flywheel metrics
        flywheel.metrics.tasksCompleted++;
        flywheel.metrics.avgExecutionTime =
            (flywheel.metrics.avgExecutionTime * (flywheel.metrics.tasksCompleted - 1) + duration) /
                flywheel.metrics.tasksCompleted;
        flywheel.metrics.successRate =
            (flywheel.metrics.successRate * (flywheel.metrics.tasksCompleted - 1) + (success ? 1 : 0)) /
                flywheel.metrics.tasksCompleted;
        // Update overall metrics
        this.updateMetrics();
    }
    /**
     * Update overall orchestrator metrics
     */
    updateMetrics() {
        // Calculate total tasks completed
        this.status.metrics.totalTasksCompleted = Array.from(this.flywheels.values()).reduce((sum, fw) => sum + fw.metrics.tasksCompleted, 0);
        // Calculate average task duration
        let totalDuration = 0;
        let totalTasks = 0;
        for (const fw of this.flywheels.values()) {
            totalDuration += fw.metrics.avgExecutionTime * fw.metrics.tasksCompleted;
            totalTasks += fw.metrics.tasksCompleted;
        }
        this.status.metrics.avgTaskDuration = totalTasks > 0 ? totalDuration / totalTasks : 0;
        // Calculate overall success rate
        let totalSuccess = 0;
        for (const fw of this.flywheels.values()) {
            totalSuccess += fw.metrics.successRate * fw.metrics.tasksCompleted;
        }
        this.status.metrics.overallSuccessRate = totalTasks > 0 ? totalSuccess / totalTasks : 1.0;
        // Calculate average flywheel momentum
        const momentums = Array.from(this.flywheels.values()).map(fw => fw.momentum);
        this.status.metrics.flywheelMomentumAvg =
            momentums.reduce((a, b) => a + b, 0) / momentums.length;
    }
    /**
     * Notify user (if notifications enabled)
     */
    notifyUser(notification) {
        if (!this.config.userCommunication.notificationsEnabled)
            return;
        this.emit('user-notification', notification);
        console.log(`[VersatilOrchestrator] ${notification.level.toUpperCase()}: ${notification.title}`);
    }
    /**
     * Get current orchestrator status
     */
    getStatus() {
        return {
            ...this.status,
            flywheels: new Map(this.flywheels),
            activeAgents: new Set(this.status.activeAgents),
            taskQueue: [...this.taskQueue]
        };
    }
    /**
     * Get flywheel state
     */
    getFlywheelState(phase) {
        return this.flywheels.get(phase);
    }
    /**
     * Activate a specific flywheel
     */
    async activateFlywheel(phase) {
        const flywheel = this.flywheels.get(phase);
        if (!flywheel) {
            throw new Error(`Unknown phase: ${phase}`);
        }
        flywheel.active = true;
        this.emit('flywheel-activated', { phase, timestamp: Date.now() });
        console.log(`[VersatilOrchestrator] Activated ${phase} flywheel`);
    }
    /**
     * Deactivate a specific flywheel
     */
    async deactivateFlywheel(phase) {
        const flywheel = this.flywheels.get(phase);
        if (!flywheel) {
            throw new Error(`Unknown phase: ${phase}`);
        }
        flywheel.active = false;
        this.emit('flywheel-deactivated', { phase, timestamp: Date.now() });
        console.log(`[VersatilOrchestrator] Deactivated ${phase} flywheel`);
    }
    /**
     * Get monitoring dashboards
     */
    getMonitoringDashboards() {
        return {
            flywheelHealth: this.flywheelMonitor?.getCurrentDashboard() || null,
            contextSentinel: this.contextMonitor?.getCurrentDashboard() || null
        };
    }
    /**
     * Cleanup
     */
    async destroy() {
        await this.stop();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=versatil-orchestrator-agent.js.map