/**
 * VERSATIL MCP Profile Manager
 * Handles profile switching with hot-reload and rollback capabilities
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ModuleLoader } from './module-loader.js';
import { VERSATILLogger } from '../../utils/logger.js';
export interface ProfileConfig {
    version: string;
    description: string;
    profiles: Record<string, ProfileDefinition>;
    agentOverrides?: Record<string, string>;
    profileDetection?: ProfileDetectionConfig;
    performance?: PerformanceTargets;
    compatibility?: CompatibilityConfig;
}
export interface ProfileDefinition {
    description: string;
    modules?: string[];
    extends?: string;
    expectedStartupTime?: string;
    expectedMemoryMB?: number;
    toolCount?: number;
    tools?: string[];
    additionalTools?: string[];
    warning?: string;
}
export interface ProfileDetectionConfig {
    enabled: boolean;
    heuristics?: {
        file_patterns?: Record<string, string>;
        task_keywords?: Record<string, string>;
    };
}
export interface PerformanceTargets {
    startup_target_ms: number;
    memory_target_mb: number;
    tool_latency_target_ms: number;
    profile_switch_target_ms: number;
}
export interface CompatibilityConfig {
    backward_compatible: boolean;
    tool_aliases_enabled: boolean;
    deprecation_window_versions: number;
    migration_guide_url: string;
}
export interface ProfileSwitchResult {
    success: boolean;
    fromProfile: string;
    toProfile: string;
    modulesKept: number;
    modulesUnloaded: number;
    modulesLoaded: number;
    switchTimeMs: number;
    error?: string;
}
export interface AgentContext {
    agent?: string;
    recentFiles?: string[];
    taskKeywords?: string[];
    userPreference?: string;
}
export interface ProfileRecommendation {
    profile: string;
    confidence: number;
    reason: string;
}
export declare class ProfileManager {
    private currentProfile;
    private moduleLoader;
    private switchLock;
    private logger;
    private server;
    private config;
    private configPath;
    constructor(server: Server | McpServer, configPath?: string, logger?: VERSATILLogger);
    /**
     * Initialize profile manager and load configuration
     */
    initialize(): Promise<void>;
    /**
     * Load profile configuration from file
     */
    loadConfiguration(): Promise<void>;
    /**
     * Switch to a new profile with hot-reload
     */
    switchProfile(newProfile: string, force?: boolean): Promise<ProfileSwitchResult>;
    /**
     * Recommend a profile based on context
     */
    recommendProfile(context: AgentContext): Promise<ProfileRecommendation>;
    /**
     * Get modules for a profile (resolves extends)
     */
    private getModulesForProfile;
    /**
     * Unload multiple modules
     */
    private unloadModules;
    /**
     * Simple pattern matching (enhanced glob could be added)
     */
    private matchesPattern;
    /**
     * Timeout helper
     */
    private timeout;
    /**
     * Get current profile
     */
    getCurrentProfile(): string;
    /**
     * Get profile definition
     */
    getProfileDefinition(profileName: string): ProfileDefinition | undefined;
    /**
     * Get all available profiles
     */
    getAvailableProfiles(): string[];
    /**
     * Get profile configuration
     */
    getConfiguration(): ProfileConfig | null;
    /**
     * Get module loader
     */
    getModuleLoader(): ModuleLoader;
    /**
     * Get profile statistics
     */
    getProfileStatistics(): Record<string, any>;
}
