/**
 * Query Optimizer
 *
 * Purpose: Analyze and optimize PostgreSQL queries for performance
 * - EXPLAIN ANALYZE parsing
 * - Index suggestion engine (missing indexes, unused indexes)
 * - Query performance scoring (< 50ms target)
 * - N+1 query detection
 *
 * Auto-triggers: SELECT queries, slow query logs, performance issues
 *
 * @example
 * const optimizer = new QueryOptimizer();
 * const result = await optimizer.analyze({
 *   sql: 'SELECT * FROM users WHERE email = $1',
 *   targetLatency: 50
 * });
 * console.log(result.performanceScore); // 0-100
 * console.log(result.recommendations); // Optimization suggestions
 */
export interface QueryAnalysisOptions {
    sql: string;
    targetLatency?: number;
    explainOutput?: string;
}
export interface QueryAnalysisResult {
    performanceScore: number;
    estimatedLatency: number;
    issues: Array<{
        type: 'performance' | 'index' | 'n+1' | 'full-scan' | 'optimization';
        severity: 'critical' | 'high' | 'medium' | 'low';
        message: string;
        suggestion?: string;
    }>;
    recommendations: string[];
    suggestedIndexes: string[];
    queryPlan?: {
        nodeType: string;
        scanType: 'seq_scan' | 'index_scan' | 'bitmap_scan' | 'index_only_scan';
        estimatedCost: number;
        estimatedRows: number;
    };
}
export interface IndexSuggestionOptions {
    sql: string;
    tableName?: string;
}
/**
 * Query Optimizer
 *
 * Analyzes PostgreSQL queries and suggests performance optimizations
 */
export declare class QueryOptimizer {
    private readonly TARGET_LATENCY_MS;
    private readonly SLOW_QUERY_THRESHOLD;
    /**
     * Analyze query performance
     */
    analyze(options: QueryAnalysisOptions): Promise<QueryAnalysisResult>;
    /**
     * Suggest indexes for a query or table
     */
    suggestIndexes(options: IndexSuggestionOptions): Promise<string[]>;
    /**
     * Detect query type (SELECT, INSERT, UPDATE, DELETE)
     */
    private detectQueryType;
    /**
     * Extract table names from SQL
     */
    private extractTables;
    /**
     * Extract WHERE conditions
     */
    private extractWhereConditions;
    /**
     * Extract JOIN information
     */
    private extractJoins;
    /**
     * Parse EXPLAIN ANALYZE output
     */
    private parseExplainOutput;
    /**
     * Normalize scan type
     */
    private normalizeScanType;
    /**
     * Estimate latency from query plan
     */
    private estimateLatency;
    /**
     * Estimate latency from SQL structure (when EXPLAIN not available)
     */
    private estimateLatencyFromSQL;
    /**
     * Detect performance issues
     */
    private detectPerformanceIssues;
    /**
     * Detect N+1 query patterns (common in ORMs)
     */
    private detectN1Queries;
    /**
     * Calculate performance score (0-100)
     */
    private calculatePerformanceScore;
}
