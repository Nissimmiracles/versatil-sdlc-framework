/**
 * Exa Search MCP Executor - Official Exa Labs Implementation
 * Uses exa-mcp-server for AI-powered web search and research
 */
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
export interface ExaSearchOptions {
    query: string;
    numResults?: number;
    type?: 'neural' | 'keyword' | 'auto';
    category?: string;
    includeDomains?: string[];
    excludeDomains?: string[];
}
export declare class ExaMCPExecutor {
    private apiKey;
    constructor(apiKey?: string);
    /**
     * Execute Exa MCP action
     */
    executeExaMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Perform web search using Exa AI
     */
    private webSearch;
    /**
     * Research company using Exa AI
     */
    private companyResearch;
    /**
     * Get code context using Exa AI (NEW in 2025)
     */
    private getCodeContext;
    /**
     * Crawl specific URL using Exa AI
     */
    private crawl;
    /**
     * Search LinkedIn using Exa AI
     */
    private linkedinSearch;
}
export declare const exaMCPExecutor: ExaMCPExecutor;
