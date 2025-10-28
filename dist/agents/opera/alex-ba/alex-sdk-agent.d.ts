/**
 * Alex-BA SDK Agent
 * SDK-native version of Alex BA that uses Claude Agent SDK for execution
 * while preserving all existing business analysis functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class AlexSDKAgent extends SDKAgentAdapter {
    private legacyAgent;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Alex-specific enhancements
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Detect user story format
     */
    private detectUserStory;
    /**
     * Detect acceptance criteria (Gherkin format)
     */
    private detectAcceptanceCriteria;
    /**
     * Detect business rules
     */
    private detectBusinessRules;
    /**
     * Detect requirements format
     */
    private detectRequirementsFormat;
    /**
     * Detect traceability links
     */
    private detectTraceability;
    /**
     * Assess requirements quality
     */
    private assessRequirementsQuality;
    /**
     * Generate BA-specific suggestions
     */
    private generateBASuggestions;
    /**
     * Determine BA-specific handoffs
     */
    private determineBAHandoffs;
    /**
     * Extract user stories from content
     */
    extractUserStories(content: string): any[];
    /**
     * Extract acceptance criteria
     */
    extractAcceptanceCriteria(content: string): any[];
    /**
     * Extract business rules
     */
    extractBusinessRules(content: string): any[];
    /**
     * Validate user story format
     */
    validateUserStory(story: any): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Generate requirements document
     */
    generateRequirementsDocument(requirements: any): any;
}
