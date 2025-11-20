/**
 * VERSATIL SDLC Framework - MCP Client Integration
 * Provides client-side integration for MCP tools with VERSATIL agents
 */
export interface MCPClientConfig {
    serverPath: string;
    toolPrefix: string;
    maxRetries: number;
    timeout: number;
}
export interface MCPToolRequest {
    tool: string;
    arguments: Record<string, any>;
    context?: Record<string, any>;
}
export interface MCPToolResponse {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
}
/**
 * MCP Client for VERSATIL Framework Integration
 * Enables seamless communication between AI assistants and VERSATIL agents
 */
export declare class VERSATILMCPClient {
    private agentRegistry;
    private sdlcOrchestrator;
    private logger;
    private config;
    constructor(config?: Partial<MCPClientConfig>);
    /**
     * Execute MCP tool request
     */
    executeTool(request: MCPToolRequest): Promise<MCPToolResponse>;
    /**
     * Handle agent activation requests
     */
    private handleAgentActivation;
    /**
     * Handle SDLC orchestration requests
     */
    private handleSDLCOrchestration;
    /**
     * Handle quality gate execution
     */
    private handleQualityGate;
    /**
     * Handle test suite execution
     */
    private handleTestSuite;
    /**
     * Handle architecture analysis
     */
    private handleArchitectureAnalysis;
    /**
     * Handle deployment pipeline management
     */
    private handleDeploymentPipeline;
    /**
     * Handle framework status requests
     */
    private handleFrameworkStatus;
    /**
     * Handle adaptive insights generation
     */
    private handleAdaptiveInsights;
    /**
     * Handle file analysis requests
     */
    private handleFileAnalysis;
    /**
     * Handle performance report generation
     */
    private handlePerformanceReport;
    /**
     * Get available tools
     */
    getAvailableTools(): string[];
    /**
     * Health check for MCP integration
     */
    healthCheck(): Promise<boolean>;
    /**
     * Cleanup resources (orchestrator, daemon, etc.)
     */
    cleanup(): Promise<void>;
}
