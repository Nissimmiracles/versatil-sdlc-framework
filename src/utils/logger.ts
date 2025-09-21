/**
 * VERSATIL SDLC Framework - Enhanced Logging System
 *
 * Replaces console.log statements with proper structured logging
 * to address issues found by Enhanced Maria self-analysis
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  agentId?: string;
  component?: string;
}

export class VERSATILLogger {
  private static instance: VERSATILLogger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private enableConsole: boolean;

  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.enableConsole = process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true';
  }

  public static getInstance(): VERSATILLogger {
    if (!VERSATILLogger.instance) {
      VERSATILLogger.instance = new VERSATILLogger();
    }
    return VERSATILLogger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      case 'trace': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level].padEnd(5);
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${levelStr} | ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, component?: string, agentId?: string): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      component,
      agentId
    };

    this.logs.push(logEntry);

    // Keep only last 1000 log entries
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Console output in development
    if (this.enableConsole) {
      const formattedMessage = this.formatMessage(level, message, context);

      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
          console.debug(formattedMessage);
          break;
        default:
          console.info(formattedMessage);
      }
    }
  }

  public error(message: string, context?: Record<string, unknown>, component?: string, agentId?: string): void {
    this.log(LogLevel.ERROR, message, context, component, agentId);
  }

  public warn(message: string, context?: Record<string, unknown>, component?: string, agentId?: string): void {
    this.log(LogLevel.WARN, message, context, component, agentId);
  }

  public warning(message: string, context?: Record<string, unknown>, component?: string): void {
    this.warn(message, context, component);
  }

  public info(message: string, context?: Record<string, unknown>, component?: string, agentId?: string): void {
    this.log(LogLevel.INFO, message, context, component, agentId);
  }

  public debug(message: string, context?: Record<string, unknown>, component?: string, agentId?: string): void {
    this.log(LogLevel.DEBUG, message, context, component, agentId);
  }

  public trace(message: string, context?: Record<string, unknown>, component?: string, agentId?: string): void {
    this.log(LogLevel.TRACE, message, context, component, agentId);
  }

  // Agent-specific logging
  public agentLog(agentId: string, level: LogLevel, message: string, context?: Record<string, unknown>): void {
    this.log(level, message, context, 'agent', agentId);
  }

  // Performance logging
  public performance(message: string, duration: number, component?: string): void {
    this.info(message, { duration_ms: duration, type: 'performance' }, component);
  }

  // Quality logging
  public quality(message: string, score: number, component?: string): void {
    this.info(message, { quality_score: score, type: 'quality' }, component);
  }

  // Security logging
  public security(message: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: Record<string, unknown>): void {
    this.warn(message, { ...context, severity, type: 'security' }, 'security');
  }

  // Configuration logging
  public config(message: string, context?: Record<string, unknown>): void {
    this.info(message, { ...context, type: 'configuration' }, 'config');
  }

  // Get recent logs
  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get logs by component
  public getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  // Get logs by agent
  public getLogsByAgent(agentId: string): LogEntry[] {
    return this.logs.filter(log => log.agentId === agentId);
  }

  // Clear logs
  public clearLogs(): void {
    this.logs = [];
  }

  // Export logs
  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // CSV format
    let csv = 'timestamp,level,message,component,agentId,context\n';
    this.logs.forEach(log => {
      const context = log.context ? JSON.stringify(log.context).replace(/"/g, '""') : '';
      csv += `"${log.timestamp}","${LogLevel[log.level]}","${log.message}","${log.component || ''}","${log.agentId || ''}","${context}"\n`;
    });

    return csv;
  }
}

// Export singleton instance and convenience functions
export const logger = VERSATILLogger.getInstance();

// Convenience functions for easy migration from console.log
export const log = {
  error: (message: string, context?: Record<string, unknown>) => logger.error(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  trace: (message: string, context?: Record<string, unknown>) => logger.trace(message, context),

  // Special logging functions
  agent: (agentId: string, message: string, context?: Record<string, unknown>) =>
    logger.agentLog(agentId, LogLevel.INFO, message, context),
  performance: (message: string, duration: number) => logger.performance(message, duration),
  quality: (message: string, score: number) => logger.quality(message, score),
  security: (message: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: Record<string, unknown>) =>
    logger.security(message, severity, context),
  config: (message: string, context?: Record<string, unknown>) => logger.config(message, context)
};

export default logger;