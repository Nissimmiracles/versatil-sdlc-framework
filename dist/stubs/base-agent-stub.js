export class BaseAgent {
    async runStandardValidation(context) {
        return { score: 100, issues: [], warnings: [], recommendations: [] };
    }
    async runAgentSpecificValidation(context) {
        return {};
    }
    generateStandardRecommendations(results) {
        return [];
    }
    calculateStandardPriority(results) {
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