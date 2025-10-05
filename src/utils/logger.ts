export class VERSATILLogger {
  private static instance: VERSATILLogger;

  constructor(private component?: string) {}

  static getInstance(component?: string): VERSATILLogger {
    if (!VERSATILLogger.instance) {
      VERSATILLogger.instance = new VERSATILLogger(component);
    }
    return VERSATILLogger.instance;
  }

  info(message: string, context?: any, component?: string): void {
    const logMessage = this.formatMessage('INFO', message, context, component);
    console.log(logMessage);
  }

  error(message: string, context?: any, component?: string): void {
    const logMessage = this.formatMessage('ERROR', message, context, component);
    console.error(logMessage);
  }

  warn(message: string, context?: any, component?: string): void {
    const logMessage = this.formatMessage('WARN', message, context, component);
    console.warn(logMessage);
  }

  warning(message: string, context?: any, component?: string): void {
    this.warn(message, context, component);
  }

  debug(message: string, context?: any, component?: string): void {
    const logMessage = this.formatMessage('DEBUG', message, context, component);
    console.log(logMessage);
  }

  private formatMessage(level: string, message: string, context?: any, component?: string): string {
    const comp = component || this.component || 'VERSATIL';
    let formatted = `[${comp}] ${level}: ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }

    return formatted;
  }
}

export const log = console;
