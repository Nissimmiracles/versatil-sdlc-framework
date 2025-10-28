/**
 * Playwright MCP Executor - Official Microsoft Implementation
 * Uses @playwright/mcp package for MCP-compliant browser automation
 */
import type { ChromeMCPConfig } from './chrome-mcp-config.js';
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
export declare class PlaywrightMCPExecutor {
    private config;
    private mcpServerProcess;
    constructor(config?: Partial<ChromeMCPConfig>);
    /**
     * Execute Playwright MCP action via official Microsoft server
     */
    executePlaywrightMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Navigate to URL using Playwright MCP
     */
    private navigate;
    /**
     * Click element using Playwright MCP
     */
    private click;
    /**
     * Fill input using Playwright MCP
     */
    private fill;
    /**
     * Take screenshot using Playwright MCP
     */
    private screenshot;
    /**
     * Evaluate JavaScript using Playwright MCP
     */
    private evaluate;
    /**
     * Get accessibility snapshot (Playwright MCP's key feature)
     */
    private accessibilitySnapshot;
    /**
     * Close Playwright MCP session
     */
    private close;
}
export declare const playwrightMCPExecutor: PlaywrightMCPExecutor;
