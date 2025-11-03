/**
 * VERSATIL Framework - Integrated Health Monitor
 *
 * Central monitoring system that integrates:
 * - Duplicate Repository Detection
 * - MCP Crash Recovery
 * - Sync Recovery System
 * - Context Sentinel
 * - Repository Integrity Checks
 *
 * @module IntegratedHealthMonitor
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
import { FrameworkEfficiencyMonitor } from './framework-efficiency-monitor.js';
export interface HealthStatus {
    overall: 'healthy' | 'degraded' | 'critical';
    timestamp: number;
    checks: {
        duplicateRepositories: {
            status: 'pass' | 'warn' | 'fail';
            message: string;
            duplicateCount: number;
        };
        syncRecovery: {
            status: 'pass' | 'warn' | 'fail';
            message: string;
            recoveryInProgress: boolean;
        };
        mcpServer: {
            status: 'pass' | 'warn' | 'fail';
            message: string;
            crashCount: number;
        };
        isolation: {
            status: 'pass' | 'warn' | 'fail';
            message: string;
            violations: string[];
        };
        outputAccuracy: {
            status: 'pass' | 'warn' | 'fail';
            message: string;
            hallucinationRate: number;
            averageAccuracy: number;
        };
    };
    recommendations: string[];
}
export declare class IntegratedHealthMonitor extends EventEmitter {
    private logger;
    private duplicateDetector;
    private syncRecovery;
    private statementValidator;
    private frameworkMonitor?;
    private monitoringInterval;
    private readonly MONITORING_INTERVAL;
    private hallucinationEvents;
    private totalValidations;
    private accuracySum;
    constructor();
    /**
     * Initialize health monitoring
     */
    initialize(frameworkMonitor?: FrameworkEfficiencyMonitor): Promise<void>;
    /**
     * Start continuous health monitoring
     */
    startMonitoring(): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Perform comprehensive health check
     */
    performHealthCheck(): Promise<HealthStatus>;
    /**
     * Check for duplicate repositories
     */
    private checkDuplicateRepositories;
    /**
     * Check sync recovery system
     */
    private checkSyncRecovery;
    /**
     * Check isolation compliance
     */
    private checkIsolation;
    /**
     * Check output accuracy (Guardian anti-hallucination system)
     */
    private checkOutputAccuracy;
    /**
     * Calculate overall health status
     */
    private calculateOverallStatus;
    /**
     * Generate health report
     */
    generateHealthReport(): Promise<string>;
    /**
     * Run automated cleanup
     */
    runAutomatedCleanup(): Promise<void>;
    /**
     * Shutdown
     */
    shutdown(): void;
}
export declare function getHealthMonitor(): IntegratedHealthMonitor;
export declare function destroyHealthMonitor(): void;
