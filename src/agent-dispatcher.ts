/**
 * VERSATIL SDLC Framework - Auto-Agent Dispatcher
 * Real-time agent activation based on file patterns, context, and triggers
 *
 * This is the core missing piece that makes BMAD methodology truly autonomous
 */

import { EventEmitter } from 'events';
import { watch } from 'fs';
import path from 'path';

interface AgentTrigger {
  agent: string;
  priority: number;
  triggers: {
    filePatterns: string[];
    keywords: string[];
    actions: string[];
    dependencies: string[];
    errorPatterns: string[];
  };
  autoActivate: boolean;
  mcpTools: string[];
  collaborators: string[];
}

interface AgentActivationContext {
  trigger: AgentTrigger;
  filePath?: string;
  errorMessage?: string;
  userRequest?: string;
  contextClarity: 'clear' | 'ambiguous' | 'missing';
  requiredClarifications?: string[];
}

interface AgentResponse {
  agent: string;
  status: 'activated' | 'clarification_needed' | 'delegated' | 'completed';
  message: string;
  clarifications?: string[];
  nextActions?: string[];
  collaborators?: string[];
}

/**
 * Core Agent Dispatch System
 * Monitors files, patterns, and context to automatically activate appropriate agents
 */
class VERSATILAgentDispatcher extends EventEmitter {
  private agents: Map<string, AgentTrigger> = new Map();
  private activeAgents: Set<string> = new Set();
  private fileWatchers: Map<string, any> = new Map();
  private contextValidator: ContextValidator;

  constructor() {
    super();
    this.contextValidator = new ContextValidator();
    this.initializeAgents();
    this.setupFileWatching();
  }

  /**
   * Initialize BMAD Agents with Enhanced Triggers
   */
  private initializeAgents(): void {
    // James - Frontend Agent
    this.agents.set('james', {
      agent: 'James (Frontend)',
      priority: 1,
      triggers: {
        filePatterns: ['*.tsx', '*.jsx', '*.css', '*.scss', 'components/**/*', 'pages/**/*'],
        keywords: ['UI', 'component', 'styling', 'responsive', 'design', 'router', 'navigation'],
        actions: ['component development', 'styling changes', 'UI fixes', 'routing issues'],
        dependencies: ['react', 'react-router', 'antd', '@tremor/react'],
        errorPatterns: [
          'No routes matched location',
          'component.*not.*found',
          'styling.*error',
          'CSS.*error',
          'import.*component.*failed'
        ]
      },
      autoActivate: true,
      mcpTools: ['Chrome MCP', 'Shadcn MCP'],
      collaborators: ['Marcus', 'Maria']
    });

    // Marcus - Backend Agent
    this.agents.set('marcus', {
      agent: 'Marcus (Backend)',
      priority: 1,
      triggers: {
        filePatterns: ['*.ts', 'src/services/**/*', '*.sql', 'supabase/**/*', 'api/**/*'],
        keywords: ['API', 'database', 'backend', 'Edge Function', 'auth', 'server'],
        actions: ['backend service', 'database changes', 'API work', 'server configuration'],
        dependencies: ['@supabase/supabase-js', '@refinedev/core', 'supabase'],
        errorPatterns: [
          'Failed to resolve import',
          'dependency.*not.*found',
          'module.*not.*found',
          'API.*error',
          'database.*error',
          'auth.*error'
        ]
      },
      autoActivate: true,
      mcpTools: ['GitHub MCP'],
      collaborators: ['James', 'Maria']
    });

    // Maria - QA Agent
    this.agents.set('maria', {
      agent: 'Maria (QA)',
      priority: 2,
      triggers: {
        filePatterns: ['*.test.*', '*.spec.*', 'tests/**/*', 'cypress/**/*'],
        keywords: ['test', 'bug', 'error', 'validation', 'quality', 'debug'],
        actions: ['testing', 'debugging', 'error investigation', 'quality assessment'],
        dependencies: ['@testing-library/*', 'jest', 'vitest', 'cypress', 'playwright'],
        errorPatterns: [
          'test.*failed',
          'assertion.*error',
          'timeout.*error',
          'console.*error',
          'warning.*detected'
        ]
      },
      autoActivate: true,
      mcpTools: ['Chrome MCP', 'Playwright MCP'],
      collaborators: ['James', 'Marcus']
    });

    // Sarah - Product Manager Agent
    this.agents.set('sarah', {
      agent: 'Sarah (PM)',
      priority: 3,
      triggers: {
        filePatterns: ['*.md', '*.stories.*', 'docs/**/*'],
        keywords: ['feature', 'requirements', 'user story', 'roadmap', 'specification'],
        actions: ['feature planning', 'requirements', 'documentation'],
        dependencies: ['@storybook/*'],
        errorPatterns: []
      },
      autoActivate: false, // PM requires manual activation for strategic decisions
      mcpTools: [],
      collaborators: ['Alex', 'James', 'Marcus']
    });

    // Dr. AI - ML/AI Agent
    this.agents.set('dr-ai', {
      agent: 'Dr. AI (ML)',
      priority: 1,
      triggers: {
        filePatterns: ['*RAG*', '*AI*', '*ML*', 'osint/**/*', 'agents/**/*', '*brain*'],
        keywords: ['RAG', 'LLM', 'AI', 'machine learning', 'OSINT', 'neural', 'model'],
        actions: ['AI development', 'RAG systems', 'ML implementation', 'OSINT analysis'],
        dependencies: ['@anthropic/*', 'openai', 'langchain', '@vercel/ai'],
        errorPatterns: [
          'AI.*model.*error',
          'RAG.*system.*failed',
          'embedding.*error',
          'LLM.*timeout'
        ]
      },
      autoActivate: true,
      mcpTools: ['GitHub MCP'],
      collaborators: ['Marcus', 'Maria']
    });

    // Logan - Context Agent (NEW)
    this.agents.set('logan', {
      agent: 'Logan (Context)',
      priority: 3,
      triggers: {
        filePatterns: ['CLAUDE.md', '.cursorrules', '.versatil/**/*'],
        keywords: ['context', 'conversation', 'memory', 'documentation', 'framework'],
        actions: ['context preservation', 'conversation logging', 'decision recording'],
        dependencies: [],
        errorPatterns: ['context.*loss', 'memory.*issue']
      },
      autoActivate: true,
      mcpTools: [],
      collaborators: ['Maria', 'Sarah']
    });

    console.log(`🤖 VERSATIL Agent Dispatcher: ${this.agents.size} agents initialized`);
  }

  /**
   * Enhanced Context Clarity Validation (User's New Requirement)
   */
  async validateTaskContext(userRequest: string): Promise<{
    clarity: 'clear' | 'ambiguous' | 'missing';
    clarifications: string[];
    recommendedAgents: string[];
  }> {
    return this.contextValidator.validateContext(userRequest);
  }

  /**
   * Auto-Activate Agents Based on File Changes
   */
  private setupFileWatching(): void {
    const watchPath = process.cwd();

    const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
      if (!filename || this.shouldIgnoreFile(filename)) return;

      const fullPath = path.join(watchPath, filename);
      this.handleFileChange(eventType, fullPath);
    });

    this.fileWatchers.set(watchPath, watcher);
    console.log(`📁 File watching enabled for: ${watchPath}`);
  }

  private shouldIgnoreFile(filename: string): boolean {
    const ignorePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      '.vite',
      'coverage',
      '.nyc_output'
    ];

    return ignorePatterns.some(pattern => filename.includes(pattern));
  }

  /**
   * Core File Change Handler - Triggers Agent Activation
   */
  private async handleFileChange(eventType: string, filePath: string): Promise<void> {
    console.log(`📝 File ${eventType}: ${filePath}`);

    // Find matching agents based on file patterns
    const matchingAgents = this.findMatchingAgents(filePath);

    if (matchingAgents.length > 0) {
      console.log(`🎯 Auto-activating agents for ${filePath}:`, matchingAgents.map(a => a.agent));

      for (const agent of matchingAgents) {
        await this.activateAgent(agent, { filePath });
      }
    }
  }

  /**
   * Find Agents That Match File Patterns
   */
  private findMatchingAgents(filePath: string): AgentTrigger[] {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(process.cwd(), filePath);

    const matchingAgents: AgentTrigger[] = [];

    for (const [agentKey, agent] of this.agents) {
      if (!agent.autoActivate) continue;

      // Check file pattern matches
      const patternMatch = agent.triggers.filePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(fileName) || regex.test(relativePath);
        }
        return fileName.includes(pattern) || relativePath.includes(pattern);
      });

      if (patternMatch) {
        matchingAgents.push(agent);
      }
    }

    return matchingAgents.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Activate Agent with Context
   */
  async activateAgent(trigger: AgentTrigger, context: Partial<AgentActivationContext> = {}): Promise<AgentResponse> {
    const agentKey = trigger.agent.toLowerCase().split('(')[0].trim();

    // Check if agent is already active
    if (this.activeAgents.has(agentKey)) {
      return {
        agent: trigger.agent,
        status: 'activated',
        message: `${trigger.agent} is already active`
      };
    }

    this.activeAgents.add(agentKey);

    // Validate context clarity if user request provided
    let contextValidation = { clarity: 'clear' as const, clarifications: [] };
    if (context.userRequest) {
      contextValidation = await this.contextValidator.validateContext(context.userRequest);
    }

    const activationContext: AgentActivationContext = {
      trigger,
      contextClarity: contextValidation.clarity,
      requiredClarifications: contextValidation.clarifications,
      ...context
    };

    // If context is ambiguous, request clarification
    if (contextValidation.clarity === 'ambiguous') {
      return {
        agent: trigger.agent,
        status: 'clarification_needed',
        message: `${trigger.agent} needs clarification before proceeding`,
        clarifications: contextValidation.clarifications
      };
    }

    // Activate MCP tools if required
    if (trigger.mcpTools.length > 0) {
      console.log(`🛠️ Auto-activating MCP tools for ${trigger.agent}:`, trigger.mcpTools);
      await this.activateMCPTools(trigger.mcpTools, activationContext);
    }

    // Activate collaborating agents if needed
    if (trigger.collaborators.length > 0) {
      console.log(`🤝 Activating collaborators for ${trigger.agent}:`, trigger.collaborators);
      for (const collaborator of trigger.collaborators) {
        const collaboratorTrigger = this.findAgentByName(collaborator);
        if (collaboratorTrigger) {
          await this.activateAgent(collaboratorTrigger, context);
        }
      }
    }

    this.emit('agent-activated', {
      agent: trigger.agent,
      context: activationContext,
      timestamp: new Date()
    });

    return {
      agent: trigger.agent,
      status: 'activated',
      message: `${trigger.agent} successfully activated`,
      collaborators: trigger.collaborators
    };
  }

  /**
   * Emergency Protocol - Auto-activate agents for critical errors
   */
  async handleEmergency(errorMessage: string, context: string = ''): Promise<AgentResponse[]> {
    console.log('🚨 EMERGENCY PROTOCOL ACTIVATED:', errorMessage);

    const responses: AgentResponse[] = [];

    // Find agents that can handle this error
    const emergencyAgents = this.findAgentsForError(errorMessage);

    if (emergencyAgents.length === 0) {
      // Default emergency response - activate Maria for investigation
      const mariaAgent = this.agents.get('maria');
      if (mariaAgent) {
        const response = await this.activateAgent(mariaAgent, {
          errorMessage,
          userRequest: `Emergency: ${errorMessage}`
        });
        responses.push(response);
      }
    } else {
      // Activate all matching emergency agents
      for (const agent of emergencyAgents) {
        const response = await this.activateAgent(agent, {
          errorMessage,
          userRequest: `Emergency: ${errorMessage}`
        });
        responses.push(response);
      }
    }

    this.emit('emergency-handled', {
      error: errorMessage,
      agents: responses.map(r => r.agent),
      timestamp: new Date()
    });

    return responses;
  }

  /**
   * Find agents that can handle specific error patterns
   */
  private findAgentsForError(errorMessage: string): AgentTrigger[] {
    const matchingAgents: AgentTrigger[] = [];

    for (const [agentKey, agent] of this.agents) {
      const errorMatch = agent.triggers.errorPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(errorMessage);
      });

      if (errorMatch) {
        matchingAgents.push(agent);
      }
    }

    return matchingAgents.sort((a, b) => a.priority - b.priority);
  }

  private findAgentByName(name: string): AgentTrigger | undefined {
    for (const [key, agent] of this.agents) {
      if (agent.agent.toLowerCase().includes(name.toLowerCase())) {
        return agent;
      }
    }
    return undefined;
  }

  /**
   * Activate MCP Tools
   */
  private async activateMCPTools(tools: string[], context: AgentActivationContext): Promise<void> {
    for (const tool of tools) {
      console.log(`🔧 Activating ${tool} for ${context.trigger.agent}`);
      // This would integrate with actual MCP activation
      // For now, log the activation
    }
  }

  /**
   * Deactivate agent
   */
  deactivateAgent(agentName: string): void {
    const agentKey = agentName.toLowerCase().split('(')[0].trim();
    this.activeAgents.delete(agentKey);

    this.emit('agent-deactivated', {
      agent: agentName,
      timestamp: new Date()
    });
  }

  /**
   * Get currently active agents
   */
  getActiveAgents(): string[] {
    return Array.from(this.activeAgents);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Stop file watchers
    for (const [path, watcher] of this.fileWatchers) {
      watcher.close();
    }
    this.fileWatchers.clear();

    // Clear active agents
    this.activeAgents.clear();

    console.log('🛑 VERSATIL Agent Dispatcher stopped');
  }
}

/**
 * Context Clarity Validator (User's Enhancement Request)
 */
class ContextValidator {
  async validateContext(userRequest: string): Promise<{
    clarity: 'clear' | 'ambiguous' | 'missing';
    clarifications: string[];
    recommendedAgents: string[];
  }> {
    const clarifications: string[] = [];
    const recommendedAgents: string[] = [];

    // Check for ambiguous terms
    const ambiguousTerms = ['it', 'this', 'that', 'thing', 'stuff', 'something'];
    const hasAmbiguousTerms = ambiguousTerms.some(term =>
      userRequest.toLowerCase().includes(term)
    );

    // Check for missing specifics
    const hasSpecifics = {
      fileLocation: /file|path|component|\.tsx|\.ts|\.js/.test(userRequest),
      action: /add|create|fix|update|delete|modify|implement/.test(userRequest),
      technology: /react|antd|supabase|typescript|javascript/.test(userRequest)
    };

    // Generate clarifications
    if (hasAmbiguousTerms) {
      clarifications.push('Please specify what "it" or "this" refers to');
    }

    if (!hasSpecifics.fileLocation) {
      clarifications.push('Which file or component should be modified?');
    }

    if (!hasSpecifics.action) {
      clarifications.push('What specific action should be taken?');
    }

    if (!hasSpecifics.technology && userRequest.length > 20) {
      clarifications.push('Which technology stack or framework is involved?');
    }

    // Recommend agents based on context
    if (/UI|component|styling|frontend/i.test(userRequest)) {
      recommendedAgents.push('James (Frontend)');
    }
    if (/API|backend|database|server/i.test(userRequest)) {
      recommendedAgents.push('Marcus (Backend)');
    }
    if (/test|bug|error|debug/i.test(userRequest)) {
      recommendedAgents.push('Maria (QA)');
    }
    if (/AI|RAG|ML|OSINT/i.test(userRequest)) {
      recommendedAgents.push('Dr. AI (ML)');
    }

    // Determine clarity level
    let clarity: 'clear' | 'ambiguous' | 'missing' = 'clear';

    if (clarifications.length > 2) {
      clarity = 'missing';
    } else if (clarifications.length > 0) {
      clarity = 'ambiguous';
    }

    return {
      clarity,
      clarifications,
      recommendedAgents
    };
  }
}

// Export singleton instance
export const versatilDispatcher = new VERSATILAgentDispatcher();

// Start monitoring immediately in development
if (process.env.NODE_ENV !== 'test') {
  console.log('🚀 VERSATIL Auto-Agent System: ONLINE');
}