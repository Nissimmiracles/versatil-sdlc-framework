/**
 * VERSATIL v6.1 - Proactive Capability Enhancer
 *
 * Enables orchestrators to:
 * 1. Detect capability gaps in agents based on task requirements
 * 2. Dynamically assign MCP tools to agents/sub-agents
 * 3. Proactively enhance agents before task execution
 * 4. Propagate tool inheritance to sub-agents
 *
 * Purpose: Solve the critical gap where orchestrators don't have logic to
 * enhance agent capabilities based on task context.
 *
 * Example:
 * - Task: "Test user login flow"
 * - Analyzer detects: Needs browser automation
 * - Enhancer assigns: Playwright + Chrome MCP to Maria-QA
 * - Sub-agents inherit: All sub-maria instances get same tools
 */
import { EventEmitter } from 'events';
import type { Task } from './epic-workflow-orchestrator.js';
export interface RequiredCapabilities {
    taskId: string;
    taskType: string;
    detectedRequirements: {
        browserAutomation?: boolean;
        apiTesting?: boolean;
        databaseAccess?: boolean;
        aiResearch?: boolean;
        repositoryAccess?: boolean;
        visualDesign?: boolean;
    };
    recommendedTools: string[];
    recommendedAgents: string[];
    confidence: number;
}
export interface CapabilityGap {
    agentType: string;
    missingCapabilities: string[];
    requiredTools: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
}
export interface EnhancementResult {
    agentType: string;
    toolsAdded: string[];
    capabilitiesGranted: string[];
    success: boolean;
    error?: string;
}
export interface CapabilityEnhancerConfig {
    autoEnhance?: boolean;
    inheritToSubAgents?: boolean;
    maxToolsPerAgent?: number;
}
export declare class ProactiveCapabilityEnhancer extends EventEmitter {
    private enhancementHistory;
    private agentToolRegistry;
    private config;
    constructor(config?: CapabilityEnhancerConfig);
    /**
     * Analyze task requirements and detect needed capabilities
     */
    analyzeTaskRequirements(task: Task): Promise<RequiredCapabilities>;
    /**
     * Detect capability gaps for specific agent
     */
    detectMissingCapabilities(agentType: string, task: Task): Promise<CapabilityGap | null>;
    /**
     * Enhance agent with additional tools
     */
    enhanceAgentWithTools(agentType: string, tools: string[], reason?: string): Promise<EnhancementResult>;
    /**
     * Inherit tools from parent agent to sub-agent
     */
    inheritToolsToSubAgent(parentAgentType: string, subAgentId: string): Promise<EnhancementResult>;
    /**
     * Proactively enhance agent before task execution
     */
    proactiveEnhancement(agentType: string, task: Task): Promise<EnhancementResult | null>;
    /**
     * Get agent's current tools
     */
    getAgentTools(agentType: string): string[];
    /**
     * Get enhancement history for agent
     */
    getEnhancementHistory(agentType: string): EnhancementResult[];
    /**
     * Reset agent tools to baseline
     */
    resetAgentTools(agentType: string): void;
    private detectBrowserAutomation;
    private detectAPITesting;
    private detectDatabaseAccess;
    private detectAIResearch;
    private detectRepositoryAccess;
    private detectVisualDesign;
    private mapToolsToCapabilities;
}
export declare function getProactiveCapabilityEnhancer(config?: CapabilityEnhancerConfig): ProactiveCapabilityEnhancer;
