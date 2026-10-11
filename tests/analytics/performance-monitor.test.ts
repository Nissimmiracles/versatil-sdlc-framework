/** Tests the implemented monitor contract with virtual storage and deterministic timers.
 * Host resource measurements and real account analytics files are not exercised.
 */
import { PerformanceMonitor } from '../../src/analytics/performance-monitor';
import { EventEmitter } from 'events';
import * as fs from 'fs';

jest.mock('os', () => ({ ...jest.requireActual('os'), homedir: () => '/unit-performance-home' }));
jest.mock('fs', () => {
  const files = new Map<string, string>();
  return {
    existsSync: jest.fn((file: string) => files.has(file)),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn((file: string, content: string) => files.set(file, content)),
    readFileSync: jest.fn((file: string) => {
      if (!files.has(file)) throw new Error('Fixture file not found');
      return files.get(file);
    }),
    resetFixture: () => files.clear()
  };
});

describe('PerformanceMonitor implemented contract', () => {
  let monitor: PerformanceMonitor;
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2025-02-01T00:00:00Z') });
    (fs as any).resetFixture();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(process, 'memoryUsage').mockReturnValue({ rss: 128 * 1024 ** 2, heapTotal: 96 * 1024 ** 2,
      heapUsed: 64 * 1024 ** 2, external: 0, arrayBuffers: 0 });
    jest.spyOn(process, 'cpuUsage').mockReturnValue({ user: 100000, system: 50000 });
    monitor = new PerformanceMonitor();
  });
  afterEach(() => {
    monitor.stopMonitoring();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  const record = (id = 'maria', duration = 1200, issues = 3, quality = 95, success = true) =>
    monitor.recordAgentExecution(id, duration, issues, quality, success);

  describe('Initialization and control', () => {
    it('initializes with empty agent summaries and the EventEmitter interface', () => {
      expect(monitor).toBeInstanceOf(EventEmitter);
      expect(monitor.getPerformanceDashboard().agents).toEqual([]);
      expect(monitor.getAgentSummary('unknown')).toBeNull();
    });
    it('starts monitoring once and does not duplicate periodic timers', () => {
      const started = jest.fn();
      monitor.on('monitoring-started', started);
      monitor.start();
      const count = jest.getTimerCount();
      monitor.start();
      expect(count).toBe(3);
      expect(jest.getTimerCount()).toBe(count);
      expect(started).toHaveBeenCalledTimes(1);
    });
    it('emits the implemented stop event and persists only to virtual fixture storage', () => {
      const stopped = jest.fn();
      monitor.on('monitoring-stopped', stopped);
      monitor.stopMonitoring();
      expect(stopped).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('analytics'), expect.any(String));
    });
    it('stops all periodic collection and persistence after the final save', () => {
      const event = jest.fn();
      monitor.on('metric-recorded', event);
      monitor.start();
      monitor.stopMonitoring();
      const saves = (fs.writeFileSync as jest.Mock).mock.calls.length;
      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(3600000);
      expect(event).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledTimes(saves);
    });
    it('can restart cleanly without retaining stopped timers', () => {
      const event = jest.fn();
      monitor.on('metric-recorded', event);
      monitor.start(); monitor.stopMonitoring(); monitor.start();
      expect(jest.getTimerCount()).toBe(3);
      jest.advanceTimersByTime(30000);
      expect(event).toHaveBeenCalledTimes(2);
    });
    it('accepts explicit execution records before periodic monitoring starts', () => {
      record();
      expect(monitor.getAgentSummary('maria')?.totalExecutions).toBe(1);
    });
  });

  describe('Execution aggregates and quality percentages', () => {
    it('records execution, issues and 0..100 quality in a public agent summary', () => {
      record();
      expect(monitor.getAgentSummary('maria')).toMatchObject({ agentId: 'maria', totalExecutions: 1,
        averageExecutionTime: 1200, minExecutionTime: 1200, maxExecutionTime: 1200,
        issuesDetected: 3, averageQualityScore: 95, successRate: 1, lastExecution: Date.now() });
    });
    it('accumulates durations, issues, quality and success rates independently', () => {
      record('maria', 1000, 2, 90, true);
      record('maria', 2000, 4, 80, false);
      expect(monitor.getAgentSummary('maria')).toMatchObject({ totalExecutions: 2, averageExecutionTime: 1500,
        minExecutionTime: 1000, maxExecutionTime: 2000, issuesDetected: 6, averageQualityScore: 85, successRate: 0.5 });
    });
    it('maintains independent aggregates for distinct agents', () => {
      record('maria', 1000, 2, 90);
      record('james', 1500, 3, 85);
      expect(monitor.getPerformanceDashboard().agents).toHaveLength(2);
      expect(monitor.getAgentSummary('maria')?.averageQualityScore).toBe(90);
      expect(monitor.getAgentSummary('james')?.averageQualityScore).toBe(85);
    });
    it('emits agent-execution-recorded synchronously with its actual payload', () => {
      const event = jest.fn();
      monitor.on('agent-execution-recorded', event);
      record();
      expect(event).toHaveBeenCalledTimes(1);
      expect(event).toHaveBeenCalledWith({ agentId: 'maria', executionTime: 1200, issuesDetected: 3, qualityScore: 95, success: true });
    });
    it('emits three metric-recorded events including context and thresholds', () => {
      const event = jest.fn();
      monitor.on('metric-recorded', event);
      monitor.recordAgentExecution('maria', 1200, 3, 95, true, { fixture: true });
      expect(event.mock.calls.map(([metric]) => metric.metricType)).toEqual(['execution_time', 'issue_detection', 'quality_score']);
      expect(event.mock.calls[2][0]).toMatchObject({ agentId: 'maria', value: 95, threshold: 70, status: 'normal', context: { fixture: true } });
    });
  });

  describe('Alert thresholds and event payloads', () => {
    it.each([[5000, null], [5001, 'warning'], [10000, 'warning'], [10001, 'critical']] as const)('distinguishes execution threshold boundaries at %d milliseconds', (duration, severity) => {
      const event = jest.fn();
      monitor.on('alert-created', event);
      record('maria', duration);
      if (severity === null) expect(event).not.toHaveBeenCalled();
      else {
        expect(event).toHaveBeenCalledTimes(1);
        expect(event.mock.calls[0][0]).toMatchObject({ metric: 'execution_time', value: duration, threshold: 5000, severity, agentId: 'maria', timestamp: Date.now() });
      }
    });
    it.each([[70, null], [69, 'warning'], [35, 'warning'], [34, 'critical']] as const)('distinguishes quality threshold boundaries at %d percent', (quality, severity) => {
      const event = jest.fn();
      monitor.on('alert-created', event);
      record('maria', 1000, 1, quality);
      if (severity === null) expect(event).not.toHaveBeenCalled();
      else {
        expect(event).toHaveBeenCalledTimes(1);
        expect(event.mock.calls[0][0]).toMatchObject({ metric: 'quality_score', value: quality, threshold: 70, severity });
      }
    });
    it('reports separate slow-execution and low-quality alerts with no asynchronous wait', () => {
      const event = jest.fn();
      monitor.on('alert-created', event);
      record('maria', 8000, 1, 50);
      expect(event.mock.calls.map(([alert]) => alert.metric)).toEqual(['execution_time', 'quality_score']);
      expect(monitor.getActiveAlerts()).toHaveLength(2);
    });
    it('reports excessive issues only beyond the configured threshold', () => {
      record('maria', 1000, 10, 95);
      expect(monitor.getActiveAlerts()).toEqual([]);
      record('maria', 1000, 11, 95);
      expect(monitor.getActiveAlerts()).toEqual([expect.objectContaining({ metric: 'issue_detection', value: 11, threshold: 10, severity: 'info' })]);
    });
    it('limits retained alerts to the latest 1000 entries', () => {
      for (let i = 0; i < 1001; i++) record(`agent-${i}`, 5001, 0, 95);
      const alerts = monitor.getActiveAlerts();
      expect(alerts).toHaveLength(1000);
      expect(alerts[0].agentId).toBe('agent-1');
      expect(alerts[999].agentId).toBe('agent-1000');
    });
  });

  describe('Deterministic periodic metrics', () => {
    it('records memory in MB and the implemented CPU approximation on the 30s interval', () => {
      const event = jest.fn();
      monitor.on('metric-recorded', event);
      monitor.start();
      jest.advanceTimersByTime(30000);
      expect(event).toHaveBeenCalledTimes(2);
      expect(event.mock.calls[0][0]).toMatchObject({ agentId: 'system', metricType: 'memory_usage', value: 64 });
      expect(event.mock.calls[1][0]).toMatchObject({ agentId: 'system', metricType: 'cpu_usage', value: 0.15 });
      expect(monitor.getPerformanceDashboard().system.memoryUsage).toBe(64);
    });
    it('timestamps each collection using the current controlled clock', () => {
      const event = jest.fn();
      monitor.on('metric-recorded', event);
      monitor.start();
      jest.advanceTimersByTime(60000);
      expect(event).toHaveBeenCalledTimes(4);
      expect(event.mock.calls[2][0].timestamp - event.mock.calls[0][0].timestamp).toBe(30000);
    });
    it('persists at five minutes without real filesystem access', () => {
      monitor.start();
      jest.advanceTimersByTime(300000);
      expect(fs.writeFileSync).toHaveBeenCalled();
      const saved = JSON.parse((fs.writeFileSync as jest.Mock).mock.calls.at(-1)![1]);
      expect(saved.metrics.system).toHaveLength(20);
      expect(saved.lastSaved).toBe(Date.now());
    });
    it('removes metrics older than seven days while retaining newer samples', () => {
      record('old');
      jest.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
      record('new');
      monitor['cleanupOldMetrics']();
      expect(monitor['metrics'].get('old')).toEqual([]);
      expect(monitor['metrics'].get('new')).toHaveLength(3);
    });
  });

  describe('Dashboard, reports and implemented Prometheus schema', () => {
    beforeEach(() => { record('maria', 1200, 3, 95); record('james', 800, 1, 85); });
    it('reports public system aggregates and percentage quality health', () => {
      expect(monitor.getPerformanceDashboard().system).toMatchObject({ timestamp: Date.now(), overallHealth: 90,
        totalAgentExecutions: 2, averageResponseTime: 1000, activeAgents: 2, criticalIssues: 0, highPriorityIssues: 0, qualityGateStatus: 'passing' });
    });
    it('exposes the same dashboard through getMetrics and JSON export', () => {
      expect(monitor.getMetrics()).toEqual(monitor.getPerformanceDashboard());
      expect(JSON.parse(monitor.exportReport())).toEqual(monitor.getPerformanceDashboard());
    });
    it('exports documented CSV values and success percentage', () => {
      expect(monitor.exportReport('csv')).toContain('maria,1,1200.00,1200,100.0%,95.0,3,stable');
    });
    it('exports the actual system and agent Prometheus metric names and values', () => {
      const output = monitor.getPrometheusMetrics();
      for (const name of ['versatil_system_health', 'versatil_total_executions', 'versatil_response_time_avg', 'versatil_agent_executions', 'versatil_agent_quality_score', 'versatil_agent_issues_detected']) {
        expect(output).toContain(`# HELP ${name} `);
        expect(output).toContain(`# TYPE ${name} `);
      }
      expect(output).toContain('versatil_agent_quality_score{agent="maria"} 95');
      expect(output).toContain('versatil_total_executions 2');
      for (const line of output.split('\n').filter(line => line && !line.startsWith('#'))) {
        expect(line).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*(\{[^}]*\})?\s+[\d.]+$/);
      }
    });
    it('marks quality gates failing when a critical alert is active', () => {
      record('critical', 1000, 0, 30);
      expect(monitor.getPerformanceDashboard().system.qualityGateStatus).toBe('failing');
      expect(monitor.getActiveAlerts()).toEqual([expect.objectContaining({ severity: 'critical', metric: 'quality_score' })]);
    });
    it('expires active alerts after an hour', () => {
      record('slow', 8000);
      jest.advanceTimersByTime(3600001);
      expect(monitor.getActiveAlerts()).toEqual([]);
    });
    it('aggregates declining input quality without inventing a fractional score', () => {
      record('trend', 1000, 2, 90); record('trend', 2000, 1, 80); record('trend', 3000, 0, 70);
      expect(monitor.getAgentSummary('trend')).toMatchObject({ averageExecutionTime: 2000, averageQualityScore: 80 });
    });
  });
});
