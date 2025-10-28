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
import chokidar from 'chokidar';
import { ArchitecturalValidator } from './architectural-validator.js';
import path from 'path';
// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};
export class ArchitecturalWatcher {
    constructor(projectRoot = process.cwd(), config = {}) {
        this.watcher = null;
        this.debounceTimers = new Map();
        this.isRunning = false;
        this.validationCount = 0;
        this.violationCount = 0;
        this.startTime = 0;
        this.projectRoot = projectRoot;
        this.validator = new ArchitecturalValidator(projectRoot);
        // Merge with defaults
        this.config = {
            enabled: config.enabled ?? true,
            debounce: config.debounce ?? 500,
            patterns: config.patterns ?? [
                'src/pages/**/*.{tsx,jsx,vue,svelte}',
                'src/views/**/*.{tsx,jsx,vue,svelte}',
                'src/routes/**/*.{tsx,jsx,vue,svelte}',
                'src/screens/**/*.{tsx,jsx,vue,svelte}',
                'src/App.{tsx,jsx}',
                'src/router/**/*.{ts,js,tsx,jsx}',
                'src/routes.{ts,js,tsx,jsx}',
                '**/navigation*.{ts,tsx,js,jsx}',
                '**/menu*.{ts,tsx,js,jsx}'
            ],
            ignored: config.ignored ?? [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/*.test.*',
                '**/*.spec.*',
                '**/*.stories.*'
            ],
            verbosity: config.verbosity ?? 'normal',
            colors: config.colors ?? true,
            errorsOnly: config.errorsOnly ?? false
        };
    }
    /**
     * Start watching for file changes
     */
    async start() {
        if (!this.config.enabled) {
            this.log('info', 'Architectural watcher is disabled');
            return;
        }
        if (this.isRunning) {
            this.log('warn', 'Watcher is already running');
            return;
        }
        this.startTime = Date.now();
        this.isRunning = true;
        // Display startup banner
        this.displayBanner();
        // Initialize file watcher
        this.watcher = chokidar.watch(this.config.patterns, {
            cwd: this.projectRoot,
            ignored: this.config.ignored,
            persistent: true,
            ignoreInitial: true, // Don't validate all files on startup
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 50
            }
        });
        // Handle file events
        this.watcher
            .on('add', (filePath) => this.onFileChange(filePath, 'added'))
            .on('change', (filePath) => this.onFileChange(filePath, 'modified'))
            .on('unlink', (filePath) => this.onFileChange(filePath, 'deleted'))
            .on('error', (error) => this.onError(error))
            .on('ready', () => this.onReady());
        // Handle graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }
    /**
     * Stop watching
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.log('info', '\n🛑 Stopping architectural watcher...');
        // Clear pending timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        // Close watcher
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
        // Display stats
        this.displayStats();
        this.isRunning = false;
        this.log('info', '✅ Architectural watcher stopped\n');
    }
    /**
     * Handle file change events with debouncing
     */
    onFileChange(filePath, event) {
        const absolutePath = path.resolve(this.projectRoot, filePath);
        // Clear existing timer for this file
        const existingTimer = this.debounceTimers.get(absolutePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set new debounced timer
        const timer = setTimeout(async () => {
            await this.validateFile(absolutePath, event);
            this.debounceTimers.delete(absolutePath);
        }, this.config.debounce);
        this.debounceTimers.set(absolutePath, timer);
    }
    /**
     * Validate a single file
     */
    async validateFile(filePath, event) {
        if (this.config.verbosity === 'verbose') {
            const relativePath = path.relative(this.projectRoot, filePath);
            this.log('info', `🔍 Validating (${event}): ${relativePath}`);
        }
        try {
            // Run validation
            const result = await this.validator.validate([filePath]);
            this.validationCount++;
            // Display results
            this.displayValidationResult(filePath, result, event);
            // Track violations
            if (result.blockers.length > 0 || result.warnings.length > 0) {
                this.violationCount++;
            }
        }
        catch (error) {
            this.log('error', `Error validating ${filePath}:`, error);
        }
    }
    /**
     * Display validation results
     */
    displayValidationResult(filePath, result, event) {
        const relativePath = path.relative(this.projectRoot, filePath);
        // Only show if there are issues (or verbose mode)
        const hasIssues = result.blockers.length > 0 || result.warnings.length > 0;
        if (!hasIssues && this.config.verbosity !== 'verbose') {
            return; // Silent success
        }
        // Show file path
        if (this.config.verbosity === 'normal' || this.config.verbosity === 'verbose') {
            console.log(''); // Blank line for readability
            this.log('info', `🔍 ${this.capitalize(event)}: ${relativePath}`);
        }
        // Display blockers (errors)
        if (result.blockers.length > 0) {
            console.log(this.colorize('\n❌ ARCHITECTURAL ISSUE DETECTED:', 'red', 'bright'));
            result.blockers.forEach((blocker, index) => {
                console.log(this.colorize(`   ${index + 1}. ${blocker.message}`, 'red'));
                if (blocker.fixSuggestion && this.config.verbosity !== 'silent') {
                    const lines = blocker.fixSuggestion.split('\n');
                    console.log(this.colorize('   💡 Fix:', 'yellow'));
                    lines.forEach(line => {
                        console.log(this.colorize(`      ${line}`, 'yellow', 'dim'));
                    });
                }
            });
            console.log(''); // Blank line
        }
        // Display warnings (if not errors-only mode)
        if (!this.config.errorsOnly && result.warnings.length > 0) {
            console.log(this.colorize('\n⚠️  ARCHITECTURAL WARNING:', 'yellow'));
            result.warnings.forEach((warning, index) => {
                console.log(this.colorize(`   ${index + 1}. ${warning.message}`, 'yellow'));
            });
            console.log(''); // Blank line
        }
        // Show success (verbose mode only)
        if (!hasIssues && this.config.verbosity === 'verbose') {
            console.log(this.colorize('   ✅ Architectural validation passed', 'green'));
            console.log(''); // Blank line
        }
    }
    /**
     * Handle watcher errors
     */
    onError(error) {
        this.log('error', '❌ Watcher error:', error);
    }
    /**
     * Handle watcher ready
     */
    onReady() {
        if (this.config.verbosity === 'verbose') {
            this.log('success', '✅ Watcher ready - monitoring file changes\n');
        }
    }
    /**
     * Display startup banner
     */
    displayBanner() {
        if (this.config.verbosity === 'silent')
            return;
        console.log('');
        console.log(this.colorize('╔═══════════════════════════════════════════════════════════╗', 'cyan'));
        console.log(this.colorize('║  🏗️  VERSATIL Architectural Watcher: ACTIVE               ║', 'cyan', 'bright'));
        console.log(this.colorize('╚═══════════════════════════════════════════════════════════╝', 'cyan'));
        console.log('');
        console.log(this.colorize('   Monitoring for:', 'gray'));
        console.log(this.colorize('   • Orphaned page components (pages without routes)', 'gray'));
        console.log(this.colorize('   • Broken navigation (menu items without routes)', 'gray'));
        console.log(this.colorize('   • Incomplete deliverables (partial implementations)', 'gray'));
        console.log('');
        console.log(this.colorize('   Press Ctrl+C to stop', 'gray', 'dim'));
        console.log('');
    }
    /**
     * Display statistics on shutdown
     */
    displayStats() {
        if (this.config.verbosity === 'silent')
            return;
        const uptime = Math.round((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(uptime / 60);
        const seconds = uptime % 60;
        const uptimeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        console.log('');
        console.log(this.colorize('📊 Watcher Statistics:', 'cyan'));
        console.log(this.colorize(`   Uptime: ${uptimeStr}`, 'gray'));
        console.log(this.colorize(`   Validations: ${this.validationCount}`, 'gray'));
        console.log(this.colorize(`   Issues found: ${this.violationCount}`, 'gray'));
        console.log('');
    }
    /**
     * Colorize text for terminal
     */
    colorize(text, color = 'reset', modifier) {
        if (!this.config.colors) {
            return text;
        }
        const colorCode = colors[color] || colors.reset;
        const modifierCode = modifier ? colors[modifier] : '';
        return `${modifierCode}${colorCode}${text}${colors.reset}`;
    }
    /**
     * Log message with level
     */
    log(level, message, ...args) {
        if (this.config.verbosity === 'silent')
            return;
        const colorMap = {
            info: 'cyan',
            warn: 'yellow',
            error: 'red',
            success: 'green'
        };
        console.log(this.colorize(message, colorMap[level]), ...args);
    }
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Get watcher status
     */
    getStatus() {
        return {
            running: this.isRunning,
            validationCount: this.validationCount,
            violationCount: this.violationCount,
            uptime: this.isRunning ? Date.now() - this.startTime : 0
        };
    }
}
//# sourceMappingURL=architectural-watcher.js.map