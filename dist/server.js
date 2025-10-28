#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Production Server
 * Enhanced OPERA agent system with health monitoring
 */
import express from 'express';
import { createServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { VERSATILLogger } from './utils/logger.js';
import { PerformanceMonitor } from './analytics/performance-monitor.js';
// Initialize logger and performance monitor
const logger = new VERSATILLogger();
const performanceMonitor = new PerformanceMonitor();
const app = express();
const server = createServer(app);
// Environment configuration
const PORT = process.env['PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const ENHANCED_AGENTS_ENABLED = process.env['ENHANCED_AGENTS_ENABLED'] === 'true';
const PERFORMANCE_MONITORING = process.env['PERFORMANCE_MONITORING'] === 'true';
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env['npm_package_version'] || '1.0.0',
        environment: NODE_ENV,
        enhancedAgents: ENHANCED_AGENTS_ENABLED,
        performanceMonitoring: PERFORMANCE_MONITORING
    };
    logger.info('Health check requested', health, 'server');
    res.status(200).json(health);
});
// Readiness probe endpoint
app.get('/ready', (req, res) => {
    const ready = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
            filesystem: checkFilesystem(),
            memory: checkMemory(),
            operaAgents: checkOPERAAgents()
        }
    };
    const allReady = Object.values(ready.checks).every(check => check.status === 'ok');
    if (allReady) {
        logger.info('Readiness check passed', ready, 'server');
        res.status(200).json(ready);
    }
    else {
        logger.warning('Readiness check failed', ready, 'server');
        res.status(503).json(ready);
    }
});
// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
    if (!PERFORMANCE_MONITORING) {
        return res.status(404).json({ error: 'Metrics disabled' });
    }
    const metrics = performanceMonitor.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    return res.send(metrics);
});
// Enhanced OPERA agent status endpoint
app.get('/agents/status', (req, res) => {
    if (!ENHANCED_AGENTS_ENABLED) {
        return res.status(404).json({ error: 'Enhanced agents disabled' });
    }
    const agentStatus = {
        enhancedMaria: checkAgentHealth('enhanced-maria'),
        enhancedJames: checkAgentHealth('enhanced-james'),
        enhancedMarcus: checkAgentHealth('enhanced-marcus'),
        enhancedSarah: checkAgentHealth('enhanced-sarah'),
        enhancedAlex: checkAgentHealth('enhanced-alex'),
        enhancedDrAI: checkAgentHealth('enhanced-dr-ai')
    };
    logger.info('Agent status requested', agentStatus, 'server');
    return res.status(200).json(agentStatus);
});
// Analytics endpoint
app.get('/analytics', (req, res) => {
    if (!PERFORMANCE_MONITORING) {
        return res.status(404).json({ error: 'Analytics disabled' });
    }
    const analyticsPath = path.join(process.cwd(), '.versatil', 'analytics', 'metrics.json');
    if (!fs.existsSync(analyticsPath)) {
        return res.status(404).json({ error: 'Analytics data not found' });
    }
    try {
        const analytics = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        logger.info('Analytics data requested', { timestamp: analytics.timestamp }, 'server');
        return res.status(200).json(analytics);
    }
    catch (error) {
        logger.error('Failed to read analytics data', { error: error instanceof Error ? error.message : String(error) }, 'server');
        return res.status(500).json({ error: 'Failed to read analytics data' });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Server error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error.stack,
        path: req.path,
        method: req.method
    }, 'server');
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});
// Helper functions for health checks
function checkFilesystem() {
    try {
        const testFile = path.join('/tmp', `health-check-${Date.now()}`);
        fs.writeFileSync(testFile, 'health-check');
        fs.unlinkSync(testFile);
        return { status: 'ok' };
    }
    catch (error) {
        return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
}
function checkMemory() {
    const usage = process.memoryUsage();
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    if (usagePercent > 90) {
        return {
            status: 'warning',
            usage: { ...usage, usagePercent: Math.round(usagePercent) },
            message: 'High memory usage'
        };
    }
    return {
        status: 'ok',
        usage: { ...usage, usagePercent: Math.round(usagePercent) }
    };
}
function checkOPERAAgents() {
    if (!ENHANCED_AGENTS_ENABLED) {
        return { status: 'disabled', message: 'Enhanced agents not enabled' };
    }
    const agentDataPath = path.join(process.cwd(), '.versatil', 'analytics', 'metrics.json');
    if (!fs.existsSync(agentDataPath)) {
        return { status: 'warning', message: 'No agent metrics found' };
    }
    try {
        const stats = fs.statSync(agentDataPath);
        const lastModified = Date.now() - stats.mtime.getTime();
        // Check if metrics are recent (within last hour)
        if (lastModified > 3600000) {
            return {
                status: 'stale',
                message: `Agent metrics stale: ${Math.round(lastModified / 60000)} minutes old`
            };
        }
        return { status: 'ok' };
    }
    catch (error) {
        return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
}
function checkAgentHealth(agentId) {
    try {
        const agentLogPath = path.join(process.cwd(), '.versatil', 'logs', `${agentId}.log`);
        if (!fs.existsSync(agentLogPath)) {
            return { status: 'unknown', message: 'No log file found' };
        }
        const stats = fs.statSync(agentLogPath);
        const lastModified = stats.mtime.toISOString();
        const timeSinceUpdate = Date.now() - stats.mtime.getTime();
        if (timeSinceUpdate < 300000) { // 5 minutes
            return { status: 'active', lastSeen: lastModified };
        }
        else if (timeSinceUpdate < 3600000) { // 1 hour
            return { status: 'idle', lastSeen: lastModified };
        }
        else {
            return { status: 'inactive', lastSeen: lastModified, message: 'Agent not seen recently' };
        }
    }
    catch (error) {
        return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
}
// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully', {}, 'server');
    server.close(() => {
        logger.info('Server closed', {}, 'server');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully', {}, 'server');
    server.close(() => {
        logger.info('Server closed', {}, 'server');
        process.exit(0);
    });
});
// Start server
server.listen(PORT, () => {
    logger.info('VERSATIL SDLC Framework server started', {
        port: PORT,
        environment: NODE_ENV,
        enhancedAgents: ENHANCED_AGENTS_ENABLED,
        performanceMonitoring: PERFORMANCE_MONITORING,
        processId: process.pid
    }, 'server');
    // Initialize performance monitoring if enabled
    if (PERFORMANCE_MONITORING) {
        performanceMonitor.start();
        logger.info('Performance monitoring started', {}, 'server');
    }
});
export { app, server };
//# sourceMappingURL=server.js.map