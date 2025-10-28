/**
 * Activation Validator
 *
 * Real-time validation of agent activation logic.
 * Provides utilities for testing triggers, patterns, and routing accuracy.
 *
 * @module activation-validator
 * @version 1.0.0
 */
import { SubAgentSelector } from './core/sub-agent-selector.js';
export class ActivationValidator {
    /**
     * Validate file pattern trigger
     */
    static validateFilePattern(agentId, filePath) {
        const patterns = this.FILE_PATTERN_TRIGGERS[agentId];
        if (!patterns) {
            return false;
        }
        return patterns.some(pattern => pattern.test(filePath));
    }
    /**
     * Validate code content trigger
     */
    static validateCodePattern(agentId, content) {
        const patterns = this.CODE_PATTERN_TRIGGERS[agentId];
        if (!patterns) {
            return false;
        }
        return patterns.some(pattern => content.includes(pattern));
    }
    /**
     * Validate agent activation
     */
    static async validateActivation(test) {
        const startTime = Date.now();
        const filePatternMatch = this.validateFilePattern(test.agentId, test.filePath);
        const codePatternMatch = this.validateCodePattern(test.agentId, test.content);
        const actualActivation = filePatternMatch || codePatternMatch;
        const passed = actualActivation === test.expectedActivation;
        const latency = Date.now() - startTime;
        let message = '';
        if (passed) {
            message = `✓ Correct ${actualActivation ? 'activation' : 'non-activation'}`;
        }
        else if (actualActivation && !test.expectedActivation) {
            message = `✗ False positive: Agent activated when it should not`;
        }
        else {
            message = `✗ False negative: Agent did not activate when it should`;
        }
        return {
            testId: test.testId,
            passed,
            actualActivation,
            expectedActivation: test.expectedActivation,
            latency,
            message
        };
    }
    /**
     * Validate sub-agent routing
     */
    static async validateSubAgentRouting(test, projectPath) {
        const startTime = Date.now();
        let actualSubAgent;
        try {
            if (test.agentId === 'marcus-backend') {
                const selection = await SubAgentSelector.selectBackendSubAgent(test.filePath, test.content, projectPath);
                actualSubAgent = selection.subAgentId;
            }
            else if (test.agentId === 'james-frontend') {
                const selection = await SubAgentSelector.selectFrontendSubAgent(test.filePath, test.content, projectPath);
                actualSubAgent = selection.subAgentId;
            }
        }
        catch (error) {
            return {
                testId: test.testId,
                passed: false,
                actualActivation: false,
                expectedActivation: test.expectedActivation,
                latency: Date.now() - startTime,
                message: `✗ Routing error: ${error.message}`
            };
        }
        const passed = actualSubAgent === test.expectedSubAgent;
        const latency = Date.now() - startTime;
        let message = '';
        if (passed) {
            message = `✓ Correct routing to ${actualSubAgent}`;
        }
        else {
            message = `✗ Incorrect routing: expected ${test.expectedSubAgent}, got ${actualSubAgent}`;
        }
        return {
            testId: test.testId,
            passed,
            actualActivation: !!actualSubAgent,
            expectedActivation: test.expectedActivation,
            actualSubAgent,
            expectedSubAgent: test.expectedSubAgent,
            latency,
            message
        };
    }
    /**
     * Run batch validation tests
     */
    static async runBatchTests(tests, projectPath) {
        const results = [];
        for (const test of tests) {
            const result = projectPath && test.expectedSubAgent
                ? await this.validateSubAgentRouting(test, projectPath)
                : await this.validateActivation(test);
            results.push(result);
        }
        const passedTests = results.filter(r => r.passed).length;
        const failedTests = results.filter(r => !r.passed).length;
        const accuracy = (passedTests / tests.length) * 100;
        const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
        return {
            totalTests: tests.length,
            passedTests,
            failedTests,
            accuracy,
            averageLatency,
            results
        };
    }
    /**
     * Generate comprehensive validation report
     */
    static generateValidationReport(batchResult) {
        const lines = [];
        lines.push('# Agent Activation Validation Report\n');
        lines.push(`**Generated**: ${new Date().toISOString()}\n`);
        lines.push('## Summary\n');
        lines.push(`- Total Tests: ${batchResult.totalTests}`);
        lines.push(`- Passed: ${batchResult.passedTests}`);
        lines.push(`- Failed: ${batchResult.failedTests}`);
        lines.push(`- Accuracy: ${batchResult.accuracy.toFixed(2)}%`);
        lines.push(`- Average Latency: ${batchResult.averageLatency.toFixed(0)}ms\n`);
        const status = batchResult.accuracy >= 90 ? '✅ PASS' : '❌ FAIL';
        lines.push(`**Status**: ${status}\n`);
        lines.push('## Detailed Results\n');
        const failedResults = batchResult.results.filter(r => !r.passed);
        if (failedResults.length > 0) {
            lines.push('### Failed Tests\n');
            failedResults.forEach((result, index) => {
                lines.push(`${index + 1}. Test ID: ${result.testId}`);
                lines.push(`   ${result.message}`);
                lines.push(`   Expected activation: ${result.expectedActivation}`);
                lines.push(`   Actual activation: ${result.actualActivation}`);
                if (result.expectedSubAgent) {
                    lines.push(`   Expected sub-agent: ${result.expectedSubAgent}`);
                    lines.push(`   Actual sub-agent: ${result.actualSubAgent || 'none'}`);
                }
                lines.push('');
            });
        }
        lines.push('## Recommendations\n');
        if (batchResult.accuracy < 90) {
            lines.push('- Review and update trigger patterns in agent-definitions.ts');
            lines.push('- Add more specific file/code patterns for failed tests');
            lines.push('- Check for conflicting patterns between agents');
        }
        if (batchResult.averageLatency > 1000) {
            lines.push('- Optimize trigger pattern matching (use compiled regexes)');
            lines.push('- Consider caching pattern results');
            lines.push('- Review sub-agent selector performance');
        }
        if (batchResult.accuracy >= 90 && batchResult.averageLatency <= 1000) {
            lines.push('✅ All validation requirements met!');
        }
        return lines.join('\n');
    }
    /**
     * Get all available agents
     */
    static getAllAgentIds() {
        return [
            ...Object.keys(this.FILE_PATTERN_TRIGGERS),
            'marcus-node',
            'marcus-python',
            'marcus-rails',
            'marcus-go',
            'marcus-java',
            'james-react',
            'james-vue',
            'james-nextjs',
            'james-angular',
            'james-svelte'
        ];
    }
    /**
     * Get trigger patterns for agent
     */
    static getAgentTriggers(agentId) {
        return {
            filePatterns: this.FILE_PATTERN_TRIGGERS[agentId] || [],
            codePatterns: this.CODE_PATTERN_TRIGGERS[agentId] || []
        };
    }
}
ActivationValidator.FILE_PATTERN_TRIGGERS = {
    'maria-qa': [/\.test\.(ts|tsx|js|jsx)$/, /__tests__\//, /\.spec\.(ts|tsx|js|jsx)$/],
    'dana-database': [/\.sql$/, /\/migrations\//, /\/supabase\//, /\/prisma\//],
    'marcus-backend': [/\.api\.(ts|js)$/, /\/routes\//, /\/controllers\//, /\/server\//],
    'james-frontend': [/\.(tsx|jsx|vue|svelte|css|scss)$/],
    'alex-ba': [/\/requirements\//, /\.feature$/, /\/specs\//],
    'sarah-pm': [/\.md$/, /\/docs\//],
    'dr-ai-ml': [/\.py$/, /\.ipynb$/, /\/models\//, /\/notebooks\//],
    'oliver-mcp': [/\/mcp\//, /\.mcp\./]
};
ActivationValidator.CODE_PATTERN_TRIGGERS = {
    'maria-qa': ['describe(', 'it(', 'test(', 'expect(', 'jest.', 'vitest.'],
    'dana-database': ['CREATE TABLE', 'ALTER TABLE', 'CREATE POLICY', 'ENABLE ROW LEVEL SECURITY'],
    'marcus-backend': ['router.', 'app.', 'express.', 'fastify.', '@app.', '@router.'],
    'james-frontend': ['useState', 'useEffect', 'component', 'props', 'className', '<template>'],
    'alex-ba': ['As a', 'I want', 'Feature:', 'Scenario:', 'Given', 'When', 'Then'],
    'sarah-pm': ['# ', '## ', '### ', '- [ ]', '- [x]'],
    'dr-ai-ml': ['import tensorflow', 'import torch', 'import sklearn', 'model.fit', 'model.predict'],
    'oliver-mcp': ['MCPClient', 'MCPServer', 'mcpConfig', 'GitMCP', 'ExaMCP']
};
// Export sample tests for each agent
export const SAMPLE_VALIDATION_TESTS = {
    'maria-qa': [
        {
            testId: 'maria-test-1',
            agentId: 'maria-qa',
            filePath: 'src/LoginForm.test.tsx',
            content: 'describe("LoginForm", () => { it("renders", () => {}) });',
            expectedActivation: true
        },
        {
            testId: 'maria-false-positive-1',
            agentId: 'maria-qa',
            filePath: 'src/component.tsx',
            content: 'export function Component() {}',
            expectedActivation: false
        }
    ],
    'marcus-node': [
        {
            testId: 'marcus-node-1',
            agentId: 'marcus-backend',
            filePath: 'src/api/users.ts',
            content: 'import express from "express"; const router = express.Router();',
            expectedActivation: true,
            expectedSubAgent: 'marcus-node'
        }
    ],
    'james-react': [
        {
            testId: 'james-react-1',
            agentId: 'james-frontend',
            filePath: 'src/Button.tsx',
            content: 'import React from "react"; export function Button() { const [count, setCount] = React.useState(0); }',
            expectedActivation: true,
            expectedSubAgent: 'james-react'
        }
    ]
};
//# sourceMappingURL=activation-validator.js.map