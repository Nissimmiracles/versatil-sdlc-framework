import { EnhancedMaria } from './enhanced-maria.js';
import { EnhancedJames } from './enhanced-james.js';
import { EnhancedMarcus } from './enhanced-marcus.js';
import { SarahPm } from './sarah-pm.js';
import { AlexBa } from './alex-ba.js';
import { DrAiMl } from './dr-ai-ml.js';
import { DevopsDan } from './devops-dan.js';
import { SecuritySam } from './security-sam.js';
import { ArchitectureDan } from './architecture-dan.js';
import { DeploymentOrchestrator } from './deployment-orchestrator.js';
import { IntrospectiveAgent } from './introspective-agent.js';
import { SimulationQa } from './simulation-qa.js';
export class AgentRegistry {
    constructor(logger, skipAutoRegister = false) {
        this.logger = logger;
        this.agents = new Map();
        if (!skipAutoRegister) {
            this.registerAllAgents();
        }
    }
    registerAllAgents() {
        this.agents.set('enhanced-maria', new EnhancedMaria());
        this.agents.set('enhanced-james', new EnhancedJames());
        this.agents.set('enhanced-marcus', new EnhancedMarcus());
        this.agents.set('sarah-pm', new SarahPm());
        this.agents.set('alex-ba', new AlexBa());
        this.agents.set('dr-ai-ml', new DrAiMl());
        this.agents.set('devops-dan', new DevopsDan());
        this.agents.set('security-sam', new SecuritySam());
        this.agents.set('architecture-dan', new ArchitectureDan());
        this.agents.set('deployment-orchestrator', new DeploymentOrchestrator());
        this.agents.set('introspective-agent', new IntrospectiveAgent());
        this.agents.set('simulation-qa', new SimulationQa());
    }
    getAgent(id) {
        return this.agents.get(id);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    listAgents() {
        return this.getAllAgents();
    }
    registerAgent(agentOrId, agent) {
        let id;
        let agentToRegister;
        if (typeof agentOrId === 'string') {
            // Old signature: registerAgent(id, agent)
            id = agentOrId;
            agentToRegister = agent;
        }
        else {
            // New signature: registerAgent(agent)
            agentToRegister = agentOrId;
            id = agentToRegister.id;
        }
        if (this.agents.has(id)) {
            throw new Error(`Agent with ID ${id} is already registered`);
        }
        this.agents.set(id, agentToRegister);
    }
    getRegisteredAgents() {
        return this.getAllAgents();
    }
    getAgentForFile(filePath) {
        // Check each registered agent's activation patterns
        for (const agent of this.agents.values()) {
            const patterns = agent.activationPatterns;
            if (!patterns || !Array.isArray(patterns)) {
                continue;
            }
            for (const pattern of patterns) {
                if (this.matchesPattern(filePath, pattern)) {
                    return agent;
                }
            }
        }
        return null;
    }
    matchesPattern(filePath, pattern) {
        const regexPattern = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\./g, '\\.');
        return new RegExp(regexPattern).test(filePath);
    }
    getAgentsForFilePattern(pattern) {
        return this.getAllAgents();
    }
    getStatus() {
        return {
            totalAgents: this.agents.size,
            agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
                id,
                name: agent.name,
                specialization: agent.specialization
            }))
        };
    }
    isHealthy() {
        return this.agents.size > 0;
    }
    getAgentMetadata(id) {
        const agent = this.agents.get(id);
        if (!agent)
            return undefined;
        const metadata = {
            name: agent.name,
            specialization: agent.specialization,
            autoActivate: false,
            priority: id === 'introspective-agent' ? 4 : 3,
            triggers: {
                keywords: this.getKeywordsForAgent(id),
                patterns: [],
                fileTypes: []
            },
            collaborators: this.getCollaboratorIds(id)
        };
        // Add MCP tools for introspective agent
        if (id === 'introspective-agent') {
            metadata.mcpTools = ['Read MCP', 'Bash MCP', 'WebFetch MCP'];
        }
        return metadata;
    }
    getCollaborators(id) {
        const collaboratorIds = this.getCollaboratorIds(id);
        return collaboratorIds
            .map(collabId => this.agents.get(collabId))
            .filter((agent) => agent !== undefined);
    }
    getKeywordsForAgent(id) {
        const keywordMap = {
            'introspective-agent': ['introspection', 'optimization', 'performance', 'learning'],
            'enhanced-maria': ['test', 'quality', 'coverage', 'validation'],
            'enhanced-james': ['ui', 'frontend', 'component', 'accessibility'],
            'enhanced-marcus': ['api', 'backend', 'security', 'database'],
            'sarah-pm': ['project', 'sprint', 'milestone', 'timeline'],
            'alex-ba': ['requirements', 'business', 'analysis', 'stakeholder'],
            'dr-ai-ml': ['machine learning', 'model', 'training', 'prediction']
        };
        return keywordMap[id] || [];
    }
    getCollaboratorIds(id) {
        const collabMap = {
            'introspective-agent': ['enhanced-maria', 'enhanced-james', 'enhanced-marcus'],
            'enhanced-maria': ['enhanced-james', 'enhanced-marcus'],
            'enhanced-james': ['enhanced-maria', 'enhanced-marcus'],
            'enhanced-marcus': ['enhanced-maria', 'enhanced-james'],
            'sarah-pm': ['enhanced-maria', 'enhanced-james', 'enhanced-marcus', 'alex-ba'],
            'alex-ba': ['sarah-pm', 'enhanced-maria'],
            'dr-ai-ml': ['enhanced-marcus', 'enhanced-maria']
        };
        return collabMap[id] || [];
    }
}
export const log = console;
// Export singleton instance for easy import
export const agentRegistry = new AgentRegistry();
//# sourceMappingURL=agent-registry.js.map