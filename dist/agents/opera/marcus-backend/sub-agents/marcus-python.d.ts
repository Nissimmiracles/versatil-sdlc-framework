/**
 * Marcus-Python: Python Backend Specialist
 *
 * Language-specific sub-agent for Python 3.11+ backend development.
 * Specializes in FastAPI/Django, async Python, and type hints.
 *
 * Auto-activates on: requirements.txt, pyproject.toml, .py files
 *
 * @module marcus-python
 * @version 6.6.0
 * @parent marcus-backend
 */
import { EnhancedMarcus } from '../enhanced-marcus.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';
export declare class MarcusPython extends EnhancedMarcus {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    analyzePythonPatterns(context: AgentActivationContext): Promise<{
        score: number;
        suggestions: {
            type: string;
            message: string;
            priority: string;
        }[];
        framework: string;
        bestPractices: {
            hasTypeHints: boolean;
            hasAsyncAwait: boolean;
            usesPydantic: boolean;
            hasDependencyInjection: boolean;
        };
    }>;
    private hasTypeHints;
    private isFunctionDefinition;
    private hasSQLInjectionRisk;
    private detectPythonFramework;
    detectSQLInjection(content: string): boolean;
    detectHardcodedSecrets(content: string): boolean;
    detectMissingValidation(content: string): boolean;
    detectUnsafeEval(content: string): boolean;
    detectMissingAuth(content: string): boolean;
    hasDependencyInjection(content: string): boolean;
    hasResponseModel(content: string): boolean;
    hasMissingTypeHints(content: string): boolean;
    hasFieldValidators(content: string): boolean;
    hasAsyncAwait(content: string): boolean;
    hasMissingAwait(content: string): boolean;
    hasBlockingIO(content: string): boolean;
    hasBareExcept(content: string): boolean;
    hasCustomExceptionHandler(content: string): boolean;
    hasMissingSessionManagement(content: string): boolean;
    hasNPlusOne(content: string): boolean;
    hasListComprehension(content: string): boolean;
    hasCaching(content: string): boolean;
    hasDocstring(content: string): boolean;
    hasFStrings(content: string): boolean;
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
}
