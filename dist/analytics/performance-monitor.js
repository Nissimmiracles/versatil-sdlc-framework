/**
 * VERSATIL SDLC Framework - Performance Monitoring & Analytics System
 *
 * Real-time performance monitoring for Enhanced OPERA agents with
 * comprehensive analytics, metrics collection, and alerting capabilities.
 */
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
export class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.agentPerformance = new Map();
        this.alerts = [];
        this.isMonitoring = false;
        this.alertThresholds = new Map();
        this.metricsStorePath = path.join(homedir(), '.versatil', 'analytics');
        this.initializeThresholds();
        this.ensureStorageDirectory();
        this.loadHistoricalData();
    }
    initializeThresholds() {
        this.alertThresholds.set('execution_time', 5000); // 5 seconds
        this.alertThresholds.set('memory_usage', 100); // 100MB
        this.alertThresholds.set('cpu_usage', 80); // 80%
        this.alertThresholds.set('quality_score', 70); // 70% minimum
        this.alertThresholds.set('issue_detection', 10); // 10+ issues per execution
    }
    ensureStorageDirectory() {
        if (!fs.existsSync(this.metricsStorePath)) {
            fs.mkdirSync(this.metricsStorePath, { recursive: true });
        }
    }
    loadHistoricalData() {
        try {
            const metricsFile = path.join(this.metricsStorePath, 'metrics.json');
            if (fs.existsSync(metricsFile)) {
                const data = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
                this.metrics = new Map(Object.entries(data.metrics || {}));
                this.agentPerformance = new Map(Object.entries(data.agentPerformance || {}));
            }
        }
        catch (error) {
            console.warn('Could not load historical performance data:', error instanceof Error ? error.message : String(error));
        }
    }
    /**
     * Start performance monitoring
     */
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        console.log('🔍 Performance monitoring started');
        // Collect system metrics every 30 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);
        // Save metrics every 5 minutes
        setInterval(() => {
            this.saveMetrics();
        }, 300000);
        // Cleanup old metrics every hour
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 3600000);
        this.emit('monitoring-started');
    }
    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        this.saveMetrics();
        console.log('🛑 Performance monitoring stopped');
        this.emit('monitoring-stopped');
    }
    /**
     * Record agent execution performance
     */
    recordAgentExecution(agentId, executionTime, issuesDetected, qualityScore, success, context) {
        const timestamp = Date.now();
        // Record execution time metric
        const execMetric = {
            id: `${agentId}-exec-${timestamp}`,
            timestamp,
            agentId,
            metricType: 'execution_time',
            value: executionTime,
            status: this.getMetricStatus('execution_time', executionTime)
        };
        if (context)
            execMetric.context = context;
        const execThreshold = this.alertThresholds.get('execution_time');
        if (execThreshold !== undefined)
            execMetric.threshold = execThreshold;
        this.recordMetric(execMetric);
        // Record issues detected metric
        const issuesMetric = {
            id: `${agentId}-issues-${timestamp}`,
            timestamp,
            agentId,
            metricType: 'issue_detection',
            value: issuesDetected,
            status: this.getMetricStatus('issue_detection', issuesDetected)
        };
        if (context)
            issuesMetric.context = context;
        const issuesThreshold = this.alertThresholds.get('issue_detection');
        if (issuesThreshold !== undefined)
            issuesMetric.threshold = issuesThreshold;
        this.recordMetric(issuesMetric);
        // Record quality score metric
        const qualityMetric = {
            id: `${agentId}-quality-${timestamp}`,
            timestamp,
            agentId,
            metricType: 'quality_score',
            value: qualityScore,
            status: this.getMetricStatus('quality_score', qualityScore)
        };
        if (context)
            qualityMetric.context = context;
        const qualityThreshold = this.alertThresholds.get('quality_score');
        if (qualityThreshold !== undefined)
            qualityMetric.threshold = qualityThreshold;
        this.recordMetric(qualityMetric);
        // Update agent performance data
        this.updateAgentPerformance(agentId, executionTime, issuesDetected, qualityScore, success);
        // Check for alerts
        this.checkAlerts(agentId, executionTime, issuesDetected, qualityScore);
        this.emit('agent-execution-recorded', { agentId, executionTime, issuesDetected, qualityScore, success });
    }
    /**
     * Record system resource metrics
     */
    collectSystemMetrics() {
        const timestamp = Date.now();
        // Get memory usage
        const memoryUsage = process.memoryUsage();
        const memoryValue = memoryUsage.heapUsed / 1024 / 1024; // MB
        const memoryMetric = {
            id: `system-memory-${timestamp}`,
            timestamp,
            agentId: 'system',
            metricType: 'memory_usage',
            value: memoryValue,
            status: this.getMetricStatus('memory_usage', memoryValue)
        };
        const memoryThreshold = this.alertThresholds.get('memory_usage');
        if (memoryThreshold !== undefined)
            memoryMetric.threshold = memoryThreshold;
        this.recordMetric(memoryMetric);
        // Get CPU usage (approximation)
        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage
        const cpuMetric = {
            id: `system-cpu-${timestamp}`,
            timestamp,
            agentId: 'system',
            metricType: 'cpu_usage',
            value: cpuPercent,
            status: this.getMetricStatus('cpu_usage', cpuPercent)
        };
        const cpuThreshold = this.alertThresholds.get('cpu_usage');
        if (cpuThreshold !== undefined)
            cpuMetric.threshold = cpuThreshold;
        this.recordMetric(cpuMetric);
    }
    /**
     * Record a performance metric
     */
    recordMetric(metric) {
        if (!this.metrics.has(metric.agentId)) {
            this.metrics.set(metric.agentId, []);
        }
        this.metrics.get(metric.agentId).push(metric);
        // Emit metric recorded event
        this.emit('metric-recorded', metric);
        // Log critical metrics
        if (metric.status === 'critical') {
            console.warn(`🚨 Critical metric: ${metric.agentId} ${metric.metricType} = ${metric.value}`);
        }
    }
    /**
     * Update agent performance data
     */
    updateAgentPerformance(agentId, executionTime, issuesDetected, qualityScore, success) {
        let performance = this.agentPerformance.get(agentId);
        if (!performance) {
            performance = {
                agentId,
                totalExecutions: 0,
                averageExecutionTime: 0,
                maxExecutionTime: 0,
                minExecutionTime: Infinity,
                successRate: 0,
                issuesDetected: 0,
                averageQualityScore: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                lastExecution: 0,
                trend: 'stable'
            };
        }
        // Update execution statistics
        performance.totalExecutions++;
        performance.averageExecutionTime =
            (performance.averageExecutionTime * (performance.totalExecutions - 1) + executionTime) / performance.totalExecutions;
        performance.maxExecutionTime = Math.max(performance.maxExecutionTime, executionTime);
        performance.minExecutionTime = Math.min(performance.minExecutionTime, executionTime);
        performance.issuesDetected += issuesDetected;
        performance.averageQualityScore =
            (performance.averageQualityScore * (performance.totalExecutions - 1) + qualityScore) / performance.totalExecutions;
        performance.lastExecution = Date.now();
        // Calculate success rate
        const successCount = success ? 1 : 0;
        performance.successRate =
            (performance.successRate * (performance.totalExecutions - 1) + successCount) / performance.totalExecutions;
        // Determine trend
        performance.trend = this.calculateTrend(agentId, performance);
        this.agentPerformance.set(agentId, performance);
    }
    /**
     * Calculate performance trend
     */
    calculateTrend(agentId, _current) {
        const recentMetrics = this.getRecentMetrics(agentId, 10);
        if (recentMetrics.length < 5)
            return 'stable';
        const recentExecutionTimes = recentMetrics
            .filter(m => m.metricType === 'execution_time')
            .map(m => m.value);
        const recentQualityScores = recentMetrics
            .filter(m => m.metricType === 'quality_score')
            .map(m => m.value);
        if (recentExecutionTimes.length < 3 || recentQualityScores.length < 3)
            return 'stable';
        // Check execution time trend (lower is better)
        const avgRecentExecTime = recentExecutionTimes.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const avgOlderExecTime = recentExecutionTimes.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        // Check quality score trend (higher is better)
        const avgRecentQuality = recentQualityScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const avgOlderQuality = recentQualityScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const execTimeImproving = avgRecentExecTime < avgOlderExecTime * 0.95;
        const qualityImproving = avgRecentQuality > avgOlderQuality * 1.05;
        const execTimeDeclining = avgRecentExecTime > avgOlderExecTime * 1.05;
        const qualityDeclining = avgRecentQuality < avgOlderQuality * 0.95;
        if (execTimeImproving || qualityImproving)
            return 'improving';
        if (execTimeDeclining || qualityDeclining)
            return 'declining';
        return 'stable';
    }
    /**
     * Check for performance alerts
     */
    checkAlerts(agentId, executionTime, issuesDetected, qualityScore) {
        const timestamp = Date.now();
        // Execution time alert
        const execThreshold = this.alertThresholds.get('execution_time');
        if (executionTime > execThreshold) {
            this.createAlert({
                id: `exec-alert-${agentId}-${timestamp}`,
                timestamp,
                severity: executionTime > execThreshold * 2 ? 'critical' : 'warning',
                agentId,
                message: `Agent ${agentId} execution time exceeded threshold`,
                metric: 'execution_time',
                value: executionTime,
                threshold: execThreshold,
                action: 'Review agent implementation for performance bottlenecks'
            });
        }
        // Quality score alert
        const qualityThreshold = this.alertThresholds.get('quality_score');
        if (qualityScore < qualityThreshold) {
            this.createAlert({
                id: `quality-alert-${agentId}-${timestamp}`,
                timestamp,
                severity: qualityScore < qualityThreshold * 0.5 ? 'critical' : 'warning',
                agentId,
                message: `Agent ${agentId} quality score below threshold`,
                metric: 'quality_score',
                value: qualityScore,
                threshold: qualityThreshold,
                action: 'Review agent validation logic and enhance detection capabilities'
            });
        }
        // Issues detected alert
        const issuesThreshold = this.alertThresholds.get('issue_detection');
        if (issuesDetected > issuesThreshold) {
            this.createAlert({
                id: `issues-alert-${agentId}-${timestamp}`,
                timestamp,
                severity: 'info',
                agentId,
                message: `Agent ${agentId} detected high number of issues`,
                metric: 'issue_detection',
                value: issuesDetected,
                threshold: issuesThreshold,
                action: 'Review codebase quality and address detected issues'
            });
        }
    }
    /**
     * Create performance alert
     */
    createAlert(alert) {
        this.alerts.push(alert);
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }
        console.log(`🚨 Alert: ${alert.severity.toUpperCase()} - ${alert.message}`);
        this.emit('alert-created', alert);
    }
    /**
     * Get metric status based on thresholds
     */
    getMetricStatus(metricType, value) {
        const threshold = this.alertThresholds.get(metricType);
        if (!threshold)
            return 'normal';
        switch (metricType) {
            case 'execution_time':
            case 'memory_usage':
            case 'cpu_usage':
            case 'issue_detection':
                if (value > threshold * 2)
                    return 'critical';
                if (value > threshold)
                    return 'warning';
                return 'normal';
            case 'quality_score':
                if (value < threshold * 0.5)
                    return 'critical';
                if (value < threshold)
                    return 'warning';
                return 'normal';
            default:
                return 'normal';
        }
    }
    /**
     * Get recent metrics for an agent
     */
    getRecentMetrics(agentId, count) {
        const agentMetrics = this.metrics.get(agentId) || [];
        return agentMetrics
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }
    /**
     * Get performance dashboard data
     */
    getPerformanceDashboard() {
        const systemData = this.getSystemPerformanceData();
        const agentData = Array.from(this.agentPerformance.values());
        const recentAlerts = this.alerts.slice(-20);
        const trends = this.calculateSystemTrends();
        return {
            system: systemData,
            agents: agentData,
            recentAlerts,
            trends
        };
    }
    /**
     * Get system performance data
     */
    getSystemPerformanceData() {
        const timestamp = Date.now();
        const allAgents = Array.from(this.agentPerformance.values());
        const totalExecutions = allAgents.reduce((sum, agent) => sum + agent.totalExecutions, 0);
        const averageResponseTime = allAgents.reduce((sum, agent) => sum + agent.averageExecutionTime, 0) / allAgents.length || 0;
        const overallQuality = allAgents.reduce((sum, agent) => sum + agent.averageQualityScore, 0) / allAgents.length || 100;
        const recentAlerts = this.alerts.filter(alert => timestamp - alert.timestamp < 3600000); // Last hour
        const criticalIssues = recentAlerts.filter(alert => alert.severity === 'critical').length;
        const highPriorityIssues = recentAlerts.filter(alert => alert.severity === 'warning').length;
        // Get latest system metrics
        const systemMetrics = this.metrics.get('system') || [];
        const latestMemory = systemMetrics
            .filter(m => m.metricType === 'memory_usage')
            .sort((a, b) => b.timestamp - a.timestamp)[0]?.value || 0;
        return {
            timestamp,
            overallHealth: Math.min(100, overallQuality - (criticalIssues * 10) - (highPriorityIssues * 5)),
            totalAgentExecutions: totalExecutions,
            averageResponseTime,
            systemLoad: averageResponseTime > 2000 ? (averageResponseTime / 1000) * 10 : 10,
            memoryUsage: latestMemory,
            activeAgents: allAgents.length,
            criticalIssues,
            highPriorityIssues,
            qualityGateStatus: criticalIssues > 0 ? 'failing' : highPriorityIssues > 5 ? 'warning' : 'passing'
        };
    }
    /**
     * Calculate system trends
     */
    calculateSystemTrends() {
        const trends = {};
        // Calculate trends for each agent
        for (const [agentId, performance] of this.agentPerformance) {
            trends[agentId] = {
                performance: performance.trend,
                executionTime: this.calculateMetricTrend(agentId, 'execution_time'),
                qualityScore: this.calculateMetricTrend(agentId, 'quality_score'),
                issuesDetected: this.calculateMetricTrend(agentId, 'issue_detection')
            };
        }
        return trends;
    }
    /**
     * Calculate trend for specific metric
     */
    calculateMetricTrend(agentId, metricType) {
        const recentMetrics = this.getRecentMetrics(agentId, 20)
            .filter(m => m.metricType === metricType);
        if (recentMetrics.length < 10)
            return 'stable';
        const firstHalf = recentMetrics.slice(0, 10);
        const secondHalf = recentMetrics.slice(10);
        const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;
        const threshold = 0.05; // 5% change threshold
        if (metricType === 'quality_score') {
            // For quality score, higher is better
            if (secondAvg > firstAvg * (1 + threshold))
                return 'improving';
            if (secondAvg < firstAvg * (1 - threshold))
                return 'declining';
        }
        else {
            // For execution time and issues, lower is better
            if (secondAvg < firstAvg * (1 - threshold))
                return 'improving';
            if (secondAvg > firstAvg * (1 + threshold))
                return 'declining';
        }
        return 'stable';
    }
    /**
     * Save metrics to disk
     */
    saveMetrics() {
        try {
            const data = {
                metrics: Object.fromEntries(this.metrics),
                agentPerformance: Object.fromEntries(this.agentPerformance),
                alerts: this.alerts.slice(-1000), // Keep last 1000 alerts
                lastSaved: Date.now()
            };
            const metricsFile = path.join(this.metricsStorePath, 'metrics.json');
            fs.writeFileSync(metricsFile, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Failed to save performance metrics:', error instanceof Error ? error.message : String(error));
        }
    }
    /**
     * Cleanup old metrics (keep last 7 days)
     */
    cleanupOldMetrics() {
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
        for (const [agentId, metrics] of this.metrics) {
            const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);
            this.metrics.set(agentId, filteredMetrics);
        }
        // Cleanup old alerts
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    }
    /**
     * Export performance report
     */
    exportReport(format = 'json') {
        const dashboard = this.getPerformanceDashboard();
        if (format === 'json') {
            return JSON.stringify(dashboard, null, 2);
        }
        // CSV format
        let csv = 'Agent,Total Executions,Avg Execution Time,Max Execution Time,Success Rate,Avg Quality Score,Issues Detected,Trend\n';
        dashboard.agents.forEach(agent => {
            csv += `${agent.agentId},${agent.totalExecutions},${agent.averageExecutionTime.toFixed(2)},${agent.maxExecutionTime},${(agent.successRate * 100).toFixed(1)}%,${agent.averageQualityScore.toFixed(1)},${agent.issuesDetected},${agent.trend}\n`;
        });
        return csv;
    }
    /**
     * Get agent performance summary
     */
    getAgentSummary(agentId) {
        return this.agentPerformance.get(agentId) || null;
    }
    /**
     * Get system health score
     */
    getSystemHealthScore() {
        return this.getSystemPerformanceData().overallHealth;
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        const oneHourAgo = Date.now() - 3600000;
        return this.alerts.filter(alert => alert.timestamp > oneHourAgo);
    }
    /**
     * Start monitoring (for server integration)
     */
    start() {
        if (!this.isMonitoring) {
            this.startMonitoring();
        }
    }
    /**
     * Get Prometheus-compatible metrics
     */
    getPrometheusMetrics() {
        const dashboard = this.getPerformanceDashboard();
        let metrics = '';
        // System metrics
        metrics += `# HELP versatil_system_health Overall system health score\n`;
        metrics += `# TYPE versatil_system_health gauge\n`;
        metrics += `versatil_system_health ${dashboard.system.overallHealth}\n\n`;
        metrics += `# HELP versatil_total_executions Total agent executions\n`;
        metrics += `# TYPE versatil_total_executions counter\n`;
        metrics += `versatil_total_executions ${dashboard.system.totalAgentExecutions}\n\n`;
        metrics += `# HELP versatil_response_time_avg Average response time\n`;
        metrics += `# TYPE versatil_response_time_avg gauge\n`;
        metrics += `versatil_response_time_avg ${dashboard.system.averageResponseTime}\n\n`;
        // Agent-specific metrics
        dashboard.agents.forEach(agent => {
            metrics += `# HELP versatil_agent_executions Agent execution count\n`;
            metrics += `# TYPE versatil_agent_executions counter\n`;
            metrics += `versatil_agent_executions{agent="${agent.agentId}"} ${agent.totalExecutions}\n\n`;
            metrics += `# HELP versatil_agent_quality_score Agent quality score\n`;
            metrics += `# TYPE versatil_agent_quality_score gauge\n`;
            metrics += `versatil_agent_quality_score{agent="${agent.agentId}"} ${agent.averageQualityScore}\n\n`;
            metrics += `# HELP versatil_agent_issues_detected Issues detected by agent\n`;
            metrics += `# TYPE versatil_agent_issues_detected counter\n`;
            metrics += `versatil_agent_issues_detected{agent="${agent.agentId}"} ${agent.issuesDetected}\n\n`;
        });
        return metrics;
    }
    getMetrics() {
        return this.getPerformanceDashboard();
    }
    getAdaptiveInsights() {
        return {
            trends: this.calculateSystemTrends(),
            health: this.getSystemHealthScore(),
            recommendations: []
        };
    }
    isHealthy() {
        return this.getSystemHealthScore() >= 70;
    }
}
// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
//# sourceMappingURL=performance-monitor.js.map