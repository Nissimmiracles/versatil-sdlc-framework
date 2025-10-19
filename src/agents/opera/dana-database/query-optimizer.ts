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
  targetLatency?: number; // Default: 100ms
  explainOutput?: string; // EXPLAIN ANALYZE output (optional)
}

export interface QueryAnalysisResult {
  performanceScore: number; // 0-100
  estimatedLatency: number; // Estimated query time in ms
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
export class QueryOptimizer {
  private readonly TARGET_LATENCY_MS = 50; // Default target: < 50ms
  private readonly SLOW_QUERY_THRESHOLD = 100; // Warn if > 100ms

  /**
   * Analyze query performance
   */
  async analyze(options: QueryAnalysisOptions): Promise<QueryAnalysisResult> {
    const { sql, targetLatency = this.TARGET_LATENCY_MS, explainOutput } = options;
    const issues: QueryAnalysisResult['issues'] = [];
    const recommendations: string[] = [];
    const suggestedIndexes: string[] = [];

    // 1. Parse query structure
    const queryType = this.detectQueryType(sql);
    const tables = this.extractTables(sql);
    const whereConditions = this.extractWhereConditions(sql);
    const joins = this.extractJoins(sql);

    // 2. Analyze EXPLAIN output (if provided)
    let queryPlan: QueryAnalysisResult['queryPlan'] | undefined;
    let estimatedLatency = 0;

    if (explainOutput) {
      queryPlan = this.parseExplainOutput(explainOutput);
      estimatedLatency = this.estimateLatency(queryPlan);
    } else {
      // Estimate latency based on query complexity
      estimatedLatency = this.estimateLatencyFromSQL(sql, tables, joins, whereConditions);
    }

    // 3. Detect performance issues
    const performanceIssues = this.detectPerformanceIssues(sql, tables, joins, whereConditions, estimatedLatency);
    issues.push(...performanceIssues.issues);
    recommendations.push(...performanceIssues.recommendations);
    suggestedIndexes.push(...performanceIssues.suggestedIndexes);

    // 4. Detect N+1 queries (common in ORMs)
    const n1Issues = this.detectN1Queries(sql);
    issues.push(...n1Issues.issues);
    recommendations.push(...n1Issues.recommendations);

    // 5. Detect full table scans
    if (queryPlan && queryPlan.scanType === 'seq_scan' && queryPlan.estimatedRows > 1000) {
      issues.push({
        type: 'full-scan',
        severity: 'high',
        message: `Sequential scan detected on large table (${queryPlan.estimatedRows} rows)`,
        suggestion: `Add index on WHERE clause columns`
      });
      recommendations.push('Add indexes to avoid full table scans');
    }

    // 6. Calculate performance score
    const performanceScore = this.calculatePerformanceScore(estimatedLatency, targetLatency, issues);

    return {
      performanceScore,
      estimatedLatency,
      issues,
      recommendations: Array.from(new Set(recommendations)), // Remove duplicates
      suggestedIndexes: Array.from(new Set(suggestedIndexes)),
      queryPlan
    };
  }

  /**
   * Suggest indexes for a query or table
   */
  async suggestIndexes(options: IndexSuggestionOptions): Promise<string[]> {
    const { sql, tableName } = options;
    const indexes: string[] = [];

    // Extract WHERE conditions and suggest indexes
    const whereConditions = this.extractWhereConditions(sql);
    for (const condition of whereConditions) {
      if (condition.column) {
        const table = tableName || this.extractTables(sql)[0];
        if (table) {
          indexes.push(`CREATE INDEX idx_${table}_${condition.column} ON ${table}(${condition.column});`);
        }
      }
    }

    // Extract JOIN conditions and suggest indexes
    const joins = this.extractJoins(sql);
    for (const join of joins) {
      if (join.leftColumn && join.rightColumn) {
        indexes.push(`CREATE INDEX idx_${join.rightTable}_${join.rightColumn} ON ${join.rightTable}(${join.rightColumn});`);
      }
    }

    return indexes;
  }

  /**
   * Detect query type (SELECT, INSERT, UPDATE, DELETE)
   */
  private detectQueryType(sql: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER' {
    const upperSQL = sql.trim().toUpperCase();
    if (upperSQL.startsWith('SELECT')) return 'SELECT';
    if (upperSQL.startsWith('INSERT')) return 'INSERT';
    if (upperSQL.startsWith('UPDATE')) return 'UPDATE';
    if (upperSQL.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  /**
   * Extract table names from SQL
   */
  private extractTables(sql: string): string[] {
    const tables: string[] = [];

    // FROM clause
    const fromMatch = sql.match(/FROM\s+(?:"?(\w+)"?)/i);
    if (fromMatch) tables.push(fromMatch[1]);

    // JOIN clauses
    const joinMatches = sql.matchAll(/JOIN\s+(?:"?(\w+)"?)/gi);
    for (const match of joinMatches) {
      tables.push(match[1]);
    }

    return Array.from(new Set(tables)); // Remove duplicates
  }

  /**
   * Extract WHERE conditions
   */
  private extractWhereConditions(sql: string): Array<{ column?: string; operator?: string; value?: string }> {
    const conditions: Array<{ column?: string; operator?: string; value?: string }> = [];

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:GROUP BY|ORDER BY|LIMIT|;|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const conditionMatches = whereClause.matchAll(/(?:"?(\w+)"?)\s*(=|!=|<>|>|<|>=|<=|LIKE|IN)\s*(.+?)(?:AND|OR|$)/gi);

      for (const match of conditionMatches) {
        conditions.push({
          column: match[1],
          operator: match[2],
          value: match[3]?.trim()
        });
      }
    }

    return conditions;
  }

  /**
   * Extract JOIN information
   */
  private extractJoins(sql: string): Array<{
    type: string;
    rightTable: string;
    leftColumn?: string;
    rightColumn?: string;
  }> {
    const joins: Array<{
      type: string;
      rightTable: string;
      leftColumn?: string;
      rightColumn?: string;
    }> = [];

    const joinMatches = sql.matchAll(/(INNER|LEFT|RIGHT|FULL)?\s*JOIN\s+(?:"?(\w+)"?)\s+ON\s+(?:"?(\w+)"?)\.(?:"?(\w+)"?)\s*=\s*(?:"?(\w+)"?)\.(?:"?(\w+)"?)/gi);

    for (const match of joinMatches) {
      joins.push({
        type: match[1] || 'INNER',
        rightTable: match[2],
        leftColumn: match[4],
        rightColumn: match[6]
      });
    }

    return joins;
  }

  /**
   * Parse EXPLAIN ANALYZE output
   */
  private parseExplainOutput(explainOutput: string): QueryAnalysisResult['queryPlan'] {
    // Simplified parsing - in production, use pg-query-parser
    const costMatch = explainOutput.match(/cost=(\d+\.\d+)\.\.(\d+\.\d+)/);
    const rowsMatch = explainOutput.match(/rows=(\d+)/);
    const scanMatch = explainOutput.match(/(Seq Scan|Index Scan|Bitmap Heap Scan|Index Only Scan)/);

    const estimatedCost = costMatch ? parseFloat(costMatch[2]) : 0;
    const estimatedRows = rowsMatch ? parseInt(rowsMatch[1], 10) : 0;
    const scanType = this.normalizeScanType(scanMatch?.[1] || 'Seq Scan');

    return {
      nodeType: scanMatch?.[1] || 'Unknown',
      scanType,
      estimatedCost,
      estimatedRows
    };
  }

  /**
   * Normalize scan type
   */
  private normalizeScanType(scanType: string): 'seq_scan' | 'index_scan' | 'bitmap_scan' | 'index_only_scan' {
    const lower = scanType.toLowerCase();
    if (lower.includes('index only')) return 'index_only_scan';
    if (lower.includes('index')) return 'index_scan';
    if (lower.includes('bitmap')) return 'bitmap_scan';
    return 'seq_scan';
  }

  /**
   * Estimate latency from query plan
   */
  private estimateLatency(queryPlan: NonNullable<QueryAnalysisResult['queryPlan']>): number {
    // Rough estimation: cost units → milliseconds
    // This is a simplification; actual timing depends on hardware
    const { estimatedCost, scanType, estimatedRows } = queryPlan;

    let baseLatency = estimatedCost * 0.01; // Cost to ms conversion

    // Adjust based on scan type
    if (scanType === 'seq_scan' && estimatedRows > 10000) {
      baseLatency *= 2; // Sequential scans on large tables are slower
    } else if (scanType === 'index_only_scan') {
      baseLatency *= 0.5; // Index-only scans are faster
    }

    return Math.round(baseLatency);
  }

  /**
   * Estimate latency from SQL structure (when EXPLAIN not available)
   */
  private estimateLatencyFromSQL(
    sql: string,
    tables: string[],
    joins: any[],
    whereConditions: any[]
  ): number {
    let latency = 10; // Base latency

    // Multiple tables = higher latency
    latency += tables.length * 5;

    // JOINs increase latency
    latency += joins.length * 15;

    // Complex WHERE conditions
    latency += whereConditions.length * 5;

    // LIKE queries are slower
    if (sql.includes('LIKE')) {
      latency += 20;
    }

    // Subqueries increase latency
    const subqueryCount = (sql.match(/\(SELECT/gi) || []).length;
    latency += subqueryCount * 30;

    return latency;
  }

  /**
   * Detect performance issues
   */
  private detectPerformanceIssues(
    sql: string,
    tables: string[],
    joins: any[],
    whereConditions: any[],
    estimatedLatency: number
  ): {
    issues: QueryAnalysisResult['issues'];
    recommendations: string[];
    suggestedIndexes: string[];
  } {
    const issues: QueryAnalysisResult['issues'] = [];
    const recommendations: string[] = [];
    const suggestedIndexes: string[] = [];

    // 1. SELECT * anti-pattern
    if (sql.match(/SELECT\s+\*/i)) {
      issues.push({
        type: 'optimization',
        severity: 'low',
        message: 'SELECT * fetches all columns, which may be inefficient',
        suggestion: 'Specify only needed columns: SELECT id, name, email FROM ...'
      });
      recommendations.push('Avoid SELECT * - specify only required columns');
    }

    // 2. No WHERE clause on large tables
    if (!sql.includes('WHERE') && !sql.includes('LIMIT')) {
      issues.push({
        type: 'optimization',
        severity: 'medium',
        message: 'Query without WHERE or LIMIT may fetch entire table',
        suggestion: 'Add WHERE clause to filter rows or LIMIT to restrict results'
      });
      recommendations.push('Add WHERE clause or LIMIT to queries');
    }

    // 3. LIKE with leading wildcard
    if (sql.match(/LIKE\s+'%/i)) {
      issues.push({
        type: 'index',
        severity: 'medium',
        message: 'LIKE with leading wildcard prevents index usage',
        suggestion: 'Use full-text search (tsvector) or avoid leading wildcards'
      });
      recommendations.push('Avoid LIKE with leading wildcards - use full-text search instead');
    }

    // 4. Multiple JOINs without indexes
    if (joins.length > 2) {
      issues.push({
        type: 'performance',
        severity: 'high',
        message: `Query has ${joins.length} JOINs, which may be slow without proper indexes`,
        suggestion: 'Add indexes on JOIN columns'
      });

      for (const join of joins) {
        if (join.rightColumn) {
          suggestedIndexes.push(`CREATE INDEX idx_${join.rightTable}_${join.rightColumn} ON ${join.rightTable}(${join.rightColumn});`);
        }
      }
      recommendations.push('Add indexes to all JOIN columns');
    }

    // 5. WHERE conditions without indexes
    for (const condition of whereConditions) {
      if (condition.column && tables[0]) {
        suggestedIndexes.push(`CREATE INDEX idx_${tables[0]}_${condition.column} ON ${tables[0]}(${condition.column});`);
      }
    }

    if (whereConditions.length > 0) {
      recommendations.push('Add indexes on columns used in WHERE clauses');
    }

    // 6. Slow query warning
    if (estimatedLatency > this.SLOW_QUERY_THRESHOLD) {
      issues.push({
        type: 'performance',
        severity: 'high',
        message: `Estimated query latency (${estimatedLatency}ms) exceeds threshold (${this.SLOW_QUERY_THRESHOLD}ms)`,
        suggestion: 'Optimize query with indexes, limit rows, or denormalize data'
      });
      recommendations.push('Optimize slow queries with indexes or query rewrite');
    }

    return { issues, recommendations, suggestedIndexes };
  }

  /**
   * Detect N+1 query patterns (common in ORMs)
   */
  private detectN1Queries(sql: string): {
    issues: QueryAnalysisResult['issues'];
    recommendations: string[];
  } {
    const issues: QueryAnalysisResult['issues'] = [];
    const recommendations: string[] = [];

    // N+1 detection is complex - this is a simplified check
    // In production, would analyze ORM query logs

    // Look for WHERE id IN (...) pattern (often used to avoid N+1)
    if (sql.match(/WHERE\s+\w+\s+IN\s*\(/i)) {
      recommendations.push('Good: Using IN clause to batch queries (avoids N+1)');
    }

    // Look for foreign key queries without JOINs (potential N+1)
    const hasForeignKeyColumn = sql.match(/WHERE\s+(\w+_id)\s*=/i);
    const hasJoin = sql.match(/JOIN/i);

    if (hasForeignKeyColumn && !hasJoin) {
      issues.push({
        type: 'n+1',
        severity: 'medium',
        message: 'Query filters by foreign key without JOIN - potential N+1 query pattern',
        suggestion: 'Use JOIN to fetch related data in single query instead of separate queries per row'
      });
      recommendations.push('Use JOINs or eager loading to prevent N+1 queries');
    }

    return { issues, recommendations };
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(
    estimatedLatency: number,
    targetLatency: number,
    issues: QueryAnalysisResult['issues']
  ): number {
    let score = 100;

    // Deduct points for latency exceeding target
    if (estimatedLatency > targetLatency) {
      const latencyOverage = (estimatedLatency / targetLatency) - 1;
      score -= Math.min(40, latencyOverage * 20);
    }

    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }

    return Math.max(0, Math.round(score));
  }
}
