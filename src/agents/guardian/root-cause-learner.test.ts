/**
 * VERSATIL SDLC Framework - Root Cause Learner Tests
 * Priority 2: Guardian Component Testing (Batch 7 - Final)
 *
 * Test Coverage:
 * - Pattern recognition from errors
 * - Root cause analysis
 * - Learning from remediation success/failure
 * - Pattern confidence scoring
 * - Enhancement suggestion generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RootCauseLearner } from './root-cause-learner.js';

describe('RootCauseLearner', () => {
  let learner: RootCauseLearner;

  beforeEach(() => {
    vi.clearAllMocks();
    learner = RootCauseLearner.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RootCauseLearner.getInstance();
      const instance2 = RootCauseLearner.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize error patterns', async () => {
      const errors = [
        { message: 'Cannot find module "lodash"', type: 'MODULE_NOT_FOUND' },
        { message: 'Cannot find module "axios"', type: 'MODULE_NOT_FOUND' }
      ];

      const patterns = await learner.recognizePatterns(errors);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('pattern_id');
      expect(patterns[0]).toHaveProperty('confidence');
    });

    it('should group similar errors', async () => {
      const errors = [
        { message: 'TypeError: Cannot read property "foo"', stack: 'at line 10' },
        { message: 'TypeError: Cannot read property "bar"', stack: 'at line 20' }
      ];

      const grouped = await learner.groupSimilarErrors(errors);
      expect(grouped.length).toBeGreaterThan(0);
      expect(grouped[0]).toHaveProperty('count');
    });

    it('should extract commonality from error patterns', async () => {
      const errors = [
        { file: '/src/utils/api.ts', message: 'Network error' },
        { file: '/src/utils/auth.ts', message: 'Network error' }
      ];

      const commonality = await learner.extractCommonality(errors);
      expect(commonality).toHaveProperty('type');
      expect(commonality).toHaveProperty('frequency');
    });
  });

  describe('Root Cause Analysis', () => {
    it('should analyze root cause from error pattern', async () => {
      const pattern = {
        pattern_id: 'module-not-found-1',
        errors: [
          { message: 'Cannot find module "react"' },
          { message: 'Cannot find module "lodash"' }
        ],
        occurrences: 5
      };

      const rootCause = await learner.analyzeRootCause(pattern);

      expect(rootCause).toHaveProperty('description');
      expect(rootCause).toHaveProperty('confidence');
      expect(rootCause).toHaveProperty('suggestedFix');
    });

    it('should identify dependency issues', async () => {
      const errors = [
        { message: 'npm ERR! missing: react@^18.0.0' },
        { message: 'Cannot find module "react"' }
      ];

      const cause = await learner.analyzeDependencyIssues(errors);
      expect(cause).toHaveProperty('type');
      expect(cause.type).toBe('dependency');
    });

    it('should identify configuration issues', async () => {
      const errors = [
        { message: 'tsconfig.json not found' },
        { message: 'Invalid TypeScript configuration' }
      ];

      const cause = await learner.analyzeConfigurationIssues(errors);
      expect(cause.type).toBe('configuration');
    });

    it('should calculate root cause confidence', () => {
      const evidence = {
        sameErrorMessage: 5,
        sameFile: 3,
        sameStack: 2,
        totalErrors: 10
      };

      const confidence = learner.calculateConfidence(evidence);
      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Learning from Remediation', () => {
    it('should learn from successful remediation', async () => {
      const pattern = {
        pattern_id: 'test-pattern-1',
        root_cause: { description: 'Missing dependency' }
      };
      const remediation = {
        action: 'npm install lodash',
        success: true,
        before: 'Error: Cannot find module',
        after: 'Success'
      };

      await learner.learnFromRemediation(pattern, remediation);

      const learned = learner.getLearnedPattern('test-pattern-1');
      expect(learned).toBeDefined();
      expect(learned?.successRate).toBeGreaterThan(0);
    });

    it('should learn from failed remediation', async () => {
      const pattern = {
        pattern_id: 'test-pattern-2',
        root_cause: { description: 'Wrong fix applied' }
      };
      const remediation = {
        action: 'npm install wrong-package',
        success: false,
        before: 'Error: Cannot find module',
        after: 'Still erroring'
      };

      await learner.learnFromRemediation(pattern, remediation);

      const learned = learner.getLearnedPattern('test-pattern-2');
      expect(learned?.failedAttempts).toBeGreaterThan(0);
    });

    it('should update pattern confidence based on outcomes', async () => {
      const patternId = 'adjustable-pattern';

      await learner.recordSuccess(patternId);
      await learner.recordSuccess(patternId);
      await learner.recordFailure(patternId);

      const pattern = learner.getLearnedPattern(patternId);
      expect(pattern).toBeDefined();
      expect(pattern?.confidence).toBeLessThan(100);
    });

    it('should track remediation history', async () => {
      await learner.recordRemediation('pattern-1', { action: 'fix-1', success: true });
      await learner.recordRemediation('pattern-1', { action: 'fix-2', success: false });

      const history = learner.getRemediationHistory('pattern-1');
      expect(history.length).toBe(2);
    });
  });

  describe('Pattern Confidence Scoring', () => {
    it('should score pattern based on evidence strength', () => {
      const pattern = {
        occurrences: 10,
        successfulRemediations: 8,
        failedRemediations: 2,
        timesSeen: 15
      };

      const score = learner.scorePatternConfidence(pattern);
      expect(score).toBeGreaterThan(50);
    });

    it('should lower confidence for infrequent patterns', () => {
      const rarePattern = {
        occurrences: 1,
        successfulRemediations: 1,
        failedRemediations: 0,
        timesSeen: 1
      };

      const score = learner.scorePatternConfidence(rarePattern);
      expect(score).toBeLessThan(80);
    });

    it('should increase confidence with successful remediations', async () => {
      const patternId = 'high-success-pattern';

      for (let i = 0; i < 10; i++) {
        await learner.recordSuccess(patternId);
      }

      const pattern = learner.getLearnedPattern(patternId);
      expect(pattern?.confidence).toBeGreaterThan(80);
    });

    it('should decrease confidence with failed remediations', async () => {
      const patternId = 'low-success-pattern';

      await learner.recordSuccess(patternId);
      for (let i = 0; i < 5; i++) {
        await learner.recordFailure(patternId);
      }

      const pattern = learner.getLearnedPattern(patternId);
      expect(pattern?.confidence).toBeLessThan(50);
    });
  });

  describe('Enhancement Suggestion Generation', () => {
    it('should generate enhancement suggestions from patterns', async () => {
      const patterns = [
        {
          pattern_id: 'missing-deps',
          root_cause: { description: 'Missing dependencies' },
          occurrences: 10,
          enhancement_candidate: true
        }
      ];

      const suggestions = await learner.generateEnhancements(patterns);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('description');
    });

    it('should prioritize high-occurrence patterns for enhancement', async () => {
      const patterns = [
        { occurrences: 20, enhancement_candidate: true },
        { occurrences: 3, enhancement_candidate: true }
      ];

      const suggestions = await learner.generateEnhancements(patterns);
      expect(suggestions[0].priority).toBeGreaterThan(suggestions[1].priority);
    });

    it('should filter low-confidence patterns', async () => {
      const patterns = [
        { confidence: 90, enhancement_candidate: true },
        { confidence: 30, enhancement_candidate: true }
      ];

      const suggestions = await learner.generateEnhancements(patterns);
      expect(suggestions.length).toBe(1);
    });

    it('should calculate ROI for enhancements', async () => {
      const pattern = {
        occurrences: 15,
        averageTimeToResolve: 30, // minutes
        successRate: 0.8
      };

      const roi = learner.calculateEnhancementROI(pattern);
      expect(typeof roi).toBe('number');
      expect(roi).toBeGreaterThan(0);
    });
  });

  describe('Pattern Storage and Retrieval', () => {
    it('should store learned patterns', async () => {
      const pattern = {
        pattern_id: 'stored-pattern',
        root_cause: { description: 'Test cause' },
        confidence: 85
      };

      await learner.storePattern(pattern);

      const retrieved = learner.getLearnedPattern('stored-pattern');
      expect(retrieved).toBeDefined();
      expect(retrieved?.pattern_id).toBe('stored-pattern');
    });

    it('should retrieve patterns by type', async () => {
      await learner.storePattern({ pattern_id: 'dep-1', type: 'dependency' });
      await learner.storePattern({ pattern_id: 'config-1', type: 'configuration' });

      const depPatterns = learner.getPatternsByType('dependency');
      expect(depPatterns.length).toBeGreaterThanOrEqual(1);
    });

    it('should retrieve patterns above confidence threshold', () => {
      const patterns = learner.getPatternsAboveConfidence(80);
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should export learned patterns', async () => {
      await learner.storePattern({ pattern_id: 'export-1' });

      const exported = await learner.exportPatterns();
      expect(exported).toHaveProperty('patterns');
      expect(exported).toHaveProperty('timestamp');
    });
  });

  describe('Pattern Cleanup', () => {
    it('should remove obsolete patterns', async () => {
      const oldPattern = {
        pattern_id: 'obsolete-1',
        lastSeen: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      };

      await learner.storePattern(oldPattern);
      await learner.cleanupObsoletePatterns(30); // Remove patterns older than 30 days

      const retrieved = learner.getLearnedPattern('obsolete-1');
      expect(retrieved).toBeUndefined();
    });

    it('should remove low-confidence patterns', async () => {
      await learner.storePattern({ pattern_id: 'low-conf', confidence: 10 });

      await learner.cleanupLowConfidencePatterns(50); // Remove confidence < 50

      const retrieved = learner.getLearnedPattern('low-conf');
      expect(retrieved).toBeUndefined();
    });

    it('should preserve high-value patterns during cleanup', async () => {
      await learner.storePattern({
        pattern_id: 'valuable',
        confidence: 95,
        occurrences: 50
      });

      await learner.cleanup();

      const retrieved = learner.getLearnedPattern('valuable');
      expect(retrieved).toBeDefined();
    });
  });

  describe('Learning Report Generation', () => {
    it('should generate learning summary report', async () => {
      await learner.storePattern({ pattern_id: 'p1' });
      await learner.recordSuccess('p1');

      const report = await learner.generateLearningReport();

      expect(report).toHaveProperty('totalPatterns');
      expect(report).toHaveProperty('successRate');
      expect(report).toHaveProperty('topPatterns');
    });

    it('should include confidence distribution', async () => {
      await learner.storePattern({ confidence: 90 });
      await learner.storePattern({ confidence: 50 });

      const report = await learner.generateLearningReport();
      expect(report).toHaveProperty('confidenceDistribution');
    });

    it('should track learning progress over time', async () => {
      const progress = learner.getLearningProgress();
      expect(progress).toHaveProperty('patternsLearned');
      expect(progress).toHaveProperty('successfulRemediations');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error list', async () => {
      const patterns = await learner.recognizePatterns([]);
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBe(0);
    });

    it('should handle malformed patterns', async () => {
      const result = await learner.analyzeRootCause({} as any);
      expect(result).toBeDefined();
    });

    it('should handle concurrent pattern storage', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        learner.storePattern({ pattern_id: `concurrent-${i}` })
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle pattern retrieval of non-existent pattern', () => {
      const pattern = learner.getLearnedPattern('does-not-exist');
      expect(pattern).toBeUndefined();
    });
  });
});
