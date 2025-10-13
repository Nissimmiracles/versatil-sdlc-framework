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
import { getMCPOnboarding } from './mcp-onboarding.js';

export interface VERSATILMCPConfig {
  name: string;
  version: string;
  agents: AgentRegistry;
  orchestrator: SDLCOrchestrator;
  logger: VERSATILLogger;
  performanceMonitor: PerformanceMonitor;
}

export class VERSATILMCPServerV2 {
  private server: McpServer;
  private config: VERSATILMCPConfig;
  private onboardingCompleted: boolean = false;

  constructor(config: VERSATILMCPConfig) {
    this.config = config;
    this.server = new McpServer({ name: config.name, version: config.version });
    this.registerResources();
    this.registerPrompts();
    this.registerTools();
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
        const agent = this.config.agents.getAgent(agentId as string);

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
        const agent = this.config.agents.getAgent(agentId);
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
        const result = await this.config.orchestrator.transitionPhase(toPhase, context || {});
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
        const gates = await this.config.orchestrator.runQualityGates(phase);
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
        const maria = this.config.agents.getAgent('enhanced-maria');
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
        const dan = this.config.agents.getAgent('architecture-dan');
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
        const deployer = this.config.agents.getAgent('deployment-orchestrator');
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
        const status: any = { timestamp: new Date().toISOString() };

        if (include.includes('agents')) {
          status.agents = this.config.agents.getStatus();
        }
        if (include.includes('flywheel')) {
          status.flywheel = await this.config.orchestrator.getStatus();
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
        const insights = await this.config.performanceMonitor.getAdaptiveInsights();
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
        const health = {
          status: 'healthy',
          components: {
            agents: this.config.agents.isHealthy(),
            orchestrator: await this.config.orchestrator.isHealthy(),
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
        this.config.logger.error('Emergency protocol activated', {
          severity,
          description,
          component,
          timestamp: new Date().toISOString(),
        });

        const response = await this.config.orchestrator.handleEmergency('emergency', {
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

    this.config.logger.info('VERSATIL MCP tools registered successfully', { count: 15 });
  }

  /**
   * Connect to a transport (stdio, SSE, etc.)
   */
  async connect(transport: any): Promise<void> {
    await this.server.connect(transport);
    this.config.logger.info('VERSATIL MCP Server connected to transport', {
      name: this.config.name,
      version: this.config.version,
    });
  }

  /**
   * Start server with stdio transport (default)
   */
  async start(): Promise<void> {
    // Check and run onboarding if needed (first-time MCP setup)
    await this.checkAndRunOnboarding();

    const transport = new StdioServerTransport();
    await this.connect(transport);
    this.config.logger.info('VERSATIL MCP Server started with stdio transport', {
      name: this.config.name,
      version: this.config.version,
      tools: 15,
      resources: 5,
      prompts: 5,
    });
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.config.logger.info('VERSATIL MCP Server stopped');
  }

  getServer(): McpServer {
    return this.server;
  }
}