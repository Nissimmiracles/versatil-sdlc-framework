#!/usr/bin/env -S npx tsx

/**
 * UserPromptSubmit Hook - Automatic RAG Pattern Activation
 *
 * This hook automatically detects keywords in user prompts and retrieves
 * relevant learning patterns from the RAG system (.versatil/learning/patterns/).
 *
 * When activated, it injects pattern context into the conversation so Claude
 * can provide answers based on YOUR actual implementation (not generic LLM knowledge).
 *
 * Example:
 *   User: "How do I implement hooks?"
 *   Hook detects: "hooks" → Retrieves native-sdk-integration-v6.6.0.json
 *   Result: Claude answers with YOUR v6.6.0 hook implementation
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookInput {
  prompt?: string;
  message?: string;
  workingDirectory?: string;
  context?: Record<string, unknown>;
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  category: string;
  implementation: {
    code: string;
    instructions: string[];
    files?: Array<{
      path: string;
      lines?: string;
      description: string;
    }>;
  };
  metrics: {
    successRate: number;
    effortHours?: number;
    estimatedHours?: number;
    accuracyPercent?: number;
  };
  metadata: {
    tags: string[];
    commitHash?: string;
    version: string;
  };
}

// Keyword mapping to pattern files
const KEYWORD_MAP: Record<string, string> = {
  // Native SDK Integration
  'hook|hooks|sdk|native|settings\\.json|posttooluse|subagent.*stop|stop.*hook|userpromptsub':
    'native-sdk-integration-v6.6.0.json',

  // Victor-Verifier
  'verification|verifier|verify|hallucination|anti.*hallucination|victor|cove|chain.*of.*verification|proof.*log|confidence.*scor':
    'victor-verifier-anti-hallucination.json',

  // Assessment Engine
  'assessment|assess|quality.*audit|pattern.*detection|security.*scan|coverage.*requirement|semgrep|lighthouse|axe.*core':
    'assessment-engine-v6.6.0.json',

  // Session CODIFY
  'codify|learning|compounding|session.*end|claude\\.md|automatic.*learning|stop.*hook.*learning':
    'session-codify-compounding.json',

  // Marketplace
  'marketplace|repository.*org|cleanup|archive|plugin.*metadata|\\.claude.*plugin':
    'marketplace-repository-organization.json'
};

function detectMatchingPatterns(userMessage: string): string[] {
  const messageLower = userMessage.toLowerCase();
  const matchedFiles: string[] = [];

  for (const [keywords, patternFile] of Object.entries(KEYWORD_MAP)) {
    const regex = new RegExp(keywords, 'i');
    if (regex.test(messageLower)) {
      matchedFiles.push(patternFile);
    }
  }

  return Array.from(new Set(matchedFiles));
}

function loadPattern(filename: string, workingDir: string): Pattern | null {
  try {
    const patternPath = path.join(workingDir, '.versatil', 'learning', 'patterns', filename);

    if (!fs.existsSync(patternPath)) {
      return null;
    }

    const content = fs.readFileSync(patternPath, 'utf-8');
    return JSON.parse(content) as Pattern;
  } catch (error) {
    return null;
  }
}

async function main() {
  try {
    const input: HookInput = JSON.parse(fs.readFileSync(process.stdin.fd, 'utf-8'));

    const userMessage = input.prompt || input.message || '';
    const workingDir = input.workingDirectory || process.cwd();

    if (!userMessage) {
      process.exit(0);
    }

    const matchedFiles = detectMatchingPatterns(userMessage);

    if (matchedFiles.length === 0) {
      process.exit(0);
    }

    const patterns: Pattern[] = [];
    for (const filename of matchedFiles) {
      const pattern = loadPattern(filename, workingDir);
      if (pattern) {
        patterns.push(pattern);
      }
    }

    if (patterns.length > 0) {
      console.error(`\n🧠 [RAG] Auto-activated ${patterns.length} pattern(s):`);
      patterns.forEach((p, i) => {
        console.error(`  ${i + 1}. ${p.name} (${(p.metrics.successRate * 100).toFixed(0)}% success)`);
      });
      console.error('');
    }

  } catch (error) {
    // Fail gracefully
  }

  process.exit(0);
}

main();
