/**
 * VERSATIL Framework - Maria-QA Statement Validator Extension
 *
 * Extends Maria-QA's capabilities to validate textual claims in code comments,
 * documentation, and agent responses.
 *
 * Integration with Guardian Output Validator for comprehensive anti-hallucination.
 *
 * Created: 2025-11-02
 * Purpose: Proactive statement validation before user sees output
 */
import { OutputValidationReport } from '../../guardian/output-validator.js';
import { EventEmitter } from 'events';
export interface StatementValidationConfig {
    enableAutoCorrection: boolean;
    blockOnHallucination: boolean;
    accuracyThreshold: number;
    validateComments: boolean;
    validateDocumentation: boolean;
    validateResponses: boolean;
}
export interface ValidatedStatement {
    original: string;
    corrected?: string;
    report: OutputValidationReport;
    autoFixed: boolean;
    requiresManualReview: boolean;
}
export declare class StatementValidator extends EventEmitter {
    private logger;
    private outputValidator;
    private config;
    constructor(config?: Partial<StatementValidationConfig>);
    /**
     * Validate and optionally correct a statement
     */
    validateStatement(text: string, context?: {
        type?: 'comment' | 'documentation' | 'response' | 'commit';
        source?: string;
    }): Promise<ValidatedStatement>;
    /**
     * Validate code comments for accuracy
     */
    validateCodeComments(fileContent: string, filePath: string): Promise<ValidatedStatement[]>;
    /**
     * Validate documentation files (markdown)
     */
    validateDocumentation(content: string, filePath: string): Promise<ValidatedStatement>;
    /**
     * Validate agent response before showing to user
     */
    validateResponse(response: string, agentName?: string): Promise<ValidatedStatement>;
    /**
     * Extract comments from source code
     */
    private extractComments;
    /**
     * Apply corrections to text
     */
    private applyCorrections;
    /**
     * Generate validation summary report
     */
    generateReport(results: ValidatedStatement[]): {
        totalStatements: number;
        accurate: number;
        requiresReview: number;
        autoFixed: number;
        blocked: number;
    };
}
export declare function getStatementValidator(config?: Partial<StatementValidationConfig>): StatementValidator;
export declare function resetStatementValidator(): void;
