/**
 * VERSATIL Framework - MCP Task Executor
 * Automatically infers and executes MCP tools based on task context
 *
 * Features:
 * - Pattern-based MCP tool inference from task descriptions
 * - Integration with 14 production MCPs (Chrome, GitHub, Semgrep, etc.)
 * - Parallel MCP execution with result aggregation
 * - RAG-based learning of task→tool mappings
 * - Error handling and retry logic
 * - Background execution support
 *
 * MCP Tools Available:
 * - Chrome MCP: Browser automation, visual testing, accessibility audits
 * - GitHub MCP: PR creation, issue management, code search
 * - Semgrep MCP: Security scanning, SAST analysis
 * - Sentry MCP: Error monitoring, performance tracking
 * - AWS MCP: Infrastructure management
 * - PostgreSQL MCP: Database operations
 * - Exa MCP: Web search and research
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { MCPToolManager } from '../mcp-integration.js';
import type { Task } from '../orchestration/epic-workflow-orchestrator.js';

export interface MCPToolInference {
  taskId: string;
  inferredTools: InferredTool[];
  confidence: number; // 0-1
  reasoning: string[];
}

export interface InferredTool {
  mcpName: string;
  toolName: string;
  params: Record<string, any>;
  priority: 'required' | 'recommended' | 'optional';
  confidence: number; // 0-1
  reasoning: string;
}

export interface MCPExecutionResult {
  taskId: string;
  toolResults: ToolResult[];
  success: boolean;
  duration: number; // ms
  errors: string[];
}

export interface ToolResult {
  mcpName: string;
  toolName: string;
  success: boolean;
  output: any;
  error?: string;
  duration: number; // ms
}

export interface MCPTaskPattern {
  taskType: Task['type'];
  keywords: string[];
  mcpTools: Array<{
    mcpName: string;
    toolName: string;
    paramMapping: Record<string, string>; // task field → tool param
  }>;
}

export class MCPTaskExecutor extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private mcpToolManager: MCPToolManager;
  private executionHistory: Map<string, MCPExecutionResult> = new Map();

  // Pattern-based MCP tool mapping
  private readonly TASK_PATTERNS: MCPTaskPattern[] = [
    // Frontend development patterns
    {
      taskType: 'development',
      keywords: ['component', 'ui', 'frontend', 'react', 'vue', 'angular'],
      mcpTools: [
        { mcpName: 'chrome', toolName: 'navigate', paramMapping: { url: 'http://localhost:3000' } },
        { mcpName: 'chrome', toolName: 'accessibility-audit', paramMapping: {} },
        { mcpName: 'semgrep', toolName: 'scan', paramMapping: { pattern: 'javascript' } }
      ]
    },

    // Backend development patterns
    {
      taskType: 'development',
      keywords: ['api', 'backend', 'server', 'endpoint', 'database'],
      mcpTools: [
        { mcpName: 'semgrep', toolName: 'scan', paramMapping: { pattern: 'security' } },
        { mcpName: 'postgresql', toolName: 'query', paramMapping: {} },
        { mcpName: 'sentry', toolName: 'track-error', paramMapping: {} }
      ]
    },

    // Testing patterns
    {
      taskType: 'testing',
      keywords: ['test', 'qa', 'validation', 'e2e', 'integration'],
      mcpTools: [
        { mcpName: 'chrome', toolName: 'screenshot', paramMapping: {} },
        { mcpName: 'chrome', toolName: 'run-lighthouse', paramMapping: {} },
        { mcpName: 'playwright', toolName: 'test', paramMapping: {} }
      ]
    },

    // Security scanning patterns
    {
      taskType: 'development',
      keywords: ['security', 'auth', 'encrypt', 'oauth', 'vulnerability'],
      mcpTools: [
        { mcpName: 'semgrep', toolName: 'scan', paramMapping: { pattern: 'owasp-top-10' } },
        { mcpName: 'semgrep', toolName: 'security-audit', paramMapping: {} },
        { mcpName: 'github', toolName: 'security-scan', paramMapping: {} }
      ]
    },

    // Documentation patterns
    {
      taskType: 'documentation',
      keywords: ['docs', 'readme', 'documentation', 'guide'],
      mcpTools: [
        { mcpName: 'github', toolName: 'update-file', paramMapping: { path: 'README.md' } },
        { mcpName: 'shadcn', toolName: 'generate-docs', paramMapping: {} }
      ]
    },

    // DevOps patterns
    {
      taskType: 'devops',
      keywords: ['deploy', 'ci/cd', 'infrastructure', 'docker', 'kubernetes'],
      mcpTools: [
        { mcpName: 'aws', toolName: 'deploy', paramMapping: {} },
        { mcpName: 'github', toolName: 'create-workflow', paramMapping: {} }
      ]
    },

    // Research patterns
    {
      taskType: 'research',
      keywords: ['research', 'investigate', 'analyze', 'study'],
      mcpTools: [
        { mcpName: 'exa', toolName: 'search', paramMapping: {} },
        { mcpName: 'github', toolName: 'search-code', paramMapping: {} }
      ]
    }
  ];

  // Available MCP tools (from mcp-integration.ts)
  private readonly AVAILABLE_MCPS = [
    'chrome', 'playwright', 'github', 'semgrep', 'sentry',
    'aws', 'postgresql', 'redis', 'exa', 'shadcn',
    'slack', 'linear', 'figma', 'vercel'
  ];

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super();
    this.vectorStore = vectorStore || new EnhancedVectorMemoryStore();
    this.mcpToolManager = new MCPToolManager();
  }

  async initialize(): Promise<void> {
    console.log('🔧 MCP Task Executor initializing...');

    // Load historical task→tool mappings from RAG
    await this.loadHistoricalMappings();

    this.emit('executor:initialized');
    console.log('✅ MCP Task Executor ready');
  }

  /**
   * Infer MCP tools for a task (main method)
   */
  async inferTools(task: Task): Promise<MCPToolInference> {
    console.log(`🔧 Inferring MCP tools for task: ${task.title}`);

    const inferredTools: InferredTool[] = [];
    const reasoning: string[] = [];

    // STEP 1: Pattern matching
    const matchedPatterns = this.matchTaskPatterns(task);

    for (const pattern of matchedPatterns) {
      reasoning.push(`Matched pattern: ${pattern.taskType} with keywords ${pattern.keywords.join(', ')}`);

      for (const tool of pattern.mcpTools) {
        inferredTools.push({
          mcpName: tool.mcpName,
          toolName: tool.toolName,
          params: this.mapTaskToParams(task, tool.paramMapping),
          priority: 'recommended',
          confidence: 0.8,
          reasoning: `Pattern-based inference from task type ${pattern.taskType}`
        });
      }
    }

    // STEP 2: RAG-based inference (historical patterns)
    const ragTools = await this.queryRAGForTools(task);
    for (const ragTool of ragTools) {
      // Avoid duplicates
      if (!inferredTools.some(t => t.mcpName === ragTool.mcpName && t.toolName === ragTool.toolName)) {
        inferredTools.push(ragTool);
        reasoning.push(`RAG pattern match: ${ragTool.mcpName}.${ragTool.toolName} (${(ragTool.confidence * 100).toFixed(0)}% similar)`);
      }
    }

    // STEP 3: Keyword-based inference
    const keywordTools = this.inferFromKeywords(task);
    for (const kwTool of keywordTools) {
      if (!inferredTools.some(t => t.mcpName === kwTool.mcpName && t.toolName === kwTool.toolName)) {
        inferredTools.push(kwTool);
        reasoning.push(`Keyword inference: "${kwTool.reasoning}"`);
      }
    }

    // Calculate overall confidence
    const confidence = inferredTools.length > 0
      ? inferredTools.reduce((sum, t) => sum + t.confidence, 0) / inferredTools.length
      : 0;

    const inference: MCPToolInference = {
      taskId: task.id,
      inferredTools,
      confidence,
      reasoning
    };

    console.log(`   ✅ Inferred ${inferredTools.length} MCP tools (${(confidence * 100).toFixed(0)}% confidence)`);
    for (const tool of inferredTools) {
      console.log(`      - ${tool.mcpName}.${tool.toolName} (${tool.priority})`);
    }

    return inference;
  }

  /**
   * Match task against predefined patterns
   */
  private matchTaskPatterns(task: Task): MCPTaskPattern[] {
    const matchedPatterns: MCPTaskPattern[] = [];
    const taskText = `${task.title} ${task.description}`.toLowerCase();

    for (const pattern of this.TASK_PATTERNS) {
      // Check task type match
      if (pattern.taskType === task.type) {
        // Check keyword match
        const matchedKeywords = pattern.keywords.filter(kw => taskText.includes(kw));
        if (matchedKeywords.length > 0) {
          matchedPatterns.push(pattern);
        }
      }
    }

    return matchedPatterns;
  }

  /**
   * Map task properties to tool parameters
   */
  private mapTaskToParams(task: Task, paramMapping: Record<string, string>): Record<string, any> {
    const params: Record<string, any> = {};

    for (const [paramName, taskField] of Object.entries(paramMapping)) {
      // Static value (starts with literal value)
      if (!taskField.startsWith('task.')) {
        params[paramName] = taskField;
        continue;
      }

      // Dynamic value from task
      const field = taskField.replace('task.', '');
      if (field === 'files') {
        params[paramName] = task.files;
      } else if (field === 'description') {
        params[paramName] = task.description;
      } else if (field === 'title') {
        params[paramName] = task.title;
      }
    }

    return params;
  }

  /**
   * Query RAG for historical tool mappings
   */
  private async queryRAGForTools(task: Task): Promise<InferredTool[]> {
    const query = `${task.type} task: ${task.description}`;

    try {
      const results = await this.vectorStore.queryMemory(query, 'mcp-task-mappings', 5);

      return results
        .filter(r => r.similarity > 0.7)
        .map(r => ({
          mcpName: r.metadata?.mcpName || 'unknown',
          toolName: r.metadata?.toolName || 'unknown',
          params: r.metadata?.params || {},
          priority: 'recommended' as const,
          confidence: r.similarity,
          reasoning: `Historical pattern match (${(r.similarity * 100).toFixed(0)}% similar)`
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Infer tools from keywords in task description
   */
  private inferFromKeywords(task: Task): InferredTool[] {
    const tools: InferredTool[] = [];
    const taskText = `${task.title} ${task.description}`.toLowerCase();

    // Keyword → MCP tool mapping
    const keywordMappings: Array<{ keywords: string[]; mcp: string; tool: string; reasoning: string }> = [
      { keywords: ['screenshot', 'visual'], mcp: 'chrome', tool: 'screenshot', reasoning: 'screenshot keyword' },
      { keywords: ['lighthouse', 'performance'], mcp: 'chrome', tool: 'run-lighthouse', reasoning: 'performance keyword' },
      { keywords: ['accessibility', 'a11y', 'wcag'], mcp: 'chrome', tool: 'accessibility-audit', reasoning: 'accessibility keyword' },
      { keywords: ['pr', 'pull request'], mcp: 'github', tool: 'create-pr', reasoning: 'PR keyword' },
      { keywords: ['issue', 'bug report'], mcp: 'github', tool: 'create-issue', reasoning: 'issue keyword' },
      { keywords: ['security scan', 'vulnerability'], mcp: 'semgrep', tool: 'scan', reasoning: 'security keyword' },
      { keywords: ['error tracking', 'monitor'], mcp: 'sentry', tool: 'track-error', reasoning: 'monitoring keyword' },
      { keywords: ['deploy', 'deployment'], mcp: 'aws', tool: 'deploy', reasoning: 'deployment keyword' },
      { keywords: ['database', 'query', 'sql'], mcp: 'postgresql', tool: 'query', reasoning: 'database keyword' },
      { keywords: ['web search', 'research'], mcp: 'exa', tool: 'search', reasoning: 'research keyword' }
    ];

    for (const mapping of keywordMappings) {
      const matchedKeywords = mapping.keywords.filter(kw => taskText.includes(kw));
      if (matchedKeywords.length > 0) {
        tools.push({
          mcpName: mapping.mcp,
          toolName: mapping.tool,
          params: {},
          priority: 'optional',
          confidence: 0.6,
          reasoning: mapping.reasoning
        });
      }
    }

    return tools;
  }

  /**
   * Execute MCP tools for a task
   */
  async executeTools(task: Task, inference: MCPToolInference): Promise<MCPExecutionResult> {
    console.log(`🔧 Executing ${inference.inferredTools.length} MCP tools for task: ${task.id}`);

    const startTime = Date.now();
    const toolResults: ToolResult[] = [];
    const errors: string[] = [];

    // Execute required and recommended tools
    const toolsToExecute = inference.inferredTools.filter(t =>
      t.priority === 'required' || t.priority === 'recommended'
    );

    // Execute in parallel
    const promises = toolsToExecute.map(tool => this.executeTool(tool, task));
    const results = await Promise.allSettled(promises);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const tool = toolsToExecute[i];

      if (result.status === 'fulfilled') {
        toolResults.push(result.value);
      } else {
        const error = `${tool.mcpName}.${tool.toolName} failed: ${result.reason}`;
        errors.push(error);
        toolResults.push({
          mcpName: tool.mcpName,
          toolName: tool.toolName,
          success: false,
          output: null,
          error: result.reason.message || result.reason,
          duration: 0
        });
      }
    }

    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    const executionResult: MCPExecutionResult = {
      taskId: task.id,
      toolResults,
      success,
      duration,
      errors
    };

    // Store in history and RAG
    this.executionHistory.set(task.id, executionResult);
    await this.storeExecutionPattern(task, inference, executionResult);

    this.emit('execution:completed', {
      taskId: task.id,
      toolsExecuted: toolResults.length,
      success,
      duration
    });

    console.log(`   ${success ? '✅' : '⚠️ '} Execution ${success ? 'complete' : 'partial'}: ${toolResults.length} tools (${duration}ms)`);

    return executionResult;
  }

  /**
   * Execute single MCP tool
   */
  private async executeTool(tool: InferredTool, task: Task): Promise<ToolResult> {
    const startTime = Date.now();

    console.log(`      🔧 Executing ${tool.mcpName}.${tool.toolName}...`);

    try {
      // Create AgentActivationContext from Task
      const context = this.createActivationContext(tool, task);

      // Execute real MCP tool via MCPToolManager
      const mcpResult = await this.mcpToolManager.executeMCPTool(
        `${tool.mcpName}_mcp`,
        context
      );

      const duration = Date.now() - startTime;

      if (mcpResult.success) {
        console.log(`         ✅ Complete (${duration}ms)`);
      } else {
        console.log(`         ⚠️  Partial success (${duration}ms): ${mcpResult.error}`);
      }

      return {
        mcpName: tool.mcpName,
        toolName: tool.toolName,
        success: mcpResult.success,
        output: mcpResult.data,
        error: mcpResult.error,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.log(`         ❌ Failed: ${error.message}`);

      return {
        mcpName: tool.mcpName,
        toolName: tool.toolName,
        success: false,
        output: null,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Create AgentActivationContext from Task and InferredTool
   */
  private createActivationContext(tool: InferredTool, task: Task): any {
    return {
      trigger: {
        agent: 'mcp-task-executor',
        type: 'mcp_tool_execution',
        filePath: task.files?.[0] || '',
        event: 'task_execution'
      },
      filePath: task.files?.[0] || '',
      userRequest: `${task.title}: ${task.description}`,
      contextClarity: 'clear' as const,
      matchedKeywords: [tool.mcpName, tool.toolName],
      urgency: this.mapPriorityToUrgency(tool.priority),
      // Pass tool-specific params
      toolParams: tool.params,
      taskContext: {
        taskId: task.id,
        taskType: task.type,
        taskTitle: task.title,
        taskDescription: task.description,
        files: task.files,
        dependencies: task.dependencies
      }
    };
  }

  /**
   * Map tool priority to urgency level
   */
  private mapPriorityToUrgency(priority: 'required' | 'recommended' | 'optional'): 'low' | 'medium' | 'high' {
    switch (priority) {
      case 'required':
        return 'high';
      case 'recommended':
        return 'medium';
      case 'optional':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Store execution pattern in RAG
   */
  private async storeExecutionPattern(
    task: Task,
    inference: MCPToolInference,
    result: MCPExecutionResult
  ): Promise<void> {
    for (const tool of inference.inferredTools) {
      const pattern = {
        taskType: task.type,
        taskDescription: task.description,
        mcpName: tool.mcpName,
        toolName: tool.toolName,
        params: tool.params,
        success: result.toolResults.find(r => r.mcpName === tool.mcpName && r.toolName === tool.toolName)?.success || false,
        timestamp: Date.now()
      };

      try {
        await this.vectorStore.storeMemory(
          `${task.type} task: ${task.description}`,
          'mcp-task-mappings',
          pattern
        );
      } catch (error) {
        console.warn('Failed to store MCP execution pattern in RAG:', error);
      }
    }
  }

  /**
   * Load historical mappings from RAG
   */
  private async loadHistoricalMappings(): Promise<void> {
    try {
      const mappings = await this.vectorStore.queryMemory('mcp task mappings', 'mcp-task-mappings', 100);
      console.log(`   📚 Loaded ${mappings.length} historical MCP task mappings from RAG`);
    } catch (error) {
      console.warn('   ⚠️  Failed to load historical mappings (starting fresh)');
    }
  }

  /**
   * Get execution result
   */
  getResult(taskId: string): MCPExecutionResult | undefined {
    return this.executionHistory.get(taskId);
  }

  /**
   * Execute tools in background (non-blocking)
   */
  async executeInBackground(task: Task, inference: MCPToolInference): Promise<string> {
    this.executeTools(task, inference).catch(error => {
      console.error(`Background MCP execution failed for ${task.id}:`, error);
    });

    return task.id;
  }

  /**
   * Shutdown executor
   */
  async shutdown(): Promise<void> {
    this.executionHistory.clear();
    this.emit('executor:shutdown');
    console.log('🛑 MCP Task Executor shut down');
  }
}

// Export singleton instance
export const globalMCPTaskExecutor = new MCPTaskExecutor();
