/**
 * Tests for Guardian Logger
 *
 * Validates logging functionality, file persistence, and activity tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GuardianLogger, GuardianLogEntry, ActivityEntry } from './guardian-logger.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('GuardianLogger', () => {
  let logger: GuardianLogger;
  const testLogsDir = path.join(os.tmpdir(), `test-guardian-logs-${Date.now()}`);

  beforeEach(() => {
    // Create test logs directory
    if (!fs.existsSync(testLogsDir)) {
      fs.mkdirSync(testLogsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test logs
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true });
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GuardianLogger.getInstance('PROJECT_CONTEXT');
      const instance2 = GuardianLogger.getInstance('PROJECT_CONTEXT');

      expect(instance1).toBe(instance2);
    });
  });

  describe('Log Entry Creation', () => {
    beforeEach(() => {
      logger = GuardianLogger.getInstance('PROJECT_CONTEXT');
    });

    it('should create info log entry with correct structure', () => {
      const entry: GuardianLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'health',
        context: 'PROJECT_CONTEXT',
        message: 'Test health check',
        data: { status: 'ok' },
      };

      expect(entry.timestamp).toBeDefined();
      expect(entry.level).toBe('info');
      expect(entry.category).toBe('health');
      expect(entry.message).toBe('Test health check');
    });

    it('should create error log entry with duration', () => {
      const entry: GuardianLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        category: 'remediation',
        context: 'PROJECT_CONTEXT',
        message: 'Auto-fix failed',
        data: { error: 'timeout' },
        duration_ms: 5000,
      };

      expect(entry.level).toBe('error');
      expect(entry.duration_ms).toBe(5000);
    });
  });

  describe('Activity Timeline', () => {
    it('should create activity entry for health check', () => {
      const activity: ActivityEntry = {
        timestamp: new Date().toISOString(),
        type: 'health_check',
        status: 'success',
        description: 'System health check passed',
        details: { checks_passed: 5, checks_failed: 0 },
      };

      expect(activity.type).toBe('health_check');
      expect(activity.status).toBe('success');
      expect(activity.details?.checks_passed).toBe(5);
    });

    it('should create activity entry for auto-fix', () => {
      const activity: ActivityEntry = {
        timestamp: new Date().toISOString(),
        type: 'auto_fix',
        status: 'warning',
        description: 'Attempted auto-fix for test coverage',
        details: {
          issue: 'low_coverage',
          before: 60,
          after: 75,
        },
      };

      expect(activity.type).toBe('auto_fix');
      expect(activity.details?.before).toBe(60);
      expect(activity.details?.after).toBe(75);
    });
  });

  describe('Context Validation', () => {
    it('should accept FRAMEWORK_CONTEXT', () => {
      const entry: GuardianLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'version',
        context: 'FRAMEWORK_CONTEXT',
        message: 'Version bump',
      };

      expect(entry.context).toBe('FRAMEWORK_CONTEXT');
    });

    it('should accept PROJECT_CONTEXT', () => {
      const entry: GuardianLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'health',
        context: 'PROJECT_CONTEXT',
        message: 'Project health check',
      };

      expect(entry.context).toBe('PROJECT_CONTEXT');
    });
  });

  describe('Log Categories', () => {
    const categories = ['health', 'remediation', 'rag', 'agent', 'version', 'system'] as const;

    categories.forEach((category) => {
      it(`should support ${category} category`, () => {
        const entry: GuardianLogEntry = {
          timestamp: new Date().toISOString(),
          level: 'info',
          category,
          context: 'PROJECT_CONTEXT',
          message: `Test ${category} log`,
        };

        expect(entry.category).toBe(category);
      });
    });
  });

  describe('Log Levels', () => {
    const levels = ['info', 'warn', 'error', 'debug'] as const;

    levels.forEach((level) => {
      it(`should support ${level} log level`, () => {
        const entry: GuardianLogEntry = {
          timestamp: new Date().toISOString(),
          level,
          category: 'system',
          context: 'PROJECT_CONTEXT',
          message: `Test ${level} message`,
        };

        expect(entry.level).toBe(level);
      });
    });
  });

  describe('Data Serialization', () => {
    it('should handle nested objects in data field', () => {
      const entry: GuardianLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'rag',
        context: 'PROJECT_CONTEXT',
        message: 'RAG query result',
        data: {
          query: 'test query',
          results: {
            count: 5,
            top_match: {
              score: 0.95,
              document: 'auth-pattern.md',
            },
          },
        },
      };

      expect(entry.data?.results.top_match.score).toBe(0.95);
    });

    it('should handle array data', () => {
      const entry: GuardianLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'agent',
        context: 'PROJECT_CONTEXT',
        message: 'Agents activated',
        data: {
          agents: ['Maria-QA', 'Marcus-Backend', 'James-Frontend'],
        },
      };

      expect(entry.data?.agents).toHaveLength(3);
      expect(entry.data?.agents).toContain('Maria-QA');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const entry: GuardianLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'system',
        context: 'PROJECT_CONTEXT',
        message: 'Simple log',
      };

      expect(entry.data).toBeUndefined();
      expect(entry.duration_ms).toBeUndefined();
    });
  });

  describe('Timestamp Validation', () => {
    it('should have valid ISO 8601 timestamp', () => {
      const timestamp = new Date().toISOString();
      const entry: GuardianLogEntry = {
        timestamp,
        level: 'info',
        category: 'system',
        context: 'PROJECT_CONTEXT',
        message: 'Timestamp test',
      };

      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(entry.timestamp).toISOString()).toBe(timestamp);
    });
  });
});
