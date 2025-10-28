/**
 * VERSATIL SDLC Framework - Dr.AI-ML (AI/ML Specialist)
 * Specialized in ML model development, training, deployment, MLOps
 *
 * RAG-Enhanced: Learns from model architectures, training patterns, deployment strategies
 */
import { RAGEnabledAgent, RAGConfig } from './rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from './base-agent.js';
import { AnalysisResult } from '../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export declare class DrAiMl extends RAGEnabledAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * AI/ML-specific RAG configuration
     * Focus on model architectures, training patterns, deployment strategies
     */
    protected getDefaultRAGConfig(): RAGConfig;
    /**
     * AI/ML-specific pattern analysis
     */
    protected runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Override activate to add AI/ML-specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Extract evaluation metrics from content
     */
    private extractEvaluationMetrics;
    /**
     * Generate AI/ML-specific suggestions from RAG context
     */
    private generateMLSuggestions;
    /**
     * Determine which agents to hand off to
     */
    private determineHandoffs;
    /**
     * Get base prompt template for AI/ML
     */
    protected getBasePromptTemplate(): string;
    /**
     * Generate domain-specific handoffs based on analysis
     */
    protected generateDomainHandoffs(analysis: AnalysisResult): string[];
}
