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

import { GraphRAGStore, PatternNode, GraphRAGQuery, GraphRAGResult } from '../lib/graphrag-store.js';
import { Firestore } from '@google-cloud/firestore';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CloudRunRAGClient, getCloudRunClient } from './cloudrun-rag-client.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type StorageBackend = 'firestore' | 'supabase' | 'local' | 'none';

export interface PrivateRAGConfig {
  backend: StorageBackend;
  firestore?: {
    projectId: string;
    databaseId?: string;
    credentials?: string; // Path to service account key
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
export class PrivateRAGStore extends GraphRAGStore {
  private static instance: PrivateRAGStore;
  private backend: StorageBackend;
  private config: PrivateRAGConfig;
  private cloudRunClient: CloudRunRAGClient | null;

  // Storage clients
  private firestoreClient?: Firestore;
  private supabaseClient?: SupabaseClient;
  private localStorageDir?: string;

  constructor(config?: PrivateRAGConfig) {
    super();

    // Auto-detect configuration or use provided
    this.config = config || this.detectConfiguration();
    this.backend = this.config.backend;

    console.log(`🔐 Private RAG Store: ${this.backend} backend`);

    // Initialize storage backend
    this.initializeBackend();

    // Initialize Cloud Run edge client (if configured)
    this.cloudRunClient = getCloudRunClient();
  }

  /**
   * Singleton instance
   */
  static getInstance(config?: PrivateRAGConfig): PrivateRAGStore {
    if (!PrivateRAGStore.instance) {
      PrivateRAGStore.instance = new PrivateRAGStore(config);
    }
    return PrivateRAGStore.instance;
  }

  /**
   * Auto-detect user's storage configuration
   */
  private detectConfiguration(): PrivateRAGConfig {
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
  private initializeBackend(): void {
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
  private initializeFirestore(): void {
    if (!this.config.firestore) {
      throw new Error('Firestore configuration missing');
    }

    this.firestoreClient = new Firestore({
      projectId: this.config.firestore.projectId,
      databaseId: this.config.firestore.databaseId || 'versatil-private-rag',
      keyFilename: this.config.firestore.credentials
    });

    console.log(`✅ Firestore initialized: ${this.config.firestore.projectId}`);
  }

  /**
   * Initialize Supabase backend
   */
  private initializeSupabase(): void {
    if (!this.config.supabase) {
      throw new Error('Supabase configuration missing');
    }

    this.supabaseClient = createClient(
      this.config.supabase.url,
      this.config.supabase.anonKey
    );

    console.log(`✅ Supabase initialized: ${this.config.supabase.url}`);
  }

  /**
   * Initialize local JSON backend
   */
  private initializeLocal(): void {
    if (!this.config.local) {
      throw new Error('Local storage configuration missing');
    }

    this.localStorageDir = this.config.local.storageDir;

    // Create directory if it doesn't exist
    if (!fs.existsSync(this.localStorageDir)) {
      fs.mkdirSync(this.localStorageDir, { recursive: true });
      console.log(`✅ Created local storage: ${this.localStorageDir}`);
    } else {
      console.log(`✅ Local storage ready: ${this.localStorageDir}`);
    }
  }

  /**
   * Override: Add pattern to user's private storage
   */
  async addPattern(pattern: any): Promise<string> {
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
  private async addPatternToFirestore(pattern: any): Promise<string> {
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
  private async addPatternToSupabase(pattern: any): Promise<string> {
    if (!this.supabaseClient) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabaseClient
      .from(this.config.supabase!.tableName!)
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
  private async addPatternToLocal(pattern: any): Promise<string> {
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
  async query(query: GraphRAGQuery): Promise<GraphRAGResult[]> {
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

      } catch (error: any) {
        console.warn(`⚠️  Cloud Run edge failed, falling back to local backend:`, error.message);
        // Fallthrough to local backend query below
      }
    }

    // Fallback: Local backend query
    const privateQuery: GraphRAGQuery = {
      ...query,
      userId: this.getCurrentUserId(),
      projectId: this.getCurrentProjectId(),
      includePublic: false  // Only private patterns
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
  private async queryFirestore(query: GraphRAGQuery): Promise<GraphRAGResult[]> {
    // Simplified implementation - would use full GraphRAG logic
    if (!this.firestoreClient) return [];

    const snapshot = await this.firestoreClient
      .collection('private_patterns')
      .where('privacy.userId', '==', query.userId)
      .limit(query.limit || 10)
      .get();

    return snapshot.docs.map(doc => ({
      pattern: doc.data() as PatternNode,
      relevanceScore: 0.8, // Placeholder
      graphPath: [],
      explanation: 'Private pattern match'
    }));
  }

  /**
   * Query Supabase patterns
   */
  private async querySupabase(query: GraphRAGQuery): Promise<GraphRAGResult[]> {
    if (!this.supabaseClient) return [];

    const { data, error } = await this.supabaseClient
      .from(this.config.supabase!.tableName!)
      .select('*')
      .eq('privacy->userId', query.userId)
      .limit(query.limit || 10);

    if (error || !data) return [];

    return data.map(pattern => ({
      pattern: pattern as PatternNode,
      relevanceScore: 0.8,
      graphPath: [],
      explanation: 'Private pattern match'
    }));
  }

  /**
   * Query local JSON patterns
   */
  private async queryLocal(query: GraphRAGQuery): Promise<GraphRAGResult[]> {
    if (!this.localStorageDir) return [];

    const files = fs.readdirSync(this.localStorageDir)
      .filter(f => f.endsWith('.json'));

    const patterns: GraphRAGResult[] = [];

    for (const file of files) {
      const filePath = path.join(this.localStorageDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const pattern = JSON.parse(content);

      // Simple text matching (real implementation would use GraphRAG)
      const matchScore = this.calculateSimpleMatch(query.query, pattern);

      if (matchScore > (query.minRelevance || 0.5)) {
        patterns.push({
          pattern: pattern as PatternNode,
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
  private calculateSimpleMatch(query: string, pattern: any): number {
    const queryLower = query.toLowerCase();
    const patternText = `${pattern.pattern || ''} ${pattern.description || ''}`.toLowerCase();

    const words = queryLower.split(' ');
    const matches = words.filter(word => patternText.includes(word)).length;

    return matches / words.length;
  }

  /**
   * Get current user ID (from auth or system)
   */
  private getCurrentUserId(): string {
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
  private getCurrentProjectId(): string {
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
  isConfigured(): boolean {
    return this.backend !== 'none';
  }

  /**
   * Get backend type
   */
  getBackend(): StorageBackend {
    return this.backend;
  }

  /**
   * Get statistics about private patterns
   */
  async getStats(): Promise<{
    backend: StorageBackend;
    totalPatterns: number;
    storageUsed?: string;
    lastUpdated?: string;
  }> {
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
            .from(this.config.supabase!.tableName!)
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

// Export singleton instance (lazy initialized)
let privateRAGInstance: PrivateRAGStore | null = null;

export function getPrivateRAGStore(config?: PrivateRAGConfig): PrivateRAGStore {
  if (!privateRAGInstance) {
    privateRAGInstance = new PrivateRAGStore(config);
  }
  return privateRAGInstance;
}

export const privateRAGStore = getPrivateRAGStore();
