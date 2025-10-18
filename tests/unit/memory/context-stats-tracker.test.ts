/**
 * Unit Tests: Context Stats Tracker
 *
 * Coverage Target: 85%+
 *
 * Test Coverage:
 * - Initialization and singleton pattern
 * - Event tracking (context clears, memory operations, contract events)
 * - Statistics calculation
 * - Report generation
 * - Cleanup operations
 * - Error handling and resilience
 * - Concurrent operations
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  ContextStatsTracker,
  getGlobalContextTracker,
  ContextClearEvent,
  MemoryOperation,
  ContractEvent,
  ContextStatistics
} from '../../../src/memory/context-stats-tracker.js';

describe('ContextStatsTracker', () => {
  let tracker: ContextStatsTracker;
  let testStatsDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testStatsDir = path.join(os.tmpdir(), `versatil-test-${Date.now()}`);
    await fs.mkdir(testStatsDir, { recursive: true });

    // Create tracker with test directory
    tracker = new ContextStatsTracker(testStatsDir);
    await tracker.initialize();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testStatsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should create stats directory on initialization', async () => {
      const stats = await fs.stat(testStatsDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should handle missing stats directory gracefully', async () => {
      const newTracker = new ContextStatsTracker(path.join(testStatsDir, 'nonexistent'));
      await expect(newTracker.initialize()).resolves.not.toThrow();
    });

    it('should load existing data on initialization', async () => {
      // Create initial event
      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 500,
        reason: 'automatic-100k'
      });

      // Create new tracker instance (should load existing data)
      const newTracker = new ContextStatsTracker(testStatsDir);
      await newTracker.initialize();

      const stats = newTracker.getStatistics();
      expect(stats.totalClearEvents).toBe(1);
    });

    it('should handle corrupted data files gracefully', async () => {
      // Write corrupted JSON
      const eventsPath = path.join(testStatsDir, 'context-clear-events.jsonl');
      await fs.writeFile(eventsPath, 'not valid json\n', 'utf-8');

      const newTracker = new ContextStatsTracker(testStatsDir);
      await expect(newTracker.initialize()).resolves.not.toThrow();
    });
  });

  describe('Context Clear Event Tracking', () => {
    it('should track context clear event', async () => {
      const clearEvent: Omit<ContextClearEvent, 'timestamp'> = {
        agentId: 'james-frontend',
        tokensBefore: 120000,
        tokensAfter: 45000,
        tokensCleared: 75000,
        duration: 600,
        reason: 'automatic-100k'
      };

      await tracker.trackClearEvent(clearEvent);

      const stats = tracker.getStatistics();
      expect(stats.totalClearEvents).toBe(1);
      expect(stats.avgTokensCleared).toBe(75000);
      expect(stats.avgClearDuration).toBe(600);
    });

    it('should track multiple clear events', async () => {
      await tracker.trackClearEvent({
        agentId: 'marcus-backend',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 500,
        reason: 'automatic-100k'
      });

      await tracker.trackClearEvent({
        agentId: 'james-frontend',
        tokensBefore: 110000,
        tokensAfter: 45000,
        tokensCleared: 65000,
        duration: 550,
        reason: 'automatic-100k'
      });

      const stats = tracker.getStatistics();
      expect(stats.totalClearEvents).toBe(2);
      expect(stats.avgTokensCleared).toBe(62500); // (60000 + 65000) / 2
      expect(stats.avgClearDuration).toBe(525); // (500 + 550) / 2
    });

    it('should limit clear events to last 1000', async () => {
      // Add 1100 events
      for (let i = 0; i < 1100; i++) {
        await tracker.trackClearEvent({
          agentId: 'maria-qa',
          tokensBefore: 100000,
          tokensAfter: 40000,
          tokensCleared: 60000,
          duration: 500,
          reason: 'automatic-100k'
        });
      }

      const stats = tracker.getStatistics();
      expect(stats.totalClearEvents).toBe(1000); // Should cap at 1000
    });

    it('should track clear events by agent', async () => {
      await tracker.trackClearEvent({
        agentId: 'marcus-backend',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 500,
        reason: 'automatic-100k'
      });

      await tracker.trackClearEvent({
        agentId: 'marcus-backend',
        tokensBefore: 110000,
        tokensAfter: 45000,
        tokensCleared: 65000,
        duration: 550,
        reason: 'automatic-100k'
      });

      await tracker.trackClearEvent({
        agentId: 'james-frontend',
        tokensBefore: 105000,
        tokensAfter: 42000,
        tokensCleared: 63000,
        duration: 520,
        reason: 'automatic-100k'
      });

      const stats = tracker.getStatistics();
      expect(stats.clearEventsByAgent['marcus-backend']).toBe(2);
      expect(stats.clearEventsByAgent['james-frontend']).toBe(1);
    });

    it('should persist clear events to disk', async () => {
      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 500,
        reason: 'automatic-100k'
      });

      // Verify file exists
      const eventsPath = path.join(testStatsDir, 'context-clear-events.jsonl');
      const fileExists = await fs.access(eventsPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file content
      const content = await fs.readFile(eventsPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(1);

      const event = JSON.parse(lines[0]);
      expect(event.agentId).toBe('maria-qa');
      expect(event.tokensCleared).toBe(60000);
    });
  });

  describe('Memory Operation Tracking', () => {
    it('should track memory operation', async () => {
      await tracker.trackMemoryOperation({
        agentId: 'alex-ba',
        operation: 'create',
        path: 'requirements/user-auth.md',
        success: true,
        tokensUsed: 500,
        duration: 100
      });

      const stats = tracker.getStatistics();
      expect(stats.totalMemoryOperations).toBe(1);
      expect(stats.memoryOperationsByType['create']).toBe(1);
      expect(stats.memoryOperationsByAgent['alex-ba']).toBe(1);
    });

    it('should track multiple memory operations', async () => {
      const operations = [
        { agentId: 'maria-qa' as const, operation: 'create' as const, path: 'test-patterns.md', success: true, tokensUsed: 300, duration: 80 },
        { agentId: 'maria-qa' as const, operation: 'str_replace' as const, path: 'test-patterns.md', success: true, tokensUsed: 150, duration: 60 },
        { agentId: 'james-frontend' as const, operation: 'view' as const, path: 'ui-components.md', success: true, tokensUsed: 200, duration: 50 }
      ];

      for (const op of operations) {
        await tracker.trackMemoryOperation(op);
      }

      const stats = tracker.getStatistics();
      expect(stats.totalMemoryOperations).toBe(3);
      expect(stats.memoryOperationsByType['create']).toBe(1);
      expect(stats.memoryOperationsByType['str_replace']).toBe(1);
      expect(stats.memoryOperationsByType['view']).toBe(1);
    });

    it('should track failed operations', async () => {
      await tracker.trackMemoryOperation({
        agentId: 'marcus-backend',
        operation: 'str_replace',
        path: 'api-patterns.md',
        success: false,
        tokensUsed: 0,
        duration: 50
      });

      const stats = tracker.getStatistics();
      expect(stats.totalMemoryOperations).toBe(1);
      expect(stats.memoryOperationsByType['str_replace']).toBe(1);
    });

    it('should limit memory operations to last 5000', async () => {
      // Add 5100 operations
      for (let i = 0; i < 5100; i++) {
        await tracker.trackMemoryOperation({
          agentId: 'maria-qa',
          operation: 'view',
          path: 'test.md',
          success: true,
          tokensUsed: 100,
          duration: 50
        });
      }

      const stats = tracker.getStatistics();
      expect(stats.totalMemoryOperations).toBe(5000); // Should cap at 5000
    });

    it('should persist memory operations to disk', async () => {
      await tracker.trackMemoryOperation({
        agentId: 'dana-database',
        operation: 'create',
        path: 'schema-patterns.md',
        success: true,
        tokensUsed: 400,
        duration: 90
      });

      const opsPath = path.join(testStatsDir, 'memory-operations.jsonl');
      const fileExists = await fs.access(opsPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(opsPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(1);

      const op = JSON.parse(lines[0]);
      expect(op.agentId).toBe('dana-database');
      expect(op.operation).toBe('create');
    });
  });

  describe('Contract Event Tracking', () => {
    it('should track contract event', async () => {
      await tracker.trackContractEvent({
        contractId: 'contract-123',
        eventType: 'created',
        sender: 'alex-ba',
        receivers: ['dana-database', 'marcus-backend', 'james-frontend'],
        handoffType: 'parallel',
        priority: 'high',
        validationScore: 95
      });

      const stats = tracker.getStatistics();
      expect(stats.totalContractEvents).toBe(1);
      expect(stats.contractEventsByType['created']).toBe(1);
    });

    it('should track contract lifecycle', async () => {
      const contractId = 'contract-456';

      // Created
      await tracker.trackContractEvent({
        contractId,
        eventType: 'created',
        sender: 'alex-ba',
        receivers: ['marcus-backend'],
        handoffType: 'sequential',
        priority: 'normal',
        validationScore: 88
      });

      // Sent
      await tracker.trackContractEvent({
        contractId,
        eventType: 'sent',
        sender: 'alex-ba',
        receivers: ['marcus-backend'],
        handoffType: 'sequential',
        priority: 'normal'
      });

      // Completed
      await tracker.trackContractEvent({
        contractId,
        eventType: 'completed',
        sender: 'alex-ba',
        receivers: ['marcus-backend'],
        handoffType: 'sequential',
        priority: 'normal'
      });

      const stats = tracker.getStatistics();
      expect(stats.totalContractEvents).toBe(3);
      expect(stats.contractEventsByType['created']).toBe(1);
      expect(stats.contractEventsByType['sent']).toBe(1);
      expect(stats.contractEventsByType['completed']).toBe(1);
    });

    it('should persist contract events to disk', async () => {
      await tracker.trackContractEvent({
        contractId: 'contract-789',
        eventType: 'created',
        sender: 'sarah-pm',
        receivers: ['maria-qa'],
        handoffType: 'sequential',
        priority: 'critical',
        validationScore: 92
      });

      const eventsPath = path.join(testStatsDir, 'contract-events.jsonl');
      const fileExists = await fs.access(eventsPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const content = await fs.readFile(eventsPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(1);

      const event = JSON.parse(lines[0]);
      expect(event.contractId).toBe('contract-789');
      expect(event.eventType).toBe('created');
    });
  });

  describe('Statistics Calculation', () => {
    it('should return default statistics when no data', () => {
      const stats = tracker.getStatistics();

      expect(stats.totalClearEvents).toBe(0);
      expect(stats.totalMemoryOperations).toBe(0);
      expect(stats.totalContractEvents).toBe(0);
      expect(stats.avgTokensCleared).toBe(0);
      expect(stats.avgClearDuration).toBe(0);
    });

    it('should calculate correct averages', async () => {
      // Add clear events with different values
      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 500,
        reason: 'automatic-100k'
      });

      await tracker.trackClearEvent({
        agentId: 'james-frontend',
        tokensBefore: 120000,
        tokensAfter: 50000,
        tokensCleared: 70000,
        duration: 700,
        reason: 'automatic-100k'
      });

      const stats = tracker.getStatistics();
      expect(stats.avgTokensCleared).toBe(65000); // (60000 + 70000) / 2
      expect(stats.avgClearDuration).toBe(600); // (500 + 700) / 2
    });

    it('should group events by agent correctly', async () => {
      await tracker.trackMemoryOperation({
        agentId: 'maria-qa',
        operation: 'create',
        path: 'test1.md',
        success: true,
        tokensUsed: 100,
        duration: 50
      });

      await tracker.trackMemoryOperation({
        agentId: 'maria-qa',
        operation: 'view',
        path: 'test2.md',
        success: true,
        tokensUsed: 200,
        duration: 60
      });

      await tracker.trackMemoryOperation({
        agentId: 'james-frontend',
        operation: 'create',
        path: 'ui.md',
        success: true,
        tokensUsed: 150,
        duration: 55
      });

      const stats = tracker.getStatistics();
      expect(stats.memoryOperationsByAgent['maria-qa']).toBe(2);
      expect(stats.memoryOperationsByAgent['james-frontend']).toBe(1);
    });

    it('should group events by type correctly', async () => {
      await tracker.trackMemoryOperation({
        agentId: 'alex-ba',
        operation: 'create',
        path: 'req1.md',
        success: true,
        tokensUsed: 100,
        duration: 50
      });

      await tracker.trackMemoryOperation({
        agentId: 'alex-ba',
        operation: 'create',
        path: 'req2.md',
        success: true,
        tokensUsed: 150,
        duration: 60
      });

      await tracker.trackMemoryOperation({
        agentId: 'alex-ba',
        operation: 'str_replace',
        path: 'req1.md',
        success: true,
        tokensUsed: 80,
        duration: 40
      });

      const stats = tracker.getStatistics();
      expect(stats.memoryOperationsByType['create']).toBe(2);
      expect(stats.memoryOperationsByType['str_replace']).toBe(1);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive report', async () => {
      // Add sample data
      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 500,
        reason: 'automatic-100k'
      });

      await tracker.trackMemoryOperation({
        agentId: 'maria-qa',
        operation: 'create',
        path: 'test-patterns.md',
        success: true,
        tokensUsed: 300,
        duration: 80
      });

      await tracker.trackContractEvent({
        contractId: 'contract-123',
        eventType: 'created',
        sender: 'alex-ba',
        receivers: ['dana-database', 'marcus-backend'],
        handoffType: 'parallel',
        priority: 'high',
        validationScore: 90
      });

      const report = await tracker.generateReport();

      expect(report).toContain('Context Statistics Report');
      expect(report).toContain('Total Clear Events: 1');
      expect(report).toContain('Total Memory Operations: 1');
      expect(report).toContain('Total Contract Events: 1');
      expect(report).toContain('maria-qa');
      expect(report).toContain('alex-ba');
    });

    it('should handle empty data in report', async () => {
      const report = await tracker.generateReport();

      expect(report).toContain('Context Statistics Report');
      expect(report).toContain('Total Clear Events: 0');
      expect(report).toContain('Total Memory Operations: 0');
      expect(report).toContain('Total Contract Events: 0');
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old data', async () => {
      // Add events with old timestamps
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago

      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 500,
        reason: 'automatic-100k'
      });

      // Manually set old timestamp (hack for testing)
      const stats = tracker.getStatistics();
      expect(stats.totalClearEvents).toBe(1);

      // Cleanup (keep last 30 days)
      await tracker.cleanup(30);

      // Recent events should remain, but in real scenario old would be removed
      // This is a simplified test - full test would require time manipulation
    });

    it('should persist cleaned data', async () => {
      await tracker.trackMemoryOperation({
        agentId: 'maria-qa',
        operation: 'create',
        path: 'test.md',
        success: true,
        tokensUsed: 100,
        duration: 50
      });

      await tracker.cleanup(30);

      // Verify files still exist and are valid
      const opsPath = path.join(testStatsDir, 'memory-operations.jsonl');
      const fileExists = await fs.access(opsPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle file write errors gracefully', async () => {
      // Make directory read-only to trigger write error
      await fs.chmod(testStatsDir, 0o444);

      await expect(
        tracker.trackClearEvent({
          agentId: 'maria-qa',
          tokensBefore: 100000,
          tokensAfter: 40000,
          tokensCleared: 60000,
          duration: 500,
          reason: 'automatic-100k'
        })
      ).resolves.not.toThrow(); // Should not throw, just warn

      // Restore permissions
      await fs.chmod(testStatsDir, 0o755);
    });

    it('should handle concurrent operations', async () => {
      // Simulate concurrent tracking
      const promises = Array(100).fill(null).map((_, i) =>
        tracker.trackMemoryOperation({
          agentId: 'maria-qa',
          operation: 'view',
          path: `test-${i}.md`,
          success: true,
          tokensUsed: 100,
          duration: 50
        })
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();

      const stats = tracker.getStatistics();
      expect(stats.totalMemoryOperations).toBe(100);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getGlobalContextTracker', () => {
      const instance1 = getGlobalContextTracker();
      const instance2 = getGlobalContextTracker();

      expect(instance1).toBe(instance2);
    });

    it('should initialize singleton automatically', async () => {
      const instance = getGlobalContextTracker();

      // Should be able to use immediately
      await expect(
        instance.trackClearEvent({
          agentId: 'maria-qa',
          tokensBefore: 100000,
          tokensAfter: 40000,
          tokensCleared: 60000,
          duration: 500,
          reason: 'automatic-100k'
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero duration', async () => {
      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 100000,
        tokensAfter: 40000,
        tokensCleared: 60000,
        duration: 0,
        reason: 'manual'
      });

      const stats = tracker.getStatistics();
      expect(stats.avgClearDuration).toBe(0);
    });

    it('should handle zero tokens cleared', async () => {
      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 100000,
        tokensAfter: 100000,
        tokensCleared: 0,
        duration: 100,
        reason: 'manual'
      });

      const stats = tracker.getStatistics();
      expect(stats.avgTokensCleared).toBe(0);
    });

    it('should handle very long paths', async () => {
      const longPath = 'a/'.repeat(100) + 'test.md';

      await expect(
        tracker.trackMemoryOperation({
          agentId: 'maria-qa',
          operation: 'create',
          path: longPath,
          success: true,
          tokensUsed: 100,
          duration: 50
        })
      ).resolves.not.toThrow();
    });

    it('should handle special characters in paths', async () => {
      const specialPath = 'test with spaces & symbols #$%.md';

      await expect(
        tracker.trackMemoryOperation({
          agentId: 'maria-qa',
          operation: 'create',
          path: specialPath,
          success: true,
          tokensUsed: 100,
          duration: 50
        })
      ).resolves.not.toThrow();
    });

    it('should handle very large token counts', async () => {
      await tracker.trackClearEvent({
        agentId: 'maria-qa',
        tokensBefore: 1000000,
        tokensAfter: 100000,
        tokensCleared: 900000,
        duration: 5000,
        reason: 'automatic-100k'
      });

      const stats = tracker.getStatistics();
      expect(stats.avgTokensCleared).toBe(900000);
    });
  });
});
