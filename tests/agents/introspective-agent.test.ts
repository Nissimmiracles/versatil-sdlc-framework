/**
 * Tests for IntrospectiveAgent - Self-Monitoring & Optimization Controller
 */

import { IntrospectiveAgent } from '../../src/agents/introspective-agent';
import { AgentActivationContext } from '../../src/agents/base-agent';
import { VERSATILLogger } from '../../src/utils/logger';
import { PerformanceMonitor } from '../../src/analytics/performance-monitor';
import * as fs from 'fs-extra';
import { exec } from 'child_process';

// Mock dependencies
jest.mock('../../src/utils/logger');
jest.mock('../../src/analytics/performance-monitor');
jest.mock('fs-extra');
jest.mock('child_process');

describe('IntrospectiveAgent', () => {
  let agent: IntrospectiveAgent;
  let mockLogger: jest.Mocked<VERSATILLogger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;
  let mockContext: AgentActivationContext;

  beforeEach(() => {
    // Setup mocks
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      getInstance: jest.fn().mockReturnThis()
    } as any;

    mockPerformanceMonitor = {
      getInstance: jest.fn().mockReturnThis(),
      getRecentMetrics: jest.fn().mockReturnValue([])
    } as any;

    (VERSATILLogger.getInstance as jest.Mock).mockReturnValue(mockLogger);
    // PerformanceMonitor is directly instantiated, no singleton pattern

    // Create agent instance
    agent = new IntrospectiveAgent();

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
      // Note: specialization and name are protected, test through public interface
      expect(agent).toBeInstanceOf(IntrospectiveAgent);
    });

    it('should initialize logger and performance monitor', () => {
      expect(VERSATILLogger.getInstance).toHaveBeenCalled();
      // PerformanceMonitor is directly instantiated, no singleton
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
    beforeEach(() => {
      // Mock file system operations
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      // Mock exec commands
      const { exec: mockExec } = require('child_process');
      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('npm run build')) {
          setTimeout(() => callback(null, { stdout: 'Build successful' }), 100);
        } else if (cmd.includes('npm test')) {
          setTimeout(() => callback(null, { stdout: 'All tests passed' }), 50);
        } else if (cmd.includes('npm run lint')) {
          setTimeout(() => callback(null, { stdout: 'No linting errors' }), 25);
        } else if (cmd.includes('npm audit')) {
          setTimeout(() => callback(null, { stdout: '{"metadata":{"vulnerabilities":{"total":0}}}' }), 25);
        } else {
          setTimeout(() => callback(null, { stdout: '' }), 10);
        }
      });
    });

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
      // Mock error in file system operation
      (fs.access as jest.Mock).mockRejectedValue(new Error('File system error'));

      const response = await agent.activate(mockContext);

      expect(response.context.confidence).toBe(0.1);
      expect(response.priority).toBe('low');
      expect(response.message).toContain('errors and requires investigation');
      expect(response.suggestions.some(s => s.message.includes('configuration'))).toBe(true);
      expect(response.context.error).toBe(true);

      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Introspective analysis failed',
        expect.objectContaining({
          error: 'File system error',
          context: 'test-introspection'
        }),
        'IntrospectiveAgent'
      );
    });
  });

  describe('Framework Health Assessment', () => {
    it('should assess configuration health correctly', async () => {
      // Mock successful file checks
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const response = await agent.activate(mockContext);

      expect(response.context.introspectionTime).toBeGreaterThan(0);
      expect(response.suggestions).toEqual(expect.any(Array));
      expect(response.handoffTo).toEqual(expect.any(Array));
    });

    it('should detect missing configuration files', async () => {
      // Mock missing files
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const response = await agent.activate(mockContext);

      // Should still complete but with lower confidence
      expect(response.context.confidence).toBeLessThan(0.8);
    });
  });

  describe('Performance Analysis', () => {
    it('should measure build and test performance', async () => {
      const { exec: mockExec } = require('child_process');

      // Mock slow build time
      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('npm run build')) {
          setTimeout(() => callback(null, { stdout: 'Build successful' }), 35000); // 35 seconds
        } else {
          setTimeout(() => callback(null, { stdout: '' }), 10);
        }
      });

      const response = await agent.activate(mockContext);

      expect(response.suggestions.some(s => s.message.includes('build time optimization'))).toBe(true);
    });

    it('should detect high memory usage', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 600 * 1024 * 1024, // 600MB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        rss: 0,
        arrayBuffers: 0
      });

      const response = await agent.activate(mockContext);

      expect(response.suggestions.some(s => s.message.includes('memory optimization'))).toBe(true);

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
      // Simulate some improvement history
      const improvementHistory = [
        {
          timestamp: Date.now() - 3600000,
          type: 'performance-optimization',
          description: 'Build time improved',
          impact: 'positive',
          confidence: 0.9
        }
      ];

      // Access private property for testing
      (agent as any).improvementHistory = improvementHistory;

      const response = await agent.activate(mockContext);

      expect(response.context.confidence).toBeGreaterThan(0);
    });
  });

  describe('Improvement Suggestions', () => {
    it('should generate prioritized improvement suggestions', async () => {
      const response = await agent.activate(mockContext);

      expect(Array.isArray(response.suggestions)).toBe(true);
      response.suggestions.forEach(suggestion => {
        expect(typeof suggestion.message).toBe('string');
        expect(suggestion.priority).toMatch(/^(critical|high|medium|low)$/);
      });
    });

    it('should suggest test coverage improvements when below threshold', async () => {
      // Mock low test coverage
      const { exec: mockExec } = require('child_process');
      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('--coverage')) {
          callback(null, { stdout: 'All files      |   45.5 |' }); // 45.5% coverage
        } else {
          callback(null, { stdout: '' });
        }
      });

      const response = await agent.activate(mockContext);

      expect(response.suggestions.some(s => s.message.includes('test coverage'))).toBe(true);
    });
  });

  describe('Autonomous Optimizations', () => {
    it('should implement safe optimizations automatically', async () => {
      const response = await agent.activate(mockContext);

      expect(response.context.optimizationsApplied).toBeGreaterThanOrEqual(0);
      expect(typeof response.context.optimizationsApplied).toBe('number');
    });

    it('should record successful improvements', async () => {
      await agent.activate(mockContext);

      const improvementHistory = agent.getImprovementHistory();
      expect(Array.isArray(improvementHistory)).toBe(true);
    });
  });

  describe('Tool Controller Integration', () => {
    it('should use Read tool controller for file analysis', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await agent.activate(mockContext);

      expect(fs.access).toHaveBeenCalledWith(expect.stringContaining('package.json'));
      expect(fs.access).toHaveBeenCalledWith(expect.stringContaining('tsconfig.json'));
      expect(fs.access).toHaveBeenCalledWith(expect.stringContaining('jest.config.js'));
    });

    it('should use Bash tool controller for performance analysis', async () => {
      const { exec: mockExec } = require('child_process');

      await agent.activate(mockContext);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('npm run build'),
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('npm test'),
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('npm run lint'),
        expect.any(Function)
      );
    });
  });

  describe('Quality Gates', () => {
    it('should implement self-monitoring quality gates', async () => {
      const response = await agent.activate(mockContext);

      const qualityGates = response.qualityGates;
      expect(qualityGates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Self-Monitoring Health',
            passed: expect.any(Boolean),
            details: expect.any(String),
            critical: false
          }),
          expect.objectContaining({
            name: 'Tool Controller Accessibility',
            passed: true,
            details: 'All tool controllers (Read, Grep, Bash) are accessible',
            critical: true
          }),
          expect.objectContaining({
            name: 'Learning Database Integrity',
            passed: expect.any(Boolean),
            details: expect.stringMatching(/Learning database contains \d+ entries/),
            critical: false
          })
        ])
      );
    });
  });

  describe('Public API Methods', () => {
    it('should provide triggerIntrospection method', async () => {
      expect(typeof agent.triggerIntrospection).toBe('function');

      // Should not throw
      await agent.triggerIntrospection();
    });

    it('should provide getLearningInsights method', () => {
      const insights = agent.getLearningInsights();
      expect(insights instanceof Map).toBe(true);
    });

    it('should provide getImprovementHistory method', () => {
      const history = agent.getImprovementHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const response = await agent.activate(mockContext);

      expect(response.confidence).toBe(0.1);
      expect(response.metadata.error).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle command execution errors gracefully', async () => {
      const { exec: mockExec } = require('child_process');
      mockExec.mockImplementation((cmd: string, callback: any) => {
        callback(new Error('Command failed'), null);
      });

      const response = await agent.activate(mockContext);

      // Should complete with reduced confidence
      expect(response.confidence).toBeLessThan(1);
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const { exec: mockExec } = require('child_process');
      mockExec.mockImplementation((cmd: string, callback: any) => {
        if (cmd.includes('npm audit')) {
          callback(null, { stdout: 'invalid json' });
        } else {
          callback(null, { stdout: '' });
        }
      });

      const response = await agent.activate(mockContext);

      // Should still complete
      expect(response.agent).toBe(agent);
    });
  });

  describe('Performance Optimization', () => {
    it('should have reasonable execution time', async () => {
      const startTime = Date.now();
      await agent.activate(mockContext);
      const executionTime = Date.now() - startTime;

      // Should complete within reasonable time (allowing for async operations)
      expect(executionTime).toBeLessThan(10000); // 10 seconds max for test
    });

    it('should handle concurrent activations safely', async () => {
      const promises = [
        agent.activate(mockContext),
        agent.activate(mockContext),
        agent.activate(mockContext)
      ];

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.agent).toBe(agent);
        expect(typeof response.confidence).toBe('number');
      });
    });
  });
});