#!/usr/bin/env node
/**
 * Automated Fix: Convert require() imports to ES6 imports
 *
 * Fixes @typescript-eslint/no-require-imports errors
 *
 * Patterns fixed:
 * 1. const x = require('y') → import x from 'y'
 * 2. const { x } = require('y') → import { x } from 'y'
 * 3. const { x, y } = require('z') → import { x, y } from 'z'
 *
 * Usage: node scripts/fix-require-imports.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { resolve } from 'path';

interface Fix {
  file: string;
  line: number;
  before: string;
  after: string;
}

const fixes: Fix[] = [];
let totalFiles = 0;
let totalFixes = 0;

console.log('🔧 Automated Fix: Converting require() to ES6 imports\n');

// Find all TypeScript files
const files = glob.sync('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
});

totalFiles = files.length;
console.log(`📁 Scanning ${totalFiles} TypeScript files...\n`);

files.forEach(file => {
  const filePath = resolve(file);
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileModified = false;
  let lineNumber = 0;

  // Split into lines to track line numbers
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const originalLine = line;

    // Pattern 1: const x = require('y') or const x = require("y")
    const pattern1 = /^(\s*)const\s+(\w+)\s*=\s*require\(['"]([@\w\-\/\.]+)['"]\);?$/;
    if (pattern1.test(line)) {
      const match = line.match(pattern1);
      if (match) {
        const [, indent, varName, moduleName] = match;
        const newLine = `${indent}import ${varName} from '${moduleName}';`;
        lines[index] = newLine;
        fileModified = true;

        fixes.push({
          file: file,
          line: index + 1,
          before: originalLine.trim(),
          after: newLine.trim()
        });
      }
    }

    // Pattern 2: const { x } = require('y') - single destructure
    const pattern2 = /^(\s*)const\s+\{\s*(\w+)\s*\}\s*=\s*require\(['"]([@\w\-\/\.]+)['"]\);?$/;
    if (pattern2.test(line)) {
      const match = line.match(pattern2);
      if (match) {
        const [, indent, varName, moduleName] = match;
        const newLine = `${indent}import { ${varName} } from '${moduleName}';`;
        lines[index] = newLine;
        fileModified = true;

        fixes.push({
          file: file,
          line: index + 1,
          before: originalLine.trim(),
          after: newLine.trim()
        });
      }
    }

    // Pattern 3: const { x, y, z } = require('module') - multiple destructure
    const pattern3 = /^(\s*)const\s+\{\s*([\w\s,]+)\s*\}\s*=\s*require\(['"]([@\w\-\/\.]+)['"]\);?$/;
    if (pattern3.test(line) && !pattern2.test(line)) { // Avoid double-matching pattern 2
      const match = line.match(pattern3);
      if (match) {
        const [, indent, vars, moduleName] = match;
        const newLine = `${indent}import { ${vars.trim()} } from '${moduleName}';`;
        lines[index] = newLine;
        fileModified = true;

        fixes.push({
          file: file,
          line: index + 1,
          before: originalLine.trim(),
          after: newLine.trim()
        });
      }
    }
  });

  if (fileModified) {
    content = lines.join('\n');

    // Only write if content actually changed
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf8');
      totalFixes += fixes.filter(f => f.file === file).length;
      console.log(`✅ ${file}: ${fixes.filter(f => f.file === file).length} fix(es)`);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   Files scanned: ${totalFiles}`);
console.log(`   Files modified: ${fixes.length > 0 ? new Set(fixes.map(f => f.file)).size : 0}`);
console.log(`   Total fixes: ${totalFixes}`);

if (fixes.length > 0) {
  console.log(`\n✅ Successfully converted ${totalFixes} require() imports to ES6 imports!`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review changes: git diff`);
  console.log(`   2. Run linter: pnpm run lint`);
  console.log(`   3. Run tests: pnpm test`);
  console.log(`   4. Commit: git commit -am "fix: convert require() to ES6 imports"`);

  // Show sample of fixes
  if (fixes.length <= 10) {
    console.log(`\n📝 Changes made:`);
    fixes.forEach(fix => {
      console.log(`\n   ${fix.file}:${fix.line}`);
      console.log(`   - ${fix.before}`);
      console.log(`   + ${fix.after}`);
    });
  } else {
    console.log(`\n📝 Sample changes (showing first 5):`);
    fixes.slice(0, 5).forEach(fix => {
      console.log(`\n   ${fix.file}:${fix.line}`);
      console.log(`   - ${fix.before}`);
      console.log(`   + ${fix.after}`);
    });
    console.log(`\n   ... and ${fixes.length - 5} more`);
  }
} else {
  console.log(`\n✨ No require() imports found. All files already use ES6 imports!`);
}

console.log('\n' + '='.repeat(60) + '\n');
