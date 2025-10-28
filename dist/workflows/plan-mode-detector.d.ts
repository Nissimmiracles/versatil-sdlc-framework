/**
 * @fileoverview Plan Mode Detector - Identifies complex tasks requiring Plan Mode
 *
 * Analyzes user requests to determine if Plan Mode should be activated.
 * Complex tasks requiring multi-agent coordination get automatic Plan Mode activation.
 *
 * @module workflows/plan-mode-detector
 * @version 6.5.0
 */
/**
 * Plan Mode detection result
 */
export interface PlanModeDetection {
    /** Should Plan Mode be activated */
    shouldActivate: boolean;
    /** Confidence score (0-100%) */
    confidence: number;
    /** Reasoning for the decision */
    reasoning: string;
    /** Detected complexity indicators */
    complexityIndicators: ComplexityIndicator[];
    /** Estimated task duration in minutes */
    estimatedDuration: number;
    /** Number of agents required */
    agentsRequired: number;
    /** Agent IDs that will be involved */
    involvedAgents: string[];
    /** Risk level of the task */
    riskLevel: 'low' | 'medium' | 'high';
}
/**
 * Complexity indicator
 */
export interface ComplexityIndicator {
    /** Type of complexity */
    type: ComplexityType;
    /** Description */
    description: string;
    /** Weight (0-100) */
    weight: number;
    /** Evidence from the request */
    evidence: string;
}
/**
 * Types of complexity that trigger Plan Mode
 */
export type ComplexityType = 'multi-agent' | 'long-horizon' | 'complex-refactor' | 'full-stack' | 'database-migration' | 'integration' | 'security-critical' | 'performance-critical' | 'multi-phase' | 'high-risk';
/**
 * Task analysis context
 */
export interface TaskAnalysisContext {
    /** User request text */
    request: string;
    /** Current project context */
    projectContext?: {
        stack?: string[];
        dependencies?: string[];
        fileCount?: number;
        hasDatabase?: boolean;
        hasApi?: boolean;
        hasFrontend?: boolean;
    };
    /** User's historical pattern (if available) */
    userHistory?: {
        averageTaskDuration?: number;
        prefersPlanMode?: boolean;
        typicalComplexity?: 'low' | 'medium' | 'high';
    };
    /** Current workspace state */
    workspaceState?: {
        uncommittedChanges?: boolean;
        runningTests?: boolean;
        activeFeatureBranch?: boolean;
    };
}
export declare class PlanModeDetector {
    private logger;
    /** Complexity weights for scoring */
    private complexityWeights;
    /** Threshold for Plan Mode activation (0-100) */
    private activationThreshold;
    constructor();
    /**
     * Detect if Plan Mode should be activated for a given task
     */
    detectPlanMode(context: TaskAnalysisContext): Promise<PlanModeDetection>;
    /**
     * Detect all complexity indicators from the task
     */
    private detectComplexityIndicators;
    /**
     * Count how many agents would be required
     */
    private countAgentRequirements;
    /**
     * Extract evidence for multi-agent requirement
     */
    private extractEvidenceForAgents;
    /**
     * Calculate confidence score from indicators
     */
    private calculateConfidence;
    /**
     * Estimate task duration in minutes
     */
    private estimateDuration;
    /**
     * Identify which agents will be required
     */
    private identifyRequiredAgents;
    /**
     * Assess overall risk level
     */
    private assessRiskLevel;
    /**
     * Generate human-readable reasoning
     */
    private generateReasoning;
    /**
     * Update activation threshold
     */
    setActivationThreshold(threshold: number): void;
    /**
     * Update complexity weight for a specific type
     */
    setComplexityWeight(type: ComplexityType, weight: number): void;
}
export default PlanModeDetector;
