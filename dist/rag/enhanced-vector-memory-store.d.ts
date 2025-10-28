/**
 * VERSATIL SDLC Framework - Enhanced Vector Memory Store
 * Advanced RAG with reranking, multimodal support, and proper vector DB
 */
import { EventEmitter } from 'events';
export interface MemoryDocument {
    id: string;
    content: string;
    contentType: 'text' | 'code' | 'image' | 'diagram' | 'mixed' | 'handoff' | 'context-metadata' | 'web-learned-pattern' | 'interaction' | 'meta-learning' | 'winning-pattern' | 'anti-pattern' | 'team-style';
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
        imageData?: string;
        mimeType?: string;
        [key: string]: any;
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
        timeRange?: {
            start: number;
            end: number;
        };
        tags?: string[];
        fileTypes?: string[];
        contentTypes?: string[];
    };
}
export interface RerankingCriteria {
    recency: number;
    relevance: number;
    contextMatch: number;
    agentExpertise: number;
    crossModalBoost: number;
}
export interface RAGResult {
    documents: MemoryDocument[];
    reranked?: boolean;
    queryEmbedding?: number[];
    processingTime: number;
    searchMethod: string;
    totalMatches: number;
}
export declare class EnhancedVectorMemoryStore extends EventEmitter {
    private logger;
    private memories;
    private embeddings;
    private indexPath;
    private supabase;
    private isSupabaseEnabled;
    private isGCPEnabled;
    private isGraphRAGEnabled;
    private edgeFunctionsEnabled;
    private supabaseUrl;
    private vectorBackend;
    private config;
    constructor();
    /**
     * Initialize Supabase connection if available
     */
    initialize(): Promise<void>;
    /**
     * Initialize GraphRAG knowledge graph (PREFERRED - no API quota, works offline)
     */
    private initializeGraphRAG;
    private initializeGCP;
    private initializeSupabase;
    /**
     * Store a memory document with vector embedding
     */
    storeMemory(doc: Omit<MemoryDocument, 'id' | 'embedding'>): Promise<string>;
    /**
     * Enhanced query with reranking and multimodal support
     */
    private queryMemoriesInternal;
    /**
     * Hybrid search combining semantic and keyword matching
     */
    private hybridSearch;
    /**
     * Keyword-based search
     */
    private keywordSearch;
    /**
     * Advanced reranking with multiple criteria
     */
    private rerankResults;
    /**
     * Generate embeddings for multimodal content
     */
    private generateMultimodalEmbedding;
    /**
     * Generate embedding for images using CLIP (via Hugging Face Transformers.js)
     */
    private generateImageEmbedding;
    /**
     * Resize embedding to target dimension
     */
    private resizeEmbedding;
    /**
     * Store in Supabase vector database
     */
    private storeInSupabase;
    /**
     * Store memory in GCP Firestore
     */
    private storeInGCP;
    /**
     * Vector search using GCP Firestore
     */
    /**
     * GraphRAG search using knowledge graph (PREFERRED - no API quota, works offline)
     */
    private graphRAGSearch;
    private gcpVectorSearch;
    /**
     * Vector search using Supabase
     */
    private vectorSearch;
    /**
     * Local semantic search (fallback)
     */
    private localSemanticSearch;
    /**
     * Get agent expertise score for reranking
     */
    private getAgentExpertiseScore;
    /**
     * Get current project context for reranking
     */
    private getProjectContext;
    /**
     * Ensure vector table exists in Supabase
     */
    private ensureVectorTable;
    /**
     * Store diagram or visual content
     */
    storeDiagram(content: string, diagramData: string, metadata: any): Promise<string>;
    /**
     * Store code with syntax highlighting metadata
     */
    storeCode(code: string, language: string, metadata: any): Promise<string>;
    /**
     * Generate embedding (with API integration support)
     */
    private generateEmbedding;
    private loadExistingMemories;
    private generateMemoryId;
    private persistMemory;
    private applyFilters;
    private cosineSimilarity;
    getAllMemories(): Promise<MemoryDocument[]>;
    searchMemories(query: string | RAGQuery, options?: any): Promise<any[]>;
    queryMemories(query: string | RAGQuery): Promise<any>;
    /**
     * Search for similar documents (alias for queryMemoriesInternal)
     * Used by plan-generator for RAG context retrieval
     */
    searchSimilar(query: string, options?: {
        limit?: number;
        threshold?: number;
        domain?: string;
    }): Promise<Array<{
        metadata?: any;
        score: number;
    }>>;
    close(): Promise<void>;
    /**
     * Enhanced Maria (QA) RAG query using edge functions
     */
    mariaRAG(query: string, context: any, config?: any): Promise<any>;
    /**
     * Enhanced James (Frontend) RAG query using edge functions
     */
    jamesRAG(query: string, context: any, config?: any): Promise<any>;
    /**
     * Enhanced Marcus (Backend) RAG query using edge functions
     */
    marcusRAG(query: string, context: any, config?: any): Promise<any>;
    /**
     * Fallback local Maria RAG processing
     */
    private localMariaRAG;
    /**
     * Fallback local James RAG processing
     */
    private localJamesRAG;
    /**
     * Fallback local Marcus RAG processing
     */
    private localMarcusRAG;
    /**
     * Store agent-specific patterns in enhanced schema
     */
    storeAgentPattern(agentName: string, pattern: any): Promise<string>;
    /**
     * Store agent solutions in enhanced schema
     */
    storeAgentSolution(agentName: string, solution: any): Promise<string>;
    /**
     * Get production deployment status
     */
    getProductionStatus(): {
        supabaseEnabled: boolean;
        edgeFunctionsEnabled: boolean;
        agentRAGAvailable: boolean;
        enhancedSchemaReady: boolean;
    };
}
export declare const vectorMemoryStore: EnhancedVectorMemoryStore;
