"use strict";
/**
 * Automation Metrics Telemetry (v7.2.0)
 *
 * Tracks automation usage metrics to measure effectiveness:
 * - Hook execution frequency and performance
 * - Agent auto-activation success rate
 * - Template auto-application rate
 * - Cross-skill loading patterns
 * - Context injection performance
 *
 * Metrics stored in: .versatil/telemetry/metrics.json (append-only log)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationMetricsService = void 0;
exports.getMetricsService = getMetricsService;
const fs_1 = require("fs");
const path_1 = require("path");
class AutomationMetricsService {
    constructor(workingDirectory) {
        this.telemetryDir = (0, path_1.join)(workingDirectory, '.versatil', 'telemetry');
        this.metricsFile = (0, path_1.join)(this.telemetryDir, 'metrics.json');
        this.ensureTelemetryDir();
    }
    ensureTelemetryDir() {
        if (!(0, fs_1.existsSync)(this.telemetryDir)) {
            (0, fs_1.mkdirSync)(this.telemetryDir, { recursive: true });
        }
        if (!(0, fs_1.existsSync)(this.metricsFile)) {
            (0, fs_1.writeFileSync)(this.metricsFile, '', 'utf-8');
        }
    }
    /**
     * Track hook execution performance
     */
    trackHookExecution(metric) {
        this.writeMetric({ type: 'hook_execution', data: metric });
    }
    /**
     * Track agent auto-activation success/failure
     */
    trackAgentActivation(metric) {
        this.writeMetric({ type: 'agent_activation', data: metric });
    }
    /**
     * Track template auto-application success/failure
     */
    trackTemplateApplication(metric) {
        this.writeMetric({ type: 'template_application', data: metric });
    }
    /**
     * Track cross-skill loading patterns
     */
    trackCrossSkillLoading(metric) {
        this.writeMetric({ type: 'cross_skill_loading', data: metric });
    }
    /**
     * Track context injection performance
     */
    trackContextInjection(metric) {
        this.writeMetric({ type: 'context_injection', data: metric });
    }
    /**
     * Write metric to append-only log
     */
    writeMetric(event) {
        const logEntry = JSON.stringify(event) + '\n';
        try {
            (0, fs_1.appendFileSync)(this.metricsFile, logEntry, 'utf-8');
        }
        catch (err) {
            console.error(`Failed to write metric: ${err}`);
        }
    }
    /**
     * Get metrics summary for a session
     */
    getSessionMetrics(sessionId) {
        const lines = this.readMetrics();
        const sessionMetrics = lines.filter((event) => 'sessionId' in event.data && event.data.sessionId === sessionId);
        const hookExecutions = sessionMetrics.filter((e) => e.type === 'hook_execution');
        const agentActivations = sessionMetrics.filter((e) => e.type === 'agent_activation');
        const templateApplications = sessionMetrics.filter((e) => e.type === 'template_application');
        const crossSkillLoadings = sessionMetrics.filter((e) => e.type === 'cross_skill_loading');
        const contextInjections = sessionMetrics.filter((e) => e.type === 'context_injection');
        const avgHookExecutionTime = hookExecutions.length > 0
            ? hookExecutions.reduce((sum, e) => sum + e.data.executionTimeMs, 0) /
                hookExecutions.length
            : 0;
        const agentActivationRate = agentActivations.length > 0
            ? agentActivations.filter((e) => e.data.activated).length /
                agentActivations.filter((e) => e.data.suggested).length
            : 0;
        const templateApplicationRate = templateApplications.length > 0
            ? templateApplications.filter((e) => e.data.applied).length /
                templateApplications.filter((e) => e.data.suggested).length
            : 0;
        const crossSkillLoadingAvg = crossSkillLoadings.length > 0
            ? crossSkillLoadings.reduce((sum, e) => sum + e.data.loadedCount, 0) /
                crossSkillLoadings.length
            : 0;
        return {
            hookExecutions: hookExecutions.length,
            avgHookExecutionTime,
            agentActivationRate,
            templateApplicationRate,
            crossSkillLoadingAvg,
            contextInjectionsCount: contextInjections.length
        };
    }
    /**
     * Get all metrics (for dashboard/analysis)
     */
    getAllMetrics() {
        return this.readMetrics();
    }
    /**
     * Read metrics from file (parse JSONL)
     */
    readMetrics() {
        try {
            const content = (0, fs_1.readFileSync)(this.metricsFile, 'utf-8');
            return content
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line) => JSON.parse(line));
        }
        catch (err) {
            return [];
        }
    }
    /**
     * Generate summary report (for CLI output)
     */
    generateReport(sessionId) {
        const metrics = sessionId
            ? [this.getSessionMetrics(sessionId)]
            : [this.getSessionMetrics('all')]; // TODO: Implement global summary
        if (!sessionId) {
            return 'Global metrics not yet implemented. Provide sessionId for session-specific metrics.';
        }
        const m = metrics[0];
        return `
# Automation Metrics Report

**Session**: ${sessionId}

## Hook Performance
- **Total Executions**: ${m.hookExecutions}
- **Avg Execution Time**: ${m.avgHookExecutionTime.toFixed(2)}ms

## Automation Success Rates
- **Agent Activation Rate**: ${(m.agentActivationRate * 100).toFixed(1)}%
- **Template Application Rate**: ${(m.templateApplicationRate * 100).toFixed(1)}%

## Context Injection
- **Cross-Skill Loading (Avg)**: ${m.crossSkillLoadingAvg.toFixed(1)} related skills
- **Total Context Injections**: ${m.contextInjectionsCount}

---
**Metrics stored in**: .versatil/telemetry/metrics.json
    `.trim();
    }
}
exports.AutomationMetricsService = AutomationMetricsService;
/**
 * Singleton instance (hook-callable)
 */
let metricsServiceInstance = null;
function getMetricsService(workingDirectory) {
    if (!metricsServiceInstance) {
        metricsServiceInstance = new AutomationMetricsService(workingDirectory);
    }
    return metricsServiceInstance;
}
/**
 * CLI usage example:
 *
 * import { getMetricsService } from './telemetry/automation-metrics.js';
 *
 * const service = getMetricsService(process.cwd());
 * console.log(service.generateReport('session-abc123'));
 */
