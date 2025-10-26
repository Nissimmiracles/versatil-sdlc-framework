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
