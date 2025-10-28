/**
 * CAG Metrics Tracker
 *
 * Tracks and reports on Cache Augmented Generation performance:
 * - Cache hit rates by agent
 * - Cost savings over time
 * - Latency improvements
 * - Cache health indicators
 */
import { EventEmitter } from 'events';
import type { CAGMetrics, CAGQueryResponse } from '../rag/cag-prompt-cache.js';
export interface CAGHealthStatus {
    overall: 'healthy' | 'degraded' | 'critical';
    hitRate: {
        current: number;
        target: number;
        status: 'good' | 'warning' | 'critical';
    };
    costSavings: {
        today: number;
        thisWeek: number;
        thisMonth: number;
        projected: number;
    };
    latency: {
        avgCached: number;
        avgUncached: number;
        speedup: number;
        status: 'good' | 'warning' | 'critical';
    };
    topAgents: Array<{
        agentId: string;
        hitRate: number;
        queries: number;
        savings: number;
    }>;
    issues: string[];
    recommendations: string[];
}
export interface CAGTimeSeriesData {
    timestamp: number;
    hitRate: number;
    totalQueries: number;
    costSavings: number;
    avgLatency: number;
}
export declare class CAGMetricsTracker extends EventEmitter {
    private logger;
    private metricsPath;
    private currentMetrics;
    private timeSeries;
    private maxTimeSeriesPoints;
    private dailyCosts;
    private dailyQueries;
    constructor();
    /**
     * Initialize metrics tracker
     */
    initialize(): Promise<void>;
    /**
     * Record a CAG query result
     */
    recordQuery(response: CAGQueryResponse, agentId?: string): void;
    /**
     * Get current health status
     */
    getHealthStatus(): CAGHealthStatus;
    /**
     * Get current metrics
     */
    getMetrics(): CAGMetrics;
    /**
     * Get time series data
     */
    getTimeSeries(points?: number): CAGTimeSeriesData[];
    /**
     * Capture metrics snapshot
     */
    private captureSnapshot;
    /**
     * Daily rollover - reset daily metrics at midnight
     */
    private dailyRollover;
    /**
     * Persist metrics to disk
     */
    private persistMetrics;
    /**
     * Load historical metrics
     */
    private loadHistoricalMetrics;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
}
export declare const cagMetricsTracker: CAGMetricsTracker;
