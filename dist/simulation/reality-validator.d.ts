/**
 * Reality Validator - The Brutal Truth Engine
 *
 * Executes tests against the live VERSATIL framework to determine
 * what actually works vs what's just impressive architecture.
 *
 * No mercy. No architectural theater. Just brutal honesty.
 */
import { EventEmitter } from 'events';
import { GeneratedTestSuite } from './test-generator.js';
import { SimulationScenario } from '../agents/opera/maria-qa/simulation-qa.js';
export interface ValidationResult {
    scenario: SimulationScenario;
    startTime: Date;
    endTime: Date;
    executionTime: number;
    passed: boolean;
    evidence: ValidationEvidence[];
    error?: string;
    confidence: number;
}
export interface ValidationEvidence {
    type: 'agent_response' | 'mcp_response' | 'file_change' | 'error_message' | 'performance_metric' | 'log_entry';
    timestamp: Date;
    source: string;
    data: any;
    relevant: boolean;
    description: string;
}
export interface LiveFrameworkInterface {
    triggerFileEdit(filePath: string, content: string): Promise<string>;
    callMCPTool(tool: string, params: any): Promise<any>;
    monitorAgentActivation(timeout: number): Promise<any[]>;
    checkFrameworkLogs(duration: number): Promise<string[]>;
    measureResponseTime(action: () => Promise<any>): Promise<{
        result: any;
        duration: number;
    }>;
}
export declare class RealityValidator extends EventEmitter {
    private logger;
    private projectRoot;
    private verssaiRoot;
    private mcpServerPid?;
    private validationResults;
    private frameworkInterface;
    constructor(projectRoot?: string);
    /**
     * Execute validation of generated test suites
     */
    executeValidation(testSuites: GeneratedTestSuite[]): Promise<SimulationScenario[]>;
    /**
     * Validate a single test suite
     */
    private validateTestSuite;
    /**
     * Validate a single scenario
     */
    private validateScenario;
    /**
     * Execute test cases for a scenario
     */
    private executeTestCases;
    /**
     * Execute a specific test case based on its action
     */
    private executeSpecificTest;
    /**
     * Test agent activation functionality
     */
    private testAgentActivation;
    /**
     * Test MCP tool functionality
     */
    private testMCPTool;
    /**
     * Test context preservation between agents
     */
    private testContextPreservation;
    /**
     * Test performance characteristics
     */
    private testPerformance;
    /**
     * Test integration workflow
     */
    private testIntegrationWorkflow;
    /**
     * Test basic functionality
     */
    private testBasicFunctionality;
    /**
     * Collect evidence during test execution
     */
    private collectEvidence;
    /**
     * Evaluate scenario success based on test results and evidence
     */
    private evaluateScenarioSuccess;
    /**
     * Describe behavior based on evidence
     */
    private describeBehavior;
    /**
     * Calculate confidence based on test results and evidence quality
     */
    private calculateConfidence;
    /**
     * Create framework interface for live testing
     */
    private createFrameworkInterface;
    /**
     * Generate appropriate test content for file extension
     */
    private generateTestContent;
    /**
     * Get default parameters for MCP tools
     */
    private getDefaultMCPParams;
    /**
     * Check if log entry is relevant to scenario
     */
    private isLogRelevant;
    /**
     * Ensure MCP server is running for tests
     */
    private ensureMCPServerRunning;
    /**
     * Generate validation summary
     */
    private generateValidationSummary;
    /**
     * Summarize results by category
     */
    private summarizeByCategory;
    /**
     * Extract category from feature name
     */
    private extractCategory;
    /**
     * Export validation results
     */
    exportResults(filePath?: string): Promise<string>;
    /**
     * Generate export summary
     */
    private generateExportSummary;
}
