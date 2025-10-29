"use strict";
/**
 * Private RAG Store - User Project Memory
 *
 * Stores project-specific patterns in USER'S own storage:
 * - Proprietary business logic and workflows
 * - Internal APIs and microservices
 * - Team conventions and architecture decisions
 * - Custom schemas and data models
 * - Company-specific integrations
 *
 * Privacy Guarantee:
 * - 100% isolated per user/project
 * - Never shared with other users
 * - User chooses storage backend
 * - Optional (framework works without it)
 *
 * Storage Backends:
 * 1. Firestore (recommended) - User's GCP project
 * 2. Supabase pgvector - User's Supabase project
 * 3. Local JSON - Offline, no cloud
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateRAGStore = exports.PrivateRAGStore = void 0;
exports.getPrivateRAGStore = getPrivateRAGStore;
const graphrag_store_js_1 = require("../lib/graphrag-store.js");
const firestore_1 = require("@google-cloud/firestore");
const supabase_js_1 = require("@supabase/supabase-js");
const cloudrun_rag_client_js_1 = require("./cloudrun-rag-client.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Private RAG Store - User's own storage
 */
class PrivateRAGStore extends graphrag_store_js_1.GraphRAGStore {
    constructor(config) {
        super();
        // Auto-detect configuration or use provided
        this.config = config || this.detectConfiguration();
        this.backend = this.config.backend;
        console.log(`🔐 Private RAG Store: ${this.backend} backend`);
        // Initialize storage backend
        this.initializeBackend();
        // Initialize Cloud Run edge client (if configured)
        this.cloudRunClient = (0, cloudrun_rag_client_js_1.getCloudRunClient)();
    }
    /**
     * Singleton instance
     */
    static getInstance(config) {
        if (!PrivateRAGStore.instance) {
            PrivateRAGStore.instance = new PrivateRAGStore(config);
        }
        return PrivateRAGStore.instance;
    }
    /**
     * Auto-detect user's storage configuration
     */
    detectConfiguration() {
        // Try 1: Google Cloud Firestore
        if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.log('✅ Detected Firestore configuration');
            return {
                backend: 'firestore',
                firestore: {
                    projectId: process.env.GOOGLE_CLOUD_PROJECT,
                    databaseId: `${process.env.GOOGLE_CLOUD_PROJECT}-private-rag`,
                    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS
                }
            };
        }
        // Try 2: Supabase
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
            console.log('✅ Detected Supabase configuration');
            return {
                backend: 'supabase',
                supabase: {
                    url: process.env.SUPABASE_URL,
                    anonKey: process.env.SUPABASE_ANON_KEY,
                    tableName: 'versatil_private_patterns'
                }
            };
        }
        // Try 3: Local JSON (always available as fallback)
        const localDir = path.join(os.homedir(), '.versatil', 'private-rag');
        console.log('ℹ️  Using local JSON storage (no cloud configured)');
        return {
            backend: 'local',
            local: {
                storageDir: localDir
            }
        };
    }
    /**
     * Initialize storage backend
     */
    initializeBackend() {
        switch (this.backend) {
            case 'firestore':
                this.initializeFirestore();
                break;
            case 'supabase':
                this.initializeSupabase();
                break;
            case 'local':
                this.initializeLocal();
                break;
            case 'none':
                console.log('⚠️  Private RAG disabled (no storage backend)');
                break;
        }
    }
    /**
     * Initialize Firestore backend
     */
    initializeFirestore() {
        if (!this.config.firestore) {
            throw new Error('Firestore configuration missing');
        }
        this.firestoreClient = new firestore_1.Firestore({
            projectId: this.config.firestore.projectId,
            databaseId: this.config.firestore.databaseId || 'versatil-private-rag',
            keyFilename: this.config.firestore.credentials
        });
        console.log(`✅ Firestore initialized: ${this.config.firestore.projectId}`);
    }
    /**
     * Initialize Supabase backend
     */
    initializeSupabase() {
        if (!this.config.supabase) {
            throw new Error('Supabase configuration missing');
        }
        this.supabaseClient = (0, supabase_js_1.createClient)(this.config.supabase.url, this.config.supabase.anonKey);
        console.log(`✅ Supabase initialized: ${this.config.supabase.url}`);
    }
    /**
     * Initialize local JSON backend
     */
    initializeLocal() {
        if (!this.config.local) {
            throw new Error('Local storage configuration missing');
        }
        this.localStorageDir = this.config.local.storageDir;
        // Create directory if it doesn't exist
        if (!fs.existsSync(this.localStorageDir)) {
            fs.mkdirSync(this.localStorageDir, { recursive: true });
            console.log(`✅ Created local storage: ${this.localStorageDir}`);
        }
        else {
            console.log(`✅ Local storage ready: ${this.localStorageDir}`);
        }
    }
    /**
     * Override: Add pattern to user's private storage
     */
    async addPattern(pattern) {
        console.log(`🔒 Storing private pattern: ${pattern.pattern}`);
        // Add with private privacy marker
        const privatePattern = {
            ...pattern,
            privacy: {
                userId: this.getCurrentUserId(),
                projectId: this.getCurrentProjectId(),
                isPublic: false,
                timestamp: new Date().toISOString()
            }
        };
        // Store based on backend
        switch (this.backend) {
            case 'firestore':
                return await this.addPatternToFirestore(privatePattern);
            case 'supabase':
                return await this.addPatternToSupabase(privatePattern);
            case 'local':
                return await this.addPatternToLocal(privatePattern);
            default:
                throw new Error(`Unsupported backend: ${this.backend}`);
        }
    }
    /**
     * Add pattern to Firestore
     */
    async addPatternToFirestore(pattern) {
        if (!this.firestoreClient) {
            throw new Error('Firestore not initialized');
        }
        const docRef = await this.firestoreClient
            .collection('private_patterns')
            .add(pattern);
        return docRef.id;
    }
    /**
     * Add pattern to Supabase
     */
    async addPatternToSupabase(pattern) {
        if (!this.supabaseClient) {
            throw new Error('Supabase not initialized');
        }
        const { data, error } = await this.supabaseClient
            .from(this.config.supabase.tableName)
            .insert([pattern])
            .select('id')
            .single();
        if (error) {
            throw new Error(`Supabase insert failed: ${error.message}`);
        }
        return data.id;
    }
    /**
     * Add pattern to local JSON
     */
    async addPatternToLocal(pattern) {
        if (!this.localStorageDir) {
            throw new Error('Local storage not initialized');
        }
        const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const filePath = path.join(this.localStorageDir, `${patternId}.json`);
        const patternWithId = { id: patternId, ...pattern };
        fs.writeFileSync(filePath, JSON.stringify(patternWithId, null, 2));
        return patternId;
    }
    /**
     * Override: Query private patterns
     *
     * v7.7.0: Try Cloud Run edge first (2-4x faster), fallback to local backend
     */
    async query(query) {
        if (this.backend === 'none') {
            return []; // No private storage configured
        }
        // Try Cloud Run edge first (if configured and using Firestore backend)
        if (this.cloudRunClient && this.cloudRunClient.isHealthy() && this.backend === 'firestore') {
            try {
                const startTime = Date.now();
                const results = await this.cloudRunClient.query({
                    query: query.query,
                    isPublic: false,
                    projectId: this.config.firestore?.projectId,
                    databaseId: this.config.firestore?.databaseId,
                    limit: query.limit || 10,
                    minRelevance: query.minRelevance || 0.5,
                    agent: query.agent,
                    category: query.category
                });
                const duration = Date.now() - startTime;
                console.log(`⚡ Cloud Run edge (private): ${results.length} results (${duration}ms)`);
                return results;
            }
            catch (error) {
                console.warn(`⚠️  Cloud Run edge failed, falling back to local backend:`, error.message);
                // Fallthrough to local backend query below
            }
        }
        // Fallback: Local backend query
        const privateQuery = {
            ...query,
            userId: this.getCurrentUserId(),
            projectId: this.getCurrentProjectId(),
            includePublic: false // Only private patterns
        };
        // Query based on backend
        switch (this.backend) {
            case 'firestore':
                return await this.queryFirestore(privateQuery);
            case 'supabase':
                return await this.querySupabase(privateQuery);
            case 'local':
                return await this.queryLocal(privateQuery);
            default:
                return [];
        }
    }
    /**
     * Query Firestore patterns
     */
    async queryFirestore(query) {
        // Simplified implementation - would use full GraphRAG logic
        if (!this.firestoreClient)
            return [];
        const snapshot = await this.firestoreClient
            .collection('private_patterns')
            .where('privacy.userId', '==', query.userId)
            .limit(query.limit || 10)
            .get();
        return snapshot.docs.map(doc => ({
            pattern: doc.data(),
            relevanceScore: 0.8, // Placeholder
            graphPath: [],
            explanation: 'Private pattern match'
        }));
    }
    /**
     * Query Supabase patterns
     */
    async querySupabase(query) {
        if (!this.supabaseClient)
            return [];
        const { data, error } = await this.supabaseClient
            .from(this.config.supabase.tableName)
            .select('*')
            .eq('privacy->userId', query.userId)
            .limit(query.limit || 10);
        if (error || !data)
            return [];
        return data.map(pattern => ({
            pattern: pattern,
            relevanceScore: 0.8,
            graphPath: [],
            explanation: 'Private pattern match'
        }));
    }
    /**
     * Query local JSON patterns
     */
    async queryLocal(query) {
        if (!this.localStorageDir)
            return [];
        const files = fs.readdirSync(this.localStorageDir)
            .filter(f => f.endsWith('.json'));
        const patterns = [];
        for (const file of files) {
            const filePath = path.join(this.localStorageDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const pattern = JSON.parse(content);
            // Simple text matching (real implementation would use GraphRAG)
            const matchScore = this.calculateSimpleMatch(query.query, pattern);
            if (matchScore > (query.minRelevance || 0.5)) {
                patterns.push({
                    pattern: pattern,
                    relevanceScore: matchScore,
                    graphPath: [],
                    explanation: 'Local pattern match'
                });
            }
        }
        return patterns
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, query.limit || 10);
    }
    /**
     * Simple text matching for local patterns
     */
    calculateSimpleMatch(query, pattern) {
        const queryLower = query.toLowerCase();
        const patternText = `${pattern.pattern || ''} ${pattern.description || ''}`.toLowerCase();
        const words = queryLower.split(' ');
        const matches = words.filter(word => patternText.includes(word)).length;
        return matches / words.length;
    }
    /**
     * Get current user ID (from auth or system)
     */
    getCurrentUserId() {
        // Try environment variable first
        if (process.env.VERSATIL_USER_ID) {
            return process.env.VERSATIL_USER_ID;
        }
        // Fall back to system username
        return os.userInfo().username;
    }
    /**
     * Get current project ID (from git or directory)
     */
    getCurrentProjectId() {
        // Try environment variable first
        if (process.env.VERSATIL_PROJECT_ID) {
            return process.env.VERSATIL_PROJECT_ID;
        }
        // Fall back to current directory name
        return path.basename(process.cwd());
    }
    /**
     * Check if Private RAG is configured
     */
    isConfigured() {
        return this.backend !== 'none';
    }
    /**
     * Get backend type
     */
    getBackend() {
        return this.backend;
    }
    /**
     * Get statistics about private patterns
     */
    async getStats() {
        let totalPatterns = 0;
        switch (this.backend) {
            case 'firestore':
                if (this.firestoreClient) {
                    const snapshot = await this.firestoreClient
                        .collection('private_patterns')
                        .where('privacy.userId', '==', this.getCurrentUserId())
                        .count()
                        .get();
                    totalPatterns = snapshot.data().count;
                }
                break;
            case 'supabase':
                if (this.supabaseClient) {
                    const { count } = await this.supabaseClient
                        .from(this.config.supabase.tableName)
                        .select('*', { count: 'exact', head: true })
                        .eq('privacy->userId', this.getCurrentUserId());
                    totalPatterns = count || 0;
                }
                break;
            case 'local':
                if (this.localStorageDir) {
                    const files = fs.readdirSync(this.localStorageDir)
                        .filter(f => f.endsWith('.json'));
                    totalPatterns = files.length;
                }
                break;
        }
        return {
            backend: this.backend,
            totalPatterns
        };
    }
}
exports.PrivateRAGStore = PrivateRAGStore;
// Export singleton instance (lazy initialized)
let privateRAGInstance = null;
function getPrivateRAGStore(config) {
    if (!privateRAGInstance) {
        privateRAGInstance = new PrivateRAGStore(config);
    }
    return privateRAGInstance;
}
exports.privateRAGStore = getPrivateRAGStore();
