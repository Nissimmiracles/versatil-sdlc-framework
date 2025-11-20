/**
 * Tests for Agent Intelligence Manager
 */

import { AgentIntelligenceManager, IntelligentAgentWrapper } from '../../src/intelligence/agent-intelligence';
import { BaseAgent, AgentActivationContext, AgentResponse } from '../../src/agents/core/base-agent';

// Mock dependencies
jest.mock('../../src/intelligence/usage-analytics', () => ({
  usageAnalytics: {
    startTracking: jest.fn(),
    stopTracking: jest.fn(),
    trackAgentActivation: jest.fn(() => 'test-activation-id'),
    trackPerformance: jest.fn(),
    trackSuggestion: jest.fn(),
    trackFalsePositive: jest.fn(),
    getAnalyticsDashboard: jest.fn(() => ({
      totalEvents: 100,
      agentUsage: [],
      topFileTypes: [],
      userSatisfaction: 4.2,
      commonIssues: [],
      improvementOpportunities: []
    }))
  }
}));

jest.mock('../../src/intelligence/adaptive-learning', () => ({
  adaptiveLearning: {
    startLearning: jest.fn(),
    recordInteraction: jest.fn(),
    on: jest.fn(),
    getLearningInsights: jest.fn(() => ({
      totalPatterns: 5,
      adaptationsProposed: 3,
      learningEffectiveness: 0.8,
      topPerformingAgents: [],
      improvementAreas: []
    }))
  }
}));

jest.mock('../../src/utils/logger', () => ({
  VERSATILLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }))
}));

// Test agent implementation
class TestAgent extends BaseAgent {
  constructor() {
    super('test-agent', 'Test Agent for Intelligence Testing');
  }

  protected async runAgentSpecificValidation(context: AgentActivationContext): Promise<any> {
    return { issues: [], warnings: [], recommendations: [] };
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    return {
      agentId: 'test-agent',
      message: 'Test response',
      suggestions: [
        { type: 'test', priority: 'medium', message: 'Test suggestion' }
      ],
      priority: 'medium',
      handoffTo: [],
      context: { score: 85 }
    };
  }
}

describe('AgentIntelligenceManager', () => {
  let intelligenceManager: AgentIntelligenceManager;
  let testAgent: BaseAgent;
  let mockContext: AgentActivationContext;

  beforeEach(() => {
    intelligenceManager = new AgentIntelligenceManager();
    testAgent = new TestAgent();
    mockContext = {
      content: 'test content',
      filePath: '/test/file.js',
      userRequest: 'test request'
    };
  });

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(intelligenceManager).toBeInstanceOf(AgentIntelligenceManager);
      expect(intelligenceManager['wrappedAgents']).toBeDefined();
      expect(intelligenceManager['isLearningEnabled']).toBe(true);
    });

    it('should start analytics and learning on initialization', () => {
      const { usageAnalytics } = require('../../src/intelligence/usage-analytics');
      const { adaptiveLearning } = require('../../src/intelligence/adaptive-learning');

      expect(usageAnalytics.startTracking).toHaveBeenCalled();
      expect(adaptiveLearning.startLearning).toHaveBeenCalled();
    });
  });

  describe('Agent Wrapping', () => {
    it('should wrap agent with intelligence capabilities', () => {
      const wrappedAgent = intelligenceManager.wrapAgent(testAgent);

      expect(wrappedAgent).toBeDefined();
      expect(wrappedAgent).not.toBe(testAgent); // Should be a proxy
      expect(intelligenceManager['wrappedAgents'].has('test-agent')).toBe(true);
    });

    it('should create wrapper with correct initial state', () => {
      intelligenceManager.wrapAgent(testAgent);

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper).toMatchObject({
        agent: testAgent,
        learningEnabled: true,
        adaptations: expect.any(Map),
        performanceMetrics: {
          activations: 0,
          successRate: 0,
          avgExecutionTime: 0,
          userSatisfactionScore: 0
        }
      });
    });

    it('should allow multiple agents to be wrapped', () => {
      const agent1 = new TestAgent();
      const agent2 = new TestAgent();
      // Manually set different IDs for testing
      agent2['id'] = 'test-agent-2';

      intelligenceManager.wrapAgent(agent1);
      intelligenceManager.wrapAgent(agent2);

      expect(intelligenceManager['wrappedAgents'].size).toBe(2);
    });
  });

  describe('Intelligent Proxy Behavior', () => {
    it('should intercept activate method calls', async () => {
      const wrappedAgent = intelligenceManager.wrapAgent(testAgent);
      const response = await wrappedAgent.activate(mockContext);

      expect(response).toMatchObject({
        agentId: 'test-agent',
        message: 'Test response',
        suggestions: expect.any(Array),
        context: expect.objectContaining({
          intelligence: expect.objectContaining({
            learningEnabled: true,
            activationId: expect.any(String),
            adaptationsApplied: 0
          })
        })
      });
    });

    it('should track performance metrics during activation', async () => {
      const wrappedAgent = intelligenceManager.wrapAgent(testAgent);
      await wrappedAgent.activate(mockContext);

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.performanceMetrics.activations).toBe(1);
      expect(wrapper?.performanceMetrics.avgExecutionTime).toBeGreaterThan(0);
    });

    it('should preserve non-activate method access', () => {
      const wrappedAgent = intelligenceManager.wrapAgent(testAgent);

      // Access a property that should be passed through
      expect(wrappedAgent['id']).toBe('test-agent');
      expect(wrappedAgent['specialization']).toBe('Test Agent for Intelligence Testing');
    });

    it('should handle activation errors gracefully', async () => {
      const errorAgent = new TestAgent();
      errorAgent.activate = jest.fn().mockRejectedValue(new Error('Test error'));

      const wrappedAgent = intelligenceManager.wrapAgent(errorAgent);

      await expect(wrappedAgent.activate(mockContext)).rejects.toThrow('Test error');
    });
  });

  describe('Adaptation System', () => {
    it('should apply adaptations to context', () => {
      const wrappedAgent = intelligenceManager.wrapAgent(testAgent);
      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent')!;

      // Add test adaptation
      wrapper.adaptations.set('context_enhancement', {
        additionalKeywords: ['enhanced', 'keyword']
      });

      const adaptedContext = intelligenceManager['applyAdaptations']('test-agent', mockContext);

      expect(adaptedContext.matchedKeywords).toContain('enhanced');
      expect(adaptedContext.matchedKeywords).toContain('keyword');
    });

    it('should handle priority adjustment adaptations', () => {
      const wrappedAgent = intelligenceManager.wrapAgent(testAgent);
      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent')!;

      wrapper.adaptations.set('priority_adjustment', {
        increasePriority: true
      });

      const adaptedContext = intelligenceManager['applyAdaptations']('test-agent', mockContext);
      expect(adaptedContext.urgency).toBe('high');
    });

    it('should handle file type specialization', () => {
      const contextWithFile = { ...mockContext, filePath: '/test/file.ts' };
      const wrappedAgent = intelligenceManager.wrapAgent(testAgent);
      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent')!;

      wrapper.adaptations.set('file_type_specialization', {
        fileTypeRules: { ts: { specialized: true } }
      });

      const adaptedContext = intelligenceManager['applyAdaptations']('test-agent', contextWithFile);
      expect(adaptedContext.contextClarity).toBe('clear');
    });
  });

  describe('User Feedback System', () => {
    beforeEach(() => {
      intelligenceManager.wrapAgent(testAgent);
    });

    it('should record user feedback correctly', () => {
      const feedback = {
        wasHelpful: true,
        wasAccurate: true,
        rating: 5,
        wasFollowed: true,
        comments: 'Great suggestion!'
      };

      intelligenceManager.recordUserFeedback('test-agent', 'suggestion-1', feedback);

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.performanceMetrics.userSatisfactionScore).toBeGreaterThan(0);
    });

    it('should update success rate for positive feedback', () => {
      const positiveFeedback = {
        wasHelpful: true,
        wasAccurate: true,
        rating: 4,
        wasFollowed: true
      };

      intelligenceManager.recordUserFeedback('test-agent', 'suggestion-1', positiveFeedback);

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.performanceMetrics.successRate).toBeGreaterThan(0);
    });

    it('should handle negative feedback appropriately', () => {
      const negativeFeedback = {
        wasHelpful: false,
        wasAccurate: false,
        rating: 1,
        wasFollowed: false,
        comments: 'Not useful'
      };

      intelligenceManager.recordUserFeedback('test-agent', 'suggestion-1', negativeFeedback);

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.performanceMetrics.userSatisfactionScore).toBeLessThan(1);
    });
  });

  describe('False Positive Reporting', () => {
    beforeEach(() => {
      intelligenceManager.wrapAgent(testAgent);
    });

    it('should record false positive reports', () => {
      intelligenceManager.reportFalsePositive(
        'test-agent',
        'test-issue-type',
        '/test/file.js',
        'This was not actually an issue'
      );

      const { usageAnalytics } = require('../../src/intelligence/usage-analytics');
      expect(usageAnalytics.trackFalsePositive).toHaveBeenCalledWith(
        'test-agent',
        'test-issue-type',
        '/test/file.js',
        'This was not actually an issue'
      );
    });
  });

  describe('Dashboard and Insights', () => {
    beforeEach(() => {
      intelligenceManager.wrapAgent(testAgent);
    });

    it('should provide intelligence dashboard data', () => {
      const dashboard = intelligenceManager.getIntelligenceDashboard();

      expect(dashboard).toMatchObject({
        wrappedAgents: 1,
        totalAdaptations: 0,
        averagePerformance: {
          successRate: 0,
          userSatisfaction: 0,
          avgExecutionTime: 0
        },
        usageAnalytics: expect.any(Object),
        learningInsights: expect.any(Object)
      });
    });

    it('should calculate average performance metrics correctly', () => {
      // Add another agent with some metrics
      const agent2 = new TestAgent();
      agent2['id'] = 'test-agent-2';
      intelligenceManager.wrapAgent(agent2);

      // Simulate some performance data
      const wrapper1 = intelligenceManager['wrappedAgents'].get('test-agent')!;
      const wrapper2 = intelligenceManager['wrappedAgents'].get('test-agent-2')!;

      wrapper1.performanceMetrics.successRate = 0.8;
      wrapper1.performanceMetrics.userSatisfactionScore = 0.9;
      wrapper2.performanceMetrics.successRate = 0.6;
      wrapper2.performanceMetrics.userSatisfactionScore = 0.7;

      const dashboard = intelligenceManager.getIntelligenceDashboard();

      expect(dashboard.averagePerformance.successRate).toBe(0.7);
      expect(dashboard.averagePerformance.userSatisfaction).toBe(0.8);
    });
  });

  describe('Learning Control', () => {
    it('should enable learning for all agents', () => {
      intelligenceManager.wrapAgent(testAgent);
      intelligenceManager.setLearningEnabled(true);

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.learningEnabled).toBe(true);
      expect(intelligenceManager['isLearningEnabled']).toBe(true);
    });

    it('should disable learning for all agents', () => {
      intelligenceManager.wrapAgent(testAgent);
      intelligenceManager.setLearningEnabled(false);

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.learningEnabled).toBe(false);
      expect(intelligenceManager['isLearningEnabled']).toBe(false);

      const { usageAnalytics } = require('../../src/intelligence/usage-analytics');
      expect(usageAnalytics.stopTracking).toHaveBeenCalled();
    });
  });

  describe('Adaptation Proposal Handling', () => {
    beforeEach(() => {
      intelligenceManager.wrapAgent(testAgent);
    });

    it('should auto-apply high confidence adaptations', () => {
      const highConfidenceAdaptation = {
        agentId: 'test-agent',
        adaptationType: 'context_enhancement',
        confidence: 0.9,
        expectedImprovement: 0.2,
        changes: { additionalKeywords: ['auto', 'applied'] }
      };

      intelligenceManager['handleAdaptationProposal']({
        agentId: 'test-agent',
        adaptation: highConfidenceAdaptation
      });

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.adaptations.has('context_enhancement')).toBe(true);
    });

    it('should queue low confidence adaptations for review', () => {
      const lowConfidenceAdaptation = {
        agentId: 'test-agent',
        adaptationType: 'context_enhancement',
        confidence: 0.5,
        expectedImprovement: 0.05,
        changes: { additionalKeywords: ['review', 'needed'] }
      };

      intelligenceManager['handleAdaptationProposal']({
        agentId: 'test-agent',
        adaptation: lowConfidenceAdaptation
      });

      const wrapper = intelligenceManager['wrappedAgents'].get('test-agent');
      expect(wrapper?.adaptations.has('context_enhancement')).toBe(false);
    });
  });
});