/**
 * CAG (Cache Augmented Generation) Configuration
 *
 * Centralized configuration for prompt caching across VERSATIL framework.
 * Provides agent-specific strategies and system-wide defaults.
 */

export interface CAGStrategyConfig {
  enabled: boolean;
  cacheTTL: number; // Seconds
  minPromptSize: number; // Minimum tokens to cache
  priority: 'high' | 'medium' | 'low'; // Cache priority for this agent
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
    maxDailyCost: number; // Max daily Anthropic API cost
    alertThreshold: number; // Alert when approaching limit
  };
  performance: {
    minHitRate: number; // Minimum acceptable cache hit rate (%)
    maxLatency: number; // Maximum acceptable latency (ms)
  };
}

/**
 * Default CAG configuration
 */
export const DEFAULT_CAG_CONFIG: CAGSystemConfig = {
  global: {
    enabled: true,
    fallbackToNonCached: true,
    maxCachedBlocks: 3,
    defaultStrategy: 'adaptive'
  },
  agents: {
    // James (Frontend) - High query volume, consistent patterns
    'enhanced-james': {
      enabled: true,
      cacheTTL: 600, // 10 minutes (component patterns stable)
      minPromptSize: 1024,
      priority: 'high'
    },
    // Marcus (Backend) - High query volume, security patterns
    'enhanced-marcus': {
      enabled: true,
      cacheTTL: 900, // 15 minutes (API patterns very stable)
      minPromptSize: 1024,
      priority: 'high'
    },
    // Maria (QA) - Medium query volume, test templates
    'enhanced-maria': {
      enabled: true,
      cacheTTL: 300, // 5 minutes (test scenarios vary)
      minPromptSize: 512,
      priority: 'medium'
    },
    // Dana (Database) - Lower query volume, schema patterns
    'enhanced-dana': {
      enabled: true,
      cacheTTL: 1200, // 20 minutes (schemas very stable)
      minPromptSize: 1024,
      priority: 'medium'
    },
    // Alex (BA) - Moderate query volume, requirements analysis
    'enhanced-alex': {
      enabled: true,
      cacheTTL: 600, // 10 minutes
      minPromptSize: 1024,
      priority: 'medium'
    },
    // Sarah (PM) - Lower query volume, project context
    'enhanced-sarah': {
      enabled: true,
      cacheTTL: 300, // 5 minutes (project state changes frequently)
      minPromptSize: 512,
      priority: 'low'
    },
    // Dr. AI/ML - Lower query volume, ML patterns
    'dr-ai-ml': {
      enabled: true,
      cacheTTL: 1800, // 30 minutes (ML patterns very stable)
      minPromptSize: 2048,
      priority: 'medium'
    },
    // Oliver (MCP) - Medium query volume, integration patterns
    'oliver-mcp': {
      enabled: true,
      cacheTTL: 600, // 10 minutes
      minPromptSize: 1024,
      priority: 'medium'
    }
  },
  costThresholds: {
    maxDailyCost: 10.0, // $10/day max
    alertThreshold: 8.0 // Alert at $8/day
  },
  performance: {
    minHitRate: 70, // 70% minimum cache hit rate
    maxLatency: 2000 // 2 seconds max latency
  }
};

/**
 * Load CAG configuration from environment or use defaults
 */
export function loadCAGConfig(): CAGSystemConfig {
  const config = { ...DEFAULT_CAG_CONFIG };

  // Override from environment variables
  if (process.env.CAG_ENABLED !== undefined) {
    config.global.enabled = process.env.CAG_ENABLED === 'true';
  }

  if (process.env.CAG_MIN_PROMPT_SIZE) {
    const minSize = parseInt(process.env.CAG_MIN_PROMPT_SIZE, 10);
    if (!isNaN(minSize)) {
      // Apply to all agents
      Object.values(config.agents).forEach(agent => {
        agent.minPromptSize = minSize;
      });
    }
  }

  if (process.env.CAG_CACHE_TTL) {
    const ttl = parseInt(process.env.CAG_CACHE_TTL, 10);
    if (!isNaN(ttl)) {
      // Apply to all agents
      Object.values(config.agents).forEach(agent => {
        agent.cacheTTL = ttl;
      });
    }
  }

  if (process.env.CAG_STRATEGY) {
    const strategy = process.env.CAG_STRATEGY as 'static' | 'dynamic' | 'adaptive';
    if (['static', 'dynamic', 'adaptive'].includes(strategy)) {
      config.global.defaultStrategy = strategy;
    }
  }

  if (process.env.CAG_MAX_DAILY_COST) {
    const maxCost = parseFloat(process.env.CAG_MAX_DAILY_COST);
    if (!isNaN(maxCost)) {
      config.costThresholds.maxDailyCost = maxCost;
    }
  }

  return config;
}

/**
 * Get agent-specific CAG configuration
 */
export function getAgentCAGConfig(agentId: string): CAGStrategyConfig | null {
  const config = loadCAGConfig();
  return config.agents[agentId] || null;
}

/**
 * Validate CAG configuration
 */
export function validateCAGConfig(config: CAGSystemConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate global config
  if (config.global.maxCachedBlocks < 1 || config.global.maxCachedBlocks > 5) {
    errors.push('maxCachedBlocks must be between 1 and 5');
  }

  // Validate agent configs
  for (const [agentId, agentConfig] of Object.entries(config.agents)) {
    if (agentConfig.cacheTTL < 60 || agentConfig.cacheTTL > 3600) {
      errors.push(`${agentId}: cacheTTL must be between 60 and 3600 seconds`);
    }

    if (agentConfig.minPromptSize < 256 || agentConfig.minPromptSize > 8192) {
      errors.push(`${agentId}: minPromptSize must be between 256 and 8192 tokens`);
    }
  }

  // Validate cost thresholds
  if (config.costThresholds.maxDailyCost <= 0) {
    errors.push('maxDailyCost must be greater than 0');
  }

  if (config.costThresholds.alertThreshold >= config.costThresholds.maxDailyCost) {
    errors.push('alertThreshold must be less than maxDailyCost');
  }

  // Validate performance thresholds
  if (config.performance.minHitRate < 0 || config.performance.minHitRate > 100) {
    errors.push('minHitRate must be between 0 and 100');
  }

  if (config.performance.maxLatency <= 0) {
    errors.push('maxLatency must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
