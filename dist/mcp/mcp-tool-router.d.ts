/**
 * VERSATIL v6.1 - MCP Tool Router
 *
 * Routes Claude SDK tool calls to MCP executors
 * Bridges the gap between Claude SDK agents and MCP tools
 *
 * Purpose:
 * - When Claude SDK calls a tool like `Playwright.screenshot()`, this routes it to the actual MCP executor
 * - Enables agents to use MCP tools directly without Bash workarounds
 * - Provides unified interface for all MCP integrations
 *
 * Supported MCPs:
 * - Playwright MCP: Browser automation, testing, accessibility
 * - Chrome MCP: Browser DevTools, performance, visual regression
 * - GitHub MCP: Repository access, issues, PRs
 * - Exa Search MCP: AI-powered web search
 * - Shadcn MCP: UI component library
 * - VERSATIL MCP: Framework orchestration
 *
 * Usage:
 * ```typescript
 * const router = new MCPToolRouter();
 * await router.initialize();
 *
 * // Route tool call from Claude SDK
 * const result = await router.handleToolCall('Playwright', {
 *   action: 'screenshot',
 *   params: { selector: '.my-component' }
 * });
 * ```
 */
import { EventEmitter } from 'events';
export interface ToolCallRequest {
    tool: string;
    action: string;
    params: Record<string, any>;
    agentId?: string;
    taskId?: string;
}
export interface ToolCallResponse {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
    tool: string;
    action: string;
}
export interface MCPToolStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageExecutionTime: number;
    callsByTool: Record<string, number>;
    callsByAgent: Record<string, number>;
}
export declare class MCPToolRouter extends EventEmitter {
    private playwrightMCP;
    private chromeMCP;
    private githubMCP;
    private exaMCP;
    private gitMCP;
    private shadcnMCP;
    private stats;
    private callHistory;
    private readonly MAX_HISTORY;
    constructor();
    /**
     * Initialize all MCP executors
     */
    initialize(): Promise<void>;
    /**
     * Main method: Route tool call to appropriate MCP executor
     */
    handleToolCall(request: ToolCallRequest): Promise<ToolCallResponse>;
    /**
     * Handle Playwright MCP calls
     */
    private handlePlaywrightCall;
    /**
     * Handle Chrome MCP calls
     */
    private handleChromeCall;
    /**
     * Handle GitHub MCP calls
     */
    private handleGitHubCall;
    /**
     * Handle Exa Search MCP calls
     */
    private handleExaSearchCall;
    /**
     * Handle GitMCP calls
     */
    private handleGitMCPCall;
    /**
     * Handle Shadcn MCP calls
     */
    private handleShadcnCall;
    /**
     * Track tool call in history
     */
    private trackCall;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Get router statistics
     */
    getStats(): MCPToolStats;
    /**
     * Get call history
     */
    getCallHistory(limit?: number): ToolCallRequest[];
    /**
     * Get available MCP tools
     */
    getAvailableTools(): string[];
    /**
     * Check if a tool is available
     */
    isToolAvailable(tool: string): boolean;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
    /**
     * Shutdown (alias for destroy)
     */
    shutdown(): Promise<void>;
}
export declare function getMCPToolRouter(): MCPToolRouter;
