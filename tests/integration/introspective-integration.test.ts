/**
 * Integration tests for IntrospectiveAgent with the VERSATIL framework
 */

import {
  IntrospectiveAgent,
  TestFileSystemProvider,
  TestCommandExecutor
} from '../../src/agents/introspective-agent';
import { agentRegistry } from '../../src/agents/agent-registry';
import { createIntrospectiveScheduler } from '../../src/utils/introspective-scheduler';

describe('IntrospectiveAgent Integration', () => {
  let agent: IntrospectiveAgent;
  let testFS: TestFileSystemProvider;
  let testExec: TestCommandExecutor;
  let scheduler: any;

  beforeEach(() => {
    // Create test implementations for integration tests
    testFS = new TestFileSystemProvider({
      'package.json': JSON.stringify({ name: 'test-integration', version: '1.0.0' }),
      'tsconfig.json': JSON.stringify({ compilerOptions: {} }),
      'jest.config.cjs': 'module.exports = {};',
      'src/index.ts': 'export const test = true;',
      '.versatil-project.json': JSON.stringify({ projectId: 'integration-test' })
    });

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

    agent = new IntrospectiveAgent(testFS, testExec);
  });

  afterEach(() => {
    // Clean up scheduler if created
    if (scheduler && scheduler.stop) {
      scheduler.stop();
    }
  });

  describe('Framework Integration', () => {
    it('should be registered in the agent registry', () => {
      const registeredAgent = agentRegistry.getAgent('introspective-agent');
      expect(registeredAgent).toBeDefined();
      expect(registeredAgent).toBeInstanceOf(IntrospectiveAgent);
    });

    it('should have correct metadata in registry', () => {
      const metadata = agentRegistry.getAgentMetadata('introspective-agent');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('IntrospectiveAgent');
      expect(metadata?.specialization).toBe('Self-Monitoring & Optimization Controller');
      expect(metadata?.autoActivate).toBe(false);
      expect(metadata?.priority).toBe(4);
    });

    it('should support tool-based activation patterns', () => {
      const metadata = agentRegistry.getAgentMetadata('introspective-agent');
      expect(metadata?.triggers.keywords).toContain('introspection');
      expect(metadata?.triggers.keywords).toContain('optimization');
      expect(metadata?.triggers.keywords).toContain('performance');
      expect(metadata?.mcpTools).toContain('Read MCP');
      expect(metadata?.mcpTools).toContain('Bash MCP');
    });
  });

  describe('Scheduler Integration', () => {
    it('should create scheduler successfully', () => {
      scheduler = createIntrospectiveScheduler(agent, { autoStart: false });
      expect(scheduler).toBeDefined();

      const metrics = scheduler.getMetrics();
      expect(metrics.totalRuns).toBe(0);
      expect(metrics.currentlyRunning).toBe(false);
    });

    it('should provide dashboard functionality', () => {
      scheduler = createIntrospectiveScheduler(agent, { autoStart: false });
      const dashboard = scheduler.generateDashboard();

      expect(dashboard.status).toBe('stopped');
      expect(dashboard.metrics).toBeDefined();
      expect(dashboard.health).toBeDefined();
      expect(Array.isArray(dashboard.nextActions)).toBe(true);
    });
  });

  describe('Agent Collaboration', () => {
    it('should have collaborators defined', () => {
      const metadata = agentRegistry.getAgentMetadata('introspective-agent');
      expect(metadata?.collaborators).toContain('enhanced-maria');
      expect(metadata?.collaborators).toContain('enhanced-james');
      expect(metadata?.collaborators).toContain('enhanced-marcus');
    });

    it('should get collaborator agents successfully', () => {
      const collaborators = agentRegistry.getCollaborators('introspective-agent');
      expect(Array.isArray(collaborators)).toBe(true);
      // Note: Collaborators may not all be instantiated depending on registry state
    });
  });

  describe('Public API Methods', () => {
    it('should provide triggerIntrospection method', () => {
      expect(typeof agent.triggerIntrospection).toBe('function');
    });

    it('should provide getLearningInsights method', () => {
      expect(typeof agent.getLearningInsights).toBe('function');
      const insights = agent.getLearningInsights();
      expect(insights instanceof Map).toBe(true);
    });

    it('should provide getImprovementHistory method', () => {
      expect(typeof agent.getImprovementHistory).toBe('function');
      const history = agent.getImprovementHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Activation Context Support', () => {
    it('should handle minimal activation context', async () => {
      const response = await agent.activate({
        trigger: 'test',
        content: ''
      });

      expect(response).toBeDefined();
      expect(response.agentId).toBe('introspective-agent');
      expect(typeof response.message).toBe('string');
      expect(Array.isArray(response.suggestions)).toBe(true);
      expect(Array.isArray(response.handoffTo)).toBe(true);
      expect(response.context).toBeDefined();
    });

    it('should handle complex activation context', async () => {
      const response = await agent.activate({
        trigger: 'manual-introspection',
        content: 'test content',
        userRequest: 'Analyze framework performance',
        filePath: 'src/test.ts'
      });

      expect(response).toBeDefined();
      expect(response.context.introspectionTime).toBeGreaterThan(0);
    });
  });
});