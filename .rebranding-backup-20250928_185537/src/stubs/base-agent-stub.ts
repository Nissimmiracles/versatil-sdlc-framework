
export interface AgentResponse {
  agentId: string;
  message: string;
  suggestions: any[];
  priority: string;
  handoffTo: string[];
  context?: any;
}

export interface AgentActivationContext {
  trigger?: any;
  filePath?: string;
  content?: string;
  [key: string]: any;
}

export abstract class BaseAgent {
  abstract name: string;
  abstract id: string;
  abstract specialization: string;
  
  abstract activate(context: AgentActivationContext): Promise<AgentResponse>;
  
  protected async runStandardValidation(context: any): Promise<any> {
    return { score: 100, issues: [], warnings: [], recommendations: [] };
  }
  
  protected async runAgentSpecificValidation(context: any): Promise<any> {
    return {};
  }
  
  protected generateStandardRecommendations(results: any): any[] {
    return [];
  }
  
  protected calculateStandardPriority(results: any): string {
    return 'medium';
  }
}

export const log = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug
};
