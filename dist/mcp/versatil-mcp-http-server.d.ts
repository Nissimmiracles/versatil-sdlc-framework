/**
 * VERSATIL SDLC Framework - HTTP MCP Server
 * Provides HTTP/SSE transport for remote MCP server access
 */
import { VERSATILMCPConfig } from './versatil-mcp-server-v2.js';
export interface HTTPServerConfig {
    port: number;
    host: string;
    cors: {
        enabled: boolean;
        origins: string[];
    };
    auth: {
        enabled: boolean;
        bearerToken?: string;
    };
    dnsRebindingProtection: {
        enabled: boolean;
        allowedHosts?: string[];
        allowedOrigins?: string[];
    };
}
export declare class VERSATILMCPHTTPServer {
    private app;
    private server;
    private mcpServer;
    private config;
    private logger;
    private activeSessions;
    constructor(mcpConfig: VERSATILMCPConfig, httpConfig?: Partial<HTTPServerConfig>);
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Setup Express routes
     */
    private setupRoutes;
    /**
     * Start the HTTP server
     */
    start(): Promise<void>;
    /**
     * Stop the HTTP server
     */
    stop(): Promise<void>;
    /**
     * Get server status
     */
    getStatus(): {
        running: boolean;
        port: number;
        host: string;
        activeSessions: number;
        uptime: number;
    };
}
/**
 * Create and start HTTP MCP server
 * Usage example in standalone mode
 */
export declare function createHTTPServer(mcpConfig: VERSATILMCPConfig, httpConfig?: Partial<HTTPServerConfig>): Promise<VERSATILMCPHTTPServer>;
