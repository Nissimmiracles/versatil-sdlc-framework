/**
 * Bidirectional RAG Synchronization
 * Agents both query AND update RAG for continuous learning
 */

import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
}

export class BidirectionalRAGSync {
  private vectorStore: EnhancedVectorMemoryStore;
  private metrics: SyncMetrics;

  constructor(vectorStore: EnhancedVectorMemoryStore) {
    this.vectorStore = vectorStore;
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0
    };
  }

  /**
   * Sync agent response back to RAG
   * This creates the "learning" part of the intelligence flywheel
   */
  async syncAgentResponse(
    agentId: string,
    context: AgentActivationContext,
    response: AgentResponse
  ): Promise<void> {
    const startTime = Date.now();
    this.metrics.totalSyncs++;

    try {
      // Store main response
      await this.storeResponse(agentId, context, response);

      // Store suggestions as learnable patterns
      if (response.suggestions && response.suggestions.length > 0) {
        await this.storeSuggestions(agentId, response.suggestions);
      }

      // Store context metadata for future retrieval
      await this.storeContextMetadata(agentId, context, response);

      const syncTime = Date.now() - startTime;
      this.updateMetrics(syncTime, true);

    } catch (error) {
      console.error('Bidirectional sync failed:', error);
      this.updateMetrics(Date.now() - startTime, false);
    }
  }

  /**
   * Store agent response
   */
  private async storeResponse(
    agentId: string,
    context: AgentActivationContext,
    response: AgentResponse
  ): Promise<void> {
    await this.vectorStore.storeMemory({
      content: response.message,
      contentType: 'text',
      metadata: {
        agentId,
        timestamp: Date.now(),
        context: context.filePath || 'unknown',
        trigger: context.trigger || 'unknown',
        tags: ['agent-response', agentId, response.priority],
        quality_score: response.context?.confidence || 0.7,
        priority: response.priority
      }
    });
  }

  /**
   * Store suggestions as patterns
   */
  private async storeSuggestions(
    agentId: string,
    suggestions: any[]
  ): Promise<void> {
    for (const suggestion of suggestions) {
      await this.vectorStore.storeMemory({
        content: suggestion.message || suggestion.description,
        contentType: 'text',
        metadata: {
          agentId,
          timestamp: Date.now(),
          tags: ['suggestion', 'pattern', suggestion.type, agentId],
          pattern_type: suggestion.type,
          priority: suggestion.priority || 'medium',
          actionable: true
        }
      });
    }
  }

  /**
   * Store context metadata for pattern matching
   */
  private async storeContextMetadata(
    agentId: string,
    context: AgentActivationContext,
    response: AgentResponse
  ): Promise<void> {
    await this.vectorStore.storeMemory({
      content: JSON.stringify({
        filePath: context.filePath,
        trigger: context.trigger,
        contentPreview: context.content?.substring(0, 200)
      }),
      contentType: 'context-metadata',
      metadata: {
        agentId,
        timestamp: Date.now(),
        tags: ['context-metadata', agentId],
        file_path: context.filePath || 'unknown',
        trigger: context.trigger || 'unknown',
        response_quality: response.context?.confidence || 0.7
      }
    });
  }

  /**
   * Query for similar past contexts
   */
  async querySimilarContexts(
    context: AgentActivationContext,
    agentId: string,
    limit: number = 5
  ): Promise<any[]> {
    const query = context.content || context.userRequest || context.filePath || '';

    const result = await this.vectorStore.queryMemories({
      query,
      queryType: 'semantic',
      agentId,
      topK: limit,
      filters: {
        tags: ['context-metadata', agentId],
        contentTypes: ['context-metadata']
      }
    });

    return result.documents || [];
  }

  /**
   * Query for successful patterns
   */
  async querySuccessfulPatterns(
    agentId: string,
    patternType?: string,
    limit: number = 5
  ): Promise<any[]> {
    const tags = ['pattern', 'suggestion', agentId];
    if (patternType) {
      tags.push(patternType);
    }

    const result = await this.vectorStore.queryMemories({
      query: `${agentId} successful patterns`,
      queryType: 'semantic',
      agentId,
      topK: limit,
      filters: {
        tags,
        contentTypes: ['text']
      }
    });

    return result.documents || [];
  }

  /**
   * Update sync metrics
   */
  private updateMetrics(syncTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulSyncs++;
    } else {
      this.metrics.failedSyncs++;
    }

    // Update average sync time (exponential moving average)
    const alpha = 0.2;
    this.metrics.averageSyncTime =
      alpha * syncTime + (1 - alpha) * this.metrics.averageSyncTime;
  }

  /**
   * Get sync metrics
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0
    };
  }
}