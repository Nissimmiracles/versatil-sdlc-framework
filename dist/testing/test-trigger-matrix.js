/**
 * Test Trigger Matrix
 * Maps file patterns to test types for instinctive testing workflow
 *
 * Version: 1.0.0
 * Purpose: Define automatic test triggers based on file changes
 */
export var TestType;
(function (TestType) {
    TestType["UNIT"] = "unit";
    TestType["INTEGRATION"] = "integration";
    TestType["STRESS"] = "stress";
    TestType["SECURITY"] = "security";
    TestType["ACCESSIBILITY"] = "accessibility";
    TestType["VISUAL_REGRESSION"] = "visual_regression";
    TestType["CONTRACT"] = "contract";
    TestType["MIGRATION"] = "migration";
    TestType["SCHEMA_VALIDATION"] = "schema_validation";
    TestType["DATA_INTEGRITY"] = "data_integrity";
    TestType["BUILD"] = "build";
    TestType["ENVIRONMENT"] = "environment";
    TestType["META_TEST"] = "meta_test";
})(TestType || (TestType = {}));
export var TriggerPriority;
(function (TriggerPriority) {
    TriggerPriority[TriggerPriority["CRITICAL"] = 1] = "CRITICAL";
    TriggerPriority[TriggerPriority["HIGH"] = 2] = "HIGH";
    TriggerPriority[TriggerPriority["MEDIUM"] = 3] = "MEDIUM";
    TriggerPriority[TriggerPriority["LOW"] = 4] = "LOW";
})(TriggerPriority || (TriggerPriority = {}));
/**
 * Main Test Trigger Matrix
 * Defines automatic test triggers for different file patterns
 */
export const TEST_TRIGGER_MATRIX = [
    // ========================================
    // API Endpoint Tests
    // ========================================
    {
        pattern: /\.(api|route|controller)\.(ts|js)$/,
        testTypes: [
            TestType.INTEGRATION,
            TestType.STRESS,
            TestType.SECURITY,
            TestType.CONTRACT
        ],
        agent: 'marcus-backend',
        estimatedDuration: 150000, // 2.5 minutes
        qualityGates: {
            minCoverage: 80,
            requirePassingTests: true,
            requireSecurityScan: true,
            requireAccessibilityScan: false,
            allowedFailures: 0
        },
        priority: TriggerPriority.CRITICAL
    },
    {
        pattern: /\/(api|routes|controllers)\//,
        testTypes: [
            TestType.INTEGRATION,
            TestType.STRESS,
            TestType.SECURITY
        ],
        agent: 'marcus-backend',
        estimatedDuration: 180000, // 3 minutes
        qualityGates: {
            minCoverage: 80,
            requirePassingTests: true,
            requireSecurityScan: true,
            requireAccessibilityScan: false
        },
        priority: TriggerPriority.CRITICAL
    },
    // ========================================
    // React Component Tests
    // ========================================
    {
        pattern: /\.(tsx|jsx)$/,
        testTypes: [
            TestType.UNIT,
            TestType.ACCESSIBILITY,
            TestType.VISUAL_REGRESSION,
            TestType.INTEGRATION
        ],
        agent: 'james-frontend',
        estimatedDuration: 120000, // 2 minutes
        qualityGates: {
            minCoverage: 80,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: true,
            minAccessibilityScore: 95
        },
        priority: TriggerPriority.HIGH
    },
    {
        pattern: /\/components\//,
        testTypes: [
            TestType.UNIT,
            TestType.ACCESSIBILITY,
            TestType.VISUAL_REGRESSION
        ],
        agent: 'james-frontend',
        estimatedDuration: 90000, // 1.5 minutes
        qualityGates: {
            minCoverage: 85,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: true,
            minAccessibilityScore: 95
        },
        priority: TriggerPriority.HIGH
    },
    // ========================================
    // Database Schema/Migration Tests
    // ========================================
    {
        pattern: /\.(sql|prisma)$/,
        testTypes: [
            TestType.MIGRATION,
            TestType.SCHEMA_VALIDATION,
            TestType.DATA_INTEGRITY
        ],
        agent: 'dana-database',
        estimatedDuration: 60000, // 1 minute
        qualityGates: {
            minCoverage: 90,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: false,
            allowedFailures: 0
        },
        priority: TriggerPriority.CRITICAL
    },
    {
        pattern: /\/(migrations|prisma|supabase)\//,
        testTypes: [
            TestType.MIGRATION,
            TestType.SCHEMA_VALIDATION,
            TestType.DATA_INTEGRITY
        ],
        agent: 'dana-database',
        estimatedDuration: 90000, // 1.5 minutes
        qualityGates: {
            minCoverage: 90,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: false
        },
        priority: TriggerPriority.CRITICAL
    },
    // ========================================
    // Test File Validation
    // ========================================
    {
        pattern: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
        testTypes: [
            TestType.META_TEST
        ],
        agent: 'maria-qa',
        estimatedDuration: 20000, // 20 seconds
        qualityGates: {
            minCoverage: 0, // Don't enforce coverage on tests themselves
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: false,
            allowedFailures: 0
        },
        priority: TriggerPriority.MEDIUM
    },
    {
        pattern: /\/__tests__\//,
        testTypes: [
            TestType.META_TEST
        ],
        agent: 'maria-qa',
        estimatedDuration: 30000, // 30 seconds
        qualityGates: {
            minCoverage: 0,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: false
        },
        priority: TriggerPriority.MEDIUM
    },
    // ========================================
    // Configuration File Tests
    // ========================================
    {
        pattern: /package\.json$/,
        testTypes: [
            TestType.BUILD,
            TestType.SECURITY
        ],
        agent: 'sarah-pm',
        estimatedDuration: 45000, // 45 seconds
        qualityGates: {
            minCoverage: 0,
            requirePassingTests: true,
            requireSecurityScan: true,
            requireAccessibilityScan: false,
            allowedFailures: 0
        },
        priority: TriggerPriority.HIGH
    },
    {
        pattern: /tsconfig\.json$/,
        testTypes: [
            TestType.BUILD
        ],
        agent: 'sarah-pm',
        estimatedDuration: 30000, // 30 seconds
        qualityGates: {
            minCoverage: 0,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: false,
            allowedFailures: 0
        },
        priority: TriggerPriority.HIGH
    },
    {
        pattern: /\.env/,
        testTypes: [
            TestType.ENVIRONMENT,
            TestType.SECURITY
        ],
        agent: 'sarah-pm',
        estimatedDuration: 15000, // 15 seconds
        qualityGates: {
            minCoverage: 0,
            requirePassingTests: true,
            requireSecurityScan: true,
            requireAccessibilityScan: false,
            allowedFailures: 0
        },
        priority: TriggerPriority.CRITICAL
    },
    // ========================================
    // Style/CSS Tests
    // ========================================
    {
        pattern: /\.(css|scss|less|sass)$/,
        testTypes: [
            TestType.VISUAL_REGRESSION,
            TestType.ACCESSIBILITY
        ],
        agent: 'james-frontend',
        estimatedDuration: 60000, // 1 minute
        qualityGates: {
            minCoverage: 0,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: true,
            minAccessibilityScore: 95
        },
        priority: TriggerPriority.LOW
    },
    // ========================================
    // General TypeScript/JavaScript Files
    // ========================================
    {
        pattern: /\.(ts|js)$/,
        testTypes: [
            TestType.UNIT,
            TestType.INTEGRATION
        ],
        agent: 'maria-qa',
        estimatedDuration: 60000, // 1 minute
        qualityGates: {
            minCoverage: 80,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: false
        },
        priority: TriggerPriority.MEDIUM
    }
];
/**
 * Find test triggers matching a file path
 */
export function findTestTriggers(filePath) {
    return TEST_TRIGGER_MATRIX.filter(trigger => trigger.pattern.test(filePath));
}
/**
 * Get estimated total test duration for a file
 */
export function estimateTestDuration(filePath) {
    const triggers = findTestTriggers(filePath);
    return Math.max(...triggers.map(t => t.estimatedDuration), 0);
}
/**
 * Get all test types required for a file
 */
export function getRequiredTestTypes(filePath) {
    const triggers = findTestTriggers(filePath);
    const testTypes = new Set();
    triggers.forEach(trigger => {
        trigger.testTypes.forEach(type => testTypes.add(type));
    });
    return Array.from(testTypes);
}
/**
 * Get quality gate requirements for a file
 */
export function getQualityGateRequirements(filePath) {
    const triggers = findTestTriggers(filePath);
    if (triggers.length === 0) {
        return {
            minCoverage: 80,
            requirePassingTests: true,
            requireSecurityScan: false,
            requireAccessibilityScan: false
        };
    }
    // Use most strict requirements from all triggers
    return {
        minCoverage: Math.max(...triggers.map(t => t.qualityGates.minCoverage)),
        requirePassingTests: triggers.some(t => t.qualityGates.requirePassingTests),
        requireSecurityScan: triggers.some(t => t.qualityGates.requireSecurityScan),
        requireAccessibilityScan: triggers.some(t => t.qualityGates.requireAccessibilityScan),
        minAccessibilityScore: Math.max(...triggers
            .map(t => t.qualityGates.minAccessibilityScore || 0)
            .filter(s => s > 0)) || undefined,
        allowedFailures: Math.min(...triggers
            .map(t => t.qualityGates.allowedFailures ?? Infinity)
            .filter(f => f !== Infinity)) || undefined
    };
}
/**
 * Get responsible agent for a file
 */
export function getResponsibleAgent(filePath) {
    const triggers = findTestTriggers(filePath);
    if (triggers.length === 0) {
        return 'maria-qa'; // Default to Maria for unknown file types
    }
    // Return highest priority agent
    const sortedTriggers = triggers.sort((a, b) => a.priority - b.priority);
    return sortedTriggers[0].agent;
}
/**
 * Check if file should trigger tests
 */
export function shouldTriggerTests(filePath) {
    // Don't trigger tests for:
    // - Files in node_modules
    // - Hidden files/directories
    // - Build output directories
    // - Framework files
    const excludePatterns = [
        /node_modules\//,
        /\/\./,
        /\/(dist|build|out|.next|.nuxt)\//,
        /\.versatil\//,
        /\.git\//,
        /\.DS_Store$/,
        /\.log$/
    ];
    if (excludePatterns.some(pattern => pattern.test(filePath))) {
        return false;
    }
    return findTestTriggers(filePath).length > 0;
}
export default TEST_TRIGGER_MATRIX;
//# sourceMappingURL=test-trigger-matrix.js.map