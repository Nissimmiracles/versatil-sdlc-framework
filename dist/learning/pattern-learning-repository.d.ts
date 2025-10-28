/**
 * Learning Repository System for Pattern Storage
 * Stores successful patterns, solutions, and learnings for future reference
 *
 * Features:
 * - Pattern recognition and storage
 * - Success metrics tracking
 * - Context-aware pattern matching
 * - Cross-project learning transfer
 * - Anti-pattern detection
 * - Performance impact analysis
 * - Intelligent recommendations
 */
import { EventEmitter } from 'events';
export interface Pattern {
    id: string;
    name: string;
    description: string;
    category: PatternCategory;
    type: PatternType;
    context: PatternContext;
    implementation: PatternImplementation;
    metrics: PatternMetrics;
    metadata: PatternMetadata;
    validation: PatternValidation;
    lifecycle: PatternLifecycle;
}
export declare enum PatternCategory {
    ARCHITECTURAL = "architectural",
    DESIGN = "design",
    PERFORMANCE = "performance",
    SECURITY = "security",
    TESTING = "testing",
    DEPLOYMENT = "deployment",
    WORKFLOW = "workflow",
    QUALITY = "quality"
}
export declare enum PatternType {
    SOLUTION = "solution",
    BEST_PRACTICE = "best_practice",
    ANTI_PATTERN = "anti_pattern",
    OPTIMIZATION = "optimization",
    CONVENTION = "convention",
    TEMPLATE = "template",
    WORKFLOW_STEP = "workflow_step"
}
export interface PatternContext {
    technologies: string[];
    frameworks: string[];
    projectTypes: string[];
    complexity: 'simple' | 'medium' | 'complex';
    teamSize: 'small' | 'medium' | 'large';
    domain: string[];
    constraints: string[];
    requirements: string[];
}
export interface PatternImplementation {
    code?: string;
    configuration?: any;
    commands?: string[];
    dependencies?: string[];
    files?: Array<{
        path: string;
        content: string;
        type: 'code' | 'config' | 'documentation';
    }>;
    instructions: string[];
    prerequisites: string[];
    warnings: string[];
}
export interface PatternMetrics {
    successRate: number;
    performanceImpact: number;
    adoptionRate: number;
    maintenanceScore: number;
    qualityScore: number;
    securityScore: number;
    usageCount: number;
    feedback: PatternFeedback[];
    benchmarks: {
        executionTime?: number;
        memoryUsage?: number;
        bundleSize?: number;
        testCoverage?: number;
    };
}
export interface PatternFeedback {
    rating: number;
    comment: string;
    projectId: string;
    timestamp: number;
    outcomes: {
        solved: boolean;
        performance: 'improved' | 'degraded' | 'neutral';
        maintenance: 'easier' | 'harder' | 'neutral';
        quality: 'improved' | 'degraded' | 'neutral';
    };
}
export interface PatternMetadata {
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    version: string;
    tags: string[];
    relatedPatterns: string[];
    supersedes: string[];
    deprecated: boolean;
    maturityLevel: 'experimental' | 'stable' | 'mature';
    confidence: number;
}
export interface PatternValidation {
    rules: ValidationRule[];
    tests: ValidationTest[];
    checklist: ChecklistItem[];
    autoValidation: boolean;
    lastValidated: number;
}
export interface ValidationRule {
    name: string;
    condition: string;
    severity: 'error' | 'warning' | 'info';
    autoFix?: string;
}
export interface ValidationTest {
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    command: string;
    expected: any;
    timeout: number;
}
export interface ChecklistItem {
    text: string;
    required: boolean;
    automated: boolean;
    validationKey?: string;
}
export interface PatternLifecycle {
    stage: 'discovery' | 'validation' | 'adoption' | 'optimization' | 'retirement';
    stageHistory: Array<{
        stage: string;
        timestamp: number;
        reason: string;
    }>;
    nextReview: number;
    retirementDate?: number;
}
export interface PatternQuery {
    categories?: PatternCategory[];
    types?: PatternType[];
    technologies?: string[];
    frameworks?: string[];
    projectTypes?: string[];
    complexity?: string;
    minSuccessRate?: number;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
}
export interface PatternRecommendation {
    pattern: Pattern;
    relevanceScore: number;
    confidence: number;
    reasons: string[];
    adaptations?: string[];
    risks?: string[];
    estimatedImpact: {
        development: 'low' | 'medium' | 'high';
        maintenance: 'low' | 'medium' | 'high';
        performance: 'low' | 'medium' | 'high';
    };
}
export interface LearningInsights {
    totalPatterns: number;
    categoryDistribution: Record<PatternCategory, number>;
    typeDistribution: Record<PatternType, number>;
    topPerformingPatterns: Pattern[];
    emergingPatterns: Pattern[];
    deprecatedPatterns: Pattern[];
    successTrends: Array<{
        period: string;
        successRate: number;
        adoptionRate: number;
    }>;
    technologyAdoption: Record<string, {
        patternCount: number;
        averageSuccess: number;
        trending: boolean;
    }>;
}
export declare class PatternLearningRepository extends EventEmitter {
    private patterns;
    private repositoryPath;
    private indexPath;
    private searchIndex;
    private categoryIndex;
    private technologyIndex;
    constructor(repositoryPath?: string);
    private initialize;
    addPattern(pattern: Omit<Pattern, 'id' | 'metadata'>): Promise<string>;
    updatePattern(patternId: string, updates: Partial<Pattern>): Promise<void>;
    getPattern(patternId: string): Promise<Pattern | null>;
    searchPatterns(query: PatternQuery): Promise<Pattern[]>;
    getRecommendations(context: Partial<PatternContext>, currentProblem?: string): Promise<PatternRecommendation[]>;
    recordPatternUsage(patternId: string, feedback: Omit<PatternFeedback, 'timestamp'>): Promise<void>;
    validatePattern(patternId: string): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    getLearningInsights(): Promise<LearningInsights>;
    exportRepository(outputPath: string): Promise<void>;
    importRepository(inputPath: string): Promise<void>;
    private generatePatternId;
    private loadPatterns;
    private savePattern;
    private buildIndexes;
    private updateIndexes;
    private saveIndexes;
    private calculateRelevance;
    private generateRelevanceReasons;
    private suggestAdaptations;
    private identifyRisks;
    private estimateImpact;
    private recalculatePatternMetrics;
    private updateMaturityLevel;
    private executeValidationRule;
    private executeValidationTest;
    private calculateSuccessTrends;
}
export default PatternLearningRepository;
