/**
 * VERSATIL SDLC Framework - HTTP MCP Server
 * Provides HTTP/SSE transport for remote MCP server access
 */
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { VERSATILMCPServerV2 } from './versatil-mcp-server-v2.js';
export class VERSATILMCPHTTPServer {
    constructor(mcpConfig, httpConfig = {}) {
        this.server = null;
        this.activeSessions = new Map();
        this.config = {
            port: httpConfig.port || 3100,
            host: httpConfig.host || 'localhost',
            cors: {
                enabled: httpConfig.cors?.enabled ?? true,
                origins: httpConfig.cors?.origins || ['http://localhost:*', 'http://127.0.0.1:*'],
            },
            auth: {
                enabled: httpConfig.auth?.enabled ?? false,
                bearerToken: httpConfig.auth?.bearerToken,
            },
            dnsRebindingProtection: {
                enabled: httpConfig.dnsRebindingProtection?.enabled ?? true,
                allowedHosts: httpConfig.dnsRebindingProtection?.allowedHosts || ['localhost', '127.0.0.1'],
                allowedOrigins: httpConfig.dnsRebindingProtection?.allowedOrigins || [
                    'http://localhost',
                    'http://127.0.0.1',
                ],
            },
        };
        this.logger = mcpConfig.logger;
        this.mcpServer = new VERSATILMCPServerV2(mcpConfig);
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // JSON body parser
        this.app.use(express.json());
        // CORS middleware
        if (this.config.cors.enabled) {
            this.app.use((req, res, next) => {
                const origin = req.headers.origin;
                const allowedOrigins = this.config.cors.origins;
                // Check if origin matches allowed patterns (supports wildcards)
                const isAllowed = allowedOrigins.some((pattern) => {
                    if (pattern.includes('*')) {
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                        return origin && regex.test(origin);
                    }
                    return origin === pattern;
                });
                if (isAllowed && origin) {
                    res.setHeader('Access-Control-Allow-Origin', origin);
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                }
                if (req.method === 'OPTIONS') {
                    res.sendStatus(204);
                }
                else {
                    next();
                }
            });
        }
        // Authentication middleware
        if (this.config.auth.enabled) {
            this.app.use((req, res, next) => {
                // Skip auth for health check
                if (req.path === '/health') {
                    return next();
                }
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    res.status(401).json({ error: 'Missing or invalid authorization header' });
                    return;
                }
                const token = authHeader.substring(7);
                if (token !== this.config.auth.bearerToken) {
                    res.status(403).json({ error: 'Invalid bearer token' });
                    return;
                }
                next();
            });
        }
        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info(`[MCP HTTP] ${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            next();
        });
    }
    /**
     * Setup Express routes
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'versatil-mcp-server',
                version: '1.0.0',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            });
        });
        // SSE endpoint - Establish server-sent events stream
        this.app.get('/sse', async (req, res) => {
            try {
                this.logger.info('[MCP HTTP] SSE connection requested');
                // Create SSE transport
                const transport = new SSEServerTransport('/messages', res, {
                    enableDnsRebindingProtection: this.config.dnsRebindingProtection.enabled,
                    allowedHosts: this.config.dnsRebindingProtection.allowedHosts,
                    allowedOrigins: this.config.dnsRebindingProtection.allowedOrigins,
                });
                // Store session
                const sessionId = transport.sessionId;
                this.activeSessions.set(sessionId, transport);
                this.logger.info(`[MCP HTTP] SSE session created: ${sessionId}`);
                // Connect MCP server to transport
                await this.mcpServer.connect(transport);
                // Handle connection close
                transport.onclose = () => {
                    this.logger.info(`[MCP HTTP] SSE session closed: ${sessionId}`);
                    this.activeSessions.delete(sessionId);
                };
                // Start SSE stream
                await transport.start();
            }
            catch (error) {
                this.logger.error('[MCP HTTP] SSE connection error:', error);
                res.status(500).json({
                    error: 'SSE connection failed',
                    message: error.message,
                });
            }
        });
        // Messages endpoint - Receive JSON-RPC messages from client
        this.app.post('/messages', async (req, res) => {
            try {
                const sessionId = req.query.sessionId;
                if (!sessionId) {
                    res.status(400).json({ error: 'Missing sessionId query parameter' });
                    return;
                }
                const transport = this.activeSessions.get(sessionId);
                if (!transport) {
                    res.status(404).json({ error: `Session not found: ${sessionId}` });
                    return;
                }
                // Handle incoming message
                await transport.handlePostMessage(req, res, req.body);
                this.logger.debug(`[MCP HTTP] Message handled for session: ${sessionId}`);
            }
            catch (error) {
                this.logger.error('[MCP HTTP] Message handling error:', error);
                res.status(500).json({
                    error: 'Message handling failed',
                    message: error.message,
                });
            }
        });
        // Server info endpoint
        this.app.get('/info', (req, res) => {
            res.json({
                name: 'VERSATIL SDLC Framework MCP Server',
                version: '1.0.0',
                transport: 'HTTP/SSE',
                endpoints: {
                    sse: '/sse',
                    messages: '/messages',
                    health: '/health',
                    info: '/info',
                },
                capabilities: [
                    'tools',
                    'resources',
                    'prompts',
                ],
                activeSessions: this.activeSessions.size,
                config: {
                    cors: this.config.cors.enabled ? 'enabled' : 'disabled',
                    auth: this.config.auth.enabled ? 'enabled' : 'disabled',
                    dnsProtection: this.config.dnsRebindingProtection.enabled ? 'enabled' : 'disabled',
                },
            });
        });
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Endpoint ${req.method} ${req.path} does not exist`,
                availableEndpoints: ['/health', '/sse', '/messages', '/info'],
            });
        });
        // Error handler
        this.app.use((err, req, res, next) => {
            this.logger.error('[MCP HTTP] Unhandled error:', err);
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
            });
        });
    }
    /**
     * Start the HTTP server
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.config.port, this.config.host, () => {
                    this.logger.info(`[MCP HTTP] VERSATIL MCP Server listening on http://${this.config.host}:${this.config.port}`);
                    this.logger.info(`[MCP HTTP] SSE endpoint: http://${this.config.host}:${this.config.port}/sse`);
                    this.logger.info(`[MCP HTTP] Health check: http://${this.config.host}:${this.config.port}/health`);
                    resolve();
                });
                this.server.on('error', (error) => {
                    this.logger.error('[MCP HTTP] Server error:', error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Stop the HTTP server
     */
    async stop() {
        // Close all active SSE sessions
        for (const [sessionId, transport] of this.activeSessions.entries()) {
            this.logger.info(`[MCP HTTP] Closing session: ${sessionId}`);
            await transport.close();
        }
        this.activeSessions.clear();
        // Close HTTP server
        if (this.server) {
            return new Promise((resolve, reject) => {
                this.server.close((error) => {
                    if (error) {
                        this.logger.error('[MCP HTTP] Error closing server:', error);
                        reject(error);
                    }
                    else {
                        this.logger.info('[MCP HTTP] Server stopped');
                        resolve();
                    }
                });
            });
        }
    }
    /**
     * Get server status
     */
    getStatus() {
        return {
            running: this.server !== null,
            port: this.config.port,
            host: this.config.host,
            activeSessions: this.activeSessions.size,
            uptime: process.uptime(),
        };
    }
}
/**
 * Create and start HTTP MCP server
 * Usage example in standalone mode
 */
export async function createHTTPServer(mcpConfig, httpConfig) {
    const server = new VERSATILMCPHTTPServer(mcpConfig, httpConfig);
    await server.start();
    return server;
}
//# sourceMappingURL=versatil-mcp-http-server.js.map