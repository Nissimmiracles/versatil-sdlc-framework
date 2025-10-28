/**
 * Agent Activation Tracker
 *
 * Tracks all agent activation events with timestamps, accuracy metrics,
 * and latency measurements. Stores metrics for validation and reporting.
 *
 * @module activation-tracker
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
export interface ActivationEvent {
    eventId: string;
    timestamp: Date;
    agentId: string;
    trigger: {
        type: 'file_pattern' | 'code_content' | 'keyword' | 'context' | 'manual';
        pattern?: string;
        filePath?: string;
        content?: string;
    };
    latency: number;
    accuracy: 'correct' | 'incorrect' | 'false_positive' | 'false_negative';
    expectedAgent?: string;
    confidence: number;
    context?: any;
}
export interface ActivationMetrics {
    agentId: string;
    totalActivations: number;
    correctActivations: number;
    incorrectActivations: number;
    falsePositives: number;
    falseNegatives: number;
    accuracy: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    p95Latency: number;
    lastActivation: Date | null;
}
export interface ValidationReport {
    timestamp: Date;
    overallAccuracy: number;
    overallLatency: number;
    totalActivations: number;
    agentMetrics: Map<string, ActivationMetrics>;
    failedAgents: string[];
    slowAgents: string[];
    summary: string;
}
export declare class ActivationTracker extends EventEmitter {
    private events;
    private metricsCache;
    private storageDir;
    private maxEvents;
    private autosaveInterval;
    constructor(storageDir?: string);
    /**
     * Initialize storage directory and load existing events
     */
    private initialize;
    /**
     * Track an activation event
     */
    trackActivation(event: Omit<ActivationEvent, 'eventId' | 'timestamp'>): void;
    /**
     * Get metrics for a specific agent
     */
    getAgentMetrics(agentId: string): ActivationMetrics;
    /**
     * Get all agent metrics
     */
    getAllMetrics(): Map<string, ActivationMetrics>;
    /**
     * Generate validation report
     */
    generateReport(): ValidationReport;
    /**
     * Generate human-readable summary
     */
    private generateSummary;
    /**
     * Get recent events (last N)
     */
    getRecentEvents(limit?: number): ActivationEvent[];
    /**
     * Get events by agent
     */
    getEventsByAgent(agentId: string, limit?: number): ActivationEvent[];
    /**
     * Get events by time range
     */
    getEventsByTimeRange(start: Date, end: Date): ActivationEvent[];
    /**
     * Clear all events and cache
     */
    clear(): void;
    /**
     * Save events to disk
     */
    private saveEvents;
    /**
     * Load events from disk
     */
    private loadEvents;
    /**
     * Cleanup and save before shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Export events as CSV
     */
    exportCSV(): string;
    /**
     * Export report as JSON
     */
    exportReportJSON(): string;
}
/**
 * Get global activation tracker instance
 */
export declare function getActivationTracker(): ActivationTracker;
/**
 * Reset global tracker (for testing)
 */
export declare function resetActivationTracker(): void;
