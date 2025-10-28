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
import { CONTRACT_VERSION } from './agent-handoff-contract.js';
/**
 * Default validation options
 */
const DEFAULT_OPTIONS = {
    validateSchema: true,
    validateBusiness: true,
    validateMemory: true,
    validateQuality: true,
    strictMode: false,
    minQualityScore: 70
};
/**
 * Contract Validator
 */
export class ContractValidator {
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Validate contract before sending
     */
    async validateBeforeSend(contract) {
        const errors = [];
        const warnings = [];
        let score = 100;
        // Schema validation
        if (this.options.validateSchema) {
            const schemaResult = this.validateSchema(contract);
            errors.push(...schemaResult.errors);
            warnings.push(...schemaResult.warnings);
            score -= schemaResult.errors.length * 15;
            score -= schemaResult.warnings.length * 5;
        }
        // Business logic validation
        if (this.options.validateBusiness) {
            const businessResult = this.validateBusinessLogic(contract);
            errors.push(...businessResult.errors);
            warnings.push(...businessResult.warnings);
            score -= businessResult.errors.length * 10;
            score -= businessResult.warnings.length * 3;
        }
        // Memory snapshot validation
        if (this.options.validateMemory) {
            const memoryResult = this.validateMemorySnapshot(contract.memorySnapshot);
            errors.push(...memoryResult.errors);
            warnings.push(...memoryResult.warnings);
            score -= memoryResult.errors.length * 12;
            score -= memoryResult.warnings.length * 4;
        }
        // Quality gates validation
        if (this.options.validateQuality) {
            const qualityResult = this.validateQualityGates(contract);
            errors.push(...qualityResult.errors);
            warnings.push(...qualityResult.warnings);
            score -= qualityResult.errors.length * 8;
            score -= qualityResult.warnings.length * 2;
        }
        // Strict mode: warnings become errors
        if (this.options.strictMode) {
            warnings.forEach(warning => {
                errors.push({
                    field: warning.field,
                    message: warning.message,
                    severity: 'medium',
                    suggestion: warning.recommendation
                });
            });
            warnings.length = 0;
        }
        // Ensure score is within bounds
        score = Math.max(0, Math.min(100, score));
        // Check minimum quality score
        if (this.options.minQualityScore && score < this.options.minQualityScore) {
            errors.push({
                field: 'overall',
                message: `Contract quality score (${score}) below minimum (${this.options.minQualityScore})`,
                severity: 'high',
                suggestion: 'Address errors and warnings to improve score'
            });
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            score
        };
    }
    /**
     * Validate contract after receiving
     */
    async validateAfterReceive(contract) {
        // Same as before send, plus check expiration
        const result = await this.validateBeforeSend(contract);
        // Check if contract has expired
        if (contract.expiresAt && new Date() > contract.expiresAt) {
            result.errors.push({
                field: 'expiresAt',
                message: `Contract expired at ${contract.expiresAt.toISOString()}`,
                severity: 'critical',
                suggestion: 'Request updated contract from sender'
            });
            result.valid = false;
        }
        return result;
    }
    /**
     * Validate schema (required fields, types)
     */
    validateSchema(contract) {
        const errors = [];
        const warnings = [];
        // Required fields
        if (!contract.contractId) {
            errors.push({
                field: 'contractId',
                message: 'Contract ID is required',
                severity: 'critical'
            });
        }
        if (!contract.version) {
            errors.push({
                field: 'version',
                message: 'Contract version is required',
                severity: 'high'
            });
        }
        else if (contract.version !== CONTRACT_VERSION) {
            warnings.push({
                field: 'version',
                message: `Contract version (${contract.version}) differs from current (${CONTRACT_VERSION})`,
                impact: 'medium',
                recommendation: 'Update contract to current version'
            });
        }
        if (!contract.sender?.agentId) {
            errors.push({
                field: 'sender.agentId',
                message: 'Sender agent ID is required',
                severity: 'critical'
            });
        }
        if (!contract.receivers || contract.receivers.length === 0) {
            errors.push({
                field: 'receivers',
                message: 'At least one receiver is required',
                severity: 'critical'
            });
        }
        if (!contract.type) {
            errors.push({
                field: 'type',
                message: 'Handoff type is required',
                severity: 'high'
            });
        }
        if (!contract.workItems || contract.workItems.length === 0) {
            errors.push({
                field: 'workItems',
                message: 'At least one work item is required',
                severity: 'critical'
            });
        }
        if (!contract.memorySnapshot) {
            errors.push({
                field: 'memorySnapshot',
                message: 'Memory snapshot is required',
                severity: 'high',
                suggestion: 'Create snapshot before handoff'
            });
        }
        return { valid: errors.length === 0, errors, warnings, score: 100 };
    }
    /**
     * Validate business logic
     */
    validateBusinessLogic(contract) {
        const errors = [];
        const warnings = [];
        // Validate work items
        contract.workItems?.forEach((item, index) => {
            if (!item.id) {
                errors.push({
                    field: `workItems[${index}].id`,
                    message: 'Work item ID is required',
                    severity: 'high'
                });
            }
            if (!item.description || item.description.trim().length === 0) {
                errors.push({
                    field: `workItems[${index}].description`,
                    message: 'Work item description is required',
                    severity: 'medium'
                });
            }
            if (!item.acceptanceCriteria || item.acceptanceCriteria.length === 0) {
                warnings.push({
                    field: `workItems[${index}].acceptanceCriteria`,
                    message: 'Work item has no acceptance criteria',
                    impact: 'high',
                    recommendation: 'Define clear acceptance criteria'
                });
            }
            // Check for circular dependencies
            if (item.dependencies && item.dependencies.includes(item.id)) {
                errors.push({
                    field: `workItems[${index}].dependencies`,
                    message: 'Work item cannot depend on itself',
                    severity: 'medium'
                });
            }
        });
        // Validate expected output
        if (!contract.expectedOutput) {
            warnings.push({
                field: 'expectedOutput',
                message: 'No expected output defined',
                impact: 'high',
                recommendation: 'Define expected artifacts and success criteria'
            });
        }
        else {
            if (!contract.expectedOutput.artifacts || contract.expectedOutput.artifacts.length === 0) {
                warnings.push({
                    field: 'expectedOutput.artifacts',
                    message: 'No expected artifacts defined',
                    impact: 'medium',
                    recommendation: 'Specify what should be produced'
                });
            }
            if (!contract.expectedOutput.successCriteria || contract.expectedOutput.successCriteria.length === 0) {
                warnings.push({
                    field: 'expectedOutput.successCriteria',
                    message: 'No success criteria defined',
                    impact: 'high',
                    recommendation: 'Define clear success criteria'
                });
            }
        }
        // Validate handoff type matches receivers
        if (contract.type === 'sequential' && contract.receivers && contract.receivers.length > 1) {
            warnings.push({
                field: 'type',
                message: 'Sequential handoff with multiple receivers',
                impact: 'medium',
                recommendation: 'Use "parallel" type for multiple receivers'
            });
        }
        if (contract.type === 'parallel' && contract.receivers && contract.receivers.length === 1) {
            warnings.push({
                field: 'type',
                message: 'Parallel handoff with single receiver',
                impact: 'low',
                recommendation: 'Use "sequential" type for single receiver'
            });
        }
        return { valid: errors.length === 0, errors, warnings, score: 100 };
    }
    /**
     * Validate memory snapshot
     */
    validateMemorySnapshot(snapshot) {
        const errors = [];
        const warnings = [];
        if (!snapshot) {
            return { valid: false, errors: [{
                        field: 'memorySnapshot',
                        message: 'Memory snapshot is required',
                        severity: 'critical'
                    }], warnings: [], score: 0 };
        }
        if (!snapshot.agentId) {
            errors.push({
                field: 'memorySnapshot.agentId',
                message: 'Snapshot agent ID is required',
                severity: 'high'
            });
        }
        if (!snapshot.timestamp) {
            errors.push({
                field: 'memorySnapshot.timestamp',
                message: 'Snapshot timestamp is required',
                severity: 'medium'
            });
        }
        if (!snapshot.contextSummary || snapshot.contextSummary.trim().length === 0) {
            warnings.push({
                field: 'memorySnapshot.contextSummary',
                message: 'Context summary is empty',
                impact: 'high',
                recommendation: 'Provide summary of current context'
            });
        }
        if (!snapshot.memoryFiles || Object.keys(snapshot.memoryFiles).length === 0) {
            warnings.push({
                field: 'memorySnapshot.memoryFiles',
                message: 'No memory files in snapshot',
                impact: 'medium',
                recommendation: 'Include relevant memory files'
            });
        }
        if (!snapshot.criticalPatterns || snapshot.criticalPatterns.length === 0) {
            warnings.push({
                field: 'memorySnapshot.criticalPatterns',
                message: 'No critical patterns identified',
                impact: 'medium',
                recommendation: 'Extract critical patterns from memory'
            });
        }
        // Check token count
        if (snapshot.estimatedTokens === 0) {
            warnings.push({
                field: 'memorySnapshot.estimatedTokens',
                message: 'Token count not estimated',
                impact: 'low',
                recommendation: 'Estimate tokens for context management'
            });
        }
        else if (snapshot.estimatedTokens > 50000) {
            warnings.push({
                field: 'memorySnapshot.estimatedTokens',
                message: `Large snapshot (${snapshot.estimatedTokens} tokens)`,
                impact: 'medium',
                recommendation: 'Consider reducing snapshot size'
            });
        }
        return { valid: errors.length === 0, errors, warnings, score: 100 };
    }
    /**
     * Validate quality gates
     */
    validateQualityGates(contract) {
        const errors = [];
        const warnings = [];
        if (!contract.expectedOutput?.qualityGates) {
            warnings.push({
                field: 'expectedOutput.qualityGates',
                message: 'No quality gates defined',
                impact: 'high',
                recommendation: 'Define quality gates for validation'
            });
            return { valid: true, errors, warnings, score: 100 };
        }
        contract.expectedOutput.qualityGates.forEach((gate, index) => {
            if (!gate.name) {
                errors.push({
                    field: `expectedOutput.qualityGates[${index}].name`,
                    message: 'Quality gate name is required',
                    severity: 'medium'
                });
            }
            if (gate.threshold === undefined || gate.threshold === null) {
                warnings.push({
                    field: `expectedOutput.qualityGates[${index}].threshold`,
                    message: 'Quality gate threshold not defined',
                    impact: 'high',
                    recommendation: 'Define measurable threshold'
                });
            }
        });
        return { valid: errors.length === 0, errors, warnings, score: 100 };
    }
    /**
     * Validate three-tier contract (specialized)
     */
    validateThreeTier(contract) {
        // First, validate as normal contract
        const baseResult = this.validateSchema(contract);
        // Additional three-tier validations
        if (!contract.apiContract || !contract.apiContract.endpoints || contract.apiContract.endpoints.length === 0) {
            baseResult.errors.push({
                field: 'apiContract.endpoints',
                message: 'Three-tier contract requires API endpoints',
                severity: 'critical',
                suggestion: 'Define at least one API endpoint'
            });
        }
        if (!contract.databaseSchema || !contract.databaseSchema.tables || contract.databaseSchema.tables.length === 0) {
            baseResult.errors.push({
                field: 'databaseSchema.tables',
                message: 'Three-tier contract requires database schema',
                severity: 'critical',
                suggestion: 'Define at least one database table'
            });
        }
        if (!contract.uiRequirements || !contract.uiRequirements.components || contract.uiRequirements.components.length === 0) {
            baseResult.errors.push({
                field: 'uiRequirements.components',
                message: 'Three-tier contract requires UI components',
                severity: 'critical',
                suggestion: 'Define at least one UI component'
            });
        }
        // Verify receivers match three-tier (Dana, Marcus, James)
        const receiverIds = contract.receivers.map(r => r.agentId);
        const requiredAgents = ['dana-database', 'marcus-backend', 'james-frontend'];
        requiredAgents.forEach(agentId => {
            if (!receiverIds.includes(agentId)) {
                baseResult.warnings.push({
                    field: 'receivers',
                    message: `Three-tier handoff missing ${agentId}`,
                    impact: 'high',
                    recommendation: `Add ${agentId} to receivers`
                });
            }
        });
        baseResult.valid = baseResult.errors.length === 0;
        return baseResult;
    }
}
/**
 * Quick validation helper
 */
export async function validateContract(contract, options) {
    const validator = new ContractValidator(options);
    return validator.validateBeforeSend(contract);
}
//# sourceMappingURL=contract-validator.js.map