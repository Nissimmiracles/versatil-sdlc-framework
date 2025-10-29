#!/usr/bin/env -S npx tsx
"use strict";
/**
 * Session-Codify Hook (COMPOUNDING ENGINEERING - THE MISSING PIECE!)
 * Triggers at end of session to capture learnings
 * This is what makes Every Inc's compounding engineering work
 *
 * SDK Hook: Stop
 * Triggers: When Claude finishes responding (session end)
 *
 * CODIFY Phase:
 * 1. Analyze session transcript (decisions, bugs fixed, patterns)
 * 2. Extract learnings (code style, architecture, bugs)
 * 3. Update CLAUDE.md with new rules
 * 4. Update agent knowledge bases via Feedback-Codifier
 * 5. Update RAG graph with new patterns
 *
 * This creates the compounding effect:
 * - Bug fixed → Lesson learned → Never happens again
 * - Pattern used → Captured → Reused automatically
 * - Decision made → Documented → Applied to future work
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
const fs_1 = require("fs");
const path_1 = require("path");
// Read hook input from stdin
const input = JSON.parse((0, fs_1.readFileSync)(0, 'utf-8'));
const { workingDirectory, sessionId, transcriptPath, sessionSummary } = input;
console.log('\n🧠 CODIFY Phase: Capturing session learnings for compounding engineering');
console.log(`   Session ID: ${sessionId}`);
// Skip if session was very short (< 30 seconds) - likely not meaningful
if (sessionSummary?.duration && sessionSummary.duration < 30) {
    console.log('   ⏭️  Session too short - skipping codification');
    process.exit(0);
}
/**
 * Step 1: Analyze Session Activity
 */
const filesEdited = sessionSummary?.filesEdited || [];
const commandsRun = sessionSummary?.commandsRun || [];
const agentsUsed = sessionSummary?.agentsUsed || [];
if (filesEdited.length === 0 && commandsRun.length === 0) {
    console.log('   ⏭️  No significant activity - skipping codification');
    process.exit(0);
}
console.log(`\n📊 Session Analysis:`);
console.log(`   Files edited: ${filesEdited.length}`);
console.log(`   Commands run: ${commandsRun.length}`);
console.log(`   Agents used: ${agentsUsed.length > 0 ? agentsUsed.join(', ') : 'none'}`);
/**
 * Step 2: Extract Learnings
 */
const learnings = [];
const patterns = [];
const decisions = [];
// Detect patterns from files edited
const sourceFiles = filesEdited.filter(f => f.match(/\.(ts|tsx|js|jsx|py|rb|go|java)$/));
const testFiles = filesEdited.filter(f => f.match(/\.(test|spec)\./));
const configFiles = filesEdited.filter(f => f.match(/\.(json|yaml|yml|toml|config)$/));
if (testFiles.length > 0 && sourceFiles.length > 0) {
    learnings.push('Test-driven development practiced (tests + implementation files edited together)');
    patterns.push('TDD: Edit source file → Edit corresponding test file');
}
if (configFiles.length > 0) {
    learnings.push(`Configuration updated: ${configFiles.join(', ')}`);
}
// Detect patterns from commands run
const testCommands = commandsRun.filter(cmd => cmd.match(/npm (test|run test)/));
const buildCommands = commandsRun.filter(cmd => cmd.match(/npm (run )?build/));
const gitCommands = commandsRun.filter(cmd => cmd.match(/git (commit|push)/));
if (testCommands.length > 0) {
    patterns.push('Tests run during session - quality-first approach');
}
if (buildCommands.length > 0) {
    patterns.push('Build validated during session - production readiness checked');
}
if (gitCommands.length > 0) {
    patterns.push('Changes committed during session - incremental progress saved');
}
// Detect technology stack
const hasFrontend = filesEdited.some(f => f.match(/\.(tsx|jsx|vue|svelte)$/));
const hasBackend = filesEdited.some(f => f.match(/\/(api|routes|controllers|server)\//));
const hasDatabase = filesEdited.some(f => f.match(/\.(sql|prisma)|migrations/));
if (hasFrontend && hasBackend && hasDatabase) {
    patterns.push('Three-tier development: Frontend + Backend + Database edited together');
    decisions.push('Full-stack feature development - coordinated changes across all layers');
}
/**
 * Step 3: Update CLAUDE.md with Learnings (if significant)
 */
if (learnings.length > 0 || patterns.length > 0 || decisions.length > 0) {
    console.log(`\n💡 Learnings Captured:`);
    const claudeMdPath = (0, path_1.join)(workingDirectory, 'CLAUDE.md');
    const timestamp = new Date().toISOString().split('T')[0];
    const codificationEntry = `

---

## Session Learnings (${timestamp})

${learnings.length > 0 ? `### Key Learnings\n${learnings.map(l => `- ${l}`).join('\n')}\n` : ''}
${patterns.length > 0 ? `### Patterns Observed\n${patterns.map(p => `- ${p}`).join('\n')}\n` : ''}
${decisions.length > 0 ? `### Decisions Made\n${decisions.map(d => `- ${d}`).join('\n')}\n` : ''}
`;
    try {
        // Append to CLAUDE.md
        (0, fs_1.appendFileSync)(claudeMdPath, codificationEntry, 'utf-8');
        console.log(`   ✅ Updated CLAUDE.md with session learnings`);
        // Also log to learning history
        const learningLogPath = (0, path_1.join)(workingDirectory, '.versatil/learning/session-history.jsonl');
        const logEntry = JSON.stringify({
            sessionId,
            timestamp,
            filesEdited: filesEdited.length,
            commandsRun: commandsRun.length,
            learnings,
            patterns,
            decisions
        }) + '\n';
        try {
            (0, fs_1.appendFileSync)(learningLogPath, logEntry, 'utf-8');
            console.log(`   ✅ Logged to learning history`);
        }
        catch (err) {
            // Learning log path might not exist yet - that's ok
        }
        learnings.forEach(l => console.log(`   • ${l}`));
        patterns.forEach(p => console.log(`   • ${p}`));
        decisions.forEach(d => console.log(`   • ${d}`));
    }
    catch (err) {
        console.error(`   ⚠️  Could not update CLAUDE.md: ${err}`);
    }
}
/**
 * Step 4: Suggest Feedback-Codifier Agent Invocation (Manual for now)
 */
if (agentsUsed.length > 0 || learnings.length > 3) {
    console.log(`\n🤖 Recommendation: Run Feedback-Codifier agent to update agent knowledge bases`);
    console.log(`   This will systematically enhance agent prompts based on session learnings`);
}
/**
 * Step 5: RAG Graph Update (if GraphRAG system is configured)
 */
const ragConfigPath = (0, path_1.join)(workingDirectory, '.versatil/learning/rag-config.json');
if ((0, fs_1.existsSync)(ragConfigPath) && patterns.length > 0) {
    console.log(`\n📊 RAG Graph: ${patterns.length} patterns ready for indexing`);
    console.log(`   Run: npm run learning:index to update RAG graph`);
}
/**
 * Compounding Engineering Metrics
 */
console.log(`\n🚀 Compounding Engineering Status:`);
console.log(`   Session learnings captured: ${learnings.length + patterns.length + decisions.length}`);
console.log(`   Next session will be faster by reusing these patterns`);
console.log('\n' + '─'.repeat(60));
console.log('💡 "Each feature makes the next one easier - that\'s compounding engineering"');
console.log('─'.repeat(60) + '\n');
/**
 * Phase 7.7.0: Store Guardian learnings in RAG
 * If Guardian was involved (health checks, auto-remediation), store learnings
 */
(async () => {
    try {
        const { storeGuardianLearnings } = await Promise.resolve().then(() => __importStar(require('../../src/agents/guardian/guardian-learning-store.js')));
        // Extract Guardian-related patterns from session
        const guardianPatterns = {
            healthChecks: commandsRun.filter(cmd => cmd.includes('guardian') || cmd.includes('health')),
            autoFixes: learnings.filter(l => l.includes('auto-fix') || l.includes('remediation')),
            criticalIssues: decisions.filter(d => d.includes('critical') || d.includes('issue')),
            sessionId,
            timestamp: new Date().toISOString(),
            filesEdited,
            agentsUsed
        };
        if (guardianPatterns.healthChecks.length > 0 || guardianPatterns.autoFixes.length > 0) {
            await storeGuardianLearnings(guardianPatterns, workingDirectory);
            console.log('   ✅ Guardian learnings stored in RAG');
        }
    }
    catch (error) {
        // Non-blocking - don't fail hook if Guardian learning storage fails
        console.error(`   ⚠️  Guardian learning storage failed: ${error instanceof Error ? error.message : String(error)}`);
    }
})();
/**
 * Phase 7.8.0: Auto-Learning with Public/Private RAG Separation
 * Automatically store session patterns in RAG with user choice
 */
(async () => {
    try {
        // Only trigger if meaningful patterns were detected
        if (patterns.length === 0 && learnings.length === 0) {
            process.exit(0);
            return;
        }
        const { RAGRouter } = await Promise.resolve().then(() => __importStar(require('../../src/rag/rag-router.js')));
        const { getSanitizationPolicy } = await Promise.resolve().then(() => __importStar(require('../../src/rag/sanitization-policy.js')));
        const ragRouter = RAGRouter.getInstance();
        const sanitizationPolicy = getSanitizationPolicy();
        // Classify each pattern for storage destination
        const classifiedPatterns = await Promise.all(patterns.map(async (pattern) => {
            const policyDecision = await sanitizationPolicy.evaluatePattern({
                pattern,
                description: pattern,
                agent: agentsUsed[0] || 'system',
                category: 'session-learning'
            });
            return {
                pattern,
                classification: policyDecision.classification,
                destination: policyDecision.destination,
                sanitized: policyDecision.sanitizationResult?.sanitized || pattern,
                confidence: policyDecision.sanitizationResult?.confidence || 0
            };
        }));
        // Count patterns by classification
        const publicSafe = classifiedPatterns.filter(p => p.classification === 'public_safe').length;
        const requiresSanitization = classifiedPatterns.filter(p => p.classification === 'requires_sanitization').length;
        const privateOnly = classifiedPatterns.filter(p => p.classification === 'private_only' ||
            p.classification === 'credentials' ||
            p.classification === 'unsanitizable').length;
        // Display storage destination prompt
        console.log(`\n📊 Session Patterns Detected: ${patterns.length}`);
        console.log(`   🌍 Public-safe: ${publicSafe}`);
        console.log(`   ⚙️  Requires sanitization: ${requiresSanitization}`);
        console.log(`   🔒 Private-only: ${privateOnly}`);
        if (publicSafe > 0 || requiresSanitization > 0) {
            console.log(`\n💡 Contribute to Public RAG?`);
            console.log(`   These learnings could help other VERSATIL users:`);
            // Show preview of public-safe patterns
            classifiedPatterns
                .filter(p => p.classification === 'public_safe' || p.classification === 'requires_sanitization')
                .slice(0, 3)
                .forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.pattern}`);
                if (p.classification === 'requires_sanitization') {
                    console.log(`      → Will be sanitized (${p.confidence}% confidence)`);
                }
            });
            console.log(`\n   Storage options:`);
            console.log(`   1. 🔒 Private only (default) - Your patterns stay private`);
            console.log(`   2. 🌍 Public only - Share sanitized patterns with community`);
            console.log(`   3. Both - Best of both worlds (private priority + public contribution)`);
            console.log(`\n   💡 Tip: Run /learn command to review and store these patterns`);
            console.log(`   💡 Configure Private RAG: npm run setup:private-rag`);
        }
        else {
            console.log(`\n🔒 All patterns are private-only - will store in Private RAG when configured`);
            console.log(`   💡 Configure Private RAG: npm run setup:private-rag`);
        }
    }
    catch (error) {
        // Non-blocking - don't fail hook if auto-learning fails
        console.error(`   ⚠️  Auto-learning failed: ${error instanceof Error ? error.message : String(error)}`);
    }
})();
process.exit(0);
