export { SimulationQa as SimulationQA };
import { BaseAgent } from './base-agent.js';
export class SimulationQa extends BaseAgent {
    constructor() {
        super(...arguments);
        this.name = 'SimulationQa';
        this.id = 'simulation-qa';
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
    async getCapabilityMatrix() {
        return null;
    }
}
//# sourceMappingURL=simulation-qa.js.map