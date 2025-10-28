/**
 * Contract Validator
 *
 * Validates agent handoff contracts before transmission and after receipt
 * to ensure data integrity and completeness.
 *
 * Validation Levels:
 * - Schema: Required fields, types, structure
 * - Business: Work items, acceptance criteria, success criteria
 * - Memory: Snapshot completeness, token estimates
 * - Quality: Quality gates, expected outputs
 */
import { AgentHandoffContract, ThreeTierHandoffContract } from './agent-handoff-contract.js';
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    score: number;
}
/**
 * Validation error (must fix)
 */
export interface ValidationError {
    field: string;
    message: string;
    severity: 'critical' | 'high' | 'medium';
    suggestion?: string;
}
/**
 * Validation warning (should fix)
 */
export interface ValidationWarning {
    field: string;
    message: string;
    impact: 'low' | 'medium' | 'high';
    recommendation?: string;
}
/**
 * Validation options
 */
export interface ValidationOptions {
    /**
     * Validate schema (required fields, types)
     */
    validateSchema?: boolean;
    /**
     * Validate business logic (work items, criteria)
     */
    validateBusiness?: boolean;
    /**
     * Validate memory snapshot
     */
    validateMemory?: boolean;
    /**
     * Validate quality gates
     */
    validateQuality?: boolean;
    /**
     * Strict mode (warnings become errors)
     */
    strictMode?: boolean;
    /**
     * Minimum quality score (0-100)
     */
    minQualityScore?: number;
}
/**
 * Contract Validator
 */
export declare class ContractValidator {
    private options;
    constructor(options?: ValidationOptions);
    /**
     * Validate contract before sending
     */
    validateBeforeSend(contract: AgentHandoffContract): Promise<ValidationResult>;
    /**
     * Validate contract after receiving
     */
    validateAfterReceive(contract: AgentHandoffContract): Promise<ValidationResult>;
    /**
     * Validate schema (required fields, types)
     */
    private validateSchema;
    /**
     * Validate business logic
     */
    private validateBusinessLogic;
    /**
     * Validate memory snapshot
     */
    private validateMemorySnapshot;
    /**
     * Validate quality gates
     */
    private validateQualityGates;
    /**
     * Validate three-tier contract (specialized)
     */
    validateThreeTier(contract: ThreeTierHandoffContract): ValidationResult;
}
/**
 * Quick validation helper
 */
export declare function validateContract(contract: AgentHandoffContract, options?: ValidationOptions): Promise<ValidationResult>;
