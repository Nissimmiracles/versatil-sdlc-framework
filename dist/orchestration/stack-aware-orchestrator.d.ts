/**
 * VERSATIL SDLC Framework - Stack-Aware Orchestrator
 * Optimized for: Cursor / Claude / Supabase / n8n / Vercel / OPERA
 */
import { EventEmitter } from 'events';
import { IsolatedPaths } from './isolated-versatil-orchestrator.js';
export interface StackConfiguration {
    cursor: boolean;
    claude: boolean;
    supabase: boolean;
    n8n: boolean;
    vercel: boolean;
    shadcn: boolean;
    playwright: boolean;
    chromeDevtools: boolean;
}
export interface StackAgent {
    id: string;
    name: string;
    type: string;
    mcp?: string;
    capabilities: string[];
    stackIntegration: string[];
}
export declare class StackAwareOrchestrator extends EventEmitter {
    private logger;
    private paths;
    private stackConfig;
    private ragOrchestrator;
    private stackAgents;
    private mcpClients;
    constructor(paths: IsolatedPaths);
    initialize(): Promise<void>;
    /**
     * Load stack-specific agent definitions
     */
    private loadStackAgents;
    /**
     * Register an agent
     */
    private registerAgent;
    /**
     * Initialize MCP clients for stack components
     */
    private initializeMCPClients;
    /**
     * Parse agents.md file format
     */
    private parseAgentsMD;
    /**
     * Parse agent definitions from markdown
     */
    private parseAgentDefinitions;
    /**
     * Get full context for agents
     */
    getFullContext(): Promise<any>;
    /**
     * Get repository context
     */
    private getRepositoryContext;
    /**
     * Get stack-specific context
     */
    private getStackContext;
    /**
     * Get Supabase-specific context
     */
    private getSupabaseContext;
    /**
     * Get Vercel-specific context
     */
    private getVercelContext;
    /**
     * Get n8n workflow context
     */
    private getN8NContext;
    /**
     * Get development context
     */
    private getDevelopmentContext;
    /**
     * Get agent context
     */
    private getAgentContext;
    /**
     * Check if agent is active based on stack config
     */
    private isAgentActive;
    /**
     * Helper methods for context gathering
     */
    private getGitInfo;
    private getFileStructure;
    private shouldSkipDirectory;
    private getDependencies;
    private getProjectConfig;
    private fileExists;
    private getSupabaseMigrations;
    private getSupabaseEdgeFunctions;
    private getSupabaseSchema;
    private getN8NWorkflows;
    private getDevelopmentPlans;
    private getGitHubIssues;
    private getGitHubPRs;
    private extractTODOs;
    /**
     * Get project context for other orchestrators
     */
    getProjectContext(): Promise<any>;
    /**
     * Get stack status
     */
    getStackStatus(): Promise<any>;
    private testSupabaseConnection;
    private testVercelConnection;
    private testN8NConnection;
    /**
     * Set stack configuration
     */
    setStackConfig(config: Partial<StackConfiguration>): void;
    /**
     * Execute with specific agent
     */
    executeWithAgent(agentId: string, task: any): Promise<any>;
    /**
     * Execute agent via MCP
     */
    private executeViaMCP;
    /**
     * Execute agent directly
     */
    private executeDirectly;
    /**
     * Cleanup
     */
    shutdown(): Promise<void>;
}
