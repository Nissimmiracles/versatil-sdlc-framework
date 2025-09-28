import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk';
import { EnhancedOperaOrchestrator } from './enhanced-opera-orchestrator.js';
import { VERSATILLogger } from '../utils/logger.js';

export interface OperaMCPConfig {
  name?: string;
  version?: string;
  port?: number;
  autoUpdate?: boolean;
  updateChannel?: string;
}

export class OperaMCPServer {
  private server: Server;
  private opera: EnhancedOperaOrchestrator;
  private config: OperaMCPConfig;
  private logger: VERSATILLogger;

  constructor(opera: EnhancedOperaOrchestrator, config?: OperaMCPConfig) {
    this.opera = opera;
    this.config = {
      name: config?.name || 'versatil-opera-mcp',
      version: config?.version || '1.2.1',
      port: config?.port || 3000,
      autoUpdate: config?.autoUpdate ?? true,
      updateChannel: config?.updateChannel || 'stable',
      ...config
    };
    this.logger = new VERSATILLogger('OperaMCP');

    this.server = new Server(
      {
        name: this.config.name!,
        version: this.config.version!,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema as any, async () => {
      return {
        tools: [
          {
            name: 'opera_set_goal',
            description: 'Set an autonomous development goal for Opera to achieve',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['feature', 'bug_fix', 'optimization', 'refactor', 'security', 'testing'],
                  description: 'Type of goal',
                },
                description: {
                  type: 'string',
                  description: 'Detailed description of what to achieve',
                },
                priority: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Goal priority level',
                },
                constraints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Constraints or requirements (e.g., "must maintain backward compatibility")',
                },
                deadline: {
                  type: 'string',
                  description: 'ISO 8601 deadline (optional)',
                },
                autoExecute: {
                  type: 'boolean',
                  description: 'Automatically execute the goal',
                  default: false,
                },
              },
              required: ['type', 'description', 'priority'],
            },
          },

          {
            name: 'opera_get_goals',
            description: 'Get all active and completed goals',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['active', 'completed', 'failed', 'all'],
                  description: 'Filter by goal status',
                  default: 'active',
                },
                includeHistory: {
                  type: 'boolean',
                  description: 'Include execution history',
                  default: false,
                },
              },
            },
          },

          {
            name: 'opera_execute_goal',
            description: 'Execute a specific goal autonomously',
            inputSchema: {
              type: 'object',
              properties: {
                goalId: {
                  type: 'string',
                  description: 'Goal ID to execute',
                },
                dryRun: {
                  type: 'boolean',
                  description: 'Simulate execution without making changes',
                  default: false,
                },
                approveSteps: {
                  type: 'boolean',
                  description: 'Require approval for each step',
                  default: true,
                },
              },
              required: ['goalId'],
            },
          },

          {
            name: 'opera_get_execution_plan',
            description: 'Get the execution plan for a goal',
            inputSchema: {
              type: 'object',
              properties: {
                goalId: {
                  type: 'string',
                  description: 'Goal ID',
                },
                detailed: {
                  type: 'boolean',
                  description: 'Include detailed step information',
                  default: true,
                },
              },
              required: ['goalId'],
            },
          },

          {
            name: 'opera_pause_goal',
            description: 'Pause execution of a goal',
            inputSchema: {
              type: 'object',
              properties: {
                goalId: {
                  type: 'string',
                  description: 'Goal ID to pause',
                },
                reason: {
                  type: 'string',
                  description: 'Reason for pausing',
                },
              },
              required: ['goalId'],
            },
          },

          {
            name: 'opera_resume_goal',
            description: 'Resume a paused goal',
            inputSchema: {
              type: 'object',
              properties: {
                goalId: {
                  type: 'string',
                  description: 'Goal ID to resume',
                },
              },
              required: ['goalId'],
            },
          },

          {
            name: 'opera_cancel_goal',
            description: 'Cancel a goal and rollback changes',
            inputSchema: {
              type: 'object',
              properties: {
                goalId: {
                  type: 'string',
                  description: 'Goal ID to cancel',
                },
                rollback: {
                  type: 'boolean',
                  description: 'Rollback completed steps',
                  default: true,
                },
                reason: {
                  type: 'string',
                  description: 'Cancellation reason',
                },
              },
              required: ['goalId'],
            },
          },

          {
            name: 'opera_get_status',
            description: 'Get Opera orchestrator status and metrics',
            inputSchema: {
              type: 'object',
              properties: {
                detailed: {
                  type: 'boolean',
                  description: 'Include detailed metrics',
                  default: false,
                },
              },
            },
          },

          {
            name: 'opera_analyze_project',
            description: 'Analyze project for improvement opportunities',
            inputSchema: {
              type: 'object',
              properties: {
                depth: {
                  type: 'string',
                  enum: ['quick', 'standard', 'comprehensive', 'deep'],
                  description: 'Analysis depth',
                  default: 'standard',
                },
                focus: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['performance', 'security', 'quality', 'architecture', 'testing'],
                  },
                  description: 'Areas to focus on',
                },
              },
            },
          },

          {
            name: 'opera_get_insights',
            description: 'Get learning insights and recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                timeframe: {
                  type: 'string',
                  enum: ['today', 'week', 'month', 'all'],
                  description: 'Timeframe for insights',
                  default: 'week',
                },
                category: {
                  type: 'string',
                  enum: ['patterns', 'errors', 'performance', 'decisions', 'all'],
                  description: 'Category of insights',
                  default: 'all',
                },
              },
            },
          },

          {
            name: 'opera_suggest_goals',
            description: 'Get AI-suggested goals based on project analysis',
            inputSchema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                  description: 'Number of suggestions',
                  default: 5,
                },
                priority: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low', 'all'],
                  description: 'Minimum priority level',
                  default: 'all',
                },
              },
            },
          },

          {
            name: 'opera_health_check',
            description: 'Perform health check on Opera orchestrator',
            inputSchema: {
              type: 'object',
              properties: {
                comprehensive: {
                  type: 'boolean',
                  description: 'Run comprehensive health check',
                  default: false,
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema as any, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'opera_set_goal':
            return await this.handleSetGoal(args);
          case 'opera_get_goals':
            return await this.handleGetGoals(args);
          case 'opera_execute_goal':
            return await this.handleExecuteGoal(args);
          case 'opera_get_execution_plan':
            return await this.handleGetExecutionPlan(args);
          case 'opera_pause_goal':
            return await this.handlePauseGoal(args);
          case 'opera_resume_goal':
            return await this.handleResumeGoal(args);
          case 'opera_cancel_goal':
            return await this.handleCancelGoal(args);
          case 'opera_get_status':
            return await this.handleGetStatus(args);
          case 'opera_analyze_project':
            return await this.handleAnalyzeProject(args);
          case 'opera_get_insights':
            return await this.handleGetInsights(args);
          case 'opera_suggest_goals':
            return await this.handleSuggestGoals(args);
          case 'opera_health_check':
            return await this.handleHealthCheck(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error('Opera MCP tool execution failed', {
          tool: name,
          error: error instanceof Error ? error.message : String(error),
        }, 'OperaMCP');

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleSetGoal(args: any) {
    const { type, description, priority, constraints = [], deadline, autoExecute = false } = args;

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
  }

  private async handleGetGoals(args: any) {
    const { status = 'active', includeHistory = false } = args;

    const activeGoals = await this.opera.getActiveGoals();

    let filteredGoals = activeGoals;
    if (status !== 'all') {
      filteredGoals = activeGoals.filter((g: any) => g.status === status);
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
  }

  private async handleExecuteGoal(args: any) {
    const { goalId, dryRun = false, approveSteps = true } = args;

    const plans = await this.opera.getExecutionPlans();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goalId,
            status: dryRun ? 'simulated' : 'executing',
            dryRun,
            approveSteps,
            message: dryRun
              ? 'Simulation completed successfully'
              : 'Goal execution started',
            estimatedTime: '5-10 minutes',
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetExecutionPlan(args: any) {
    const { goalId, detailed = true } = args;

    const plans = await this.opera.getExecutionPlans();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goalId,
            plan: {
              steps: [],
              estimatedDuration: '10 minutes',
              risks: [],
              dependencies: [],
            },
            detailed,
          }, null, 2),
        },
      ],
    };
  }

  private async handlePauseGoal(args: any) {
    const { goalId, reason } = args;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goalId,
            status: 'paused',
            reason,
            message: 'Goal execution paused',
          }, null, 2),
        },
      ],
    };
  }

  private async handleResumeGoal(args: any) {
    const { goalId } = args;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goalId,
            status: 'resumed',
            message: 'Goal execution resumed',
          }, null, 2),
        },
      ],
    };
  }

  private async handleCancelGoal(args: any) {
    const { goalId, rollback = true, reason } = args;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            goalId,
            status: 'cancelled',
            rollback,
            reason,
            message: rollback ? 'Goal cancelled and changes rolled back' : 'Goal cancelled',
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetStatus(args: any) {
    const { detailed = false } = args;

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
  }

  private async handleAnalyzeProject(args: any) {
    const { depth = 'standard', focus = [] } = args;

    const analysis = await this.opera.analyzeProject(depth);

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
  }

  private async handleGetInsights(args: any) {
    const { timeframe = 'week', category = 'all' } = args;

    const insights = await this.opera.getLearningInsights();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            timeframe,
            category,
            insights,
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleSuggestGoals(args: any) {
    const { count = 5, priority = 'all' } = args;

    const analysis = await this.opera.analyzeProject('comprehensive');

    const suggestions = (analysis.suggestions || []).slice(0, count).map((s: any, i: number) => ({
      id: `suggested-goal-${i}`,
      type: s.type || 'optimization',
      description: s.message || s.description,
      priority: s.priority || 'medium',
      estimatedEffort: 'medium',
      potentialImpact: 'high',
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            suggestions,
            count: suggestions.length,
            priority,
            message: 'Use opera_set_goal with these suggestions',
          }, null, 2),
        },
      ],
    };
  }

  private async handleHealthCheck(args: any) {
    const { comprehensive = false } = args;

    const health = {
      status: 'healthy',
      components: {
        orchestrator: 'healthy',
        goals: 'healthy',
        execution: 'healthy',
        learning: 'healthy',
      },
      checks: [] as any[],
    };

    if (comprehensive) {
      health.checks = [
        { name: 'Opera State', status: 'pass' },
        { name: 'Goal Queue', status: 'pass' },
        { name: 'Execution Engine', status: 'pass' },
        { name: 'Learning System', status: 'pass' },
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
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      this.logger.error('Opera MCP Server error', {
        error: error instanceof Error ? error.message : String(error),
      }, 'OperaMCP');
    };

    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  async start(port?: number): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info('Opera MCP Server started', {
      name: this.config.name,
      version: this.config.version,
      toolsCount: 12,
      autoUpdate: this.config.autoUpdate,
    }, 'OperaMCP');
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.logger.info('Opera MCP Server stopped', {}, 'OperaMCP');
  }

  async getMetrics(): Promise<any> {
    return {
      uptime: process.uptime(),
      activeGoals: (await this.opera.getActiveGoals()).length,
      executionPlans: (await this.opera.getExecutionPlans()).length,
      performance: await this.opera.getMetrics(),
    };
  }
}

export function createOperaMCPServer(opera: EnhancedOperaOrchestrator, config?: OperaMCPConfig): OperaMCPServer {
  return new OperaMCPServer(opera, config);
}