/**
 * VERSATIL SDLC Framework - Supabase Configuration System
 *
 * Environment-based configuration for Supabase Vector Store with automatic
 * embedding provider selection, edge function URL management, and production settings.
 */

import { VERSATILLogger } from '../utils/logger.js';
import { SupabaseRAGConfig } from '../agents/supabase-agent-integration.js';

export interface SupabaseEnvironmentConfig {
  // Core Supabase settings
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey?: string;

  // Embedding provider settings
  openaiApiKey?: string;
  useLocalEmbeddings?: boolean;
  embeddingModel?: string;

  // Edge function URLs
  mariaRagUrl?: string;
  jamesRagUrl?: string;
  marcusRagUrl?: string;

  // Performance settings
  maxRetries?: number;
  retryDelay?: number;
  cacheSize?: number;
  batchSize?: number;

  // Feature flags
  enableLearning?: boolean;
  enableCollaboration?: boolean;
  enableMonitoring?: boolean;
  enableFallback?: boolean;

  // Quality thresholds
  patternQualityThreshold?: number;
  solutionEffectivenessThreshold?: number;
  similarityThreshold?: number;

  // Environment settings
  environment?: 'development' | 'staging' | 'production';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class SupabaseConfig {
  private static instance: SupabaseConfig;
  private config: SupabaseEnvironmentConfig;
  private logger: VERSATILLogger;
  private isInitialized: boolean = false;

  private constructor() {
    this.logger = new VERSATILLogger();
    this.config = this.loadConfiguration();
    this.validateConfiguration();
    this.isInitialized = true;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SupabaseConfig {
    if (!SupabaseConfig.instance) {
      SupabaseConfig.instance = new SupabaseConfig();
    }
    return SupabaseConfig.instance;
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfiguration(): SupabaseEnvironmentConfig {
    const environment = (process.env.NODE_ENV as any) || 'development';

    // Load base configuration
    const config: SupabaseEnvironmentConfig = {
      // Core Supabase (required)
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

      // Embedding providers
      openaiApiKey: process.env.OPENAI_API_KEY,
      useLocalEmbeddings: this.parseBoolean(process.env.USE_LOCAL_EMBEDDINGS, false),
      embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',

      // Edge function URLs (auto-generated if not provided)
      mariaRagUrl: process.env.MARIA_RAG_URL,
      jamesRagUrl: process.env.JAMES_RAG_URL,
      marcusRagUrl: process.env.MARCUS_RAG_URL,

      // Performance settings
      maxRetries: parseInt(process.env.SUPABASE_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.SUPABASE_RETRY_DELAY || '1000'),
      cacheSize: parseInt(process.env.PATTERN_CACHE_SIZE || '100'),
      batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '10'),

      // Feature flags
      enableLearning: this.parseBoolean(process.env.ENABLE_AGENT_LEARNING, true),
      enableCollaboration: this.parseBoolean(process.env.ENABLE_AGENT_COLLABORATION, true),
      enableMonitoring: this.parseBoolean(process.env.ENABLE_RAG_MONITORING, true),
      enableFallback: this.parseBoolean(process.env.ENABLE_RAG_FALLBACK, true),

      // Quality thresholds
      patternQualityThreshold: parseFloat(process.env.PATTERN_QUALITY_THRESHOLD || '0.7'),
      solutionEffectivenessThreshold: parseFloat(process.env.SOLUTION_EFFECTIVENESS_THRESHOLD || '0.6'),
      similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),

      // Environment
      environment,
      logLevel: (process.env.LOG_LEVEL as any) || 'info'
    };

    // Auto-generate edge function URLs if not provided
    if (config.supabaseUrl && !config.mariaRagUrl) {
      config.mariaRagUrl = `${config.supabaseUrl}/functions/v1/maria-rag`;
      config.jamesRagUrl = `${config.supabaseUrl}/functions/v1/james-rag`;
      config.marcusRagUrl = `${config.supabaseUrl}/functions/v1/marcus-rag`;
    }

    // Environment-specific overrides
    if (environment === 'production') {
      config.useLocalEmbeddings = false; // Prefer OpenAI in production for quality
      config.logLevel = 'warn';
      config.enableMonitoring = true;
    } else if (environment === 'development') {
      config.useLocalEmbeddings = !config.openaiApiKey; // Use local if no OpenAI key
      config.logLevel = 'debug';
      config.enableMonitoring = false;
    }

    return config;
  }

  /**
   * Validate configuration and log warnings for missing values
   */
  private validateConfiguration(): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!this.config.supabaseUrl) {
      errors.push('SUPABASE_URL is required');
    }
    if (!this.config.supabaseAnonKey) {
      errors.push('SUPABASE_ANON_KEY is required');
    }

    // Embedding provider validation
    if (!this.config.openaiApiKey && !this.config.useLocalEmbeddings) {
      warnings.push('No OpenAI API key provided, falling back to local embeddings');
      this.config.useLocalEmbeddings = true;
    }

    // Production-specific validations
    if (this.config.environment === 'production') {
      if (!this.config.openaiApiKey) {
        warnings.push('OpenAI API key not set for production environment');
      }
      if (!this.config.supabaseServiceKey) {
        warnings.push('Supabase service role key not set for production');
      }
    }

    // URL validation
    if (this.config.supabaseUrl && !this.isValidUrl(this.config.supabaseUrl)) {
      errors.push('SUPABASE_URL is not a valid URL');
    }

    // Threshold validation
    if (this.config.patternQualityThreshold! < 0 || this.config.patternQualityThreshold! > 1) {
      warnings.push('Pattern quality threshold should be between 0 and 1');
      this.config.patternQualityThreshold = 0.7;
    }

    // Log results
    if (errors.length > 0) {
      this.logger.error('Supabase configuration errors', { errors }, 'supabase-config');
      throw new Error(`Supabase configuration errors: ${errors.join(', ')}`);
    }

    if (warnings.length > 0) {
      this.logger.warn('Supabase configuration warnings', { warnings }, 'supabase-config');
    }

    this.logger.info('Supabase configuration loaded', {
      environment: this.config.environment,
      embeddingProvider: this.config.useLocalEmbeddings ? 'local' : 'openai',
      featuresEnabled: {
        learning: this.config.enableLearning,
        collaboration: this.config.enableCollaboration,
        monitoring: this.config.enableMonitoring
      }
    }, 'supabase-config');
  }

  /**
   * Get configuration for a specific agent
   */
  getAgentConfig(agentId: string): SupabaseRAGConfig {
    return {
      supabaseUrl: this.config.supabaseUrl,
      supabaseKey: this.config.supabaseAnonKey,
      openaiKey: this.config.openaiApiKey,
      useLocalEmbeddings: this.config.useLocalEmbeddings,
      embeddingModel: this.config.embeddingModel,
      enableLearning: this.config.enableLearning,
      enableCollaboration: this.config.enableCollaboration,
      patternQualityThreshold: this.config.patternQualityThreshold,
      solutionEffectivenessThreshold: this.config.solutionEffectivenessThreshold,
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay
    };
  }

  /**
   * Get edge function URL for specific agent
   */
  getEdgeFunctionUrl(agentId: string): string | undefined {
    switch (agentId) {
      case 'enhanced-maria':
        return this.config.mariaRagUrl;
      case 'enhanced-james':
        return this.config.jamesRagUrl;
      case 'enhanced-marcus':
        return this.config.marcusRagUrl;
      default:
        return undefined;
    }
  }

  /**
   * Get embedding provider configuration
   */
  getEmbeddingConfig(): {
    provider: 'openai' | 'local';
    apiKey?: string;
    model: string;
    useLocal: boolean;
  } {
    return {
      provider: this.config.useLocalEmbeddings ? 'local' : 'openai',
      apiKey: this.config.openaiApiKey,
      model: this.config.embeddingModel || 'text-embedding-ada-002',
      useLocal: this.config.useLocalEmbeddings || false
    };
  }

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
  } {
    return {
      maxRetries: this.config.maxRetries || 3,
      retryDelay: this.config.retryDelay || 1000,
      cacheSize: this.config.cacheSize || 100,
      batchSize: this.config.batchSize || 10,
      thresholds: {
        patternQuality: this.config.patternQualityThreshold || 0.7,
        solutionEffectiveness: this.config.solutionEffectivenessThreshold || 0.6,
        similarity: this.config.similarityThreshold || 0.7
      }
    };
  }

  /**
   * Check if Supabase is properly configured
   */
  isSupabaseConfigured(): boolean {
    return !!(this.config.supabaseUrl && this.config.supabaseAnonKey);
  }

  /**
   * Check if embeddings are properly configured
   */
  isEmbeddingConfigured(): boolean {
    return !!(this.config.openaiApiKey || this.config.useLocalEmbeddings);
  }

  /**
   * Get complete configuration (for debugging)
   */
  getFullConfig(): SupabaseEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime (for testing)
   */
  updateConfig(updates: Partial<SupabaseEnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info('Supabase configuration updated', { updates }, 'supabase-config');
  }

  /**
   * Reset configuration to environment defaults
   */
  resetConfig(): void {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
    this.logger.info('Supabase configuration reset', {}, 'supabase-config');
  }

  /**
   * Get configuration status for health checks
   */
  getConfigStatus(): {
    isConfigured: boolean;
    embeddingProvider: string;
    environment: string;
    featuresEnabled: string[];
    missingRequirements: string[];
  } {
    const featuresEnabled = [];
    const missingRequirements = [];

    if (this.config.enableLearning) featuresEnabled.push('learning');
    if (this.config.enableCollaboration) featuresEnabled.push('collaboration');
    if (this.config.enableMonitoring) featuresEnabled.push('monitoring');

    if (!this.config.supabaseUrl) missingRequirements.push('SUPABASE_URL');
    if (!this.config.supabaseAnonKey) missingRequirements.push('SUPABASE_ANON_KEY');
    if (!this.config.openaiApiKey && !this.config.useLocalEmbeddings) {
      missingRequirements.push('OpenAI API key or local embeddings');
    }

    return {
      isConfigured: this.isSupabaseConfigured() && this.isEmbeddingConfigured(),
      embeddingProvider: this.config.useLocalEmbeddings ? 'local' : 'openai',
      environment: this.config.environment || 'unknown',
      featuresEnabled,
      missingRequirements
    };
  }

  // Private helper methods

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const supabaseConfig = SupabaseConfig.getInstance();

// Export configuration factory functions
export function createSupabaseConfigForAgent(agentId: string): SupabaseRAGConfig {
  return supabaseConfig.getAgentConfig(agentId);
}

export function getSupabaseConfigStatus(): any {
  return supabaseConfig.getConfigStatus();
}