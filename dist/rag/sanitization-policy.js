/**
 * Sanitization Policy - Decision Engine for Public RAG Storage
 *
 * Determines whether a pattern can be stored in Public RAG and what
 * sanitization level is required. Implements policy rules for:
 * - Pattern classification (public-safe vs private-only)
 * - Sanitization requirement assessment
 * - Storage destination routing
 * - User confirmation workflows
 */
import { getPatternSanitizer, SanitizationDecision, SanitizationLevel } from './pattern-sanitizer.js';
export var PatternClassification;
(function (PatternClassification) {
    PatternClassification["PUBLIC_SAFE"] = "public_safe";
    PatternClassification["REQUIRES_SANITIZATION"] = "requires_sanitization";
    PatternClassification["PRIVATE_ONLY"] = "private_only";
    PatternClassification["CREDENTIALS"] = "credentials";
    PatternClassification["UNSANITIZABLE"] = "unsanitizable"; // Too project-specific to sanitize
})(PatternClassification || (PatternClassification = {}));
export var StorageDestination;
(function (StorageDestination) {
    StorageDestination["PUBLIC_ONLY"] = "public_only";
    StorageDestination["PRIVATE_ONLY"] = "private_only";
    StorageDestination["BOTH"] = "both";
    StorageDestination["NONE"] = "none"; // Do not store (blocked)
})(StorageDestination || (StorageDestination = {}));
/**
 * Sanitization Policy Engine
 */
export class SanitizationPolicy {
    constructor() {
        this.sanitizer = getPatternSanitizer();
    }
    /**
     * Evaluate pattern and determine storage policy
     */
    async evaluatePattern(pattern) {
        // SECURITY: Block workflow files and secrets immediately (CRITICAL)
        const filePath = pattern.filePath || '';
        if (filePath.startsWith('.github/workflows/') ||
            filePath.startsWith('.github/secrets/') ||
            filePath.includes('secrets') ||
            filePath.endsWith('.env') ||
            filePath.endsWith('.env.local') ||
            filePath.endsWith('.env.production') ||
            filePath.includes('credentials') ||
            filePath.includes('private-key') ||
            filePath.endsWith('.pem') ||
            filePath.endsWith('.key')) {
            return {
                classification: PatternClassification.CREDENTIALS,
                destination: StorageDestination.PRIVATE_ONLY,
                requiresUserConfirmation: false,
                sanitizationRequired: false,
                sanitizationResult: null,
                reasoning: [
                    `File path "${filePath}" contains sensitive security information`,
                    'Workflow files contain GitHub secrets and deployment credentials',
                    'These files are always private-only and should never be extracted for Public RAG'
                ],
                recommendations: [
                    'Workflow files are blocked at extraction stage',
                    'Secret files must remain private',
                    'Never extract .env or credential files'
                ]
            };
        }
        // Combine all pattern text for analysis
        const fullText = `${pattern.pattern} ${pattern.description || ''} ${pattern.code || ''}`;
        // Run sanitization analysis
        const sanitizationResult = await this.sanitizer.sanitize(fullText);
        // Determine classification based on sanitization result
        const classification = this.classifyPattern(sanitizationResult, pattern);
        // Determine storage destination
        const destination = this.determineDestination(classification, sanitizationResult);
        // Determine if user confirmation is needed
        const requiresUserConfirmation = this.shouldRequireConfirmation(classification, sanitizationResult);
        // Generate reasoning and recommendations
        const reasoning = this.generateReasoning(classification, sanitizationResult, pattern);
        const recommendations = this.generateRecommendations(classification, destination, sanitizationResult);
        return {
            classification,
            destination,
            requiresUserConfirmation,
            sanitizationRequired: sanitizationResult.level !== SanitizationLevel.NONE,
            sanitizationResult: sanitizationResult.level !== SanitizationLevel.NONE ? sanitizationResult : null,
            reasoning,
            recommendations
        };
    }
    /**
     * Classify pattern based on sanitization result
     */
    classifyPattern(sanitizationResult, pattern) {
        switch (sanitizationResult.decision) {
            case SanitizationDecision.ALLOW_AS_IS:
                return PatternClassification.PUBLIC_SAFE;
            case SanitizationDecision.ALLOW_AFTER_SANITIZATION:
                if (sanitizationResult.level === SanitizationLevel.LIGHT || sanitizationResult.level === SanitizationLevel.MODERATE) {
                    return PatternClassification.REQUIRES_SANITIZATION;
                }
                else {
                    // Heavy sanitization - pattern may be too project-specific
                    return PatternClassification.UNSANITIZABLE;
                }
            case SanitizationDecision.REJECT_CREDENTIALS:
                return PatternClassification.CREDENTIALS;
            case SanitizationDecision.REJECT_BUSINESS_LOGIC:
                return PatternClassification.PRIVATE_ONLY;
            case SanitizationDecision.REJECT_UNSANITIZABLE:
                return PatternClassification.UNSANITIZABLE;
            default:
                return PatternClassification.PRIVATE_ONLY;
        }
    }
    /**
     * Determine storage destination based on classification
     */
    determineDestination(classification, sanitizationResult) {
        switch (classification) {
            case PatternClassification.PUBLIC_SAFE:
                // Generic framework pattern - can go to Public RAG directly
                return StorageDestination.PUBLIC_ONLY;
            case PatternClassification.REQUIRES_SANITIZATION:
                // Can be sanitized - offer "Both" option (Private + sanitized Public)
                if (sanitizationResult.confidence >= 85) {
                    return StorageDestination.BOTH;
                }
                else {
                    // Lower confidence - safer to keep Private only
                    return StorageDestination.PRIVATE_ONLY;
                }
            case PatternClassification.PRIVATE_ONLY:
            case PatternClassification.CREDENTIALS:
            case PatternClassification.UNSANITIZABLE:
                // Cannot be made public-safe
                return StorageDestination.PRIVATE_ONLY;
            default:
                return StorageDestination.PRIVATE_ONLY;
        }
    }
    /**
     * Determine if user confirmation is required
     */
    shouldRequireConfirmation(classification, sanitizationResult) {
        // Always require confirmation for sanitized patterns
        if (classification === PatternClassification.REQUIRES_SANITIZATION) {
            return true;
        }
        // Require confirmation for public-safe patterns if confidence < 100%
        if (classification === PatternClassification.PUBLIC_SAFE && sanitizationResult.confidence < 100) {
            return true;
        }
        // No confirmation needed for private-only patterns
        return false;
    }
    /**
     * Generate reasoning for the decision
     */
    generateReasoning(classification, sanitizationResult, pattern) {
        const reasoning = [];
        switch (classification) {
            case PatternClassification.PUBLIC_SAFE:
                reasoning.push('✅ Pattern is public-safe: Contains only generic framework patterns');
                reasoning.push(`   Confidence: ${sanitizationResult.confidence}%`);
                if (sanitizationResult.warnings.length === 0) {
                    reasoning.push('   No sensitive data detected');
                }
                break;
            case PatternClassification.REQUIRES_SANITIZATION:
                reasoning.push('⚠️  Pattern requires sanitization: Contains project-specific details');
                reasoning.push(`   Sanitization level: ${sanitizationResult.level}`);
                reasoning.push(`   Redactions: ${sanitizationResult.redactions.length}`);
                reasoning.push(`   Code transformations: ${sanitizationResult.metadata.codeTransformations}`);
                reasoning.push(`   Confidence after sanitization: ${sanitizationResult.confidence}%`);
                break;
            case PatternClassification.CREDENTIALS:
                reasoning.push('❌ Pattern contains credentials: Cannot be made public');
                reasoning.push('   Detected keywords: ' + sanitizationResult.metadata.sensitivePatterns.join(', '));
                reasoning.push('   Recommendation: Store in Private RAG only');
                break;
            case PatternClassification.PRIVATE_ONLY:
                reasoning.push('🔒 Pattern is proprietary: Business logic or internal processes');
                reasoning.push('   Detected keywords: ' + sanitizationResult.metadata.sensitivePatterns.join(', '));
                reasoning.push('   Recommendation: Store in Private RAG only');
                break;
            case PatternClassification.UNSANITIZABLE:
                reasoning.push('❌ Pattern is too project-specific: Cannot be sanitized safely');
                reasoning.push(`   Would require ${sanitizationResult.redactions.length} redactions`);
                reasoning.push('   Pattern would lose too much context after sanitization');
                reasoning.push('   Recommendation: Store in Private RAG only');
                break;
        }
        return reasoning;
    }
    /**
     * Generate recommendations for the user
     */
    generateRecommendations(classification, destination, sanitizationResult) {
        const recommendations = [];
        switch (destination) {
            case StorageDestination.PUBLIC_ONLY:
                recommendations.push('💡 This pattern will help the VERSATIL community');
                recommendations.push('   Framework users will benefit from this generic pattern');
                break;
            case StorageDestination.BOTH:
                recommendations.push('💡 Recommended: Store in both Private and Public RAG');
                recommendations.push('   Private: Keep your complete implementation');
                recommendations.push('   Public: Share sanitized version to help community');
                recommendations.push(`   Sanitization confidence: ${sanitizationResult.confidence}%`);
                break;
            case StorageDestination.PRIVATE_ONLY:
                if (classification === PatternClassification.CREDENTIALS) {
                    recommendations.push('🔐 Security: This pattern contains credentials');
                    recommendations.push('   Must be stored in Private RAG only');
                    recommendations.push('   Never share patterns with secrets/credentials');
                }
                else if (classification === PatternClassification.PRIVATE_ONLY) {
                    recommendations.push('🔒 Privacy: This pattern is proprietary');
                    recommendations.push('   Keep in Private RAG for your competitive advantage');
                    recommendations.push('   Consider extracting generic framework patterns separately');
                }
                else if (classification === PatternClassification.UNSANITIZABLE) {
                    recommendations.push('⚠️  Too project-specific to sanitize safely');
                    recommendations.push('   Pattern would lose too much context');
                    recommendations.push('   Keep in Private RAG for accurate future reference');
                }
                break;
            case StorageDestination.NONE:
                recommendations.push('❌ Pattern cannot be stored');
                recommendations.push('   Contains unsanitizable sensitive data');
                break;
        }
        return recommendations;
    }
    /**
     * Batch evaluate multiple patterns
     */
    async evaluatePatterns(patterns) {
        const decisions = [];
        for (const pattern of patterns) {
            const decision = await this.evaluatePattern(pattern);
            decisions.push(decision);
        }
        return decisions;
    }
    /**
     * Get evaluation statistics
     */
    getEvaluationStats(decisions) {
        const stats = {
            total: decisions.length,
            publicSafe: 0,
            requiresSanitization: 0,
            privateOnly: 0,
            credentials: 0,
            unsanitizable: 0,
            destinations: {
                [StorageDestination.PUBLIC_ONLY]: 0,
                [StorageDestination.PRIVATE_ONLY]: 0,
                [StorageDestination.BOTH]: 0,
                [StorageDestination.NONE]: 0
            }
        };
        for (const decision of decisions) {
            // Count classifications
            switch (decision.classification) {
                case PatternClassification.PUBLIC_SAFE:
                    stats.publicSafe++;
                    break;
                case PatternClassification.REQUIRES_SANITIZATION:
                    stats.requiresSanitization++;
                    break;
                case PatternClassification.PRIVATE_ONLY:
                    stats.privateOnly++;
                    break;
                case PatternClassification.CREDENTIALS:
                    stats.credentials++;
                    break;
                case PatternClassification.UNSANITIZABLE:
                    stats.unsanitizable++;
                    break;
            }
            // Count destinations
            stats.destinations[decision.destination]++;
        }
        return stats;
    }
    /**
     * Generate user-friendly decision summary
     */
    generateDecisionSummary(decisions) {
        const stats = this.getEvaluationStats(decisions);
        const lines = [
            '## Sanitization Policy Evaluation Summary',
            '',
            `**Total Patterns**: ${stats.total}`,
            '',
            '### Classifications:',
            `- ✅ Public-safe: ${stats.publicSafe}`,
            `- ⚠️  Requires sanitization: ${stats.requiresSanitization}`,
            `- 🔒 Private-only: ${stats.privateOnly}`,
            `- 🔐 Credentials detected: ${stats.credentials}`,
            `- ❌ Unsanitizable: ${stats.unsanitizable}`,
            '',
            '### Storage Destinations:',
            `- 🌍 Public RAG: ${stats.destinations[StorageDestination.PUBLIC_ONLY]}`,
            `- 🔒 Private RAG: ${stats.destinations[StorageDestination.PRIVATE_ONLY]}`,
            `- 🔄 Both (Private + Public sanitized): ${stats.destinations[StorageDestination.BOTH]}`,
            `- ❌ None (blocked): ${stats.destinations[StorageDestination.NONE]}`,
            ''
        ];
        return lines.join('\n');
    }
}
// Export singleton instance
let policyInstance = null;
export function getSanitizationPolicy() {
    if (!policyInstance) {
        policyInstance = new SanitizationPolicy();
    }
    return policyInstance;
}
export const sanitizationPolicy = getSanitizationPolicy();
//# sourceMappingURL=sanitization-policy.js.map