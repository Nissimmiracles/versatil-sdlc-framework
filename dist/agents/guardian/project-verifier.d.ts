/**
 * VERSATIL SDLC Framework - Project Layer Verifier
 *
 * Verifies issues in the Project Layer (application code):
 * - Test coverage (≥80% per Maria-QA standards)
 * - Security vulnerabilities (npm audit, Semgrep)
 * - Code quality (ESLint, Prettier)
 * - Dependencies (outdated packages, CVEs)
 * - Accessibility (WCAG 2.1 AA for frontend)
 * - Performance (bundle size, API response times)
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 */
import type { HealthIssue } from './types.js';
export interface ProjectVerification {
    claim: string;
    verified: boolean;
    method: string;
    confidence: number;
    evidence?: {
        command?: string;
        exit_code?: number;
        output?: string;
        metrics?: Record<string, any>;
        error_details?: string;
    };
}
export interface ProjectVerificationResult {
    issue_id: string;
    layer: 'project';
    verified: boolean;
    confidence: number;
    verifications: ProjectVerification[];
    recommended_fix?: string;
}
/**
 * Verify project layer issue using ground truth methods
 */
export declare function verifyProjectIssue(issue: HealthIssue, workingDir: string): Promise<ProjectVerificationResult>;
