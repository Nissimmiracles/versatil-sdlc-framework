/**
 * VERSATIL SDLC Framework - Vector Memory Store
 * RAG implementation for agent memory and context retrieval
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger';

export interface MemoryDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    agentId: string;
    timestamp: number;
    fileType?: string;
    projectContext?: string;
    tags: string[];
    relevanceScore?: number;
  };
}

export interface RAGQuery {
  query: string;
  agentId?: string;
  topK?: number;
  filters?: {
    timeRange?: { start: number; end: number };
    tags?: string[];
    fileTypes?: string[];
  };
}

export interface RAGResult {
  documents: MemoryDocument[];
  queryEmbedding?: number[];
  processingTime: number;
}

export class VectorMemoryStore extends EventEmitter {
  private logger: VERSATILLogger;
  private memories: Map<string, MemoryDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private indexPath: string;
  
  // Simulated embeddings for now - replace with actual embedding model
  private embeddingDimension = 384;

  constructor() {
    super();
    this.logger = new VERSATILLogger();
    this.indexPath = path.join(process.cwd(), '.versatil', 'rag', 'vector-index');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Ensure directory exists
    await fs.promises.mkdir(this.indexPath, { recursive: true });
    await this.loadExistingMemories();
    
    this.logger.info('Vector memory store initialized', {
      memoryCount: this.memories.size
    }, 'rag-memory');
  }

  /**
   * Store a memory document with vector embedding
   */
  async storeMemory(doc: Omit<MemoryDocument, 'id' | 'embedding'>): Promise<string> {
    const id = this.generateMemoryId(doc);
    const embedding = await this.generateEmbedding(doc.content);
    
    const memory: MemoryDocument = {
      id,
      ...doc,
      embedding
    };
    
    this.memories.set(id, memory);
    this.embeddings.set(id, embedding);
    
    await this.persistMemory(memory);
    
    this.emit('memory_stored', { id, agentId: doc.metadata.agentId });
    
    return id;
  }

  /**
   * Query memories using semantic search
   */
  async queryMemories(query: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    const queryEmbedding = await this.generateEmbedding(query.query);
    
    // Filter memories based on criteria
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
    
    // Sort by relevance and take top K
    scoredMemories.sort((a, b) => b.score - a.score);
    const topK = query.topK || 5;
    const topMemories = scoredMemories.slice(0, topK);
    
    // Update relevance scores
    const documents = topMemories.map(({ memory, score }) => ({
      ...memory,
      metadata: { ...memory.metadata, relevanceScore: score }
    }));
    
    return {
      documents,
      queryEmbedding,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Update memory based on agent feedback
   */
  async updateMemoryRelevance(memoryId: string, feedback: 'helpful' | 'not_helpful'): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) return;
    
    // Update relevance based on feedback
    const currentScore = memory.metadata.relevanceScore || 0.5;
    const adjustment = feedback === 'helpful' ? 0.1 : -0.1;
    memory.metadata.relevanceScore = Math.max(0, Math.min(1, currentScore + adjustment));
    
    await this.persistMemory(memory);
    
    this.emit('memory_feedback', { memoryId, feedback });
  }

  /**
   * Generate embedding for text (placeholder - integrate with actual model)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Placeholder: Generate random embedding
    // TODO: Integrate with OpenAI, Cohere, or local embedding model
    const embedding = Array(this.embeddingDimension).fill(0).map(() => Math.random());
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    
    return dotProduct;
  }

  /**
   * Apply filters to memory documents
   */
  private applyFilters(memories: MemoryDocument[], filters: RAGQuery['filters']): MemoryDocument[] {
    let filtered = memories;
    
    if (filters?.timeRange) {
      filtered = filtered.filter(m => 
        m.metadata.timestamp >= filters.timeRange!.start &&
        m.metadata.timestamp <= filters.timeRange!.end
      );
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter(m =>
        filters.tags!.some(tag => m.metadata.tags.includes(tag))
      );
    }
    
    if (filters?.fileTypes && filters.fileTypes.length > 0) {
      filtered = filtered.filter(m =>
        filters.fileTypes!.includes(m.metadata.fileType || '')
      );
    }
    
    return filtered;
  }

  /**
   * Generate unique memory ID
   */
  private generateMemoryId(doc: Omit<MemoryDocument, 'id' | 'embedding'>): string {
    const hash = require('crypto').createHash('md5');
    hash.update(doc.content);
    hash.update(doc.metadata.agentId);
    hash.update(doc.metadata.timestamp.toString());
    return hash.digest('hex');
  }

  /**
   * Persist memory to disk
   */
  private async persistMemory(memory: MemoryDocument): Promise<void> {
    const filePath = path.join(this.indexPath, `${memory.id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(memory, null, 2));
  }

  /**
   * Load existing memories from disk
   */
  private async loadExistingMemories(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.indexPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.indexPath, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const memory: MemoryDocument = JSON.parse(content);
          
          this.memories.set(memory.id, memory);
          if (memory.embedding) {
            this.embeddings.set(memory.id, memory.embedding);
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load existing memories', { error }, 'rag-memory');
    }
  }
}

// Export singleton instance
export const vectorMemoryStore = new VectorMemoryStore();
