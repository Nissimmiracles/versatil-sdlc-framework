/**
 * INSIGHT Mode: Frontend UI/UX Deep Research Analysis
 * Comprehensive research for optimal frontend agent capabilities
 *
 * Research Areas:
 * - Modern UI/UX paradigms and emerging trends
 * - AI-native frontend development patterns
 * - Advanced component architectures
 * - Performance optimization strategies
 * - Accessibility and inclusive design
 * - Developer experience optimization
 * - Cross-platform development approaches
 * - Visual design automation
 */
import { EventEmitter } from 'events';
export interface FrontendResearchAnalysis {
    currentLandscape: FrontendLandscape;
    emergingTrends: EmergingTrend[];
    bottleneckAnalysis: FrontendBottleneck[];
    breakthroughOpportunities: BreakthroughOpportunity[];
    agentCapabilityRecommendations: AgentCapability[];
    implementationStrategy: ImplementationStrategy;
    competitiveAnalysis: CompetitiveAnalysis;
    futureRoadmap: FutureRoadmap;
}
export interface FrontendLandscape {
    dominantFrameworks: FrameworkAnalysis[];
    emergingTechnologies: Technology[];
    industryStandards: Standard[];
    performanceBenchmarks: PerformanceBenchmark[];
    userExpectations: UserExpectation[];
    accessibilityRequirements: AccessibilityRequirement[];
}
export interface FrameworkAnalysis {
    name: string;
    marketShare: number;
    growthTrend: 'rising' | 'stable' | 'declining';
    strengths: string[];
    weaknesses: string[];
    useCase: string[];
    learningCurve: 'low' | 'medium' | 'high';
    ecosystem: EcosystemHealth;
    aiIntegration: AIIntegrationLevel;
}
export interface EcosystemHealth {
    npmPackages: number;
    communitySize: number;
    jobMarket: number;
    enterpriseAdoption: number;
    toolingQuality: number;
}
export declare enum AIIntegrationLevel {
    NONE = "none",
    BASIC = "basic",
    MODERATE = "moderate",
    ADVANCED = "advanced",
    NATIVE = "native"
}
export interface EmergingTrend {
    name: string;
    category: TrendCategory;
    adoptionLevel: number;
    impactPotential: number;
    timeToMainstream: number;
    keyPlayers: string[];
    technicalRequirements: string[];
    businessImpact: string[];
    implementationComplexity: 'low' | 'medium' | 'high';
}
export declare enum TrendCategory {
    ARCHITECTURE = "architecture",
    PERFORMANCE = "performance",
    DEVELOPER_EXPERIENCE = "developer_experience",
    USER_EXPERIENCE = "user_experience",
    ACCESSIBILITY = "accessibility",
    DESIGN_SYSTEMS = "design_systems",
    AI_INTEGRATION = "ai_integration",
    CROSS_PLATFORM = "cross_platform"
}
export interface FrontendBottleneck {
    area: BottleneckArea;
    severity: 'low' | 'medium' | 'high' | 'critical';
    frequency: number;
    impactScope: string[];
    rootCauses: string[];
    currentSolutions: string[];
    limitationsOfCurrentSolutions: string[];
    breakthroughPotential: number;
}
export declare enum BottleneckArea {
    BUNDLE_SIZE = "bundle_size",
    RUNTIME_PERFORMANCE = "runtime_performance",
    DEVELOPMENT_VELOCITY = "development_velocity",
    ACCESSIBILITY_COMPLIANCE = "accessibility_compliance",
    CROSS_BROWSER_COMPATIBILITY = "cross_browser_compatibility",
    STATE_MANAGEMENT = "state_management",
    TESTING_COMPLEXITY = "testing_complexity",
    DESIGN_IMPLEMENTATION_GAP = "design_implementation_gap",
    RESPONSIVE_DESIGN = "responsive_design",
    SEO_OPTIMIZATION = "seo_optimization"
}
export interface BreakthroughOpportunity {
    area: string;
    potentialImpact: number;
    implementationEffort: number;
    riskLevel: 'low' | 'medium' | 'high';
    prerequisites: string[];
    expectedOutcomes: string[];
    successMetrics: string[];
    timeframe: string;
    resources: string[];
}
export interface AgentCapability {
    name: string;
    category: AgentCapabilityCategory;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    technicalRequirements: string[];
    aiEnhancements: string[];
    integrationPoints: string[];
    measurableOutcomes: string[];
    implementationComplexity: number;
    maintenanceOverhead: number;
}
export declare enum AgentCapabilityCategory {
    CODE_GENERATION = "code_generation",
    DESIGN_IMPLEMENTATION = "design_implementation",
    PERFORMANCE_OPTIMIZATION = "performance_optimization",
    ACCESSIBILITY_ENHANCEMENT = "accessibility_enhancement",
    TESTING_AUTOMATION = "testing_automation",
    CROSS_PLATFORM_ADAPTATION = "cross_platform_adaptation",
    STATE_MANAGEMENT = "state_management",
    UI_COMPONENT_LIBRARY = "ui_component_library",
    RESPONSIVE_DESIGN = "responsive_design",
    ANIMATION_ORCHESTRATION = "animation_orchestration"
}
export interface ImplementationStrategy {
    phases: ImplementationPhase[];
    riskMitigation: RiskMitigation[];
    resourceAllocation: ResourceAllocation;
    timeline: Timeline;
    successCriteria: string[];
    rollbackPlans: string[];
}
export interface ImplementationPhase {
    name: string;
    duration: number;
    deliverables: string[];
    dependencies: string[];
    risks: string[];
    resources: string[];
    successMetrics: string[];
}
export interface CompetitiveAnalysis {
    topFrameworks: FrameworkAnalysis[];
    aiNativeSolutions: AINativeSolution[];
    differentiationOpportunities: string[];
    marketGaps: string[];
    competitiveAdvantages: string[];
}
export interface AINativeSolution {
    name: string;
    vendor: string;
    capabilities: string[];
    strengths: string[];
    weaknesses: string[];
    marketPosition: string;
    aiMaturity: AIIntegrationLevel;
}
export declare class FrontendINSIGHTResearcher extends EventEmitter {
    private ultraThink;
    constructor();
    performDeepFrontendResearch(): Promise<FrontendResearchAnalysis>;
    private analyzeFrontendLandscape;
    private detectEmergingTrends;
    private identifyFrontendBottlenecks;
    private identifyBreakthroughOpportunities;
    private generateAgentCapabilityRecommendations;
    private developImplementationStrategy;
    private performCompetitiveAnalysis;
    private generateFutureRoadmap;
}
interface Technology {
    name: string;
    category: string;
    maturity: number;
    adoptionRate: number;
}
interface Standard {
    name: string;
    compliance: number;
    importance: number;
}
interface PerformanceBenchmark {
    metric: string;
    target: string;
    industryAverage: string;
    topPercentile: string;
}
interface UserExpectation {
    category: string;
    expectation: string;
    currentGap: string;
}
interface AccessibilityRequirement {
    standard: string;
    compliance: number;
    criticalGaps: string[];
}
interface RiskMitigation {
    risk: string;
    mitigation: string;
    contingency: string;
}
interface ResourceAllocation {
    engineering: string;
    design: string;
    qa: string;
    devops: string;
}
interface Timeline {
    total: number;
    phases: number[];
    milestones: string[];
}
interface FutureRoadmap {
    timeframes: {
        immediate: string[];
        shortTerm: string[];
        mediumTerm: string[];
        longTerm: string[];
    };
    technologyEvolution: string[];
    marketEvolution: string[];
}
export default FrontendINSIGHTResearcher;
