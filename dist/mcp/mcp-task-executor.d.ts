/**
 * MCP Task Executor - Stub Implementation
 *
 * This is a minimal stub to satisfy TypeScript compilation.
 * Full implementation pending.
 */
export interface MCPToolInference {
    taskId: string;
    inferredTools: string[];
    confidence: number;
    reasoning: string;
}
export interface MCPExecutionResult {
    success: boolean;
    toolsExecuted: string[];
    results: Map<string, any>;
    errors: Array<{
        tool: string;
        error: string;
    }>;
}
export interface Task {
    id: string;
    name: string;
    description?: string;
    type: string;
    files: string[];
    dependencies?: string[];
    [key: string]: any;
}
export declare class MCPTaskExecutor {
    initialize(): Promise<void>;
    inferTools(task: Task): Promise<MCPToolInference>;
    executeTools(task: Task, inference: MCPToolInference): Promise<MCPExecutionResult>;
    shutdown(): Promise<void>;
}
export default MCPTaskExecutor;
