/**
 * Marcus-Go: Go Backend Specialist
 *
 * Language-specific sub-agent for Go 1.21+ backend development.
 * Specializes in Gin/Echo frameworks, goroutines, and channels.
 *
 * Auto-activates on: go.mod, go.sum, .go files
 *
 * @module marcus-go
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export declare class MarcusGo extends EnhancedMarcus {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    private analyzeGoPatterns;
    private hasMissingErrorHandling;
    private hasGoroutineLeakRisk;
    private hasRaceConditionRisk;
    private isHTTPHandler;
    private hasSQLInjectionRisk;
    private detectGoFramework;
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
}
