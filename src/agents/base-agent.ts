import { AgentResponse, AgentActivationContext, ValidationResults, Issue, Recommendation } from '../types';

export { AgentResponse, AgentActivationContext, ValidationResults, Issue, Recommendation };

export abstract class BaseAgent {
  abstract name: string;
  abstract id: string;
  abstract specialization: string;
  abstract systemPrompt: string;
  
  abstract activate(context: AgentActivationContext): Promise<AgentResponse>;
  
  protected async runStandardValidation(context: AgentActivationContext): Promise<ValidationResults> {
    return {
      score: 100,
      issues: [],
      warnings: [],
      recommendations: []
    };
  }
  
  protected async runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    return {};
  }
  
  protected generateStandardRecommendations(results: ValidationResults): Recommendation[] {
    return [];
  }
  
  protected calculateStandardPriority(results: ValidationResults): string {
    return 'medium';
  }

  async analyze(context: AgentActivationContext): Promise<AgentResponse> {
    return this.activate(context);
  }

  async runTests(context: AgentActivationContext): Promise<any> {
    return { success: true, message: 'Tests not implemented for this agent' };
  }

  async analyzeArchitecture(context: AgentActivationContext): Promise<any> {
    return { success: true, message: 'Architecture analysis not implemented for this agent' };
  }

  async manageDeployment(context: AgentActivationContext): Promise<any> {
    return { success: true, message: 'Deployment management not implemented for this agent' };
  }
}
