#!/usr/bin/env ts-node
/**
 * Assessment Engine for Victor-Verifier
 *
 * PURPOSE:
 * Extends verification (ground truth checking) with quality assessment (standards checking)
 *
 * DISTINCTION:
 * - Verification: "Did file get created?" → YES/NO
 * - Assessment: "Does file meet quality standards?" → PASS/FAIL (coverage ≥80%, no vulnerabilities)
 *
 * RESEARCH:
 * Industry research (2025): "Before trusting an AI agent's work, auditors must conduct
 * quality checks just as they would with a junior team member"
 */
export interface Claim {
    text: string;
    category: 'FileCreation' | 'FileEdit' | 'GitCommit' | 'CommandExecution' | 'DataAssertion' | 'Metric';
    extractedFrom: string;
    confidence: number;
    needsVerification: boolean;
    filePath?: string;
    context?: string;
}
export interface AssessmentPlan {
    claim: Claim;
    needsAssessment: boolean;
    reason: string;
    assessments: Assessment[];
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedDuration: string;
}
export interface Assessment {
    type: 'Security' | 'TestCoverage' | 'Performance' | 'Accessibility' | 'CodeQuality' | 'APICompliance';
    tool: 'semgrep' | 'jest' | 'lighthouse' | 'axe-core' | 'eslint' | 'api-linter' | 'bandit' | 'safety';
    command: string;
    threshold?: number;
    mandatory: boolean;
    reason: string;
}
export interface AssessmentResult {
    assessment: Assessment;
    executed: boolean;
    passed: boolean;
    score?: number;
    issues: AssessmentIssue[];
    output: string;
    duration: string;
    timestamp: string;
}
export interface AssessmentIssue {
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    message: string;
    file?: string;
    line?: number;
    recommendation?: string;
}
export interface AssessmentConfig {
    assessmentRules: {
        [pattern: string]: {
            patterns: string[];
            assessments: Assessment[];
            priority: 'critical' | 'high' | 'medium' | 'low';
        };
    };
    thresholds: {
        testCoverage: number;
        securityVulnerabilities: number;
        performanceScore: number;
        accessibilityScore: number;
    };
}
export declare class AssessmentEngine {
    private config;
    private workingDir;
    constructor(workingDir: string, configPath?: string);
    /**
     * Step 1: Detect if a claim needs quality assessment beyond verification
     */
    needsAssessment(claim: Claim): boolean;
    /**
     * Step 2: Plan which assessments to run based on claim context
     */
    planAssessment(claim: Claim): AssessmentPlan;
    /**
     * Step 3: Execute assessments (Phase 2 - not implemented yet)
     *
     * PHASE 1: Just log assessment requirements
     * PHASE 2: Actually execute tools and parse outputs
     */
    executeAssessment(plan: AssessmentPlan): Promise<AssessmentResult[]>;
    private matchesPattern;
    private deduplicateAssessments;
    private estimateDuration;
    private getDefaultConfig;
}
export default AssessmentEngine;
