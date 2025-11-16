/**
 * VERSATIL Framework - MCP Tool Router Tests
 * Test suite for MCP tool routing, selection, and load balancing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPToolRouter, ToolCallRequest } from './mcp-tool-router';

describe('MCPToolRouter', () => {
  let router: MCPToolRouter;

  beforeEach(async () => {
    vi.clearAllMocks();
    router = new MCPToolRouter();
    await router.initialize();
  });

  afterEach(() => {
    if (router) {
      router.shutdown();
    }
  });

  // ============================================================================
  // Tool Selection (12 tests)
  // ============================================================================
  describe('Tool Selection', () => {
    it('should route to correct MCP tool by name', async () => {
      const request: ToolCallRequest = {
        tool: 'Playwright',
        action: 'screenshot',
        params: { selector: '.app' }
      };

      const response = await router.handleToolCall(request);

      expect(response.tool).toBe('Playwright');
      expect(response).toHaveProperty('success');
    });

    it('should select best tool for task', async () => {
      const request: ToolCallRequest = {
        tool: 'browser_automation',
        action: 'navigate',
        params: { url: 'https://example.com' }
      };

      const selectedTool = await router.selectBestTool(request);

      expect(['Playwright', 'Chrome']).toContain(selectedTool);
    });

    it('should handle tool not found', async () => {
      const request: ToolCallRequest = {
        tool: 'NonExistentTool',
        action: 'doSomething',
        params: {}
      };

      const response = await router.handleToolCall(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('not found');
    });

    it('should support fallback tools', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'get_repo',
        params: { repo: 'test/repo' }
      };

      // Simulate primary tool failure
      vi.spyOn(router['githubMCP'], 'execute').mockRejectedValueOnce(new Error('Failed'));

      const response = await router.handleToolCall(request, {
        fallbackTools: ['GitMCP']
      });

      // Should try fallback
      expect(response).toHaveProperty('usedFallback');
    });

    it('should route Playwright tool calls', async () => {
      const request: ToolCallRequest = {
        tool: 'Playwright',
        action: 'click',
        params: { selector: 'button' }
      };

      const response = await router.handleToolCall(request);

      expect(response.tool).toBe('Playwright');
    });

    it('should route GitHub tool calls', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'list_issues',
        params: { repo: 'owner/repo' }
      };

      const response = await router.handleToolCall(request);

      expect(response.tool).toBe('GitHub');
    });

    it('should route Chrome tool calls', async () => {
      const request: ToolCallRequest = {
        tool: 'Chrome',
        action: 'performance_metrics',
        params: { url: 'https://example.com' }
      };

      const response = await router.handleToolCall(request);

      expect(response.tool).toBe('Chrome');
    });

    it('should route Exa Search tool calls', async () => {
      const request: ToolCallRequest = {
        tool: 'Exa',
        action: 'search',
        params: { query: 'react hooks' }
      };

      const response = await router.handleToolCall(request);

      expect(response.tool).toBe('Exa');
    });

    it('should route Shadcn tool calls', async () => {
      const request: ToolCallRequest = {
        tool: 'Shadcn',
        action: 'get_component',
        params: { name: 'button' }
      };

      const response = await router.handleToolCall(request);

      expect(response.tool).toBe('Shadcn');
    });

    it('should handle case-insensitive tool names', async () => {
      const request: ToolCallRequest = {
        tool: 'playwright',
        action: 'screenshot',
        params: { selector: '.app' }
      };

      const response = await router.handleToolCall(request);

      expect(response.success).toBeDefined();
    });

    it('should register custom tools', async () => {
      const customExecutor = {
        execute: vi.fn().mockResolvedValue({ success: true, data: 'ok' })
      };

      router.registerTool('CustomTool', customExecutor);

      const request: ToolCallRequest = {
        tool: 'CustomTool',
        action: 'test',
        params: {}
      };

      const response = await router.handleToolCall(request);

      expect(customExecutor.execute).toHaveBeenCalled();
      expect(response.success).toBe(true);
    });

    it('should unregister tools', () => {
      const customExecutor = {
        execute: vi.fn()
      };

      router.registerTool('TempTool', customExecutor);
      expect(router.isToolRegistered('TempTool')).toBe(true);

      router.unregisterTool('TempTool');
      expect(router.isToolRegistered('TempTool')).toBe(false);
    });
  });

  // ============================================================================
  // Request Routing (10 tests)
  // ============================================================================
  describe('Request Routing', () => {
    it('should route by tool name', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'get_file',
        params: { path: 'README.md' }
      };

      const executeSpy = vi.spyOn(router['githubMCP'], 'execute');

      await router.handleToolCall(request);

      expect(executeSpy).toHaveBeenCalled();
    });

    it('should route by capability', async () => {
      const request: ToolCallRequest = {
        tool: 'browser',
        action: 'screenshot',
        params: { selector: '.app' }
      };

      const selectedTool = await router.routeByCapability(request);

      expect(['Playwright', 'Chrome']).toContain(selectedTool);
    });

    it('should load balance requests across multiple tools', async () => {
      const requests: ToolCallRequest[] = Array(10).fill(null).map((_, i) => ({
        tool: 'browser',
        action: 'navigate',
        params: { url: `https://example${i}.com` }
      }));

      const toolsUsed = new Set<string>();

      for (const request of requests) {
        const response = await router.handleToolCall(request);
        toolsUsed.add(response.tool);
      }

      // Should use multiple tools (load balancing)
      expect(toolsUsed.size).toBeGreaterThan(1);
    });

    it('should handle routing errors', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'invalid_action',
        params: {}
      };

      const response = await router.handleToolCall(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should validate request format', async () => {
      const invalidRequest: any = {
        // Missing required fields
        params: {}
      };

      await expect(async () => {
        await router.handleToolCall(invalidRequest);
      }).rejects.toThrow();
    });

    it('should include agentId in routing context', async () => {
      const request: ToolCallRequest = {
        tool: 'Playwright',
        action: 'screenshot',
        params: { selector: '.app' },
        agentId: 'james-frontend'
      };

      const response = await router.handleToolCall(request);

      expect(response).toHaveProperty('executionTime');
      const stats = router.getStats();
      expect(stats.callsByAgent['james-frontend']).toBeGreaterThan(0);
    });

    it('should include taskId for tracking', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'list_prs',
        params: { repo: 'test/repo' },
        taskId: 'task-123'
      };

      const response = await router.handleToolCall(request);

      expect(response).toHaveProperty('executionTime');
    });

    it('should support batch routing', async () => {
      const requests: ToolCallRequest[] = [
        { tool: 'Playwright', action: 'screenshot', params: { selector: '.app' } },
        { tool: 'GitHub', action: 'get_file', params: { path: 'README.md' } },
        { tool: 'Exa', action: 'search', params: { query: 'test' } }
      ];

      const responses = await router.handleBatchToolCalls(requests);

      expect(responses).toHaveLength(3);
      expect(responses.every(r => r.success !== undefined)).toBe(true);
    });

    it('should emit routing_started event', (done) => {
      router.on('routing_started', (data) => {
        expect(data).toHaveProperty('tool');
        expect(data).toHaveProperty('action');
        done();
      });

      const request: ToolCallRequest = {
        tool: 'Playwright',
        action: 'click',
        params: { selector: 'button' }
      };

      router.handleToolCall(request);
    });

    it('should emit routing_completed event', (done) => {
      router.on('routing_completed', (data) => {
        expect(data).toHaveProperty('tool');
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('executionTime');
        done();
      });

      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'get_repo',
        params: { repo: 'test/repo' }
      };

      router.handleToolCall(request);
    });
  });

  // ============================================================================
  // Tool Discovery (8 tests)
  // ============================================================================
  describe('Tool Discovery', () => {
    it('should discover available tools', async () => {
      const tools = await router.discoverTools();

      expect(tools).toBeInstanceOf(Array);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools).toContain('Playwright');
      expect(tools).toContain('GitHub');
    });

    it('should register new tools dynamically', () => {
      const newExecutor = {
        execute: vi.fn().mockResolvedValue({ success: true })
      };

      router.registerTool('NewTool', newExecutor);

      expect(router.isToolRegistered('NewTool')).toBe(true);
    });

    it('should unregister tools', () => {
      const executor = {
        execute: vi.fn()
      };

      router.registerTool('TempTool', executor);
      router.unregisterTool('TempTool');

      expect(router.isToolRegistered('TempTool')).toBe(false);
    });

    it('should list tool capabilities', async () => {
      const capabilities = await router.getToolCapabilities('Playwright');

      expect(capabilities).toBeInstanceOf(Array);
      expect(capabilities.length).toBeGreaterThan(0);
      expect(capabilities).toContain('screenshot');
      expect(capabilities).toContain('click');
      expect(capabilities).toContain('navigate');
    });

    it('should validate tool availability', async () => {
      const isAvailable = await router.isToolAvailable('GitHub');

      expect(typeof isAvailable).toBe('boolean');
    });

    it('should check tool health status', async () => {
      const health = await router.checkToolHealth('Playwright');

      expect(health).toHaveProperty('available');
      expect(health).toHaveProperty('responseTime');
    });

    it('should get tool metadata', async () => {
      const metadata = await router.getToolMetadata('Exa');

      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('capabilities');
    });

    it('should emit tool_registered event', (done) => {
      router.on('tool_registered', (data) => {
        expect(data).toHaveProperty('toolName');
        done();
      });

      const executor = {
        execute: vi.fn()
      };

      router.registerTool('EventTestTool', executor);
    });
  });

  // ============================================================================
  // Performance Optimization (10 tests)
  // ============================================================================
  describe('Performance Optimization', () => {
    it('should cache routing decisions', async () => {
      const request: ToolCallRequest = {
        tool: 'Playwright',
        action: 'screenshot',
        params: { selector: '.app' }
      };

      // First call
      const start1 = Date.now();
      await router.handleToolCall(request);
      const time1 = Date.now() - start1;

      // Second call (should use cache)
      const start2 = Date.now();
      await router.handleToolCall(request);
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThanOrEqual(time1);
    });

    it('should prefer faster tools', async () => {
      // Simulate tool response times
      vi.spyOn(router, 'getToolAverageLatency')
        .mockReturnValueOnce(100)  // Playwright: 100ms
        .mockReturnValueOnce(50);  // Chrome: 50ms

      const request: ToolCallRequest = {
        tool: 'browser',
        action: 'navigate',
        params: { url: 'https://example.com' }
      };

      const selectedTool = await router.selectBestTool(request);

      expect(selectedTool).toBe('Chrome'); // Faster tool selected
    });

    it('should avoid unhealthy tools', async () => {
      // Mark Playwright as unhealthy
      await router.markToolUnhealthy('Playwright');

      const request: ToolCallRequest = {
        tool: 'browser',
        action: 'screenshot',
        params: { selector: '.app' }
      };

      const selectedTool = await router.selectBestTool(request);

      expect(selectedTool).not.toBe('Playwright');
    });

    it('should parallelize when possible', async () => {
      const requests: ToolCallRequest[] = [
        { tool: 'Playwright', action: 'screenshot', params: { selector: '.app' } },
        { tool: 'GitHub', action: 'get_file', params: { path: 'README.md' } },
        { tool: 'Exa', action: 'search', params: { query: 'test' } }
      ];

      const startTime = Date.now();
      const responses = await router.handleParallelToolCalls(requests);
      const elapsed = Date.now() - startTime;

      expect(responses).toHaveLength(3);
      // Parallel execution should be faster than serial
      expect(elapsed).toBeLessThan(1000); // Assuming each takes ~500ms
    });

    it('should implement request queuing', async () => {
      const maxConcurrent = 2;
      router.setMaxConcurrentRequests(maxConcurrent);

      const requests: ToolCallRequest[] = Array(5).fill(null).map((_, i) => ({
        tool: 'Playwright',
        action: 'navigate',
        params: { url: `https://example${i}.com` }
      }));

      const responses = await Promise.all(requests.map(r => router.handleToolCall(r)));

      expect(responses).toHaveLength(5);
      expect(responses.every(r => r.success !== undefined)).toBe(true);
    });

    it('should track execution times', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'get_repo',
        params: { repo: 'test/repo' }
      };

      const response = await router.handleToolCall(request);

      expect(response.executionTime).toBeGreaterThan(0);
      expect(typeof response.executionTime).toBe('number');
    });

    it('should calculate average execution time per tool', async () => {
      // Execute multiple requests
      for (let i = 0; i < 3; i++) {
        await router.handleToolCall({
          tool: 'Playwright',
          action: 'screenshot',
          params: { selector: '.app' }
        });
      }

      const avgTime = router.getToolAverageLatency('Playwright');

      expect(avgTime).toBeGreaterThan(0);
      expect(typeof avgTime).toBe('number');
    });

    it('should implement tool warmup', async () => {
      const tools = ['Playwright', 'GitHub', 'Chrome'];

      await router.warmupTools(tools);

      // All tools should be ready
      for (const tool of tools) {
        const isReady = await router.isToolReady(tool);
        expect(isReady).toBe(true);
      }
    });

    it('should use connection pooling', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'list_repos',
        params: { org: 'test-org' }
      };

      // Multiple requests should reuse connections
      await router.handleToolCall(request);
      await router.handleToolCall(request);
      await router.handleToolCall(request);

      const poolStats = router.getConnectionPoolStats();
      expect(poolStats.reusedConnections).toBeGreaterThan(0);
    });

    it('should throttle requests per tool', async () => {
      router.setToolRateLimit('Playwright', 2, 1000); // 2 requests per second

      const requests: ToolCallRequest[] = Array(5).fill(null).map(() => ({
        tool: 'Playwright',
        action: 'screenshot',
        params: { selector: '.app' }
      }));

      const startTime = Date.now();
      await Promise.all(requests.map(r => router.handleToolCall(r)));
      const elapsed = Date.now() - startTime;

      // Should take at least 2 seconds (throttled)
      expect(elapsed).toBeGreaterThanOrEqual(2000);
    });
  });

  // ============================================================================
  // Error Handling (5 tests)
  // ============================================================================
  describe('Error Handling', () => {
    it('should handle tool timeout', async () => {
      const request: ToolCallRequest = {
        tool: 'Playwright',
        action: 'navigate',
        params: { url: 'https://slow-site.com' }
      };

      // Mock slow response
      vi.spyOn(router['playwrightMCP'], 'execute').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        return { success: true, data: 'ok' };
      });

      const response = await router.handleToolCall(request, { timeout: 500 });

      expect(response.success).toBe(false);
      expect(response.error).toContain('timeout');
    });

    it('should retry on transient errors', async () => {
      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'get_file',
        params: { path: 'README.md' }
      };

      let attemptCount = 0;
      vi.spyOn(router['githubMCP'], 'execute').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Transient failure');
        }
        return { success: true, data: 'ok' };
      });

      const response = await router.handleToolCall(request, { retries: 3 });

      expect(response.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should circuit break failed tools', async () => {
      const request: ToolCallRequest = {
        tool: 'Chrome',
        action: 'navigate',
        params: { url: 'https://example.com' }
      };

      // Fail 5 times to open circuit
      vi.spyOn(router, 'handleToolCall').mockRejectedValue(new Error('Failed'));

      for (let i = 0; i < 5; i++) {
        try {
          await router.handleToolCall(request);
        } catch (e) {
          // Ignore
        }
      }

      const isCircuitOpen = router.isCircuitOpen('Chrome');
      expect(isCircuitOpen).toBe(true);
    });

    it('should provide detailed error information', async () => {
      const request: ToolCallRequest = {
        tool: 'NonExistent',
        action: 'test',
        params: {}
      };

      const response = await router.handleToolCall(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error).toContain('NonExistent');
    });

    it('should emit error events', (done) => {
      router.on('routing_error', (data) => {
        expect(data).toHaveProperty('tool');
        expect(data).toHaveProperty('error');
        done();
      });

      const request: ToolCallRequest = {
        tool: 'GitHub',
        action: 'invalid',
        params: {}
      };

      router.handleToolCall(request);
    });
  });
});
