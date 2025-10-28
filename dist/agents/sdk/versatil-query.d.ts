/**
 * VERSATIL SDK Query Wrapper
 * Integrates Claude Agent SDK with VERSATIL's RAG and MCP systems
 *
 * Purpose: Replace custom ParallelTaskManager with native SDK parallelization
 * Benefits:
 * - Automatic parallel execution by Claude SDK
 * - No manual collision detection needed
 * - Native optimization by Anthropic
 * - 88% code reduction (879 lines → ~100 lines)
 */
import { Task, ExecutionStatus } from '../../orchestration/parallel-task-manager.js';
import { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
export interface SDKExecutionConfig {
    tasks: Task[];
    ragContext?: string;
    mcpTools?: string[];
    vectorStore?: EnhancedVectorMemoryStore;
    model?: 'sonnet' | 'opus' | 'haiku';
}
export interface SDKExecutionResult {
    taskId: string;
    status: ExecutionStatus;
    result: any;
    error?: Error;
    executionTime: number;
}
/**
 * Execute VERSATIL tasks using Claude SDK's native parallelization
 *
 * How it works:
 * 1. Maps VERSATIL Task objects to SDK AgentDefinition objects
 * 2. SDK automatically runs agents in parallel (no custom code needed)
 * 3. Injects RAG context for zero context loss
 * 4. Integrates MCP tools for extended capabilities
 *
 * @param config - Configuration with tasks, RAG context, and MCP tools
 * @returns Map of task IDs to execution results
 */
export declare function executeWithSDK(config: SDKExecutionConfig): Promise<Map<string, SDKExecutionResult>>;
/**
 * Execute a single task using SDK (convenience wrapper)
 */
export declare function executeSingleTask(task: Task, ragContext?: string, vectorStore?: EnhancedVectorMemoryStore): Promise<SDKExecutionResult>;
/**
 * Batch execute tasks with automatic dependency resolution
 * SDK handles parallelization automatically
 */
export declare function executeBatchTasks(tasks: Task[], config?: Partial<SDKExecutionConfig>): Promise<Map<string, SDKExecutionResult>>;
export default executeWithSDK;
