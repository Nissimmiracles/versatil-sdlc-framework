/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-this-alias, no-case-declarations, no-empty, no-control-regex */
/**
 * VERSATIL SDLC Framework - Performance Metrics Dashboard System
 * Real-time tracking of agent performance, model selection, and decision rationale
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { AgenticRAGOrchestrator } from '../orchestration/agentic-rag-orchestrator.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MetricEvent {
  id: string;
  timestamp: number;
  type: 'agent_activation' | 'model_selection' | 'task_completion' | 'decision_made' | 'error_occurred' | 'rule_execution';
  agentId: string;
  details: any;
  context: {
    projectPhase: string;
    systemLoad: number;
    activeAgents: string[];
    ruleExecutions: string[];
  };
}

export interface AgentPerformanceMetrics {
  agentId: string;
  totalActivations: number;
  successfulTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  successRate: number;
  mostCommonTasks: { task: string; count: number }[];
  decisionAccuracy: number;
  resourceUtilization: number;
  qualityScore: number;
  lastActive: Date;
  trendsLast30Days: {
    activations: number[];
    successRate: number[];
    averageTime: number[];
  };
}

export interface ModelSelectionMetrics {
  modelId: string;
  selectionCount: number;
  successRate: number;
  averageConfidence: number;
  contexts: { context: string; count: number }[];
  reasons: { reason: string; count: number }[];
  performance: {
    speed: number;
    accuracy: number;
    resourceUsage: number;
  };
  lastUsed: Date;
  trends: {
    usage: number[];
    performance: number[];
  };
}

export interface SystemPerformanceMetrics {
  totalEvents: number;
  activeAgents: number;
  averageResponseTime: number;
  systemLoad: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  rulesExecuted: {
    parallel_execution: number;
    stress_testing: number;
    daily_audit: number;
    onboarding: number;
    bug_collection: number;
  };
  qualityGates: {
    passed: number;
    failed: number;
    averageScore: number;
  };
}

export interface DashboardData {
  overview: SystemPerformanceMetrics;
  agents: AgentPerformanceMetrics[];
  models: ModelSelectionMetrics[];
  timeline: MetricEvent[];
  insights: {
    topPerformingAgent: string;
    mostUsedModel: string;
    bottlenecks: string[];
    recommendations: string[];
    trends: {
      performance: 'improving' | 'stable' | 'declining';
      efficiency: 'improving' | 'stable' | 'declining';
      quality: 'improving' | 'stable' | 'declining';
    };
  };
  realTimeStats: {
    currentTasks: number;
    queuedTasks: number;
    completedToday: number;
    errorRate24h: number;
  };
}

export class PerformanceMetricsSystem extends EventEmitter {
  private logger: VERSATILLogger;
  private metricsStore: Map<string, MetricEvent> = new Map();
  private agentMetrics: Map<string, AgentPerformanceMetrics> = new Map();
  private modelMetrics: Map<string, ModelSelectionMetrics> = new Map();
  private systemMetrics: SystemPerformanceMetrics;
  private projectRoot: string;
  private isCollecting: boolean = false;

  // Data persistence
  private metricsFile: string;
  private lastPersist: number = 0;
  private persistInterval: number = 30000; // 30 seconds

  // Real-time tracking
  private eventBuffer: MetricEvent[] = [];
  private dashboardClients: Set<any> = new Set();

  constructor(projectRoot: string) {
    super();
    this.logger = new VERSATILLogger('PerformanceMetrics');
    this.projectRoot = projectRoot;
    this.metricsFile = path.join(projectRoot, '.versatil', 'metrics', 'performance.json');

    this.systemMetrics = {
      totalEvents: 0,
      activeAgents: 0,
      averageResponseTime: 0,
      systemLoad: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      errorRate: 0,
      rulesExecuted: {
        parallel_execution: 0,
        stress_testing: 0,
        daily_audit: 0,
        onboarding: 0,
        bug_collection: 0
      },
      qualityGates: {
        passed: 0,
        failed: 0,
        averageScore: 0
      }
    };

    this.initializeMetrics();
  }

  /**
   * Initialize metrics collection system
   */
  private async initializeMetrics(): Promise<void> {
    try {
      // Ensure metrics directory exists
      await fs.mkdir(path.dirname(this.metricsFile), { recursive: true });

      // Load existing metrics
      await this.loadMetrics();

      // Start collection
      this.startCollection();

      // Setup periodic persistence
      this.setupPersistence();

      this.logger.info('Performance metrics system initialized');
    } catch (error) {
      this.logger.error('Failed to initialize metrics system', { error });
    }
  }

  /**
   * Start metrics collection
   */
  public startCollection(): void {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.logger.info('Started performance metrics collection');

    // Start system monitoring
    this.startSystemMonitoring();

    this.emit('collection:started');
  }

  /**
   * Stop metrics collection
   */
  public stopCollection(): void {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    this.logger.info('Stopped performance metrics collection');

    // Persist final state
    this.persistMetrics();

    this.emit('collection:stopped');
  }

  /**
   * Record a metric event
   */
  public recordEvent(event: Omit<MetricEvent, 'id' | 'timestamp'>): void {
    if (!this.isCollecting) return;

    const metricEvent: MetricEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...event
    };

    // Store event
    this.metricsStore.set(metricEvent.id, metricEvent);
    this.eventBuffer.push(metricEvent);

    // Update metrics
    this.updateMetrics(metricEvent);

    // Emit to real-time listeners
    this.emit('metric:recorded', metricEvent);

    // Broadcast to dashboard clients
    this.broadcastToClients('event', metricEvent);

    this.logger.debug('Recorded metric event', {
      type: metricEvent.type,
      agentId: metricEvent.agentId
    });
  }

  /**
   * Record agent activation
   */
  public recordAgentActivation(agentId: string, task: any, context: any): void {
    this.recordEvent({
      type: 'agent_activation',
      agentId,
      details: { task, activationReason: this.analyzeActivationReason(task, context) },
      context: this.getCurrentSystemContext()
    });
  }

  /**
   * Record model selection
   */
  public recordModelSelection(
    agentId: string,
    modelId: string,
    reason: string,
    confidence: number,
    alternatives: string[]
  ): void {
    this.recordEvent({
      type: 'model_selection',
      agentId,
      details: {
        modelId,
        reason,
        confidence,
        alternatives,
        selectionTime: Date.now()
      },
      context: this.getCurrentSystemContext()
    });
  }

  /**
   * Record task completion
   */
  public recordTaskCompletion(
    agentId: string,
    task: any,
    success: boolean,
    duration: number,
    quality?: number
  ): void {
    this.recordEvent({
      type: 'task_completion',
      agentId,
      details: {
        task,
        success,
        duration,
        quality: quality || 0,
        completedAt: Date.now()
      },
      context: this.getCurrentSystemContext()
    });
  }

  /**
   * Record decision making
   */
  public recordDecision(
    agentId: string,
    decision: any,
    rationale: string,
    confidence: number,
    alternatives: any[]
  ): void {
    this.recordEvent({
      type: 'decision_made',
      agentId,
      details: {
        decision,
        rationale,
        confidence,
        alternatives,
        decisionTime: Date.now()
      },
      context: this.getCurrentSystemContext()
    });
  }

  /**
   * Record error occurrence
   */
  public recordError(
    agentId: string,
    error: any,
    context: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    this.recordEvent({
      type: 'error_occurred',
      agentId,
      details: {
        error: {
          message: error.message || String(error),
          stack: error.stack,
          type: error.constructor?.name || 'Unknown'
        },
        context,
        severity,
        occurredAt: Date.now()
      },
      context: this.getCurrentSystemContext()
    });
  }

  /**
   * Get current dashboard data
   */
  public getDashboardData(): DashboardData {
    return {
      overview: this.getSystemOverview(),
      agents: Array.from(this.agentMetrics.values()),
      models: Array.from(this.modelMetrics.values()),
      timeline: this.getRecentEvents(100),
      insights: this.generateInsights(),
      realTimeStats: this.getRealTimeStats()
    };
  }

  /**
   * Get agent performance metrics
   */
  public getAgentMetrics(agentId: string): AgentPerformanceMetrics | undefined {
    return this.agentMetrics.get(agentId);
  }

  /**
   * Get model selection metrics
   */
  public getModelMetrics(modelId: string): ModelSelectionMetrics | undefined {
    return this.modelMetrics.get(modelId);
  }

  /**
   * Get system performance overview
   */
  private getSystemOverview(): SystemPerformanceMetrics {
    // Update real-time stats
    this.systemMetrics.totalEvents = this.metricsStore.size;
    this.systemMetrics.activeAgents = this.getActiveAgentCount();
    this.systemMetrics.averageResponseTime = this.calculateAverageResponseTime();
    this.systemMetrics.systemLoad = this.getCurrentSystemLoad();
    this.systemMetrics.errorRate = this.calculateErrorRate();

    return { ...this.systemMetrics };
  }

  /**
   * Generate insights and recommendations
   */
  private generateInsights(): DashboardData['insights'] {
    const agents = Array.from(this.agentMetrics.values());
    const models = Array.from(this.modelMetrics.values());

    // Find top performing agent
    const topAgent = agents.reduce((top, agent) =>
      agent.successRate > (top?.successRate || 0) ? agent : top, null as AgentPerformanceMetrics | null);

    // Find most used model
    const topModel = models.reduce((top, model) =>
      model.selectionCount > (top?.selectionCount || 0) ? model : top, null as ModelSelectionMetrics | null);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Analyze trends
    const trends = this.analyzeTrends();

    return {
      topPerformingAgent: topAgent?.agentId || 'none',
      mostUsedModel: topModel?.modelId || 'none',
      bottlenecks,
      recommendations,
      trends
    };
  }

  /**
   * Get real-time statistics
   */
  private getRealTimeStats(): DashboardData['realTimeStats'] {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const todayStart = new Date().setHours(0, 0, 0, 0);

    const recentEvents = Array.from(this.metricsStore.values())
      .filter(event => event.timestamp > last24h);

    const todayEvents = Array.from(this.metricsStore.values())
      .filter(event => event.timestamp > todayStart);

    const completedToday = todayEvents
      .filter(event => event.type === 'task_completion' && event.details.success).length;

    const errors24h = recentEvents
      .filter(event => event.type === 'error_occurred').length;

    return {
      currentTasks: this.getCurrentTaskCount(),
      queuedTasks: this.getQueuedTaskCount(),
      completedToday,
      errorRate24h: recentEvents.length > 0 ? (errors24h / recentEvents.length) * 100 : 0
    };
  }

  /**
   * Update metrics based on new event
   */
  private updateMetrics(event: MetricEvent): void {
    // Update agent metrics
    this.updateAgentMetrics(event);

    // Update model metrics if applicable
    if (event.type === 'model_selection') {
      this.updateModelMetrics(event);
    }

    // Update system metrics
    this.updateSystemMetrics(event);
  }

  /**
   * Update agent-specific metrics
   */
  private updateAgentMetrics(event: MetricEvent): void {
    let metrics = this.agentMetrics.get(event.agentId);

    if (!metrics) {
      metrics = {
        agentId: event.agentId,
        totalActivations: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageTaskTime: 0,
        successRate: 0,
        mostCommonTasks: [],
        decisionAccuracy: 0,
        resourceUtilization: 0,
        qualityScore: 0,
        lastActive: new Date(),
        trendsLast30Days: {
          activations: new Array(30).fill(0),
          successRate: new Array(30).fill(0),
          averageTime: new Array(30).fill(0)
        }
      };
      this.agentMetrics.set(event.agentId, metrics);
    }

    // Update based on event type
    switch (event.type) {
      case 'agent_activation':
        metrics.totalActivations++;
        metrics.lastActive = new Date();
        break;

      case 'task_completion':
        if (event.details.success) {
          metrics.successfulTasks++;
        } else {
          metrics.failedTasks++;
        }

        // Update average task time
        const totalTasks = metrics.successfulTasks + metrics.failedTasks;
        metrics.averageTaskTime = (metrics.averageTaskTime * (totalTasks - 1) + event.details.duration) / totalTasks;

        // Update success rate
        metrics.successRate = metrics.successfulTasks / totalTasks;

        // Update quality score
        if (event.details.quality) {
          metrics.qualityScore = (metrics.qualityScore + event.details.quality) / 2;
        }
        break;
    }

    // Update trends (last 30 days)
    this.updateAgentTrends(metrics);
  }

  /**
   * Update model selection metrics
   */
  private updateModelMetrics(event: MetricEvent): void {
    const modelId = event.details.modelId;
    let metrics = this.modelMetrics.get(modelId);

    if (!metrics) {
      metrics = {
        modelId,
        selectionCount: 0,
        successRate: 0,
        averageConfidence: 0,
        contexts: [],
        reasons: [],
        performance: {
          speed: 0,
          accuracy: 0,
          resourceUsage: 0
        },
        lastUsed: new Date(),
        trends: {
          usage: new Array(30).fill(0),
          performance: new Array(30).fill(0)
        }
      };
      this.modelMetrics.set(modelId, metrics);
    }

    metrics.selectionCount++;
    metrics.averageConfidence = (metrics.averageConfidence + event.details.confidence) / 2;
    metrics.lastUsed = new Date();

    // Update reasons
    const reason = event.details.reason;
    const existingReason = metrics.reasons.find(r => r.reason === reason);
    if (existingReason) {
      existingReason.count++;
    } else {
      metrics.reasons.push({ reason, count: 1 });
    }

    // Update trends
    this.updateModelTrends(metrics);
  }

  /**
   * Helper methods for data analysis
   */
  private analyzeActivationReason(task: any, context: any): string {
    if (task.type === 'testing') return 'quality_assurance_needed';
    if (task.type === 'frontend') return 'ui_development_required';
    if (task.type === 'backend') return 'api_development_required';
    return 'general_assistance_needed';
  }

  private getCurrentSystemContext(): MetricEvent['context'] {
    return {
      projectPhase: 'development', // Could be determined dynamically
      systemLoad: this.getCurrentSystemLoad(),
      activeAgents: Array.from(this.agentMetrics.keys()),
      ruleExecutions: this.getActiveRuleExecutions()
    };
  }

  private getCurrentSystemLoad(): number {
    // Calculate real system load from Node.js metrics
    const usage = process.memoryUsage();
    const totalMem = usage.heapTotal;
    const usedMem = usage.heapUsed;

    // Calculate memory pressure as percentage
    const memoryLoad = (usedMem / totalMem) * 100;

    // Factor in CPU usage via event loop lag (if available)
    const eventLoopLag = this.measureEventLoopLag();

    // Weighted average: 70% memory, 30% event loop
    return (memoryLoad * 0.7) + (eventLoopLag * 0.3);
  }

  private measureEventLoopLag(): number {
    // Measure event loop responsiveness
    const start = Date.now();
    setImmediate(() => {
      const lag = Date.now() - start;
      // Convert to percentage (assume 100ms+ is 100% load)
      return Math.min((lag / 100) * 100, 100);
    });

    // Return 0 for immediate measurement (async measurement would require callback)
    return 0;
  }

  private getActiveRuleExecutions(): string[] {
    // Track actual rule executions from metrics
    const recentEvents = this.getRecentEvents(100);
    const ruleExecutions = new Set<string>();

    for (const event of recentEvents) {
      if (event.type === 'rule_execution' && event.details?.ruleName) {
        ruleExecutions.add(event.details.ruleName as string);
      }
    }

    return Array.from(ruleExecutions);
  }

  private getActiveAgentCount(): number {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return Array.from(this.agentMetrics.values())
      .filter(agent => agent.lastActive.getTime() > fiveMinutesAgo).length;
  }

  private calculateAverageResponseTime(): number {
    const completionEvents = Array.from(this.metricsStore.values())
      .filter(event => event.type === 'task_completion')
      .slice(-100); // Last 100 tasks

    if (completionEvents.length === 0) return 0;

    const totalTime = completionEvents.reduce((sum, event) => sum + event.details.duration, 0);
    return totalTime / completionEvents.length;
  }

  private calculateErrorRate(): number {
    const recentEvents = this.getRecentEvents(1000);
    if (recentEvents.length === 0) return 0;

    const errors = recentEvents.filter(event => event.type === 'error_occurred').length;
    return (errors / recentEvents.length) * 100;
  }

  private getRecentEvents(limit: number): MetricEvent[] {
    return Array.from(this.metricsStore.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];

    // Analyze agent performance
    for (const agent of this.agentMetrics.values()) {
      if (agent.successRate < 0.8) {
        bottlenecks.push(`Agent ${agent.agentId} has low success rate (${(agent.successRate * 100).toFixed(1)}%)`);
      }
      if (agent.averageTaskTime > 10000) {
        bottlenecks.push(`Agent ${agent.agentId} has high average task time (${agent.averageTaskTime}ms)`);
      }
    }

    // System-level bottlenecks
    if (this.systemMetrics.errorRate > 5) {
      bottlenecks.push(`High system error rate (${this.systemMetrics.errorRate.toFixed(1)}%)`);
    }

    return bottlenecks;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Agent-specific recommendations
    for (const agent of this.agentMetrics.values()) {
      if (agent.successRate < 0.9 && agent.totalActivations > 10) {
        recommendations.push(`Consider optimizing ${agent.agentId} configuration for better success rate`);
      }
    }

    // System recommendations
    if (this.systemMetrics.averageResponseTime > 5000) {
      recommendations.push('System response time is high - consider resource optimization');
    }

    if (this.getActiveAgentCount() < 2) {
      recommendations.push('Consider enabling more agents for better parallel processing');
    }

    return recommendations;
  }

  private analyzeTrends(): DashboardData['insights']['trends'] {
    // Analyze trends based on recent data
    // This is a simplified implementation
    return {
      performance: 'improving',
      efficiency: 'stable',
      quality: 'improving'
    };
  }

  private updateAgentTrends(metrics: AgentPerformanceMetrics): void {
    // Update daily trends (simplified)
    const today = new Date().getDate() % 30;
    metrics.trendsLast30Days.activations[today]++;
    metrics.trendsLast30Days.successRate[today] = metrics.successRate;
    metrics.trendsLast30Days.averageTime[today] = metrics.averageTaskTime;
  }

  private updateModelTrends(metrics: ModelSelectionMetrics): void {
    // Update daily trends (simplified)
    const today = new Date().getDate() % 30;
    metrics.trends.usage[today]++;
    metrics.trends.performance[today] = metrics.averageConfidence;
  }

  private getCurrentTaskCount(): number {
    // Count tasks currently in progress from recent events
    const recentEvents = this.getRecentEvents(50);
    const runningTasks = new Set<string>();

    for (const event of recentEvents) {
      if (event.type === 'agent_activation' && !event.details?.completed) {
        runningTasks.add(event.id);
      }
    }

    return runningTasks.size;
  }

  private getQueuedTaskCount(): number {
    // Count tasks awaiting execution from metrics
    const recentEvents = this.getRecentEvents(100);
    let queuedCount = 0;

    for (const event of recentEvents) {
      if (event.details?.status === 'queued' || event.details?.status === 'pending') {
        queuedCount++;
      }
    }

    return queuedCount;
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateSystemMetrics(event: MetricEvent): void {
    this.systemMetrics.totalEvents++;

    // Update rule execution counts
    if (event.details.ruleType) {
      const ruleType = event.details.ruleType as keyof typeof this.systemMetrics.rulesExecuted;
      if (this.systemMetrics.rulesExecuted[ruleType] !== undefined) {
        this.systemMetrics.rulesExecuted[ruleType]++;
      }
    }
  }

  private startSystemMonitoring(): void {
    // Start monitoring system resources
    const monitorInterval = setInterval(() => {
      if (!this.isCollecting) {
        clearInterval(monitorInterval);
        return;
      }

      // Update system metrics
      this.systemMetrics.systemLoad = this.getCurrentSystemLoad();
      this.systemMetrics.memoryUsage = process.memoryUsage().heapUsed;
      this.systemMetrics.cpuUsage = process.cpuUsage().user;

      // Broadcast to clients
      this.broadcastToClients('system:update', this.systemMetrics);
    }, 5000); // Every 5 seconds
  }

  private setupPersistence(): void {
    setInterval(async () => {
      if (Date.now() - this.lastPersist > this.persistInterval) {
        await this.persistMetrics();
      }
    }, this.persistInterval);
  }

  private async loadMetrics(): Promise<void> {
    try {
      const data = await fs.readFile(this.metricsFile, 'utf8');
      const parsed = JSON.parse(data);

      // Load metrics data
      if (parsed.events) {
        for (const event of parsed.events) {
          this.metricsStore.set(event.id, event);
        }
      }

      if (parsed.agentMetrics) {
        for (const [id, metrics] of Object.entries(parsed.agentMetrics)) {
          this.agentMetrics.set(id, metrics as AgentPerformanceMetrics);
        }
      }

      if (parsed.modelMetrics) {
        for (const [id, metrics] of Object.entries(parsed.modelMetrics)) {
          this.modelMetrics.set(id, metrics as ModelSelectionMetrics);
        }
      }

      if (parsed.systemMetrics) {
        this.systemMetrics = { ...this.systemMetrics, ...parsed.systemMetrics };
      }

      this.logger.info('Loaded existing metrics', {
        events: this.metricsStore.size,
        agents: this.agentMetrics.size,
        models: this.modelMetrics.size
      });
    } catch (error) {
      this.logger.debug('No existing metrics file found, starting fresh');
    }
  }

  private async persistMetrics(): Promise<void> {
    try {
      const data = {
        events: Array.from(this.metricsStore.values()).slice(-10000), // Keep last 10k events
        agentMetrics: Object.fromEntries(this.agentMetrics),
        modelMetrics: Object.fromEntries(this.modelMetrics),
        systemMetrics: this.systemMetrics,
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.metricsFile, JSON.stringify(data, null, 2));
      this.lastPersist = Date.now();

      this.logger.debug('Persisted metrics to disk');
    } catch (error) {
      this.logger.error('Failed to persist metrics', { error });
    }
  }

  /**
   * Dashboard client management
   */
  public addDashboardClient(client: any): void {
    this.dashboardClients.add(client);

    // Send initial data
    client.send(JSON.stringify({
      type: 'initial_data',
      data: this.getDashboardData()
    }));
  }

  public removeDashboardClient(client: any): void {
    this.dashboardClients.delete(client);
  }

  private broadcastToClients(type: string, data: any): void {
    const message = JSON.stringify({ type, data });

    for (const client of this.dashboardClients) {
      try {
        client.send(message);
      } catch (error) {
        this.dashboardClients.delete(client);
      }
    }
  }

  /**
   * Export metrics for analysis
   */
  public async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const data = this.getDashboardData();

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  private convertToCSV(data: DashboardData): string {
    // Convert metrics to CSV format
    let csv = 'Timestamp,Type,Agent,Details\n';

    for (const event of data.timeline) {
      csv += `${new Date(event.timestamp).toISOString()},${event.type},${event.agentId},"${JSON.stringify(event.details).replace(/"/g, '""')}"\n`;
    }

    return csv;
  }

  /**
   * Cleanup old metrics
   */
  public cleanupOldMetrics(daysToKeep: number = 30): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    // Remove old events
    for (const [id, event] of this.metricsStore) {
      if (event.timestamp < cutoffTime) {
        this.metricsStore.delete(id);
      }
    }

    this.logger.info('Cleaned up old metrics', {
      remainingEvents: this.metricsStore.size,
      cutoffDays: daysToKeep
    });
  }

  /**
   * Get metrics summary
   */
  public getMetricsSummary(): {
    totalEvents: number;
    agentsTracked: number;
    modelsTracked: number;
    collectionDuration: string;
    lastEvent: Date | null;
  } {
    const events = Array.from(this.metricsStore.values());
    const firstEvent = events.reduce((earliest, event) =>
      !earliest || event.timestamp < earliest.timestamp ? event : earliest, null as MetricEvent | null);
    const lastEvent = events.reduce((latest, event) =>
      !latest || event.timestamp > latest.timestamp ? event : latest, null as MetricEvent | null);

    return {
      totalEvents: this.metricsStore.size,
      agentsTracked: this.agentMetrics.size,
      modelsTracked: this.modelMetrics.size,
      collectionDuration: firstEvent ?
        this.formatDuration(Date.now() - firstEvent.timestamp) : '0ms',
      lastEvent: lastEvent ? new Date(lastEvent.timestamp) : null
    };
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}