import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent.js';

export class IntrospectiveAgent extends BaseAgent {
  name = 'IntrospectiveAgent';
  id = 'introspective-agent';
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
