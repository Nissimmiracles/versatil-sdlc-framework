/**
 * Connection Pool for Supabase/External Services
 * Optimizes performance by reusing connections
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

class ConnectionWrapper {
  public client: SupabaseClient;
  public inUse: boolean = false;
  public lastUsed: number = Date.now();
  public createdAt: number = Date.now();
  public useCount: number = 0;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  acquire(): void {
    this.inUse = true;
    this.lastUsed = Date.now();
    this.useCount++;
  }

  release(): void {
    this.inUse = false;
    this.lastUsed = Date.now();
  }

  isIdle(idleTimeout: number): boolean {
    return !this.inUse && (Date.now() - this.lastUsed > idleTimeout);
  }
}

export class SupabaseConnectionPool {
  private pool: ConnectionWrapper[] = [];
  private config: PoolConfig;
  private supabaseUrl: string;
  private supabaseKey: string;
  private stats: {
    created: number;
    destroyed: number;
  };
  private waitQueue: Array<{
    resolve: (conn: ConnectionWrapper) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<PoolConfig> = {}
  ) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.config = {
      maxConnections: config.maxConnections || 10,
      minConnections: config.minConnections || 2,
      acquireTimeout: config.acquireTimeout || 10000, // 10 seconds
      idleTimeout: config.idleTimeout || 300000 // 5 minutes
    };
    this.stats = {
      created: 0,
      destroyed: 0
    };

    // Initialize minimum connections
    this.initializePool();

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Initialize pool with minimum connections
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.minConnections; i++) {
      this.createConnection();
    }
  }

  /**
   * Create new connection
   */
  private createConnection(): ConnectionWrapper {
    const client = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    const wrapper = new ConnectionWrapper(client);
    this.pool.push(wrapper);
    this.stats.created++;

    return wrapper;
  }

  /**
   * Acquire connection from pool
   */
  async acquire(): Promise<SupabaseClient> {
    // Try to find idle connection
    const idleConnection = this.pool.find(conn => !conn.inUse);

    if (idleConnection) {
      idleConnection.acquire();
      return idleConnection.client;
    }

    // Create new connection if under max limit
    if (this.pool.length < this.config.maxConnections) {
      const newConnection = this.createConnection();
      newConnection.acquire();
      return newConnection.client;
    }

    // Wait for available connection
    return this.waitForConnection();
  }

  /**
   * Wait for available connection with timeout
   */
  private waitForConnection(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const waitItem = {
        resolve: (conn: ConnectionWrapper) => {
          clearTimeout(timeout);
          resolve(conn.client);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      };

      const timeout = setTimeout(() => {
        const index = this.waitQueue.indexOf(waitItem);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, this.config.acquireTimeout);

      this.waitQueue.push(waitItem);
    });
  }

  /**
   * Release connection back to pool
   */
  release(client: SupabaseClient): void {
    const wrapper = this.pool.find(conn => conn.client === client);

    if (!wrapper) {
      console.warn('[ConnectionPool] Attempted to release unknown connection');
      return;
    }

    wrapper.release();

    // Process wait queue
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      if (waiter) {
        wrapper.acquire();
        waiter.resolve(wrapper);
      }
    }
  }

  /**
   * Execute query with automatic connection management
   */
  async execute<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = await this.acquire();

    try {
      const result = await operation(client);
      return result;
    } finally {
      this.release(client);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    const active = this.pool.filter(conn => conn.inUse).length;
    const idle = this.pool.filter(conn => !conn.inUse).length;

    return {
      total: this.pool.length,
      active,
      idle,
      waiting: this.waitQueue.length,
      created: this.stats.created,
      destroyed: this.stats.destroyed
    };
  }

  /**
   * Cleanup idle connections
   */
  private cleanup(): void {
    const now = Date.now();
    const toRemove: ConnectionWrapper[] = [];

    // Find idle connections exceeding idle timeout
    for (const conn of this.pool) {
      if (conn.isIdle(this.config.idleTimeout) && this.pool.length > this.config.minConnections) {
        toRemove.push(conn);
      }
    }

    // Remove idle connections
    for (const conn of toRemove) {
      const index = this.pool.indexOf(conn);
      if (index !== -1) {
        this.pool.splice(index, 1);
        this.stats.destroyed++;
      }
    }

    if (toRemove.length > 0) {
      console.log(`[ConnectionPool] Cleaned up ${toRemove.length} idle connections`);
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  /**
   * Drain pool (close all connections)
   */
  async drain(): Promise<void> {
    // Reject all waiting requests
    for (const waiter of this.waitQueue) {
      waiter.reject(new Error('Pool is draining'));
    }
    this.waitQueue = [];

    // Wait for active connections to finish
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.pool.some(conn => conn.inUse) && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clear pool
    this.pool = [];
  }

  /**
   * Get connection by round-robin
   */
  getConnectionRoundRobin(): SupabaseClient {
    const idleConnections = this.pool.filter(conn => !conn.inUse);

    if (idleConnections.length === 0) {
      // Create new if under limit
      if (this.pool.length < this.config.maxConnections) {
        const newConn = this.createConnection();
        newConn.acquire();
        return newConn.client;
      }

      // Use least recently used
      const leastRecentlyUsed = this.pool.reduce((min, conn) =>
        conn.lastUsed < min.lastUsed ? conn : min
      );
      return leastRecentlyUsed.client;
    }

    // Return least used idle connection
    const leastUsed = idleConnections.reduce((min, conn) =>
      conn.useCount < min.useCount ? conn : min
    );

    leastUsed.acquire();
    return leastUsed.client;
  }
}