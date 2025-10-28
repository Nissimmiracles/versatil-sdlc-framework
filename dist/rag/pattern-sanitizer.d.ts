/**
 * Pattern Sanitizer - Automated Private Data Removal for Public RAG
 *
 * Three-level sanitization system:
 * - Level 1: Keyword Detection (reject patterns with sensitive keywords)
 * - Level 2: Pattern Matching (redact sensitive data with regex)
 * - Level 3: Code Sanitization (transform code examples with placeholders)
 *
 * Ensures zero data leaks when storing patterns in Public RAG.
 */
export declare enum SanitizationLevel {
    NONE = "none",// No sanitization needed (public-safe)
    LIGHT = "light",// Pattern matching only
    MODERATE = "moderate",// Pattern matching + code transformation
    HEAVY = "heavy",// Full sanitization required
    REJECT = "reject"
}
export declare enum SanitizationDecision {
    ALLOW_AS_IS = "allow_as_is",// Public-safe, no changes
    ALLOW_AFTER_SANITIZATION = "allow_after_sanitization",// Safe after sanitization
    REJECT_UNSANITIZABLE = "reject_unsanitizable",// Cannot be made public-safe
    REJECT_BUSINESS_LOGIC = "reject_business_logic",// Proprietary/confidential
    REJECT_CREDENTIALS = "reject_credentials"
}
export interface SanitizationResult {
    decision: SanitizationDecision;
    level: SanitizationLevel;
    confidence: number;
    original: string;
    sanitized: string | null;
    warnings: string[];
    redactions: Array<{
        type: string;
        original: string;
        redacted: string;
        reason: string;
    }>;
    metadata: {
        projectSpecificIdentifiers: string[];
        sensitivePatterns: string[];
        codeTransformations: number;
    };
}
/**
 * Pattern Sanitizer Service
 */
export declare class PatternSanitizer {
    private projectFingerprint;
    private initialized;
    constructor();
    /**
     * Initialize sanitizer with project detection
     */
    initialize(): Promise<void>;
    /**
     * Sanitize a pattern for Public RAG storage
     */
    sanitize(input: string): Promise<SanitizationResult>;
    /**
     * Check for sensitive keywords (Level 1)
     */
    private checkSensitiveKeywords;
    /**
     * Get appropriate placeholder for project-specific identifier
     */
    private getPlaceholderForIdentifier;
    /**
     * Batch sanitize multiple patterns
     */
    sanitizeBatch(inputs: string[]): Promise<SanitizationResult[]>;
    /**
     * Get sanitization statistics
     */
    getStats(results: SanitizationResult[]): {
        total: number;
        allowedAsIs: number;
        allowedAfterSanitization: number;
        rejected: number;
        avgConfidence: number;
        totalRedactions: number;
    };
}
export declare function getPatternSanitizer(): PatternSanitizer;
export declare const patternSanitizer: PatternSanitizer;
