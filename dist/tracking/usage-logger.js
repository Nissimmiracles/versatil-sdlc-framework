/**
 * VERSATIL Usage Logger
 *
 * Automatically logs all agent activations and framework usage
 * to provide real-time visibility and power sentiment tracking.
 *
 * Features:
 * - Auto-log every agent activation
 * - Track task duration and outcome
 * - Calculate time saved vs manual work
 * - Persist to ~/.versatil/logs/usage.log
 */
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
// Manual task time estimates (in minutes)
const MANUAL_TASK_TIMES = {
    'test_coverage_analysis': 30,
    'missing_test_detection': 20,
    'component_optimization': 20,
    'accessibility_audit': 45,
    'security_scan': 30,
    'stress_test_generation': 40,
    'visual_regression_testing': 35,
    'api_documentation': 25,
    'code_review': 45,
    'bug_detection': 15,
    'performance_optimization': 30,
    'requirement_extraction': 40,
    'user_story_generation': 35,
    'database_schema_design': 50,
    'api_endpoint_implementation': 60,
    'ui_component_creation': 45,
    'default': 20, // fallback for unknown tasks
};
export class UsageLogger {
    constructor() {
        this.activeTasks = new Map();
        this.sessionEvents = [];
        this.logsDir = path.join(homedir(), '.versatil', 'logs');
        this.usageLogPath = path.join(this.logsDir, 'usage.log');
        this.currentSessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
    }
    /**
     * Initialize logger (create logs directory if needed)
     */
    async initialize() {
        try {
            await fs.mkdir(this.logsDir, { recursive: true });
            console.log(`[UsageLogger] ✅ Initialized (Session: ${this.currentSessionId})`);
        }
        catch (error) {
            console.error('[UsageLogger] Failed to initialize:', error.message);
        }
    }
    /**
     * Log agent activation (task started)
     */
    async logAgentActivation(params) {
        const taskId = this.generateTaskId();
        const event = {
            timestamp: Date.now(),
            sessionId: this.currentSessionId,
            agentId: params.agentId,
            agentName: params.agentName,
            taskType: params.taskType,
            taskDescription: params.taskDescription,
            status: 'started',
            context: params.context,
        };
        // Store for duration tracking
        this.activeTasks.set(taskId, event);
        this.sessionEvents.push(event);
        // Write to log file
        await this.appendToLog(event);
        console.log(`[UsageLogger] 🤖 ${params.agentName} activated: ${params.taskDescription}`);
        return taskId;
    }
    /**
     * Log task completion
     */
    async logTaskCompletion(params) {
        const activeTask = this.activeTasks.get(params.taskId);
        if (!activeTask) {
            console.warn(`[UsageLogger] Task ${params.taskId} not found in active tasks`);
            return;
        }
        const now = Date.now();
        const duration = now - activeTask.timestamp;
        const timeSaved = this.calculateTimeSaved(activeTask.taskType, duration);
        const completedEvent = {
            ...activeTask,
            status: params.success ? 'completed' : 'failed',
            duration,
            outcome: {
                success: params.success,
                quality: params.quality ?? (params.success ? 80 : 0),
                timeSaved,
                error: params.error,
            },
            context: {
                ...activeTask.context,
                ...params.context,
            },
        };
        // Update session events
        const index = this.sessionEvents.findIndex(e => e.timestamp === activeTask.timestamp);
        if (index !== -1) {
            this.sessionEvents[index] = completedEvent;
        }
        // Remove from active tasks
        this.activeTasks.delete(params.taskId);
        // Write to log file
        await this.appendToLog(completedEvent);
        const emoji = params.success ? '✅' : '❌';
        const timeSavedMsg = timeSaved ? ` (saved ~${timeSaved} min)` : '';
        console.log(`[UsageLogger] ${emoji} ${activeTask.agentName} ${params.success ? 'completed' : 'failed'}: ${activeTask.taskDescription}${timeSavedMsg}`);
    }
    /**
     * Get current session metrics
     */
    getSessionMetrics() {
        const now = Date.now();
        const completed = this.sessionEvents.filter(e => e.status === 'completed');
        const failed = this.sessionEvents.filter(e => e.status === 'failed');
        // Calculate total time saved
        const totalTimeSaved = completed.reduce((sum, e) => sum + (e.outcome?.timeSaved ?? 0), 0);
        // Calculate average quality
        const qualityScores = completed.map(e => e.outcome?.quality ?? 0);
        const averageQuality = qualityScores.length > 0
            ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
            : 0;
        // Calculate impact score (0-10)
        const sessionDuration = (now - this.sessionStartTime) / (1000 * 60); // minutes
        const impactScore = this.calculateImpactScore({
            timeSaved: totalTimeSaved,
            sessionDuration,
            successRate: completed.length / (completed.length + failed.length || 1),
            activations: this.sessionEvents.length,
        });
        // Agent breakdown
        const agentBreakdown = {};
        const agentGroups = this.groupEventsByAgent(this.sessionEvents);
        for (const [agentId, events] of Object.entries(agentGroups)) {
            const completedEvents = events.filter(e => e.status === 'completed');
            const avgDuration = completedEvents.length > 0
                ? completedEvents.reduce((sum, e) => sum + (e.duration ?? 0), 0) / completedEvents.length
                : 0;
            const timeSaved = completedEvents.reduce((sum, e) => sum + (e.outcome?.timeSaved ?? 0), 0);
            agentBreakdown[agentId] = {
                activations: events.length,
                successRate: completedEvents.length / events.length,
                avgDuration,
                timeSaved,
            };
        }
        return {
            sessionId: this.currentSessionId,
            startTime: this.sessionStartTime,
            endTime: now,
            duration: now - this.sessionStartTime,
            agentActivations: this.sessionEvents.length,
            tasksCompleted: completed.length,
            tasksFailed: failed.length,
            totalTimeSaved,
            averageQuality,
            impactScore,
            agentBreakdown,
        };
    }
    /**
     * Calculate time saved compared to manual work
     */
    calculateTimeSaved(taskType, actualDuration) {
        const manualTime = MANUAL_TASK_TIMES[taskType] ?? MANUAL_TASK_TIMES.default;
        const actualMinutes = actualDuration / (1000 * 60);
        const saved = Math.max(0, manualTime - actualMinutes);
        return Math.round(saved);
    }
    /**
     * Calculate framework impact score (0-10)
     */
    calculateImpactScore(params) {
        // Efficiency component (0-5): % of session time saved
        const efficiencyScore = Math.min(5, (params.timeSaved / (params.sessionDuration || 1)) * 5);
        // Quality component (0-3): success rate
        const qualityScore = params.successRate * 3;
        // Usage component (0-2): agent activations (normalized)
        const usageScore = Math.min(2, (params.activations / 5) * 2);
        const totalScore = efficiencyScore + qualityScore + usageScore;
        return Math.round(totalScore * 10) / 10; // Round to 1 decimal
    }
    /**
     * Group events by agent
     */
    groupEventsByAgent(events) {
        return events.reduce((groups, event) => {
            if (!groups[event.agentId]) {
                groups[event.agentId] = [];
            }
            groups[event.agentId].push(event);
            return groups;
        }, {});
    }
    /**
     * Append event to log file (JSON lines format)
     */
    async appendToLog(event) {
        try {
            const logLine = JSON.stringify(event) + '\n';
            await fs.appendFile(this.usageLogPath, logLine, 'utf-8');
        }
        catch (error) {
            console.error('[UsageLogger] Failed to write to log:', error.message);
        }
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const random = Math.random().toString(36).substring(2, 8);
        return `${date}-${random}`;
    }
    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
    /**
     * Get log file path
     */
    getLogPath() {
        return this.usageLogPath;
    }
    /**
     * Get current session ID
     */
    getSessionId() {
        return this.currentSessionId;
    }
    /**
     * Read all events from log file
     */
    async readLogFile() {
        try {
            const content = await fs.readFile(this.usageLogPath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line);
            return lines.map(line => JSON.parse(line));
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return []; // File doesn't exist yet
            }
            throw error;
        }
    }
    /**
     * Get events for current session only
     */
    async getSessionEvents() {
        const allEvents = await this.readLogFile();
        return allEvents.filter(e => e.sessionId === this.currentSessionId);
    }
}
// Export singleton instance
let _usageLoggerInstance = null;
export function getUsageLogger() {
    if (!_usageLoggerInstance) {
        _usageLoggerInstance = new UsageLogger();
        _usageLoggerInstance.initialize().catch(console.error);
    }
    return _usageLoggerInstance;
}
//# sourceMappingURL=usage-logger.js.map