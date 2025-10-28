/**
 * VERSATIL v6.1 - LLM Selection & Model Recommendation
 *
 * Dr.AI-ML capability: Intelligently recommend which LLM/model to use for specific tasks
 * Integrated with Vertex AI Model Garden for multimodel/multimodal support
 */
import { EventEmitter } from 'events';
export interface LLMModel {
    id: string;
    name: string;
    provider: 'anthropic' | 'openai' | 'google' | 'vertex-ai' | 'huggingface' | 'local';
    type: 'text' | 'multimodal' | 'code' | 'vision' | 'audio' | 'embedding';
    capabilities: {
        codeGeneration?: boolean;
        reasoning?: boolean;
        vision?: boolean;
        audio?: boolean;
        longContext?: boolean;
        streaming?: boolean;
        functionCalling?: boolean;
    };
    performance: {
        speed: 'fast' | 'medium' | 'slow';
        cost: 'low' | 'medium' | 'high';
        quality: number;
    };
    contextWindow: number;
    pricing?: {
        input: number;
        output: number;
    };
    bestFor: string[];
}
export interface TaskRequirements {
    taskType: 'code' | 'text' | 'reasoning' | 'vision' | 'multimodal' | 'analysis';
    domain?: string;
    contextSize?: number;
    needsStreaming?: boolean;
    budgetConstraint?: 'low' | 'medium' | 'high';
    qualityRequirement?: 'acceptable' | 'good' | 'excellent';
    speedRequirement?: 'realtime' | 'interactive' | 'batch';
}
export interface ModelRecommendation {
    model: LLMModel;
    score: number;
    reasoning: string[];
    alternatives: LLMModel[];
    vertexAIConfig?: VertexAIConfig;
}
export interface VertexAIConfig {
    modelGardenEndpoint: string;
    projectId: string;
    location: string;
    modelId: string;
    multimodalCapabilities: string[];
}
export declare class LLMSelector extends EventEmitter {
    private models;
    constructor();
    /**
     * Initialize model registry with all available LLMs
     */
    private initializeModelRegistry;
    /**
     * Register a model
     */
    registerModel(model: LLMModel): void;
    /**
     * Recommend best LLM for task
     */
    recommendLLM(requirements: TaskRequirements): Promise<ModelRecommendation>;
    /**
     * Score model against requirements
     */
    private scoreModel;
    /**
     * Get Vertex AI Model Garden configuration
     */
    private getVertexAIConfig;
    /**
     * Get model by ID
     */
    getModel(id: string): LLMModel | undefined;
    /**
     * Get all models
     */
    getAllModels(): LLMModel[];
    /**
     * Get models by provider
     */
    getModelsByProvider(provider: LLMModel['provider']): LLMModel[];
    /**
     * Get models by capability
     */
    getModelsByCapability(capability: keyof LLMModel['capabilities']): LLMModel[];
    /**
     * Compare models
     */
    compareModels(modelIds: string[]): {
        models: LLMModel[];
        comparison: Record<string, any>;
    };
}
export declare function getLLMSelector(): LLMSelector;
