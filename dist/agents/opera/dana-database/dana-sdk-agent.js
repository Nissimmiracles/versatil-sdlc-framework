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
import { EnhancedDana } from './enhanced-dana.js';
import { SchemaValidator } from './schema-validator.js';
import { RLSPolicyGenerator } from './rls-policy-generator.js';
import { QueryOptimizer } from './query-optimizer.js';
import { MigrationSafetyChecker } from './migration-safety-checker.js';
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
export class DanaSDKAgent extends SDKAgentAdapter {
    constructor(vectorStore) {
        super({
            agentId: 'dana-database',
            vectorStore,
            model: 'sonnet',
            enableMCPRouting: true
        });
        // Initialize legacy agent for specialized methods
        this.legacyAgent = new EnhancedDana(vectorStore);
        // Initialize specialized modules
        this.schemaValidator = new SchemaValidator();
        this.rlsGenerator = new RLSPolicyGenerator();
        this.queryOptimizer = new QueryOptimizer();
        this.migrationChecker = new MigrationSafetyChecker();
    }
    /**
     * Override activate to add Dana-specific database validations
     */
    async activate(context) {
        // 1. Run SDK activation (core analysis with RAG)
        const response = await super.activate(context);
        // 2. Detect database context
        const dbContext = this.detectDatabaseContext(context);
        // 3. Run specialized database analysis
        const dbAnalysis = await this.runDatabaseAnalysis(dbContext);
        // 4. Add Dana-specific context
        if (response.context) {
            response.context = {
                ...response.context,
                databaseHealth: dbAnalysis.overallScore,
                schemaHealth: dbAnalysis.schemaHealth,
                rlsCompliance: dbAnalysis.rlsCompliance,
                queryPerformance: dbAnalysis.queryPerformance,
                migrationSafety: dbAnalysis.migrationSafety,
                schemaType: dbContext.schemaType,
                requiresRLS: dbContext.requiresRLS,
                tableCount: dbContext.tableNames?.length || 0
            };
        }
        // 5. Merge specialized issues with SDK suggestions
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...dbAnalysis.issues.map(issue => ({
            type: issue.type,
            message: issue.message,
            priority: issue.severity,
            file: issue.file || dbContext.filePath || 'unknown'
        })));
        // 6. Add database-specific recommendations
        if (dbAnalysis.recommendations.length > 0) {
            response.context.recommendations = dbAnalysis.recommendations;
        }
        // 7. Determine handoffs for three-tier integration
        const handoffs = this.determineThreeTierHandoffs(dbAnalysis);
        if (handoffs.length > 0) {
            response.handoffTo = Array.from(new Set([...(response.handoffTo || []), ...handoffs]));
        }
        return response;
    }
    /**
     * Detect database context from file path and content
     */
    detectDatabaseContext(context) {
        const dbContext = {
            filePath: context.filePath,
            content: context.content
        };
        // Detect schema type
        if (context.filePath) {
            if (context.filePath.includes('supabase')) {
                dbContext.schemaType = 'supabase';
                dbContext.requiresRLS = true; // Supabase requires RLS
            }
            else if (context.filePath.includes('prisma')) {
                dbContext.schemaType = 'postgresql';
            }
            else if (context.filePath.endsWith('.sql')) {
                dbContext.schemaType = 'postgresql'; // Default
            }
        }
        // Detect migration direction
        if (context.content) {
            if (context.content.includes('-- Migration: up') || context.content.includes('CREATE TABLE')) {
                dbContext.migrationDirection = 'up';
            }
            else if (context.content.includes('-- Migration: down') || context.content.includes('DROP TABLE')) {
                dbContext.migrationDirection = 'down';
            }
            // Extract table names
            const tableMatches = context.content.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:"?(\w+)"?)/gi);
            dbContext.tableNames = Array.from(tableMatches, match => match[1]);
            // Check if multi-tenant (requires RLS)
            if (context.content.includes('tenant_id') ||
                context.content.includes('organization_id') ||
                context.content.includes('user_id')) {
                dbContext.requiresRLS = true;
            }
        }
        return dbContext;
    }
    /**
     * Run comprehensive database analysis using all specialized modules
     */
    async runDatabaseAnalysis(dbContext) {
        const issues = [];
        const recommendations = [];
        // 1. Schema Validation (normalization, constraints, indexes)
        if (dbContext.content) {
            const schemaResult = await this.schemaValidator.validate({
                sql: dbContext.content,
                schemaType: dbContext.schemaType || 'postgresql'
            });
            issues.push(...schemaResult.issues);
            recommendations.push(...schemaResult.recommendations);
        }
        // 2. RLS Policy Generation (multi-tenant security)
        let rlsCompliance = 100;
        if (dbContext.requiresRLS && dbContext.content) {
            const rlsResult = await this.rlsGenerator.analyze({
                sql: dbContext.content,
                tableNames: dbContext.tableNames || []
            });
            if (!rlsResult.hasPolicies) {
                issues.push({
                    type: 'security',
                    severity: 'critical',
                    message: `Multi-tenant tables detected but no RLS policies found. Add RLS to prevent unauthorized access.`,
                    file: dbContext.filePath,
                    suggestion: rlsResult.suggestedPolicies
                });
                rlsCompliance = 0;
            }
            else {
                rlsCompliance = rlsResult.compliance;
            }
            recommendations.push(...rlsResult.recommendations);
        }
        // 3. Query Optimization (performance analysis)
        let queryPerformance = 100;
        if (dbContext.content) {
            const queryResult = await this.queryOptimizer.analyze({
                sql: dbContext.content,
                targetLatency: 100 // < 100ms target
            });
            issues.push(...queryResult.issues);
            recommendations.push(...queryResult.recommendations);
            queryPerformance = queryResult.performanceScore;
        }
        // 4. Migration Safety (up/down, idempotency, rollback)
        let migrationSafety = 100;
        if (dbContext.migrationDirection && dbContext.content) {
            const migrationResult = await this.migrationChecker.validate({
                sql: dbContext.content,
                direction: dbContext.migrationDirection
            });
            issues.push(...migrationResult.issues);
            recommendations.push(...migrationResult.recommendations);
            migrationSafety = migrationResult.safetyScore;
        }
        // Calculate overall score
        const schemaHealth = 100 - (issues.filter(i => i.type === 'schema').length * 10);
        const overallScore = Math.round((schemaHealth +
            rlsCompliance +
            queryPerformance +
            migrationSafety) / 4);
        return {
            schemaHealth: Math.max(0, schemaHealth),
            rlsCompliance,
            queryPerformance,
            migrationSafety,
            overallScore: Math.max(0, overallScore),
            issues,
            recommendations
        };
    }
    /**
     * Determine handoffs for three-tier architecture integration
     *
     * Pattern:
     * 1. Dana designs schema (data layer)
     * 2. Handoff to Marcus for API implementation (API layer) - PARALLEL
     * 3. Handoff to James for UI data binding (presentation layer) - PARALLEL
     * 4. Validate full-stack integration
     */
    determineThreeTierHandoffs(dbAnalysis) {
        const handoffs = [];
        // Security issues → Marcus for API-level security coordination
        const securityIssues = dbAnalysis.issues.filter(i => i.type === 'security');
        if (securityIssues.length > 0) {
            handoffs.push('marcus-backend');
        }
        // Performance issues → Marcus for backend optimization
        if (dbAnalysis.queryPerformance < 70) {
            handoffs.push('marcus-backend');
        }
        // Low overall score → Maria for quality review
        if (dbAnalysis.overallScore < 70) {
            handoffs.push('maria-qa');
        }
        // Migration issues → Sarah for deployment coordination
        if (dbAnalysis.migrationSafety < 80) {
            handoffs.push('sarah-pm');
        }
        return Array.from(new Set(handoffs)); // Remove duplicates
    }
    /**
     * Validate schema design (delegated to SchemaValidator)
     */
    async validateSchema(options) {
        return await this.schemaValidator.validate({
            sql: options.sql,
            schemaType: options.schemaType || 'postgresql'
        });
    }
    /**
     * Generate RLS policies for multi-tenant tables (delegated to RLSPolicyGenerator)
     */
    async generateRLSPolicies(options) {
        return await this.rlsGenerator.generate(options);
    }
    /**
     * Analyze query performance (delegated to QueryOptimizer)
     */
    async analyzeQueryPerformance(options) {
        return await this.queryOptimizer.analyze(options);
    }
    /**
     * Suggest indexes for slow queries (delegated to QueryOptimizer)
     */
    async suggestIndexes(options) {
        return await this.queryOptimizer.suggestIndexes(options);
    }
    /**
     * Validate migration safety (delegated to MigrationSafetyChecker)
     */
    async validateMigration(options) {
        return await this.migrationChecker.validate(options);
    }
    /**
     * Check if migration is idempotent (delegated to MigrationSafetyChecker)
     */
    async checkIdempotency(options) {
        return await this.migrationChecker.checkIdempotency(options);
    }
    /**
     * Legacy agent delegation methods
     * (Preserves all existing EnhancedDana functionality)
     */
    async runPatternAnalysis(context) {
        return await this.legacyAgent.runPatternAnalysis(context);
    }
    generateEnhancedMessage(analysis, ragContext) {
        return this.legacyAgent.generateEnhancedMessage(analysis, ragContext);
    }
    getBasePromptTemplate() {
        return this.legacyAgent.getBasePromptTemplate();
    }
    generateDomainHandoffs(analysis) {
        return this.legacyAgent.generateDomainHandoffs(analysis);
    }
    /**
     * NEW v6.4: Supabase MCP integration for database operations
     *
     * Usage:
     * - Execute migrations via Supabase MCP
     * - Create RLS policies
     * - Query database for schema introspection
     */
    async executeSupabaseQuery(options) {
        const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
        const router = getMCPToolRouter();
        return await router.handleToolCall({
            tool: 'Supabase',
            action: 'query',
            params: {
                sql: options.query,
                params: options.params
            },
            agentId: 'dana-database'
        });
    }
    /**
     * NEW v6.4: GitMCP integration for database framework documentation
     *
     * Access latest PostgreSQL, Prisma, Supabase docs to prevent hallucinations
     */
    async fetchDatabaseDocs(options) {
        const { getMCPToolRouter } = await import('../../../mcp/mcp-tool-router.js');
        const router = getMCPToolRouter();
        const repoMap = {
            postgresql: 'postgres/postgres',
            prisma: 'prisma/prisma',
            supabase: 'supabase/supabase'
        };
        return await router.handleToolCall({
            tool: 'GitHub',
            action: 'search',
            params: {
                repo: repoMap[options.framework],
                query: options.topic,
                path: 'docs/'
            },
            agentId: 'dana-database'
        });
    }
    /**
     * Calculate priority (internal implementation)
     */
    calculatePriority(issues) {
        if (issues.some((i) => i.severity === 'critical'))
            return 'critical';
        if (issues.some((i) => i.severity === 'high'))
            return 'high';
        if (issues.some((i) => i.severity === 'medium'))
            return 'medium';
        return 'low';
    }
    /**
     * Determine handoffs (internal implementation)
     */
    determineHandoffs(issues) {
        const handoffs = [];
        // Security issues → Marcus
        if (issues.some((i) => i.type === 'security')) {
            handoffs.push('marcus-backend');
        }
        // Performance issues → Marcus
        if (issues.some((i) => i.type === 'performance')) {
            handoffs.push('marcus-backend');
        }
        // Quality issues → Maria
        if (issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length > 3) {
            handoffs.push('maria-qa');
        }
        return Array.from(new Set(handoffs));
    }
    /**
     * Generate actionable recommendations (internal implementation)
     */
    generateActionableRecommendations(issues) {
        return issues.map((issue) => ({
            type: issue.type,
            message: issue.suggestion || issue.message,
            priority: issue.severity
        }));
    }
    /**
     * Generate enhanced report (internal implementation)
     */
    generateEnhancedReport(issues, metadata = {}) {
        const critical = issues.filter((i) => i.severity === 'critical').length;
        const high = issues.filter((i) => i.severity === 'high').length;
        const medium = issues.filter((i) => i.severity === 'medium').length;
        const low = issues.filter((i) => i.severity === 'low').length;
        let report = `Database Health Report\n`;
        report += `=====================\n\n`;
        report += `Critical Issues: ${critical}\n`;
        report += `High Priority: ${high}\n`;
        report += `Medium Priority: ${medium}\n`;
        report += `Low Priority: ${low}\n\n`;
        if (metadata.schemaHealth !== undefined) {
            report += `Schema Health: ${metadata.schemaHealth}/100\n`;
        }
        if (metadata.rlsCompliance !== undefined) {
            report += `RLS Compliance: ${metadata.rlsCompliance}/100\n`;
        }
        if (metadata.queryPerformance !== undefined) {
            report += `Query Performance: ${metadata.queryPerformance}/100\n`;
        }
        return report;
    }
    /**
     * Get score emoji (internal implementation)
     */
    getScoreEmoji(score) {
        if (score >= 90)
            return '🟢';
        if (score >= 70)
            return '🟡';
        if (score >= 50)
            return '🟠';
        return '🔴';
    }
    /**
     * Extract agent name (internal implementation)
     */
    extractAgentName(text) {
        return 'Dana-Database';
    }
    /**
     * Identify critical issues (internal implementation)
     */
    identifyCriticalIssues(issues) {
        return issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
    }
    /**
     * Check configuration inconsistencies (internal implementation)
     */
    hasConfigurationInconsistencies(context) {
        return false; // Database-specific implementation if needed
    }
}
//# sourceMappingURL=dana-sdk-agent.js.map