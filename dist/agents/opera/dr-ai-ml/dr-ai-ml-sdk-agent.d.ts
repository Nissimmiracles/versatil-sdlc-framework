/**
 * Dr.AI-ML SDK Agent
 * SDK-native version of Dr.AI-ML that uses Claude Agent SDK for execution
 * while preserving all existing AI/ML functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
export declare class DrAIMLSDKAgent extends SDKAgentAdapter {
    private legacyAgent;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Dr.AI-ML-specific enhancements
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Detect model architecture
     */
    private detectModelArchitecture;
    /**
     * Detect training pipeline
     */
    private detectTrainingPipeline;
    /**
     * Detect data preprocessing
     */
    private detectDataPreprocessing;
    /**
     * Detect evaluation metrics
     */
    private detectEvaluationMetrics;
    /**
     * Detect deployment patterns
     */
    private detectDeploymentPatterns;
    /**
     * Detect model type
     */
    private detectModelType;
    /**
     * Detect ML framework
     */
    private detectMLFramework;
    /**
     * Assess MLOps maturity level
     */
    private assessMLOpsMaturity;
    /**
     * Generate ML-specific suggestions
     */
    private generateMLSuggestions;
    /**
     * Determine ML-specific handoffs
     */
    private determineMLHandoffs;
    /**
     * Validate model architecture
     */
    validateModelArchitecture(model: any): {
        valid: boolean;
        issues: string[];
    };
    /**
     * Analyze training metrics
     */
    analyzeTrainingMetrics(metrics: any): any;
    /**
     * Assess training stability
     */
    private assessTrainingStability;
    /**
     * Calculate variance
     */
    private calculateVariance;
    /**
     * Generate training recommendations
     */
    private generateTrainingRecommendations;
    /**
     * Generate deployment recommendations
     */
    generateDeploymentRecommendations(deployment: any): any;
    /**
     * Assess model performance
     */
    assessModelPerformance(performance: any): any;
    /**
     * Calculate performance grade
     */
    private calculatePerformanceGrade;
    /**
     * Generate performance recommendations
     */
    private generatePerformanceRecommendations;
}
