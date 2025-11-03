/**
 * VERSATIL SDLC Framework - User Coherence Monitor Tests
 * Priority 2: Guardian Component Testing (Batch 7 - Final)
 *
 * Test Coverage:
 * - User intent tracking
 * - Request coherence validation
 * - Context drift detection
 * - Contradictory request identification
 * - User goal alignment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserCoherenceMonitor } from './user-coherence-monitor.js';

describe('UserCoherenceMonitor', () => {
  let monitor: UserCoherenceMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    monitor = UserCoherenceMonitor.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UserCoherenceMonitor.getInstance();
      const instance2 = UserCoherenceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('User Intent Tracking', () => {
    it('should track user requests', () => {
      monitor.trackRequest({
        message: 'Create a login page',
        timestamp: new Date().toISOString()
      });

      const history = monitor.getRequestHistory();
      expect(history.length).toBe(1);
      expect(history[0].message).toBe('Create a login page');
    });

    it('should infer user intent from request', () => {
      const request = { message: 'Add authentication to the app' };

      const intent = monitor.inferIntent(request);
      expect(intent).toHaveProperty('type');
      expect(intent).toHaveProperty('confidence');
    });

    it('should track intent changes over time', () => {
      monitor.trackRequest({ message: 'Create a login page' });
      monitor.trackRequest({ message: 'Add unit tests' });
      monitor.trackRequest({ message: 'Fix the login bug' });

      const intents = monitor.getIntentHistory();
      expect(intents.length).toBeGreaterThanOrEqual(3);
    });

    it('should identify primary user goal', () => {
      monitor.trackRequest({ message: 'Build authentication system' });
      monitor.trackRequest({ message: 'Add login page' });
      monitor.trackRequest({ message: 'Create signup form' });

      const goal = monitor.identifyPrimaryGoal();
      expect(goal).toContain('authentication');
    });
  });

  describe('Request Coherence Validation', () => {
    it('should validate coherent request sequence', () => {
      monitor.trackRequest({ message: 'Create User model' });
      monitor.trackRequest({ message: 'Add user validation' });
      monitor.trackRequest({ message: 'Create user controller' });

      const isCoherent = monitor.validateCoherence();
      expect(isCoherent).toBe(true);
    });

    it('should detect incoherent requests', () => {
      monitor.trackRequest({ message: 'Create React component' });
      monitor.trackRequest({ message: 'Write Python unit test' });
      monitor.trackRequest({ message: 'Build Java API' });

      const isCoherent = monitor.validateCoherence();
      expect(isCoherent).toBe(false);
    });

    it('should calculate coherence score', () => {
      monitor.trackRequest({ message: 'Add login feature' });
      monitor.trackRequest({ message: 'Create login form' });

      const score = monitor.calculateCoherenceScore();
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should identify coherence breaks', () => {
      monitor.trackRequest({ message: 'Build authentication' });
      monitor.trackRequest({ message: 'Create payment system' }); // Break
      monitor.trackRequest({ message: 'Add login page' });

      const breaks = monitor.identifyCoherenceBreaks();
      expect(breaks.length).toBeGreaterThan(0);
    });
  });

  describe('Context Drift Detection', () => {
    it('should detect context drift', () => {
      monitor.trackRequest({ message: 'Build e-commerce site', context: 'project-start' });
      monitor.trackRequest({ message: 'Create product catalog', context: 'feature-dev' });
      monitor.trackRequest({ message: 'Setup CI/CD pipeline', context: 'devops' }); // Drift

      const hasDrift = monitor.detectContextDrift();
      expect(hasDrift).toBe(true);
    });

    it('should not detect drift for related contexts', () => {
      monitor.trackRequest({ message: 'Create User model' });
      monitor.trackRequest({ message: 'Add user validation' });
      monitor.trackRequest({ message: 'Write user tests' });

      const hasDrift = monitor.detectContextDrift();
      expect(hasDrift).toBe(false);
    });

    it('should measure drift severity', () => {
      monitor.trackRequest({ message: 'Build frontend' });
      monitor.trackRequest({ message: 'Configure database' }); // High drift

      const severity = monitor.measureDriftSeverity();
      expect(typeof severity).toBe('number');
      expect(severity).toBeGreaterThan(0);
    });

    it('should track context switches', () => {
      monitor.trackRequest({ message: 'Create API endpoint', context: 'backend' });
      monitor.trackRequest({ message: 'Style button', context: 'frontend' });
      monitor.trackRequest({ message: 'Add database migration', context: 'database' });

      const switches = monitor.getContextSwitches();
      expect(switches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Contradictory Request Identification', () => {
    it('should detect contradictory requests', () => {
      monitor.trackRequest({ message: 'Use MySQL database' });
      monitor.trackRequest({ message: 'Switch to PostgreSQL' }); // Contradiction

      const contradictions = monitor.detectContradictions();
      expect(contradictions.length).toBeGreaterThan(0);
    });

    it('should flag mutually exclusive requests', () => {
      monitor.trackRequest({ message: 'Make it sync' });
      monitor.trackRequest({ message: 'Make it async' });

      const conflicts = monitor.findConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should detect scope reversals', () => {
      monitor.trackRequest({ message: 'Add complex authentication system' });
      monitor.trackRequest({ message: 'Actually, keep it simple' });

      const reversals = monitor.detectReversals();
      expect(reversals.length).toBeGreaterThan(0);
    });

    it('should identify requirement changes', () => {
      monitor.trackRequest({ message: 'Build REST API' });
      monitor.trackRequest({ message: 'Change to GraphQL' });

      const changes = monitor.identifyRequirementChanges();
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('User Goal Alignment', () => {
    it('should check if request aligns with goals', () => {
      monitor.setUserGoal('Build authentication system');
      monitor.trackRequest({ message: 'Create login form' });

      const aligned = monitor.isAlignedWithGoal();
      expect(aligned).toBe(true);
    });

    it('should detect misaligned requests', () => {
      monitor.setUserGoal('Build e-commerce site');
      monitor.trackRequest({ message: 'Add chat feature' }); // Misaligned

      const aligned = monitor.isAlignedWithGoal();
      expect(aligned).toBe(false);
    });

    it('should calculate alignment score', () => {
      monitor.setUserGoal('Improve performance');
      monitor.trackRequest({ message: 'Optimize database queries' });

      const score = monitor.calculateAlignmentScore();
      expect(score).toBeGreaterThan(70);
    });

    it('should suggest refocus when misaligned', () => {
      monitor.setUserGoal('Build API');
      monitor.trackRequest({ message: 'Style the homepage' });

      const suggestions = monitor.suggestRefocus();
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Coherence Report Generation', () => {
    it('should generate coherence report', () => {
      monitor.trackRequest({ message: 'Request 1' });
      monitor.trackRequest({ message: 'Request 2' });

      const report = monitor.generateCoherenceReport();

      expect(report).toHaveProperty('coherenceScore');
      expect(report).toHaveProperty('contextDrift');
      expect(report).toHaveProperty('contradictions');
      expect(report).toHaveProperty('alignment');
    });

    it('should include recommendations in report', () => {
      monitor.trackRequest({ message: 'Build feature A' });
      monitor.trackRequest({ message: 'Build feature Z' }); // Incoherent

      const report = monitor.generateCoherenceReport();
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should track coherence trends', () => {
      for (let i = 0; i < 10; i++) {
        monitor.trackRequest({ message: `Related request ${i}` });
      }

      const trends = monitor.getCoherenceTrends();
      expect(trends).toHaveProperty('improving');
      expect(typeof trends.improving).toBe('boolean');
    });
  });

  describe('Request Pattern Analysis', () => {
    it('should identify request patterns', () => {
      monitor.trackRequest({ message: 'Add test for feature A' });
      monitor.trackRequest({ message: 'Add test for feature B' });
      monitor.trackRequest({ message: 'Add test for feature C' });

      const patterns = monitor.identifyPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toContain('test');
    });

    it('should detect iterative development pattern', () => {
      monitor.trackRequest({ message: 'Create feature' });
      monitor.trackRequest({ message: 'Test feature' });
      monitor.trackRequest({ message: 'Fix bug in feature' });
      monitor.trackRequest({ message: 'Deploy feature' });

      const pattern = monitor.detectDevelopmentPattern();
      expect(pattern).toBe('iterative');
    });

    it('should identify user working style', () => {
      for (let i = 0; i < 5; i++) {
        monitor.trackRequest({ message: 'Small incremental change' });
      }

      const style = monitor.identifyWorkingStyle();
      expect(style).toBe('incremental');
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      monitor.startMonitoring();
      expect(monitor.isMonitoring()).toBe(true);
    });

    it('should stop monitoring', () => {
      monitor.startMonitoring();
      monitor.stopMonitoring();
      expect(monitor.isMonitoring()).toBe(false);
    });

    it('should clear history', () => {
      monitor.trackRequest({ message: 'Test' });
      monitor.clearHistory();

      const history = monitor.getRequestHistory();
      expect(history.length).toBe(0);
    });

    it('should reset monitor', () => {
      monitor.trackRequest({ message: 'Test' });
      monitor.setUserGoal('Goal');
      monitor.reset();

      expect(monitor.getRequestHistory().length).toBe(0);
      expect(monitor.getUserGoal()).toBeUndefined();
    });
  });

  describe('Alert System', () => {
    it('should trigger alert on low coherence', () => {
      const listener = vi.fn();
      monitor.onCoherenceAlert(listener);

      monitor.trackRequest({ message: 'Build React app' });
      monitor.trackRequest({ message: 'Configure Spring Boot' });
      monitor.trackRequest({ message: 'Setup Rails' });

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'low-coherence',
        severity: expect.any(String)
      }));
    });

    it('should trigger alert on contradiction', () => {
      const listener = vi.fn();
      monitor.onCoherenceAlert(listener);

      monitor.trackRequest({ message: 'Use async/await' });
      monitor.trackRequest({ message: 'Use callbacks instead' });

      expect(listener).toHaveBeenCalled();
    });

    it('should configure alert thresholds', () => {
      monitor.setAlertThreshold('coherence', 60);

      const threshold = monitor.getAlertThreshold('coherence');
      expect(threshold).toBe(60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request history', () => {
      const isCoherent = monitor.validateCoherence();
      expect(typeof isCoherent).toBe('boolean');
    });

    it('should handle single request', () => {
      monitor.trackRequest({ message: 'Single request' });

      const score = monitor.calculateCoherenceScore();
      expect(score).toBeGreaterThan(0);
    });

    it('should handle malformed requests', () => {
      expect(() => monitor.trackRequest({} as any)).not.toThrow();
    });

    it('should handle very long request sequences', () => {
      for (let i = 0; i < 1000; i++) {
        monitor.trackRequest({ message: `Request ${i}` });
      }

      const report = monitor.generateCoherenceReport();
      expect(report).toBeDefined();
    });
  });
});
