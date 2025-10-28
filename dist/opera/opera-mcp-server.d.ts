/**
 * VERSATIL Opera MCP Server - SDK v1.18.2 Compatible
 * Provides autonomous development goal management through MCP
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EnhancedOperaOrchestrator } from './enhanced-opera-orchestrator.js';
export interface OperaMCPConfig {
    name?: string;
    version?: string;
    autoUpdate?: boolean;
    updateChannel?: string;
}
export declare class OperaMCPServer {
    private server;
    private opera;
    private config;
    private logger;
    constructor(opera: EnhancedOperaOrchestrator, config?: OperaMCPConfig);
    private registerTools;
    start(): Promise<void>;
    stop(): Promise<void>;
    getMetrics(): Promise<any>;
    getServer(): McpServer;
}
export declare function createOperaMCPServer(opera: EnhancedOperaOrchestrator, config?: OperaMCPConfig): OperaMCPServer;
