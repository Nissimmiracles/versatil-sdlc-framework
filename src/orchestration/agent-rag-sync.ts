/**
 * Agent-RAG Synchronization Layer
 * Full context intelligence flywheel implementation
 */

import { AgentRegistry } from '../agents/agent-registry.js';
import { BaseAgent, AgentResponse, AgentActivationContext } from '../agents/base-agent.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { BidirectionalRAGSync } from '../rag/bidirectional-sync.js';
import { CrossAgentLearning } from '../rag/cross-agent-learning.js';
import { IncrementalIntelligence } from '../rag/incremental-intelligence.js';

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
export class AgentRAGSynchronization {
  private agentRegistry: AgentRegistry;
  private ragStore: EnhancedVectorMemoryStore;
  private bidirectionalSync: BidirectionalRAGSync;
  private crossAgentLearning: CrossAgentLearning;
  private incrementalIntelligence: IncrementalIntelligence;

  constructor(
    agentRegistry: AgentRegistry,
    ragStore: EnhancedVectorMemoryStore
  ) {
    this.agentRegistry = agentRegistry;
    this.ragStore = ragStore;
    this.bidirectionalSync = new BidirectionalRAGSync(ragStore);
    this.crossAgentLearning = new CrossAgentLearning(ragStore);
    this.incrementalIntelligence = new IncrementalIntelligence(ragStore);
  }

  /**
   * Activate agent with full context intelligence flywheel
   */
  async activateAgentWithFullContext(
    agentId: string,
    context: AgentActivationContext,
    priorAgents: string[] = [],
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<AgentResponse> {
    console.log(`[AgentRAGSync] Activating ${agentId} with full context intelligence`);

    // PHASE 1: Pre-activation context enrichment from RAG
    const enrichedContext = await this.enrichContextFromRAG(context, agentId, priorAgents);

    // PHASE 2: Agent activation with enriched context
    const agent = this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }

    const response = await agent.activate(enrichedContext);

    // PHASE 3: Post-activation learning (bidirectional sync)
    await this.learnFromResponse(agentId, enrichedContext, response, userFeedback);

    // PHASE 4: Context handoff preparation (if needed)
    if (response.handoffTo && response.handoffTo.length > 0) {
      await this.prepareHandoffContext(
        agentId,
        response.handoffTo,
        enrichedContext,
        response,
        priorAgents
      );
    }

    console.log(`[AgentRAGSync] ${agentId} completed with ${response.suggestions?.length || 0} suggestions`);

    return response;
  }

  /**
   * PHASE 1: Enrich context from RAG
   */
  private async enrichContextFromRAG(
    context: AgentActivationContext,
    agentId: string,
    priorAgents: string[]
  ): Promise<EnrichedContext> {
    console.log(`[AgentRAGSync] Enriching context for ${agentId}`);

    // Query 1: Similar past contexts for this agent
    const similarContexts = await this.bidirectionalSync.querySimilarContexts(
      context,
      agentId,
      5
    );

    // Query 2: Successful patterns from this agent
    const successfulPatterns = await this.bidirectionalSync.querySuccessfulPatterns(
      agentId,
      undefined,
      3
    );

    // Query 3: Cross-agent learnings (if this is a handoff)
    let crossAgentLearnings: any[] = [];
    if (priorAgents.length > 0) {
      const lastAgent = priorAgents[priorAgents.length - 1];
      crossAgentLearnings = await this.crossAgentLearning.querySimilarSuccesses(
        lastAgent,
        agentId,
        3
      );
    }

    // Query 4: Meta-learnings for this agent
    const metaLearnings = await this.incrementalIntelligence.queryMetaLearnings(agentId, 5);

    // Create enriched context
    const enrichedContext: EnrichedContext = {
      ...context,
      ragContext: {
        similarContexts,
        successfulPatterns,
        crossAgentLearnings,
        priorAgents,
        metaLearnings
      }
    };

    console.log(`[AgentRAGSync] Context enriched with ${similarContexts.length} similar contexts, ${successfulPatterns.length} patterns, ${metaLearnings.length} meta-learnings`);

    return enrichedContext;
  }

  /**
   * PHASE 3: Learn from response (bidirectional sync)
   */
  private async learnFromResponse(
    agentId: string,
    context: EnrichedContext,
    response: AgentResponse,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    console.log(`[AgentRAGSync] Learning from ${agentId} response`);

    // Store this interaction for future learning (bidirectional sync)
    await this.bidirectionalSync.syncAgentResponse(agentId, context, response);

    // Update incremental intelligence
    await this.incrementalIntelligence.recordInteraction(
      agentId,
      context,
      response,
      userFeedback
    );

    console.log(`[AgentRAGSync] Learning recorded for ${agentId}`);
  }

  /**
   * PHASE 4: Prepare handoff context for next agent
   */
  private async prepareHandoffContext(
    sourceAgent: string,
    targetAgents: string[],
    context: EnrichedContext,
    response: AgentResponse,
    priorAgents: string[]
  ): Promise<void> {
    console.log(`[AgentRAGSync] Preparing handoff from ${sourceAgent} to ${targetAgents.join(', ')}`);

    for (const targetAgent of targetAgents) {
      // Store handoff context
      await this.ragStore.storeMemory({
        content: JSON.stringify({
          from: sourceAgent,
          to: targetAgent,
          context: {
            filePath: context.filePath,
            trigger: context.trigger
          },
          response: {
            message: response.message,
            priority: response.priority,
            confidence: response.context?.confidence
          }
        }),
        contentType: 'handoff',
        metadata: {
          agentId: 'handoff-coordinator',
          timestamp: Date.now(),
          source_agent: sourceAgent,
          target_agent: targetAgent,
          tags: ['handoff', sourceAgent, targetAgent],
          context_chain_length: priorAgents.length + 1
        }
      });

      // Learn from handoff pattern
      await this.crossAgentLearning.learnFromAgentInteraction(
        sourceAgent,
        targetAgent,
        context.filePath || 'unknown',
        'initiated', // Will be updated to success/failure later
        {
          confidence: response.context?.confidence,
          priority: response.priority
        }
      );
    }

    console.log(`[AgentRAGSync] Handoff context prepared for ${targetAgents.length} agents`);
  }

  /**
   * Execute multi-agent workflow with full context preservation
   */
  async executeMultiAgentWorkflow(
    agentSequence: string[],
    initialContext: AgentActivationContext
  ): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    let currentContext = initialContext;
    const contextChain: ContextChainItem[] = [];

    for (let i = 0; i < agentSequence.length; i++) {
      const agentId = agentSequence[i];
      const priorAgents = agentSequence.slice(0, i);

      // Add context chain to current context
      const enrichedContext: EnrichedContext = {
        ...currentContext,
        contextChain
      };

      // Activate agent with full context
      const response = await this.activateAgentWithFullContext(
        agentId,
        enrichedContext,
        priorAgents
      );

      responses.push(response);

      // Add to context chain
      contextChain.push({
        agentId,
        timestamp: Date.now(),
        response,
        confidence: response.context?.confidence || 0.5
      });

      // Update context for next agent (context accumulation)
      currentContext = {
        ...currentContext,
        content: currentContext.content + '\n\n' + response.message,
        userRequest: response.message
      };

      // Record successful handoff if not last agent
      if (i < agentSequence.length - 1) {
        const nextAgent = agentSequence[i + 1];
        await this.crossAgentLearning.learnFromAgentInteraction(
          agentId,
          nextAgent,
          currentContext.filePath || 'workflow',
          'success'
        );
      }
    }

    return responses;
  }

  /**
   * Get recommended next agent based on learning
   */
  async getRecommendedNextAgent(
    currentAgent: string,
    context: AgentActivationContext
  ): Promise<{ agentId: string; confidence: number } | null> {
    return this.crossAgentLearning.getRecommendedNextAgent(
      currentAgent,
      context.filePath || context.userRequest || ''
    );
  }

  /**
   * Get intelligence metrics
   */
  getIntelligenceMetrics(): any {
    return {
      bidirectionalSync: this.bidirectionalSync.getMetrics(),
      crossAgentLearning: this.crossAgentLearning.getStatistics(),
      incrementalIntelligence: this.incrementalIntelligence.getMetrics()
    };
  }

  /**
   * Reset all learning systems (for testing)
   */
  resetLearning(): void {
    this.bidirectionalSync.resetMetrics();
    this.incrementalIntelligence.reset();
  }
}