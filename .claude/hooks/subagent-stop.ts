#!/usr/bin/env ts-node
/**
 * Subagent-Stop Hook
 * Triggers after subagent (Task tool) completion
 * Maps to VERSATIL's "afterTaskCompletion" lifecycle event
 *
 * SDK Hook: SubagentStop
 * Triggers: When any Task tool (subagent invocation) completes
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface HookInput {
  toolName: string;
  subagentType?: string;
  workingDirectory: string;
  sessionId: string;
  taskResult?: {
    success: boolean;
    output: string;
    filesChanged?: string[];
  };
}

// Read hook input from stdin
const input: HookInput = JSON.parse(readFileSync(0, 'utf-8'));

const { subagentType, workingDirectory, taskResult } = input;

console.log(`\n🎯 Subagent Completed: ${subagentType || 'unknown'}`);

// Get files changed during task (if available)
const filesChanged = taskResult?.filesChanged || [];

if (filesChanged.length > 0) {
  console.log(`   Files changed: ${filesChanged.length}`);
}

/**
 * Maria-QA Auto-Activation
 * Run tests for files changed during task
 */
if (filesChanged.length > 0) {
  console.log('\n🤖 Maria-QA: Task completed with file changes - Running quality checks');

  // Check if any source code files were changed
  const sourceFiles = filesChanged.filter(f =>
    f.match(/\.(ts|tsx|js|jsx|py|rb|go|java)$/) && !f.match(/\.(test|spec)\./));

  const testFiles = filesChanged.filter(f => f.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/));

  if (sourceFiles.length > 0) {
    console.log(`   Source files changed: ${sourceFiles.length}`);
    console.log('   Recommendation: Run test suite to validate changes');

    // Check if package.json has test script
    const packageJsonPath = join(workingDirectory, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.scripts?.test) {
          console.log('   💡 Quick check: npm test');
        }
        if (packageJson.scripts?.['test:coverage']) {
          console.log('   💡 Coverage check: npm run test:coverage');
        }
      } catch (err) {
        // Ignore parsing errors
      }
    }
  }

  if (testFiles.length > 0) {
    console.log(`   Test files changed: ${testFiles.length}`);
    console.log('   ✅ Tests updated during task - good practice!');
  }
}

/**
 * Agent-Specific Post-Task Actions
 */
if (subagentType) {
  // James-Frontend tasks
  if (subagentType.includes('james') || subagentType.includes('frontend')) {
    console.log('\n🤖 James-Frontend: Frontend task completed');
    console.log('   Recommendations:');
    console.log('   - Verify responsive design (mobile/tablet/desktop)');
    console.log('   - Check accessibility (WCAG 2.1 AA compliance)');
    console.log('   - Validate bundle size impact');
  }

  // Marcus-Backend tasks
  if (subagentType.includes('marcus') || subagentType.includes('backend')) {
    console.log('\n🤖 Marcus-Backend: Backend task completed');
    console.log('   Recommendations:');
    console.log('   - Run API tests');
    console.log('   - Verify OWASP security patterns');
    console.log('   - Check API performance/load testing');
  }

  // Dana-Database tasks
  if (subagentType.includes('dana') || subagentType.includes('database')) {
    console.log('\n🤖 Dana-Database: Database task completed');
    console.log('   Recommendations:');
    console.log('   - Review migration rollback safety');
    console.log('   - Validate RLS policies');
    console.log('   - Check query performance with EXPLAIN ANALYZE');
  }

  // Dr.AI-ML tasks
  if (subagentType.includes('dr-ai') || subagentType.includes('ml')) {
    console.log('\n🤖 Dr.AI-ML: ML/AI task completed');
    console.log('   Recommendations:');
    console.log('   - Validate model performance metrics');
    console.log('   - Check training/inference reproducibility');
    console.log('   - Review MLOps pipeline integration');
  }

  // Alex-BA tasks
  if (subagentType.includes('alex') || subagentType.includes('ba')) {
    console.log('\n🤖 Alex-BA: Requirements analysis completed');
    console.log('   Recommendations:');
    console.log('   - Validate API contracts with stakeholders');
    console.log('   - Ensure user stories are complete');
    console.log('   - Verify business logic validation');
  }

  // Sarah-PM tasks
  if (subagentType.includes('sarah') || subagentType.includes('pm')) {
    console.log('\n🤖 Sarah-PM: Project coordination completed');
    console.log('   Recommendations:');
    console.log('   - Update project roadmap');
    console.log('   - Coordinate with other agents');
    console.log('   - Track sprint progress');
  }
}

/**
 * Quality Gates
 * Suggest running comprehensive validation
 */
if (taskResult?.success) {
  console.log('\n✅ Task completed successfully');
  console.log('   Next steps:');
  console.log('   1. Review changes with git diff');
  console.log('   2. Run test suite');
  console.log('   3. Commit with descriptive message');
} else {
  console.log('\n⚠️  Task completed with issues');
  console.log('   Recommendation: Review task output and address any errors');
}

console.log('\n' + '─'.repeat(60) + '\n');

process.exit(0);
