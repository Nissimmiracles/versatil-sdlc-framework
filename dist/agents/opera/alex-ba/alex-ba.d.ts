/**
 * VERSATIL SDLC Framework - Alex BA (Business Analyst)
 * Specialized in requirements analysis, user stories, acceptance criteria
 *
 * RAG-Enhanced: Learns from requirements patterns, user story templates, business rules
 */
import { RAGEnabledAgent, RAGConfig } from '../../core/rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import { AnalysisResult } from '../../../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class AlexBa extends RAGEnabledAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * BA-specific RAG configuration
     * Focus on requirements patterns, user story templates, business rules
     */
    protected getDefaultRAGConfig(): RAGConfig;
    /**
     * BA-specific pattern analysis
     */
    protected runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Override activate to add BA-specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Assess requirements formality (low/medium/high)
     */
    private assessRequirementsFormality;
    /**
     * Generate BA-specific suggestions from RAG context
     */
    private generateBASuggestions;
    /**
     * Determine which agents to hand off to
     */
    private determineHandoffs;
    /**
     * Get base prompt template for BA
     */
    protected getBasePromptTemplate(): string;
    /**
     * Generate domain-specific handoffs based on analysis
     */
    protected generateDomainHandoffs(analysis: AnalysisResult): string[];
    /**
     * NEW v6.1: Initialize PRD template
     */
    initializePRD(options: {
        projectName: string;
        outputPath?: string;
    }): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }>;
    /**
     * NEW v6.1: Initialize BRD template
     */
    initializeBRD(options: {
        projectName: string;
        outputPath?: string;
    }): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }>;
    /**
     * NEW v6.1: Initialize User Story template
     */
    initializeUserStory(options: {
        storyId: string;
        epicName?: string;
        outputPath?: string;
    }): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }>;
}
