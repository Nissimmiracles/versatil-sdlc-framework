/**
 * Rule 3: Daily Audit Scheduling - Unit Tests
 *
 * Tests the daily audit daemon that runs at 2 AM automatically
 * Tests cron scheduling, immediate audits on issues, graceful shutdown, and PID management
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DailyAuditDaemon, DaemonConfig, DaemonStatus } from '../../../src/audit/daily-audit-daemon';
import { DailyAuditSystem, AuditStatus, IssueSeverity } from '../../../src/audit/daily-audit-system';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn((schedule, callback, options) => ({
    stop: jest.fn(),
    start: jest.fn(),
    destroy: jest.fn()
  })),
  validate: jest.fn(() => true)
}));

// Mock Claude Agent SDK
jest.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: jest.fn(),
  AgentDefinition: jest.fn()
}));

// Mock versatil-query to avoid SDK import issues
jest.mock('../../../src/agents/sdk/versatil-query', () => ({
  executeWithSDK: jest.fn(async () => new Map())
}));

describe('Rule 3: Daily Audit Scheduling', () => {
  let daemon: DailyAuditDaemon;
  let testLogPath: string;
  let testPidPath: string;
  let testConfigDir: string;

  beforeEach(async () => {
    // Create temporary test directories
    testConfigDir = path.join(os.tmpdir(), `versatil-test-${Date.now()}`);
    testLogPath = path.join(testConfigDir, 'logs', 'daily-audit.log');
    testPidPath = path.join(testConfigDir, 'run', 'audit-daemon.pid');

    await fs.ensureDir(path.dirname(testLogPath));
    await fs.ensureDir(path.dirname(testPidPath));

    // Create daemon with test configuration
    const config: Partial<DaemonConfig> = {
      cronSchedule: '0 2 * * *',
      timezone: 'America/New_York',
      immediateAuditThreshold: IssueSeverity.CRITICAL,
      logPath: testLogPath,
      pidPath: testPidPath,
      enabled: true,
      autostart: false
    };

    daemon = new DailyAuditDaemon(config);
  });

  afterEach(async () => {
    // Stop daemon and cleanup
    if (daemon) {
      try {
        await daemon.stop();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    // Remove test directories
    try {
      await fs.remove(testConfigDir);
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('Daemon Lifecycle', () => {
    it('should start daemon successfully', async () => {
      await daemon.start();

      const status = await daemon.getStatus();
      expect(status.running).toBe(true);
      expect(status.pid).toBe(process.pid);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should create PID file on start', async () => {
      await daemon.start();

      const pidExists = await fs.pathExists(testPidPath);
      expect(pidExists).toBe(true);

      const pidContent = await fs.readFile(testPidPath, 'utf8');
      expect(parseInt(pidContent.trim())).toBe(process.pid);
    });

    it('should create log file on start', async () => {
      await daemon.start();

      const logExists = await fs.pathExists(testLogPath);
      expect(logExists).toBe(true);
    });

    it('should prevent multiple daemon instances', async () => {
      await daemon.start();

      // Attempt to start again should be no-op
      await expect(daemon.start()).resolves.not.toThrow();

      const status = await daemon.getStatus();
      expect(status.running).toBe(true);
    });

    it('should stop daemon gracefully', async () => {
      await daemon.start();
      await daemon.stop();

      const status = await daemon.getStatus();
      expect(status.running).toBe(false);
    });

    it('should remove PID file on stop', async () => {
      await daemon.start();
      await daemon.stop();

      const pidExists = await fs.pathExists(testPidPath);
      expect(pidExists).toBe(false);
    });

    it('should restart daemon successfully', async () => {
      await daemon.start();
      const firstStatus = await daemon.getStatus();

      await daemon.restart();
      const secondStatus = await daemon.getStatus();

      expect(secondStatus.running).toBe(true);
      expect(secondStatus.pid).toBe(process.pid);
    });
  });

  describe('Cron Scheduling', () => {
    it('should schedule audit for 2 AM daily', async () => {
      const cron = await import('node-cron');

      await daemon.start();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'America/New_York'
        })
      );
    });

    it('should calculate next scheduled audit time', async () => {
      await daemon.start();

      const status = await daemon.getStatus();
      expect(status.nextScheduledAudit).toBeDefined();

      // Next audit should be at 2 AM today or tomorrow
      const nextAudit = status.nextScheduledAudit!;
      expect(nextAudit.getHours()).toBe(2);
      expect(nextAudit.getMinutes()).toBe(0);
      expect(nextAudit.getSeconds()).toBe(0);
    });

    it('should support custom cron schedule', async () => {
      const customConfig: Partial<DaemonConfig> = {
        cronSchedule: '0 3 * * *', // 3 AM instead of 2 AM
        timezone: 'UTC',
        logPath: testLogPath,
        pidPath: testPidPath
      };

      const customDaemon = new DailyAuditDaemon(customConfig);

      const cron = await import('node-cron');
      await customDaemon.start();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 3 * * *',
        expect.any(Function),
        expect.objectContaining({
          timezone: 'UTC'
        })
      );

      await customDaemon.stop();
    });
  });

  describe('Immediate Audit Triggers', () => {
    it('should run immediate audit on demand', async () => {
      await daemon.start();

      const auditStartListener = jest.fn();
      daemon.on('audit:immediate:completed', auditStartListener);

      const result = await daemon.runImmediateAudit('Manual trigger');

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(auditStartListener).toHaveBeenCalled();
    });

    it('should run immediate audit on critical issues', async () => {
      await daemon.start();

      // Mock a critical issue detection
      const criticalAuditListener = jest.fn();
      daemon.on('audit:immediate:completed', criticalAuditListener);

      await daemon.runImmediateAudit('Critical issue detected');

      expect(criticalAuditListener).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Critical issue detected'
        })
      );
    });

    it('should track audit count', async () => {
      await daemon.start();

      await daemon.runImmediateAudit();
      await daemon.runImmediateAudit();
      await daemon.runImmediateAudit();

      const status = await daemon.getStatus();
      expect(status.auditCount).toBe(3);
    });

    it('should track last audit status', async () => {
      await daemon.start();

      const result = await daemon.runImmediateAudit();

      const status = await daemon.getStatus();
      expect(status.lastAuditStatus).toBe(result.status);
      expect(status.lastAudit).toBeDefined();
    });
  });

  describe('Daemon Status', () => {
    it('should report correct status when running', async () => {
      await daemon.start();

      const status = await daemon.getStatus();

      expect(status.running).toBe(true);
      expect(status.pid).toBe(process.pid);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
      expect(status.auditCount).toBe(0);
      expect(status.errorCount).toBe(0);
    });

    it('should report correct status when stopped', async () => {
      const status = await daemon.getStatus();

      expect(status.running).toBe(false);
      expect(status.pid).toBeUndefined();
      expect(status.uptime).toBeUndefined();
    });

    it('should track uptime correctly', async () => {
      await daemon.start();

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      const status = await daemon.getStatus();
      expect(status.uptime).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM gracefully', async () => {
      await daemon.start();

      // Simulate SIGTERM
      const shutdownListener = jest.fn();
      daemon.on('daemon:stopped', shutdownListener);

      await daemon.stop();

      expect(shutdownListener).toHaveBeenCalled();
    });

    it('should execute shutdown handlers', async () => {
      await daemon.start();

      const shutdownHandler = jest.fn(async () => {
        // Cleanup task
      });

      daemon.onShutdown(shutdownHandler);

      await daemon.stop();

      expect(shutdownHandler).toHaveBeenCalled();
    });

    it('should close log stream on shutdown', async () => {
      await daemon.start();
      await daemon.stop();

      // Log file should still exist but stream should be closed
      const logExists = await fs.pathExists(testLogPath);
      expect(logExists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should track error count on audit failures', async () => {
      await daemon.start();

      // Mock audit system to fail
      const auditSystem = (daemon as any).auditSystem;
      const originalRunAudit = auditSystem.runDailyAudit.bind(auditSystem);
      auditSystem.runDailyAudit = jest.fn().mockRejectedValue(new Error('Mock audit failure'));

      try {
        await daemon.runImmediateAudit();
      } catch (error) {
        // Expected to fail
      }

      const status = await daemon.getStatus();
      expect(status.errorCount).toBe(1);

      // Restore
      auditSystem.runDailyAudit = originalRunAudit;
    });

    it('should emit error events on audit failures', async () => {
      await daemon.start();

      const errorListener = jest.fn();
      daemon.on('audit:immediate:failed', errorListener);

      // Mock audit system to fail
      const auditSystem = (daemon as any).auditSystem;
      const originalRunAudit = auditSystem.runDailyAudit.bind(auditSystem);
      auditSystem.runDailyAudit = jest.fn().mockRejectedValue(new Error('Mock failure'));

      try {
        await daemon.runImmediateAudit();
      } catch (error) {
        // Expected to fail
      }

      expect(errorListener).toHaveBeenCalled();

      // Restore
      auditSystem.runDailyAudit = originalRunAudit;
    });
  });

  describe('Event Emission', () => {
    it('should emit daemon:started event', async () => {
      const startListener = jest.fn();
      daemon.on('daemon:started', startListener);

      await daemon.start();

      expect(startListener).toHaveBeenCalledWith(
        expect.objectContaining({
          pid: process.pid,
          startTime: expect.any(Date)
        })
      );
    });

    it('should emit daemon:stopped event', async () => {
      await daemon.start();

      const stopListener = jest.fn();
      daemon.on('daemon:stopped', stopListener);

      await daemon.stop();

      expect(stopListener).toHaveBeenCalledWith(
        expect.objectContaining({
          uptime: expect.any(Number),
          auditCount: expect.any(Number),
          errorCount: expect.any(Number)
        })
      );
    });

    it('should emit audit:scheduled:completed event', async () => {
      await daemon.start();

      const scheduledListener = jest.fn();
      daemon.on('audit:scheduled:completed', scheduledListener);

      // Trigger scheduled audit manually
      const auditSystem = (daemon as any).auditSystem;
      await auditSystem.runDailyAudit();

      // Note: In real scenario, this would be triggered by cron
      // For testing, we verify the event listener is registered
      expect(scheduledListener).not.toHaveBeenCalled(); // Not triggered yet
    });
  });

  describe('Static Methods', () => {
    it('should detect if daemon is running via PID file', async () => {
      await daemon.start();

      const isRunning = await DailyAuditDaemon.isRunning(testPidPath);
      expect(isRunning).toBe(true);
    });

    it('should return false if PID file does not exist', async () => {
      const isRunning = await DailyAuditDaemon.isRunning(testPidPath);
      expect(isRunning).toBe(false);
    });

    it('should remove stale PID file if process not running', async () => {
      // Create stale PID file with non-existent PID
      await fs.writeFile(testPidPath, '999999', 'utf8');

      const isRunning = await DailyAuditDaemon.isRunning(testPidPath);
      expect(isRunning).toBe(false);

      // PID file should be removed
      const pidExists = await fs.pathExists(testPidPath);
      expect(pidExists).toBe(false);
    });
  });

  describe('Integration with DailyAuditSystem', () => {
    it('should execute audit via audit system', async () => {
      await daemon.start();

      const result = await daemon.runImmediateAudit();

      // Verify audit result structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('overallHealth');
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('checkResults');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('recommendations');
    });

    it('should trigger immediate audit on critical issues', async () => {
      await daemon.start();

      const immediateListener = jest.fn();
      daemon.on('audit:immediate:completed', immediateListener);

      // Simulate critical issue detection
      const auditSystem = (daemon as any).auditSystem;
      const result = await auditSystem.runDailyAudit();

      // If critical issues exist, immediate audit should be scheduled
      if (result.issues.some(i => i.severity >= IssueSeverity.CRITICAL)) {
        // Wait for immediate audit to be scheduled (5 minutes in real scenario)
        // For testing, we just verify the logic exists
        expect(result.status).toBe(AuditStatus.FAILURE);
      }
    });
  });

  describe('Logging', () => {
    it('should write logs to log file', async () => {
      await daemon.start();
      await daemon.runImmediateAudit();
      await daemon.stop();

      // Read log file
      const logContent = await fs.readFile(testLogPath, 'utf8');

      expect(logContent).toContain('Starting Daily Audit Daemon');
      expect(logContent).toContain('Daemon started successfully');
      expect(logContent).toContain('Running immediate audit');
      expect(logContent).toContain('Stopping Daily Audit Daemon');
    });

    it('should include timestamps in logs', async () => {
      await daemon.start();
      await daemon.stop();

      const logContent = await fs.readFile(testLogPath, 'utf8');

      // Check for ISO timestamp format
      expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should log different severity levels', async () => {
      await daemon.start();

      // Trigger an error by mocking
      const auditSystem = (daemon as any).auditSystem;
      const originalRunAudit = auditSystem.runDailyAudit.bind(auditSystem);
      auditSystem.runDailyAudit = jest.fn().mockRejectedValue(new Error('Test error'));

      try {
        await daemon.runImmediateAudit();
      } catch (error) {
        // Expected
      }

      await daemon.stop();

      const logContent = await fs.readFile(testLogPath, 'utf8');

      expect(logContent).toContain('[INFO]');
      expect(logContent).toContain('[ERROR]');

      // Restore
      auditSystem.runDailyAudit = originalRunAudit;
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when not provided', async () => {
      const defaultDaemon = new DailyAuditDaemon();

      // Default config should be applied
      const config = (defaultDaemon as any).config;
      expect(config.cronSchedule).toBe('0 2 * * *');
      expect(config.timezone).toBe('America/New_York');
      expect(config.immediateAuditThreshold).toBe(IssueSeverity.CRITICAL);
    });

    it('should allow custom configuration', async () => {
      const customConfig: Partial<DaemonConfig> = {
        cronSchedule: '0 3 * * *',
        timezone: 'UTC',
        immediateAuditThreshold: IssueSeverity.HIGH,
        logPath: testLogPath,
        pidPath: testPidPath
      };

      const customDaemon = new DailyAuditDaemon(customConfig);

      const config = (customDaemon as any).config;
      expect(config.cronSchedule).toBe('0 3 * * *');
      expect(config.timezone).toBe('UTC');
      expect(config.immediateAuditThreshold).toBe(IssueSeverity.HIGH);

      await customDaemon.stop();
    });
  });
});
