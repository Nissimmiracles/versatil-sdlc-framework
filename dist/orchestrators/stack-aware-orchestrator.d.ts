/**
 * VERSATIL SDLC Framework v1.3.0 - Stack-Aware Orchestrator
 * Focused on: Cursor/Claude/Supabase/n8n/Vercel/OPERA stack
 * With clear framework/project isolation
 */
import { EventEmitter } from 'events';
export interface StackContext {
    cursor: {
        workspace: string;
        config: any;
        extensions: string[];
    };
    claude: {
        apiKey?: string;
        models: string[];
        mcpEndpoints: string[];
    };
    supabase: {
        url: string;
        anonKey: string;
        schema: any;
        edgeFunctions: string[];
    };
    n8n: {
        url: string;
        workflows: any[];
        credentials: string[];
    };
    vercel: {
        projectId: string;
        team?: string;
        env: Record<string, string>;
    };
}
export interface IsolatedPaths {
    framework: {
        root: string;
        agents: string;
        memory: string;
        plans: string;
        logs: string;
        mcpServers: string;
    };
    project: {
        root: string;
        src: string;
        config: string;
        tests: string;
        docs: string;
    };
}
export declare class StackAwareOrchestrator extends EventEmitter {
    private logger;
    private mode;
    private readonly paths;
    private stackIntegrations;
    private mcpServers;
    constructor();
    /**
     * Initialize framework isolation
     */
    private initializeIsolation;
    /**
     * Load stack context without contaminating project
     */
    loadStackContext(): Promise<StackContext>;
    /**
     * Initialize stack integrations
     */
    initializeStackIntegrations(): Promise<void>;
    /**
     * Get full repository context without contamination
     */
    getFullRepositoryContext(): Promise<{
        structure: {
            files: any[];
            directories: any[];
            patterns: any[];
        };
        dependencies: {
            npm: {};
            peer: {};
            dev: {};
        };
        gitInfo: {
            branch: string;
            commits: any[];
            remotes: any[];
        };
        config: any;
        supabase: {
            schema: {};
            migrations: any[];
            edgeFunctions: any[];
        };
        vercel: {
            config: {};
            routes: any[];
            functions: any[];
        };
        ui: {
            components: any[];
            pages: any[];
            tests: any[];
        };
    }>;
    /**
     * Plan-first execution mode
     */
    processGoal(goal: any): Promise<any>;
    /**
     * Create plan following context engineering patterns
     */
    private createPlan;
    /**
     * Present plan for human review
     */
    private presentPlanForReview;
    /**
     * Execute plan with safeguards
     */
    private executeWithSafeguards;
    private ensureDirectory;
    private saveConfig;
    private loadProjectConfig;
    private storeInFrameworkMemory;
    private initializeClaudeMCP;
    private initializeSupabase;
    private initializeN8N;
    private initializeVercel;
    private initializeShadcnMCP;
    private initializePlaywrightMCP;
    private initializeChromeMCP;
    private scanProjectStructure;
    private analyzeDependencies;
    private getGitInfo;
    private loadCursorConfig;
    private getCursorExtensions;
    private loadSupabaseSchema;
    private getEdgeFunctions;
    private getSupabaseMigrations;
    private getN8NWorkflows;
    private getVercelConfig;
    private getVercelEnv;
    private getVercelRoutes;
    private getVercelFunctions;
    private getShadcnComponents;
    private getPages;
    private getPlaywrightTests;
    private estimateDuration;
    private assessComplexity;
    private identifyRisks;
    private requestApproval;
    private executePhase;
    private storeExecutionResult;
    private executeRollback;
}
export default StackAwareOrchestrator;
