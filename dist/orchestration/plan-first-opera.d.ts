/**
 * VERSATIL SDLC Framework - Plan-First Orchestrator
 * Always creates comprehensive plans before execution with human-in-the-loop
 * Based on context engineering patterns
 */
import { EventEmitter } from 'events';
import { IsolatedPaths } from './isolated-versatil-orchestrator.js';
export interface MultiAgentPlan {
    metadata: {
        id: string;
        version: string;
        framework: string;
        timestamp: number;
        goal: string;
        estimatedTime: number;
        risk: 'low' | 'medium' | 'high';
    };
    context: {
        repository: any;
        stack: any;
        dependencies: any;
        constraints: string[];
    };
    phases: PlanPhase[];
    safeguards: {
        requireApproval: string[];
        rollbackPlan: RollbackStrategy;
        testingRequired: boolean;
        dryRunFirst: boolean;
    };
    humanCheckpoints: HumanCheckpoint[];
    outputs: {
        files: string[];
        deployments: string[];
        migrations: string[];
        documentation: string[];
    };
}
export interface PlanPhase {
    phase: string;
    description: string;
    agents: string[];
    tasks: Task[];
    dependencies: string[];
    estimatedDuration: number;
    parallelizable: boolean;
}
export interface Task {
    id: string;
    description: string;
    agent: string;
    inputs: any;
    expectedOutput: any;
    validation: ValidationCriteria;
    riskLevel: 'low' | 'medium' | 'high';
}
export interface ValidationCriteria {
    type: 'test' | 'review' | 'automated' | 'manual';
    criteria: string[];
    required: boolean;
}
export interface HumanCheckpoint {
    afterPhase: string;
    description: string;
    reviewItems: string[];
    approvalRequired: boolean;
    alternatives: string[];
}
export interface RollbackStrategy {
    type: 'git' | 'database' | 'deployment' | 'full';
    steps: string[];
    automated: boolean;
}
export declare class PlanFirstOpera extends EventEmitter {
    private logger;
    private paths;
    private mode;
    private activePlans;
    private safetyConfig;
    constructor(paths: IsolatedPaths);
    initialize(): Promise<void>;
    /**
     * Create a comprehensive plan following context engineering patterns
     */
    createPlan(goal: string, context: any): Promise<MultiAgentPlan>;
    /**
     * Create phases based on goal and analysis
     */
    private createPhases;
    /**
     * Create implementation tasks based on analysis
     */
    private createImplementationTasks;
    /**
     * Identify high-risk actions that require approval
     */
    private identifyHighRiskActions;
    /**
     * Create rollback strategy
     */
    private createRollbackStrategy;
    /**
     * Create human checkpoints
     */
    private createHumanCheckpoints;
    /**
     * Parse goal into structured format
     */
    private parseGoal;
    /**
     * Analyze requirements
     */
    private analyzeRequirements;
    /**
     * Helper methods for analysis
     */
    private inferGoalType;
    private extractFeatures;
    private extractConstraints;
    private assessRisk;
    private identifyDependencies;
    private identifyConstraints;
    private needsDesignPhase;
    private needsDeployment;
    private estimateImplementationTime;
    private canParallelize;
    private breakdownFeatures;
    private assessComplexity;
    private estimateFiles;
    private estimateTests;
    private predictFiles;
    private predictDeployments;
    private predictMigrations;
    private predictDocumentation;
    /**
     * Generate unique plan ID
     */
    private generatePlanId;
    /**
     * Calculate total estimated time
     */
    private calculateEstimatedTime;
    /**
     * Save plan to disk
     */
    private savePlan;
    /**
     * Load saved plans
     */
    private loadSavedPlans;
    /**
     * Load plan templates
     */
    private loadPlanTemplates;
    /**
     * Get active plans
     */
    getActivePlans(): Promise<MultiAgentPlan[]>;
    /**
     * Update safety configuration
     */
    setSafetyConfig(config: any): void;
    /**
     * Switch mode (requires explicit action)
     */
    switchMode(mode: 'plan' | 'execute', authorization?: string): Promise<boolean>;
    /**
     * Execute approved plan
     */
    executeApprovedPlan(planId: string, approval: any): Promise<any>;
    /**
     * Verify approval is valid
     */
    private verifyApproval;
    /**
     * Execute plan with safeguards
     */
    private executePlan;
    /**
     * Cleanup
     */
    shutdown(): Promise<void>;
}
