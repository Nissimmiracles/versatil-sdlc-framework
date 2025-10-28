/**
 * Autonomous Test Generator - Real-World Scenario Creator
 *
 * Generates comprehensive test suites that validate actual functionality
 * rather than just architectural correctness. Designed to expose vapor-ware.
 */
import { FrameworkPromise } from './feature-mapper.js';
import { SimulationScenario } from '../agents/opera/maria-qa/simulation-qa.js';
export interface GeneratedTestSuite {
    id: string;
    name: string;
    description: string;
    category: string;
    scenarios: SimulationScenario[];
    estimatedDuration: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    prerequisites: string[];
}
export interface TestGenerationConfig {
    includeEdgeCases: boolean;
    includePerformanceTests: boolean;
    includeFailureScenarios: boolean;
    maxTestDuration: number;
    realWorldSimulation: boolean;
}
export declare class TestGenerator {
    private logger;
    private projectRoot;
    private testIdCounter;
    constructor(projectRoot?: string);
    /**
     * Generate comprehensive test suite from framework promises
     */
    generateTestSuite(promises: FrameworkPromise[], config?: TestGenerationConfig): Promise<GeneratedTestSuite[]>;
    /**
     * Generate test suite for a specific category
     */
    private generateCategoryTestSuite;
    /**
     * Generate basic functionality tests for a promise
     */
    private generateBasicFunctionalityTests;
    /**
     * Generate edge case tests for a promise
     */
    private generateEdgeCaseTests;
    /**
     * Generate performance tests for a promise
     */
    private generatePerformanceTests;
    /**
     * Generate failure scenario tests
     */
    private generateFailureTests;
    /**
     * Generate integration test suite
     */
    private generateIntegrationTestSuite;
    /**
     * Generate stress test suite
     */
    private generateStressTestSuite;
    /**
     * Generate test cases from a testable scenario
     */
    private generateTestCasesFromScenario;
    /**
     * Categorize promises by their category
     */
    private categorizePromises;
    /**
     * Estimate test duration for scenarios
     */
    private estimateTestDuration;
    /**
     * Determine priority based on category
     */
    private determinePriority;
    /**
     * Determine prerequisites for test category
     */
    private determinePrerequisites;
    /**
     * Get default test generation configuration
     */
    private getDefaultConfig;
    /**
     * Export generated test suites to file
     */
    exportTestSuites(testSuites: GeneratedTestSuite[], filePath?: string): Promise<string>;
}
