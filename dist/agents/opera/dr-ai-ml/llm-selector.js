/**
 * VERSATIL v6.1 - LLM Selection & Model Recommendation
 *
 * Dr.AI-ML capability: Intelligently recommend which LLM/model to use for specific tasks
 * Integrated with Vertex AI Model Garden for multimodel/multimodal support
 */
import { EventEmitter } from 'events';
export class LLMSelector extends EventEmitter {
    constructor() {
        super();
        this.models = new Map();
        this.initializeModelRegistry();
    }
    /**
     * Initialize model registry with all available LLMs
     */
    initializeModelRegistry() {
        // Anthropic Claude models
        this.registerModel({
            id: 'claude-sonnet-4',
            name: 'Claude Sonnet 4',
            provider: 'anthropic',
            type: 'text',
            capabilities: {
                codeGeneration: true,
                reasoning: true,
                longContext: true,
                streaming: true,
                functionCalling: true
            },
            performance: { speed: 'fast', cost: 'medium', quality: 95 },
            contextWindow: 200000,
            pricing: { input: 3, output: 15 },
            bestFor: ['code-generation', 'agent-reasoning', 'long-context-analysis']
        });
        this.registerModel({
            id: 'claude-opus-4',
            name: 'Claude Opus 4',
            provider: 'anthropic',
            type: 'text',
            capabilities: {
                codeGeneration: true,
                reasoning: true,
                longContext: true,
                streaming: true,
                functionCalling: true
            },
            performance: { speed: 'medium', cost: 'high', quality: 98 },
            contextWindow: 200000,
            pricing: { input: 15, output: 75 },
            bestFor: ['complex-reasoning', 'critical-code', 'research']
        });
        // OpenAI models
        this.registerModel({
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            provider: 'openai',
            type: 'multimodal',
            capabilities: {
                codeGeneration: true,
                reasoning: true,
                vision: true,
                longContext: true,
                streaming: true,
                functionCalling: true
            },
            performance: { speed: 'fast', cost: 'medium', quality: 92 },
            contextWindow: 128000,
            pricing: { input: 10, output: 30 },
            bestFor: ['multimodal-tasks', 'vision-analysis', 'creative-tasks']
        });
        // Google Vertex AI - Gemini models
        this.registerModel({
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            provider: 'vertex-ai',
            type: 'multimodal',
            capabilities: {
                codeGeneration: true,
                reasoning: true,
                vision: true,
                audio: true,
                longContext: true,
                streaming: true,
                functionCalling: true
            },
            performance: { speed: 'fast', cost: 'low', quality: 90 },
            contextWindow: 1000000, // 1M context!
            pricing: { input: 1.25, output: 5 },
            bestFor: ['long-documents', 'multimodal-analysis', 'cost-effective', 'video-analysis']
        });
        this.registerModel({
            id: 'gemini-1.5-flash',
            name: 'Gemini 1.5 Flash',
            provider: 'vertex-ai',
            type: 'multimodal',
            capabilities: {
                codeGeneration: true,
                reasoning: true,
                vision: true,
                audio: true,
                longContext: true,
                streaming: true
            },
            performance: { speed: 'fast', cost: 'low', quality: 85 },
            contextWindow: 1000000,
            pricing: { input: 0.075, output: 0.30 },
            bestFor: ['real-time-tasks', 'high-volume', 'cost-sensitive', 'quick-analysis']
        });
        // Code-specialized models
        this.registerModel({
            id: 'codellama-70b',
            name: 'Code Llama 70B',
            provider: 'huggingface',
            type: 'code',
            capabilities: {
                codeGeneration: true,
                reasoning: true,
                streaming: true
            },
            performance: { speed: 'medium', cost: 'low', quality: 88 },
            contextWindow: 16000,
            bestFor: ['code-completion', 'code-refactoring', 'local-deployment']
        });
        this.registerModel({
            id: 'starcoder2-15b',
            name: 'StarCoder 2 15B',
            provider: 'huggingface',
            type: 'code',
            capabilities: {
                codeGeneration: true,
                streaming: true
            },
            performance: { speed: 'fast', cost: 'low', quality: 82 },
            contextWindow: 16000,
            bestFor: ['code-generation', 'local-ide', 'privacy-sensitive']
        });
        // Embedding models
        this.registerModel({
            id: 'text-embedding-3-large',
            name: 'OpenAI Embeddings Large',
            provider: 'openai',
            type: 'embedding',
            capabilities: {},
            performance: { speed: 'fast', cost: 'low', quality: 95 },
            contextWindow: 8191,
            pricing: { input: 0.13, output: 0 },
            bestFor: ['rag-systems', 'semantic-search', 'clustering']
        });
        console.log(`[LLMSelector] ✅ Initialized ${this.models.size} models`);
    }
    /**
     * Register a model
     */
    registerModel(model) {
        this.models.set(model.id, model);
    }
    /**
     * Recommend best LLM for task
     */
    async recommendLLM(requirements) {
        console.log(`[LLMSelector] 🔍 Finding best model for ${requirements.taskType} task...`);
        const candidates = Array.from(this.models.values());
        const scores = [];
        for (const model of candidates) {
            const result = this.scoreModel(model, requirements);
            scores.push(result);
        }
        // Sort by score
        scores.sort((a, b) => b.score - a.score);
        const best = scores[0];
        const alternatives = scores.slice(1, 4).map(s => s.model);
        // Get Vertex AI config if applicable
        let vertexAIConfig;
        if (best.model.provider === 'vertex-ai') {
            vertexAIConfig = this.getVertexAIConfig(best.model);
        }
        const recommendation = {
            model: best.model,
            score: best.score,
            reasoning: best.reasons,
            alternatives,
            vertexAIConfig
        };
        console.log(`[LLMSelector] ✅ Recommended: ${best.model.name} (score: ${best.score.toFixed(1)})`);
        console.log(`   Reasons: ${best.reasons.join(', ')}`);
        this.emit('recommendation-made', recommendation);
        return recommendation;
    }
    /**
     * Score model against requirements
     */
    scoreModel(model, requirements) {
        let score = 0;
        const reasons = [];
        // Task type match
        switch (requirements.taskType) {
            case 'code':
                if (model.type === 'code' || model.capabilities.codeGeneration) {
                    score += 30;
                    reasons.push('strong code generation');
                }
                break;
            case 'reasoning':
                if (model.capabilities.reasoning) {
                    score += 25;
                    reasons.push('advanced reasoning');
                }
                break;
            case 'vision':
            case 'multimodal':
                if (model.capabilities.vision) {
                    score += 30;
                    reasons.push('multimodal capabilities');
                }
                break;
        }
        // Context size
        if (requirements.contextSize) {
            if (model.contextWindow >= requirements.contextSize) {
                score += 20;
                reasons.push(`large context (${model.contextWindow} tokens)`);
            }
            else {
                score -= 10;
            }
        }
        // Budget constraint
        if (requirements.budgetConstraint) {
            const costMatch = {
                low: model.performance.cost === 'low' ? 15 : model.performance.cost === 'medium' ? 5 : -10,
                medium: model.performance.cost === 'medium' ? 10 : 0,
                high: 5
            };
            score += costMatch[requirements.budgetConstraint];
            if (model.performance.cost === 'low')
                reasons.push('cost-effective');
        }
        // Quality requirement
        if (requirements.qualityRequirement) {
            const qualityMatch = {
                acceptable: model.performance.quality >= 80 ? 10 : 0,
                good: model.performance.quality >= 90 ? 15 : 0,
                excellent: model.performance.quality >= 95 ? 20 : 0
            };
            score += qualityMatch[requirements.qualityRequirement];
            if (model.performance.quality >= 95)
                reasons.push('top-tier quality');
        }
        // Speed requirement
        if (requirements.speedRequirement) {
            const speedMatch = {
                realtime: model.performance.speed === 'fast' ? 15 : -10,
                interactive: model.performance.speed === 'fast' || model.performance.speed === 'medium' ? 10 : 0,
                batch: 5
            };
            score += speedMatch[requirements.speedRequirement];
            if (model.performance.speed === 'fast')
                reasons.push('fast inference');
        }
        // Streaming
        if (requirements.needsStreaming && model.capabilities.streaming) {
            score += 10;
            reasons.push('streaming support');
        }
        return { model, score, reasons };
    }
    /**
     * Get Vertex AI Model Garden configuration
     */
    getVertexAIConfig(model) {
        const projectId = process.env.VERTEX_AI_PROJECT_ID || 'versatil-framework';
        const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
        const multimodalCapabilities = [];
        if (model.capabilities.vision)
            multimodalCapabilities.push('vision');
        if (model.capabilities.audio)
            multimodalCapabilities.push('audio');
        if (model.capabilities.codeGeneration)
            multimodalCapabilities.push('code');
        return {
            modelGardenEndpoint: `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model.id}`,
            projectId,
            location,
            modelId: model.id,
            multimodalCapabilities
        };
    }
    /**
     * Get model by ID
     */
    getModel(id) {
        return this.models.get(id);
    }
    /**
     * Get all models
     */
    getAllModels() {
        return Array.from(this.models.values());
    }
    /**
     * Get models by provider
     */
    getModelsByProvider(provider) {
        return Array.from(this.models.values()).filter(m => m.provider === provider);
    }
    /**
     * Get models by capability
     */
    getModelsByCapability(capability) {
        return Array.from(this.models.values()).filter(m => m.capabilities[capability]);
    }
    /**
     * Compare models
     */
    compareModels(modelIds) {
        const models = modelIds.map(id => this.models.get(id)).filter(Boolean);
        const comparison = {
            contextWindow: models.map(m => ({ name: m.name, value: m.contextWindow })),
            quality: models.map(m => ({ name: m.name, value: m.performance.quality })),
            cost: models.map(m => ({ name: m.name, value: m.performance.cost })),
            speed: models.map(m => ({ name: m.name, value: m.performance.speed })),
            capabilities: models.map(m => ({
                name: m.name,
                capabilities: Object.keys(m.capabilities).filter(k => m.capabilities[k])
            }))
        };
        return { models, comparison };
    }
}
// Export singleton
let _selectorInstance = null;
export function getLLMSelector() {
    if (!_selectorInstance) {
        _selectorInstance = new LLMSelector();
    }
    return _selectorInstance;
}
//# sourceMappingURL=llm-selector.js.map