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
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { VERSATILLogger } from '../utils/logger.js';
export class MCPCrashRecovery extends EventEmitter {
    constructor(config) {
        super();
        this.process = null;
        this.healthCheckInterval = null;
        this.crashHistory = [];
        this.MAX_CRASH_HISTORY = 50;
        this.logger = new VERSATILLogger('MCPRecovery');
        this.config = {
            serverPath: config.serverPath,
            projectPath: config.projectPath,
            port: config.port || 3000,
            timeout: config.timeout || 10000,
            maxRestartAttempts: config.maxRestartAttempts || 3,
            restartDelay: config.restartDelay || 2000
        };
        this.STATE_FILE = path.join(process.env.HOME || '~', '.versatil-cursor', 'mcp-server-state.json');
        this.state = {
            pid: null,
            status: 'stopped',
            startTime: null,
            lastCrashTime: null,
            crashCount: 0,
            restartAttempts: 0,
            lastError: null
        };
        this.loadState();
    }
    /**
     * Start MCP server with crash recovery
     */
    async start() {
        if (this.state.status === 'running') {
            this.logger.warn('MCP server already running', { pid: this.state.pid });
            return;
        }
        this.logger.info('Starting MCP server with crash recovery', {
            serverPath: this.config.serverPath,
            projectPath: this.config.projectPath,
            maxAttempts: this.config.maxRestartAttempts
        });
        try {
            await this.startServer();
            this.startHealthCheck();
            await this.saveState();
        }
        catch (error) {
            this.logger.error('Failed to start MCP server', { error });
            throw error;
        }
    }
    /**
     * Stop MCP server gracefully
     */
    async stop() {
        this.logger.info('Stopping MCP server gracefully');
        // Save state before shutdown
        await this.saveState();
        // Stop health monitoring
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        // Kill process
        if (this.process) {
            this.process.kill('SIGTERM');
            // Wait for graceful shutdown
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    if (this.process) {
                        this.logger.warn('Force killing MCP server after timeout');
                        this.process.kill('SIGKILL');
                    }
                    resolve();
                }, 5000);
                if (this.process) {
                    this.process.once('exit', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
            this.process = null;
        }
        this.state.status = 'stopped';
        this.state.pid = null;
        this.state.startTime = null;
        await this.saveState();
        this.logger.info('MCP server stopped');
    }
    /**
     * Restart MCP server
     */
    async restart() {
        this.logger.info('Restarting MCP server');
        await this.stop();
        await new Promise(resolve => setTimeout(resolve, this.config.restartDelay));
        await this.start();
    }
    /**
     * Start the actual server process
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            this.logger.debug('Spawning MCP server process', {
                serverPath: this.config.serverPath,
                projectPath: this.config.projectPath
            });
            try {
                this.process = spawn('node', [this.config.serverPath, this.config.projectPath], {
                    cwd: path.dirname(this.config.serverPath),
                    stdio: ['ignore', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        MCP_PORT: this.config.port.toString(),
                        MCP_TIMEOUT: this.config.timeout.toString()
                    }
                });
                this.state.pid = this.process.pid || null;
                this.state.status = 'running';
                this.state.startTime = Date.now();
                this.state.restartAttempts = 0;
                // Set up event listeners
                this.process.stdout?.on('data', (data) => {
                    this.logger.debug('MCP server output', { data: data.toString().trim() });
                });
                this.process.stderr?.on('data', (data) => {
                    const error = data.toString().trim();
                    this.logger.error('MCP server error', { error });
                    this.state.lastError = error;
                });
                this.process.on('error', (error) => {
                    this.logger.error('MCP server process error', { error });
                    this.handleCrash(error.message, null, null);
                });
                this.process.on('exit', (code, signal) => {
                    this.logger.warn('MCP server process exited', { code, signal });
                    if (code !== 0 || signal) {
                        this.handleCrash(`Exited with code ${code}`, code, signal);
                    }
                });
                // Wait for server to be ready (or timeout)
                const startupTimeout = setTimeout(() => {
                    if (this.state.status === 'running') {
                        this.state.status = 'timeout';
                        this.logger.warn('MCP server startup timeout', {
                            timeout: this.config.timeout
                        });
                        this.handleTimeout();
                    }
                }, this.config.timeout);
                // Check for "running" message
                this.process.stdout?.once('data', () => {
                    clearTimeout(startupTimeout);
                    this.emit('started', { pid: this.state.pid });
                    resolve();
                });
                // If no output within timeout, still resolve but mark as timeout
                setTimeout(() => {
                    clearTimeout(startupTimeout);
                    if (this.state.status === 'running') {
                        resolve();
                    }
                }, this.config.timeout);
            }
            catch (error) {
                this.logger.error('Failed to spawn MCP server', { error });
                reject(error);
            }
        });
    }
    /**
     * Handle server crash
     */
    async handleCrash(error, exitCode, signal) {
        const crashReport = {
            timestamp: Date.now(),
            pid: this.state.pid,
            error,
            exitCode,
            signal,
            restartAttempt: this.state.restartAttempts,
            recovered: false
        };
        this.crashHistory.push(crashReport);
        if (this.crashHistory.length > this.MAX_CRASH_HISTORY) {
            this.crashHistory.shift();
        }
        this.state.status = 'crashed';
        this.state.crashCount++;
        this.state.lastCrashTime = Date.now();
        this.state.lastError = error;
        this.emit('crash', crashReport);
        this.logger.error('MCP server crashed', {
            error,
            exitCode,
            signal,
            crashCount: this.state.crashCount,
            restartAttempts: this.state.restartAttempts
        });
        // Attempt auto-recovery
        if (this.state.restartAttempts < this.config.maxRestartAttempts) {
            this.state.restartAttempts++;
            this.logger.info('Attempting auto-recovery', {
                attempt: this.state.restartAttempts,
                maxAttempts: this.config.maxRestartAttempts
            });
            await new Promise(resolve => setTimeout(resolve, this.config.restartDelay));
            try {
                await this.startServer();
                crashReport.recovered = true;
                this.emit('recovered', crashReport);
                this.logger.info('MCP server recovered successfully');
            }
            catch (recoveryError) {
                this.logger.error('Recovery attempt failed', { recoveryError });
                await this.handleRecoveryFailure();
            }
        }
        else {
            await this.handleRecoveryFailure();
        }
        await this.saveState();
    }
    /**
     * Handle timeout during startup
     */
    async handleTimeout() {
        this.logger.warn('MCP server startup timeout - entering degraded mode');
        this.state.status = 'degraded';
        this.emit('timeout', {
            timeout: this.config.timeout,
            pid: this.state.pid
        });
    }
    /**
     * Handle recovery failure (max attempts exceeded)
     */
    async handleRecoveryFailure() {
        this.state.status = 'degraded';
        this.logger.error('MCP server recovery failed - entering degraded mode', {
            crashCount: this.state.crashCount,
            restartAttempts: this.state.restartAttempts
        });
        this.emit('degraded', {
            crashCount: this.state.crashCount,
            lastError: this.state.lastError
        });
        // Clean up
        if (this.process) {
            this.process.kill('SIGKILL');
            this.process = null;
        }
    }
    /**
     * Start health check monitoring
     */
    startHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(async () => {
            if (this.state.status === 'running' && this.state.pid) {
                // Check if process is still alive
                try {
                    process.kill(this.state.pid, 0); // Signal 0 checks existence
                }
                catch (error) {
                    this.logger.warn('MCP server process not found', { pid: this.state.pid });
                    await this.handleCrash('Process not found', null, null);
                }
            }
        }, 5000); // Check every 5 seconds
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get crash history
     */
    getCrashHistory() {
        return [...this.crashHistory];
    }
    /**
     * Reset crash counters
     */
    resetCrashCounters() {
        this.state.crashCount = 0;
        this.state.restartAttempts = 0;
        this.state.lastCrashTime = null;
        this.state.lastError = null;
        this.logger.info('Crash counters reset');
    }
    /**
     * Generate crash report
     */
    generateCrashReport() {
        const report = [];
        report.push('='.repeat(70));
        report.push('💥 VERSATIL MCP Crash Report');
        report.push('='.repeat(70));
        report.push('');
        report.push(`Status: ${this.state.status.toUpperCase()}`);
        report.push(`PID: ${this.state.pid || 'N/A'}`);
        report.push(`Total Crashes: ${this.state.crashCount}`);
        report.push(`Restart Attempts: ${this.state.restartAttempts}/${this.config.maxRestartAttempts}`);
        report.push('');
        if (this.state.lastError) {
            report.push(`Last Error: ${this.state.lastError}`);
            report.push('');
        }
        if (this.crashHistory.length > 0) {
            report.push('Recent Crashes:');
            const recent = this.crashHistory.slice(-5);
            for (const crash of recent) {
                report.push(`  ${new Date(crash.timestamp).toLocaleString()}`);
                report.push(`    Error: ${crash.error}`);
                report.push(`    Exit Code: ${crash.exitCode || 'N/A'}`);
                report.push(`    Recovered: ${crash.recovered ? '✅' : '❌'}`);
                report.push('');
            }
        }
        report.push('='.repeat(70));
        return report.join('\n');
    }
    /**
     * Load persisted state
     */
    loadState() {
        try {
            if (fs.existsSync(this.STATE_FILE)) {
                const data = fs.readFileSync(this.STATE_FILE, 'utf-8');
                const saved = JSON.parse(data);
                // Only restore certain fields
                this.state.crashCount = saved.crashCount || 0;
                this.state.lastCrashTime = saved.lastCrashTime || null;
                this.crashHistory = saved.crashHistory || [];
                this.logger.debug('MCP server state loaded', { crashCount: this.state.crashCount });
            }
        }
        catch (error) {
            this.logger.error('Failed to load MCP server state', { error });
        }
    }
    /**
     * Save state to disk
     */
    async saveState() {
        try {
            const dir = path.dirname(this.STATE_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = {
                crashCount: this.state.crashCount,
                lastCrashTime: this.state.lastCrashTime,
                crashHistory: this.crashHistory.slice(-20) // Keep last 20
            };
            fs.writeFileSync(this.STATE_FILE, JSON.stringify(data, null, 2));
            this.logger.debug('MCP server state saved');
        }
        catch (error) {
            this.logger.error('Failed to save MCP server state', { error });
        }
    }
    /**
     * Cleanup
     */
    async shutdown() {
        await this.stop();
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        this.removeAllListeners();
        this.logger.info('MCP crash recovery shutdown');
    }
}
// Factory function
export function createMCPRecovery(config) {
    return new MCPCrashRecovery(config);
}
//# sourceMappingURL=mcp-crash-recovery.js.map