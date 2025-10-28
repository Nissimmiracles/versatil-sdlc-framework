/**
 * VERSATIL SDLC Framework - Enhanced Introspective Agent
 *
 * This agent has FULL access to:
 * - Opera Orchestrator (for autonomous fixes)
 * - RAG Memory Store (for learning and pattern recognition)
 * - Environment Scanner (for context awareness)
 * - All other agents and components
 */
import { BaseAgent } from '../base-agent.js';
import { AgentResponse, AgentActivationContext } from '../agent-types.js';
import { VERSATILLogger } from '../../utils/logger.js';
import { OperaOrchestrator } from '../../opera/opera-orchestrator.js';
import { AgentRegistry } from '../agent-registry.js';
export declare class EnhancedIntrospectiveAgent extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    private logger;
    private opera;
    private agentRegistry;
    private projectContext;
    private enhancedMetrics;
    private errorPatterns;
    private successPatterns;
    private performanceInsights;
    constructor(logger: VERSATILLogger, opera: OperaOrchestrator, agentRegistry: AgentRegistry);
    private initializeEnhancedMonitoring;
    private startContinuousMonitoring;
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Perform comprehensive health check with full context
     */
    private performComprehensiveHealthCheck;
    /**
     * Check framework health with deep inspection
     */
    private checkFrameworkHealth;
    /**
     * Check project health using environment scanner
     */
    private checkProjectHealth;
    /**
     * Check agent performance
     */
    private checkAgentPerformance;
    /**
     * Check memory system efficiency
     */
    private checkMemoryEfficiency;
    /**
     * Check Opera effectiveness
     */
    private checkOperaEffectiveness;
    /**
     * Perform deep analysis with predictions
     */
    private performDeepAnalysis;
    /**
     * Handle file changes with smart analysis
     */
    private handleFileChanges;
    /**
     * Initiate autonomous fix via Opera
     */
    private initiateAutonomousFix;
    /**
     * Learn from goal completion
     */
    private learnFromGoalCompletion;
    /**
     * Analyze goal failure for learning
     */
    private analyzeGoalFailure;
    /**
     * Store health check results in RAG
     */
    private storeHealthCheckResults;
    /**
     * Query similar fixes from memory
     */
    private querySimilarFixes;
    /**
     * Analyze root cause of failure
     */
    private analyzeRootCause;
    /**
     * Get required capabilities for goal type
     */
    private getRequiredCapabilities;
    /**
     * Generate status report
     */
    private getStatusReport;
    private analyzeErrorPatterns;
    private analyzeSuccessPatterns;
    private analyzePerformanceTrends;
    private generatePredictions;
    private generateOptimizations;
    private handleStepFailure;
    private predictPotentialIssues;
    private optimizeFrameworkPerformance;
    private learnFromPattern;
    private analyzeProjectContext;
    private handleFrameworkError;
    private handleQuery;
    private analyzeWithFullContext;
    private initiateEmergencyProtocol;
    private storeProjectHealthInsights;
    private storeDeepAnalysisResults;
    private analyzeChangeImpact;
    private learnFromFileChange;
    private detectFileType;
    private formatResponse;
}
