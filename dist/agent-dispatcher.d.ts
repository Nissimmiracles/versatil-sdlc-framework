/**
 * VERSATIL SDLC Framework - Auto-Agent Dispatcher
 * Real-time agent activation based on file patterns, context, and triggers
 *
 * This is the core missing piece that makes OPERA methodology truly autonomous
 */
import { EventEmitter } from 'events';
export interface AgentTrigger {
    agent: string;
    priority: number;
    triggers: {
        filePatterns: string[];
        keywords: string[];
        actions: string[];
        dependencies: string[];
        errorPatterns: string[];
    };
    autoActivate: boolean;
    mcpTools: string[];
    collaborators: string[];
}
export interface AgentActivationContext {
    trigger: AgentTrigger;
    filePath?: string;
    errorMessage?: string;
    userRequest?: string;
    contextClarity: 'clear' | 'ambiguous' | 'missing';
    requiredClarifications?: string[];
    matchedKeywords?: string[];
    emergency?: boolean;
    testing?: boolean;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
    emergencyType?: string;
    emergencySeverity?: string;
    bridgeInvoked?: boolean;
}
export interface AgentResponse {
    agent: string;
    status: 'activated' | 'clarification_needed' | 'delegated' | 'completed';
    message: string;
    clarifications?: string[];
    nextActions?: string[];
    collaborators?: string[];
}
/**
 * Core Agent Dispatch System
 * Monitors files, patterns, and context to automatically activate appropriate agents
 */
declare class VERSATILAgentDispatcher extends EventEmitter {
    private agents;
    private activeAgents;
    private fileWatchers;
    private contextValidator;
    constructor();
    /**
     * Initialize OPERA Agents with Enhanced Triggers
     */
    private initializeAgents;
    /**
     * Enhanced Context Clarity Validation (User's New Requirement)
     */
    validateTaskContext(userRequest: string): Promise<{
        clarity: 'clear' | 'ambiguous' | 'missing';
        clarifications: string[];
        recommendedAgents: string[];
    }>;
    /**
     * Auto-Activate Agents Based on File Changes
     */
    private setupFileWatching;
    private shouldIgnoreFile;
    /**
     * Core File Change Handler - Triggers Agent Activation
     */
    private handleFileChange;
    /**
     * Find Agents That Match File Patterns
     */
    private findMatchingAgents;
    /**
     * Activate Agent with Context
     */
    activateAgent(trigger: AgentTrigger, context?: Partial<AgentActivationContext>): Promise<AgentResponse>;
    /**
     * Emergency Protocol - Auto-activate agents for critical errors
     */
    handleEmergency(errorMessage: string, context?: string): Promise<AgentResponse[]>;
    /**
     * Find agents that can handle specific error patterns
     */
    private findAgentsForError;
    private findAgentByName;
    /**
     * Activate MCP Tools
     */
    private activateMCPTools;
    /**
     * Deactivate agent
     */
    deactivateAgent(agentName: string): void;
    /**
     * Get currently active agents
     */
    getActiveAgents(): string[];
    /**
     * Cleanup
     */
    destroy(): void;
}
/**
 * Context Clarity Validator (User's Enhancement Request)
 */
declare class ContextValidator {
    validateContext(userRequest: string): Promise<{
        clarity: 'clear' | 'ambiguous' | 'missing';
        clarifications: string[];
        recommendedAgents: string[];
    }>;
}
export { VERSATILAgentDispatcher, ContextValidator };
export declare const versatilDispatcher: VERSATILAgentDispatcher;
