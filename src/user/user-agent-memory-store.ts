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
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ==================== INTERFACES ====================

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
  expiresAt?: number; // Optional expiration timestamp
}

export interface MemoryQuery {
  userId: string;
  agentId: string;
  tags?: string[];
  key?: string;
  limit?: number;
  includeExpired?: boolean;
}

// ==================== USER AGENT MEMORY STORE ====================

export class UserAgentMemoryStore extends EventEmitter {
  private versatilHome: string;
  private usersPath: string;

  constructor() {
    super();
    this.versatilHome = join(homedir(), '.versatil');
    this.usersPath = join(this.versatilHome, 'users');
  }

  /**
   * Ensure memory directory exists for user + agent
   */
  private async ensureMemoryDir(userId: string, agentId: string): Promise<string> {
    const memoryDir = join(this.usersPath, userId, 'memories', agentId);
    await fs.mkdir(memoryDir, { recursive: true });
    return memoryDir;
  }

  /**
   * Store memory for user + agent
   */
  async storeMemory(
    userId: string,
    agentId: string,
    memory: {
      key: string;
      value: any;
      tags?: string[];
      metadata?: Record<string, any>;
      ttl?: number; // Time to live in seconds
    }
  ): Promise<UserAgentMemory> {
    const memoryDir = await this.ensureMemoryDir(userId, agentId);
    const now = Date.now();

    const memoryId = `${agentId}_${memory.key}_${now}`;
    const memoryPath = join(memoryDir, `${memory.key}.json`);

    // Check if memory already exists (update instead of create)
    let existingMemory: UserAgentMemory | null = null;
    try {
      const data = await fs.readFile(memoryPath, 'utf-8');
      existingMemory = JSON.parse(data);
    } catch {
      // No existing memory
    }

    const userMemory: UserAgentMemory = {
      id: existingMemory?.id || memoryId,
      userId,
      agentId,
      key: memory.key,
      value: memory.value,
      tags: memory.tags || [],
      metadata: memory.metadata || {},
      createdAt: existingMemory?.createdAt || now,
      updatedAt: now,
      expiresAt: memory.ttl ? now + (memory.ttl * 1000) : undefined
    };

    await fs.writeFile(memoryPath, JSON.stringify(userMemory, null, 2));

    this.emit('memory_stored', { userId, agentId, key: memory.key });
    console.log(`✅ Memory stored for ${agentId}: ${memory.key} (user: ${userId})`);

    return userMemory;
  }

  /**
   * Get memory by key
   */
  async getMemory(userId: string, agentId: string, key: string): Promise<UserAgentMemory | null> {
    try {
      const memoryPath = join(this.usersPath, userId, 'memories', agentId, `${key}.json`);
      const data = await fs.readFile(memoryPath, 'utf-8');
      const memory: UserAgentMemory = JSON.parse(data);

      // Check expiration
      if (memory.expiresAt && memory.expiresAt < Date.now()) {
        await this.deleteMemory(userId, agentId, key);
        return null;
      }

      return memory;
    } catch {
      return null;
    }
  }

  /**
   * Query memories with filters
   */
  async queryMemories(query: MemoryQuery): Promise<UserAgentMemory[]> {
    const memories: UserAgentMemory[] = [];

    try {
      const memoryDir = join(this.usersPath, query.userId, 'memories', query.agentId);
      const files = await fs.readdir(memoryDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const memoryPath = join(memoryDir, file);
        const data = await fs.readFile(memoryPath, 'utf-8');
        const memory: UserAgentMemory = JSON.parse(data);

        // Filter by key
        if (query.key && memory.key !== query.key) {
          continue;
        }

        // Filter by tags
        if (query.tags && query.tags.length > 0) {
          const hasAllTags = query.tags.every(tag => memory.tags?.includes(tag));
          if (!hasAllTags) continue;
        }

        // Filter expired
        if (!query.includeExpired && memory.expiresAt && memory.expiresAt < Date.now()) {
          await this.deleteMemory(query.userId, query.agentId, memory.key);
          continue;
        }

        memories.push(memory);
      }
    } catch {
      // Directory doesn't exist or no memories
    }

    // Sort by most recent
    memories.sort((a, b) => b.updatedAt - a.updatedAt);

    // Apply limit
    if (query.limit) {
      return memories.slice(0, query.limit);
    }

    return memories;
  }

  /**
   * Delete memory
   */
  async deleteMemory(userId: string, agentId: string, key: string): Promise<void> {
    try {
      const memoryPath = join(this.usersPath, userId, 'memories', agentId, `${key}.json`);
      await fs.unlink(memoryPath);

      this.emit('memory_deleted', { userId, agentId, key });
      console.log(`✅ Memory deleted for ${agentId}: ${key} (user: ${userId})`);
    } catch {
      // Memory doesn't exist
    }
  }

  /**
   * Delete all memories for user + agent
   */
  async deleteAllMemories(userId: string, agentId: string): Promise<void> {
    try {
      const memoryDir = join(this.usersPath, userId, 'memories', agentId);
      await fs.rm(memoryDir, { recursive: true, force: true });

      this.emit('all_memories_deleted', { userId, agentId });
      console.log(`✅ All memories deleted for ${agentId} (user: ${userId})`);
    } catch {
      // Directory doesn't exist
    }
  }

  /**
   * Get memory count for user + agent
   */
  async getMemoryCount(userId: string, agentId: string): Promise<number> {
    try {
      const memoryDir = join(this.usersPath, userId, 'memories', agentId);
      const files = await fs.readdir(memoryDir);
      return files.filter(f => f.endsWith('.json')).length;
    } catch {
      return 0;
    }
  }

  /**
   * List all memory keys for user + agent
   */
  async listMemoryKeys(userId: string, agentId: string): Promise<string[]> {
    try {
      const memoryDir = join(this.usersPath, userId, 'memories', agentId);
      const files = await fs.readdir(memoryDir);
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }

  /**
   * Cleanup expired memories
   */
  async cleanupExpired(userId?: string, agentId?: string): Promise<number> {
    let deletedCount = 0;

    try {
      // If userId specified, cleanup for that user only
      if (userId) {
        const userMemoriesDir = join(this.usersPath, userId, 'memories');

        // If agentId specified, cleanup for that agent only
        if (agentId) {
          deletedCount += await this.cleanupExpiredForAgent(userId, agentId);
        } else {
          // Cleanup for all agents for this user
          const agents = await fs.readdir(userMemoriesDir, { withFileTypes: true });
          for (const agent of agents) {
            if (agent.isDirectory()) {
              deletedCount += await this.cleanupExpiredForAgent(userId, agent.name);
            }
          }
        }
      } else {
        // Cleanup for all users
        const users = await fs.readdir(this.usersPath, { withFileTypes: true });
        for (const user of users) {
          if (user.isDirectory()) {
            const userMemoriesDir = join(this.usersPath, user.name, 'memories');
            try {
              const agents = await fs.readdir(userMemoriesDir, { withFileTypes: true });
              for (const agent of agents) {
                if (agent.isDirectory()) {
                  deletedCount += await this.cleanupExpiredForAgent(user.name, agent.name);
                }
              }
            } catch {
              // No memories directory for this user
            }
          }
        }
      }
    } catch (error: any) {
      console.warn(`⚠️ Failed to cleanup expired memories: ${error.message}`);
    }

    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} expired memories`);
    }

    return deletedCount;
  }

  /**
   * Cleanup expired memories for specific user + agent
   */
  private async cleanupExpiredForAgent(userId: string, agentId: string): Promise<number> {
    let deletedCount = 0;
    const now = Date.now();

    try {
      const memoryDir = join(this.usersPath, userId, 'memories', agentId);
      const files = await fs.readdir(memoryDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const memoryPath = join(memoryDir, file);
        const data = await fs.readFile(memoryPath, 'utf-8');
        const memory: UserAgentMemory = JSON.parse(data);

        if (memory.expiresAt && memory.expiresAt < now) {
          await fs.unlink(memoryPath);
          deletedCount++;
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return deletedCount;
  }

  /**
   * Get memory statistics for user + agent
   */
  async getMemoryStats(userId: string, agentId: string): Promise<{
    total: number;
    expired: number;
    totalSize: number; // bytes
    oldestMemory: number | null; // timestamp
    newestMemory: number | null; // timestamp
  }> {
    const stats = {
      total: 0,
      expired: 0,
      totalSize: 0,
      oldestMemory: null as number | null,
      newestMemory: null as number | null
    };

    try {
      const memoryDir = join(this.usersPath, userId, 'memories', agentId);
      const files = await fs.readdir(memoryDir);
      const now = Date.now();

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const memoryPath = join(memoryDir, file);
        const fileStats = await fs.stat(memoryPath);
        const data = await fs.readFile(memoryPath, 'utf-8');
        const memory: UserAgentMemory = JSON.parse(data);

        stats.total++;
        stats.totalSize += fileStats.size;

        if (memory.expiresAt && memory.expiresAt < now) {
          stats.expired++;
        }

        if (!stats.oldestMemory || memory.createdAt < stats.oldestMemory) {
          stats.oldestMemory = memory.createdAt;
        }

        if (!stats.newestMemory || memory.updatedAt > stats.newestMemory) {
          stats.newestMemory = memory.updatedAt;
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return stats;
  }
}

// Export singleton instance
export const userAgentMemoryStore = new UserAgentMemoryStore();
