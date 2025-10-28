/**
 * VERSATIL SDLC Framework - Enhanced Context Validator
 * Implementation of the user's specific enhancement request:
 * "when user add new task the relevant agents need to check task and context clarity
 * before planning and if not clear the agent need to ask questions"
 *
 * This ensures agents understand exactly what needs to be done before starting work
 */
interface TaskContext {
    userRequest: string;
    filePath?: string;
    relatedFiles?: string[];
    projectContext?: ProjectContext;
    previousConversation?: ConversationContext[];
    urgency: 'low' | 'medium' | 'high' | 'emergency';
}
interface ProjectContext {
    framework: string;
    language: string;
    dependencies: string[];
    architecture: string;
    currentFeatures: string[];
    knownIssues: string[];
}
interface ConversationContext {
    timestamp: string;
    userMessage: string;
    agentResponse: string;
    outcome: 'completed' | 'partial' | 'failed' | 'clarification_needed';
}
interface ClarityAssessment {
    overall: 'clear' | 'ambiguous' | 'missing' | 'conflicting';
    confidence: number;
    issues: ClarityIssue[];
    requiredClarifications: ClarificationRequest[];
    recommendedAgents: string[];
    contextSufficiency: 'sufficient' | 'partial' | 'insufficient';
    estimatedComplexity: 'simple' | 'moderate' | 'complex' | 'expert';
}
interface ClarityIssue {
    type: 'ambiguous_reference' | 'missing_specifics' | 'conflicting_requirements' | 'unclear_scope' | 'missing_context';
    severity: 'blocking' | 'critical' | 'major' | 'minor';
    description: string;
    examples?: string[];
    affectedArea?: string;
}
interface ClarificationRequest {
    question: string;
    type: 'specification' | 'scope' | 'technical' | 'priority' | 'context';
    importance: 'must_have' | 'should_have' | 'nice_to_have';
    suggestedAnswers?: string[];
    relatedTo?: string;
}
/**
 * Enhanced Context Validation System
 * Implements intelligent task clarity assessment before agent activation
 */
declare class EnhancedContextValidator {
    private projectContext;
    private conversationHistory;
    private clarityPatterns;
    private domainKnowledge;
    constructor();
    /**
     * Initialize the Enhanced Context Validator
     */
    private initializeValidator;
    /**
     * Main Context Validation Entry Point (User's Enhancement Request)
     */
    validateTaskContext(userRequest: string, additionalContext?: Partial<TaskContext>): Promise<ClarityAssessment>;
    /**
     * Ambiguity Detection - Find vague references and unclear terms
     */
    private detectAmbiguity;
    /**
     * Specification Completeness Check
     */
    private checkSpecificationCompleteness;
    /**
     * Technical Context Validation
     */
    private validateTechnicalContext;
    /**
     * Scope Clarity Assessment
     */
    private assessScopeClarity;
    /**
     * Priority and Urgency Validation
     */
    private validatePriorityContext;
    /**
     * Historical Context Integration
     */
    private integrateHistoricalContext;
    /**
     * Agent Recommendation Based on Clarity
     */
    private recommendAppropriateAgents;
    /**
     * Calculate Overall Clarity Score
     */
    private calculateOverallClarity;
    /**
     * Helper Methods
     */
    private loadProjectContext;
    private loadConversationHistory;
    private initializeClarityPatterns;
    private initializeDomainKnowledge;
    private extractMentionedTechnologies;
    private calculateContextSimilarity;
    /**
     * Public API Methods
     */
    saveConversationContext(userMessage: string, agentResponse: string, outcome: string): Promise<void>;
    getValidatorStatus(): {
        projectContextLoaded: boolean;
        conversationHistorySize: number;
        clarityPatterns: number;
        domainKnowledge: number;
        status: string;
    };
}
export declare const enhancedContextValidator: EnhancedContextValidator;
export declare function validateEnhancedContext(userRequest: string, additionalContext?: Partial<TaskContext>): Promise<ClarityAssessment>;
export declare function saveConversationOutcome(userMessage: string, agentResponse: string, outcome: string): Promise<void>;
export declare function getContextValidatorStatus(): {
    projectContextLoaded: boolean;
    conversationHistorySize: number;
    clarityPatterns: number;
    domainKnowledge: number;
    status: string;
};
export {};
