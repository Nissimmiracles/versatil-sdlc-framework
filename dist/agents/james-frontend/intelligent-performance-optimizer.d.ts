/**
 * Intelligent Performance Optimizer for James-Frontend
 * Real-time performance monitoring, analysis, and optimization with AI-powered insights
 *
 * Features:
 * - Bundle size optimization with intelligent code splitting
 * - Runtime performance monitoring and optimization
 * - Predictive performance bottleneck detection
 * - Automatic asset optimization and lazy loading
 * - Core Web Vitals optimization
 * - Performance regression detection
 * - User behavior-based optimization
 */
import { EventEmitter } from 'events';
export interface PerformanceMetrics {
    bundleSize: BundleSizeMetrics;
    runtimePerformance: RuntimeMetrics;
    coreWebVitals: CoreWebVitals;
    networkMetrics: NetworkMetrics;
    memoryUsage: MemoryMetrics;
    userExperience: UserExperienceMetrics;
    timestamp: number;
}
export interface BundleSizeMetrics {
    totalSize: number;
    gzippedSize: number;
    chunks: ChunkInfo[];
    dependencies: DependencyInfo[];
    treeShakingEfficiency: number;
    duplicateCode: DuplicateCodeInfo[];
    unusedCode: UnusedCodeInfo[];
}
export interface ChunkInfo {
    name: string;
    size: number;
    gzippedSize: number;
    modules: ModuleInfo[];
    loadPriority: 'high' | 'medium' | 'low';
    cacheability: number;
    dependencies: string[];
}
export interface ModuleInfo {
    name: string;
    size: number;
    usage: number;
    imports: string[];
    exports: string[];
    sideEffects: boolean;
    treeshakable: boolean;
}
export interface DependencyInfo {
    name: string;
    version: string;
    size: number;
    usagePercentage: number;
    alternatives: AlternativePackage[];
    treeshakingSupport: boolean;
    bundlePhobia: BundlePhobeInfo;
}
export interface AlternativePackage {
    name: string;
    size: number;
    sizeReduction: number;
    compatibility: number;
    performance: number;
    maintenance: number;
}
export interface BundlePhobeInfo {
    size: number;
    gzip: number;
    downloadTime: {
        slow3G: number;
        emerging4G: number;
    };
}
export interface DuplicateCodeInfo {
    module: string;
    duplicatedIn: string[];
    size: number;
    instances: number;
    consolidationOpportunity: number;
}
export interface UnusedCodeInfo {
    module: string;
    unusedExports: string[];
    size: number;
    removalSafety: 'safe' | 'risky' | 'unsafe';
    impact: number;
}
export interface RuntimeMetrics {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
    totalBlockingTime: number;
    renderingPerformance: RenderingMetrics;
    jsExecutionTime: number;
    mainThreadBlocking: number;
}
export interface RenderingMetrics {
    framerate: number;
    droppedFrames: number;
    renderTime: number;
    layoutTime: number;
    paintTime: number;
    compositeTime: number;
    reflows: number;
    repaints: number;
}
export interface CoreWebVitals {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
export interface NetworkMetrics {
    resourceCount: number;
    totalTransferSize: number;
    totalResourceSize: number;
    requestsBlocking: number;
    criticalRequestChains: CriticalChain[];
    compressionRatio: number;
    cacheHitRate: number;
}
export interface CriticalChain {
    url: string;
    chain: string[];
    duration: number;
    priority: number;
    optimization: string[];
}
export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    memoryLeaks: MemoryLeak[];
    retainedSize: number;
    gcPressure: number;
}
export interface MemoryLeak {
    component: string;
    size: number;
    source: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoFixable: boolean;
}
export interface UserExperienceMetrics {
    userSatisfaction: number;
    bounceRate: number;
    conversionRate: number;
    engagementScore: number;
    performanceComplaintRate: number;
    devicePerformance: DevicePerformanceBreakdown;
}
export interface DevicePerformanceBreakdown {
    desktop: PerformanceScore;
    mobile: PerformanceScore;
    tablet: PerformanceScore;
    lowEndDevices: PerformanceScore;
}
export interface PerformanceScore {
    score: number;
    metrics: RuntimeMetrics;
    userSatisfaction: number;
}
export interface OptimizationRecommendation {
    id: string;
    type: OptimizationType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    estimatedImpact: ImpactEstimate;
    implementationComplexity: 'low' | 'medium' | 'high';
    autoImplementable: boolean;
    prerequisites: string[];
    implementation: OptimizationImplementation;
    risks: OptimizationRisk[];
    monitoring: MonitoringRequirement[];
}
export declare enum OptimizationType {
    BUNDLE_SPLITTING = "bundle_splitting",
    LAZY_LOADING = "lazy_loading",
    TREE_SHAKING = "tree_shaking",
    COMPRESSION = "compression",
    CACHING = "caching",
    IMAGE_OPTIMIZATION = "image_optimization",
    CSS_OPTIMIZATION = "css_optimization",
    JS_OPTIMIZATION = "js_optimization",
    NETWORK_OPTIMIZATION = "network_optimization",
    MEMORY_OPTIMIZATION = "memory_optimization",
    DEPENDENCY_OPTIMIZATION = "dependency_optimization",
    PRELOADING = "preloading",
    SERVICE_WORKER = "service_worker"
}
export interface ImpactEstimate {
    bundleSizeReduction: number;
    loadTimeImprovement: number;
    performanceScoreIncrease: number;
    userExperienceImprovement: number;
    costSavings: number;
}
export interface OptimizationImplementation {
    steps: ImplementationStep[];
    configuration: any;
    codeChanges: CodeChange[];
    buildChanges: BuildChange[];
    testingStrategy: TestingStrategy;
}
export interface ImplementationStep {
    order: number;
    description: string;
    command?: string;
    manual: boolean;
    duration: number;
    validation: string[];
}
export interface CodeChange {
    file: string;
    type: 'add' | 'modify' | 'remove';
    description: string;
    code?: string;
    lineNumber?: number;
}
export interface BuildChange {
    file: string;
    type: 'webpack' | 'vite' | 'rollup' | 'esbuild';
    configuration: any;
    description: string;
}
export interface TestingStrategy {
    performanceTests: PerformanceTest[];
    regressionTests: RegressionTest[];
    userAcceptanceTests: UATTest[];
}
export interface PerformanceTest {
    name: string;
    metric: string;
    threshold: number;
    command: string;
}
export interface RegressionTest {
    name: string;
    description: string;
    command: string;
    expectedOutcome: string;
}
export interface UATTest {
    scenario: string;
    metrics: string[];
    acceptanceCriteria: string[];
}
export interface OptimizationRisk {
    type: 'functionality' | 'performance' | 'compatibility' | 'maintainability';
    probability: number;
    impact: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
}
export interface MonitoringRequirement {
    metric: string;
    threshold: number;
    alerting: boolean;
    dashboardWidget: boolean;
}
export interface PerformanceBudget {
    bundleSize: {
        total: number;
        javascript: number;
        css: number;
        images: number;
        fonts: number;
    };
    timing: {
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        firstInputDelay: number;
        cumulativeLayoutShift: number;
        timeToInteractive: number;
    };
    network: {
        requestCount: number;
        transferSize: number;
    };
    lighthouse: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
}
export interface PerformanceAlert {
    id: string;
    type: 'budget_exceeded' | 'regression_detected' | 'anomaly_detected';
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    metrics: any;
    timestamp: number;
    recommendations: string[];
    autoResolution: AutoResolution;
}
export interface AutoResolution {
    available: boolean;
    confidence: number;
    actions: ResolutionAction[];
    estimatedTime: number;
}
export interface ResolutionAction {
    type: string;
    description: string;
    command?: string;
    manual: boolean;
    rollbackable: boolean;
}
export interface OptimizationConfig {
    enabled: boolean;
    autoOptimization: boolean;
    performanceBudget: PerformanceBudget;
    monitoringInterval: number;
    optimizationThresholds: OptimizationThresholds;
    excludePatterns: string[];
    aggressiveOptimization: boolean;
}
export interface OptimizationThresholds {
    bundleSizeIncrease: number;
    performanceScoreDecrease: number;
    loadTimeIncrease: number;
    memoryUsageIncrease: number;
}
export interface PerformanceInsight {
    type: InsightType;
    confidence: number;
    description: string;
    data: any;
    actionable: boolean;
    recommendations: string[];
    impact: 'low' | 'medium' | 'high';
}
export declare enum InsightType {
    BOTTLENECK_DETECTED = "bottleneck_detected",
    OPTIMIZATION_OPPORTUNITY = "optimization_opportunity",
    PERFORMANCE_PATTERN = "performance_pattern",
    USER_BEHAVIOR_CHANGE = "user_behavior_change",
    RESOURCE_WASTE = "resource_waste",
    REGRESSION_TREND = "regression_trend",
    CACHE_INEFFICIENCY = "cache_inefficiency"
}
export declare class IntelligentPerformanceOptimizer extends EventEmitter {
    private metricsCollector;
    private bundleAnalyzer;
    private performancePredictor;
    private optimizationEngine;
    private alertManager;
    private config;
    private performanceBudget;
    constructor(config?: Partial<OptimizationConfig>);
    private initialize;
    analyzePerformance(projectPath: string): Promise<PerformanceMetrics>;
    generateOptimizationRecommendations(metrics: PerformanceMetrics): Promise<OptimizationRecommendation[]>;
    implementOptimization(recommendation: OptimizationRecommendation, projectPath: string): Promise<boolean>;
    predictPerformanceImpact(changes: CodeChange[], projectPath: string): Promise<ImpactEstimate>;
    generatePerformanceInsights(metrics: PerformanceMetrics[], timeRange: {
        start: number;
        end: number;
    }): Promise<PerformanceInsight[]>;
    private startMonitoring;
    private performMonitoringCycle;
    private checkPerformanceBudget;
    private generateBundleOptimizations;
    private generateRuntimeOptimizations;
    private generateNetworkOptimizations;
    private generateMemoryOptimizations;
    private generateCoreWebVitalsOptimizations;
    private executeImplementationStep;
    private applyCodeChange;
    private applyBuildChange;
    private runValidationTests;
    private analyzeTrends;
    private detectBottlenecks;
    private recognizePatterns;
    private detectAnomalies;
    private getDefaultPerformanceBudget;
}
export default IntelligentPerformanceOptimizer;
