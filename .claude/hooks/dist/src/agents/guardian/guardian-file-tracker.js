"use strict";
/**
 * VERSATIL SDLC Framework - Guardian File Tracker
 * Tracks file edits for agent failure detection
 *
 * Called by post-file-edit.ts hook to monitor for:
 * - Agent activation failures
 * - Build failures after edits
 * - Test failures after edits
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
exports.trackFileEditForGuardian = trackFileEditForGuardian;
exports.markAgentActivated = markAgentActivated;
exports.checkActivationFailures = checkActivationFailures;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const guardian_logger_js_1 = require("./guardian-logger.js");
/**
 * Track file edit for Guardian monitoring
 */
async function trackFileEditForGuardian(event) {
    const logger = guardian_logger_js_1.GuardianLogger.getInstance();
    const versatilHome = path.join(os.homedir(), '.versatil');
    const trackingFile = path.join(versatilHome, 'logs', 'guardian', 'file-edits.jsonl');
    // Ensure directory exists
    const dir = path.dirname(trackingFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // Determine expected agent based on file pattern
    const expectedAgent = determineExpectedAgent(event.relativePath);
    const tracking = {
        filePath: event.relativePath,
        timestamp: event.timestamp,
        expected_agent: expectedAgent,
        activated: false // Will be updated if agent activates
    };
    // Append to JSONL file
    fs.appendFileSync(trackingFile, JSON.stringify(tracking) + '\n');
    // Log to Guardian
    logger.logAgentActivation({
        agent: expectedAgent || 'none',
        success: false, // Pending activation
        duration_ms: 0,
        triggered_by: event.relativePath,
        context: 'PROJECT_CONTEXT'
    });
}
/**
 * Mark agent as activated for a file
 */
async function markAgentActivated(filePath, agent, success, duration_ms, error) {
    const versatilHome = path.join(os.homedir(), '.versatil');
    const trackingFile = path.join(versatilHome, 'logs', 'guardian', 'file-edits.jsonl');
    if (!fs.existsSync(trackingFile)) {
        return;
    }
    // Read all tracking entries
    const lines = fs.readFileSync(trackingFile, 'utf-8').trim().split('\n');
    const entries = lines.map(line => JSON.parse(line));
    // Find most recent entry for this file
    const entry = entries.reverse().find(e => e.filePath === filePath && !e.activated);
    if (entry) {
        entry.activated = true;
        entry.activation_timestamp = new Date().toISOString();
        entry.activation_duration_ms = duration_ms;
        if (error) {
            entry.activation_error = error;
        }
        // Rewrite file (simplified - in production, use append-only log rotation)
        fs.writeFileSync(trackingFile, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
        // Log success/failure to Guardian
        const logger = guardian_logger_js_1.GuardianLogger.getInstance();
        logger.logAgentActivation({
            agent,
            success,
            duration_ms,
            triggered_by: filePath,
            context: 'PROJECT_CONTEXT'
        });
    }
}
/**
 * Check for agent activation failures (files edited but agents didn't activate)
 */
async function checkActivationFailures() {
    const versatilHome = path.join(os.homedir(), '.versatil');
    const trackingFile = path.join(versatilHome, 'logs', 'guardian', 'file-edits.jsonl');
    if (!fs.existsSync(trackingFile)) {
        return [];
    }
    const lines = fs.readFileSync(trackingFile, 'utf-8').trim().split('\n');
    const entries = lines.map(line => JSON.parse(line));
    const now = Date.now();
    const failures = [];
    // Check for entries > 5 minutes old that haven't activated
    entries.forEach(entry => {
        if (!entry.activated && entry.expected_agent) {
            const editTime = new Date(entry.timestamp).getTime();
            const timeSinceEdit = now - editTime;
            if (timeSinceEdit > 5 * 60 * 1000) { // 5 minutes
                failures.push({
                    filePath: entry.filePath,
                    expected_agent: entry.expected_agent,
                    time_since_edit_ms: timeSinceEdit
                });
            }
        }
    });
    return failures;
}
/**
 * Determine which agent should activate based on file pattern
 */
function determineExpectedAgent(filePath) {
    // Test files → Maria-QA
    if (filePath.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
        return 'maria-qa';
    }
    if (filePath.includes('__tests__/')) {
        return 'maria-qa';
    }
    // Frontend files → James-Frontend
    if (filePath.match(/\.(tsx|jsx|vue|svelte)$/)) {
        return 'james-frontend';
    }
    if (filePath.match(/\.(css|scss|sass|less)$/)) {
        return 'james-frontend';
    }
    // Backend files → Marcus-Backend
    if (filePath.match(/api\/.*\.(ts|js)$/)) {
        return 'marcus-backend';
    }
    if (filePath.includes('/routes/') || filePath.includes('/controllers/')) {
        return 'marcus-backend';
    }
    // Database files → Dana-Database
    if (filePath.match(/\.(sql|prisma)$/)) {
        return 'dana-database';
    }
    if (filePath.includes('/migrations/')) {
        return 'dana-database';
    }
    // ML files → Dr.AI-ML
    if (filePath.match(/\.ipynb$/)) {
        return 'dr-ai-ml';
    }
    if (filePath.includes('/ml/') && filePath.endsWith('.py')) {
        return 'dr-ai-ml';
    }
    if (filePath.includes('/models/') && filePath.endsWith('.py')) {
        return 'dr-ai-ml';
    }
    // Requirements files → Alex-BA
    if (filePath.includes('/requirements/')) {
        return 'alex-ba';
    }
    if (filePath.match(/\.feature$/)) {
        return 'alex-ba';
    }
    // MCP files → Oliver-MCP
    if (filePath.includes('/mcp/')) {
        return 'oliver-mcp';
    }
    if (filePath.match(/\.mcp\.(ts|js)$/)) {
        return 'oliver-mcp';
    }
    return undefined; // No specific agent expected
}
