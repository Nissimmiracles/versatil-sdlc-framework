/**
 * VERSATIL SDLC Framework - Checkpoint Validator
 * Validates quality gates and coordination checkpoints between waves
 *
 * Features:
 * - Run quality gate validations (tests, coverage, security)
 * - Validate agent handoffs with context verification
 * - Blocking vs warning checkpoint modes
 * - Detailed validation reporting
 * - Rollback support on checkpoint failure
 *
 * @module orchestration/checkpoint-validator
 * @version 1.0.0
 */
/**
 * Checkpoint configuration
 */
export interface Checkpoint {
    /** Checkpoint name */
    checkpoint_name: string;
    /** Location (e.g., "After Wave 1") */
    location: string;
    /** Whether checkpoint blocks execution on failure */
    blocking: boolean;
    /** Quality gates to validate */
    quality_gates: string[];
    /** Validation steps to execute */
    validation_steps: string[];
    /** Optional agent handoff validation */
    handoff_agents?: Array<{
        from: string;
        to: string;
        context: string;
    }>;
}
/**
 * Quality gate validation result
 */
export interface QualityGateResult {
    /** Gate name */
    gate: string;
    /** Whether gate passed */
    passed: boolean;
    /** Result message */
    message: string;
    /** Optional output from validation */
    output?: string;
    /** Optional error details */
    error?: string;
    /** Execution time (ms) */
    execution_time?: number;
}
/**
 * Agent handoff validation result
 */
export interface HandoffValidationResult {
    /** Handoff description */
    from: string;
    to: string;
    context: string;
    /** Whether handoff is valid */
    passed: boolean;
    /** Validation message */
    message: string;
}
/**
 * Complete checkpoint validation result
 */
export interface CheckpointValidationResult {
    /** Checkpoint name */
    checkpoint_name: string;
    /** Overall pass/fail */
    passed: boolean;
    /** Whether checkpoint is blocking */
    blocking: boolean;
    /** Quality gate results */
    quality_gate_results: QualityGateResult[];
    /** Agent handoff results */
    handoff_results: HandoffValidationResult[];
    /** Warnings (non-blocking issues) */
    warnings: string[];
    /** Errors (blocking issues) */
    errors: string[];
    /** Total execution time (ms) */
    total_execution_time: number;
}
export declare class CheckpointValidator {
    private logger;
    constructor();
    /**
     * Validate a checkpoint
     */
    validate(checkpoint: Checkpoint): Promise<CheckpointValidationResult>;
    /**
     * Validate a single quality gate
     */
    private validateQualityGate;
    /**
     * Validate agent handoff
     */
    private validateAgentHandoff;
    /**
     * Find matching validation step for a quality gate
     */
    private findMatchingValidationStep;
    /**
     * Execute a validation step
     */
    private executeValidationStep;
    /**
     * Parse validation output to determine pass/fail
     */
    private parseValidationOutput;
    /**
     * Extract required coverage percentage from gate name
     */
    private extractRequiredCoverage;
    /**
     * Generate checkpoint report
     */
    generateReport(result: CheckpointValidationResult): string;
}
export default CheckpointValidator;
