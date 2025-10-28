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
    private analyzePythonPatterns;
    private hasTypeHints;
    private isFunctionDefinition;
    private hasSQLInjectionRisk;
    private detectPythonFramework;
    protected getDefaultRAGConfig(): {
        agentDomain: string;
        maxExamples: number;
        similarityThreshold: number;
        enableLearning: boolean;
    };
}
