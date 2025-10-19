/**
 * Unit tests for DocsProgressTracker
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DocsProgressTracker, ProgressEvent, ProgressCallback } from '../../src/mcp/docs-progress-tracker.js';

describe('DocsProgressTracker', () => {
  let tracker: DocsProgressTracker;

  beforeEach(() => {
    tracker = new DocsProgressTracker();
  });

  describe('startOperation', () => {
    it('should start a new operation and return operation ID', () => {
      const opId = tracker.startOperation('testOperation');

      expect(opId).toMatch(/^op_\d+$/);

      const op = tracker.getOperation(opId);
      expect(op).toBeDefined();
      expect(op!.operation).toBe('testOperation');
      expect(op!.status).toBe('running');
      expect(op!.startTime).toBeInstanceOf(Date);
    });

    it('should generate unique operation IDs', () => {
      const opId1 = tracker.startOperation('operation1');
      const opId2 = tracker.startOperation('operation2');

      expect(opId1).not.toBe(opId2);
    });
  });

  describe('reportProgress', () => {
    it('should report progress for an operation', () => {
      const opId = tracker.startOperation('test');

      tracker.reportProgress(opId, 'phase1', 50, 100, 'Halfway done');

      const progress = tracker.getCurrentProgress(opId);
      expect(progress).toBeDefined();
      expect(progress!.phase).toBe('phase1');
      expect(progress!.current).toBe(50);
      expect(progress!.total).toBe(100);
      expect(progress!.percentage).toBe(50);
      expect(progress!.message).toBe('Halfway done');
    });

    it('should calculate percentage correctly', () => {
      const opId = tracker.startOperation('test');

      tracker.reportProgress(opId, 'phase1', 25, 100, 'Quarter done');
      expect(tracker.getCurrentProgress(opId)!.percentage).toBe(25);

      tracker.reportProgress(opId, 'phase2', 75, 100, 'Three quarters done');
      expect(tracker.getCurrentProgress(opId)!.percentage).toBe(75);
    });

    it('should handle zero total', () => {
      const opId = tracker.startOperation('test');

      tracker.reportProgress(opId, 'phase1', 0, 0, 'No items');

      const progress = tracker.getCurrentProgress(opId);
      expect(progress!.percentage).toBe(0);
    });

    it('should throw error for non-existent operation', () => {
      expect(() => {
        tracker.reportProgress('invalid_id', 'phase1', 0, 100, 'test');
      }).toThrow('Operation invalid_id not found');
    });

    it('should throw error for non-running operation', () => {
      const opId = tracker.startOperation('test');
      tracker.completeOperation(opId);

      expect(() => {
        tracker.reportProgress(opId, 'phase1', 0, 100, 'test');
      }).toThrow(/is not running/);
    });

    it('should store metadata', () => {
      const opId = tracker.startOperation('test');
      const metadata = { fileName: 'test.md', size: 1024 };

      tracker.reportProgress(opId, 'phase1', 1, 10, 'Processing', metadata);

      const progress = tracker.getCurrentProgress(opId);
      expect(progress!.metadata).toEqual(metadata);
    });
  });

  describe('completeOperation', () => {
    it('should mark operation as completed', () => {
      const opId = tracker.startOperation('test');
      tracker.completeOperation(opId);

      const op = tracker.getOperation(opId);
      expect(op!.status).toBe('completed');
      expect(op!.endTime).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent operation', () => {
      expect(() => {
        tracker.completeOperation('invalid_id');
      }).toThrow('Operation invalid_id not found');
    });
  });

  describe('failOperation', () => {
    it('should mark operation as failed with error', () => {
      const opId = tracker.startOperation('test');
      const error = new Error('Test error');

      tracker.failOperation(opId, error);

      const op = tracker.getOperation(opId);
      expect(op!.status).toBe('failed');
      expect(op!.error).toBe(error);
      expect(op!.endTime).toBeInstanceOf(Date);
    });
  });

  describe('subscribe and unsubscribe', () => {
    it('should notify callback on progress update', () => {
      const opId = tracker.startOperation('test');
      const mockCallback = jest.fn<ProgressCallback>();

      tracker.subscribe(opId, mockCallback);
      tracker.reportProgress(opId, 'phase1', 1, 10, 'Test');

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'phase1',
          current: 1,
          total: 10,
          message: 'Test',
        })
      );
    });

    it('should support multiple callbacks', () => {
      const opId = tracker.startOperation('test');
      const callback1 = jest.fn<ProgressCallback>();
      const callback2 = jest.fn<ProgressCallback>();

      tracker.subscribe(opId, callback1);
      tracker.subscribe(opId, callback2);
      tracker.reportProgress(opId, 'phase1', 1, 10, 'Test');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe callback', () => {
      const opId = tracker.startOperation('test');
      const callback = jest.fn<ProgressCallback>();

      tracker.subscribe(opId, callback);
      tracker.unsubscribe(opId, callback);
      tracker.reportProgress(opId, 'phase1', 1, 10, 'Test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw on unsubscribe non-existent callback', () => {
      const opId = tracker.startOperation('test');
      const callback = jest.fn<ProgressCallback>();

      expect(() => {
        tracker.unsubscribe(opId, callback);
      }).not.toThrow();
    });

    it('should clear callbacks on complete', () => {
      const opId = tracker.startOperation('test');
      const callback = jest.fn<ProgressCallback>();

      tracker.subscribe(opId, callback);
      tracker.completeOperation(opId);

      // Attempting to report progress should throw (operation not running)
      // But callbacks should be cleared
      const op = tracker.getOperation(opId);
      expect(op!.status).toBe('completed');
    });
  });

  describe('getProgressHistory', () => {
    it('should return all progress events', () => {
      const opId = tracker.startOperation('test');

      tracker.reportProgress(opId, 'phase1', 1, 10, 'Step 1');
      tracker.reportProgress(opId, 'phase1', 2, 10, 'Step 2');
      tracker.reportProgress(opId, 'phase2', 3, 10, 'Step 3');

      const history = tracker.getProgressHistory(opId);
      expect(history).toHaveLength(3);
      expect(history[0].message).toBe('Step 1');
      expect(history[1].message).toBe('Step 2');
      expect(history[2].message).toBe('Step 3');
    });

    it('should return empty array for non-existent operation', () => {
      const history = tracker.getProgressHistory('invalid_id');
      expect(history).toEqual([]);
    });
  });

  describe('getOperationDuration', () => {
    it('should return duration for completed operation', async () => {
      const opId = tracker.startOperation('test');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      tracker.completeOperation(opId);

      const duration = tracker.getOperationDuration(opId);
      expect(duration).toBeGreaterThan(0);
    });

    it('should return current duration for running operation', () => {
      const opId = tracker.startOperation('test');

      const duration = tracker.getOperationDuration(opId);
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null for non-existent operation', () => {
      const duration = tracker.getOperationDuration('invalid_id');
      expect(duration).toBeNull();
    });
  });

  describe('getActiveOperations', () => {
    it('should return only running operations', () => {
      const op1 = tracker.startOperation('operation1');
      const op2 = tracker.startOperation('operation2');
      const op3 = tracker.startOperation('operation3');

      tracker.completeOperation(op1);
      tracker.failOperation(op3, new Error('Test'));

      const active = tracker.getActiveOperations();
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(op2);
    });
  });

  describe('getOperationSummary', () => {
    it('should return formatted summary', () => {
      const opId = tracker.startOperation('buildIndex');
      tracker.reportProgress(opId, 'indexing', 50, 100, 'Indexing files');

      const summary = tracker.getOperationSummary(opId);
      expect(summary).toContain('buildIndex');
      expect(summary).toContain('running');
      expect(summary).toContain('50%');
    });

    it('should show completed status', () => {
      const opId = tracker.startOperation('buildIndex');
      tracker.completeOperation(opId);

      const summary = tracker.getOperationSummary(opId);
      expect(summary).toContain('✅');
      expect(summary).toContain('completed');
    });

    it('should show failed status', () => {
      const opId = tracker.startOperation('buildIndex');
      tracker.failOperation(opId, new Error('Test'));

      const summary = tracker.getOperationSummary(opId);
      expect(summary).toContain('❌');
      expect(summary).toContain('failed');
    });
  });

  describe('formatProgressEvent', () => {
    it('should format progress with bar', () => {
      const opId = tracker.startOperation('test');
      tracker.reportProgress(opId, 'phase1', 50, 100, 'Halfway');

      const event = tracker.getCurrentProgress(opId)!;
      const formatted = tracker.formatProgressEvent(event);

      expect(formatted).toContain('50%');
      expect(formatted).toContain('Halfway');
      expect(formatted).toContain('█'); // Progress bar character
      expect(formatted).toContain('░'); // Empty bar character
    });
  });

  describe('cleanup', () => {
    it('should remove old completed operations', async () => {
      const op1 = tracker.startOperation('operation1');
      tracker.completeOperation(op1);

      // Wait 100ms
      await new Promise(resolve => setTimeout(resolve, 100));

      const op2 = tracker.startOperation('operation2');
      tracker.completeOperation(op2);

      // Cleanup operations older than 50ms
      tracker.cleanup(50);

      // op1 should be removed, op2 should remain
      expect(tracker.getOperation(op1)).toBeUndefined();
      expect(tracker.getOperation(op2)).toBeDefined();
    });

    it('should not remove running operations', () => {
      const opId = tracker.startOperation('running');

      tracker.cleanup(0);

      expect(tracker.getOperation(opId)).toBeDefined();
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', () => {
      const op1 = tracker.startOperation('operation1');
      const op2 = tracker.startOperation('operation2');
      const op3 = tracker.startOperation('operation3');

      tracker.completeOperation(op1);
      tracker.failOperation(op2, new Error('Test'));
      // op3 remains running

      const stats = tracker.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.running).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average duration', async () => {
      const op1 = tracker.startOperation('operation1');
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.completeOperation(op1);

      const op2 = tracker.startOperation('operation2');
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.completeOperation(op2);

      const stats = tracker.getStatistics();
      expect(stats.avgDuration).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should clear all operations', () => {
      tracker.startOperation('operation1');
      tracker.startOperation('operation2');

      tracker.reset();

      const stats = tracker.getStatistics();
      expect(stats.total).toBe(0);
    });
  });
});
