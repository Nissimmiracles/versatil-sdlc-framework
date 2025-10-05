/**
 * VERSATIL SDLC Framework - Level 3: Optional AI API Integration
 *
 * Provides optional Claude API integration for advanced analysis.
 * Falls back gracefully to Level 1 + Level 2 when API key not configured.
 */

import { GeneratedPrompt } from './prompt-generator.js';

export interface AIConfig {
  apiKey?: string;
  model?: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229';
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  cached: boolean;
}

export interface AnalysisResponse {
  level1: any; // Pattern analysis
  level2: GeneratedPrompt; // Generated prompt
  level3?: AIResponse; // Optional API response
  mode: 'patterns-only' | 'prompt-ready' | 'ai-enhanced';
  recommendation: string;
}

export class AIIntegration {
  private config: AIConfig;
  private apiAvailable: boolean;

  constructor(config: AIConfig = {}) {
    this.config = {
      model: config.model || 'claude-3-5-sonnet-20241022',
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.3,
      enabled: config.enabled !== false,
      ...config
    };

    this.apiAvailable = !!(config.apiKey && config.enabled);
  }

  /**
   * Execute analysis with appropriate level based on configuration
   */
  async executeAnalysis(
    level1Result: any,
    level2Prompt: GeneratedPrompt
  ): Promise<AnalysisResponse> {
    const response: AnalysisResponse = {
      level1: level1Result,
      level2: level2Prompt,
      mode: 'patterns-only',
      recommendation: this.getRecommendation('patterns-only')
    };

    // Check if API is available
    if (!this.apiAvailable) {
      response.mode = 'prompt-ready';
      response.recommendation = this.getRecommendation('prompt-ready');
      return response;
    }

    // Execute AI API call
    try {
      const aiResponse = await this.callClaudeAPI(level2Prompt.prompt);
      response.level3 = aiResponse;
      response.mode = 'ai-enhanced';
      response.recommendation = this.getRecommendation('ai-enhanced');
    } catch (error) {
      console.warn('AI API call failed, falling back to prompt mode:', error);
      response.mode = 'prompt-ready';
      response.recommendation = this.getRecommendation('prompt-ready');
    }

    return response;
  }

  /**
   * Call Claude API (optional integration)
   */
  private async callClaudeAPI(prompt: string): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }

    // Use dynamic import to avoid bundling Anthropic SDK when not needed
    const Anthropic = (await import('@anthropic-ai/sdk' as any)).default;
    const client = new Anthropic({ apiKey: this.config.apiKey });

    const message = await client.messages.create({
      model: this.config.model!,
      max_tokens: this.config.maxTokens!,
      temperature: this.config.temperature!,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    return {
      content: content.text,
      model: message.model,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      },
      cached: false
    };
  }

  /**
   * Get recommendation based on mode
   */
  private getRecommendation(mode: AnalysisResponse['mode']): string {
    switch (mode) {
      case 'patterns-only':
        return '📊 Pattern analysis complete. Configure ANTHROPIC_API_KEY for AI-enhanced analysis, or copy the generated prompt to Claude Code/Cursor for IDE execution.';

      case 'prompt-ready':
        return '🎯 Prompt generated and ready. Execute in Claude Code/Cursor IDE for intelligent analysis, or configure ANTHROPIC_API_KEY for automatic API execution.';

      case 'ai-enhanced':
        return '🤖 AI-enhanced analysis complete with Claude API. Full intelligent review performed automatically.';

      default:
        return 'Analysis complete.';
    }
  }

  /**
   * Check if AI API is available
   */
  isAvailable(): boolean {
    return this.apiAvailable;
  }

  /**
   * Get configuration status
   */
  getStatus(): { available: boolean; model?: string; mode: string } {
    return {
      available: this.apiAvailable,
      model: this.apiAvailable ? this.config.model : undefined,
      mode: this.apiAvailable ? 'ai-enhanced' : 'prompt-orchestration'
    };
  }

  /**
   * Estimate cost for API call (optional)
   */
  estimateCost(promptLength: number): { estimated: boolean; costUSD?: number } {
    if (!this.apiAvailable) {
      return { estimated: false };
    }

    // Claude pricing (approximate)
    const inputCostPer1k = this.config.model?.includes('opus') ? 0.015 : 0.003;
    const outputCostPer1k = this.config.model?.includes('opus') ? 0.075 : 0.015;

    const estimatedInputTokens = promptLength / 4; // rough approximation
    const estimatedOutputTokens = 1000; // average response

    const costUSD =
      (estimatedInputTokens / 1000 * inputCostPer1k) +
      (estimatedOutputTokens / 1000 * outputCostPer1k);

    return {
      estimated: true,
      costUSD: Math.round(costUSD * 1000) / 1000 // round to 3 decimals
    };
  }
}

/**
 * Create AI integration from environment variables
 */
export function createFromEnv(): AIIntegration {
  const config: AIConfig = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: (process.env.CLAUDE_MODEL as any) || 'claude-3-5-sonnet-20241022',
    enabled: process.env.OPERA_MODE !== 'orchestrator-only'
  };

  return new AIIntegration(config);
}