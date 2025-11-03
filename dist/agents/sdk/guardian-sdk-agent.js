/**
 * Guardian SDK Agent
 * SDK-native version of Guardian that validates agent outputs for hallucinations
 * Uses existing OutputValidator utility for validation logic
 */
import { SDKAgentAdapter } from './sdk-agent-adapter.js';
import { getOutputValidator } from '../guardian/output-validator.js';
export class GuardianSDKAgent extends SDKAgentAdapter {
    constructor(config) {
        super({
            agentId: 'guardian-validator',
            vectorStore: config?.vectorStore,
            model: 'sonnet'
        });
        this.validator = getOutputValidator();
        // Set default config
        this.config = {
            vectorStore: config?.vectorStore,
            blockOnInaccuracy: config?.blockOnInaccuracy ?? true,
            autoCorrect: config?.autoCorrect ?? false,
            maxRegenerationAttempts: config?.maxRegenerationAttempts ?? 3
        };
    }
    /**
     * Validate agent output for hallucinations
     * This is the PRIMARY use case - called by other agents post-generation
     */
    async validateAgentOutput(output, sourceAgent, context) {
        // Use existing OutputValidator utility (same as pre-commit hook)
        const report = await this.validator.validateOutput(output, {
            commitMessage: false
        });
        // Store validation in RAG for learning (if enabled)
        if (this.vectorStore && report.totalClaims > 0) {
            await this.storeValidationForLearning(output, report, sourceAgent, context);
        }
        return report;
    }
    /**
     * Override activate to add Guardian-specific validation workflow
     * Note: Guardian typically isn't activated via SDK directly,
     * but this allows Guardian to validate its OWN responses
     */
    async activate(context) {
        // 1. Run SDK activation (core validation)
        const response = await super.activate(context);
        // 2. Validate Guardian's own response for meta-validation
        if (context.content) {
            const selfValidation = await this.validator.validateOutput(response.message, {
                commitMessage: false
            });
            // Add self-validation metadata
            if (response.context) {
                response.context = {
                    ...response.context,
                    selfValidation: {
                        totalClaims: selfValidation.totalClaims,
                        accuracy: selfValidation.overallAccuracy,
                        blocked: selfValidation.blocked
                    }
                };
            }
            // If Guardian's own response has hallucinations, warn
            if (selfValidation.invalidClaims > 0) {
                response.suggestions = response.suggestions || [];
                response.suggestions.push({
                    type: 'meta-validation-warning',
                    message: `Guardian's response contains ${selfValidation.invalidClaims} unverified claims`,
                    priority: 'medium',
                    file: context.filePath || 'unknown'
                });
            }
        }
        return response;
    }
    /**
     * Store validation results in RAG for learning
     * Pattern: Similar to how agents learn from interactions
     */
    async storeValidationForLearning(output, report, sourceAgent, context) {
        if (!this.vectorStore)
            return;
        try {
            const memoryContent = {
                sourceAgent,
                output: output.substring(0, 500), // Store first 500 chars
                validation: {
                    totalClaims: report.totalClaims,
                    validClaims: report.validClaims,
                    invalidClaims: report.invalidClaims,
                    accuracy: report.overallAccuracy,
                    blocked: report.blocked
                },
                corrections: report.corrections,
                timestamp: Date.now()
            };
            await this.vectorStore.storeMemory({
                content: JSON.stringify(memoryContent),
                contentType: 'text', // Use 'text' content type (validation is text-based analysis)
                metadata: {
                    agentId: 'guardian-validator',
                    sourceAgent,
                    filePath: context?.filePath,
                    tags: ['validation', 'guardian', 'learning', report.blocked ? 'blocked' : 'passed'],
                    timestamp: Date.now()
                }
            });
        }
        catch (error) {
            console.warn(`Failed to store validation for learning: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if output should be validated based on context
     * Pattern: Similar to Maria's hasConfigurationInconsistencies check
     */
    shouldValidateOutput(context) {
        // Always validate if explicitly requested
        if (context.trigger?.type === 'validation-request') {
            return true;
        }
        // Validate commit messages
        if (context.trigger?.type === 'commit-message') {
            return true;
        }
        // Validate documentation and reports (high risk for metrics/numbers)
        if (context.filePath) {
            const highRiskFiles = ['.md', 'README', 'CHANGELOG', '.txt', 'report'];
            if (highRiskFiles.some(pattern => context.filePath.includes(pattern))) {
                return true;
            }
        }
        // Validate responses from metrics-heavy agents
        const metricsHeavyAgents = ['sarah-pm', 'maria-qa', 'introspective-meta'];
        if (context.trigger?.source && metricsHeavyAgents.includes(context.trigger.source)) {
            return true;
        }
        // Default: no validation needed
        return false;
    }
    /**
     * Generate correction prompt for flywheel regeneration
     * Pattern: Similar to how agents handle handoffs with context
     */
    generateCorrectionPrompt(originalOutput, validation, originalContext) {
        let prompt = `# Validation Failed - Corrections Required\n\n`;
        prompt += `## Original Output (REJECTED)\n\`\`\`\n${originalOutput.substring(0, 500)}...\n\`\`\`\n\n`;
        prompt += `## Validation Report\n`;
        prompt += `- **Total Claims**: ${validation.totalClaims}\n`;
        prompt += `- **Valid**: ${validation.validClaims}\n`;
        prompt += `- **Invalid**: ${validation.invalidClaims}\n`;
        prompt += `- **Accuracy**: ${Math.round(validation.overallAccuracy * 100)}%\n\n`;
        if (validation.corrections.length > 0) {
            prompt += `## Required Corrections\n`;
            validation.corrections.forEach((correction, idx) => {
                prompt += `${idx + 1}. ${correction}\n`;
            });
            prompt += `\n`;
        }
        prompt += `## Your Task\n`;
        prompt += `Regenerate the output with ACCURATE claims. For each claim:\n`;
        prompt += `1. Use Read tool to verify file contents\n`;
        prompt += `2. Use Bash tool to run \`wc -l\`, \`grep -c\`, etc.\n`;
        prompt += `3. Report EXACT numbers from filesystem\n`;
        prompt += `4. Do NOT estimate or guess\n\n`;
        prompt += `⚠️ **Critical**: Guardian will re-validate. If accuracy < 90%, this will be rejected again.\n`;
        return prompt;
    }
    /**
     * Extract agent name (utility method)
     */
    extractAgentName(text) {
        return text.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
}
//# sourceMappingURL=guardian-sdk-agent.js.map