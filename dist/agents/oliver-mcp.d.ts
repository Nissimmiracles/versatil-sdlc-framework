/**
 * Oliver-MCP Agent
 *
 * MCP Orchestration Specialist
 *
 * Role:
 * - Intelligent routing for MCP tool calls
 * - Health monitoring and circuit breaking
 * - Hallucination detection via GitMCP
 * - Auto-retry with exponential backoff
 * - Environment validation
 *
 * Activation:
 * - AUTO: When MCP tool calls detected
 * - MANUAL: /oliver-mcp command or MCP configuration
 *
 * Responsibilities:
 * - Route Claude SDK tool calls to appropriate MCP executors
 * - Monitor MCP health (95%+ reliability target)
 * - Detect and prevent hallucinations using GitMCP
 * - Validate environment (Node.js, npm, git, MCP servers)
 * - Provide intelligent query routing for help/docs
 */
import { type ToolCallRequest } from '../mcp/mcp-tool-router.js';
import { type MCPHealth } from '../mcp/mcp-health-monitor.js';
export interface RoutingResult {
    server: string;
    confidence: number;
    reasoning: string;
    alternatives: Array<{
        server: string;
        score: number;
    }>;
}
export interface EnvironmentValidation {
    nodejs: {
        installed: boolean;
        version?: string;
        meetsRequirements: boolean;
    };
    npm: {
        installed: boolean;
        version?: string;
        meetsRequirements: boolean;
    };
    git: {
        installed: boolean;
        version?: string;
        meetsRequirements: boolean;
    };
    mcpServers: Array<{
        name: string;
        installed: boolean;
        healthy: boolean;
        circuitOpen: boolean;
    }>;
    safe_to_proceed: boolean;
    warnings: string[];
    errors: string[];
}
export interface MCPToolCallResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
    retriesUsed: number;
    usedFallback: boolean;
    mcpServer: string;
}
/**
 * Oliver-MCP - MCP Orchestration Agent
 */
export declare class OliverMCP {
    private static instance;
    private toolRouter;
    private healthMonitor;
    private workingDir;
    private constructor();
    /**
     * Singleton instance
     */
    static getInstance(workingDir?: string): OliverMCP;
    /**
     * Initialize MCP systems
     */
    initialize(): Promise<void>;
    /**
     * Route query to optimal MCP server
     *
     * @param query User query or help request
     * @returns Routing decision with confidence scores
     */
    routeQuery(query: string): Promise<RoutingResult>;
    /**
     * Execute MCP tool call with auto-retry and health monitoring
     *
     * @param toolCall Tool call request
     * @returns Execution result with retry and fallback info
     */
    executeToolCall(toolCall: ToolCallRequest): Promise<MCPToolCallResult>;
    /**
     * Validate environment for MCP operations
     *
     * @returns Environment validation result with quality gate
     */
    validateEnvironment(): Promise<EnvironmentValidation>;
    /**
     * Get health status for all MCP servers
     */
    getAllHealthStatuses(): Promise<MCPHealth[]>;
    private checkNodeJS;
    private checkNPM;
    private checkGit;
    private checkMCPServers;
}
export declare const oliverMCP: OliverMCP;
