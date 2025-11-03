/**
 * Guardian SDK Agent
 * SDK-native version of Guardian that validates agent outputs for hallucinations
 * Uses existing OutputValidator utility for validation logic
 */
import { SDKAgentAdapter } from './sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import type { OutputValidationReport } from '../guardian/output-validator.js';
import type { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
export interface GuardianConfig {
    vectorStore?: EnhancedVectorMemoryStore;
    blockOnInaccuracy?: boolean;
    autoCorrect?: boolean;
    maxRegenerationAttempts?: number;
}
export declare class GuardianSDKAgent extends SDKAgentAdapter {
    private config;
    private validator;
    constructor(config?: GuardianConfig);
    /**
     * Validate agent output for hallucinations
     * This is the PRIMARY use case - called by other agents post-generation
     */
    validateAgentOutput(output: string, sourceAgent: string, context?: Partial<AgentActivationContext>): Promise<OutputValidationReport>;
    /**
     * Override activate to add Guardian-specific validation workflow
     * Note: Guardian typically isn't activated via SDK directly,
     * but this allows Guardian to validate its OWN responses
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Store validation results in RAG for learning
     * Pattern: Similar to how agents learn from interactions
     */
    private storeValidationForLearning;
    /**
     * Check if output should be validated based on context
     * Pattern: Similar to Maria's hasConfigurationInconsistencies check
     */
    shouldValidateOutput(context: Partial<AgentActivationContext>): boolean;
    /**
     * Generate correction prompt for flywheel regeneration
     * Pattern: Similar to how agents handle handoffs with context
     */
    generateCorrectionPrompt(originalOutput: string, validation: OutputValidationReport, originalContext: Partial<AgentActivationContext>): string;
    /**
     * Extract agent name (utility method)
     */
    extractAgentName(text: string): string;
}
