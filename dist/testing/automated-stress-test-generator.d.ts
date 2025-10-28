/**
 * VERSATIL SDLC Framework - Automated Stress Test Generator
 * Implements Rule 2: Build test cases automatically to stress test development and new features
 *
 * Features:
 * - AI-driven test scenario generation
 * - Load testing automation
 * - Performance regression detection
 * - Chaos engineering scenarios
 * - Resource exhaustion testing
 * - Edge case generation
 * - Integration with Maria-QA agent
 */
import { EventEmitter } from 'events';
import { Priority } from '../orchestration/parallel-task-manager.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
export interface StressTestConfig {
    id: string;
    name: string;
    type: StressTestType;
    target: TestTarget;
    parameters: StressTestParameters;
    scenarios: TestScenario[];
    expectedBehavior: ExpectedBehavior;
    thresholds: PerformanceThresholds;
    duration: number;
    concurrency: number;
    enabled: boolean;
}
export declare enum StressTestType {
    LOAD_TEST = "load_test",
    STRESS_TEST = "stress_test",
    SPIKE_TEST = "spike_test",
    VOLUME_TEST = "volume_test",
    ENDURANCE_TEST = "endurance_test",
    CHAOS_TEST = "chaos_test",
    SECURITY_STRESS = "security_stress",
    MEMORY_LEAK = "memory_leak",
    RESOURCE_EXHAUSTION = "resource_exhaustion",
    INTEGRATION_STRESS = "integration_stress"
}
export interface TestTarget {
    type: TargetType;
    endpoint?: string;
    component?: string;
    service?: string;
    database?: string;
    filesystem?: string;
    network?: string;
}
export declare enum TargetType {
    API_ENDPOINT = "api_endpoint",
    UI_COMPONENT = "ui_component",
    DATABASE = "database",
    FILE_SYSTEM = "file_system",
    NETWORK = "network",
    MEMORY = "memory",
    CPU = "cpu",
    INTEGRATION = "integration",
    END_TO_END = "end_to_end"
}
export interface StressTestParameters {
    users?: number;
    requestsPerSecond?: number;
    dataSize?: number;
    memoryLimit?: number;
    cpuLimit?: number;
    timeoutLimit?: number;
    errorRate?: number;
    retryAttempts?: number;
    customParameters?: Record<string, any>;
}
export interface TestScenario {
    id: string;
    name: string;
    description: string;
    steps: TestStep[];
    weight: number;
    priority: ScenarioPriority;
    expectedOutcome: ScenarioOutcome;
}
export declare enum ScenarioPriority {
    CRITICAL = 1,
    HIGH = 2,
    MEDIUM = 3,
    LOW = 4
}
export interface TestStep {
    action: string;
    parameters: Record<string, any>;
    expectedResult?: any;
    timeout?: number;
    retries?: number;
}
export interface ScenarioOutcome {
    success: boolean;
    errorType?: string;
    recoveryTime?: number;
    resourceUsage?: ResourceUsage;
}
export interface ResourceUsage {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
}
export interface ExpectedBehavior {
    gracefulDegradation: boolean;
    errorHandling: ErrorHandlingExpectation;
    recoverability: RecoverabilityExpectation;
    scalability: ScalabilityExpectation;
}
export interface ErrorHandlingExpectation {
    maxErrorRate: number;
    errorTypes: string[];
    responseTime: number;
    userExperience: UserExperienceLevel;
}
export declare enum UserExperienceLevel {
    EXCELLENT = "excellent",
    GOOD = "good",
    ACCEPTABLE = "acceptable",
    POOR = "poor",
    UNACCEPTABLE = "unacceptable"
}
export interface RecoverabilityExpectation {
    maxDowntime: number;
    autoRecovery: boolean;
    dataConsistency: boolean;
    rollbackCapability: boolean;
}
export interface ScalabilityExpectation {
    maxConcurrentUsers: number;
    responseTimeIncrease: number;
    resourceUtilization: number;
    horizontalScaling: boolean;
}
export interface PerformanceThresholds {
    responseTime: ThresholdConfig;
    throughput: ThresholdConfig;
    errorRate: ThresholdConfig;
    resourceUsage: ResourceThresholds;
}
export interface ThresholdConfig {
    warning: number;
    critical: number;
    unit: string;
}
export interface ResourceThresholds {
    cpu: ThresholdConfig;
    memory: ThresholdConfig;
    network: ThresholdConfig;
    storage: ThresholdConfig;
}
export interface StressTestResult {
    testId: string;
    startTime: Date;
    endTime: Date;
    status: TestStatus;
    metrics: TestMetrics;
    scenarios: ScenarioResult[];
    issues: TestIssue[];
    recommendations: TestRecommendation[];
}
export declare enum TestStatus {
    PASSED = "passed",
    FAILED = "failed",
    WARNING = "warning",
    ERROR = "error",
    CANCELLED = "cancelled"
}
export interface TestMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    resourcePeakUsage: ResourceUsage;
    resourceAverageUsage: ResourceUsage;
}
export interface ScenarioResult {
    scenarioId: string;
    status: TestStatus;
    duration: number;
    iterations: number;
    successRate: number;
    metrics: ScenarioMetrics;
    errors: ScenarioError[];
}
export interface ScenarioMetrics {
    responseTime: {
        min: number;
        max: number;
        avg: number;
        p95: number;
        p99: number;
    };
    throughput: number;
    resourceUsage: ResourceUsage;
}
export interface ScenarioError {
    type: string;
    message: string;
    count: number;
    timestamp: Date;
    stackTrace?: string;
}
export interface TestIssue {
    severity: IssueSeverity;
    category: IssueCategory;
    title: string;
    description: string;
    impact: string;
    recommendation: string;
    evidence: any[];
}
export declare enum IssueSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info"
}
export declare enum IssueCategory {
    PERFORMANCE = "performance",
    RELIABILITY = "reliability",
    SCALABILITY = "scalability",
    SECURITY = "security",
    USABILITY = "usability",
    RESOURCE_USAGE = "resource_usage"
}
export interface TestRecommendation {
    priority: Priority;
    category: RecommendationCategory;
    title: string;
    description: string;
    implementation: string;
    estimatedImpact: ImpactLevel;
    estimatedEffort: EffortLevel;
}
export declare enum RecommendationCategory {
    OPTIMIZATION = "optimization",
    SCALING = "scaling",
    CACHING = "caching",
    DATABASE = "database",
    INFRASTRUCTURE = "infrastructure",
    CODE_IMPROVEMENT = "code_improvement",
    MONITORING = "monitoring"
}
export declare enum ImpactLevel {
    VERY_HIGH = "very_high",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    MINIMAL = "minimal"
}
export declare enum EffortLevel {
    MINIMAL = "minimal",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export declare class AutomatedStressTestGenerator extends EventEmitter {
    private environmentManager;
    private vectorStore?;
    private testConfigs;
    private activeTests;
    private testHistory;
    private aiPatterns;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Generate stress tests automatically based on codebase analysis
     */
    generateStressTests(target: TestTarget, features?: string[]): Promise<StressTestConfig[]>;
    /**
     * Execute stress tests with parallel execution and real-time monitoring
     */
    executeStressTests(testIds: string[]): Promise<Map<string, StressTestResult>>;
    /**
     * Run continuous stress testing for new features
     */
    runContinuousStressTesting(): Promise<void>;
    /**
     * Generate load tests for performance validation
     */
    private generateLoadTests;
    /**
     * Generate chaos engineering tests
     */
    private generateChaosTests;
    /**
     * Generate security stress tests
     */
    private generateSecurityStressTests;
    /**
     * Generate integration stress tests
     */
    private generateIntegrationStressTests;
    private analyzeTarget;
    private generateLoadScenarios;
    private generateSpikeScenarios;
    private generateChaosScenarios;
    private generateResourceExhaustionScenarios;
    private generateSecurityScenarios;
    private generateIntegrationScenarios;
    private generatePerformanceThresholds;
    private generateSpikeThresholds;
    private generateChaosThresholds;
    private generateResourceThresholds;
    private generateSecurityThresholds;
    private generateIntegrationThresholds;
    private initializeAIPatterns;
    private startContinuousLearning;
    private learnFromTestResults;
    private identifyFailurePatterns;
    private updateAIPattern;
    private enhanceWithAI;
    private optimizeTestConfigurations;
    private mapTestPriorityToTaskPriority;
    private mapTestToResources;
    private assessCollisionRisk;
    private processTestResult;
    private generateTestMetrics;
    private detectNewFeatures;
    private determineTargetType;
    private runRegressionStressTests;
    getTestConfig(testId: string): StressTestConfig | undefined;
    getActiveTests(): Map<string, StressTestResult>;
    getTestHistory(limit?: number): StressTestResult[];
    cancelTest(testId: string): Promise<void>;
}
export default AutomatedStressTestGenerator;
