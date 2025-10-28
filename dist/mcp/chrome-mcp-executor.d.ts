/**
 * Chrome MCP Executor - Production Implementation
 * Real browser automation using Playwright
 */
import type { ChromeMCPConfig } from './chrome-mcp-config.js';
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
export declare class ChromeMCPExecutor {
    private browser;
    private context;
    private activeSessions;
    private config;
    private consoleMonitor;
    private networkTracker;
    constructor(config?: Partial<ChromeMCPConfig>);
    /**
     * Execute Chrome MCP action
     */
    executeChromeMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Navigate to URL with real browser
     */
    private performNavigation;
    /**
     * Take screenshot and DOM snapshot
     */
    private performSnapshot;
    /**
     * Execute component-specific tests
     */
    private performComponentTest;
    /**
     * Check basic accessibility (simplified)
     */
    private checkAccessibility;
    /**
     * Close browser session
     */
    private performClose;
}
export declare const chromeMCPExecutor: ChromeMCPExecutor;
