/**
 * VERSATIL SDLC Framework - Root Cause Learning Engine
 *
 * Detects recurring issues, identifies root causes, and learns patterns
 * for future auto-remediation. Core component of Guardian's continuous
 * learning system (v7.11.0+).
 *
 * Key Features:
 * - Pattern detection (3+ occurrences in configurable timespan)
 * - Historical context querying (RAG integration)
 * - Confidence-based root cause identification
 * - Verified pattern storage for auto-remediation
 * - Correlation analysis (link related failures)
 *
 * @version 7.11.0
 */
import type { HealthCheckResult } from './types.js';
export interface RootCausePattern {
    id: string;
    issue_fingerprint: string;
    issue_description: string;
    occurrences: number;
    first_seen: string;
    last_seen: string;
    timespan_hours: number;
    root_cause: {
        primary: string;
        secondary: string[];
        confidence: number;
        evidence: string[];
    };
    remediation: {
        manual_fix?: string;
        auto_fix_command?: string;
        success_rate: number;
        avg_duration_ms: number;
        last_success?: string;
    };
    enhancement_candidate: boolean;
    enhancement_priority: 'critical' | 'high' | 'medium' | 'low';
    estimated_roi_hours_per_week?: number;
    context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT' | 'SHARED';
    layer: 'framework' | 'project' | 'context';
    component: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface RootCauseLearningResult {
    patterns_detected: RootCausePattern[];
    new_patterns: number;
    updated_patterns: number;
    enhancement_candidates: number;
    total_occurrences_analyzed: number;
    confidence_avg: number;
}
export interface RootCauseAnalysisConfig {
    min_occurrences: number;
    timespan_hours: number;
    min_confidence_for_pattern: number;
    min_confidence_for_enhancement: number;
    enable_rag_lookup: boolean;
}
/**
 * Root Cause Learning Engine
 */
export declare class RootCauseLearner {
    private static instance;
    private logger;
    private config;
    private patternsFile;
    private patternsCache;
    constructor(config?: Partial<RootCauseAnalysisConfig>);
    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<RootCauseAnalysisConfig>): RootCauseLearner;
    /**
     * Analyze health check history to detect recurring patterns
     */
    analyzeHealthCheckHistory(healthHistory: HealthCheckResult[], currentWorkingDir: string): Promise<RootCauseLearningResult>;
    /**
     * Extract all issues from health check history within timespan
     */
    private extractIssuesFromHistory;
    /**
     * Group issues by fingerprint (first 100 chars of description)
     */
    private groupIssuesByFingerprint;
    /**
     * Generate fingerprint from issue description
     */
    private generateFingerprint;
    /**
     * Detect recurring patterns (≥min_occurrences)
     */
    private detectRecurringPatterns;
    /**
     * Update existing pattern with new occurrences
     */
    private updateExistingPattern;
    /**
     * Analyze new pattern and generate root cause hypothesis
     */
    private analyzeNewPattern;
    /**
     * Query RAG for similar historical issues
     */
    private queryRAGForSimilarIssues;
    /**
     * Generate root cause hypothesis based on issue and historical context
     */
    private generateRootCauseHypothesis;
    /**
     * Infer primary root cause from issue description
     */
    private inferPrimaryRootCause;
    /**
     * Infer secondary root causes
     */
    private inferSecondaryRootCauses;
    /**
     * Get component-specific known patterns
     */
    private getComponentSpecificPatterns;
    /**
     * Calculate enhancement priority
     */
    private calculateEnhancementPriority;
    /**
     * Determine context (framework vs project)
     */
    private determineContext;
    /**
     * Classify layer (framework, project, context)
     */
    private classifyLayer;
    /**
     * Store patterns to disk and update cache
     */
    private storePatterns;
    /**
     * Load patterns cache from disk
     */
    private loadPatternsCache;
    /**
     * Get all patterns
     */
    getPatterns(): RootCausePattern[];
    /**
     * Get pattern by fingerprint
     */
    getPattern(fingerprint: string): RootCausePattern | undefined;
}
