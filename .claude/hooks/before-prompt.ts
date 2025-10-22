#!/usr/bin/env ts-node
/**
 * Before-Prompt Hook
 * Triggers when user submits a prompt
 * Injects context from learning system
 *
 * SDK Hook: UserPromptSubmit
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface HookInput {
  toolName: string;
  prompt: string;
  workingDirectory: string;
  sessionId: string;
}

// Read hook input from stdin
const input: HookInput = JSON.parse(readFileSync(0, 'utf-8'));

const { prompt, workingDirectory } = input;

// Load recent learnings from session history
const learningLogPath = join(workingDirectory, '.versatil/learning/session-history.jsonl');

if (existsSync(learningLogPath)) {
  try {
    const logs = readFileSync(learningLogPath, 'utf-8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-5) // Last 5 sessions
      .map(line => JSON.parse(line));

    const recentPatterns = logs
      .flatMap(log => log.patterns || [])
      .filter((pattern, index, self) => self.indexOf(pattern) === index) // Unique
      .slice(0, 3); // Top 3

    if (recentPatterns.length > 0) {
      console.log('\n💡 Recent Patterns from Learning System:');
      recentPatterns.forEach(pattern => console.log(`   • ${pattern}`));
      console.log('');
    }
  } catch (err) {
    // Ignore errors reading learning log
  }
}

// Check for project-specific context
const claudeMdPath = join(workingDirectory, 'CLAUDE.md');
if (existsSync(claudeMdPath)) {
  // CLAUDE.md exists and will be loaded by SDK automatically
  // Just notify that context is available
}

process.exit(0);
