/**
 * VERSATIL SDLC Framework v3.0.0
 * AI-Native Development with Proactive Agent Intelligence
 */

export const VERSION = '3.0.0';

// Core Framework Class
export class VERSATIL {
  private version = VERSION;

  constructor() {
    console.log(`🚀 VERSATIL SDLC Framework v${this.version} initialized`);
  }

  getVersion(): string {
    return this.version;
  }
}

export default VERSATIL;

// Export all types
export * from './types/agent-types.js';

// Export all agents
export { BaseAgent } from './agents/base-agent.js';
export { RAGEnabledAgent } from './agents/rag-enabled-agent.js';
export { EnhancedMaria } from './agents/enhanced-maria.js';
export { EnhancedJames } from './agents/enhanced-james.js';
export { EnhancedMarcus } from './agents/enhanced-marcus.js';
export { AlexBa } from './agents/alex-ba.js';
export { SarahPm } from './agents/sarah-pm.js';
export { DrAiMl } from './agents/dr-ai-ml.js';
export { IntrospectiveAgent } from './agents/introspective-agent.js';
export { AgentRegistry } from './agents/agent-registry.js';

// Export orchestration
export { ProactiveAgentOrchestrator } from './orchestration/proactive-agent-orchestrator.js';
export { ParallelTaskManager } from './orchestration/parallel-task-manager.js';
export { AgentPool } from './agents/agent-pool.js';
export { EventDrivenOrchestrator, AgentEvent } from './orchestration/event-driven-orchestrator.js';
export type { HandoffRequest, AgentEventData } from './orchestration/event-driven-orchestrator.js';

// Export RAG system
export { EnhancedVectorMemoryStore } from './rag/enhanced-vector-memory-store.js';

// Export intelligence
export { PatternAnalyzer } from './intelligence/pattern-analyzer.js';
export { PromptGenerator} from './intelligence/prompt-generator.js';

// Export utilities
export { VERSATILLogger } from './utils/logger.js';

// Export MCP system
export { MCPAutoConfigurator, mcpAutoConfigurator } from './mcp/mcp-auto-configurator.js';
export { MCPHealthMonitor } from './mcp/mcp-health-monitor.js';

// Export conversation backup system
export { ConversationBackupManager, getConversationBackupManager } from './conversation-backup-manager.js';
export type { ConversationMessage, ConversationSnapshot } from './conversation-backup-manager.js';

// Export UI system
export { StatuslineManager, getGlobalStatusline, setGlobalStatusline } from './ui/statusline-manager.js';
export type { AgentProgress, StatuslineOptions } from './ui/statusline-manager.js';
