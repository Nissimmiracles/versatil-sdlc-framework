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
        // In MCP mode, use stderr to avoid interfering with stdio JSON-RPC protocol
        if (process.env.VERSATIL_MCP_MODE === 'true') {
            console.error(logMessage);
        }
        else {
            console.log(logMessage);
        }
    }
    error(message, context, component) {
        const logMessage = this.formatMessage('ERROR', message, context, component);
        console.error(logMessage);
    }
    warn(message, context, component) {
        const logMessage = this.formatMessage('WARN', message, context, component);
        // In MCP mode, use stderr to avoid interfering with stdio JSON-RPC protocol
        if (process.env.VERSATIL_MCP_MODE === 'true') {
            console.error(logMessage);
        }
        else {
            console.warn(logMessage);
        }
    }
    warning(message, context, component) {
        this.warn(message, context, component);
    }
    debug(message, context, component) {
        const logMessage = this.formatMessage('DEBUG', message, context, component);
        // In MCP mode, use stderr to avoid interfering with stdio JSON-RPC protocol
        if (process.env.VERSATIL_MCP_MODE === 'true') {
            console.error(logMessage);
        }
        else {
            console.log(logMessage);
        }
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
