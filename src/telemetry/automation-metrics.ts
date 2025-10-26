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

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface HookExecutionMetric {
  timestamp: string;
  hookType: 'PostToolUse' | 'SubagentStop' | 'Stop' | 'UserPromptSubmit';
  hookName: string;
  executionTimeMs: number;
  exitCode: number;
  outputSize: number;
  sessionId: string;
}

export interface AgentActivationMetric {
  timestamp: string;
  agent: string;
  suggested: boolean; // Was agent suggested by hook?
  activated: boolean; // Was agent actually invoked via Task tool?
  autoActivate: boolean; // Was autoActivate flag set?
  sessionId: string;
  trigger?: string; // What triggered the suggestion (e.g., 'file-edit', 'intent-detection')
}

export interface TemplateApplicationMetric {
  timestamp: string;
  template: string;
  suggested: boolean; // Was template suggested by hook?
  applied: boolean; // Was template actually applied?
  autoApply: boolean; // Was autoApply flag set?
  sessionId: string;
  filePattern?: string; // Pattern that triggered suggestion (e.g., '*.test.ts')
}

export interface CrossSkillLoadingMetric {
  timestamp: string;
  primarySkill: string;
  relatedSkills: string[];
  loadedCount: number; // How many related skills were actually loaded?
  sessionId: string;
}

export interface ContextInjectionMetric {
  timestamp: string;
  source: 'intent-detection' | 'pattern-search' | 'cross-skill' | 'library-context';
  itemsInjected: number;
  injectionTimeMs: number;
  sessionId: string;
}

type MetricEvent =
  | { type: 'hook_execution'; data: HookExecutionMetric }
  | { type: 'agent_activation'; data: AgentActivationMetric }
  | { type: 'template_application'; data: TemplateApplicationMetric }
  | { type: 'cross_skill_loading'; data: CrossSkillLoadingMetric }
  | { type: 'context_injection'; data: ContextInjectionMetric };

export class AutomationMetricsService {
  private metricsFile: string;
  private telemetryDir: string;

  constructor(workingDirectory: string) {
    this.telemetryDir = join(workingDirectory, '.versatil', 'telemetry');
    this.metricsFile = join(this.telemetryDir, 'metrics.json');
    this.ensureTelemetryDir();
  }

  private ensureTelemetryDir(): void {
    if (!existsSync(this.telemetryDir)) {
      mkdirSync(this.telemetryDir, { recursive: true });
    }
    if (!existsSync(this.metricsFile)) {
      writeFileSync(this.metricsFile, '', 'utf-8');
    }
  }

  /**
   * Track hook execution performance
   */
  trackHookExecution(metric: HookExecutionMetric): void {
    this.writeMetric({ type: 'hook_execution', data: metric });
  }

  /**
   * Track agent auto-activation success/failure
   */
  trackAgentActivation(metric: AgentActivationMetric): void {
    this.writeMetric({ type: 'agent_activation', data: metric });
  }

  /**
   * Track template auto-application success/failure
   */
  trackTemplateApplication(metric: TemplateApplicationMetric): void {
    this.writeMetric({ type: 'template_application', data: metric });
  }

  /**
   * Track cross-skill loading patterns
   */
  trackCrossSkillLoading(metric: CrossSkillLoadingMetric): void {
    this.writeMetric({ type: 'cross_skill_loading', data: metric });
  }

  /**
   * Track context injection performance
   */
  trackContextInjection(metric: ContextInjectionMetric): void {
    this.writeMetric({ type: 'context_injection', data: metric });
  }

  /**
   * Write metric to append-only log
   */
  private writeMetric(event: MetricEvent): void {
    const logEntry = JSON.stringify(event) + '\n';
    try {
      appendFileSync(this.metricsFile, logEntry, 'utf-8');
    } catch (err) {
      console.error(`Failed to write metric: ${err}`);
    }
  }

  /**
   * Get metrics summary for a session
   */
  getSessionMetrics(sessionId: string): {
    hookExecutions: number;
    avgHookExecutionTime: number;
    agentActivationRate: number; // suggested → activated
    templateApplicationRate: number; // suggested → applied
    crossSkillLoadingAvg: number; // avg related skills loaded
    contextInjectionsCount: number;
  } {
    const lines = this.readMetrics();
    const sessionMetrics = lines.filter(
      (event) => 'sessionId' in event.data && event.data.sessionId === sessionId
    );

    const hookExecutions = sessionMetrics.filter((e) => e.type === 'hook_execution');
    const agentActivations = sessionMetrics.filter((e) => e.type === 'agent_activation');
    const templateApplications = sessionMetrics.filter((e) => e.type === 'template_application');
    const crossSkillLoadings = sessionMetrics.filter((e) => e.type === 'cross_skill_loading');
    const contextInjections = sessionMetrics.filter((e) => e.type === 'context_injection');

    const avgHookExecutionTime =
      hookExecutions.length > 0
        ? hookExecutions.reduce((sum, e) => sum + (e.data as HookExecutionMetric).executionTimeMs, 0) /
          hookExecutions.length
        : 0;

    const agentActivationRate =
      agentActivations.length > 0
        ? agentActivations.filter((e) => (e.data as AgentActivationMetric).activated).length /
          agentActivations.filter((e) => (e.data as AgentActivationMetric).suggested).length
        : 0;

    const templateApplicationRate =
      templateApplications.length > 0
        ? templateApplications.filter((e) => (e.data as TemplateApplicationMetric).applied).length /
          templateApplications.filter((e) => (e.data as TemplateApplicationMetric).suggested).length
        : 0;

    const crossSkillLoadingAvg =
      crossSkillLoadings.length > 0
        ? crossSkillLoadings.reduce((sum, e) => sum + (e.data as CrossSkillLoadingMetric).loadedCount, 0) /
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
  getAllMetrics(): MetricEvent[] {
    return this.readMetrics();
  }

  /**
   * Read metrics from file (parse JSONL)
   */
  private readMetrics(): MetricEvent[] {
    try {
      const content = readFileSync(this.metricsFile, 'utf-8');
      return content
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as MetricEvent);
    } catch (err) {
      return [];
    }
  }

  /**
   * Generate summary report (for CLI output)
   */
  generateReport(sessionId?: string): string {
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
  getHookPerformance(): {
    totalExecutions: number;
    avgTime: number;
    p50: number;
    p95: number;
    p99: number;
    byHookType: Record<string, { count: number; avgTime: number }>;
  } {
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
      .map(e => (e.data as HookExecutionMetric).executionTimeMs)
      .sort((a, b) => a - b);

    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    const byHookType: Record<string, { count: number; avgTime: number }> = {};
    hookEvents.forEach(event => {
      const hook = event.data as HookExecutionMetric;
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
  getAgentActivationStats(): {
    totalSuggestions: number;
    totalActivations: number;
    activationRate: number;
    byAgent: Record<string, { suggested: number; activated: number; rate: number }>;
  } {
    const events = this.readMetrics();
    const agentEvents = events.filter(e => e.type === 'agent_activation');

    const totalSuggestions = agentEvents.filter(e => (e.data as AgentActivationMetric).suggested).length;
    const totalActivations = agentEvents.filter(e => (e.data as AgentActivationMetric).activated).length;
    const activationRate = totalSuggestions > 0 ? totalActivations / totalSuggestions : 0;

    const byAgent: Record<string, { suggested: number; activated: number; rate: number }> = {};
    agentEvents.forEach(event => {
      const agent = (event.data as AgentActivationMetric).agent;
      if (!byAgent[agent]) {
        byAgent[agent] = { suggested: 0, activated: 0, rate: 0 };
      }
      if ((event.data as AgentActivationMetric).suggested) byAgent[agent].suggested++;
      if ((event.data as AgentActivationMetric).activated) byAgent[agent].activated++;
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
  getTopPatterns(limit = 10): Array<{ pattern: string; count: number; successRate: number }> {
    const events = this.readMetrics();
    const templateEvents = events.filter(e => e.type === 'template_application');

    const patternStats: Record<string, { suggested: number; applied: number }> = {};

    templateEvents.forEach(event => {
      const template = (event.data as TemplateApplicationMetric).template;
      if (!patternStats[template]) {
        patternStats[template] = { suggested: 0, applied: 0 };
      }
      if ((event.data as TemplateApplicationMetric).suggested) patternStats[template].suggested++;
      if ((event.data as TemplateApplicationMetric).applied) patternStats[template].applied++;
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
  getCrossSkillPatterns(): {
    avgSkillsLoaded: number;
    mostCommonCombinations: Array<{ primary: string; related: string[]; count: number }>;
  } {
    const events = this.readMetrics();
    const skillEvents = events.filter(e => e.type === 'cross_skill_loading');

    if (skillEvents.length === 0) {
      return { avgSkillsLoaded: 0, mostCommonCombinations: [] };
    }

    const totalLoaded = skillEvents.reduce(
      (sum, e) => sum + (e.data as CrossSkillLoadingMetric).loadedCount,
      0
    );
    const avgSkillsLoaded = totalLoaded / skillEvents.length;

    const combinations: Record<string, { primary: string; related: string[]; count: number }> = {};
    skillEvents.forEach(event => {
      const data = event.data as CrossSkillLoadingMetric;
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
  generateAnalyticsReport(): string {
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
    } else {
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

/**
 * Singleton instance (hook-callable)
 */
let metricsServiceInstance: AutomationMetricsService | null = null;

export function getMetricsService(workingDirectory: string): AutomationMetricsService {
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
