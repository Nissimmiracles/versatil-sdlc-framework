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
import { MemoryToolOperation, MemoryToolResult } from './memory-tool-handler.js';
import { AgentId } from './memory-tool-config.js';
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
export declare class MemoryToolIntegration {
    private initialized;
    /**
     * Initialize Memory Tool system
     *
     * - Creates ~/.versatil/memories/ directory
     * - Creates agent subdirectories (maria-qa/, marcus-backend/, etc.)
     * - Creates template files for each agent
     * - Initializes context editing manager
     */
    initialize(): Promise<void>;
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
    execute(agentId: AgentId, operation: MemoryToolOperation): Promise<MemoryToolResult>;
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
    loadAgentPatterns(agentId: AgentId): Promise<string[]>;
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
    storePattern(agentId: AgentId, patternName: string, content: string): Promise<void>;
    /**
     * Get memory statistics
     *
     * @returns Memory usage stats
     */
    getStats(): Promise<import("./memory-tool-handler.js").MemoryStats>;
    /**
     * Cleanup old cached documentation
     *
     * Removes cache files older than TTL (default: 30 days)
     */
    cleanupCache(): Promise<void>;
    /**
     * Get context editing statistics
     *
     * @returns Context clear events, tokens saved, etc.
     */
    getContextStats(): Promise<import("./context-editing-integration.js").ContextStats>;
    /**
     * Manually trigger context clear (for testing or emergency)
     *
     * @param agentId - Agent to clear context for
     * @param reason - Reason for manual clear
     */
    clearContext(agentId: AgentId, reason?: 'auto' | 'manual'): Promise<void>;
    /**
     * Ensure Memory Tool is initialized
     */
    private ensureInitialized;
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
    getAgentMemoryPath(agentId: AgentId): string;
    /**
     * List all available agents
     *
     * @returns Array of agent IDs
     */
    getAllAgents(): AgentId[];
    /**
     * Check if agent exists
     *
     * @param agentId - Agent ID to check
     * @returns True if agent exists
     */
    isValidAgent(agentId: string): agentId is AgentId;
    /**
     * Get Memory Tool configuration
     */
    getConfig(): import("./memory-tool-config.js").MemoryToolConfig;
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
export declare const memoryToolIntegration: MemoryToolIntegration;
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
export declare function viewMemory(agentId: AgentId, path: string): Promise<string | undefined>;
/**
 * Create or update a memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 * @param content - File content
 */
export declare function createMemory(agentId: AgentId, path: string, content: string): Promise<boolean>;
/**
 * Replace text in a memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 * @param oldStr - String to replace
 * @param newStr - Replacement string
 */
export declare function replaceMemory(agentId: AgentId, path: string, oldStr: string, newStr: string): Promise<boolean>;
/**
 * Delete a memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 */
export declare function deleteMemory(agentId: AgentId, path: string): Promise<boolean>;
/**
 * Rename a memory file
 *
 * @param agentId - Agent ID
 * @param oldPath - Current path relative to agent's memory directory
 * @param newPath - New path relative to agent's memory directory
 */
export declare function renameMemory(agentId: AgentId, oldPath: string, newPath: string): Promise<boolean>;
/**
 * Insert text at specific line in memory file
 *
 * @param agentId - Agent ID
 * @param path - Path relative to agent's memory directory
 * @param line - Line number to insert at (0-based)
 * @param content - Content to insert
 */
export declare function insertMemory(agentId: AgentId, path: string, line: number, content: string): Promise<boolean>;
export default memoryToolIntegration;
