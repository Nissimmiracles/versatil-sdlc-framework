import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent';

export class SarahPm extends BaseAgent {
  name = 'SarahPm';
  id = 'sarah-pm';
  specialization = 'Specialized Agent';
  systemPrompt = '';
  
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    return {
      agentId: this.id,
      message: `${this.name} activated`,
      suggestions: [],
      priority: 'medium',
      handoffTo: [],
      context: {}
    };
  }
}
