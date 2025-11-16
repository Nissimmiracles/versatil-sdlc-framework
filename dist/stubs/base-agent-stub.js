export class BaseAgent {
    async runStandardValidation(_context) {
        return { score: 100, issues: [], warnings: [], recommendations: [] };
    }
    async runAgentSpecificValidation(_context) {
        return {};
    }
    generateStandardRecommendations(_results) {
        return [];
    }
    calculateStandardPriority(_results) {
        return 'medium';
    }
}
export const log = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug
};
//# sourceMappingURL=base-agent-stub.js.map