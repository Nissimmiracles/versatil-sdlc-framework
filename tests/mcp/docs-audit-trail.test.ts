/**
 * Tests for Comprehensive Audit Trail (Phase 4.4)
 */

import { jest } from '@jest/globals';
import {
  AuditTrail,
  AuditEventType,
  RequestContext,
  formatAuditEvent,
  createFullAuditTrail,
} from '../../src/mcp/docs-audit-trail.js';
import { SecurityLogger, SecurityEventType, SecuritySeverity } from '../../src/mcp/docs-security-logger.js';
import { RateLimiter } from '../../src/mcp/docs-rate-limiter.js';
import { IPAccessControl, AccessControlMode } from '../../src/mcp/docs-ip-access-control.js';
import { promises as fs } from 'fs';
import path from 'path';

describe('AuditTrail - Phase 4.4', () => {
  let tempDir: string;
  let auditTrail: AuditTrail;
  let securityLogger: SecurityLogger;
  let rateLimiter: RateLimiter;
  let ipAccessControl: IPAccessControl;

  beforeEach(async () => {
    // Create temporary directory for test logs
    tempDir = path.join(process.cwd(), '.versatil', 'test-audit-trail');
    await fs.mkdir(tempDir, { recursive: true });

    securityLogger = new SecurityLogger({ logDir: tempDir });
    await securityLogger.initialize();

    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 60000,
    });

    ipAccessControl = new IPAccessControl({
      rulesFile: path.join(tempDir, 'ip-rules.json'),
      autoSave: false, // Disable auto-save for faster tests
    });
    await ipAccessControl.initialize();

    auditTrail = new AuditTrail({
      securityLogger,
      rateLimiter,
      ipAccessControl,
      enableDetailedLogging: false, // Disable console output during tests
    });
  });

  afterEach(async () => {
    // Clean up test logs
    try {
      await securityLogger.clearLogs();
      await fs.rmdir(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Request Tracking', () => {
    it('should start and track a request', async () => {
      const context = await auditTrail.startRequest(
        '192.168.1.100',
        'search',
        'testuser',
        { query: 'test' }
      );

      expect(context.id).toMatch(/^audit_\d+_\d+$/);
      expect(context.ip).toBe('192.168.1.100');
      expect(context.user).toBe('testuser');
      expect(context.action).toBe('search');
      expect(context.metadata).toEqual({ query: 'test' });
      expect(auditTrail.getActiveRequestCount()).toBe(1);
    });

    it('should complete a request successfully', async () => {
      const context = await auditTrail.startRequest('192.168.1.100', 'search');

      const event = await auditTrail.completeRequest(context, 'success', {
        resultCount: 10,
      });

      expect(event.type).toBe(AuditEventType.RESPONSE);
      expect(event.result).toBe('success');
      expect(event.metadata?.resultCount).toBe(10);
      expect(event.duration).toBeGreaterThanOrEqual(0);
      expect(auditTrail.getActiveRequestCount()).toBe(0);
    });

    it('should complete a request with failure', async () => {
      const context = await auditTrail.startRequest('192.168.1.100', 'search');

      const event = await auditTrail.completeRequest(context, 'failure', {
        error: 'Index not built',
      });

      expect(event.type).toBe(AuditEventType.ERROR);
      expect(event.result).toBe('failure');
      expect(event.metadata?.error).toBe('Index not built');
    });

    it('should track multiple active requests', async () => {
      const context1 = await auditTrail.startRequest('192.168.1.100', 'search');
      const context2 = await auditTrail.startRequest('192.168.1.101', 'getDocument');

      expect(auditTrail.getActiveRequestCount()).toBe(2);

      const activeRequests = auditTrail.getActiveRequests();
      expect(activeRequests).toHaveLength(2);
      expect(activeRequests.map(r => r.action)).toContain('search');
      expect(activeRequests.map(r => r.action)).toContain('getDocument');

      await auditTrail.completeRequest(context1, 'success');
      expect(auditTrail.getActiveRequestCount()).toBe(1);

      await auditTrail.completeRequest(context2, 'success');
      expect(auditTrail.getActiveRequestCount()).toBe(0);
    });
  });

  describe('IP Access Control Integration', () => {
    it('should allow request when IP is whitelisted', async () => {
      await ipAccessControl.setMode(AccessControlMode.WHITELIST_ONLY);
      await ipAccessControl.addToWhitelist('192.168.1.100');

      const context = await auditTrail.startRequest('192.168.1.100', 'search');
      const result = await auditTrail.checkAccess(context);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Access granted');
      expect(result.event).toBeUndefined();
    });

    it('should deny request when IP is not whitelisted', async () => {
      await ipAccessControl.setMode(AccessControlMode.WHITELIST_ONLY);
      await ipAccessControl.addToWhitelist('192.168.1.100');

      const context = await auditTrail.startRequest('192.168.1.200', 'search');
      const result = await auditTrail.checkAccess(context);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP access denied');
      expect(result.event).toBeDefined();
      expect(result.event?.type).toBe(AuditEventType.ACCESS_DENIED);
    });

    it('should deny request when IP is blacklisted', async () => {
      await ipAccessControl.setMode(AccessControlMode.BLACKLIST_ONLY);
      await ipAccessControl.addToBlacklist('192.168.1.200');

      const context = await auditTrail.startRequest('192.168.1.200', 'search');
      const result = await auditTrail.checkAccess(context);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP access denied');
      expect(result.event?.type).toBe(AuditEventType.ACCESS_DENIED);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should allow request within rate limit', async () => {
      const context = await auditTrail.startRequest('192.168.1.100', 'search');
      const result = await auditTrail.checkAccess(context);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Access granted');
    });

    it('should deny request when rate limit exceeded', async () => {
      const ip = '192.168.1.100';

      // Consume all 5 tokens
      for (let i = 0; i < 5; i++) {
        const context = await auditTrail.startRequest(ip, 'search');
        const result = await auditTrail.checkAccess(context);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be denied
      const context = await auditTrail.startRequest(ip, 'search');
      const result = await auditTrail.checkAccess(context);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Rate limit exceeded');
      expect(result.event?.type).toBe(AuditEventType.RATE_LIMITED);
      expect(result.event?.metadata?.rateLimit?.allowed).toBe(false);
    });

    it('should log rate limit violation to security logger', async () => {
      const ip = '192.168.1.100';

      // Consume all tokens
      for (let i = 0; i < 5; i++) {
        const context = await auditTrail.startRequest(ip, 'search');
        await auditTrail.checkAccess(context);
      }

      // Exceed rate limit
      const context = await auditTrail.startRequest(ip, 'search');
      await auditTrail.checkAccess(context);

      // Check security logs
      const logs = await securityLogger.queryLogs();
      const suspiciousPatternLog = logs.find(
        log => log.type === SecurityEventType.SUSPICIOUS_PATTERN
      );

      expect(suspiciousPatternLog).toBeDefined();
      expect(suspiciousPatternLog?.message).toContain('Rate limit exceeded');
    });
  });

  describe('Search Logging', () => {
    it('should log search query with results', async () => {
      const event = await auditTrail.logSearch(
        '192.168.1.100',
        'authentication patterns',
        15,
        250,
        'testuser'
      );

      expect(event.type).toBe(AuditEventType.SEARCH);
      expect(event.ip).toBe('192.168.1.100');
      expect(event.user).toBe('testuser');
      expect(event.result).toBe('success');
      expect(event.duration).toBe(250);
      expect(event.metadata?.query).toBe('authentication patterns');
      expect(event.metadata?.resultCount).toBe(15);
    });

    it('should log search to security logger', async () => {
      await auditTrail.logSearch(
        '192.168.1.100',
        'security testing',
        8,
        180
      );

      const logs = await securityLogger.queryLogs();
      const searchLog = logs.find(
        log => log.type === SecurityEventType.SEARCH_QUERY
      );

      expect(searchLog).toBeDefined();
      expect(searchLog?.message).toContain('Search query: security testing');
    });
  });

  describe('Index Build Logging', () => {
    it('should log successful index build', async () => {
      const event = await auditTrail.logIndexBuild(5000, 150, true);

      expect(event.type).toBe(AuditEventType.INDEX_BUILD);
      expect(event.ip).toBe('system');
      expect(event.action).toBe('build_index');
      expect(event.result).toBe('success');
      expect(event.duration).toBe(5000);
      expect(event.metadata?.fileCount).toBe(150);
    });

    it('should log failed index build', async () => {
      const event = await auditTrail.logIndexBuild(
        2000,
        0,
        false,
        'Permission denied'
      );

      expect(event.type).toBe(AuditEventType.INDEX_BUILD);
      expect(event.result).toBe('failure');
      expect(event.metadata?.error).toBe('Permission denied');
    });

    it('should log index build to security logger with correct severity', async () => {
      // Successful build
      await auditTrail.logIndexBuild(5000, 150, true);
      let logs = await securityLogger.queryLogs();
      let buildLog = logs.find(log => log.type === SecurityEventType.INDEX_BUILD);
      expect(buildLog?.severity).toBe(SecuritySeverity.LOW);

      // Failed build
      await auditTrail.logIndexBuild(2000, 0, false, 'Error');
      logs = await securityLogger.queryLogs();
      buildLog = logs.find(
        log => log.type === SecurityEventType.INDEX_BUILD &&
        log.severity === SecuritySeverity.HIGH
      );
      expect(buildLog).toBeDefined();
    });
  });

  describe('Comprehensive Statistics', () => {
    it('should return comprehensive statistics', async () => {
      // Create some activity
      const context1 = await auditTrail.startRequest('192.168.1.100', 'search');
      const context2 = await auditTrail.startRequest('192.168.1.101', 'getDocument');

      // Check access to trigger rate limiter
      await auditTrail.checkAccess(context1);
      await auditTrail.checkAccess(context2);

      await auditTrail.logSearch('192.168.1.100', 'test', 5, 100);

      const stats = await auditTrail.getComprehensiveStatistics();

      expect(stats.activeRequests).toBe(2);
      expect(stats.security).toBeDefined();
      expect(stats.ipAccess).toBeDefined();
      expect(stats.rateLimit).toBeDefined();
      expect(stats.rateLimit.trackedKeys).toBeGreaterThan(0);
    });

    it('should query security logs', async () => {
      await auditTrail.logSearch('192.168.1.100', 'test query', 10, 150);

      const logs = await auditTrail.querySecurityLogs();

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    it('should format audit event correctly', () => {
      const event = {
        id: 'audit_123',
        timestamp: new Date('2025-01-15T10:00:00Z'),
        type: AuditEventType.SEARCH,
        ip: '192.168.1.100',
        user: 'testuser',
        action: 'search',
        result: 'success' as const,
        duration: 250,
      };

      const formatted = formatAuditEvent(event);

      expect(formatted).toContain('🔍');
      expect(formatted).toContain('SEARCH');
      expect(formatted).toContain('192.168.1.100');
      expect(formatted).toContain('testuser');
      expect(formatted).toContain('search');
      expect(formatted).toContain('success');
      expect(formatted).toContain('250ms');
    });

    it('should format different event types with correct emojis', () => {
      const eventTypes = [
        { type: AuditEventType.REQUEST, emoji: '📥' },
        { type: AuditEventType.RESPONSE, emoji: '📤' },
        { type: AuditEventType.ACCESS_DENIED, emoji: '🚫' },
        { type: AuditEventType.RATE_LIMITED, emoji: '⏱️' },
        { type: AuditEventType.ERROR, emoji: '❌' },
        { type: AuditEventType.SEARCH, emoji: '🔍' },
        { type: AuditEventType.INDEX_BUILD, emoji: '🏗️' },
      ];

      for (const { type, emoji } of eventTypes) {
        const event = {
          id: 'test',
          timestamp: new Date(),
          type,
          ip: '127.0.0.1',
          action: 'test',
          result: 'success' as const,
        };

        const formatted = formatAuditEvent(event);
        expect(formatted).toContain(emoji);
      }
    });

    it('should create full audit trail with all security features', async () => {
      // Create a separate temp dir for this test
      const fullTrailDir = path.join(tempDir, 'full-trail-test');
      await fs.mkdir(fullTrailDir, { recursive: true });

      const fullTrail = await createFullAuditTrail({
        securityLogDir: fullTrailDir,
        rateLimitConfig: { maxRequests: 10, windowMs: 60000 },
      });

      expect(fullTrail).toBeInstanceOf(AuditTrail);

      // Test that it works
      const context = await fullTrail.startRequest('192.168.1.100', 'test');
      const accessCheck = await fullTrail.checkAccess(context);

      expect(accessCheck.allowed).toBe(true);

      // Complete the request to cleanup
      await fullTrail.completeRequest(context, 'success');
    });
  });
});
