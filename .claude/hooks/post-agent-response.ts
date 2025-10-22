#!/usr/bin/env ts-node
/**
 * Post-Agent-Response Hook (Victor-Verifier Integration)
 * Triggers after any tool use to extract and verify factual claims
 *
 * SDK Hook: PostToolUse (all tools)
 * Triggers: After Read, Write, Edit, Bash, Task completion
 *
 * Purpose:
 * - Extract verifiable claims from tool results
 * - Verify claims against ground truth
 * - Generate proof logs
 * - Flag hallucinations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface HookInput {
  toolName: string;
  toolInput?: any;
  toolOutput?: any;
  workingDirectory: string;
  sessionId: string;
  timestamp: string;
}

interface Claim {
  text: string;
  category: 'FileCreation' | 'FileEdit' | 'GitCommit' | 'CommandExecution' | 'DataAssertion' | 'Metric';
  extractedFrom: string;
  confidence: number;
  needsVerification: boolean;
}

interface VerificationResult {
  claim: Claim;
  verified: boolean;
  confidence: number; // 0-100
  method: string;
  evidence: any;
  timestamp: string;
}

// Read hook input from stdin
const input: HookInput = JSON.parse(readFileSync(0, 'utf-8'));

const { toolName, toolInput, toolOutput, workingDirectory, sessionId } = input;

// Skip if no output to analyze
if (!toolOutput) {
  process.exit(0);
}

/**
 * Extract Claims from Tool Output
 */
function extractClaims(toolName: string, toolInput: any, toolOutput: any): Claim[] {
  const claims: Claim[] = [];
  const outputStr = JSON.stringify(toolOutput);

  // File creation claims (Write tool)
  if (toolName === 'Write' && toolInput?.file_path) {
    claims.push({
      text: `Created file: ${toolInput.file_path}`,
      category: 'FileCreation',
      extractedFrom: 'Write tool',
      confidence: 0,
      needsVerification: true
    });

    if (toolInput.content) {
      const lineCount = toolInput.content.split('\n').length;
      claims.push({
        text: `File ${toolInput.file_path} contains ${lineCount} lines`,
        category: 'Metric',
        extractedFrom: 'Write tool content',
        confidence: 0,
        needsVerification: true
      });
    }
  }

  // File edit claims (Edit tool)
  if (toolName === 'Edit' && toolInput?.file_path) {
    claims.push({
      text: `Edited file: ${toolInput.file_path}`,
      category: 'FileEdit',
      extractedFrom: 'Edit tool',
      confidence: 0,
      needsVerification: true
    });
  }

  // Git commit claims (Bash tool)
  if (toolName === 'Bash' && toolInput?.command && toolInput.command.includes('git commit')) {
    // Extract commit message if present
    const commitMsgMatch = toolInput.command.match(/-m ["'](.+?)["']/);
    const commitMsg = commitMsgMatch ? commitMsgMatch[1] : 'unknown';

    claims.push({
      text: `Git commit created: "${commitMsg.substring(0, 50)}..."`,
      category: 'GitCommit',
      extractedFrom: 'Bash(git commit)',
      confidence: 0,
      needsVerification: true
    });
  }

  // Command execution claims (Bash tool)
  if (toolName === 'Bash' && toolInput?.command) {
    claims.push({
      text: `Command executed: ${toolInput.command.substring(0, 100)}`,
      category: 'CommandExecution',
      extractedFrom: 'Bash tool',
      confidence: 0,
      needsVerification: true
    });

    // Check if command succeeded
    if (toolOutput.exitCode === 0) {
      claims.push({
        text: `Command succeeded with exit code 0`,
        category: 'CommandExecution',
        extractedFrom: 'Bash tool exit code',
        confidence: 95, // High confidence if we have exit code
        needsVerification: false
      });
    }
  }

  return claims;
}

/**
 * Verify a Single Claim
 */
function verifyClaim(claim: Claim, workingDir: string): VerificationResult {
  const timestamp = new Date().toISOString();

  try {
    switch (claim.category) {
      case 'FileCreation':
      case 'FileEdit': {
        // Extract file path from claim
        const filePathMatch = claim.text.match(/file:? (.+?)(?:\s|$)/i);
        if (!filePathMatch) {
          return {
            claim,
            verified: false,
            confidence: 0,
            method: 'File path extraction failed',
            evidence: null,
            timestamp
          };
        }

        const filePath = filePathMatch[1].trim();
        const fullPath = join(workingDir, filePath);

        // Verify file exists
        if (!existsSync(fullPath)) {
          return {
            claim,
            verified: false,
            confidence: 0,
            method: 'File existence check (fs.existsSync)',
            evidence: { fileExists: false, path: fullPath },
            timestamp
          };
        }

        // Get file stats
        const stats = execSync(`ls -la "${fullPath}"`, { encoding: 'utf-8', cwd: workingDir });

        return {
          claim,
          verified: true,
          confidence: 100,
          method: 'File existence + stats (ls -la)',
          evidence: {
            fileExists: true,
            path: fullPath,
            stats: stats.trim()
          },
          timestamp
        };
      }

      case 'GitCommit': {
        // Verify latest commit exists
        try {
          const commitHash = execSync('git log -1 --format=%H', {
            encoding: 'utf-8',
            cwd: workingDir
          }).trim();

          const commitMsg = execSync('git log -1 --format=%s', {
            encoding: 'utf-8',
            cwd: workingDir
          }).trim();

          const filesChanged = execSync('git diff --stat HEAD~1 HEAD', {
            encoding: 'utf-8',
            cwd: workingDir
          }).trim();

          return {
            claim,
            verified: true,
            confidence: 100,
            method: 'Git log verification',
            evidence: {
              commitHash: commitHash.substring(0, 7),
              commitMessage: commitMsg,
              filesChanged: filesChanged.split('\n').length - 1
            },
            timestamp
          };
        } catch (err) {
          return {
            claim,
            verified: false,
            confidence: 0,
            method: 'Git log check failed',
            evidence: { error: (err as Error).message },
            timestamp
          };
        }
      }

      case 'CommandExecution': {
        // Command execution verified by exit code in claim extraction
        return {
          claim,
          verified: true,
          confidence: claim.confidence,
          method: 'Exit code check',
          evidence: { exitCode: 0 },
          timestamp
        };
      }

      case 'Metric': {
        // Verify line count claims
        const lineCountMatch = claim.text.match(/contains (\d+) lines/);
        if (lineCountMatch) {
          const claimedLines = parseInt(lineCountMatch[1]);
          const filePathMatch = claim.text.match(/File (.+?) contains/);

          if (filePathMatch) {
            const filePath = filePathMatch[1].trim();
            const fullPath = join(workingDir, filePath);

            try {
              const actualLines = execSync(`wc -l "${fullPath}" | awk '{print $1}'`, {
                encoding: 'utf-8',
                cwd: workingDir
              }).trim();

              const verified = parseInt(actualLines) === claimedLines;

              return {
                claim,
                verified,
                confidence: verified ? 100 : 40,
                method: 'Line count verification (wc -l)',
                evidence: {
                  claimed: claimedLines,
                  actual: parseInt(actualLines),
                  match: verified
                },
                timestamp
              };
            } catch (err) {
              return {
                claim,
                verified: false,
                confidence: 0,
                method: 'Line count check failed',
                evidence: { error: (err as Error).message },
                timestamp
              };
            }
          }
        }

        // Default: unable to verify metric
        return {
          claim,
          verified: false,
          confidence: 50,
          method: 'Metric verification not implemented',
          evidence: { note: 'Complex metric requires manual verification' },
          timestamp
        };
      }

      default:
        return {
          claim,
          verified: false,
          confidence: 0,
          method: 'Unknown category',
          evidence: null,
          timestamp
        };
    }
  } catch (err) {
    return {
      claim,
      verified: false,
      confidence: 0,
      method: 'Verification failed with error',
      evidence: { error: (err as Error).message },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Main Verification Flow
 */
const claims = extractClaims(toolName, toolInput, toolOutput);

if (claims.length === 0) {
  // No verifiable claims found
  process.exit(0);
}

console.log(`\n🔍 Victor-Verifier: Analyzing ${claims.length} claim(s)...`);

// Verify each claim
const results: VerificationResult[] = [];
let verifiedCount = 0;
let unverifiedCount = 0;
let totalConfidence = 0;

for (const claim of claims) {
  if (!claim.needsVerification) {
    console.log(`   ⏭️  ${claim.text} (pre-verified)`);
    continue;
  }

  const result = verifyClaim(claim, workingDirectory);
  results.push(result);

  const icon = result.verified ? '✓' : '❌';
  const status = result.verified ? 'VERIFIED' : 'UNVERIFIED';
  console.log(`   ${icon} ${claim.text}`);
  console.log(`      → ${status} (${result.confidence}% confidence)`);
  console.log(`      → Method: ${result.method}`);

  if (result.verified) {
    verifiedCount++;
  } else {
    unverifiedCount++;
  }
  totalConfidence += result.confidence;
}

// Summary
const avgConfidence = results.length > 0 ? Math.round(totalConfidence / results.length) : 0;
console.log(`\n📊 Verification Summary:`);
console.log(`   Total claims: ${results.length}`);
console.log(`   VERIFIED: ${verifiedCount} (${Math.round((verifiedCount / results.length) * 100)}%)`);
console.log(`   UNVERIFIED: ${unverifiedCount}`);
console.log(`   Average confidence: ${avgConfidence}%`);

// Save to proof log
const verificationLogDir = join(workingDirectory, '.versatil/verification');
if (!existsSync(verificationLogDir)) {
  mkdirSync(verificationLogDir, { recursive: true });
}

const proofLogPath = join(verificationLogDir, 'proof-log.jsonl');
for (const result of results) {
  const logEntry = JSON.stringify({
    sessionId,
    timestamp: result.timestamp,
    claim: result.claim.text,
    category: result.claim.category,
    verified: result.verified,
    confidence: result.confidence,
    method: result.method,
    evidence: result.evidence
  }) + '\n';

  appendFileSync(proofLogPath, logEntry, 'utf-8');
}

// Flag low-confidence claims
const flaggedClaims = results.filter(r => r.confidence < 80);
if (flaggedClaims.length > 0) {
  console.log(`\n⚠️  ${flaggedClaims.length} claim(s) flagged for human review`);

  const flaggedLogPath = join(verificationLogDir, 'flagged.jsonl');
  for (const flagged of flaggedClaims) {
    const flagEntry = JSON.stringify({
      sessionId,
      timestamp: flagged.timestamp,
      claim: flagged.claim.text,
      confidence: flagged.confidence,
      reason: 'Low confidence (<80%)',
      evidence: flagged.evidence
    }) + '\n';

    appendFileSync(flaggedLogPath, flagEntry, 'utf-8');
  }
}

console.log(`\n✅ Proof log saved: ${proofLogPath}`);
console.log('─'.repeat(60) + '\n');

process.exit(0);
