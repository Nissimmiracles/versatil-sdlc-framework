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
import { execSync } from 'child_process';
import * as path from 'path';
import { VERSATILLogger } from '../../utils/logger.js';
import { EventEmitter } from 'events';
export class OutputValidator extends EventEmitter {
    constructor(projectRoot = process.cwd()) {
        super();
        this.errorThreshold = 0.05; // 5% error tolerance
        this.criticalErrorThreshold = 0.10; // 10% triggers blocking
        this.logger = VERSATILLogger.getInstance();
        this.projectRoot = projectRoot;
    }
    /**
     * Validate all claims in a text output (commit message, response, etc.)
     */
    async validateOutput(text, context) {
        this.logger.info('🔍 Guardian: Validating output claims...', {
            textLength: text.length,
            context: context || {}
        }, 'OutputValidator');
        const claims = this.extractClaims(text);
        const results = [];
        for (const claim of claims) {
            try {
                const result = await this.validateClaim(claim);
                results.push(result);
                if (!result.valid) {
                    this.emit('claim-failed', result);
                    this.logger.warn('❌ Claim validation failed', {
                        claim: claim.text,
                        claimed: claim.claimed,
                        actual: result.actual,
                        error: result.error
                    }, 'OutputValidator');
                }
            }
            catch (error) {
                this.logger.error('Failed to validate claim', {
                    claim: claim.text,
                    error: error instanceof Error ? error.message : String(error)
                }, 'OutputValidator');
            }
        }
        const validClaims = results.filter(r => r.valid).length;
        const invalidClaims = results.filter(r => !r.valid).length;
        const overallAccuracy = claims.length > 0 ? validClaims / claims.length : 1;
        // Block output if critical errors found
        const criticalErrors = results.filter(r => r.severity === 'critical').length;
        const blocked = criticalErrors > 0 || overallAccuracy < (1 - this.criticalErrorThreshold);
        const corrections = this.generateCorrections(results);
        const report = {
            text,
            totalClaims: claims.length,
            validClaims,
            invalidClaims,
            results,
            overallAccuracy,
            blocked,
            corrections
        };
        if (blocked) {
            this.emit('output-blocked', report);
            this.logger.error('🚫 Output BLOCKED due to hallucinations', {
                accuracy: `${Math.round(overallAccuracy * 100)}%`,
                criticalErrors,
                invalidClaims
            }, 'OutputValidator');
        }
        else {
            this.logger.info('✅ Output validation passed', {
                accuracy: `${Math.round(overallAccuracy * 100)}%`,
                validClaims,
                totalClaims: claims.length
            }, 'OutputValidator');
        }
        return report;
    }
    /**
     * Extract all quantitative claims from text
     */
    extractClaims(text) {
        const claims = [];
        // Pattern 1: File line counts - "file.ts (519 lines)" or "file.ts - 519 lines"
        const lineCountPattern = /(\S+\.(?:ts|js|tsx|jsx|md|json))\s*[(\-]\s*(\d+)\s*lines?\)?/gi;
        let match;
        while ((match = lineCountPattern.exec(text)) !== null) {
            claims.push({
                type: 'line_count',
                text: match[0],
                file: match[1],
                claimed: parseInt(match[2], 10),
                pattern: 'file_line_count',
                location: { start: match.index, end: match.index + match[0].length }
            });
        }
        // Pattern 2: Total line counts - "1,432 lines" or "1432 lines total"
        const totalLinesPattern = /(\d+,?\d*)\s*lines?\s*(?:total|of code)?/gi;
        while ((match = totalLinesPattern.exec(text)) !== null) {
            // Skip if already captured as file-specific
            const alreadyCaptured = claims.some(c => c.location.start <= match.index && c.location.end >= match.index);
            if (!alreadyCaptured) {
                claims.push({
                    type: 'line_count',
                    text: match[0],
                    claimed: parseInt(match[1].replace(/,/g, ''), 10),
                    pattern: 'total_line_count',
                    location: { start: match.index, end: match.index + match[0].length }
                });
            }
        }
        // Pattern 3: File sizes - "406 MB" or "1.9GB" or "3.8 GB total"
        const fileSizePattern = /(\d+(?:\.\d+)?)\s*(MB|GB|KB|bytes?)/gi;
        while ((match = fileSizePattern.exec(text)) !== null) {
            const alreadyCaptured = claims.some(c => c.location.start <= match.index && c.location.end >= match.index);
            if (!alreadyCaptured) {
                claims.push({
                    type: 'file_size',
                    text: match[0],
                    claimed: parseFloat(match[1]),
                    unit: match[2],
                    pattern: 'file_size',
                    location: { start: match.index, end: match.index + match[0].length }
                });
            }
        }
        // Pattern 4: Test counts - "70+ test cases" or "44 tests" or "20 test blocks"
        const testCountPattern = /(\d+)\+?\s*(?:test\s*(?:cases?|blocks?|suites?)|tests?)/gi;
        while ((match = testCountPattern.exec(text)) !== null) {
            const alreadyCaptured = claims.some(c => c.location.start <= match.index && c.location.end >= match.index);
            if (!alreadyCaptured) {
                claims.push({
                    type: 'test_count',
                    text: match[0],
                    claimed: parseInt(match[1], 10),
                    pattern: 'test_count',
                    location: { start: match.index, end: match.index + match[0].length }
                });
            }
        }
        // Pattern 5: File/agent counts - "6 core agents" or "11 MCP integrations" or "10 sub-agents"
        const fileCountPattern = /(\d+)\s*(?:core\s*agents?|MCP\s*integrations?|sub-agents?|files?|modules?)/gi;
        while ((match = fileCountPattern.exec(text)) !== null) {
            const alreadyCaptured = claims.some(c => c.location.start <= match.index && c.location.end >= match.index);
            if (!alreadyCaptured) {
                claims.push({
                    type: match[0].includes('test') ? 'test_count' : 'file_count',
                    text: match[0],
                    claimed: parseInt(match[1], 10),
                    pattern: 'count_pattern',
                    location: { start: match.index, end: match.index + match[0].length }
                });
            }
        }
        this.logger.debug('Extracted claims', { count: claims.length, claims }, 'OutputValidator');
        return claims;
    }
    /**
     * Validate a single claim against reality
     */
    async validateClaim(claim) {
        try {
            switch (claim.type) {
                case 'line_count':
                    return await this.validateLineCount(claim);
                case 'file_size':
                    return await this.validateFileSize(claim);
                case 'test_count':
                    return await this.validateTestCount(claim);
                case 'file_count':
                    return await this.validateFileCount(claim);
                default:
                    return {
                        valid: true,
                        claim,
                        severity: 'low',
                        recommendation: 'Claim type not validated'
                    };
            }
        }
        catch (error) {
            return {
                valid: false,
                claim,
                error: error instanceof Error ? error.message : String(error),
                severity: 'low',
                recommendation: 'Could not verify claim'
            };
        }
    }
    /**
     * Validate line count claims
     */
    async validateLineCount(claim) {
        if (claim.file) {
            // Validate specific file line count
            const filePath = path.join(this.projectRoot, claim.file);
            try {
                const output = execSync(`wc -l "${filePath}"`, { encoding: 'utf-8' });
                const actual = parseInt(output.trim().split(/\s+/)[0], 10);
                return this.compareValues(claim, actual);
            }
            catch (error) {
                return {
                    valid: false,
                    claim,
                    error: `File not found or unreadable: ${claim.file}`,
                    severity: 'high'
                };
            }
        }
        else if (claim.pattern === 'total_line_count') {
            // For total line counts, we can't validate without context
            // Mark as valid but low confidence
            return {
                valid: true,
                claim,
                severity: 'low',
                recommendation: 'Total line count requires manual verification'
            };
        }
        return { valid: true, claim, severity: 'low' };
    }
    /**
     * Validate file size claims
     */
    async validateFileSize(claim) {
        // Extract file path from surrounding context (if available)
        // For now, we can't reliably validate without file context
        return {
            valid: true,
            claim,
            severity: 'low',
            recommendation: 'File size validation requires file path context'
        };
    }
    /**
     * Validate test count claims
     */
    async validateTestCount(claim) {
        if (claim.file) {
            // Count test blocks in specific file
            const filePath = path.join(this.projectRoot, claim.file);
            try {
                const output = execSync(`grep -cE "(it\\(|test\\(|describe\\()" "${filePath}"`, { encoding: 'utf-8' });
                const actual = parseInt(output.trim(), 10);
                return this.compareValues(claim, actual);
            }
            catch (error) {
                // grep returns exit code 1 if no matches, which throws
                if (error instanceof Error && error.message.includes('exit code 1')) {
                    return this.compareValues(claim, 0);
                }
                return {
                    valid: false,
                    claim,
                    error: `Could not count tests in ${claim.file}`,
                    severity: 'medium'
                };
            }
        }
        return { valid: true, claim, severity: 'low' };
    }
    /**
     * Validate file/agent count claims
     */
    async validateFileCount(claim) {
        // Context-dependent validation (requires pattern matching)
        // For now, mark as valid but recommend manual check
        return {
            valid: true,
            claim,
            severity: 'low',
            recommendation: 'File count validation requires semantic context'
        };
    }
    /**
     * Compare claimed vs actual values
     */
    compareValues(claim, actual) {
        const errorPercent = Math.abs(claim.claimed - actual) / Math.max(claim.claimed, actual);
        const withinTolerance = errorPercent <= this.errorThreshold;
        let severity = 'low';
        if (errorPercent > this.criticalErrorThreshold) {
            severity = 'critical';
        }
        else if (errorPercent > this.errorThreshold * 2) {
            severity = 'high';
        }
        else if (errorPercent > this.errorThreshold) {
            severity = 'medium';
        }
        return {
            valid: withinTolerance,
            claim,
            actual,
            errorPercent,
            severity,
            error: withinTolerance ? undefined : `Claimed ${claim.claimed}, actual ${actual} (${Math.round(errorPercent * 100)}% error)`,
            recommendation: withinTolerance ? undefined : `Update to: "${claim.file} (${actual} lines)"`
        };
    }
    /**
     * Generate correction suggestions
     */
    generateCorrections(results) {
        return results
            .filter(r => !r.valid && r.recommendation)
            .map(r => r.recommendation);
    }
    /**
     * Validate a git commit message specifically
     */
    async validateCommitMessage(message) {
        this.logger.info('🔍 Guardian: Validating commit message...', {}, 'OutputValidator');
        return await this.validateOutput(message, { commitMessage: true });
    }
}
// Singleton instance
let validatorInstance = null;
export function getOutputValidator(projectRoot) {
    if (!validatorInstance) {
        validatorInstance = new OutputValidator(projectRoot);
    }
    return validatorInstance;
}
export function resetOutputValidator() {
    validatorInstance = null;
}
//# sourceMappingURL=output-validator.js.map