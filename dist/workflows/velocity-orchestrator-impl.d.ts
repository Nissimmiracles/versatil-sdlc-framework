/**
 * VERSATIL Framework - VELOCITY Orchestrator Real Implementations
 *
 * This file contains the real implementations of orchestrator phase methods
 * that replace the stubs in velocity-workflow-orchestrator.ts
 *
 * Phase 3 Implementation
 */
export declare class VelocityOrchestratorImpl {
    private ragStore;
    private projectRoot;
    constructor();
    /**
     * Phase 1: PLAN - Real Implementation
     * Calls Alex-BA + research agents in parallel, retrieves RAG context
     */
    invokePlanCommand(target: string): Promise<any>;
    /**
     * Phase 2: ASSESS - Real Implementation
     * Runs actual quality gates and health checks
     */
    invokeAssessCommand(target: string): Promise<any>;
    /**
     * Phase 3: DELEGATE - Real Implementation
     * Assigns todos to agents based on patterns
     */
    invokeDelegateCommand(todos: any[]): Promise<any>;
    /**
     * Phase 4: WORK - Real Implementation
     * Tracks progress (handled by hooks calling `velocity work --update`)
     */
    invokeWorkCommand(context: any): Promise<any>;
    /**
     * Phase 5: CODIFY - Real Implementation
     * Extracts patterns and stores to RAG
     */
    invokeLearnCommand(context: any): Promise<any>;
    /**
     * Query RAG for similar features
     */
    private queryRAGForSimilarFeatures;
    /**
     * Generate basic todos from target description
     */
    private generateTodosFromTarget;
    /**
     * Calculate effort estimates
     */
    private calculateEffortEstimates;
    /**
     * Load relevant templates
     */
    private loadRelevantTemplates;
    /**
     * Check framework health
     */
    private checkFrameworkHealth;
    /**
     * Check git status
     */
    private checkGitStatus;
    /**
     * Check dependencies
     */
    private checkDependencies;
    /**
     * Check database connection
     */
    private checkDatabaseConnection;
    /**
     * Check environment variables
     */
    private checkEnvironmentVariables;
    /**
     * Run quick build check
     */
    private runQuickBuild;
    /**
     * Run quick tests
     */
    private runQuickTests;
    /**
     * Calculate health score from checks
     */
    private calculateHealthScore;
    /**
     * Detect agent for todo based on keywords
     */
    private detectAgentForTodo;
    /**
     * Calculate effort accuracy (estimated vs actual)
     */
    private calculateEffortAccuracy;
}
