import { EnhancedOperaOrchestrator } from './enhanced-opera-orchestrator';

export interface OperaMCPConfig {
  name?: string;
  version?: string;
  port?: number;
}

export class OperaMCPServer {
  constructor(private opera: EnhancedOperaOrchestrator, private config?: OperaMCPConfig) {}
  
  async start(port?: number): Promise<void> {
    console.log(`Opera MCP server started on port ${port || 3000}`);
  }
  
  async stop(): Promise<void> {}
  async getMetrics(): Promise<any> { return {}; }
}

export function createOperaMCPServer(opera: EnhancedOperaOrchestrator, config?: OperaMCPConfig): OperaMCPServer {
  return new OperaMCPServer(opera, config);
}
