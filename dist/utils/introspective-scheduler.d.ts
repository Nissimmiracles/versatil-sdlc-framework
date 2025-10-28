/**
 * IntrospectiveScheduler - Automated scheduling system for IntrospectiveAgent
 *
 * This scheduler manages periodic execution of the IntrospectiveAgent to ensure
 * continuous framework monitoring and optimization without user intervention.
 */
import { IntrospectiveAgent } from '../agents/meta/introspective/introspective-agent.js';
import { EventEmitter } from 'events';
export interface SchedulerConfig {
    interval: number;
    maxConcurrentRuns: number;
    autoStart: boolean;
    conditions: {
        minInterval: number;
        maxExecutionTime: number;
        skipOnHighLoad: boolean;
        skipOnLowActivity: boolean;
    };
}
export interface SchedulerMetrics {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageExecutionTime: number;
    lastRunTime: number;
    nextScheduledRun: number;
    currentlyRunning: boolean;
}
export declare class IntrospectiveScheduler extends EventEmitter {
    private agent;
    private logger;
    private config;
    private intervalId;
    private isRunning;
    private metrics;
    private runHistory;
    constructor(agent: IntrospectiveAgent, config?: Partial<SchedulerConfig>);
    /**
     * Start the scheduler
     */
    start(): void;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Execute immediate introspection (bypasses scheduling)
     */
    executeNow(): Promise<void>;
    /**
     * Internal method to execute introspection with conditions
     */
    private executeIntrospection;
    /**
     * Check if system is under high load
     */
    private isSystemUnderHighLoad;
    /**
     * Check if there's been low framework activity
     */
    private isLowActivity;
    /**
     * Calculate rolling average execution time
     */
    private calculateAverageExecutionTime;
    /**
     * Get success rate percentage
     */
    private getSuccessRate;
    /**
     * Get current metrics
     */
    getMetrics(): SchedulerMetrics;
    /**
     * Get run history
     */
    getRunHistory(): typeof this.runHistory;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<SchedulerConfig>): void;
    /**
     * Get health status of the scheduler
     */
    getHealthStatus(): {
        healthy: boolean;
        issues: string[];
        recommendations: string[];
    };
    /**
     * Generate scheduler dashboard data
     */
    generateDashboard(): {
        status: string;
        metrics: SchedulerMetrics;
        recentActivity: Array<{
            time: string;
            success: boolean;
            executionTime: number;
            improvements: number;
        }>;
        health: any;
        nextActions: string[];
    };
}
export declare function createIntrospectiveScheduler(agent: IntrospectiveAgent, config?: Partial<SchedulerConfig>): IntrospectiveScheduler;
