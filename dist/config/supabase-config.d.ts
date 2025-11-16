/**
 * VERSATIL SDLC Framework - Supabase Configuration System
 *
 * Environment-based configuration for Supabase Vector Store with automatic
 * embedding provider selection, edge function URL management, and production settings.
 */
import { SupabaseRAGConfig } from '../agents/supabase-agent-integration.js';
export interface SupabaseEnvironmentConfig {
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey?: string;
    openaiApiKey?: string;
    useLocalEmbeddings?: boolean;
    embeddingModel?: string;
    mariaRagUrl?: string;
    jamesRagUrl?: string;
    marcusRagUrl?: string;
    maxRetries?: number;
    retryDelay?: number;
    cacheSize?: number;
    batchSize?: number;
    enableLearning?: boolean;
    enableCollaboration?: boolean;
    enableMonitoring?: boolean;
    enableFallback?: boolean;
    patternQualityThreshold?: number;
    solutionEffectivenessThreshold?: number;
    similarityThreshold?: number;
    environment?: 'development' | 'staging' | 'production';
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
export declare class SupabaseConfig {
    private static instance;
    private config;
    private logger;
    private isInitialized;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): SupabaseConfig;
    /**
     * Load configuration from environment variables and defaults
     */
    private loadConfiguration;
    /**
     * Validate configuration and log warnings for missing values
     */
    private validateConfiguration;
    /**
     * Get configuration for a specific agent
     */
    getAgentConfig(_agentId: string): SupabaseRAGConfig;
    /**
     * Get edge function URL for specific agent
     */
    getEdgeFunctionUrl(agentId: string): string | undefined;
    /**
     * Get embedding provider configuration
     */
    getEmbeddingConfig(): {
        provider: 'openai' | 'local';
        apiKey?: string;
        model: string;
        useLocal: boolean;
    };
    /**
     * Get performance configuration
     */
    getPerformanceConfig(): {
        maxRetries: number;
        retryDelay: number;
        cacheSize: number;
        batchSize: number;
        thresholds: {
            patternQuality: number;
            solutionEffectiveness: number;
            similarity: number;
        };
    };
    /**
     * Check if Supabase is properly configured
     */
    isSupabaseConfigured(): boolean;
    /**
     * Check if embeddings are properly configured
     */
    isEmbeddingConfigured(): boolean;
    /**
     * Get complete configuration (for debugging)
     */
    getFullConfig(): SupabaseEnvironmentConfig;
    /**
     * Update configuration at runtime (for testing)
     */
    updateConfig(updates: Partial<SupabaseEnvironmentConfig>): void;
    /**
     * Reset configuration to environment defaults
     */
    resetConfig(): void;
    /**
     * Get configuration status for health checks
     */
    getConfigStatus(): {
        isConfigured: boolean;
        embeddingProvider: string;
        environment: string;
        featuresEnabled: string[];
        missingRequirements: string[];
    };
    private parseBoolean;
    private isValidUrl;
}
export declare const supabaseConfig: SupabaseConfig;
export declare function createSupabaseConfigForAgent(agentId: string): SupabaseRAGConfig;
export declare function getSupabaseConfigStatus(): any;
