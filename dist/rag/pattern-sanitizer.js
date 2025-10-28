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
import { detectProjectFingerprint } from './project-detector.js';
export var SanitizationLevel;
(function (SanitizationLevel) {
    SanitizationLevel["NONE"] = "none";
    SanitizationLevel["LIGHT"] = "light";
    SanitizationLevel["MODERATE"] = "moderate";
    SanitizationLevel["HEAVY"] = "heavy";
    SanitizationLevel["REJECT"] = "reject"; // Cannot be sanitized, private-only
})(SanitizationLevel || (SanitizationLevel = {}));
export var SanitizationDecision;
(function (SanitizationDecision) {
    SanitizationDecision["ALLOW_AS_IS"] = "allow_as_is";
    SanitizationDecision["ALLOW_AFTER_SANITIZATION"] = "allow_after_sanitization";
    SanitizationDecision["REJECT_UNSANITIZABLE"] = "reject_unsanitizable";
    SanitizationDecision["REJECT_BUSINESS_LOGIC"] = "reject_business_logic";
    SanitizationDecision["REJECT_CREDENTIALS"] = "reject_credentials"; // Contains secrets/credentials
})(SanitizationDecision || (SanitizationDecision = {}));
/**
 * Sensitive keyword patterns for Level 1 detection
 */
const SENSITIVE_KEYWORDS = {
    // Credentials and secrets
    credentials: [
        'password', 'secret', 'api-key', 'api_key', 'apikey',
        'token', 'credential', 'auth-token', 'bearer', 'access_token',
        'private_key', 'service_account', 'oauth_secret'
    ],
    // Business logic
    businessLogic: [
        'proprietary', 'internal', 'confidential', 'private',
        'company-specific', 'client-specific', 'custom-logic',
        'business-logic', 'workflow:', 'process:', 'internal-api',
        'private-endpoint', 'legacy system', 'our company', 'our app'
    ],
    // Infrastructure
    infrastructure: [
        'production', 'staging', 'internal-service',
        'database-password', 'db-password', 'connection-string'
    ],
    // Personal identifiers (but allow if followed by generic examples)
    personal: [
        'acme corp', 'client-name', 'customer-name',
        'company-name', 'organization-name'
    ]
};
/**
 * Redaction patterns for Level 2 (regex-based)
 */
const REDACTION_PATTERNS = [
    // GCP Project IDs (format: project-name-123456-ab)
    {
        pattern: /[a-z][a-z0-9-]+-\d{6,12}-[a-z0-9]{2}/g,
        replacement: 'YOUR_PROJECT_ID',
        type: 'gcp_project_id'
    },
    // Service account emails
    {
        pattern: /\d{12,}-compute@developer\.gserviceaccount\.com/g,
        replacement: 'YOUR_SERVICE_ACCOUNT@developer.gserviceaccount.com',
        type: 'service_account'
    },
    // Cloud Run URLs (specific project IDs)
    {
        pattern: /https:\/\/[a-z0-9-]+-\d{12,}-[a-z0-9]+\.a\.run\.app/g,
        replacement: 'https://your-service-XXXXXXXXXX-uc.a.run.app',
        type: 'cloud_run_url'
    },
    // Generic URLs with private hostnames
    {
        pattern: /https?:\/\/(?!(?:github\.com|stackoverflow\.com|docs\.|api\.|www\.))([a-z0-9-]+\.)+[a-z]{2,}/g,
        replacement: 'https://your-domain.com',
        type: 'private_url'
    },
    // IP addresses
    {
        pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        replacement: '[IP_ADDRESS]',
        type: 'ip_address'
    },
    // Email addresses (but preserve example.com, test.com)
    {
        pattern: /[a-zA-Z0-9._%+-]+@(?!(?:example\.com|test\.com|gmail\.com))[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        replacement: '[EMAIL_REDACTED]',
        type: 'email'
    },
    // Database connection strings
    {
        pattern: /(?:postgres|mysql|mongodb):\/\/[^\s]+/g,
        replacement: '[DB_CONNECTION_REDACTED]',
        type: 'db_connection'
    },
    // AWS ARNs
    {
        pattern: /arn:aws:[a-z0-9-]+:[a-z0-9-]*:[0-9]*:[^\s]+/g,
        replacement: '[ARN_REDACTED]',
        type: 'aws_arn'
    },
    // Firestore database names (versatil-*-rag, *-public-rag, *-private-rag)
    {
        pattern: /versatil-public-rag|versatil-private-rag|[a-z0-9-]+-(?:public|private)-rag/g,
        replacement: 'YOUR_DATABASE_NAME',
        type: 'database_name'
    },
    // GitHub Secret format in YAML - Project ID
    {
        pattern: /PUBLIC_RAG_PROJECT_ID:\s*["']?([a-z][a-z0-9-]+-\d{6,12}-[a-z0-9]{2})["']?/gi,
        replacement: 'PUBLIC_RAG_PROJECT_ID: YOUR_PROJECT_ID',
        type: 'github_secret_project_id'
    },
    // GitHub Secret format in YAML - Database
    {
        pattern: /PUBLIC_RAG_DATABASE:\s*["']?([^"'\n\s]+)["']?/gi,
        replacement: 'PUBLIC_RAG_DATABASE: YOUR_DATABASE_NAME',
        type: 'github_secret_database'
    },
    // GitHub Secret format in YAML - Generic secrets
    {
        pattern: /\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/g,
        replacement: '${{ secrets.YOUR_SECRET }}',
        type: 'github_secret_reference'
    },
    // API keys and tokens (32+ chars alphanumeric)
    {
        pattern: /\b[A-Za-z0-9]{32,}\b/g,
        replacement: '[TOKEN_REDACTED]',
        type: 'token'
    },
    // Environment variables with specific values
    {
        pattern: /process\.env\.[A-Z_]+=["']([^"']+)["']/g,
        replacement: 'process.env.$1="[VALUE_REDACTED]"',
        type: 'env_var_value'
    },
    // File paths with usernames (home directories)
    {
        pattern: /\/Users\/[^/\s]+/g,
        replacement: '~',
        type: 'home_dir_macos'
    },
    {
        pattern: /\/home\/[^/\s]+/g,
        replacement: '~',
        type: 'home_dir_linux'
    },
    {
        pattern: /C:\\Users\\[^\\]+/g,
        replacement: '%USERPROFILE%',
        type: 'home_dir_windows'
    },
    // Absolute paths (but keep relative paths)
    {
        pattern: /\/[a-zA-Z0-9_\-/.]+\/(src|tests?|lib|bin|config)\/([a-zA-Z0-9_\-/.]+)/g,
        replacement: '[PATH_REDACTED]/$1/$2',
        type: 'absolute_path'
    }
];
/**
 * Code transformation patterns for Level 3
 * These preserve algorithmic value while removing project-specific details
 */
const CODE_TRANSFORMATIONS = [
    // Replace specific project IDs in code comments
    {
        pattern: /\/\/ PROJECT_ID:\s*[a-z][a-z0-9-]+-\d{6,12}-[a-z0-9]{2}/g,
        replacement: '// PROJECT_ID: YOUR_PROJECT_ID',
        description: 'Generic project ID placeholder'
    },
    // Replace specific service URLs in fetch/axios calls
    {
        pattern: /(fetch|axios\.(get|post|put|delete))\(['"]https:\/\/[^'"]+['"]/g,
        replacement: '$1(\'https://your-api-endpoint.com\'',
        description: 'Generic API endpoint'
    },
    // Replace specific database names
    {
        pattern: /database:\s*['"]([a-z][a-z0-9-]+)['"],/g,
        replacement: 'database: \'your-database-name\',',
        description: 'Generic database name'
    },
    // Replace specific table names (but keep common ones like users, posts)
    {
        pattern: /from\s+['"](?!(?:users|posts|comments|products|orders)['"])([a-z_]+)['"]/gi,
        replacement: 'from \'your_table_name\'',
        description: 'Generic table name'
    }
];
/**
 * Pattern Sanitizer Service
 */
export class PatternSanitizer {
    constructor() {
        this.projectFingerprint = null;
        this.initialized = false;
    }
    /**
     * Initialize sanitizer with project detection
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            this.projectFingerprint = await detectProjectFingerprint();
            console.log('✅ Pattern Sanitizer initialized');
            console.log(`   Project fingerprint: ${this.projectFingerprint.identifiers.length} identifiers detected`);
        }
        catch (error) {
            console.warn('⚠️  Pattern Sanitizer: Project detection failed, using default patterns only');
            this.projectFingerprint = null;
        }
        this.initialized = true;
    }
    /**
     * Sanitize a pattern for Public RAG storage
     */
    async sanitize(input) {
        await this.initialize();
        const warnings = [];
        const redactions = [];
        // Level 1: Keyword Detection (reject if found)
        const keywordCheck = this.checkSensitiveKeywords(input);
        if (keywordCheck.hasCredentials || keywordCheck.hasBusinessLogic) {
            return {
                decision: keywordCheck.hasCredentials
                    ? SanitizationDecision.REJECT_CREDENTIALS
                    : SanitizationDecision.REJECT_BUSINESS_LOGIC,
                level: SanitizationLevel.REJECT,
                confidence: 95,
                original: input,
                sanitized: null,
                warnings: [
                    `Rejected: Contains ${keywordCheck.hasCredentials ? 'credentials' : 'business logic'} keywords`,
                    ...keywordCheck.foundKeywords.map(k => `  - "${k}"`)
                ],
                redactions: [],
                metadata: {
                    projectSpecificIdentifiers: [],
                    sensitivePatterns: keywordCheck.foundKeywords,
                    codeTransformations: 0
                }
            };
        }
        // Level 2: Pattern Matching (redact sensitive data)
        let sanitized = input;
        for (const redactionPattern of REDACTION_PATTERNS) {
            const matches = input.match(redactionPattern.pattern);
            if (matches) {
                for (const match of matches) {
                    redactions.push({
                        type: redactionPattern.type,
                        original: match,
                        redacted: redactionPattern.replacement,
                        reason: `Redacted ${redactionPattern.type}`
                    });
                }
                sanitized = sanitized.replace(redactionPattern.pattern, redactionPattern.replacement);
            }
        }
        // Level 2.5: Project-specific identifiers
        if (this.projectFingerprint) {
            for (const identifier of this.projectFingerprint.identifiers) {
                if (sanitized.includes(identifier)) {
                    const placeholder = this.getPlaceholderForIdentifier(identifier);
                    redactions.push({
                        type: 'project_identifier',
                        original: identifier,
                        redacted: placeholder,
                        reason: 'Project-specific identifier detected'
                    });
                    sanitized = sanitized.replace(new RegExp(identifier, 'g'), placeholder);
                }
            }
        }
        // Level 3: Code Transformations (preserve algorithmic value)
        let codeTransformations = 0;
        for (const transformation of CODE_TRANSFORMATIONS) {
            if (transformation.pattern.test(sanitized)) {
                sanitized = sanitized.replace(transformation.pattern, transformation.replacement);
                codeTransformations++;
                warnings.push(`Code transformation: ${transformation.description}`);
            }
        }
        // Determine decision and confidence
        const totalRedactions = redactions.length + codeTransformations;
        let decision;
        let level;
        let confidence;
        if (totalRedactions === 0) {
            decision = SanitizationDecision.ALLOW_AS_IS;
            level = SanitizationLevel.NONE;
            confidence = 100;
        }
        else if (totalRedactions <= 3) {
            decision = SanitizationDecision.ALLOW_AFTER_SANITIZATION;
            level = SanitizationLevel.LIGHT;
            confidence = 95;
        }
        else if (totalRedactions <= 10) {
            decision = SanitizationDecision.ALLOW_AFTER_SANITIZATION;
            level = SanitizationLevel.MODERATE;
            confidence = 85;
        }
        else if (totalRedactions <= 20) {
            decision = SanitizationDecision.ALLOW_AFTER_SANITIZATION;
            level = SanitizationLevel.HEAVY;
            confidence = 75;
            warnings.push('⚠️  Heavy sanitization required - pattern may lose context');
        }
        else {
            decision = SanitizationDecision.REJECT_UNSANITIZABLE;
            level = SanitizationLevel.REJECT;
            confidence = 90;
            warnings.push('❌ Too many redactions required - pattern is too project-specific');
        }
        return {
            decision,
            level,
            confidence,
            original: input,
            sanitized: decision === SanitizationDecision.REJECT_UNSANITIZABLE ? null : sanitized,
            warnings,
            redactions,
            metadata: {
                projectSpecificIdentifiers: this.projectFingerprint?.identifiers || [],
                sensitivePatterns: keywordCheck.foundKeywords,
                codeTransformations
            }
        };
    }
    /**
     * Check for sensitive keywords (Level 1)
     */
    checkSensitiveKeywords(input) {
        const lowerInput = input.toLowerCase();
        const foundKeywords = [];
        let hasCredentials = false;
        let hasBusinessLogic = false;
        let hasInfrastructure = false;
        // Check credentials
        for (const keyword of SENSITIVE_KEYWORDS.credentials) {
            if (lowerInput.includes(keyword)) {
                foundKeywords.push(keyword);
                hasCredentials = true;
            }
        }
        // Check business logic
        for (const keyword of SENSITIVE_KEYWORDS.businessLogic) {
            if (lowerInput.includes(keyword)) {
                foundKeywords.push(keyword);
                hasBusinessLogic = true;
            }
        }
        // Check infrastructure
        for (const keyword of SENSITIVE_KEYWORDS.infrastructure) {
            if (lowerInput.includes(keyword)) {
                foundKeywords.push(keyword);
                hasInfrastructure = true;
            }
        }
        return {
            hasCredentials,
            hasBusinessLogic,
            hasInfrastructure,
            foundKeywords
        };
    }
    /**
     * Get appropriate placeholder for project-specific identifier
     */
    getPlaceholderForIdentifier(identifier) {
        // GCP Project ID
        if (/^[a-z][a-z0-9-]+-\d{6,12}-[a-z0-9]{2}$/.test(identifier)) {
            return 'YOUR_PROJECT_ID';
        }
        // Cloud Run URL
        if (identifier.includes('.run.app')) {
            return 'https://your-service.run.app';
        }
        // Supabase project ref
        if (/^[a-z]{20}$/.test(identifier)) {
            return 'YOUR_SUPABASE_PROJECT_REF';
        }
        // Email
        if (identifier.includes('@')) {
            return '[EMAIL_REDACTED]';
        }
        // Default
        return '[PROJECT_IDENTIFIER]';
    }
    /**
     * Batch sanitize multiple patterns
     */
    async sanitizeBatch(inputs) {
        await this.initialize();
        const results = [];
        for (const input of inputs) {
            const result = await this.sanitize(input);
            results.push(result);
        }
        return results;
    }
    /**
     * Get sanitization statistics
     */
    getStats(results) {
        const total = results.length;
        const allowedAsIs = results.filter(r => r.decision === SanitizationDecision.ALLOW_AS_IS).length;
        const allowedAfterSanitization = results.filter(r => r.decision === SanitizationDecision.ALLOW_AFTER_SANITIZATION).length;
        const rejected = results.filter(r => r.decision === SanitizationDecision.REJECT_UNSANITIZABLE ||
            r.decision === SanitizationDecision.REJECT_BUSINESS_LOGIC ||
            r.decision === SanitizationDecision.REJECT_CREDENTIALS).length;
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;
        const totalRedactions = results.reduce((sum, r) => sum + r.redactions.length, 0);
        return {
            total,
            allowedAsIs,
            allowedAfterSanitization,
            rejected,
            avgConfidence: Math.round(avgConfidence),
            totalRedactions
        };
    }
}
// Export singleton instance
let sanitizerInstance = null;
export function getPatternSanitizer() {
    if (!sanitizerInstance) {
        sanitizerInstance = new PatternSanitizer();
    }
    return sanitizerInstance;
}
export const patternSanitizer = getPatternSanitizer();
//# sourceMappingURL=pattern-sanitizer.js.map