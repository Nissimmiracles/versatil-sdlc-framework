/**
 * Dev Browser Monitor Dashboard
 *
 * Real-time debugging dashboard that displays:
 * - Console output (log, warn, error)
 * - Network request panel
 * - Error aggregation by severity
 * - Live WebSocket streaming from browser
 *
 * @version 1.0.0
 * @since v7.14.0
 */
import { EventEmitter } from 'events';
export interface BrowserMessage {
    type: 'console' | 'network' | 'error';
    timestamp: string;
    data: ConsoleData | NetworkData | ErrorData;
}
interface ConsoleData {
    level: 'log' | 'warn' | 'error';
    message: string;
    location?: string;
}
interface NetworkData {
    method: string;
    url: string;
    status: number;
    duration: number;
}
interface ErrorData {
    message: string;
    stack?: string;
    filename?: string;
    line?: number;
    column?: number;
}
/**
 * Browser Monitor Core - Handles WebSocket connections
 */
export declare class BrowserMonitor extends EventEmitter {
    private wss;
    private clients;
    private messageHistory;
    private maxHistorySize;
    constructor();
    /**
     * Start WebSocket server
     */
    start(): void;
    /**
     * Handle incoming browser message
     */
    private handleMessage;
    /**
     * Stop WebSocket server
     */
    stop(): void;
    /**
     * Get message statistics
     */
    getStats(): {
        totalMessages: number;
        consoleMessages: number;
        networkRequests: number;
        errors: number;
    };
}
/**
 * Terminal UI Dashboard using blessed
 */
export declare class TerminalDashboard {
    private monitor;
    private screen;
    private grid;
    private consoleLog;
    private networkTable;
    private errorLog;
    private statsBox;
    constructor(monitor: BrowserMonitor);
    /**
     * Setup event listeners for browser messages
     */
    private setupEventListeners;
    /**
     * Update statistics box
     */
    private updateStats;
}
/**
 * Start browser monitor dashboard
 */
export declare function startBrowserMonitor(): BrowserMonitor;
export {};
