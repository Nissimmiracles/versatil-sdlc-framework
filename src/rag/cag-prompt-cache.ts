/**
 * Cache Augmented Generation (CAG) - Prompt Caching Service
 *
 * Wraps Anthropic SDK to enable prompt caching for RAG queries.
 * Achieves 90% cost reduction and 10x faster responses for cached prompts.
 *
 * Benefits:
 * - Cached tokens: $0.03/MTok (vs $0.30/MTok for regular)
 * - 5-10x faster inference on cache hits
 * - Consistent context across agent queries
 *
 * Usage:
 * ```typescript
 * const cagCache = new CAGPromptCache();
 * const response = await cagCache.query({
 *   systemPrompt: "You are Enhanced James...",
 *   ragContext: retrievedDocs,
 *   userQuery: "How do I implement this component?"
 * });
 * ```
 */

import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';

export interface CAGConfig {
  apiKey?: string;
  enabled: boolean;
  minPromptSize: number; // Minimum tokens to enable caching (default: 1024)
  cacheTTL: number; // Cache TTL in seconds (default: 300 = 5 minutes)
  strategy: 'static' | 'dynamic' | 'adaptive'; // Caching strategy
  maxCachedBlocks: number; // Maximum cacheable blocks per prompt
  fallbackToNonCached: boolean; // Gracefully degrade if caching fails
}

export interface CAGQueryRequest {
  systemPrompt: string; // Agent system prompt (cacheable)
  ragContext: string; // Retrieved RAG context (cacheable)
  userQuery: string; // Current user query (NOT cacheable)
  agentId?: string; // For metrics tracking
  model?: string; // Default: claude-sonnet-4
  temperature?: number; // Default: 0.7
  maxTokens?: number; // Default: 4096
}

export interface CAGQueryResponse {
  content: string; // LLM response
  cacheStatus: 'hit' | 'miss' | 'disabled' | 'error';
  tokenUsage: {
    cacheCreation: number; // Tokens written to cache
    cacheRead: number; // Tokens read from cache (90% cheaper)
    input: number; // Non-cached input tokens
    output: number; // Output tokens generated
  };
  costSavings: {
    regularCost: number; // Cost without caching
    cachedCost: number; // Cost with caching
    savings: number; // Dollar amount saved
    savingsPercent: number; // Percentage saved
  };
  latency: number; // Response time in ms
  model: string;
}

export interface CAGMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  cacheErrors: number;
  hitRate: number; // Percentage
  totalCostSavings: number; // Dollars saved
  avgLatency: {
    cached: number; // ms
    uncached: number; // ms
    speedup: number; // X faster
  };
  tokensSaved: number; // Total cached tokens read
  byAgent: Map<string, {
    queries: number;
    hits: number;
    savings: number;
  }>;
}

export class CAGPromptCache extends EventEmitter {
  private anthropic: Anthropic;
  private config: CAGConfig;
  private logger: VERSATILLogger;
  private metrics: CAGMetrics;
  private initialized: boolean = false;

  // Cost per million tokens (Anthropic pricing as of 2024)
  private readonly COST_PER_MTOK = {
    input: 0.30, // Regular input tokens
    output: 1.50, // Output tokens
    cacheWrite: 0.375, // Writing to cache (25% more than input)
    cacheRead: 0.03 // Reading from cache (90% cheaper!)
  };

  constructor(config?: Partial<CAGConfig>) {
    super();
    this.logger = new VERSATILLogger('CAG');

    this.config = {
      apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY,
      enabled: config?.enabled ?? true,
      minPromptSize: config?.minPromptSize ?? 1024,
      cacheTTL: config?.cacheTTL ?? 300, // 5 minutes
      strategy: config?.strategy ?? 'adaptive',
      maxCachedBlocks: config?.maxCachedBlocks ?? 3,
      fallbackToNonCached: config?.fallbackToNonCached ?? true
    };

    if (!this.config.apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not found - CAG disabled');
      this.config.enabled = false;
    }

    this.anthropic = new Anthropic({
      apiKey: this.config.apiKey || 'dummy-key'
    });

    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize CAG system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Initializing Cache Augmented Generation (CAG)', {
      enabled: this.config.enabled,
      strategy: this.config.strategy,
      cacheTTL: this.config.cacheTTL,
      minPromptSize: this.config.minPromptSize
    });

    if (this.config.enabled) {
      // Test API connection
      try {
        await this.testConnection();
        this.logger.info('✅ CAG initialized successfully');
      } catch (error: any) {
        this.logger.error('❌ CAG initialization failed', { error: error.message });
        if (!this.config.fallbackToNonCached) {
          throw error;
        }
        this.config.enabled = false;
      }
    }

    this.initialized = true;
    this.emit('initialized', { config: this.config });
  }

  /**
   * Execute RAG query with prompt caching
   */
  async query(request: CAGQueryRequest): Promise<CAGQueryResponse> {
    const startTime = Date.now();

    // If CAG disabled, fall back to non-cached query
    if (!this.config.enabled) {
      return this.nonCachedQuery(request, startTime);
    }

    try {
      // Build cacheable message structure
      const messages = this.buildCachedMessages(request);

      // Execute query with Anthropic
      const response = await this.anthropic.messages.create({
        model: request.model || 'claude-sonnet-4-20250514',
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        messages
      });

      // Calculate metrics
      const latency = Date.now() - startTime;
      const tokenUsage = this.extractTokenUsage(response);
      const cacheStatus = this.determineCacheStatus(tokenUsage);
      const costSavings = this.calculateCostSavings(tokenUsage);

      // Update metrics
      this.updateMetrics(cacheStatus, costSavings, latency, request.agentId);

      // Extract content
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      const result: CAGQueryResponse = {
        content,
        cacheStatus,
        tokenUsage,
        costSavings,
        latency,
        model: response.model
      };

      this.emit('query:completed', result);
      return result;

    } catch (error: any) {
      this.logger.error('CAG query failed', { error: error.message });

      this.metrics.cacheErrors++;

      if (this.config.fallbackToNonCached) {
        this.logger.warn('Falling back to non-cached query');
        return this.nonCachedQuery(request, startTime);
      }

      throw error;
    }
  }

  /**
   * Build message structure with cache-control blocks
   *
   * Structure:
   * 1. System prompt (CACHED) - Agent identity, rarely changes
   * 2. RAG context (CACHED) - Retrieved docs, changes per query type
   * 3. User query (NOT CACHED) - Unique each time
   */
  private buildCachedMessages(request: CAGQueryRequest): any[] {
    const messages: any[] = [];

    // System message with cache control
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: request.systemPrompt,
          cache_control: { type: 'ephemeral' } // Cache system prompt
        }
      ]
    });

    // RAG context message with cache control
    if (request.ragContext && request.ragContext.length > this.config.minPromptSize) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `# Retrieved Context\n\n${request.ragContext}`,
            cache_control: { type: 'ephemeral' } // Cache RAG context
          }
        ]
      });
    } else if (request.ragContext) {
      // Context too small to cache efficiently
      messages.push({
        role: 'user',
        content: `# Retrieved Context\n\n${request.ragContext}`
      });
    }

    // User query (NOT cached - unique each time)
    messages.push({
      role: 'user',
      content: request.userQuery
    });

    return messages;
  }

  /**
   * Extract token usage from Anthropic response
   */
  private extractTokenUsage(response: any): CAGQueryResponse['tokenUsage'] {
    const usage = response.usage || {};

    return {
      cacheCreation: usage.cache_creation_input_tokens || 0,
      cacheRead: usage.cache_read_input_tokens || 0,
      input: usage.input_tokens || 0,
      output: usage.output_tokens || 0
    };
  }

  /**
   * Determine cache status from token usage
   */
  private determineCacheStatus(
    tokenUsage: CAGQueryResponse['tokenUsage']
  ): CAGQueryResponse['cacheStatus'] {
    if (tokenUsage.cacheRead > 0) {
      return 'hit'; // Cache was used
    } else if (tokenUsage.cacheCreation > 0) {
      return 'miss'; // Cache was created but not used (first query)
    } else {
      return 'disabled'; // Caching not used
    }
  }

  /**
   * Calculate cost savings from caching
   */
  private calculateCostSavings(
    tokenUsage: CAGQueryResponse['tokenUsage']
  ): CAGQueryResponse['costSavings'] {
    // Cost without caching (all tokens as regular input)
    const totalInputTokens = tokenUsage.cacheCreation + tokenUsage.cacheRead + tokenUsage.input;
    const regularCost =
      (totalInputTokens / 1_000_000) * this.COST_PER_MTOK.input +
      (tokenUsage.output / 1_000_000) * this.COST_PER_MTOK.output;

    // Cost with caching
    const cachedCost =
      (tokenUsage.cacheCreation / 1_000_000) * this.COST_PER_MTOK.cacheWrite +
      (tokenUsage.cacheRead / 1_000_000) * this.COST_PER_MTOK.cacheRead +
      (tokenUsage.input / 1_000_000) * this.COST_PER_MTOK.input +
      (tokenUsage.output / 1_000_000) * this.COST_PER_MTOK.output;

    const savings = regularCost - cachedCost;
    const savingsPercent = regularCost > 0 ? (savings / regularCost) * 100 : 0;

    return {
      regularCost,
      cachedCost,
      savings,
      savingsPercent
    };
  }

  /**
   * Update metrics after query
   */
  private updateMetrics(
    cacheStatus: CAGQueryResponse['cacheStatus'],
    costSavings: CAGQueryResponse['costSavings'],
    latency: number,
    agentId?: string
  ): void {
    this.metrics.totalQueries++;

    if (cacheStatus === 'hit') {
      this.metrics.cacheHits++;
      this.metrics.avgLatency.cached =
        (this.metrics.avgLatency.cached * (this.metrics.cacheHits - 1) + latency) / this.metrics.cacheHits;
    } else if (cacheStatus === 'miss') {
      this.metrics.cacheMisses++;
      this.metrics.avgLatency.uncached =
        (this.metrics.avgLatency.uncached * (this.metrics.cacheMisses - 1) + latency) / this.metrics.cacheMisses;
    }

    this.metrics.hitRate = this.metrics.totalQueries > 0
      ? (this.metrics.cacheHits / this.metrics.totalQueries) * 100
      : 0;

    this.metrics.totalCostSavings += costSavings.savings;

    if (this.metrics.avgLatency.cached > 0 && this.metrics.avgLatency.uncached > 0) {
      this.metrics.avgLatency.speedup = this.metrics.avgLatency.uncached / this.metrics.avgLatency.cached;
    }

    // Track by agent
    if (agentId) {
      if (!this.metrics.byAgent.has(agentId)) {
        this.metrics.byAgent.set(agentId, { queries: 0, hits: 0, savings: 0 });
      }
      const agentMetrics = this.metrics.byAgent.get(agentId)!;
      agentMetrics.queries++;
      if (cacheStatus === 'hit') agentMetrics.hits++;
      agentMetrics.savings += costSavings.savings;
    }
  }

  /**
   * Non-cached query fallback
   */
  private async nonCachedQuery(
    request: CAGQueryRequest,
    startTime: number
  ): Promise<CAGQueryResponse> {
    try {
      const response = await this.anthropic.messages.create({
        model: request.model || 'claude-sonnet-4-20250514',
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        messages: [
          {
            role: 'user',
            content: `${request.systemPrompt}\n\n${request.ragContext}\n\n${request.userQuery}`
          }
        ]
      });

      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      const tokenUsage = this.extractTokenUsage(response);
      const latency = Date.now() - startTime;

      return {
        content,
        cacheStatus: 'disabled',
        tokenUsage: {
          ...tokenUsage,
          cacheCreation: 0,
          cacheRead: 0
        },
        costSavings: {
          regularCost: 0,
          cachedCost: 0,
          savings: 0,
          savingsPercent: 0
        },
        latency,
        model: response.model
      };
    } catch (error: any) {
      this.logger.error('Non-cached query failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Test API connection
   */
  private async testConnection(): Promise<void> {
    try {
      await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      });
    } catch (error: any) {
      throw new Error(`Anthropic API connection failed: ${error.message}`);
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): CAGMetrics {
    return {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheErrors: 0,
      hitRate: 0,
      totalCostSavings: 0,
      avgLatency: {
        cached: 0,
        uncached: 0,
        speedup: 1
      },
      tokensSaved: 0,
      byAgent: new Map()
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): CAGMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.emit('metrics:reset');
  }

  /**
   * Get configuration
   */
  getConfig(): CAGConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CAGConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config:updated', this.config);
  }

  /**
   * Check if CAG is enabled and operational
   */
  isEnabled(): boolean {
    return this.config.enabled && this.initialized;
  }
}

// Export singleton instance
export const cagPromptCache = new CAGPromptCache();
