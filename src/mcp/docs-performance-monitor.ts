/**
 * VERSATIL Documentation Performance Monitor
 * Query timing, cache hit rates, and Prometheus metrics export
 */

export interface QueryMetric {
  query: string;
  duration: number; // milliseconds
  cacheHit: boolean;
  timestamp: Date;
  resultCount?: number;
}

export interface IndexBuildMetric {
  duration: number;
  documentCount: number;
  timestamp: Date;
}

export interface PerformanceMetrics {
  // Query metrics
  totalQueries: number;
  cacheHitRate: number;
  avgQueryDuration: number;
  p50QueryDuration: number;
  p95QueryDuration: number;
  p99QueryDuration: number;

  // Index metrics
  totalIndexBuilds: number;
  avgIndexBuildDuration: number;
  lastIndexBuild: Date | null;

  // Time range
  startTime: Date;
  uptimeMs: number;
}

export class DocsPerformanceMonitor {
  private queryMetrics: QueryMetric[];
  private indexBuildMetrics: IndexBuildMetric[];
  private startTime: Date;
  private maxMetrics: number;

  constructor(options: { maxMetrics?: number } = {}) {
    this.queryMetrics = [];
    this.indexBuildMetrics = [];
    this.startTime = new Date();
    this.maxMetrics = options.maxMetrics || 1000; // Keep last 1000 metrics
  }

  /**
   * Track a query execution
   */
  trackQuery(query: string, duration: number, cacheHit: boolean, resultCount?: number): void {
    const metric: QueryMetric = {
      query,
      duration,
      cacheHit,
      timestamp: new Date(),
      resultCount,
    };

    this.queryMetrics.push(metric);

    // Trim old metrics if exceeding max
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Track an index build
   */
  trackIndexBuild(duration: number, documentCount: number): void {
    const metric: IndexBuildMetric = {
      duration,
      documentCount,
      timestamp: new Date(),
    };

    this.indexBuildMetrics.push(metric);

    // Keep last 100 index builds
    if (this.indexBuildMetrics.length > 100) {
      this.indexBuildMetrics = this.indexBuildMetrics.slice(-100);
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) {
      return 0;
    }

    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const now = new Date();

    // Query metrics
    const totalQueries = this.queryMetrics.length;
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalQueries > 0 ? cacheHits / totalQueries : 0;

    const queryDurations = this.queryMetrics.map(m => m.duration).sort((a, b) => a - b);
    const avgQueryDuration =
      queryDurations.length > 0
        ? queryDurations.reduce((sum, d) => sum + d, 0) / queryDurations.length
        : 0;

    const p50 = this.calculatePercentile(queryDurations, 50);
    const p95 = this.calculatePercentile(queryDurations, 95);
    const p99 = this.calculatePercentile(queryDurations, 99);

    // Index build metrics
    const totalIndexBuilds = this.indexBuildMetrics.length;
    const indexDurations = this.indexBuildMetrics.map(m => m.duration);
    const avgIndexBuildDuration =
      indexDurations.length > 0
        ? indexDurations.reduce((sum, d) => sum + d, 0) / indexDurations.length
        : 0;

    const lastIndexBuild =
      this.indexBuildMetrics.length > 0
        ? this.indexBuildMetrics[this.indexBuildMetrics.length - 1].timestamp
        : null;

    return {
      totalQueries,
      cacheHitRate,
      avgQueryDuration,
      p50QueryDuration: p50,
      p95QueryDuration: p95,
      p99QueryDuration: p99,
      totalIndexBuilds,
      avgIndexBuildDuration,
      lastIndexBuild,
      startTime: this.startTime,
      uptimeMs: now.getTime() - this.startTime.getTime(),
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const metrics = this.getMetrics();
    const lines: string[] = [];

    // Query metrics
    lines.push('# HELP versatil_docs_queries_total Total number of documentation queries');
    lines.push('# TYPE versatil_docs_queries_total counter');
    lines.push(`versatil_docs_queries_total ${metrics.totalQueries}`);
    lines.push('');

    lines.push('# HELP versatil_docs_cache_hit_rate Cache hit rate (0-1)');
    lines.push('# TYPE versatil_docs_cache_hit_rate gauge');
    lines.push(`versatil_docs_cache_hit_rate ${metrics.cacheHitRate.toFixed(3)}`);
    lines.push('');

    lines.push('# HELP versatil_docs_query_duration_ms Query duration in milliseconds');
    lines.push('# TYPE versatil_docs_query_duration_ms summary');
    lines.push(`versatil_docs_query_duration_ms{quantile="0.5"} ${metrics.p50QueryDuration.toFixed(2)}`);
    lines.push(`versatil_docs_query_duration_ms{quantile="0.95"} ${metrics.p95QueryDuration.toFixed(2)}`);
    lines.push(`versatil_docs_query_duration_ms{quantile="0.99"} ${metrics.p99QueryDuration.toFixed(2)}`);
    lines.push(`versatil_docs_query_duration_ms_sum ${(metrics.avgQueryDuration * metrics.totalQueries).toFixed(2)}`);
    lines.push(`versatil_docs_query_duration_ms_count ${metrics.totalQueries}`);
    lines.push('');

    lines.push('# HELP versatil_docs_index_builds_total Total number of index builds');
    lines.push('# TYPE versatil_docs_index_builds_total counter');
    lines.push(`versatil_docs_index_builds_total ${metrics.totalIndexBuilds}`);
    lines.push('');

    lines.push('# HELP versatil_docs_index_build_duration_ms Average index build duration in milliseconds');
    lines.push('# TYPE versatil_docs_index_build_duration_ms gauge');
    lines.push(`versatil_docs_index_build_duration_ms ${metrics.avgIndexBuildDuration.toFixed(2)}`);
    lines.push('');

    lines.push('# HELP versatil_docs_uptime_seconds Uptime in seconds');
    lines.push('# TYPE versatil_docs_uptime_seconds counter');
    lines.push(`versatil_docs_uptime_seconds ${(metrics.uptimeMs / 1000).toFixed(1)}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get recent queries
   */
  getRecentQueries(limit: number = 10): QueryMetric[] {
    return this.queryMetrics.slice(-limit).reverse();
  }

  /**
   * Get slowest queries
   */
  getSlowestQueries(limit: number = 10): QueryMetric[] {
    return [...this.queryMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get recent index builds
   */
  getRecentIndexBuilds(limit: number = 5): IndexBuildMetric[] {
    return this.indexBuildMetrics.slice(-limit).reverse();
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.queryMetrics = [];
    this.indexBuildMetrics = [];
    this.startTime = new Date();
  }

  /**
   * Get query count by time window
   */
  getQueryCountByWindow(windowMs: number): number {
    const now = new Date();
    const cutoff = now.getTime() - windowMs;

    return this.queryMetrics.filter(m => m.timestamp.getTime() >= cutoff).length;
  }

  /**
   * Get cache hit rate by time window
   */
  getCacheHitRateByWindow(windowMs: number): number {
    const now = new Date();
    const cutoff = now.getTime() - windowMs;

    const recentQueries = this.queryMetrics.filter(m => m.timestamp.getTime() >= cutoff);

    if (recentQueries.length === 0) {
      return 0;
    }

    const hits = recentQueries.filter(m => m.cacheHit).length;
    return hits / recentQueries.length;
  }
}
