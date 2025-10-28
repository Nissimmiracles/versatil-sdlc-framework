export class VERSATILLogger {
    component;
    static instance;
    constructor(component) {
        this.component = component;
    }
    static getInstance(component) {
        if (!VERSATILLogger.instance) {
            VERSATILLogger.instance = new VERSATILLogger(component);
        }
        return VERSATILLogger.instance;
    }
    info(message, context, component) {
        const logMessage = this.formatMessage('INFO', message, context, component);
        console.log(logMessage);
    }
    error(message, context, component) {
        const logMessage = this.formatMessage('ERROR', message, context, component);
        console.error(logMessage);
    }
    warn(message, context, component) {
        const logMessage = this.formatMessage('WARN', message, context, component);
        console.warn(logMessage);
    }
    warning(message, context, component) {
        this.warn(message, context, component);
    }
    debug(message, context, component) {
        const logMessage = this.formatMessage('DEBUG', message, context, component);
        console.log(logMessage);
    }
    formatMessage(level, message, context, component) {
        const comp = component || this.component || 'VERSATIL';
        let formatted = `[${comp}] ${level}: ${message}`;
        if (context && Object.keys(context).length > 0) {
            formatted += ` ${JSON.stringify(context)}`;
        }
        return formatted;
    }
}
export const log = console;
