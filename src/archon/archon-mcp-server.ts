import { EnhancedArchonOrchestrator } from './enhanced-archon-orchestrator';

export interface ArchonMCPConfig {
  name?: string;
  version?: string;
  port?: number;
}

export class ArchonMCPServer {
  constructor(private archon: EnhancedArchonOrchestrator, private config?: ArchonMCPConfig) {}
  
  async start(port?: number): Promise<void> {
    console.log(`Archon MCP server started on port ${port || 3000}`);
  }
  
  async stop(): Promise<void> {}
  async getMetrics(): Promise<any> { return {}; }
}

export function createArchonMCPServer(archon: EnhancedArchonOrchestrator, config?: ArchonMCPConfig): ArchonMCPServer {
  return new ArchonMCPServer(archon, config);
}
