/**
 * CAG (Cache Augmented Generation) Configuration
 *
 * Centralized configuration for prompt caching across VERSATIL framework.
 * Provides agent-specific strategies and system-wide defaults.
 */
export interface CAGStrategyConfig {
    enabled: boolean;
    cacheTTL: number;
    minPromptSize: number;
    priority: 'high' | 'medium' | 'low';
}
export interface CAGSystemConfig {
    global: {
        enabled: boolean;
        fallbackToNonCached: boolean;
        maxCachedBlocks: number;
        defaultStrategy: 'static' | 'dynamic' | 'adaptive';
    };
    agents: {
        [agentId: string]: CAGStrategyConfig;
    };
    costThresholds: {
        maxDailyCost: number;
        alertThreshold: number;
    };
    performance: {
        minHitRate: number;
        maxLatency: number;
    };
}
/**
 * Default CAG configuration
 */
export declare const DEFAULT_CAG_CONFIG: CAGSystemConfig;
/**
 * Load CAG configuration from environment or use defaults
 */
export declare function loadCAGConfig(): CAGSystemConfig;
/**
 * Get agent-specific CAG configuration
 */
export declare function getAgentCAGConfig(agentId: string): CAGStrategyConfig | null;
/**
 * Validate CAG configuration
 */
export declare function validateCAGConfig(config: CAGSystemConfig): {
    valid: boolean;
    errors: string[];
};
