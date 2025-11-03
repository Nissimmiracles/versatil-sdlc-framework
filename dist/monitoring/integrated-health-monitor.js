/**
 * VERSATIL Framework - Integrated Health Monitor
 *
 * Central monitoring system that integrates:
 * - Duplicate Repository Detection
 * - MCP Crash Recovery
 * - Sync Recovery System
 * - Context Sentinel
 * - Repository Integrity Checks
 *
 * @module IntegratedHealthMonitor
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
import { getDuplicateDetector } from './duplicate-repository-detector.js';
import { getSyncRecoverySystem } from './sync-recovery-system.js';
import { getStatementValidator } from '../agents/opera/maria-qa/statement-validator.js';
import { VERSATILLogger } from '../utils/logger.js';
export class IntegratedHealthMonitor extends EventEmitter {
    constructor() {
        super();
        this.monitoringInterval = null;
        this.MONITORING_INTERVAL = 30000; // 30 seconds
        // Output accuracy tracking
        this.hallucinationEvents = 0;
        this.totalValidations = 0;
        this.accuracySum = 0;
        this.logger = new VERSATILLogger('HealthMonitor');
        this.duplicateDetector = getDuplicateDetector();
        this.syncRecovery = getSyncRecoverySystem();
        this.statementValidator = getStatementValidator();
        // Listen for hallucination events
        this.statementValidator.on('hallucination-detected', () => {
            this.hallucinationEvents++;
            this.totalValidations++;
        });
        this.statementValidator.on('minor-inaccuracy', () => {
            this.totalValidations++;
        });
    }
    /**
     * Initialize health monitoring
     */
    async initialize(frameworkMonitor) {
        this.frameworkMonitor = frameworkMonitor;
        // Enable auto-recovery
        this.syncRecovery.setAutoRecovery(true);
        this.logger.info('Integrated health monitor initialized');
    }
    /**
     * Start continuous health monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval) {
            this.logger.warn('Health monitoring already active');
            return;
        }
        this.logger.info('Starting continuous health monitoring', {
            interval: this.MONITORING_INTERVAL
        });
        // Initial check
        this.performHealthCheck().catch(error => {
            this.logger.error('Initial health check failed', { error });
        });
        // Periodic checks
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            }
            catch (error) {
                this.logger.error('Health check failed', { error });
            }
        }, this.MONITORING_INTERVAL);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.info('Health monitoring stopped');
        }
    }
    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        const status = {
            overall: 'healthy',
            timestamp: Date.now(),
            checks: {
                duplicateRepositories: {
                    status: 'pass',
                    message: '',
                    duplicateCount: 0
                },
                syncRecovery: {
                    status: 'pass',
                    message: '',
                    recoveryInProgress: false
                },
                mcpServer: {
                    status: 'pass',
                    message: '',
                    crashCount: 0
                },
                isolation: {
                    status: 'pass',
                    message: '',
                    violations: []
                },
                outputAccuracy: {
                    status: 'pass',
                    message: '',
                    hallucinationRate: 0,
                    averageAccuracy: 1
                }
            },
            recommendations: []
        };
        // Check for duplicate repositories
        try {
            await this.checkDuplicateRepositories(status);
        }
        catch (error) {
            this.logger.error('Duplicate repository check failed', { error });
            status.checks.duplicateRepositories.status = 'fail';
            status.checks.duplicateRepositories.message = 'Check failed';
        }
        // Check sync recovery system
        try {
            await this.checkSyncRecovery(status);
        }
        catch (error) {
            this.logger.error('Sync recovery check failed', { error });
            status.checks.syncRecovery.status = 'fail';
            status.checks.syncRecovery.message = 'Check failed';
        }
        // Check isolation
        try {
            await this.checkIsolation(status);
        }
        catch (error) {
            this.logger.error('Isolation check failed', { error });
            status.checks.isolation.status = 'fail';
            status.checks.isolation.message = 'Check failed';
        }
        // Check output accuracy (Guardian)
        try {
            await this.checkOutputAccuracy(status);
        }
        catch (error) {
            this.logger.error('Output accuracy check failed', { error });
            status.checks.outputAccuracy.status = 'fail';
            status.checks.outputAccuracy.message = 'Check failed';
        }
        // Determine overall status
        status.overall = this.calculateOverallStatus(status);
        // Emit health status
        this.emit('health-check', status);
        if (status.overall !== 'healthy') {
            this.logger.warn('Health check completed with issues', {
                overall: status.overall,
                recommendations: status.recommendations.length
            });
        }
        else {
            this.logger.debug('Health check passed');
        }
        return status;
    }
    /**
     * Check for duplicate repositories
     */
    async checkDuplicateRepositories(status) {
        const currentPath = process.cwd();
        const report = await this.duplicateDetector.checkForDuplicates(currentPath);
        status.checks.duplicateRepositories.duplicateCount = report.duplicates.length;
        if (report.isDuplicate) {
            status.checks.duplicateRepositories.status = 'warn';
            status.checks.duplicateRepositories.message = `${report.duplicates.length} duplicate(s) found`;
            status.recommendations.push(`Duplicate repository detected. ${report.recommendation}`);
            this.logger.warn('Duplicate repository detected', {
                path: currentPath,
                duplicateCount: report.duplicates.length,
                primary: report.primaryRepo?.path
            });
        }
        else {
            status.checks.duplicateRepositories.status = 'pass';
            status.checks.duplicateRepositories.message = 'No duplicates';
        }
    }
    /**
     * Check sync recovery system
     */
    async checkSyncRecovery(status) {
        const isRecovering = this.syncRecovery.isRecoveryInProgress();
        const lastRecovery = this.syncRecovery.getLastRecovery();
        status.checks.syncRecovery.recoveryInProgress = isRecovering;
        if (isRecovering) {
            status.checks.syncRecovery.status = 'warn';
            status.checks.syncRecovery.message = 'Recovery in progress';
            status.recommendations.push('Sync recovery is currently running. Monitor progress.');
        }
        else if (lastRecovery && !lastRecovery.success) {
            status.checks.syncRecovery.status = 'warn';
            status.checks.syncRecovery.message = 'Last recovery had failures';
            status.recommendations.push(`Last sync recovery had ${lastRecovery.actionsFailed} failure(s). Review recovery report.`);
        }
        else {
            status.checks.syncRecovery.status = 'pass';
            status.checks.syncRecovery.message = 'System healthy';
        }
    }
    /**
     * Check isolation compliance
     */
    async checkIsolation(status) {
        const fs = await import('fs');
        const path = await import('path');
        const currentPath = process.cwd();
        const forbiddenPaths = [
            '.versatil/',
            'versatil/',
            'supabase/',
            '.versatil-memory/',
            '.versatil-logs/'
        ];
        const violations = [];
        for (const forbidden of forbiddenPaths) {
            const fullPath = path.join(currentPath, forbidden);
            if (fs.existsSync(fullPath)) {
                violations.push(forbidden);
            }
        }
        status.checks.isolation.violations = violations;
        if (violations.length > 0) {
            status.checks.isolation.status = 'fail';
            status.checks.isolation.message = `${violations.length} violation(s) found`;
            status.recommendations.push(`Isolation violations detected: ${violations.join(', ')}. ` +
                `Remove these directories and use ~/.versatil/ instead.`);
            this.logger.error('Isolation violations detected', { violations });
        }
        else {
            status.checks.isolation.status = 'pass';
            status.checks.isolation.message = 'No violations';
        }
    }
    /**
     * Check output accuracy (Guardian anti-hallucination system)
     */
    async checkOutputAccuracy(status) {
        const hallucinationRate = this.totalValidations > 0
            ? this.hallucinationEvents / this.totalValidations
            : 0;
        const averageAccuracy = this.totalValidations > 0
            ? this.accuracySum / this.totalValidations
            : 1;
        status.checks.outputAccuracy.hallucinationRate = hallucinationRate;
        status.checks.outputAccuracy.averageAccuracy = averageAccuracy;
        // Critical: > 10% hallucination rate
        if (hallucinationRate > 0.10) {
            status.checks.outputAccuracy.status = 'fail';
            status.checks.outputAccuracy.message = `High hallucination rate: ${Math.round(hallucinationRate * 100)}%`;
            status.recommendations.push(`Critical: Output hallucination rate is ${Math.round(hallucinationRate * 100)}%. ` +
                `Review Guardian system configuration and consider blocking mode.`);
            this.logger.error('High hallucination rate detected', {
                rate: hallucinationRate,
                events: this.hallucinationEvents,
                total: this.totalValidations
            });
        }
        // Warning: > 5% hallucination rate
        else if (hallucinationRate > 0.05) {
            status.checks.outputAccuracy.status = 'warn';
            status.checks.outputAccuracy.message = `Elevated hallucination rate: ${Math.round(hallucinationRate * 100)}%`;
            status.recommendations.push(`Warning: Output hallucination rate is ${Math.round(hallucinationRate * 100)}%. ` +
                `Monitor Guardian system and review recent outputs.`);
            this.logger.warn('Elevated hallucination rate', {
                rate: hallucinationRate,
                events: this.hallucinationEvents,
                total: this.totalValidations
            });
        }
        // Healthy
        else {
            status.checks.outputAccuracy.status = 'pass';
            status.checks.outputAccuracy.message = this.totalValidations > 0
                ? `${Math.round(averageAccuracy * 100)}% average accuracy`
                : 'No validations yet';
        }
    }
    /**
     * Calculate overall health status
     */
    calculateOverallStatus(status) {
        const checks = Object.values(status.checks);
        // Any 'fail' = critical
        if (checks.some(check => check.status === 'fail')) {
            return 'critical';
        }
        // Any 'warn' = degraded
        if (checks.some(check => check.status === 'warn')) {
            return 'degraded';
        }
        return 'healthy';
    }
    /**
     * Generate health report
     */
    async generateHealthReport() {
        const status = await this.performHealthCheck();
        const report = [];
        report.push('='.repeat(70));
        report.push('🏥 VERSATIL Framework Health Report');
        report.push('='.repeat(70));
        report.push('');
        // Overall status
        const statusIcon = status.overall === 'healthy' ? '✅' :
            status.overall === 'degraded' ? '⚠️' : '❌';
        report.push(`Overall Status: ${statusIcon} ${status.overall.toUpperCase()}`);
        report.push(`Timestamp: ${new Date(status.timestamp).toLocaleString()}`);
        report.push('');
        // Individual checks
        report.push('System Checks:');
        report.push('');
        for (const [name, check] of Object.entries(status.checks)) {
            const icon = check.status === 'pass' ? '✅' :
                check.status === 'warn' ? '⚠️' : '❌';
            const title = name.replace(/([A-Z])/g, ' $1').trim();
            report.push(`  ${icon} ${title.charAt(0).toUpperCase() + title.slice(1)}`);
            report.push(`     Status: ${check.status.toUpperCase()}`);
            report.push(`     Message: ${check.message}`);
            report.push('');
        }
        // Recommendations
        if (status.recommendations.length > 0) {
            report.push('Recommendations:');
            for (const rec of status.recommendations) {
                report.push(`  • ${rec}`);
            }
            report.push('');
        }
        report.push('='.repeat(70));
        return report.join('\n');
    }
    /**
     * Run automated cleanup
     */
    async runAutomatedCleanup() {
        this.logger.info('Running automated cleanup');
        // Cleanup stale repository entries
        const removedRepos = await this.duplicateDetector.cleanupStaleEntries();
        if (removedRepos > 0) {
            this.logger.info('Cleaned up stale repository entries', { count: removedRepos });
        }
        // Additional cleanup tasks can be added here
    }
    /**
     * Shutdown
     */
    shutdown() {
        this.stopMonitoring();
        this.removeAllListeners();
        this.logger.info('Integrated health monitor shut down');
    }
}
// Singleton
let monitorInstance = null;
export function getHealthMonitor() {
    if (!monitorInstance) {
        monitorInstance = new IntegratedHealthMonitor();
    }
    return monitorInstance;
}
export function destroyHealthMonitor() {
    if (monitorInstance) {
        monitorInstance.shutdown();
        monitorInstance = null;
    }
}
//# sourceMappingURL=integrated-health-monitor.js.map