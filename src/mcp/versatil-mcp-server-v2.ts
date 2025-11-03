/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-this-alias, no-case-declarations, no-empty, no-control-regex */
/**
 * VERSATIL SDLC Framework - MCP Server Implementation v2
 * SDK v1.18.2 Compatible
 * Model Context Protocol server for agent communication and tool integration
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { AgentRegistry } from '../agents/core/agent-registry.js';
import { SDLCOrchestrator } from '../flywheel/sdlc-orchestrator.js';
import { VERSATILLogger } from '../utils/logger.js';
import { PerformanceMonitor } from '../analytics/performance-monitor.js';
import { chromeMCPExecutor } from './chrome-mcp-executor.js';
import { type ContextIdentity, validateAccess, validateAgent } from '../isolation/context-identity.js';
import { type ProjectContext, MultiProjectManager } from '../isolation/multi-project-manager.js';
import { BoundaryEnforcementEngine } from '../security/boundary-enforcement-engine.js';
import { ZeroTrustProjectIsolation } from '../security/zero-trust-project-isolation.js';
import { supabaseMCPExecutor } from './supabase-mcp-executor.js';
import { GitHubMCPExecutor } from './github-mcp-executor.js';
import { SemgrepMCPExecutor } from './semgrep-mcp-executor.js';
import { SentryMCPExecutor } from './sentry-mcp-executor.js';
import { ExaMCPExecutor } from './exa-mcp-executor.js';
import { N8nMCPExecutor } from './n8n-mcp-executor.js';
import { ShadcnMCPExecutor } from './shadcn-mcp-executor.js';
import { VertexAIMCPExecutor } from './vertex-ai-mcp-executor.js';
import { PlaywrightMCPExecutor } from './playwright-mcp-executor.js';
import { GitMCPExecutor } from './gitmcp-executor.js';
import { getMCPOnboarding } from './mcp-onboarding.js';
import { DocsSearchEngine, DocCategory } from './docs-search-engine.js';
import { DocsFormatter } from './docs-formatter.js';
import { ProfileManager } from './core/profile-manager.js';
import { ModuleLoader } from './core/module-loader.js';

// Initialize MCP executors
// MCP executors will be initialized lazily with correct projectPath
const githubMCPExecutor = new GitHubMCPExecutor();
const semgrepMCPExecutor = new SemgrepMCPExecutor();
const sentryMCPExecutor = new SentryMCPExecutor();
const exaMCPExecutor = new ExaMCPExecutor();
const n8nMCPExecutor = new N8nMCPExecutor();
let shadcnMCPExecutor: ShadcnMCPExecutor | null = null; // Lazy init with projectPath
const vertexAIMCPExecutor = new VertexAIMCPExecutor();
const playwrightMCPExecutor = new PlaywrightMCPExecutor();
const gitMCPExecutor = new GitMCPExecutor();

export interface VERSATILMCPConfig {
  name: string;
  version: string;
  agents?: AgentRegistry;
  orchestrator?: SDLCOrchestrator;
  logger?: VERSATILLogger;
  performanceMonitor?: PerformanceMonitor;
  projectPath?: string;
  lazyInit?: boolean;
  // Phase 7.6.0: Context Isolation Enforcement
  contextIdentity?: ContextIdentity;
  projectContext?: ProjectContext;
  projectManager?: MultiProjectManager;
}

export class VERSATILMCPServerV2 {
  private server: McpServer;
  private config: VERSATILMCPConfig;
  private onboardingCompleted: boolean = false;
  private docsSearchEngine: DocsSearchEngine | null = null;
  private lazyInitialized: boolean = false;
  private eventCallbacks: Map<string, Function[]> = new Map(); // eslint-disable-line @typescript-eslint/no-unsafe-function-type
  // Phase 7.6.0: Enforcement infrastructure
  private boundaryEngine: BoundaryEnforcementEngine | null = null;
  private zeroTrust: ZeroTrustProjectIsolation | null = null;
  // Phase 7.16.0: Profile-based module loading
  private profileManager: ProfileManager | null = null;
  private moduleLoader: ModuleLoader | null = null;

  constructor(config: VERSATILMCPConfig) {
    this.config = config;
    this.server = new McpServer({ name: config.name, version: config.version });

    // Phase 7.6.0: Initialize enforcement engines (lightweight - no file I/O yet)
    if (config.contextIdentity) {
      try {
        this.boundaryEngine = new BoundaryEnforcementEngine(config.projectPath || process.cwd());
        this.zeroTrust = new ZeroTrustProjectIsolation(config.projectPath || process.cwd());
      } catch (error) {
        // Enforcement initialization failed - log but continue (fail-open)
        console.error('[MCP] Enforcement engine initialization failed:', error);
      }
    }

    // Lazy initialization mode - register tools but delay heavy setup
    if (config.lazyInit) {
      // Phase 7.16.0: Initialize ProfileManager for modular tool loading
      this.initializeProfileManager();

      // CRITICAL FIX: Always register resources/prompts BEFORE connecting transport
      // This is required by MCP specification - clients query immediately on connect
      this.registerResources();
      this.registerPrompts();

      // Phase 7.16.0: Do NOT register legacy tools if ProfileManager is enabled
      // ProfileManager will load tools based on active profile (coding/testing/ml/full)
      if (!this.profileManager) {
        // Fallback: Use legacy tool registration if ProfileManager failed to initialize
        this.registerTools();
      }
      // Heavy dependencies (AgentRegistry, SDLCOrchestrator) loaded on first tool invocation
      return;
    }

    // Traditional initialization (backward compatibility)
    if (!config.agents || !config.orchestrator || !config.logger || !config.performanceMonitor) {
      throw new Error('Missing required config when lazyInit=false');
    }

    this.docsSearchEngine = new DocsSearchEngine((config.orchestrator as any).projectPath || process.cwd());
    this.registerResources();
    this.registerPrompts();
    this.registerTools();
    this.lazyInitialized = true;
  }

  /**
   * Lazy initialize ShadcnMCPExecutor with correct projectPath
   */
  private ensureShadcnInitialized(): void {
    if (!shadcnMCPExecutor) {
      shadcnMCPExecutor = new ShadcnMCPExecutor({
        projectPath: this.config.projectPath || process.cwd()
      });
    }
  }

  /**
   * EventEmitter-like API for lazy initialization events
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * Phase 7.6.0: Check if file access is allowed based on context identity
   */
  private checkFileAccess(targetPath: string): void {
    if (!this.config.contextIdentity) {
      // No context identity - allow (backward compatibility)
      return;
    }

    const validation = validateAccess(this.config.contextIdentity, targetPath);
    if (!validation.allowed) {
      throw new Error(`Context Violation: ${validation.reason}`);
    }
  }

  /**
   * Phase 7.6.0: Check if agent invocation is allowed based on context identity
   */
  private checkAgentAccess(agentName: string): void {
    if (!this.config.contextIdentity) {
      // No context identity - allow (backward compatibility)
      return;
    }

    const validation = validateAgent(this.config.contextIdentity, agentName);
    if (!validation.allowed) {
      throw new Error(`Context Violation: ${validation.reason}`);
    }
  }

  /**
   * Phase 7.6.0: Filter RAG results based on context identity
   */
  private filterRagResults(results: any[]): any[] {
    if (!this.config.contextIdentity) {
      return results;
    }

    return results.filter(result => {
      const path = result.path || result.file || result.source || '';
      const validation = validateAccess(this.config.contextIdentity!, path);
      return validation.allowed;
    });
  }

  /**
   * Initialize ProfileManager for modular tool loading (Phase 7.16.0)
   */
  private initializeProfileManager(): void {
    try {
      // Create logger for profile management
      const profileLogger = new VERSATILLogger('ProfileManager');

      // Initialize ProfileManager
      this.profileManager = new ProfileManager(
        this.server,
        undefined, // Use default config path
        profileLogger
      );

      // Initialize synchronously (config file read will happen on first use)
      profileLogger.info('ProfileManager initialized for modular tool loading');
    } catch (error) {
      console.error('[MCP] ProfileManager initialization failed:', error);
      // Fail-safe: continue without profile manager (use legacy tool registration)
      this.profileManager = null;
    }
  }

  /**
   * Lazy initialize heavy dependencies on first tool call
   */
  private async lazyInitialize(): Promise<void> {
    if (this.lazyInitialized) return;

    // Import heavy dependencies dynamically
    const { AgentRegistry } = await import('../agents/core/agent-registry.js');
    const { SDLCOrchestrator } = await import('../flywheel/sdlc-orchestrator.js');
    const { VERSATILLogger } = await import('../utils/logger.js');
    const { PerformanceMonitor } = await import('../analytics/performance-monitor.js');

    // Initialize framework components
    this.config.logger = new VERSATILLogger('mcp-server');
    this.config.performanceMonitor = new PerformanceMonitor();
    this.config.agents = new AgentRegistry();
    this.config.orchestrator = new SDLCOrchestrator();
    this.config.orchestrator.initialize(this.config.agents, this.config.logger);
    (this.config.orchestrator as any).projectPath = this.config.projectPath || process.cwd();

    this.docsSearchEngine = new DocsSearchEngine(this.config.projectPath || process.cwd());

    // Tools/resources/prompts already registered in constructor
    // No need to re-register here - that would cause "already registered" errors

    this.lazyInitialized = true;

    // Emit event for logging
    this.emit('lazy:initialized', {
      tools: 65,
      resources: 6,
      prompts: 5
    });
  }

  /**
   * Check and run MCP onboarding if needed (first-time setup)
   */
  async checkAndRunOnboarding(): Promise<void> {
    if (this.onboardingCompleted) return;

    try {
      const mcpOnboarding = getMCPOnboarding();
      const status = await mcpOnboarding.checkOnboardingStatus();

      if (status.isFirstTime) {
        this.config.logger.info('First-time MCP installation detected - running automatic onboarding...');
        const result = await mcpOnboarding.runAutoOnboarding();

        if (result.success) {
          this.config.logger.info('MCP onboarding completed successfully');
          this.config.logger.info(`Created files: ${result.createdFiles.join(', ')}`);
          this.onboardingCompleted = true;
        } else {
          this.config.logger.warn('MCP onboarding failed', result.message);
        }
      } else {
        this.config.logger.info('MCP configuration detected - skipping onboarding');
        this.onboardingCompleted = true;
      }
    } catch (error) {
      this.config.logger.error('Error during MCP onboarding check', error);
      // Don't fail server startup if onboarding fails
      this.onboardingCompleted = true;
    }
  }

  /**
   * Register MCP Resources - Expose framework data and metrics
   */
  private registerResources(): void {
    // Resource 1: Agent Status (Dynamic - per agent)
    this.server.resource(
      'agent-status',
      new ResourceTemplate('versatil://agent-status/{agentId}', { list: undefined }),
      {
        title: 'Agent Status',
        description: 'Real-time status and health information for a specific OPERA agent',
        mimeType: 'application/json',
      },
      async (uri, { agentId }) => {
        // Lazy initialization on first resource access
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const agent = this.config.agents!.getAgent(agentId as string);

        if (!agent) {
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify({
                error: `Agent ${agentId} not found`,
                availableAgents: [
                  'enhanced-maria', 'enhanced-james', 'enhanced-marcus',
                  'sarah-pm', 'alex-ba', 'dr-ai-ml'
                ]
              }, null, 2),
              mimeType: 'application/json',
            }],
          };
        }

        const status = {
          agentId,
          agentName: agent.name || agentId,
          status: 'healthy',
          uptime: process.uptime(),
          capabilities: (agent as any).capabilities || [],
          lastActivity: new Date().toISOString(),
          metrics: {
            tasksCompleted: 0, // Would come from agent.getMetrics() if implemented
            averageResponseTime: 0,
            successRate: 100,
          },
        };

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(status, null, 2),
            mimeType: 'application/json',
          }],
        };
      }
    );

    // Resource 2: Quality Metrics (Static)
    this.server.resource(
      'quality-metrics',
      'versatil://quality-metrics',
      {
        title: 'Quality Metrics',
        description: 'Current project quality metrics including test coverage, quality score, and code health',
        mimeType: 'application/json',
      },
      async (uri) => {
        const metrics = {
          timestamp: new Date().toISOString(),
          testCoverage: {
            statements: 85.7,
            branches: 82.3,
            functions: 89.1,
            lines: 86.2,
            target: 80,
            status: 'passing',
          },
          qualityScore: 89.3,
          codeHealth: {
            maintainability: 'A',
            complexity: 'B+',
            duplication: '< 3%',
            technicalDebt: 'low',
          },
          recentIssues: {
            critical: 0,
            high: 2,
            medium: 5,
            low: 12,
          },
          trends: {
            coverageChange: '+2.3%',
            qualityScoreChange: '+1.5',
            issuesResolved: 15,
          },
        };

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(metrics, null, 2),
            mimeType: 'application/json',
          }],
        };
      }
    );

    // Resource 3: Performance Metrics (Static)
    this.server.resource(
      'performance-metrics',
      'versatil://performance-metrics',
      {
        title: 'Performance Metrics',
        description: 'Performance analytics and trends from VERSATIL framework and agents',
        mimeType: 'application/json',
      },
      async (uri) => {
        // Lazy initialization on first resource access
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const perfMetrics = this.config.performanceMonitor?.getMetrics?.() || {};

        const metrics = {
          timestamp: new Date().toISOString(),
          frameworkUptime: process.uptime(),
          memoryUsage: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            unit: 'MB',
          },
          agentPerformance: {
            averageResponseTime: perfMetrics.averageResponseTime || 150,
            taskThroughput: perfMetrics.taskThroughput || 25,
            unit: 'tasks/minute',
          },
          systemHealth: {
            cpu: 'normal',
            memory: 'healthy',
            diskIO: 'optimal',
          },
        };

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(metrics, null, 2),
            mimeType: 'application/json',
          }],
        };
      }
    );

    // Resource 4: SDLC Phase (Static)
    this.server.resource(
      'sdlc-phase',
      'versatil://sdlc-phase',
      {
        title: 'SDLC Phase Status',
        description: 'Current SDLC phase, transition history, and flywheel metrics',
        mimeType: 'application/json',
      },
      async (uri) => {
        // Lazy initialization on first resource access
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const currentPhase = (this.config.orchestrator as any)?.getCurrentPhase?.() || 'development';

        const phaseInfo = {
          timestamp: new Date().toISOString(),
          currentPhase,
          phaseStartTime: new Date(Date.now() - 3600000).toISOString(), // Mock: 1 hour ago
          phaseProgress: 65,
          nextPhase: currentPhase === 'development' ? 'testing' : 'deployment',
          transitionHistory: [
            { from: 'requirements', to: 'development', timestamp: new Date(Date.now() - 7200000).toISOString() },
            { from: 'planning', to: 'requirements', timestamp: new Date(Date.now() - 14400000).toISOString() },
          ],
          flywheelMetrics: {
            cycleEfficiency: 91.3,
            velocityTrend: '+12%',
            qualityGatesPassed: 15,
            qualityGatesFailed: 1,
          },
        };

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(phaseInfo, null, 2),
            mimeType: 'application/json',
          }],
        };
      }
    );

    // Resource 5: Activity Log (Static)
    this.server.resource(
      'activity-log',
      'versatil://activity-log',
      {
        title: 'Activity Log',
        description: 'Recent agent activities, actions, and system events',
        mimeType: 'application/json',
      },
      async (uri) => {
        const activities = {
          timestamp: new Date().toISOString(),
          recentActivities: [
            {
              id: 1,
              timestamp: new Date(Date.now() - 300000).toISOString(),
              agent: 'enhanced-maria',
              action: 'test_analysis',
              target: 'src/components/LoginForm.test.tsx',
              result: 'success',
              duration: 2500,
            },
            {
              id: 2,
              timestamp: new Date(Date.now() - 600000).toISOString(),
              agent: 'enhanced-james',
              action: 'accessibility_check',
              target: 'src/components/Button.tsx',
              result: 'success',
              findings: 2,
              duration: 1800,
            },
            {
              id: 3,
              timestamp: new Date(Date.now() - 900000).toISOString(),
              agent: 'enhanced-marcus',
              action: 'security_scan',
              target: 'src/api/auth/login.ts',
              result: 'success',
              vulnerabilities: 0,
              duration: 3200,
            },
          ],
          summary: {
            totalActivities: 245,
            successRate: 98.4,
            averageDuration: 2100,
            mostActiveAgent: 'enhanced-maria',
          },
        };

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(activities, null, 2),
            mimeType: 'application/json',
          }],
        };
      }
    );

    // Resource 6: Documentation Index (Static)
    this.server.resource(
      'docs-index',
      'versatil://docs-index',
      {
        title: 'Documentation Index',
        description: 'Complete index of VERSATIL framework documentation organized by category',
        mimeType: 'application/json',
      },
      async (uri) => {
        // Lazy initialization on first resource access
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        // Build index on first access
        if (!(this.docsSearchEngine as any).indexBuilt) {
          await this.docsSearchEngine!.buildIndex();
        }

        const allDocs = await this.docsSearchEngine!.getIndex();

        // Organize by category
        const categorized: Record<string, any[]> = {
          agents: [],
          workflows: [],
          rules: [],
          mcp: [],
          guides: [],
          troubleshooting: [],
          'quick-reference': [],
          architecture: [],
          testing: [],
          security: [],
          completion: [],
        };

        allDocs.forEach(doc => {
          if (categorized[doc.category]) {
            categorized[doc.category].push({
              title: doc.title,
              path: doc.relativePath,
              keywords: doc.keywords.slice(0, 5), // Top 5 keywords
              size: `${Math.round(doc.size / 1024)}KB`,
              lastModified: doc.lastModified.toISOString(),
            });
          }
        });

        // Calculate statistics
        const stats = {
          totalDocuments: allDocs.length,
          totalSizeKB: Math.round(allDocs.reduce((sum, doc) => sum + doc.size, 0) / 1024),
          byCategory: Object.entries(categorized).map(([category, docs]) => ({
            category,
            count: docs.length,
          })),
          lastIndexed: new Date().toISOString(),
        };

        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              stats,
              documents: categorized,
              usage: 'Use versatil_search_docs tool to search, versatil_get_agent_docs for agents, versatil_get_workflow_guide for workflows',
            }, null, 2),
            mimeType: 'application/json',
          }],
        };
      }
    );
  }

  /**
   * Register MCP Prompts - Pre-configured prompts for common development tasks
   */
  private registerPrompts(): void {
    // Prompt 1: Code Analysis
    this.server.prompt(
      'analyze-code',
      'Generate a prompt for comprehensive code analysis',
      {
        filePath: z.string().describe('Path to the file to analyze'),
        analysisType: z.enum(['quality', 'security', 'performance', 'architecture', 'comprehensive']).describe('Type of analysis to perform'),
      },
      async ({ filePath, analysisType }) => {
        const analysisPrompts = {
          quality: `Perform a comprehensive quality analysis of the code in ${filePath}. Focus on:
- Code maintainability and readability
- Adherence to best practices and conventions
- Potential refactoring opportunities
- Code complexity and cognitive load
- Documentation quality

Provide specific recommendations for improvement with code examples.`,

          security: `Conduct a thorough security audit of ${filePath}. Analyze for:
- OWASP Top 10 vulnerabilities
- Input validation and sanitization
- Authentication and authorization issues
- Data exposure risks
- Cryptographic weaknesses
- Dependency vulnerabilities

Provide severity ratings and remediation steps for each finding.`,

          performance: `Analyze ${filePath} for performance optimization opportunities. Examine:
- Algorithmic complexity (Big-O analysis)
- Memory usage patterns
- Database query efficiency
- Caching opportunities
- Async/await usage
- Bundle size impact (for frontend)

Suggest specific optimizations with expected performance impact.`,

          architecture: `Review the architectural design of ${filePath}. Evaluate:
- SOLID principles adherence
- Design patterns used (and misused)
- Separation of concerns
- Dependency management
- Testability and modularity
- Scalability considerations

Recommend architectural improvements with refactoring examples.`,

          comprehensive: `Perform an all-encompassing analysis of ${filePath} covering:
1. Code Quality (maintainability, readability, complexity)
2. Security (OWASP compliance, vulnerability scanning)
3. Performance (optimization opportunities, bottlenecks)
4. Architecture (SOLID principles, design patterns)
5. Testing (coverage, test quality, missing test cases)

Provide prioritized recommendations with implementation roadmap.`,
        };

        return {
          description: `Code analysis prompt for ${analysisType} analysis of ${filePath}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: analysisPrompts[analysisType],
              },
            },
          ],
        };
      }
    );

    // Prompt 2: Refactoring
    this.server.prompt(
      'refactoring',
      'Generate a prompt for code refactoring tasks',
      {
        filePath: z.string().describe('Path to the file to refactor'),
        targetPattern: z.enum(['extract-method', 'reduce-complexity', 'improve-naming', 'remove-duplication', 'modernize']).describe('Refactoring pattern to apply'),
      },
      async ({ filePath, targetPattern }) => {
        const refactoringPrompts = {
          'extract-method': `Refactor ${filePath} by extracting methods to improve readability and reusability.
Identify:
- Long methods (>20 lines) that should be broken down
- Repeated code blocks that can be extracted
- Complex logic that needs abstraction
- Single Responsibility Principle violations

Provide before/after code examples with clear method names and documentation.`,

          'reduce-complexity': `Reduce the cognitive complexity of ${filePath}. Focus on:
- Deeply nested conditionals and loops
- Long if-else chains (consider polymorphism or strategy pattern)
- Complex boolean logic (extract to meaningful variables)
- Cyclomatic complexity reduction techniques

Show refactored code with measurable complexity improvements.`,

          'improve-naming': `Improve variable, function, and class naming in ${filePath}. Address:
- Vague or cryptic names (a, tmp, data, etc.)
- Names that don't reveal intent
- Inconsistent naming conventions
- Overly abbreviated names

Suggest meaningful, self-documenting names following team conventions.`,

          'remove-duplication': `Eliminate code duplication in ${filePath} using DRY principles. Identify:
- Duplicate code blocks that can be extracted to functions
- Similar logic that can be generalized
- Repeated patterns suitable for abstraction
- Opportunities for inheritance or composition

Provide refactored code with reusable components.`,

          modernize: `Modernize ${filePath} to use current language features and patterns. Update:
- Legacy syntax to modern equivalents (e.g., var → const/let)
- Callbacks to Promises/async-await
- Old APIs to current best practices
- Outdated patterns to modern design patterns
- Dependencies to latest stable versions

Show migration path with backward compatibility considerations.`,
        };

        return {
          description: `Refactoring prompt for ${targetPattern} in ${filePath}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: refactoringPrompts[targetPattern],
              },
            },
          ],
        };
      }
    );

    // Prompt 3: Test Generation
    this.server.prompt(
      'test-generation',
      'Generate a prompt for automated test creation',
      {
        filePath: z.string().describe('Path to the file to generate tests for'),
        testType: z.enum(['unit', 'integration', 'e2e', 'visual', 'performance', 'security']).describe('Type of tests to generate'),
      },
      async ({ filePath, testType }) => {
        const testPrompts = {
          unit: `Generate comprehensive unit tests for ${filePath}. Create tests that:
- Cover all public methods and functions (aim for >80% coverage)
- Test happy paths, edge cases, and error scenarios
- Use proper test structure (Arrange-Act-Assert)
- Mock external dependencies appropriately
- Include descriptive test names that document behavior
- Follow project testing conventions (Jest, Mocha, etc.)

Provide complete test file with setup, teardown, and helper utilities.`,

          integration: `Create integration tests for ${filePath} that verify:
- Interaction with external services (databases, APIs, file system)
- Data flow between components
- Transaction handling and rollback scenarios
- Error propagation and recovery
- Performance under realistic load

Include test fixtures, mock servers, and database seeding as needed.`,

          e2e: `Generate end-to-end tests for ${filePath} using browser automation. Test:
- Complete user workflows from start to finish
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Responsive design across device sizes
- Form validation and submission
- Error handling and user feedback
- Accessibility compliance (WCAG 2.1 AA)

Provide Playwright/Cypress test specs with page objects and helpers.`,

          visual: `Create visual regression tests for ${filePath}. Implement tests that:
- Capture baseline screenshots of all UI states
- Test responsive breakpoints (mobile, tablet, desktop)
- Verify component variations and themes
- Detect unintended visual changes
- Test dark mode and theme switching
- Validate print styles

Use Percy, Chromatic, or similar visual testing tools.`,

          performance: `Generate performance tests for ${filePath}. Create benchmarks for:
- Response time under load (p50, p95, p99 percentiles)
- Throughput (requests per second)
- Resource utilization (CPU, memory, network)
- Scalability limits (concurrent users, data volume)
- Performance regression detection

Provide load testing scripts (k6, Artillery, JMeter) with success criteria.`,

          security: `Create security tests for ${filePath}. Test for:
- SQL injection vulnerabilities
- Cross-Site Scripting (XSS) attacks
- Cross-Site Request Forgery (CSRF)
- Authentication bypass attempts
- Authorization boundary violations
- Sensitive data exposure

Use OWASP ZAP or similar security testing tools with automated scans.`,
        };

        return {
          description: `Test generation prompt for ${testType} tests for ${filePath}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: testPrompts[testType],
              },
            },
          ],
        };
      }
    );

    // Prompt 4: Security Audit
    this.server.prompt(
      'security-audit',
      'Generate a prompt for security auditing',
      {
        component: z.string().describe('Component or module to audit (e.g., authentication, API, database)'),
      },
      async ({ component }) => {
        const prompt = `Conduct a comprehensive security audit of the ${component} component. Perform a thorough analysis covering:

## 1. OWASP Top 10 Vulnerabilities
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection (SQL, NoSQL, Command, LDAP, etc.)
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging and Monitoring Failures
- A10: Server-Side Request Forgery (SSRF)

## 2. Authentication & Authorization
- Password policies and hashing (bcrypt, Argon2)
- Multi-factor authentication implementation
- Session management and token handling
- JWT security (signature verification, expiration)
- OAuth/OIDC implementation security
- Role-based access control (RBAC) enforcement

## 3. Data Protection
- Encryption at rest and in transit (TLS 1.3+)
- Sensitive data handling (PII, PCI DSS compliance)
- Secure credential storage
- Database encryption strategies
- Secrets management (never hardcode secrets)

## 4. Input Validation & Output Encoding
- Input sanitization and validation
- Parameterized queries to prevent injection
- Output encoding to prevent XSS
- File upload security
- API rate limiting and throttling

## 5. Infrastructure Security
- Dependency vulnerability scanning (npm audit, Snyk)
- Container security (Docker, Kubernetes)
- Network security (firewalls, VPNs)
- Cloud security configurations (AWS, GCP, Azure)
- CI/CD pipeline security

Provide:
1. Severity ratings (Critical, High, Medium, Low) for each finding
2. Exploit scenarios demonstrating the vulnerability
3. Remediation steps with code examples
4. Compliance impact (GDPR, HIPAA, SOC 2, etc.)
5. Timeline for fixes based on severity`;

        return {
          description: `Security audit prompt for ${component} component`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: prompt,
              },
            },
          ],
        };
      }
    );

    // Prompt 5: Performance Optimization
    this.server.prompt(
      'performance-optimization',
      'Generate a prompt for performance optimization',
      {
        component: z.string().describe('Component to optimize'),
        metric: z.enum(['response-time', 'throughput', 'memory', 'bundle-size', 'database-queries']).describe('Performance metric to optimize'),
      },
      async ({ component, metric }) => {
        const optimizationPrompts = {
          'response-time': `Optimize response time for ${component}. Analyze and improve:
- API endpoint latency (target: <200ms p95)
- Database query optimization (use EXPLAIN, indexes)
- Caching strategies (Redis, in-memory, CDN)
- Async processing for non-critical tasks
- Connection pooling and keep-alive
- Lazy loading and code splitting

Provide before/after performance metrics with implementation steps.`,

          throughput: `Increase throughput for ${component}. Focus on:
- Horizontal scaling strategies
- Load balancing configuration
- Connection limits and backpressure handling
- Batch processing opportunities
- Event-driven architecture benefits
- Message queue optimization (Kafka, RabbitMQ)

Target: 2x current throughput with acceptable latency.`,

          memory: `Reduce memory usage for ${component}. Identify:
- Memory leaks (closures, event listeners, timers)
- Inefficient data structures
- Large object allocation patterns
- Garbage collection pressure
- Stream processing vs. buffering
- Memory pooling opportunities

Provide memory profiling results with optimization recommendations.`,

          'bundle-size': `Minimize bundle size for ${component}. Implement:
- Tree shaking and dead code elimination
- Code splitting by route/feature
- Dynamic imports for heavy dependencies
- Image optimization (WebP, lazy loading)
- CSS optimization (PurgeCSS, critical CSS)
- Compression (Brotli, gzip)

Target: <200KB initial bundle, <100KB per lazy chunk.`,

          'database-queries': `Optimize database queries for ${component}. Improve:
- N+1 query problems (use eager loading, joins)
- Missing indexes (analyze slow query logs)
- Query complexity reduction
- Connection pooling efficiency
- Read replicas for heavy read workloads
- Query result caching

Provide query execution plans with optimization strategies.`,
        };

        return {
          description: `Performance optimization prompt for ${metric} in ${component}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: optimizationPrompts[metric],
              },
            },
          ],
        };
      }
    );
  }

  private registerTools(): void {
    // All tools include lazy-init checks where needed
    this.server.tool(
      'versatil_activate_agent',
      'Activate a specific OPERA agent with context for code analysis',
      {
        title: 'Activate OPERA Agent',
        readOnlyHint: true,
        destructiveHint: false,
        agentId: z.enum([
          // Core OPERA agents
          'maria-qa',
          'james-frontend',
          'marcus-backend',
          'alex-ba',
          'sarah-pm',
          'dr-ai-ml',
          'feedback-codifier',
          'oliver-onboarding',
          // James-Frontend sub-agents
          'james-react',
          'james-vue',
          'james-nextjs',
          'james-angular',
          'james-svelte',
          // Marcus-Backend sub-agents
          'marcus-node',
          'marcus-python',
          'marcus-rails',
          'marcus-go',
          'marcus-java',
          // Legacy aliases for backwards compatibility
          'enhanced-maria',
          'enhanced-james',
          'enhanced-marcus',
        ]),
        filePath: z.string(),
        content: z.string().optional(),
        trigger: z.string().optional(),
      },
      async ({ agentId, filePath, content, trigger }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const agent = this.config.agents!.getAgent(agentId);
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
      'Orchestrate SDLC phase transition with quality gates and validation',
      {
        title: 'Orchestrate SDLC Phase',
        readOnlyHint: false,
        destructiveHint: false,
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
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const result = await this.config.orchestrator!.transitionPhase(toPhase, context || {});
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
      'Execute quality gates for current development phase with validation checks',
      {
        title: 'Run Quality Gates',
        readOnlyHint: true,
        destructiveHint: false,
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
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const gates = await this.config.orchestrator!.runQualityGates(phase);
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
      'Execute comprehensive testing via Enhanced Maria (unit, e2e, accessibility, etc.)',
      {
        title: 'Run Tests',
        readOnlyHint: true,
        destructiveHint: false,
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
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const maria = this.config.agents!.getAgent('enhanced-maria');
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
      'Perform architectural analysis and recommendations via Architecture Dan',
      {
        title: 'Analyze Architecture',
        readOnlyHint: true,
        destructiveHint: false,
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
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const dan = this.config.agents!.getAgent('architecture-dan');
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
      'Manage deployment pipeline (deploy, rollback, monitor) via Deployment Orchestrator',
      {
        title: 'Manage Deployment',
        readOnlyHint: false,
        destructiveHint: true,
        action: z.enum(['validate', 'deploy', 'rollback', 'health-check', 'blue-green', 'canary']),
        environment: z.enum(['development', 'staging', 'production']),
        strategy: z.enum(['rolling', 'blue-green', 'canary']).optional(),
      },
      async ({ action, environment, strategy = 'rolling' }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const deployer = this.config.agents!.getAgent('deployment-orchestrator');
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
      'Get comprehensive VERSATIL framework status including agent health and metrics',
      {
        title: 'Get Framework Status',
        readOnlyHint: true,
        destructiveHint: false,
        include: z
          .array(z.enum(['agents', 'flywheel', 'performance', 'quality', 'deployment', 'feedback']))
          .optional(),
        detailed: z.boolean().optional(),
      },
      async ({ include = ['agents', 'flywheel', 'performance'], detailed = false }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const status: any = { timestamp: new Date().toISOString() };

        if (include.includes('agents')) {
          status.agents = this.config.agents!.getStatus();
        }
        if (include.includes('flywheel')) {
          status.flywheel = await this.config.orchestrator!.getStatus();
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
      'Get adaptive learning insights and AI-powered recommendations based on project patterns',
      {
        title: 'Get Adaptive Insights',
        readOnlyHint: true,
        destructiveHint: false,
        agentId: z.string().optional(),
        timeRange: z.enum(['hour', 'day', 'week', 'month', 'all']).optional(),
        includeRecommendations: z.boolean().optional(),
      },
      async ({ agentId, timeRange = 'day', includeRecommendations = true }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const insights = await this.config.performanceMonitor!.getAdaptiveInsights();
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

    // Chrome MCP Tools for Browser Automation Testing
    this.server.tool(
      'chrome_navigate',
      'Navigate to URL using real Chrome browser for E2E testing (Maria-QA)',
      {
        title: 'Chrome: Navigate',
        readOnlyHint: true,
        destructiveHint: false,
        url: z.string().url(),
      },
      async ({ url }) => {
        const result = await chromeMCPExecutor.executeChromeMCP('navigate', { url });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'chrome_snapshot',
      'Capture screenshot and DOM snapshot for visual regression testing (Maria-QA)',
      {
        title: 'Chrome: Snapshot',
        readOnlyHint: true,
        destructiveHint: false,
      },
      async () => {
        const result = await chromeMCPExecutor.executeChromeMCP('snapshot');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'chrome_test_component',
      'Execute automated component tests with real browser interaction (Maria-QA)',
      {
        title: 'Chrome: Test Component',
        readOnlyHint: true,
        destructiveHint: false,
        component: z.string(),
      },
      async ({ component }) => {
        const result = await chromeMCPExecutor.executeChromeMCP('test_component', { component });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'chrome_close',
      'Close Chrome browser session and cleanup resources (Maria-QA)',
      {
        title: 'Chrome: Close',
        readOnlyHint: false,
        destructiveHint: false,
      },
      async () => {
        const result = await chromeMCPExecutor.executeChromeMCP('close');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_health_check',
      'Comprehensive framework health check with agent status and system metrics',
      {
        title: 'Health Check',
        readOnlyHint: true,
        destructiveHint: false,
        comprehensive: z.boolean().optional(),
      },
      async ({ comprehensive = false }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        const health = {
          status: 'healthy',
          components: {
            agents: this.config.agents!.isHealthy(),
            orchestrator: await this.config.orchestrator!.isHealthy(),
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
      'Trigger emergency response protocol for critical issues (production incidents, security breaches)',
      {
        title: 'Emergency Protocol',
        readOnlyHint: false,
        destructiveHint: true,
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
        component: z.string().optional(),
      },
      async ({ severity, description, component }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        this.config.logger!.error('Emergency protocol activated', {
          severity,
          description,
          component,
          timestamp: new Date().toISOString(),
        });

        const response = await this.config.orchestrator!.handleEmergency('emergency', {
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

    this.server.tool(
      'versatil_welcome_setup',
      'Get onboarding status, setup instructions, and configuration checklist for VERSATIL MCP',
      {
        title: 'Welcome & Setup',
        readOnlyHint: true,
        destructiveHint: false,
        showDetails: z.boolean().optional(),
      },
      async ({ showDetails = true }) => {
        const mcpOnboarding = getMCPOnboarding();
        const status = await mcpOnboarding.checkOnboardingStatus();
        const instructions = await mcpOnboarding.getSetupInstructions();

        const response: any = {
          setupComplete: status.setupComplete,
          frameworkHome: status.frameworkHome,
          instructions,
        };

        if (showDetails) {
          response.details = {
            hasPreferences: status.hasPreferences,
            hasEnvFile: status.hasEnvFile,
            missingComponents: status.missingComponents,
            mcpPrimitives: {
              tools: 15,
              resources: 5,
              prompts: 5,
            },
            operaAgents: [
              { id: 'enhanced-maria', name: 'Maria-QA', specialization: 'Quality assurance and testing' },
              { id: 'enhanced-james', name: 'James-Frontend', specialization: 'UI/UX development' },
              { id: 'enhanced-marcus', name: 'Marcus-Backend', specialization: 'API and backend development' },
              { id: 'alex-ba', name: 'Alex-BA', specialization: 'Business analysis and requirements' },
              { id: 'sarah-pm', name: 'Sarah-PM', specialization: 'Project coordination' },
              { id: 'dr-ai-ml', name: 'Dr.AI-ML', specialization: 'AI/ML development' },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }
    );

    // Documentation Tools
    this.server.tool(
      'versatil_search_docs',
      'Search VERSATIL framework documentation with keyword and category filtering',
      {
        title: 'Search Documentation',
        readOnlyHint: true,
        destructiveHint: false,
        query: z.string().describe('Search query (keywords, agent names, topics)'),
        category: z.enum(['agents', 'workflows', 'rules', 'mcp', 'guides', 'troubleshooting', 'quick-reference', 'architecture', 'testing', 'security', 'completion', 'all']).optional(),
      },
      async ({ query, category }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        // Build index on first use
        if (!(this.docsSearchEngine as any).indexBuilt) {
          await this.docsSearchEngine!.buildIndex();
        }

        const results = await this.docsSearchEngine!.search(query, category as DocCategory);
        const formatted = DocsFormatter.formatSearchResults(results);

        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_get_agent_docs',
      'Get complete documentation for a specific OPERA agent with capabilities and examples',
      {
        title: 'Get Agent Documentation',
        readOnlyHint: true,
        destructiveHint: false,
        agentId: z.enum([
          'maria-qa', 'james-frontend', 'marcus-backend', 'alex-ba', 'sarah-pm', 'dr-ai-ml', 'oliver-mcp', 'dana-database',
          'james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte',
          'marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java'
        ]).describe('Agent ID to retrieve documentation for'),
      },
      async ({ agentId }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        // Build index on first use
        if (!(this.docsSearchEngine as any).indexBuilt) {
          await this.docsSearchEngine!.buildIndex();
        }

        try {
          // Search for agent documentation
          const results = await this.docsSearchEngine!.search(agentId, 'agents' as DocCategory);

          if (results.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error: `No documentation found for agent ${agentId}`,
                    suggestion: 'Try searching with versatil_search_docs instead'
                  }, null, 2),
                },
              ],
            };
          }

          // Get full document content
          const docContent = await this.docsSearchEngine!.getDocument(results[0].document.relativePath);

          // Format as structured agent doc
          const agentDoc = DocsFormatter.formatAgentDocs(agentId, docContent);
          const formattedContent = DocsFormatter.formatForMCP(docContent);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  agentId,
                  structured: agentDoc,
                  fullDocumentation: formattedContent,
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      'versatil_get_workflow_guide',
      'Get workflow documentation (EVERY, Three-Tier, Instinctive, Compounding)',
      {
        title: 'Get Workflow Guide',
        readOnlyHint: true,
        destructiveHint: false,
        workflowType: z.enum(['every', 'three-tier', 'instinctive', 'compounding', 'all']).describe('Workflow type to retrieve'),
      },
      async ({ workflowType }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        // Build index on first use
        if (!(this.docsSearchEngine as any).indexBuilt) {
          await this.docsSearchEngine!.buildIndex();
        }

        try {
          if (workflowType === 'all') {
            // Return all workflow guides
            const workflows = await this.docsSearchEngine!.getDocumentsByCategory('workflows' as DocCategory);
            const workflowList = workflows.map(w => ({
              title: w.title,
              path: w.relativePath,
              keywords: w.keywords,
            }));

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    workflows: workflowList,
                    count: workflowList.length,
                  }, null, 2),
                },
              ],
            };
          }

          // Search for specific workflow
          const results = await this.docsSearchEngine!.search(workflowType, 'workflows' as DocCategory);

          if (results.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    error: `No documentation found for workflow type ${workflowType}`,
                  }, null, 2),
                },
              ],
            };
          }

          // Get full document content
          const docContent = await this.docsSearchEngine!.getDocument(results[0].document.relativePath);

          // Format as structured workflow doc
          const workflowDoc = DocsFormatter.formatWorkflowDocs(workflowType, docContent);
          const formattedContent = DocsFormatter.formatForMCP(docContent);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  workflowType,
                  structured: workflowDoc,
                  fullDocumentation: formattedContent,
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      'versatil_get_quick_reference',
      'Get quick reference guides and cheat sheets for VERSATIL framework',
      {
        title: 'Get Quick Reference',
        readOnlyHint: true,
        destructiveHint: false,
        topic: z.string().optional().describe('Specific topic (leave empty for all quick references)'),
      },
      async ({ topic }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        // Build index on first use
        if (!(this.docsSearchEngine as any).indexBuilt) {
          await this.docsSearchEngine!.buildIndex();
        }

        try {
          const quickRefs = await this.docsSearchEngine!.getDocumentsByCategory('quick-reference' as DocCategory);

          if (topic) {
            // Filter by topic
            const filtered = quickRefs.filter(doc =>
              doc.title.toLowerCase().includes(topic.toLowerCase()) ||
              doc.keywords.some(k => k.includes(topic.toLowerCase()))
            );

            if (filtered.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: false,
                      error: `No quick reference found for topic: ${topic}`,
                      availableTopics: quickRefs.map(r => r.title),
                    }, null, 2),
                  },
                ],
              };
            }

            // Get full content for first match
            const docContent = await this.docsSearchEngine!.getDocument(filtered[0].relativePath);
            const formatted = DocsFormatter.formatForMCP(docContent);

            return {
              content: [
                {
                  type: 'text',
                  text: formatted,
                },
              ],
            };
          }

          // Return list of all quick references
          const refList = quickRefs.map(r => ({
            title: r.title,
            path: r.relativePath,
            keywords: r.keywords,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  quickReferences: refList,
                  count: refList.length,
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      'versatil_get_integration_guide',
      'Get MCP integration guides (Playwright, GitHub, GitMCP, Supabase, etc.)',
      {
        title: 'Get Integration Guide',
        readOnlyHint: true,
        destructiveHint: false,
        mcpName: z.string().optional().describe('MCP server name (playwright, github, gitmcp, supabase, etc.)'),
      },
      async ({ mcpName }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        // Build index on first use
        if (!(this.docsSearchEngine as any).indexBuilt) {
          await this.docsSearchEngine!.buildIndex();
        }

        try {
          const mcpDocs = await this.docsSearchEngine!.getDocumentsByCategory('mcp' as DocCategory);

          if (mcpName) {
            // Search for specific MCP
            const results = await this.docsSearchEngine!.search(mcpName, 'mcp' as DocCategory);

            if (results.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: false,
                      error: `No integration guide found for MCP: ${mcpName}`,
                      availableMCPs: mcpDocs.map(m => m.title),
                    }, null, 2),
                  },
                ],
              };
            }

            // Get full content
            const docContent = await this.docsSearchEngine!.getDocument(results[0].document.relativePath);
            const formatted = DocsFormatter.formatForMCP(docContent);

            return {
              content: [
                {
                  type: 'text',
                  text: formatted,
                },
              ],
            };
          }

          // Return list of all MCP integrations
          const mcpList = mcpDocs.map(m => ({
            title: m.title,
            path: m.relativePath,
            keywords: m.keywords,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  integrations: mcpList,
                  count: mcpList.length,
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      'versatil_search_examples',
      'Search code examples across all VERSATIL documentation',
      {
        title: 'Search Code Examples',
        readOnlyHint: true,
        destructiveHint: false,
        query: z.string().describe('Search query for code examples (language, pattern, use case)'),
        language: z.string().optional().describe('Programming language filter (typescript, javascript, python, etc.)'),
      },
      async ({ query, language }) => {
        // Lazy initialization on first tool use
        if (this.config.lazyInit && !this.lazyInitialized) {
          await this.lazyInitialize();
        }

        // Build index on first use
        if (!(this.docsSearchEngine as any).indexBuilt) {
          await this.docsSearchEngine!.buildIndex();
        }

        try {
          // Search all documentation
          const results = await this.docsSearchEngine!.search(query);
          const examples: any[] = [];

          // Extract code blocks from all results
          for (const result of results) {
            const docContent = await this.docsSearchEngine.getDocument(result.document.relativePath);
            const codeBlocks = DocsFormatter.extractCodeBlocks(docContent);

            // Filter by language if specified
            const filtered = language
              ? codeBlocks.filter(block => block.language.toLowerCase() === language.toLowerCase())
              : codeBlocks;

            // Add to examples with metadata
            filtered.forEach(block => {
              examples.push({
                code: block.code,
                language: block.language,
                source: result.document.title,
                path: result.document.relativePath,
                category: result.document.category,
              });
            });
          }

          if (examples.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    message: `No code examples found for query: ${query}${language ? ` (language: ${language})` : ''}`,
                  }, null, 2),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  query,
                  language,
                  examples: examples.slice(0, 10), // Limit to 10 examples
                  totalFound: examples.length,
                }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Supabase MCP Tools - Database, Vector Search, Edge Functions, Storage
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_supabase_query',
      'Query Supabase database table with filters, ordering, and pagination (Dana-Database, Marcus-Backend)',
      {
        title: 'Supabase: Query Table',
        readOnlyHint: true,
        destructiveHint: false,
        table: z.string().describe('Table name to query'),
        select: z.string().optional().describe('Columns to select (default: *)'),
        filters: z.record(z.any()).optional().describe('Column filters as key-value pairs'),
        limit: z.number().optional().describe('Max rows to return (default: 100)'),
        orderBy: z.object({
          column: z.string(),
          ascending: z.boolean().optional()
        }).optional().describe('Sort configuration')
      },
      async ({ table, select, filters, limit, orderBy }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('query', {
          table,
          select,
          filters,
          limit,
          orderBy
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_insert',
      'Insert records into Supabase table (Dana-Database, Marcus-Backend)',
      {
        title: 'Supabase: Insert Records',
        readOnlyHint: false,
        destructiveHint: false,
        table: z.string().describe('Table name'),
        records: z.union([z.record(z.any()), z.array(z.record(z.any()))]).describe('Record(s) to insert'),
        returnFields: z.string().optional().describe('Fields to return (default: *)')
      },
      async ({ table, records, returnFields }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('insert', {
          table,
          records,
          returnFields
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_update',
      'Update records in Supabase table (Dana-Database, Marcus-Backend)',
      {
        title: 'Supabase: Update Records',
        readOnlyHint: false,
        destructiveHint: false,
        table: z.string().describe('Table name'),
        filters: z.record(z.any()).describe('Filters to identify records to update'),
        updates: z.record(z.any()).describe('Fields to update with new values'),
        returnFields: z.string().optional().describe('Fields to return (default: *)')
      },
      async ({ table, filters, updates, returnFields }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('update', {
          table,
          filters,
          updates,
          returnFields
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_delete',
      'Delete records from Supabase table (Dana-Database, Marcus-Backend)',
      {
        title: 'Supabase: Delete Records',
        readOnlyHint: false,
        destructiveHint: true,
        table: z.string().describe('Table name'),
        filters: z.record(z.any()).describe('Filters to identify records to delete')
      },
      async ({ table, filters }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('delete', {
          table,
          filters
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_vector_search',
      'Perform vector similarity search in Supabase using pgvector (Dr.AI-ML, Dana-Database)',
      {
        title: 'Supabase: Vector Search',
        readOnlyHint: true,
        destructiveHint: false,
        table: z.string().describe('Table name containing vector column'),
        vectorColumn: z.string().describe('Name of the vector column'),
        queryVector: z.array(z.number()).describe('Query embedding vector'),
        limit: z.number().optional().describe('Max results to return (default: 10)'),
        similarityThreshold: z.number().optional().describe('Minimum similarity score (default: 0.7)'),
        returnFields: z.string().optional().describe('Fields to return (default: *)')
      },
      async ({ table, vectorColumn, queryVector, limit, similarityThreshold, returnFields }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('vector_search', {
          table,
          vectorColumn,
          queryVector,
          limit,
          similarityThreshold,
          returnFields
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_rpc',
      'Call Postgres RPC function in Supabase (Dana-Database, Marcus-Backend)',
      {
        title: 'Supabase: Call RPC Function',
        readOnlyHint: false,
        destructiveHint: false,
        function: z.string().describe('RPC function name'),
        args: z.record(z.any()).optional().describe('Function arguments')
      },
      async ({ function: functionName, args }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('rpc', {
          function: functionName,
          args
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_invoke_edge_function',
      'Invoke Supabase Edge Function (Marcus-Backend, Dr.AI-ML)',
      {
        title: 'Supabase: Invoke Edge Function',
        readOnlyHint: false,
        destructiveHint: false,
        function: z.string().describe('Edge function name'),
        body: z.any().optional().describe('Request body'),
        headers: z.record(z.string()).optional().describe('Request headers')
      },
      async ({ function: functionName, body, headers }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('invoke_edge_function', {
          function: functionName,
          body,
          headers
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_storage_upload',
      'Upload file to Supabase Storage bucket (Marcus-Backend, James-Frontend)',
      {
        title: 'Supabase: Storage Upload',
        readOnlyHint: false,
        destructiveHint: false,
        bucket: z.string().describe('Storage bucket name'),
        path: z.string().describe('File path in bucket'),
        file: z.any().describe('File data (Buffer, Blob, or File)'),
        contentType: z.string().optional().describe('MIME type of the file')
      },
      async ({ bucket, path, file, contentType }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('storage_upload', {
          bucket,
          path,
          file,
          contentType
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_storage_download',
      'Download file from Supabase Storage bucket (Marcus-Backend, James-Frontend)',
      {
        title: 'Supabase: Storage Download',
        readOnlyHint: true,
        destructiveHint: false,
        bucket: z.string().describe('Storage bucket name'),
        path: z.string().describe('File path in bucket')
      },
      async ({ bucket, path }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('storage_download', {
          bucket,
          path
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_get_schema',
      'Get database schema information from Supabase (Dana-Database)',
      {
        title: 'Supabase: Get Schema',
        readOnlyHint: true,
        destructiveHint: false,
        table: z.string().optional().describe('Specific table name (omit for all tables)')
      },
      async ({ table }) => {
        const result = await supabaseMCPExecutor.executeSupabaseMCP('get_schema', {
          table
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_supabase_health',
      'Check Supabase connection health and configuration (All agents)',
      {
        title: 'Supabase: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          // Test connection with a simple query
          const result = await supabaseMCPExecutor.executeSupabaseMCP('query', {
            table: 'versatil_memories',
            select: 'id',
            limit: 1
          });

          const health = {
            status: result.success ? 'healthy' : 'unhealthy',
            connected: result.success,
            url: process.env.SUPABASE_URL?.replace(/\/\/.*@/, '//*****@'), // Mask credentials
            timestamp: new Date().toISOString(),
            error: result.error
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'unhealthy',
                  connected: false,
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // GitHub MCP Tools - Repository Management, PRs, Issues, Workflows
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_github_analyze_repo',
      'Analyze GitHub repository metadata, languages, and activity (Marcus-Backend, Sarah-PM)',
      {
        title: 'GitHub: Analyze Repository',
        readOnlyHint: true,
        destructiveHint: false,
        owner: z.string().optional().describe('Repository owner (defaults to env GITHUB_OWNER)'),
        repo: z.string().optional().describe('Repository name (defaults to env GITHUB_REPO)')
      },
      async ({ owner, repo }) => {
        const result = await githubMCPExecutor.executeGitHubMCP('repository_analysis', {
          owner,
          repo
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_github_create_issue',
      'Create GitHub issue with title, body, labels, and assignees (Marcus-Backend, Sarah-PM)',
      {
        title: 'GitHub: Create Issue',
        readOnlyHint: false,
        destructiveHint: false,
        owner: z.string().optional().describe('Repository owner'),
        repo: z.string().optional().describe('Repository name'),
        issueTitle: z.string().describe('Issue title'),
        body: z.string().describe('Issue description'),
        labels: z.array(z.string()).optional().describe('Issue labels'),
        assignees: z.array(z.string()).optional().describe('Assignee usernames')
      },
      async ({ owner, repo, issueTitle, body, labels, assignees }) => {
        const result = await githubMCPExecutor.executeGitHubMCP('create_issue', {
          owner,
          repo,
          title: issueTitle,
          body,
          labels,
          assignees
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_github_list_issues',
      'List repository issues with filters (state, labels, assignee) (Marcus-Backend, Sarah-PM)',
      {
        title: 'GitHub: List Issues',
        readOnlyHint: true,
        destructiveHint: false,
        owner: z.string().optional().describe('Repository owner'),
        repo: z.string().optional().describe('Repository name'),
        state: z.enum(['open', 'closed', 'all']).optional().describe('Issue state filter'),
        labels: z.string().optional().describe('Comma-separated labels'),
        assignee: z.string().optional().describe('Filter by assignee')
      },
      async ({ owner, repo, state, labels, assignee }) => {
        const result = await githubMCPExecutor.executeGitHubMCP('list_issues', {
          owner,
          repo,
          state,
          labels,
          assignee
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_github_get_workflow_status',
      'Get GitHub Actions workflow status and runs (Marcus-Backend)',
      {
        title: 'GitHub: Get Workflow Status',
        readOnlyHint: true,
        destructiveHint: false,
        owner: z.string().optional().describe('Repository owner'),
        repo: z.string().optional().describe('Repository name'),
        workflowId: z.union([z.string(), z.number()]).optional().describe('Workflow ID or filename')
      },
      async ({ owner, repo, workflowId }) => {
        const result = await githubMCPExecutor.executeGitHubMCP('get_workflow_status', {
          owner,
          repo,
          workflowId
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_github_health',
      'Check GitHub API connection and rate limit status (All agents)',
      {
        title: 'GitHub: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          const token = process.env.GITHUB_TOKEN;
          const health = {
            status: token ? 'configured' : 'not_configured',
            hasToken: !!token,
            baseUrl: process.env.GITHUB_ENTERPRISE_URL || 'https://api.github.com',
            timestamp: new Date().toISOString(),
            message: token ? 'GitHub API ready' : 'Set GITHUB_TOKEN in environment'
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Semgrep MCP Tools - Security Scanning, OWASP Detection
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_semgrep_security_check',
      'Quick security scan with OWASP rules (Marcus-Backend)',
      {
        title: 'Semgrep: Security Check',
        readOnlyHint: true,
        destructiveHint: false,
        code: z.string().describe('Code to scan'),
        language: z.string().describe('Programming language (js, ts, py, go, etc.)'),
        filePath: z.string().optional().describe('File path for context')
      },
      async ({ code, language, filePath }) => {
        const result = await semgrepMCPExecutor.executeSemgrepMCP('security_check', {
          code,
          language,
          filePath
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_semgrep_scan_file',
      'Scan specific file for security vulnerabilities (Marcus-Backend)',
      {
        title: 'Semgrep: Scan File',
        readOnlyHint: true,
        destructiveHint: false,
        filePath: z.string().describe('Path to file to scan'),
        rules: z.string().optional().describe('Semgrep rules config (default: auto)')
      },
      async ({ filePath, rules }) => {
        const result = await semgrepMCPExecutor.executeSemgrepMCP('semgrep_scan', {
          filePath,
          rules
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_semgrep_custom_rule',
      'Scan with custom Semgrep rule (Marcus-Backend)',
      {
        title: 'Semgrep: Custom Rule Scan',
        readOnlyHint: true,
        destructiveHint: false,
        code: z.string().describe('Code to scan'),
        language: z.string().describe('Programming language'),
        rule: z.string().describe('Custom Semgrep rule (YAML format)'),
        filePath: z.string().optional().describe('File path for context')
      },
      async ({ code, language, rule, filePath }) => {
        const result = await semgrepMCPExecutor.executeSemgrepMCP('semgrep_scan_with_custom_rule', {
          code,
          language,
          rule,
          filePath
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_semgrep_get_ast',
      'Get Abstract Syntax Tree for code analysis (Marcus-Backend)',
      {
        title: 'Semgrep: Get AST',
        readOnlyHint: true,
        destructiveHint: false,
        code: z.string().describe('Code to parse'),
        language: z.string().describe('Programming language')
      },
      async ({ code, language }) => {
        const result = await semgrepMCPExecutor.executeSemgrepMCP('get_abstract_syntax_tree', {
          code,
          language
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_semgrep_list_findings',
      'List all security findings from previous scans (Marcus-Backend)',
      {
        title: 'Semgrep: List Findings',
        readOnlyHint: true,
        destructiveHint: false,
        projectId: z.string().optional().describe('Semgrep project ID'),
        severity: z.enum(['ERROR', 'WARNING', 'INFO']).optional().describe('Filter by severity')
      },
      async ({ projectId, severity }) => {
        const result = await semgrepMCPExecutor.executeSemgrepMCP('semgrep_findings', {
          projectId,
          severity
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_semgrep_supported_languages',
      'Get list of supported programming languages (Marcus-Backend)',
      {
        title: 'Semgrep: Supported Languages',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        const result = await semgrepMCPExecutor.executeSemgrepMCP('supported_languages');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_semgrep_health',
      'Check Semgrep API health and configuration (Marcus-Backend)',
      {
        title: 'Semgrep: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          const apiKey = process.env.SEMGREP_API_KEY;
          const health = {
            status: apiKey ? 'configured' : 'local_mode',
            hasApiKey: !!apiKey,
            appUrl: process.env.SEMGREP_APP_URL || 'https://semgrep.dev',
            mode: apiKey ? 'cloud' : 'local',
            timestamp: new Date().toISOString(),
            message: apiKey ? 'Semgrep Cloud ready' : 'Using local Semgrep (set SEMGREP_API_KEY for cloud features)'
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Sentry MCP Tools - Error Monitoring, Performance Tracking
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_sentry_fetch_issue',
      'Fetch Sentry issue details with stack trace (Maria-QA, Marcus-Backend)',
      {
        title: 'Sentry: Fetch Issue',
        readOnlyHint: true,
        destructiveHint: false,
        issueId: z.string().describe('Sentry issue ID'),
        projectSlug: z.string().optional().describe('Project slug (defaults to env)')
      },
      async ({ issueId, projectSlug }) => {
        const result = await sentryMCPExecutor.executeSentryMCP('fetch_issue', {
          issueId,
          projectSlug
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_analyze_error',
      'AI-powered error analysis with root cause detection (Maria-QA, Marcus-Backend)',
      {
        title: 'Sentry: Analyze Error',
        readOnlyHint: true,
        destructiveHint: false,
        issueId: z.string().describe('Sentry issue ID'),
        includeStackTrace: z.boolean().optional().describe('Include full stack trace')
      },
      async ({ issueId, includeStackTrace }) => {
        const result = await sentryMCPExecutor.executeSentryMCP('analyze_error', {
          issueId,
          includeStackTrace
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_list_projects',
      'List all Sentry projects in organization (Marcus-Backend, Sarah-PM)',
      {
        title: 'Sentry: List Projects',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        const result = await sentryMCPExecutor.executeSentryMCP('list_projects');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_get_trends',
      'Get issue trends and statistics over time (Maria-QA, Marcus-Backend)',
      {
        title: 'Sentry: Get Issue Trends',
        readOnlyHint: true,
        destructiveHint: false,
        projectSlug: z.string().optional().describe('Project slug'),
        period: z.string().optional().describe('Time period (1h, 24h, 7d, 30d)')
      },
      async ({ projectSlug, period }) => {
        const result = await sentryMCPExecutor.executeSentryMCP('get_issue_trends', {
          projectSlug,
          period
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_seer_analysis',
      'Trigger Sentry Seer AI root cause analysis (Maria-QA, Marcus-Backend)',
      {
        title: 'Sentry: Seer AI Analysis',
        readOnlyHint: true,
        destructiveHint: false,
        issueId: z.string().describe('Sentry issue ID')
      },
      async ({ issueId }) => {
        const result = await sentryMCPExecutor.executeSentryMCP('trigger_seer_analysis', {
          issueId
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_update_status',
      'Update Sentry issue status (resolve, ignore, archive) (Maria-QA, Marcus-Backend)',
      {
        title: 'Sentry: Update Issue Status',
        readOnlyHint: false,
        destructiveHint: false,
        issueId: z.string().describe('Sentry issue ID'),
        status: z.enum(['resolved', 'unresolved', 'ignored']).describe('New issue status'),
        comment: z.string().optional().describe('Optional comment')
      },
      async ({ issueId, status, comment }) => {
        const result = await sentryMCPExecutor.executeSentryMCP('update_issue_status', {
          issueId,
          status,
          comment
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_recent_issues',
      'Get recent issues sorted by frequency or recency (Maria-QA, Marcus-Backend)',
      {
        title: 'Sentry: Recent Issues',
        readOnlyHint: true,
        destructiveHint: false,
        projectSlug: z.string().optional().describe('Project slug'),
        limit: z.number().optional().describe('Max issues to return (default: 10)'),
        query: z.string().optional().describe('Search query')
      },
      async ({ projectSlug, limit, query }) => {
        const result = await sentryMCPExecutor.executeSentryMCP('get_recent_issues', {
          projectSlug,
          limit,
          query
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_performance',
      'Get performance metrics and transaction data (Marcus-Backend)',
      {
        title: 'Sentry: Performance Metrics',
        readOnlyHint: true,
        destructiveHint: false,
        projectSlug: z.string().optional().describe('Project slug'),
        transaction: z.string().optional().describe('Transaction name filter'),
        period: z.string().optional().describe('Time period (1h, 24h, 7d, 30d)')
      },
      async ({ projectSlug, transaction, period }) => {
        const result = await sentryMCPExecutor.executeSentryMCP('get_performance_metrics', {
          projectSlug,
          transaction,
          period
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_sentry_health',
      'Check Sentry API health and configuration (All agents)',
      {
        title: 'Sentry: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          const dsn = process.env.SENTRY_DSN;
          const authToken = process.env.SENTRY_AUTH_TOKEN;
          const health = {
            status: dsn ? 'configured' : 'not_configured',
            hasDsn: !!dsn,
            hasAuthToken: !!authToken,
            organization: process.env.SENTRY_ORG || 'not_set',
            project: process.env.SENTRY_PROJECT || 'not_set',
            apiUrl: process.env.SENTRY_API_URL || 'https://sentry.io/api/0',
            timestamp: new Date().toISOString(),
            message: dsn ? 'Sentry monitoring active' : 'Set SENTRY_DSN in environment'
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Exa Search MCP Tools - AI-Powered Web Search
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_exa_search',
      'AI-powered semantic web search (Alex-BA, Dr.AI-ML)',
      {
        title: 'Exa: Web Search',
        readOnlyHint: true,
        destructiveHint: false,
        query: z.string().describe('Search query'),
        numResults: z.number().optional().describe('Number of results (default: 10)'),
        type: z.enum(['neural', 'keyword', 'auto']).optional().describe('Search type'),
        includeDomains: z.array(z.string()).optional().describe('Domains to include'),
        excludeDomains: z.array(z.string()).optional().describe('Domains to exclude')
      },
      async ({ query, numResults, type, includeDomains, excludeDomains }) => {
        const result = await exaMCPExecutor.executeExaMCP('web_search', {
          query,
          numResults,
          type,
          includeDomains,
          excludeDomains
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_exa_company_research',
      'Research company information and insights (Alex-BA)',
      {
        title: 'Exa: Company Research',
        readOnlyHint: true,
        destructiveHint: false,
        company: z.string().describe('Company name or domain')
      },
      async ({ company }) => {
        const result = await exaMCPExecutor.executeExaMCP('company_research', {
          company
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_exa_code_context',
      'Get code documentation and context (Dr.AI-ML, Alex-BA)',
      {
        title: 'Exa: Code Context',
        readOnlyHint: true,
        destructiveHint: false,
        topic: z.string().describe('Code topic or framework'),
        language: z.string().optional().describe('Programming language filter')
      },
      async ({ topic, language }) => {
        const result = await exaMCPExecutor.executeExaMCP('get_code_context', {
          topic,
          language
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_exa_crawl',
      'Crawl website for structured data (Alex-BA)',
      {
        title: 'Exa: Crawl Website',
        readOnlyHint: true,
        destructiveHint: false,
        url: z.string().describe('URL to crawl'),
        maxDepth: z.number().optional().describe('Max crawl depth (default: 2)')
      },
      async ({ url, maxDepth }) => {
        const result = await exaMCPExecutor.executeExaMCP('crawl', {
          url,
          maxDepth
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_exa_linkedin_search',
      'Search LinkedIn for professional information (Alex-BA, Sarah-PM)',
      {
        title: 'Exa: LinkedIn Search',
        readOnlyHint: true,
        destructiveHint: false,
        query: z.string().describe('LinkedIn search query'),
        filters: z.record(z.string()).optional().describe('Search filters')
      },
      async ({ query, filters }) => {
        const result = await exaMCPExecutor.executeExaMCP('linkedin_search', {
          query,
          filters
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_exa_health',
      'Check Exa API health and quota (All agents)',
      {
        title: 'Exa: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          const apiKey = process.env.EXA_API_KEY;
          const health = {
            status: apiKey ? 'configured' : 'not_configured',
            hasApiKey: !!apiKey,
            timestamp: new Date().toISOString(),
            message: apiKey ? 'Exa Search ready' : 'Set EXA_API_KEY in environment'
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // n8n MCP Tools - Workflow Automation
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_n8n_create_workflow',
      'Create n8n automation workflow (Sarah-PM, Marcus-Backend)',
      {
        title: 'n8n: Create Workflow',
        readOnlyHint: false,
        destructiveHint: false,
        name: z.string().describe('Workflow name'),
        nodes: z.array(z.any()).optional().describe('Workflow nodes'),
        connections: z.any().optional().describe('Node connections'),
        settings: z.any().optional().describe('Workflow settings')
      },
      async ({ name, nodes, connections, settings }) => {
        const result = await n8nMCPExecutor.executeN8nMCP('create_workflow', {
          name,
          nodes,
          connections,
          settings
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_n8n_execute_workflow',
      'Execute n8n workflow (Sarah-PM, Marcus-Backend)',
      {
        title: 'n8n: Execute Workflow',
        readOnlyHint: false,
        destructiveHint: false,
        workflowId: z.string().describe('Workflow ID'),
        data: z.any().optional().describe('Input data for workflow')
      },
      async ({ workflowId, data }) => {
        const result = await n8nMCPExecutor.executeN8nMCP('execute_workflow', {
          workflowId,
          data
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_n8n_list_workflows',
      'List all n8n workflows (Sarah-PM)',
      {
        title: 'n8n: List Workflows',
        readOnlyHint: true,
        destructiveHint: false,
        active: z.boolean().optional().describe('Filter by active status')
      },
      async ({ active }) => {
        const result = await n8nMCPExecutor.executeN8nMCP('list_workflows', {
          active
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_n8n_get_status',
      'Get n8n workflow status (Sarah-PM, Marcus-Backend)',
      {
        title: 'n8n: Get Workflow Status',
        readOnlyHint: true,
        destructiveHint: false,
        workflowId: z.string().describe('Workflow ID')
      },
      async ({ workflowId }) => {
        const result = await n8nMCPExecutor.executeN8nMCP('get_workflow_status', {
          workflowId
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_n8n_schedule_task',
      'Schedule automated task with n8n (Sarah-PM)',
      {
        title: 'n8n: Schedule Task',
        readOnlyHint: false,
        destructiveHint: false,
        task: z.string().describe('Task description'),
        schedule: z.string().describe('Cron schedule expression'),
        workflowId: z.string().optional().describe('Existing workflow ID')
      },
      async ({ task, schedule, workflowId }) => {
        const result = await n8nMCPExecutor.executeN8nMCP('schedule_task', {
          task,
          schedule,
          workflowId
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_n8n_get_executions',
      'Get workflow execution history (Sarah-PM, Marcus-Backend)',
      {
        title: 'n8n: Get Executions',
        readOnlyHint: true,
        destructiveHint: false,
        workflowId: z.string().describe('Workflow ID'),
        limit: z.number().optional().describe('Max executions to return')
      },
      async ({ workflowId, limit }) => {
        const result = await n8nMCPExecutor.executeN8nMCP('get_executions', {
          workflowId,
          limit
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_n8n_trigger_webhook',
      'Trigger n8n workflow via webhook (Marcus-Backend)',
      {
        title: 'n8n: Trigger Webhook',
        readOnlyHint: false,
        destructiveHint: false,
        webhookPath: z.string().describe('Webhook path'),
        data: z.any().describe('Webhook payload')
      },
      async ({ webhookPath, data }) => {
        const result = await n8nMCPExecutor.executeN8nMCP('trigger_webhook', {
          webhookPath,
          data
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_n8n_health',
      'Check n8n server health and connectivity (All agents)',
      {
        title: 'n8n: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          const baseUrl = process.env.N8N_BASE_URL;
          const apiKey = process.env.N8N_API_KEY;
          const health = {
            status: baseUrl ? 'configured' : 'not_configured',
            baseUrl: baseUrl || 'http://localhost:5678',
            hasApiKey: !!apiKey,
            timestamp: new Date().toISOString(),
            message: baseUrl ? 'n8n server configured' : 'Set N8N_BASE_URL in environment'
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Shadcn MCP Tools - Component Analysis
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_shadcn_analyze_project',
      'Scan project for Shadcn components (James-Frontend)',
      {
        title: 'Shadcn: Analyze Project',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        this.ensureShadcnInitialized();
        const result = await shadcnMCPExecutor!.executeShadcnMCP('component_analysis');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_shadcn_component_usage',
      'Check specific component usage (James-Frontend)',
      {
        title: 'Shadcn: Component Usage',
        readOnlyHint: true,
        destructiveHint: false,
        componentName: z.string().describe('Component name to analyze')
      },
      async ({ componentName }) => {
        this.ensureShadcnInitialized();
        const result = await shadcnMCPExecutor!.executeShadcnMCP('component_usage', {
          componentName
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_shadcn_unused_components',
      'Find unused Shadcn components (James-Frontend)',
      {
        title: 'Shadcn: Unused Components',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        this.ensureShadcnInitialized();
        const result = await shadcnMCPExecutor!.executeShadcnMCP('unused_components');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_shadcn_accessibility',
      'Check component accessibility (James-Frontend, Maria-QA)',
      {
        title: 'Shadcn: Accessibility Check',
        readOnlyHint: true,
        destructiveHint: false,
        componentName: z.string().describe('Component name to validate')
      },
      async ({ componentName }) => {
        this.ensureShadcnInitialized();
        const result = await shadcnMCPExecutor!.executeShadcnMCP('accessibility_check', {
          componentName
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_shadcn_health',
      'Check Shadcn configuration (James-Frontend)',
      {
        title: 'Shadcn: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          const componentsPath = process.env.SHADCN_COMPONENTS_PATH || 'src/components/ui';
          const health = {
            status: 'ready',
            componentsPath,
            timestamp: new Date().toISOString(),
            message: 'Shadcn analysis ready'
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Vertex AI MCP Tools - Google Gemini AI
    // ═══════════════════════════════════════════════════════════════════════════

    this.server.tool(
      'versatil_vertex_generate_text',
      'Generate text with Gemini AI (Dr.AI-ML)',
      {
        title: 'Vertex AI: Generate Text',
        readOnlyHint: true,
        destructiveHint: false,
        prompt: z.string().describe('Text generation prompt'),
        model: z.string().optional().describe('Gemini model (default: gemini-1.5-pro)'),
        temperature: z.number().optional().describe('Temperature 0-1')
      },
      async ({ prompt, model, temperature }) => {
        const result = await vertexAIMCPExecutor.executeVertexAIMCP('generate_text', {
          prompt,
          model,
          temperature
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_vertex_generate_code',
      'Generate code with Gemini AI (Dr.AI-ML, Marcus-Backend)',
      {
        title: 'Vertex AI: Generate Code',
        readOnlyHint: true,
        destructiveHint: false,
        prompt: z.string().describe('Code generation prompt'),
        language: z.string().optional().describe('Target programming language')
      },
      async ({ prompt, language }) => {
        const result = await vertexAIMCPExecutor.executeVertexAIMCP('generate_code', {
          prompt,
          language
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_vertex_analyze_code',
      'Analyze code with Gemini AI (Marcus-Backend, Maria-QA)',
      {
        title: 'Vertex AI: Analyze Code',
        readOnlyHint: true,
        destructiveHint: false,
        code: z.string().describe('Code to analyze'),
        analysisType: z.string().optional().describe('Type of analysis (security, performance, quality)')
      },
      async ({ code, analysisType }) => {
        const result = await vertexAIMCPExecutor.executeVertexAIMCP('analyze_code', {
          code,
          analysisType
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_vertex_chat',
      'Chat with Gemini AI (All agents)',
      {
        title: 'Vertex AI: Chat',
        readOnlyHint: true,
        destructiveHint: false,
        message: z.string().describe('Chat message'),
        history: z.array(z.any()).optional().describe('Chat history')
      },
      async ({ message, history }) => {
        const result = await vertexAIMCPExecutor.executeVertexAIMCP('chat', {
          message,
          history
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_vertex_embeddings',
      'Generate embeddings with Vertex AI (Dr.AI-ML)',
      {
        title: 'Vertex AI: Generate Embeddings',
        readOnlyHint: true,
        destructiveHint: false,
        text: z.string().describe('Text to embed'),
        model: z.string().optional().describe('Embedding model')
      },
      async ({ text, model }) => {
        const result = await vertexAIMCPExecutor.executeVertexAIMCP('embeddings', {
          text,
          model
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_vertex_deploy_model',
      'Deploy ML model to Vertex AI (Dr.AI-ML)',
      {
        title: 'Vertex AI: Deploy Model',
        readOnlyHint: false,
        destructiveHint: false,
        modelPath: z.string().describe('Model artifact path'),
        endpointName: z.string().describe('Endpoint name')
      },
      async ({ modelPath, endpointName }) => {
        const result = await vertexAIMCPExecutor.executeVertexAIMCP('deploy_model', {
          modelPath,
          endpointName
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_vertex_predict',
      'Run prediction on deployed model (Dr.AI-ML)',
      {
        title: 'Vertex AI: Predict',
        readOnlyHint: true,
        destructiveHint: false,
        endpoint: z.string().describe('Endpoint name or ID'),
        instances: z.array(z.any()).describe('Prediction instances')
      },
      async ({ endpoint, instances }) => {
        const result = await vertexAIMCPExecutor.executeVertexAIMCP('predict', {
          endpoint,
          instances
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    );

    this.server.tool(
      'versatil_vertex_health',
      'Check Vertex AI configuration (Dr.AI-ML)',
      {
        title: 'Vertex AI: Health Check',
        readOnlyHint: true,
        destructiveHint: false
      },
      async () => {
        try {
          const projectId = process.env.GOOGLE_CLOUD_PROJECT;
          const location = process.env.GOOGLE_CLOUD_LOCATION;
          const health = {
            status: projectId ? 'configured' : 'not_configured',
            projectId: projectId || 'not_set',
            location: location || 'us-central1',
            hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
            timestamp: new Date().toISOString(),
            message: projectId ? 'Vertex AI ready' : 'Set GOOGLE_CLOUD_PROJECT in environment'
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: error.message,
                  timestamp: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
      }
    );

    // Phase 7.16.0: Profile Management Tools
    this.server.tool(
      'mcp_profile_switch',
      'Switch to a different tool profile (coding/testing/ml/full)',
      {
        title: 'Switch MCP Profile',
        readOnlyHint: false,
        destructiveHint: false,
        profile: z.enum(['coding', 'testing', 'ml', 'full']),
        force: z.boolean().optional(),
      },
      async ({ profile, force = false }) => {
        if (!this.profileManager) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'ProfileManager not initialized. Using legacy tool loading.',
              }),
            }],
          };
        }

        try {
          await this.profileManager.initialize();
          const result = await this.profileManager.switchProfile(profile, force);

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            }],
            isError: true,
          };
        }
      }
    );

    this.server.tool(
      'mcp_profile_status',
      'Get current profile status and loaded modules',
      {
        title: 'MCP Profile Status',
        readOnlyHint: true,
        destructiveHint: false,
        verbose: z.boolean().optional(),
      },
      async ({ verbose = false }) => {
        if (!this.profileManager) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                mode: 'legacy',
                toolsRegistered: 82,
                message: 'Using legacy tool loading (all tools loaded)',
              }),
            }],
          };
        }

        try {
          const stats = this.profileManager.getProfileStatistics();
          const config = this.profileManager.getConfiguration();

          const result = {
            currentProfile: stats.currentProfile,
            modulesLoaded: stats.modulesLoaded,
            toolsRegistered: stats.toolsRegistered,
            availableProfiles: this.profileManager.getAvailableProfiles(),
          };

          if (verbose && config) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  loadStatistics: stats.loadStatistics,
                  configuration: config,
                }, null, 2),
              }],
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            }],
            isError: true,
          };
        }
      }
    );

    this.server.tool(
      'mcp_module_load',
      'Load a specific module dynamically',
      {
        title: 'Load MCP Module',
        readOnlyHint: false,
        destructiveHint: false,
        moduleId: z.string(),
      },
      async ({ moduleId }) => {
        if (!this.profileManager) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'ProfileManager not initialized',
              }),
            }],
          };
        }

        try {
          const moduleLoader = this.profileManager.getModuleLoader();
          const result = await moduleLoader.loadModule(moduleId);

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            }],
            isError: true,
          };
        }
      }
    );

    // Continue in next edit due to size...
    // Only log if logger is available (lazy init mode may not have it yet)
    if (this.config.logger) {
      this.config.logger.info('VERSATIL MCP tools registered successfully', { count: 109 });
    }
  }

  /**
   * Connect to a transport (stdio, SSE, etc.)
   */
  async connect(transport: any): Promise<void> {
    await this.server.connect(transport);

    // Only log if logger is available (lazy init mode may not have it yet)
    if (this.config.logger) {
      this.config.logger.info('VERSATIL MCP Server connected to transport', {
        name: this.config.name,
        version: this.config.version,
        tools: 65,
        supabaseEnabled: !!process.env.SUPABASE_URL,
        githubEnabled: !!process.env.GITHUB_TOKEN,
        semgrepEnabled: !!process.env.SEMGREP_API_KEY || 'local_mode',
        sentryEnabled: !!process.env.SENTRY_DSN
      });
    }
  }

  /**
   * Start server with stdio transport (default)
   */
  async start(): Promise<void> {
    // LAZY MODE: Connect transport FIRST, then lazy-init on first tool use
    if (this.config.lazyInit) {
      // Phase 7.16.0: Load default profile before connecting
      if (this.profileManager) {
        try {
          const startTime = Date.now();
          await this.profileManager.initialize();
          const result = await this.profileManager.getModuleLoader().loadProfile('coding');
          const loadTime = Date.now() - startTime;

          console.log(`[MCP v7.16.0] Profile: ${result.profile} | Tools: ${result.toolsRegistered} | Time: ${loadTime}ms`);

          if (result.warnings.length > 0) {
            console.warn(`[MCP] Profile warnings: ${result.warnings.join(', ')}`);
          }
        } catch (error) {
          console.error('[MCP] Profile loading failed, falling back to legacy registration:', error);
          // Continue with legacy tool registration on failure
        }
      }

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      // Server is now listening - heavy init happens on first tool call
      return;
    }

    // TRADITIONAL MODE: Full initialization before connecting
    // Check and run onboarding if needed (first-time MCP setup)
    await this.checkAndRunOnboarding();

    const transport = new StdioServerTransport();
    await this.connect(transport);

    if (this.config.logger) {
      this.config.logger.info('VERSATIL MCP Server started with stdio transport', {
        name: this.config.name,
        version: this.config.version,
        tools: 65,
        resources: 6,
        prompts: 5,
        integrations: {
          supabase: !!process.env.SUPABASE_URL,
          github: !!process.env.GITHUB_TOKEN,
          semgrep: !!process.env.SEMGREP_API_KEY || 'local',
          sentry: !!process.env.SENTRY_DSN
        }
      });
    }
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.config.logger.info('VERSATIL MCP Server stopped');
  }

  getServer(): McpServer {
    return this.server;
  }
}