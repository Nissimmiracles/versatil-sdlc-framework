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
import { WebSocketServer } from 'ws';
import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { EventEmitter } from 'events';
// Configuration
const WS_PORT = parseInt(process.env.DEV_DASHBOARD_PORT || '3001', 10);
const UI_MODE = process.env.DEV_DASHBOARD_UI || 'terminal'; // terminal | web
/**
 * Browser Monitor Core - Handles WebSocket connections
 */
export class BrowserMonitor extends EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.clients = new Set();
        this.messageHistory = [];
        this.maxHistorySize = 1000;
    }
    /**
     * Start WebSocket server
     */
    start() {
        this.wss = new WebSocketServer({ port: WS_PORT });
        this.wss.on('connection', (ws) => {
            console.log(`✅ Browser connected (total: ${this.clients.size + 1})`);
            this.clients.add(ws);
            // Send history to new client
            ws.send(JSON.stringify({
                type: 'history',
                messages: this.messageHistory
            }));
            ws.on('message', (data) => {
                this.handleMessage(data.toString());
            });
            ws.on('close', () => {
                console.log(`❌ Browser disconnected (remaining: ${this.clients.size - 1})`);
                this.clients.delete(ws);
            });
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
        console.log(`🌐 Browser Monitor listening on ws://localhost:${WS_PORT}`);
    }
    /**
     * Handle incoming browser message
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            // Add to history
            this.messageHistory.push(message);
            if (this.messageHistory.length > this.maxHistorySize) {
                this.messageHistory.shift();
            }
            // Emit event for dashboard
            this.emit('message', message);
        }
        catch (error) {
            console.error('Failed to parse browser message:', error);
        }
    }
    /**
     * Stop WebSocket server
     */
    stop() {
        if (this.wss) {
            this.clients.forEach(client => client.close());
            this.wss.close();
            console.log('🛑 Browser Monitor stopped');
        }
    }
    /**
     * Get message statistics
     */
    getStats() {
        return {
            totalMessages: this.messageHistory.length,
            consoleMessages: this.messageHistory.filter(m => m.type === 'console').length,
            networkRequests: this.messageHistory.filter(m => m.type === 'network').length,
            errors: this.messageHistory.filter(m => m.type === 'error').length
        };
    }
}
/**
 * Terminal UI Dashboard using blessed
 */
export class TerminalDashboard {
    constructor(monitor) {
        this.monitor = monitor;
        // Create screen
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'Browser Monitor Dashboard'
        });
        // Create grid layout
        this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });
        // Console log (top-left, 8x6)
        this.consoleLog = this.grid.set(0, 0, 6, 6, blessed.log, {
            label: '📝 Console Output',
            border: { type: 'line' },
            style: {
                border: { fg: 'cyan' },
                focus: { border: { fg: 'green' } }
            },
            scrollable: true,
            scrollbar: {
                ch: ' ',
                track: { bg: 'cyan' },
                style: { inverse: true }
            }
        });
        // Network requests table (top-right, 8x6)
        this.networkTable = this.grid.set(0, 6, 6, 6, contrib.table, {
            label: '🌐 Network Requests',
            keys: true,
            fg: 'white',
            columnSpacing: 2,
            columnWidth: [10, 40, 10, 10]
        });
        // Error log (bottom-left, 4x8)
        this.errorLog = this.grid.set(6, 0, 4, 8, blessed.log, {
            label: '❌ Errors',
            border: { type: 'line' },
            style: {
                border: { fg: 'red' },
                focus: { border: { fg: 'green' } }
            },
            scrollable: true,
            scrollbar: {
                ch: ' ',
                track: { bg: 'red' },
                style: { inverse: true }
            }
        });
        // Stats box (bottom-right, 4x4)
        this.statsBox = this.grid.set(6, 8, 4, 4, blessed.box, {
            label: '📊 Statistics',
            border: { type: 'line' },
            style: {
                border: { fg: 'yellow' }
            },
            content: ''
        });
        // Quit on Escape, q, or Control-C
        this.screen.key(['escape', 'q', 'C-c'], () => {
            this.monitor.stop();
            return process.exit(0);
        });
        // Setup event listeners
        this.setupEventListeners();
        // Render screen
        this.screen.render();
    }
    /**
     * Setup event listeners for browser messages
     */
    setupEventListeners() {
        const networkData = [];
        this.monitor.on('message', (message) => {
            switch (message.type) {
                case 'console': {
                    const data = message.data;
                    const color = data.level === 'error' ? '{red-fg}' : data.level === 'warn' ? '{yellow-fg}' : '{white-fg}';
                    const timestamp = new Date(message.timestamp).toLocaleTimeString();
                    this.consoleLog.log(`${color}[${timestamp}] [${data.level.toUpperCase()}] ${data.message}{/}`);
                    break;
                }
                case 'network': {
                    const data = message.data;
                    const statusColor = data.status >= 400 ? '{red-fg}' : data.status >= 300 ? '{yellow-fg}' : '{green-fg}';
                    networkData.unshift([
                        data.method,
                        data.url.slice(0, 40),
                        `${statusColor}${data.status}{/}`,
                        `${data.duration}ms`
                    ]);
                    // Keep only last 50 requests
                    if (networkData.length > 50) {
                        networkData.pop();
                    }
                    this.networkTable.setData({
                        headers: ['Method', 'URL', 'Status', 'Duration'],
                        data: networkData
                    });
                    break;
                }
                case 'error': {
                    const data = message.data;
                    const timestamp = new Date(message.timestamp).toLocaleTimeString();
                    this.errorLog.log(`{red-fg}[${timestamp}] ${data.message}{/}`);
                    if (data.stack) {
                        this.errorLog.log(`{gray-fg}${data.stack.split('\n').slice(0, 3).join('\n')}{/}`);
                    }
                    break;
                }
            }
            // Update stats
            this.updateStats();
            this.screen.render();
        });
    }
    /**
     * Update statistics box
     */
    updateStats() {
        const stats = this.monitor.getStats();
        this.statsBox.setContent(`
  Total Messages: ${stats.totalMessages}
  Console: ${stats.consoleMessages}
  Network: ${stats.networkRequests}
  Errors: {red-fg}${stats.errors}{/}
    `);
    }
}
/**
 * Start browser monitor dashboard
 */
export function startBrowserMonitor() {
    const monitor = new BrowserMonitor();
    monitor.start();
    if (UI_MODE === 'terminal') {
        const dashboard = new TerminalDashboard(monitor);
        console.log('📊 Terminal dashboard initialized');
    }
    return monitor;
}
/**
 * Main entry point (if run directly)
 */
if (require.main === module) {
    console.log('🚀 Starting Dev Browser Monitor Dashboard...\n');
    const monitor = startBrowserMonitor();
    console.log(`
📊 Dashboard Controls:
   - q or Esc: Quit
   - Arrow keys: Scroll panels
   - Tab: Switch focus between panels

🔌 Browser Connection:
   Add to your HTML:
   <script src="ws://localhost:${WS_PORT}/browser-monitor-client.js"></script>

   Or use Playwright integration:
   - Edit test files with frontend extensions (.tsx, .jsx, .vue)
   - Browser errors auto-stream to this dashboard
  `);
    // Keep process alive
    process.on('SIGINT', () => {
        monitor.stop();
        process.exit(0);
    });
}
//# sourceMappingURL=dev-browser-monitor.js.map