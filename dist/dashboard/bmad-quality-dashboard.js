/**
 * VERSATIL SDLC Framework - OPERA Quality Dashboard
 * Real-time UI/UX Testing Flywheel with Agent Orchestration
 */
import { OPERATestingOrchestrator } from '../testing/opera-testing-orchestrator.js';
import { VERSATILLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';
export class OPERAQualityDashboard extends EventEmitter {
    constructor(config) {
        super();
        this.workflowHistory = [];
        this.orchestrator = new OPERATestingOrchestrator();
        this.logger = VERSATILLogger.getInstance();
        this.config = {
            refreshInterval: 5000,
            enableRealTimeUpdates: true,
            qualityThresholds: {
                overall: 80,
                performance: 90,
                accessibility: 95,
                security: 90
            },
            alertSettings: {
                criticalIssues: true,
                performanceDegradation: true,
                testFailures: true
            },
            ...config
        };
        this.metrics = this.initializeMetrics();
        this.startRealTimeMonitoring();
    }
    initializeMetrics() {
        return {
            overallScore: 70,
            testCoverage: 0,
            performanceScore: 0,
            accessibilityScore: 0,
            securityScore: 0,
            visualRegressionStatus: 'passing',
            activeWorkflows: 0,
            agentUtilization: {
                'enhanced-maria': {
                    activeJobs: 0,
                    completedJobs: 0,
                    averageExecutionTime: 0,
                    successRate: 100
                },
                'enhanced-james': {
                    activeJobs: 0,
                    completedJobs: 0,
                    averageExecutionTime: 0,
                    successRate: 100
                },
                'enhanced-marcus': {
                    activeJobs: 0,
                    completedJobs: 0,
                    averageExecutionTime: 0,
                    successRate: 100
                }
            }
        };
    }
    /**
     * Start real-time quality monitoring
     */
    startRealTimeMonitoring() {
        if (!this.config.enableRealTimeUpdates)
            return;
        this.refreshTimer = setInterval(async () => {
            await this.refreshMetrics();
        }, this.config.refreshInterval);
        this.logger.info('🎯 OPERA Quality Dashboard - Real-time monitoring started', {
            refreshInterval: this.config.refreshInterval,
            qualityThresholds: this.config.qualityThresholds
        }, 'opera-dashboard');
    }
    /**
     * Execute UI/UX testing flywheel for file changes
     */
    async executeUIUXTestingFlywheel(filePath, changeType) {
        this.logger.info('🔄 UI/UX Testing Flywheel Triggered', {
            filePath,
            changeType,
            timestamp: new Date().toISOString()
        }, 'opera-flywheel');
        const context = {
            filePath,
            changeType,
            affectedComponents: this.detectAffectedComponents(filePath, changeType),
            testingSuite: this.determineBestTestingSuite(changeType),
            qualityGates: {
                visualRegression: changeType === 'style' || changeType === 'component',
                performance: changeType === 'component' || changeType === 'route',
                accessibility: true,
                security: changeType === 'configuration' || changeType === 'route'
            }
        };
        try {
            // Execute agent-driven workflow
            const result = await this.orchestrator.triggerAgentWorkflow(context);
            // Update metrics and history
            this.updateMetricsFromWorkflow(result);
            this.workflowHistory.push(result);
            this.trimWorkflowHistory();
            // Emit real-time updates
            this.emit('workflowComplete', result);
            this.emit('metricsUpdate', this.metrics);
            // Check for alerts
            await this.checkAndEmitAlerts(result);
            this.logger.info('✅ UI/UX Testing Flywheel Complete', {
                qualityScore: result.qualityScore,
                success: result.success,
                issues: result.issues.length,
                recommendations: result.recommendations.length
            }, 'opera-flywheel');
            return result;
        }
        catch (error) {
            this.logger.error('❌ UI/UX Testing Flywheel Failed', error, 'opera-flywheel');
            throw error;
        }
    }
    /**
     * Get current quality metrics
     */
    getQualityMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get workflow history
     */
    getWorkflowHistory(limit = 50) {
        return this.workflowHistory.slice(-limit);
    }
    /**
     * Get quality dashboard data
     */
    getDashboardData() {
        const alerts = this.generateCurrentAlerts();
        return {
            metrics: this.metrics,
            recentWorkflows: this.getWorkflowHistory(10),
            activeWorkflows: this.orchestrator.getActiveWorkflows(),
            alerts
        };
    }
    /**
     * Force refresh metrics
     */
    async refreshMetrics() {
        const activeWorkflows = this.orchestrator.getActiveWorkflows();
        this.metrics.activeWorkflows = activeWorkflows.length;
        // Calculate overall quality score from recent workflows
        if (this.workflowHistory.length > 0) {
            const recentWorkflows = this.workflowHistory.slice(-10);
            const avgScore = recentWorkflows.reduce((sum, w) => sum + w.qualityScore, 0) / recentWorkflows.length;
            this.metrics.overallScore = Math.round(avgScore);
        }
        // Update agent utilization (simulated)
        Object.keys(this.metrics.agentUtilization).forEach(agentName => {
            const completedCount = this.workflowHistory.filter(w => w.agent === agentName).length;
            const agentMetrics = this.metrics.agentUtilization[agentName];
            if (agentMetrics) {
                agentMetrics.completedJobs = completedCount;
                if (completedCount > 0) {
                    const agentWorkflows = this.workflowHistory.filter(w => w.agent === agentName);
                    const successCount = agentWorkflows.filter(w => w.success).length;
                    agentMetrics.successRate = Math.round((successCount / completedCount) * 100);
                }
            }
        });
        this.emit('metricsUpdate', this.metrics);
    }
    /**
     * Private helper methods
     */
    detectAffectedComponents(filePath, changeType) {
        // Analyze file path to determine affected components
        const components = [];
        if (filePath.includes('components/')) {
            const componentMatch = filePath.match(/components\/([^\/]+)/);
            if (componentMatch && componentMatch[1])
                components.push(componentMatch[1]);
        }
        if (changeType === 'route' && filePath.includes('pages/')) {
            const pageMatch = filePath.match(/pages\/([^\/]+)/);
            if (pageMatch && pageMatch[1])
                components.push(`${pageMatch[1]}-page`);
        }
        return components;
    }
    determineBestTestingSuite(changeType) {
        switch (changeType) {
            case 'component':
                return 'integration';
            case 'style':
                return 'visual';
            case 'route':
                return 'e2e';
            case 'configuration':
                return 'unit';
            default:
                return 'integration';
        }
    }
    updateMetricsFromWorkflow(result) {
        // Update performance metrics based on result
        if (result.qualityScore >= 90) {
            this.metrics.performanceScore = Math.min(100, this.metrics.performanceScore + 2);
        }
        else if (result.qualityScore < 70) {
            this.metrics.performanceScore = Math.max(0, this.metrics.performanceScore - 3);
        }
        // Update accessibility score
        const accessibilityIssues = result.issues.filter(i => i.description.toLowerCase().includes('accessibility') ||
            i.description.toLowerCase().includes('a11y'));
        if (accessibilityIssues.length === 0) {
            this.metrics.accessibilityScore = Math.min(100, this.metrics.accessibilityScore + 1);
        }
        else {
            this.metrics.accessibilityScore = Math.max(0, this.metrics.accessibilityScore - accessibilityIssues.length * 5);
        }
        // Update security score
        const securityIssues = result.issues.filter(i => i.description.toLowerCase().includes('security') ||
            i.description.toLowerCase().includes('vulnerability'));
        if (securityIssues.length === 0) {
            this.metrics.securityScore = Math.min(100, this.metrics.securityScore + 1);
        }
        else {
            this.metrics.securityScore = Math.max(0, this.metrics.securityScore - securityIssues.length * 10);
        }
        // Update visual regression status
        const visualIssues = result.issues.filter(i => i.description.toLowerCase().includes('visual') ||
            i.description.toLowerCase().includes('regression'));
        if (visualIssues.length > 0) {
            this.metrics.visualRegressionStatus = 'failing';
        }
        else if (result.qualityScore >= 95) {
            this.metrics.visualRegressionStatus = 'passing';
        }
        else {
            this.metrics.visualRegressionStatus = 'warning';
        }
    }
    trimWorkflowHistory() {
        if (this.workflowHistory.length > 100) {
            this.workflowHistory = this.workflowHistory.slice(-100);
        }
    }
    async checkAndEmitAlerts(result) {
        const alerts = [];
        // Critical issues alert
        const criticalIssues = result.issues.filter(i => i.type === 'critical');
        if (criticalIssues.length > 0 && this.config.alertSettings.criticalIssues) {
            alerts.push({
                type: 'critical-issues',
                message: `${criticalIssues.length} critical issues detected in ${result.agent} workflow`,
                severity: 'critical'
            });
        }
        // Performance degradation alert
        if (result.qualityScore < this.config.qualityThresholds.performance && this.config.alertSettings.performanceDegradation) {
            alerts.push({
                type: 'performance-degradation',
                message: `Quality score below threshold: ${result.qualityScore}/${this.config.qualityThresholds.performance}`,
                severity: 'high'
            });
        }
        // Test failure alert
        if (!result.success && this.config.alertSettings.testFailures) {
            alerts.push({
                type: 'test-failure',
                message: `Testing workflow failed for ${result.agent}`,
                severity: 'high'
            });
        }
        // Emit alerts
        alerts.forEach(alert => {
            this.emit('alert', alert);
            this.logger.warn(`🚨 OPERA Alert: ${alert.message}`, { alert }, 'opera-alerts');
        });
    }
    generateCurrentAlerts() {
        const alerts = [];
        // Overall quality threshold
        if (this.metrics.overallScore < this.config.qualityThresholds.overall) {
            alerts.push({
                type: 'quality-threshold',
                message: `Overall quality score below threshold: ${this.metrics.overallScore}/${this.config.qualityThresholds.overall}`,
                severity: 'medium'
            });
        }
        // Accessibility threshold
        if (this.metrics.accessibilityScore < this.config.qualityThresholds.accessibility) {
            alerts.push({
                type: 'accessibility-threshold',
                message: `Accessibility score below threshold: ${this.metrics.accessibilityScore}/${this.config.qualityThresholds.accessibility}`,
                severity: 'high'
            });
        }
        // Visual regression failures
        if (this.metrics.visualRegressionStatus === 'failing') {
            alerts.push({
                type: 'visual-regression',
                message: 'Visual regression tests are failing',
                severity: 'high'
            });
        }
        return alerts;
    }
    /**
     * Stop dashboard monitoring
     */
    stop() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = undefined;
        }
        this.removeAllListeners();
        this.logger.info('🛑 OPERA Quality Dashboard stopped', {}, 'opera-dashboard');
    }
}
export default OPERAQualityDashboard;
//# sourceMappingURL=bmad-quality-dashboard.js.map