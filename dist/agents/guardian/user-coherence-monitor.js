/**
 * User Coherence Monitor - Guardian Module for User Projects
 *
 * Proactive health monitoring for users of VERSATIL framework
 * (not framework developers - that's handled by Guardian's core modules)
 *
 * PROJECT_CONTEXT ONLY - This module only operates in user projects
 *
 * Responsibilities:
 * - Automatic update notifications (weekly check)
 * - Installation drift detection (files modified/missing)
 * - Proactive issue warnings (before they cause failures)
 * - Auto-remediation suggestions
 * - Health trend analysis
 *
 * Integration:
 * - Called by Guardian.performHealthCheck() in PROJECT_CONTEXT
 * - Logs to ~/.versatil/logs/guardian/user-coherence-*.log
 * - Uses UserCoherenceCheckService for health validation
 *
 * @version 7.9.0
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { getUserCoherenceCheckService } from '../../coherence/user-coherence-check.js';
import { VERSATILLogger } from '../../utils/logger.js';
/**
 * User Coherence Monitor
 */
export class UserCoherenceMonitor {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.logger = VERSATILLogger.getInstance();
        // Default configuration
        this.config = {
            check_interval_hours: 24,
            notify_on_updates: true,
            notify_on_issues: true,
            auto_fix_threshold: 90,
            enable_trend_analysis: true
        };
        // State files
        const stateDir = join(projectRoot, '.versatil', 'state');
        this.lastCheckFile = join(stateDir, 'last-coherence-check.json');
        this.trendsFile = join(stateDir, 'coherence-trends.json');
    }
    static getInstance(projectRoot) {
        if (!UserCoherenceMonitor.instance) {
            UserCoherenceMonitor.instance = new UserCoherenceMonitor(projectRoot);
        }
        return UserCoherenceMonitor.instance;
    }
    /**
     * Configure monitoring
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        this.logger.info('User coherence monitor configured', { config: this.config });
    }
    /**
     * Check if health check is due
     */
    async isCheckDue() {
        try {
            const lastCheck = await this.loadLastCheck();
            if (!lastCheck)
                return true;
            const lastCheckTime = new Date(lastCheck.timestamp).getTime();
            const now = Date.now();
            const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);
            return hoursSinceLastCheck >= this.config.check_interval_hours;
        }
        catch (error) {
            this.logger.warn('Failed to check if health check is due', { error });
            return true; // Default to check if unable to determine
        }
    }
    /**
     * Perform health check and monitoring
     */
    async performMonitoring() {
        this.logger.info('Starting user coherence monitoring');
        const startTime = Date.now();
        try {
            // Check if check is due
            const isDue = await this.isCheckDue();
            if (!isDue) {
                this.logger.debug('Health check not due yet, loading cached result');
                const lastCheck = await this.loadLastCheck();
                if (lastCheck) {
                    return this.createReportFromCache(lastCheck);
                }
            }
            // Perform health check
            const coherenceService = getUserCoherenceCheckService(this.projectRoot);
            const healthCheck = await coherenceService.performCoherenceCheck(false);
            // Store check result
            await this.storeCheck(healthCheck);
            // Update trends
            if (this.config.enable_trend_analysis) {
                await this.updateTrends(healthCheck);
            }
            // Generate notifications
            const notifications = await this.generateNotifications(healthCheck);
            // Apply auto-remediations if available
            let auto_remediations_applied = 0;
            if (healthCheck.auto_fixes_available.length > 0) {
                auto_remediations_applied = await this.applyAutoRemediations(healthCheck, coherenceService);
            }
            // Load trends
            const trends = await this.loadTrends();
            // Calculate next check time
            const nextCheckTime = new Date(Date.now() + this.config.check_interval_hours * 60 * 60 * 1000).toISOString();
            const duration = Date.now() - startTime;
            this.logger.info('User coherence monitoring completed', {
                duration_ms: duration,
                overall_health: healthCheck.overall_health,
                issues: healthCheck.issues.length,
                notifications: notifications.length,
                auto_remediations: auto_remediations_applied
            });
            return {
                current_health: healthCheck,
                last_check_time: healthCheck.timestamp,
                next_check_time: nextCheckTime,
                trends,
                notifications,
                auto_remediations_applied
            };
        }
        catch (error) {
            this.logger.error('User coherence monitoring failed', { error });
            throw error;
        }
    }
    /**
     * Generate notifications based on health check
     */
    async generateNotifications(healthCheck) {
        const notifications = [];
        // Update notifications
        if (this.config.notify_on_updates && healthCheck.checks.version.status !== 'up_to_date') {
            const versionCheck = healthCheck.checks.version;
            if (versionCheck.status === 'major_available') {
                notifications.push(`🔔 Major update available: v${versionCheck.latest_version} (you have v${versionCheck.installed_version})`);
                notifications.push('   Review breaking changes before updating');
            }
            else if (versionCheck.status === 'minor_available') {
                notifications.push(`🔔 Minor update available: v${versionCheck.latest_version} (you have v${versionCheck.installed_version})`);
                notifications.push('   Update recommended for new features and bug fixes');
            }
            else if (versionCheck.status === 'patch_available') {
                notifications.push(`🔔 Patch update available: v${versionCheck.latest_version} (you have v${versionCheck.installed_version})`);
            }
        }
        // Issue notifications
        if (this.config.notify_on_issues && healthCheck.issues.length > 0) {
            const criticalIssues = healthCheck.issues.filter((i) => i.severity === 'critical');
            const highIssues = healthCheck.issues.filter((i) => i.severity === 'high');
            if (criticalIssues.length > 0) {
                notifications.push(`⚠️ ${criticalIssues.length} critical issue(s) detected`);
                for (const issue of criticalIssues) {
                    notifications.push(`   - ${issue.description}`);
                }
            }
            if (highIssues.length > 0) {
                notifications.push(`⚠️ ${highIssues.length} high-priority issue(s) detected`);
                for (const issue of highIssues) {
                    notifications.push(`   - ${issue.description}`);
                }
            }
        }
        // Health degradation notification
        if (healthCheck.overall_health < 75) {
            notifications.push(`⚠️ Framework health degraded: ${healthCheck.overall_health}/100 (${healthCheck.status})`);
            notifications.push('   Run `/coherence` or `npx versatil doctor` for details');
        }
        return notifications;
    }
    /**
     * Apply auto-remediations
     */
    async applyAutoRemediations(healthCheck, coherenceService) {
        // Filter fixes by confidence threshold
        const highConfidenceFixes = healthCheck.auto_fixes_available.filter((fix) => fix.confidence >= this.config.auto_fix_threshold);
        if (highConfidenceFixes.length === 0) {
            this.logger.debug('No high-confidence auto-fixes available');
            return 0;
        }
        this.logger.info('Applying auto-remediations', {
            count: highConfidenceFixes.length,
            confidence_threshold: this.config.auto_fix_threshold
        });
        try {
            const result = await coherenceService.applyAutoFixes(highConfidenceFixes);
            const successCount = result.results.filter((r) => r.startsWith('✅')).length;
            this.logger.info('Auto-remediations applied', {
                attempted: highConfidenceFixes.length,
                succeeded: successCount,
                failed: highConfidenceFixes.length - successCount
            });
            return successCount;
        }
        catch (error) {
            this.logger.error('Failed to apply auto-remediations', { error });
            return 0;
        }
    }
    /**
     * Update trends
     */
    async updateTrends(healthCheck) {
        try {
            const trends = await this.loadTrends();
            // Calculate version behind metric
            const versionCheck = healthCheck.checks.version;
            const version_behind_by = versionCheck.behind_by.major * 100 +
                versionCheck.behind_by.minor * 10 +
                versionCheck.behind_by.patch;
            // Add new trend data
            const newTrend = {
                timestamp: healthCheck.timestamp,
                overall_health: healthCheck.overall_health,
                issues_detected: healthCheck.issues.length,
                issues_fixed: healthCheck.auto_fixes_available.filter((f) => f.confidence >= 90).length,
                version_behind_by
            };
            trends.push(newTrend);
            // Keep only last 30 days of trends
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const recentTrends = trends.filter((t) => new Date(t.timestamp).getTime() >= thirtyDaysAgo);
            await this.storeTrends(recentTrends);
        }
        catch (error) {
            this.logger.warn('Failed to update trends', { error });
        }
    }
    /**
     * Store check result
     */
    async storeCheck(healthCheck) {
        try {
            await fs.mkdir(join(this.projectRoot, '.versatil', 'state'), { recursive: true });
            await fs.writeFile(this.lastCheckFile, JSON.stringify(healthCheck, null, 2));
        }
        catch (error) {
            this.logger.warn('Failed to store check result', { error });
        }
    }
    /**
     * Load last check result
     */
    async loadLastCheck() {
        try {
            const data = await fs.readFile(this.lastCheckFile, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Store trends
     */
    async storeTrends(trends) {
        try {
            await fs.mkdir(join(this.projectRoot, '.versatil', 'state'), { recursive: true });
            await fs.writeFile(this.trendsFile, JSON.stringify(trends, null, 2));
        }
        catch (error) {
            this.logger.warn('Failed to store trends', { error });
        }
    }
    /**
     * Load trends
     */
    async loadTrends() {
        try {
            const data = await fs.readFile(this.trendsFile, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Create report from cached check
     */
    async createReportFromCache(healthCheck) {
        const trends = await this.loadTrends();
        const nextCheckTime = new Date(new Date(healthCheck.timestamp).getTime() + this.config.check_interval_hours * 60 * 60 * 1000).toISOString();
        return {
            current_health: healthCheck,
            last_check_time: healthCheck.timestamp,
            next_check_time: nextCheckTime,
            trends,
            notifications: [],
            auto_remediations_applied: 0
        };
    }
    /**
     * Get health trend analysis
     */
    async getHealthTrends() {
        const trends = await this.loadTrends();
        if (trends.length === 0) {
            return {
                current_health: 100,
                avg_health_7d: 100,
                avg_health_30d: 100,
                trend: 'stable',
                issues_resolved_7d: 0,
                issues_detected_7d: 0
            };
        }
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        // Calculate averages
        const last7Days = trends.filter((t) => new Date(t.timestamp).getTime() >= sevenDaysAgo);
        const last30Days = trends.filter((t) => new Date(t.timestamp).getTime() >= thirtyDaysAgo);
        const avg_health_7d = last7Days.length > 0
            ? Math.round(last7Days.reduce((sum, t) => sum + t.overall_health, 0) / last7Days.length)
            : 100;
        const avg_health_30d = last30Days.length > 0
            ? Math.round(last30Days.reduce((sum, t) => sum + t.overall_health, 0) / last30Days.length)
            : 100;
        // Calculate trend
        let trend = 'stable';
        if (last7Days.length >= 2) {
            const firstHealth = last7Days[0].overall_health;
            const lastHealth = last7Days[last7Days.length - 1].overall_health;
            const diff = lastHealth - firstHealth;
            if (diff > 5)
                trend = 'improving';
            else if (diff < -5)
                trend = 'degrading';
        }
        // Count issues
        const issues_detected_7d = last7Days.reduce((sum, t) => sum + t.issues_detected, 0);
        const issues_resolved_7d = last7Days.reduce((sum, t) => sum + t.issues_fixed, 0);
        return {
            current_health: trends[trends.length - 1].overall_health,
            avg_health_7d,
            avg_health_30d,
            trend,
            issues_resolved_7d,
            issues_detected_7d
        };
    }
}
/**
 * Get User Coherence Monitor instance
 */
export function getUserCoherenceMonitor(projectRoot) {
    return UserCoherenceMonitor.getInstance(projectRoot);
}
//# sourceMappingURL=user-coherence-monitor.js.map