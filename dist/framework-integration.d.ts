/**
 * VERSATIL SDLC Framework - Integration Service
 * Connects the agent dispatcher to Claude Code, Cursor, and development tools
 *
 * This service makes the theoretical framework actually work in practice
 */
import type { AgentResponse } from './agent-dispatcher.js';
interface DevelopmentEnvironment {
    tool: 'claude-code' | 'cursor' | 'vscode';
    mcpSupport: boolean;
    agentSupport: boolean;
}
interface QualityGateResult {
    passed: boolean;
    issues: string[];
    warnings: string[];
    blockers: string[];
}
/**
 * Framework Integration Manager
 * Bridges between VERSATIL framework and actual development tools
 */
declare class VERSATILFrameworkIntegration {
    private environment;
    private qualityGates;
    private mcpConnections;
    constructor();
    /**
     * Detect Development Environment
     */
    private detectEnvironment;
    /**
     * Setup Quality Gates (Phase 2)
     */
    private setupQualityGates;
    /**
     * Setup MCP Integration (Phase 1)
     */
    private setupMCPIntegration;
    /**
     * Initialize Framework with Event Listeners
     */
    private initializeFramework;
    /**
     * Handle Agent Activation Events
     */
    private handleAgentActivation;
    /**
     * Run Quality Gates
     */
    runQualityGates(context: any): Promise<QualityGateResult>;
    /**
     * Activate Recommended MCP Tools
     */
    private activateRecommendedMCPTools;
    /**
     * Actually Activate MCP Tool (connects to real MCP system)
     */
    private activateMCPTool;
    /**
     * Context Validation Hooks (User's Enhancement)
     */
    private setupContextValidationHooks;
    /**
     * Enhanced User Request Handler (User's Enhancement)
     */
    handleUserRequest(request: string): Promise<{
        needsClarification: boolean;
        clarifications: string[];
        recommendedAgents: string[];
        autoActivatedAgents: AgentResponse[];
    }>;
    /**
     * Emergency Handler Integration
     */
    private handleEmergency;
    /**
     * Helper Methods
     */
    private findAgentsForRequest;
    private findAgentTrigger;
    private notifyAgentOfBlockers;
    private logAgentCoordination;
    private isVersionCompatible;
    /**
     * Get Framework Status
     */
    getFrameworkStatus(): {
        environment: DevelopmentEnvironment;
        activeAgents: string[];
        qualityGates: string[];
        mcpConnections: string[];
        status: string;
    };
    /**
     * Manual Agent Activation (for testing)
     */
    testAgentActivation(agentName: string, context?: any): Promise<AgentResponse>;
}
export declare const versatilIntegration: VERSATILFrameworkIntegration;
export declare function getVERSATILStatus(): {
    environment: DevelopmentEnvironment;
    activeAgents: string[];
    qualityGates: string[];
    mcpConnections: string[];
    status: string;
};
export {};
