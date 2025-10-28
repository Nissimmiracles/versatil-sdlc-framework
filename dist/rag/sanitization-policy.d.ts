/**
 * Sanitization Policy - Decision Engine for Public RAG Storage
 *
 * Determines whether a pattern can be stored in Public RAG and what
 * sanitization level is required. Implements policy rules for:
 * - Pattern classification (public-safe vs private-only)
 * - Sanitization requirement assessment
 * - Storage destination routing
 * - User confirmation workflows
 */
import { SanitizationResult } from './pattern-sanitizer.js';
export declare enum PatternClassification {
    PUBLIC_SAFE = "public_safe",// Generic framework pattern, no sanitization needed
    REQUIRES_SANITIZATION = "requires_sanitization",// Safe after sanitization (code examples)
    PRIVATE_ONLY = "private_only",// Business logic, proprietary
    CREDENTIALS = "credentials",// Contains secrets/credentials
    UNSANITIZABLE = "unsanitizable"
}
export declare enum StorageDestination {
    PUBLIC_ONLY = "public_only",// Store in Public RAG only
    PRIVATE_ONLY = "private_only",// Store in Private RAG only
    BOTH = "both",// Store in both (sanitized version in Public)
    NONE = "none"
}
export interface PolicyDecision {
    classification: PatternClassification;
    destination: StorageDestination;
    requiresUserConfirmation: boolean;
    sanitizationRequired: boolean;
    sanitizationResult: SanitizationResult | null;
    reasoning: string[];
    recommendations: string[];
}
export interface PatternInput {
    pattern: string;
    description?: string;
    code?: string;
    agent: string;
    category: string;
    effectiveness?: number;
    timeSaved?: number;
    tags?: string[];
}
/**
 * Sanitization Policy Engine
 */
export declare class SanitizationPolicy {
    private sanitizer;
    constructor();
    /**
     * Evaluate pattern and determine storage policy
     */
    evaluatePattern(pattern: PatternInput): Promise<PolicyDecision>;
    /**
     * Classify pattern based on sanitization result
     */
    private classifyPattern;
    /**
     * Determine storage destination based on classification
     */
    private determineDestination;
    /**
     * Determine if user confirmation is required
     */
    private shouldRequireConfirmation;
    /**
     * Generate reasoning for the decision
     */
    private generateReasoning;
    /**
     * Generate recommendations for the user
     */
    private generateRecommendations;
    /**
     * Batch evaluate multiple patterns
     */
    evaluatePatterns(patterns: PatternInput[]): Promise<PolicyDecision[]>;
    /**
     * Get evaluation statistics
     */
    getEvaluationStats(decisions: PolicyDecision[]): {
        total: number;
        publicSafe: number;
        requiresSanitization: number;
        privateOnly: number;
        credentials: number;
        unsanitizable: number;
        destinations: Record<StorageDestination, number>;
    };
    /**
     * Generate user-friendly decision summary
     */
    generateDecisionSummary(decisions: PolicyDecision[]): string;
}
export declare function getSanitizationPolicy(): SanitizationPolicy;
export declare const sanitizationPolicy: SanitizationPolicy;
