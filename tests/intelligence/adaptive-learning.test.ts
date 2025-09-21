/**
 * Tests for Adaptive Learning Engine
 */

import { AdaptiveLearningEngine, UserInteraction } from '../../src/intelligence/adaptive-learning';

// Mock VERSATILLogger
jest.mock('../../src/utils/logger', () => ({
  VERSATILLogger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

describe('AdaptiveLearningEngine', () => {
  let learningEngine: AdaptiveLearningEngine;
  let mockInteraction: UserInteraction;

  beforeEach(() => {
    learningEngine = new AdaptiveLearningEngine();
    mockInteraction = {
      id: 'test-interaction-1',
      timestamp: Date.now(),
      agentId: 'enhanced-maria',
      actionType: 'activation',
      context: {
        filePath: '/test/file.js',
        fileType: 'js',
        projectType: 'javascript'
      },
      outcome: {
        problemSolved: true,
        timeToResolution: 1000,
        userSatisfaction: 4,
        agentAccuracy: 0.9
      }
    };
  });

  describe('Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(learningEngine).toBeInstanceOf(AdaptiveLearningEngine);
      expect(learningEngine['patterns']).toBeDefined();
      expect(learningEngine['interactions']).toBeDefined();
      expect(learningEngine['isLearning']).toBe(false);
    });
  });

  describe('Learning Management', () => {
    it('should start learning successfully', () => {
      learningEngine.startLearning();
      expect(learningEngine['isLearning']).toBe(true);
    });

    it('should stop learning successfully', () => {
      learningEngine.startLearning();
      learningEngine.stopLearning();
      expect(learningEngine['isLearning']).toBe(false);
    });

    it('should handle multiple start calls gracefully', () => {
      learningEngine.startLearning();
      learningEngine.startLearning();
      expect(learningEngine['isLearning']).toBe(true);
    });
  });

  describe('Interaction Recording', () => {
    beforeEach(() => {
      learningEngine.startLearning();
    });

    it('should record interaction when learning is enabled', () => {
      learningEngine.recordInteraction(mockInteraction);

      const interactions = learningEngine['interactions'].get('enhanced-maria');
      expect(interactions).toBeDefined();
      expect(interactions?.length).toBe(1);
      expect(interactions?.[0]).toEqual(mockInteraction);
    });

    it('should not record interaction when learning is disabled', () => {
      learningEngine.stopLearning();
      learningEngine.recordInteraction(mockInteraction);

      const interactions = learningEngine['interactions'].get('enhanced-maria');
      expect(interactions).toBeUndefined();
    });

    it('should group interactions by agent ID', () => {
      const jamesInteraction = { ...mockInteraction, agentId: 'enhanced-james', id: 'test-2' };

      learningEngine.recordInteraction(mockInteraction);
      learningEngine.recordInteraction(jamesInteraction);

      expect(learningEngine['interactions'].get('enhanced-maria')?.length).toBe(1);
      expect(learningEngine['interactions'].get('enhanced-james')?.length).toBe(1);
    });

    it('should accumulate multiple interactions for same agent', () => {
      const secondInteraction = { ...mockInteraction, id: 'test-2', timestamp: Date.now() + 1000 };

      learningEngine.recordInteraction(mockInteraction);
      learningEngine.recordInteraction(secondInteraction);

      const interactions = learningEngine['interactions'].get('enhanced-maria');
      expect(interactions?.length).toBe(2);
    });
  });

  describe('Pattern Analysis', () => {
    beforeEach(() => {
      learningEngine.startLearning();
    });

    it('should analyze patterns when sufficient data is available', () => {
      // Create 10+ interactions for pattern analysis
      for (let i = 0; i < 12; i++) {
        const interaction = {
          ...mockInteraction,
          id: `test-${i}`,
          timestamp: Date.now() + i * 1000,
          outcome: {
            ...mockInteraction.outcome,
            userSatisfaction: Math.random() * 2 + 3 // 3-5 rating
          }
        };
        learningEngine.recordInteraction(interaction);
      }

      // Trigger pattern analysis manually
      learningEngine['analyzePatterns']();

      const pattern = learningEngine['patterns'].get('enhanced-maria');
      expect(pattern).toBeDefined();
    });

    it('should identify successful patterns', () => {
      // Create successful interactions
      for (let i = 0; i < 12; i++) {
        const interaction = {
          ...mockInteraction,
          id: `success-${i}`,
          timestamp: Date.now() + i * 1000,
          outcome: {
            problemSolved: true,
            timeToResolution: 500,
            userSatisfaction: 5,
            agentAccuracy: 0.95
          }
        };
        learningEngine.recordInteraction(interaction);
      }

      learningEngine['analyzePatterns']();

      const pattern = learningEngine['patterns'].get('enhanced-maria');
      expect(pattern?.successRate).toBeGreaterThan(0.8);
    });

    it('should identify problematic patterns', () => {
      // Create unsuccessful interactions
      for (let i = 0; i < 12; i++) {
        const interaction = {
          ...mockInteraction,
          id: `failure-${i}`,
          timestamp: Date.now() + i * 1000,
          outcome: {
            problemSolved: false,
            timeToResolution: 5000,
            userSatisfaction: 2,
            agentAccuracy: 0.3
          }
        };
        learningEngine.recordInteraction(interaction);
      }

      learningEngine['analyzePatterns']();

      const pattern = learningEngine['patterns'].get('enhanced-maria');
      expect(pattern?.successRate).toBeLessThan(0.5);
    });
  });

  describe('Adaptation Generation', () => {
    beforeEach(() => {
      learningEngine.startLearning();
    });

    it('should propose adaptations for low-performing patterns', () => {
      // Create pattern with low success rate
      const pattern = {
        id: 'pattern-1',
        agentId: 'enhanced-maria',
        context: {
          fileTypes: ['js'],
          projectTypes: ['javascript'],
          userTypes: ['mid'],
          timePatterns: ['morning']
        },
        successRate: 0.3,
        userSatisfaction: 2.0,
        commonIssues: ['false_positive', 'slow_response'],
        sampleSize: 15,
        confidence: 0.9
      };

      learningEngine['patterns'].set('enhanced-maria', pattern);

      const adaptations = await learningEngine['generateAdaptations'](pattern, [], 'enhanced-maria');
      expect(adaptations.length).toBeGreaterThan(0);
      expect(adaptations[0].confidence).toBeGreaterThan(0);
    });

    it('should not propose adaptations for high-performing patterns', () => {
      const pattern = {
        id: 'pattern-1',
        agentId: 'enhanced-maria',
        context: {
          fileTypes: ['js'],
          projectTypes: ['javascript'],
          userTypes: ['mid'],
          timePatterns: ['morning']
        },
        successRate: 0.95,
        userSatisfaction: 4.8,
        commonIssues: [],
        sampleSize: 15,
        confidence: 0.9
      };

      const adaptations = await learningEngine['generateAdaptations'](pattern, [], 'enhanced-maria');
      expect(adaptations.length).toBe(0);
    });
  });

  describe('Learning Insights', () => {
    beforeEach(() => {
      learningEngine.startLearning();
    });

    it('should provide learning insights', () => {
      // Add some test data
      learningEngine.recordInteraction(mockInteraction);

      const insights = learningEngine.getLearningInsights();

      expect(insights).toMatchObject({
        totalPatterns: expect.any(Number),
        adaptationsProposed: expect.any(Number),
        learningEffectiveness: expect.any(Number),
        topPerformingAgents: expect.any(Array),
        improvementAreas: expect.any(Array)
      });
    });

    it('should calculate learning effectiveness correctly', () => {
      // Create interactions with known outcomes
      for (let i = 0; i < 10; i++) {
        const interaction = {
          ...mockInteraction,
          id: `test-${i}`,
          outcome: {
            ...mockInteraction.outcome,
            problemSolved: i >= 5, // 50% success rate
            userSatisfaction: i >= 5 ? 4 : 2
          }
        };
        learningEngine.recordInteraction(interaction);
      }

      const insights = learningEngine.getLearningInsights();
      expect(insights.learningEffectiveness).toBeGreaterThan(0);
      expect(insights.learningEffectiveness).toBeLessThanOrEqual(1);
    });
  });

  describe('Event Emission', () => {
    beforeEach(() => {
      learningEngine.startLearning();
    });

    it('should emit pattern_discovered event', (done) => {
      learningEngine.on('pattern_discovered', (pattern) => {
        expect(pattern).toBeDefined();
        expect(pattern.agentId).toBe('enhanced-maria');
        done();
      });

      // Create enough interactions to trigger pattern discovery
      for (let i = 0; i < 12; i++) {
        learningEngine.recordInteraction({
          ...mockInteraction,
          id: `test-${i}`,
          timestamp: Date.now() + i * 1000
        });
      }

      learningEngine['analyzePatterns']();
    });

    it('should emit adaptation_proposed event', (done) => {
      learningEngine.on('adaptation_proposed', (data) => {
        expect(data.agentId).toBe('enhanced-maria');
        expect(data.adaptation).toBeDefined();
        done();
      });

      // Create a low-performing pattern
      const pattern = {
        id: 'pattern-1',
        agentId: 'enhanced-maria',
        context: { fileTypes: ['js'], projectTypes: ['javascript'], userTypes: ['mid'], timePatterns: ['morning'] },
        successRate: 0.3,
        userSatisfaction: 2.0,
        commonIssues: ['false_positive'],
        sampleSize: 15,
        confidence: 0.9
      };

      learningEngine['patterns'].set('enhanced-maria', [pattern]);
      learningEngine['generateAndProposeAdaptations']();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid interactions gracefully', () => {
      learningEngine.startLearning();

      const invalidInteraction = { ...mockInteraction, agentId: '' };
      expect(() => learningEngine.recordInteraction(invalidInteraction)).not.toThrow();
    });

    it('should handle pattern analysis with insufficient data', () => {
      learningEngine.startLearning();
      learningEngine.recordInteraction(mockInteraction); // Only 1 interaction

      expect(() => learningEngine['analyzePatterns']()).not.toThrow();
    });
  });
});