import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent';

export class SecuritySam extends BaseAgent {
  name = 'SecuritySam';
  id = 'security-sam';
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
