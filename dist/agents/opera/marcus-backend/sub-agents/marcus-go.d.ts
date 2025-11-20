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
    analyzeGoPatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: {
            type: string;
            message: string;
            priority: string;
        }[];
        framework: string;
    }>;
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
    hasGoroutine(content: string): boolean;
    hasChannel(content: string): boolean;
    hasSelectStatement(content: string): boolean;
    hasUnbufferedChannelRisk(content: string): boolean;
    hasMissingGoroutineCleanup(content: string): boolean;
    hasWaitGroup(content: string): boolean;
    hasIgnoredError(content: string): boolean;
    hasErrorWrapping(content: string): boolean;
    hasCustomErrorType(content: string): boolean;
    hasPanic(content: string): boolean;
    hasRecover(content: string): boolean;
    hasInterface(content: string): boolean;
    hasTypeAssertion(content: string): boolean;
    hasSlicePreallocation(content: string): boolean;
    hasStringBuilder(content: string): boolean;
    hasStringConcatInLoop(content: string): boolean;
    hasSyncPool(content: string): boolean;
    detectSQLInjection(content: string): boolean;
    hasParameterizedQuery(content: string): boolean;
    hasHardcodedCredentials(content: string): boolean;
    hasCryptoUsage(content: string): boolean;
    hasUnsafePointer(content: string): boolean;
    hasDefer(content: string): boolean;
    hasMissingDefer(content: string): boolean;
    hasContext(content: string): boolean;
    hasContextTimeout(content: string): boolean;
    hasTestFunction(content: string): boolean;
    hasTableDrivenTest(content: string): boolean;
    hasTestHelper(content: string): boolean;
    hasExportedDocumentation(content: string): boolean;
    hasMissingExportedDoc(content: string): boolean;
}
