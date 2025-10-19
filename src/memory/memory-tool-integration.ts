/**
 * VERSATIL Memory Tool Integration
 *
 * Main Memory Tool wrapper for Claude SDK
 * - Agent-specific memory directories: ~/.versatil/memories/[agent-id]/
 * - Context editing with 100k token auto-clear
 * - Integration with all 8 OPERA agents
 * - Pattern storage and retrieval across sessions
 *
 * References:
 * - https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 * - https://docs.claude.com/en/docs/build-with-claude/context-editing
 * - ~/.versatil/docs/claude-cookbooks/tool_use/memory_tool.py
 */

import { memoryToolHandler, MemoryToolOperation, MemoryToolResult } from './memory-tool-handler.js';
import { agentMemoryManager } from './agent-memory-manager.js';
import { contextEditingManager } from './context-editing-integration.js';
import { MEMORY_TOOL_CONFIG, AgentId, getAllAgentIds } from './memory-tool-config.js';
import type { MemoryToolOperations } from './memory-tool-operations.js';

/**
 * Memory Tool Integration
 *
 * Central hub for all Memory Tool operations
 * Coordinates between:
 * - Memory operations (view, create, str_replace, etc.)
 * - Agent memory management
 * - Context editing (100k token auto-clear)
 * - Statistics tracking
 */
export class MemoryToolIntegration {
  private initialized = false;

  /**
   * Initialize Memory Tool system
   *
   * - Creates ~/.versatil/memories/ directory
   * - Creates agent subdirectories (maria-qa/, marcus-backend/, etc.)
   * - Creates template files for each agent
   * - Initializes context editing manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🧠 Initializing Memory Tool Integration...');

      // Initialize base memory directory structure
      await memoryToolHandler.initialize();

      // Initialize agent memory manager (templates, defaults)
      await agentMemoryManager.initialize();

      // Initialize context editing manager (100k token monitoring)
      await contextEditingManager.initialize();

      this.initialized = true;
      console.log('✅ Memory Tool Integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Memory Tool Integration:', error);
      throw error;
    }
  }

  /**
   * Execute memory operation for an agent
   *
   * @param agentId - Agent performing the operation (maria-qa, marcus-backend, etc.)
   * @param operation - Memory operation to execute
   * @returns Operation result
   *
   * @example
   * // Maria-QA viewing test patterns
   * await execute('maria-qa', {
   *   type: 'view',
   *   path: 'maria-qa/test-patterns.md'
   * });
   *
   * @example
   * // Marcus-Backend storing security pattern
   * await execute('marcus-backend', {
   *   type: 'create',
   *   path: 'marcus-backend/api-security-patterns.md',
   *   content: '# OAuth2 Implementation Pattern\n...'
   * });
   */
  async execute(agentId: AgentId, operation: MemoryToolOperation): Promise<MemoryToolResult> {
    await this.ensureInitialized();

    // Track context before operation (for 100k token auto-clear)
    await contextEditingManager.trackOperation(agentId, operation);

    // Execute the memory operation
    const result = await memoryToolHandler.execute(operation, agentId);

    // Update agent's last access time
    if (result.success) {
      await agentMemoryManager.updateLastAccess(agentId);
    }

    return result;
  }

  /**
   * Load agent-specific patterns from memory
   *
   * @param agentId - Agent ID
   * @returns Stored patterns as markdown
   *
   * @example
   * // Maria-QA loading test patterns
   * const patterns = await loadAgentPatterns('maria-qa');
   * // Returns all *.md files in ~/.versatil/memories/maria-qa/
   */
  async loadAgentPatterns(agentId: AgentId): Promise<string[]> {
    await this.ensureInitialized();

    return await agentMemoryManager.loadPatterns(agentId);
  }

  /**
   * Store successful pattern to agent memory
   *
   * @param agentId - Agent ID
   * @param patternName - Pattern filename (e.g., 'react-testing-pattern.md')
   * @param content - Pattern content (markdown)
   *
   * @example
   * // Maria-QA storing successful test pattern
   * await storePattern('maria-qa', 'oauth-test-pattern.md', `
   * # OAuth2 Testing Pattern
   *
   * ## Setup
   * \`\`\`typescript
   * const mockOAuth = jest.fn();
   * \`\`\`
   *
   * ## Test Cases
   * - Valid token → 200 OK
   * - Expired token → 401 Unauthorized
   * `);
   */
  async storePattern(agentId: AgentId, patternName: string, content: string): Promise<void> {
    await this.ensureInitialized();

    await agentMemoryManager.storePattern(agentId, patternName, content);
  }

  /**
   * Get memory statistics
   *
   * @returns Memory usage stats
   */
  async getStats() {
    await this.ensureInitialized();

    return await memoryToolHandler.getStats();
  }

  /**
   * Cleanup old cached documentation
   *
   * Removes cache files older than TTL (default: 30 days)
   */
  async cleanupCache(): Promise<void> {
    await this.ensureInitialized();

    await memoryToolHandler.cleanupCache();
  }

  /**
   * Get context editing statistics
   *
   * @returns Context clear events, tokens saved, etc.
   */
  async getContextStats() {
    await this.ensureInitialized();

    return await contextEditingManager.getStats();
  }

  /**
   * Manually trigger context clear (for testing or emergency)
   *
   * @param agentId - Agent to clear context for
   * @param reason - Reason for manual clear
   */
  async clearContext(agentId: AgentId, reason: 'auto' | 'manual' = 'manual'): Promise<void> {
    await this.ensureInitialized();

    await contextEditingManager.clearContext(agentId, reason);
  }

  /**
   * Ensure Memory Tool is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get agent memory directory path
   *
   * @param agentId - Agent ID
   * @returns Absolute path to agent's memory directory
   *
   * @example
   * getAgentMemoryPath('maria-qa')
   * // Returns: '/Users/you/.versatil/memories/maria-qa'
   */
  getAgentMemoryPath(agentId: AgentId): string {
    const agentPaths = MEMORY_TOOL_CONFIG.agentMemoryPaths;
    return agentPaths[agentId];
  }

  /**
   * List all available agents
   *
   * @returns Array of agent IDs
   */
  getAllAgents(): AgentId[] {
    return getAllAgentIds();
  }

  /**
   * Check if agent exists
   *
   * @param agentId - Agent ID to check
   * @returns True if agent exists
   */
  isValidAgent(agentId: string): agentId is AgentId {
    return getAllAgentIds().includes(agentId as AgentId);
  }

  /**
   * Get Memory Tool configuration
   */
  getConfig() {
    return MEMORY_TOOL_CONFIG;
  }
}

/**
 * Global Memory Tool Integration instance
 *
 * Usage:
 * ```typescript
 * import { memoryToolIntegration } from './memory-tool-integration.js';
 *
 * // Initialize once at startup
 * await memoryToolIntegration.initialize();
 *
 * // Use throughout application
 * await memoryToolIntegration.execute('maria-qa', {
 *   type: 'view',
 *   path: 'maria-qa/test-patterns.md'
 * });
 * ```
 */
export const memoryToolIntegration = new MemoryToolIntegration();

/**
 * Quick access functions for common operations
 */

/**
 * View a memory file or directory
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 * @returns File/directory contents
 */
export async function viewMemory(agentId: AgentId, path: string): Promise<string | undefined> {
  const result = await memoryToolIntegration.execute(agentId, {
    type: 'view',
    path: `${agentId}/${path}`
  });

  return result.success ? result.content : undefined;
}

/**
 * Create or update a memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 * @param content - File content
 */
export async function createMemory(agentId: AgentId, path: string, content: string): Promise<boolean> {
  const result = await memoryToolIntegration.execute(agentId, {
    type: 'create',
    path: `${agentId}/${path}`,
    content
  });

  return result.success;
}

/**
 * Replace text in a memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 * @param oldStr - String to replace
 * @param newStr - Replacement string
 */
export async function replaceMemory(
  agentId: AgentId,
  path: string,
  oldStr: string,
  newStr: string
): Promise<boolean> {
  const result = await memoryToolIntegration.execute(agentId, {
    type: 'str_replace',
    path: `${agentId}/${path}`,
    oldStr,
    newStr
  });

  return result.success;
}

/**
 * Delete a memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 */
export async function deleteMemory(agentId: AgentId, path: string): Promise<boolean> {
  const result = await memoryToolIntegration.execute(agentId, {
    type: 'delete',
    path: `${agentId}/${path}`
  });

  return result.success;
}

/**
 * Rename a memory file
 *
 * @param agentId - Agent ID
 * @param oldPath - Current path relative to agent's memory directory
 * @param newPath - New path relative to agent's memory directory
 */
export async function renameMemory(agentId: AgentId, oldPath: string, newPath: string): Promise<boolean> {
  const result = await memoryToolIntegration.execute(agentId, {
    type: 'rename',
    path: `${agentId}/${oldPath}`,
    newPath: `${agentId}/${newPath}`
  });

  return result.success;
}

/**
 * Insert text at specific line in memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 * @param line - Line number to insert at (0-based)
 * @param content - Content to insert
 */
export async function insertMemory(
  agentId: AgentId,
  path: string,
  line: number,
  content: string
): Promise<boolean> {
  const result = await memoryToolIntegration.execute(agentId, {
    type: 'insert',
    path: `${agentId}/${path}`,
    insertLine: line,
    content
  });

  return result.success;
}

export default memoryToolIntegration;
