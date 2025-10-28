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
import { GraphRAGStore, PatternNode, GraphRAGQuery, GraphRAGResult } from '../lib/graphrag-store.js';
export interface PatternInput {
    pattern: string;
    description?: string;
    code?: string;
    examples?: string[];
    agent: string;
    category: string;
    effectiveness?: number;
    timeSaved?: number;
    tags?: string[];
    skipSanitization?: boolean;
}
/**
 * Public RAG Store - Framework patterns only
 */
export declare class PublicRAGStore extends GraphRAGStore {
    private static instance;
    private cloudRunClient;
    private sanitizationPolicy;
    private privacyAuditor;
    constructor();
    /**
     * Singleton instance
     */
    static getInstance(): PublicRAGStore;
    /**
     * Override: Only store patterns marked as public
     *
     * v7.8.0: Now includes automated sanitization and privacy audit
     */
    addPattern(pattern: PatternInput): Promise<string>;
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
    private isPublicPattern;
    /**
     * Override: Query only public patterns
     *
     * v7.7.0: Try Cloud Run edge first (2-4x faster), fallback to local GraphRAG
     */
    query(query: GraphRAGQuery): Promise<GraphRAGResult[]>;
    /**
     * Get statistics about public patterns
     */
    getStats(): Promise<{
        totalPatterns: number;
        byCategory: Record<string, number>;
        byAgent: Record<string, number>;
        mostUsed: PatternNode[];
        recentlyAdded: PatternNode[];
    }>;
    /**
     * Set project configuration (internal use only)
     */
    private setProjectConfig;
    /**
     * Get all patterns (for stats and migration)
     */
    private getAllPatterns;
}
export declare const publicRAGStore: PublicRAGStore;
