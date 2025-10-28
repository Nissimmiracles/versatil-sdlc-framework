/**
 * VERSATIL SDLC Framework - Complete Integration Tester
 * Comprehensive testing system that validates the entire framework works correctly
 *
 * This tests all components working together:
 * - Auto-agent activation from file changes
 * - Quality gate enforcement preventing issues
 * - Context validation asking clarifying questions
 * - Emergency response cascading agents
 * - MCP tool integration and activation
 * - Cursor-Claude bridge functionality
 */
interface TestResult {
    passed: boolean;
    duration: number;
    details: string;
    errors?: string[];
    warnings?: string[];
    metrics?: Record<string, any>;
}
export interface FrameworkHealthCheck {
    component: string;
    status: 'healthy' | 'degraded' | 'failed' | 'not_initialized';
    details: string;
    metrics: Record<string, any>;
    recommendations?: string[];
}
/**
 * VERSATIL Framework Integration Test System
 * Validates all components work together correctly
 */
declare class FrameworkIntegrationTester {
    private testSuites;
    private testResults;
    private frameworkHealth;
    private isRunning;
    constructor();
    /**
     * Initialize Integration Tester
     */
    private initializeTester;
    /**
     * Setup Test Suites
     */
    private setupTestSuites;
    /**
     * Run All Integration Tests
     */
    runAllTests(): Promise<{
        totalTests: number;
        passed: number;
        failed: number;
        duration: number;
        frameworkHealth: FrameworkHealthCheck[];
        recommendations: string[];
    }>;
    /**
     * Run Framework Health Check
     */
    private runFrameworkHealthCheck;
    /**
     * Individual Test Implementations
     */
    private testFileChangeDetection;
    private testAgentPatternMatching;
    private testAgentActivationPipeline;
    private testDependencyValidation;
    private testTypeScriptErrorDetection;
    private testSecurityValidation;
    private testAutoFixFunctionality;
    private testAmbiguityDetection;
    private testClarificationGeneration;
    private testContextCompleteness;
    private testAgentRecommendation;
    private testEmergencyClassification;
    private testEmergencyAgentCascade;
    private testEmergencyMCPActivation;
    private testEmergencyResolutionWorkflow;
    private testCursorRulesParsing;
    private testAgentInvocationBridge;
    private testBridgeMessageQueue;
    private testMCPToolDetection;
    private testChromeMCPPriority;
    private testAgentMCPMapping;
    private testCompleteDevelopmentWorkflow;
    private testFrameworkEffectiveness;
    private testRealWorldScenario;
    /**
     * Generate Recommendations Based on Test Results
     */
    private generateRecommendations;
    /**
     * Setup Test Environment
     */
    private setupTestEnvironment;
    /**
     * Public API Methods
     */
    getTestResults(): Map<string, TestResult[]>;
    getFrameworkHealth(): FrameworkHealthCheck[];
    isTestRunning(): boolean;
}
export declare const frameworkIntegrationTester: FrameworkIntegrationTester;
export declare function runFrameworkTests(): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    duration: number;
    frameworkHealth: FrameworkHealthCheck[];
    recommendations: string[];
}>;
export declare function getTestResults(): Map<string, TestResult[]>;
export declare function getFrameworkHealth(): FrameworkHealthCheck[];
export {};
