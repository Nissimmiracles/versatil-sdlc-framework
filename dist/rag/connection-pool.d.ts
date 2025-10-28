/**
 * Connection Pool for Supabase/External Services
 * Optimizes performance by reusing connections
 */
import { SupabaseClient } from '@supabase/supabase-js';
export interface PoolConfig {
    maxConnections: number;
    minConnections: number;
    acquireTimeout: number;
    idleTimeout: number;
}
export interface PoolStats {
    total: number;
    active: number;
    idle: number;
    waiting: number;
    created: number;
    destroyed: number;
}
export declare class SupabaseConnectionPool {
    private pool;
    private config;
    private supabaseUrl;
    private supabaseKey;
    private stats;
    private waitQueue;
    constructor(supabaseUrl: string, supabaseKey: string, config?: Partial<PoolConfig>);
    /**
     * Initialize pool with minimum connections
     */
    private initializePool;
    /**
     * Create new connection
     */
    private createConnection;
    /**
     * Acquire connection from pool
     */
    acquire(): Promise<SupabaseClient>;
    /**
     * Wait for available connection with timeout
     */
    private waitForConnection;
    /**
     * Release connection back to pool
     */
    release(client: SupabaseClient): void;
    /**
     * Execute query with automatic connection management
     */
    execute<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T>;
    /**
     * Get pool statistics
     */
    getStats(): PoolStats;
    /**
     * Cleanup idle connections
     */
    private cleanup;
    /**
     * Start cleanup interval
     */
    private startCleanupInterval;
    /**
     * Drain pool (close all connections)
     */
    drain(): Promise<void>;
    /**
     * Get connection by round-robin
     */
    getConnectionRoundRobin(): SupabaseClient;
}
