/**
 * VERSATIL v6.4.1 - Oliver-MCP: MCP Intelligence & Orchestration Agent
 *
 * Purpose: Intelligent MCP selection, type classification, and anti-hallucination logic
 *
 * Responsibilities:
 * 1. Classify MCPs as Integration, Documentation, or Hybrid
 * 2. Select optimal MCP for each task
 * 3. Detect when GitMCP should be used for zero hallucinations
 * 4. Maintain MCP capability registry
 * 5. Optimize MCP routing for all 17 OPERA agents
 *
 * Usage:
 * ```typescript
 * const oliver = new OliverMCPAgent(logger);
 * await oliver.activate(context);
 *
 * // Intelligent MCP selection
 * const recommendation = await oliver.selectMCPForTask({
 *   type: 'research',
 *   description: 'Find FastAPI OAuth patterns',
 *   agentId: 'marcus-backend'
 * });
 * // → Recommends: GitMCP("tiangolo/fastapi")
 *
 * // Anti-hallucination detection
 * const antiHallucination = await oliver.shouldUseGitMCP({
 *   framework: 'FastAPI',
 *   topic: 'OAuth2',
 *   agentKnowledge: new Date('2024-01-01')
 * });
 * // → Recommends: Query gitmcp.io/tiangolo/fastapi for latest docs
 * ```
 */

import { BaseAgent, AgentResponse, AgentActivationContext } from '../core/base-agent.js';
import { VERSATILLogger } from '../../utils/logger.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type MCPType = 'integration' | 'documentation' | 'hybrid';

export type TaskType = 'research' | 'integration' | 'documentation' | 'action' | 'testing';

export interface MCPDefinition {
  name: string;
  type: MCPType;
  capabilities: string[];
  writeOperations: boolean;
  readOperations: boolean;
  antiHallucination?: boolean;
  recommendedFor: string[]; // Agent IDs
  examples?: string[];
}

export interface TaskContext {
  type: TaskType;
  description: string;
  agentId: string;
  framework?: string; // e.g., "FastAPI", "React"
  topic?: string;     // e.g., "OAuth", "Server Components"
  requiresWrite?: boolean;
}

export interface MCPRecommendation {
  mcpName: string;
  mcpType: MCPType;
  confidence: number; // 0-1
  reasoning: string;
  alternatives?: string[];
  parameters?: Record<string, any>;
}

export interface GitMCPRecommendation {
  shouldUse: boolean;
  repository: {
    owner: string;
    repo: string;
    path?: string;
  };
  reasoning: string;
  confidence: number;
  hallucination_risk: 'low' | 'medium' | 'high';
}

// ============================================================================
// MCP Registry Schema
// ============================================================================

const MCP_REGISTRY: Record<string, MCPDefinition> = {
  // Integration MCPs (Write operations)
  'playwright': {
    name: 'playwright',
    type: 'integration',
    capabilities: ['navigate', 'click', 'screenshot', 'test', 'accessibility_snapshot'],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['maria-qa', 'james-frontend'],
    examples: ['E2E testing', 'Visual regression', 'Accessibility audits']
  },
  'github': {
    name: 'github',
    type: 'hybrid', // Can do both integration + documentation
    capabilities: [
      'create_issue', 'create_pr', 'commit', 'push', // Integration
      'get_file', 'search_code', 'get_repo'          // Documentation
    ],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['marcus-backend', 'sarah-pm', 'alex-ba'],
    examples: ['Create issues', 'Read repository files', 'Search code']
  },
  'vertex-ai': {
    name: 'vertex-ai',
    type: 'integration',
    capabilities: ['deploy_model', 'train', 'inference', 'monitor'],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['dr-ai-ml'],
    examples: ['Deploy ML models', 'Run inference', 'Model monitoring']
  },
  'supabase': {
    name: 'supabase',
    type: 'integration',
    capabilities: ['query', 'insert', 'update', 'delete', 'vector_search'],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['marcus-backend', 'dr-ai-ml', 'dana-database'],
    examples: ['Database operations', 'Vector storage', 'RAG queries']
  },
  'n8n': {
    name: 'n8n',
    type: 'integration',
    capabilities: ['trigger_workflow', 'execute', 'monitor'],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['sarah-pm', 'marcus-backend'],
    examples: ['Workflow automation', 'CI/CD triggers']
  },
  'semgrep': {
    name: 'semgrep',
    type: 'integration',
    capabilities: ['scan', 'detect_vulnerabilities', 'enforce_rules'],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['marcus-backend', 'maria-qa'],
    examples: ['Security scanning', 'OWASP compliance']
  },
  'sentry': {
    name: 'sentry',
    type: 'integration',
    capabilities: ['log_error', 'track_issue', 'analyze', 'monitor'],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['maria-qa', 'marcus-backend', 'sarah-pm'],
    examples: ['Error monitoring', 'Release health tracking']
  },
  'claude-code-mcp': {
    name: 'claude-code-mcp',
    type: 'integration',
    capabilities: ['execute_code', 'debug', 'ide_integration'],
    writeOperations: true,
    readOperations: true,
    recommendedFor: ['all'],
    examples: ['Code execution', 'Debugging']
  },

  // Documentation MCPs (Read-only research)
  'gitmcp': {
    name: 'gitmcp',
    type: 'documentation',
    capabilities: ['query_repo', 'get_docs', 'search_examples'],
    writeOperations: false,
    readOperations: true,
    antiHallucination: true,
    recommendedFor: ['all'], // All agents can benefit from documentation
    examples: ['Research framework patterns', 'Find code examples', 'Get latest docs']
  },
  'exa': {
    name: 'exa',
    type: 'documentation',
    capabilities: ['search', 'research', 'find_similar', 'get_contents'],
    writeOperations: false,
    readOperations: true,
    recommendedFor: ['alex-ba', 'dr-ai-ml'],
    examples: ['Market research', 'Competitive analysis', 'Find documentation']
  }
};

// Framework → GitHub Repository mapping for GitMCP
const FRAMEWORK_REPO_MAP: Record<string, { owner: string; repo: string }> = {
  // Backend Frameworks
  'fastapi': { owner: 'tiangolo', repo: 'fastapi' },
  'django': { owner: 'django', repo: 'django' },
  'flask': { owner: 'pallets', repo: 'flask' },
  'express': { owner: 'expressjs', repo: 'express' },
  'nestjs': { owner: 'nestjs', repo: 'nest' },
  'rails': { owner: 'rails', repo: 'rails' },
  'gin': { owner: 'gin-gonic', repo: 'gin' },
  'echo': { owner: 'labstack', repo: 'echo' },
  'spring-boot': { owner: 'spring-projects', repo: 'spring-boot' },

  // Frontend Frameworks
  'react': { owner: 'facebook', repo: 'react' },
  'vue': { owner: 'vuejs', repo: 'core' },
  'nextjs': { owner: 'vercel', repo: 'next.js' },
  'angular': { owner: 'angular', repo: 'angular' },
  'svelte': { owner: 'sveltejs', repo: 'svelte' },

  // ML Frameworks
  'tensorflow': { owner: 'tensorflow', repo: 'tensorflow' },
  'pytorch': { owner: 'pytorch', repo: 'pytorch' },
  'transformers': { owner: 'huggingface', repo: 'transformers' },
  'langchain': { owner: 'langchain-ai', repo: 'langchain' }
};

// ============================================================================
// Oliver-MCP Agent Implementation
// ============================================================================

export class OliverMCPAgent extends BaseAgent {
  systemPrompt = 'Oliver-MCP: MCP Intelligence Officer - Intelligent MCP selection, classification, and anti-hallucination orchestration';
  name = 'Oliver-MCP';
  id = 'oliver-mcp';
  specialization = 'MCP Intelligence & Orchestration';

  private mcpRegistry: Map<string, MCPDefinition> = new Map();
  private usageStats: Map<string, number> = new Map();

  constructor(private logger: VERSATILLogger) {
    super();
    this.initializeRegistry();
  }

  /**
   * Initialize MCP registry from schema
   */
  private initializeRegistry(): void {
    for (const [name, definition] of Object.entries(MCP_REGISTRY)) {
      this.mcpRegistry.set(name, definition);
    }
    this.logger.info('Oliver-MCP registry initialized', {
      totalMCPs: this.mcpRegistry.size,
      integration: this.getMCPsByType('integration').length,
      documentation: this.getMCPsByType('documentation').length,
      hybrid: this.getMCPsByType('hybrid').length
    }, 'OliverMCP');
  }

  /**
   * Main activation method
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    try {
      this.logger.info('Oliver-MCP activated', { context: context.workingDirectory }, 'OliverMCP');

      const suggestions = this.generateMCPSuggestions(context);

      return {
        agentId: this.id,
        message: `Oliver-MCP ready: ${this.mcpRegistry.size} MCPs available for intelligent orchestration`,
        suggestions,
        priority: 'low',
        handoffTo: [],
        context: {
          mcpRegistry: Object.fromEntries(this.mcpRegistry),
          integrationMCPs: this.getMCPsByType('integration').map(m => m.name),
          documentationMCPs: this.getMCPsByType('documentation').map(m => m.name),
          hybridMCPs: this.getMCPsByType('hybrid').map(m => m.name)
        }
      };
    } catch (error) {
      this.logger.error('Oliver-MCP activation failed', {
        error: error instanceof Error ? error.message : String(error)
      }, 'OliverMCP');

      return {
        agentId: this.id,
        message: 'Oliver-MCP activation failed',
        suggestions: [],
        priority: 'medium',
        handoffTo: [],
        context: {}
      };
    }
  }

  // ============================================================================
  // Core Intelligence Methods
  // ============================================================================

  /**
   * Select optimal MCP for a given task
   */
  async selectMCPForTask(task: TaskContext): Promise<MCPRecommendation> {
    this.logger.info('Selecting MCP for task', { task }, 'OliverMCP');

    // Determine required MCP type
    const requiredType = this.determineRequiredMCPType(task);

    // Get candidate MCPs
    const candidates = this.getMCPsByType(requiredType);

    // If task involves research, prioritize documentation MCPs
    if (task.type === 'research' || task.type === 'documentation') {
      // Check if GitMCP would be better (framework research)
      if (task.framework) {
        const gitMCPRec = await this.shouldUseGitMCP({
          framework: task.framework,
          topic: task.topic || '',
          agentKnowledge: new Date('2024-01-01') // Conservative: assume knowledge is from Jan 2024
        });

        if (gitMCPRec.shouldUse) {
          return {
            mcpName: 'gitmcp',
            mcpType: 'documentation',
            confidence: gitMCPRec.confidence,
            reasoning: gitMCPRec.reasoning,
            alternatives: ['exa', 'github'],
            parameters: {
              repository: gitMCPRec.repository
            }
          };
        }
      }

      // Default to Exa for general research
      return {
        mcpName: 'exa',
        mcpType: 'documentation',
        confidence: 0.8,
        reasoning: 'General research task - Exa provides AI-powered search',
        alternatives: ['gitmcp']
      };
    }

    // For integration tasks, find best match
    const best = this.selectBestCandidate(candidates, task);

    if (best) {
      return {
        mcpName: best.name,
        mcpType: best.type,
        confidence: 0.9,
        reasoning: `${best.name} is optimized for ${task.type} tasks with capabilities: ${best.capabilities.join(', ')}`,
        alternatives: candidates.filter(c => c.name !== best.name).map(c => c.name).slice(0, 2)
      };
    }

    // Fallback
    return {
      mcpName: 'github',
      mcpType: 'hybrid',
      confidence: 0.5,
      reasoning: 'Default fallback - GitHub MCP can handle most tasks',
      alternatives: []
    };
  }

  /**
   * Anti-hallucination detection: Should GitMCP be used?
   */
  async shouldUseGitMCP(context: {
    framework: string;
    topic: string;
    agentKnowledge: Date;
  }): Promise<GitMCPRecommendation> {
    const { framework, topic, agentKnowledge } = context;

    // Calculate knowledge staleness
    const now = new Date();
    const monthsOld = (now.getTime() - agentKnowledge.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Determine hallucination risk
    let hallucination_risk: 'low' | 'medium' | 'high' = 'low';
    if (monthsOld > 12) {
      hallucination_risk = 'high';
    } else if (monthsOld > 6) {
      hallucination_risk = 'medium';
    }

    // Check if framework is in our registry
    const frameworkKey = framework.toLowerCase().replace(/[-.]/g, '');
    const repo = FRAMEWORK_REPO_MAP[frameworkKey];

    if (!repo) {
      return {
        shouldUse: false,
        repository: { owner: '', repo: '' },
        reasoning: `Framework "${framework}" not in GitMCP registry. Use Exa search instead.`,
        confidence: 0.3,
        hallucination_risk
      };
    }

    // Recommend GitMCP for high-risk hallucination scenarios
    if (hallucination_risk === 'high' || hallucination_risk === 'medium') {
      return {
        shouldUse: true,
        repository: {
          owner: repo.owner,
          repo: repo.repo,
          path: topic ? `docs/${topic.toLowerCase()}` : undefined
        },
        reasoning: `High hallucination risk detected (knowledge ${monthsOld.toFixed(0)} months old). GitMCP provides real-time ${framework} documentation.`,
        confidence: 0.95,
        hallucination_risk
      };
    }

    // For recent knowledge, still recommend for best practices
    return {
      shouldUse: true,
      repository: repo,
      reasoning: `GitMCP ensures zero hallucinations with latest ${framework} patterns from ${repo.owner}/${repo.repo}`,
      confidence: 0.8,
      hallucination_risk
    };
  }

  /**
   * Classify MCP type
   */
  classifyMCP(mcpName: string): MCPType {
    const mcp = this.mcpRegistry.get(mcpName.toLowerCase());
    return mcp?.type || 'integration'; // Default to integration if unknown
  }

  /**
   * Get MCP definition
   */
  getMCPDefinition(mcpName: string): MCPDefinition | undefined {
    return this.mcpRegistry.get(mcpName.toLowerCase());
  }

  /**
   * Get all MCPs of a specific type
   */
  getMCPsByType(type: MCPType): MCPDefinition[] {
    return Array.from(this.mcpRegistry.values()).filter(mcp => mcp.type === type);
  }

  /**
   * Get recommended MCPs for an agent
   */
  getMCPsForAgent(agentId: string): MCPDefinition[] {
    return Array.from(this.mcpRegistry.values()).filter(mcp =>
      mcp.recommendedFor.includes(agentId) || mcp.recommendedFor.includes('all')
    );
  }

  /**
   * Track MCP usage
   */
  trackMCPUsage(mcpName: string): void {
    const current = this.usageStats.get(mcpName) || 0;
    this.usageStats.set(mcpName, current + 1);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, number> {
    return Object.fromEntries(this.usageStats);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private determineRequiredMCPType(task: TaskContext): MCPType {
    // Research/documentation tasks → Documentation MCPs
    if (task.type === 'research' || task.type === 'documentation') {
      return 'documentation';
    }

    // Tasks requiring write operations → Integration MCPs
    if (task.requiresWrite || task.type === 'integration' || task.type === 'action') {
      return 'integration';
    }

    // Testing can use either, prefer integration for browser automation
    if (task.type === 'testing') {
      return 'integration';
    }

    // Default to hybrid for flexibility
    return 'hybrid';
  }

  private selectBestCandidate(candidates: MCPDefinition[], task: TaskContext): MCPDefinition | null {
    if (candidates.length === 0) return null;

    // Score each candidate
    const scored = candidates.map(mcp => ({
      mcp,
      score: this.scoreMCPForTask(mcp, task)
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored[0].mcp;
  }

  private scoreMCPForTask(mcp: MCPDefinition, task: TaskContext): number {
    let score = 0;

    // Agent preference (+30 points)
    if (mcp.recommendedFor.includes(task.agentId) || mcp.recommendedFor.includes('all')) {
      score += 30;
    }

    // Write capability match (+20 points)
    if (task.requiresWrite && mcp.writeOperations) {
      score += 20;
    }

    // Anti-hallucination capability (+15 points)
    if (mcp.antiHallucination && task.type === 'research') {
      score += 15;
    }

    // Capability count (+10 points for rich MCPs)
    score += Math.min(mcp.capabilities.length, 10);

    return score;
  }

  private generateMCPSuggestions(context: AgentActivationContext): any[] {
    const suggestions: any[] = [];

    // Suggest documentation MCPs for research
    suggestions.push({
      type: 'info',
      message: '📚 Use GitMCP for zero-hallucination framework research',
      priority: 'low',
      recommendation: 'Query gitmcp.io for real-time documentation'
    });

    // Suggest integration MCPs for actions
    suggestions.push({
      type: 'info',
      message: '🔧 9 Integration MCPs available for write operations',
      priority: 'low'
    });

    return suggestions;
  }
}
