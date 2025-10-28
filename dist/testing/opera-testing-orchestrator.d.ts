/**
 * OPERA Testing Orchestrator - Agent-Driven UI/UX Testing Workflow
 *
 * Coordinates Enhanced Maria-QA and Enhanced James for comprehensive
 * UI/UX testing with real-time quality feedback and agent handoffs.
 */
export interface UITestingContext {
    filePath?: string;
    changeType: 'component' | 'route' | 'style' | 'configuration';
    affectedComponents?: string[];
    testingSuite: 'unit' | 'integration' | 'e2e' | 'visual' | 'performance';
    qualityGates: {
        visualRegression: boolean;
        performance: boolean;
        accessibility: boolean;
        security: boolean;
    };
}
export interface TestingWorkflowResult {
    success: boolean;
    qualityScore: number;
    agent: string;
    issues: Array<{
        type: 'critical' | 'high' | 'medium' | 'low';
        description: string;
        recommendation: string;
        agent: string;
    }>;
    recommendations: string[];
    nextSteps: string[];
    handoffTo?: string[];
}
export declare class OPERATestingOrchestrator {
    private logger;
    private mariaQA;
    private jamesFrontend;
    private activeWorkflows;
    constructor();
    /**
     * Trigger agent-driven testing workflow based on file changes
     */
    triggerAgentWorkflow(context: UITestingContext): Promise<TestingWorkflowResult>;
    /**
     * Execute Enhanced James frontend analysis
     */
    private executeJamesAnalysis;
    /**
     * Execute Enhanced Maria quality validation
     */
    private executeMariaValidation;
    /**
     * Execute quality gates based on configuration
     */
    private executeQualityGates;
    /**
     * Execute performance quality gate
     */
    private executePerformanceGate;
    /**
     * Execute accessibility quality gate
     */
    private executeAccessibilityGate;
    /**
     * Execute visual regression quality gate
     */
    private executeVisualRegressionGate;
    /**
     * Execute security quality gate
     */
    private executeSecurityGate;
    /**
     * Helper methods
     */
    private calculateQualityScore;
    private convertToWorkflowIssues;
    private determineNextSteps;
    /**
     * Get active workflow status
     */
    getActiveWorkflows(): Array<{
        id: string;
        context: UITestingContext;
    }>;
    /**
     * Cancel workflow
     */
    cancelWorkflow(workflowId: string): boolean;
}
export default OPERATestingOrchestrator;
