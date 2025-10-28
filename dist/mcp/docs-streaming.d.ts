/**
 * VERSATIL Documentation Streaming Support
 * Provides streaming search results and partial result delivery
 */
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
    chunkSize?: number;
    delayMs?: number;
    signal?: AbortSignal;
}
/**
 * Result stream for incremental delivery
 */
export declare class ResultStream<T> {
    private results;
    private callbacks;
    private index;
    private chunkSize;
    private delayMs;
    private signal?;
    private isStreaming;
    private aborted;
    constructor(results: T[], options?: StreamOptions);
    /**
     * Subscribe to stream chunks
     */
    subscribe(callback: StreamCallback<T>): void;
    /**
     * Start streaming results
     */
    start(): Promise<void>;
    /**
     * Emit chunk to all subscribers
     */
    private emitChunk;
    /**
     * Get total result count
     */
    getTotalCount(): number;
    /**
     * Get current stream position
     */
    getCurrentIndex(): number;
    /**
     * Check if stream is complete
     */
    isComplete(): boolean;
    /**
     * Check if stream was aborted
     */
    wasAborted(): boolean;
}
/**
 * Manages multiple result streams
 */
export declare class StreamManager {
    private streams;
    private nextStreamId;
    constructor();
    /**
     * Create a new stream
     */
    createStream<T>(streamId: string, results: T[], options?: StreamOptions): ResultStream<T>;
    /**
     * Generate unique stream ID
     */
    generateStreamId(): string;
    /**
     * Get stream by ID
     */
    getStream<T>(streamId: string): ResultStream<T> | undefined;
    /**
     * Remove stream
     */
    removeStream(streamId: string): void;
    /**
     * Get active stream count
     */
    getActiveStreamCount(): number;
    /**
     * Cleanup completed streams
     */
    cleanup(): void;
    /**
     * Get statistics
     */
    getStatistics(): {
        totalStreams: number;
        activeStreams: number;
        completedStreams: number;
    };
    /**
     * Reset all streams
     */
    reset(): void;
}
/**
 * Helper to collect stream results
 */
export declare function collectStreamResults<T>(stream: ResultStream<T>): Promise<T[]>;
/**
 * Helper to create a buffered stream (collect chunks before emitting)
 */
export declare class BufferedStream<T> extends ResultStream<T> {
    private buffer;
    private bufferSize;
    constructor(results: T[], bufferSize?: number, options?: StreamOptions);
    /**
     * Override to buffer results before emitting
     */
    start(): Promise<void>;
}
