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

export interface GuardianMetrics {
  // Health Check Metrics
  health_checks_performed: number;
  health_checks_passed: number;
  health_checks_failed: number;
  avg_health_check_duration_ms: number;

  // Auto-Remediation Metrics
  issues_detected: number;
  auto_fixes_attempted: number;
  auto_fixes_successful: number;
  auto_fix_success_rate: number;
  avg_auto_fix_duration_ms: number;

  // Agent Coordination Metrics
  agent_activations_tracked: number;
  agent_failures_detected: number;
  agent_success_rate: number;
  avg_agent_duration_ms: number;

  // RAG Learning Metrics
  learnings_stored: number;
  learnings_reused: number;
  avg_learning_success_rate: number;

  // Context Metrics
  framework_context_operations: number;
  project_context_operations: number;

  // Time Period
  period_start: string;
  period_end: string;
  total_uptime_ms: number;
}

export interface GuardianTelemetryEvent {
  type: 'health_check' | 'auto_fix' | 'agent_activation' | 'learning_stored' | 'learning_reused';
  timestamp: string;
  context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
  success: boolean;
  duration_ms: number;
  details?: Record<string, any>;
}

/**
 * Guardian Telemetry Service
 */
export class GuardianTelemetry {
  private static instance: GuardianTelemetry | null = null;
  private metricsFile: string;
  private eventsFile: string;

  private constructor() {
    const versatilHome = path.join(os.homedir(), '.versatil');
    const telemetryDir = path.join(versatilHome, 'telemetry', 'guardian');

    if (!fs.existsSync(telemetryDir)) {
      fs.mkdirSync(telemetryDir, { recursive: true });
    }

    this.metricsFile = path.join(telemetryDir, 'metrics.json');
    this.eventsFile = path.join(telemetryDir, 'events.jsonl');
  }

  public static getInstance(): GuardianTelemetry {
    if (!GuardianTelemetry.instance) {
      GuardianTelemetry.instance = new GuardianTelemetry();
    }
    return GuardianTelemetry.instance;
  }

  /**
   * Record telemetry event
   */
  public recordEvent(event: GuardianTelemetryEvent): void {
    // Append to events file (JSONL)
    fs.appendFileSync(this.eventsFile, JSON.stringify(event) + '\n');

    // Update aggregated metrics
    this.updateMetrics(event);
  }

  /**
   * Get current metrics
   */
  public getMetrics(): GuardianMetrics {
    if (!fs.existsSync(this.metricsFile)) {
      return this.getDefaultMetrics();
    }

    try {
      return JSON.parse(fs.readFileSync(this.metricsFile, 'utf-8'));
    } catch (error) {
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get metrics for time period
   */
  public getMetricsForPeriod(startDate: Date, endDate: Date): GuardianMetrics {
    if (!fs.existsSync(this.eventsFile)) {
      return this.getDefaultMetrics();
    }

    const lines = fs.readFileSync(this.eventsFile, 'utf-8').trim().split('\n');
    const events = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as GuardianTelemetryEvent)
      .filter(event => {
        const eventTime = new Date(event.timestamp).getTime();
        return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
      });

    return this.calculateMetricsFromEvents(events, startDate, endDate);
  }

  /**
   * Get recent events
   */
  public getRecentEvents(limit = 100): GuardianTelemetryEvent[] {
    if (!fs.existsSync(this.eventsFile)) {
      return [];
    }

    const lines = fs.readFileSync(this.eventsFile, 'utf-8').trim().split('\n');
    const events = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as GuardianTelemetryEvent);

    return events.slice(-limit);
  }

  /**
   * Export metrics to automation-metrics format
   */
  public exportToAutomationMetrics(): {
    guardian_health_checks: number;
    guardian_auto_fixes: number;
    guardian_success_rate: number;
    guardian_avg_duration_ms: number;
  } {
    const metrics = this.getMetrics();

    const total_operations =
      metrics.health_checks_performed +
      metrics.auto_fixes_attempted +
      metrics.agent_activations_tracked;

    const successful_operations =
      metrics.health_checks_passed +
      metrics.auto_fixes_successful +
      (metrics.agent_activations_tracked - metrics.agent_failures_detected);

    const success_rate = total_operations > 0
      ? Math.round((successful_operations / total_operations) * 100)
      : 0;

    const total_duration =
      metrics.avg_health_check_duration_ms * metrics.health_checks_performed +
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
  public clearOldEvents(): number {
    if (!fs.existsSync(this.eventsFile)) {
      return 0;
    }

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const lines = fs.readFileSync(this.eventsFile, 'utf-8').trim().split('\n');
    const events = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as GuardianTelemetryEvent);

    const recentEvents = events.filter(event => {
      return new Date(event.timestamp).getTime() > thirtyDaysAgo;
    });

    const removedCount = events.length - recentEvents.length;

    // Rewrite file with only recent events
    fs.writeFileSync(
      this.eventsFile,
      recentEvents.map(e => JSON.stringify(e)).join('\n') + '\n'
    );

    return removedCount;
  }

  /**
   * Private methods
   */

  private updateMetrics(event: GuardianTelemetryEvent): void {
    const metrics = this.getMetrics();

    // Update based on event type
    switch (event.type) {
      case 'health_check':
        metrics.health_checks_performed += 1;
        if (event.success) {
          metrics.health_checks_passed += 1;
        } else {
          metrics.health_checks_failed += 1;
        }
        metrics.avg_health_check_duration_ms = this.updateAverage(
          metrics.avg_health_check_duration_ms,
          event.duration_ms,
          metrics.health_checks_performed
        );
        break;

      case 'auto_fix':
        metrics.auto_fixes_attempted += 1;
        if (event.success) {
          metrics.auto_fixes_successful += 1;
        }
        metrics.auto_fix_success_rate = Math.round(
          (metrics.auto_fixes_successful / metrics.auto_fixes_attempted) * 100
        );
        metrics.avg_auto_fix_duration_ms = this.updateAverage(
          metrics.avg_auto_fix_duration_ms,
          event.duration_ms,
          metrics.auto_fixes_attempted
        );
        break;

      case 'agent_activation':
        metrics.agent_activations_tracked += 1;
        if (!event.success) {
          metrics.agent_failures_detected += 1;
        }
        metrics.agent_success_rate = Math.round(
          ((metrics.agent_activations_tracked - metrics.agent_failures_detected) /
            metrics.agent_activations_tracked) *
            100
        );
        metrics.avg_agent_duration_ms = this.updateAverage(
          metrics.avg_agent_duration_ms,
          event.duration_ms,
          metrics.agent_activations_tracked
        );
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
    } else if (event.context === 'PROJECT_CONTEXT') {
      metrics.project_context_operations += 1;
    }

    // Update time period
    metrics.period_end = event.timestamp;

    // Save updated metrics
    fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return Math.round(((currentAvg * (count - 1)) + newValue) / count);
  }

  private getDefaultMetrics(): GuardianMetrics {
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

  private calculateMetricsFromEvents(
    events: GuardianTelemetryEvent[],
    startDate: Date,
    endDate: Date
  ): GuardianMetrics {
    const metrics = this.getDefaultMetrics();
    metrics.period_start = startDate.toISOString();
    metrics.period_end = endDate.toISOString();

    events.forEach(event => {
      switch (event.type) {
        case 'health_check':
          metrics.health_checks_performed += 1;
          if (event.success) metrics.health_checks_passed += 1;
          else metrics.health_checks_failed += 1;
          break;

        case 'auto_fix':
          metrics.auto_fixes_attempted += 1;
          if (event.success) metrics.auto_fixes_successful += 1;
          break;

        case 'agent_activation':
          metrics.agent_activations_tracked += 1;
          if (!event.success) metrics.agent_failures_detected += 1;
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
      } else if (event.context === 'PROJECT_CONTEXT') {
        metrics.project_context_operations += 1;
      }
    });

    // Calculate rates
    if (metrics.auto_fixes_attempted > 0) {
      metrics.auto_fix_success_rate = Math.round(
        (metrics.auto_fixes_successful / metrics.auto_fixes_attempted) * 100
      );
    }

    if (metrics.agent_activations_tracked > 0) {
      metrics.agent_success_rate = Math.round(
        ((metrics.agent_activations_tracked - metrics.agent_failures_detected) /
          metrics.agent_activations_tracked) *
          100
      );
    }

    return metrics;
  }
}

/**
 * Singleton instance
 */
export const guardianTelemetry = GuardianTelemetry.getInstance();
