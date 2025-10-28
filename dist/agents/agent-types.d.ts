/**
 * VERSATIL SDLC Framework - Agent Type Definitions
 */
export interface AgentContext {
    projectPath: string;
    currentPhase: string;
    activeAgents: string[];
    metrics: Record<string, any>;
}
export interface AgentMessage {
    from: string;
    to: string;
    type: 'request' | 'response' | 'notification';
    content: any;
    timestamp: number;
}
export interface AgentCapability {
    name: string;
    description: string;
    enabled: boolean;
}
export { AgentResponse, AgentActivationContext, Issue, Recommendation } from './base-agent.js';
