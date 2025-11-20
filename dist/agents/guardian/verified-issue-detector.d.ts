/**
 * VERSATIL SDLC Framework - Verified Issue Detector
 *
 * Main verification pipeline that coordinates all three layers:
 * 1. Framework Layer (infrastructure)
 * 2. Project Layer (application code)
 * 3. Context Layer (preferences & conventions)
 *
 * Integrates with Victor-Verifier's Chain-of-Verification (CoVe) methodology
 * to eliminate hallucinations in Guardian's issue detection.
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 * Anti-recursion protections (v7.10.0+):
 * - Layer 3: Session tracking to prevent infinite loops
 */
import type { HealthCheckResult, HealthIssue } from './types.js';
import { type LayerClassification, type VerificationLayer } from './layer-classifier.js';
import { type FrameworkVerificationResult } from './framework-verifier.js';
import { type ProjectVerificationResult } from './project-verifier.js';
import { type ContextVerificationResult } from './context-verifier.js';
import type { ContextIdentity } from '../../isolation/context-identity.js';
export interface VerifiedIssue {
    issue_id: string;
    original_issue: HealthIssue;
    layer: VerificationLayer;
    layer_classification: LayerClassification;
    verified: boolean;
    confidence: number;
    verification_details: FrameworkVerificationResult | ProjectVerificationResult | ContextVerificationResult;
    assigned_agent: string;
    auto_apply: boolean;
    priority: 'critical' | 'high' | 'medium' | 'low';
    created_at: string;
}
export interface VerificationPipelineResult {
    total_issues: number;
    verified_issues: VerifiedIssue[];
    unverified_issues: HealthIssue[];
    layer_statistics: {
        total: number;
        by_layer: Record<VerificationLayer, number>;
        avg_confidence: Record<VerificationLayer, number>;
    };
    auto_apply_count: number;
    manual_review_count: number;
}
/**
 * Main verification pipeline: Detect, Classify, Verify, Assign
 *
 * Anti-recursion protection (Layer 3): Prevents infinite verification loops
 */
export declare function detectAndVerifyIssues(healthCheckResult: HealthCheckResult, workingDir: string, contextIdentity?: ContextIdentity, userId?: string, teamId?: string, projectId?: string): Promise<VerificationPipelineResult>;
/**
 * Grouped issues for combined TODO generation
 */
export interface GroupedIssues {
    group_key: string;
    issues: VerifiedIssue[];
    assigned_agent: string;
    priority: string;
    layer: string;
}
/**
 * Create verified todos from verified issues
 *
 * NOTE: Todo file creation now ENABLED by default (v7.10.0+)
 * Supports both individual and combined (grouped) TODO generation.
 * To disable: set GUARDIAN_CREATE_TODOS=false environment variable
 *
 * Anti-recursion protections (v7.10.0+):
 * - Layer 1: Content-based deduplication (todoAlreadyExists)
 * - Layer 2: Namespaced filenames (guardian- prefix)
 * - Layer 3: TODO grouping (reduces file count by 5-10x)
 */
export declare function createVerifiedTodos(verifiedIssues: VerifiedIssue[], outputDir?: string): Promise<string[]>;
/**
 * Export verification summary for logging
 */
export declare function generateVerificationSummary(result: VerificationPipelineResult): string;
/**
 * Singleton wrapper class for VerifiedIssueDetector
 * Provides class-based API for testing while delegating to functional implementation
 */
export declare class VerifiedIssueDetector {
    private static instance;
    private confidenceThreshold;
    private verificationDepth;
    private autoTODOCreation;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): VerifiedIssueDetector;
    /**
     * Detect and verify a suspected issue
     */
    detectAndVerify(issue: any, options?: {
        timeout?: number;
    }): Promise<{
        isVerified: boolean;
        confidence: number;
        evidence: any;
    }>;
    /**
     * Perform multi-step verification
     */
    performVerificationSteps(issue: any): Promise<Array<{
        step: string;
        result: any;
    }>>;
    /**
     * Verify file exists
     */
    verifyFileExists(issue: any): Promise<boolean>;
    /**
     * Verify error is reproducible
     */
    verifyReproducible(issue: any): Promise<boolean>;
    /**
     * Collect evidence for issue
     */
    collectEvidence(issue: any): Promise<any>;
    /**
     * Validate evidence quality (0-100)
     */
    validateEvidenceQuality(evidence: any): number;
    /**
     * Cross-reference multiple evidence sources
     */
    crossReferenceEvidence(evidence: any): Promise<{
        consistent: boolean;
    }>;
    /**
     * Verify evidence timestamp
     */
    verifyEvidenceTimestamp(evidence: any): boolean;
    /**
     * Filter out false positives
     */
    filterFalsePositives(issues: any[]): Promise<any[]>;
    /**
     * Check if issue is a false positive
     */
    isFalsePositive(issue: any): Promise<boolean>;
    /**
     * Verify against source code
     */
    verifyAgainstSourceCode(issue: any): Promise<boolean>;
    /**
     * Check if issue is stale
     */
    isStaleIssue(issue: any): Promise<boolean>;
    /**
     * Calculate priority score
     */
    calculatePriorityScore(issue: any): number;
    /**
     * Rank issues by priority
     */
    rankByPriority(issues: any[]): any[];
    /**
     * Create verified TODO from issue
     */
    createVerifiedTODO(issue: any): Promise<any>;
    /**
     * Assign agent based on issue type
     */
    private assignAgent;
    /**
     * Classify issue type
     */
    classifyIssue(issue: any): {
        type: string;
        category: string;
    };
    /**
     * Check if issue is security-related
     */
    isSecurityIssue(issue: any): boolean;
    /**
     * Check if issue is performance-related
     */
    isPerformanceIssue(issue: any): boolean;
    /**
     * Categorize by affected area
     */
    categorizeByArea(issue: any): string;
    /**
     * Detect issues in files
     */
    detectIssuesInFiles(sources: string[]): Promise<any[]>;
    /**
     * Verify batch of issues
     */
    verifyBatch(issues: any[]): Promise<any[]>;
    /**
     * Aggregate verification results
     */
    aggregateResults(issues: any[]): any;
    /**
     * Generate verification report
     */
    generateVerificationReport(issue: any): Promise<any>;
    /**
     * Configuration methods
     */
    setConfidenceThreshold(threshold: number): void;
    getConfidenceThreshold(): number;
    setVerificationDepth(depth: 'basic' | 'thorough'): void;
    getVerificationDepth(): 'basic' | 'thorough';
    setAutoTODOCreation(enabled: boolean): void;
    isAutoTODOCreationEnabled(): boolean;
}
