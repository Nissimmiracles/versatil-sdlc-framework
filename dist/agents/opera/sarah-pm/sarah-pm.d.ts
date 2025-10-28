/**
 * VERSATIL SDLC Framework - Sarah PM (Project Manager)
 * Specialized in sprint planning, milestone tracking, team coordination
 *
 * RAG-Enhanced: Learns from project patterns, sprint velocity, team dynamics
 */
import { RAGEnabledAgent, RAGConfig } from '../../core/rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import { AnalysisResult } from '../../../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class SarahPm extends RAGEnabledAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * PM-specific RAG configuration
     * Focus on project patterns, sprint velocity, team dynamics
     */
    protected getDefaultRAGConfig(): RAGConfig;
    /**
     * PM-specific pattern analysis
     */
    protected runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Override activate to add PM-specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Generate PM-specific suggestions from RAG context
     */
    private generatePMSuggestions;
    /**
     * Determine which agents to hand off to
     */
    private determineHandoffs;
    /**
     * Get base prompt template for PM
     */
    protected getBasePromptTemplate(): string;
    /**
     * Generate domain-specific handoffs based on analysis
     */
    protected generateDomainHandoffs(analysis: AnalysisResult): string[];
    /**
     * NEW v6.1: Initialize Epic template
     */
    initializeEpic(options: {
        epicName: string;
        epicId: string;
        outputPath?: string;
    }): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }>;
    /**
     * NEW v6.1: Initialize Vision document template
     */
    initializeVision(options: {
        projectName: string;
        outputPath?: string;
    }): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }>;
}
