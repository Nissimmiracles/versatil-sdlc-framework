/**
 * Context-Aware Agent Wrapper
 *
 * Integrates Memory Tool + Context Editing with VERSATIL OPERA agents
 *
 * Features:
 * - Automatic memory directory viewing before tasks
 * - Pattern storage and retrieval across sessions
 * - Context editing for long conversations
 * - Agent-specific memory paths
 *
 * References:
 * - https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 * - https://docs.claude.com/en/docs/build-with-claude/context-editing
 */
import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { type AgentId } from '../../memory/memory-tool-config.js';
/**
 * Enhance agent definition with Memory Tool + Context Editing
 *
 * Usage:
 * ```typescript
 * const mariaQA = createContextAwareAgent('maria-qa', MARIA_QA_AGENT);
 * ```
 */
export declare function createContextAwareAgent(agentId: AgentId, baseAgent: AgentDefinition): AgentDefinition;
/**
 * Create Memory Tool API for agents
 *
 * Provides clean interface for agents to interact with memories
 */
export declare class AgentMemoryAPI {
    private agentId;
    constructor(agentId: AgentId);
    /**
     * View memory directory or file
     */
    view(path?: string): Promise<string>;
    /**
     * Create or update memory file
     */
    create(filename: string, content: string): Promise<void>;
    /**
     * Replace text in memory file
     */
    strReplace(filename: string, oldStr: string, newStr: string): Promise<void>;
    /**
     * Insert text at specific line in memory file
     */
    insert(filename: string, line: number, content: string): Promise<void>;
    /**
     * Delete memory file
     */
    delete(filename: string): Promise<void>;
    /**
     * Rename memory file
     */
    rename(oldFilename: string, newFilename: string): Promise<void>;
    /**
     * Store a pattern to memory
     *
     * High-level API for storing successful patterns
     */
    storePattern(pattern: MemoryPattern): Promise<void>;
    /**
     * Retrieve patterns by category
     */
    getPatterns(category: string): Promise<string>;
}
export interface MemoryPattern {
    category: string;
    title: string;
    description: string;
    code?: string;
    language?: string;
    tags?: string[];
    successRate?: string;
}
/**
 * Initialize all agent memories
 */
export declare function initializeAgentMemories(): Promise<void>;
/**
 * Get memory API for specific agent
 */
export declare function getAgentMemoryAPI(agentId: AgentId): AgentMemoryAPI;
