export interface AgentResponse {
    agentId: string;
    message: string;
    suggestions: any[];
    priority: string;
    handoffTo: string[];
    context?: any;
}
export interface AgentActivationContext {
    trigger?: any;
    filePath?: string;
    content?: string;
    [key: string]: any;
}
export declare abstract class BaseAgent {
    abstract name: string;
    abstract id: string;
    abstract specialization: string;
    abstract activate(context: AgentActivationContext): Promise<AgentResponse>;
    protected runStandardValidation(context: any): Promise<any>;
    protected runAgentSpecificValidation(context: any): Promise<any>;
    protected generateStandardRecommendations(results: any): any[];
    protected calculateStandardPriority(results: any): string;
}
export declare const log: {
    info: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    error: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    warn: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    debug: {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
};
