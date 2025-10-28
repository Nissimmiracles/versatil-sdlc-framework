/**
 * VERSATIL SDLC Framework - Complete Adaptive Flywheel Orchestrator
 * Orchestrates all SDLC phases with continuous feedback loops
 *
 * Completes the adaptive SDLC flywheel with intelligent phase transitions
 */
import { VERSATILLogger } from '../utils/logger.js';
import { AgentRegistry } from '../agents/core/agent-registry.js';
export interface SDLCPhase {
    id: string;
    name: string;
    description: string;
    agents: string[];
    prerequisites: string[];
    outputs: string[];
    qualityGates: QualityGate[];
    feedback: FeedbackLoop[];
}
export interface QualityGate {
    id: string;
    name: string;
    type: 'automated' | 'manual' | 'hybrid';
    criteria: GateCriteria[];
    blocking: boolean;
    timeout: number;
}
export interface GateCriteria {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number | string;
    description: string;
}
export interface FeedbackLoop {
    id: string;
    source: string;
    target: string;
    type: 'performance' | 'quality' | 'business' | 'user';
    metric: string;
    actionTrigger: string;
    adaptation: string;
}
export interface FlywheelState {
    currentPhase: string;
    phaseProgress: number;
    overallProgress: number;
    qualityScore: number;
    feedbackActive: FeedbackLoop[];
    blockers: string[];
    nextActions: string[];
}
import { EventEmitter } from 'events';
export declare class SDLCOrchestrator extends EventEmitter {
    private phases;
    private currentState;
    private agentRegistry;
    private logger;
    private feedbackHistory;
    constructor();
    initialize(agentRegistry: AgentRegistry, logger: VERSATILLogger): void;
    /**
     * Initialize complete SDLC phases with adaptive feedback
     */
    private initializeSDLCPhases;
    /**
     * Initialize flywheel state
     */
    private initializeState;
    /**
     * Orchestrate SDLC phase transition
     */
    orchestratePhaseTransition(fromPhase: string, toPhase: string, context: any): Promise<any>;
    /**
     * Validate phase transition prerequisites
     */
    private validatePhaseTransition;
    /**
     * Execute quality gates for phase
     */
    private executeQualityGates;
    /**
     * Execute individual quality gate
     */
    private executeQualityGate;
    /**
     * Process feedback loops between phases
     */
    private processFeedbackLoops;
    /**
     * Process individual feedback loop
     */
    private processFeedbackLoop;
    /**
     * Activate agents for phase
     */
    private activatePhaseAgents;
    /**
     * Update flywheel state
     */
    private updateFlywheelState;
    /**
     * Get current flywheel state
     */
    getFlywheelState(): FlywheelState;
    /**
     * Get adaptive insights
     */
    getAdaptiveInsights(): any;
    /**
     * Helper methods
     */
    private isPhaseCompleted;
    private validatePhaseOutput;
    private getMetricValue;
    private getDefaultMetricValue;
    private evaluateCriteria;
    private evaluateTrigger;
    private applyAdaptation;
    private updateQualityThreshold;
    private addFeedbackLoop;
    private modifyPhaseConfiguration;
    private generateNextActions;
    private calculateCompletedPhases;
    private calculateQualityTrend;
    private getAdaptationHistory;
    private generateRecommendations;
    transitionPhase(targetPhase: string, context?: any): Promise<any>;
    runQualityGates(phase?: string): Promise<any>;
    getStatus(): any;
    isHealthy(): boolean;
    getDetailedHealth(): any;
    handleEmergency(type: string, details: any): Promise<any>;
}
