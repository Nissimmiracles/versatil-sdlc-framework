#!/usr/bin/env -S npx tsx
"use strict";
/**
 * VERSATIL Framework - Session Start Hook
 *
 * Auto-starts Guardian background monitoring when Claude Code session begins.
 * Ensures Guardian is always running to provide:
 * - Automatic health checks (every 5 minutes)
 * - Proactive answer generation (v7.13.0+)
 * - TODO generation for detected issues (v7.10.0+)
 * - Enhancement detection (v7.12.0+)
 *
 * @version 7.13.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
async function main() {
    try {
        // Read stdin for hook input
        const input = await readStdin();
        const hookData = JSON.parse(input);
        // Only start Guardian on actual session startup (not resume/clear/compact)
        if (hookData.source !== 'startup') {
            process.exit(0);
        }
        const cwd = process.cwd();
        const logDir = path.join(os.homedir(), '.versatil', 'logs', 'guardian');
        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const logFile = path.join(logDir, 'session-start.log');
        const timestamp = new Date().toISOString();
        // Check if we're in a VERSATIL project
        const isVersatilProject = fs.existsSync(path.join(cwd, 'package.json')) &&
            fs.existsSync(path.join(cwd, 'src', 'agents', 'guardian'));
        if (!isVersatilProject) {
            // Not a VERSATIL project, skip Guardian start
            fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Not a VERSATIL project, skipping Guardian\n`);
            process.exit(0);
        }
        // Check if Guardian is already running
        try {
            const guardianStatus = (0, child_process_1.execSync)('launchctl list | grep versatil.guardian', {
                encoding: 'utf-8',
                stdio: 'pipe'
            });
            if (guardianStatus && guardianStatus.includes('com.versatil.guardian')) {
                // Guardian already running, trigger a health check instead
                fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Guardian already running, triggering health check\n`);
                try {
                    (0, child_process_1.execSync)('npm run guardian:health-check', {
                        cwd,
                        stdio: 'ignore',
                        timeout: 30000
                    });
                    fs.appendFileSync(logFile, `[${timestamp}] Health check completed\n`);
                }
                catch (healthCheckError) {
                    fs.appendFileSync(logFile, `[${timestamp}] Health check failed: ${healthCheckError.message}\n`);
                }
                process.exit(0);
            }
        }
        catch {
            // Guardian not running, proceed to start it
        }
        // Start Guardian background monitoring (async, don't wait)
        fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Starting Guardian background monitoring (async)...\n`);
        try {
            // Start Guardian in background without waiting
            (0, child_process_1.execSync)('npm run guardian:start > /dev/null 2>&1 &', {
                cwd,
                shell: '/bin/bash',
                stdio: 'ignore',
                timeout: 5000 // Just wait for process spawn, not completion
            });
            fs.appendFileSync(logFile, `[${timestamp}] ✅ Guardian start initiated (running in background)\n`);
            fs.appendFileSync(logFile, `[${timestamp}] - Health checks: Every 5 minutes\n`);
            fs.appendFileSync(logFile, `[${timestamp}] - Proactive answers: Enabled (v7.13.0+)\n`);
            fs.appendFileSync(logFile, `[${timestamp}] - TODO generation: Enabled (v7.10.0+)\n`);
            fs.appendFileSync(logFile, `[${timestamp}] - Enhancement detection: Enabled (v7.12.0+)\n`);
            // Output a brief notification to Claude (will be injected into context)
            console.log('🛡️  Guardian background monitoring initiated');
        }
        catch (error) {
            const errorMsg = error.message;
            fs.appendFileSync(logFile, `[${timestamp}] ❌ Failed to start Guardian: ${errorMsg}\n`);
            // Non-blocking error - session can continue without Guardian
            console.log('⚠️  Guardian failed to start (session can continue normally)');
        }
    }
    catch (error) {
        // Catch-all to prevent hook from blocking session start
        const logDir = path.join(os.homedir(), '.versatil', 'logs', 'guardian');
        const logFile = path.join(logDir, 'session-start.log');
        const timestamp = new Date().toISOString();
        if (fs.existsSync(logDir)) {
            fs.appendFileSync(logFile, `[${timestamp}] ❌ Hook error: ${error.message}\n`);
        }
    }
    process.exit(0);
}
async function readStdin() {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.on('data', (chunk) => {
            data += chunk;
        });
        process.stdin.on('end', () => {
            resolve(data);
        });
    });
}
main();
