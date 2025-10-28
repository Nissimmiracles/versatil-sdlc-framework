/**
 * Adaptive Agent Creator
 * Automatically creates new specialized agents when specific patterns/needs are detected
 */
import { VERSATILAgentDispatcher } from './agent-dispatcher.js';
export interface AgentCreationTrigger {
    patternType: 'technology' | 'domain' | 'workflow' | 'error_pattern';
    detectedPattern: string;
    frequency: number;
    confidence: number;
    suggestedAgent: AgentTemplate;
}
export interface AgentTemplate {
    name: string;
    role: string;
    specialization: string;
    triggers: {
        filePatterns: string[];
        keywords: string[];
        technologies: string[];
    };
    mcpTools: string[];
    collaborators: string[];
    priority: number;
}
export declare class AdaptiveAgentCreator {
    private patternDetector;
    private agentTemplates;
    private dispatcher;
    constructor(dispatcher: VERSATILAgentDispatcher);
    /**
     * Analyze project patterns and suggest/create new agents
     */
    analyzeProjectNeeds(projectPath: string): Promise<AgentCreationTrigger[]>;
    /**
     * Automatically create agent if pattern confidence is high enough
     */
    createAgentIfNeeded(trigger: AgentCreationTrigger): Promise<boolean>;
    /**
     * Initialize pre-defined agent templates for common patterns
     */
    private initializeAgentTemplates;
    /**
     * Detect technology/domain patterns in project
     */
    private detectPatterns;
    /**
     * Evaluate if pattern warrants agent creation
     */
    private evaluatePatternForAgentCreation;
    private calculatePatternConfidence;
    private readPackageJson;
    /**
     * Get list of available agent templates
     */
    getAvailableTemplates(): AgentTemplate[];
    /**
     * Create custom agent template
     */
    createCustomTemplate(template: AgentTemplate): void;
}
export declare const adaptiveAgentCreator: AdaptiveAgentCreator;
