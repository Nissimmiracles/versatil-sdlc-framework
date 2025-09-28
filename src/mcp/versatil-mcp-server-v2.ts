/**
 * VERSATIL SDLC Framework - MCP Server Implementation v2
 * SDK v1.18.2 Compatible
 * Model Context Protocol server for agent communication and tool integration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { AgentRegistry } from '../agents/agent-registry.js';
import { SDLCOrchestrator } from '../flywheel/sdlc-orchestrator.js';
import { VERSATILLogger } from '../utils/logger.js';
import { PerformanceMonitor } from '../analytics/performance-monitor.js';

export interface VERSATILMCPConfig {
  name: string;
  version: string;
  agents: AgentRegistry;
  orchestrator: SDLCOrchestrator;
  logger: VERSATILLogger;
  performanceMonitor: PerformanceMonitor;
}

export class VERSATILMCPServerV2 {
  private server: McpServer;
  private config: VERSATILMCPConfig;

  constructor(config: VERSATILMCPConfig) {
    this.config = config;
    this.server = new McpServer({ name: config.name, version: config.version });
    this.registerTools();
  }

  private registerTools(): void {
    this.server.tool(
      'versatil_activate_agent',
      'Activate a specific BMAD agent with context',
      {
        agentId: z.enum([
          'enhanced-maria',
          'enhanced-james',
          'enhanced-marcus',
          'devops-dan',
          'security-sam',
          'architecture-dan',
          'deployment-orchestrator',
          'introspective-agent',
        ]),
        filePath: z.string(),
        content: z.string().optional(),
        trigger: z.string().optional(),
      },
      async ({ agentId, filePath, content, trigger }) => {
        const agent = this.config.agents.getAgent(agentId);
        if (!agent) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: `Agent ${agentId} not found` }),
              },
            ],
          };
        }

        const result = await agent.analyze({ filePath, content: content || '', trigger: trigger || 'manual' });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, agentId, result }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_orchestrate_phase',
      'Orchestrate SDLC phase transition with quality gates',
      {
        fromPhase: z.enum([
          'requirements',
          'design',
          'development',
          'testing',
          'deployment',
          'monitoring',
          'feedback',
          'improvement',
        ]),
        toPhase: z.enum([
          'requirements',
          'design',
          'development',
          'testing',
          'deployment',
          'monitoring',
          'feedback',
          'improvement',
        ]),
        context: z.record(z.any()).optional(),
      },
      async ({ fromPhase, toPhase, context }) => {
        const result = await this.config.orchestrator.transitionPhase(toPhase, context || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, fromPhase, toPhase, result }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_run_quality_gates',
      'Execute quality gates for current development phase',
      {
        phase: z.enum([
          'requirements',
          'design',
          'development',
          'testing',
          'deployment',
          'monitoring',
          'feedback',
          'improvement',
        ]),
        filePath: z.string(),
        strictMode: z.boolean().optional(),
      },
      async ({ phase, filePath, strictMode = true }) => {
        const gates = await this.config.orchestrator.runQualityGates(phase);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, phase, filePath, gates }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_run_tests',
      'Execute comprehensive testing via Enhanced Maria',
      {
        testType: z.enum([
          'unit',
          'integration',
          'e2e',
          'visual',
          'performance',
          'accessibility',
          'security',
          'maria-qa',
          'all',
        ]),
        coverage: z.boolean().optional(),
        chromeMCP: z.boolean().optional(),
      },
      async ({ testType, coverage = true, chromeMCP = true }) => {
        const maria = this.config.agents.getAgent('enhanced-maria');
        if (!maria) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Enhanced Maria not available' }),
              },
            ],
          };
        }

        const result = await maria.runTests({ testType, coverage, chromeMCP });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, testType, result }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_analyze_architecture',
      'Perform architectural analysis via Architecture Dan',
      {
        filePath: z.string(),
        analysisType: z.enum([
          'design-patterns',
          'solid-principles',
          'coupling-analysis',
          'scalability',
          'adr-review',
          'full',
        ]),
        generateADR: z.boolean().optional(),
      },
      async ({ filePath, analysisType, generateADR = false }) => {
        const dan = this.config.agents.getAgent('architecture-dan');
        if (!dan) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Architecture Dan not available' }),
              },
            ],
          };
        }

        const result = await dan.analyzeArchitecture({ filePath, analysisType, generateADR });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, filePath, analysisType, result }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_manage_deployment',
      'Manage deployment pipeline via Deployment Orchestrator',
      {
        action: z.enum(['validate', 'deploy', 'rollback', 'health-check', 'blue-green', 'canary']),
        environment: z.enum(['development', 'staging', 'production']),
        strategy: z.enum(['rolling', 'blue-green', 'canary']).optional(),
      },
      async ({ action, environment, strategy = 'rolling' }) => {
        const deployer = this.config.agents.getAgent('deployment-orchestrator');
        if (!deployer) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Deployment Orchestrator not available' }),
              },
            ],
          };
        }

        const result = await deployer.manageDeployment({ action, environment, strategy });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, action, environment, result }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_get_status',
      'Get comprehensive VERSATIL framework status',
      {
        include: z
          .array(z.enum(['agents', 'flywheel', 'performance', 'quality', 'deployment', 'feedback']))
          .optional(),
        detailed: z.boolean().optional(),
      },
      async ({ include = ['agents', 'flywheel', 'performance'], detailed = false }) => {
        const status: any = { timestamp: new Date().toISOString() };

        if (include.includes('agents')) {
          status.agents = this.config.agents.getStatus();
        }
        if (include.includes('flywheel')) {
          status.flywheel = await this.config.orchestrator.getStatus();
        }
        if (include.includes('performance')) {
          status.performance = await this.config.performanceMonitor.getMetrics();
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, status }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_adaptive_insights',
      'Get adaptive learning insights and recommendations',
      {
        agentId: z.string().optional(),
        timeRange: z.enum(['hour', 'day', 'week', 'month', 'all']).optional(),
        includeRecommendations: z.boolean().optional(),
      },
      async ({ agentId, timeRange = 'day', includeRecommendations = true }) => {
        const insights = await this.config.performanceMonitor.getAdaptiveInsights();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, insights }, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_health_check',
      'Comprehensive framework health check',
      {
        comprehensive: z.boolean().optional(),
      },
      async ({ comprehensive = false }) => {
        const health = {
          status: 'healthy',
          components: {
            agents: this.config.agents.isHealthy(),
            orchestrator: await this.config.orchestrator.isHealthy(),
            performance: this.config.performanceMonitor.isHealthy(),
          },
          timestamp: new Date().toISOString(),
        };

        if (comprehensive) {
          health.components = {
            ...health.components,
            ...(await this.config.orchestrator.getDetailedHealth()),
          };
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
    );

    this.server.tool(
      'versatil_emergency_protocol',
      'Trigger emergency response protocol',
      {
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
        component: z.string().optional(),
      },
      async ({ severity, description, component }) => {
        this.config.logger.error('Emergency protocol activated', {
          severity,
          description,
          component,
          timestamp: new Date().toISOString(),
        });

        const response = await this.config.orchestrator.handleEmergency('emergency', {
          severity,
          description,
          component: component || 'unknown',
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  severity,
                  response,
                  message: 'Emergency protocol activated',
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    this.config.logger.info('VERSATIL MCP tools registered successfully', { count: 10 });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.config.logger.info('VERSATIL MCP Server started', {
      name: this.config.name,
      version: this.config.version,
      tools: 10,
    });
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.config.logger.info('VERSATIL MCP Server stopped');
  }

  getServer(): McpServer {
    return this.server;
  }
}