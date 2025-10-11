/**
 * Proactive Agent Orchestrator
 *
 * Automatically activates and coordinates OPERA agents based on file patterns,
 * code context, and real-time development activity.
 *
 * @module ProactiveAgentOrchestrator
 * @version 2.0.0
 */

import { EventEmitter } from 'events';
import { watch, FSWatcher } from 'fs';
import { join, extname, basename } from 'path';
import { AgentActivationContext, AgentResponse } from '../agents/core/base-agent.js';
import { EnhancedMaria } from '../agents/opera/maria-qa/enhanced-maria.js';
import { EnhancedJames } from '../agents/opera/james-frontend/enhanced-james.js';
import { EnhancedMarcus } from '../agents/opera/marcus-backend/enhanced-marcus.js';
import { getProactiveCapabilityEnhancer } from './proactive-capability-enhancer.js';
import type { RequiredCapabilities, EnhancementResult } from './proactive-capability-enhancer.js';

export interface ProactiveAgentConfig {
  enabled: boolean;
  autoActivation: boolean;
  backgroundMonitoring: boolean;
  inlineSuggestions: boolean;
  statuslineUpdates: boolean;
  slashCommandsFallback: boolean;
}

export interface AgentTrigger {
  agentId: string;
  filePatterns: string[];
  codePatterns: string[];
  keywords: string[];
  autoRunOnSave: boolean;
  backgroundAnalysis: boolean;
  proactiveActions: string[];
}

export interface ActiveAgent {
  agentId: string;
  agent: any; // Base agent instance
  context: AgentActivationContext;
  startTime: number;
  progress: number;
  status: 'running' | 'completed' | 'failed';
}

export class ProactiveAgentOrchestrator extends EventEmitter {
  private config: ProactiveAgentConfig;
  private triggers: Map<string, AgentTrigger>;
  private activeAgents: Map<string, ActiveAgent>;
  private watchers: Map<string, FSWatcher>;
  private agents: Map<string, any>;
  private capabilityEnhancer: ReturnType<typeof getProactiveCapabilityEnhancer>; // NEW v6.1

  constructor(config?: Partial<ProactiveAgentConfig>) {
    super();
    this.config = {
      enabled: true,
      autoActivation: true,
      backgroundMonitoring: true,
      inlineSuggestions: true,
      statuslineUpdates: true,
      slashCommandsFallback: true,
      ...config
    };

    this.triggers = new Map();
    this.activeAgents = new Map();
    this.watchers = new Map();
    this.agents = new Map();
    this.capabilityEnhancer = getProactiveCapabilityEnhancer(); // NEW v6.1

    this.initializeAgents();
    this.initializeTriggers();
    this.setupCapabilityEnhancerListeners(); // NEW v6.1
  }

  /**
   * Initialize OPERA agent instances
   */
  private initializeAgents(): void {
    this.agents.set('maria-qa', new EnhancedMaria());
    this.agents.set('james-frontend', new EnhancedJames());
    this.agents.set('marcus-backend', new EnhancedMarcus());
    // Add other agents as needed
  }

  /**
   * Initialize agent activation triggers from .cursor/settings.json
   */
  private initializeTriggers(): void {
    // Maria-QA triggers
    this.triggers.set('maria-qa', {
      agentId: 'maria-qa',
      filePatterns: ['*.test.*', '**/__tests__/**', '**/test/**', '*.spec.*'],
      codePatterns: ['describe(', 'it(', 'test(', 'expect(', 'jest.', 'vitest.'],
      keywords: ['test', 'spec', 'coverage', 'quality'],
      autoRunOnSave: true,
      backgroundAnalysis: true,
      proactiveActions: [
        'test_coverage_analysis',
        'missing_test_detection',
        'assertion_validation',
        'quality_gate_enforcement'
      ]
    });

    // James-Frontend triggers
    this.triggers.set('james-frontend', {
      agentId: 'james-frontend',
      filePatterns: ['*.tsx', '*.jsx', '*.vue', '*.svelte', '*.css', '*.scss'],
      codePatterns: ['useState', 'useEffect', 'component', 'props', 'className'],
      keywords: ['component', 'react', 'vue', 'ui', 'frontend'],
      autoRunOnSave: true,
      backgroundAnalysis: true,
      proactiveActions: [
        'accessibility_check_wcag',
        'component_structure_validation',
        'responsive_design_verification',
        'performance_optimization_suggestions'
      ]
    });

    // Marcus-Backend triggers
    this.triggers.set('marcus-backend', {
      agentId: 'marcus-backend',
      filePatterns: ['*.api.*', '**/routes/**', '**/controllers/**', '**/server/**'],
      codePatterns: ['router.', 'app.', 'express.', 'fastify.', 'async function'],
      keywords: ['api', 'server', 'database', 'auth', 'security'],
      autoRunOnSave: true,
      backgroundAnalysis: true,
      proactiveActions: [
        'security_pattern_validation_owasp',
        'response_time_check_200ms',
        'stress_test_generation',
        'database_query_optimization'
      ]
    });
  }

  /**
   * NEW v6.1: Setup capability enhancer event listeners
   */
  private setupCapabilityEnhancerListeners(): void {
    this.capabilityEnhancer.on('requirements-analyzed', (requirements: RequiredCapabilities) => {
      console.log(`[ProactiveOrchestrator] Task requirements analyzed: ${requirements.recommendedTools.join(', ')}`);
    });

    this.capabilityEnhancer.on('gap-detected', (gap) => {
      console.log(`[ProactiveOrchestrator] Capability gap detected for ${gap.agentType}: ${gap.reason}`);
    });

    this.capabilityEnhancer.on('agent-enhanced', (result: EnhancementResult & { reason: string }) => {
      console.log(`[ProactiveOrchestrator] Agent enhanced: ${result.agentType} + [${result.toolsAdded.join(', ')}]`);
      this.emit('agent-capability-enhanced', result);
    });
  }

  /**
   * NEW v6.1: Proactively enhance agent before activation
   */
  private async enhanceAgentForTask(agentId: string, context: AgentActivationContext): Promise<EnhancementResult | null> {
    // Convert activation context to task format for analysis
    const mockTask = {
      id: `task-${Date.now()}`,
      name: context.userRequest || 'File analysis',
      description: context.userRequest || '',
      type: this.inferTaskType(context),
      priority: context.urgency === 'high' ? 9 : context.urgency === 'medium' ? 5 : 3,
      files: context.filePath ? [context.filePath] : []
    };

    return await this.capabilityEnhancer.proactiveEnhancement(agentId, mockTask as any);
  }

  /**
   * NEW v6.1: Infer task type from context
   */
  private inferTaskType(context: AgentActivationContext): 'development' | 'testing' | 'documentation' | 'deployment' {
    const filePath = context.filePath || '';
    if (filePath.includes('test') || filePath.includes('spec')) return 'testing';
    if (filePath.includes('.md') || filePath.includes('docs')) return 'documentation';
    if (filePath.includes('deploy') || filePath.includes('ci')) return 'deployment';
    return 'development';
  }

  /**
   * Start watching file system for changes
   */
  public startMonitoring(projectPath: string): void {
    if (!this.config.backgroundMonitoring) {
      console.log('Background monitoring disabled');
      return;
    }

    console.log(`🤖 VERSATIL: Starting proactive agent monitoring for ${projectPath}`);

    const watcher = watch(projectPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      // Ignore node_modules, dist, etc.
      if (this.shouldIgnoreFile(filename)) return;

      // Handle file change event
      this.handleFileChange(eventType, join(projectPath, filename));
    });

    this.watchers.set(projectPath, watcher);

    this.emit('monitoring-started', { projectPath });
  }

  /**
   * Stop monitoring file system
   */
  public stopMonitoring(projectPath?: string): void {
    if (projectPath) {
      const watcher = this.watchers.get(projectPath);
      if (watcher) {
        watcher.close();
        this.watchers.delete(projectPath);
      }
    } else {
      // Stop all watchers
      this.watchers.forEach(watcher => watcher.close());
      this.watchers.clear();
    }

    this.emit('monitoring-stopped', { projectPath });
  }

  /**
   * Handle file change event and determine if agent activation is needed
   */
  private async handleFileChange(eventType: string, filePath: string): Promise<void> {
    if (eventType !== 'change') return;

    console.log(`📝 File changed: ${filePath}`);

    // Determine which agent(s) should be activated
    const matchingAgents = this.findMatchingAgents(filePath);

    if (matchingAgents.length === 0) {
      console.log(`No matching agents for ${filePath}`);
      return;
    }

    // Activate matching agents (parallel if Rule 1 enabled)
    await this.activateAgents(matchingAgents, filePath);
  }

  /**
   * Find agents that match the file pattern
   */
  private findMatchingAgents(filePath: string): string[] {
    const matchingAgents: string[] = [];
    const fileName = basename(filePath);
    const ext = extname(filePath);

    for (const [agentId, trigger] of this.triggers.entries()) {
      // Check file patterns
      const fileMatch = trigger.filePatterns.some(pattern => {
        // Simple pattern matching (can be enhanced with glob library)
        return pattern.includes('*')
          ? this.matchGlobPattern(pattern, fileName)
          : filePath.includes(pattern);
      });

      if (fileMatch) {
        matchingAgents.push(agentId);
      }
    }

    return matchingAgents;
  }

  /**
   * Simple glob pattern matching (can be enhanced with micromatch library)
   */
  private matchGlobPattern(pattern: string, fileName: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(fileName);
  }

  /**
   * Activate one or more agents for a file
   */
  private async activateAgents(agentIds: string[], filePath: string): Promise<void> {
    console.log(`🤖 Activating agents: ${agentIds.join(', ')} for ${filePath}`);

    // Create activation contexts
    const activationPromises = agentIds.map(agentId => {
      return this.activateAgent(agentId, filePath);
    });

    // Execute in parallel (Rule 1: Parallel Task Execution)
    try {
      const results = await Promise.all(activationPromises);

      // Emit results for statusline updates
      this.emit('agents-completed', {
        agentIds,
        filePath,
        results,
        timestamp: Date.now()
      });

      console.log(`✅ All agents completed for ${filePath}`);
    } catch (error) {
      console.error(`❌ Agent activation failed:`, error);
      this.emit('agents-failed', { agentIds, filePath, error });
    }
  }

  /**
   * Activate a single agent
   */
  private async activateAgent(agentId: string, filePath: string): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Read file content (in real implementation, use fs.readFile)
    const content = ''; // Placeholder - implement actual file read

    const context: AgentActivationContext = {
      filePath,
      content,
      language: this.detectLanguage(filePath),
      framework: 'unknown', // Detect from content
      userIntent: 'file_edit',
      timestamp: Date.now(),
      metadata: {
        proactiveMode: true,
        backgroundAnalysis: true
      }
    };

    // NEW v6.1: Proactively enhance agent with required capabilities
    const enhancement = await this.enhanceAgentForTask(agentId, context);
    if (enhancement?.success) {
      console.log(`   ✅ Agent ${agentId} enhanced with: ${enhancement.toolsAdded.join(', ')}`);
      // Add enhancement info to context
      context.metadata = {
        ...context.metadata,
        mcpToolsEnhanced: enhancement.toolsAdded,
        capabilitiesGranted: enhancement.capabilitiesGranted
      };
    }

    // Track active agent
    const activeAgent: ActiveAgent = {
      agentId,
      agent,
      context,
      startTime: Date.now(),
      progress: 0,
      status: 'running'
    };

    this.activeAgents.set(agentId, activeAgent);

    // Emit activation event for statusline
    this.emit('agent-activated', {
      agentId,
      filePath,
      timestamp: Date.now()
    });

    try {
      // Execute agent analysis
      const response = await agent.activate(context);

      // Update status
      activeAgent.status = 'completed';
      activeAgent.progress = 100;

      return response;
    } catch (error) {
      activeAgent.status = 'failed';
      throw error;
    } finally {
      this.activeAgents.delete(agentId);
    }
  }

  /**
   * Get status of all active agents (for statusline)
   */
  public getActiveAgentsStatus(): Map<string, ActiveAgent> {
    return new Map(this.activeAgents);
  }

  /**
   * Manually activate an agent (fallback for slash commands)
   */
  public async manualActivation(agentId: string, filePath: string): Promise<AgentResponse> {
    console.log(`🔧 Manual activation requested: ${agentId}`);
    return this.activateAgent(agentId, filePath);
  }

  /**
   * Disable proactive agents (fallback to manual mode)
   */
  public disableProactiveMode(): void {
    this.config.autoActivation = false;
    this.stopMonitoring();
    console.log('⏸️  Proactive agents disabled. Use slash commands: /maria, /james, /marcus');
  }

  /**
   * Enable proactive agents
   */
  public enableProactiveMode(): void {
    this.config.autoActivation = true;
    console.log('▶️  Proactive agents enabled');
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(filePath: string): boolean {
    const ignorePatterns = [
      'node_modules',
      'dist',
      'coverage',
      '.git',
      '.versatil/cache',
      '.rebranding-backup'
    ];

    return ignorePatterns.some(pattern => filePath.includes(pattern));
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = extname(filePath);
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.css': 'css',
      '.scss': 'scss'
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.activeAgents.clear();
    this.agents.clear();
    this.triggers.clear();
  }
}

// Singleton instance for global access
let orchestratorInstance: ProactiveAgentOrchestrator | null = null;

export function getProactiveOrchestrator(config?: Partial<ProactiveAgentConfig>): ProactiveAgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ProactiveAgentOrchestrator(config);
  }
  return orchestratorInstance;
}

export function destroyProactiveOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.destroy();
    orchestratorInstance = null;
  }
}