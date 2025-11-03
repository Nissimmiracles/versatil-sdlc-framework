/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-this-alias, no-case-declarations, no-empty, no-control-regex */
/**
 * VERSATIL SDLC Framework - Enhanced Vector Memory Store
 * Advanced RAG with reranking, multimodal support, and proper vector DB
 */
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';
import { gcpVectorStore } from '../lib/gcp-vector-store.js';
import { graphRAGStore } from '../lib/graphrag-store.js';
export class EnhancedVectorMemoryStore extends EventEmitter {
    constructor() {
        super();
        this.memories = new Map();
        this.embeddings = new Map();
        this.isSupabaseEnabled = false;
        this.isGCPEnabled = false;
        this.isGraphRAGEnabled = false;
        this.edgeFunctionsEnabled = false;
        this.supabaseUrl = null;
        this.vectorBackend = 'local';
        // Enhanced configuration
        this.config = {
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
            }
        };
        this.logger = new VERSATILLogger();
        this.indexPath = path.join(process.cwd(), '.versatil', 'rag', 'vector-index');
        this.initialize();
    }
    /**
     * Initialize Supabase connection if available
     */
    async initialize() {
        // Ensure directory exists
        await fs.promises.mkdir(this.indexPath, { recursive: true });
        // Try to initialize GraphRAG first (preferred - no API quota), then GCP, then Supabase
        await this.initializeGraphRAG();
        if (!this.isGraphRAGEnabled) {
            await this.initializeGCP();
            if (!this.isGCPEnabled) {
                await this.initializeSupabase();
            }
        }
        await this.loadExistingMemories();
        this.logger.info('Enhanced vector memory store initialized', {
            memoryCount: this.memories.size,
            vectorBackend: this.vectorBackend,
            graphRAGEnabled: this.isGraphRAGEnabled,
            gcpEnabled: this.isGCPEnabled,
            supabaseEnabled: this.isSupabaseEnabled,
            features: {
                reranking: this.config.rerankingEnabled,
                multimodal: this.config.multimodalEnabled,
                hybridSearch: this.config.hybridSearchEnabled
            }
        }, 'rag-memory');
    }
    /**
     * Initialize GraphRAG knowledge graph (PREFERRED - no API quota, works offline)
     */
    async initializeGraphRAG() {
        try {
            const gcpProject = process.env.GOOGLE_CLOUD_PROJECT;
            if (gcpProject) {
                await graphRAGStore.initialize();
                this.isGraphRAGEnabled = true;
                this.vectorBackend = 'graphrag';
                this.logger.info('GraphRAG knowledge graph initialized', {
                    project: gcpProject,
                    benefits: 'No API quota, offline, explainable'
                }, 'rag-memory');
            }
        }
        catch (error) {
            this.logger.warn('GraphRAG initialization failed, trying GCP vector store', { error }, 'rag-memory');
        }
    }
    async initializeGCP() {
        try {
            const gcpProject = process.env.GOOGLE_CLOUD_PROJECT;
            if (gcpProject) {
                await gcpVectorStore.initialize();
                this.isGCPEnabled = true;
                this.vectorBackend = 'gcp';
                this.logger.info('GCP Firestore vector store initialized', {
                    project: gcpProject,
                    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
                }, 'rag-memory');
            }
        }
        catch (error) {
            this.logger.warn('GCP initialization failed, trying Supabase', { error }, 'rag-memory');
        }
    }
    async initializeSupabase() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;
            if (supabaseUrl && supabaseKey) {
                this.supabase = createClient(supabaseUrl, supabaseKey);
                this.isSupabaseEnabled = true;
                this.supabaseUrl = supabaseUrl;
                this.edgeFunctionsEnabled = true; // Enable edge functions integration
                // Ensure vector table exists
                await this.ensureVectorTable();
                this.logger.info('Supabase + Edge Functions initialized', {
                    supabaseUrl: supabaseUrl.replace(/\/.*/, '//[HIDDEN]'),
                    edgeFunctions: this.edgeFunctionsEnabled
                }, 'rag-memory');
            }
        }
        catch (error) {
            this.logger.warn('Supabase initialization failed, using local storage', { error }, 'rag-memory');
        }
    }
    /**
     * Store a memory document with vector embedding
     */
    async storeMemory(doc) {
        const id = this.generateMemoryId();
        const embedding = await this.generateMultimodalEmbedding(doc);
        const memory = {
            id,
            ...doc,
            embedding
        };
        // Store locally
        this.memories.set(id, memory);
        this.embeddings.set(id, embedding);
        // Store in vector DB if available (GCP preferred, then Supabase)
        if (this.isGCPEnabled) {
            await this.storeInGCP(memory);
        }
        else if (this.isSupabaseEnabled) {
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
    async queryMemoriesInternal(query) {
        const startTime = Date.now();
        let documents;
        let searchMethod = 'semantic';
        // Determine search strategy (GraphRAG preferred - no API quota, works offline)
        if (query.queryType === 'hybrid' || this.config.hybridSearchEnabled) {
            documents = await this.hybridSearch(query);
            searchMethod = 'hybrid';
        }
        else if (this.isGraphRAGEnabled) {
            documents = await this.graphRAGSearch(query);
            searchMethod = 'graphrag';
        }
        else if (this.isGCPEnabled) {
            documents = await this.gcpVectorSearch(query);
            searchMethod = 'gcp-vector';
        }
        else if (this.isSupabaseEnabled) {
            documents = await this.vectorSearch(query);
            searchMethod = 'vector';
        }
        else {
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
    async hybridSearch(query) {
        // Semantic search (prefer GraphRAG, fallback to GCP, then local)
        let semanticResults;
        if (this.isGraphRAGEnabled) {
            semanticResults = await this.graphRAGSearch(query);
        }
        else if (this.isGCPEnabled) {
            semanticResults = await this.gcpVectorSearch(query);
        }
        else {
            semanticResults = await this.localSemanticSearch(query);
        }
        // Keyword search
        const keywordResults = await this.keywordSearch(query);
        // Merge and deduplicate
        const resultMap = new Map();
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
                const existing = resultMap.get(doc.id);
                existing.metadata.relevanceScore = (existing.metadata.relevanceScore || 0) + 0.3;
            }
            else {
                resultMap.set(doc.id, doc);
            }
        });
        return Array.from(resultMap.values());
    }
    /**
     * Keyword-based search
     */
    async keywordSearch(query) {
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
                if (content.includes(keyword))
                    score += 1;
                if (metadata.includes(keyword))
                    score += 0.5;
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
    async rerankResults(documents, query) {
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
                if (doc.metadata.language === projectContext.language)
                    contextScore += 0.5;
                if (doc.metadata.framework === projectContext.framework)
                    contextScore += 0.5;
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
    async generateMultimodalEmbedding(doc) {
        if (doc.contentType === 'text' || doc.contentType === 'code') {
            return this.generateEmbedding(doc.content);
        }
        else if (doc.contentType === 'image' && doc.metadata.imageData) {
            return this.generateImageEmbedding(doc.metadata.imageData);
        }
        else if (doc.contentType === 'mixed') {
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
     * Generate embedding for images using CLIP (via Hugging Face Transformers.js)
     */
    async generateImageEmbedding(imageData) {
        try {
            // Use Hugging Face Transformers.js for CLIP embeddings
            const { pipeline } = await import('@xenova/transformers');
            // Create feature extraction pipeline with CLIP model
            const extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
            // Generate embedding from image data
            const output = await extractor(imageData, { pooling: 'mean', normalize: true });
            // Convert tensor to array
            const embedding = Array.from(output.data);
            // Resize to match configured dimension if needed
            if (embedding.length !== this.config.embeddingDimension) {
                return this.resizeEmbedding(embedding, this.config.embeddingDimension);
            }
            return embedding;
        }
        catch (error) {
            console.warn('CLIP embedding generation failed, using fallback:', error);
            // Fallback: Generate random normalized embedding
            const embedding = Array(this.config.embeddingDimension).fill(0).map(() => Math.random());
            const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
            return embedding.map(val => val / norm);
        }
    }
    /**
     * Resize embedding to target dimension
     */
    resizeEmbedding(embedding, targetDim) {
        if (embedding.length === targetDim)
            return embedding;
        // Simple interpolation/truncation
        if (embedding.length > targetDim) {
            // Truncate
            return embedding.slice(0, targetDim);
        }
        else {
            // Pad with zeros
            return [...embedding, ...Array(targetDim - embedding.length).fill(0)];
        }
    }
    /**
     * Store in Supabase vector database
     */
    async storeInSupabase(memory) {
        if (!this.isSupabaseEnabled)
            return;
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
        }
        catch (error) {
            this.logger.error('Supabase storage error', { error }, 'rag-memory');
        }
    }
    /**
     * Store memory in GCP Firestore
     */
    async storeInGCP(memory) {
        if (!this.isGCPEnabled)
            return;
        try {
            await gcpVectorStore.storePattern({
                pattern: memory.content,
                category: memory.metadata.tags?.[0] || 'general',
                agent: memory.metadata.agentId,
                effectiveness: memory.metadata.relevanceScore || 0.8,
                timeSaved: 0, // Can be tracked separately
                code: memory.contentType === 'code' ? memory.content : undefined,
                description: memory.metadata.projectContext,
                tags: memory.metadata.tags,
                usageCount: 0,
                lastUsed: new Date(memory.metadata.timestamp)
            });
            this.logger.debug('Stored in GCP Firestore', { id: memory.id }, 'rag-memory');
        }
        catch (error) {
            this.logger.error('GCP storage error', { error }, 'rag-memory');
        }
    }
    /**
     * Vector search using GCP Firestore
     */
    /**
     * GraphRAG search using knowledge graph (PREFERRED - no API quota, works offline)
     */
    async graphRAGSearch(query) {
        if (!this.isGraphRAGEnabled) {
            return this.localSemanticSearch(query);
        }
        try {
            const results = await graphRAGStore.query({
                query: query.query,
                limit: query.topK || 20,
                minRelevance: 0.3,
                agent: query.agentId,
                tags: query.filters?.tags
            });
            // Convert GraphRAG results to MemoryDocument format
            const documents = results.map(result => {
                // Handle Firestore Timestamp objects (has _seconds property)
                const lastUsed = result.pattern.properties.lastUsed;
                const timestamp = (lastUsed && typeof lastUsed === 'object' && '_seconds' in lastUsed)
                    ? lastUsed._seconds * 1000 // Firestore Timestamp
                    : (lastUsed instanceof Date ? lastUsed.getTime() : Date.now());
                return {
                    id: result.pattern.id,
                    content: result.pattern.properties.pattern,
                    contentType: result.pattern.properties.code ? 'code' : 'text',
                    embedding: [], // Not needed in results
                    metadata: {
                        agentId: result.pattern.properties.agent,
                        timestamp,
                        tags: result.pattern.properties.tags || [],
                        relevanceScore: result.relevanceScore,
                        projectContext: result.pattern.properties.description,
                        graphPath: result.graphPath, // Unique to GraphRAG - shows reasoning
                        explanation: result.explanation // Human-readable explanation
                    }
                };
            });
            return documents;
        }
        catch (error) {
            this.logger.error('GraphRAG search error', { error }, 'rag-memory');
            return this.localSemanticSearch(query);
        }
    }
    async gcpVectorSearch(query) {
        if (!this.isGCPEnabled) {
            return this.localSemanticSearch(query);
        }
        try {
            const results = await gcpVectorStore.searchSimilar({
                text: query.query,
                limit: query.topK || 20,
                threshold: 0.7,
                agent: query.agentId,
                tags: query.filters?.tags
            });
            // Convert GCP results to MemoryDocument format
            const documents = results.map(result => ({
                id: result.pattern.id,
                content: result.pattern.pattern,
                contentType: result.pattern.code ? 'code' : 'text',
                embedding: [], // Not needed in results
                metadata: {
                    agentId: result.pattern.agent,
                    timestamp: result.pattern.created.getTime(),
                    tags: result.pattern.tags || [],
                    relevanceScore: result.similarity,
                    projectContext: result.pattern.description
                }
            }));
            return documents;
        }
        catch (error) {
            this.logger.error('GCP vector search error', { error }, 'rag-memory');
            return this.localSemanticSearch(query);
        }
    }
    /**
     * Vector search using Supabase
     */
    async vectorSearch(query) {
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
            return data.map((row) => ({
                id: row.id,
                content: row.content,
                contentType: row.content_type,
                embedding: row.embedding,
                metadata: {
                    ...row.metadata,
                    relevanceScore: row.similarity
                }
            }));
        }
        catch (error) {
            this.logger.error('Vector search error', { error }, 'rag-memory');
            return this.localSemanticSearch(query);
        }
    }
    /**
     * Local semantic search (fallback)
     */
    async localSemanticSearch(query) {
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
    getAgentExpertiseScore(agentId, query) {
        const expertise = {
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
            if (queryLower.includes(keyword))
                score += 0.25;
        });
        return Math.min(1, score);
    }
    /**
     * Get current project context for reranking
     */
    async getProjectContext() {
        // Try to get from environment scanner if available
        try {
            const scanner = require('../environment/environment-scanner').environmentScanner;
            return scanner.getLatestScan()?.technology;
        }
        catch {
            return null;
        }
    }
    /**
     * Ensure vector table exists in Supabase
     */
    async ensureVectorTable() {
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
    async storeDiagram(content, diagramData, metadata) {
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
    async storeCode(code, language, metadata) {
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
    async generateEmbedding(text) {
        // Check for OpenAI API key
        if (process.env.OPENAI_API_KEY) {
            try {
                // Real OpenAI embeddings API integration
                const { OpenAI } = await import('openai');
                const openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                });
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: text,
                    dimensions: this.config.embeddingDimension
                });
                const embedding = response.data[0].embedding;
                // Ensure correct dimension
                if (embedding.length !== this.config.embeddingDimension) {
                    return this.resizeEmbedding(embedding, this.config.embeddingDimension);
                }
                return embedding;
            }
            catch (error) {
                this.logger.warn('OpenAI embedding failed, using fallback', { error }, 'rag-memory');
            }
        }
        // Fallback to simple embedding
        const embedding = Array(this.config.embeddingDimension).fill(0).map(() => Math.random());
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => val / norm);
    }
    // Missing method implementations
    async loadExistingMemories() {
        try {
            // Load from Supabase if configured
            const { data, error } = await this.supabase
                .from('versatil_memories')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1000);
            if (error)
                throw error;
            if (data) {
                for (const row of data) {
                    const doc = {
                        id: row.id,
                        content: row.content,
                        contentType: row.content_type || 'text',
                        metadata: row.metadata || {},
                        embedding: row.embedding || []
                    };
                    this.memories.set(doc.id, doc);
                }
                this.logger.info(`Loaded ${data.length} existing memories from Supabase`);
            }
        }
        catch (error) {
            this.logger.warn('Could not load existing memories', { error });
        }
    }
    generateMemoryId(doc) { return `mem-${Date.now()}-${Math.random()}`; }
    async persistMemory(doc) {
        try {
            // Persist to Supabase
            const { error } = await this.supabase
                .from('versatil_memories')
                .upsert({
                id: doc.id,
                content: doc.content,
                metadata: doc.metadata,
                embedding: doc.embedding,
                created_at: new Date().toISOString()
            });
            if (error) {
                this.logger.warn('Failed to persist memory to Supabase', { error });
            }
        }
        catch (error) {
            this.logger.warn('Error persisting memory', { error });
        }
    }
    applyFilters(documents, filters) { return documents; }
    cosineSimilarity(vec1, vec2) {
        return vec1.reduce((sum, val, i) => sum + val * (vec2[i] || 0), 0);
    }
    async getAllMemories() { return Array.from(this.memories.values()); }
    async searchMemories(query, options) {
        const results = await this.queryMemoriesInternal(typeof query === 'string' ? { query } : query);
        return Array.isArray(results) ? results : (results.documents || []);
    }
    async queryMemories(query) {
        return await this.queryMemoriesInternal(typeof query === 'string' ? { query } : query);
    }
    /**
     * Search for similar documents (alias for queryMemoriesInternal)
     * Used by plan-generator for RAG context retrieval
     */
    async searchSimilar(query, options) {
        const ragQuery = {
            query,
            topK: options?.limit || 5,
            filters: options?.domain ? { tags: [options.domain] } : undefined
        };
        const result = await this.queryMemoriesInternal(ragQuery);
        return result.documents.map(doc => ({
            metadata: doc.metadata,
            score: doc.metadata.relevanceScore || 0.5
        }));
    }
    async close() {
        this.logger.info('Closing Enhanced Vector Memory Store');
        // Clear in-memory cache
        this.memories.clear();
        // No need to close Supabase client (it's stateless)
        this.logger.info('Enhanced Vector Memory Store closed');
    }
    // ============================================================================
    // AGENT-SPECIFIC RAG METHODS WITH EDGE FUNCTION INTEGRATION
    // ============================================================================
    /**
     * Enhanced Maria (QA) RAG query using edge functions
     */
    async mariaRAG(query, context, config) {
        if (!this.edgeFunctionsEnabled || !this.supabaseUrl) {
            // Fallback to local processing
            return this.localMariaRAG(query, context, config);
        }
        try {
            const response = await fetch(`${this.supabaseUrl}/functions/v1/maria-rag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ query, context, config }),
            });
            if (!response.ok) {
                throw new Error(`Maria RAG edge function failed: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Maria RAG processing failed');
            }
            this.logger.info('Maria RAG edge function completed', {
                similarPatterns: result.data?.ragInsights?.similarPatterns || 0,
                processingTime: result.metadata?.processingTime || 0
            }, 'maria-rag');
            return result;
        }
        catch (error) {
            this.logger.warn('Maria RAG edge function failed, using fallback', { error }, 'maria-rag');
            return this.localMariaRAG(query, context, config);
        }
    }
    /**
     * Enhanced James (Frontend) RAG query using edge functions
     */
    async jamesRAG(query, context, config) {
        if (!this.edgeFunctionsEnabled || !this.supabaseUrl) {
            // Fallback to local processing
            return this.localJamesRAG(query, context, config);
        }
        try {
            const response = await fetch(`${this.supabaseUrl}/functions/v1/james-rag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ query, context, config }),
            });
            if (!response.ok) {
                throw new Error(`James RAG edge function failed: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'James RAG processing failed');
            }
            this.logger.info('James RAG edge function completed', {
                componentPatterns: result.data?.ragInsights?.componentPatterns || 0,
                processingTime: result.metadata?.processingTime || 0
            }, 'james-rag');
            return result;
        }
        catch (error) {
            this.logger.warn('James RAG edge function failed, using fallback', { error }, 'james-rag');
            return this.localJamesRAG(query, context, config);
        }
    }
    /**
     * Enhanced Marcus (Backend) RAG query using edge functions
     */
    async marcusRAG(query, context, config) {
        if (!this.edgeFunctionsEnabled || !this.supabaseUrl) {
            // Fallback to local processing
            return this.localMarcusRAG(query, context, config);
        }
        try {
            const response = await fetch(`${this.supabaseUrl}/functions/v1/marcus-rag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ query, context, config }),
            });
            if (!response.ok) {
                throw new Error(`Marcus RAG edge function failed: ${response.statusText}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Marcus RAG processing failed');
            }
            this.logger.info('Marcus RAG edge function completed', {
                apiPatterns: result.data?.ragInsights?.apiPatterns || 0,
                securitySolutions: result.data?.ragInsights?.securitySolutions || 0,
                processingTime: result.metadata?.processingTime || 0
            }, 'marcus-rag');
            return result;
        }
        catch (error) {
            this.logger.warn('Marcus RAG edge function failed, using fallback', { error }, 'marcus-rag');
            return this.localMarcusRAG(query, context, config);
        }
    }
    /**
     * Fallback local Maria RAG processing
     */
    async localMariaRAG(query, context, config) {
        const ragQuery = {
            query: `QA testing patterns ${query}`,
            queryType: 'semantic',
            agentId: 'enhanced-maria',
            topK: config?.maxExamples || 3,
            filters: {
                tags: ['test', 'qa', 'testing'],
                contentTypes: ['code', 'text']
            }
        };
        const results = await this.queryMemoriesInternal(ragQuery);
        return {
            success: true,
            data: {
                testPatterns: results.documents,
                qaBestPractices: [],
                projectStandards: [],
                ragInsights: {
                    similarPatterns: results.documents.length,
                    projectStandards: 0,
                    expertise: 0,
                    avgSimilarity: results.documents.reduce((sum, doc) => sum + (doc.metadata.relevanceScore || 0), 0) / results.documents.length
                }
            },
            metadata: {
                agentId: 'enhanced-maria',
                processingTime: results.processingTime,
                queryType: 'local-fallback'
            }
        };
    }
    /**
     * Fallback local James RAG processing
     */
    async localJamesRAG(query, context, config) {
        const ragQuery = {
            query: `Frontend component patterns ${query}`,
            queryType: 'semantic',
            agentId: 'enhanced-james',
            topK: config?.maxExamples || 3,
            filters: {
                tags: ['frontend', 'component', 'ui'],
                contentTypes: ['code']
            }
        };
        const results = await this.queryMemoriesInternal(ragQuery);
        return {
            success: true,
            data: {
                componentPatterns: results.documents,
                uiPatterns: [],
                performancePatterns: [],
                ragInsights: {
                    componentPatterns: results.documents.length,
                    uiPatterns: 0,
                    performanceOptimizations: 0,
                    avgSimilarity: results.documents.reduce((sum, doc) => sum + (doc.metadata.relevanceScore || 0), 0) / results.documents.length
                }
            },
            metadata: {
                agentId: 'enhanced-james',
                processingTime: results.processingTime,
                queryType: 'local-fallback'
            }
        };
    }
    /**
     * Fallback local Marcus RAG processing
     */
    async localMarcusRAG(query, context, config) {
        const ragQuery = {
            query: `Backend API patterns ${query}`,
            queryType: 'semantic',
            agentId: 'enhanced-marcus',
            topK: config?.maxExamples || 3,
            filters: {
                tags: ['backend', 'api', 'security'],
                contentTypes: ['code']
            }
        };
        const results = await this.queryMemoriesInternal(ragQuery);
        return {
            success: true,
            data: {
                apiPatterns: results.documents,
                securityPatterns: [],
                performancePatterns: [],
                databaseOptimizations: [],
                ragInsights: {
                    apiPatterns: results.documents.length,
                    securitySolutions: 0,
                    performanceOptimizations: 0,
                    databaseOptimizations: 0,
                    avgSimilarity: results.documents.reduce((sum, doc) => sum + (doc.metadata.relevanceScore || 0), 0) / results.documents.length
                }
            },
            metadata: {
                agentId: 'enhanced-marcus',
                processingTime: results.processingTime,
                queryType: 'local-fallback'
            }
        };
    }
    /**
     * Store agent-specific patterns in enhanced schema
     */
    async storeAgentPattern(agentName, pattern) {
        if (!this.isSupabaseEnabled) {
            // Fallback to local storage
            return this.storeMemory({
                content: pattern.code_content || pattern.content,
                contentType: 'code',
                metadata: {
                    agentId: agentName,
                    timestamp: Date.now(),
                    tags: pattern.tags || [],
                    ...pattern.metadata
                }
            });
        }
        try {
            const { data, error } = await this.supabase
                .from('agent_code_patterns')
                .insert({
                agent_name: agentName,
                pattern_type: pattern.pattern_type || 'unknown',
                code_content: pattern.code_content || pattern.content,
                file_path: pattern.file_path,
                language: pattern.language,
                framework: pattern.framework,
                quality_score: pattern.quality_score || 80,
                metadata: pattern.metadata || {},
                tags: pattern.tags || []
            })
                .select()
                .single();
            if (error) {
                throw error;
            }
            this.logger.info('Agent pattern stored in enhanced schema', {
                agentName,
                patternType: pattern.pattern_type,
                id: data.id
            }, 'rag-memory');
            return data.id;
        }
        catch (error) {
            this.logger.error('Failed to store agent pattern', { error, agentName }, 'rag-memory');
            // Fallback to local storage
            return this.storeMemory({
                content: pattern.code_content || pattern.content,
                contentType: 'code',
                metadata: {
                    agentId: agentName,
                    timestamp: Date.now(),
                    tags: pattern.tags || [],
                    ...pattern.metadata
                }
            });
        }
    }
    /**
     * Store agent solutions in enhanced schema
     */
    async storeAgentSolution(agentName, solution) {
        if (!this.isSupabaseEnabled) {
            return this.storeMemory({
                content: solution.solution_code || solution.content,
                contentType: 'code',
                metadata: {
                    agentId: agentName,
                    timestamp: Date.now(),
                    problemType: solution.problem_type,
                    ...solution.metadata
                }
            });
        }
        try {
            const { data, error } = await this.supabase
                .from('agent_solutions')
                .insert({
                agent_name: agentName,
                problem_type: solution.problem_type,
                problem_description: solution.problem_description,
                solution_code: solution.solution_code,
                solution_explanation: solution.solution_explanation,
                effectiveness_score: solution.effectiveness_score || 0.8,
                dependencies: solution.dependencies || [],
                compatibility: solution.compatibility || {}
            })
                .select()
                .single();
            if (error) {
                throw error;
            }
            this.logger.info('Agent solution stored in enhanced schema', {
                agentName,
                problemType: solution.problem_type,
                id: data.id
            }, 'rag-memory');
            return data.id;
        }
        catch (error) {
            this.logger.error('Failed to store agent solution', { error, agentName }, 'rag-memory');
            return this.storeMemory({
                content: solution.solution_code || solution.content,
                contentType: 'code',
                metadata: {
                    agentId: agentName,
                    timestamp: Date.now(),
                    problemType: solution.problem_type,
                    ...solution.metadata
                }
            });
        }
    }
    /**
     * Get production deployment status
     */
    getProductionStatus() {
        return {
            supabaseEnabled: this.isSupabaseEnabled,
            edgeFunctionsEnabled: this.edgeFunctionsEnabled,
            agentRAGAvailable: this.edgeFunctionsEnabled && this.supabaseUrl !== null,
            enhancedSchemaReady: this.isSupabaseEnabled
        };
    }
}
// Export enhanced singleton instance
export const vectorMemoryStore = new EnhancedVectorMemoryStore();
//# sourceMappingURL=enhanced-vector-memory-store.js.map