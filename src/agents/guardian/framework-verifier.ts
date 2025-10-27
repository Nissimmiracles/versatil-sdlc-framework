/**
 * VERSATIL SDLC Framework - Framework Layer Verifier
 *
 * Verifies issues in the Framework Layer (infrastructure):
 * - Build system (TypeScript compilation, npm scripts)
 * - Agent system (agent definitions, handoff contracts)
 * - Hook system (lifecycle hooks, event handlers)
 * - MCP server (tool definitions, server health)
 * - RAG system (GraphRAG, Vector store, RAG Router)
 * - Flywheel orchestration (SDLC phases, state machine)
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { HealthIssue } from './types.js';

export interface FrameworkVerification {
  claim: string;
  verified: boolean;
  method: string;
  confidence: number; // 0-100
  evidence?: {
    command?: string;
    exit_code?: number;
    output?: string;
    file_exists?: boolean;
    error_details?: string;
  };
}

export interface FrameworkVerificationResult {
  issue_id: string;
  layer: 'framework';
  verified: boolean;
  confidence: number; // 0-100 average
  verifications: FrameworkVerification[];
  recommended_fix?: string;
}

/**
 * Verify framework layer issue using ground truth methods
 */
export async function verifyFrameworkIssue(
  issue: HealthIssue,
  workingDir: string
): Promise<FrameworkVerificationResult> {
  const verifications: FrameworkVerification[] = [];

  // Extract claims from issue description
  const claims = extractClaims(issue);

  for (const claim of claims) {
    // Build system verification
    if (claim.type === 'build-failure') {
      verifications.push(await verifyBuildFailure(claim, workingDir));
    } else if (claim.type === 'typescript-error') {
      verifications.push(await verifyTypeScriptError(claim, workingDir));
    }

    // Agent system verification
    else if (claim.type === 'agent-invalid') {
      verifications.push(await verifyAgentDefinition(claim, workingDir));
    }

    // Hook system verification
    else if (claim.type === 'hook-not-found') {
      verifications.push(await verifyHookRegistration(claim, workingDir));
    }

    // MCP server verification
    else if (claim.type === 'mcp-error') {
      verifications.push(await verifyMCPServer(claim, workingDir));
    }

    // RAG system verification
    else if (claim.type === 'rag-health') {
      verifications.push(await verifyRAGHealth(claim, workingDir));
    }
  }

  // Calculate overall confidence
  const avgConfidence =
    verifications.length > 0
      ? Math.round(
          verifications.reduce((sum, v) => sum + v.confidence, 0) / verifications.length
        )
      : 0;

  // Determine if issue is verified
  const verified = verifications.length > 0 && verifications.every(v => v.verified);

  return {
    issue_id: issue.id || `framework-${Date.now()}`,
    layer: 'framework',
    verified,
    confidence: avgConfidence,
    verifications,
    recommended_fix: verified ? generateFrameworkFix(issue, verifications) : undefined
  };
}

/**
 * Extract verifiable claims from issue
 */
function extractClaims(issue: HealthIssue): Array<{
  type: string;
  description: string;
  file?: string;
  line?: number;
}> {
  const claims: Array<{ type: string; description: string; file?: string; line?: number }> = [];

  const desc = issue.description.toLowerCase();
  const component = issue.component.toLowerCase();

  // Build failures
  if (desc.includes('build') && desc.includes('fail')) {
    claims.push({ type: 'build-failure', description: issue.description });
  }

  // TypeScript errors
  if (desc.includes('typescript') || desc.includes('tsc')) {
    const fileMatch = issue.description.match(/(\S+\.ts)(?::(\d+))?/);
    claims.push({
      type: 'typescript-error',
      description: issue.description,
      file: fileMatch?.[1],
      line: fileMatch?.[2] ? parseInt(fileMatch[2]) : undefined
    });
  }

  // Agent system
  if (component.includes('agent') || desc.includes('agent')) {
    claims.push({ type: 'agent-invalid', description: issue.description });
  }

  // Hook system
  if (component.includes('hook') || desc.includes('hook')) {
    claims.push({ type: 'hook-not-found', description: issue.description });
  }

  // MCP server
  if (component.includes('mcp') || desc.includes('mcp')) {
    claims.push({ type: 'mcp-error', description: issue.description });
  }

  // RAG system
  if (component.includes('rag') || desc.includes('rag')) {
    claims.push({ type: 'rag-health', description: issue.description });
  }

  return claims;
}

/**
 * Verify build failure claim
 */
async function verifyBuildFailure(
  claim: { type: string; description: string },
  workingDir: string
): Promise<FrameworkVerification> {
  try {
    const output = execSync('npm run build', {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // If no error thrown, build succeeded
    return {
      claim: 'Build command fails',
      verified: false, // Claim says it fails, but it succeeded
      method: 'exec(npm run build)',
      confidence: 100,
      evidence: {
        command: 'npm run build',
        exit_code: 0,
        output: output.slice(0, 500)
      }
    };
  } catch (error: any) {
    // Build failed - claim verified
    return {
      claim: 'Build command fails',
      verified: true,
      method: 'exec(npm run build)',
      confidence: 100,
      evidence: {
        command: 'npm run build',
        exit_code: error.status || 1,
        output: error.stdout?.slice(0, 500) || '',
        error_details: error.stderr?.slice(0, 500) || error.message
      }
    };
  }
}

/**
 * Verify TypeScript error claim
 */
async function verifyTypeScriptError(
  claim: { type: string; description: string; file?: string; line?: number },
  workingDir: string
): Promise<FrameworkVerification> {
  try {
    // Check if file exists
    if (claim.file) {
      const filePath = join(workingDir, claim.file);
      if (!existsSync(filePath)) {
        return {
          claim: `TypeScript error in ${claim.file}`,
          verified: false,
          method: 'fs.existsSync',
          confidence: 100,
          evidence: {
            file_exists: false,
            error_details: `File ${claim.file} does not exist`
          }
        };
      }
    }

    // Run TypeScript compiler
    const output = execSync('npx tsc --noEmit', {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // No errors
    return {
      claim: `TypeScript error in ${claim.file || 'codebase'}`,
      verified: false,
      method: 'exec(tsc --noEmit)',
      confidence: 100,
      evidence: {
        command: 'tsc --noEmit',
        exit_code: 0,
        output: 'No TypeScript errors found'
      }
    };
  } catch (error: any) {
    const tscOutput = error.stdout || error.stderr || '';

    // Check if specific file/line mentioned in error
    let verified = true;
    let confidence = 95;

    if (claim.file) {
      verified = tscOutput.includes(claim.file);
      confidence = verified ? 98 : 70;
    }

    if (claim.line) {
      const linePattern = new RegExp(`${claim.file}\\(${claim.line}[,:]`);
      verified = linePattern.test(tscOutput);
      confidence = verified ? 100 : 60;
    }

    return {
      claim: `TypeScript error in ${claim.file || 'codebase'}${claim.line ? ` at line ${claim.line}` : ''}`,
      verified,
      method: 'exec(tsc --noEmit)',
      confidence,
      evidence: {
        command: 'tsc --noEmit',
        exit_code: error.status || 1,
        output: tscOutput.slice(0, 1000),
        file_exists: claim.file ? existsSync(join(workingDir, claim.file)) : undefined
      }
    };
  }
}

/**
 * Verify agent definition claim
 */
async function verifyAgentDefinition(
  claim: { type: string; description: string },
  workingDir: string
): Promise<FrameworkVerification> {
  // Extract agent name from description
  const agentMatch = claim.description.match(/agent[:\s]+([a-z-]+)/i);
  if (!agentMatch) {
    return {
      claim: 'Agent definition invalid',
      verified: false,
      method: 'pattern-match',
      confidence: 30,
      evidence: {
        error_details: 'Could not extract agent name from description'
      }
    };
  }

  const agentName = agentMatch[1];
  const agentPath = join(workingDir, '.claude', 'agents', `${agentName}.md`);

  // Check if agent file exists
  if (!existsSync(agentPath)) {
    return {
      claim: `Agent '${agentName}' definition exists`,
      verified: false,
      method: 'fs.existsSync',
      confidence: 100,
      evidence: {
        file_exists: false,
        error_details: `Agent file ${agentPath} not found`
      }
    };
  }

  // Read and validate agent definition structure
  const content = readFileSync(agentPath, 'utf-8');

  const requiredSections = ['Role', 'Tools', 'Activation'];
  const missingSections = requiredSections.filter(
    section => !new RegExp(`##\\s+${section}`, 'i').test(content)
  );

  if (missingSections.length > 0) {
    return {
      claim: `Agent '${agentName}' has valid definition`,
      verified: false,
      method: 'markdown-structure-validation',
      confidence: 95,
      evidence: {
        file_exists: true,
        error_details: `Missing required sections: ${missingSections.join(', ')}`
      }
    };
  }

  // Agent definition is valid
  return {
    claim: `Agent '${agentName}' has valid definition`,
    verified: true,
    method: 'markdown-structure-validation',
    confidence: 95,
    evidence: {
      file_exists: true,
      output: `Found all required sections: ${requiredSections.join(', ')}`
    }
  };
}

/**
 * Verify hook registration claim
 */
async function verifyHookRegistration(
  claim: { type: string; description: string },
  workingDir: string
): Promise<FrameworkVerification> {
  // Extract hook name from description
  const hookMatch = claim.description.match(/hook[:\s]+([a-z-]+)/i);
  if (!hookMatch) {
    return {
      claim: 'Hook registered in settings',
      verified: false,
      method: 'pattern-match',
      confidence: 30,
      evidence: {
        error_details: 'Could not extract hook name from description'
      }
    };
  }

  const hookName = hookMatch[1];
  const settingsPath = join(workingDir, '.claude', 'settings.json');

  // Check if settings file exists
  if (!existsSync(settingsPath)) {
    return {
      claim: `Hook '${hookName}' registered`,
      verified: false,
      method: 'fs.existsSync',
      confidence: 100,
      evidence: {
        file_exists: false,
        error_details: 'Settings file .claude/settings.json not found'
      }
    };
  }

  // Parse settings and check hooks array
  const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

  if (!settings.hooks || !Array.isArray(settings.hooks)) {
    return {
      claim: `Hook '${hookName}' registered`,
      verified: false,
      method: 'json-parse',
      confidence: 100,
      evidence: {
        file_exists: true,
        error_details: 'No hooks array found in settings.json'
      }
    };
  }

  // Check if hook is registered
  const hookRegistered = settings.hooks.some(
    (hook: any) => hook.name?.includes(hookName) || hook.path?.includes(hookName)
  );

  if (!hookRegistered) {
    return {
      claim: `Hook '${hookName}' registered`,
      verified: false,
      method: 'json-parse',
      confidence: 95,
      evidence: {
        file_exists: true,
        error_details: `Hook '${hookName}' not found in hooks array`
      }
    };
  }

  // Hook is registered
  return {
    claim: `Hook '${hookName}' registered`,
    verified: true,
    method: 'json-parse',
    confidence: 100,
    evidence: {
      file_exists: true,
      output: `Hook '${hookName}' found in settings.hooks`
    }
  };
}

/**
 * Verify MCP server claim
 */
async function verifyMCPServer(
  claim: { type: string; description: string },
  workingDir: string
): Promise<FrameworkVerification> {
  // Check if MCP server file exists
  const mcpPath = join(workingDir, 'src', 'mcp', 'versatil-mcp-server-v2.ts');

  if (!existsSync(mcpPath)) {
    return {
      claim: 'MCP server exists',
      verified: false,
      method: 'fs.existsSync',
      confidence: 100,
      evidence: {
        file_exists: false,
        error_details: 'MCP server file not found'
      }
    };
  }

  // Check if MCP server compiles
  try {
    execSync(`npx tsc --noEmit ${mcpPath}`, {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return {
      claim: 'MCP server compiles',
      verified: true,
      method: 'exec(tsc --noEmit)',
      confidence: 95,
      evidence: {
        command: 'tsc --noEmit',
        exit_code: 0,
        file_exists: true
      }
    };
  } catch (error: any) {
    return {
      claim: 'MCP server compiles',
      verified: false,
      method: 'exec(tsc --noEmit)',
      confidence: 100,
      evidence: {
        command: 'tsc --noEmit',
        exit_code: error.status || 1,
        file_exists: true,
        error_details: error.stderr?.slice(0, 500) || error.message
      }
    };
  }
}

/**
 * Verify RAG health claim
 */
async function verifyRAGHealth(
  claim: { type: string; description: string },
  workingDir: string
): Promise<FrameworkVerification> {
  // Check if RAG router exists
  const ragRouterPath = join(workingDir, 'src', 'rag', 'rag-router.ts');

  if (!existsSync(ragRouterPath)) {
    return {
      claim: 'RAG Router exists',
      verified: false,
      method: 'fs.existsSync',
      confidence: 100,
      evidence: {
        file_exists: false,
        error_details: 'RAG Router file not found'
      }
    };
  }

  // Try to import and check health (if dist exists)
  const distPath = join(workingDir, 'dist', 'rag', 'rag-router.js');

  if (!existsSync(distPath)) {
    return {
      claim: 'RAG Router compiled',
      verified: false,
      method: 'fs.existsSync',
      confidence: 95,
      evidence: {
        file_exists: false,
        error_details: 'RAG Router not compiled (dist/ missing)'
      }
    };
  }

  // RAG system exists and is compiled
  return {
    claim: 'RAG system available',
    verified: true,
    method: 'fs.existsSync',
    confidence: 90,
    evidence: {
      file_exists: true,
      output: 'RAG Router source and compiled files exist'
    }
  };
}

/**
 * Generate recommended fix based on verifications
 */
function generateFrameworkFix(
  issue: HealthIssue,
  verifications: FrameworkVerification[]
): string {
  const failedVerifications = verifications.filter(v => !v.verified);

  if (failedVerifications.length === 0) {
    return 'Issue verified but no clear fix available';
  }

  // Build failure fix
  if (failedVerifications.some(v => v.claim.includes('Build'))) {
    return 'Run `npm run build` and fix reported TypeScript errors';
  }

  // TypeScript error fix
  if (failedVerifications.some(v => v.claim.includes('TypeScript'))) {
    const tsVerification = failedVerifications.find(v => v.claim.includes('TypeScript'));
    if (tsVerification?.evidence?.output) {
      return `Fix TypeScript errors:\n${tsVerification.evidence.output.slice(0, 300)}`;
    }
    return 'Run `npx tsc --noEmit` to see TypeScript errors';
  }

  // Agent definition fix
  if (failedVerifications.some(v => v.claim.includes('Agent'))) {
    const agentVerification = failedVerifications.find(v => v.claim.includes('Agent'));
    return agentVerification?.evidence?.error_details || 'Fix agent definition structure';
  }

  // Hook registration fix
  if (failedVerifications.some(v => v.claim.includes('Hook'))) {
    return 'Add hook to .claude/settings.json hooks array';
  }

  // MCP server fix
  if (failedVerifications.some(v => v.claim.includes('MCP'))) {
    return 'Fix MCP server TypeScript errors';
  }

  // RAG health fix
  if (failedVerifications.some(v => v.claim.includes('RAG'))) {
    return 'Run `npm run build` to compile RAG system';
  }

  return 'See verification evidence for details';
}
