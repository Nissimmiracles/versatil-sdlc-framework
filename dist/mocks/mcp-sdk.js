/**
 * Mock MCP SDK for VERSATIL
 * This provides the basic types and classes needed by the framework
 */
export class MCPServer {
    constructor(config) {
        this.handlers = new Map();
        this.config = config;
    }
    setRequestHandler(event, handler) {
        this.handlers.set(event, handler);
    }
    async handleRequest(method, params) {
        const handler = this.handlers.get(method);
        if (handler) {
            return await handler(params);
        }
        throw new Error(`No handler for ${method}`);
    }
}
export function createMCPServer(config) {
    return new MCPServer(config);
}
//# sourceMappingURL=mcp-sdk.js.map