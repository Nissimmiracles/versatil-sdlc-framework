/**
 * Proactive Agent Orchestrator
 *
 * Automatically activates and coordinates OPERA agents based on file patterns,
 * code context, and real-time development activity.
 *
 * @module ProactiveAgentOrchestrator
 * @version 2.0.0
 */
import { EventEmitter } from 'events';
import { AgentActivationContext, AgentResponse } from '../agents/core/base-agent.js';
export interface ProactiveAgentConfig {
    enabled: boolean;
    autoActivation: boolean;
    backgroundMonitoring: boolean;
    inlineSuggestions: boolean;
    statuslineUpdates: boolean;
    slashCommandsFallback: boolean;
}
export interface AgentTrigger {
    agentId: string;
    filePatterns: string[];
    codePatterns: string[];
    keywords: string[];
    autoRunOnSave: boolean;
    backgroundAnalysis: boolean;
    proactiveActions: string[];
}
export interface ActiveAgent {
    agentId: string;
    agent: any;
    context: AgentActivationContext;
    startTime: number;
    progress: number;
    status: 'running' | 'completed' | 'failed';
}
export declare class ProactiveAgentOrchestrator extends EventEmitter {
    private config;
    private triggers;
    private activeAgents;
    private watchers;
    private agents;
    private capabilityEnhancer;
    constructor(config?: Partial<ProactiveAgentConfig>);
    /**
     * Initialize OPERA agent instances
     */
    private initializeAgents;
    /**
     * Initialize agent activation triggers from .cursor/settings.json
     */
    private initializeTriggers;
    /**
     * NEW v6.1: Setup capability enhancer event listeners
     */
    private setupCapabilityEnhancerListeners;
    /**
     * NEW v6.1: Proactively enhance agent before activation
     */
    private enhanceAgentForTask;
    /**
     * NEW v6.1: Infer task type from context
     */
    private inferTaskType;
    /**
     * Start watching file system for changes
     */
    startMonitoring(projectPath: string): void;
    /**
     * Stop monitoring file system
     */
    stopMonitoring(projectPath?: string): void;
    /**
     * Handle file change event and determine if agent activation is needed
     */
    private handleFileChange;
    /**
     * Find agents that match the file pattern
     */
    private findMatchingAgents;
    /**
     * Simple glob pattern matching (can be enhanced with micromatch library)
     */
    private matchGlobPattern;
    /**
     * Activate one or more agents for a file
     */
    private activateAgents;
    /**
     * Activate a single agent
     */
    private activateAgent;
    /**
     * Get status of all active agents (for statusline)
     */
    getActiveAgentsStatus(): Map<string, ActiveAgent>;
    /**
     * Manually activate an agent (fallback for slash commands)
     */
    manualActivation(agentId: string, filePath: string): Promise<AgentResponse>;
    /**
     * Disable proactive agents (fallback to manual mode)
     */
    disableProactiveMode(): void;
    /**
     * Enable proactive agents
     */
    enableProactiveMode(): void;
    /**
     * Check if file should be ignored
     */
    private shouldIgnoreFile;
    /**
     * Detect language from file extension
     */
    private detectLanguage;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare function getProactiveOrchestrator(config?: Partial<ProactiveAgentConfig>): ProactiveAgentOrchestrator;
export declare function destroyProactiveOrchestrator(): void;
