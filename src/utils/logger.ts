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
    // In MCP mode, use stderr to avoid interfering with stdio JSON-RPC protocol
    if (process.env.VERSATIL_MCP_MODE === 'true') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  error(message: string, context?: any, component?: string): void {
    const logMessage = this.formatMessage('ERROR', message, context, component);
    console.error(logMessage);
  }

  warn(message: string, context?: any, component?: string): void {
    const logMessage = this.formatMessage('WARN', message, context, component);
    // In MCP mode, use stderr to avoid interfering with stdio JSON-RPC protocol
    if (process.env.VERSATIL_MCP_MODE === 'true') {
      console.error(logMessage);
    } else {
      console.warn(logMessage);
    }
  }

  warning(message: string, context?: any, component?: string): void {
    this.warn(message, context, component);
  }

  debug(message: string, context?: any, component?: string): void {
    const logMessage = this.formatMessage('DEBUG', message, context, component);
    // In MCP mode, use stderr to avoid interfering with stdio JSON-RPC protocol
    if (process.env.VERSATIL_MCP_MODE === 'true') {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  private formatMessage(level: string, message: string, context?: any, component?: string): string {
    const comp = component || this.component || 'VERSATIL';
    let formatted = `[${comp}] ${level}: ${message}`;

    if (context && typeof context === 'object' && Object.keys(context).length > 0) {
      try {
        formatted += ` ${JSON.stringify(context)}`;
      } catch {
        // Handle circular references or other JSON.stringify errors
        formatted += ` [Object with circular reference or non-serializable content]`;
      }
    }

    return formatted;
  }
}

export const log = console;
