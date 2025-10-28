import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent.js';
export declare class SecuritySam extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    activate(context: AgentActivationContext): Promise<AgentResponse>;
}
