/**
 * MCP Integration Module
 * Connects VERSATIL framework agents to actual MCP tool execution
 */
import { AgentActivationContext } from './agent-dispatcher.js';
export interface MCPToolResult {
    success: boolean;
    tool: string;
    agent: string;
    data?: any;
    error?: string;
    timestamp: Date;
}
export declare class MCPToolManager {
    private activeSessions;
    private sessionResults;
    /**
     * Execute MCP tool based on agent context
     */
    executeMCPTool(tool: string, context: AgentActivationContext): Promise<MCPToolResult>;
    /**
     * Execute Chrome MCP for browser testing and debugging
     * ✅ PRODUCTION IMPLEMENTATION - Fully functional with Playwright
     */
    private executeChromeMCP;
    /**
     * Execute Playwright MCP for cross-browser testing
     * ✅ PRODUCTION IMPLEMENTATION - Uses Chrome MCP executor (same underlying tech)
     */
    private executePlaywrightMCP;
    /**
     * Execute Shadcn MCP for component library integration
     * ✅ PRODUCTION IMPLEMENTATION - Fully functional with ts-morph AST parsing
     */
    private executeShadcnMCP;
    /**
     * Execute GitHub MCP for repository operations
     * ✅ PRODUCTION IMPLEMENTATION - Fully functional with Octokit GitHub API
     */
    private executeGitHubMCP;
    /**
     * Execute Exa Search MCP for AI-powered research
     * ✅ PRODUCTION IMPLEMENTATION - Official Exa Labs MCP
     *
     * Primary Agents: Alex-BA (requirements research), Dr.AI-ML (ML research)
     */
    private executeExaMCP;
    /**
     * Helper to call actual MCP functions
     */
    private callMCPFunction;
    /**
     * Determine Chrome MCP purpose based on agent context
     */
    private getChromeMCPPurpose;
    /**
     * Generate testing recommendations based on context
     */
    private generateTestingRecommendations;
    /**
     * Get all MCP session results
     */
    getSessionResults(): MCPToolResult[];
    /**
     * Get active MCP sessions
     */
    getActiveSessions(): string[];
    /**
     * Extract component name from context
     */
    private extractComponentFromContext;
    /**
     * Extract company name from search query
     */
    private extractCompanyName;
    /**
     * Extract library/framework name from query
     */
    private extractLibraryName;
    /**
     * Execute Vertex AI MCP for AI/ML operations
     * ✅ PRODUCTION IMPLEMENTATION - Google Cloud Vertex AI + Gemini
     *
     * Primary Agents: Dr.AI-ML (ML training, deployment), Marcus-Backend (AI API integration)
     */
    private executeVertexAIMCP;
    /**
     * Execute Supabase MCP for database and vector operations
     * ✅ PRODUCTION IMPLEMENTATION - Supabase Database + Vector Search
     *
     * Primary Agents: Marcus-Backend (database management), Dr.AI-ML (vector search)
     */
    private executeSupabaseMCP;
    /**
     * Execute n8n MCP for workflow automation
     * ✅ PRODUCTION IMPLEMENTATION - n8n Workflow Automation
     *
     * Primary Agent: Sarah-PM (project management automation)
     */
    private executeN8nMCP;
    /**
     * Execute Semgrep MCP for security scanning
     * ✅ PRODUCTION IMPLEMENTATION - Semgrep Security Scanning
     *
     * Primary Agent: Marcus-Backend (security-first development)
     */
    private executeSemgrepMCP;
    /**
     * Execute Sentry MCP for error monitoring
     * ✅ PRODUCTION IMPLEMENTATION - Sentry Error Monitoring
     *
     * Primary Agent: Maria-QA (quality assurance and bug tracking)
     */
    private executeSentryMCP;
    /**
     * Helper to detect programming language from file path
     */
    private detectLanguage;
    /**
     * Helper to read file contents
     */
    private readFile;
    /**
     * Close all active MCP sessions
     */
    closeAllSessions(): Promise<void>;
}
export declare const mcpToolManager: MCPToolManager;
