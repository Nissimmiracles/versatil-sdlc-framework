/**
 * VERSATIL SDLC Framework - Verified Issue Detector
 *
 * Main verification pipeline that coordinates all three layers:
 * 1. Framework Layer (infrastructure)
 * 2. Project Layer (application code)
 * 3. Context Layer (preferences & conventions)
 *
 * Integrates with Victor-Verifier's Chain-of-Verification (CoVe) methodology
 * to eliminate hallucinations in Guardian's issue detection.
 *
 * Part of Guardian's anti-hallucination system (v7.7.0+)
 * Anti-recursion protections (v7.10.0+):
 * - Layer 3: Session tracking to prevent infinite loops
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { HealthCheckResult, HealthIssue } from './types.js';
import { checkDuplicate, type DeduplicationResult } from './todo-deduplicator.js';

// ============================================================================
// Layer 3: Recursion Guard - Prevents infinite verification loops
// ============================================================================

/**
 * Global recursion tracking set
 * Tracks active Guardian verification sessions to prevent infinite loops
 */
const GUARDIAN_ACTIVE_SESSIONS = new Set<string>();

/**
 * Maximum concurrent Guardian verification sessions
 * Prevents stack overflow from recursive Guardian activations
 */
const MAX_RECURSION_DEPTH = parseInt(process.env.GUARDIAN_MAX_RECURSION_DEPTH || '3', 10);
import {
  classifyIssueLayer,
  classifyIssues,
  getLayerStatistics,
  LAYER_AGENT_ROUTING,
  type LayerClassification,
  type VerificationLayer
} from './layer-classifier.js';
import {
  verifyFrameworkIssue,
  type FrameworkVerificationResult
} from './framework-verifier.js';
import { verifyProjectIssue, type ProjectVerificationResult } from './project-verifier.js';
import { verifyContextIssue, type ContextVerificationResult } from './context-verifier.js';
import type { ContextIdentity } from '../../isolation/context-identity.js';

export interface VerifiedIssue {
  issue_id: string;
  original_issue: HealthIssue;
  layer: VerificationLayer;
  layer_classification: LayerClassification;
  verified: boolean;
  confidence: number; // 0-100
  verification_details:
    | FrameworkVerificationResult
    | ProjectVerificationResult
    | ContextVerificationResult;
  assigned_agent: string;
  auto_apply: boolean; // Confidence ≥90% (framework/project) or ≥95% (context)
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
}

export interface VerificationPipelineResult {
  total_issues: number;
  verified_issues: VerifiedIssue[];
  unverified_issues: HealthIssue[];
  layer_statistics: {
    total: number;
    by_layer: Record<VerificationLayer, number>;
    avg_confidence: Record<VerificationLayer, number>;
  };
  auto_apply_count: number;
  manual_review_count: number;
}

/**
 * Main verification pipeline: Detect, Classify, Verify, Assign
 *
 * Anti-recursion protection (Layer 3): Prevents infinite verification loops
 */
export async function detectAndVerifyIssues(
  healthCheckResult: HealthCheckResult,
  workingDir: string,
  contextIdentity?: ContextIdentity,
  userId?: string,
  teamId?: string,
  projectId?: string
): Promise<VerificationPipelineResult> {
  const startTime = Date.now();

  // Layer 3: Recursion Guard - Check depth BEFORE starting verification
  const sessionId = `${workingDir}-${startTime}`;

  if (GUARDIAN_ACTIVE_SESSIONS.size >= MAX_RECURSION_DEPTH) {
    console.error(
      `🛑 [Guardian Recursion Guard] Max recursion depth reached (${MAX_RECURSION_DEPTH}). ` +
        `Skipping verification to prevent infinite loop. ` +
        `Active sessions: ${GUARDIAN_ACTIVE_SESSIONS.size}`
    );
    return {
      total_issues: 0,
      verified_issues: [],
      unverified_issues: healthCheckResult.issues,
      layer_statistics: {
        total: 0,
        by_layer: { framework: 0, project: 0, context: 0 },
        avg_confidence: { framework: 0, project: 0, context: 0 }
      },
      auto_apply_count: 0,
      manual_review_count: 0
    };
  }

  // Mark session as active
  GUARDIAN_ACTIVE_SESSIONS.add(sessionId);
  console.log(`\n🔍 [Guardian Verification] Starting three-layer verification... (Session: ${GUARDIAN_ACTIVE_SESSIONS.size}/${MAX_RECURSION_DEPTH})`);

  // Step 1: Classify all issues into layers
  const classifications = classifyIssues(healthCheckResult.issues);
  const layerStats = getLayerStatistics(classifications);

  console.log(
    `📊 [Layer Classification] ${layerStats.total} issues: ` +
      `Framework(${layerStats.by_layer.framework}) ` +
      `Project(${layerStats.by_layer.project}) ` +
      `Context(${layerStats.by_layer.context})`
  );

  // Step 2: Verify each issue using layer-specific verifiers
  const verifiedIssues: VerifiedIssue[] = [];
  const unverifiedIssues: HealthIssue[] = [];

  for (const [issue, classification] of classifications.entries()) {
    console.log(
      `  🔍 Verifying: ${issue.component} (${classification.layer} layer, ${classification.confidence}% classification confidence)`
    );

    let verificationResult:
      | FrameworkVerificationResult
      | ProjectVerificationResult
      | ContextVerificationResult;

    try {
      // Route to appropriate verifier based on layer
      switch (classification.layer) {
        case 'framework':
          verificationResult = await verifyFrameworkIssue(issue, workingDir);
          break;

        case 'project':
          verificationResult = await verifyProjectIssue(issue, workingDir);
          break;

        case 'context':
          // Extract resolved context from health check result (v7.8.0)
          const resolvedContext = (healthCheckResult as any).resolvedContext;

          verificationResult = await verifyContextIssue(
            issue,
            workingDir,
            userId,
            teamId,
            projectId,
            resolvedContext
          );
          break;
      }

      // Step 3: Assign agent based on layer + issue type
      const assignedAgent = assignAgentByLayer(
        issue,
        classification.layer,
        verificationResult,
        contextIdentity
      );

      // Step 4: Determine auto-apply eligibility
      const autoApplyThreshold = classification.layer === 'context' ? 95 : 90;
      const autoApply = verificationResult.verified && verificationResult.confidence >= autoApplyThreshold;

      // Create verified issue
      const verifiedIssue: VerifiedIssue = {
        issue_id: verificationResult.issue_id,
        original_issue: issue,
        layer: classification.layer,
        layer_classification: classification,
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        verification_details: verificationResult,
        assigned_agent: assignedAgent,
        auto_apply: autoApply,
        priority: issue.severity as any,
        created_at: new Date().toISOString()
      };

      if (verificationResult.verified) {
        verifiedIssues.push(verifiedIssue);
        console.log(
          `    ✅ VERIFIED (${verificationResult.confidence}% confidence) → ${assignedAgent} ${autoApply ? '[AUTO-APPLY]' : '[MANUAL]'}`
        );
      } else {
        unverifiedIssues.push(issue);
        console.log(`    ❌ UNVERIFIED (${verificationResult.confidence}% confidence)`);
      }
    } catch (error: any) {
      console.error(
        `    ⚠️  Verification failed: ${error.message}`
      );
      unverifiedIssues.push(issue);
    }
  }

  const autoApplyCount = verifiedIssues.filter(v => v.auto_apply).length;
  const manualReviewCount = verifiedIssues.filter(v => !v.auto_apply).length;

  const duration = Date.now() - startTime;

  console.log(
    `\n✅ [Guardian Verification] Complete in ${duration}ms:\n` +
      `  - Verified: ${verifiedIssues.length}/${healthCheckResult.issues.length}\n` +
      `  - Auto-apply: ${autoApplyCount}\n` +
      `  - Manual review: ${manualReviewCount}\n` +
      `  - Unverified: ${unverifiedIssues.length}`
  );

  // Layer 3: Remove session from active set (cleanup)
  GUARDIAN_ACTIVE_SESSIONS.delete(sessionId);
  console.log(`  🔓 [Guardian Recursion Guard] Session completed. Active: ${GUARDIAN_ACTIVE_SESSIONS.size}/${MAX_RECURSION_DEPTH}`);

  return {
    total_issues: healthCheckResult.issues.length,
    verified_issues: verifiedIssues,
    unverified_issues: unverifiedIssues,
    layer_statistics: layerStats,
    auto_apply_count: autoApplyCount,
    manual_review_count: manualReviewCount
  };
}

/**
 * Assign agent based on layer + issue type
 */
function assignAgentByLayer(
  issue: HealthIssue,
  layer: VerificationLayer,
  verificationResult:
    | FrameworkVerificationResult
    | ProjectVerificationResult
    | ContextVerificationResult,
  contextIdentity?: ContextIdentity
): string {
  // Get issue category for routing
  const category = categorizeIssue(issue);

  // Get routing rule for layer
  const layerRouting = LAYER_AGENT_ROUTING[layer] as Record<string, string>;
  let agent = layerRouting[category] || 'Maria-QA'; // Default fallback

  // Context layer: Handle git-blame special case
  if (layer === 'context' && agent === 'git-blame') {
    const contextResult = verificationResult as ContextVerificationResult;
    agent = contextResult.responsible_agent || 'Alex-BA'; // Fallback to BA
  }

  // Context enforcement: Sarah-PM only in framework context
  if (agent === 'Sarah-PM' && contextIdentity?.role === 'framework-user') {
    agent = 'Maria-QA'; // Fallback for user projects
  }

  return agent;
}

/**
 * Categorize issue for agent routing
 */
function categorizeIssue(issue: HealthIssue): string {
  const component = issue.component.toLowerCase();
  const description = issue.description.toLowerCase();

  // Framework categories
  if (component.includes('build') || description.includes('build')) return 'build-failure';
  if (component.includes('typescript') || description.includes('typescript'))
    return 'typescript-error';
  if (component.includes('agent')) return 'agent-invalid';
  if (component.includes('hook')) return 'hook-error';
  if (component.includes('mcp')) return 'mcp-error';
  if (component.includes('rag')) return 'rag-health';

  // Project categories
  if (description.includes('test') && description.includes('fail')) return 'test-failure';
  if (description.includes('coverage')) return 'test-coverage';
  if (description.includes('vulnerabilit')) return 'security-vulnerability';
  if (description.includes('quality') || description.includes('eslint')) return 'code-quality';
  if (description.includes('accessibilit')) return 'accessibility';
  if (description.includes('performance')) return 'performance';
  if (component.includes('database')) return 'database';
  if (description.includes('outdated')) return 'dependency';

  // Context categories
  if (description.includes('indent') || description.includes('tabs') || description.includes('spaces'))
    return 'style-violation';
  if (description.includes('convention')) return 'convention-violation';
  if (description.includes('vision')) return 'vision-misalignment';
  if (description.includes('preference')) return 'preference-mismatch';

  return 'unknown';
}

/**
 * Check if todo with similar content already exists (Layer 1: Content Deduplication)
 * Prevents duplicate todos for same issue
 *
 * @param verifiedIssue - Issue to check for duplicates
 * @param todosDir - Directory containing todo files
 * @returns true if duplicate exists, false otherwise
 */
function todoAlreadyExists(verifiedIssue: VerifiedIssue, todosDir: string): boolean {
  try {
    import { readdirSync, readFileSync, existsSync } from 'fs';

    if (!existsSync(todosDir)) {
      return false; // No todos directory = no duplicates
    }

    const files = readdirSync(todosDir);

    // Generate content fingerprint (first 100 chars of description)
    const fingerprint = verifiedIssue.original_issue.description
      .toLowerCase()
      .slice(0, 100)
      .replace(/\s+/g, ' ')
      .trim();

    // Check each existing todo file
    for (const file of files) {
      if (!file.endsWith('.md') || file === '000-pending-p1-TEMPLATE.md') {
        continue;
      }

      const filePath = join(todosDir, file);
      const content = readFileSync(filePath, 'utf-8');

      // Check if fingerprint appears in existing todo
      if (content.toLowerCase().includes(fingerprint)) {
        console.log(`  ⏭️  Skipping duplicate todo: ${file} (matches existing issue)`);
        return true;
      }
    }

    return false;
  } catch (error: any) {
    console.warn(`  ⚠️  Failed to check for duplicates: ${error.message}`);
    return false; // Err on side of creation (better than blocking valid todos)
  }
}

/**
 * Grouped issues for combined TODO generation
 */
export interface GroupedIssues {
  group_key: string;          // "Maria-QA-critical"
  issues: VerifiedIssue[];
  assigned_agent: string;
  priority: string;
  layer: string;
}

/**
 * Group verified issues by configured strategy (agent, priority, or layer)
 */
function groupVerifiedIssues(
  verifiedIssues: VerifiedIssue[],
  groupBy: 'agent' | 'priority' | 'layer' = 'agent',
  maxIssuesPerGroup: number = 10
): GroupedIssues[] {
  const groups = new Map<string, VerifiedIssue[]>();

  for (const issue of verifiedIssues) {
    let key: string;

    // Generate group key based on strategy
    switch (groupBy) {
      case 'agent':
        key = `${issue.assigned_agent}-${issue.priority}`;
        break;
      case 'priority':
        key = `${issue.priority}-${issue.layer}`;
        break;
      case 'layer':
        key = `${issue.layer}-${issue.assigned_agent}`;
        break;
      default:
        key = `${issue.assigned_agent}-${issue.priority}`;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(issue);
  }

  // Convert to GroupedIssues array and enforce max size
  const result: GroupedIssues[] = [];

  for (const [key, issues] of groups.entries()) {
    // Split large groups into multiple TODOs
    if (issues.length > maxIssuesPerGroup) {
      for (let i = 0; i < issues.length; i += maxIssuesPerGroup) {
        const chunk = issues.slice(i, i + maxIssuesPerGroup);
        result.push({
          group_key: `${key}-part${Math.floor(i / maxIssuesPerGroup) + 1}`,
          issues: chunk,
          assigned_agent: chunk[0].assigned_agent,
          priority: chunk[0].priority,
          layer: chunk[0].layer
        });
      }
    } else {
      result.push({
        group_key: key,
        issues,
        assigned_agent: issues[0].assigned_agent,
        priority: issues[0].priority,
        layer: issues[0].layer
      });
    }
  }

  return result;
}

/**
 * Create verified todos from verified issues
 *
 * NOTE: Todo file creation now ENABLED by default (v7.10.0+)
 * Supports both individual and combined (grouped) TODO generation.
 * To disable: set GUARDIAN_CREATE_TODOS=false environment variable
 *
 * Anti-recursion protections (v7.10.0+):
 * - Layer 1: Content-based deduplication (todoAlreadyExists)
 * - Layer 2: Namespaced filenames (guardian- prefix)
 * - Layer 3: TODO grouping (reduces file count by 5-10x)
 */
export async function createVerifiedTodos(
  verifiedIssues: VerifiedIssue[],
  outputDir?: string
): Promise<string[]> {
  // Check if todo creation is enabled (now enabled by default)
  const createTodos = process.env.GUARDIAN_CREATE_TODOS !== 'false'; // Changed: default true

  if (!createTodos) {
    console.log(`  ℹ️  Guardian todo creation disabled (tracking via telemetry). Set GUARDIAN_CREATE_TODOS=true to enable.`);
    return [];
  }

  const todosDir = outputDir || join(process.cwd(), 'todos');
  const createdFiles: string[] = [];

  // Check if grouping is enabled (default: true)
  const groupTodos = process.env.GUARDIAN_GROUP_TODOS !== 'false';
  const groupBy = (process.env.GUARDIAN_GROUP_BY as 'agent' | 'priority' | 'layer') || 'agent';
  const maxIssuesPerTodo = parseInt(process.env.GUARDIAN_MAX_ISSUES_PER_TODO || '10', 10);

  if (groupTodos) {
    // NEW: Combined TODO generation
    const groups = groupVerifiedIssues(verifiedIssues, groupBy, maxIssuesPerTodo);

    console.log(`  📦 Grouping ${verifiedIssues.length} issues into ${groups.length} combined TODO(s) (strategy: ${groupBy})`);

    for (const group of groups) {
      // Layer 1: Enhanced time-based duplicate detection (v7.16.0+)
      const duplicateDetectionEnabled = process.env.GUARDIAN_DUPLICATE_DETECTION !== 'false';
      const maxAgeHours = parseInt(process.env.GUARDIAN_MAX_TODO_AGE_HOURS || '24', 10);

      if (duplicateDetectionEnabled && group.issues.length > 0) {
        const dedupResult = checkDuplicate(group.issues[0], todosDir, maxAgeHours);

        if (dedupResult.is_duplicate) {
          console.log(`  ⏭️  Skipped duplicate group: ${group.group_key} (${dedupResult.reason})`);
          continue;
        } else if (dedupResult.existing_todo) {
          console.log(`  🔄 Refreshing stale todo: ${dedupResult.existing_todo.filename} (${dedupResult.reason})`);
          // Continue to create new todo (old one will be archived by cleanup cycle)
        }
      }

      const todoContent = formatCombinedTodoMarkdown(group);

      // Layer 2: Namespaced filename for combined TODOs
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const agentSlug = group.assigned_agent.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const todoFilename = `guardian-combined-${agentSlug}-${group.priority}-${timestamp}-${randomSuffix}.md`;
      const todoPath = join(todosDir, todoFilename);

      try {
        writeFileSync(todoPath, todoContent, 'utf-8');
        createdFiles.push(todoPath);
        console.log(`  📝 Created combined todo: ${todoFilename} (${group.issues.length} issues)`);
      } catch (error: any) {
        console.error(`  ⚠️  Failed to create combined todo ${todoFilename}: ${error.message}`);
      }
    }
  } else {
    // OLD: Individual TODO generation (original behavior)
    console.log(`  📄 Creating ${verifiedIssues.length} individual TODO(s)...`);

    for (const verifiedIssue of verifiedIssues) {
      // Layer 1: Check for duplicates BEFORE creating
      const duplicateDetectionEnabled = process.env.GUARDIAN_DUPLICATE_DETECTION !== 'false';
      if (duplicateDetectionEnabled && todoAlreadyExists(verifiedIssue, todosDir)) {
        console.log(`  ⏭️  Skipped duplicate: ${verifiedIssue.issue_id}`);
        continue;
      }

      const todoContent = formatVerifiedTodoMarkdown(verifiedIssue);

      // Layer 2: Namespaced filename to prevent collisions with /plan command
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const todoFilename = `guardian-${timestamp}-${randomSuffix}-${verifiedIssue.priority}-${verifiedIssue.layer}.md`;
      const todoPath = join(todosDir, todoFilename);

      try {
        writeFileSync(todoPath, todoContent, 'utf-8');
        createdFiles.push(todoPath);
        console.log(`  📝 Created todo: ${todoFilename}`);
      } catch (error: any) {
        console.error(`  ⚠️  Failed to create todo ${todoFilename}: ${error.message}`);
      }
    }
  }

  return createdFiles;
}

/**
 * Format verified issue as todo markdown
 */
function formatVerifiedTodoMarkdown(verifiedIssue: VerifiedIssue): string {
  const layerEmoji = {
    framework: '🏗️',
    project: '📦',
    context: '👤'
  };

  const issue = verifiedIssue.original_issue;
  const verification = verifiedIssue.verification_details;

  // Format evidence
  const evidenceLines = verification.verifications
    .map(
      (v, i) =>
        `${i + 1}. ${v.verified ? '✓' : '❌'} ${v.claim}\n` +
        `   - Method: \`${v.method}\`\n` +
        `   - Confidence: ${v.confidence}%\n` +
        `   - Evidence: ${JSON.stringify(v.evidence, null, 2).slice(0, 200)}`
    )
    .join('\n\n');

  return `---
id: "${verifiedIssue.issue_id}"
created: "${verifiedIssue.created_at}"
layer: "${verifiedIssue.layer}"
agent: "${verifiedIssue.assigned_agent}"
priority: "${verifiedIssue.priority}"
confidence: ${verifiedIssue.confidence}
auto_apply: ${verifiedIssue.auto_apply}
verified_by: "Victor-Verifier (${verifiedIssue.layer.charAt(0).toUpperCase() + verifiedIssue.layer.slice(1)} Layer)"
---

# ${issue.component}: ${issue.description}

## Layer: ${layerEmoji[verifiedIssue.layer]} ${verifiedIssue.layer.charAt(0).toUpperCase() + verifiedIssue.layer.slice(1)}

## Issue (VERIFIED ✓)
${issue.description}

## Ground Truth Evidence
${evidenceLines}

## Layer Classification
- **Detected Layer**: ${verifiedIssue.layer}
- **Classification Confidence**: ${verifiedIssue.layer_classification.confidence}%
- **Matched Patterns**: ${verifiedIssue.layer_classification.matched_patterns.join(', ')}
- **Reasoning**: ${verifiedIssue.layer_classification.reasoning}

## Verification Summary
- **Overall Confidence**: **${verifiedIssue.confidence}%**
- **Verification Method**: ${verification.verifications.map(v => v.method).join(', ')}
- **All Checks Passed**: ${verification.verifications.every(v => v.verified) ? '✅ Yes' : '❌ No'}

## Recommended Fix
${verification.recommended_fix || 'See verification evidence for details'}

## Assigned Agent
**${verifiedIssue.assigned_agent}**
- Auto-apply: ${verifiedIssue.auto_apply ? 'YES' : 'NO'} (confidence ${verifiedIssue.confidence}% ${verifiedIssue.auto_apply ? '≥' : '<'} ${verifiedIssue.layer === 'context' ? '95' : '90'}%)
- Priority: ${verifiedIssue.priority}
- Layer specialization: ${verifiedIssue.layer}

## Context Enforcement
${verifiedIssue.layer === 'context' ? `
### Priority Hierarchy
\`\`\`
User Preferences > Team Conventions > Project Vision > Framework Defaults
\`\`\`

${(verification as any).priority_violation ? `
### ⚠️ Priority Violation Detected

**What Went Wrong**: ${(verification as any).priority_violation.explanation}

**Comparison Table**:

| Layer | Expected | Actual | Status |
|-------|----------|--------|--------|
| **User** | ${(verification as any).priority_violation.expected_priority === 'User' ? `\`${(verification as any).priority_violation.expected_value}\` ✅` : '-'} | ${(verification as any).priority_violation.actual_priority === 'User' ? `\`${(verification as any).priority_violation.actual_value}\`` : '-'} | ${(verification as any).priority_violation.expected_priority === 'User' ? '❌ Ignored' : '-'} |
| **Team** | ${(verification as any).priority_violation.expected_priority === 'Team' ? `\`${(verification as any).priority_violation.expected_value}\` ✅` : '-'} | ${(verification as any).priority_violation.actual_priority === 'Team' ? `\`${(verification as any).priority_violation.actual_value}\`` : '-'} | ${(verification as any).priority_violation.expected_priority === 'Team' ? '❌ Ignored' : '-'} |
| **Project** | ${(verification as any).priority_violation.expected_priority === 'Project' ? `\`${(verification as any).priority_violation.expected_value}\` ✅` : '-'} | ${(verification as any).priority_violation.actual_priority === 'Project' ? `\`${(verification as any).priority_violation.actual_value}\`` : '-'} | ${(verification as any).priority_violation.expected_priority === 'Project' ? '❌ Ignored' : '-'} |
| **Framework** | ${(verification as any).priority_violation.expected_priority === 'Framework' ? `\`${(verification as any).priority_violation.expected_value}\` ✅` : '-'} | ${(verification as any).priority_violation.actual_priority === 'Framework' ? `\`${(verification as any).priority_violation.actual_value}\`` : '-'} | ${(verification as any).priority_violation.actual_priority === 'Framework' ? '✅ Applied' : '-'} |

**Severity**: \`${(verification as any).priority_violation.severity.toUpperCase()}\`

**Explanation**: ${(verification as any).priority_violation.expected_priority} preference (\`${(verification as any).priority_violation.expected_value}\`) should have been applied, but ${(verification as any).priority_violation.actual_priority} default (\`${(verification as any).priority_violation.actual_value}\`) was used instead.

` : `
### ✅ Context Verified

This issue was verified against the three-layer context system. Priority resolution is working correctly.
`}

${(() => {
  // Check if this is a naming convention violation (v7.9.0)
  const verification = verifiedIssue.verification_details as any;
  const actualValue = verification.verifications?.[0]?.evidence?.actual_value;

  if (actualValue && typeof actualValue === 'object' && actualValue.violations && Array.isArray(actualValue.violations)) {
    const violations = actualValue.violations;
    const conformanceRate = actualValue.conformance_rate;
    const totalIdentifiers = actualValue.total_identifiers;

    if (violations.length > 0) {
      const topViolations = violations.slice(0, 10); // Show max 10 violations
      const violationRows = topViolations.map((v: any) =>
        `| ${v.identifier} | ${v.line}:${v.column} | ${v.type} | \`${v.expected}\` | \`${v.actual}\` | \`${v.suggestion || v.identifier}\` |`
      ).join('\n');

      return `
### 🔤 Naming Convention Violations

**Conformance Rate**: ${conformanceRate}% (${violations.length} violations in ${totalIdentifiers} identifiers)

| Identifier | Location | Type | Expected | Actual | Suggestion |
|------------|----------|------|----------|--------|------------|
${violationRows}

${violations.length > 10 ? `\n*(Showing first 10 of ${violations.length} violations)*\n` : ''}

**Fix Options**:
1. Run \`npx eslint --fix ${verifiedIssue.original_issue.description.match(/in (\S+\.(?:ts|tsx|js|jsx))/)?.[1] || 'file'}\` (auto-fix)
2. Manually rename identifiers to match User preference
3. Update User preferences if different convention intended
`;
    }
  }

  return '';
})()}

${(() => {
  // Check if this is a vision alignment violation (v7.9.0)
  const verification = verifiedIssue.verification_details as any;
  const actualValue = verification.verifications?.[0]?.evidence?.actual_value;

  if (actualValue && typeof actualValue === 'object' && actualValue.semantic_matches && Array.isArray(actualValue.semantic_matches)) {
    const overallAlignment = actualValue.overall_alignment;
    const semanticMatches = actualValue.semantic_matches;
    const bestMatch = actualValue.best_match;
    const featureDescription = actualValue.feature_description;

    if (overallAlignment < 70) {
      const matchRows = semanticMatches.slice(0, 5).map((match: any) =>
        `| ${match.text.slice(0, 60)}${match.text.length > 60 ? '...' : ''} | ${Math.round(match.similarity * 100)}% | ${match.isMatch ? '✅ Aligned' : '❌ Not aligned'} |`
      ).join('\n');

      return `
### 🎯 Vision Alignment Analysis

**Overall Alignment**: ${overallAlignment}% ${overallAlignment < 70 ? '(Below 70% threshold ❌)' : '(Above 70% threshold ✅)'}

**Feature Description**: "${featureDescription}"

**Semantic Matches**:

| Project Goal | Similarity | Status |
|--------------|------------|--------|
${matchRows}

${semanticMatches.length > 5 ? `\n*(Showing top 5 of ${semanticMatches.length} goals)*\n` : ''}

**Best Match**: ${bestMatch ? `"${bestMatch.text}" (${Math.round(bestMatch.similarity * 100)}% similar)` : 'None'}

**Explanation**: ${overallAlignment < 70
  ? `Feature has low alignment with project goals. Consider revising feature to better align with project vision, or updating project vision if this feature is strategic.`
  : `Feature aligns well with project goals.`}

**Recommendation**: ${overallAlignment < 70
  ? `Ensure feature contributes to at least 1-2 major project goals (≥70% similarity).`
  : `Continue development - feature aligns with project vision.`}
`;
    }
  }

  return '';
})()}` : ''}

${verifiedIssue.layer === 'framework' ? `
### Framework Layer
This issue affects framework infrastructure. Only accessible in framework development context.
` : ''}

${verifiedIssue.layer === 'project' ? `
### Project Layer
This issue affects application code quality, security, or performance.
` : ''}

## Learning Opportunity
${verifiedIssue.auto_apply ? 'Auto-applied fix will be stored in RAG for future pattern matching.' : 'Manual fix should be codified and stored in RAG after completion.'}

---

**Generated by Guardian Verified Issue Detector**
**Verification Pipeline**: Layer Classification → Ground Truth Verification → Agent Assignment
**Anti-Hallucination**: Chain-of-Verification (CoVe) methodology
`;
}

/**
 * Format combined TODO markdown for grouped issues
 */
function formatCombinedTodoMarkdown(group: GroupedIssues): string {
  const layerEmoji = {
    framework: '🏗️',
    project: '📦',
    context: '👤'
  };

  const timestamp = new Date().toISOString();
  const avgConfidence = Math.round(
    group.issues.reduce((sum, issue) => sum + issue.confidence, 0) / group.issues.length
  );

  // Count auto-apply vs manual review
  const autoApplyCount = group.issues.filter(i => i.auto_apply).length;
  const manualReviewCount = group.issues.length - autoApplyCount;

  // Format individual issue summaries
  const issuesList = group.issues
    .map((issue, index) => {
      const verification = issue.verification_details;
      const evidencePreview = verification.verifications
        .slice(0, 2) // Show first 2 verifications
        .map(v => `${v.verified ? '✓' : '❌'} ${v.claim} (${v.confidence}%)`)
        .join(', ');

      return `### ${index + 1}. ${issue.original_issue.component}

**Issue**: ${issue.original_issue.description}

**Details**:
- **Priority**: ${issue.priority}
- **Confidence**: ${issue.confidence}%
- **Auto-Apply**: ${issue.auto_apply ? 'YES ✅' : 'NO (manual review required)'}
- **Layer**: ${layerEmoji[issue.layer]} ${issue.layer}

**Evidence Summary**: ${evidencePreview}${verification.verifications.length > 2 ? ` (+${verification.verifications.length - 2} more)` : ''}

**Recommended Fix**: ${verification.recommended_fix || 'See verification evidence for details'}

---`;
    })
    .join('\n\n');

  // Format combined recommended actions
  const combinedActions = group.issues
    .map((issue, i) => `${i + 1}. ${issue.verification_details.recommended_fix || 'Manual investigation required'}`)
    .join('\n');

  return `---
id: "${group.group_key}-${Date.now()}"
created: "${timestamp}"
type: "guardian-combined"
assigned_agent: "${group.assigned_agent}"
priority: "${group.priority}"
issue_count: ${group.issues.length}
avg_confidence: ${avgConfidence}
auto_apply_count: ${autoApplyCount}
manual_review_count: ${manualReviewCount}
grouping_strategy: "${process.env.GUARDIAN_GROUP_BY || 'agent'}"
verified_by: "Victor-Verifier (Guardian Health Check)"
---

# 🛡️ Guardian Health Check - ${group.assigned_agent}

**Combined TODO**: ${group.issues.length} related ${group.issues.length === 1 ? 'issue' : 'issues'} detected

## Summary

- **Assigned Agent**: **${group.assigned_agent}**
- **Priority**: **${group.priority.toUpperCase()}**
- **Total Issues**: ${group.issues.length}
- **Average Confidence**: ${avgConfidence}%
- **Auto-Apply Eligible**: ${autoApplyCount}
- **Manual Review Required**: ${manualReviewCount}
- **Detection Layer**: ${layerEmoji[group.layer]} ${group.layer.charAt(0).toUpperCase() + group.layer.slice(1)}

## Issues Detected

${issuesList}

## 🎯 Recommended Actions (Priority Order)

${combinedActions}

## 📊 Execution Strategy

**Suggested Approach**:
${autoApplyCount > 0 ? `
1. **Auto-Apply (${autoApplyCount} issues)**: Guardian can automatically remediate these high-confidence issues
   - Review auto-fix logs after execution
   - Verify changes before committing
` : ''}${manualReviewCount > 0 ? `
${autoApplyCount > 0 ? '2' : '1'}. **Manual Review (${manualReviewCount} issues)**: These require human judgment
   - Investigate root causes using verification evidence
   - Apply fixes with proper testing
   - Codify learnings in RAG for future pattern matching
` : ''}

**Estimated Effort**: ${group.issues.length * 15}-${group.issues.length * 30} minutes (depending on complexity)

## 🧠 Learning Opportunity

After resolving these issues:
1. Run \`/learn "Resolved ${group.issues.length} ${group.priority} issues in ${group.layer} layer"\`
2. Guardian will store fix patterns in RAG
3. Similar issues will be auto-remediable in the future (compounding engineering)

## 🔍 Verification Details

All issues verified using Chain-of-Verification (CoVe) methodology:
- Layer Classification (framework/project/context)
- Ground Truth Verification (file system, git, logs)
- Agent Assignment (based on specialization)
- Confidence Scoring (0-100%)

**Full verification evidence available in individual issue sections above.**

---

**Generated by Guardian Verified Issue Detector**
**Verification Pipeline**: Health Check → Layer Classification → Ground Truth Verification → TODO Grouping
**Anti-Hallucination**: Chain-of-Verification (CoVe) methodology
**Grouping Strategy**: ${process.env.GUARDIAN_GROUP_BY || 'agent'} (configurable via GUARDIAN_GROUP_BY env var)
`;
}

/**
 * Export verification summary for logging
 */
export function generateVerificationSummary(
  result: VerificationPipelineResult
): string {
  const layers = ['framework', 'project', 'context'] as VerificationLayer[];

  const layerBreakdown = layers
    .map(
      layer =>
        `  - ${layer.charAt(0).toUpperCase() + layer.slice(1)}: ` +
        `${result.layer_statistics.by_layer[layer]} issues ` +
        `(avg ${result.layer_statistics.avg_confidence[layer]}% confidence)`
    )
    .join('\n');

  return `
## Guardian Verification Summary

**Total Issues**: ${result.total_issues}
**Verified**: ${result.verified_issues.length}
**Unverified**: ${result.unverified_issues.length}

**Layer Breakdown**:
${layerBreakdown}

**Auto-Apply Eligible**: ${result.auto_apply_count}
**Manual Review Required**: ${result.manual_review_count}

**Top Issues by Priority**:
${result.verified_issues
  .sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (
      priorityOrder[a.priority as keyof typeof priorityOrder] -
      priorityOrder[b.priority as keyof typeof priorityOrder]
    );
  })
  .slice(0, 5)
  .map(
    (issue, i) =>
      `${i + 1}. [${issue.priority.toUpperCase()}] ${issue.original_issue.component}: ` +
      `${issue.original_issue.description.slice(0, 100)}... ` +
      `(${issue.confidence}% confidence, ${issue.assigned_agent})`
  )
  .join('\n')}
`;
}
