/**
 * Tests for BaseAgent - Core BMAD Agent Functionality
 */

import { BaseAgent, AgentActivationContext, ValidationResults } from '../../src/agents/base-agent';

// Mock implementation for testing
class TestAgent extends BaseAgent {
  constructor() {
    super('test-agent', 'Test Agent for Unit Testing');
  }

  protected async runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    return {
      issues: [],
      warnings: [],
      recommendations: []
    };
  }

  async activate(context: AgentActivationContext) {
    const results = await this.runStandardValidation(context);
    return {
      agentId: 'test-agent',
      message: 'Test response',
      suggestions: [],
      priority: 'low' as const,
      handoffTo: [],
      context: { score: results.score }
    };
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  let mockContext: AgentActivationContext;

  beforeEach(() => {
    agent = new TestAgent();
    mockContext = {
      content: 'test content',
      filePath: '/test/file.js',
      userRequest: 'test request'
    };
  });

  describe('Constructor', () => {
    it('should initialize agent with correct properties', () => {
      expect(agent).toBeInstanceOf(BaseAgent);
      expect(agent['id']).toBe('test-agent');
      expect(agent['specialization']).toBe('Test Agent for Unit Testing');
    });

    it('should extract agent name correctly', () => {
      const complexAgent = new TestAgent();
      expect(complexAgent['name']).toBe('Test Agent');
    });
  });

  describe('Standard Validation', () => {
    it('should run standard validation successfully', async () => {
      const results = await agent['runStandardValidation'](mockContext);

      expect(results).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array),
        warnings: expect.any(Array),
        recommendations: expect.any(Array),
        crossFileAnalysis: expect.any(Object),
        performanceMetrics: expect.any(Object)
      });
    });

    it('should handle empty content gracefully', async () => {
      const emptyContext = { ...mockContext, content: undefined };
      const results = await agent['runStandardValidation'](emptyContext);

      expect(results.score).toBe(100);
      expect(results.issues).toHaveLength(0);
    });

    it('should detect debugging code', async () => {
      const debugContext = {
        ...mockContext,
        content: 'console.log("debug"); debugger; const test = true;'
      };

      const results = await agent['runStandardValidation'](debugContext);

      expect(results.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'debugging-code',
            severity: 'medium',
            message: 'Console.log detected in production code'
          }),
          expect.objectContaining({
            type: 'debugging-code',
            severity: 'high',
            message: 'Debugger statement in production code'
          })
        ])
      );
      expect(results.score).toBeLessThan(100);
    });

    it('should detect security issues', async () => {
      const securityContext = {
        ...mockContext,
        content: 'const password = "secret123"; eval(userInput);'
      };

      const results = await agent['runStandardValidation'](securityContext);

      expect(results.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'security-risk',
            severity: 'critical',
            message: 'Hardcoded password detected'
          }),
          expect.objectContaining({
            type: 'security-risk',
            severity: 'high',
            message: 'Use of eval() detected - security risk'
          })
        ])
      );
      expect(results.securityConcerns?.length).toBeGreaterThan(0);
    });

    it('should detect performance issues', async () => {
      const perfContext = {
        ...mockContext,
        content: 'for(let i=0; i<100; i++) { for(let j=0; j<100; j++) { console.log(i,j); } }'
      };

      const results = await agent['runStandardValidation'](perfContext);

      expect(results.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'performance',
            severity: 'medium',
            message: 'Nested loops detected - potential performance issue'
          })
        ])
      );
    });

    it('should detect code quality issues', async () => {
      const qualityContext = {
        ...mockContext,
        content: '// HACK: This is a terrible solution\nif (x) { if (y) { if (z) { return "deeply nested"; } } }'
      };

      const results = await agent['runStandardValidation'](qualityContext);

      expect(results.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'code-quality',
            message: expect.stringContaining('technical debt')
          }),
          expect.objectContaining({
            type: 'code-quality',
            message: expect.stringContaining('Deep nesting')
          })
        ])
      );
    });
  });

  describe('Agent Activation', () => {
    it('should activate agent successfully', async () => {
      const response = await agent.activate(mockContext);

      expect(response).toMatchObject({
        agentId: 'test-agent',
        message: 'Test response',
        suggestions: [],
        priority: 'low',
        handoffTo: [],
        context: expect.any(Object)
      });
    });

    it('should handle activation with issues', async () => {
      const issueContext = {
        ...mockContext,
        content: 'console.log("debug"); const password = "secret";'
      };

      const response = await agent.activate(issueContext);
      expect(response.context.score).toBeLessThan(100);
    });
  });

  describe('Utility Methods', () => {
    it('should generate correct score emoji', () => {
      expect(agent['getScoreEmoji'](98)).toBe('🟢');
      expect(agent['getScoreEmoji'](87)).toBe('🟡');
      expect(agent['getScoreEmoji'](75)).toBe('🟠');
      expect(agent['getScoreEmoji'](65)).toBe('🔴');
    });

    it('should extract agent name from ID', () => {
      expect(agent['extractAgentName']('enhanced-maria-qa')).toBe('Enhanced Maria Qa');
      expect(agent['extractAgentName']('simple-agent')).toBe('Simple Agent');
    });

    it('should validate configuration consistency', () => {
      const consistentCode = 'const config = { apiUrl: process.env.API_URL };';
      const inconsistentCode = 'const config = { apiUrl: "http://localhost:3000" }; const env = process.env.NODE_ENV;';

      expect(agent['hasConfigurationInconsistencies'](consistentCode)).toBe(false);
      expect(agent['hasConfigurationInconsistencies'](inconsistentCode)).toBe(true);
    });
  });

  describe('Validation Result Merging', () => {
    it('should merge validation results correctly', () => {
      const target: ValidationResults = {
        score: 90,
        issues: [{ type: 'test', severity: 'low', message: 'test issue', file: 'test.js' }],
        warnings: ['warning1'],
        recommendations: [],
        crossFileAnalysis: { 'file1.js': 'analysis1' },
        performanceMetrics: { metric1: 'value1' },
        accessibilityIssues: ['a11y1'],
        securityConcerns: ['security1']
      };

      const source = {
        issues: [{ type: 'test2', severity: 'high' as const, message: 'test issue 2', file: 'test2.js' }],
        warnings: ['warning2'],
        crossFileAnalysis: { 'file2.js': 'analysis2' },
        accessibilityIssues: ['a11y2'],
        securityConcerns: ['security2'],
        score: 80
      };

      agent['mergeValidationResults'](target, source);

      expect(target.issues).toHaveLength(2);
      expect(target.warnings).toHaveLength(2);
      expect(target.crossFileAnalysis).toMatchObject({
        'file1.js': 'analysis1',
        'file2.js': 'analysis2'
      });
      expect(target.score).toBe(80); // Should take the lower score
    });
  });

  describe('Standard Recommendations', () => {
    it('should generate recommendations for critical issues', () => {
      const results: ValidationResults = {
        score: 60,
        issues: [
          { type: 'security-risk', severity: 'critical', message: 'Critical security issue', file: 'test.js' },
          { type: 'performance', severity: 'high', message: 'Performance issue', file: 'test.js' }
        ],
        warnings: [],
        recommendations: [],
        crossFileAnalysis: {},
        performanceMetrics: {},
        accessibilityIssues: [],
        securityConcerns: []
      };

      const recommendations = agent['generateStandardRecommendations'](results);

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'critical-fix',
            priority: 'critical',
            message: expect.stringContaining('Fix 1 critical issues')
          }),
          expect.objectContaining({
            type: 'security-improvement',
            priority: 'high'
          })
        ])
      );
    });

    it('should calculate priority correctly', () => {
      const criticalResults = {
        issues: [{ type: 'test', severity: 'critical' as const, message: 'test', file: 'test.js' }]
      } as ValidationResults;

      const highResults = {
        issues: [
          { type: 'test', severity: 'high' as const, message: 'test1', file: 'test.js' },
          { type: 'test', severity: 'high' as const, message: 'test2', file: 'test.js' },
          { type: 'test', severity: 'high' as const, message: 'test3', file: 'test.js' }
        ]
      } as ValidationResults;

      const mediumResults = {
        issues: [
          { type: 'test', severity: 'medium' as const, message: 'test1', file: 'test.js' },
          { type: 'test', severity: 'medium' as const, message: 'test2', file: 'test.js' },
          { type: 'test', severity: 'medium' as const, message: 'test3', file: 'test.js' },
          { type: 'test', severity: 'medium' as const, message: 'test4', file: 'test.js' },
          { type: 'test', severity: 'medium' as const, message: 'test5', file: 'test.js' },
          { type: 'test', severity: 'medium' as const, message: 'test6', file: 'test.js' }
        ]
      } as ValidationResults;

      expect(agent['calculateStandardPriority'](criticalResults)).toBe('critical');
      expect(agent['calculateStandardPriority'](highResults)).toBe('high');
      expect(agent['calculateStandardPriority'](mediumResults)).toBe('medium');
    });
  });

  describe('Cross-file Analysis', () => {
    it('should analyze cross-file consistency', () => {
      const analysis = agent['analyzeCrossFileConsistency'](mockContext);
      expect(analysis).toMatchObject({
        'file.js': expect.stringContaining('Test Agent for Unit Testing')
      });
    });
  });
});