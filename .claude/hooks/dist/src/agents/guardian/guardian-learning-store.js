"use strict";
/**
 * VERSATIL SDLC Framework - Guardian Learning Store
 * Stores Guardian learnings in RAG for future pattern reuse
 *
 * Called by session-codify.ts hook at end of session
 * Stores successful remediation patterns, health check insights, and issue resolutions
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
exports.storeGuardianLearnings = storeGuardianLearnings;
exports.getGuardianLearnings = getGuardianLearnings;
exports.updateLearningStats = updateLearningStats;
exports.searchGuardianLearnings = searchGuardianLearnings;
exports.getGuardianLearningStats = getGuardianLearningStats;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const guardian_logger_js_1 = require("./guardian-logger.js");
/**
 * Store Guardian learnings from session
 */
async function storeGuardianLearnings(patterns, workingDirectory) {
    const logger = guardian_logger_js_1.GuardianLogger.getInstance();
    const versatilHome = path.join(os.homedir(), '.versatil');
    const learningsFile = path.join(versatilHome, 'rag', 'guardian-learnings.jsonl');
    // Ensure directory exists
    const dir = path.dirname(learningsFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const learnings = [];
    // Extract learnings from health checks
    patterns.healthChecks.forEach(check => {
        const learning = {
            id: generateId('health', patterns.sessionId),
            category: 'health-check',
            pattern: check,
            context: determineContext(workingDirectory),
            success_rate: 100, // Initial success rate
            times_used: 1,
            avg_duration_ms: 0,
            learned_at: patterns.timestamp,
            metadata: {
                sessionId: patterns.sessionId,
                filesAffected: patterns.filesEdited,
                agentsInvolved: patterns.agentsUsed,
                tags: ['guardian', 'health-check']
            }
        };
        learnings.push(learning);
    });
    // Extract learnings from auto-fixes
    patterns.autoFixes.forEach(fix => {
        const learning = {
            id: generateId('autofix', patterns.sessionId),
            category: 'auto-remediation',
            pattern: fix,
            context: determineContext(workingDirectory),
            success_rate: 100, // Initial success rate
            times_used: 1,
            avg_duration_ms: 0,
            learned_at: patterns.timestamp,
            metadata: {
                sessionId: patterns.sessionId,
                filesAffected: patterns.filesEdited,
                agentsInvolved: patterns.agentsUsed,
                tags: ['guardian', 'auto-fix', 'remediation']
            }
        };
        learnings.push(learning);
    });
    // Extract learnings from critical issues
    patterns.criticalIssues.forEach(issue => {
        const learning = {
            id: generateId('issue', patterns.sessionId),
            category: 'issue-resolution',
            pattern: issue,
            context: determineContext(workingDirectory),
            success_rate: 100, // Assuming resolved
            times_used: 1,
            avg_duration_ms: 0,
            learned_at: patterns.timestamp,
            metadata: {
                sessionId: patterns.sessionId,
                filesAffected: patterns.filesEdited,
                agentsInvolved: patterns.agentsUsed,
                tags: ['guardian', 'critical', 'issue-resolution']
            }
        };
        learnings.push(learning);
    });
    // Agent coordination patterns
    if (patterns.agentsUsed.length > 1) {
        const learning = {
            id: generateId('coordination', patterns.sessionId),
            category: 'agent-coordination',
            pattern: `Multi-agent coordination: ${patterns.agentsUsed.join(' → ')}`,
            context: determineContext(workingDirectory),
            success_rate: 100,
            times_used: 1,
            avg_duration_ms: 0,
            learned_at: patterns.timestamp,
            metadata: {
                sessionId: patterns.sessionId,
                filesAffected: patterns.filesEdited,
                agentsInvolved: patterns.agentsUsed,
                tags: ['guardian', 'coordination', 'multi-agent']
            }
        };
        learnings.push(learning);
    }
    // Append learnings to JSONL file
    learnings.forEach(learning => {
        fs.appendFileSync(learningsFile, JSON.stringify(learning) + '\n');
    });
    // Log to Guardian
    logger.logRAGOperation({
        type: 'store',
        store: 'local',
        success: true,
        latency_ms: 0,
        details: { pattern_count: learnings.length }
    });
}
/**
 * Retrieve Guardian learnings by category
 */
async function getGuardianLearnings(category, limit = 10) {
    const versatilHome = path.join(os.homedir(), '.versatil');
    const learningsFile = path.join(versatilHome, 'rag', 'guardian-learnings.jsonl');
    if (!fs.existsSync(learningsFile)) {
        return [];
    }
    const lines = fs.readFileSync(learningsFile, 'utf-8').trim().split('\n');
    let learnings = lines
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    // Filter by category if specified
    if (category) {
        learnings = learnings.filter(l => l.category === category);
    }
    // Sort by success rate and times used
    learnings.sort((a, b) => {
        if (a.success_rate !== b.success_rate) {
            return b.success_rate - a.success_rate;
        }
        return b.times_used - a.times_used;
    });
    return learnings.slice(0, limit);
}
/**
 * Update learning statistics when pattern is reused
 */
async function updateLearningStats(learningId, success, duration_ms) {
    const versatilHome = path.join(os.homedir(), '.versatil');
    const learningsFile = path.join(versatilHome, 'rag', 'guardian-learnings.jsonl');
    if (!fs.existsSync(learningsFile)) {
        return;
    }
    const lines = fs.readFileSync(learningsFile, 'utf-8').trim().split('\n');
    const learnings = lines.map(line => JSON.parse(line));
    const learning = learnings.find(l => l.id === learningId);
    if (learning) {
        // Update statistics
        learning.times_used += 1;
        learning.last_used = new Date().toISOString();
        // Update success rate (weighted average)
        const totalAttempts = learning.times_used;
        const previousSuccesses = Math.round((learning.success_rate / 100) * (totalAttempts - 1));
        const newSuccesses = previousSuccesses + (success ? 1 : 0);
        learning.success_rate = Math.round((newSuccesses / totalAttempts) * 100);
        // Update average duration
        const totalDuration = learning.avg_duration_ms * (totalAttempts - 1) + duration_ms;
        learning.avg_duration_ms = Math.round(totalDuration / totalAttempts);
        // Rewrite file
        fs.writeFileSync(learningsFile, learnings.map(l => JSON.stringify(l)).join('\n') + '\n');
    }
}
/**
 * Search Guardian learnings by pattern text
 */
async function searchGuardianLearnings(query, limit = 5) {
    const versatilHome = path.join(os.homedir(), '.versatil');
    const learningsFile = path.join(versatilHome, 'rag', 'guardian-learnings.jsonl');
    if (!fs.existsSync(learningsFile)) {
        return [];
    }
    const lines = fs.readFileSync(learningsFile, 'utf-8').trim().split('\n');
    const learnings = lines
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    // Simple text search (case-insensitive)
    const queryLower = query.toLowerCase();
    const matches = learnings.filter(learning => {
        return (learning.pattern.toLowerCase().includes(queryLower) ||
            learning.metadata.tags.some(tag => tag.toLowerCase().includes(queryLower)));
    });
    // Sort by relevance (success rate + times used)
    matches.sort((a, b) => {
        const scoreA = a.success_rate + a.times_used * 10;
        const scoreB = b.success_rate + b.times_used * 10;
        return scoreB - scoreA;
    });
    return matches.slice(0, limit);
}
/**
 * Get Guardian learning statistics
 */
async function getGuardianLearningStats() {
    const versatilHome = path.join(os.homedir(), '.versatil');
    const learningsFile = path.join(versatilHome, 'rag', 'guardian-learnings.jsonl');
    if (!fs.existsSync(learningsFile)) {
        return {
            total_learnings: 0,
            by_category: {},
            avg_success_rate: 0,
            most_used: [],
            recent: []
        };
    }
    const lines = fs.readFileSync(learningsFile, 'utf-8').trim().split('\n');
    const learnings = lines
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    // Count by category
    const by_category = {};
    learnings.forEach(l => {
        by_category[l.category] = (by_category[l.category] || 0) + 1;
    });
    // Calculate average success rate
    const total_success = learnings.reduce((sum, l) => sum + l.success_rate, 0);
    const avg_success_rate = learnings.length > 0 ? Math.round(total_success / learnings.length) : 0;
    // Most used learnings
    const most_used = [...learnings]
        .sort((a, b) => b.times_used - a.times_used)
        .slice(0, 5);
    // Recent learnings
    const recent = [...learnings]
        .sort((a, b) => new Date(b.learned_at).getTime() - new Date(a.learned_at).getTime())
        .slice(0, 5);
    return {
        total_learnings: learnings.length,
        by_category,
        avg_success_rate,
        most_used,
        recent
    };
}
/**
 * Helper functions
 */
function generateId(prefix, sessionId) {
    const timestamp = Date.now();
    return `${prefix}-${sessionId}-${timestamp}`;
}
function determineContext(workingDirectory) {
    // Check if in framework repository
    if (workingDirectory.includes('VERSATIL SDLC FW') ||
        fs.existsSync(path.join(workingDirectory, '.versatil-framework-repo'))) {
        return 'FRAMEWORK_CONTEXT';
    }
    // Check if in user project
    if (fs.existsSync(path.join(workingDirectory, '.versatil-project.json'))) {
        return 'PROJECT_CONTEXT';
    }
    return 'SHARED';
}
