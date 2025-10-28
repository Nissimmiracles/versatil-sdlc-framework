/**
 * MCP Executor - Bridges VERSATIL framework to actual MCP function calls
 * This module handles the real execution of MCP tools through Claude Code
 */
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
export declare class MCPExecutor {
    /**
     * Execute actual MCP function via Claude Code environment
     */
    executeChromeMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Navigate to VERSSAI application
     */
    private performNavigation;
    /**
     * Take screenshot/snapshot of current page
     */
    private performSnapshot;
    /**
     * Execute component-specific tests
     */
    private performComponentTest;
    /**
     * Close browser session
     */
    private performClose;
}
export declare const mcpExecutor: MCPExecutor;
