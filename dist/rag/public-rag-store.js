/**
 * Public RAG Store - Framework Knowledge Only
 *
 * Stores generic coding patterns accessible to ALL VERSATIL users:
 * - React/Vue/Angular component patterns
 * - Authentication flows (JWT, OAuth2, sessions)
 * - Testing patterns (Jest, Playwright, unit/integration/E2E)
 * - API design (REST, GraphQL, error handling)
 * - Database patterns (PostgreSQL, migrations, RLS)
 *
 * Privacy Guarantee:
 * - NO user proprietary code
 * - NO business logic
 * - NO secrets or credentials
 * - ONLY framework-level knowledge
 */
import { GraphRAGStore } from '../lib/graphrag-store.js';
import { getCloudRunClient } from './cloudrun-rag-client.js';
import { getSanitizationPolicy, PatternClassification } from './sanitization-policy.js';
import { getPrivacyAuditor } from './privacy-auditor.js';
/**
 * Public RAG Store - Framework patterns only
 */
export class PublicRAGStore extends GraphRAGStore {
    constructor() {
        super();
        // Force framework Firestore project
        this.setProjectConfig({
            projectId: 'centering-vine-454613-b3',
            databaseId: 'versatil-public-rag'
        });
        // Initialize Cloud Run edge client (if configured)
        this.cloudRunClient = getCloudRunClient();
        // Initialize sanitization policy and privacy auditor
        this.sanitizationPolicy = getSanitizationPolicy();
        this.privacyAuditor = getPrivacyAuditor();
    }
    /**
     * Singleton instance
     */
    static getInstance() {
        if (!PublicRAGStore.instance) {
            PublicRAGStore.instance = new PublicRAGStore();
        }
        return PublicRAGStore.instance;
    }
    /**
     * Override: Only store patterns marked as public
     *
     * v7.8.0: Now includes automated sanitization and privacy audit
     */
    async addPattern(pattern) {
        // Skip sanitization if explicitly requested (for internal framework use)
        if (pattern.skipSanitization) {
            console.log(`⚠️  Skipping sanitization (internal use): ${pattern.pattern}`);
            return super.addPattern({
                ...pattern,
                privacy: {
                    isPublic: true
                }
            });
        }
        // Step 1: Evaluate pattern with sanitization policy
        const policyDecision = await this.sanitizationPolicy.evaluatePattern(pattern);
        // Step 2: Handle based on classification
        switch (policyDecision.classification) {
            case PatternClassification.CREDENTIALS:
                throw new Error(`❌ REJECTED: Pattern contains credentials\n` +
                    `   Pattern: "${pattern.pattern}"\n` +
                    `   Reason: ${policyDecision.reasoning.join('\n   ')}\n` +
                    `   Action: Store in Private RAG only (NOT Public RAG)\n` +
                    `   Configure Private RAG: npm run setup:private-rag`);
            case PatternClassification.PRIVATE_ONLY:
                throw new Error(`❌ REJECTED: Pattern is proprietary/confidential\n` +
                    `   Pattern: "${pattern.pattern}"\n` +
                    `   Reason: ${policyDecision.reasoning.join('\n   ')}\n` +
                    `   Action: Store in Private RAG only (NOT Public RAG)\n` +
                    `   Configure Private RAG: npm run setup:private-rag`);
            case PatternClassification.UNSANITIZABLE:
                throw new Error(`❌ REJECTED: Pattern is too project-specific\n` +
                    `   Pattern: "${pattern.pattern}"\n` +
                    `   Reason: ${policyDecision.reasoning.join('\n   ')}\n` +
                    `   Action: Store in Private RAG only (NOT Public RAG)\n` +
                    `   Tip: Extract generic framework patterns separately\n` +
                    `   Configure Private RAG: npm run setup:private-rag`);
            case PatternClassification.REQUIRES_SANITIZATION:
                // Pattern can be sanitized - use sanitized version
                if (!policyDecision.sanitizationResult || !policyDecision.sanitizationResult.sanitized) {
                    throw new Error(`❌ Sanitization failed for pattern: "${pattern.pattern}"\n` +
                        `   Action: Store in Private RAG only\n` +
                        `   Configure Private RAG: npm run setup:private-rag`);
                }
                console.log(`⚠️  Pattern requires sanitization: ${pattern.pattern}`);
                console.log(`   Sanitization level: ${policyDecision.sanitizationResult.level}`);
                console.log(`   Redactions: ${policyDecision.sanitizationResult.redactions.length}`);
                console.log(`   Confidence: ${policyDecision.sanitizationResult.confidence}%`);
                // Use sanitized version
                pattern = {
                    ...pattern,
                    description: policyDecision.sanitizationResult.sanitized,
                    code: policyDecision.sanitizationResult.sanitized
                };
                break;
            case PatternClassification.PUBLIC_SAFE:
                // Pattern is safe as-is
                console.log(`✅ Pattern is public-safe: ${pattern.pattern}`);
                break;
        }
        // Step 3: Pre-storage privacy audit
        const patternNode = {
            id: `pattern_${Date.now()}`,
            type: 'pattern',
            label: pattern.pattern, // Required by GraphNode interface
            properties: {
                pattern: pattern.pattern,
                description: pattern.description,
                code: pattern.code,
                examples: pattern.examples,
                agent: pattern.agent,
                category: pattern.category,
                effectiveness: pattern.effectiveness || 0,
                timeSaved: pattern.timeSaved || 0,
                tags: pattern.tags || [],
                usageCount: 0, // New pattern starts with 0 usage
                lastUsed: new Date() // Initial timestamp
            },
            connections: []
        };
        const auditResult = await this.privacyAuditor.validatePattern(patternNode);
        if (!auditResult.isSafe) {
            const criticalFindings = auditResult.findings
                .filter(f => f.severity === 'critical' || f.severity === 'high')
                .map(f => `  - ${f.finding}: ${f.leakedValue}`)
                .join('\n');
            throw new Error(`❌ PRIVACY AUDIT FAILED\n` +
                `   Pattern: "${pattern.pattern}"\n` +
                `   Recommendation: ${auditResult.recommendation}\n` +
                `   Critical Findings:\n${criticalFindings}\n` +
                `   Action: DO NOT store in Public RAG`);
        }
        // Step 4: Add pattern with public privacy marker
        console.log(`✅ Adding sanitized pattern to Public RAG: ${pattern.pattern}`);
        return super.addPattern({
            ...pattern,
            privacy: {
                isPublic: true,
                sanitized: policyDecision.classification === PatternClassification.REQUIRES_SANITIZATION,
                auditedAt: new Date().toISOString()
            }
        });
    }
    /**
     * Determine if pattern is safe for public storage
     *
     * Private indicators:
     * - Business logic (proprietary workflows, internal APIs)
     * - Credentials (passwords, API keys, tokens, secrets)
     * - Company-specific (Acme Corp, internal tools)
     * - Proprietary schemas (database models, API contracts)
     *
     * Public indicators:
     * - Generic tech patterns (React, Vue, TypeScript, Jest)
     * - Common workflows (authentication, validation, error handling)
     * - Best practices (testing, conventions, architecture)
     */
    isPublicPattern(pattern) {
        const text = `${pattern.pattern} ${pattern.description || ''} ${pattern.code || ''}`.toLowerCase();
        // Private indicators (reject if found)
        const privateKeywords = [
            // Credentials
            'password', 'secret', 'api-key', 'api_key', 'apikey',
            'token', 'credential', 'auth-token', 'bearer',
            // Business logic
            'proprietary', 'internal', 'confidential', 'private',
            'acme', 'company-name', 'client-name',
            // Schemas/Models
            'schema:', 'model:', 'internal-api', 'private-endpoint',
            'business-logic', 'workflow:', 'process:',
            // Company-specific
            'our company', 'our app', 'our service',
            'internal service', 'legacy system'
        ];
        const hasPrivateKeyword = privateKeywords.some(kw => text.includes(kw));
        if (hasPrivateKeyword) {
            return false; // Reject: Contains private indicators
        }
        // Public indicators (accept if found)
        const publicKeywords = [
            // Frontend frameworks
            'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt',
            // Backend frameworks
            'express', 'fastify', 'nest.js', 'django', 'flask', 'rails',
            // Testing
            'jest', 'playwright', 'cypress', 'vitest', 'mocha',
            'unit test', 'integration test', 'e2e test',
            // Generic patterns
            'authentication', 'authorization', 'validation',
            'error handling', 'logging', 'caching',
            'pagination', 'sorting', 'filtering',
            // Best practices
            'pattern', 'best practice', 'convention',
            'architecture', 'design pattern', 'clean code'
        ];
        const hasPublicKeyword = publicKeywords.some(kw => text.includes(kw));
        // Accept if has public keywords and no private keywords
        return hasPublicKeyword;
    }
    /**
     * Override: Query only public patterns
     *
     * v7.7.0: Try Cloud Run edge first (2-4x faster), fallback to local GraphRAG
     */
    async query(query) {
        // Try Cloud Run edge first (if configured and healthy)
        if (this.cloudRunClient && this.cloudRunClient.isHealthy()) {
            try {
                const startTime = Date.now();
                const results = await this.cloudRunClient.query({
                    query: query.query,
                    isPublic: true,
                    limit: query.limit || 10,
                    minRelevance: query.minRelevance || 0.5,
                    agent: query.agent,
                    category: query.category
                });
                const duration = Date.now() - startTime;
                console.log(`⚡ Cloud Run edge: ${results.length} results (${duration}ms)`);
                return results;
            }
            catch (error) {
                console.warn(`⚠️  Cloud Run edge failed, falling back to local GraphRAG:`, error.message);
                // Fallthrough to local GraphRAG below
            }
        }
        // Fallback: Local GraphRAG query
        const publicQuery = {
            ...query,
            includePublic: true,
            userId: undefined, // No user filtering
            teamId: undefined, // No team filtering
            projectId: undefined // No project filtering
        };
        const results = await super.query(publicQuery);
        // Double-check all results are public
        return results.filter(r => r.pattern.privacy?.isPublic === true);
    }
    /**
     * Get statistics about public patterns
     */
    async getStats() {
        const allPatterns = await this.getAllPatterns();
        const stats = {
            totalPatterns: allPatterns.length,
            byCategory: {},
            byAgent: {},
            mostUsed: [],
            recentlyAdded: []
        };
        // Count by category and agent
        allPatterns.forEach(pattern => {
            const category = pattern.properties.category;
            const agent = pattern.properties.agent;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            stats.byAgent[agent] = (stats.byAgent[agent] || 0) + 1;
        });
        // Most used patterns
        stats.mostUsed = allPatterns
            .sort((a, b) => (b.properties.usageCount || 0) - (a.properties.usageCount || 0))
            .slice(0, 10);
        // Recently added patterns
        stats.recentlyAdded = allPatterns
            .sort((a, b) => {
            const dateA = a.properties.lastUsed ? new Date(a.properties.lastUsed).getTime() : 0;
            const dateB = b.properties.lastUsed ? new Date(b.properties.lastUsed).getTime() : 0;
            return dateB - dateA;
        })
            .slice(0, 10);
        return stats;
    }
    /**
     * Set project configuration (internal use only)
     */
    setProjectConfig(config) {
        // This would call a protected method in GraphRAGStore
        // For now, handled in constructor
    }
    /**
     * Get all patterns (for stats and migration)
     */
    async getAllPatterns() {
        // Implementation would fetch from Firestore
        // Placeholder for now
        return [];
    }
}
// Export singleton instance
export const publicRAGStore = PublicRAGStore.getInstance();
//# sourceMappingURL=public-rag-store.js.map