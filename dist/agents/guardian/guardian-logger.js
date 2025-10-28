/**
 * Guardian Logging System
 *
 * Comprehensive logging for Iris-Guardian with:
 * - File-based persistence (~/.versatil/logs/guardian/)
 * - Structured JSON logs for analysis
 * - Log rotation (daily, max 30 days)
 * - Real-time streaming for monitoring
 * - Activity timeline tracking
 *
 * Log Files:
 * - guardian.log: Main activity log
 * - health-checks.log: Health check results
 * - auto-remediation.log: Auto-fix attempts and results
 * - rag-operations.log: RAG/GraphRAG health monitoring
 * - agent-coordination.log: Agent activation tracking
 * - version-management.log: Release and version activities (FRAMEWORK_CONTEXT only)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VERSATILLogger } from '../../utils/logger.js';
/**
 * Guardian logger with file persistence (Singleton)
 */
export class GuardianLogger {
    constructor(context = 'PROJECT_CONTEXT') {
        this.activityTimeline = [];
        this.baseLogger = new VERSATILLogger('Iris-Guardian');
        this.context = context;
        // Logs directory: ~/.versatil/logs/guardian/
        this.logsDir = path.join(os.homedir(), '.versatil', 'logs', 'guardian');
        this.initializeLogDirectory();
        this.openLogStreams();
        this.logSystemStart();
    }
    /**
     * Get singleton instance
     */
    static getInstance(context) {
        if (!GuardianLogger.instance) {
            GuardianLogger.instance = new GuardianLogger(context || 'PROJECT_CONTEXT');
        }
        return GuardianLogger.instance;
    }
    /**
     * Initialize log directory structure
     */
    initializeLogDirectory() {
        try {
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }
            // Create subdirectories for organized logs
            const subdirs = ['health', 'remediation', 'rag', 'agents', 'version', 'archive'];
            for (const subdir of subdirs) {
                const dirPath = path.join(this.logsDir, subdir);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            }
            // Rotate old logs (keep last 30 days)
            this.rotateOldLogs();
        }
        catch (error) {
            this.baseLogger.error('Failed to initialize log directory', { error: error.message });
        }
    }
    /**
     * Open log file streams
     */
    openLogStreams() {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        try {
            // Main activity log
            this.mainLogStream = fs.createWriteStream(path.join(this.logsDir, `guardian-${date}.log`), { flags: 'a' } // Append mode
            );
            // Category-specific logs
            this.healthLogStream = fs.createWriteStream(path.join(this.logsDir, 'health', `health-checks-${date}.log`), { flags: 'a' });
            this.remediationLogStream = fs.createWriteStream(path.join(this.logsDir, 'remediation', `auto-remediation-${date}.log`), { flags: 'a' });
            this.ragLogStream = fs.createWriteStream(path.join(this.logsDir, 'rag', `rag-operations-${date}.log`), { flags: 'a' });
            this.agentLogStream = fs.createWriteStream(path.join(this.logsDir, 'agents', `agent-coordination-${date}.log`), { flags: 'a' });
            if (this.context === 'FRAMEWORK_CONTEXT') {
                this.versionLogStream = fs.createWriteStream(path.join(this.logsDir, 'version', `version-management-${date}.log`), { flags: 'a' });
            }
        }
        catch (error) {
            this.baseLogger.error('Failed to open log streams', { error: error.message });
        }
    }
    /**
     * Log system start
     */
    logSystemStart() {
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            category: 'system',
            context: this.context,
            message: `Guardian logger initialized in ${this.context}`,
            data: {
                logs_directory: this.logsDir,
                pid: process.pid,
                node_version: process.version,
                platform: process.platform,
            },
        };
        this.writeLog(entry);
        // Add to activity timeline
        this.addActivity({
            timestamp: entry.timestamp,
            type: 'health_check',
            status: 'success',
            description: 'Guardian system started',
            details: entry.data,
        });
    }
    /**
     * Write log entry to appropriate streams
     */
    writeLog(entry) {
        const logLine = JSON.stringify(entry) + '\n';
        // Always write to main log
        if (this.mainLogStream) {
            this.mainLogStream.write(logLine);
        }
        // Write to category-specific log
        let categoryStream;
        switch (entry.category) {
            case 'health':
                categoryStream = this.healthLogStream;
                break;
            case 'remediation':
                categoryStream = this.remediationLogStream;
                break;
            case 'rag':
                categoryStream = this.ragLogStream;
                break;
            case 'agent':
                categoryStream = this.agentLogStream;
                break;
            case 'version':
                categoryStream = this.versionLogStream;
                break;
        }
        if (categoryStream) {
            categoryStream.write(logLine);
        }
        // Also log to console via base logger
        const message = `[${entry.category}] ${entry.message}`;
        switch (entry.level) {
            case 'info':
                this.baseLogger.info(message, entry.data);
                break;
            case 'warn':
                this.baseLogger.warn(message, entry.data);
                break;
            case 'error':
                this.baseLogger.error(message, entry.data);
                break;
            case 'debug':
                this.baseLogger.debug(message, entry.data);
                break;
        }
    }
    /**
     * Log health check
     */
    logHealthCheck(result) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: result.overall_health < 70 ? 'error' : result.overall_health < 80 ? 'warn' : 'info',
            category: 'health',
            context: this.context,
            message: `Health check completed: ${result.overall_health}% (${result.status})`,
            data: {
                overall_health: result.overall_health,
                status: result.status,
                components: result.components,
                issues_count: result.issues.length,
                issues: result.issues,
            },
            duration_ms: result.duration_ms,
        };
        this.writeLog(entry);
        this.addActivity({
            timestamp: entry.timestamp,
            type: 'health_check',
            status: result.overall_health >= 80 ? 'success' : result.overall_health >= 70 ? 'warning' : 'error',
            description: `Health: ${result.overall_health}% (${result.issues.length} issues)`,
            details: { health: result.overall_health, status: result.status },
        });
    }
    /**
     * Log auto-remediation attempt
     */
    logRemediation(remediation) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: remediation.success ? 'info' : 'error',
            category: 'remediation',
            context: this.context,
            message: `Auto-remediation ${remediation.success ? 'SUCCESS' : 'FAILED'}: ${remediation.issue}`,
            data: {
                issue: remediation.issue,
                action: remediation.action_taken,
                success: remediation.success,
                confidence: remediation.confidence,
                before: remediation.before_state,
                after: remediation.after_state,
                learned: remediation.learned,
            },
            duration_ms: remediation.duration_ms,
        };
        this.writeLog(entry);
        this.addActivity({
            timestamp: entry.timestamp,
            type: 'auto_fix',
            status: remediation.success ? 'success' : 'error',
            description: `${remediation.success ? 'Fixed' : 'Failed to fix'}: ${remediation.issue}`,
            details: { action: remediation.action_taken, confidence: remediation.confidence },
        });
    }
    /**
     * Log RAG operation
     */
    logRAGOperation(operation) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: operation.success ? 'info' : 'warn',
            category: 'rag',
            context: this.context,
            message: `RAG ${operation.type} on ${operation.store}: ${operation.success ? 'SUCCESS' : 'FAILED'} (${operation.latency_ms}ms)`,
            data: {
                operation: operation.type,
                store: operation.store,
                success: operation.success,
                latency_ms: operation.latency_ms,
                ...operation.details,
            },
            duration_ms: operation.latency_ms,
        };
        this.writeLog(entry);
        if (!operation.success || operation.latency_ms > 500) {
            this.addActivity({
                timestamp: entry.timestamp,
                type: 'rag_query',
                status: operation.success ? 'warning' : 'error',
                description: `RAG ${operation.type} ${operation.success ? 'slow' : 'failed'}: ${operation.latency_ms}ms`,
                details: { store: operation.store, latency: operation.latency_ms },
            });
        }
    }
    /**
     * Log agent coordination
     */
    logAgentActivity(agent) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: agent.success ? 'info' : 'error',
            category: 'agent',
            context: this.context,
            message: `Agent ${agent.name} ${agent.action}: ${agent.success ? 'SUCCESS' : 'FAILED'}`,
            data: {
                agent: agent.name,
                action: agent.action,
                success: agent.success,
                ...agent.details,
            },
            duration_ms: agent.duration_ms,
        };
        this.writeLog(entry);
        if (!agent.success) {
            this.addActivity({
                timestamp: entry.timestamp,
                type: 'agent_activation',
                status: 'error',
                description: `Agent ${agent.name} ${agent.action} failed`,
                details: agent.details,
            });
        }
    }
    /**
     * Log agent activation (alias for logAgentActivity for backward compatibility)
     */
    logAgentActivation(activation) {
        this.logAgentActivity({
            name: activation.agent,
            action: activation.success ? 'completed' : 'failed',
            success: activation.success,
            duration_ms: activation.duration_ms,
            details: {
                triggered_by: activation.triggered_by,
                context: activation.context
            }
        });
    }
    /**
     * Log version management activity (FRAMEWORK_CONTEXT only)
     */
    logVersionActivity(version) {
        if (this.context !== 'FRAMEWORK_CONTEXT') {
            this.baseLogger.warn('Version activity logged in PROJECT_CONTEXT (should only be FRAMEWORK_CONTEXT)');
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            category: 'version',
            context: this.context,
            message: `Version ${version.type}: ${version.from_version || ''} → ${version.to_version || ''}`,
            data: {
                type: version.type,
                from: version.from_version,
                to: version.to_version,
                ...version.details,
            },
        };
        this.writeLog(entry);
        this.addActivity({
            timestamp: entry.timestamp,
            type: version.type === 'release_created' ? 'release' : 'version_bump',
            status: 'success',
            description: `${version.type}: ${version.to_version || 'N/A'}`,
            details: version.details,
        });
    }
    /**
     * Log version management (alias for logVersionActivity for backward compatibility)
     */
    logVersionManagement(version) {
        this.logVersionActivity({
            type: version.action === 'version_bump' ? 'bump_recommended' : 'release_created',
            from_version: version.old_version,
            to_version: version.new_version,
            details: {
                bump_type: version.bump_type,
                features: version.features_count,
                fixes: version.fixes_count,
                breaking_changes: version.breaking_changes_count,
                success: version.success
            }
        });
    }
    /**
     * Add activity to timeline
     */
    addActivity(activity) {
        this.activityTimeline.push(activity);
        // Keep last 1000 activities in memory
        if (this.activityTimeline.length > 1000) {
            this.activityTimeline.shift();
        }
        // Also write to activity timeline file
        this.writeActivityTimeline(activity);
    }
    /**
     * Write activity to timeline file
     */
    writeActivityTimeline(activity) {
        try {
            const timelinePath = path.join(this.logsDir, 'activity-timeline.jsonl');
            const activityLine = JSON.stringify(activity) + '\n';
            fs.appendFileSync(timelinePath, activityLine);
        }
        catch (error) {
            // Silent fail - timeline is nice-to-have
        }
    }
    /**
     * Get recent activities
     */
    getRecentActivities(limit = 50) {
        return this.activityTimeline.slice(-limit);
    }
    /**
     * Get activity timeline (from file for full history)
     */
    getActivityTimeline(limit = 100) {
        try {
            const timelinePath = path.join(this.logsDir, 'activity-timeline.jsonl');
            if (!fs.existsSync(timelinePath)) {
                return [];
            }
            const content = fs.readFileSync(timelinePath, 'utf-8');
            const lines = content.trim().split('\n');
            const activities = lines
                .slice(-limit)
                .map(line => JSON.parse(line));
            return activities;
        }
        catch (error) {
            this.baseLogger.error('Failed to read activity timeline', { error: error.message });
            return [];
        }
    }
    /**
     * Rotate old logs (keep last 30 days)
     */
    rotateOldLogs() {
        try {
            const archiveDir = path.join(this.logsDir, 'archive');
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            // Check all log files
            const allFiles = this.getAllLogFiles();
            for (const file of allFiles) {
                const stats = fs.statSync(file);
                if (stats.mtimeMs < thirtyDaysAgo) {
                    // Archive old file
                    const filename = path.basename(file);
                    const archivePath = path.join(archiveDir, filename);
                    fs.renameSync(file, archivePath);
                }
            }
        }
        catch (error) {
            this.baseLogger.warn('Log rotation failed', { error: error.message });
        }
    }
    /**
     * Get all log files
     */
    getAllLogFiles() {
        const files = [];
        try {
            const dirs = [
                this.logsDir,
                path.join(this.logsDir, 'health'),
                path.join(this.logsDir, 'remediation'),
                path.join(this.logsDir, 'rag'),
                path.join(this.logsDir, 'agents'),
                path.join(this.logsDir, 'version'),
            ];
            for (const dir of dirs) {
                if (fs.existsSync(dir)) {
                    const dirFiles = fs.readdirSync(dir)
                        .filter(f => f.endsWith('.log'))
                        .map(f => path.join(dir, f));
                    files.push(...dirFiles);
                }
            }
        }
        catch (error) {
            // Silent fail
        }
        return files;
    }
    /**
     * Get log file paths
     */
    getLogPaths() {
        const date = new Date().toISOString().split('T')[0];
        return {
            main: path.join(this.logsDir, `guardian-${date}.log`),
            health: path.join(this.logsDir, 'health', `health-checks-${date}.log`),
            remediation: path.join(this.logsDir, 'remediation', `auto-remediation-${date}.log`),
            rag: path.join(this.logsDir, 'rag', `rag-operations-${date}.log`),
            agents: path.join(this.logsDir, 'agents', `agent-coordination-${date}.log`),
            version: this.context === 'FRAMEWORK_CONTEXT'
                ? path.join(this.logsDir, 'version', `version-management-${date}.log`)
                : undefined,
            timeline: path.join(this.logsDir, 'activity-timeline.jsonl'),
        };
    }
    /**
     * Close log streams (call on shutdown)
     */
    close() {
        const streams = [
            this.mainLogStream,
            this.healthLogStream,
            this.remediationLogStream,
            this.ragLogStream,
            this.agentLogStream,
            this.versionLogStream,
        ];
        for (const stream of streams) {
            if (stream) {
                stream.end();
            }
        }
        this.baseLogger.info('Guardian logger closed');
    }
}
GuardianLogger.instance = null;
//# sourceMappingURL=guardian-logger.js.map