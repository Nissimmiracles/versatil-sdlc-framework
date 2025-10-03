/**
 * VERSATIL SDLC Framework - Production Supabase Vector Store
 *
 * Advanced client-side vector store with:
 * - Dual embedding support (OpenAI + local Transformers.js)
 * - Real-time agent collaboration via Supabase channels
 * - Production-ready pattern storage and retrieval
 * - Seamless integration with existing Enhanced BMAD agents
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { VERSATILLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';

// OpenAI import for production embeddings
interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

interface OpenAI {
  embeddings: {
    create(params: { model: string; input: string }): Promise<OpenAIEmbeddingResponse>;
  };
}

// Types for our vector store operations
export interface CodePattern {
  id?: string;
  agent: string;
  type: string;
  code: string;
  filePath: string;
  language?: string;
  framework?: string;
  score: number;
  metadata: Record<string, any>;
  embedding?: number[];
  created_at?: string;
  similarity?: number;
}

export interface AgentSolution {
  id?: string;
  agent: string;
  problemType: string;
  problem: string;
  solution: string;
  explanation?: string;
  score: number;
  context: Record<string, any>;
  embedding?: number[];
  effectiveness_score?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface AgentInteraction {
  agent: string;
  problemType: string;
  problem: string;
  solution: string;
  explanation: string;
  score: number;
  context: Record<string, any>;
}

export interface VectorStoreConfig {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey?: string;
  useLocalEmbeddings?: boolean;
  embeddingModel?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface PatternSearchOptions {
  agentName?: string;
  patternType?: string;
  language?: string;
  framework?: string;
  minSimilarity?: number;
  limit?: number;
}

export class SupabaseVectorStore extends EventEmitter {
  private supabase: SupabaseClient;
  private openai?: OpenAI;
  private embeddingModel?: any; // Transformers.js model
  private logger: VERSATILLogger;
  private config: VectorStoreConfig;
  private learningChannel?: RealtimeChannel;
  private isInitialized: boolean = false;

  constructor(config: VectorStoreConfig) {
    super();
    this.config = {
      useLocalEmbeddings: false,
      embeddingModel: 'text-embedding-ada-002',
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    this.logger = new VERSATILLogger();
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    this.initializeEmbeddingProvider();
  }

  /**
   * Initialize embedding provider based on configuration
   */
  private async initializeEmbeddingProvider(): Promise<void> {
    try {
      if (this.config.openaiKey && !this.config.useLocalEmbeddings) {
        // Use OpenAI for production (better quality)
        const { OpenAI } = await import('openai');
        this.openai = new OpenAI({ apiKey: this.config.openaiKey });
        this.logger.info('OpenAI embeddings initialized', { model: this.config.embeddingModel }, 'supabase-vector-store');
      } else {
        // Use local Transformers.js for edge/privacy
        await this.initializeLocalEmbeddings();
      }

      this.isInitialized = true;
      this.emit('initialized', { provider: this.openai ? 'openai' : 'local' });
    } catch (error) {
      this.logger.error('Failed to initialize embedding provider', { error }, 'supabase-vector-store');

      // Fallback to local embeddings
      if (this.openai) {
        this.logger.warn('Falling back to local embeddings', {}, 'supabase-vector-store');
        await this.initializeLocalEmbeddings();
        this.isInitialized = true;
      }
    }
  }

  /**
   * Initialize local Transformers.js embeddings
   */
  private async initializeLocalEmbeddings(): Promise<void> {
    try {
      const { pipeline } = await import('@xenova/transformers');
      this.embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'cpu' } as any // Ensure CPU usage for broader compatibility
      );
      this.logger.info('Local embeddings initialized', { model: 'all-MiniLM-L6-v2' }, 'supabase-vector-store');
    } catch (error) {
      this.logger.error('Failed to initialize local embeddings', { error }, 'supabase-vector-store');
      throw new Error('No embedding provider available');
    }
  }

  /**
   * Generate embeddings for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initializeEmbeddingProvider();
    }

    let retries = 0;
    const maxRetries = this.config.maxRetries || 3;

    while (retries < maxRetries) {
      try {
        if (this.openai) {
          // Use OpenAI embeddings
          const response = await this.openai.embeddings.create({
            model: this.config.embeddingModel || 'text-embedding-ada-002',
            input: text.slice(0, 8000), // Limit input length
          });
          return response.data[0].embedding;
        } else if (this.embeddingModel) {
          // Use local embeddings
          const output = await this.embeddingModel(text.slice(0, 512), {
            pooling: 'mean',
            normalize: true
          });
          return Array.from(output.data);
        } else {
          throw new Error('No embedding provider available');
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          this.logger.error('Failed to generate embedding after retries', {
            error,
            retries,
            text: text.slice(0, 100)
          }, 'supabase-vector-store');
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay! * retries));
      }
    }

    throw new Error('Failed to generate embedding');
  }

  /**
   * Add a code pattern to the vector store
   */
  async addPattern(pattern: CodePattern): Promise<CodePattern> {
    try {
      const embedding = await this.generateEmbedding(
        `${pattern.type} ${pattern.language || ''} ${pattern.framework || ''} ${pattern.code}`
      );

      const { data, error } = await this.supabase
        .from('agent_code_patterns')
        .insert({
          agent_name: pattern.agent,
          pattern_type: pattern.type,
          code_content: pattern.code,
          file_path: pattern.filePath,
          language: pattern.language,
          framework: pattern.framework,
          quality_score: pattern.score,
          embedding: embedding,
          metadata: pattern.metadata,
          tags: this.extractTags(pattern)
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to add pattern', { error, pattern: pattern.type }, 'supabase-vector-store');
        throw error;
      }

      this.logger.info('Pattern added successfully', {
        id: data.id,
        agent: pattern.agent,
        type: pattern.type
      }, 'supabase-vector-store');

      // Notify other agents of new pattern
      await this.notifyPatternAdded(data);

      return { ...pattern, id: data.id, embedding, created_at: data.created_at };
    } catch (error) {
      this.logger.error('Error adding pattern', { error }, 'supabase-vector-store');
      throw error;
    }
  }

  /**
   * Retrieve similar patterns using vector similarity
   */
  async retrieveSimilarPatterns(
    query: string,
    options: PatternSearchOptions = {}
  ): Promise<CodePattern[]> {
    try {
      const {
        agentName,
        patternType,
        language,
        framework,
        minSimilarity = 0.7,
        limit = 5
      } = options;

      const embedding = await this.generateEmbedding(query);

      // Use the appropriate search function based on agent
      let rpcFunction = 'search_backend_patterns'; // default
      if (agentName === 'enhanced-maria') {
        rpcFunction = 'search_qa_patterns';
      } else if (agentName === 'enhanced-james') {
        rpcFunction = 'search_frontend_patterns';
      }

      const { data, error } = await this.supabase.rpc(rpcFunction, {
        query_embedding: embedding,
        match_threshold: minSimilarity,
        match_count: limit,
        language_filter: language || null,
        framework_filter: framework || null
      });

      if (error) {
        this.logger.error('Failed to retrieve similar patterns', { error, query }, 'supabase-vector-store');
        throw error;
      }

      const patterns: CodePattern[] = data.map((row: any) => ({
        id: row.id,
        agent: row.agent_name || agentName || 'unknown',
        type: row.pattern_type,
        code: row.code_content,
        filePath: row.file_path || '',
        language: row.language,
        framework: row.framework,
        score: row.quality_score,
        similarity: row.similarity,
        metadata: row.metadata || {},
        embedding: row.embedding,
        created_at: row.created_at
      }));

      this.logger.info('Retrieved similar patterns', {
        count: patterns.length,
        query: query.slice(0, 50)
      }, 'supabase-vector-store');

      return patterns;
    } catch (error) {
      this.logger.error('Error retrieving similar patterns', { error }, 'supabase-vector-store');
      return [];
    }
  }

  /**
   * Learn from agent interaction and store successful solutions
   */
  async learnFromInteraction(interaction: AgentInteraction): Promise<AgentSolution> {
    try {
      const embedding = await this.generateEmbedding(
        `${interaction.problem} ${interaction.solution}`
      );

      const { data, error } = await this.supabase
        .from('agent_solutions')
        .insert({
          agent_name: interaction.agent,
          problem_type: interaction.problemType,
          problem_description: interaction.problem,
          solution_code: interaction.solution,
          solution_explanation: interaction.explanation,
          effectiveness_score: interaction.score,
          embedding: embedding,
          context: interaction.context,
          success_cases: interaction.score > 0.8 ? 1 : 0,
          failure_cases: interaction.score < 0.5 ? 1 : 0
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to store learning interaction', { error }, 'supabase-vector-store');
        throw error;
      }

      this.logger.info('Learning interaction stored', {
        id: data.id,
        agent: interaction.agent,
        score: interaction.score
      }, 'supabase-vector-store');

      // Broadcast learning to other agents
      await this.broadcastLearning(interaction);

      return {
        id: data.id,
        agent: interaction.agent,
        problemType: interaction.problemType,
        problem: interaction.problem,
        solution: interaction.solution,
        explanation: interaction.explanation,
        score: interaction.score,
        context: interaction.context,
        embedding,
        effectiveness_score: data.effectiveness_score,
        created_at: data.created_at
      };
    } catch (error) {
      this.logger.error('Error storing learning interaction', { error }, 'supabase-vector-store');
      throw error;
    }
  }

  /**
   * Find solutions for similar problems
   */
  async findSimilarSolutions(
    problem: string,
    agentName?: string,
    limit: number = 3
  ): Promise<AgentSolution[]> {
    try {
      const embedding = await this.generateEmbedding(problem);

      const { data, error } = await this.supabase.rpc('search_agent_solutions', {
        query_embedding: embedding,
        agent_filter: agentName || null,
        match_threshold: 0.7,
        match_count: limit
      });

      if (error) {
        this.logger.error('Failed to find similar solutions', { error, problem }, 'supabase-vector-store');
        throw error;
      }

      return data.map((row: any) => ({
        id: row.id,
        agent: row.agent_name,
        problemType: row.problem_type,
        problem: row.problem_description,
        solution: row.solution_code,
        explanation: row.solution_explanation,
        score: row.similarity,
        effectiveness_score: row.effectiveness_score,
        context: row.context || {},
        created_at: row.created_at
      }));
    } catch (error) {
      this.logger.error('Error finding similar solutions', { error }, 'supabase-vector-store');
      return [];
    }
  }

  /**
   * Setup real-time collaboration between agents
   */
  setupRealtimeCollaboration(): RealtimeChannel {
    if (this.learningChannel) {
      return this.learningChannel;
    }

    this.learningChannel = this.supabase.channel('agent-learning')
      .on('broadcast', { event: 'new-pattern' }, (payload) => {
        this.emit('new-pattern', payload.payload);
      })
      .on('broadcast', { event: 'new-solution' }, (payload) => {
        this.emit('new-solution', payload.payload);
      })
      .on('broadcast', { event: 'agent-insight' }, (payload) => {
        this.emit('agent-insight', payload.payload);
      })
      .subscribe();

    this.logger.info('Real-time collaboration setup complete', {}, 'supabase-vector-store');
    return this.learningChannel;
  }

  /**
   * Subscribe to learning events from other agents
   */
  subscribeToLearning(callback: (event: any) => void): () => void {
    this.setupRealtimeCollaboration();

    this.on('new-pattern', callback);
    this.on('new-solution', callback);
    this.on('agent-insight', callback);

    return () => {
      this.off('new-pattern', callback);
      this.off('new-solution', callback);
      this.off('agent-insight', callback);
    };
  }

  /**
   * Get performance metrics for the vector store
   */
  async getPerformanceMetrics(): Promise<any> {
    try {
      const { data: patterns, error: patternsError } = await this.supabase
        .from('agent_code_patterns')
        .select('agent_name, quality_score, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: solutions, error: solutionsError } = await this.supabase
        .from('agent_solutions')
        .select('agent_name, effectiveness_score, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (patternsError || solutionsError) {
        throw patternsError || solutionsError;
      }

      const metrics = {
        patterns: {
          total: patterns?.length || 0,
          avgQuality: patterns?.reduce((sum, p) => sum + p.quality_score, 0) / (patterns?.length || 1),
          byAgent: this.groupByAgent(patterns, 'quality_score')
        },
        solutions: {
          total: solutions?.length || 0,
          avgEffectiveness: solutions?.reduce((sum, s) => sum + s.effectiveness_score, 0) / (solutions?.length || 1),
          byAgent: this.groupByAgent(solutions, 'effectiveness_score')
        },
        embeddingProvider: this.openai ? 'openai' : 'local',
        isInitialized: this.isInitialized
      };

      return metrics;
    } catch (error) {
      this.logger.error('Error getting performance metrics', { error }, 'supabase-vector-store');
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.learningChannel) {
      await this.supabase.removeChannel(this.learningChannel);
    }
    this.removeAllListeners();
    this.logger.info('Supabase vector store cleanup complete', {}, 'supabase-vector-store');
  }

  // Private helper methods

  private extractTags(pattern: CodePattern): string[] {
    const tags = [];
    if (pattern.language) tags.push(pattern.language);
    if (pattern.framework) tags.push(pattern.framework);
    if (pattern.type) tags.push(pattern.type);
    if (pattern.agent) tags.push(pattern.agent);
    return tags;
  }

  private async notifyPatternAdded(pattern: any): Promise<void> {
    if (this.learningChannel) {
      await this.learningChannel.send({
        type: 'broadcast',
        event: 'new-pattern',
        payload: {
          id: pattern.id,
          agent: pattern.agent_name,
          type: pattern.pattern_type,
          language: pattern.language,
          framework: pattern.framework
        }
      });
    }
  }

  private async broadcastLearning(interaction: AgentInteraction): Promise<void> {
    if (this.learningChannel) {
      await this.learningChannel.send({
        type: 'broadcast',
        event: 'new-solution',
        payload: {
          agent: interaction.agent,
          problemType: interaction.problemType,
          score: interaction.score
        }
      });
    }
  }

  private groupByAgent(items: any[], scoreField: string): Record<string, any> {
    const grouped: Record<string, any> = {};
    items?.forEach(item => {
      const agent = item.agent_name;
      if (!grouped[agent]) {
        grouped[agent] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      grouped[agent].count++;
      grouped[agent].totalScore += item[scoreField];
      grouped[agent].avgScore = grouped[agent].totalScore / grouped[agent].count;
    });
    return grouped;
  }

  // Migration support methods
  async hasExistingData(): Promise<boolean> {
    try {
      const { count } = await this.supabase
        .from('code_patterns')
        .select('*', { count: 'exact', head: true });
      return (count || 0) > 0;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    // Already initialized in constructor
    return Promise.resolve();
  }

  getEmbeddingProvider(): string {
    return this.config.openaiKey ? 'openai' : 'local';
  }

  getFeatures(): string[] {
    return ['patterns', 'solutions', 'interactions', 'cross-agent-learning'];
  }

  async storeSolution(solution: AgentSolution): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('agent_solutions')
        .insert([solution]);

      if (error) throw error;

      this.emit('solution_stored', { solution });
    } catch (error) {
      this.logger.error('Failed to store solution', { error }, 'supabase-vector-store');
      throw error;
    }
  }

  async addSolution(solution: any): Promise<void> {
    await this.storeSolution(solution);
  }

  async getPatternCount(): Promise<number> {
    try {
      const { count } = await this.supabase
        .from('code_patterns')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance factory
export function createSupabaseVectorStore(config: VectorStoreConfig): SupabaseVectorStore {
  return new SupabaseVectorStore(config);
}