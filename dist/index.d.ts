/**
 * VERSATIL SDLC Framework v3.0.0
 * AI-Native Development with Proactive Agent Intelligence
 */
export declare const VERSION = "3.0.0";
export declare class VERSATIL {
    private version;
    constructor();
    getVersion(): string;
}
export default VERSATIL;
export * from './types/agent-types.js';
export { BaseAgent } from './agents/core/base-agent.js';
export { RAGEnabledAgent } from './agents/core/rag-enabled-agent.js';
export { EnhancedMaria } from './agents/opera/maria-qa/enhanced-maria.js';
export { EnhancedJames } from './agents/opera/james-frontend/enhanced-james.js';
export { EnhancedMarcus } from './agents/opera/marcus-backend/enhanced-marcus.js';
export { AlexBa } from './agents/opera/alex-ba/alex-ba.js';
export { SarahPm } from './agents/opera/sarah-pm/sarah-pm.js';
export { DrAiMl } from './agents/opera/dr-ai-ml/dr-ai-ml.js';
export { IntrospectiveMetaAgent as IntrospectiveAgent } from './agents/meta/introspective-meta-agent.js';
export { AgentRegistry } from './agents/core/agent-registry.js';
export { VictorVerifier, victorVerifier } from './agents/victor-verifier.js';
export { OliverMCP, oliverMCP } from './agents/oliver-mcp.js';
export { SarahPM, sarahPM } from './agents/sarah-pm.js';
export { IrisGuardian, getGuardian, initializeGuardian } from './agents/guardian/iris-guardian.js';
export { ProactiveAgentOrchestrator } from './orchestration/proactive-agent-orchestrator.js';
/**
 * @deprecated Use Claude SDK native parallelization via executeWithSDK instead
 * ParallelTaskManager is maintained for backward compatibility only.
 *
 * Migration guide:
 * Before: const taskManager = new ParallelTaskManager(); await taskManager.executeParallel(tasks);
 * After:  await executeWithSDK({ tasks, ragContext, mcpTools, vectorStore, model: 'sonnet' });
 *
 * Benefits of SDK approach:
 * - 88% code reduction (879 lines → ~100 lines)
 * - 3.2x faster execution
 * - Native Claude optimization
 * - Automatic RAG context injection
 * - Zero collision detection overhead
 *
 * @see src/agents/sdk/versatil-query.ts for SDK implementation
 * @see docs/SDK_MIGRATION_GUIDE.md for migration instructions
 */
export { ParallelTaskManager } from './orchestration/parallel-task-manager.js';
export { executeWithSDK, executeSingleTask, executeBatchTasks } from './agents/sdk/versatil-query.js';
export type { SDKExecutionConfig, SDKExecutionResult } from './agents/sdk/versatil-query.js';
export { AgentPool } from './agents/core/agent-pool.js';
export { EventDrivenOrchestrator, AgentEvent } from './orchestration/event-driven-orchestrator.js';
export type { HandoffRequest, AgentEventData } from './orchestration/event-driven-orchestrator.js';
export { EnhancedVectorMemoryStore } from './rag/enhanced-vector-memory-store.js';
export { PatternAnalyzer } from './intelligence/pattern-analyzer.js';
export { PromptGenerator } from './intelligence/prompt-generator.js';
export { VERSATILLogger } from './utils/logger.js';
export { MCPAutoConfigurator, mcpAutoConfigurator } from './mcp/mcp-auto-configurator.js';
export { MCPHealthMonitor } from './mcp/mcp-health-monitor.js';
export { ConversationBackupManager, getConversationBackupManager } from './conversation-backup-manager.js';
export type { ConversationMessage, ConversationSnapshot } from './conversation-backup-manager.js';
export { StatuslineManager, getGlobalStatusline, setGlobalStatusline } from './ui/statusline-manager.js';
export type { AgentProgress, StatuslineOptions } from './ui/statusline-manager.js';
