/**
 * VERSATIL SDLC Framework - Production Monitoring & Performance Optimization
 * Real-time monitoring for Supabase + Edge Functions RAG deployment
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
export class ProductionMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.edgeMetrics = new Map();
        this.ragMetrics = [];
        this.alerts = [];
        this.isMonitoringEnabled = false;
        // Performance thresholds
        this.thresholds = {
            ragResponseTime: 2000, // 2 seconds
            edgeLatency: 1000, // 1 second
            errorRate: 0.05, // 5%
            similarityThreshold: 0.7,
            availabilityThreshold: 0.99 // 99%
        };
        this.logger = new VERSATILLogger();
        this.initializeMonitoring();
    }
    /**
     * Initialize production monitoring
     */
    async initializeMonitoring() {
        try {
            this.isMonitoringEnabled = process.env.AGENT_PERFORMANCE_TRACKING === 'true';
            if (this.isMonitoringEnabled) {
                // Start metrics collection
                this.startMetricsCollection();
                // Start alert monitoring
                this.startAlertMonitoring();
                // Start cleanup tasks
                this.startCleanupTasks();
                this.logger.info('Production monitoring initialized', {
                    performanceTracking: this.isMonitoringEnabled,
                    thresholds: this.thresholds
                }, 'production-monitor');
            }
        }
        catch (error) {
            this.logger.error('Failed to initialize production monitoring', { error }, 'production-monitor');
        }
    }
    /**
     * Record agent performance metrics
     */
    recordAgentMetrics(agentId, metrics) {
        if (!this.isMonitoringEnabled)
            return;
        const fullMetrics = {
            agentId,
            ragResponseTime: metrics.ragResponseTime || 0,
            edgeFunctionLatency: metrics.edgeFunctionLatency || 0,
            similarityScore: metrics.similarityScore || 0,
            patternsRetrieved: metrics.patternsRetrieved || 0,
            cacheHitRate: metrics.cacheHitRate || 0,
            errorRate: metrics.errorRate || 0,
            successRate: metrics.successRate || 1,
            timestamp: Date.now()
        };
        // Store metrics
        if (!this.metrics.has(agentId)) {
            this.metrics.set(agentId, []);
        }
        this.metrics.get(agentId).push(fullMetrics);
        // Emit metrics event
        this.emit('agent_metrics', fullMetrics);
        // Check for performance alerts
        this.checkPerformanceAlerts(fullMetrics);
    }
    /**
     * Record edge function metrics
     */
    recordEdgeFunctionMetrics(functionName, metrics) {
        if (!this.isMonitoringEnabled)
            return;
        const fullMetrics = {
            functionName,
            invocations: metrics.invocations || 1,
            avgResponseTime: metrics.avgResponseTime || 0,
            errorCount: metrics.errorCount || 0,
            coldStarts: metrics.coldStarts || 0,
            warmResponseTime: metrics.warmResponseTime || 0,
            memoryUsage: metrics.memoryUsage || 0,
            timestamp: Date.now()
        };
        // Store metrics
        if (!this.edgeMetrics.has(functionName)) {
            this.edgeMetrics.set(functionName, []);
        }
        this.edgeMetrics.get(functionName).push(fullMetrics);
        // Emit metrics event
        this.emit('edge_metrics', fullMetrics);
    }
    /**
     * Record RAG performance metrics
     */
    recordRAGMetrics(metrics) {
        if (!this.isMonitoringEnabled)
            return;
        const fullMetrics = {
            ...metrics,
            timestamp: Date.now()
        };
        this.ragMetrics.push(fullMetrics);
        this.emit('rag_metrics', fullMetrics);
        // Check for RAG performance issues
        this.checkRAGPerformance(fullMetrics);
    }
    /**
     * Check for performance alerts
     */
    checkPerformanceAlerts(metrics) {
        const alerts = [];
        // Check response time
        if (metrics.ragResponseTime > this.thresholds.ragResponseTime) {
            alerts.push({
                type: 'performance',
                severity: metrics.ragResponseTime > this.thresholds.ragResponseTime * 2 ? 'critical' : 'high',
                message: `Slow RAG response time: ${metrics.ragResponseTime}ms (threshold: ${this.thresholds.ragResponseTime}ms)`,
                agentId: metrics.agentId,
                metrics,
                timestamp: Date.now()
            });
        }
        // Check edge function latency
        if (metrics.edgeFunctionLatency > this.thresholds.edgeLatency) {
            alerts.push({
                type: 'performance',
                severity: 'medium',
                message: `High edge function latency: ${metrics.edgeFunctionLatency}ms`,
                agentId: metrics.agentId,
                metrics,
                timestamp: Date.now()
            });
        }
        // Check error rate
        if (metrics.errorRate > this.thresholds.errorRate) {
            alerts.push({
                type: 'error',
                severity: 'high',
                message: `High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
                agentId: metrics.agentId,
                metrics,
                timestamp: Date.now()
            });
        }
        // Check similarity quality
        if (metrics.similarityScore < this.thresholds.similarityThreshold) {
            alerts.push({
                type: 'performance',
                severity: 'medium',
                message: `Low similarity score: ${metrics.similarityScore.toFixed(3)} (threshold: ${this.thresholds.similarityThreshold})`,
                agentId: metrics.agentId,
                metrics,
                timestamp: Date.now()
            });
        }
        // Process alerts
        alerts.forEach(alert => this.processAlert(alert));
    }
    /**
     * Check RAG performance
     */
    checkRAGPerformance(metrics) {
        if (metrics.totalRAGTime > this.thresholds.ragResponseTime) {
            this.processAlert({
                type: 'performance',
                severity: 'medium',
                message: `Slow RAG processing: ${metrics.totalRAGTime}ms for ${metrics.agentDomain}`,
                metrics,
                timestamp: Date.now()
            });
        }
        if (metrics.relevanceScore < this.thresholds.similarityThreshold) {
            this.processAlert({
                type: 'performance',
                severity: 'low',
                message: `Low relevance score: ${metrics.relevanceScore.toFixed(3)} for ${metrics.agentDomain}`,
                metrics,
                timestamp: Date.now()
            });
        }
    }
    /**
     * Process and store alert
     */
    processAlert(alert) {
        this.alerts.push(alert);
        this.emit('alert', alert);
        this.logger.warn(`Production Alert: ${alert.message}`, {
            type: alert.type,
            severity: alert.severity,
            agentId: alert.agentId
        }, 'production-monitor');
        // Critical alerts should trigger immediate notifications
        if (alert.severity === 'critical') {
            this.handleCriticalAlert(alert);
        }
    }
    /**
     * Handle critical alerts
     */
    handleCriticalAlert(alert) {
        this.logger.error(`CRITICAL ALERT: ${alert.message}`, {
            alert,
            timestamp: new Date(alert.timestamp).toISOString()
        }, 'production-monitor');
        // Emit critical alert event for external handlers
        this.emit('critical_alert', alert);
    }
    /**
     * Get agent performance summary
     */
    getAgentPerformanceSummary(agentId, timeWindow = 3600000) {
        if (!this.metrics.has(agentId)) {
            return { agentId, error: 'No metrics found' };
        }
        const now = Date.now();
        const windowStart = now - timeWindow;
        const agentMetrics = this.metrics.get(agentId)
            .filter(m => m.timestamp >= windowStart);
        if (agentMetrics.length === 0) {
            return { agentId, error: 'No metrics in time window' };
        }
        const summary = {
            agentId,
            timeWindow,
            totalRequests: agentMetrics.length,
            avgResponseTime: agentMetrics.reduce((sum, m) => sum + m.ragResponseTime, 0) / agentMetrics.length,
            avgSimilarityScore: agentMetrics.reduce((sum, m) => sum + m.similarityScore, 0) / agentMetrics.length,
            avgPatternsRetrieved: agentMetrics.reduce((sum, m) => sum + m.patternsRetrieved, 0) / agentMetrics.length,
            errorRate: agentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / agentMetrics.length,
            successRate: agentMetrics.reduce((sum, m) => sum + m.successRate, 0) / agentMetrics.length,
            p95ResponseTime: this.calculatePercentile(agentMetrics.map(m => m.ragResponseTime), 95),
            p99ResponseTime: this.calculatePercentile(agentMetrics.map(m => m.ragResponseTime), 99)
        };
        return summary;
    }
    /**
     * Get production health status
     */
    getProductionHealth() {
        const now = Date.now();
        const oneHour = 3600000;
        const recentAlerts = this.alerts.filter(a => now - a.timestamp < oneHour);
        const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical').length;
        const highAlerts = recentAlerts.filter(a => a.severity === 'high').length;
        // Calculate overall health score
        let healthScore = 100;
        healthScore -= criticalAlerts * 30;
        healthScore -= highAlerts * 15;
        healthScore = Math.max(0, healthScore);
        const status = healthScore > 90 ? 'healthy' :
            healthScore > 70 ? 'warning' :
                healthScore > 50 ? 'degraded' : 'critical';
        return {
            status,
            healthScore,
            timestamp: now,
            alerts: {
                critical: criticalAlerts,
                high: highAlerts,
                total: recentAlerts.length
            },
            agentStatus: this.getAgentStatusSummary(),
            edgeFunctions: this.getEdgeFunctionStatus()
        };
    }
    /**
     * Get agent status summary
     */
    getAgentStatusSummary() {
        const agentSummary = {};
        ['enhanced-maria', 'enhanced-james', 'enhanced-marcus'].forEach(agentId => {
            const summary = this.getAgentPerformanceSummary(agentId, 3600000);
            agentSummary[agentId] = {
                status: summary.errorRate < 0.05 && summary.avgResponseTime < 2000 ? 'healthy' : 'degraded',
                avgResponseTime: summary.avgResponseTime,
                successRate: summary.successRate,
                errorRate: summary.errorRate
            };
        });
        return agentSummary;
    }
    /**
     * Get edge function status
     */
    getEdgeFunctionStatus() {
        const edgeStatus = {};
        this.edgeMetrics.forEach((metrics, functionName) => {
            const recent = metrics.filter(m => Date.now() - m.timestamp < 3600000);
            if (recent.length > 0) {
                const avgResponseTime = recent.reduce((sum, m) => sum + m.avgResponseTime, 0) / recent.length;
                const totalErrors = recent.reduce((sum, m) => sum + m.errorCount, 0);
                const totalInvocations = recent.reduce((sum, m) => sum + m.invocations, 0);
                edgeStatus[functionName] = {
                    status: totalErrors / totalInvocations < 0.05 ? 'healthy' : 'degraded',
                    avgResponseTime,
                    errorRate: totalErrors / totalInvocations,
                    invocations: totalInvocations
                };
            }
        });
        return edgeStatus;
    }
    /**
     * Calculate percentile
     */
    calculatePercentile(values, percentile) {
        const sorted = values.sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        if (upper >= sorted.length)
            return sorted[sorted.length - 1];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.emit('metrics_collection', {
                agentMetrics: this.metrics.size,
                edgeMetrics: this.edgeMetrics.size,
                ragMetrics: this.ragMetrics.length,
                alerts: this.alerts.length
            });
        }, 60000); // Every minute
    }
    /**
     * Start alert monitoring
     */
    startAlertMonitoring() {
        this.alertsInterval = setInterval(() => {
            // Check for unresolved critical alerts
            const criticalAlerts = this.alerts.filter(a => a.severity === 'critical' &&
                !a.resolved &&
                Date.now() - a.timestamp < 3600000);
            if (criticalAlerts.length > 0) {
                this.emit('critical_alerts_pending', criticalAlerts);
            }
        }, 300000); // Every 5 minutes
    }
    /**
     * Start cleanup tasks
     */
    startCleanupTasks() {
        this.cleanupInterval = setInterval(() => {
            const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
            // Clean old metrics
            this.metrics.forEach((metrics, agentId) => {
                const filtered = metrics.filter(m => m.timestamp > cutoff);
                this.metrics.set(agentId, filtered);
            });
            this.edgeMetrics.forEach((metrics, functionName) => {
                const filtered = metrics.filter(m => m.timestamp > cutoff);
                this.edgeMetrics.set(functionName, filtered);
            });
            this.ragMetrics = this.ragMetrics.filter(m => m.timestamp > cutoff);
            this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
        }, 3600000); // Every hour
    }
    /**
     * Shutdown monitoring
     */
    shutdown() {
        if (this.metricsInterval)
            clearInterval(this.metricsInterval);
        if (this.alertsInterval)
            clearInterval(this.alertsInterval);
        if (this.cleanupInterval)
            clearInterval(this.cleanupInterval);
        this.logger.info('Production monitoring shutdown complete', {}, 'production-monitor');
    }
}
// Export singleton instance
export const productionMonitor = new ProductionMonitor();
//# sourceMappingURL=production-monitor.js.map