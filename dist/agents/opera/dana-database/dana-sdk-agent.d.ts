/**
 * Dana-Database SDK Agent
 * SDK-native version of Enhanced Dana that uses Claude Agent SDK for execution
 * while preserving all existing database functionality
 *
 * Purpose: Three-tier architecture data layer specialist
 * Auto-activation: *.sql, migrations/**, prisma/**, supabase/**
 * Integration: Works parallel with Marcus-Backend and James-Frontend
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
/**
 * Database validation context
 */
export interface DatabaseContext {
    filePath?: string;
    content?: string;
    schemaType?: 'postgresql' | 'mysql' | 'sqlite' | 'supabase';
    migrationDirection?: 'up' | 'down';
    tableNames?: string[];
    requiresRLS?: boolean;
}
/**
 * Database analysis result
 */
export interface DatabaseAnalysisResult {
    schemaHealth: number;
    rlsCompliance: number;
    queryPerformance: number;
    migrationSafety: number;
    overallScore: number;
    issues: Array<{
        type: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        message: string;
        file?: string;
        suggestion?: string;
    }>;
    recommendations: string[];
}
/**
 * Dana-Database SDK Agent
 *
 * Responsibilities:
 * 1. Schema design and validation (normalization, constraints, indexes)
 * 2. RLS policy generation for multi-tenant security
 * 3. Query optimization (< 100ms target)
 * 4. Migration safety validation (up/down, idempotency, rollback)
 * 5. Three-tier collaboration (Marcus-Backend, James-Frontend)
 *
 * Auto-activation patterns:
 * - *.sql files
 * - migrations/** directory
 * - prisma/** directory
 * - supabase/** directory
 * - Schema-related keywords in prompts
 *
 * @example
 * const dana = new DanaSDKAgent(vectorStore);
 * const result = await dana.activate({
 *   filePath: 'migrations/001_create_users.sql',
 *   content: schemaSQL,
 *   trigger: { type: 'file-change' }
 * });
 */
export declare class DanaSDKAgent extends SDKAgentAdapter {
    private legacyAgent;
    private schemaValidator;
    private rlsGenerator;
    private queryOptimizer;
    private migrationChecker;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override activate to add Dana-specific database validations
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Detect database context from file path and content
     */
    private detectDatabaseContext;
    /**
     * Run comprehensive database analysis using all specialized modules
     */
    private runDatabaseAnalysis;
    /**
     * Determine handoffs for three-tier architecture integration
     *
     * Pattern:
     * 1. Dana designs schema (data layer)
     * 2. Handoff to Marcus for API implementation (API layer) - PARALLEL
     * 3. Handoff to James for UI data binding (presentation layer) - PARALLEL
     * 4. Validate full-stack integration
     */
    private determineThreeTierHandoffs;
    /**
     * Validate schema design (delegated to SchemaValidator)
     */
    validateSchema(options: {
        sql: string;
        schemaType?: 'postgresql' | 'mysql' | 'sqlite' | 'supabase';
    }): Promise<any>;
    /**
     * Generate RLS policies for multi-tenant tables (delegated to RLSPolicyGenerator)
     */
    generateRLSPolicies(options: {
        tableName: string;
        tenantColumn?: string;
        userIdColumn?: string;
        policies?: Array<'select' | 'insert' | 'update' | 'delete'>;
    }): Promise<string>;
    /**
     * Analyze query performance (delegated to QueryOptimizer)
     */
    analyzeQueryPerformance(options: {
        sql: string;
        targetLatency?: number;
    }): Promise<any>;
    /**
     * Suggest indexes for slow queries (delegated to QueryOptimizer)
     */
    suggestIndexes(options: {
        sql: string;
        tableName?: string;
    }): Promise<string[]>;
    /**
     * Validate migration safety (delegated to MigrationSafetyChecker)
     */
    validateMigration(options: {
        sql: string;
        direction: 'up' | 'down';
    }): Promise<any>;
    /**
     * Check if migration is idempotent (delegated to MigrationSafetyChecker)
     */
    checkIdempotency(options: {
        sql: string;
    }): Promise<boolean>;
    /**
     * Legacy agent delegation methods
     * (Preserves all existing EnhancedDana functionality)
     */
    runPatternAnalysis(context: AgentActivationContext): Promise<any>;
    generateEnhancedMessage(analysis: any, ragContext?: any): string;
    getBasePromptTemplate(): string;
    generateDomainHandoffs(analysis: any): string[];
    /**
     * NEW v6.4: Supabase MCP integration for database operations
     *
     * Usage:
     * - Execute migrations via Supabase MCP
     * - Create RLS policies
     * - Query database for schema introspection
     */
    executeSupabaseQuery(options: {
        query: string;
        params?: any[];
    }): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * NEW v6.4: GitMCP integration for database framework documentation
     *
     * Access latest PostgreSQL, Prisma, Supabase docs to prevent hallucinations
     */
    fetchDatabaseDocs(options: {
        framework: 'postgresql' | 'prisma' | 'supabase';
        topic: string;
    }): Promise<{
        success: boolean;
        data?: string;
        error?: string;
    }>;
    /**
     * Calculate priority (internal implementation)
     */
    calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Determine handoffs (internal implementation)
     */
    determineHandoffs(issues: any[]): string[];
    /**
     * Generate actionable recommendations (internal implementation)
     */
    generateActionableRecommendations(issues: any[]): Array<{
        type: string;
        message: string;
        priority: string;
    }>;
    /**
     * Generate enhanced report (internal implementation)
     */
    generateEnhancedReport(issues: any[], metadata?: any): string;
    /**
     * Get score emoji (internal implementation)
     */
    getScoreEmoji(score: number): string;
    /**
     * Extract agent name (internal implementation)
     */
    extractAgentName(text: string): string;
    /**
     * Identify critical issues (internal implementation)
     */
    identifyCriticalIssues(issues: any[]): any[];
    /**
     * Check configuration inconsistencies (internal implementation)
     */
    hasConfigurationInconsistencies(context: any): boolean;
}
