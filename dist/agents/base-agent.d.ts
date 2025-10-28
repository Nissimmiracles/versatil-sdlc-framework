import { AgentResponse, AgentActivationContext, ValidationResults, Issue, Recommendation } from '../types.js';
export { AgentResponse, AgentActivationContext, ValidationResults, Issue, Recommendation };
export declare abstract class BaseAgent {
    name: string;
    id: string;
    specialization: string;
    abstract systemPrompt: string;
    constructor(id?: string, specialization?: string);
    abstract activate(context: AgentActivationContext): Promise<AgentResponse>;
    protected runStandardValidation(context: AgentActivationContext): Promise<ValidationResults>;
    protected runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>>;
    protected generateStandardRecommendations(results: ValidationResults): Recommendation[];
    protected calculateStandardPriority(results: ValidationResults): string;
    analyze(context: AgentActivationContext): Promise<AgentResponse>;
    runTests(context: AgentActivationContext): Promise<any>;
    analyzeArchitecture(context: AgentActivationContext): Promise<any>;
    manageDeployment(context: AgentActivationContext): Promise<any>;
    protected analyzeCrossFileConsistency(context: AgentActivationContext): Record<string, string>;
    protected hasConfigurationInconsistencies(context: any): boolean;
    protected mergeValidationResults(target: ValidationResults, source: ValidationResults): void;
    protected extractAgentName(id: string): string;
    protected getScoreEmoji(score: number): string;
    /**
     * AST-based TODO/FIXME detection using ts-morph
     */
    private detectTODOsWithAST;
    /**
     * Agent-specific warm-up method (can be overridden)
     */
    warmUp(): Promise<void>;
    /**
     * Load agent-specific configuration
     */
    protected loadAgentConfiguration(): Promise<void>;
    /**
     * Initialize caching layer
     */
    protected initializeCache(): Promise<void>;
    /**
     * Precompile patterns and rules
     */
    protected precompilePatterns(): Promise<void>;
}
