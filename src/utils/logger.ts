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
    console.log(`[${component || this.component || 'VERSATIL'}] ${message}`);
  }

  error(message: string, context?: any, component?: string): void {
    console.error(`[${component || this.component || 'VERSATIL'}] ERROR: ${message}`);
  }

  warn(message: string, context?: any, component?: string): void {
    console.warn(`[${component || this.component || 'VERSATIL'}] WARN: ${message}`);
  }

  warning(message: string, context?: any, component?: string): void {
    this.warn(message, context, component);
  }

  debug(message: string, context?: any, component?: string): void {
    if (process.env.DEBUG) {
      console.debug(`[${component || this.component || 'VERSATIL'}] DEBUG: ${message}`);
    }
  }
}

export const log = console;
