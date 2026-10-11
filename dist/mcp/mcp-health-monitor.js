/**
 * VERSATIL Framework - MCP Health Monitoring
 * Tracks observed MCP execution outcomes with bounded retries and circuit breakers
 *
 * Features:
 * - Health checks for all 11 MCPs
 * - Exponential backoff retry (1s, 2s, 4s)
 * - Graceful degradation with fallbacks
 * - Real-time health status tracking
 * - Circuit breaker pattern
 */
import { EventEmitter } from 'events';
export class MCPHealthMonitor extends EventEmitter {
    constructor(retryConfig = {}) {
        super();
        this.healthStatus = new Map();
        this.monitoringInterval = null;
        this.MCP_IDS = [
            'chrome_mcp',
            'playwright_mcp',
            'github_mcp',
            'exa_mcp',
            'shadcn_mcp',
            'vertex_ai_mcp',
            'supabase_mcp',
            'n8n_mcp',
            'semgrep_mcp',
            'sentry_mcp',
            'versatil_mcp'
        ];
        /**
         * Execute an adapter action once by default. Callers may declare retrySafety as
         * 'read-only' or 'idempotent' only when their adapter has that guarantee.
         * Timeout never permits replay because the original action can remain running.
         */
        this.metrics = new Map();
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000, // 1 second
            maxDelay: 8000, // 8 seconds
            backoffMultiplier: 2,
            ...retryConfig
        };
        // Initialize health status for all MCPs
        for (const mcpId of this.MCP_IDS) {
            this.healthStatus.set(mcpId, {
                mcpId,
                status: 'unknown',
                lastCheck: new Date(),
                consecutiveFailures: 0,
                successRate: 0,
                averageLatency: 0,
                circuitOpen: false
            });
        }
    }
    /**
     * Start continuous health monitoring
     */
    startMonitoring(intervalMs = 60000) {
        if (this.monitoringInterval) {
            return; // Already monitoring
        }
        console.log(`🔍 Starting MCP health monitoring (interval: ${intervalMs}ms)...`);
        this.monitoringInterval = setInterval(async () => {
            await this.checkAllMCPs().catch(error => this.emit("monitoring_error", error));
        }, intervalMs);
        this.emit('monitoring_started', { intervalMs });
        // Initial check
        this.checkAllMCPs().catch(err => console.error('Initial MCP health check failed:', err));
    }
    /**
     * Stop health monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️  Stopped MCP health monitoring');
            this.emit('monitoring_stopped');
        }
    }
    getMetrics(mcpId) {
        if (!this.healthStatus.has(mcpId))
            return null;
        if (!this.metrics.has(mcpId))
            this.metrics.set(mcpId, { totalRequests: 0, successfulRequests: 0,
                failedRequests: 0, rejectedRequests: 0, averageLatency: 0, lastLatency: 0 });
        return this.metrics.get(mcpId);
    }
    async executeMCPWithRetry(mcpId, action, params = {}) {
        const started = Date.now();
        const metrics = this.getMetrics(mcpId);
        const fail = (error, retriesUsed) => ({ success: false,
            error, latency: Date.now() - started, retriesUsed, usedFallback: false });
        if (!metrics)
            return fail(`Unknown MCP: ${mcpId}`, 0);
        metrics.totalRequests++;
        if (this.healthStatus.get(mcpId)?.circuitOpen) {
            metrics.rejectedRequests++;
            return fail(`MCP circuit open: ${mcpId}`, 0);
        }
        const retrySafe = params.retrySafety === 'read-only' || params.retrySafety === 'idempotent';
        let lastError;
        let retriesUsed = 0;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            retriesUsed = attempt;
            let timer;
            try {
                const operation = typeof action === 'function' ? action() : this.executeMCP(mcpId, action, params);
                const result = params.timeout ? await Promise.race([operation, new Promise((_, reject) => {
                        timer = setTimeout(() => reject(Object.assign(new Error('MCP execution timeout'), { retryable: false })), params.timeout);
                    })]) : await operation;
                if (result?.success === false) {
                    throw Object.assign(new Error(result.error || 'MCP operation failed'), { retryable: result.retryable });
                }
                const latency = result?.latency ?? Date.now() - started;
                metrics.successfulRequests++;
                metrics.lastLatency = latency;
                metrics.averageLatency += (latency - metrics.averageLatency) / metrics.successfulRequests;
                this.recordSuccess(mcpId, latency);
                return { success: true, data: result?.data ?? result, latency, retriesUsed: attempt, usedFallback: false };
            }
            catch (error) {
                lastError = error;
                if (!retrySafe || error.retryable === false || attempt === this.retryConfig.maxRetries)
                    break;
                this.emit('retry_attempted', { mcpId, attempt: attempt + 1 });
                await this.sleep(this.calculateBackoffDelay(attempt));
            }
            finally {
                if (timer)
                    clearTimeout(timer);
            }
        }
        metrics.failedRequests++;
        this.recordFailure(mcpId);
        return fail(lastError?.message || 'MCP unavailable', retriesUsed);
    }
    async executeMCP(mcpId, _action, _params) {
        const error = Object.assign(new Error(`No native MCP executor registered for ${mcpId}`), { retryable: false });
        throw error;
    }
    /**
     * Check health of all MCPs
     */
    async checkAllMCPs() {
        for (const mcpId of this.MCP_IDS) {
            await this.checkMCPHealth(mcpId);
        }
        this.emit('health:checked', {
            timestamp: new Date(),
            healthStatus: Array.from(this.healthStatus.values())
        });
    }
    /**
     * Check health of individual MCP
     */
    async checkMCPHealth(_mcpId) {
        // No native health probe is registered. Preserve the last observed state;
        // missing monitoring configuration is not a failed adapter execution.
    }
    /**
     * Record successful MCP execution
     */
    recordSuccess(mcpId, latency) {
        const health = this.healthStatus.get(mcpId);
        if (health) {
            health.consecutiveFailures = 0;
            health.status = 'healthy';
            health.lastCheck = new Date();
            health.circuitOpen = false; // Close circuit
            // Average over completed successful operations.
            health.averageLatency = this.getMetrics(mcpId)?.averageLatency ?? latency;
            // Measure completed logical operations rather than retry attempts.
            const metrics = this.getMetrics(mcpId);
            health.successRate = metrics.successfulRequests / (metrics.successfulRequests + metrics.failedRequests) * 100;
        }
    }
    /**
     * Record failed MCP execution
     */
    recordFailure(mcpId) {
        const health = this.healthStatus.get(mcpId);
        if (health) {
            health.consecutiveFailures++;
            health.lastCheck = new Date();
            // Update success rate
            const metrics = this.getMetrics(mcpId);
            health.successRate = metrics.successfulRequests / (metrics.successfulRequests + metrics.failedRequests) * 100;
            const oldStatus = health.status;
            // Update status
            if (health.consecutiveFailures >= 5) {
                health.status = 'unhealthy';
                this.openCircuit(mcpId);
            }
            else if (health.consecutiveFailures >= 3) {
                health.status = 'unhealthy';
            }
            else {
                health.status = 'degraded';
            }
            if (oldStatus !== health.status)
                this.emit('health_changed', { mcpId, oldStatus, newStatus: health.status });
            this.emit('degradation_alert', { mcpId, severity: health.status });
        }
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoffDelay(attempt) {
        const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
        return Math.min(delay, this.retryConfig.maxDelay);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get health status for specific MCP
     */
    getHealthStatus(mcpId) {
        return this.healthStatus.get(mcpId) ?? null;
    }
    /**
     * Get health status for all MCPs
     */
    getAllHealthStatus() {
        return this.healthStatus;
    }
    /**
     * Get unhealthy MCPs
     */
    getUnhealthyMCPs() {
        return Array.from(this.healthStatus.values()).filter(health => health.status === 'unhealthy');
    }
    /**
     * Get overall system health percentage
     */
    getSystemHealthPercentage() {
        const allHealth = Array.from(this.healthStatus.values());
        const healthyCount = allHealth.filter(h => h.status === 'healthy').length;
        return (healthyCount / allHealth.length) * 100;
    }
    /**
     * Get overall health status for all MCPs
     */
    getOverallHealth() {
        const result = {};
        this.healthStatus.forEach((health, mcpId) => {
            result[mcpId] = {
                ...health,
                healthy: health.status === 'healthy'
            };
        });
        return result;
    }
    /**
     * Check if currently monitoring
     */
    isMonitoring() {
        return this.monitoringInterval !== null;
    }
    /**
     * Open circuit for an MCP (stop sending requests)
     */
    openCircuit(mcpId) {
        const health = this.healthStatus.get(mcpId);
        if (health) {
            health.circuitOpen = true;
            health.status = 'unhealthy';
            this.emit('circuit-opened', { mcpId, health });
            this.emit('circuit_opened', { mcpId, consecutiveFailures: health.consecutiveFailures });
            console.log(`⛔ Circuit opened for ${mcpId}`);
        }
    }
    /**
     * Close circuit for an MCP (resume sending requests)
     */
    closeCircuit(mcpId) {
        const health = this.healthStatus.get(mcpId);
        if (health) {
            health.circuitOpen = false;
            health.consecutiveFailures = 0;
            health.status = 'unknown';
            this.emit('circuit-closed', { mcpId, health });
            this.emit('circuit_closed', { mcpId });
            console.log(`✅ Circuit closed for ${mcpId}`);
        }
    }
    /**
     * Set circuit to half-open (testing recovery)
     */
    halfOpenCircuit(mcpId) {
        const health = this.healthStatus.get(mcpId);
        if (health) {
            health.circuitOpen = false;
            health.status = 'degraded';
            this.emit('circuit-half-open', { mcpId, health });
            console.log(`⚠️  Circuit half-open for ${mcpId} (testing recovery)`);
        }
    }
    /**
     * Get circuit breaker statistics
     */
    getCircuitBreakerStats(mcpId) {
        let open = 0;
        let closed = 0;
        let halfOpen = 0;
        this.healthStatus.forEach(health => {
            if (health.circuitOpen) {
                open++;
            }
            else if (health.status === 'degraded') {
                halfOpen++;
            }
            else {
                closed++;
            }
        });
        return {
            total: this.healthStatus.size,
            open,
            closed,
            halfOpen,
            rejectedRequests: mcpId ? this.getMetrics(mcpId)?.rejectedRequests ?? 0 : [...this.metrics.values()].reduce((sum, m) => sum + m.rejectedRequests, 0)
        };
    }
    /**
     * Generate comprehensive health report
     */
    generateHealthReport() {
        const mcps = Array.from(this.healthStatus.values());
        const circuitBreakers = this.getCircuitBreakerStats();
        const overallHealth = this.getSystemHealthPercentage();
        const recommendations = [];
        // Generate recommendations
        if (circuitBreakers.open > 0) {
            recommendations.push(`${circuitBreakers.open} MCPs have open circuits - investigate and fix`);
        }
        const unhealthyMCPs = mcps.filter(m => m.status === 'unhealthy');
        if (unhealthyMCPs.length > 0) {
            recommendations.push(`Unhealthy MCPs: ${unhealthyMCPs.map(m => m.mcpId).join(', ')}`);
        }
        const degradedMCPs = mcps.filter(m => m.status === 'degraded');
        if (degradedMCPs.length > 0) {
            recommendations.push(`Degraded MCPs: ${degradedMCPs.map(m => m.mcpId).join(', ')}`);
        }
        if (overallHealth < 80) {
            recommendations.push('System health below 80% - immediate action required');
        }
        return {
            timestamp: new Date(),
            totalMCPs: mcps.length,
            healthyCount: mcps.filter(m => m.status === 'healthy').length,
            degradedCount: mcps.filter(m => m.status === 'degraded').length,
            unhealthyCount: mcps.filter(m => m.status === 'unhealthy').length,
            overallHealth,
            mcps,
            circuitBreakers,
            recommendations
        };
    }
    calculateReliabilityScore() { return this.getSystemHealthPercentage(); }
    exportMetricsJSON() { return JSON.stringify({ timestamp: new Date(), mcps: [...this.metrics.entries()] }); }
    getSummaryStats() {
        const metrics = [...this.metrics.values()];
        return { totalMCPs: this.healthStatus.size, overallHealthScore: this.calculateReliabilityScore(),
            averageLatency: metrics.length ? metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length : 0,
            totalRequests: metrics.reduce((sum, m) => sum + m.totalRequests, 0) };
    }
}
// Export singleton instance
export const globalMCPHealthMonitor = new MCPHealthMonitor();
//# sourceMappingURL=mcp-health-monitor.js.map