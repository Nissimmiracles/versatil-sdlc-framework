/**
 * VERSATIL OPERA v6.1 - Evolution Background Task
 *
 * Continuous self-learning and framework evolution through:
 * - Daily research on AI/development best practices
 * - Pattern learning from successful/failed executions
 * - Framework optimization recommendations
 * - Knowledge base enrichment
 * - Task plan execution pattern learning (NEW v6.1)
 *
 * Runs as an SDK Background Task with two schedules:
 * - Daily research: 3 AM (configurable)
 * - Pattern learning: Continuous (triggered by agent executions)
 *
 * Integrates with:
 * - RAGEnabledAgent (pattern storage and retrieval)
 * - FlywheelHealthMonitor (learns from flywheel performance)
 * - ContextSentinel (learns from context patterns)
 * - All OPERA agents (learns from execution patterns)
 * - TaskPlanManager (learns from plan executions) - NEW v6.1
 *
 * @module EvolutionBackgroundTask
 * @version 6.1.0
 */
import { EventEmitter } from 'events';
import type { TaskPlan } from '../planning/task-plan-manager.js';
export interface EvolutionConfig {
    dailyResearch: {
        enabled: boolean;
        scheduleTime: string;
        researchTopics: string[];
        maxResearchDuration: number;
    };
    patternLearning: {
        enabled: boolean;
        minExecutionsForPattern: number;
        successRateThreshold: number;
        autoEnrichment: boolean;
        taskPlanLearning: boolean;
    };
    optimization: {
        enabled: boolean;
        analyzeInterval: number;
        autoApplyRecommendations: boolean;
    };
    integrations: {
        userNotifications: boolean;
        ragStorage: boolean;
        reportGeneration: boolean;
        taskPlanManager?: any;
    };
}
export interface EvolutionStatus {
    running: boolean;
    lastResearch: number;
    lastOptimization: number;
    totalResearches: number;
    totalOptimizations: number;
    patternsLearned: number;
    recommendationsGenerated: number;
    autoOptimizationsApplied: number;
    uptimeSeconds: number;
}
export interface ResearchResult {
    topic: string;
    findings: string[];
    recommendations: string[];
    sources: string[];
    timestamp: number;
    relevanceScore: number;
}
export interface LearnedPattern {
    type: 'success' | 'failure' | 'optimization';
    context: string;
    pattern: string;
    executions: number;
    successRate: number;
    recommendation: string;
    timestamp: number;
    appliedToRAG: boolean;
}
export interface OptimizationRecommendation {
    category: 'performance' | 'reliability' | 'context_efficiency' | 'user_experience';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    autoApplicable: boolean;
    implementation?: string;
    timestamp: number;
}
export interface EvolutionReport {
    period: string;
    researches: ResearchResult[];
    patternsLearned: LearnedPattern[];
    optimizations: OptimizationRecommendation[];
    metrics: {
        frameworkImprovementScore: number;
        learningVelocity: number;
        optimizationImpact: number;
    };
    timestamp: number;
}
export declare class EvolutionBackgroundTask extends EventEmitter {
    private config;
    private status;
    private startTime;
    private researchTimer;
    private optimizationTimer;
    private learningQueue;
    private learnedPatterns;
    private optimizationRecommendations;
    private researchHistory;
    private taskPlanManager?;
    private planExecutionPatterns;
    constructor(config?: Partial<EvolutionConfig>);
    /**
     * Start the evolution background task
     */
    start(): Promise<void>;
    /**
     * Stop the evolution background task
     */
    stop(): Promise<void>;
    /**
     * Schedule daily research at configured time
     */
    private scheduleDailyResearch;
    /**
     * Schedule optimization analysis
     */
    private scheduleOptimizationAnalysis;
    /**
     * Perform daily research on AI/development best practices
     */
    private performDailyResearch;
    /**
     * Simulate research (in real implementation, would use WebFetch)
     */
    private simulateResearch;
    /**
     * Store research results in RAG
     */
    private storeResearchInRAG;
    /**
     * Extract recommendations from research results
     */
    private extractRecommendations;
    /**
     * Perform optimization analysis
     */
    private performOptimizationAnalysis;
    /**
     * Analyze learned patterns for optimizations
     */
    private analyzePatterns;
    /**
     * Analyze flywheel performance for optimizations
     */
    private analyzeFlywheelPerformance;
    /**
     * Analyze context efficiency for optimizations
     */
    private analyzeContextEfficiency;
    /**
     * Apply an optimization recommendation
     */
    private applyOptimization;
    /**
     * Learn from agent execution (called by orchestrator)
     */
    learnFromExecution(execution: {
        agent: string;
        task: string;
        success: boolean;
        duration: number;
        context: string;
    }): Promise<void>;
    /**
     * Enrich RAG with learned pattern
     */
    private enrichRAG;
    /**
     * Generate evolution report
     */
    generateReport(period: 'daily' | 'weekly' | 'monthly'): EvolutionReport;
    /**
     * Calculate framework improvement score (0-100)
     */
    private calculateImprovementScore;
    /**
     * Calculate optimization impact percentage
     */
    private calculateOptimizationImpact;
    /**
     * Get current status
     */
    getStatus(): EvolutionStatus;
    /**
     * Get learned patterns
     */
    getLearnedPatterns(limit?: number): LearnedPattern[];
    /**
     * Get optimization recommendations
     */
    getRecommendations(limit?: number): OptimizationRecommendation[];
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<EvolutionConfig>): void;
    /**
     * NEW v6.1: Setup task plan event listeners
     */
    private setupTaskPlanListeners;
    /**
     * NEW v6.1: Learn from successful plan execution
     */
    learnFromPlanExecution(plan: TaskPlan): Promise<void>;
    /**
     * NEW v6.1: Learn from failed plan execution
     */
    learnFromPlanFailure(plan: TaskPlan, error: Error): Promise<void>;
    /**
     * NEW v6.1: Extract structure pattern from plan
     */
    private extractStructurePattern;
    /**
     * NEW v6.1: Count task hierarchy levels
     */
    private countTaskLevels;
    /**
     * NEW v6.1: Analyze task breakdown effectiveness
     */
    private analyzeTaskBreakdown;
    /**
     * NEW v6.1: Extract collaboration pattern
     */
    private extractCollaborationPattern;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
}
