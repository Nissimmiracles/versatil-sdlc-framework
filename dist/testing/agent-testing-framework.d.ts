/**
 * VERSATIL SDLC Framework - Comprehensive Agent Testing Framework
 *
 * Tests all enhanced OPERA agents against the configuration validation scenarios
 * identified in the Enhanced Maria analysis, including the VERSSAI Brain Route Bug
 * and other cross-file consistency issues.
 */
import { AgentRegistry } from '../agents/core/agent-registry.js';
export interface TestScenario {
    id: string;
    name: string;
    description: string;
    testType: 'configuration' | 'navigation' | 'integration' | 'security' | 'performance';
    severity: 'critical' | 'high' | 'medium' | 'low';
    mockContent: string;
    filePath: string;
    expectedIssues: string[];
    expectedRecommendations: string[];
    targetAgents: string[];
}
export interface TestResult {
    scenario: string;
    agent: string;
    passed: boolean;
    issues: string[];
    recommendations: string[];
    score: number;
    executionTime: number;
    errors: string[];
}
export declare class AgentTestingFramework {
    private testScenarios;
    private testResults;
    private agentRegistry;
    constructor(agentRegistry: AgentRegistry);
    /**
     * Load test fixture from file system
     */
    private loadFixture;
    private initializeTestScenarios;
    /**
     * Run all tests against all applicable agents
     */
    runAllTests(): Promise<TestResult[]>;
    /**
     * Run a single test scenario against a specific agent
     */
    private runSingleTest;
    private extractIssuesFromResponse;
    private extractRecommendationsFromResponse;
    /**
     * Generate comprehensive test report
     */
    private generateTestReport;
    private getAgentStatistics;
    private getScenarioTypeStatistics;
    /**
     * Run tests for a specific scenario
     */
    runScenarioTests(scenarioId: string): Promise<TestResult[]>;
    /**
     * Get all test scenarios (async to support lazy loading)
     */
    getTestScenarios(): Promise<TestScenario[]>;
    /**
     * Get test results
     */
    getTestResults(): TestResult[];
}
export declare function getAgentTestingFramework(agentRegistry: AgentRegistry): AgentTestingFramework;
