/**
 * MCP Selection Engine
 *
 * Purpose: Intelligent selection of optimal MCP server for a given task
 *
 * Features:
 * - Task type analysis (browser automation, API research, search, etc.)
 * - MCP capability matching
 * - Confidence scoring (0-100%)
 * - Reasoning generation for recommendations
 *
 * Part of: Oliver-MCP Orchestrator (Gap 1.1 - Critical)
 */

import { EventEmitter } from 'events';

export interface MCPCapability {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  useCases: string[];
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type?: string;
  files?: string[];
  keywords?: string[];
  context?: any;
}

export interface MCPRecommendation {
  mcpName: string;
  confidence: number; // 0-100%
  reasoning: string;
  capabilities: string[];
  alternatives?: Array<{
    mcpName: string;
    confidence: number;
    reasoning: string;
  }>;
}

export interface MCPSelectionResult {
  primary: MCPRecommendation;
  alternatives: MCPRecommendation[];
  taskAnalysis: {
    taskType: string;
    requiredCapabilities: string[];
    keywords: string[];
    complexity: 'simple' | 'medium' | 'complex';
  };
}

/**
 * MCP Capabilities Matrix
 * Defines what each MCP server is good at
 */
export const MCP_CAPABILITIES: Record<string, MCPCapability> = {
  'playwright': {
    name: 'Playwright',
    description: 'Browser automation and testing',
    strengths: [
      'Real browser interaction',
      'Visual regression testing',
      'Cross-browser testing',
      'Screenshot capture',
      'Network interception'
    ],
    weaknesses: [
      'Slower than API calls',
      'Resource intensive',
      'Not suitable for headless data extraction'
    ],
    useCases: [
      'UI testing',
      'Visual regression',
      'User flow validation',
      'Accessibility testing',
      'Performance monitoring'
    ]
  },

  'github': {
    name: 'GitHub',
    description: 'GitHub repository operations',
    strengths: [
      'Issue management',
      'PR operations',
      'Repository metadata',
      'Workflows and actions',
      'Code search'
    ],
    weaknesses: [
      'Rate limits (5000/hour)',
      'No deep code analysis',
      'Requires authentication'
    ],
    useCases: [
      'Create issues',
      'Manage pull requests',
      'Check workflow status',
      'Search repositories',
      'Read repository info'
    ]
  },

  'gitmcp': {
    name: 'GitMCP',
    description: 'Real-time repository documentation access (anti-hallucination)',
    strengths: [
      'Direct file access from any GitHub repo',
      'No rate limits (local git operations)',
      'Always up-to-date documentation',
      'Zero hallucinations (reads actual files)',
      'Supports any public repository'
    ],
    weaknesses: [
      'Requires knowing exact file paths',
      'No issue/PR management',
      'No semantic search'
    ],
    useCases: [
      'Read latest framework documentation',
      'Fetch API reference docs',
      'Get code examples from repos',
      'Verify implementation patterns',
      'Anti-hallucination fact-checking'
    ]
  },

  'exa': {
    name: 'Exa Search',
    description: 'AI-powered semantic search',
    strengths: [
      'Semantic search (not keyword)',
      'AI-generated summaries',
      'High relevance results',
      'Fast response times',
      'Web-scale knowledge'
    ],
    weaknesses: [
      'API costs per search',
      'Not code-specific',
      'No file access'
    ],
    useCases: [
      'Research best practices',
      'Find related articles',
      'Discover new tools',
      'Market research',
      'Competitive analysis'
    ]
  },

  'vertex-ai': {
    name: 'Vertex AI',
    description: 'Google Cloud AI/ML platform',
    strengths: [
      'ML model training',
      'Model deployment',
      'AutoML capabilities',
      'Enterprise-grade scaling',
      'Google Cloud integration'
    ],
    weaknesses: [
      'Requires GCP setup',
      'Cost per operation',
      'Complexity for simple tasks'
    ],
    useCases: [
      'Train ML models',
      'Deploy models to production',
      'AutoML tasks',
      'Batch predictions',
      'Model monitoring'
    ]
  },

  'supabase': {
    name: 'Supabase',
    description: 'Database and backend services',
    strengths: [
      'Real-time database',
      'Authentication',
      'Storage',
      'Edge functions',
      'Vector database (pgvector)'
    ],
    weaknesses: [
      'PostgreSQL only',
      'Requires project setup',
      'Learning curve for RLS'
    ],
    useCases: [
      'Database operations',
      'User authentication',
      'File storage',
      'Real-time subscriptions',
      'RAG vector search'
    ]
  },

  'n8n': {
    name: 'n8n',
    description: 'Workflow automation',
    strengths: [
      'Visual workflow builder',
      'Hundreds of integrations',
      'Scheduled workflows',
      'Webhook support',
      'Self-hosted'
    ],
    weaknesses: [
      'Setup required',
      'Learning curve',
      'Not for one-off tasks'
    ],
    useCases: [
      'Automate repetitive tasks',
      'Connect multiple services',
      'Scheduled data sync',
      'Event-driven workflows',
      'API orchestration'
    ]
  },

  'semgrep': {
    name: 'Semgrep',
    description: 'Static code analysis and security scanning',
    strengths: [
      'Fast pattern matching',
      'Security vulnerability detection',
      'Custom rule creation',
      'Multi-language support',
      'CI/CD integration'
    ],
    weaknesses: [
      'Static analysis only',
      'No runtime detection',
      'False positives possible'
    ],
    useCases: [
      'Security scanning',
      'Code quality checks',
      'Find anti-patterns',
      'Custom linting rules',
      'SAST in CI/CD'
    ]
  },

  'sentry': {
    name: 'Sentry',
    description: 'Error tracking and performance monitoring',
    strengths: [
      'Real-time error tracking',
      'Performance monitoring',
      'Release tracking',
      'User impact analysis',
      'Integrations (Slack, Jira, etc.)'
    ],
    weaknesses: [
      'Requires SDK integration',
      'Costs per event',
      'Not for logs'
    ],
    useCases: [
      'Monitor production errors',
      'Track performance issues',
      'Debug production bugs',
      'User session replay',
      'Release health tracking'
    ]
  },

  'claude-code-mcp': {
    name: 'Claude Code MCP',
    description: 'Claude-specific code operations',
    strengths: [
      'Native Claude integration',
      'Code understanding',
      'Semantic code search',
      'Refactoring suggestions'
    ],
    weaknesses: [
      'Claude-specific',
      'Limited to code tasks'
    ],
    useCases: [
      'Code analysis',
      'Refactoring',
      'Code search',
      'Pattern detection'
    ]
  },

  'claude-opera': {
    name: 'Claude Opera',
    description: 'VERSATIL framework operations',
    strengths: [
      'Framework-specific operations',
      'Agent coordination',
      'Task orchestration',
      'Context management'
    ],
    weaknesses: [
      'VERSATIL-specific',
      'Not general-purpose'
    ],
    useCases: [
      'Agent coordination',
      'Framework operations',
      'Task management',
      'Context preservation'
    ]
  }
};

/**
 * Task Type Detection Patterns
 * Maps task characteristics to task types
 */
export const TASK_TYPE_PATTERNS = {
  // Browser Automation
  'browser-automation': {
    keywords: ['test', 'ui', 'browser', 'click', 'screenshot', 'visual', 'e2e', 'playwright'],
    filePatterns: ['*.spec.ts', '*.test.tsx', 'e2e/**', 'tests/**'],
    primaryMCP: 'playwright',
    confidence: 95
  },

  // Repository Documentation
  'repo-documentation': {
    keywords: ['docs', 'documentation', 'readme', 'api reference', 'guide', 'tutorial', 'latest', 'framework'],
    filePatterns: ['*.md', 'docs/**'],
    primaryMCP: 'gitmcp',
    confidence: 90
  },

  // GitHub Operations
  'github-operations': {
    keywords: ['issue', 'pr', 'pull request', 'workflow', 'github action', 'repository'],
    filePatterns: ['.github/**', '*.yml'],
    primaryMCP: 'github',
    confidence: 95
  },

  // Research & Search
  'research': {
    keywords: ['research', 'find', 'discover', 'search', 'best practices', 'alternatives'],
    filePatterns: [],
    primaryMCP: 'exa',
    confidence: 80
  },

  // ML/AI Operations
  'ml-operations': {
    keywords: ['train', 'model', 'ml', 'ai', 'prediction', 'automl', 'vertex'],
    filePatterns: ['*.py', '*.ipynb', 'models/**'],
    primaryMCP: 'vertex-ai',
    confidence: 90
  },

  // Database Operations
  'database-operations': {
    keywords: ['database', 'query', 'table', 'sql', 'postgres', 'supabase', 'rls'],
    filePatterns: ['*.sql', 'migrations/**', 'prisma/**'],
    primaryMCP: 'supabase',
    confidence: 85
  },

  // Workflow Automation
  'workflow-automation': {
    keywords: ['automate', 'workflow', 'integration', 'webhook', 'scheduled'],
    filePatterns: ['workflows/**'],
    primaryMCP: 'n8n',
    confidence: 75
  },

  // Security Scanning
  'security-scan': {
    keywords: ['security', 'vulnerability', 'scan', 'sast', 'code analysis'],
    filePatterns: ['*.ts', '*.js', '*.py'],
    primaryMCP: 'semgrep',
    confidence: 90
  },

  // Error Monitoring
  'error-monitoring': {
    keywords: ['error', 'exception', 'sentry', 'monitoring', 'performance', 'bug'],
    filePatterns: [],
    primaryMCP: 'sentry',
    confidence: 85
  }
};

export class MCPSelectionEngine extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Select optimal MCP for a given task
   */
  async selectMCP(task: Task): Promise<MCPSelectionResult> {
    console.log(`🔍 Analyzing task for MCP selection: ${task.name}`);

    // Step 1: Analyze task to determine type and requirements
    const taskAnalysis = this.analyzeTask(task);

    // Step 2: Get MCP recommendations based on task analysis
    const recommendations = this.generateRecommendations(taskAnalysis);

    // Step 3: Sort by confidence and return
    const sortedRecommendations = recommendations.sort((a, b) => b.confidence - a.confidence);

    const result: MCPSelectionResult = {
      primary: sortedRecommendations[0],
      alternatives: sortedRecommendations.slice(1, 4), // Top 3 alternatives
      taskAnalysis
    };

    this.emit('mcp-selected', {
      taskId: task.id,
      selectedMCP: result.primary.mcpName,
      confidence: result.primary.confidence
    });

    console.log(`   ✅ Selected MCP: ${result.primary.mcpName} (${result.primary.confidence}% confidence)`);
    console.log(`   💡 Reasoning: ${result.primary.reasoning}`);

    return result;
  }

  /**
   * Analyze task to determine type and requirements
   */
  private analyzeTask(task: Task): MCPSelectionResult['taskAnalysis'] {
    const keywords = this.extractKeywords(task);
    const taskType = this.detectTaskType(task, keywords);
    const requiredCapabilities = this.inferRequiredCapabilities(task, keywords);

    return {
      taskType,
      requiredCapabilities,
      keywords,
      complexity: this.assessComplexity(task)
    };
  }

  /**
   * Extract keywords from task description and name
   */
  private extractKeywords(task: Task): string[] {
    const text = `${task.name} ${task.description}`.toLowerCase();
    const keywords = new Set<string>();

    // Extract keywords from all task type patterns
    for (const [, pattern] of Object.entries(TASK_TYPE_PATTERNS)) {
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          keywords.add(keyword);
        }
      }
    }

    // Add explicitly provided keywords
    if (task.keywords) {
      task.keywords.forEach(kw => keywords.add(kw.toLowerCase()));
    }

    return Array.from(keywords);
  }

  /**
   * Detect task type based on keywords and file patterns
   */
  private detectTaskType(task: Task, keywords: string[]): string {
    let bestMatch = 'general';
    let bestScore = 0;

    for (const [taskType, pattern] of Object.entries(TASK_TYPE_PATTERNS)) {
      let score = 0;

      // Score based on keyword matches
      const matchedKeywords = pattern.keywords.filter(kw =>
        keywords.includes(kw.toLowerCase())
      );
      score += matchedKeywords.length * 10;

      // Score based on file pattern matches
      if (task.files) {
        const matchedFiles = task.files.filter(file =>
          pattern.filePatterns.some(p => this.matchesPattern(file, p))
        );
        score += matchedFiles.length * 15;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = taskType;
      }
    }

    return bestMatch;
  }

  /**
   * Infer required capabilities from task
   */
  private inferRequiredCapabilities(task: Task, keywords: string[]): string[] {
    const capabilities = new Set<string>();

    // Map keywords to capabilities
    const capabilityKeywords: Record<string, string[]> = {
      'browser-interaction': ['click', 'navigate', 'screenshot', 'browser'],
      'file-access': ['read', 'write', 'fetch', 'download'],
      'real-time': ['live', 'real-time', 'streaming', 'websocket'],
      'authentication': ['auth', 'login', 'token', 'credentials'],
      'search': ['search', 'find', 'discover', 'query'],
      'analysis': ['analyze', 'scan', 'check', 'validate']
    };

    for (const [capability, kws] of Object.entries(capabilityKeywords)) {
      if (kws.some(kw => keywords.includes(kw))) {
        capabilities.add(capability);
      }
    }

    return Array.from(capabilities);
  }

  /**
   * Assess task complexity
   */
  private assessComplexity(task: Task): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;

    // Factor 1: Description length
    if (task.description.length > 200) complexityScore += 2;
    else if (task.description.length > 100) complexityScore += 1;

    // Factor 2: Number of files involved
    if (task.files && task.files.length > 5) complexityScore += 2;
    else if (task.files && task.files.length > 2) complexityScore += 1;

    // Factor 3: Keywords indicating complexity
    const complexKeywords = ['integrate', 'orchestrate', 'coordinate', 'multi-step', 'parallel'];
    const text = `${task.name} ${task.description}`.toLowerCase();
    if (complexKeywords.some(kw => text.includes(kw))) complexityScore += 2;

    // Classify
    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  /**
   * Generate MCP recommendations based on task analysis
   */
  private generateRecommendations(
    taskAnalysis: MCPSelectionResult['taskAnalysis']
  ): MCPRecommendation[] {
    const recommendations: MCPRecommendation[] = [];

    // Get primary recommendation from task type
    const taskTypePattern = TASK_TYPE_PATTERNS[taskAnalysis.taskType as keyof typeof TASK_TYPE_PATTERNS];
    if (taskTypePattern) {
      const primaryMCP = MCP_CAPABILITIES[taskTypePattern.primaryMCP];
      if (primaryMCP) {
        recommendations.push({
          mcpName: taskTypePattern.primaryMCP,
          confidence: taskTypePattern.confidence,
          reasoning: `Task type '${taskAnalysis.taskType}' best matches ${primaryMCP.name} capabilities: ${primaryMCP.strengths.slice(0, 2).join(', ')}`,
          capabilities: primaryMCP.strengths
        });
      }
    }

    // Add alternative recommendations based on required capabilities
    for (const [mcpName, capability] of Object.entries(MCP_CAPABILITIES)) {
      // Skip if already recommended as primary
      if (recommendations.some(r => r.mcpName === mcpName)) continue;

      // Check if MCP capabilities match required capabilities
      const matchScore = this.calculateCapabilityMatch(
        capability,
        taskAnalysis.requiredCapabilities,
        taskAnalysis.keywords
      );

      if (matchScore > 30) {
        recommendations.push({
          mcpName,
          confidence: matchScore,
          reasoning: `Alternative: ${capability.name} provides ${capability.strengths[0]}, relevant for ${taskAnalysis.requiredCapabilities.join(', ')}`,
          capabilities: capability.strengths
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate how well MCP capabilities match requirements
   */
  private calculateCapabilityMatch(
    mcp: MCPCapability,
    requiredCapabilities: string[],
    keywords: string[]
  ): number {
    let score = 0;

    // Check if MCP strengths align with required capabilities
    for (const strength of mcp.strengths) {
      const strengthLower = strength.toLowerCase();

      // Direct capability match
      if (requiredCapabilities.some(cap => strengthLower.includes(cap.toLowerCase()))) {
        score += 20;
      }

      // Keyword match
      if (keywords.some(kw => strengthLower.includes(kw))) {
        score += 10;
      }
    }

    // Bonus for use case match
    for (const useCase of mcp.useCases) {
      if (keywords.some(kw => useCase.toLowerCase().includes(kw))) {
        score += 15;
      }
    }

    return Math.min(score, 100); // Cap at 100%
  }

  /**
   * Check if file matches glob pattern
   */
  private matchesPattern(file: string, pattern: string): boolean {
    // Simple glob matching (** for recursive, * for any)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '\\/');

    return new RegExp(`^${regexPattern}$`).test(file);
  }

  /**
   * Get all available MCPs
   */
  getAvailableMCPs(): string[] {
    return Object.keys(MCP_CAPABILITIES);
  }

  /**
   * Get MCP capabilities
   */
  getMCPCapabilities(mcpName: string): MCPCapability | undefined {
    return MCP_CAPABILITIES[mcpName];
  }
}

// Export singleton instance
export const mcpSelectionEngine = new MCPSelectionEngine();
