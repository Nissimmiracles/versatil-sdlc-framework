/**
 * VERSATIL SDLC Framework - Isolated Orchestrator
 * Ensures complete separation between framework and user projects
 */
import { EventEmitter } from 'events';
export interface IsolatedPaths {
    framework: {
        root: string;
        agents: string;
        memory: string;
        plans: string;
        logs: string;
        config: string;
    };
    project: {
        root: string;
        src: string;
        config: string;
        versatilConfig: string;
    };
}
export declare class IsolatedVERSATILOrchestrator extends EventEmitter {
    private logger;
    private versatilRoot;
    private projectRoot;
    private paths;
    private mcpServers;
    private stackOrchestrator;
    private planOrchestrator;
    private githubSync;
    constructor(projectRoot?: string);
    /**
     * Validate that framework and project are properly isolated
     */
    private validateIsolation;
    /**
     * Setup completely isolated path structure
     */
    private setupIsolatedPaths;
    /**
     * Initialize all framework components in isolated environment
     */
    initialize(): Promise<void>;
    /**
     * Ensure all framework directories exist in user's home
     */
    private ensureFrameworkDirectories;
    /**
     * Load project configuration without modifying project
     */
    private loadProjectConfig;
    /**
     * Create default project configuration
     */
    private createDefaultProjectConfig;
    /**
     * Start MCP servers with complete port isolation
     */
    private startIsolatedMCPServers;
    /**
     * Apply project configuration
     */
    private applyProjectConfig;
    /**
     * Execute goal with complete isolation
     */
    executeGoal(goal: string, options?: any): Promise<any>;
    /**
     * Gather full context while respecting isolation
     */
    private gatherFullContext;
    /**
     * Cleanup and shutdown
     */
    shutdown(): Promise<void>;
}
