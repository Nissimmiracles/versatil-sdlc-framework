import { BaseAgent, AgentResponse, AgentActivationContext } from './core/base-agent.js';
export declare class DeploymentOrchestrator extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    activate(context: AgentActivationContext): Promise<AgentResponse>;
}
