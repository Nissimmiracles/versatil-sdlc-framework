/**
 * Test Trigger Matrix
 * Maps file patterns to test types for instinctive testing workflow
 *
 * Version: 1.0.0
 * Purpose: Define automatic test triggers based on file changes
 */
export interface TestTrigger {
    pattern: RegExp;
    testTypes: TestType[];
    agent: string;
    estimatedDuration: number;
    qualityGates: QualityGateRequirements;
    priority: TriggerPriority;
}
export declare enum TestType {
    UNIT = "unit",
    INTEGRATION = "integration",
    STRESS = "stress",
    SECURITY = "security",
    ACCESSIBILITY = "accessibility",
    VISUAL_REGRESSION = "visual_regression",
    CONTRACT = "contract",
    MIGRATION = "migration",
    SCHEMA_VALIDATION = "schema_validation",
    DATA_INTEGRITY = "data_integrity",
    BUILD = "build",
    ENVIRONMENT = "environment",
    META_TEST = "meta_test"
}
export declare enum TriggerPriority {
    CRITICAL = 1,
    HIGH = 2,
    MEDIUM = 3,
    LOW = 4
}
export interface QualityGateRequirements {
    minCoverage: number;
    requirePassingTests: boolean;
    requireSecurityScan: boolean;
    requireAccessibilityScan: boolean;
    minAccessibilityScore?: number;
    allowedFailures?: number;
}
/**
 * Main Test Trigger Matrix
 * Defines automatic test triggers for different file patterns
 */
export declare const TEST_TRIGGER_MATRIX: TestTrigger[];
/**
 * Find test triggers matching a file path
 */
export declare function findTestTriggers(filePath: string): TestTrigger[];
/**
 * Get estimated total test duration for a file
 */
export declare function estimateTestDuration(filePath: string): number;
/**
 * Get all test types required for a file
 */
export declare function getRequiredTestTypes(filePath: string): TestType[];
/**
 * Get quality gate requirements for a file
 */
export declare function getQualityGateRequirements(filePath: string): QualityGateRequirements;
/**
 * Get responsible agent for a file
 */
export declare function getResponsibleAgent(filePath: string): string;
/**
 * Check if file should trigger tests
 */
export declare function shouldTriggerTests(filePath: string): boolean;
export default TEST_TRIGGER_MATRIX;
