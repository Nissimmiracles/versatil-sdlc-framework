import { BaseAgent } from './base-agent.js';
export declare class AgentRegistry {
    private logger?;
    private agents;
    constructor(logger?: any, skipAutoRegister?: boolean);
    private registerAllAgents;
    getAgent(id: string): BaseAgent | undefined;
    getAllAgents(): BaseAgent[];
    listAgents(): BaseAgent[];
    registerAgent(agentOrId: BaseAgent | string, agent?: BaseAgent): void;
    getRegisteredAgents(): BaseAgent[];
    getAgentForFile(filePath: string): BaseAgent | null;
    private matchesPattern;
    getAgentsForFilePattern(pattern: string): BaseAgent[];
    getStatus(): any;
    isHealthy(): boolean;
    getAgentMetadata(id: string): any;
    getCollaborators(id: string): BaseAgent[];
    private getKeywordsForAgent;
    private getCollaboratorIds;
}
export declare const log: Console;
export declare const agentRegistry: AgentRegistry;
