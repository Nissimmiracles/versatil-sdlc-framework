/**
 * Mock MCP SDK for VERSATIL
 * This provides the basic types and classes needed by the framework
 */
export interface MCPServer {
    setRequestHandler(event: string, handler: Function): void;
    handleRequest(method: string, params: any): Promise<any>;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}
export interface MCPResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}
export declare class MCPServer {
    private handlers;
    private config;
    constructor(config: any);
}
export declare function createMCPServer(config: any): MCPServer;
