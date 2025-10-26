#!/usr/bin/env -S npx tsx
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

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface HookInput {
  toolName: string;
  workingDirectory: string;
  sessionId: string;
  transcriptPath?: string;
  sessionSummary?: {
    filesEdited: string[];
    commandsRun: string[];
    agentsUsed: string[];
    duration: number;
  };
}

// Read hook input from stdin
const input: HookInput = JSON.parse(readFileSync(0, 'utf-8'));

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
const learnings: string[] = [];
const patterns: string[] = [];
const decisions: string[] = [];

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

  const claudeMdPath = join(workingDirectory, 'CLAUDE.md');
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
    appendFileSync(claudeMdPath, codificationEntry, 'utf-8');
    console.log(`   ✅ Updated CLAUDE.md with session learnings`);

    // Also log to learning history
    const learningLogPath = join(workingDirectory, '.versatil/learning/session-history.jsonl');
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
      appendFileSync(learningLogPath, logEntry, 'utf-8');
      console.log(`   ✅ Logged to learning history`);
    } catch (err) {
      // Learning log path might not exist yet - that's ok
    }

    learnings.forEach(l => console.log(`   • ${l}`));
    patterns.forEach(p => console.log(`   • ${p}`));
    decisions.forEach(d => console.log(`   • ${d}`));

  } catch (err) {
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
const ragConfigPath = join(workingDirectory, '.versatil/learning/rag-config.json');
if (existsSync(ragConfigPath) && patterns.length > 0) {
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

process.exit(0);
