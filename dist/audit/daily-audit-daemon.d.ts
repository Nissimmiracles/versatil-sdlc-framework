/**
 * VERSATIL SDLC Framework - Daily Audit Daemon
 * Rule 3: Daily 2 AM Audit Scheduler
 *
 * Features:
 * - Node.js daemon with node-cron scheduling
 * - Runs daily at 2 AM: '0 2 * * *'
 * - Immediate audit on critical issue detection
 * - Graceful shutdown handling
 * - PID file management
 * - Comprehensive logging
 */
import { EventEmitter } from 'events';
import { AuditResult, AuditStatus, IssueSeverity } from './daily-audit-system.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export interface DaemonConfig {
    cronSchedule: string;
    timezone: string;
    immediateAuditThreshold: IssueSeverity;
    logPath: string;
    pidPath: string;
    enabled: boolean;
    autostart: boolean;
}
export interface DaemonStatus {
    running: boolean;
    pid?: number;
    uptime?: number;
    lastAudit?: Date;
    lastAuditStatus?: AuditStatus;
    nextScheduledAudit?: Date;
    auditCount: number;
    errorCount: number;
}
export declare class DailyAuditDaemon extends EventEmitter {
    private auditSystem;
    private config;
    private cronJob?;
    private startTime?;
    private lastAuditTime?;
    private lastAuditStatus?;
    private auditCount;
    private errorCount;
    private isRunning;
    private shutdownHandlers;
    private logStream?;
    constructor(config?: Partial<DaemonConfig>, vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Start the daemon
     */
    start(): Promise<void>;
    /**
     * Stop the daemon
     */
    stop(): Promise<void>;
    /**
     * Restart the daemon
     */
    restart(): Promise<void>;
    /**
     * Get daemon status
     */
    getStatus(): Promise<DaemonStatus>;
    /**
     * Run immediate audit (on-demand or triggered by critical issue)
     */
    runImmediateAudit(reason?: string): Promise<AuditResult>;
    /**
     * Start cron scheduler
     */
    private startCronScheduler;
    /**
     * Run scheduled audit
     */
    private runScheduledAudit;
    /**
     * Setup audit system event listeners
     */
    private setupAuditListeners;
    /**
     * Setup graceful shutdown handlers
     */
    private setupShutdownHandlers;
    /**
     * Execute shutdown handlers
     */
    private executeShutdownHandlers;
    /**
     * Register shutdown handler
     */
    onShutdown(handler: () => Promise<void>): void;
    /**
     * Determine if immediate audit should be triggered
     */
    private shouldTriggerImmediateAudit;
    /**
     * Get next scheduled audit time
     */
    private getNextScheduledAudit;
    /**
     * Get daemon uptime in seconds
     */
    private getUptime;
    /**
     * Initialize log stream
     */
    private initializeLogStream;
    /**
     * Write PID file
     */
    private writePidFile;
    /**
     * Remove PID file
     */
    private removePidFile;
    /**
     * Check if daemon is running by reading PID file
     */
    static isRunning(pidPath?: string): Promise<boolean>;
    /**
     * Get default log path
     */
    private getDefaultLogPath;
    /**
     * Get default PID path
     */
    private getDefaultPidPath;
    /**
     * Log message with timestamp
     */
    private log;
}
export default DailyAuditDaemon;
