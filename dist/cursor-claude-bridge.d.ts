/**
 * VERSATIL SDLC Framework - Cursor-Claude Bridge
 * Connects .cursorrules agent patterns to actual Claude Code agent invocation
 *
 * This bridges the gap between Cursor's .cursorrules and Claude Code's agent system
 * making the OPERA methodology work consistently across both tools
 */
/**
 * Cursor-Claude Bridge Service
 * Makes .cursorrules patterns work with Claude Code agents
 */
declare class CursorClaudeBridge {
    private cursorRules;
    private isActive;
    private messageQueue;
    constructor();
    /**
     * Initialize the Bridge
     */
    private initializeBridge;
    /**
     * Parse .cursorrules file into actionable rules
     */
    private parseCursorRules;
    /**
     * Load Default Rules if .cursorrules parsing fails
     */
    private loadDefaultRules;
    /**
     * Setup Message Queue Processing
     */
    private setupMessageQueue;
    /**
     * Process Message Queue - Batch Agent Invocations
     */
    private processMessageQueue;
    /**
     * Connect to Development Integration
     */
    private connectToDevelopmentIntegration;
    /**
     * Setup User Request Interception
     */
    private setupUserRequestInterception;
    /**
     * Handle File Change from Development Integration
     */
    private handleFileChangeFromIntegration;
    /**
     * Handle User Request (Enhanced Context Validation)
     */
    handleUserRequest(userRequest: string): Promise<{
        needsClarification: boolean;
        clarifications: string[];
        recommendedAgents: string[];
        autoInvokedAgents: string[];
    }>;
    /**
     * Handle Emergency Situations
     */
    handleEmergency(errorMessage: string, context?: string): Promise<void>;
    /**
     * Find Matching Cursor Rules for File Patterns
     */
    private findMatchingCursorRules;
    /**
     * Find Matching Cursor Rules for User Requests
     */
    private findMatchingCursorRulesForRequest;
    /**
     * Extract Matching Keywords
     */
    private extractMatchingKeywords;
    /**
     * Queue Agent Invocation
     */
    private queueAgentInvocation;
    /**
     * Invoke Claude Agent (connects to real Claude Code agent system)
     */
    private invokeClaudeAgent;
    /**
     * Log Agent Invocation for Context Preservation
     */
    private logAgentInvocation;
    /**
     * Get Bridge Status
     */
    getBridgeStatus(): {
        active: boolean;
        cursorRulesCount: number;
        queuedInvocations: number;
        supportedAgents: string[];
        status: string;
    };
    /**
     * Test Bridge Functionality
     */
    testBridge(): Promise<{
        cursorRulesParsed: boolean;
        queueProcessing: boolean;
        agentInvocation: boolean;
        overallHealth: 'healthy' | 'degraded' | 'failed';
    }>;
}
export declare const cursorClaudeBridge: CursorClaudeBridge;
export declare function handleUserRequestViaBridge(userRequest: string): Promise<{
    needsClarification: boolean;
    clarifications: string[];
    recommendedAgents: string[];
    autoInvokedAgents: string[];
}>;
export declare function handleEmergencyViaBridge(errorMessage: string, context?: string): Promise<void>;
export declare function getBridgeStatus(): {
    active: boolean;
    cursorRulesCount: number;
    queuedInvocations: number;
    supportedAgents: string[];
    status: string;
};
export {};
