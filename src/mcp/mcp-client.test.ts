/**
 * Tests for VERSATIL MCP Client
 * Tests MCP tool execution, agent activation, SDLC orchestration, quality gates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VERSATILMCPClient, type MCPClientConfig, type MCPToolRequest, type MCPToolResponse } from './mcp-client.js';

describe('VERSATILMCPClient', () => {
  let client: VERSATILMCPClient;
  let config: Partial<MCPClientConfig>;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      serverPath: 'dist/mcp/versatil-mcp-server.js',
      toolPrefix: 'versatil_',
      maxRetries: 3,
      timeout: 30000,
    };
    client = new VERSATILMCPClient(config);
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultClient = new VERSATILMCPClient();
      expect(defaultClient['config'].serverPath).toBe('dist/mcp/versatil-mcp-server.js');
      expect(defaultClient['config'].toolPrefix).toBe('versatil_');
      expect(defaultClient['config'].maxRetries).toBe(3);
      expect(defaultClient['config'].timeout).toBe(30000);
    });

    it('should merge custom config with defaults', () => {
      const customClient = new VERSATILMCPClient({ maxRetries: 5, timeout: 60000 });
      expect(customClient['config'].maxRetries).toBe(5);
      expect(customClient['config'].timeout).toBe(60000);
      expect(customClient['config'].serverPath).toBe('dist/mcp/versatil-mcp-server.js');
    });

    it('should initialize agent registry', () => {
      expect(client['agentRegistry']).toBeDefined();
    });

    it('should initialize SDLC orchestrator', () => {
      expect(client['sdlcOrchestrator']).toBeDefined();
    });

    it('should initialize logger', () => {
      expect(client['logger']).toBeDefined();
    });
  });

  describe('Tool Execution', () => {
    it('should execute MCP tool request', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
      };
      const response = await client.executeTool(request);
      expect(response).toHaveProperty('success');
    });

    it('should strip tool prefix before routing', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: { agentId: 'alex-ba' },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should handle unknown tool names', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_unknown_tool',
        arguments: {},
      };
      await expect(client.executeTool(request)).rejects.toThrow('Unknown tool');
    });

    it('should include metadata in response', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
      };
      const response = await client.executeTool(request);
      expect(response).toHaveProperty('metadata');
    });

    it('should log tool execution', async () => {
      const logSpy = vi.spyOn(client['logger'], 'info');
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
      };
      await client.executeTool(request);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executing MCP tool'),
        expect.any(Object)
      );
    });
  });

  describe('Agent Activation', () => {
    it('should handle activate_agent tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: {
          agentId: 'alex-ba',
          trigger: 'user-request',
          content: 'Create user stories',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
      expect(response.data).toHaveProperty('agentId');
    });

    it('should validate agent ID', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: {
          agentId: 'invalid-agent',
          trigger: 'user-request',
          content: 'Test',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should pass activation context to agent', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: {
          agentId: 'james-frontend',
          trigger: 'file-edit',
          content: 'React component code',
          filePath: 'src/components/Button.tsx',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('context');
    });

    it('should return agent response with suggestions', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: {
          agentId: 'marcus-backend',
          trigger: 'code-review',
          content: 'API endpoint code',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('suggestions');
    });
  });

  describe('SDLC Orchestration', () => {
    it('should handle orchestrate_sdlc tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_orchestrate_sdlc',
        arguments: {
          phase: 'development',
          workflowType: 'feature',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should validate SDLC phase', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_orchestrate_sdlc',
        arguments: {
          phase: 'invalid-phase',
          workflowType: 'feature',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBe(false);
    });

    it('should coordinate multiple agents', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_orchestrate_sdlc',
        arguments: {
          phase: 'planning',
          workflowType: 'epic',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('activatedAgents');
    });

    it('should track orchestration progress', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_orchestrate_sdlc',
        arguments: {
          phase: 'testing',
          workflowType: 'bugfix',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('progress');
    });
  });

  describe('Quality Gate Execution', () => {
    it('should handle quality_gate tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_quality_gate',
        arguments: {
          gate: 'code-quality',
          filePath: 'src/index.ts',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should execute code quality gate', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_quality_gate',
        arguments: {
          gate: 'code-quality',
          filePath: 'src/app.ts',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('passed');
      expect(response.data).toHaveProperty('issues');
    });

    it('should execute test coverage gate', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_quality_gate',
        arguments: {
          gate: 'test-coverage',
          threshold: 80,
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('coverage');
    });

    it('should execute security gate', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_quality_gate',
        arguments: {
          gate: 'security',
          filePath: 'src/auth.ts',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('vulnerabilities');
    });

    it('should execute performance gate', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_quality_gate',
        arguments: {
          gate: 'performance',
          metric: 'response-time',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('metrics');
    });
  });

  describe('Test Suite Execution', () => {
    it('should handle test_suite tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_test_suite',
        arguments: {
          suite: 'unit',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should run unit tests', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_test_suite',
        arguments: {
          suite: 'unit',
          path: 'src/**/*.test.ts',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('passed');
      expect(response.data).toHaveProperty('failed');
    });

    it('should run integration tests', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_test_suite',
        arguments: {
          suite: 'integration',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('testResults');
    });

    it('should run e2e tests', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_test_suite',
        arguments: {
          suite: 'e2e',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('duration');
    });

    it('should include coverage data', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_test_suite',
        arguments: {
          suite: 'unit',
          coverage: true,
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('coverage');
    });
  });

  describe('Architecture Analysis', () => {
    it('should handle architecture_analysis tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_architecture_analysis',
        arguments: {
          projectPath: '/path/to/project',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should analyze project structure', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_architecture_analysis',
        arguments: {
          projectPath: '/path/to/project',
          aspect: 'structure',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('structure');
    });

    it('should analyze dependencies', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_architecture_analysis',
        arguments: {
          projectPath: '/path/to/project',
          aspect: 'dependencies',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('dependencies');
    });

    it('should detect anti-patterns', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_architecture_analysis',
        arguments: {
          projectPath: '/path/to/project',
          aspect: 'anti-patterns',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('antiPatterns');
    });

    it('should provide improvement suggestions', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_architecture_analysis',
        arguments: {
          projectPath: '/path/to/project',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('suggestions');
    });
  });

  describe('Deployment Pipeline', () => {
    it('should handle deployment_pipeline tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_deployment_pipeline',
        arguments: {
          environment: 'staging',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should validate deployment configuration', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_deployment_pipeline',
        arguments: {
          environment: 'production',
          validate: true,
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('validationErrors');
    });

    it('should execute deployment steps', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_deployment_pipeline',
        arguments: {
          environment: 'staging',
          execute: true,
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('steps');
    });

    it('should rollback on failure', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_deployment_pipeline',
        arguments: {
          environment: 'production',
          rollback: true,
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('rollbackStatus');
    });
  });

  describe('Framework Status', () => {
    it('should handle framework_status tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
      };
      const response = await client.executeTool(request);
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('status');
    });

    it('should report agent health', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: { detail: 'agents' },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('agents');
    });

    it('should report system metrics', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: { detail: 'metrics' },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('metrics');
    });

    it('should report active tasks', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: { detail: 'tasks' },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('activeTasks');
    });
  });

  describe('Adaptive Insights', () => {
    it('should handle adaptive_insights tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_adaptive_insights',
        arguments: {
          category: 'performance',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should provide performance insights', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_adaptive_insights',
        arguments: {
          category: 'performance',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('insights');
    });

    it('should provide quality insights', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_adaptive_insights',
        arguments: {
          category: 'quality',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('trends');
    });

    it('should provide learning recommendations', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_adaptive_insights',
        arguments: {
          category: 'learning',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('recommendations');
    });
  });

  describe('File Analysis', () => {
    it('should handle file_analysis tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_file_analysis',
        arguments: {
          filePath: 'src/index.ts',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should analyze file complexity', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_file_analysis',
        arguments: {
          filePath: 'src/complex.ts',
          metric: 'complexity',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('complexity');
    });

    it('should detect code smells', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_file_analysis',
        arguments: {
          filePath: 'src/smelly.ts',
          metric: 'code-smells',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('codeSmells');
    });

    it('should suggest refactoring', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_file_analysis',
        arguments: {
          filePath: 'src/legacy.ts',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('refactoringSuggestions');
    });
  });

  describe('Performance Report', () => {
    it('should handle performance_report tool', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_performance_report',
        arguments: {
          timeRange: '7d',
        },
      };
      const response = await client.executeTool(request);
      expect(response.success).toBeDefined();
    });

    it('should generate agent performance report', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_performance_report',
        arguments: {
          type: 'agents',
          timeRange: '30d',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('agentMetrics');
    });

    it('should generate build performance report', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_performance_report',
        arguments: {
          type: 'builds',
          timeRange: '7d',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('buildTimes');
    });

    it('should generate test performance report', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_performance_report',
        arguments: {
          type: 'tests',
          timeRange: '14d',
        },
      };
      const response = await client.executeTool(request);
      expect(response.data).toHaveProperty('testMetrics');
    });
  });

  describe('Error Handling', () => {
    it('should handle tool execution errors', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: {}, // Missing required arguments
      };
      const response = await client.executeTool(request);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should log errors', async () => {
      const errorSpy = vi.spyOn(client['logger'], 'error');
      const request: MCPToolRequest = {
        tool: 'versatil_unknown_tool',
        arguments: {},
      };
      try {
        await client.executeTool(request);
      } catch (error) {
        // Expected to throw
      }
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should include error details in response', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: { agentId: 'invalid' },
      };
      const response = await client.executeTool(request);
      expect(response.error).toContain('invalid');
    });

    it('should handle timeout', async () => {
      const shortTimeoutClient = new VERSATILMCPClient({ timeout: 1 });
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
      };
      const response = await shortTimeoutClient.executeTool(request);
      expect(response.success).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      let attempts = 0;
      vi.spyOn(client as any, 'handleFrameworkStatus').mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true, data: { status: 'healthy' } };
      });

      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
      };
      const response = await client.executeTool(request);
      expect(attempts).toBe(3);
      expect(response.success).toBe(true);
    });

    it('should respect maxRetries config', async () => {
      const limitedClient = new VERSATILMCPClient({ maxRetries: 1 });
      let attempts = 0;
      vi.spyOn(limitedClient as any, 'handleFrameworkStatus').mockImplementation(async () => {
        attempts++;
        throw new Error('Always fails');
      });

      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
      };
      try {
        await limitedClient.executeTool(request);
      } catch (error) {
        // Expected to fail
      }
      expect(attempts).toBeLessThanOrEqual(2);
    });

    it('should not retry on validation errors', async () => {
      let attempts = 0;
      vi.spyOn(client as any, 'handleAgentActivation').mockImplementation(async () => {
        attempts++;
        return {
          success: false,
          error: 'Validation error: missing agentId',
        };
      });

      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: {},
      };
      const response = await client.executeTool(request);
      expect(attempts).toBe(1);
      expect(response.success).toBe(false);
    });
  });

  describe('Context Passing', () => {
    it('should pass context from request to handlers', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_activate_agent',
        arguments: {
          agentId: 'alex-ba',
          trigger: 'user-request',
          content: 'Test',
        },
        context: {
          userId: 'user-123',
          sessionId: 'session-456',
        },
      };
      const response = await client.executeTool(request);
      expect(response.metadata).toHaveProperty('context');
    });

    it('should preserve context through tool execution', async () => {
      const request: MCPToolRequest = {
        tool: 'versatil_framework_status',
        arguments: {},
        context: {
          requestId: 'req-789',
        },
      };
      const response = await client.executeTool(request);
      expect(response.metadata?.requestId).toBe('req-789');
    });
  });
});
