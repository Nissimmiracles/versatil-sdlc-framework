/**
 * VERSATIL SDLC Framework - Enhanced OPERA Integration
 * Integrates RAG memory and Opera orchestration with existing OPERA agents
 */
import { EventEmitter } from 'events';
import { BaseAgent, AgentResponse } from '../agents/base-agent.js';
import { OperaGoal } from '../opera/opera-orchestrator.js';
export interface EnhancedOPERAConfig {
    ragEnabled: boolean;
    operaEnabled: boolean;
    autonomousMode: boolean;
    memoryDepth: number;
    contextWindowSize: number;
    learningRate: number;
}
export interface OPERAContext {
    projectId: string;
    phase: string;
    activeAgents: string[];
    memory: any[];
    goals: OperaGoal[];
    decisions: any[];
}
export interface EnhancedAgentResponse extends AgentResponse {
    memories?: any[];
    learnings?: any[];
    autonomousActions?: any[];
}
/**
 * Enhanced OPERA Coordinator - Integrates all autonomous capabilities
 */
export declare class EnhancedOPERACoordinator extends EventEmitter {
    private logger;
    private agentRegistry;
    private operaOrchestrator;
    private sdlcOrchestrator;
    private intelligenceManager;
    private config;
    private contexts;
    private enhancedAgents;
    constructor(config?: Partial<EnhancedOPERAConfig>);
    private initialize;
    /**
     * Enhance all OPERA agents with RAG and autonomous capabilities
     */
    private enhanceAgents;
    /**
     * Create an enhanced version of an agent with RAG and autonomous capabilities
     */
    private createEnhancedAgent;
    /**
     * Enhanced agent activation with RAG memory and autonomous capabilities
     */
    private enhancedAgentActivation;
    /**
     * Query agent-specific memories using RAG
     */
    private queryAgentMemory;
    /**
     * Store agent interaction in vector memory
     */
    private storeAgentInteraction;
    /**
     * Check for autonomous actions based on agent response
     */
    private checkAutonomousActions;
    /**
     * Queue autonomous goal for Opera execution
     */
    private queueAutonomousGoal;
    /**
     * Learn from interaction and update agent behavior
     */
    private learnFromInteraction;
    /**
     * Detect actionable patterns from agent interactions
     */
    private detectActionablePatterns;
    /**
     * Find common issues in memories
     */
    private findCommonIssues;
    /**
     * Setup Opera integration
     */
    private setupOperaIntegration;
    /**
     * Create a new OPERA context for a project
     */
    createContext(projectId: string): Promise<OPERAContext>;
    /**
     * Get or create context for a project
     */
    getContext(projectId: string): Promise<OPERAContext>;
    /**
     * Update context phase
     */
    updateContextPhase(projectId: string, phase: string): Promise<void>;
    /**
     * Execute OPERA workflow for a project
     */
    executeOPERAWorkflow(projectId: string, requirements: string): Promise<void>;
    /**
     * Helper methods
     */
    private getFileType;
    private normalizeError;
    private mapActionToGoalType;
    private determinePriority;
    private generateId;
    /**
     * Public API
     */
    /**
     * Get enhanced agent by ID
     */
    getEnhancedAgent(agentId: string): BaseAgent | undefined;
    /**
     * Enable/disable RAG
     */
    setRAGEnabled(enabled: boolean): void;
    /**
     * Enable/disable autonomous mode
     */
    setAutonomousMode(enabled: boolean): void;
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): Promise<any>;
    /**
     * Get memory statistics
     */
    private getMemoryStatistics;
}
export declare const enhancedOPERA: EnhancedOPERACoordinator;
