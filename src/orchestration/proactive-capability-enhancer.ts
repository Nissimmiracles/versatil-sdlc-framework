/**
 * VERSATIL v6.1 - Proactive Capability Enhancer
 *
 * Enables orchestrators to:
 * 1. Detect capability gaps in agents based on task requirements
 * 2. Dynamically assign MCP tools to agents/sub-agents
 * 3. Proactively enhance agents before task execution
 * 4. Propagate tool inheritance to sub-agents
 *
 * Purpose: Solve the critical gap where orchestrators don't have logic to
 * enhance agent capabilities based on task context.
 *
 * Example:
 * - Task: "Test user login flow"
 * - Analyzer detects: Needs browser automation
 * - Enhancer assigns: Playwright + Chrome MCP to Maria-QA
 * - Sub-agents inherit: All sub-maria instances get same tools
 */

import { EventEmitter } from 'events';
import type { Task } from './epic-workflow-orchestrator.js';
import type { SubAgent } from './conflict-resolution-engine.js';
import type { AgentActivationContext } from '../agents/core/base-agent.js';

export interface RequiredCapabilities {
  taskId: string;
  taskType: string;
  detectedRequirements: {
    browserAutomation?: boolean;
    apiTesting?: boolean;
    databaseAccess?: boolean;
    aiResearch?: boolean;
    repositoryAccess?: boolean;
    visualDesign?: boolean;
  };
  recommendedTools: string[];
  recommendedAgents: string[];
  confidence: number; // 0-1
}

export interface CapabilityGap {
  agentType: string;
  missingCapabilities: string[];
  requiredTools: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export interface EnhancementResult {
  agentType: string;
  toolsAdded: string[];
  capabilitiesGranted: string[];
  success: boolean;
  error?: string;
}

export interface CapabilityEnhancerConfig {
  autoEnhance?: boolean; // Automatically enhance agents when gaps detected
  inheritToSubAgents?: boolean; // Propagate enhancements to sub-agents
  maxToolsPerAgent?: number; // Limit tools to prevent overload
}

export class ProactiveCapabilityEnhancer extends EventEmitter {
  private enhancementHistory: Map<string, EnhancementResult[]> = new Map();
  private agentToolRegistry: Map<string, Set<string>> = new Map();
  private config: Required<CapabilityEnhancerConfig>;

  constructor(config?: CapabilityEnhancerConfig) {
    super();
    this.config = {
      autoEnhance: config?.autoEnhance !== false,
      inheritToSubAgents: config?.inheritToSubAgents !== false,
      maxToolsPerAgent: config?.maxToolsPerAgent || 15
    };
  }

  /**
   * Analyze task requirements and detect needed capabilities
   */
  async analyzeTaskRequirements(task: Task): Promise<RequiredCapabilities> {
    console.log(`[CapabilityEnhancer] Analyzing task requirements: ${task.id}`);

    const requirements: RequiredCapabilities = {
      taskId: task.id,
      taskType: task.type,
      detectedRequirements: {},
      recommendedTools: [],
      recommendedAgents: [],
      confidence: 0
    };

    let signals = 0;

    // Analyze task name and description
    const taskText = `${task.name} ${task.description}`.toLowerCase();

    // Browser automation detection
    if (this.detectBrowserAutomation(taskText, task.files)) {
      requirements.detectedRequirements.browserAutomation = true;
      requirements.recommendedTools.push('Playwright', 'Chrome');
      requirements.recommendedAgents.push('james-frontend', 'maria-qa');
      signals++;
    }

    // API testing detection
    if (this.detectAPITesting(taskText, task.files)) {
      requirements.detectedRequirements.apiTesting = true;
      requirements.recommendedTools.push('Playwright', 'Bash');
      requirements.recommendedAgents.push('marcus-backend', 'maria-qa');
      signals++;
    }

    // Database access detection
    if (this.detectDatabaseAccess(taskText, task.files)) {
      requirements.detectedRequirements.databaseAccess = true;
      requirements.recommendedTools.push('Bash'); // For database CLI tools
      requirements.recommendedAgents.push('marcus-backend');
      signals++;
    }

    // AI research detection
    if (this.detectAIResearch(taskText)) {
      requirements.detectedRequirements.aiResearch = true;
      requirements.recommendedTools.push('Exa');
      requirements.recommendedAgents.push('dr-ai-ml', 'alex-ba');
      signals++;
    }

    // Repository access detection
    if (this.detectRepositoryAccess(taskText)) {
      requirements.detectedRequirements.repositoryAccess = true;
      requirements.recommendedTools.push('GitHub');
      requirements.recommendedAgents.push('sarah-pm', 'alex-ba', 'marcus-backend');
      signals++;
    }

    // Visual design detection
    if (this.detectVisualDesign(taskText, task.files)) {
      requirements.detectedRequirements.visualDesign = true;
      requirements.recommendedTools.push('Chrome', 'Playwright');
      requirements.recommendedAgents.push('james-frontend');
      signals++;
    }

    // Calculate confidence based on signals found
    requirements.confidence = Math.min(signals / 3, 1.0); // Max at 3 signals

    this.emit('requirements-analyzed', requirements);

    return requirements;
  }

  /**
   * Detect capability gaps for specific agent
   */
  async detectMissingCapabilities(
    agentType: string,
    task: Task
  ): Promise<CapabilityGap | null> {
    const requirements = await this.analyzeTaskRequirements(task);

    // Get agent's current tools
    const currentTools = this.agentToolRegistry.get(agentType) || new Set();

    // Determine which tools are missing
    const missingTools = requirements.recommendedTools.filter(
      tool => !currentTools.has(tool)
    );

    if (missingTools.length === 0) {
      return null; // No gaps detected
    }

    // Determine priority based on task type and requirements
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (requirements.detectedRequirements.browserAutomation && task.type === 'testing') {
      priority = 'high';
    }
    if (task.priority >= 8) {
      priority = 'critical';
    }

    const gap: CapabilityGap = {
      agentType,
      missingCapabilities: Object.keys(requirements.detectedRequirements).filter(
        key => requirements.detectedRequirements[key as keyof typeof requirements.detectedRequirements]
      ),
      requiredTools: missingTools,
      priority,
      reason: `Task "${task.name}" requires capabilities not available to ${agentType}`
    };

    this.emit('gap-detected', gap);

    return gap;
  }

  /**
   * Enhance agent with additional tools
   */
  async enhanceAgentWithTools(
    agentType: string,
    tools: string[],
    reason?: string
  ): Promise<EnhancementResult> {
    console.log(`[CapabilityEnhancer] Enhancing ${agentType} with tools: ${tools.join(', ')}`);

    try {
      // Get current tools
      if (!this.agentToolRegistry.has(agentType)) {
        this.agentToolRegistry.set(agentType, new Set());
      }
      const agentTools = this.agentToolRegistry.get(agentType)!;

      // Check tool limit
      const totalTools = agentTools.size + tools.length;
      if (totalTools > this.config.maxToolsPerAgent) {
        throw new Error(
          `Tool limit exceeded (${totalTools} > ${this.config.maxToolsPerAgent})`
        );
      }

      // Add tools
      const toolsAdded: string[] = [];
      for (const tool of tools) {
        if (!agentTools.has(tool)) {
          agentTools.add(tool);
          toolsAdded.push(tool);
        }
      }

      const result: EnhancementResult = {
        agentType,
        toolsAdded,
        capabilitiesGranted: this.mapToolsToCapabilities(toolsAdded),
        success: true
      };

      // Store in history
      if (!this.enhancementHistory.has(agentType)) {
        this.enhancementHistory.set(agentType, []);
      }
      this.enhancementHistory.get(agentType)!.push(result);

      this.emit('agent-enhanced', {
        ...result,
        reason: reason || 'Task requirement detected'
      });

      console.log(`   ✅ Enhanced ${agentType} with ${toolsAdded.length} tools`);

      return result;

    } catch (error: any) {
      const result: EnhancementResult = {
        agentType,
        toolsAdded: [],
        capabilitiesGranted: [],
        success: false,
        error: error.message
      };

      console.error(`   ❌ Enhancement failed for ${agentType}:`, error.message);

      return result;
    }
  }

  /**
   * Inherit tools from parent agent to sub-agent
   */
  async inheritToolsToSubAgent(
    parentAgentType: string,
    subAgentId: string
  ): Promise<EnhancementResult> {
    console.log(`[CapabilityEnhancer] Inheriting tools from ${parentAgentType} to ${subAgentId}`);

    const parentTools = this.agentToolRegistry.get(parentAgentType);
    if (!parentTools || parentTools.size === 0) {
      return {
        agentType: subAgentId,
        toolsAdded: [],
        capabilitiesGranted: [],
        success: false,
        error: 'Parent agent has no tools to inherit'
      };
    }

    // Sub-agents inherit all parent tools
    const tools = Array.from(parentTools);
    return await this.enhanceAgentWithTools(
      subAgentId,
      tools,
      `Inherited from parent agent ${parentAgentType}`
    );
  }

  /**
   * Proactively enhance agent before task execution
   */
  async proactiveEnhancement(
    agentType: string,
    task: Task
  ): Promise<EnhancementResult | null> {
    if (!this.config.autoEnhance) {
      return null;
    }

    console.log(`[CapabilityEnhancer] Proactive enhancement check for ${agentType}`);

    // Detect gaps
    const gap = await this.detectMissingCapabilities(agentType, task);
    if (!gap) {
      console.log(`   ℹ️  No capability gaps detected for ${agentType}`);
      return null;
    }

    // Auto-enhance
    console.log(`   ⚠️  Capability gap detected: ${gap.reason}`);
    return await this.enhanceAgentWithTools(
      agentType,
      gap.requiredTools,
      gap.reason
    );
  }

  /**
   * Get agent's current tools
   */
  getAgentTools(agentType: string): string[] {
    return Array.from(this.agentToolRegistry.get(agentType) || []);
  }

  /**
   * Get enhancement history for agent
   */
  getEnhancementHistory(agentType: string): EnhancementResult[] {
    return this.enhancementHistory.get(agentType) || [];
  }

  /**
   * Reset agent tools to baseline
   */
  resetAgentTools(agentType: string): void {
    this.agentToolRegistry.set(agentType, new Set(['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep']));
    console.log(`[CapabilityEnhancer] Reset ${agentType} tools to baseline`);
  }

  // ========== Detection Helpers ==========

  private detectBrowserAutomation(taskText: string, files?: string[]): boolean {
    const keywords = ['ui', 'frontend', 'component', 'visual', 'screenshot', 'e2e', 'browser', 'click', 'navigate'];
    const filePatterns = ['.tsx', '.jsx', '.test.', 'spec.'];

    return keywords.some(kw => taskText.includes(kw)) ||
      (files?.some(f => filePatterns.some(p => f.includes(p))) ?? false);
  }

  private detectAPITesting(taskText: string, files?: string[]): boolean {
    const keywords = ['api', 'endpoint', 'route', 'request', 'response', 'http', 'rest', 'graphql'];
    const filePatterns = ['api/', 'routes/', '.api.'];

    return keywords.some(kw => taskText.includes(kw)) ||
      (files?.some(f => filePatterns.some(p => f.includes(p))) ?? false);
  }

  private detectDatabaseAccess(taskText: string, files?: string[]): boolean {
    const keywords = ['database', 'sql', 'query', 'migration', 'schema', 'table', 'postgres', 'mysql'];
    const filePatterns = ['migrations/', 'db/', '.sql'];

    return keywords.some(kw => taskText.includes(kw)) ||
      (files?.some(f => filePatterns.some(p => f.includes(p))) ?? false);
  }

  private detectAIResearch(taskText: string): boolean {
    const keywords = ['research', 'search', 'find', 'learn', 'analyze', 'investigate', 'explore'];
    return keywords.some(kw => taskText.includes(kw));
  }

  private detectRepositoryAccess(taskText: string): boolean {
    const keywords = ['issue', 'pr', 'pull request', 'commit', 'branch', 'merge', 'github', 'repo'];
    return keywords.some(kw => taskText.includes(kw));
  }

  private detectVisualDesign(taskText: string, files?: string[]): boolean {
    const keywords = ['design', 'figma', 'sketch', 'style', 'css', 'layout', 'responsive'];
    const filePatterns = ['.css', '.scss', '.design.'];

    return keywords.some(kw => taskText.includes(kw)) ||
      (files?.some(f => filePatterns.some(p => f.includes(p))) ?? false);
  }

  private mapToolsToCapabilities(tools: string[]): string[] {
    const capabilities: string[] = [];
    const toolMap: Record<string, string[]> = {
      'Playwright': ['browser_automation', 'e2e_testing', 'accessibility_testing'],
      'Chrome': ['browser_devtools', 'performance_monitoring', 'visual_regression'],
      'GitHub': ['repository_access', 'issue_management', 'pr_management'],
      'Exa': ['ai_powered_search', 'web_research', 'content_discovery'],
      'Shadcn': ['ui_components', 'design_system']
    };

    for (const tool of tools) {
      const caps = toolMap[tool];
      if (caps) {
        capabilities.push(...caps);
      }
    }

    return capabilities;
  }
}

// Export singleton instance
let _enhancerInstance: ProactiveCapabilityEnhancer | null = null;

export function getProactiveCapabilityEnhancer(
  config?: CapabilityEnhancerConfig
): ProactiveCapabilityEnhancer {
  if (!_enhancerInstance) {
    _enhancerInstance = new ProactiveCapabilityEnhancer(config);
  }
  return _enhancerInstance;
}
