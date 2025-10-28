/**
 * VERSATIL v6.1 - Feedback Integration
 *
 * Integrates GitPRFeedbackAgent with existing framework components
 * to automatically capture user sentiment during agent activations.
 */
import type { AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
/**
 * Initialize feedback collection
 */
export declare function initializeFeedbackCollection(vectorStore?: EnhancedVectorMemoryStore, githubOwner?: string, githubRepo?: string): Promise<void>;
/**
 * Capture feedback from agent activation
 */
export declare function captureAgentFeedback(agentId: string, context: AgentActivationContext, response: AgentResponse, executionTime: number): Promise<void>;
/**
 * Capture feedback from user interaction
 */
export declare function captureUserInteraction(interaction: {
    agentId: string;
    action: string;
    success: boolean;
    errorMessage?: string;
    duration?: number;
    userMessage?: string;
}): Promise<void>;
/**
 * Stop feedback collection
 */
export declare function stopFeedbackCollection(): Promise<void>;
