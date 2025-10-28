/**
 * VERSATIL OPERA v6.0 - Context Monitoring Background Task
 *
 * Real-time monitoring of context window usage and integrity.
 * Runs as an SDK Background Task with 5-second intervals (real-time).
 *
 * Prevents context loss through:
 * - Real-time token usage tracking
 * - Emergency compaction at 85% threshold
 * - Context integrity validation
 * - Cache efficiency monitoring
 *
 * Integrates with:
 * - ContextSentinel (the actual monitoring agent)
 * - VersatilOrchestratorAgent (main orchestrator)
 * - All OPERA agents (for context budget allocation)
 *
 * @module ContextMonitoringTask
 * @version 6.0.0
 */
import { EventEmitter } from 'events';
import { ContextSentinel } from '../agents/monitoring/context-sentinel.js';
export class ContextMonitoringTask extends EventEmitter {
    constructor(config) {
        super();
        this.taskInterval = null;
        this.startTime = 0;
        this.alertHistory = [];
        this.contextHistory = []; // Last 60 data points (5 minutes)
        // Initialize context sentinel
        this.sentinel = new ContextSentinel();
        // Default configuration
        this.config = {
            monitoringInterval: config?.monitoringInterval || 5000, // 5 seconds (real-time)
            enableEmergencyCompaction: config?.enableEmergencyCompaction ?? true,
            alertThresholds: {
                warningPercentage: config?.alertThresholds?.warningPercentage || 75,
                criticalPercentage: config?.alertThresholds?.criticalPercentage || 85,
                lowCacheEfficiency: config?.alertThresholds?.lowCacheEfficiency || 0.70,
                highWaste: config?.alertThresholds?.highWaste || 15
            },
            integrations: {
                userNotifications: config?.integrations?.userNotifications ?? true,
                statuslineUpdates: config?.integrations?.statuslineUpdates ?? true,
                ragLogging: config?.integrations?.ragLogging ?? true
            }
        };
        // Initialize status
        this.status = {
            running: false,
            lastCheck: 0,
            totalChecks: 0,
            emergencyCompactions: 0,
            tokensReclaimed: 0,
            currentDashboard: null,
            uptimeSeconds: 0,
            contextTrend: 'stable'
        };
        // Subscribe to sentinel events
        this.setupSentinelListeners();
    }
    /**
     * Setup event listeners for the sentinel
     */
    setupSentinelListeners() {
        this.sentinel.on('context-check', (dashboard) => {
            this.emit('dashboard-updated', dashboard);
        });
        this.sentinel.on('context-warning', (data) => {
            this.handleContextWarning(data);
        });
        this.sentinel.on('context-critical', (risks) => {
            this.handleContextCritical(risks);
        });
        this.sentinel.on('emergency-compaction', (result) => {
            this.status.emergencyCompactions++;
            this.status.tokensReclaimed += result.tokensReclaimed;
            this.handleEmergencyCompaction(result);
        });
        this.sentinel.on('integrity-violation', (integrityCheck) => {
            this.handleIntegrityViolation(integrityCheck);
        });
        this.sentinel.on('user-notification', (notification) => {
            if (this.config.integrations.userNotifications) {
                this.emit('user-notification', notification);
            }
        });
    }
    /**
     * Start the background monitoring task
     */
    async start() {
        if (this.taskInterval) {
            console.log('[ContextMonitoringTask] Already running');
            return;
        }
        console.log(`[ContextMonitoringTask] Starting real-time monitoring (${this.config.monitoringInterval}ms intervals)`);
        this.startTime = Date.now();
        this.status.running = true;
        // Start the ContextSentinel
        this.sentinel.startMonitoring();
        // Run our background task loop
        this.taskInterval = setInterval(async () => {
            await this.runMonitoringCycle();
        }, this.config.monitoringInterval);
        // Run first check immediately
        await this.runMonitoringCycle();
        // Emit start event
        this.emit('task-started', {
            interval: this.config.monitoringInterval,
            timestamp: Date.now()
        });
    }
    /**
     * Stop the background monitoring task
     */
    async stop() {
        if (!this.taskInterval) {
            console.log('[ContextMonitoringTask] Not running');
            return;
        }
        console.log('[ContextMonitoringTask] Stopping...');
        // Stop interval
        clearInterval(this.taskInterval);
        this.taskInterval = null;
        // Stop sentinel
        this.sentinel.stopMonitoring();
        // Update status
        this.status.running = false;
        // Emit stop event
        this.emit('task-stopped', {
            totalChecks: this.status.totalChecks,
            emergencyCompactions: this.status.emergencyCompactions,
            tokensReclaimed: this.status.tokensReclaimed,
            uptimeSeconds: this.status.uptimeSeconds,
            timestamp: Date.now()
        });
    }
    /**
     * Run a single monitoring cycle
     */
    async runMonitoringCycle() {
        try {
            // Update uptime
            if (this.startTime > 0) {
                this.status.uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            }
            // Run context check (sentinel handles emergency compaction internally)
            const dashboard = await this.sentinel.getCurrentContext();
            // Update status
            this.status.lastCheck = Date.now();
            this.status.totalChecks++;
            this.status.currentDashboard = dashboard;
            // Track context history for trend analysis
            this.contextHistory.push(dashboard.usage.percentage);
            if (this.contextHistory.length > 60) { // Keep last 5 minutes (60 * 5s)
                this.contextHistory.shift();
            }
            // Update trend
            this.status.contextTrend = this.calculateContextTrend();
            // Analyze dashboard and take actions
            await this.analyzeDashboard(dashboard);
            // Integration: Update statusline
            if (this.config.integrations.statuslineUpdates) {
                this.updateStatusline(dashboard);
            }
            // Integration: Log to RAG for pattern learning
            if (this.config.integrations.ragLogging) {
                await this.logToRAG(dashboard);
            }
        }
        catch (error) {
            console.error('[ContextMonitoringTask] Monitoring cycle failed:', error);
            this.emit('monitoring-error', { error, timestamp: Date.now() });
        }
    }
    /**
     * Analyze dashboard and trigger alerts/actions
     */
    async analyzeDashboard(dashboard) {
        const { usage, risks } = dashboard;
        // Check usage thresholds
        if (usage.percentage >= this.config.alertThresholds.criticalPercentage) {
            // Critical threshold - emergency compaction should have triggered
            await this.sendAlert({
                severity: 'critical',
                title: '🚨 Context Window Critical',
                message: `Context at ${Math.round(usage.percentage)}% - Emergency compaction ${this.config.enableEmergencyCompaction ? 'active' : 'DISABLED'}`,
                timestamp: Date.now(),
                contextUsage: usage.percentage,
                risks: risks.filter(r => r.severity === 'critical')
            });
        }
        else if (usage.percentage >= this.config.alertThresholds.warningPercentage) {
            // Warning threshold
            await this.sendAlert({
                severity: 'warning',
                title: '⚠️ High Context Usage',
                message: `Context at ${Math.round(usage.percentage)}% (${usage.totalTokens.toLocaleString()} / ${usage.maxTokens.toLocaleString()} tokens)`,
                timestamp: Date.now(),
                contextUsage: usage.percentage
            });
        }
        // Check cache efficiency
        if (usage.cacheHitRate < this.config.alertThresholds.lowCacheEfficiency) {
            await this.sendAlert({
                severity: 'warning',
                title: '💡 Low Cache Efficiency',
                message: `Cache hit rate ${Math.round(usage.cacheHitRate * 100)}% (target: >${Math.round(this.config.alertThresholds.lowCacheEfficiency * 100)}%)`,
                timestamp: Date.now(),
                contextUsage: usage.percentage
            });
        }
        // Check waste percentage
        if (usage.wastePercentage > this.config.alertThresholds.highWaste) {
            await this.sendAlert({
                severity: 'info',
                title: '📊 High Context Waste',
                message: `${Math.round(usage.wastePercentage)}% of context is stale - consider observation masking`,
                timestamp: Date.now(),
                contextUsage: usage.percentage
            });
        }
        // Check for flywheel imbalance
        const imbalanceRisks = risks.filter(r => r.type === 'flywheel_imbalance');
        if (imbalanceRisks.length > 0) {
            await this.sendAlert({
                severity: 'warning',
                title: '⚖️ Flywheel Context Imbalance',
                message: imbalanceRisks.map(r => r.description).join(', '),
                timestamp: Date.now(),
                contextUsage: usage.percentage,
                risks: imbalanceRisks
            });
        }
    }
    /**
     * Calculate context trend (increasing/stable/decreasing)
     */
    calculateContextTrend() {
        if (this.contextHistory.length < 10) {
            return 'stable';
        }
        const recent = this.contextHistory.slice(-10);
        const oldest = recent[0];
        const newest = recent[recent.length - 1];
        const change = newest - oldest;
        if (change > 5)
            return 'increasing';
        if (change < -5)
            return 'decreasing';
        return 'stable';
    }
    /**
     * Handle context warning event
     */
    handleContextWarning(data) {
        console.log(`[ContextMonitoringTask] Context warning: ${Math.round(data.usage)}%`);
        // Warnings are handled by analyzeDashboard
    }
    /**
     * Handle context critical event
     */
    handleContextCritical(risks) {
        console.error(`[ContextMonitoringTask] Context CRITICAL: ${risks.length} critical risk(s)`);
        // Critical alerts are handled by analyzeDashboard
    }
    /**
     * Handle emergency compaction event
     */
    handleEmergencyCompaction(result) {
        console.warn(`[ContextMonitoringTask] Emergency compaction: ${result.tokensReclaimed.toLocaleString()} tokens reclaimed`);
        this.sendAlert({
            severity: 'critical',
            title: '🚨 Emergency Context Compaction',
            message: `Reclaimed ${result.tokensReclaimed.toLocaleString()} tokens (${Math.round(result.newPercentage)}% usage)`,
            timestamp: Date.now(),
            contextUsage: result.newPercentage,
            compactionResult: result
        });
    }
    /**
     * Handle integrity violation event
     */
    handleIntegrityViolation(integrityCheck) {
        console.error(`[ContextMonitoringTask] INTEGRITY VIOLATION: Lost ${integrityCheck.lostInformation.join(', ')}`);
        this.sendAlert({
            severity: 'critical',
            title: '💥 Context Integrity Violation',
            message: `Critical information lost: ${integrityCheck.lostInformation.join(', ')}`,
            timestamp: Date.now(),
            contextUsage: this.status.currentDashboard?.usage.percentage || 0
        });
    }
    /**
     * Send alert to user
     */
    async sendAlert(alert) {
        // Store in history
        this.alertHistory.push(alert);
        // Keep only last 100 alerts
        if (this.alertHistory.length > 100) {
            this.alertHistory.shift();
        }
        // Emit alert event
        this.emit('alert', alert);
        // User notification if enabled
        if (this.config.integrations.userNotifications) {
            this.emit('user-notification', {
                level: alert.severity === 'critical' ? 'error' : alert.severity,
                title: alert.title,
                message: alert.message,
                timestamp: alert.timestamp
            });
        }
        console.log(`[ContextMonitoringTask] Alert: ${alert.title}`);
    }
    /**
     * Update statusline with current context usage
     */
    updateStatusline(dashboard) {
        const { usage } = dashboard;
        // Determine status indicator
        let indicator = '✅';
        if (usage.percentage >= 85)
            indicator = '🚨';
        else if (usage.percentage >= 75)
            indicator = '⚠️';
        else if (usage.percentage >= 60)
            indicator = '📊';
        // Format statusline message
        const statusMessage = `${indicator} Context: ${Math.round(usage.percentage)}% | Cache: ${Math.round(usage.cacheHitRate * 100)}% | Trend: ${this.getTrendEmoji()}`;
        this.emit('statusline-update', {
            section: 'context',
            message: statusMessage,
            percentage: usage.percentage,
            timestamp: Date.now()
        });
    }
    /**
     * Get emoji for context trend
     */
    getTrendEmoji() {
        switch (this.status.contextTrend) {
            case 'increasing': return '📈';
            case 'decreasing': return '📉';
            default: return '➡️';
        }
    }
    /**
     * Log monitoring data to RAG for pattern learning
     */
    async logToRAG(dashboard) {
        // Integration point with RAGEnabledAgent
        // Store patterns about:
        // - Context growth patterns
        // - Cache efficiency patterns
        // - Which flywheels consume most context
        // - Successful compaction strategies
        const ragEntry = {
            type: 'context_monitoring_log',
            timestamp: dashboard.timestamp,
            usage: {
                percentage: dashboard.usage.percentage,
                totalTokens: dashboard.usage.totalTokens,
                cacheHitRate: dashboard.usage.cacheHitRate,
                wastePercentage: dashboard.usage.wastePercentage
            },
            risks: dashboard.risks.map(r => ({
                severity: r.severity,
                type: r.type,
                autoRecoverable: r.autoRecoverable
            })),
            integrityPassed: dashboard.integrityStatus.passed,
            trend: this.status.contextTrend,
            flywheelBreakdown: dashboard.usage.perFlywheel
        };
        this.emit('rag-log', ragEntry);
    }
    /**
     * Get current task status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Get recent alerts
     */
    getRecentAlerts(limit = 10) {
        return this.alertHistory.slice(-limit);
    }
    /**
     * Get current dashboard
     */
    getCurrentDashboard() {
        return this.status.currentDashboard;
    }
    /**
     * Get context usage trend (last 5 minutes)
     */
    getUsageTrend() {
        const sentinelTrend = this.sentinel.getUsageTrend();
        return {
            trend: this.status.contextTrend,
            rate: sentinelTrend.rate
        };
    }
    /**
     * Manual trigger of context check (outside normal schedule)
     */
    async triggerManualCheck() {
        console.log('[ContextMonitoringTask] Manual context check triggered');
        const dashboard = await this.sentinel.getCurrentContext();
        this.status.currentDashboard = dashboard;
        return dashboard;
    }
    /**
     * Manual trigger of emergency compaction
     */
    async triggerManualCompaction() {
        console.log('[ContextMonitoringTask] Manual compaction triggered');
        const dashboard = this.status.currentDashboard;
        if (!dashboard) {
            console.error('[ContextMonitoringTask] No dashboard available for compaction');
            return null;
        }
        // Trigger emergency compaction via sentinel
        // (This would need to be exposed as a public method in ContextSentinel)
        this.emit('manual-compaction-requested', { timestamp: Date.now() });
        return null; // Would return CompactionResult in full implementation
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = {
            ...this.config,
            ...updates,
            alertThresholds: {
                ...this.config.alertThresholds,
                ...updates.alertThresholds
            },
            integrations: {
                ...this.config.integrations,
                ...updates.integrations
            }
        };
        console.log('[ContextMonitoringTask] Configuration updated');
        this.emit('config-updated', this.config);
    }
    /**
     * Cleanup
     */
    async destroy() {
        await this.stop();
        this.sentinel.destroy();
        this.removeAllListeners();
    }
}
//# sourceMappingURL=context-monitoring-task.js.map