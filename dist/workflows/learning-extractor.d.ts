/**
 * VERSATIL Learning Extractor
 *
 * Extracts actionable learnings from session analysis for RAG storage.
 * Converts session data into structured knowledge that makes future work faster.
 *
 * Responsibilities:
 * - Extract "what worked" patterns
 * - Extract "watch out for" warnings
 * - Identify reusable code patterns
 * - Generate lessons learned
 * - Calculate pattern effectiveness scores
 *
 * Integration: Used by LearningCodifier before RAG storage
 */
import { SessionAnalysis } from './session-analyzer.js';
export interface CodePattern {
    category: 'test' | 'component' | 'api' | 'database' | 'configuration' | 'optimization';
    language: string;
    framework?: string;
    pattern: string;
    description: string;
    codeSnippet: string;
    effectiveness: number;
    tags: string[];
    usageContext: string;
    recommendations: string;
}
export interface WatchOutWarning {
    category: 'performance' | 'quality' | 'security' | 'efficiency' | 'estimation';
    severity: 'low' | 'medium' | 'high';
    issue: string;
    impact: string;
    resolution: string;
    agentRelated?: string;
}
export interface LessonLearned {
    title: string;
    context: string;
    insight: string;
    application: string;
    evidence: string;
    relatedPatterns: string[];
}
export interface PerformanceMetric {
    metric: string;
    value: number;
    unit: string;
    benchmark: number;
    status: 'excellent' | 'good' | 'needs-improvement';
    improvement: string;
}
export interface ExtractedLearnings {
    sessionId: string;
    timestamp: Date;
    codePatterns: CodePattern[];
    warnings: WatchOutWarning[];
    lessons: LessonLearned[];
    performanceMetrics: PerformanceMetric[];
    agentInsights: Array<{
        agentId: string;
        effectiveness: 'high' | 'medium' | 'low';
        bestPractices: string[];
        improvementAreas: string[];
    }>;
    overallEffectiveness: number;
    compoundingScore: number;
}
export declare class LearningExtractor {
    private logger;
    constructor();
    /**
     * Main entry point: Extract learnings from session analysis
     */
    extractLearnings(analysis: SessionAnalysis): Promise<ExtractedLearnings>;
    /**
     * Extract code patterns from changes
     */
    private extractCodePatterns;
    /**
     * Identify test pattern from code
     */
    private identifyTestPattern;
    /**
     * Identify component pattern from code
     */
    private identifyComponentPattern;
    /**
     * Identify API pattern from code
     */
    private identifyAPIPattern;
    /**
     * Extract code snippet around keyword
     */
    private extractSnippet;
    /**
     * Extract warnings from analysis
     */
    private extractWarnings;
    /**
     * Extract lessons learned
     */
    private extractLessons;
    /**
     * Extract performance metrics
     */
    private extractPerformanceMetrics;
    /**
     * Extract agent insights
     */
    private extractAgentInsights;
    /**
     * Get best practices for agent
     */
    private getAgentBestPractices;
    /**
     * Get improvement areas for agent
     */
    private getAgentImprovements;
    /**
     * Calculate overall effectiveness score
     */
    private calculateOverallEffectiveness;
    /**
     * Calculate compounding score (impact on future sessions)
     */
    private calculateCompoundingScore;
}
/**
 * Factory function for LearningExtractor
 */
export declare function createLearningExtractor(): LearningExtractor;
