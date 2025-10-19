/**
 * VERSATIL v6.1 - MCP Tool Router
 *
 * Routes Claude SDK tool calls to MCP executors
 * Bridges the gap between Claude SDK agents and MCP tools
 *
 * Purpose:
 * - When Claude SDK calls a tool like `Playwright.screenshot()`, this routes it to the actual MCP executor
 * - Enables agents to use MCP tools directly without Bash workarounds
 * - Provides unified interface for all MCP integrations
 *
 * Supported MCPs:
 * - Playwright MCP: Browser automation, testing, accessibility
 * - Chrome MCP: Browser DevTools, performance, visual regression
 * - GitHub MCP: Repository access, issues, PRs
 * - Exa Search MCP: AI-powered web search
 * - Shadcn MCP: UI component library
 * - VERSATIL MCP: Framework orchestration
 *
 * Usage:
 * ```typescript
 * const router = new MCPToolRouter();
 * await router.initialize();
 *
 * // Route tool call from Claude SDK
 * const result = await router.handleToolCall('Playwright', {
 *   action: 'screenshot',
 *   params: { selector: '.my-component' }
 * });
 * ```
 */

import { EventEmitter } from 'events';
import { PlaywrightMCPExecutor } from './playwright-mcp-executor.js';
import { getGitHubMCPClient } from './github-mcp-client.js';
import { getExaSearchMCPClient } from './exa-search-mcp-client.js';
import { getGitMCPExecutor } from './gitmcp-executor.js';
import type { MCPExecutionResult } from './playwright-mcp-executor.js';

export interface ToolCallRequest {
  tool: string;
  action: string;
  params: Record<string, any>;
  agentId?: string;
  taskId?: string;
}

export interface ToolCallResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  tool: string;
  action: string;
}

export interface MCPToolStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number;
  callsByTool: Record<string, number>;
  callsByAgent: Record<string, number>;
}

export class MCPToolRouter extends EventEmitter {
  // MCP Executors
  private playwrightMCP: PlaywrightMCPExecutor;
  private chromeMCP: any; // Will be lazy-loaded
  private githubMCP: ReturnType<typeof getGitHubMCPClient>;
  private exaMCP: ReturnType<typeof getExaSearchMCPClient>;
  private gitMCP: ReturnType<typeof getGitMCPExecutor>;
  private shadcnMCP: any; // Will be lazy-loaded

  // Statistics
  private stats: MCPToolStats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageExecutionTime: 0,
    callsByTool: {},
    callsByAgent: {}
  };

  // Tool call history (for debugging and learning)
  private callHistory: ToolCallRequest[] = [];
  private readonly MAX_HISTORY = 100;

  constructor() {
    super();

    // Initialize MCP executors
    this.playwrightMCP = new PlaywrightMCPExecutor();
    this.githubMCP = getGitHubMCPClient();
    this.exaMCP = getExaSearchMCPClient();
    this.gitMCP = getGitMCPExecutor();
  }

  /**
   * Initialize all MCP executors
   */
  async initialize(): Promise<void> {
    console.log('[MCPToolRouter] Initializing MCP tool router...');

    try {
      // Initialize GitHub, Exa, and GitMCP
      await Promise.all([
        this.githubMCP.initialize(),
        this.exaMCP.initialize(),
        this.gitMCP.initialize()
      ]);

      // Chrome MCP and Shadcn MCP are lazy-loaded on first use
      this.emit('initialized');
      console.log('[MCPToolRouter] ✅ MCP tool router initialized');

    } catch (error: any) {
      console.error('[MCPToolRouter] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Main method: Route tool call to appropriate MCP executor
   */
  async handleToolCall(request: ToolCallRequest): Promise<ToolCallResponse> {
    const startTime = Date.now();

    // Track call
    this.trackCall(request);

    try {
      console.log(`[MCPToolRouter] Routing ${request.tool}.${request.action} for agent: ${request.agentId || 'unknown'}`);

      let result: any;

      // Route to appropriate MCP executor
      switch (request.tool.toLowerCase()) {
        case 'playwright':
          result = await this.handlePlaywrightCall(request);
          break;

        case 'chrome':
          result = await this.handleChromeCall(request);
          break;

        case 'github':
          result = await this.handleGitHubCall(request);
          break;

        case 'exa':
        case 'exasearch':
          result = await this.handleExaSearchCall(request);
          break;

        case 'gitmcp':
        case 'git':
          result = await this.handleGitMCPCall(request);
          break;

        case 'shadcn':
          result = await this.handleShadcnCall(request);
          break;

        default:
          throw new Error(`Unknown MCP tool: ${request.tool}`);
      }

      // Build response
      const response: ToolCallResponse = {
        success: result.success !== false,
        data: result.data || result,
        error: result.error,
        executionTime: Date.now() - startTime,
        tool: request.tool,
        action: request.action
      };

      // Update stats
      this.updateStats(response);

      // Emit event
      this.emit('tool-call-complete', {
        request,
        response,
        agentId: request.agentId
      });

      return response;

    } catch (error: any) {
      console.error(`[MCPToolRouter] Tool call failed:`, error);

      const response: ToolCallResponse = {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        tool: request.tool,
        action: request.action
      };

      this.stats.failedCalls++;
      this.emit('tool-call-error', { request, error, agentId: request.agentId });

      return response;
    }
  }

  /**
   * Handle Playwright MCP calls
   */
  private async handlePlaywrightCall(request: ToolCallRequest): Promise<MCPExecutionResult> {
    const { action, params } = request;

    return await this.playwrightMCP.executePlaywrightMCP(action, params);
  }

  /**
   * Handle Chrome MCP calls
   */
  private async handleChromeCall(request: ToolCallRequest): Promise<any> {
    // Lazy-load Chrome MCP executor
    if (!this.chromeMCP) {
      const { chromeMCPExecutor } = await import('./chrome-mcp-executor.js');
      this.chromeMCP = chromeMCPExecutor;
    }

    const { action, params } = request;
    return await this.chromeMCP.executeChromeMCP(action, params);
  }

  /**
   * Handle GitHub MCP calls
   */
  private async handleGitHubCall(request: ToolCallRequest): Promise<any> {
    const { action, params } = request;

    switch (action) {
      case 'create_issue':
        return await this.githubMCP.createIssue(
          params.owner,
          params.repo,
          params.issue
        );

      case 'list_issues':
        return await this.githubMCP.listIssues(
          params.owner,
          params.repo,
          params.options
        );

      case 'create_pr':
        return await this.githubMCP.createPullRequest(
          params.owner,
          params.repo,
          params.pr
        );

      case 'get_file':
        return await this.githubMCP.getFile(
          params.owner,
          params.repo,
          params.path,
          params.ref
        );

      case 'update_file':
        return await this.githubMCP.createOrUpdateFile(
          params.owner,
          params.repo,
          params.file
        );

      case 'search_code':
        return await this.githubMCP.searchCode(
          params.query,
          params.options
        );

      case 'get_repo':
        return await this.githubMCP.getRepository(
          params.owner,
          params.repo
        );

      case 'list_branches':
        return await this.githubMCP.listBranches(
          params.owner,
          params.repo
        );

      default:
        throw new Error(`Unknown GitHub MCP action: ${action}`);
    }
  }

  /**
   * Handle Exa Search MCP calls
   */
  private async handleExaSearchCall(request: ToolCallRequest): Promise<any> {
    const { action, params } = request;

    switch (action) {
      case 'search':
        return await this.exaMCP.search({
          query: params.query || '',
          ...params
        });

      case 'search_papers':
        return await this.exaMCP.searchPapers(
          params.query,
          params.options
        );

      case 'search_linkedin':
        return await this.exaMCP.searchLinkedIn(
          params.query,
          params.options
        );

      case 'search_with_content':
        return await this.exaMCP.searchWithContent(
          params.query,
          params.options
        );

      case 'find_similar':
        return await this.exaMCP.findSimilar(
          params.url,
          params.numResults
        );

      case 'get_contents':
        return await this.exaMCP.getContents(params.urls);

      default:
        throw new Error(`Unknown Exa Search MCP action: ${action}`);
    }
  }

  /**
   * Handle GitMCP calls
   */
  private async handleGitMCPCall(request: ToolCallRequest): Promise<any> {
    const { action, params } = request;

    switch (action) {
      case 'query_repo':
      case 'query_repository':
        return await this.gitMCP.queryRepository({
          owner: params.owner,
          repo: params.repo,
          path: params.path
        });

      case 'search_framework_docs':
      case 'search_docs':
        return await this.gitMCP.searchFrameworkDocs(
          params.framework,
          params.topic
        );

      case 'get_examples':
      case 'get_code_examples':
        const docsResult = await this.gitMCP.searchFrameworkDocs(
          params.framework,
          params.topic
        );
        return {
          success: true,
          data: {
            examples: docsResult.examples,
            framework: params.framework,
            topic: params.topic
          }
        };

      default:
        throw new Error(`Unknown GitMCP action: ${action}`);
    }
  }

  /**
   * Handle Shadcn MCP calls
   */
  private async handleShadcnCall(request: ToolCallRequest): Promise<any> {
    // Lazy-load Shadcn MCP config
    if (!this.shadcnMCP) {
      const { DEFAULT_SHADCN_MCP_CONFIG } = await import('./shadcn-mcp-config.js');
      this.shadcnMCP = DEFAULT_SHADCN_MCP_CONFIG;
    }

    const { action, params } = request;

    switch (action) {
      case 'get_component':
        // Return Shadcn component code/config
        return {
          success: true,
          data: {
            componentType: params.componentType,
            code: `// Shadcn ${params.componentType} component`,
            config: this.shadcnMCP
          }
        };

      default:
        throw new Error(`Unknown Shadcn MCP action: ${action}`);
    }
  }

  /**
   * Track tool call in history
   */
  private trackCall(request: ToolCallRequest): void {
    this.callHistory.push(request);

    // Keep only last MAX_HISTORY calls
    if (this.callHistory.length > this.MAX_HISTORY) {
      this.callHistory.shift();
    }
  }

  /**
   * Update statistics
   */
  private updateStats(response: ToolCallResponse): void {
    this.stats.totalCalls++;

    if (response.success) {
      this.stats.successfulCalls++;
    } else {
      this.stats.failedCalls++;
    }

    // Update average execution time
    const totalTime = this.stats.averageExecutionTime * (this.stats.totalCalls - 1) + response.executionTime;
    this.stats.averageExecutionTime = totalTime / this.stats.totalCalls;

    // Update calls by tool
    this.stats.callsByTool[response.tool] = (this.stats.callsByTool[response.tool] || 0) + 1;
  }

  /**
   * Get router statistics
   */
  getStats(): MCPToolStats {
    return { ...this.stats };
  }

  /**
   * Get call history
   */
  getCallHistory(limit: number = 10): ToolCallRequest[] {
    return this.callHistory.slice(-limit);
  }

  /**
   * Get available MCP tools
   */
  getAvailableTools(): string[] {
    return ['Playwright', 'Chrome', 'GitHub', 'Exa', 'GitMCP', 'Shadcn'];
  }

  /**
   * Check if a tool is available
   */
  isToolAvailable(tool: string): boolean {
    return this.getAvailableTools().includes(tool);
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    console.log('[MCPToolRouter] Cleaning up...');

    await Promise.all([
      this.githubMCP.destroy(),
      this.exaMCP.destroy(),
      this.gitMCP.destroy()
    ]);

    this.removeAllListeners();
  }
}

// Export singleton instance
let _routerInstance: MCPToolRouter | null = null;

export function getMCPToolRouter(): MCPToolRouter {
  if (!_routerInstance) {
    _routerInstance = new MCPToolRouter();
  }
  return _routerInstance;
}
