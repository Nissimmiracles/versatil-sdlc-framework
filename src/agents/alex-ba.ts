import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent.js';

export class AlexBa extends BaseAgent {
  name = 'AlexBa';
  id = 'alex-ba';
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
