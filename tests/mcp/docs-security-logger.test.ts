/**
 * Tests for VERSATIL MCP Documentation Security Logger
 * Phase 4.1: Persistent Security Logs
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  SecurityLogger,
  SecurityEventType,
  SecuritySeverity,
  formatSecurityEvent,
} from '../../src/mcp/docs-security-logger.js';

describe('SecurityLogger', () => {
  let logger: SecurityLogger;
  let testLogDir: string;

  beforeEach(async () => {
    // Create temporary log directory for tests
    testLogDir = path.join(process.cwd(), '.versatil', 'test-security-logs');
    await fs.mkdir(testLogDir, { recursive: true });

    logger = new SecurityLogger({
      logDir: testLogDir,
      maxLogSize: 1024, // 1KB for testing rotation
      retentionDays: 7,
    });

    await logger.initialize();
  });

  afterEach(async () => {
    // Clean up test logs
    try {
      await logger.clearLogs();
      await fs.rmdir(testLogDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should create log directory on initialization', async () => {
      const stats = await fs.stat(testLogDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should emit initialized event', async () => {
      const newLogger = new SecurityLogger({ logDir: testLogDir });
      const initPromise = new Promise(resolve => {
        newLogger.once('initialized', resolve);
      });

      await newLogger.initialize();
      await initPromise;

      expect(true).toBe(true); // Event was emitted
    });
  });

  describe('logging events', () => {
    it('should log a security event', async () => {
      const eventId = await logger.logEvent(
        SecurityEventType.ACCESS_GRANTED,
        SecuritySeverity.LOW,
        'Test event',
        { path: 'test.md' }
      );

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^sec_/);
    });

    it('should persist event to log file', async () => {
      await logger.logEvent(
        SecurityEventType.ACCESS_DENIED,
        SecuritySeverity.MEDIUM,
        'Access denied test',
        { path: 'restricted.md' }
      );

      const logPath = logger.getLogFilePath();
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('access_denied'); // Lowercase in JSON
      expect(lines[0]).toContain('restricted.md');
    });

    it('should emit event for real-time monitoring', async () => {
      const eventPromise = new Promise(resolve => {
        logger.once('event', resolve);
      });

      await logger.logEvent(
        SecurityEventType.SEARCH_QUERY,
        SecuritySeverity.LOW,
        'Search test'
      );

      const event = await eventPromise;
      expect(event).toBeDefined();
    });

    it('should emit high-severity event separately', async () => {
      const highSeverityPromise = new Promise(resolve => {
        logger.once('high-severity', resolve);
      });

      await logger.logEvent(
        SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
        SecuritySeverity.CRITICAL,
        'Path traversal detected'
      );

      const event = await highSeverityPromise;
      expect(event).toBeDefined();
    });
  });

  describe('convenience methods', () => {
    it('should log access granted', async () => {
      const eventId = await logger.logAccessGranted('docs/test.md', 'user123');

      const events = await logger.queryLogs();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.ACCESS_GRANTED);
      expect(events[0].details.path).toBe('docs/test.md');
      expect(events[0].details.user).toBe('user123');
    });

    it('should log access denied', async () => {
      const eventId = await logger.logAccessDenied(
        'docs/secret.md',
        'Insufficient permissions',
        'user456'
      );

      const events = await logger.queryLogs();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.ACCESS_DENIED);
      expect(events[0].severity).toBe(SecuritySeverity.MEDIUM);
    });

    it('should log path traversal attempt', async () => {
      const eventId = await logger.logPathTraversalAttempt(
        '../../../etc/passwd',
        'attacker',
        '192.168.1.100'
      );

      const events = await logger.queryLogs();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.PATH_TRAVERSAL_ATTEMPT);
      expect(events[0].severity).toBe(SecuritySeverity.CRITICAL);
      expect(events[0].details.ip).toBe('192.168.1.100');
    });

    it('should log file size violation', async () => {
      const eventId = await logger.logFileSizeViolation(
        'large-file.md',
        20 * 1024 * 1024,
        10 * 1024 * 1024
      );

      const events = await logger.queryLogs();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.FILE_SIZE_VIOLATION);
    });
  });

  describe('querying logs', () => {
    beforeEach(async () => {
      // Create test events
      await logger.logAccessGranted('doc1.md');
      await logger.logAccessDenied('doc2.md', 'No permission');
      await logger.logPathTraversalAttempt('../etc/passwd');
    });

    it('should query all logs', async () => {
      const events = await logger.queryLogs();
      expect(events).toHaveLength(3);
    });

    it('should filter by event type', async () => {
      const events = await logger.queryLogs({
        types: [SecurityEventType.ACCESS_GRANTED],
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.ACCESS_GRANTED);
    });

    it('should filter by severity', async () => {
      const events = await logger.queryLogs({
        severities: [SecuritySeverity.CRITICAL],
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.PATH_TRAVERSAL_ATTEMPT);
    });

    it('should filter by date range', async () => {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 1); // 1 hour ago

      const events = await logger.queryLogs({ startDate });

      expect(events.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const page1 = await logger.queryLogs({ limit: 2, offset: 0 });
      const page2 = await logger.queryLogs({ limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await logger.logAccessGranted('doc1.md');
      await logger.logAccessGranted('doc2.md');
      await logger.logAccessDenied('doc3.md', 'No permission');
      await logger.logPathTraversalAttempt('../etc/passwd');
    });

    it('should calculate total events', async () => {
      const stats = await logger.getStatistics();
      expect(stats.totalEvents).toBe(4);
    });

    it('should count events by type', async () => {
      const stats = await logger.getStatistics();

      expect(stats.eventsByType[SecurityEventType.ACCESS_GRANTED]).toBe(2);
      expect(stats.eventsByType[SecurityEventType.ACCESS_DENIED]).toBe(1);
      expect(stats.eventsByType[SecurityEventType.PATH_TRAVERSAL_ATTEMPT]).toBe(1);
    });

    it('should count events by severity', async () => {
      const stats = await logger.getStatistics();

      expect(stats.eventsBySeverity[SecuritySeverity.LOW]).toBe(2);
      expect(stats.eventsBySeverity[SecuritySeverity.MEDIUM]).toBe(1);
      expect(stats.eventsBySeverity[SecuritySeverity.CRITICAL]).toBe(1);
    });

    it('should count suspicious activity', async () => {
      const stats = await logger.getStatistics();
      expect(stats.suspiciousActivityCount).toBe(1); // Critical event
    });

    it('should track time range', async () => {
      const stats = await logger.getStatistics();

      expect(stats.timeRange.earliest).toBeInstanceOf(Date);
      expect(stats.timeRange.latest).toBeInstanceOf(Date);
      expect(stats.timeRange.latest!.getTime()).toBeGreaterThanOrEqual(
        stats.timeRange.earliest!.getTime()
      );
    });
  });

  describe('log management', () => {
    it('should clear all logs', async () => {
      await logger.logAccessGranted('doc1.md');
      await logger.logAccessGranted('doc2.md');

      let events = await logger.queryLogs();
      expect(events.length).toBeGreaterThan(0);

      await logger.clearLogs();

      events = await logger.queryLogs();
      expect(events).toHaveLength(0);
    });

    it('should emit logs-cleared event', async () => {
      const clearedPromise = new Promise(resolve => {
        logger.once('logs-cleared', resolve);
      });

      await logger.clearLogs();
      await clearedPromise;

      expect(true).toBe(true);
    });
  });

  describe('helper functions', () => {
    it('should format security event for display', async () => {
      await logger.logPathTraversalAttempt(
        '../etc/passwd',
        'attacker',
        '192.168.1.100'
      );

      const events = await logger.queryLogs();
      const formatted = formatSecurityEvent(events[0]);

      expect(formatted).toContain('🔴'); // Critical severity emoji
      expect(formatted).toContain('PATH_TRAVERSAL_ATTEMPT');
      expect(formatted).toContain('../etc/passwd');
      expect(formatted).toContain('attacker');
      expect(formatted).toContain('192.168.1.100');
    });

    it('should format events with different severity emojis', async () => {
      // Clear any existing logs first
      await logger.clearLogs();

      await logger.logAccessGranted('test.md');
      await logger.logAccessDenied('test2.md', 'reason');

      const events = await logger.queryLogs();

      expect(events).toHaveLength(2);

      // Events are sorted by timestamp descending (most recent first)
      // Find the events by their type instead of assuming order
      const grantedEvent = events.find(e => e.type === SecurityEventType.ACCESS_GRANTED);
      const deniedEvent = events.find(e => e.type === SecurityEventType.ACCESS_DENIED);

      expect(grantedEvent).toBeDefined();
      expect(deniedEvent).toBeDefined();

      const lowSeverity = formatSecurityEvent(grantedEvent!);
      const mediumSeverity = formatSecurityEvent(deniedEvent!);

      expect(lowSeverity).toContain('🟢');
      expect(mediumSeverity).toContain('🟡');
    });
  });
});
