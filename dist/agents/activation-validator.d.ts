/**
 * Activation Validator
 *
 * Real-time validation of agent activation logic.
 * Provides utilities for testing triggers, patterns, and routing accuracy.
 *
 * @module activation-validator
 * @version 1.0.0
 */
export interface TriggerTest {
    testId: string;
    agentId: string;
    filePath: string;
    content: string;
    expectedActivation: boolean;
    expectedSubAgent?: string;
}
export interface TriggerValidationResult {
    testId: string;
    passed: boolean;
    actualActivation: boolean;
    expectedActivation: boolean;
    actualSubAgent?: string;
    expectedSubAgent?: string;
    latency: number;
    message: string;
}
export declare class ActivationValidator {
    private static readonly FILE_PATTERN_TRIGGERS;
    private static readonly CODE_PATTERN_TRIGGERS;
    /**
     * Validate file pattern trigger
     */
    static validateFilePattern(agentId: string, filePath: string): boolean;
    /**
     * Validate code content trigger
     */
    static validateCodePattern(agentId: string, content: string): boolean;
    /**
     * Validate agent activation
     */
    static validateActivation(test: TriggerTest): Promise<TriggerValidationResult>;
    /**
     * Validate sub-agent routing
     */
    static validateSubAgentRouting(test: TriggerTest, projectPath: string): Promise<TriggerValidationResult>;
    /**
     * Run batch validation tests
     */
    static runBatchTests(tests: TriggerTest[], projectPath?: string): Promise<{
        totalTests: number;
        passedTests: number;
        failedTests: number;
        accuracy: number;
        averageLatency: number;
        results: TriggerValidationResult[];
    }>;
    /**
     * Generate comprehensive validation report
     */
    static generateValidationReport(batchResult: Awaited<ReturnType<typeof this.runBatchTests>>): string;
    /**
     * Get all available agents
     */
    static getAllAgentIds(): string[];
    /**
     * Get trigger patterns for agent
     */
    static getAgentTriggers(agentId: string): {
        filePatterns: RegExp[];
        codePatterns: string[];
    };
}
export declare const SAMPLE_VALIDATION_TESTS: Record<string, TriggerTest[]>;
