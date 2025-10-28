/**
 * VERSATIL Environment Manager - Enterprise Grade Multi-Environment System
 * Handles environment detection, switching, and configuration management
 */
export type EnvironmentType = 'development' | 'testing' | 'staging' | 'production';
export interface EnvironmentConfig {
    name: EnvironmentType;
    description: string;
    version: string;
    settings: {
        debug: boolean;
        hotReload: boolean;
        strictValidation: boolean;
        verboseLogging: boolean;
        optimizations?: boolean;
    };
    services: {
        mcp: {
            host: string;
            port: number;
            ssl: boolean;
            autoRestart: boolean;
            watchFiles: boolean;
            healthCheck?: boolean;
            clustering?: boolean;
            workers?: number;
        };
        database: {
            type: string;
            url: string;
            pool: {
                min: number;
                max: number;
            };
            logging: boolean;
            ssl?: boolean;
            migrations?: boolean;
            readReplicas?: boolean;
            connectionTimeout?: number;
            resetOnStart?: boolean;
        };
        supabase: {
            url: string;
            anonKey: string;
            serviceKey: string;
            local: boolean;
            edgeFunctions?: boolean;
            globalDistribution?: boolean;
        };
        opera: {
            enabled: boolean;
            autoUpdate: boolean;
            updateChannel: string;
            maxConcurrentGoals: number;
            timeout: number;
            clustering?: boolean;
            distributedMode?: boolean;
        };
    };
    agents: Record<string, any>;
    testing: Record<string, any>;
    monitoring: Record<string, any>;
    security: Record<string, any>;
    features: Record<string, any>;
    deployment?: Record<string, any>;
    performance?: Record<string, any>;
    compliance?: Record<string, any>;
    backup?: Record<string, any>;
    disaster_recovery?: Record<string, any>;
    cicd?: Record<string, any>;
}
export interface EnvironmentValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
}
export interface EnvironmentHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
        status: 'up' | 'down' | 'degraded';
        responseTime?: number;
        lastCheck: number;
        error?: string;
    }>;
    agents: Record<string, {
        status: 'active' | 'inactive' | 'error';
        lastActivity: number;
        performanceScore?: number;
    }>;
    overallHealth: number;
}
export declare class EnvironmentManager {
    private logger;
    private projectPath;
    private configPath;
    private currentEnvironment;
    private environmentConfig;
    private cachedConfigs;
    constructor(projectPath?: string);
    /**
     * Initialize environment manager
     */
    initialize(): Promise<void>;
    /**
     * Detect current environment from various sources
     */
    private detectEnvironment;
    /**
     * Detect environment from runtime context
     */
    private detectRuntimeContext;
    /**
     * Load environment configuration
     */
    loadEnvironmentConfig(environment?: EnvironmentType): Promise<EnvironmentConfig>;
    /**
     * Process environment variable substitution in config
     */
    private processEnvironmentVariables;
    /**
     * Switch to a different environment
     */
    switchEnvironment(newEnvironment: EnvironmentType): Promise<void>;
    /**
     * Validate current environment configuration
     */
    validateEnvironment(): Promise<EnvironmentValidation>;
    /**
     * Validate production environment specific requirements
     */
    private validateProductionEnvironment;
    /**
     * Validate staging environment specific requirements
     */
    private validateStagingEnvironment;
    /**
     * Validate testing environment specific requirements
     */
    private validateTestingEnvironment;
    /**
     * Validate development environment specific requirements
     */
    private validateDevelopmentEnvironment;
    /**
     * Apply environment configuration to system
     */
    private applyEnvironmentConfig;
    /**
     * Get current environment health status
     */
    getEnvironmentHealth(): Promise<EnvironmentHealth>;
    /**
     * Check individual service health
     */
    private checkServiceHealth;
    /**
     * Check MCP service health
     */
    private checkMCPHealth;
    /**
     * Check database health
     */
    private checkDatabaseHealth;
    /**
     * Check Supabase health
     */
    private checkSupabaseHealth;
    /**
     * Check individual agent health
     */
    private checkAgentHealth;
    /**
     * Get current environment configuration
     */
    getCurrentEnvironment(): EnvironmentType;
    /**
     * Get current environment configuration
     */
    getCurrentConfig(): EnvironmentConfig | null;
    /**
     * Check if environment type is valid
     */
    private isValidEnvironment;
    /**
     * Get available environments
     */
    getAvailableEnvironments(): Promise<EnvironmentType[]>;
    /**
     * Export environment configuration for external use
     */
    exportConfiguration(): any;
}
export declare const environmentManager: EnvironmentManager;
