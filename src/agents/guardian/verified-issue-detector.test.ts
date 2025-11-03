/**
 * VERSATIL SDLC Framework - Verified Issue Detector Tests
 * Priority 2: Guardian Component Testing (Batch 7 - Final)
 *
 * Test Coverage:
 * - Issue detection with Chain-of-Verification
 * - Evidence collection and validation
 * - False positive filtering
 * - Issue priority scoring
 * - Verified TODO creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerifiedIssueDetector } from './verified-issue-detector.js';

describe('VerifiedIssueDetector', () => {
  let detector: VerifiedIssueDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = VerifiedIssueDetector.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = VerifiedIssueDetector.getInstance();
      const instance2 = VerifiedIssueDetector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Issue Detection with Chain-of-Verification', () => {
    it('should detect issue and verify it exists', async () => {
      const suspectedIssue = {
        type: 'missing-dependency',
        description: 'Module "lodash" not found',
        file: 'src/utils/helpers.ts',
        line: 10
      };

      const verified = await detector.detectAndVerify(suspectedIssue);

      expect(verified).toHaveProperty('isVerified');
      expect(verified).toHaveProperty('confidence');
      expect(verified).toHaveProperty('evidence');
    });

    it('should perform multi-step verification', async () => {
      const issue = {
        type: 'type-error',
        file: 'src/components/Button.tsx',
        message: 'Property "onClick" does not exist'
      };

      const steps = await detector.performVerificationSteps(issue);

      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('step');
      expect(steps[0]).toHaveProperty('result');
    });

    it('should verify file exists', async () => {
      const issue = { file: 'package.json' };

      const verified = await detector.verifyFileExists(issue);
      expect(verified).toBe(true);
    });

    it('should verify error is reproducible', async () => {
      const issue = {
        type: 'runtime-error',
        file: 'src/app.ts',
        message: 'Cannot read property of undefined'
      };

      const reproducible = await detector.verifyReproducible(issue);
      expect(typeof reproducible).toBe('boolean');
    });
  });

  describe('Evidence Collection and Validation', () => {
    it('should collect evidence for issue', async () => {
      const issue = {
        type: 'missing-import',
        file: 'src/index.ts',
        symbol: 'useState'
      };

      const evidence = await detector.collectEvidence(issue);

      expect(evidence).toHaveProperty('fileContent');
      expect(evidence).toHaveProperty('lineContent');
      expect(evidence).toHaveProperty('symbols');
    });

    it('should validate evidence quality', () => {
      const evidence = {
        fileExists: true,
        contentMatches: true,
        symbolFound: false,
        stackTraceValid: true
      };

      const quality = detector.validateEvidenceQuality(evidence);
      expect(typeof quality).toBe('number');
      expect(quality).toBeGreaterThanOrEqual(0);
      expect(quality).toBeLessThanOrEqual(100);
    });

    it('should cross-reference multiple evidence sources', async () => {
      const issue = { type: 'import-error', file: 'src/app.ts' };

      const evidence = await detector.collectEvidence(issue);
      const crossReferenced = await detector.crossReferenceEvidence(evidence);

      expect(crossReferenced).toHaveProperty('consistent');
    });

    it('should verify evidence timestamp', () => {
      const evidence = {
        timestamp: new Date().toISOString(),
        stale: false
      };

      const isValid = detector.verifyEvidenceTimestamp(evidence);
      expect(isValid).toBe(true);
    });
  });

  describe('False Positive Filtering', () => {
    it('should filter out false positives', async () => {
      const issues = [
        { type: 'error', verified: true, confidence: 95 },
        { type: 'error', verified: false, confidence: 30 },
        { type: 'error', verified: true, confidence: 85 }
      ];

      const filtered = await detector.filterFalsePositives(issues);
      expect(filtered.length).toBe(2);
    });

    it('should detect IDE false positives', async () => {
      const issue = {
        type: 'type-error',
        source: 'IDE',
        message: 'Type mismatch',
        actuallyValid: true
      };

      const isFalsePositive = await detector.isFalsePositive(issue);
      expect(isFalsePositive).toBe(true);
    });

    it('should verify against source code', async () => {
      const issue = {
        type: 'undefined-variable',
        file: 'src/app.ts',
        variable: 'config'
      };

      const verified = await detector.verifyAgainstSourceCode(issue);
      expect(typeof verified).toBe('boolean');
    });

    it('should check for stale issues', async () => {
      const issue = {
        type: 'error',
        detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      };

      const isStale = await detector.isStaleIssue(issue);
      expect(typeof isStale).toBe('boolean');
    });
  });

  describe('Issue Priority Scoring', () => {
    it('should calculate priority score', () => {
      const issue = {
        type: 'error',
        severity: 'high',
        impact: 'blocking',
        affected_users: 100,
        confidence: 95
      };

      const score = detector.calculatePriorityScore(issue);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });

    it('should prioritize blocking issues', () => {
      const blocking = { type: 'error', severity: 'critical', blocking: true };
      const warning = { type: 'warning', severity: 'low', blocking: false };

      const blockingScore = detector.calculatePriorityScore(blocking);
      const warningScore = detector.calculatePriorityScore(warning);

      expect(blockingScore).toBeGreaterThan(warningScore);
    });

    it('should factor in confidence level', () => {
      const highConfidence = { confidence: 95 };
      const lowConfidence = { confidence: 40 };

      const highScore = detector.calculatePriorityScore(highConfidence);
      const lowScore = detector.calculatePriorityScore(lowConfidence);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should rank issues by priority', () => {
      const issues = [
        { id: 1, severity: 'low', confidence: 60 },
        { id: 2, severity: 'high', confidence: 90 },
        { id: 3, severity: 'medium', confidence: 75 }
      ];

      const ranked = detector.rankByPriority(issues);
      expect(ranked[0].id).toBe(2); // Highest priority first
    });
  });

  describe('Verified TODO Creation', () => {
    it('should create verified TODO from issue', async () => {
      const issue = {
        type: 'missing-test',
        file: 'src/components/Button.tsx',
        description: 'Add unit tests for Button component'
      };

      const todo = await detector.createVerifiedTODO(issue);

      expect(todo).toHaveProperty('title');
      expect(todo).toHaveProperty('description');
      expect(todo).toHaveProperty('file');
      expect(todo).toHaveProperty('verified');
      expect(todo.verified).toBe(true);
    });

    it('should include verification metadata', async () => {
      const issue = { type: 'bug', file: 'src/app.ts' };

      const todo = await detector.createVerifiedTODO(issue);

      expect(todo).toHaveProperty('verificationMetadata');
      expect(todo.verificationMetadata).toHaveProperty('timestamp');
      expect(todo.verificationMetadata).toHaveProperty('confidence');
    });

    it('should assign agent to TODO', async () => {
      const issue = {
        type: 'frontend-bug',
        file: 'src/components/Header.tsx'
      };

      const todo = await detector.createVerifiedTODO(issue);
      expect(todo.assignedAgent).toBe('James-Frontend');
    });

    it('should not create TODO for low confidence issues', async () => {
      const issue = {
        type: 'suspicious',
        confidence: 20
      };

      const todo = await detector.createVerifiedTODO(issue);
      expect(todo).toBeNull();
    });
  });

  describe('Issue Classification', () => {
    it('should classify issue type', () => {
      const issues = [
        { message: 'Cannot find module' },
        { message: 'TypeError: undefined' },
        { message: 'Syntax error' }
      ];

      issues.forEach(issue => {
        const classification = detector.classifyIssue(issue);
        expect(classification).toHaveProperty('type');
        expect(classification).toHaveProperty('category');
      });
    });

    it('should identify security issues', () => {
      const issue = {
        type: 'vulnerability',
        message: 'SQL injection risk detected'
      };

      const isSecurity = detector.isSecurityIssue(issue);
      expect(isSecurity).toBe(true);
    });

    it('should identify performance issues', () => {
      const issue = {
        type: 'performance',
        message: 'Slow query detected'
      };

      const isPerformance = detector.isPerformanceIssue(issue);
      expect(isPerformance).toBe(true);
    });

    it('should categorize by affected area', () => {
      const issue = { file: 'src/components/Button.tsx' };

      const area = detector.categorizeByArea(issue);
      expect(area).toBe('frontend');
    });
  });

  describe('Batch Detection', () => {
    it('should detect multiple issues', async () => {
      const sources = [
        'src/app.ts',
        'src/components/Header.tsx',
        'src/utils/helpers.ts'
      ];

      const issues = await detector.detectIssuesInFiles(sources);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should verify issues in parallel', async () => {
      const issues = [
        { id: 1, type: 'error' },
        { id: 2, type: 'warning' },
        { id: 3, type: 'error' }
      ];

      const verified = await detector.verifyBatch(issues);
      expect(verified.length).toBeLessThanOrEqual(issues.length);
    });

    it('should aggregate verification results', async () => {
      const issues = [
        { id: 1, verified: true },
        { id: 2, verified: false },
        { id: 3, verified: true }
      ];

      const summary = detector.aggregateResults(issues);
      expect(summary).toHaveProperty('totalIssues');
      expect(summary).toHaveProperty('verifiedCount');
      expect(summary).toHaveProperty('falsePositiveCount');
    });
  });

  describe('Verification Report Generation', () => {
    it('should generate verification report', async () => {
      const issue = {
        type: 'error',
        file: 'src/app.ts',
        message: 'Cannot find module'
      };

      const report = await detector.generateVerificationReport(issue);

      expect(report).toHaveProperty('issue');
      expect(report).toHaveProperty('verificationSteps');
      expect(report).toHaveProperty('evidence');
      expect(report).toHaveProperty('conclusion');
    });

    it('should include confidence breakdown', async () => {
      const issue = { type: 'error' };

      const report = await detector.generateVerificationReport(issue);
      expect(report).toHaveProperty('confidenceBreakdown');
    });

    it('should provide recommendations', async () => {
      const issue = {
        type: 'missing-dependency',
        package: 'lodash'
      };

      const report = await detector.generateVerificationReport(issue);
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should configure confidence threshold', () => {
      detector.setConfidenceThreshold(80);
      expect(detector.getConfidenceThreshold()).toBe(80);
    });

    it('should configure verification depth', () => {
      detector.setVerificationDepth('thorough');
      expect(detector.getVerificationDepth()).toBe('thorough');
    });

    it('should enable/disable auto-TODO creation', () => {
      detector.setAutoTODOCreation(true);
      expect(detector.isAutoTODOCreationEnabled()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing file gracefully', async () => {
      const issue = { file: 'non-existent-file.ts' };

      const verified = await detector.detectAndVerify(issue);
      expect(verified.isVerified).toBe(false);
    });

    it('should handle malformed issues', async () => {
      const result = await detector.detectAndVerify({} as any);
      expect(result).toBeDefined();
    });

    it('should handle verification timeout', async () => {
      const issue = { type: 'slow-verification' };

      const result = await detector.detectAndVerify(issue, { timeout: 100 });
      expect(result).toBeDefined();
    });

    it('should handle concurrent verifications', async () => {
      const issues = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        type: 'error'
      }));

      const results = await Promise.all(
        issues.map(issue => detector.detectAndVerify(issue))
      );

      expect(results.length).toBe(10);
    });
  });
});
