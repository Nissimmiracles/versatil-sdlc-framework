/**
 * VERSATIL Framework - Output Validator (Anti-Hallucination Guardian)
 *
 * Validates Claude's textual output claims against filesystem reality.
 * Prevents hallucinations by verifying:
 * - File line counts (e.g., "519 lines")
 * - File sizes (e.g., "406 MB")
 * - Test counts (e.g., "70+ tests")
 * - Directory counts (e.g., "11 MCP integrations")
 * - Agent counts (e.g., "6 core agents")
 *
 * Created: 2025-11-02
 * Purpose: Fix root cause of line count hallucinations in commit fd1cc4b
 */
import { EventEmitter } from 'events';
export interface Claim {
    type: 'line_count' | 'file_size' | 'test_count' | 'file_count' | 'agent_count' | 'numeric';
    text: string;
    file?: string;
    claimed: number;
    unit?: string;
    pattern: string;
    location: {
        start: number;
        end: number;
    };
}
export interface ValidationResult {
    valid: boolean;
    claim: Claim;
    actual?: number;
    error?: string;
    errorPercent?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation?: string;
}
export interface OutputValidationReport {
    text: string;
    totalClaims: number;
    validClaims: number;
    invalidClaims: number;
    results: ValidationResult[];
    overallAccuracy: number;
    blocked: boolean;
    corrections: string[];
}
export declare class OutputValidator extends EventEmitter {
    private logger;
    private projectRoot;
    private errorThreshold;
    private criticalErrorThreshold;
    constructor(projectRoot?: string);
    /**
     * Validate all claims in a text output (commit message, response, etc.)
     */
    validateOutput(text: string, context?: {
        commitMessage?: boolean;
    }): Promise<OutputValidationReport>;
    /**
     * Extract all quantitative claims from text
     */
    private extractClaims;
    /**
     * Validate a single claim against reality
     */
    private validateClaim;
    /**
     * Validate line count claims
     */
    private validateLineCount;
    /**
     * Validate file size claims
     */
    private validateFileSize;
    /**
     * Validate test count claims
     */
    private validateTestCount;
    /**
     * Validate file/agent count claims
     */
    private validateFileCount;
    /**
     * Compare claimed vs actual values
     */
    private compareValues;
    /**
     * Generate correction suggestions
     */
    private generateCorrections;
    /**
     * Validate a git commit message specifically
     */
    validateCommitMessage(message: string): Promise<OutputValidationReport>;
}
export declare function getOutputValidator(projectRoot?: string): OutputValidator;
export declare function resetOutputValidator(): void;
