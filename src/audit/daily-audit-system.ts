/**
 * VERSATIL SDLC Framework - Daily Audit and Health Check System
 * Implements Rule 3: Run a complete audit and health check per day at least
 *
 * Features:
 * - Comprehensive daily health checks
 * - Security audit automation
 * - Performance monitoring and trending
 * - Code quality assessment
 * - Dependency vulnerability scanning
 * - Infrastructure health monitoring
 * - Compliance reporting
 * - Automated issue detection and alerting
 */

import { EventEmitter } from 'events';
import { EnvironmentManager } from '../environment/environment-manager.js';
import { ParallelTaskManager, Task, TaskType, Priority, SDLCPhase, CollisionRisk, ResourceType } from '../orchestration/parallel-task-manager.js';

export interface AuditConfig {
  id: string;
  name: string;
  type: AuditType;
  schedule: AuditSchedule;
  checks: HealthCheck[];
  thresholds: AuditThresholds;
  notifications: NotificationConfig;
  retention: RetentionPolicy;
  enabled: boolean;
}

export enum AuditType {
  COMPREHENSIVE = 'comprehensive',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  QUALITY = 'quality',
  INFRASTRUCTURE = 'infrastructure',
  COMPLIANCE = 'compliance',
  DEPENDENCY = 'dependency',
  BACKUP = 'backup'
}

export interface AuditSchedule {
  frequency: ScheduleFrequency;
  time: string; // HH:MM format
  timezone: string;
  days?: number[]; // Days of week (0-6)
  dates?: number[]; // Days of month (1-31)
  enabled: boolean;
}

export enum ScheduleFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export interface HealthCheck {
  id: string;
  name: string;
  category: CheckCategory;
  type: CheckType;
  target: CheckTarget;
  parameters: CheckParameters;
  thresholds: CheckThresholds;
  weight: number;
  critical: boolean;
  enabled: boolean;
}

export enum CheckCategory {
  SYSTEM = 'system',
  APPLICATION = 'application',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  INFRASTRUCTURE = 'infrastructure',
  DATA_INTEGRITY = 'data_integrity'
}

export enum CheckType {
  METRIC = 'metric',
  SCRIPT = 'script',
  API_CALL = 'api_call',
  FILE_CHECK = 'file_check',
  PROCESS_CHECK = 'process_check',
  NETWORK_CHECK = 'network_check',
  DATABASE_CHECK = 'database_check',
  LOG_ANALYSIS = 'log_analysis'
}

export interface CheckTarget {
  type: TargetType;
  identifier: string;
  environment?: string;
  endpoint?: string;
  path?: string;
  query?: string;
}

export enum TargetType {
  SYSTEM = 'system',
  APPLICATION = 'application',
  SERVICE = 'service',
  DATABASE = 'database',
  FILE = 'file',
  DIRECTORY = 'directory',
  ENDPOINT = 'endpoint',
  PROCESS = 'process',
  LOG_FILE = 'log_file'
}

export interface CheckParameters {
  command?: string;
  script?: string;
  url?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  interval?: number;
  customParams?: Record<string, any>;
}

export interface CheckThresholds {
  warning: ThresholdValue;
  critical: ThresholdValue;
  operator: ThresholdOperator;
  unit?: string;
}

export interface ThresholdValue {
  value: number;
  percentage?: boolean;
}

export enum ThresholdOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  GREATER_EQUAL = 'gte',
  LESS_EQUAL = 'lte',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains'
}

export interface AuditThresholds {
  overallHealth: number; // Percentage
  criticalIssues: number; // Maximum allowed
  warningIssues: number; // Maximum allowed
  performanceScore: number; // Minimum required
  securityScore: number; // Minimum required
  qualityScore: number; // Minimum required
}

export interface NotificationConfig {
  email: EmailNotification[];
  slack?: SlackNotification;
  webhook?: WebhookNotification[];
  sms?: SMSNotification[];
  dashboard: boolean;
}

export interface EmailNotification {
  recipients: string[];
  subject: string;
  template: string;
  attachReports: boolean;
  severity: NotificationSeverity[];
}

export interface SlackNotification {
  webhook: string;
  channel: string;
  username: string;
  severity: NotificationSeverity[];
}

export interface WebhookNotification {
  url: string;
  method: string;
  headers: Record<string, string>;
  severity: NotificationSeverity[];
}

export interface SMSNotification {
  recipients: string[];
  provider: string;
  apiKey: string;
  severity: NotificationSeverity[];
}

export enum NotificationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export interface RetentionPolicy {
  keepDays: number;
  keepReports: number;
  compressionEnabled: boolean;
  archiveLocation?: string;
}

export interface AuditResult {
  id: string;
  auditId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: AuditStatus;
  overallHealth: number;
  scores: AuditScores;
  checkResults: CheckResult[];
  issues: AuditIssue[];
  recommendations: AuditRecommendation[];
  trends: TrendAnalysis;
  summary: AuditSummary;
}

export enum AuditStatus {
  SUCCESS = 'success',
  WARNING = 'warning',
  FAILURE = 'failure',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export interface AuditScores {
  performance: number;
  security: number;
  quality: number;
  reliability: number;
  compliance: number;
  infrastructure: number;
}

export interface CheckResult {
  checkId: string;
  status: CheckStatus;
  value: any;
  message: string;
  timestamp: Date;
  duration: number;
  metadata: Record<string, any>;
}

export enum CheckStatus {
  PASS = 'pass',
  WARNING = 'warning',
  FAIL = 'fail',
  ERROR = 'error',
  SKIP = 'skip'
}

export interface AuditIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  impact: ImpactLevel;
  urgency: UrgencyLevel;
  source: string;
  checkId?: string;
  recommendation: string;
  evidence: any[];
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
}

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export enum IssueCategory {
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  RELIABILITY = 'reliability',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  INFRASTRUCTURE = 'infrastructure',
  DATA = 'data',
  CONFIGURATION = 'configuration'
}

export enum ImpactLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  IMMEDIATE = 'immediate'
}

export interface AuditRecommendation {
  id: string;
  priority: Priority;
  category: RecommendationCategory;
  title: string;
  description: string;
  implementation: string;
  estimatedImpact: ImpactLevel;
  estimatedEffort: EffortLevel;
  relatedIssues: string[];
  dueDate?: Date;
}

export enum RecommendationCategory {
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  SECURITY_ENHANCEMENT = 'security_enhancement',
  RELIABILITY_IMPROVEMENT = 'reliability_improvement',
  QUALITY_IMPROVEMENT = 'quality_improvement',
  INFRASTRUCTURE_UPGRADE = 'infrastructure_upgrade',
  PROCESS_IMPROVEMENT = 'process_improvement',
  MONITORING_ENHANCEMENT = 'monitoring_enhancement',
  AUTOMATION = 'automation'
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface TrendAnalysis {
  performanceTrend: TrendDirection;
  securityTrend: TrendDirection;
  qualityTrend: TrendDirection;
  reliabilityTrend: TrendDirection;
  issuesTrend: TrendDirection;
  historicalComparison: HistoricalComparison;
}

export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  UNKNOWN = 'unknown'
}

export interface HistoricalComparison {
  previousPeriod: AuditSummary;
  changePercentage: Record<string, number>;
  significantChanges: string[];
}

export interface AuditSummary {
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  errorChecks: number;
  criticalIssues: number;
  warningIssues: number;
  overallScore: number;
  executionTime: number;
}

export class DailyAuditSystem extends EventEmitter {
  private environmentManager: EnvironmentManager;
  private taskManager: ParallelTaskManager;
  private auditConfigs: Map<string, AuditConfig> = new Map();
  private activeAudits: Map<string, AuditResult> = new Map();
  private auditHistory: AuditResult[] = [];
  private schedules: Map<string, NodeJS.Timeout> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();

  constructor() {
    super();
    this.environmentManager = new EnvironmentManager();
    this.taskManager = new ParallelTaskManager();
    this.initializeDefaultChecks();
    this.initializeDefaultAudits();
    this.startScheduler();
  }

  /**
   * Run comprehensive daily audit
   */
  async runDailyAudit(): Promise<AuditResult> {
    const auditId = `daily_audit_${Date.now()}`;
    this.emit('audit:started', { auditId, type: 'daily' });

    const startTime = new Date();

    try {
      // Get current environment
      const environment = await this.environmentManager.getCurrentEnvironment();

      // Create comprehensive audit configuration
      const auditConfig = await this.createDailyAuditConfig(environment.name);

      // Execute audit
      const result = await this.executeAudit(auditConfig);

      this.emit('audit:completed', { auditId, result });

      // Send notifications if needed
      await this.processAuditNotifications(result);

      // Store result
      this.auditHistory.push(result);
      this.activeAudits.set(auditId, result);

      // Cleanup old audit data
      await this.cleanupOldAudits();

      return result;

    } catch (error) {
      this.emit('audit:failed', { auditId, error });
      throw error;
    }
  }

  /**
   * Execute a specific audit configuration
   */
  async executeAudit(config: AuditConfig): Promise<AuditResult> {
    const startTime = new Date();
    const auditId = `audit_${config.id}_${Date.now()}`;

    this.emit('audit:execution:started', { auditId, config });

    try {
      // Create parallel tasks for all health checks
      const checkTasks = await this.createCheckTasks(config.checks, auditId);

      // Execute checks in parallel
      const taskResults = await this.taskManager.executeParallel(checkTasks.map(t => t.id));

      // Process check results
      const checkResults = await this.processCheckResults(taskResults, config.checks);

      // Calculate scores and overall health
      const scores = this.calculateAuditScores(checkResults);
      const overallHealth = this.calculateOverallHealth(scores, checkResults);

      // Identify issues
      const issues = this.identifyIssues(checkResults, config.thresholds);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(issues, checkResults);

      // Perform trend analysis
      const trends = await this.performTrendAnalysis(scores, issues);

      // Create audit summary
      const summary = this.createAuditSummary(checkResults);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: AuditResult = {
        id: auditId,
        auditId: config.id,
        startTime,
        endTime,
        duration,
        status: this.determineAuditStatus(overallHealth, issues),
        overallHealth,
        scores,
        checkResults,
        issues,
        recommendations,
        trends,
        summary
      };

      this.emit('audit:execution:completed', { auditId, result });

      return result;

    } catch (error) {
      this.emit('audit:execution:failed', { auditId, error });
      throw error;
    }
  }

  /**
   * Run health check on demand
   */
  async runHealthCheck(checkId: string): Promise<CheckResult> {
    const check = this.healthChecks.get(checkId);
    if (!check) {
      throw new Error(`Health check not found: ${checkId}`);
    }

    this.emit('health_check:started', { checkId, check });

    const startTime = new Date();

    try {
      const result = await this.executeHealthCheck(check);

      this.emit('health_check:completed', { checkId, result });

      return result;

    } catch (error) {
      this.emit('health_check:failed', { checkId, error });

      const result: CheckResult = {
        checkId,
        status: CheckStatus.ERROR,
        value: null,
        message: `Check execution failed: ${error.message}`,
        timestamp: new Date(),
        duration: Date.now() - startTime.getTime(),
        metadata: { error: error.message }
      };

      return result;
    }
  }

  /**
   * Add custom audit configuration
   */
  async addAuditConfig(config: AuditConfig): Promise<void> {
    this.auditConfigs.set(config.id, config);

    if (config.schedule.enabled) {
      this.scheduleAudit(config);
    }

    this.emit('audit_config:added', { config });
  }

  /**
   * Add custom health check
   */
  async addHealthCheck(check: HealthCheck): Promise<void> {
    this.healthChecks.set(check.id, check);
    this.emit('health_check:added', { check });
  }

  /**
   * Initialize default health checks
   */
  private initializeDefaultChecks(): void {
    const defaultChecks: HealthCheck[] = [
      // System checks
      {
        id: 'system_cpu_usage',
        name: 'CPU Usage',
        category: CheckCategory.SYSTEM,
        type: CheckType.METRIC,
        target: { type: TargetType.SYSTEM, identifier: 'cpu' },
        parameters: { command: 'top -bn1 | grep "Cpu(s)" | awk \'{print $2}\' | awk -F\'%\' \'{print $1}\'' },
        thresholds: {
          warning: { value: 80 },
          critical: { value: 90 },
          operator: ThresholdOperator.GREATER_THAN,
          unit: '%'
        },
        weight: 0.8,
        critical: true,
        enabled: true
      },
      {
        id: 'system_memory_usage',
        name: 'Memory Usage',
        category: CheckCategory.SYSTEM,
        type: CheckType.METRIC,
        target: { type: TargetType.SYSTEM, identifier: 'memory' },
        parameters: { command: 'free | grep Mem | awk \'{printf "%.2f", ($3/$2) * 100.0}\'' },
        thresholds: {
          warning: { value: 80 },
          critical: { value: 95 },
          operator: ThresholdOperator.GREATER_THAN,
          unit: '%'
        },
        weight: 0.9,
        critical: true,
        enabled: true
      },
      {
        id: 'system_disk_usage',
        name: 'Disk Usage',
        category: CheckCategory.SYSTEM,
        type: CheckType.METRIC,
        target: { type: TargetType.SYSTEM, identifier: 'disk' },
        parameters: { command: 'df -h / | awk \'NR==2 {print $5}\' | sed \'s/%//\'' },
        thresholds: {
          warning: { value: 80 },
          critical: { value: 90 },
          operator: ThresholdOperator.GREATER_THAN,
          unit: '%'
        },
        weight: 0.7,
        critical: true,
        enabled: true
      },

      // Application checks
      {
        id: 'app_process_running',
        name: 'Application Process',
        category: CheckCategory.APPLICATION,
        type: CheckType.PROCESS_CHECK,
        target: { type: TargetType.PROCESS, identifier: 'node' },
        parameters: { command: 'pgrep -f "node.*versatil" | wc -l' },
        thresholds: {
          warning: { value: 1 },
          critical: { value: 1 },
          operator: ThresholdOperator.LESS_THAN
        },
        weight: 1.0,
        critical: true,
        enabled: true
      },
      {
        id: 'app_response_time',
        name: 'Application Response Time',
        category: CheckCategory.PERFORMANCE,
        type: CheckType.API_CALL,
        target: { type: TargetType.ENDPOINT, identifier: 'health', endpoint: '/health' },
        parameters: {
          url: 'http://localhost:3000/health',
          timeout: 5000,
          retries: 3
        },
        thresholds: {
          warning: { value: 2000 },
          critical: { value: 5000 },
          operator: ThresholdOperator.GREATER_THAN,
          unit: 'ms'
        },
        weight: 0.9,
        critical: false,
        enabled: true
      },

      // Security checks
      {
        id: 'security_file_permissions',
        name: 'Critical File Permissions',
        category: CheckCategory.SECURITY,
        type: CheckType.FILE_CHECK,
        target: { type: TargetType.FILE, identifier: 'config_files' },
        parameters: {
          script: 'find . -name "*.json" -o -name "*.env" | xargs ls -la | grep -v "^-rw-------" | wc -l'
        },
        thresholds: {
          warning: { value: 0 },
          critical: { value: 0 },
          operator: ThresholdOperator.GREATER_THAN
        },
        weight: 0.8,
        critical: true,
        enabled: true
      },
      {
        id: 'security_dependency_vulnerabilities',
        name: 'Dependency Vulnerabilities',
        category: CheckCategory.SECURITY,
        type: CheckType.SCRIPT,
        target: { type: TargetType.APPLICATION, identifier: 'dependencies' },
        parameters: {
          command: 'npm audit --audit-level high --json | jq ".metadata.vulnerabilities.high + .metadata.vulnerabilities.critical"'
        },
        thresholds: {
          warning: { value: 0 },
          critical: { value: 0 },
          operator: ThresholdOperator.GREATER_THAN
        },
        weight: 1.0,
        critical: true,
        enabled: true
      },

      // Quality checks
      {
        id: 'quality_test_coverage',
        name: 'Test Coverage',
        category: CheckCategory.QUALITY,
        type: CheckType.SCRIPT,
        target: { type: TargetType.APPLICATION, identifier: 'tests' },
        parameters: {
          command: 'npm run test:coverage --silent | grep "All files" | awk \'{print $10}\' | sed \'s/%//\''
        },
        thresholds: {
          warning: { value: 80 },
          critical: { value: 70 },
          operator: ThresholdOperator.LESS_THAN,
          unit: '%'
        },
        weight: 0.7,
        critical: false,
        enabled: true
      },
      {
        id: 'quality_typescript_errors',
        name: 'TypeScript Errors',
        category: CheckCategory.QUALITY,
        type: CheckType.SCRIPT,
        target: { type: TargetType.APPLICATION, identifier: 'typescript' },
        parameters: {
          command: 'npx tsc --noEmit 2>&1 | grep "error TS" | wc -l'
        },
        thresholds: {
          warning: { value: 0 },
          critical: { value: 0 },
          operator: ThresholdOperator.GREATER_THAN
        },
        weight: 0.9,
        critical: false,
        enabled: true
      },

      // Infrastructure checks
      {
        id: 'infrastructure_git_status',
        name: 'Git Repository Status',
        category: CheckCategory.INFRASTRUCTURE,
        type: CheckType.SCRIPT,
        target: { type: TargetType.APPLICATION, identifier: 'git' },
        parameters: {
          command: 'git status --porcelain | wc -l'
        },
        thresholds: {
          warning: { value: 10 },
          critical: { value: 50 },
          operator: ThresholdOperator.GREATER_THAN
        },
        weight: 0.3,
        critical: false,
        enabled: true
      },
      {
        id: 'infrastructure_log_errors',
        name: 'Application Log Errors',
        category: CheckCategory.INFRASTRUCTURE,
        type: CheckType.LOG_ANALYSIS,
        target: { type: TargetType.LOG_FILE, identifier: 'app_logs' },
        parameters: {
          command: 'find . -name "*.log" -mtime -1 -exec grep -i "error\\|exception\\|fatal" {} \\; | wc -l'
        },
        thresholds: {
          warning: { value: 10 },
          critical: { value: 50 },
          operator: ThresholdOperator.GREATER_THAN
        },
        weight: 0.6,
        critical: false,
        enabled: true
      }
    ];

    for (const check of defaultChecks) {
      this.healthChecks.set(check.id, check);
    }
  }

  /**
   * Initialize default audit configurations
   */
  private initializeDefaultAudits(): void {
    const dailyAudit: AuditConfig = {
      id: 'daily_comprehensive',
      name: 'Daily Comprehensive Audit',
      type: AuditType.COMPREHENSIVE,
      schedule: {
        frequency: ScheduleFrequency.DAILY,
        time: '02:00',
        timezone: 'UTC',
        enabled: true
      },
      checks: Array.from(this.healthChecks.values()),
      thresholds: {
        overallHealth: 85,
        criticalIssues: 0,
        warningIssues: 5,
        performanceScore: 80,
        securityScore: 95,
        qualityScore: 80
      },
      notifications: {
        email: [
          {
            recipients: ['admin@versatil.com'],
            subject: 'VERSATIL Daily Audit Report',
            template: 'daily_audit',
            attachReports: true,
            severity: [NotificationSeverity.WARNING, NotificationSeverity.CRITICAL]
          }
        ],
        dashboard: true
      },
      retention: {
        keepDays: 90,
        keepReports: 30,
        compressionEnabled: true
      },
      enabled: true
    };

    this.auditConfigs.set(dailyAudit.id, dailyAudit);
  }

  /**
   * Start the audit scheduler
   */
  private startScheduler(): void {
    // Check for scheduled audits every minute
    setInterval(() => {
      this.checkScheduledAudits();
    }, 60000);

    this.emit('scheduler:started');
  }

  /**
   * Check for scheduled audits
   */
  private checkScheduledAudits(): void {
    const now = new Date();

    for (const [configId, config] of this.auditConfigs) {
      if (!config.enabled || !config.schedule.enabled) continue;

      if (this.shouldRunAudit(config, now)) {
        this.executeAudit(config).catch(error => {
          this.emit('scheduled_audit:failed', { configId, error });
        });
      }
    }
  }

  /**
   * Determine if audit should run based on schedule
   */
  private shouldRunAudit(config: AuditConfig, now: Date): boolean {
    const [hours, minutes] = config.schedule.time.split(':').map(Number);

    // Simple daily schedule check
    if (config.schedule.frequency === ScheduleFrequency.DAILY) {
      return now.getHours() === hours && now.getMinutes() === minutes;
    }

    // Add more sophisticated scheduling logic here
    return false;
  }

  /**
   * Create daily audit configuration
   */
  private async createDailyAuditConfig(environment: string): Promise<AuditConfig> {
    const enabledChecks = Array.from(this.healthChecks.values())
      .filter(check => check.enabled);

    return {
      id: `daily_audit_${environment}`,
      name: `Daily Audit - ${environment}`,
      type: AuditType.COMPREHENSIVE,
      schedule: {
        frequency: ScheduleFrequency.DAILY,
        time: '02:00',
        timezone: 'UTC',
        enabled: false // One-time execution
      },
      checks: enabledChecks,
      thresholds: {
        overallHealth: 85,
        criticalIssues: 0,
        warningIssues: 5,
        performanceScore: 80,
        securityScore: 95,
        qualityScore: 80
      },
      notifications: {
        email: [],
        dashboard: true
      },
      retention: {
        keepDays: 90,
        keepReports: 30,
        compressionEnabled: true
      },
      enabled: true
    };
  }

  /**
   * Create tasks for health checks
   */
  private async createCheckTasks(checks: HealthCheck[], auditId: string): Promise<Task[]> {
    return checks.map(check => ({
      id: `health_check_${check.id}_${auditId}`,
      name: `Health Check: ${check.name}`,
      type: TaskType.MONITORING,
      priority: check.critical ? Priority.HIGH : Priority.MEDIUM,
      estimatedDuration: 30000, // 30 seconds per check
      requiredResources: [
        { type: ResourceType.CPU, name: 'cpu-cores', capacity: 1, exclusive: false }
      ],
      dependencies: [],
      agentId: 'maria-qa',
      sdlcPhase: SDLCPhase.TESTING,
      collisionRisk: CollisionRisk.LOW,
      metadata: { healthCheck: check, auditId }
    }));
  }

  /**
   * Process check results from task execution
   */
  private async processCheckResults(
    taskResults: Map<string, any>,
    checks: HealthCheck[]
  ): Promise<CheckResult[]> {
    const checkResults: CheckResult[] = [];

    for (const check of checks) {
      const taskId = `health_check_${check.id}`;
      const taskResult = Array.from(taskResults.entries())
        .find(([id]) => id.includes(taskId));

      if (taskResult) {
        const [, execution] = taskResult;
        const result = await this.convertTaskResultToCheckResult(check, execution);
        checkResults.push(result);
      } else {
        // Create error result for missing execution
        checkResults.push({
          checkId: check.id,
          status: CheckStatus.ERROR,
          value: null,
          message: 'Check execution not found',
          timestamp: new Date(),
          duration: 0,
          metadata: { error: 'Task execution missing' }
        });
      }
    }

    return checkResults;
  }

  /**
   * Convert task execution result to check result
   */
  private async convertTaskResultToCheckResult(
    check: HealthCheck,
    execution: any
  ): Promise<CheckResult> {
    if (execution.status === 'failed') {
      return {
        checkId: check.id,
        status: CheckStatus.ERROR,
        value: null,
        message: execution.error?.message || 'Check execution failed',
        timestamp: execution.startTime,
        duration: execution.endTime - execution.startTime,
        metadata: { execution }
      };
    }

    // Execute the actual health check
    return await this.executeHealthCheck(check);
  }

  /**
   * Execute a single health check
   */
  private async executeHealthCheck(check: HealthCheck): Promise<CheckResult> {
    const startTime = new Date();

    try {
      let value: any;
      let message = '';

      switch (check.type) {
        case CheckType.METRIC:
        case CheckType.SCRIPT:
          if (check.parameters.command) {
            // Execute command and parse result
            value = await this.executeCommand(check.parameters.command);
            message = `Command executed successfully: ${value}`;
          }
          break;

        case CheckType.API_CALL:
          if (check.parameters.url) {
            const response = await this.executeApiCall(check.parameters);
            value = response.responseTime;
            message = `API call completed with status ${response.status}`;
          }
          break;

        case CheckType.FILE_CHECK:
          if (check.parameters.script) {
            value = await this.executeCommand(check.parameters.script);
            message = `File check completed: ${value}`;
          }
          break;

        case CheckType.PROCESS_CHECK:
          if (check.parameters.command) {
            value = await this.executeCommand(check.parameters.command);
            message = `Process check completed: ${value}`;
          }
          break;

        default:
          throw new Error(`Unsupported check type: ${check.type}`);
      }

      // Evaluate against thresholds
      const status = this.evaluateCheckThresholds(value, check.thresholds);

      const endTime = new Date();
      return {
        checkId: check.id,
        status,
        value,
        message,
        timestamp: startTime,
        duration: endTime.getTime() - startTime.getTime(),
        metadata: { check }
      };

    } catch (error) {
      const endTime = new Date();
      return {
        checkId: check.id,
        status: CheckStatus.ERROR,
        value: null,
        message: `Check failed: ${error.message}`,
        timestamp: startTime,
        duration: endTime.getTime() - startTime.getTime(),
        metadata: { error: error.message }
      };
    }
  }

  /**
   * Execute system command
   */
  private async executeCommand(command: string): Promise<any> {
    // Simulate command execution
    // In real implementation, use child_process.exec or similar
    return Math.random() * 100;
  }

  /**
   * Execute API call
   */
  private async executeApiCall(parameters: CheckParameters): Promise<any> {
    const startTime = Date.now();

    try {
      // Simulate API call
      const responseTime = Math.random() * 2000 + 100;
      return {
        status: 200,
        responseTime,
        success: true
      };
    } catch (error) {
      return {
        status: 500,
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Evaluate check value against thresholds
   */
  private evaluateCheckThresholds(value: any, thresholds: CheckThresholds): CheckStatus {
    if (value === null || value === undefined) {
      return CheckStatus.ERROR;
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) {
      return CheckStatus.ERROR;
    }

    const { operator, critical, warning } = thresholds;

    // Check critical threshold first
    if (this.compareValues(numValue, critical.value, operator)) {
      return CheckStatus.FAIL;
    }

    // Check warning threshold
    if (this.compareValues(numValue, warning.value, operator)) {
      return CheckStatus.WARNING;
    }

    return CheckStatus.PASS;
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: number, threshold: number, operator: ThresholdOperator): boolean {
    switch (operator) {
      case ThresholdOperator.GREATER_THAN:
        return actual > threshold;
      case ThresholdOperator.LESS_THAN:
        return actual < threshold;
      case ThresholdOperator.GREATER_EQUAL:
        return actual >= threshold;
      case ThresholdOperator.LESS_EQUAL:
        return actual <= threshold;
      case ThresholdOperator.EQUAL:
        return actual === threshold;
      case ThresholdOperator.NOT_EQUAL:
        return actual !== threshold;
      default:
        return false;
    }
  }

  /**
   * Calculate audit scores
   */
  private calculateAuditScores(checkResults: CheckResult[]): AuditScores {
    const categoryScores = new Map<CheckCategory, { total: number; weight: number }>();

    // Initialize categories
    for (const category of Object.values(CheckCategory)) {
      categoryScores.set(category, { total: 0, weight: 0 });
    }

    // Calculate weighted scores by category
    for (const result of checkResults) {
      const check = this.healthChecks.get(result.checkId);
      if (!check) continue;

      const score = this.getCheckScore(result.status);
      const category = check.category;
      const weight = check.weight;

      const current = categoryScores.get(category) || { total: 0, weight: 0 };
      current.total += score * weight;
      current.weight += weight;
      categoryScores.set(category, current);
    }

    // Calculate final scores
    const scores: AuditScores = {
      performance: this.calculateCategoryScore(categoryScores, CheckCategory.PERFORMANCE),
      security: this.calculateCategoryScore(categoryScores, CheckCategory.SECURITY),
      quality: this.calculateCategoryScore(categoryScores, CheckCategory.QUALITY),
      reliability: this.calculateCategoryScore(categoryScores, CheckCategory.SYSTEM),
      compliance: this.calculateCategoryScore(categoryScores, CheckCategory.COMPLIANCE),
      infrastructure: this.calculateCategoryScore(categoryScores, CheckCategory.INFRASTRUCTURE)
    };

    return scores;
  }

  /**
   * Get numeric score for check status
   */
  private getCheckScore(status: CheckStatus): number {
    switch (status) {
      case CheckStatus.PASS:
        return 100;
      case CheckStatus.WARNING:
        return 70;
      case CheckStatus.FAIL:
        return 30;
      case CheckStatus.ERROR:
        return 0;
      case CheckStatus.SKIP:
        return 50;
      default:
        return 0;
    }
  }

  /**
   * Calculate category score
   */
  private calculateCategoryScore(
    categoryScores: Map<CheckCategory, { total: number; weight: number }>,
    category: CheckCategory
  ): number {
    const categoryData = categoryScores.get(category);
    if (!categoryData || categoryData.weight === 0) {
      return 100; // Default to perfect score if no checks in category
    }

    return Math.round(categoryData.total / categoryData.weight);
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(scores: AuditScores, checkResults: CheckResult[]): number {
    const weights = {
      security: 0.25,
      reliability: 0.20,
      performance: 0.20,
      quality: 0.15,
      infrastructure: 0.10,
      compliance: 0.10
    };

    const weightedScore =
      scores.security * weights.security +
      scores.reliability * weights.reliability +
      scores.performance * weights.performance +
      scores.quality * weights.quality +
      scores.infrastructure * weights.infrastructure +
      scores.compliance * weights.compliance;

    // Apply penalty for critical failures
    const criticalFailures = checkResults.filter(r =>
      r.status === CheckStatus.FAIL && this.healthChecks.get(r.checkId)?.critical
    ).length;

    const penalty = criticalFailures * 10; // 10 points per critical failure

    return Math.max(0, Math.round(weightedScore - penalty));
  }

  /**
   * Identify issues from check results
   */
  private identifyIssues(checkResults: CheckResult[], thresholds: AuditThresholds): AuditIssue[] {
    const issues: AuditIssue[] = [];

    for (const result of checkResults) {
      if (result.status === CheckStatus.FAIL || result.status === CheckStatus.WARNING) {
        const check = this.healthChecks.get(result.checkId);
        if (!check) continue;

        const severity = result.status === CheckStatus.FAIL ?
          (check.critical ? IssueSeverity.CRITICAL : IssueSeverity.HIGH) :
          IssueSeverity.MEDIUM;

        issues.push({
          id: `issue_${result.checkId}_${Date.now()}`,
          severity,
          category: this.mapCheckCategoryToIssueCategory(check.category),
          title: `${check.name} ${result.status === CheckStatus.FAIL ? 'Failed' : 'Warning'}`,
          description: result.message,
          impact: this.determineImpactLevel(severity, check.critical),
          urgency: this.determineUrgencyLevel(severity, check.critical),
          source: check.id,
          checkId: check.id,
          recommendation: this.generateIssueRecommendation(check, result),
          evidence: [result],
          firstSeen: result.timestamp,
          lastSeen: result.timestamp,
          occurrences: 1
        });
      }
    }

    return issues;
  }

  /**
   * Generate recommendations based on issues and results
   */
  private async generateRecommendations(
    issues: AuditIssue[],
    checkResults: CheckResult[]
  ): Promise<AuditRecommendation[]> {
    const recommendations: AuditRecommendation[] = [];

    // Group issues by category
    const issuesByCategory = new Map<IssueCategory, AuditIssue[]>();
    for (const issue of issues) {
      const existing = issuesByCategory.get(issue.category) || [];
      existing.push(issue);
      issuesByCategory.set(issue.category, existing);
    }

    // Generate recommendations for each category
    for (const [category, categoryIssues] of issuesByCategory) {
      const recommendation = this.generateCategoryRecommendation(category, categoryIssues);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Generate category-specific recommendation
   */
  private generateCategoryRecommendation(
    category: IssueCategory,
    issues: AuditIssue[]
  ): AuditRecommendation | null {
    const criticalIssues = issues.filter(i => i.severity >= IssueSeverity.HIGH);
    const priority = criticalIssues.length > 0 ? Priority.HIGH : Priority.MEDIUM;

    switch (category) {
      case IssueCategory.PERFORMANCE:
        return {
          id: `rec_perf_${Date.now()}`,
          priority,
          category: RecommendationCategory.PERFORMANCE_OPTIMIZATION,
          title: 'Optimize System Performance',
          description: 'Address performance bottlenecks identified in the audit',
          implementation: 'Review and optimize slow operations, consider caching, database optimization',
          estimatedImpact: ImpactLevel.HIGH,
          estimatedEffort: EffortLevel.MEDIUM,
          relatedIssues: issues.map(i => i.id)
        };

      case IssueCategory.SECURITY:
        return {
          id: `rec_sec_${Date.now()}`,
          priority: Priority.CRITICAL,
          category: RecommendationCategory.SECURITY_ENHANCEMENT,
          title: 'Address Security Vulnerabilities',
          description: 'Critical security issues require immediate attention',
          implementation: 'Update dependencies, fix file permissions, implement security patches',
          estimatedImpact: ImpactLevel.CRITICAL,
          estimatedEffort: EffortLevel.HIGH,
          relatedIssues: issues.map(i => i.id)
        };

      case IssueCategory.QUALITY:
        return {
          id: `rec_qual_${Date.now()}`,
          priority,
          category: RecommendationCategory.QUALITY_IMPROVEMENT,
          title: 'Improve Code Quality',
          description: 'Address code quality issues and increase test coverage',
          implementation: 'Increase test coverage, fix TypeScript errors, improve code standards',
          estimatedImpact: ImpactLevel.MEDIUM,
          estimatedEffort: EffortLevel.MEDIUM,
          relatedIssues: issues.map(i => i.id)
        };

      default:
        return null;
    }
  }

  /**
   * Perform trend analysis
   */
  private async performTrendAnalysis(scores: AuditScores, issues: AuditIssue[]): Promise<TrendAnalysis> {
    // Get historical data for comparison
    const historicalResults = this.auditHistory.slice(-5); // Last 5 audits

    if (historicalResults.length === 0) {
      return {
        performanceTrend: TrendDirection.UNKNOWN,
        securityTrend: TrendDirection.UNKNOWN,
        qualityTrend: TrendDirection.UNKNOWN,
        reliabilityTrend: TrendDirection.UNKNOWN,
        issuesTrend: TrendDirection.UNKNOWN,
        historicalComparison: {
          previousPeriod: {
            totalChecks: 0,
            passedChecks: 0,
            warningChecks: 0,
            failedChecks: 0,
            errorChecks: 0,
            criticalIssues: 0,
            warningIssues: 0,
            overallScore: 0,
            executionTime: 0
          },
          changePercentage: {},
          significantChanges: []
        }
      };
    }

    const previous = historicalResults[historicalResults.length - 1];

    return {
      performanceTrend: this.calculateTrend(scores.performance, previous.scores.performance),
      securityTrend: this.calculateTrend(scores.security, previous.scores.security),
      qualityTrend: this.calculateTrend(scores.quality, previous.scores.quality),
      reliabilityTrend: this.calculateTrend(scores.reliability, previous.scores.reliability),
      issuesTrend: this.calculateTrend(
        issues.filter(i => i.severity >= IssueSeverity.HIGH).length,
        previous.issues.filter(i => i.severity >= IssueSeverity.HIGH).length,
        true // Inverted - fewer issues is better
      ),
      historicalComparison: {
        previousPeriod: previous.summary,
        changePercentage: {
          performance: this.calculatePercentageChange(scores.performance, previous.scores.performance),
          security: this.calculatePercentageChange(scores.security, previous.scores.security),
          quality: this.calculatePercentageChange(scores.quality, previous.scores.quality)
        },
        significantChanges: this.identifySignificantChanges(scores, previous.scores)
      }
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(current: number, previous: number, inverted = false): TrendDirection {
    const threshold = 5; // 5% threshold for significant change
    const change = ((current - previous) / previous) * 100;

    if (Math.abs(change) < threshold) {
      return TrendDirection.STABLE;
    }

    const improving = inverted ? change < 0 : change > 0;
    return improving ? TrendDirection.IMPROVING : TrendDirection.DECLINING;
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Identify significant changes
   */
  private identifySignificantChanges(current: AuditScores, previous: AuditScores): string[] {
    const changes: string[] = [];
    const threshold = 10; // 10% threshold for significant change

    const scores = [
      { name: 'Performance', current: current.performance, previous: previous.performance },
      { name: 'Security', current: current.security, previous: previous.security },
      { name: 'Quality', current: current.quality, previous: previous.quality },
      { name: 'Reliability', current: current.reliability, previous: previous.reliability }
    ];

    for (const score of scores) {
      const change = this.calculatePercentageChange(score.current, score.previous);
      if (Math.abs(change) >= threshold) {
        const direction = change > 0 ? 'improved' : 'declined';
        changes.push(`${score.name} ${direction} by ${Math.abs(change)}%`);
      }
    }

    return changes;
  }

  /**
   * Create audit summary
   */
  private createAuditSummary(checkResults: CheckResult[]): AuditSummary {
    const statusCounts = checkResults.reduce(
      (acc, result) => {
        acc[result.status]++;
        return acc;
      },
      {
        [CheckStatus.PASS]: 0,
        [CheckStatus.WARNING]: 0,
        [CheckStatus.FAIL]: 0,
        [CheckStatus.ERROR]: 0,
        [CheckStatus.SKIP]: 0
      }
    );

    return {
      totalChecks: checkResults.length,
      passedChecks: statusCounts[CheckStatus.PASS],
      warningChecks: statusCounts[CheckStatus.WARNING],
      failedChecks: statusCounts[CheckStatus.FAIL],
      errorChecks: statusCounts[CheckStatus.ERROR],
      criticalIssues: checkResults.filter(r =>
        r.status === CheckStatus.FAIL && this.healthChecks.get(r.checkId)?.critical
      ).length,
      warningIssues: statusCounts[CheckStatus.WARNING],
      overallScore: this.calculateOverallHealth(
        this.calculateAuditScores(checkResults),
        checkResults
      ),
      executionTime: checkResults.reduce((sum, r) => sum + r.duration, 0)
    };
  }

  /**
   * Determine audit status
   */
  private determineAuditStatus(overallHealth: number, issues: AuditIssue[]): AuditStatus {
    const criticalIssues = issues.filter(i => i.severity >= IssueSeverity.CRITICAL).length;
    const highIssues = issues.filter(i => i.severity >= IssueSeverity.HIGH).length;

    if (criticalIssues > 0) return AuditStatus.FAILURE;
    if (highIssues > 3 || overallHealth < 70) return AuditStatus.WARNING;
    return AuditStatus.SUCCESS;
  }

  /**
   * Process audit notifications
   */
  private async processAuditNotifications(result: AuditResult): Promise<void> {
    // Determine notification severity
    const severity = this.getNotificationSeverity(result.status);

    // Send notifications based on configuration
    this.emit('notification:audit_complete', {
      result,
      severity,
      message: this.generateNotificationMessage(result)
    });
  }

  /**
   * Get notification severity from audit status
   */
  private getNotificationSeverity(status: AuditStatus): NotificationSeverity {
    switch (status) {
      case AuditStatus.FAILURE:
        return NotificationSeverity.CRITICAL;
      case AuditStatus.WARNING:
        return NotificationSeverity.WARNING;
      case AuditStatus.SUCCESS:
        return NotificationSeverity.INFO;
      default:
        return NotificationSeverity.INFO;
    }
  }

  /**
   * Generate notification message
   */
  private generateNotificationMessage(result: AuditResult): string {
    const { status, overallHealth, issues, summary } = result;

    const criticalIssues = issues.filter(i => i.severity >= IssueSeverity.CRITICAL).length;
    const warningIssues = issues.filter(i => i.severity === IssueSeverity.MEDIUM).length;

    return `Daily Audit Complete - Status: ${status.toUpperCase()}
Overall Health: ${overallHealth}%
Critical Issues: ${criticalIssues}
Warning Issues: ${warningIssues}
Checks Passed: ${summary.passedChecks}/${summary.totalChecks}`;
  }

  /**
   * Cleanup old audit data
   */
  private async cleanupOldAudits(): Promise<void> {
    const retentionDays = 90; // Keep 90 days of audit history
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.auditHistory = this.auditHistory.filter(
      result => result.startTime >= cutoffDate
    );

    // Also cleanup active audits map
    for (const [id, result] of this.activeAudits) {
      if (result.startTime < cutoffDate) {
        this.activeAudits.delete(id);
      }
    }
  }

  // Helper methods for mapping and determination
  private mapCheckCategoryToIssueCategory(checkCategory: CheckCategory): IssueCategory {
    switch (checkCategory) {
      case CheckCategory.SECURITY:
        return IssueCategory.SECURITY;
      case CheckCategory.PERFORMANCE:
        return IssueCategory.PERFORMANCE;
      case CheckCategory.QUALITY:
        return IssueCategory.QUALITY;
      case CheckCategory.COMPLIANCE:
        return IssueCategory.COMPLIANCE;
      case CheckCategory.INFRASTRUCTURE:
        return IssueCategory.INFRASTRUCTURE;
      default:
        return IssueCategory.CONFIGURATION;
    }
  }

  private determineImpactLevel(severity: IssueSeverity, critical: boolean): ImpactLevel {
    if (critical && severity >= IssueSeverity.HIGH) return ImpactLevel.CRITICAL;
    if (severity >= IssueSeverity.CRITICAL) return ImpactLevel.HIGH;
    if (severity >= IssueSeverity.HIGH) return ImpactLevel.MEDIUM;
    return ImpactLevel.LOW;
  }

  private determineUrgencyLevel(severity: IssueSeverity, critical: boolean): UrgencyLevel {
    if (critical && severity >= IssueSeverity.CRITICAL) return UrgencyLevel.IMMEDIATE;
    if (severity >= IssueSeverity.CRITICAL) return UrgencyLevel.CRITICAL;
    if (severity >= IssueSeverity.HIGH) return UrgencyLevel.HIGH;
    return UrgencyLevel.MEDIUM;
  }

  private generateIssueRecommendation(check: HealthCheck, result: CheckResult): string {
    switch (check.category) {
      case CheckCategory.SYSTEM:
        return `Investigate and optimize ${check.name.toLowerCase()} usage`;
      case CheckCategory.SECURITY:
        return `Address security vulnerability in ${check.name.toLowerCase()}`;
      case CheckCategory.PERFORMANCE:
        return `Optimize ${check.name.toLowerCase()} to improve performance`;
      case CheckCategory.QUALITY:
        return `Improve ${check.name.toLowerCase()} to meet quality standards`;
      default:
        return `Review and resolve ${check.name.toLowerCase()} issue`;
    }
  }

  private scheduleAudit(config: AuditConfig): void {
    // Implementation for scheduling recurring audits
    // This would use node-cron or similar scheduling library
  }

  // Public API methods
  public getAuditHistory(limit?: number): AuditResult[] {
    return limit ? this.auditHistory.slice(-limit) : [...this.auditHistory];
  }

  public getActiveAudits(): Map<string, AuditResult> {
    return new Map(this.activeAudits);
  }

  public getHealthChecks(): Map<string, HealthCheck> {
    return new Map(this.healthChecks);
  }

  public getAuditConfigs(): Map<string, AuditConfig> {
    return new Map(this.auditConfigs);
  }

  public async enableAudit(auditId: string): Promise<void> {
    const config = this.auditConfigs.get(auditId);
    if (config) {
      config.enabled = true;
      if (config.schedule.enabled) {
        this.scheduleAudit(config);
      }
      this.emit('audit_config:enabled', { auditId });
    }
  }

  public async disableAudit(auditId: string): Promise<void> {
    const config = this.auditConfigs.get(auditId);
    if (config) {
      config.enabled = false;
      const timeout = this.schedules.get(auditId);
      if (timeout) {
        clearTimeout(timeout);
        this.schedules.delete(auditId);
      }
      this.emit('audit_config:disabled', { auditId });
    }
  }

  public async enableHealthCheck(checkId: string): Promise<void> {
    const check = this.healthChecks.get(checkId);
    if (check) {
      check.enabled = true;
      this.emit('health_check:enabled', { checkId });
    }
  }

  public async disableHealthCheck(checkId: string): Promise<void> {
    const check = this.healthChecks.get(checkId);
    if (check) {
      check.enabled = false;
      this.emit('health_check:disabled', { checkId });
    }
  }
}

export default DailyAuditSystem;