/**
 * VERSATIL SDLC Framework - Architectural File Watcher
 *
 * Provides real-time architectural validation during development (HMR/watch mode).
 * Complements pre-commit enforcement with immediate feedback when developers
 * create orphaned pages, broken navigation, or incomplete deliverables.
 *
 * Phase 4: HMR Integration
 * @see docs/enhancements/HMR_INTEGRATION.md
 */
export interface WatcherConfig {
    enabled?: boolean;
    debounce?: number;
    patterns?: string[];
    ignored?: string[];
    verbosity?: 'silent' | 'normal' | 'verbose';
    colors?: boolean;
    errorsOnly?: boolean;
}
export declare class ArchitecturalWatcher {
    private validator;
    private watcher;
    private debounceTimers;
    private config;
    private projectRoot;
    private isRunning;
    private validationCount;
    private violationCount;
    private startTime;
    constructor(projectRoot?: string, config?: WatcherConfig);
    /**
     * Start watching for file changes
     */
    start(): Promise<void>;
    /**
     * Stop watching
     */
    stop(): Promise<void>;
    /**
     * Handle file change events with debouncing
     */
    private onFileChange;
    /**
     * Validate a single file
     */
    private validateFile;
    /**
     * Display validation results
     */
    private displayValidationResult;
    /**
     * Handle watcher errors
     */
    private onError;
    /**
     * Handle watcher ready
     */
    private onReady;
    /**
     * Display startup banner
     */
    private displayBanner;
    /**
     * Display statistics on shutdown
     */
    private displayStats;
    /**
     * Colorize text for terminal
     */
    private colorize;
    /**
     * Log message with level
     */
    private log;
    /**
     * Capitalize first letter
     */
    private capitalize;
    /**
     * Get watcher status
     */
    getStatus(): {
        running: boolean;
        validationCount: number;
        violationCount: number;
        uptime: number;
    };
}
