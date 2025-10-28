/**
 * GCP Firestore Vector Store
 * Production implementation using Google Cloud Firestore + Vertex AI embeddings
 *
 * Features:
 * - Store patterns with vector embeddings in Firestore
 * - Generate embeddings via Vertex AI MCP (textembedding-gecko@003)
 * - Fast vector similarity search (client-side)
 * - Automatic scaling (Firestore serverless)
 * - Cross-machine sync
 *
 * Benefits over Supabase:
 * - Uses existing GCP infrastructure
 * - No new credentials needed (uses gcloud auth)
 * - Better integration with Vertex AI
 * - Generous free tier (50k reads/day, 20k writes/day)
 */
import { EventEmitter } from 'events';
export interface PatternDocument {
    id: string;
    pattern: string;
    category: string;
    agent: string;
    effectiveness: number;
    timeSaved: number;
    code?: string;
    description?: string;
    tags?: string[];
    usageCount?: number;
    lastUsed?: Date;
    created: Date;
    updated: Date;
}
export interface EmbeddingDocument {
    id: string;
    embedding: number[];
    model: string;
    dimension: number;
    created: Date;
}
export interface VectorSearchQuery {
    text: string;
    limit?: number;
    threshold?: number;
    category?: string;
    agent?: string;
    tags?: string[];
}
export interface VectorSearchResult {
    pattern: PatternDocument;
    similarity: number;
    distance: number;
}
export declare class GCPVectorStore extends EventEmitter {
    private firestore;
    private projectId;
    private patternsCollection;
    private embeddingsCollection;
    private initialized;
    constructor();
    /**
     * Initialize Firestore connection and verify collections
     */
    initialize(): Promise<void>;
    /**
     * Store pattern with embedding in Firestore
     */
    storePattern(pattern: Omit<PatternDocument, 'id' | 'created' | 'updated'>): Promise<string>;
    /**
     * Vector similarity search using cosine similarity
     */
    searchSimilar(query: VectorSearchQuery): Promise<VectorSearchResult[]>;
    /**
     * Get pattern by ID
     */
    getPattern(id: string): Promise<PatternDocument | null>;
    /**
     * Update pattern metadata (not embedding)
     */
    updatePattern(id: string, updates: Partial<PatternDocument>): Promise<void>;
    /**
     * Delete pattern and its embedding
     */
    deletePattern(id: string): Promise<void>;
    /**
     * List all patterns with optional filters
     */
    listPatterns(filters?: {
        category?: string;
        agent?: string;
        limit?: number;
    }): Promise<PatternDocument[]>;
    /**
     * Get statistics about stored patterns
     */
    getStatistics(): Promise<{
        totalPatterns: number;
        totalEmbeddings: number;
        categories: Record<string, number>;
        agents: Record<string, number>;
    }>;
    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Close Firestore connection
     */
    close(): Promise<void>;
}
export declare const gcpVectorStore: GCPVectorStore;
