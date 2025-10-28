import { BaseAgent } from './base-agent.js';
export class SecuritySam extends BaseAgent {
    constructor() {
        super(...arguments);
        this.name = 'SecuritySam';
        this.id = 'security-sam';
        this.specialization = 'Specialized Agent';
        this.systemPrompt = '';
    }
    async activate(context) {
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
//# sourceMappingURL=security-sam.js.map