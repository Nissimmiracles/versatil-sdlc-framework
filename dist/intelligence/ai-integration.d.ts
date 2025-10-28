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
    level1: any;
    level2: GeneratedPrompt;
    level3?: AIResponse;
    mode: 'patterns-only' | 'prompt-ready' | 'ai-enhanced';
    recommendation: string;
}
export declare class AIIntegration {
    private config;
    private apiAvailable;
    constructor(config?: AIConfig);
    /**
     * Execute analysis with appropriate level based on configuration
     */
    executeAnalysis(level1Result: any, level2Prompt: GeneratedPrompt): Promise<AnalysisResponse>;
    /**
     * Call Claude API (optional integration)
     */
    private callClaudeAPI;
    /**
     * Get recommendation based on mode
     */
    private getRecommendation;
    /**
     * Check if AI API is available
     */
    isAvailable(): boolean;
    /**
     * Get configuration status
     */
    getStatus(): {
        available: boolean;
        model?: string;
        mode: string;
    };
    /**
     * Estimate cost for API call (optional)
     */
    estimateCost(promptLength: number): {
        estimated: boolean;
        costUSD?: number;
    };
}
/**
 * Create AI integration from environment variables
 */
export declare function createFromEnv(): AIIntegration;
