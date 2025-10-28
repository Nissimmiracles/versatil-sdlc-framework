import { EnhancedMaria } from '../opera/maria-qa/enhanced-maria.js';
import { EnhancedJames } from '../opera/james-frontend/enhanced-james.js';
import { EnhancedMarcus } from '../opera/marcus-backend/enhanced-marcus.js';
import { SarahPm } from '../opera/sarah-pm/sarah-pm.js';
import { AlexBa } from '../opera/alex-ba/alex-ba.js';
import { DrAiMl } from '../opera/dr-ai-ml/dr-ai-ml.js';
import { IntrospectiveAgent } from '../meta/introspective/introspective-agent.js';
export class AgentRegistry {
    constructor(logger, skipAutoRegister = false) {
        this.logger = logger;
        this.agents = new Map();
        if (!skipAutoRegister) {
            this.registerAllAgents();
        }
    }
    registerAllAgents() {
        // OPERA Agents (6 primary agents)
        const maria = new EnhancedMaria();
        const james = new EnhancedJames();
        const marcus = new EnhancedMarcus();
        const sarah = new SarahPm();
        const alex = new AlexBa();
        const drAi = new DrAiMl();
        // Register with legacy IDs
        this.agents.set('enhanced-maria', maria);
        this.agents.set('enhanced-james', james);
        this.agents.set('enhanced-marcus', marcus);
        this.agents.set('sarah-pm', sarah);
        this.agents.set('alex-ba', alex);
        this.agents.set('dr-ai-ml', drAi);
        // Register with modern IDs (aliases to same instances)
        this.agents.set('maria-qa', maria);
        this.agents.set('james-frontend', james);
        this.agents.set('marcus-backend', marcus);
        // Sub-agents are lightweight wrappers - TODO: implement actual sub-agent classes
        // For now, they delegate to parent agents with specialized context
        this.agents.set('james-react', james);
        this.agents.set('james-vue', james);
        this.agents.set('james-nextjs', james);
        this.agents.set('james-angular', james);
        this.agents.set('james-svelte', james);
        this.agents.set('marcus-node', marcus);
        this.agents.set('marcus-python', marcus);
        this.agents.set('marcus-rails', marcus);
        this.agents.set('marcus-go', marcus);
        this.agents.set('marcus-java', marcus);
        // Meta-Agent (Introspective)
        this.agents.set('introspective-agent', new IntrospectiveAgent());
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