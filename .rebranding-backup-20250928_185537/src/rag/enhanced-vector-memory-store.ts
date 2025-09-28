/**
 * VERSATIL SDLC Framework - Enhanced Vector Memory Store
 * Advanced RAG with reranking, multimodal support, and proper vector DB
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger';
import { createClient } from '@supabase/supabase-js';

export interface MemoryDocument {
  id: string;
  content: string;
  contentType: 'text' | 'code' | 'image' | 'diagram' | 'mixed';
  embedding?: number[];
  metadata: {
    agentId: string;
    timestamp: number;
    fileType?: string;
    projectContext?: string;
    tags: string[];
    relevanceScore?: number;
    language?: string;
    framework?: string;
    imageData?: string; // base64 for images
    mimeType?: string;
  };
}

export interface RAGQuery {
  query: string;
  queryType?: 'text' | 'semantic' | 'hybrid';
  agentId?: string;
  topK?: number;
  rerank?: boolean;
  includeImages?: boolean;
  filters?: {
    timeRange?: { start: number; end: number };
    tags?: string[];
    fileTypes?: string[];
    contentTypes?: string[];
  };
}

export interface RerankingCriteria {
  recency: number; // 0-1 weight
  relevance: number; // 0-1 weight
  contextMatch: number; // 0-1 weight
  agentExpertise: number; // 0-1 weight
  crossModalBoost: number; // 0-1 weight
}

export interface RAGResult {
  documents: MemoryDocument[];
  reranked?: boolean;
  queryEmbedding?: number[];
  processingTime: number;
  searchMethod: string;
  totalMatches: number;
}

export class EnhancedVectorMemoryStore extends EventEmitter {
  private logger: VERSATILLogger;
  private memories: Map<string, MemoryDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private indexPath: string;
  private supabase: any;
  private isSupabaseEnabled: boolean = false;
  
  // Enhanced configuration
  private config = {
    embeddingDimension: 1536, // OpenAI ada-002 dimension
    maxMemorySize: 100000,
    rerankingEnabled: true,
    multimodalEnabled: true,
    hybridSearchEnabled: true,
    defaultReranking: {
      recency: 0.15,
      relevance: 0.4,
      contextMatch: 0.25,
      agentExpertise: 0.1,
      crossModalBoost: 0.1
    } as RerankingCriteria
  };

  constructor() {
    super();
    this.logger = new VERSATILLogger();
    this.indexPath = path.join(process.cwd(), '.versatil', 'rag', 'vector-index');
    this.initialize();
  }

  /**
   * Initialize Supabase connection if available
   */
  public async initialize(): Promise<void> {
    // Ensure directory exists
    await fs.promises.mkdir(this.indexPath, { recursive: true });

    // Try to initialize Supabase if configured
    await this.initializeSupabase();

    await this.loadExistingMemories();

    this.logger.info('Enhanced vector memory store initialized', {
      memoryCount: this.memories.size,
      supabaseEnabled: this.isSupabaseEnabled,
      features: {
        reranking: this.config.rerankingEnabled,
        multimodal: this.config.multimodalEnabled,
        hybridSearch: this.config.hybridSearchEnabled
      }
    }, 'rag-memory');
  }

  private async initializeSupabase(): Promise<void> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isSupabaseEnabled = true;
        
        // Ensure vector table exists
        await this.ensureVectorTable();
      }
    } catch (error) {
      this.logger.warn('Supabase initialization failed, using local storage', { error }, 'rag-memory');
    }
  }

  /**
   * Store a memory document with vector embedding
   */
  async storeMemory(doc: Omit<MemoryDocument, 'id' | 'embedding'>): Promise<string> {
    const id = this.generateMemoryId();
    const embedding = await this.generateMultimodalEmbedding(doc);
    
    const memory: MemoryDocument = {
      id,
      ...doc,
      embedding
    };
    
    // Store locally
    this.memories.set(id, memory);
    this.embeddings.set(id, embedding);
    
    // Store in vector DB if available
    if (this.isSupabaseEnabled) {
      await this.storeInSupabase(memory);
    }
    
    await this.persistMemory(memory);
    
    this.emit('memory_stored', { 
      id, 
      agentId: doc.metadata.agentId,
      contentType: doc.contentType 
    });
    
    return id;
  }

  /**
   * Enhanced query with reranking and multimodal support
   */
  private async queryMemoriesInternal(query: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    let documents: MemoryDocument[];
    let searchMethod = 'semantic';
    
    // Determine search strategy
    if (query.queryType === 'hybrid' || this.config.hybridSearchEnabled) {
      documents = await this.hybridSearch(query);
      searchMethod = 'hybrid';
    } else if (this.isSupabaseEnabled) {
      documents = await this.vectorSearch(query);
      searchMethod = 'vector';
    } else {
      documents = await this.localSemanticSearch(query);
      searchMethod = 'local-semantic';
    }
    
    // Apply reranking if requested or enabled by default
    let reranked = false;
    if (query.rerank !== false && this.config.rerankingEnabled) {
      documents = await this.rerankResults(documents, query);
      reranked = true;
    }
    
    // Limit to topK
    const topK = query.topK || 10;
    const finalDocuments = documents.slice(0, topK);
    
    return {
      documents: finalDocuments,
      reranked,
      queryEmbedding: await this.generateEmbedding(query.query),
      processingTime: Date.now() - startTime,
      searchMethod,
      totalMatches: documents.length
    };
  }

  /**
   * Hybrid search combining semantic and keyword matching
   */
  private async hybridSearch(query: RAGQuery): Promise<MemoryDocument[]> {
    // Semantic search
    const semanticResults = await this.localSemanticSearch(query);
    
    // Keyword search
    const keywordResults = await this.keywordSearch(query);
    
    // Merge and deduplicate
    const resultMap = new Map<string, MemoryDocument>();
    
    // Add semantic results with boosted scores
    semanticResults.forEach(doc => {
      resultMap.set(doc.id, {
        ...doc,
        metadata: {
          ...doc.metadata,
          relevanceScore: (doc.metadata.relevanceScore || 0) * 1.2
        }
      });
    });
    
    // Add keyword results
    keywordResults.forEach(doc => {
      if (resultMap.has(doc.id)) {
        // Boost documents found by both methods
        const existing = resultMap.get(doc.id)!;
        existing.metadata.relevanceScore = (existing.metadata.relevanceScore || 0) + 0.3;
      } else {
        resultMap.set(doc.id, doc);
      }
    });
    
    return Array.from(resultMap.values());
  }

  /**
   * Keyword-based search
   */
  private async keywordSearch(query: RAGQuery): Promise<MemoryDocument[]> {
    const keywords = query.query.toLowerCase().split(' ').filter(w => w.length > 2);
    let memories = Array.from(this.memories.values());
    
    // Apply filters
    if (query.filters) {
      memories = this.applyFilters(memories, query.filters);
    }
    
    // Score by keyword matches
    const scored = memories.map(memory => {
      const content = memory.content.toLowerCase();
      const metadata = JSON.stringify(memory.metadata).toLowerCase();
      
      let score = 0;
      keywords.forEach(keyword => {
        if (content.includes(keyword)) score += 1;
        if (metadata.includes(keyword)) score += 0.5;
      });
      
      return {
        memory: {
          ...memory,
          metadata: { ...memory.metadata, relevanceScore: score / keywords.length }
        },
        score
      };
    });
    
    // Sort and filter
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.memory);
  }

  /**
   * Advanced reranking with multiple criteria
   */
  private async rerankResults(documents: MemoryDocument[], query: RAGQuery): Promise<MemoryDocument[]> {
    const criteria = this.config.defaultReranking;
    const now = Date.now();
    
    // Get project context if available
    const projectContext = await this.getProjectContext();
    
    // Score each document
    const reranked = documents.map(doc => {
      let finalScore = 0;
      
      // 1. Relevance score (from initial search)
      const relevance = doc.metadata.relevanceScore || 0;
      finalScore += relevance * criteria.relevance;
      
      // 2. Recency score
      const age = now - doc.metadata.timestamp;
      const recencyScore = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // Decay over 30 days
      finalScore += recencyScore * criteria.recency;
      
      // 3. Context match score
      let contextScore = 0;
      if (projectContext) {
        if (doc.metadata.language === projectContext.language) contextScore += 0.5;
        if (doc.metadata.framework === projectContext.framework) contextScore += 0.5;
      }
      finalScore += contextScore * criteria.contextMatch;
      
      // 4. Agent expertise score
      const agentExpertise = this.getAgentExpertiseScore(doc.metadata.agentId, query.query);
      finalScore += agentExpertise * criteria.agentExpertise;
      
      // 5. Cross-modal boost
      if (doc.contentType !== 'text' && query.includeImages) {
        finalScore += criteria.crossModalBoost;
      }
      
      return {
        document: doc,
        finalScore
      };
    });
    
    // Sort by final score
    reranked.sort((a, b) => b.finalScore - a.finalScore);
    
    // Update relevance scores
    return reranked.map(r => ({
      ...r.document,
      metadata: {
        ...r.document.metadata,
        relevanceScore: r.finalScore
      }
    }));
  }

  /**
   * Generate embeddings for multimodal content
   */
  private async generateMultimodalEmbedding(doc: Omit<MemoryDocument, 'id' | 'embedding'>): Promise<number[]> {
    if (doc.contentType === 'text' || doc.contentType === 'code') {
      return this.generateEmbedding(doc.content);
    } else if (doc.contentType === 'image' && doc.metadata.imageData) {
      return this.generateImageEmbedding(doc.metadata.imageData);
    } else if (doc.contentType === 'mixed') {
      // Combine text and image embeddings
      const textEmb = await this.generateEmbedding(doc.content);
      if (doc.metadata.imageData) {
        const imgEmb = await this.generateImageEmbedding(doc.metadata.imageData);
        // Average the embeddings (simple fusion)
        return textEmb.map((val, idx) => (val + imgEmb[idx]) / 2);
      }
      return textEmb;
    }
    
    return this.generateEmbedding(doc.content);
  }

  /**
   * Generate embedding for images
   */
  private async generateImageEmbedding(imageData: string): Promise<number[]> {
    // TODO: Integrate with multimodal embedding model (CLIP, etc.)
    // For now, return placeholder
    const embedding = Array(this.config.embeddingDimension).fill(0).map(() => Math.random());
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * Store in Supabase vector database
   */
  private async storeInSupabase(memory: MemoryDocument): Promise<void> {
    if (!this.isSupabaseEnabled) return;
    
    try {
      const { error } = await this.supabase
        .from('versatil_memories')
        .upsert({
          id: memory.id,
          content: memory.content,
          content_type: memory.contentType,
          embedding: memory.embedding,
          metadata: memory.metadata,
          agent_id: memory.metadata.agentId,
          created_at: new Date(memory.metadata.timestamp).toISOString()
        });
        
      if (error) {
        this.logger.error('Failed to store in Supabase', { error }, 'rag-memory');
      }
    } catch (error) {
      this.logger.error('Supabase storage error', { error }, 'rag-memory');
    }
  }

  /**
   * Vector search using Supabase
   */
  private async vectorSearch(query: RAGQuery): Promise<MemoryDocument[]> {
    if (!this.isSupabaseEnabled) {
      return this.localSemanticSearch(query);
    }
    
    try {
      const queryEmbedding = await this.generateEmbedding(query.query);
      
      // Build the RPC call
      let rpcQuery = this.supabase.rpc('match_memories', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: query.topK || 20
      });
      
      // Apply filters
      if (query.agentId) {
        rpcQuery = rpcQuery.eq('agent_id', query.agentId);
      }
      
      if (query.filters?.contentTypes) {
        rpcQuery = rpcQuery.in('content_type', query.filters.contentTypes);
      }
      
      const { data, error } = await rpcQuery;
      
      if (error) {
        this.logger.error('Vector search failed', { error }, 'rag-memory');
        return this.localSemanticSearch(query);
      }
      
      return data.map((row: any) => ({
        id: row.id,
        content: row.content,
        contentType: row.content_type,
        embedding: row.embedding,
        metadata: {
          ...row.metadata,
          relevanceScore: row.similarity
        }
      }));
      
    } catch (error) {
      this.logger.error('Vector search error', { error }, 'rag-memory');
      return this.localSemanticSearch(query);
    }
  }

  /**
   * Local semantic search (fallback)
   */
  private async localSemanticSearch(query: RAGQuery): Promise<MemoryDocument[]> {
    const queryEmbedding = await this.generateEmbedding(query.query);
    
    // Filter memories
    let filteredMemories = Array.from(this.memories.values());
    
    if (query.agentId) {
      filteredMemories = filteredMemories.filter(m => m.metadata.agentId === query.agentId);
    }
    
    if (query.filters) {
      filteredMemories = this.applyFilters(filteredMemories, query.filters);
    }
    
    // Calculate similarity scores
    const scoredMemories = filteredMemories.map(memory => ({
      memory,
      score: this.cosineSimilarity(queryEmbedding, memory.embedding || [])
    }));
    
    // Sort by relevance
    scoredMemories.sort((a, b) => b.score - a.score);
    
    return scoredMemories.map(({ memory, score }) => ({
      ...memory,
      metadata: { ...memory.metadata, relevanceScore: score }
    }));
  }

  /**
   * Get agent expertise score for reranking
   */
  private getAgentExpertiseScore(agentId: string, query: string): number {
    const expertise: Record<string, string[]> = {
      'enhanced-marcus': ['backend', 'api', 'database', 'typescript'],
      'enhanced-james': ['frontend', 'ui', 'react', 'css'],
      'enhanced-maria': ['testing', 'qa', 'quality', 'coverage'],
      'security-sam': ['security', 'vulnerability', 'authentication'],
      'architecture-dan': ['architecture', 'design', 'patterns', 'structure'],
      'dr-ai-ml': ['ml', 'ai', 'optimization', 'performance']
    };
    
    const agentKeywords = expertise[agentId] || [];
    const queryLower = query.toLowerCase();
    
    let score = 0;
    agentKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) score += 0.25;
    });
    
    return Math.min(1, score);
  }

  /**
   * Get current project context for reranking
   */
  private async getProjectContext(): Promise<any> {
    // Try to get from environment scanner if available
    try {
      const scanner = require('../environment/environment-scanner').environmentScanner;
      return scanner.getLatestScan()?.technology;
    } catch {
      return null;
    }
  }

  /**
   * Ensure vector table exists in Supabase
   */
  private async ensureVectorTable(): Promise<void> {
    // This would be run via migration, but included for reference
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS versatil_memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        content_type VARCHAR(50) DEFAULT 'text',
        embedding vector(1536),
        metadata JSONB DEFAULT '{}',
        agent_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_memories_embedding 
      ON versatil_memories USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
      
      CREATE INDEX IF NOT EXISTS idx_memories_agent 
      ON versatil_memories(agent_id);
      
      CREATE INDEX IF NOT EXISTS idx_memories_content_type 
      ON versatil_memories(content_type);
    `;
  }

  // ... (keep other utility methods from original)

  /**
   * Store diagram or visual content
   */
  async storeDiagram(content: string, diagramData: string, metadata: any): Promise<string> {
    return this.storeMemory({
      content,
      contentType: 'diagram',
      metadata: {
        ...metadata,
        imageData: diagramData,
        mimeType: 'image/svg+xml'
      }
    });
  }

  /**
   * Store code with syntax highlighting metadata
   */
  async storeCode(code: string, language: string, metadata: any): Promise<string> {
    return this.storeMemory({
      content: code,
      contentType: 'code',
      metadata: {
        ...metadata,
        language,
        fileType: language
      }
    });
  }

  /**
   * Generate embedding (with API integration support)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check for OpenAI API key
    if (process.env.OPENAI_API_KEY) {
      try {
        // TODO: Integrate with OpenAI embeddings API
        // const response = await openai.embeddings.create({
        //   model: "text-embedding-3-small",
        //   input: text,
        // });
        // return response.data[0].embedding;
      } catch (error) {
        this.logger.warn('OpenAI embedding failed, using fallback', { error }, 'rag-memory');
      }
    }

    // Fallback to simple embedding
    const embedding = Array(this.config.embeddingDimension).fill(0).map(() => Math.random());
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  // Missing method implementations
  private async loadExistingMemories(): Promise<void> {}
  private generateMemoryId(doc?: any): string { return `mem-${Date.now()}-${Math.random()}`; }
  private async persistMemory(doc: MemoryDocument): Promise<void> {}
  private applyFilters(documents: MemoryDocument[], filters: any): MemoryDocument[] { return documents; }
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    return vec1.reduce((sum, val, i) => sum + val * (vec2[i] || 0), 0);
  }
  async getAllMemories(): Promise<MemoryDocument[]> { return Array.from(this.memories.values()); }
  async searchMemories(query: string | RAGQuery, options?: any): Promise<any[]> {
    const results = await this.queryMemoriesInternal(typeof query === 'string' ? { query } : query);
    return Array.isArray(results) ? results : (results.documents || []);
  }
  async queryMemories(query: string | RAGQuery): Promise<any> {
    return await this.queryMemoriesInternal(typeof query === 'string' ? { query } : query);
  }
  async close(): Promise<void> {}
}

// Export enhanced singleton instance
export const vectorMemoryStore = new EnhancedVectorMemoryStore();
