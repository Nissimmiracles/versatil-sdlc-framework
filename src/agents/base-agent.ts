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
}
