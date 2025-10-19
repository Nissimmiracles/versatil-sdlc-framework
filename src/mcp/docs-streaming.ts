/**
 * VERSATIL Documentation Streaming Support
 * Provides streaming search results and partial result delivery
 */

import type { SearchResult } from './docs-search-engine.js';

export interface StreamChunk<T> {
  data: T;
  index: number;
  timestamp: Date;
  isLast: boolean;
}

export interface StreamCallback<T> {
  (chunk: StreamChunk<T>): void;
}

export interface StreamOptions {
  chunkSize?: number; // Number of results per chunk (default: 5)
  delayMs?: number; // Delay between chunks in ms (default: 0)
  signal?: AbortSignal; // For cancellation
}

/**
 * Result stream for incremental delivery
 */
export class ResultStream<T> {
  private results: T[];
  private callbacks: StreamCallback<T>[];
  private index: number = 0;
  private chunkSize: number;
  private delayMs: number;
  private signal?: AbortSignal;
  private isStreaming: boolean = false;
  private aborted: boolean = false;

  constructor(results: T[], options: StreamOptions = {}) {
    this.results = results;
    this.callbacks = [];
    this.chunkSize = options.chunkSize || 5;
    this.delayMs = options.delayMs || 0;
    this.signal = options.signal;

    // Check if already aborted
    if (this.signal?.aborted) {
      this.aborted = true;
    }

    // Setup abort handler
    if (this.signal) {
      this.signal.addEventListener('abort', () => {
        this.aborted = true;
      });
    }
  }

  /**
   * Subscribe to stream chunks
   */
  subscribe(callback: StreamCallback<T>): void {
    this.callbacks.push(callback);
  }

  /**
   * Start streaming results
   */
  async start(): Promise<void> {
    if (this.isStreaming) {
      throw new Error('Stream already started');
    }

    this.isStreaming = true;

    try {
      while (this.index < this.results.length && !this.aborted) {
        // Get next chunk
        const endIndex = Math.min(this.index + this.chunkSize, this.results.length);
        const chunk = this.results.slice(this.index, endIndex);

        // Emit each result in chunk
        for (let i = 0; i < chunk.length && !this.aborted; i++) {
          const result = chunk[i];
          const isLast = this.index + i === this.results.length - 1;

          const streamChunk: StreamChunk<T> = {
            data: result,
            index: this.index + i,
            timestamp: new Date(),
            isLast,
          };

          this.emitChunk(streamChunk);
        }

        this.index = endIndex;

        // Delay before next chunk (if not last)
        if (this.index < this.results.length && this.delayMs > 0 && !this.aborted) {
          await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }
      }
    } finally {
      this.isStreaming = false;
    }
  }

  /**
   * Emit chunk to all subscribers
   */
  private emitChunk(chunk: StreamChunk<T>): void {
    for (const callback of this.callbacks) {
      try {
        callback(chunk);
      } catch (error) {
        console.error('Stream callback error:', error);
      }
    }
  }

  /**
   * Get total result count
   */
  getTotalCount(): number {
    return this.results.length;
  }

  /**
   * Get current stream position
   */
  getCurrentIndex(): number {
    return this.index;
  }

  /**
   * Check if stream is complete
   */
  isComplete(): boolean {
    return this.index >= this.results.length || this.aborted;
  }

  /**
   * Check if stream was aborted
   */
  wasAborted(): boolean {
    return this.aborted;
  }
}

/**
 * Manages multiple result streams
 */
export class StreamManager {
  private streams: Map<string, ResultStream<unknown>>;
  private nextStreamId: number = 1;

  constructor() {
    this.streams = new Map();
  }

  /**
   * Create a new stream
   */
  createStream<T>(
    streamId: string,
    results: T[],
    options?: StreamOptions
  ): ResultStream<T> {
    const stream = new ResultStream(results, options);
    this.streams.set(streamId, stream as ResultStream<unknown>);
    return stream;
  }

  /**
   * Generate unique stream ID
   */
  generateStreamId(): string {
    return `stream_${this.nextStreamId++}`;
  }

  /**
   * Get stream by ID
   */
  getStream<T>(streamId: string): ResultStream<T> | undefined {
    return this.streams.get(streamId) as ResultStream<T> | undefined;
  }

  /**
   * Remove stream
   */
  removeStream(streamId: string): void {
    this.streams.delete(streamId);
  }

  /**
   * Get active stream count
   */
  getActiveStreamCount(): number {
    let count = 0;
    for (const stream of this.streams.values()) {
      if (!stream.isComplete()) {
        count++;
      }
    }
    return count;
  }

  /**
   * Cleanup completed streams
   */
  cleanup(): void {
    const idsToRemove: string[] = [];

    for (const [id, stream] of this.streams.entries()) {
      if (stream.isComplete()) {
        idsToRemove.push(id);
      }
    }

    idsToRemove.forEach(id => this.streams.delete(id));
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalStreams: number;
    activeStreams: number;
    completedStreams: number;
  } {
    let active = 0;
    let completed = 0;

    for (const stream of this.streams.values()) {
      if (stream.isComplete()) {
        completed++;
      } else {
        active++;
      }
    }

    return {
      totalStreams: this.streams.size,
      activeStreams: active,
      completedStreams: completed,
    };
  }

  /**
   * Reset all streams
   */
  reset(): void {
    this.streams.clear();
  }
}

/**
 * Helper to collect stream results
 */
export async function collectStreamResults<T>(
  stream: ResultStream<T>
): Promise<T[]> {
  const results: T[] = [];

  stream.subscribe(chunk => {
    results.push(chunk.data);
  });

  await stream.start();

  return results;
}

/**
 * Helper to create a buffered stream (collect chunks before emitting)
 */
export class BufferedStream<T> extends ResultStream<T> {
  private buffer: T[] = [];
  private bufferSize: number;

  constructor(results: T[], bufferSize: number = 10, options: StreamOptions = {}) {
    super(results, options);
    this.bufferSize = bufferSize;
  }

  /**
   * Override to buffer results before emitting
   */
  async start(): Promise<void> {
    // Implementation would buffer results before emitting
    // For now, delegate to parent
    return super.start();
  }
}
