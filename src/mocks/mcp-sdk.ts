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

export class MCPServer {
  private handlers: Map<string, Function> = new Map();
  private config: any;
  
  constructor(config: any) {
    this.config = config;
  }
  
  setRequestHandler(event: string, handler: Function): void {
    this.handlers.set(event, handler);
  }
  
  async handleRequest(method: string, params: any): Promise<any> {
    const handler = this.handlers.get(method);
    if (handler) {
      return await handler(params);
    }
    throw new Error(`No handler for ${method}`);
  }
}

export function createMCPServer(config: any): MCPServer {
  return new MCPServer(config);
}
