/**
 * Feature Mapping Engine - Promise to Reality Converter
 *
 * Parses CLAUDE.md and documentation to extract all framework promises,
 * then maps them to specific testable scenarios that can expose vapor-ware.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { VERSATILLogger } from '../utils/logger.js';
export class FeatureMapper {
    constructor(projectRoot = process.cwd()) {
        this.promises = [];
        this.logger = VERSATILLogger.getInstance();
        this.projectRoot = projectRoot;
    }
    /**
     * Map all framework promises to testable scenarios
     */
    async mapFrameworkPromises() {
        this.logger.info('🗺️  Starting framework promise mapping', {
            projectRoot: this.projectRoot,
            mode: 'brutal honesty extraction'
        }, 'FeatureMapper');
        try {
            // Parse CLAUDE.md for agent promises
            const claudePromises = await this.parseClaudeConfiguration();
            // Parse package.json for capability claims
            const packagePromises = await this.parsePackageCapabilities();
            // Parse README and documentation for feature claims
            const docPromises = await this.parseDocumentationClaims();
            // Parse MCP server for tool integration claims
            const mcpPromises = await this.parseMCPIntegrationClaims();
            this.promises = [...claudePromises, ...packagePromises, ...docPromises, ...mcpPromises];
            this.logger.info('📋 Promise mapping complete', {
                totalPromises: this.promises.length,
                categories: this.categorizePromises(),
                highConfidence: this.promises.filter(p => p.confidence === 'high').length
            }, 'FeatureMapper');
            return this.promises;
        }
        catch (error) {
            this.logger.error('Promise mapping failed', {
                error: error instanceof Error ? error.message : String(error)
            }, 'FeatureMapper');
            return [];
        }
    }
    /**
     * Parse CLAUDE.md for agent activation and OPERA methodology promises
     */
    async parseClaudeConfiguration() {
        const promises = [];
        const claudePath = path.join(this.projectRoot, 'CLAUDE.md');
        try {
            const content = await fs.readFile(claudePath, 'utf-8');
            // Extract agent activation triggers
            const agentPromises = this.extractAgentActivationPromises(content);
            promises.push(...agentPromises);
            // Extract OPERA methodology claims
            const operaPromises = this.extractOPERAPromises(content);
            promises.push(...operaPromises);
            // Extract context preservation claims
            const contextPromises = this.extractContextPreservationPromises(content);
            promises.push(...contextPromises);
        }
        catch (error) {
            this.logger.warning('Could not parse CLAUDE.md', {
                error: error instanceof Error ? error.message : String(error)
            }, 'FeatureMapper');
        }
        return promises;
    }
    /**
     * Extract agent activation promises from CLAUDE.md
     */
    extractAgentActivationPromises(content) {
        const promises = [];
        // Extract James-Frontend activation triggers
        const jamesMatch = content.match(/Agent: James-Frontend[\s\S]*?Activation_Triggers:([\s\S]*?)Responsibilities:/);
        if (jamesMatch) {
            promises.push({
                id: 'james-frontend-activation',
                category: 'agent-activation',
                featureName: 'James-Frontend Auto-Activation',
                description: 'James-Frontend agent should automatically activate when .tsx/.jsx files are edited',
                source: 'CLAUDE.md - James-Frontend section',
                claims: [
                    'Activates on "*.jsx|tsx|vue|svelte" files',
                    'Triggers on "components/**", "ui/**", "pages/**" paths',
                    'Responds to keywords: "component", "react", "vue", "useState", "css", "responsive"'
                ],
                testableScenarios: [{
                        id: 'james-tsx-activation',
                        name: 'React Component Edit Triggers James',
                        description: 'Editing a .tsx file should activate James-Frontend agent with contextual suggestions',
                        userAction: 'Edit a .tsx file in the project',
                        expectedBehavior: 'James-Frontend agent activates and provides React/TypeScript suggestions',
                        measurableCriteria: [
                            'Agent activation message appears',
                            'Suggestions contain React optimization advice',
                            'Response time under 5 seconds',
                            'Context includes file path and content analysis'
                        ],
                        category: 'agent-activation'
                    }],
                confidence: 'high'
            });
        }
        // Extract Maria-QA activation triggers
        const mariaMatch = content.match(/Agent: Maria-QA[\s\S]*?Activation_Triggers:([\s\S]*?)Responsibilities:/);
        if (mariaMatch) {
            promises.push({
                id: 'maria-qa-activation',
                category: 'agent-activation',
                featureName: 'Maria-QA Auto-Activation',
                description: 'Maria-QA agent should automatically activate when test files are edited',
                source: 'CLAUDE.md - Maria-QA section',
                claims: [
                    'Activates on "*.test.js|ts|jsx|tsx" files',
                    'Triggers on "__tests__/**" paths',
                    'Responds to keywords: "test", "spec", "describe", "it(", "expect", "coverage"'
                ],
                testableScenarios: [{
                        id: 'maria-test-activation',
                        name: 'Test File Edit Triggers Maria',
                        description: 'Editing a test file should activate Maria-QA with quality suggestions',
                        userAction: 'Edit a .test.ts file in the project',
                        expectedBehavior: 'Maria-QA agent activates and provides testing recommendations',
                        measurableCriteria: [
                            'Agent activation message appears',
                            'Suggestions contain testing improvements',
                            'Quality gates analysis provided',
                            'Coverage requirements mentioned'
                        ],
                        category: 'agent-activation'
                    }],
                confidence: 'high'
            });
        }
        return promises;
    }
    /**
     * Extract OPERA methodology promises
     */
    extractOPERAPromises(content) {
        const promises = [];
        // Context Preservation Promise
        if (content.includes('Zero information loss during agent switches')) {
            promises.push({
                id: 'zero-context-loss',
                category: 'context-preservation',
                featureName: 'Zero Context Loss',
                description: 'Framework should maintain perfect context when switching between agents',
                source: 'CLAUDE.md - Core Principles',
                claims: [
                    'Zero information loss during agent switches',
                    'Context preservation between agent handoffs',
                    'Seamless collaboration through intelligent handoffs'
                ],
                testableScenarios: [{
                        id: 'context-handoff-test',
                        name: 'Agent Handoff Preserves Context',
                        description: 'When one agent hands off to another, all context should be preserved',
                        userAction: 'Trigger agent handoff (e.g., James to Marcus for API integration)',
                        expectedBehavior: 'Second agent has complete access to first agent\'s context and decisions',
                        measurableCriteria: [
                            'Second agent references first agent\'s analysis',
                            'No information is lost or repeated',
                            'Decisions are built upon previous context',
                            'Handoff time under 2 seconds'
                        ],
                        category: 'context-preservation'
                    }],
                confidence: 'high'
            });
        }
        // Quality-First Approach Promise
        if (content.includes('Maria-QA reviews all deliverables')) {
            promises.push({
                id: 'quality-first-approach',
                category: 'quality-gates',
                featureName: 'Quality-First Approach',
                description: 'Maria-QA should review all deliverables from other agents',
                source: 'CLAUDE.md - Core Principles',
                claims: [
                    'Maria-QA reviews ALL code from other agents',
                    'Quality gates enforcement (80% coverage minimum)',
                    'Automated testing pipeline setup'
                ],
                testableScenarios: [{
                        id: 'maria-reviews-all',
                        name: 'Maria Reviews All Agent Deliverables',
                        description: 'Every agent output should be reviewed by Maria-QA for quality',
                        userAction: 'Have any agent generate code or suggestions',
                        expectedBehavior: 'Maria-QA automatically reviews and validates the output',
                        measurableCriteria: [
                            'Maria-QA review appears after agent output',
                            'Quality score is provided',
                            'Improvement suggestions are made',
                            'Coverage requirements are checked'
                        ],
                        category: 'quality-gates'
                    }],
                confidence: 'high'
            });
        }
        return promises;
    }
    /**
     * Extract context preservation specific promises
     */
    extractContextPreservationPromises(content) {
        const promises = [];
        if (content.includes('Context Preservation Protocol')) {
            promises.push({
                id: 'context-preservation-protocol',
                category: 'context-preservation',
                featureName: 'Context Preservation Protocol',
                description: 'Framework should follow documented context preservation protocol',
                source: 'CLAUDE.md - Context Preservation Protocol',
                claims: [
                    'Automatic context saving',
                    'Decision trail logging',
                    'Conversation history maintenance',
                    'Cross-agent knowledge base'
                ],
                testableScenarios: [{
                        id: 'context-protocol-test',
                        name: 'Context Preservation Protocol Active',
                        description: 'Framework should automatically save and transfer context between agents',
                        userAction: 'Interact with multiple agents in sequence',
                        expectedBehavior: 'Each agent has access to previous interactions and decisions',
                        measurableCriteria: [
                            'Context data is automatically saved',
                            'Decision trails are logged',
                            'Knowledge base is updated',
                            'Agents reference previous interactions'
                        ],
                        category: 'context-preservation'
                    }],
                confidence: 'medium'
            });
        }
        return promises;
    }
    /**
     * Parse package.json for capability claims
     */
    async parsePackageCapabilities() {
        const promises = [];
        const packagePath = path.join(this.projectRoot, 'package.json');
        try {
            const content = await fs.readFile(packagePath, 'utf-8');
            const packageJson = JSON.parse(content);
            if (packageJson.description?.includes('ZERO CONTEXT LOSS')) {
                promises.push({
                    id: 'package-zero-context-loss',
                    category: 'context-preservation',
                    featureName: 'Package-Claimed Zero Context Loss',
                    description: 'Package.json claims ZERO CONTEXT LOSS capability',
                    source: 'package.json description',
                    claims: ['ZERO CONTEXT LOSS through intelligent agent orchestration'],
                    testableScenarios: [{
                            id: 'package-context-test',
                            name: 'Verify Zero Context Loss Claim',
                            description: 'Test if the framework actually achieves zero context loss',
                            userAction: 'Perform multi-agent workflow',
                            expectedBehavior: 'No context is lost between agent interactions',
                            measurableCriteria: [
                                'All agent interactions preserve context',
                                'No information is repeated unnecessarily',
                                'Decisions build upon previous context',
                                'Context accuracy is 100%'
                            ],
                            category: 'context-preservation'
                        }],
                    confidence: 'high'
                });
            }
        }
        catch (error) {
            this.logger.warning('Could not parse package.json', {
                error: error instanceof Error ? error.message : String(error)
            }, 'FeatureMapper');
        }
        return promises;
    }
    /**
     * Parse documentation for feature claims
     */
    async parseDocumentationClaims() {
        const promises = [];
        // This would expand to parse README, docs files, etc.
        return promises;
    }
    /**
     * Parse MCP server for tool integration claims
     */
    async parseMCPIntegrationClaims() {
        const promises = [];
        const mcpPath = path.join(this.projectRoot, 'src', 'mcp-server.ts');
        try {
            const content = await fs.readFile(mcpPath, 'utf-8');
            // Extract MCP tool claims
            if (content.includes('versatil_analyze_project')) {
                promises.push({
                    id: 'mcp-analyze-project',
                    category: 'mcp-integration',
                    featureName: 'MCP Project Analysis Tool',
                    description: 'MCP server should provide project analysis functionality',
                    source: 'src/mcp-server.ts',
                    claims: ['Analyze project structure and recommend VERSATIL agents'],
                    testableScenarios: [{
                            id: 'mcp-analyze-test',
                            name: 'MCP Project Analysis Works',
                            description: 'MCP tool should analyze project and recommend agents',
                            userAction: 'Call versatil_analyze_project MCP tool',
                            expectedBehavior: 'Tool returns project analysis and agent recommendations',
                            measurableCriteria: [
                                'Tool responds within 10 seconds',
                                'Analysis contains project structure info',
                                'Agent recommendations are provided',
                                'Response is properly formatted'
                            ],
                            category: 'mcp-integration'
                        }],
                    confidence: 'high'
                });
            }
            if (content.includes('versatil_activate_agent')) {
                promises.push({
                    id: 'mcp-activate-agent',
                    category: 'mcp-integration',
                    featureName: 'MCP Agent Activation Tool',
                    description: 'MCP server should allow manual agent activation',
                    source: 'src/mcp-server.ts',
                    claims: ['Manually activate a specific VERSATIL agent'],
                    testableScenarios: [{
                            id: 'mcp-agent-activation-test',
                            name: 'MCP Agent Activation Works',
                            description: 'MCP tool should activate specified agent with context',
                            userAction: 'Call versatil_activate_agent with agent name and context',
                            expectedBehavior: 'Specified agent activates and provides contextual response',
                            measurableCriteria: [
                                'Agent activation is confirmed',
                                'Agent provides relevant response',
                                'Context is properly passed to agent',
                                'Response includes agent ID and suggestions'
                            ],
                            category: 'mcp-integration'
                        }],
                    confidence: 'high'
                });
            }
        }
        catch (error) {
            this.logger.warning('Could not parse MCP server configuration', {
                error: error instanceof Error ? error.message : String(error)
            }, 'FeatureMapper');
        }
        return promises;
    }
    /**
     * Categorize promises for analysis
     */
    categorizePromises() {
        const categories = {};
        this.promises.forEach(promise => {
            categories[promise.category] = (categories[promise.category] || 0) + 1;
        });
        return categories;
    }
    /**
     * Get all promises for a specific category
     */
    getPromisesByCategory(category) {
        return this.promises.filter(p => p.category === category);
    }
    /**
     * Export promises to file for analysis
     */
    async exportPromises(filePath) {
        const exportPath = filePath || path.join(this.projectRoot, '.versatil', 'promise-analysis.json');
        const exportData = {
            timestamp: new Date().toISOString(),
            framework: 'VERSATIL SDLC Framework',
            totalPromises: this.promises.length,
            categories: this.categorizePromises(),
            promises: this.promises
        };
        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
        return exportPath;
    }
}
//# sourceMappingURL=feature-mapper.js.map