/**
 * GitHub MCP Executor - Production Implementation
 * Real GitHub API integration using Octokit
 */
import type { GitHubMCPConfig } from './github-mcp-config.js';
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
export declare class GitHubMCPExecutor {
    private octokit;
    private config;
    private cache;
    constructor(config?: Partial<GitHubMCPConfig>);
    /**
     * Execute GitHub MCP action
     */
    executeGitHubMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Analyze GitHub repository
     */
    private analyzeRepository;
    /**
     * Create GitHub issue
     */
    private createIssue;
    /**
     * List GitHub issues
     */
    private listIssues;
    /**
     * Get workflow status
     */
    private getWorkflowStatus;
    /**
     * Generate recommendations based on repository data
     */
    private generateRecommendations;
    /**
     * Cache helpers
     */
    private getFromCache;
    private setCache;
}
export declare const githubMCPExecutor: GitHubMCPExecutor;
