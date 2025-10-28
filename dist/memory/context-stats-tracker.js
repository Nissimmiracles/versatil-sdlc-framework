/**
 * Context Statistics Tracker
 *
 * Tracks token usage, context clearing events, and memory operations
 * to provide insights into context management effectiveness.
 *
 * Part of Phase 2: Context Editing Enhancement
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
export class ContextStatsTracker {
    constructor(baseDir = path.join(os.homedir(), '.versatil', 'stats')) {
        this.currentSession = null;
        this.clearEvents = [];
        this.memoryOps = [];
        this.startTime = new Date();
        this.preClearHooks = [];
        this.statsDir = baseDir;
    }
    /**
     * Initialize statistics directory and load existing stats
     */
    async initialize() {
        await fs.mkdir(this.statsDir, { recursive: true });
        // Load existing events from disk
        try {
            const clearEventsPath = path.join(this.statsDir, 'clear-events.json');
            const memoryOpsPath = path.join(this.statsDir, 'memory-ops.json');
            if (await this.fileExists(clearEventsPath)) {
                const data = await fs.readFile(clearEventsPath, 'utf-8');
                this.clearEvents = JSON.parse(data, this.dateReviver);
            }
            if (await this.fileExists(memoryOpsPath)) {
                const data = await fs.readFile(memoryOpsPath, 'utf-8');
                this.memoryOps = JSON.parse(data, this.dateReviver);
            }
        }
        catch (error) {
            console.warn('Failed to load existing stats:', error);
        }
    }
    /**
     * Start a new session for tracking
     */
    startSession(agentId) {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        this.currentSession = {
            sessionId,
            startTime: new Date(),
            totalInputTokens: 0,
            totalOutputTokens: 0,
            clearEvents: 0,
            tokensSaved: 0,
            memoryOperations: 0,
            agentId,
            peakTokens: 0
        };
        return sessionId;
    }
    /**
     * End the current session
     */
    async endSession() {
        if (!this.currentSession) {
            return null;
        }
        this.currentSession.endTime = new Date();
        // Save session to disk
        const sessionsPath = path.join(this.statsDir, 'sessions.jsonl');
        await fs.appendFile(sessionsPath, JSON.stringify(this.currentSession) + '\n', 'utf-8');
        const completedSession = this.currentSession;
        this.currentSession = null;
        return completedSession;
    }
    /**
     * Track a context clear event
     * Executes pre-clear hooks before recording the event
     */
    async trackClearEvent(event) {
        // Execute pre-clear hooks to preserve patterns
        let patternsPreserved = 0;
        let preClearHookExecuted = false;
        if (this.preClearHooks.length > 0) {
            try {
                preClearHookExecuted = true;
                const results = await Promise.all(this.preClearHooks.map(hook => hook(event.inputTokens, event.agentId)));
                patternsPreserved = results.reduce((sum, count) => sum + count, 0);
            }
            catch (error) {
                console.warn('Pre-clear hook execution failed:', error);
            }
        }
        const clearEvent = {
            ...event,
            timestamp: new Date(),
            patternsPreserved,
            preClearHookExecuted
        };
        this.clearEvents.push(clearEvent);
        // Update current session
        if (this.currentSession) {
            this.currentSession.clearEvents++;
            this.currentSession.tokensSaved += event.tokensSaved;
        }
        // Persist to disk (keep last 1000 events)
        if (this.clearEvents.length > 1000) {
            this.clearEvents = this.clearEvents.slice(-1000);
        }
        await this.persistClearEvents();
    }
    /**
     * Track a context clear event (with optional pre-clear hook execution)
     */
    async trackContextClear(event) {
        // Execute pre-clear hooks to preserve patterns
        let patternsPreserved = 0;
        let preClearHookExecuted = false;
        if (this.preClearHooks.length > 0) {
            try {
                preClearHookExecuted = true;
                const results = await Promise.all(this.preClearHooks.map(hook => hook(event.inputTokens, event.agentId)));
                patternsPreserved = results.reduce((sum, count) => sum + count, 0);
            }
            catch (error) {
                console.warn('Pre-clear hook execution failed:', error);
            }
        }
        const clearEvent = {
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            inputTokens: event.inputTokens,
            toolUsesCleared: event.toolUsesCleared,
            tokensSaved: event.tokensSaved,
            triggerType: event.reason === 'auto' ? 'input_tokens' : 'manual',
            triggerValue: event.inputTokens,
            agentId: event.agentId,
            patternsPreserved,
            preClearHookExecuted
        };
        this.clearEvents.push(clearEvent);
        // Update current session
        if (this.currentSession) {
            this.currentSession.clearEvents++;
            this.currentSession.tokensSaved += event.tokensSaved;
        }
        // Persist to disk (keep last 1000 events)
        if (this.clearEvents.length > 1000) {
            this.clearEvents = this.clearEvents.slice(-1000);
        }
        await this.persistClearEvents();
    }
    /**
     * Track a memory operation
     */
    async trackMemoryOperation(op) {
        const memoryOp = {
            ...op,
            timestamp: new Date()
        };
        this.memoryOps.push(memoryOp);
        // Update current session
        if (this.currentSession) {
            this.currentSession.memoryOperations++;
        }
        // Persist to disk (keep last 5000 operations)
        if (this.memoryOps.length > 5000) {
            this.memoryOps = this.memoryOps.slice(-5000);
        }
        await this.persistMemoryOps();
    }
    /**
     * Update token usage for current session
     */
    updateTokenUsage(inputTokens, outputTokens) {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.totalInputTokens += inputTokens;
        this.currentSession.totalOutputTokens += outputTokens;
        this.currentSession.peakTokens = Math.max(this.currentSession.peakTokens, inputTokens);
    }
    /**
     * Get current statistics
     */
    getStatistics() {
        const totalTokensProcessed = this.clearEvents.reduce((sum, event) => sum + event.inputTokens, 0);
        const totalTokensSaved = this.clearEvents.reduce((sum, event) => sum + event.tokensSaved, 0);
        const memoryOperationsByType = {};
        this.memoryOps.forEach(op => {
            memoryOperationsByType[op.operation] = (memoryOperationsByType[op.operation] || 0) + 1;
        });
        const clearEventsByAgent = {};
        this.clearEvents.forEach(event => {
            if (event.agentId) {
                clearEventsByAgent[event.agentId] = (clearEventsByAgent[event.agentId] || 0) + 1;
            }
        });
        const uptime = (Date.now() - this.startTime.getTime()) / 1000;
        return {
            totalTokensProcessed,
            totalClearEvents: this.clearEvents.length,
            totalTokensSaved,
            totalMemoryOperations: this.memoryOps.length,
            avgTokensPerClear: this.clearEvents.length > 0
                ? totalTokensSaved / this.clearEvents.length
                : 0,
            memoryOperationsByType,
            clearEventsByAgent,
            lastClearEvent: this.clearEvents[this.clearEvents.length - 1],
            uptime
        };
    }
    /**
     * Get session metrics (current or specific session ID)
     */
    async getSessionMetrics(sessionId) {
        if (!sessionId && this.currentSession) {
            return this.currentSession;
        }
        if (!sessionId) {
            return null;
        }
        // Load from disk
        const sessionsPath = path.join(this.statsDir, 'sessions.jsonl');
        if (!await this.fileExists(sessionsPath)) {
            return null;
        }
        const data = await fs.readFile(sessionsPath, 'utf-8');
        const sessions = data
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line, this.dateReviver));
        return sessions.find(s => s.sessionId === sessionId) || null;
    }
    /**
     * Get clear events within time range
     */
    getClearEvents(since, until) {
        return this.clearEvents.filter(event => {
            if (since && event.timestamp < since)
                return false;
            if (until && event.timestamp > until)
                return false;
            return true;
        });
    }
    /**
     * Get memory operations within time range
     */
    getMemoryOperations(since, until) {
        return this.memoryOps.filter(op => {
            if (since && op.timestamp < since)
                return false;
            if (until && op.timestamp > until)
                return false;
            return true;
        });
    }
    /**
     * Generate a report for a time period
     */
    async generateReport(since, until) {
        const stats = this.getStatistics();
        const clearEvents = this.getClearEvents(since, until);
        const memoryOps = this.getMemoryOperations(since, until);
        const report = `
# Context Management Report

**Generated**: ${new Date().toISOString()}
**Period**: ${since ? since.toISOString() : 'All time'} to ${until ? until.toISOString() : 'Now'}

## Summary Statistics

- **Total Tokens Processed**: ${stats.totalTokensProcessed.toLocaleString()}
- **Total Clear Events**: ${stats.totalClearEvents}
- **Total Tokens Saved**: ${stats.totalTokensSaved.toLocaleString()}
- **Avg Tokens Saved per Clear**: ${Math.round(stats.avgTokensPerClear).toLocaleString()}
- **Total Memory Operations**: ${stats.totalMemoryOperations}

## Clear Events by Agent

${Object.entries(stats.clearEventsByAgent)
            .map(([agent, count]) => `- **${agent}**: ${count} clears`)
            .join('\n')}

## Memory Operations by Type

${Object.entries(stats.memoryOperationsByType)
            .map(([type, count]) => `- **${type}**: ${count} operations`)
            .join('\n')}

## Recent Clear Events (Last 5)

${clearEvents
            .slice(-5)
            .reverse()
            .map(event => `
### ${event.timestamp.toISOString()} ${event.agentId ? `(${event.agentId})` : ''}
- Input Tokens: ${event.inputTokens.toLocaleString()}
- Tool Uses Cleared: ${event.toolUsesCleared}
- Tokens Saved: ${event.tokensSaved.toLocaleString()}
- Trigger: ${event.triggerType} (${event.triggerValue.toLocaleString()})
`).join('\n')}

## Efficiency Metrics

- **Token Savings Rate**: ${stats.totalTokensProcessed > 0
            ? ((stats.totalTokensSaved / stats.totalTokensProcessed) * 100).toFixed(2)
            : 0}%
- **Memory Ops per Clear**: ${stats.totalClearEvents > 0
            ? (stats.totalMemoryOperations / stats.totalClearEvents).toFixed(2)
            : 0}
- **Uptime**: ${Math.round(stats.uptime)} seconds (${(stats.uptime / 3600).toFixed(2)} hours)

---
*Generated by VERSATIL Context Stats Tracker*
`;
        return report.trim();
    }
    /**
     * Clear old statistics (keep last N days)
     */
    async cleanup(daysToKeep = 30) {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        this.clearEvents = this.clearEvents.filter(event => event.timestamp >= cutoffDate);
        this.memoryOps = this.memoryOps.filter(op => op.timestamp >= cutoffDate);
        await Promise.all([
            this.persistClearEvents(),
            this.persistMemoryOps()
        ]);
    }
    // Private helper methods
    async persistClearEvents() {
        const filePath = path.join(this.statsDir, 'clear-events.json');
        await fs.writeFile(filePath, JSON.stringify(this.clearEvents, null, 2), 'utf-8');
    }
    async persistMemoryOps() {
        const filePath = path.join(this.statsDir, 'memory-ops.json');
        await fs.writeFile(filePath, JSON.stringify(this.memoryOps, null, 2), 'utf-8');
    }
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    dateReviver(key, value) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return new Date(value);
        }
        return value;
    }
    /**
     * Register a pre-clear hook
     * Hooks are called before context clearing to extract and preserve patterns
     *
     * @param hook - Function that preserves patterns before clear
     * @returns ID of the registered hook for later removal
     */
    registerPreClearHook(hook) {
        this.preClearHooks.push(hook);
        return this.preClearHooks.length - 1;
    }
    /**
     * Unregister a pre-clear hook by ID
     *
     * @param hookId - ID returned from registerPreClearHook
     */
    unregisterPreClearHook(hookId) {
        if (hookId >= 0 && hookId < this.preClearHooks.length) {
            this.preClearHooks.splice(hookId, 1);
        }
    }
    /**
     * Clear all pre-clear hooks
     */
    clearPreClearHooks() {
        this.preClearHooks = [];
    }
    /**
     * Get number of registered pre-clear hooks
     */
    getPreClearHookCount() {
        return this.preClearHooks.length;
    }
}
/**
 * Global singleton instance
 */
let globalTracker = null;
export function getGlobalContextTracker() {
    if (!globalTracker) {
        globalTracker = new ContextStatsTracker();
        globalTracker.initialize().catch(console.error);
    }
    return globalTracker;
}
//# sourceMappingURL=context-stats-tracker.js.map