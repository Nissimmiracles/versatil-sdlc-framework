/**
 * VERSATIL SDLC Framework - Multimodal Opera Orchestrator
 * Supports multiple models and modalities for comprehensive understanding
 */
import { EventEmitter } from 'events';
export interface MultimodalContent {
    type: 'text' | 'code' | 'image' | 'diagram' | 'screenshot' | 'mixed';
    content: string;
    data?: string;
    mimeType?: string;
    language?: string;
    annotations?: any[];
}
export interface MultimodalGoal {
    id: string;
    type: 'feature' | 'bug_fix' | 'optimization' | 'refactor' | 'security' | 'visual_design';
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    constraints: string[];
    successCriteria: string[];
    attachments?: MultimodalContent[];
    deadline?: Date;
}
export interface ModelCapability {
    modelId: string;
    modelName: string;
    capabilities: string[];
    modalities: string[];
    contextWindow: number;
    strengths: string[];
}
export declare class MultimodalOperaOrchestrator extends EventEmitter {
    private logger;
    private models;
    private modelSelectionRules;
    constructor();
    private initialize;
    /**
     * Process multimodal goal with appropriate model selection
     */
    processMultimodalGoal(goal: MultimodalGoal): Promise<any>;
    /**
     * Analyze what modalities are needed for the goal
     */
    private analyzeRequiredModalities;
    /**
     * Select best models for the task based on capabilities
     */
    private selectModelsForTask;
    /**
     * Process goal with multiple models
     */
    private processWithModels;
    /**
     * Process with specific model
     */
    private processWithModel;
    /**
     * Build multimodal prompt for model
     */
    private buildMultimodalPrompt;
    /**
     * Synthesize results from multiple models
     */
    private synthesizeMultimodalResults;
    /**
     * Create execution plan considering multimodal aspects
     */
    private createMultimodalExecutionPlan;
    /**
     * Store multimodal context in RAG
     */
    private storeMultimodalContext;
    /**
     * Calculate model fit score
     */
    private calculateModelConfidence;
    private calculateModelFitScore;
    /**
     * Estimate token count for goal
     */
    private estimateTokenCount;
    /**
     * Extract visual requirements from goal
     */
    private extractVisualRequirements;
    /**
     * Plan code generation strategy
     */
    private planCodeGeneration;
    /**
     * Get project context for multimodal processing
     */
    private getProjectContext;
    /**
     * Process screenshot for bug analysis
     */
    analyzeScreenshotForBug(screenshot: string, bugDescription: string): Promise<any>;
    /**
     * Process architecture diagram
     */
    analyzeArchitectureDiagram(diagramSvg: string, requirements: string): Promise<any>;
    private estimateComplexity;
}
export declare const multimodalOpera: MultimodalOperaOrchestrator;
