import { RAGEnabledAgent, RAGConfig } from '../../core/rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import { AnalysisResult } from '../../../intelligence/pattern-analyzer.js';
import { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class EnhancedDana extends RAGEnabledAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to provide database-specific context
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Database-specific RAG configuration
     */
    protected getDefaultRAGConfig(): RAGConfig;
    /**
     * Run database-specific pattern analysis
     */
    protected runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Override message generation to include agent name
     */
    protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: any): string;
    /**
     * Generate database-specific base prompt template
     */
    protected getBasePromptTemplate(): string;
    /**
     * Generate database-specific handoffs based on analysis
     */
    protected generateDomainHandoffs(analysis: AnalysisResult): string[];
}
export default EnhancedDana;
