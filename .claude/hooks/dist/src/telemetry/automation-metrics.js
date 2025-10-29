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
    /**
     * Get hook performance statistics (P50, P95, P99)
     */
    getHookPerformance() {
        const events = this.readMetrics();
        const hookEvents = events.filter(e => e.type === 'hook_execution');
        if (hookEvents.length === 0) {
            return {
                totalExecutions: 0,
                avgTime: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                byHookType: {}
            };
        }
        const times = hookEvents
            .map(e => e.data.executionTimeMs)
            .sort((a, b) => a - b);
        const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
        const p50 = times[Math.floor(times.length * 0.5)];
        const p95 = times[Math.floor(times.length * 0.95)];
        const p99 = times[Math.floor(times.length * 0.99)];
        const byHookType = {};
        hookEvents.forEach(event => {
            const hook = event.data;
            if (!byHookType[hook.hookType]) {
                byHookType[hook.hookType] = { count: 0, avgTime: 0 };
            }
            byHookType[hook.hookType].count++;
            byHookType[hook.hookType].avgTime += hook.executionTimeMs;
        });
        Object.keys(byHookType).forEach(type => {
            byHookType[type].avgTime /= byHookType[type].count;
        });
        return { totalExecutions: hookEvents.length, avgTime, p50, p95, p99, byHookType };
    }
    /**
     * Get agent activation statistics
     */
    getAgentActivationStats() {
        const events = this.readMetrics();
        const agentEvents = events.filter(e => e.type === 'agent_activation');
        const totalSuggestions = agentEvents.filter(e => e.data.suggested).length;
        const totalActivations = agentEvents.filter(e => e.data.activated).length;
        const activationRate = totalSuggestions > 0 ? totalActivations / totalSuggestions : 0;
        const byAgent = {};
        agentEvents.forEach(event => {
            const agent = event.data.agent;
            if (!byAgent[agent]) {
                byAgent[agent] = { suggested: 0, activated: 0, rate: 0 };
            }
            if (event.data.suggested)
                byAgent[agent].suggested++;
            if (event.data.activated)
                byAgent[agent].activated++;
        });
        Object.keys(byAgent).forEach(agent => {
            byAgent[agent].rate = byAgent[agent].suggested > 0
                ? byAgent[agent].activated / byAgent[agent].suggested
                : 0;
        });
        return { totalSuggestions, totalActivations, activationRate, byAgent };
    }
    /**
     * Get top patterns by usage
     */
    getTopPatterns(limit = 10) {
        const events = this.readMetrics();
        const templateEvents = events.filter(e => e.type === 'template_application');
        const patternStats = {};
        templateEvents.forEach(event => {
            const template = event.data.template;
            if (!patternStats[template]) {
                patternStats[template] = { suggested: 0, applied: 0 };
            }
            if (event.data.suggested)
                patternStats[template].suggested++;
            if (event.data.applied)
                patternStats[template].applied++;
        });
        const patterns = Object.entries(patternStats)
            .map(([pattern, stats]) => ({
            pattern,
            count: stats.applied,
            successRate: stats.suggested > 0 ? stats.applied / stats.suggested : 0
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        return patterns;
    }
    /**
     * Get cross-skill loading patterns
     */
    getCrossSkillPatterns() {
        const events = this.readMetrics();
        const skillEvents = events.filter(e => e.type === 'cross_skill_loading');
        if (skillEvents.length === 0) {
            return { avgSkillsLoaded: 0, mostCommonCombinations: [] };
        }
        const totalLoaded = skillEvents.reduce((sum, e) => sum + e.data.loadedCount, 0);
        const avgSkillsLoaded = totalLoaded / skillEvents.length;
        const combinations = {};
        skillEvents.forEach(event => {
            const data = event.data;
            const key = `${data.primarySkill}:${data.relatedSkills.join(',')}`;
            if (!combinations[key]) {
                combinations[key] = { primary: data.primarySkill, related: data.relatedSkills, count: 0 };
            }
            combinations[key].count++;
        });
        const mostCommonCombinations = Object.values(combinations)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return { avgSkillsLoaded, mostCommonCombinations };
    }
    /**
     * Generate comprehensive analytics report
     */
    generateAnalyticsReport() {
        const hookPerf = this.getHookPerformance();
        const agentStats = this.getAgentActivationStats();
        const topPatterns = this.getTopPatterns(10);
        const crossSkill = this.getCrossSkillPatterns();
        let report = `# VERSATIL Telemetry Analytics Report\n\n`;
        report += `**Generated**: ${new Date().toISOString()}\n\n`;
        report += `---\n\n`;
        // Hook Performance
        report += `## 🚀 Hook Performance\n\n`;
        report += `- **Total Executions**: ${hookPerf.totalExecutions}\n`;
        report += `- **Average Time**: ${hookPerf.avgTime.toFixed(2)}ms\n`;
        report += `- **P50 Latency**: ${hookPerf.p50.toFixed(2)}ms\n`;
        report += `- **P95 Latency**: ${hookPerf.p95.toFixed(2)}ms\n`;
        report += `- **P99 Latency**: ${hookPerf.p99.toFixed(2)}ms\n\n`;
        report += `### By Hook Type\n\n`;
        Object.entries(hookPerf.byHookType).forEach(([type, stats]) => {
            report += `- **${type}**: ${stats.count} executions, ${stats.avgTime.toFixed(2)}ms avg\n`;
        });
        report += `\n`;
        // Agent Activation
        report += `## 🤖 Agent Auto-Activation\n\n`;
        report += `- **Total Suggestions**: ${agentStats.totalSuggestions}\n`;
        report += `- **Total Activations**: ${agentStats.totalActivations}\n`;
        report += `- **Activation Rate**: ${(agentStats.activationRate * 100).toFixed(1)}%\n\n`;
        report += `### By Agent\n\n`;
        Object.entries(agentStats.byAgent)
            .sort((a, b) => b[1].suggested - a[1].suggested)
            .forEach(([agent, stats]) => {
            report += `- **${agent}**: ${stats.activated}/${stats.suggested} (${(stats.rate * 100).toFixed(1)}%)\n`;
        });
        report += `\n`;
        // Top Patterns
        report += `## 📊 Top 10 Patterns\n\n`;
        if (topPatterns.length > 0) {
            topPatterns.forEach((pattern, index) => {
                report += `${index + 1}. **${pattern.pattern}**: ${pattern.count} uses, ${(pattern.successRate * 100).toFixed(1)}% success rate\n`;
            });
        }
        else {
            report += `_No pattern usage data available yet_\n`;
        }
        report += `\n`;
        // Cross-Skill Loading
        report += `## 🔗 Cross-Skill Loading\n\n`;
        report += `- **Avg Skills Loaded**: ${crossSkill.avgSkillsLoaded.toFixed(1)}\n\n`;
        if (crossSkill.mostCommonCombinations.length > 0) {
            report += `### Most Common Combinations\n\n`;
            crossSkill.mostCommonCombinations.forEach((combo, index) => {
                report += `${index + 1}. **${combo.primary}** → [${combo.related.join(', ')}] (${combo.count}x)\n`;
            });
        }
        report += `\n`;
        report += `---\n\n`;
        report += `**Data Source**: \`.versatil/telemetry/metrics.json\`\n`;
        return report;
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
