#!/usr/bin/env -S npx tsx
/**
 * Post-Build Hook
 * Triggers after build commands complete
 * Maps to VERSATIL's "afterBuild" lifecycle event
 *
 * SDK Hook: PostToolUse with matcher "Bash" (detects build commands)
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

interface HookInput {
  toolName: string;
  command?: string;
  workingDirectory: string;
  sessionId: string;
  exitCode?: number;
}

// Read hook input from stdin
const input: HookInput = JSON.parse(readFileSync(0, 'utf-8'));

const { command, exitCode, workingDirectory } = input;

// Only trigger for build-related commands
if (!command || !command.match(/npm (run )?build|yarn build|pnpm build|tsc|webpack|vite build/)) {
  process.exit(0);
}

console.log('\n🏗️  Build command detected');
console.log(`   Command: ${command}`);
console.log(`   Exit code: ${exitCode ?? 'unknown'}`);

if (exitCode === 0) {
  console.log('\n✅ Build succeeded');
  console.log('\n🤖 Maria-QA: Build completed - Quality validation recommended');
  console.log('   Post-Build Quality Gates:');
  console.log('   1. ✅ Build successful');
  console.log('   2. 🧪 Run full test suite: npm test');
  console.log('   3. 📊 Check test coverage: npm run test:coverage');
  console.log('   4. 🔒 Run security audit: npm audit');
  console.log('   5. ♿ Validate accessibility: npm run test:a11y (if configured)');
  console.log('   6. 📦 Check bundle size: npm run analyze (if configured)');

  console.log('\n💡 Production Readiness Checklist:');
  console.log('   - [ ] Tests pass (80%+ coverage)');
  console.log('   - [ ] No high-severity vulnerabilities');
  console.log('   - [ ] Accessibility compliance (WCAG 2.1 AA)');
  console.log('   - [ ] Performance budgets met');
  console.log('   - [ ] Code reviewed and approved');

} else {
  console.log('\n❌ Build failed');
  console.log('\n🤖 Maria-QA: Build errors detected - Fix required before deployment');
  console.log('   Recommendations:');
  console.log('   1. Review build output for specific errors');
  console.log('   2. Check TypeScript/ESLint errors');
  console.log('   3. Verify all dependencies are installed');
  console.log('   4. Run: npm install && npm run build');
}

console.log('\n' + '─'.repeat(60) + '\n');

process.exit(0);
