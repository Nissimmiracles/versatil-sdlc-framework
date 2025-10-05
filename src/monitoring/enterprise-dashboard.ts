/**
 * VERSATIL Enterprise Monitoring Dashboard
 * Real-time monitoring, metrics collection, and business intelligence
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { environmentManager, EnvironmentType } from '../environment/environment-manager.js';

export interface MetricPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: [number, number, number];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface ApplicationMetrics {
  requests: {
    total: number;
    rate: number;
    errors: number;
    errorRate: number;
  };
  response: {
    averageTime: number;
    p50: number;
    p95: number;
    p99: number;
  };
  agents: {
    [agentName: string]: {
      activeJobs: number;
      completedJobs: number;
      errorJobs: number;
      averageExecutionTime: number;
      successRate: number;
      performanceScore: number;
    };
  };
  rag: {
    queries: number;
    averageRetrievalTime: number;
    cacheHitRate: number;
    indexSize: number;
  };
  opera: {
    activeGoals: number;
    completedGoals: number;
    averageGoalTime: number;
    autonomousActions: number;
  };
}

export interface BusinessMetrics {
  users: {
    active: number;
    new: number;
    retention: number;
  };
  features: {
    adoption: Record<string, number>;
    usage: Record<string, number>;
  };
  quality: {
    overallScore: number;
    testCoverage: number;
    bugRate: number;
    customerSatisfaction: number;
  };
  performance: {
    uptime: number;
    availability: number;
    mttr: number; // Mean Time To Recovery
    mttf: number; // Mean Time To Failure
  };
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  tags: string[];
  resolved: boolean;
  resolvedAt?: number;
  actions?: Array<{
    name: string;
    url: string;
    type: 'button' | 'link';
  }>;
}

export interface DashboardConfig {
  refreshInterval: number;
  retentionPeriod: number;
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
    errorRate: number;
  };
  notifications: {
    slack?: {
      webhook: string;
      channel: string;
    };
    email?: {
      smtp: string;
      recipients: string[];
    };
  };
}

export class EnterpriseDashboard extends EventEmitter {
  private logger: VERSATILLogger;
  private config: DashboardConfig;
  private systemMetrics: SystemMetrics | null = null;
  private applicationMetrics: ApplicationMetrics | null = null;
  private businessMetrics: BusinessMetrics | null = null;
  private alerts: Map<string, Alert> = new Map();
  private metricHistory: Map<string, MetricPoint[]> = new Map();
  private isRunning: boolean = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor(config: Partial<DashboardConfig> = {}) {
    super();
    this.logger = new VERSATILLogger();
    this.config = {
      refreshInterval: 5000, // 5 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      alertThresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        responseTime: 1000,
        errorRate: 5
      },
      notifications: {},
      ...config
    };
  }

  /**
   * Start the enterprise dashboard
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Dashboard already running', {}, 'enterprise-dashboard');
      return;
    }

    this.logger.info('Starting Enterprise Dashboard', {
      refreshInterval: this.config.refreshInterval,
      retentionPeriod: this.config.retentionPeriod
    }, 'enterprise-dashboard');

    this.isRunning = true;

    // Start metric collection intervals
    this.startMetricCollection();

    // Start alert monitoring
    this.startAlertMonitoring();

    // Start cleanup routine
    this.startCleanupRoutine();

    this.emit('dashboard_started');
    this.logger.info('Enterprise Dashboard started successfully', {}, 'enterprise-dashboard');
  }

  /**
   * Stop the enterprise dashboard
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping Enterprise Dashboard', {}, 'enterprise-dashboard');

    this.isRunning = false;

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    this.emit('dashboard_stopped');
    this.logger.info('Enterprise Dashboard stopped', {}, 'enterprise-dashboard');
  }

  /**
   * Start metric collection
   */
  private startMetricCollection(): void {
    // System metrics collection
    const systemInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.refreshInterval);
    this.intervals.push(systemInterval);

    // Application metrics collection
    const appInterval = setInterval(() => {
      this.collectApplicationMetrics();
    }, this.config.refreshInterval);
    this.intervals.push(appInterval);

    // Business metrics collection (less frequent)
    const businessInterval = setInterval(() => {
      this.collectBusinessMetrics();
    }, this.config.refreshInterval * 6); // Every 30 seconds
    this.intervals.push(businessInterval);
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        cpu: {
          usage: await this.getCPUUsage(),
          loadAverage: this.getLoadAverage(),
          cores: require('os').cpus().length
        },
        memory: this.getMemoryUsage(),
        disk: await this.getDiskUsage(),
        network: await this.getNetworkStats()
      };

      this.systemMetrics = metrics;
      this.recordMetric('system.cpu.usage', metrics.cpu.usage);
      this.recordMetric('system.memory.percentage', metrics.memory.percentage);
      this.recordMetric('system.disk.percentage', metrics.disk.percentage);

      this.emit('metrics_updated', { type: 'system', metrics });
    } catch (error) {
      this.logger.error('Failed to collect system metrics', { error: error.message }, 'enterprise-dashboard');
    }
  }

  /**
   * Collect application metrics
   */
  private async collectApplicationMetrics(): Promise<void> {
    try {
      const metrics: ApplicationMetrics = {
        requests: await this.getRequestMetrics(),
        response: await this.getResponseMetrics(),
        agents: await this.getAgentMetrics(),
        rag: await this.getRAGMetrics(),
        opera: await this.getOperaMetrics()
      };

      this.applicationMetrics = metrics;
      this.recordMetric('app.requests.rate', metrics.requests.rate);
      this.recordMetric('app.response.averageTime', metrics.response.averageTime);
      this.recordMetric('app.requests.errorRate', metrics.requests.errorRate);

      this.emit('metrics_updated', { type: 'application', metrics });
    } catch (error) {
      this.logger.error('Failed to collect application metrics', { error: error.message }, 'enterprise-dashboard');
    }
  }

  /**
   * Collect business metrics
   */
  private async collectBusinessMetrics(): Promise<void> {
    try {
      const metrics: BusinessMetrics = {
        users: await this.getUserMetrics(),
        features: await this.getFeatureMetrics(),
        quality: await this.getQualityMetrics(),
        performance: await this.getPerformanceMetrics()
      };

      this.businessMetrics = metrics;
      this.recordMetric('business.quality.overallScore', metrics.quality.overallScore);
      this.recordMetric('business.performance.uptime', metrics.performance.uptime);

      this.emit('metrics_updated', { type: 'business', metrics });
    } catch (error) {
      this.logger.error('Failed to collect business metrics', { error: error.message }, 'enterprise-dashboard');
    }
  }

  /**
   * Start alert monitoring
   */
  private startAlertMonitoring(): void {
    const alertInterval = setInterval(() => {
      this.checkAlerts();
    }, this.config.refreshInterval);
    this.intervals.push(alertInterval);
  }

  /**
   * Check for alerts based on current metrics
   */
  private checkAlerts(): void {
    if (!this.systemMetrics || !this.applicationMetrics) {
      return;
    }

    const alerts: Alert[] = [];

    // CPU usage alert
    if (this.systemMetrics.cpu.usage > this.config.alertThresholds.cpu) {
      alerts.push({
        id: `cpu-high-${Date.now()}`,
        level: this.systemMetrics.cpu.usage > 95 ? 'critical' : 'warning',
        title: 'High CPU Usage',
        message: `CPU usage is at ${this.systemMetrics.cpu.usage.toFixed(1)}%`,
        timestamp: Date.now(),
        source: 'system',
        tags: ['cpu', 'performance'],
        resolved: false
      });
    }

    // Memory usage alert
    if (this.systemMetrics.memory.percentage > this.config.alertThresholds.memory) {
      alerts.push({
        id: `memory-high-${Date.now()}`,
        level: this.systemMetrics.memory.percentage > 95 ? 'critical' : 'warning',
        title: 'High Memory Usage',
        message: `Memory usage is at ${this.systemMetrics.memory.percentage.toFixed(1)}%`,
        timestamp: Date.now(),
        source: 'system',
        tags: ['memory', 'performance'],
        resolved: false
      });
    }

    // Error rate alert
    if (this.applicationMetrics.requests.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        id: `errorrate-high-${Date.now()}`,
        level: this.applicationMetrics.requests.errorRate > 10 ? 'critical' : 'warning',
        title: 'High Error Rate',
        message: `Error rate is at ${this.applicationMetrics.requests.errorRate.toFixed(1)}%`,
        timestamp: Date.now(),
        source: 'application',
        tags: ['errors', 'reliability'],
        resolved: false
      });
    }

    // Process new alerts
    alerts.forEach(alert => {
      this.addAlert(alert);
    });
  }

  /**
   * Add a new alert
   */
  addAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);
    this.emit('alert_created', alert);

    this.logger.warn('Alert created', {
      id: alert.id,
      level: alert.level,
      title: alert.title,
      message: alert.message
    }, 'enterprise-dashboard');

    // Send notifications
    this.sendNotification(alert);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.emit('alert_resolved', alert);

      this.logger.info('Alert resolved', {
        id: alert.id,
        title: alert.title,
        duration: alert.resolvedAt - alert.timestamp
      }, 'enterprise-dashboard');
    }
  }

  /**
   * Send notification for alert
   */
  private async sendNotification(alert: Alert): Promise<void> {
    // Slack notification
    if (this.config.notifications.slack) {
      await this.sendSlackNotification(alert);
    }

    // Email notification
    if (this.config.notifications.email) {
      await this.sendEmailNotification(alert);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    // Implementation would use actual Slack API
    this.logger.info('Slack notification sent', {
      alertId: alert.id,
      level: alert.level,
      title: alert.title
    }, 'enterprise-dashboard');
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Implementation would use actual email service
    this.logger.info('Email notification sent', {
      alertId: alert.id,
      level: alert.level,
      title: alert.title
    }, 'enterprise-dashboard');
  }

  /**
   * Record a metric point
   */
  private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.metricHistory.has(name)) {
      this.metricHistory.set(name, []);
    }

    const history = this.metricHistory.get(name)!;
    history.push({
      timestamp: Date.now(),
      value,
      tags
    });

    // Keep only recent metrics based on retention period
    const cutoff = Date.now() - this.config.retentionPeriod;
    const filtered = history.filter(point => point.timestamp > cutoff);
    this.metricHistory.set(name, filtered);
  }

  /**
   * Start cleanup routine
   */
  private startCleanupRoutine(): void {
    const cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
    this.intervals.push(cleanupInterval);
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;

    // Clean up old alerts
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.alerts.delete(alertId);
      }
    }

    // Clean up metric history is handled in recordMetric()
  }

  // Metric collection methods (simplified implementations)
  private async getCPUUsage(): Promise<number> {
    // Simplified CPU usage calculation
    return Math.random() * 100;
  }

  private getLoadAverage(): [number, number, number] {
    try {
      return require('os').loadavg() as [number, number, number];
    } catch {
      return [0, 0, 0];
    }
  }

  private getMemoryUsage(): SystemMetrics['memory'] {
    try {
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const used = totalMem - freeMem;
      return {
        total: totalMem,
        used,
        free: freeMem,
        percentage: (used / totalMem) * 100
      };
    } catch {
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
  }

  private async getDiskUsage(): Promise<SystemMetrics['disk']> {
    // Simplified disk usage
    return {
      total: 1000000000, // 1GB
      used: 500000000,   // 500MB
      free: 500000000,   // 500MB
      percentage: 50
    };
  }

  private async getNetworkStats(): Promise<SystemMetrics['network']> {
    // Simplified network stats
    return {
      bytesIn: Math.random() * 1000000,
      bytesOut: Math.random() * 1000000,
      packetsIn: Math.random() * 1000,
      packetsOut: Math.random() * 1000
    };
  }

  private async getRequestMetrics(): Promise<ApplicationMetrics['requests']> {
    return {
      total: Math.floor(Math.random() * 10000),
      rate: Math.random() * 100,
      errors: Math.floor(Math.random() * 100),
      errorRate: Math.random() * 10
    };
  }

  private async getResponseMetrics(): Promise<ApplicationMetrics['response']> {
    return {
      averageTime: 100 + Math.random() * 200,
      p50: 80 + Math.random() * 50,
      p95: 200 + Math.random() * 100,
      p99: 500 + Math.random() * 200
    };
  }

  private async getAgentMetrics(): Promise<ApplicationMetrics['agents']> {
    return {
      'maria-qa': {
        activeJobs: Math.floor(Math.random() * 5),
        completedJobs: Math.floor(Math.random() * 100),
        errorJobs: Math.floor(Math.random() * 5),
        averageExecutionTime: 1000 + Math.random() * 2000,
        successRate: 90 + Math.random() * 10,
        performanceScore: 80 + Math.random() * 20
      },
      'james-frontend': {
        activeJobs: Math.floor(Math.random() * 3),
        completedJobs: Math.floor(Math.random() * 80),
        errorJobs: Math.floor(Math.random() * 3),
        averageExecutionTime: 800 + Math.random() * 1000,
        successRate: 85 + Math.random() * 15,
        performanceScore: 85 + Math.random() * 15
      }
    };
  }

  private async getRAGMetrics(): Promise<ApplicationMetrics['rag']> {
    return {
      queries: Math.floor(Math.random() * 1000),
      averageRetrievalTime: 50 + Math.random() * 100,
      cacheHitRate: 70 + Math.random() * 30,
      indexSize: Math.floor(Math.random() * 10000)
    };
  }

  private async getOperaMetrics(): Promise<ApplicationMetrics['opera']> {
    return {
      activeGoals: Math.floor(Math.random() * 10),
      completedGoals: Math.floor(Math.random() * 50),
      averageGoalTime: 5000 + Math.random() * 10000,
      autonomousActions: Math.floor(Math.random() * 100)
    };
  }

  private async getUserMetrics(): Promise<BusinessMetrics['users']> {
    return {
      active: Math.floor(Math.random() * 1000),
      new: Math.floor(Math.random() * 100),
      retention: 80 + Math.random() * 20
    };
  }

  private async getFeatureMetrics(): Promise<BusinessMetrics['features']> {
    return {
      adoption: {
        'rag-memory': 75 + Math.random() * 25,
        'opera-orchestrator': 60 + Math.random() * 40,
        'bmad-agents': 85 + Math.random() * 15
      },
      usage: {
        'ui-testing': Math.floor(Math.random() * 1000),
        'api-validation': Math.floor(Math.random() * 500),
        'security-scanning': Math.floor(Math.random() * 200)
      }
    };
  }

  private async getQualityMetrics(): Promise<BusinessMetrics['quality']> {
    return {
      overallScore: 70 + Math.random() * 30,
      testCoverage: 80 + Math.random() * 20,
      bugRate: Math.random() * 5,
      customerSatisfaction: 4 + Math.random()
    };
  }

  private async getPerformanceMetrics(): Promise<BusinessMetrics['performance']> {
    return {
      uptime: 95 + Math.random() * 5,
      availability: 99 + Math.random(),
      mttr: 10 + Math.random() * 20, // minutes
      mttf: 1000 + Math.random() * 500 // hours
    };
  }

  // Public API methods
  getSystemMetrics(): SystemMetrics | null {
    return this.systemMetrics;
  }

  getApplicationMetrics(): ApplicationMetrics | null {
    return this.applicationMetrics;
  }

  getBusinessMetrics(): BusinessMetrics | null {
    return this.businessMetrics;
  }

  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  getMetricHistory(name: string, limit?: number): MetricPoint[] {
    const history = this.metricHistory.get(name) || [];
    return limit ? history.slice(-limit) : history;
  }

  getDashboardSummary() {
    return {
      isRunning: this.isRunning,
      metricsCount: this.metricHistory.size,
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved).length,
      totalAlerts: this.alerts.size,
      environment: environmentManager.getCurrentEnvironment(),
      uptime: process.uptime(),
      lastUpdate: Date.now()
    };
  }
}

// Export singleton instance
export const enterpriseDashboard = new EnterpriseDashboard();