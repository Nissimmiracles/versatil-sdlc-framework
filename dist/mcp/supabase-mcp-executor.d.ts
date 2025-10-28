/**
 * Enhanced Supabase MCP Executor
 * ✅ PRODUCTION IMPLEMENTATION - Supabase Database + Vector Operations
 *
 * Primary Agents: Marcus-Backend (database management), Dr.AI-ML (vector search)
 *
 * Features:
 * - Database CRUD operations with security
 * - Vector search and similarity matching
 * - Schema management and migrations
 * - Edge Functions invocation
 * - Real-time subscriptions
 * - Storage operations
 * - Authentication management
 *
 * Official Packages:
 * - @supabase/supabase-js (official Supabase client)
 * - supabase-mcp (MCP server implementation)
 */
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        operation?: string;
        timestamp?: string;
        rowCount?: number;
        executionTime?: number;
        [key: string]: any;
    };
}
export declare class SupabaseMCPExecutor {
    private supabase;
    private supabaseUrl;
    private supabaseKey;
    constructor();
    /**
     * Initialize Supabase client
     */
    private initializeSupabase;
    /**
     * Execute Supabase MCP action
     * Routes to appropriate Supabase operation based on action type
     */
    executeSupabaseMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Query database table with filters
     */
    private query;
    /**
     * Insert records into table
     */
    private insert;
    /**
     * Update records in table
     */
    private update;
    /**
     * Delete records from table
     */
    private deleteRecords;
    /**
     * Vector similarity search
     * Requires pgvector extension and vector column
     */
    private vectorSearch;
    /**
     * Call Postgres RPC function
     */
    private callRPC;
    /**
     * Invoke Supabase Edge Function
     */
    private invokeEdgeFunction;
    /**
     * Upload file to Supabase Storage
     */
    private storageUpload;
    /**
     * Download file from Supabase Storage
     */
    private storageDownload;
    /**
     * Get database schema information
     */
    private getSchema;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
export declare const supabaseMCPExecutor: SupabaseMCPExecutor;
