/**
 * VERSATIL SDLC Framework - Per-User Agent Memory Store
 *
 * Privacy-isolated memories per user for each agent
 * Part of Layer 3 (User/Team Context) - Task 9
 *
 * Storage: ~/.versatil/users/[user-id]/memories/[agent-id]/
 *
 * Features:
 * - Privacy isolation (user memories never shared across users)
 * - Agent-specific memory storage
 * - Query and retrieval with filtering
 * - Memory expiration support
 */
import { EventEmitter } from 'events';
export interface UserAgentMemory {
    id: string;
    userId: string;
    agentId: string;
    key: string;
    value: any;
    tags?: string[];
    metadata?: Record<string, any>;
    createdAt: number;
    updatedAt: number;
    expiresAt?: number;
}
export interface MemoryQuery {
    userId: string;
    agentId: string;
    tags?: string[];
    key?: string;
    limit?: number;
    includeExpired?: boolean;
}
export declare class UserAgentMemoryStore extends EventEmitter {
    private versatilHome;
    private usersPath;
    constructor();
    /**
     * Ensure memory directory exists for user + agent
     */
    private ensureMemoryDir;
    /**
     * Store memory for user + agent
     */
    storeMemory(userId: string, agentId: string, memory: {
        key: string;
        value: any;
        tags?: string[];
        metadata?: Record<string, any>;
        ttl?: number;
    }): Promise<UserAgentMemory>;
    /**
     * Get memory by key
     */
    getMemory(userId: string, agentId: string, key: string): Promise<UserAgentMemory | null>;
    /**
     * Query memories with filters
     */
    queryMemories(query: MemoryQuery): Promise<UserAgentMemory[]>;
    /**
     * Delete memory
     */
    deleteMemory(userId: string, agentId: string, key: string): Promise<void>;
    /**
     * Delete all memories for user + agent
     */
    deleteAllMemories(userId: string, agentId: string): Promise<void>;
    /**
     * Get memory count for user + agent
     */
    getMemoryCount(userId: string, agentId: string): Promise<number>;
    /**
     * List all memory keys for user + agent
     */
    listMemoryKeys(userId: string, agentId: string): Promise<string[]>;
    /**
     * Cleanup expired memories
     */
    cleanupExpired(userId?: string, agentId?: string): Promise<number>;
    /**
     * Cleanup expired memories for specific user + agent
     */
    private cleanupExpiredForAgent;
    /**
     * Get memory statistics for user + agent
     */
    getMemoryStats(userId: string, agentId: string): Promise<{
        total: number;
        expired: number;
        totalSize: number;
        oldestMemory: number | null;
        newestMemory: number | null;
    }>;
}
export declare const userAgentMemoryStore: UserAgentMemoryStore;
