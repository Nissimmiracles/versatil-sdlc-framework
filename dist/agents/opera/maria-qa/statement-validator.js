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
import { getOutputValidator } from '../../guardian/output-validator.js';
import { VERSATILLogger } from '../../../utils/logger.js';
import { EventEmitter } from 'events';
export class StatementValidator extends EventEmitter {
    constructor(config) {
        super();
        this.logger = VERSATILLogger.getInstance();
        this.outputValidator = getOutputValidator();
        this.config = {
            enableAutoCorrection: config?.enableAutoCorrection ?? true,
            blockOnHallucination: config?.blockOnHallucination ?? false,
            accuracyThreshold: config?.accuracyThreshold ?? 0.95,
            validateComments: config?.validateComments ?? true,
            validateDocumentation: config?.validateDocumentation ?? true,
            validateResponses: config?.validateResponses ?? true
        };
        this.logger.info('📋 Maria-QA Statement Validator initialized', {
            config: this.config
        }, 'StatementValidator');
    }
    /**
     * Validate and optionally correct a statement
     */
    async validateStatement(text, context) {
        this.logger.debug('Validating statement', {
            textLength: text.length,
            context: context || {}
        }, 'StatementValidator');
        // Run Guardian validation
        const report = await this.outputValidator.validateOutput(text);
        const result = {
            original: text,
            report,
            autoFixed: false,
            requiresManualReview: report.invalidClaims > 0
        };
        // Attempt auto-correction if enabled
        if (this.config.enableAutoCorrection && report.corrections.length > 0) {
            result.corrected = this.applyCorrections(text, report);
            result.autoFixed = true;
            this.logger.info('✏️ Auto-corrected statement', {
                originalClaims: report.totalClaims,
                invalidClaims: report.invalidClaims,
                corrections: report.corrections.length
            }, 'StatementValidator');
        }
        // Emit events for monitoring
        if (report.blocked) {
            this.emit('hallucination-detected', result);
            this.logger.warn('🚫 Hallucination detected and blocked', {
                accuracy: `${Math.round(report.overallAccuracy * 100)}%`,
                invalidClaims: report.invalidClaims
            }, 'StatementValidator');
        }
        else if (report.invalidClaims > 0) {
            this.emit('minor-inaccuracy', result);
            this.logger.warn('⚠️ Minor inaccuracies detected', {
                accuracy: `${Math.round(report.overallAccuracy * 100)}%`,
                invalidClaims: report.invalidClaims
            }, 'StatementValidator');
        }
        // Check accuracy threshold
        if (report.overallAccuracy < this.config.accuracyThreshold) {
            result.requiresManualReview = true;
            this.logger.warn('📋 Statement requires manual review', {
                accuracy: `${Math.round(report.overallAccuracy * 100)}%`,
                threshold: `${Math.round(this.config.accuracyThreshold * 100)}%`
            }, 'StatementValidator');
        }
        return result;
    }
    /**
     * Validate code comments for accuracy
     */
    async validateCodeComments(fileContent, filePath) {
        if (!this.config.validateComments) {
            return [];
        }
        const comments = this.extractComments(fileContent);
        const results = [];
        for (const comment of comments) {
            const result = await this.validateStatement(comment.text, {
                type: 'comment',
                source: `${filePath}:${comment.line}`
            });
            if (result.requiresManualReview) {
                results.push(result);
            }
        }
        if (results.length > 0) {
            this.logger.info('📝 Code comment validation complete', {
                file: filePath,
                totalComments: comments.length,
                requiresReview: results.length
            }, 'StatementValidator');
        }
        return results;
    }
    /**
     * Validate documentation files (markdown)
     */
    async validateDocumentation(content, filePath) {
        if (!this.config.validateDocumentation) {
            return {
                original: content,
                report: {
                    text: content,
                    totalClaims: 0,
                    validClaims: 0,
                    invalidClaims: 0,
                    results: [],
                    overallAccuracy: 1,
                    blocked: false,
                    corrections: []
                },
                autoFixed: false,
                requiresManualReview: false
            };
        }
        return await this.validateStatement(content, {
            type: 'documentation',
            source: filePath
        });
    }
    /**
     * Validate agent response before showing to user
     */
    async validateResponse(response, agentName) {
        if (!this.config.validateResponses) {
            return {
                original: response,
                report: {
                    text: response,
                    totalClaims: 0,
                    validClaims: 0,
                    invalidClaims: 0,
                    results: [],
                    overallAccuracy: 1,
                    blocked: false,
                    corrections: []
                },
                autoFixed: false,
                requiresManualReview: false
            };
        }
        const result = await this.validateStatement(response, {
            type: 'response',
            source: agentName || 'unknown'
        });
        // Block response if configured and hallucinations detected
        if (this.config.blockOnHallucination && result.report.blocked) {
            this.logger.error('🚫 BLOCKED: Agent response contains hallucinations', {
                agent: agentName,
                accuracy: `${Math.round(result.report.overallAccuracy * 100)}%`
            }, 'StatementValidator');
            throw new Error(`Response blocked due to hallucinations. ` +
                `Accuracy: ${Math.round(result.report.overallAccuracy * 100)}%. ` +
                `Invalid claims: ${result.report.invalidClaims}/${result.report.totalClaims}`);
        }
        return result;
    }
    /**
     * Extract comments from source code
     */
    extractComments(content) {
        const comments = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Single-line comment
            const singleLineMatch = line.match(/\/\/\s*(.+)$/);
            if (singleLineMatch) {
                comments.push({
                    text: singleLineMatch[1].trim(),
                    line: i + 1
                });
            }
            // Multi-line comment (simplified)
            const multiLineMatch = line.match(/\/\*\s*(.+?)\s*\*\//);
            if (multiLineMatch) {
                comments.push({
                    text: multiLineMatch[1].trim(),
                    line: i + 1
                });
            }
        }
        return comments;
    }
    /**
     * Apply corrections to text
     */
    applyCorrections(text, report) {
        let corrected = text;
        for (const result of report.results) {
            if (!result.valid && result.recommendation && result.claim.file) {
                // Replace incorrect claim with corrected version
                corrected = corrected.replace(result.claim.text, result.recommendation);
            }
        }
        return corrected;
    }
    /**
     * Generate validation summary report
     */
    generateReport(results) {
        return {
            totalStatements: results.length,
            accurate: results.filter(r => r.report.overallAccuracy >= this.config.accuracyThreshold).length,
            requiresReview: results.filter(r => r.requiresManualReview).length,
            autoFixed: results.filter(r => r.autoFixed).length,
            blocked: results.filter(r => r.report.blocked).length
        };
    }
}
// Singleton instance
let validatorInstance = null;
export function getStatementValidator(config) {
    if (!validatorInstance) {
        validatorInstance = new StatementValidator(config);
    }
    return validatorInstance;
}
export function resetStatementValidator() {
    validatorInstance = null;
}
//# sourceMappingURL=statement-validator.js.map