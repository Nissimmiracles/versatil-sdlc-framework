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

import cron from 'node-cron';
import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { DailyAuditSystem, AuditResult, AuditStatus, IssueSeverity } from './daily-audit-system.js';
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

export class DailyAuditDaemon extends EventEmitter {
  private auditSystem: DailyAuditSystem;
  private config: DaemonConfig;
  private cronJob?: cron.ScheduledTask;
  private startTime?: Date;
  private lastAuditTime?: Date;
  private lastAuditStatus?: AuditStatus;
  private auditCount: number = 0;
  private errorCount: number = 0;
  private isRunning: boolean = false;
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private logStream?: fs.WriteStream;

  constructor(config?: Partial<DaemonConfig>, vectorStore?: EnhancedVectorMemoryStore) {
    super();

    // Default configuration
    this.config = {
      cronSchedule: '0 2 * * *', // Daily at 2 AM
      timezone: 'America/New_York',
      immediateAuditThreshold: IssueSeverity.CRITICAL,
      logPath: this.getDefaultLogPath(),
      pidPath: this.getDefaultPidPath(),
      enabled: true,
      autostart: false,
      ...config
    };

    this.auditSystem = new DailyAuditSystem(vectorStore);

    // Setup audit system event listeners
    this.setupAuditListeners();

    // Setup graceful shutdown handlers
    this.setupShutdownHandlers();
  }

  /**
   * Start the daemon
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.log('warn', 'Daemon is already running');
      return;
    }

    try {
      this.log('info', 'Starting Daily Audit Daemon');

      // Initialize log stream
      await this.initializeLogStream();

      // Write PID file
      await this.writePidFile();

      // Start cron scheduler
      this.startCronScheduler();

      // Set daemon state
      this.isRunning = true;
      this.startTime = new Date();

      this.log('info', `Daemon started successfully. PID: ${process.pid}`);
      this.log('info', `Scheduled audits at: ${this.config.cronSchedule} (${this.config.timezone})`);

      this.emit('daemon:started', { pid: process.pid, startTime: this.startTime });

    } catch (error) {
      this.log('error', `Failed to start daemon: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop the daemon
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.log('warn', 'Daemon is not running');
      return;
    }

    try {
      this.log('info', 'Stopping Daily Audit Daemon');

      // Stop cron scheduler
      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob = undefined;
      }

      // Execute shutdown handlers
      await this.executeShutdownHandlers();

      // Remove PID file
      await this.removePidFile();

      // Close log stream
      if (this.logStream) {
        await new Promise<void>((resolve) => {
          this.logStream!.end(() => resolve());
        });
        this.logStream = undefined;
      }

      // Set daemon state
      this.isRunning = false;

      this.log('info', 'Daemon stopped successfully');
      this.emit('daemon:stopped', {
        uptime: this.getUptime(),
        auditCount: this.auditCount,
        errorCount: this.errorCount
      });

    } catch (error) {
      this.log('error', `Failed to stop daemon: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restart the daemon
   */
  async restart(): Promise<void> {
    this.log('info', 'Restarting daemon');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.start();
  }

  /**
   * Get daemon status
   */
  async getStatus(): Promise<DaemonStatus> {
    const nextAudit = this.getNextScheduledAudit();

    return {
      running: this.isRunning,
      pid: this.isRunning ? process.pid : undefined,
      uptime: this.getUptime(),
      lastAudit: this.lastAuditTime,
      lastAuditStatus: this.lastAuditStatus,
      nextScheduledAudit: nextAudit,
      auditCount: this.auditCount,
      errorCount: this.errorCount
    };
  }

  /**
   * Run immediate audit (on-demand or triggered by critical issue)
   */
  async runImmediateAudit(reason?: string): Promise<AuditResult> {
    this.log('info', `Running immediate audit${reason ? `: ${reason}` : ''}`);

    try {
      const result = await this.auditSystem.runDailyAudit();

      this.lastAuditTime = new Date();
      this.lastAuditStatus = result.status;
      this.auditCount++;

      this.log('info', `Immediate audit completed. Status: ${result.status}, Health: ${result.overallHealth}%`);
      this.emit('audit:immediate:completed', { result, reason });

      return result;

    } catch (error) {
      this.errorCount++;
      this.log('error', `Immediate audit failed: ${error.message}`);
      this.emit('audit:immediate:failed', { error, reason });
      throw error;
    }
  }

  /**
   * Start cron scheduler
   */
  private startCronScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    this.cronJob = cron.schedule(
      this.config.cronSchedule,
      async () => {
        await this.runScheduledAudit();
      },
      {
        scheduled: true,
        timezone: this.config.timezone
      }
    );

    const nextRun = this.getNextScheduledAudit();
    this.log('info', `Cron scheduler started. Next run: ${nextRun?.toISOString()}`);
  }

  /**
   * Run scheduled audit
   */
  private async runScheduledAudit(): Promise<void> {
    this.log('info', 'Running scheduled audit (2 AM daily)');

    try {
      const result = await this.auditSystem.runDailyAudit();

      this.lastAuditTime = new Date();
      this.lastAuditStatus = result.status;
      this.auditCount++;

      this.log('info', `Scheduled audit completed. Status: ${result.status}, Health: ${result.overallHealth}%`);
      this.emit('audit:scheduled:completed', { result });

      // Check if immediate follow-up audit is needed
      if (this.shouldTriggerImmediateAudit(result)) {
        this.log('warn', 'Critical issues detected. Scheduling immediate follow-up audit in 5 minutes');
        setTimeout(() => {
          this.runImmediateAudit('Critical issues detected in scheduled audit')
            .catch(error => this.log('error', `Follow-up audit failed: ${error.message}`));
        }, 5 * 60 * 1000); // 5 minutes
      }

    } catch (error) {
      this.errorCount++;
      this.log('error', `Scheduled audit failed: ${error.message}`);
      this.emit('audit:scheduled:failed', { error });
    }
  }

  /**
   * Setup audit system event listeners
   */
  private setupAuditListeners(): void {
    // Listen for audit completion
    this.auditSystem.on('audit:completed', (data) => {
      this.log('info', `Audit ${data.auditId} completed`);
    });

    // Listen for audit failures
    this.auditSystem.on('audit:failed', (data) => {
      this.log('error', `Audit ${data.auditId} failed: ${data.error.message}`);
    });

    // Listen for critical issues
    this.auditSystem.on('notification:audit_complete', (data) => {
      if (data.result.status === AuditStatus.FAILURE) {
        this.log('warn', `Critical audit failure detected: ${data.message}`);
      }
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    for (const signal of shutdownSignals) {
      process.on(signal, async () => {
        this.log('info', `Received ${signal}, initiating graceful shutdown`);
        await this.stop();
        process.exit(0);
      });
    }

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.log('error', `Uncaught exception: ${error.message}`);
      this.log('error', error.stack || '');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log('error', `Unhandled rejection at: ${promise}, reason: ${reason}`);
    });
  }

  /**
   * Execute shutdown handlers
   */
  private async executeShutdownHandlers(): Promise<void> {
    for (const handler of this.shutdownHandlers) {
      try {
        await handler();
      } catch (error) {
        this.log('error', `Shutdown handler failed: ${error.message}`);
      }
    }
  }

  /**
   * Register shutdown handler
   */
  public onShutdown(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * Determine if immediate audit should be triggered
   */
  private shouldTriggerImmediateAudit(result: AuditResult): boolean {
    const criticalIssues = result.issues.filter(
      issue => issue.severity >= this.config.immediateAuditThreshold
    );

    return criticalIssues.length > 0 || result.status === AuditStatus.FAILURE;
  }

  /**
   * Get next scheduled audit time
   */
  private getNextScheduledAudit(): Date | undefined {
    if (!this.cronJob) return undefined;

    try {
      // Parse cron schedule to determine next run
      // For '0 2 * * *' (2 AM daily), calculate next occurrence
      const now = new Date();
      const next = new Date(now);
      next.setHours(2, 0, 0, 0);

      // If 2 AM has already passed today, schedule for tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      return next;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get daemon uptime in seconds
   */
  private getUptime(): number | undefined {
    if (!this.startTime) return undefined;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Initialize log stream
   */
  private async initializeLogStream(): Promise<void> {
    await fs.ensureDir(path.dirname(this.config.logPath));

    this.logStream = fs.createWriteStream(this.config.logPath, {
      flags: 'a', // Append mode
      encoding: 'utf8'
    });

    this.logStream.on('error', (error) => {
      console.error(`Log stream error: ${error.message}`);
    });
  }

  /**
   * Write PID file
   */
  private async writePidFile(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.config.pidPath));
      await fs.writeFile(this.config.pidPath, process.pid.toString(), 'utf8');
      this.log('info', `PID file written: ${this.config.pidPath}`);
    } catch (error) {
      this.log('error', `Failed to write PID file: ${error.message}`);
    }
  }

  /**
   * Remove PID file
   */
  private async removePidFile(): Promise<void> {
    try {
      if (await fs.pathExists(this.config.pidPath)) {
        await fs.remove(this.config.pidPath);
        this.log('info', 'PID file removed');
      }
    } catch (error) {
      this.log('error', `Failed to remove PID file: ${error.message}`);
    }
  }

  /**
   * Check if daemon is running by reading PID file
   */
  public static async isRunning(pidPath?: string): Promise<boolean> {
    const pidFile = pidPath || DailyAuditDaemon.prototype.getDefaultPidPath();

    try {
      if (!(await fs.pathExists(pidFile))) {
        return false;
      }

      const pidStr = await fs.readFile(pidFile, 'utf8');
      const pid = parseInt(pidStr.trim(), 10);

      if (isNaN(pid)) {
        return false;
      }

      // Check if process is running
      try {
        process.kill(pid, 0); // Signal 0 doesn't kill, just checks if process exists
        return true;
      } catch (error) {
        // Process not found, remove stale PID file
        await fs.remove(pidFile);
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get default log path
   */
  private getDefaultLogPath(): string {
    return path.join(os.homedir(), '.versatil', 'logs', 'daily-audit.log');
  }

  /**
   * Get default PID path
   */
  private getDefaultPidPath(): string {
    return path.join(os.homedir(), '.versatil', 'run', 'audit-daemon.pid');
  }

  /**
   * Log message with timestamp
   */
  private log(level: 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    // Write to log stream
    if (this.logStream && this.logStream.writable) {
      this.logStream.write(logMessage);
    }

    // Also write to console
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleMethod(logMessage.trim());
  }
}

export default DailyAuditDaemon;
