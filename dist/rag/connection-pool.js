/**
 * Connection Pool for Supabase/External Services
 * Optimizes performance by reusing connections
 */
import { createClient } from '@supabase/supabase-js';
class ConnectionWrapper {
    constructor(client) {
        this.inUse = false;
        this.lastUsed = Date.now();
        this.createdAt = Date.now();
        this.useCount = 0;
        this.client = client;
    }
    acquire() {
        this.inUse = true;
        this.lastUsed = Date.now();
        this.useCount++;
    }
    release() {
        this.inUse = false;
        this.lastUsed = Date.now();
    }
    isIdle(idleTimeout) {
        return !this.inUse && (Date.now() - this.lastUsed > idleTimeout);
    }
}
export class SupabaseConnectionPool {
    constructor(supabaseUrl, supabaseKey, config = {}) {
        this.pool = [];
        this.waitQueue = [];
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
    initializePool() {
        for (let i = 0; i < this.config.minConnections; i++) {
            this.createConnection();
        }
    }
    /**
     * Create new connection
     */
    createConnection() {
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
    async acquire() {
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
    waitForConnection() {
        return new Promise((resolve, reject) => {
            const waitItem = {
                resolve: (conn) => {
                    clearTimeout(timeout);
                    resolve(conn.client);
                },
                reject: (error) => {
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
    release(client) {
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
    async execute(operation) {
        const client = await this.acquire();
        try {
            const result = await operation(client);
            return result;
        }
        finally {
            this.release(client);
        }
    }
    /**
     * Get pool statistics
     */
    getStats() {
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
    cleanup() {
        const now = Date.now();
        const toRemove = [];
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
    startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, 60000); // Every minute
    }
    /**
     * Drain pool (close all connections)
     */
    async drain() {
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
    getConnectionRoundRobin() {
        const idleConnections = this.pool.filter(conn => !conn.inUse);
        if (idleConnections.length === 0) {
            // Create new if under limit
            if (this.pool.length < this.config.maxConnections) {
                const newConn = this.createConnection();
                newConn.acquire();
                return newConn.client;
            }
            // Use least recently used
            const leastRecentlyUsed = this.pool.reduce((min, conn) => conn.lastUsed < min.lastUsed ? conn : min);
            return leastRecentlyUsed.client;
        }
        // Return least used idle connection
        const leastUsed = idleConnections.reduce((min, conn) => conn.useCount < min.useCount ? conn : min);
        leastUsed.acquire();
        return leastUsed.client;
    }
}
//# sourceMappingURL=connection-pool.js.map