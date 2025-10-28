/**
 * Sub-Agent Selector
 *
 * Intelligently selects the optimal language-specific sub-agent based on context.
 * Integrates with TechStackDetector for high-accuracy agent routing.
 *
 * @module sub-agent-selector
 * @version 6.6.0
 */
import { TechStackResult } from './tech-stack-detector.js';
export interface SubAgentSelection {
    subAgentId: string;
    baseAgentId: 'marcus-backend' | 'james-frontend';
    confidence: number;
    reason: string;
    fallback: boolean;
    techStack?: TechStackResult;
}
export declare class SubAgentSelector {
    private static techStackCache;
    private static readonly CACHE_TTL;
    /**
     * Select optimal sub-agent based on file and context
     */
    static selectSubAgent(filePath: string, content: string, projectPath: string): Promise<SubAgentSelection>;
    /**
     * Select backend sub-agent
     */
    static selectBackendSubAgent(filePath: string, content: string, projectPath: string): Promise<SubAgentSelection>;
    /**
     * Select frontend sub-agent
     */
    static selectFrontendSubAgent(filePath: string, content: string, projectPath: string): Promise<SubAgentSelection>;
    /**
     * Get project tech stack (with caching)
     */
    private static getProjectStack;
    /**
     * Clear tech stack cache (useful for testing or after project changes)
     */
    static clearCache(): void;
    /**
     * Determine base agent from sub-agent ID
     */
    private static getBaseAgentId;
    /**
     * Check if sub-agent is a backend agent
     */
    private static isBackendAgent;
    /**
     * Check if sub-agent is a frontend agent
     */
    private static isFrontendAgent;
    /**
     * Fallback selection based on file type
     */
    private static fallbackSelection;
    /**
     * Fallback backend selection with content analysis
     */
    private static fallbackBackendSelection;
    /**
     * Fallback frontend selection with content analysis
     */
    private static fallbackFrontendSelection;
    /**
     * Get all available sub-agents
     */
    static getAvailableSubAgents(): Record<string, string>;
    /**
     * Check if sub-agent exists
     */
    static isValidSubAgent(subAgentId: string): boolean;
}
