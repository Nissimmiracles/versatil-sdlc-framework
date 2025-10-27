#!/usr/bin/env -S npx tsx
/**
 * Auto-Learn from PR (CI/CD Framework Contribution)
 *
 * Automatically extracts patterns from merged framework PRs and contributes
 * them to Public RAG. Only runs for framework repository, not user projects.
 *
 * Usage: npm run rag:contribute-from-pr
 *
 * Environment Variables:
 * - PUBLIC_RAG_PROJECT_ID: GCP project ID for Public RAG
 * - PUBLIC_RAG_DATABASE: Firestore database name
 * - GITHUB_TOKEN: GitHub API token
 * - COMMIT_SHA: Git commit SHA
 * - COMMIT_MESSAGE: Git commit message
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { RAGRouter, StorageDestination } from '../src/rag/rag-router.js';
import { getSanitizationPolicy, PatternClassification } from '../src/rag/sanitization-policy.js';
import { getPrivacyAuditor } from '../src/rag/privacy-auditor.js';

interface ExtractedPattern {
  pattern: string;
  description: string;
  code?: string;
  category: string;
  language?: string;
  framework?: string;
  filePath: string;
  effectiveness: number;
}

interface ContributionSummary {
  commitSha: string;
  commitMessage: string;
  timestamp: string;
  patternsExtracted: number;
  patternsStored: number;
  sanitized: number;
  blocked: number;
  topPatterns: Array<{
    pattern: string;
    classification: string;
    sanitized: boolean;
  }>;
  filesAnalyzed: string[];
  duration: number;
}

const startTime = Date.now();

console.log('🤖 VERSATIL Public RAG Auto-Contribution');
console.log('─'.repeat(60));

// Step 1: Verify framework context
console.log('\n1️⃣ Verifying framework context...');

function isFrameworkRepository(): boolean {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const isFramework = remoteUrl.includes('versatil-sdlc-framework') ||
                        remoteUrl.includes('VERSATIL SDLC FW');

    if (!isFramework) {
      console.log('   ⏭️  Not a framework repository - skipping contribution');
      process.exit(0);
    }

    console.log('   ✅ Framework repository detected');
    return true;
  } catch (error) {
    console.error('   ❌ Failed to verify repository context:', error);
    process.exit(1);
  }
}

isFrameworkRepository();

// Step 2: Get commit information
console.log('\n2️⃣ Getting commit information...');

const commitSha = process.env.COMMIT_SHA || execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const commitMessage = process.env.COMMIT_MESSAGE || execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();

console.log(`   Commit: ${commitSha.substring(0, 8)}`);
console.log(`   Message: ${commitMessage.split('\n')[0]}`);

// Step 3: Get PR diff
console.log('\n3️⃣ Analyzing PR changes...');

let diff: string;
try {
  diff = execSync('git diff HEAD~1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const linesChanged = diff.split('\n').filter(l => l.startsWith('+') || l.startsWith('-')).length;
  console.log(`   Lines changed: ${linesChanged}`);
} catch (error) {
  console.error('   ❌ Failed to get diff:', error);
  process.exit(1);
}

// Step 4: Detect changed files
console.log('\n4️⃣ Detecting changed files...');

const changedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
  .split('\n')
  .filter(f => f.trim().length > 0);

console.log(`   Files changed: ${changedFiles.length}`);

// Security: Block sensitive files from extraction (CRITICAL)
const blockedFiles = changedFiles.filter(f =>
  f.startsWith('.github/workflows/') ||   // Workflow files contain secrets
  f.startsWith('.github/secrets/') ||     // Secrets directory
  f.includes('secrets') ||                 // Any file with 'secrets' in path
  f.endsWith('.env') ||                    // Environment files
  f.endsWith('.env.local') ||             // Local environment files
  f.endsWith('.env.production') ||        // Production environment files
  f.includes('credentials') ||            // Credential files
  f.includes('private-key') ||            // Private key files
  f.endsWith('.pem') ||                   // Certificate files
  f.endsWith('.key')                      // Key files
);

const relevantFiles = changedFiles.filter(f => {
  // Block security-sensitive files
  if (f.startsWith('.github/workflows/')) return false;
  if (f.startsWith('.github/secrets/')) return false;
  if (f.includes('secrets')) return false;
  if (f.endsWith('.env')) return false;
  if (f.endsWith('.env.local')) return false;
  if (f.endsWith('.env.production')) return false;
  if (f.includes('credentials')) return false;
  if (f.includes('private-key')) return false;
  if (f.endsWith('.pem')) return false;
  if (f.endsWith('.key')) return false;

  // Allow framework files
  return f.startsWith('src/') ||
         f.startsWith('.claude/') ||
         f.startsWith('docs/') ||
         f.startsWith('scripts/');
});

// Security audit: Log blocked files
if (blockedFiles.length > 0) {
  console.log(`\n⚠️  Security: ${blockedFiles.length} sensitive files blocked from extraction`);
  blockedFiles.forEach(f => console.log(`   🔒 Blocked: ${f}`));

  // Ensure logs directory exists
  const logsDir = '.versatil/logs';
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  // Log to security audit
  try {
    appendFileSync(join(logsDir, 'security-audit.log'), JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'blocked_sensitive_files',
      commitSha,
      commitMessage: commitMessage.split('\n')[0],
      filesBlocked: blockedFiles.length,
      files: blockedFiles
    }) + '\n');
    console.log(`   ✅ Security audit logged: ${join(logsDir, 'security-audit.log')}`);
  } catch (error) {
    console.error(`   ⚠️  Failed to write security audit log:`, error);
  }
}

console.log(`\n   Relevant files: ${relevantFiles.length}`);
relevantFiles.slice(0, 10).forEach(f => console.log(`   • ${f}`));
if (relevantFiles.length > 10) {
  console.log(`   ... and ${relevantFiles.length - 10} more`);
}

// Step 5: Extract patterns from changed files
console.log('\n5️⃣ Extracting patterns...');

const patterns: ExtractedPattern[] = [];

// Pattern extractors by file type
function extractAgentPattern(filePath: string): ExtractedPattern | null {
  if (!filePath.startsWith('.claude/agents/') || !filePath.endsWith('.md')) return null;

  try {
    const content = readFileSync(filePath, 'utf8');
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const roleMatch = content.match(/\*\*Role\*\*:\s*(.+)/);
    const toolsMatch = content.match(/\*\*Tools\*\*:\s*(.+)/);

    if (!nameMatch) return null;

    return {
      pattern: `OPERA Agent: ${nameMatch[1]}`,
      description: `Agent definition for ${nameMatch[1]}${roleMatch ? ` - ${roleMatch[1]}` : ''}`,
      code: content.substring(0, 500), // First 500 chars
      category: 'agent-definition',
      framework: 'VERSATIL OPERA',
      filePath,
      effectiveness: 85
    };
  } catch (error) {
    return null;
  }
}

function extractCommandPattern(filePath: string): ExtractedPattern | null {
  if (!filePath.startsWith('.claude/commands/') || !filePath.endsWith('.md')) return null;

  try {
    const content = readFileSync(filePath, 'utf8');
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const descMatch = content.match(/\*\*Description\*\*:\s*(.+)/);

    if (!nameMatch) return null;

    return {
      pattern: `Slash Command: ${nameMatch[1]}`,
      description: descMatch ? descMatch[1] : `Command: ${nameMatch[1]}`,
      code: content.substring(0, 500),
      category: 'command-definition',
      framework: 'Claude Code SDK',
      filePath,
      effectiveness: 80
    };
  } catch (error) {
    return null;
  }
}

function extractSkillPattern(filePath: string): ExtractedPattern | null {
  if (!filePath.includes('.claude/skills/') || !filePath.endsWith('SKILL.md')) return null;

  try {
    const content = readFileSync(filePath, 'utf8');
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const categoryMatch = content.match(/\*\*Category\*\*:\s*(.+)/);

    if (!nameMatch) return null;

    return {
      pattern: `Skill: ${nameMatch[1]}`,
      description: `Progressive disclosure skill${categoryMatch ? ` (${categoryMatch[1]})` : ''}`,
      code: content.substring(0, 500),
      category: 'skill-definition',
      framework: 'VERSATIL Skills',
      filePath,
      effectiveness: 90
    };
  } catch (error) {
    return null;
  }
}

function extractCodePattern(filePath: string): ExtractedPattern | null {
  if (!filePath.startsWith('src/') || !filePath.endsWith('.ts')) return null;

  try {
    const content = readFileSync(filePath, 'utf8');

    // Extract exported functions/classes
    const exportMatches = content.matchAll(/export\s+(async\s+)?(?:function|class)\s+(\w+)/g);
    const exports = Array.from(exportMatches);

    if (exports.length === 0) return null;

    // Get first JSDoc comment
    const jsdocMatch = content.match(/\/\*\*\s*\n([\s\S]*?)\*\//);
    const description = jsdocMatch
      ? jsdocMatch[1].split('\n').map(l => l.trim().replace(/^\*\s*/, '')).join(' ').trim()
      : `Code from ${filePath}`;

    return {
      pattern: `TypeScript Service: ${exports[0][2]}`,
      description: description.substring(0, 200),
      code: content.substring(0, 1000), // First 1000 chars
      category: 'code-pattern',
      language: 'TypeScript',
      filePath,
      effectiveness: 75
    };
  } catch (error) {
    return null;
  }
}

// Extract patterns from all relevant files
for (const file of relevantFiles.slice(0, 20)) {  // Limit to top 20 files
  const pattern =
    extractAgentPattern(file) ||
    extractCommandPattern(file) ||
    extractSkillPattern(file) ||
    extractCodePattern(file);

  if (pattern) {
    patterns.push(pattern);
  }
}

console.log(`   Patterns extracted: ${patterns.length}`);
patterns.slice(0, 5).forEach(p => console.log(`   • ${p.pattern}`));
if (patterns.length > 5) {
  console.log(`   ... and ${patterns.length - 5} more`);
}

if (patterns.length === 0) {
  console.log('\n   ℹ️  No patterns extracted - skipping contribution');
  process.exit(0);
}

// Step 6: Classify and sanitize patterns
console.log('\n6️⃣ Classifying and sanitizing patterns...');

const ragRouter = RAGRouter.getInstance();
const sanitizationPolicy = getSanitizationPolicy();
const privacyAuditor = getPrivacyAuditor();

interface ClassifiedPattern extends ExtractedPattern {
  classification: PatternClassification;
  sanitized?: string;
  sanitizationConfidence?: number;
}

const classifiedPatterns: ClassifiedPattern[] = [];

for (const pattern of patterns) {
  const policyDecision = await sanitizationPolicy.evaluatePattern({
    pattern: pattern.pattern,
    description: pattern.description,
    code: pattern.code,
    agent: 'system',
    category: pattern.category
  });

  classifiedPatterns.push({
    ...pattern,
    classification: policyDecision.classification,
    sanitized: policyDecision.sanitizationResult?.sanitized,
    sanitizationConfidence: policyDecision.sanitizationResult?.confidence
  });
}

const publicSafe = classifiedPatterns.filter(p => p.classification === PatternClassification.PUBLIC_SAFE).length;
const requiresSanitization = classifiedPatterns.filter(p => p.classification === PatternClassification.REQUIRES_SANITIZATION).length;
const blocked = classifiedPatterns.filter(p =>
  p.classification === PatternClassification.PRIVATE_ONLY ||
  p.classification === PatternClassification.CREDENTIALS ||
  p.classification === PatternClassification.UNSANITIZABLE
).length;

console.log(`   Public-safe: ${publicSafe}`);
console.log(`   Requires sanitization: ${requiresSanitization}`);
console.log(`   Blocked: ${blocked}`);

// Step 7: Store in Public RAG
console.log('\n7️⃣ Storing patterns in Public RAG...');

let stored = 0;
let sanitized = 0;

for (const pattern of classifiedPatterns) {
  // Skip blocked patterns
  if (pattern.classification === PatternClassification.PRIVATE_ONLY ||
      pattern.classification === PatternClassification.CREDENTIALS ||
      pattern.classification === PatternClassification.UNSANITIZABLE) {
    continue;
  }

  try {
    // Prepare pattern data
    const patternData = {
      pattern: pattern.pattern,
      description: pattern.classification === PatternClassification.REQUIRES_SANITIZATION && pattern.sanitized
        ? pattern.sanitized
        : pattern.description,
      code: pattern.code,
      agent: 'system',
      category: pattern.category,
      effectiveness: pattern.effectiveness,
      metadata: {
        language: pattern.language,
        framework: pattern.framework,
        filePath: pattern.filePath,
        commitSha,
        commitMessage: commitMessage.split('\n')[0],
        timestamp: new Date().toISOString(),
        source: 'ci-cd-auto-contribution'
      }
    };

    // Privacy audit before storage
    const auditResult = await privacyAuditor.validatePattern(patternData as any);
    if (!auditResult.isSafe) {
      console.log(`   ⚠️  Pattern blocked by privacy audit: ${pattern.pattern}`);
      continue;
    }

    // Store in Public RAG
    await ragRouter.storePattern(patternData, StorageDestination.PUBLIC_ONLY);

    stored++;

    if (pattern.classification === PatternClassification.REQUIRES_SANITIZATION) {
      sanitized++;
    }

    console.log(`   ✅ Stored: ${pattern.pattern}${pattern.classification === PatternClassification.REQUIRES_SANITIZATION ? ' (sanitized)' : ''}`);
  } catch (error) {
    console.error(`   ❌ Failed to store pattern: ${pattern.pattern}`, error);
  }
}

console.log(`\n   Total stored: ${stored}`);
console.log(`   Sanitized: ${sanitized}`);

// Step 8: Generate contribution summary
console.log('\n8️⃣ Generating contribution summary...');

const summary: ContributionSummary = {
  commitSha,
  commitMessage: commitMessage.split('\n')[0],
  timestamp: new Date().toISOString(),
  patternsExtracted: patterns.length,
  patternsStored: stored,
  sanitized,
  blocked,
  topPatterns: classifiedPatterns
    .filter(p => p.classification === PatternClassification.PUBLIC_SAFE ||
                  p.classification === PatternClassification.REQUIRES_SANITIZATION)
    .slice(0, 10)
    .map(p => ({
      pattern: p.pattern,
      classification: p.classification,
      sanitized: p.classification === PatternClassification.REQUIRES_SANITIZATION
    })),
  filesAnalyzed: relevantFiles,
  duration: Date.now() - startTime
};

// Ensure logs directory exists
const logsDir = '.versatil/logs';
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Write summary files
const summaryPath = join(logsDir, 'rag-contribution-summary.json');
const logPath = join(logsDir, `rag-contribution-${commitSha.substring(0, 8)}.json`);

writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
writeFileSync(logPath, JSON.stringify(summary, null, 2));

console.log(`   ✅ Summary saved: ${summaryPath}`);
console.log(`   ✅ Log saved: ${logPath}`);

// Step 9: Final report
console.log('\n' + '─'.repeat(60));
console.log('✅ Public RAG Contribution Complete');
console.log('─'.repeat(60));
console.log(`📊 Patterns extracted: ${patterns.length}`);
console.log(`✅ Patterns stored: ${stored}`);
console.log(`🔒 Patterns sanitized: ${sanitized}`);
console.log(`⏱️  Duration: ${Math.round(summary.duration / 1000)}s`);
console.log('─'.repeat(60));
console.log('🌍 These patterns are now available to all VERSATIL users!');
console.log('─'.repeat(60) + '\n');

process.exit(0);
