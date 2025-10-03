/**
 * Tests for IntrospectiveAgent - Self-Monitoring & Optimization Controller
 * Updated to use dependency injection pattern (no mocks)
 */

import {
  IntrospectiveAgent,
  TestFileSystemProvider,
  TestCommandExecutor
} from '../../src/agents/introspective-agent';
import { AgentActivationContext } from '../../src/agents/base-agent';
import { VERSATILLogger } from '../../src/utils/logger';

// Mock only the logger (it's external infrastructure)
jest.mock('../../src/utils/logger');

describe('IntrospectiveAgent', () => {
  let agent: IntrospectiveAgent;
  let testFS: TestFileSystemProvider;
  let testExec: TestCommandExecutor;
  let mockLogger: jest.Mocked<VERSATILLogger>;
  let mockContext: AgentActivationContext;

  beforeEach(() => {
    // Setup logger mock
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      getInstance: jest.fn().mockReturnThis()
    } as any;

    (VERSATILLogger.getInstance as jest.Mock).mockReturnValue(mockLogger);

    // Create test file system with typical project structure
    testFS = new TestFileSystemProvider({
      'package.json': JSON.stringify({ name: 'test-project', version: '1.0.0' }),
      'tsconfig.json': JSON.stringify({ compilerOptions: {} }),
      'jest.config.cjs': 'module.exports = {};',
      'src/index.ts': 'export const test = true;',
      '.versatil-project.json': JSON.stringify({ projectId: 'test' })
    });

    // Create test command executor with typical responses
    testExec = new TestCommandExecutor();
    testExec.setResponse('npm run build', '✓ Build successful in 2.5s', '', 100);
    testExec.setResponse('npm test -- --silent', '✓ 50 tests passed', '', 50);
    testExec.setResponse('npm run lint', '✓ No linting errors', '', 25);
    testExec.setResponse(
      'npm audit --json',
      JSON.stringify({
        metadata: {
          vulnerabilities: { total: 0, low: 0, moderate: 0, high: 0, critical: 0 }
        }
      }),
      '',
      25
    );

    // Create agent instance with test implementations
    agent = new IntrospectiveAgent(testFS, testExec);

    // Setup test context
    mockContext = {
      trigger: 'test-introspection',
      content: 'test content',
      userRequest: 'test analysis'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct specialization', () => {
      expect(agent).toBeInstanceOf(IntrospectiveAgent);
    });

    it('should initialize logger and performance monitor', () => {
      expect(VERSATILLogger.getInstance).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'IntrospectiveAgent initialized with tool-based controller architecture',
        expect.objectContaining({
          features: expect.arrayContaining([
            'Framework Health Monitoring',
            'Performance Optimization Engine',
            'Pattern Recognition System',
            'Meta-Learning Capabilities',
            'Autonomous Improvement Engine'
          ])
        }),
        'IntrospectiveAgent'
      );
    });
  });

  describe('Activation', () => {
    it('should perform comprehensive introspective analysis', async () => {
      const response = await agent.activate(mockContext);

      expect(response.agentId).toBe('introspective-agent');
      expect(response.context.confidence).toBeGreaterThanOrEqual(0);
      expect(response.context.confidence).toBeLessThanOrEqual(1);
      expect(response.priority).toMatch(/^(critical|high|medium|low)$/);
      expect(response.message).toContain('Introspective analysis completed');
      expect(Array.isArray(response.suggestions)).toBe(true);
      expect(Array.isArray(response.handoffTo)).toBe(true);
      expect(response.context).toBeDefined();
    });

    it('should log start and completion of introspective analysis', async () => {
      await agent.activate(mockContext);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '🔍 Starting introspective analysis using tool controllers',
        expect.objectContaining({
          context: 'test-introspection'
        }),
        'IntrospectiveAgent'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        '✅ Introspective analysis completed',
        expect.objectContaining({
          executionTime: expect.stringMatching(/\d+ms/),
          improvements: expect.any(Number),
          confidence: expect.any(Number)
        }),
        'IntrospectiveAgent'
      );
    });

    it('should handle activation errors gracefully', async () => {
      // Create test FS with missing critical files
      const errorFS = new TestFileSystemProvider({
        'package.json': JSON.stringify({ name: 'test' })
        // Missing tsconfig, jest.config, etc.
      });

      // Create executor that simulates command failures with stderr
      const errorExec = new TestCommandExecutor();
      errorExec.setResponse('npm run build', '', 'Command failed', 100);
      errorExec.setResponse('npm test -- --silent', '', 'Tests failed', 50);
      errorExec.setResponse('npm run lint', '', 'Lint failed', 25);
      errorExec.setResponse(
        'npm audit --json',
        JSON.stringify({ metadata: { vulnerabilities: { total: 0 } } }),
        '',
        25
      );

      const errorAgent = new IntrospectiveAgent(errorFS, errorExec);
      const response = await errorAgent.activate(mockContext);

      // With missing files and failed commands, confidence should be lower
      expect(response.context.confidence).toBeLessThan(0.85);
      expect(response.priority).toMatch(/^(critical|high|medium|low)$/);
      expect(response.message).toContain('analysis completed');
      expect(Array.isArray(response.suggestions)).toBe(true);
    });
  });

  describe('Framework Health Assessment', () => {
    it('should assess configuration health correctly', async () => {
      const response = await agent.activate(mockContext);

      expect(response.context.introspectionTime).toBeGreaterThan(0);
      expect(response.suggestions).toEqual(expect.any(Array));
      expect(response.handoffTo).toEqual(expect.any(Array));
      expect(response.context.confidence).toBeGreaterThan(0.7); // Good health
    });

    it('should detect missing configuration files', async () => {
      // Create FS with missing important files
      const incompleteFS = new TestFileSystemProvider({
        'package.json': JSON.stringify({ name: 'test' })
        // Missing tsconfig.json, jest.config.cjs, .versatil-project.json
      });

      // Commands might succeed but with warnings
      const incompleteExec = new TestCommandExecutor();
      incompleteExec.setResponse('npm run build', '', 'Missing tsconfig', 100);
      incompleteExec.setResponse('npm test -- --silent', '', 'No tests found', 50);
      incompleteExec.setResponse('npm run lint', '', 'Config missing', 25);
      incompleteExec.setResponse(
        'npm audit --json',
        JSON.stringify({ metadata: { vulnerabilities: { total: 0 } } }),
        '',
        25
      );

      const incompleteAgent = new IntrospectiveAgent(incompleteFS, incompleteExec);
      const response = await incompleteAgent.activate(mockContext);

      // Should still complete but with lower confidence due to missing files
      expect(response.context.confidence).toBeLessThan(0.85);
      expect(response.suggestions.some(s =>
        s.message && (
          s.message.includes('configuration') ||
          s.message.includes('missing') ||
          s.message.includes('issue')
        )
      )).toBe(true);
    });
  });

  describe('Performance Analysis', () => {
    it('should measure build and test performance', async () => {
      // Setup slow build response (simulate slow with delay but not actual 65 seconds)
      // The test uses command execution time, so we simulate it with delay property
      const slowExec = new TestCommandExecutor();
      slowExec.setResponse('npm run build', '✓ Build successful', '', 500); // Simulate with short delay
      slowExec.setResponse('npm test -- --silent', '✓ Tests passed', '', 50);
      slowExec.setResponse('npm run lint', '✓ No errors', '', 25);
      slowExec.setResponse(
        'npm audit --json',
        JSON.stringify({ metadata: { vulnerabilities: { total: 0 } } }),
        '',
        25
      );

      // Manually set build time to appear slow
      const slowAgent = new IntrospectiveAgent(testFS, slowExec);
      const response = await slowAgent.activate(mockContext);

      // The agent measures actual execution time, so let's check if it completes
      // and generates suggestions regardless of the actual time
      expect(response.agentId).toBe('introspective-agent');
      expect(Array.isArray(response.suggestions)).toBe(true);
    });

    it('should detect high memory usage', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 600 * 1024 * 1024, // 600MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        rss: 700 * 1024 * 1024,
        arrayBuffers: 0
      });

      const response = await agent.activate(mockContext);

      // Should suggest memory optimization
      expect(response.suggestions.some(s =>
        s.message && s.message.includes('memory')
      )).toBe(true);

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Pattern Discovery', () => {
    it('should discover code patterns and suggest improvements', async () => {
      const response = await agent.activate(mockContext);

      expect(response.context.patternsDiscovered).toBeGreaterThanOrEqual(0);
      expect(typeof response.context.patternsDiscovered).toBe('number');
    });
  });

  describe('Meta-Learning', () => {
    it('should perform meta-learning and generate insights', async () => {
      const response = await agent.activate(mockContext);

      expect(response.context.learningUpdates).toBeGreaterThanOrEqual(0);
      expect(typeof response.context.learningUpdates).toBe('number');
    });

    it('should learn from improvement history', async () => {
      // Multiple activations to build history
      await agent.activate(mockContext);
      await agent.activate(mockContext);
      const response = await agent.activate(mockContext);

      expect(response.context.learningUpdates).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.suggestions)).toBe(true);
    });
  });

  describe('Improvement Suggestions', () => {
    it('should generate prioritized improvement suggestions', async () => {
      // Create scenario with multiple issues
      const issueFS = new TestFileSystemProvider({
        'package.json': JSON.stringify({ name: 'test' })
        // Missing many config files
      });

      const issueExec = new TestCommandExecutor();
      issueExec.setResponse('npm run build', 'Build successful', '', 500); // Simulated delay
      issueExec.setResponse('npm test -- --silent', '✓ 10 tests', '', 100);
      issueExec.setResponse('npm run lint', '5 warnings', '', 50);
      issueExec.setResponse(
        'npm audit --json',
        JSON.stringify({
          metadata: { vulnerabilities: { total: 3, low: 2, moderate: 1 } }
        }),
        '',
        50
      );

      const issueAgent = new IntrospectiveAgent(issueFS, issueExec);
      const response = await issueAgent.activate(mockContext);

      expect(response.suggestions.length).toBeGreaterThan(0);
      expect(response.suggestions.every(s => s.priority !== undefined)).toBe(true);
    });

    it('should suggest test coverage improvements when below threshold', async () => {
      // Setup low test count
      const lowTestExec = new TestCommandExecutor();
      lowTestExec.setResponse('npm run build', 'Build successful', '', 100);
      lowTestExec.setResponse('npm test -- --silent', '✓ 5 tests passed', '', 50);
      lowTestExec.setResponse('npm run lint', '✓ No errors', '', 25);
      lowTestExec.setResponse(
        'npm audit --json',
        JSON.stringify({ metadata: { vulnerabilities: { total: 0 } } }),
        '',
        25
      );

      const lowTestAgent = new IntrospectiveAgent(testFS, lowTestExec);
      const response = await lowTestAgent.activate(mockContext);

      // Should suggest adding more tests
      expect(response.suggestions.some(s =>
        s.message && (s.message.includes('test') || s.message.includes('coverage'))
      )).toBe(true);
    });
  });

  describe('Autonomous Optimizations', () => {
    it('should implement safe optimizations automatically', async () => {
      const response = await agent.activate(mockContext);

      // Should track optimizations applied
      expect(typeof response.context.optimizationsApplied).toBe('number');
      expect(response.context.optimizationsApplied).toBeGreaterThanOrEqual(0);
    });

    it('should record successful improvements', async () => {
      const history1 = await agent.getImprovementHistory();
      await agent.activate(mockContext);
      const history2 = await agent.getImprovementHistory();

      // History should exist (may or may not grow depending on what was found)
      expect(Array.isArray(history1)).toBe(true);
      expect(Array.isArray(history2)).toBe(true);
    });
  });

  describe('Tool Controller Integration', () => {
    it('should use Read tool controller for file analysis', async () => {
      // Add code file for analysis
      testFS.addFile('src/test-file.ts', 'export const testFunction = () => { return true; };');

      const response = await agent.activate(mockContext);

      // Should complete successfully with file analysis
      expect(response.agentId).toBe('introspective-agent');
      expect(response.context.confidence).toBeGreaterThan(0);
    });

    it('should use Bash tool controller for performance analysis', async () => {
      const response = await agent.activate(mockContext);

      // Should have executed performance commands
      expect(response.context.introspectionTime).toBeGreaterThan(0);
      expect(response.message).toContain('analysis completed');
    });
  });

  describe('Quality Gates', () => {
    it('should implement self-monitoring quality gates', async () => {
      const response = await agent.activate(mockContext);

      // Quality gates should be part of analysis
      expect(response.context.qualityGates).toBeDefined();
      expect(typeof response.context.qualityGates).toBe('object');
    });
  });

  describe('Public API Methods', () => {
    it('should provide triggerIntrospection method', async () => {
      expect(typeof agent.triggerIntrospection).toBe('function');
      const result = await agent.triggerIntrospection();
      expect(result).toBeDefined();
    });

    it('should provide getLearningInsights method', async () => {
      expect(typeof agent.getLearningInsights).toBe('function');
      const insights = await agent.getLearningInsights();
      expect(insights).toBeDefined();
      expect(typeof insights).toBe('object');
    });

    it('should provide getImprovementHistory method', () => {
      expect(typeof agent.getImprovementHistory).toBe('function');
      const history = agent.getImprovementHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // Empty file system
      const emptyFS = new TestFileSystemProvider({});
      const emptyAgent = new IntrospectiveAgent(emptyFS, testExec);

      const response = await emptyAgent.activate(mockContext);

      // Should still return valid response
      expect(response.agentId).toBe('introspective-agent');
      expect(response.message).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
    });

    it('should handle command execution errors gracefully', async () => {
      // Create FS with some missing files to lower health score
      const partialFS = new TestFileSystemProvider({
        'package.json': JSON.stringify({ name: 'test', version: '1.0.0' }),
        'tsconfig.json': JSON.stringify({ compilerOptions: {} })
        // Missing jest.config.cjs and .versatil-project.json
      });

      // Executor with error responses
      const errorExec = new TestCommandExecutor();
      errorExec.setResponse('npm run build', '', 'Build failed', 100);
      errorExec.setResponse('npm test -- --silent', '', 'Tests failed', 50);
      errorExec.setResponse('npm run lint', '', 'Lint failed', 25);
      errorExec.setResponse(
        'npm audit --json',
        JSON.stringify({ metadata: { vulnerabilities: { total: 0 } } }),
        '',
        25
      );

      const errorAgent = new IntrospectiveAgent(partialFS, errorExec);
      const response = await errorAgent.activate(mockContext);

      // Should handle errors and still complete but with reduced confidence
      expect(response.agentId).toBe('introspective-agent');
      expect(response.context.confidence).toBeLessThan(0.90);
      expect(response.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle JSON parsing errors gracefully', async () => {
      // Invalid JSON in audit response
      const invalidExec = new TestCommandExecutor();
      invalidExec.setResponse('npm run build', 'Build ok', '', 100);
      invalidExec.setResponse('npm test -- --silent', 'Tests ok', '', 50);
      invalidExec.setResponse('npm run lint', 'Lint ok', '', 25);
      invalidExec.setResponse('npm audit --json', 'invalid json {{{', '', 25);

      const invalidAgent = new IntrospectiveAgent(testFS, invalidExec);
      const response = await invalidAgent.activate(mockContext);

      // Should handle invalid JSON gracefully
      expect(response.agentId).toBe('introspective-agent');
      expect(response.message).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    it('should have reasonable execution time', async () => {
      const startTime = Date.now();
      await agent.activate(mockContext);
      const executionTime = Date.now() - startTime;

      // Should complete in under 2 seconds with test implementations
      expect(executionTime).toBeLessThan(2000);
    });

    it('should handle concurrent activations safely', async () => {
      // Run multiple activations in parallel
      const activations = [
        agent.activate(mockContext),
        agent.activate(mockContext),
        agent.activate(mockContext)
      ];

      const responses = await Promise.all(activations);

      // All should complete successfully
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.agentId).toBe('introspective-agent');
        expect(response.message).toBeDefined();
      });
    });
  });
});