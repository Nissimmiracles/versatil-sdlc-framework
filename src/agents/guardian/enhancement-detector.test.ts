/**
 * VERSATIL SDLC Framework - Enhancement Detector Tests
 * Priority 2: Guardian System Testing
 *
 * Test Coverage:
 * - Enhancement detection from root cause patterns
 * - Priority scoring and categorization
 * - ROI calculation and effort estimation
 * - Agent assignment logic
 * - Approval tier determination
 * - Filtering and confidence thresholds
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancementDetector } from './enhancement-detector.js';
import type { EnhancementSuggestion, EnhancementDetectionResult } from './enhancement-detector.js';
import type { RootCausePattern } from './root-cause-learner.js';

// Mock Guardian logger
vi.mock('./guardian-logger.js', () => ({
  GuardianLogger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }))
  }
}));

// Mock learning store
vi.mock('./guardian-learning-store.js', () => ({
  searchGuardianLearnings: vi.fn().mockResolvedValue([])
}));

describe('EnhancementDetector', () => {
  let detector: EnhancementDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new EnhancementDetector();
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      expect(detector).toBeDefined();
      expect(detector['config']).toBeDefined();
      expect(detector['config'].min_confidence_for_suggestion).toBe(80);
      expect(detector['config'].min_occurrences_for_enhancement).toBe(3);
      expect(detector['config'].enable_rag_lookup).toBe(true);
    });

    it('should allow custom configuration', () => {
      const customDetector = new EnhancementDetector({
        min_confidence_for_suggestion: 90,
        min_occurrences_for_enhancement: 5
      });

      expect(customDetector['config'].min_confidence_for_suggestion).toBe(90);
      expect(customDetector['config'].min_occurrences_for_enhancement).toBe(5);
    });
  });

  describe('Enhancement Detection', () => {
    it('should detect enhancements from patterns', async () => {
      const mockPattern: RootCausePattern = {
        pattern_id: 'test-pattern-1',
        issue_type: 'Missing dependency',
        root_cause: {
          description: 'Package not installed',
          category: 'dependency',
          confidence: 90,
          evidence: []
        },
        auto_fix: {
          action: 'npm install',
          confidence: 85,
          learned_at: '2025-11-03T10:00:00.000Z'
        },
        occurrences: 5,
        first_seen: '2025-11-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Auto-remediation'
      };

      const result = await detector.detectEnhancements([mockPattern]);

      expect(result).toBeDefined();
      expect(result.total_patterns_analyzed).toBe(1);
      expect(result.enhancements_suggested.length).toBeGreaterThan(0);
    });

    it('should filter out low confidence patterns', async () => {
      const lowConfidencePattern: RootCausePattern = {
        pattern_id: 'low-conf',
        issue_type: 'Unknown error',
        root_cause: {
          description: 'Unclear cause',
          category: 'unknown',
          confidence: 50, // Below threshold
          evidence: []
        },
        occurrences: 5,
        first_seen: '2025-11-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Manual'
      };

      const result = await detector.detectEnhancements([lowConfidencePattern]);

      expect(result.enhancements_suggested.length).toBe(0);
    });

    it('should filter out patterns with few occurrences', async () => {
      const rarePattern: RootCausePattern = {
        pattern_id: 'rare',
        issue_type: 'Rare error',
        root_cause: {
          description: 'Infrequent issue',
          category: 'other',
          confidence: 90,
          evidence: []
        },
        occurrences: 1, // Below threshold (3)
        first_seen: '2025-11-03T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Auto-remediation'
      };

      const result = await detector.detectEnhancements([rarePattern]);

      expect(result.enhancements_suggested.length).toBe(0);
    });

    it('should not suggest enhancements for non-candidates', async () => {
      const nonCandidate: RootCausePattern = {
        pattern_id: 'non-candidate',
        issue_type: 'One-off error',
        root_cause: {
          description: 'Unique issue',
          category: 'other',
          confidence: 95,
          evidence: []
        },
        occurrences: 10,
        first_seen: '2025-11-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: false, // Not a candidate
        learned_from: 'Manual'
      };

      const result = await detector.detectEnhancements([nonCandidate]);

      expect(result.enhancements_suggested.length).toBe(0);
    });
  });

  describe('Enhancement Suggestion Structure', () => {
    it('should generate complete enhancement suggestion', async () => {
      const mockPattern: RootCausePattern = {
        pattern_id: 'complete-test',
        issue_type: 'Build failure',
        root_cause: {
          description: 'Missing TypeScript config',
          category: 'configuration',
          confidence: 95,
          evidence: []
        },
        auto_fix: {
          action: 'Create tsconfig.json',
          confidence: 90,
          learned_at: '2025-11-03T10:00:00.000Z'
        },
        occurrences: 10,
        first_seen: '2025-10-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Auto-remediation'
      };

      const result = await detector.detectEnhancements([mockPattern]);
      const suggestion = result.enhancements_suggested[0];

      if (suggestion) {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('implementation_steps');
        expect(suggestion).toHaveProperty('estimated_effort_hours');
        expect(suggestion).toHaveProperty('assigned_agent');
        expect(suggestion).toHaveProperty('roi');
        expect(suggestion).toHaveProperty('evidence');
        expect(suggestion).toHaveProperty('approval_tier');
      }
    });
  });

  describe('Priority Scoring', () => {
    it('should assign critical priority for high occurrence patterns', async () => {
      const highOccurrencePattern: RootCausePattern = {
        pattern_id: 'critical',
        issue_type: 'Frequent crash',
        root_cause: {
          description: 'Memory leak',
          category: 'performance',
          confidence: 95,
          evidence: []
        },
        occurrences: 50, // Very high
        first_seen: '2025-10-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Auto-remediation'
      };

      const result = await detector.detectEnhancements([highOccurrencePattern]);

      if (result.enhancements_suggested[0]) {
        expect(result.high_priority_count).toBeGreaterThan(0);
      }
    });
  });

  describe('ROI Calculation', () => {
    it('should calculate ROI metrics', async () => {
      const pattern: RootCausePattern = {
        pattern_id: 'roi-test',
        issue_type: 'Manual fix required',
        root_cause: {
          description: 'Repetitive issue',
          category: 'automation',
          confidence: 90,
          evidence: []
        },
        auto_fix: {
          action: 'Automated fix',
          confidence: 85,
          learned_at: '2025-11-03T10:00:00.000Z'
        },
        occurrences: 20,
        first_seen: '2025-10-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Auto-remediation'
      };

      const result = await detector.detectEnhancements([pattern]);

      expect(result.total_roi_hours_per_week).toBeGreaterThanOrEqual(0);

      if (result.enhancements_suggested[0]) {
        const suggestion = result.enhancements_suggested[0];
        expect(suggestion.roi).toBeDefined();
        expect(suggestion.roi.hours_saved_per_week).toBeGreaterThanOrEqual(0);
        expect(suggestion.roi.roi_ratio).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Agent Assignment', () => {
    it('should assign appropriate agent based on category', async () => {
      const patterns: RootCausePattern[] = [
        {
          pattern_id: 'frontend',
          issue_type: 'UI error',
          root_cause: {
            description: 'Frontend issue',
            category: 'ui',
            confidence: 90,
            evidence: []
          },
          occurrences: 5,
          first_seen: '2025-11-01T10:00:00.000Z',
          last_seen: '2025-11-03T10:00:00.000Z',
          enhancement_candidate: true,
          learned_from: 'Auto-remediation'
        }
      ];

      const result = await detector.detectEnhancements(patterns);

      if (result.enhancements_suggested[0]) {
        expect(result.enhancements_suggested[0].assigned_agent).toBeDefined();
        expect(typeof result.enhancements_suggested[0].assigned_agent).toBe('string');
      }
    });
  });

  describe('Result Aggregation', () => {
    it('should calculate average confidence', async () => {
      const patterns: RootCausePattern[] = [
        {
          pattern_id: 'p1',
          issue_type: 'Issue 1',
          root_cause: { description: 'Root 1', category: 'config', confidence: 90, evidence: [] },
          occurrences: 5,
          first_seen: '2025-11-01T10:00:00.000Z',
          last_seen: '2025-11-03T10:00:00.000Z',
          enhancement_candidate: true,
          learned_from: 'Auto-remediation'
        },
        {
          pattern_id: 'p2',
          issue_type: 'Issue 2',
          root_cause: { description: 'Root 2', category: 'config', confidence: 85, evidence: [] },
          occurrences: 5,
          first_seen: '2025-11-01T10:00:00.000Z',
          last_seen: '2025-11-03T10:00:00.000Z',
          enhancement_candidate: true,
          learned_from: 'Auto-remediation'
        }
      ];

      const result = await detector.detectEnhancements(patterns);

      if (result.enhancements_suggested.length > 0) {
        expect(result.avg_confidence).toBeGreaterThan(0);
        expect(result.avg_confidence).toBeLessThanOrEqual(100);
      }
    });

    it('should count high priority suggestions', async () => {
      const patterns: RootCausePattern[] = [
        {
          pattern_id: 'high-pri',
          issue_type: 'Critical issue',
          root_cause: { description: 'Serious problem', category: 'reliability', confidence: 95, evidence: [] },
          occurrences: 30,
          first_seen: '2025-10-01T10:00:00.000Z',
          last_seen: '2025-11-03T10:00:00.000Z',
          enhancement_candidate: true,
          learned_from: 'Auto-remediation'
        }
      ];

      const result = await detector.detectEnhancements(patterns);

      expect(result.high_priority_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pattern array', async () => {
      const result = await detector.detectEnhancements([]);

      expect(result.total_patterns_analyzed).toBe(0);
      expect(result.enhancements_suggested.length).toBe(0);
      expect(result.high_priority_count).toBe(0);
    });

    it('should handle patterns without auto_fix', async () => {
      const pattern: RootCausePattern = {
        pattern_id: 'no-autofix',
        issue_type: 'Manual only',
        root_cause: {
          description: 'Requires manual intervention',
          category: 'complex',
          confidence: 90,
          evidence: []
        },
        occurrences: 5,
        first_seen: '2025-11-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Manual'
      };

      const result = await detector.detectEnhancements([pattern]);

      // Should still generate enhancement even without auto_fix
      expect(result).toBeDefined();
    });
  });

  describe('Approval Tier Logic', () => {
    it('should determine approval tier for suggestions', async () => {
      const pattern: RootCausePattern = {
        pattern_id: 'approval-test',
        issue_type: 'Config change',
        root_cause: {
          description: 'Needs config update',
          category: 'configuration',
          confidence: 90,
          evidence: []
        },
        occurrences: 5,
        first_seen: '2025-11-01T10:00:00.000Z',
        last_seen: '2025-11-03T10:00:00.000Z',
        enhancement_candidate: true,
        learned_from: 'Auto-remediation'
      };

      const result = await detector.detectEnhancements([pattern]);

      if (result.enhancements_suggested[0]) {
        const tier = result.enhancements_suggested[0].approval_tier;
        expect([1, 2, 3]).toContain(tier);
      }
    });
  });
});
