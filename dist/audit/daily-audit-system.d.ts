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
import { Priority } from '../orchestration/parallel-task-manager.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
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
export declare enum AuditType {
    COMPREHENSIVE = "comprehensive",
    SECURITY = "security",
    PERFORMANCE = "performance",
    QUALITY = "quality",
    INFRASTRUCTURE = "infrastructure",
    COMPLIANCE = "compliance",
    DEPENDENCY = "dependency",
    BACKUP = "backup"
}
export interface AuditSchedule {
    frequency: ScheduleFrequency;
    time: string;
    timezone: string;
    days?: number[];
    dates?: number[];
    enabled: boolean;
}
export declare enum ScheduleFrequency {
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    CUSTOM = "custom"
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
export declare enum CheckCategory {
    SYSTEM = "system",
    APPLICATION = "application",
    SECURITY = "security",
    PERFORMANCE = "performance",
    QUALITY = "quality",
    COMPLIANCE = "compliance",
    INFRASTRUCTURE = "infrastructure",
    DATA_INTEGRITY = "data_integrity"
}
export declare enum CheckType {
    METRIC = "metric",
    SCRIPT = "script",
    API_CALL = "api_call",
    FILE_CHECK = "file_check",
    PROCESS_CHECK = "process_check",
    NETWORK_CHECK = "network_check",
    DATABASE_CHECK = "database_check",
    LOG_ANALYSIS = "log_analysis"
}
export interface CheckTarget {
    type: TargetType;
    identifier: string;
    environment?: string;
    endpoint?: string;
    path?: string;
    query?: string;
}
export declare enum TargetType {
    SYSTEM = "system",
    APPLICATION = "application",
    SERVICE = "service",
    DATABASE = "database",
    FILE = "file",
    DIRECTORY = "directory",
    ENDPOINT = "endpoint",
    PROCESS = "process",
    LOG_FILE = "log_file"
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
export declare enum ThresholdOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    EQUAL = "eq",
    NOT_EQUAL = "ne",
    GREATER_EQUAL = "gte",
    LESS_EQUAL = "lte",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains"
}
export interface AuditThresholds {
    overallHealth: number;
    criticalIssues: number;
    warningIssues: number;
    performanceScore: number;
    securityScore: number;
    qualityScore: number;
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
export declare enum NotificationSeverity {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical",
    EMERGENCY = "emergency"
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
export declare enum AuditStatus {
    SUCCESS = "success",
    WARNING = "warning",
    FAILURE = "failure",
    ERROR = "error",
    CANCELLED = "cancelled"
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
export declare enum CheckStatus {
    PASS = "pass",
    WARNING = "warning",
    FAIL = "fail",
    ERROR = "error",
    SKIP = "skip"
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
export declare enum IssueSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
    EMERGENCY = "emergency"
}
export declare enum IssueCategory {
    PERFORMANCE = "performance",
    SECURITY = "security",
    RELIABILITY = "reliability",
    QUALITY = "quality",
    COMPLIANCE = "compliance",
    INFRASTRUCTURE = "infrastructure",
    DATA = "data",
    CONFIGURATION = "configuration"
}
export declare enum ImpactLevel {
    MINIMAL = "minimal",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum UrgencyLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
    IMMEDIATE = "immediate"
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
export declare enum RecommendationCategory {
    PERFORMANCE_OPTIMIZATION = "performance_optimization",
    SECURITY_ENHANCEMENT = "security_enhancement",
    RELIABILITY_IMPROVEMENT = "reliability_improvement",
    QUALITY_IMPROVEMENT = "quality_improvement",
    INFRASTRUCTURE_UPGRADE = "infrastructure_upgrade",
    PROCESS_IMPROVEMENT = "process_improvement",
    MONITORING_ENHANCEMENT = "monitoring_enhancement",
    AUTOMATION = "automation"
}
export declare enum EffortLevel {
    MINIMAL = "minimal",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export interface TrendAnalysis {
    performanceTrend: TrendDirection;
    securityTrend: TrendDirection;
    qualityTrend: TrendDirection;
    reliabilityTrend: TrendDirection;
    issuesTrend: TrendDirection;
    historicalComparison: HistoricalComparison;
}
export declare enum TrendDirection {
    IMPROVING = "improving",
    STABLE = "stable",
    DECLINING = "declining",
    UNKNOWN = "unknown"
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
export declare class DailyAuditSystem extends EventEmitter {
    private environmentManager;
    private vectorStore?;
    private auditConfigs;
    private activeAudits;
    private auditHistory;
    private schedules;
    private healthChecks;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Run comprehensive daily audit
     */
    runDailyAudit(): Promise<AuditResult>;
    /**
     * Execute a specific audit configuration
     */
    executeAudit(config: AuditConfig): Promise<AuditResult>;
    /**
     * Run health check on demand
     */
    runHealthCheck(checkId: string): Promise<CheckResult>;
    /**
     * Add custom audit configuration
     */
    addAuditConfig(config: AuditConfig): Promise<void>;
    /**
     * Add custom health check
     */
    addHealthCheck(check: HealthCheck): Promise<void>;
    /**
     * Initialize default health checks
     */
    private initializeDefaultChecks;
    /**
     * Initialize default audit configurations
     */
    private initializeDefaultAudits;
    /**
     * Start the audit scheduler
     */
    private startScheduler;
    /**
     * Check for scheduled audits
     */
    private checkScheduledAudits;
    /**
     * Determine if audit should run based on schedule
     */
    private shouldRunAudit;
    /**
     * Create daily audit configuration
     */
    private createDailyAuditConfig;
    /**
     * Create tasks for health checks
     */
    private createCheckTasks;
    /**
     * Process check results from task execution
     */
    private processCheckResults;
    /**
     * Convert task execution result to check result
     */
    private convertTaskResultToCheckResult;
    /**
     * Execute a single health check
     */
    private executeHealthCheck;
    /**
     * Execute system command
     */
    private executeCommand;
    /**
     * Execute API call
     */
    private executeApiCall;
    /**
     * Evaluate check value against thresholds
     */
    private evaluateCheckThresholds;
    /**
     * Compare values based on operator
     */
    private compareValues;
    /**
     * Calculate audit scores
     */
    private calculateAuditScores;
    /**
     * Get numeric score for check status
     */
    private getCheckScore;
    /**
     * Calculate category score
     */
    private calculateCategoryScore;
    /**
     * Calculate overall health score
     */
    private calculateOverallHealth;
    /**
     * Identify issues from check results
     */
    private identifyIssues;
    /**
     * Generate recommendations based on issues and results
     */
    private generateRecommendations;
    /**
     * Generate category-specific recommendation
     */
    private generateCategoryRecommendation;
    /**
     * Perform trend analysis
     */
    private performTrendAnalysis;
    /**
     * Calculate trend direction
     */
    private calculateTrend;
    /**
     * Calculate percentage change
     */
    private calculatePercentageChange;
    /**
     * Identify significant changes
     */
    private identifySignificantChanges;
    /**
     * Create audit summary
     */
    private createAuditSummary;
    /**
     * Determine audit status
     */
    private determineAuditStatus;
    /**
     * Process audit notifications
     */
    private processAuditNotifications;
    /**
     * Get notification severity from audit status
     */
    private getNotificationSeverity;
    /**
     * Generate notification message
     */
    private generateNotificationMessage;
    /**
     * Cleanup old audit data
     */
    private cleanupOldAudits;
    private mapCheckCategoryToIssueCategory;
    private determineImpactLevel;
    private determineUrgencyLevel;
    private generateIssueRecommendation;
    private scheduleAudit;
    getAuditHistory(limit?: number): AuditResult[];
    getActiveAudits(): Map<string, AuditResult>;
    getHealthChecks(): Map<string, HealthCheck>;
    getAuditConfigs(): Map<string, AuditConfig>;
    enableAudit(auditId: string): Promise<void>;
    disableAudit(auditId: string): Promise<void>;
    enableHealthCheck(checkId: string): Promise<void>;
    disableHealthCheck(checkId: string): Promise<void>;
    /**
     * Convert SDK execution results to legacy format for backward compatibility
     * @private
     */
    private convertSDKToLegacyResults;
}
export default DailyAuditSystem;
