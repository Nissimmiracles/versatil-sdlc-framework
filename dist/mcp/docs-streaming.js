/**
 * VERSATIL Documentation Streaming Support
 * Provides streaming search results and partial result delivery
 */
/**
 * Result stream for incremental delivery
 */
export class ResultStream {
    constructor(results, options = {}) {
        this.index = 0;
        this.isStreaming = false;
        this.aborted = false;
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
    subscribe(callback) {
        this.callbacks.push(callback);
    }
    /**
     * Start streaming results
     */
    async start() {
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
                    const streamChunk = {
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
        }
        finally {
            this.isStreaming = false;
        }
    }
    /**
     * Emit chunk to all subscribers
     */
    emitChunk(chunk) {
        for (const callback of this.callbacks) {
            try {
                callback(chunk);
            }
            catch (error) {
                console.error('Stream callback error:', error);
            }
        }
    }
    /**
     * Get total result count
     */
    getTotalCount() {
        return this.results.length;
    }
    /**
     * Get current stream position
     */
    getCurrentIndex() {
        return this.index;
    }
    /**
     * Check if stream is complete
     */
    isComplete() {
        return this.index >= this.results.length || this.aborted;
    }
    /**
     * Check if stream was aborted
     */
    wasAborted() {
        return this.aborted;
    }
}
/**
 * Manages multiple result streams
 */
export class StreamManager {
    constructor() {
        this.nextStreamId = 1;
        this.streams = new Map();
    }
    /**
     * Create a new stream
     */
    createStream(streamId, results, options) {
        const stream = new ResultStream(results, options);
        this.streams.set(streamId, stream);
        return stream;
    }
    /**
     * Generate unique stream ID
     */
    generateStreamId() {
        return `stream_${this.nextStreamId++}`;
    }
    /**
     * Get stream by ID
     */
    getStream(streamId) {
        return this.streams.get(streamId);
    }
    /**
     * Remove stream
     */
    removeStream(streamId) {
        this.streams.delete(streamId);
    }
    /**
     * Get active stream count
     */
    getActiveStreamCount() {
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
    cleanup() {
        const idsToRemove = [];
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
    getStatistics() {
        let active = 0;
        let completed = 0;
        for (const stream of this.streams.values()) {
            if (stream.isComplete()) {
                completed++;
            }
            else {
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
    reset() {
        this.streams.clear();
    }
}
/**
 * Helper to collect stream results
 */
export async function collectStreamResults(stream) {
    const results = [];
    stream.subscribe(chunk => {
        results.push(chunk.data);
    });
    await stream.start();
    return results;
}
/**
 * Helper to create a buffered stream (collect chunks before emitting)
 */
export class BufferedStream extends ResultStream {
    constructor(results, bufferSize = 10, options = {}) {
        super(results, options);
        this.buffer = [];
        this.bufferSize = bufferSize;
    }
    /**
     * Override to buffer results before emitting
     */
    async start() {
        // Implementation would buffer results before emitting
        // For now, delegate to parent
        return super.start();
    }
}
//# sourceMappingURL=docs-streaming.js.map