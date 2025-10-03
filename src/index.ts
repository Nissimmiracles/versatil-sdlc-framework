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
export * from './types';

// Export all agents
export { BaseAgent } from './agents/base-agent';
export { RAGEnabledAgent } from './agents/rag-enabled-agent';
export { EnhancedMaria } from './agents/enhanced-maria';
export { EnhancedJames } from './agents/enhanced-james';
export { EnhancedMarcus } from './agents/enhanced-marcus';
export { AlexBa } from './agents/alex-ba';
export { SarahPm } from './agents/sarah-pm';
export { DrAiMl } from './agents/dr-ai-ml';
export { IntrospectiveAgent } from './agents/introspective-agent';
export { AgentRegistry } from './agents/agent-registry';

// Export orchestration
export { ProactiveAgentOrchestrator } from './orchestration/proactive-agent-orchestrator';
export { ParallelTaskManager } from './orchestration/parallel-task-manager';

// Export RAG system
export { EnhancedVectorMemoryStore } from './rag/enhanced-vector-memory-store';

// Export intelligence
export { PatternAnalyzer } from './intelligence/pattern-analyzer';
export { PromptGenerator } from './intelligence/prompt-generator';

// Export utilities
export { VERSATILLogger } from './utils/logger';
