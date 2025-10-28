/**
 * VERSATIL SDLC Framework - Agent Orchestrator Layer
 *
 * Coordinates the three-tier intelligence system:
 * - Level 1: Pattern Analysis (no AI needed)
 * - Level 2: Prompt Generation (for IDE execution)
 * - Level 3: Optional AI API (when configured)
 */
import { AnalysisResult } from './pattern-analyzer.js';
import { GeneratedPrompt } from './prompt-generator.js';
import { AIIntegration } from './ai-integration.js';
import { EnhancedVectorMemoryStore, MemoryDocument } from '../rag/enhanced-vector-memory-store.js';
export interface FileContext {
    filePath: string;
    content: string;
    language?: string;
    projectName?: string;
    userRequest?: string;
}
export interface RAGContext {
    similarPatterns: MemoryDocument[];
    relevantSolutions: MemoryDocument[];
    projectConventions: MemoryDocument[];
    agentExpertise: MemoryDocument[];
}
export interface OrchestrationResult {
    agent: string;
    filePath: string;
    level1: AnalysisResult;
    level2: GeneratedPrompt;
    level3?: any;
    ragContext?: RAGContext;
    mode: 'patterns-only' | 'prompt-ready' | 'ai-enhanced' | 'rag-enhanced';
    nextSteps: string[];
    executionRecommendation: string;
}
export declare class AgentOrchestrator {
    private agentRegistry;
    private aiIntegration;
    private vectorMemoryStore?;
    private ragEnabled;
    constructor(aiIntegration?: AIIntegration, vectorMemoryStore?: EnhancedVectorMemoryStore);
    /**
     * Orchestrate complete analysis for a file with RAG-enhanced intelligence
     */
    analyzeFile(context: FileContext): Promise<OrchestrationResult>;
    /**
     * Retrieve RAG context for enhanced analysis
     */
    private retrieveRAGContext;
    /**
     * Create a semantic query from file content
     */
    private createSemanticQuery;
    /**
     * Store successful patterns and solutions back to vector memory
     */
    private storeSuccessfulPatterns;
    /**
     * Detect framework from code content
     */
    private detectFramework;
    /**
     * Select appropriate agent based on file context
     */
    private selectAgent;
    /**
     * Run pattern analysis based on agent (enhanced with RAG context)
     */
    private runPatternAnalysis;
    /**
     * Detect programming language from file path
     */
    private detectLanguage;
    /**
     * Determine next steps based on analysis (enhanced with RAG insights)
     */
    private determineNextSteps;
    /**
     * Get execution recommendation for user (enhanced with RAG context)
     */
    private getExecutionRecommendation;
    /**
     * Get AI integration status
     */
    getAIStatus(): {
        available: boolean;
        model?: string;
        mode: string;
    };
    /**
     * Batch analyze multiple files
     */
    analyzeFiles(contexts: FileContext[]): Promise<OrchestrationResult[]>;
    /**
     * Get agent information
     */
    getAgentInfo(agentId: string): {
        id: string;
        name: string;
        specialization: string;
    };
    /**
     * List all available agents
     */
    listAgents(): any;
}
/**
 * Create orchestrator with environment configuration and optional RAG support
 */
export declare function createOrchestrator(vectorMemoryStore?: EnhancedVectorMemoryStore): AgentOrchestrator;
/**
 * Create RAG-enhanced orchestrator with vector memory
 */
export declare function createRAGOrchestrator(vectorMemoryStore: EnhancedVectorMemoryStore): AgentOrchestrator;
