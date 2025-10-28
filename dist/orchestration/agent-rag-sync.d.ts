/**
 * Agent-RAG Synchronization Layer
 * Full context intelligence flywheel implementation
 */
import { AgentRegistry } from '../agents/core/agent-registry.js';
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export interface EnrichedContext extends AgentActivationContext {
    ragContext?: {
        similarContexts: any[];
        successfulPatterns: any[];
        crossAgentLearnings: any[];
        priorAgents: string[];
        metaLearnings: any[];
    };
    contextChain?: ContextChainItem[];
}
export interface ContextChainItem {
    agentId: string;
    timestamp: number;
    response: AgentResponse;
    confidence: number;
}
/**
 * Intelligence Flywheel:
 * User Action → Agent Activated → RAG Query → Context Retrieved
 *      ↑                                              ↓
 * Agent Learns ← Memory Updated ← Response Generated ← Context Applied
 */
export declare class AgentRAGSynchronization {
    private agentRegistry;
    private ragStore;
    private bidirectionalSync;
    private crossAgentLearning;
    private incrementalIntelligence;
    constructor(agentRegistry: AgentRegistry, ragStore: EnhancedVectorMemoryStore);
    /**
     * Activate agent with full context intelligence flywheel
     */
    activateAgentWithFullContext(agentId: string, context: AgentActivationContext, priorAgents?: string[], userFeedback?: 'positive' | 'negative' | 'neutral'): Promise<AgentResponse>;
    /**
     * PHASE 1: Enrich context from RAG
     */
    private enrichContextFromRAG;
    /**
     * PHASE 3: Learn from response (bidirectional sync)
     */
    private learnFromResponse;
    /**
     * PHASE 4: Prepare handoff context for next agent
     */
    private prepareHandoffContext;
    /**
     * Execute multi-agent workflow with full context preservation
     */
    executeMultiAgentWorkflow(agentSequence: string[], initialContext: AgentActivationContext): Promise<AgentResponse[]>;
    /**
     * Get recommended next agent based on learning
     */
    getRecommendedNextAgent(currentAgent: string, context: AgentActivationContext): Promise<{
        agentId: string;
        confidence: number;
    } | null>;
    /**
     * Get intelligence metrics
     */
    getIntelligenceMetrics(): any;
    /**
     * Reset all learning systems (for testing)
     */
    resetLearning(): void;
}
