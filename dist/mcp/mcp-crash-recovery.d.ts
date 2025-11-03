/**
 * VERSATIL Framework - MCP Crash Recovery System
 *
 * Automatic recovery from MCP server crashes and timeouts.
 * Features:
 * - Auto-restart on crash (max 3 attempts)
 * - State persistence before shutdown
 * - Graceful degradation on repeated failures
 * - Health monitoring and timeout handling
 *
 * @module MCPCrashRecovery
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
export interface MCPServerConfig {
    serverPath: string;
    projectPath: string;
    port?: number;
    timeout?: number;
    maxRestartAttempts?: number;
    restartDelay?: number;
}
export interface MCPServerState {
    pid: number | null;
    status: 'running' | 'stopped' | 'crashed' | 'timeout' | 'degraded';
    startTime: number | null;
    lastCrashTime: number | null;
    crashCount: number;
    restartAttempts: number;
    lastError: string | null;
}
export interface CrashReport {
    timestamp: number;
    pid: number | null;
    error: string;
    exitCode: number | null;
    signal: string | null;
    restartAttempt: number;
    recovered: boolean;
}
export declare class MCPCrashRecovery extends EventEmitter {
    private logger;
    private config;
    private state;
    private process;
    private healthCheckInterval;
    private crashHistory;
    private readonly STATE_FILE;
    private readonly MAX_CRASH_HISTORY;
    constructor(config: MCPServerConfig);
    /**
     * Start MCP server with crash recovery
     */
    start(): Promise<void>;
    /**
     * Stop MCP server gracefully
     */
    stop(): Promise<void>;
    /**
     * Restart MCP server
     */
    restart(): Promise<void>;
    /**
     * Start the actual server process
     */
    private startServer;
    /**
     * Handle server crash
     */
    private handleCrash;
    /**
     * Handle timeout during startup
     */
    private handleTimeout;
    /**
     * Handle recovery failure (max attempts exceeded)
     */
    private handleRecoveryFailure;
    /**
     * Start health check monitoring
     */
    private startHealthCheck;
    /**
     * Get current state
     */
    getState(): MCPServerState;
    /**
     * Get crash history
     */
    getCrashHistory(): CrashReport[];
    /**
     * Reset crash counters
     */
    resetCrashCounters(): void;
    /**
     * Generate crash report
     */
    generateCrashReport(): string;
    /**
     * Load persisted state
     */
    private loadState;
    /**
     * Save state to disk
     */
    private saveState;
    /**
     * Cleanup
     */
    shutdown(): Promise<void>;
}
export declare function createMCPRecovery(config: MCPServerConfig): MCPCrashRecovery;
