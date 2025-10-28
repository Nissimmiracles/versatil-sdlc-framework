/**
 * VERSATIL Agent Memory Manager
 *
 * Manages agent-specific memory directories and pattern storage
 * - Creates agent memory directories on activation
 * - Loads agent-specific patterns from memory
 * - Saves successful patterns to memory
 * - Memory lifecycle management (create, update, cleanup)
 *
 * Directory Structure:
 * ~/.versatil/memories/
 * ├── maria-qa/
 * │   ├── test-patterns.md
 * │   ├── coverage-strategies.md
 * │   └── bug-detection-patterns.md
 * ├── marcus-backend/
 * │   ├── api-security-patterns.md
 * │   ├── stress-test-examples.md
 * │   └── performance-optimizations.md
 * ├── james-frontend/
 * │   ├── react-patterns.md
 * │   ├── accessibility-fixes.md
 * │   └── performance-patterns.md
 * ... (for all 8 agents)
 */
import { AgentId } from './memory-tool-config.js';
/**
 * Pattern metadata
 */
export interface PatternMetadata {
    /** Pattern filename */
    filename: string;
    /** Pattern title */
    title: string;
    /** Pattern description */
    description: string;
    /** When pattern was created */
    createdAt: string;
    /** When pattern was last updated */
    updatedAt: string;
    /** Number of times pattern was accessed */
    accessCount: number;
    /** Tags for pattern categorization */
    tags: string[];
    /** Pattern effectiveness score (0-100) */
    effectivenessScore?: number;
}
/**
 * Agent memory statistics
 */
export interface AgentMemoryStats {
    /** Agent ID */
    agentId: AgentId;
    /** Number of patterns stored */
    patternCount: number;
    /** Total memory size in MB */
    memorySizeMB: number;
    /** Last access timestamp */
    lastAccess: string;
    /** Pattern metadata */
    patterns: PatternMetadata[];
}
/**
 * Agent Memory Manager
 *
 * Handles agent-specific memory operations
 */
export declare class AgentMemoryManager {
    private readonly baseDir;
    private agentLastAccess;
    private initialized;
    constructor();
    /**
     * Initialize agent memory directories and templates
     */
    initialize(): Promise<void>;
    /**
     * Initialize memory directory for a specific agent
     *
     * @param agentId - Agent ID
     */
    private initializeAgentMemory;
    /**
     * Create shared templates in project-knowledge directory
     */
    private createSharedTemplates;
    /**
     * Load patterns for a specific agent
     *
     * @param agentId - Agent ID
     * @returns Array of pattern contents (markdown)
     */
    loadPatterns(agentId: AgentId): Promise<string[]>;
    /**
     * Store a pattern to agent memory
     *
     * @param agentId - Agent ID
     * @param patternName - Pattern filename (e.g., 'oauth-test-pattern.md')
     * @param content - Pattern content (markdown)
     */
    storePattern(agentId: AgentId, patternName: string, content: string): Promise<void>;
    /**
     * Update agent's last access time
     *
     * @param agentId - Agent ID
     */
    updateLastAccess(agentId: AgentId): Promise<void>;
    /**
     * Update agent metadata (pattern count, etc.)
     */
    private updateMetadata;
    /**
     * Get statistics for a specific agent
     *
     * @param agentId - Agent ID
     * @returns Agent memory statistics
     */
    getAgentStats(agentId: AgentId): Promise<AgentMemoryStats>;
    /**
     * Get pattern metadata for an agent
     */
    private getPatternMetadata;
    /**
     * Get directory size recursively
     */
    private getDirectorySize;
    /**
     * Cleanup old patterns based on retention policy
     *
     * @param agentId - Agent ID (optional, cleans all agents if not specified)
     */
    cleanupOldPatterns(agentId?: AgentId): Promise<void>;
}
/**
 * Global agent memory manager instance
 */
export declare const agentMemoryManager: AgentMemoryManager;
export default agentMemoryManager;
