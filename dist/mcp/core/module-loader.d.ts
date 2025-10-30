/**
 * VERSATIL MCP Module Loader
 * Implements profile-based dynamic module loading with dependency resolution
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { VERSATILLogger } from '../../utils/logger.js';
export interface ModuleDefinition {
    id: string;
    name: string;
    description: string;
    profiles: string[];
    priority: number;
    dependencies: string[];
    lazyTools?: string[];
    version: string;
}
export interface ToolRegistrationOptions {
    lazyTools: string[];
    moduleId: string;
    server: Server | McpServer;
    logger: VERSATILLogger;
}
export interface ModuleLoadResult {
    moduleId: string;
    status: 'success' | 'failed' | 'skipped';
    toolsRegistered: number;
    loadTimeMs: number;
    error?: string;
}
export interface ProfileLoadResult {
    profile: string;
    modulesLoaded: string[];
    toolsRegistered: number;
    totalLoadTimeMs: number;
    errors: string[];
    warnings: string[];
}
export declare const GLOBAL_TOOL_REGISTRY: Map<string, string>;
export declare const MODULE_REGISTRY: ModuleDefinition[];
export declare class ModuleLoader {
    private loadedModules;
    private activeProfile;
    private logger;
    private server;
    private moduleLoadTimes;
    constructor(server: Server | McpServer, logger?: VERSATILLogger);
    /**
     * Load a complete profile (set of modules)
     */
    loadProfile(profileName: string): Promise<ProfileLoadResult>;
    /**
     * Load a single module
     */
    loadModule(moduleId: string): Promise<ModuleLoadResult>;
    /**
     * Unload a module (clear tools, remove from cache)
     */
    unloadModule(moduleId: string): Promise<void>;
    /**
     * Get all modules required for a profile
     */
    private getModulesForProfile;
    /**
     * Topologically sort modules by dependencies + priority
     * Uses Kahn's algorithm for DAG ordering
     */
    private topologicalSort;
    /**
     * Get current profile
     */
    getActiveProfile(): string;
    /**
     * Get loaded modules
     */
    getLoadedModules(): string[];
    /**
     * Get module load statistics
     */
    getLoadStatistics(): Record<string, any>;
    /**
     * Get a loaded module
     */
    getModule(moduleId: string): any;
    /**
     * Check if module is loaded
     */
    isModuleLoaded(moduleId: string): boolean;
    /**
     * Get module definition
     */
    getModuleDefinition(moduleId: string): ModuleDefinition | undefined;
    /**
     * Get all registered tools
     */
    getRegisteredTools(): Map<string, string>;
}
