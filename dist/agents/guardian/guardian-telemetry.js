/**
 * VERSATIL SDLC Framework - Guardian Telemetry Integration
 * Feeds and consumes metrics for Guardian analytics
 *
 * Integrates with:
 * - AutomationMetrics (src/telemetry/automation-metrics.ts)
 * - GuardianLogger (logging)
 * - RAG Learning Store (pattern reuse metrics)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
/**
 * Guardian Telemetry Service
 */
export class GuardianTelemetry {
    constructor() {
        const versatilHome = path.join(os.homedir(), '.versatil');
        const telemetryDir = path.join(versatilHome, 'telemetry', 'guardian');
        if (!fs.existsSync(telemetryDir)) {
            fs.mkdirSync(telemetryDir, { recursive: true });
        }
        this.metricsFile = path.join(telemetryDir, 'metrics.json');
        this.eventsFile = path.join(telemetryDir, 'events.jsonl');
    }
    static getInstance() {
        if (!GuardianTelemetry.instance) {
            GuardianTelemetry.instance = new GuardianTelemetry();
        }
        return GuardianTelemetry.instance;
    }
    /**
     * Record telemetry event
     */
    recordEvent(event) {
        // Append to events file (JSONL)
        fs.appendFileSync(this.eventsFile, JSON.stringify(event) + '\n');
        // Update aggregated metrics
        this.updateMetrics(event);
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        if (!fs.existsSync(this.metricsFile)) {
            return this.getDefaultMetrics();
        }
        try {
            return JSON.parse(fs.readFileSync(this.metricsFile, 'utf-8'));
        }
        catch (error) {
            return this.getDefaultMetrics();
        }
    }
    /**
     * Get metrics for time period
     */
    getMetricsForPeriod(startDate, endDate) {
        if (!fs.existsSync(this.eventsFile)) {
            return this.getDefaultMetrics();
        }
        const lines = fs.readFileSync(this.eventsFile, 'utf-8').trim().split('\n');
        const events = lines
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
            .filter(event => {
            const eventTime = new Date(event.timestamp).getTime();
            return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
        });
        return this.calculateMetricsFromEvents(events, startDate, endDate);
    }
    /**
     * Get recent events
     */
    getRecentEvents(limit = 100) {
        if (!fs.existsSync(this.eventsFile)) {
            return [];
        }
        const lines = fs.readFileSync(this.eventsFile, 'utf-8').trim().split('\n');
        const events = lines
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        return events.slice(-limit);
    }
    /**
     * Export metrics to automation-metrics format
     */
    exportToAutomationMetrics() {
        const metrics = this.getMetrics();
        const total_operations = metrics.health_checks_performed +
            metrics.auto_fixes_attempted +
            metrics.agent_activations_tracked;
        const successful_operations = metrics.health_checks_passed +
            metrics.auto_fixes_successful +
            (metrics.agent_activations_tracked - metrics.agent_failures_detected);
        const success_rate = total_operations > 0
            ? Math.round((successful_operations / total_operations) * 100)
            : 0;
        const total_duration = metrics.avg_health_check_duration_ms * metrics.health_checks_performed +
            metrics.avg_auto_fix_duration_ms * metrics.auto_fixes_attempted +
            metrics.avg_agent_duration_ms * metrics.agent_activations_tracked;
        const avg_duration_ms = total_operations > 0
            ? Math.round(total_duration / total_operations)
            : 0;
        return {
            guardian_health_checks: metrics.health_checks_performed,
            guardian_auto_fixes: metrics.auto_fixes_successful,
            guardian_success_rate: success_rate,
            guardian_avg_duration_ms: avg_duration_ms
        };
    }
    /**
     * Clear old events (keep last 30 days)
     */
    clearOldEvents() {
        if (!fs.existsSync(this.eventsFile)) {
            return 0;
        }
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const lines = fs.readFileSync(this.eventsFile, 'utf-8').trim().split('\n');
        const events = lines
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        const recentEvents = events.filter(event => {
            return new Date(event.timestamp).getTime() > thirtyDaysAgo;
        });
        const removedCount = events.length - recentEvents.length;
        // Rewrite file with only recent events
        fs.writeFileSync(this.eventsFile, recentEvents.map(e => JSON.stringify(e)).join('\n') + '\n');
        return removedCount;
    }
    /**
     * Private methods
     */
    updateMetrics(event) {
        const metrics = this.getMetrics();
        // Update based on event type
        switch (event.type) {
            case 'health_check':
                metrics.health_checks_performed += 1;
                if (event.success) {
                    metrics.health_checks_passed += 1;
                }
                else {
                    metrics.health_checks_failed += 1;
                }
                metrics.avg_health_check_duration_ms = this.updateAverage(metrics.avg_health_check_duration_ms, event.duration_ms, metrics.health_checks_performed);
                break;
            case 'auto_fix':
                metrics.auto_fixes_attempted += 1;
                if (event.success) {
                    metrics.auto_fixes_successful += 1;
                }
                metrics.auto_fix_success_rate = Math.round((metrics.auto_fixes_successful / metrics.auto_fixes_attempted) * 100);
                metrics.avg_auto_fix_duration_ms = this.updateAverage(metrics.avg_auto_fix_duration_ms, event.duration_ms, metrics.auto_fixes_attempted);
                break;
            case 'agent_activation':
                metrics.agent_activations_tracked += 1;
                if (!event.success) {
                    metrics.agent_failures_detected += 1;
                }
                metrics.agent_success_rate = Math.round(((metrics.agent_activations_tracked - metrics.agent_failures_detected) /
                    metrics.agent_activations_tracked) *
                    100);
                metrics.avg_agent_duration_ms = this.updateAverage(metrics.avg_agent_duration_ms, event.duration_ms, metrics.agent_activations_tracked);
                break;
            case 'learning_stored':
                metrics.learnings_stored += 1;
                break;
            case 'learning_reused':
                metrics.learnings_reused += 1;
                break;
        }
        // Update context counters
        if (event.context === 'FRAMEWORK_CONTEXT') {
            metrics.framework_context_operations += 1;
        }
        else if (event.context === 'PROJECT_CONTEXT') {
            metrics.project_context_operations += 1;
        }
        // Update time period
        metrics.period_end = event.timestamp;
        // Save updated metrics
        fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
    }
    updateAverage(currentAvg, newValue, count) {
        return Math.round(((currentAvg * (count - 1)) + newValue) / count);
    }
    getDefaultMetrics() {
        return {
            health_checks_performed: 0,
            health_checks_passed: 0,
            health_checks_failed: 0,
            avg_health_check_duration_ms: 0,
            issues_detected: 0,
            auto_fixes_attempted: 0,
            auto_fixes_successful: 0,
            auto_fix_success_rate: 0,
            avg_auto_fix_duration_ms: 0,
            agent_activations_tracked: 0,
            agent_failures_detected: 0,
            agent_success_rate: 0,
            avg_agent_duration_ms: 0,
            learnings_stored: 0,
            learnings_reused: 0,
            avg_learning_success_rate: 0,
            framework_context_operations: 0,
            project_context_operations: 0,
            period_start: new Date().toISOString(),
            period_end: new Date().toISOString(),
            total_uptime_ms: 0
        };
    }
    calculateMetricsFromEvents(events, startDate, endDate) {
        const metrics = this.getDefaultMetrics();
        metrics.period_start = startDate.toISOString();
        metrics.period_end = endDate.toISOString();
        events.forEach(event => {
            switch (event.type) {
                case 'health_check':
                    metrics.health_checks_performed += 1;
                    if (event.success)
                        metrics.health_checks_passed += 1;
                    else
                        metrics.health_checks_failed += 1;
                    break;
                case 'auto_fix':
                    metrics.auto_fixes_attempted += 1;
                    if (event.success)
                        metrics.auto_fixes_successful += 1;
                    break;
                case 'agent_activation':
                    metrics.agent_activations_tracked += 1;
                    if (!event.success)
                        metrics.agent_failures_detected += 1;
                    break;
                case 'learning_stored':
                    metrics.learnings_stored += 1;
                    break;
                case 'learning_reused':
                    metrics.learnings_reused += 1;
                    break;
            }
            if (event.context === 'FRAMEWORK_CONTEXT') {
                metrics.framework_context_operations += 1;
            }
            else if (event.context === 'PROJECT_CONTEXT') {
                metrics.project_context_operations += 1;
            }
        });
        // Calculate rates
        if (metrics.auto_fixes_attempted > 0) {
            metrics.auto_fix_success_rate = Math.round((metrics.auto_fixes_successful / metrics.auto_fixes_attempted) * 100);
        }
        if (metrics.agent_activations_tracked > 0) {
            metrics.agent_success_rate = Math.round(((metrics.agent_activations_tracked - metrics.agent_failures_detected) /
                metrics.agent_activations_tracked) *
                100);
        }
        return metrics;
    }
}
GuardianTelemetry.instance = null;
/**
 * Singleton instance
 */
export const guardianTelemetry = GuardianTelemetry.getInstance();
//# sourceMappingURL=guardian-telemetry.js.map