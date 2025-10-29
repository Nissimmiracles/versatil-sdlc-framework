/**
 * VERSATIL SDLC Framework - Enhancement Detector
 *
 * Analyzes root cause patterns to suggest framework/project enhancements
 * that prevent recurring issues and improve auto-remediation capabilities.
 *
 * Key Features:
 * - Enhancement opportunity detection from learned patterns
 * - Priority scoring (critical fix vs enhancement)
 * - Effort estimation from historical data
 * - ROI calculation (time saved per week)
 * - Agent assignment for implementation
 *
 * @version 7.12.0
 */
import type { RootCausePattern } from './root-cause-learner.js';
export interface EnhancementSuggestion {
    id: string;
    title: string;
    description: string;
    category: 'auto-remediation' | 'monitoring' | 'performance' | 'reliability' | 'security';
    priority: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
    root_cause_pattern_id: string;
    issue_description: string;
    issue_occurrences: number;
    issue_timespan_hours: number;
    implementation_steps: string[];
    estimated_effort_hours: number;
    assigned_agent: string;
    roi: {
        hours_saved_per_week: number;
        manual_interventions_eliminated: number;
        reliability_improvement_percent: number;
        roi_ratio: number;
    };
    evidence: {
        occurrences: number;
        success_rate_if_implemented: number;
        similar_historical_fixes: string[];
        verification_confidence: number;
    };
    auto_applicable: boolean;
    requires_manual_review: boolean;
    approval_tier: 1 | 2 | 3;
    approval_required: boolean;
    approval_required_reason: string;
    created_at: string;
}
export interface EnhancementDetectionResult {
    total_patterns_analyzed: number;
    enhancements_suggested: EnhancementSuggestion[];
    high_priority_count: number;
    total_roi_hours_per_week: number;
    avg_confidence: number;
}
export interface EnhancementDetectionConfig {
    min_confidence_for_suggestion: number;
    min_occurrences_for_enhancement: number;
    enable_rag_lookup: boolean;
}
/**
 * Enhancement Detector
 */
export declare class EnhancementDetector {
    private logger;
    private config;
    constructor(config?: Partial<EnhancementDetectionConfig>);
    /**
     * Analyze root cause patterns and generate enhancement suggestions
     */
    detectEnhancements(patterns: RootCausePattern[]): Promise<EnhancementDetectionResult>;
    /**
     * Generate enhancement suggestion from root cause pattern
     */
    private generateEnhancementSuggestion;
    /**
     * Determine enhancement category
     */
    private determineCategory;
    /**
     * Generate enhancement title and description
     */
    private generateTitleAndDescription;
    /**
     * Generate implementation steps
     */
    private generateImplementationSteps;
    /**
     * Estimate effort in hours
     */
    private estimateEffort;
    /**
     * Assign agent for implementation
     */
    private assignAgent;
    /**
     * Calculate ROI (return on investment)
     */
    private calculateROI;
    /**
     * Gather supporting evidence
     */
    private gatherEvidence;
    /**
     * Determine auto-applicability
     */
    private determineAutoApplicability;
    /**
     * Determine approval tier for human-in-the-loop workflow (v7.12.0+)
     *
     * TIER 1: Auto-Apply (≥95% confidence)
     * - Simple fixes (npm install, npm audit fix)
     * - Proven success rate >95%
     * - Zero risk changes
     * → Execute immediately, notify user
     *
     * TIER 2: Prompt for Approval (80-95% confidence)
     * - Medium confidence
     * - Non-critical changes
     * - ROI >5:1 (5h saved for 1h effort)
     * → Interactive prompt: "Approve? (y/n/defer)"
     *
     * TIER 3: Manual Review Required (<80% confidence)
     * - Critical priority
     * - Complex root causes (3+ secondary)
     * - Unknown success rate
     * → Create TODO only, require explicit /work
     */
    private determineApprovalTier;
}
