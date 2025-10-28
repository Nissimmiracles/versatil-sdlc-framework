export declare class VERSATILLogger {
    private component?;
    private static instance;
    constructor(component?: string);
    static getInstance(component?: string): VERSATILLogger;
    info(message: string, context?: any, component?: string): void;
    error(message: string, context?: any, component?: string): void;
    warn(message: string, context?: any, component?: string): void;
    warning(message: string, context?: any, component?: string): void;
    debug(message: string, context?: any, component?: string): void;
    private formatMessage;
}
export declare const log: Console;
