/**
 * VERSATIL Memory Tool Configuration
 *
 * Integrates Claude's Memory Tool (beta) with VERSATIL's isolated architecture
 *
 * Features:
 * - Agent-specific memory directories (maria-qa/, james-frontend/, etc.)
 * - Context editing integration for long conversations
 * - Pattern storage and retrieval across sessions
 * - Isolation enforcement (~/.versatil/memories/ not in projects)
 *
 * References:
 * - https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
 * - https://docs.claude.com/en/docs/build-with-claude/context-editing
 */
export interface MemoryToolConfig {
    /** Beta flag for Context Management features */
    beta: string;
    /** Root directory for all agent memories (isolated from projects) */
    memoryDirectory: string;
    /** Context editing configuration */
    contextManagement: ContextManagementConfig;
    /** Tools to exclude from context clearing */
    excludeTools: string[];
    /** Agent-specific memory subdirectories */
    agentMemoryPaths: Record<AgentId, string>;
    /** Memory file retention policy */
    retentionPolicy: RetentionPolicy;
}
export interface ContextManagementConfig {
    edits: ContextEdit[];
}
export interface ContextEdit {
    /** Type of context edit operation */
    type: 'clear_tool_uses_20250919';
    /** When to trigger context editing */
    trigger: TokenTrigger;
    /** How many recent tool uses to preserve */
    keep: ToolUsesKeep;
    /** Minimum tokens to clear when triggered */
    clearAtLeast: TokenClearAtLeast;
}
export interface TokenTrigger {
    type: 'input_tokens';
    value: number;
}
export interface ToolUsesKeep {
    type: 'tool_uses';
    value: number;
}
export interface TokenClearAtLeast {
    type: 'input_tokens';
    value: number;
}
export interface RetentionPolicy {
    /** Documentation cache TTL in days */
    documentationCacheTTL: number;
    /** Pattern cache TTL in days (0 = never expire) */
    patternCacheTTL: number;
    /** Maximum memory directory size in MB */
    maxMemorySizeMB: number;
    /** Auto-cleanup threshold (% of max size) */
    cleanupThresholdPercent: number;
}
export type AgentId = 'maria-qa' | 'james-frontend' | 'marcus-backend' | 'dana-database' | 'alex-ba' | 'sarah-pm' | 'dr-ai-ml' | 'oliver-mcp';
/**
 * Default Memory Tool configuration for VERSATIL
 *
 * Memory Directory Structure:
 * ~/.versatil/memories/
 * ├── maria-qa/
 * │   ├── test-patterns.md
 * │   ├── bug-signatures.md
 * │   └── coverage-strategies.md
 * ├── james-frontend/
 * │   ├── component-patterns.md
 * │   ├── accessibility-fixes.md
 * │   └── performance-optimizations.md
 * ├── marcus-backend/
 * │   ├── api-security-patterns.md
 * │   ├── database-optimization.md
 * │   └── authentication-flows.md
 * ├── dana-database/
 * │   ├── schema-patterns.md
 * │   ├── migration-strategies.md
 * │   └── rls-policies.md
 * ├── alex-ba/
 * │   ├── requirement-templates.md
 * │   └── user-story-patterns.md
 * ├── sarah-pm/
 * │   ├── sprint-patterns.md
 * │   └── coordination-strategies.md
 * ├── dr-ai-ml/
 * │   ├── model-architectures.md
 * │   └── deployment-patterns.md
 * └── project-knowledge/
 *     ├── architecture-decisions.md
 *     └── tech-stack-preferences.md
 */
export declare const MEMORY_TOOL_CONFIG: MemoryToolConfig;
/**
 * Memory file templates for each agent
 */
export declare const AGENT_MEMORY_TEMPLATES: Record<AgentId, MemoryTemplate[]>;
export interface MemoryTemplate {
    filename: string;
    description: string;
    initialContent: string;
}
/**
 * Get memory path for a specific agent
 */
export declare function getAgentMemoryPath(agentId: AgentId): string;
/**
 * Get full path to a memory file
 */
export declare function getMemoryFilePath(agentId: AgentId, filename: string): string;
/**
 * Get all agent IDs
 */
export declare function getAllAgentIds(): AgentId[];
/**
 * Update context clear threshold dynamically
 * Used by AdaptiveContextManager to adjust based on conversation patterns
 */
export declare function updateContextClearThreshold(newThreshold: number): void;
/**
 * Get current context clear threshold
 */
export declare function getContextClearThreshold(): number;
