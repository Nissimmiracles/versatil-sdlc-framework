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
import { GraphRAGStore, GraphRAGQuery, GraphRAGResult } from '../lib/graphrag-store.js';
export type StorageBackend = 'firestore' | 'supabase' | 'local' | 'none';
export interface PrivateRAGConfig {
    backend: StorageBackend;
    firestore?: {
        projectId: string;
        databaseId?: string;
        credentials?: string;
    };
    supabase?: {
        url: string;
        anonKey: string;
        tableName?: string;
    };
    local?: {
        storageDir: string;
    };
}
/**
 * Private RAG Store - User's own storage
 */
export declare class PrivateRAGStore extends GraphRAGStore {
    private static instance;
    private backend;
    private config;
    private cloudRunClient;
    private firestoreClient?;
    private supabaseClient?;
    private localStorageDir?;
    constructor(config?: PrivateRAGConfig);
    /**
     * Singleton instance
     */
    static getInstance(config?: PrivateRAGConfig): PrivateRAGStore;
    /**
     * Auto-detect user's storage configuration
     */
    private detectConfiguration;
    /**
     * Initialize storage backend
     */
    private initializeBackend;
    /**
     * Initialize Firestore backend
     */
    private initializeFirestore;
    /**
     * Initialize Supabase backend
     */
    private initializeSupabase;
    /**
     * Initialize local JSON backend
     */
    private initializeLocal;
    /**
     * Override: Add pattern to user's private storage
     */
    addPattern(pattern: any): Promise<string>;
    /**
     * Add pattern to Firestore
     */
    private addPatternToFirestore;
    /**
     * Add pattern to Supabase
     */
    private addPatternToSupabase;
    /**
     * Add pattern to local JSON
     */
    private addPatternToLocal;
    /**
     * Override: Query private patterns
     *
     * v7.7.0: Try Cloud Run edge first (2-4x faster), fallback to local backend
     */
    query(query: GraphRAGQuery): Promise<GraphRAGResult[]>;
    /**
     * Query Firestore patterns
     */
    private queryFirestore;
    /**
     * Query Supabase patterns
     */
    private querySupabase;
    /**
     * Query local JSON patterns
     */
    private queryLocal;
    /**
     * Simple text matching for local patterns
     */
    private calculateSimpleMatch;
    /**
     * Get current user ID (from auth or system)
     */
    private getCurrentUserId;
    /**
     * Get current project ID (from git or directory)
     */
    private getCurrentProjectId;
    /**
     * Check if Private RAG is configured
     */
    isConfigured(): boolean;
    /**
     * Get backend type
     */
    getBackend(): StorageBackend;
    /**
     * Get statistics about private patterns
     */
    getStats(): Promise<{
        backend: StorageBackend;
        totalPatterns: number;
        storageUsed?: string;
        lastUpdated?: string;
    }>;
}
export declare function getPrivateRAGStore(config?: PrivateRAGConfig): PrivateRAGStore;
export declare const privateRAGStore: PrivateRAGStore;
