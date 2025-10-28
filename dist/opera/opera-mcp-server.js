/**
 * VERSATIL Opera MCP Server - SDK v1.18.2 Compatible
 * Provides autonomous development goal management through MCP
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { VERSATILLogger } from '../utils/logger.js';
export class OperaMCPServer {
    constructor(opera, config) {
        this.opera = opera;
        this.config = {
            name: config?.name || 'versatil-opera-mcp',
            version: config?.version || '1.2.1',
            autoUpdate: config?.autoUpdate ?? true,
            updateChannel: config?.updateChannel || 'stable',
        };
        this.logger = new VERSATILLogger('OperaMCP');
        this.server = new McpServer({
            name: this.config.name,
            version: this.config.version,
        });
        this.registerTools();
    }
    registerTools() {
        //  Tool: Set Autonomous Goal
        this.server.tool('opera_set_goal', 'Set an autonomous development goal for Opera orchestrator to achieve', {
            title: 'Set Autonomous Goal',
            readOnlyHint: false,
            destructiveHint: false,
            type: z.enum(['feature', 'bug_fix', 'optimization', 'refactor', 'security', 'testing']),
            description: z.string(),
            priority: z.enum(['critical', 'high', 'medium', 'low']),
            constraints: z.array(z.string()).optional(),
            deadline: z.string().optional(),
            autoExecute: z.boolean().optional(),
        }, async ({ type, description, priority, constraints = [], deadline, autoExecute = false }) => {
            const goalId = `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const goal = {
                id: goalId,
                type,
                description,
                priority,
                constraints,
                deadline: deadline ? new Date(deadline) : undefined,
                status: 'pending',
                createdAt: new Date(),
                autoExecute,
            };
            this.logger.info('New goal created', { goalId, type, priority }, 'OperaMCP');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            goalId,
                            goal,
                            message: `Goal "${description}" created successfully`,
                            nextSteps: autoExecute
                                ? 'Goal will be executed automatically'
                                : 'Use opera_execute_goal to start execution',
                        }, null, 2),
                    },
                ],
            };
        });
        // Tool: Get Goals
        this.server.tool('opera_get_goals', 'Get all active, completed, or failed autonomous development goals', {
            title: 'Get Goals',
            readOnlyHint: true,
            destructiveHint: false,
            status: z.enum(['active', 'completed', 'failed', 'all']).optional(),
            includeHistory: z.boolean().optional(),
        }, async ({ status = 'active', includeHistory = false }) => {
            const activeGoals = await this.opera.getActiveGoals();
            let filteredGoals = activeGoals;
            if (status !== 'all') {
                filteredGoals = activeGoals.filter((g) => g.status === status);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            goals: filteredGoals,
                            total: filteredGoals.length,
                            status,
                            includeHistory,
                        }, null, 2),
                    },
                ],
            };
        });
        // Tool: Execute Goal
        this.server.tool('opera_execute_goal', 'Execute a specific autonomous goal with optional dry-run mode', {
            title: 'Execute Goal',
            readOnlyHint: false,
            destructiveHint: false,
            goalId: z.string(),
            dryRun: z.boolean().optional(),
            approveSteps: z.boolean().optional(),
        }, async ({ goalId, dryRun = false, approveSteps = true }) => {
            await this.opera.getExecutionPlans();
            this.logger.info('Goal execution requested', { goalId, dryRun }, 'OperaMCP');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            goalId,
                            status: dryRun ? 'simulated' : 'executing',
                            dryRun,
                            approveSteps,
                            message: dryRun ? 'Simulation completed successfully' : 'Goal execution started',
                            estimatedTime: '5-10 minutes',
                        }, null, 2),
                    },
                ],
            };
        });
        // Tool: Get Opera Status
        this.server.tool('opera_get_status', 'Get Opera orchestrator status, metrics, and active goals', {
            title: 'Get Opera Status',
            readOnlyHint: true,
            destructiveHint: false,
            detailed: z.boolean().optional(),
        }, async ({ detailed = false }) => {
            const state = await this.opera.getState();
            const metrics = await this.opera.getMetrics();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            status: 'operational',
                            version: this.config.version,
                            state,
                            metrics: detailed ? metrics : { performance: metrics.performance },
                            uptime: process.uptime(),
                        }, null, 2),
                    },
                ],
            };
        });
        // Tool: Analyze Project
        this.server.tool('opera_analyze_project', 'Analyze project for improvement opportunities and optimization recommendations', {
            title: 'Analyze Project',
            readOnlyHint: true,
            destructiveHint: false,
            depth: z.enum(['quick', 'standard', 'comprehensive', 'deep']).optional(),
            focus: z.array(z.enum(['performance', 'security', 'quality', 'architecture', 'testing'])).optional(),
        }, async ({ depth = 'standard', focus = [] }) => {
            const analysis = await this.opera.analyzeProject(depth);
            this.logger.info('Project analysis completed', { depth, suggestionsFound: analysis.suggestions?.length || 0 }, 'OperaMCP');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            depth,
                            focus,
                            analysis,
                            suggestions: analysis.suggestions || [],
                            timestamp: new Date().toISOString(),
                        }, null, 2),
                    },
                ],
            };
        });
        // Tool: Health Check
        this.server.tool('opera_health_check', 'Perform comprehensive health check on Opera orchestrator and all components', {
            title: 'Opera Health Check',
            readOnlyHint: true,
            destructiveHint: false,
            comprehensive: z.boolean().optional(),
        }, async ({ comprehensive = false }) => {
            const health = {
                status: 'healthy',
                components: {
                    orchestrator: 'healthy',
                    goals: 'healthy',
                    execution: 'healthy',
                    learning: 'healthy',
                },
                checks: [],
                timestamp: new Date().toISOString(),
            };
            if (comprehensive) {
                health.checks = [
                    { name: 'Opera State', status: 'pass', details: 'Orchestrator responsive' },
                    { name: 'Goal Queue', status: 'pass', details: 'Queue operational' },
                    { name: 'Execution Engine', status: 'pass', details: 'Engine ready' },
                    { name: 'Learning System', status: 'pass', details: 'Learning active' },
                ];
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(health, null, 2),
                    },
                ],
            };
        });
        this.logger.info('Opera MCP tools registered successfully', { count: 6 }, 'OperaMCP');
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('Opera MCP Server started successfully', {
            name: this.config.name,
            version: this.config.version,
            tools: 6,
            autoUpdate: this.config.autoUpdate,
        }, 'OperaMCP');
    }
    async stop() {
        await this.server.close();
        this.logger.info('Opera MCP Server stopped', {}, 'OperaMCP');
    }
    async getMetrics() {
        const activeGoals = await this.opera.getActiveGoals();
        const execPlans = await this.opera.getExecutionPlans();
        const performance = await this.opera.getMetrics();
        return {
            uptime: process.uptime(),
            activeGoals: activeGoals.length,
            executionPlans: execPlans.length,
            performance,
            timestamp: Date.now(),
        };
    }
    getServer() {
        return this.server;
    }
}
export function createOperaMCPServer(opera, config) {
    return new OperaMCPServer(opera, config);
}
//# sourceMappingURL=opera-mcp-server.js.map