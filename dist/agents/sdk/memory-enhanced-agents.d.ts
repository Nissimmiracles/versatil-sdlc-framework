/**
 * Memory-Enhanced VERSATIL Agents
 *
 * Wraps existing OPERA agents with Memory Tool + Context Editing integration
 *
 * All agents now have:
 * - Persistent memory across sessions
 * - Automatic pattern storage and retrieval
 * - Context editing for long conversations
 * - Zero context loss guarantee
 */
import type { AgentId } from '../../memory/memory-tool-config.js';
/**
 * Memory-Enhanced Agents
 *
 * Export these instead of the base agents to enable Memory Tool + Context Editing
 */
export declare const MARIA_QA_MEMORY_ENHANCED: import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
export declare const JAMES_FRONTEND_MEMORY_ENHANCED: import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
export declare const MARCUS_BACKEND_MEMORY_ENHANCED: import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
export declare const ALEX_BA_MEMORY_ENHANCED: import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
export declare const SARAH_PM_MEMORY_ENHANCED: import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
export declare const DR_AI_ML_MEMORY_ENHANCED: import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
/**
 * All memory-enhanced agents indexed by ID
 */
export declare const MEMORY_ENHANCED_AGENTS: {
    readonly 'maria-qa': import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
    readonly 'james-frontend': import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
    readonly 'marcus-backend': import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
    readonly 'alex-ba': import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
    readonly 'sarah-pm': import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
    readonly 'dr-ai-ml': import("@anthropic-ai/claude-agent-sdk").AgentDefinition;
};
/**
 * Get memory-enhanced agent by ID
 */
export declare function getMemoryEnhancedAgent(agentId: AgentId): any;
/**
 * Agent comparison: Before vs After Memory Tool
 */
export declare const AGENT_ENHANCEMENT_COMPARISON: {
    'maria-qa': {
        before: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        after: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        memoryContents: string[];
    };
    'james-frontend': {
        before: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        after: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        memoryContents: string[];
    };
    'marcus-backend': {
        before: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        after: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        memoryContents: string[];
    };
    'dana-database': {
        before: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        after: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        memoryContents: string[];
    };
    'alex-ba': {
        before: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        after: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        memoryContents: string[];
    };
    'sarah-pm': {
        before: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        after: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        memoryContents: string[];
    };
    'dr-ai-ml': {
        before: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        after: {
            contextLoss: string;
            patternReuse: string;
            learning: string;
        };
        memoryContents: string[];
    };
};
/**
 * Initialize all agent memories on framework startup
 *
 * Called during VERSATIL initialization
 */
export declare function initializeMemoryEnhancedAgents(): Promise<void>;
/**
 * Get agent memory statistics
 */
export declare function getAgentMemoryStats(): Promise<import("../../memory/memory-tool-handler.js").MemoryStats>;
/**
 * Cleanup old cached documentation
 *
 * Run periodically to maintain memory health
 */
export declare function cleanupAgentMemories(): Promise<void>;
