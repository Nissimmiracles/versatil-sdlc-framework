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
import { Firestore } from '@google-cloud/firestore';
import { EventEmitter } from 'events';
import { vertexAIMCPExecutor } from '../mcp/vertex-ai-mcp-executor.js';
export class GCPVectorStore extends EventEmitter {
    constructor() {
        super();
        this.patternsCollection = 'versatil_patterns';
        this.embeddingsCollection = 'versatil_embeddings';
        this.initialized = false;
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'centering-vine-454613-b3';
        // Initialize Firestore with gcloud credentials (no JSON needed)
        // Use named database to avoid Datastore Mode conflicts
        this.firestore = new Firestore({
            projectId: this.projectId,
            databaseId: 'versatil-rag' // Named database for Firestore Native Mode
        });
    }
    /**
     * Initialize Firestore connection and verify collections
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            console.log(`🔧 Initializing GCP Firestore Vector Store (${this.projectId})...`);
            // Test connection by reading collection
            const patternsRef = this.firestore.collection(this.patternsCollection);
            await patternsRef.limit(1).get();
            this.initialized = true;
            console.log(`✅ GCP Firestore initialized successfully`);
            this.emit('initialized', { projectId: this.projectId });
        }
        catch (error) {
            console.error(`❌ Failed to initialize Firestore:`, error.message);
            throw new Error(`Firestore initialization failed: ${error.message}. Make sure Firestore API is enabled in GCP.`);
        }
    }
    /**
     * Store pattern with embedding in Firestore
     */
    async storePattern(pattern) {
        await this.initialize();
        try {
            const now = new Date();
            const patternDoc = {
                ...pattern,
                id: '', // Will be set by Firestore
                created: now,
                updated: now
            };
            // Store pattern document
            const patternsRef = this.firestore.collection(this.patternsCollection);
            const docRef = await patternsRef.add(patternDoc);
            const patternId = docRef.id;
            // Update with ID
            await docRef.update({ id: patternId });
            // Generate embedding via Vertex AI
            const embeddingText = `${pattern.pattern}\n${pattern.description || ''}\n${pattern.code || ''}`;
            const embeddingResult = await vertexAIMCPExecutor.executeVertexAIMCP('embeddings', {
                texts: [embeddingText],
                model: 'textembedding-gecko@003'
            });
            if (embeddingResult.success && embeddingResult.data?.embeddings?.[0]) {
                const embedding = embeddingResult.data.embeddings[0];
                // Store embedding document
                const embeddingDoc = {
                    id: patternId,
                    embedding,
                    model: embeddingResult.data.model || 'textembedding-gecko@003',
                    dimension: embeddingResult.data.dimension || 768,
                    created: now
                };
                await this.firestore
                    .collection(this.embeddingsCollection)
                    .doc(patternId)
                    .set(embeddingDoc);
                console.log(`✅ Stored pattern ${patternId} with embedding (${embedding.length}D)`);
            }
            else {
                console.warn(`⚠️  Pattern ${patternId} stored without embedding:`, embeddingResult.error);
            }
            this.emit('pattern:stored', { id: patternId, pattern });
            return patternId;
        }
        catch (error) {
            console.error(`❌ Failed to store pattern:`, error.message);
            throw error;
        }
    }
    /**
     * Vector similarity search using cosine similarity
     */
    async searchSimilar(query) {
        await this.initialize();
        try {
            const { text, limit = 5, threshold = 0.7, category, agent, tags } = query;
            // Generate query embedding via Vertex AI
            const embeddingResult = await vertexAIMCPExecutor.executeVertexAIMCP('embeddings', {
                texts: [text],
                model: 'textembedding-gecko@003'
            });
            if (!embeddingResult.success || !embeddingResult.data?.embeddings?.[0]) {
                throw new Error(`Failed to generate query embedding: ${embeddingResult.error}`);
            }
            const queryEmbedding = embeddingResult.data.embeddings[0];
            // Fetch all embeddings (in production, use Vertex AI Matching Engine for large-scale)
            const embeddingsRef = this.firestore.collection(this.embeddingsCollection);
            const embeddingsSnapshot = await embeddingsRef.get();
            // Calculate similarities
            const similarities = [];
            embeddingsSnapshot.forEach(doc => {
                const embeddingDoc = doc.data();
                const similarity = this.cosineSimilarity(queryEmbedding, embeddingDoc.embedding);
                const distance = 1 - similarity;
                if (similarity >= threshold) {
                    similarities.push({
                        id: embeddingDoc.id,
                        similarity,
                        distance
                    });
                }
            });
            // Sort by similarity (descending)
            similarities.sort((a, b) => b.similarity - a.similarity);
            // Fetch pattern documents for top results
            const topResults = similarities.slice(0, limit);
            const results = [];
            for (const { id, similarity, distance } of topResults) {
                const patternDoc = await this.firestore
                    .collection(this.patternsCollection)
                    .doc(id)
                    .get();
                if (patternDoc.exists) {
                    const pattern = patternDoc.data();
                    // Apply filters
                    if (category && pattern.category !== category)
                        continue;
                    if (agent && pattern.agent !== agent)
                        continue;
                    if (tags && tags.length > 0) {
                        const patternTags = pattern.tags || [];
                        if (!tags.some(tag => patternTags.includes(tag)))
                            continue;
                    }
                    results.push({
                        pattern,
                        similarity,
                        distance
                    });
                }
            }
            console.log(`🔍 Vector search: "${text}" → ${results.length} results (threshold: ${threshold})`);
            this.emit('search:completed', { query: text, resultsCount: results.length });
            return results.slice(0, limit);
        }
        catch (error) {
            console.error(`❌ Vector search failed:`, error.message);
            throw error;
        }
    }
    /**
     * Get pattern by ID
     */
    async getPattern(id) {
        await this.initialize();
        try {
            const doc = await this.firestore
                .collection(this.patternsCollection)
                .doc(id)
                .get();
            return doc.exists ? doc.data() : null;
        }
        catch (error) {
            console.error(`❌ Failed to get pattern ${id}:`, error.message);
            return null;
        }
    }
    /**
     * Update pattern metadata (not embedding)
     */
    async updatePattern(id, updates) {
        await this.initialize();
        try {
            await this.firestore
                .collection(this.patternsCollection)
                .doc(id)
                .update({
                ...updates,
                updated: new Date()
            });
            console.log(`✅ Updated pattern ${id}`);
            this.emit('pattern:updated', { id, updates });
        }
        catch (error) {
            console.error(`❌ Failed to update pattern ${id}:`, error.message);
            throw error;
        }
    }
    /**
     * Delete pattern and its embedding
     */
    async deletePattern(id) {
        await this.initialize();
        try {
            // Delete pattern
            await this.firestore
                .collection(this.patternsCollection)
                .doc(id)
                .delete();
            // Delete embedding
            await this.firestore
                .collection(this.embeddingsCollection)
                .doc(id)
                .delete();
            console.log(`✅ Deleted pattern ${id}`);
            this.emit('pattern:deleted', { id });
        }
        catch (error) {
            console.error(`❌ Failed to delete pattern ${id}:`, error.message);
            throw error;
        }
    }
    /**
     * List all patterns with optional filters
     */
    async listPatterns(filters) {
        await this.initialize();
        try {
            let query = this.firestore.collection(this.patternsCollection);
            if (filters?.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters?.agent) {
                query = query.where('agent', '==', filters.agent);
            }
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }
            const snapshot = await query.get();
            const patterns = [];
            snapshot.forEach(doc => {
                patterns.push(doc.data());
            });
            return patterns;
        }
        catch (error) {
            console.error(`❌ Failed to list patterns:`, error.message);
            return [];
        }
    }
    /**
     * Get statistics about stored patterns
     */
    async getStatistics() {
        await this.initialize();
        try {
            const patternsSnapshot = await this.firestore
                .collection(this.patternsCollection)
                .get();
            const embeddingsSnapshot = await this.firestore
                .collection(this.embeddingsCollection)
                .get();
            const categories = {};
            const agents = {};
            patternsSnapshot.forEach(doc => {
                const pattern = doc.data();
                categories[pattern.category] = (categories[pattern.category] || 0) + 1;
                agents[pattern.agent] = (agents[pattern.agent] || 0) + 1;
            });
            return {
                totalPatterns: patternsSnapshot.size,
                totalEmbeddings: embeddingsSnapshot.size,
                categories,
                agents
            };
        }
        catch (error) {
            console.error(`❌ Failed to get statistics:`, error.message);
            return {
                totalPatterns: 0,
                totalEmbeddings: 0,
                categories: {},
                agents: {}
            };
        }
    }
    /**
     * Cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error(`Vector dimension mismatch: ${a.length} !== ${b.length}`);
        }
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);
        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }
        return dotProduct / (magnitudeA * magnitudeB);
    }
    /**
     * Close Firestore connection
     */
    async close() {
        await this.firestore.terminate();
        this.initialized = false;
        console.log('✅ GCP Firestore vector store closed');
    }
}
// Export singleton instance
export const gcpVectorStore = new GCPVectorStore();
//# sourceMappingURL=gcp-vector-store.js.map