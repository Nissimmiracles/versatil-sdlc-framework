/**
 * Unit tests for Documentation Streaming
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  ResultStream,
  StreamManager,
  StreamChunk,
  StreamCallback,
  collectStreamResults,
} from '../../src/mcp/docs-streaming.js';

describe('ResultStream', () => {
  describe('basic streaming', () => {
    it('should stream all results', async () => {
      const results = [1, 2, 3, 4, 5];
      const stream = new ResultStream(results, { chunkSize: 2 });

      const received: number[] = [];
      stream.subscribe(chunk => {
        received.push(chunk.data);
      });

      await stream.start();

      expect(received).toEqual([1, 2, 3, 4, 5]);
      expect(stream.isComplete()).toBe(true);
    });

    it('should include chunk metadata', async () => {
      const results = ['a', 'b', 'c'];
      const stream = new ResultStream(results, { chunkSize: 1 });

      const chunks: StreamChunk<string>[] = [];
      stream.subscribe(chunk => {
        chunks.push(chunk);
      });

      await stream.start();

      expect(chunks).toHaveLength(3);
      expect(chunks[0].index).toBe(0);
      expect(chunks[0].isLast).toBe(false);
      expect(chunks[1].index).toBe(1);
      expect(chunks[1].isLast).toBe(false);
      expect(chunks[2].index).toBe(2);
      expect(chunks[2].isLast).toBe(true);
    });

    it('should emit timestamps', async () => {
      const results = [1, 2];
      const stream = new ResultStream(results);

      const chunks: StreamChunk<number>[] = [];
      stream.subscribe(chunk => {
        chunks.push(chunk);
      });

      await stream.start();

      chunks.forEach(chunk => {
        expect(chunk.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('chunk sizes', () => {
    it('should respect chunk size', async () => {
      const results = Array.from({ length: 10 }, (_, i) => i);
      const stream = new ResultStream(results, { chunkSize: 3 });

      const received: number[] = [];
      stream.subscribe(chunk => {
        received.push(chunk.data);
      });

      await stream.start();

      expect(received).toHaveLength(10);
      expect(stream.isComplete()).toBe(true);
    });

    it('should handle single item chunks', async () => {
      const results = [1, 2, 3];
      const stream = new ResultStream(results, { chunkSize: 1 });

      const received: number[] = [];
      stream.subscribe(chunk => {
        received.push(chunk.data);
      });

      await stream.start();

      expect(received).toEqual([1, 2, 3]);
    });

    it('should handle chunk size larger than results', async () => {
      const results = [1, 2];
      const stream = new ResultStream(results, { chunkSize: 100 });

      const received: number[] = [];
      stream.subscribe(chunk => {
        received.push(chunk.data);
      });

      await stream.start();

      expect(received).toEqual([1, 2]);
    });
  });

  describe('delays', () => {
    beforeEach(() => jest.useFakeTimers({ now: new Date('2025-02-01T00:00:00Z') }));
    afterEach(() => { expect(jest.getTimerCount()).toBe(0); jest.useRealTimers(); });

    it('delivers the next chunk at 10ms and remains pending at 9ms', async () => {
      const stream = new ResultStream([1, 2, 3, 4], { chunkSize: 2, delayMs: 10 });
      const received: number[] = [];
      stream.subscribe(chunk => received.push(chunk.data));
      let settled = false;
      const pending = stream.start().then(() => { settled = true; });
      expect(received).toEqual([1, 2]);
      expect(stream.isComplete()).toBe(false);
      await jest.advanceTimersByTimeAsync(9);
      expect(received).toEqual([1, 2]);
      expect(settled).toBe(false);
      expect(jest.getTimerCount()).toBe(1);
      await jest.advanceTimersByTimeAsync(1);
      await pending;
      expect(received).toEqual([1, 2, 3, 4]);
      expect(settled).toBe(true);
      expect(stream.isComplete()).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('does not schedule a delay after the last chunk', async () => {
      const stream = new ResultStream([1, 2], { chunkSize: 1, delayMs: 50 });
      const chunks: StreamChunk<number>[] = [];
      stream.subscribe(chunk => chunks.push(chunk));
      const pending = stream.start();
      expect(chunks).toHaveLength(1);
      await jest.advanceTimersByTimeAsync(49);
      expect(chunks).toHaveLength(1);
      expect(stream.isComplete()).toBe(false);
      await jest.advanceTimersByTimeAsync(1);
      await pending;
      expect(chunks).toHaveLength(2);
      expect(chunks[1].timestamp.getTime() - chunks[0].timestamp.getTime()).toBe(50);
      expect(chunks[1].isLast).toBe(true);
      expect(stream.isComplete()).toBe(true);
      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(100);
      expect(chunks).toHaveLength(2);
    });
  });

  describe('abort signal', () => {
    it('should support abort signal', async () => {
      const results = Array.from({ length: 100 }, (_, i) => i);
      const controller = new AbortController();
      const stream = new ResultStream(results, {
        chunkSize: 1,
        delayMs: 5,
        signal: controller.signal,
      });

      const received: number[] = [];
      stream.subscribe(chunk => {
        received.push(chunk.data);
        // Abort after 5 items
        if (received.length === 5) {
          controller.abort();
        }
      });

      await stream.start();

      expect(received.length).toBeLessThan(100);
      expect(stream.wasAborted()).toBe(true);
      expect(stream.isComplete()).toBe(true);
    });

    it('should handle pre-aborted signal', async () => {
      const results = [1, 2, 3];
      const controller = new AbortController();
      controller.abort(); // Abort before streaming

      const stream = new ResultStream(results, { signal: controller.signal });

      const received: number[] = [];
      stream.subscribe(chunk => {
        received.push(chunk.data);
      });

      await stream.start();

      expect(received).toHaveLength(0);
      expect(stream.wasAborted()).toBe(true);
    });
  });

  describe('multiple subscribers', () => {
    it('should support multiple subscribers', async () => {
      const results = [1, 2, 3];
      const stream = new ResultStream(results);

      const received1: number[] = [];
      const received2: number[] = [];

      stream.subscribe(chunk => received1.push(chunk.data));
      stream.subscribe(chunk => received2.push(chunk.data));

      await stream.start();

      expect(received1).toEqual([1, 2, 3]);
      expect(received2).toEqual([1, 2, 3]);
    });

    it('should handle callback errors gracefully', async () => {
      const results = [1, 2, 3];
      const stream = new ResultStream(results);

      const received: number[] = [];

      stream.subscribe(() => {
        throw new Error('Test error');
      });
      stream.subscribe(chunk => {
        received.push(chunk.data);
      });

      await stream.start();

      // Second callback should still receive all results
      expect(received).toEqual([1, 2, 3]);
    });
  });

  describe('state tracking', () => {
    it('should track total count', () => {
      const results = [1, 2, 3, 4, 5];
      const stream = new ResultStream(results);

      expect(stream.getTotalCount()).toBe(5);
    });

    it('should track current index', async () => {
      const results = [1, 2, 3];
      const stream = new ResultStream(results, { chunkSize: 1 });

      expect(stream.getCurrentIndex()).toBe(0);

      stream.subscribe(() => {
        // Check index during streaming
      });

      await stream.start();

      expect(stream.getCurrentIndex()).toBe(3);
    });

    it('should prevent double start', async () => {
      const results = [1, 2];
      const stream = new ResultStream(results, { chunkSize: 1, delayMs: 10 });

      // Start first stream (don't await yet)
      const promise1 = stream.start();

      // Immediately try to start again (should fail)
      try {
        await stream.start();
        fail('Second start should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Stream already started');
      }

      // Wait for first stream to complete
      await promise1;
    });
  });

  describe('empty results', () => {
    it('should handle empty result set', async () => {
      const stream = new ResultStream([]);

      const received: unknown[] = [];
      stream.subscribe(chunk => {
        received.push(chunk.data);
      });

      await stream.start();

      expect(received).toHaveLength(0);
      expect(stream.isComplete()).toBe(true);
    });
  });
});

describe('StreamManager', () => {
  let manager: StreamManager;

  beforeEach(() => {
    manager = new StreamManager();
  });

  describe('stream creation', () => {
    it('should create and store stream', () => {
      const results = [1, 2, 3];
      const streamId = 'test-stream';

      const stream = manager.createStream(streamId, results);

      expect(stream).toBeInstanceOf(ResultStream);
      expect(manager.getStream(streamId)).toBe(stream);
    });

    it('should generate unique stream IDs', () => {
      const id1 = manager.generateStreamId();
      const id2 = manager.generateStreamId();
      const id3 = manager.generateStreamId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).toMatch(/^stream_\d+$/);
    });
  });

  describe('stream management', () => {
    it('should remove stream', () => {
      const streamId = 'test';
      manager.createStream(streamId, [1, 2, 3]);

      expect(manager.getStream(streamId)).toBeDefined();

      manager.removeStream(streamId);

      expect(manager.getStream(streamId)).toBeUndefined();
    });

    it('should count active streams', async () => {
      const stream1 = manager.createStream('stream1', [1, 2]);
      const stream2 = manager.createStream('stream2', [3, 4]);

      expect(manager.getActiveStreamCount()).toBe(2);

      await stream1.start();

      expect(manager.getActiveStreamCount()).toBe(1);
    });

    it('should cleanup completed streams', async () => {
      const stream1 = manager.createStream('stream1', [1, 2]);
      manager.createStream('stream2', [3, 4]);

      await stream1.start();

      manager.cleanup();

      expect(manager.getStream('stream1')).toBeUndefined();
      expect(manager.getStream('stream2')).toBeDefined();
    });
  });

  describe('statistics', () => {
    it('should provide stream statistics', async () => {
      const stream1 = manager.createStream('stream1', [1, 2]);
      manager.createStream('stream2', [3, 4]);

      let stats = manager.getStatistics();
      expect(stats.totalStreams).toBe(2);
      expect(stats.activeStreams).toBe(2);
      expect(stats.completedStreams).toBe(0);

      await stream1.start();

      stats = manager.getStatistics();
      expect(stats.totalStreams).toBe(2);
      expect(stats.activeStreams).toBe(1);
      expect(stats.completedStreams).toBe(1);
    });
  });

  describe('reset', () => {
    it('should clear all streams', () => {
      manager.createStream('stream1', [1, 2]);
      manager.createStream('stream2', [3, 4]);

      manager.reset();

      const stats = manager.getStatistics();
      expect(stats.totalStreams).toBe(0);
    });
  });
});

describe('collectStreamResults', () => {
  it('should collect all stream results', async () => {
    const input = [1, 2, 3, 4, 5];
    const stream = new ResultStream(input, { chunkSize: 2 });

    const results = await collectStreamResults(stream);

    expect(results).toEqual(input);
  });

  it('should work with empty stream', async () => {
    const stream = new ResultStream([]);

    const results = await collectStreamResults(stream);

    expect(results).toEqual([]);
  });
});
