#!/usr/bin/env node
/**
 * Automated Fix: Wrap case declarations in blocks
 *
 * Fixes no-case-declarations errors by wrapping case bodies in blocks
 *
 * Pattern fixed:
 * ❌ Before:
 * case 'foo':
 *   const x = 1;
 *   break;
 *
 * ✅ After:
 * case 'foo': {
 *   const x = 1;
 *   break;
 * }
 *
 * Usage: node scripts/fix-case-declarations.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { resolve } from 'path';

interface Fix {
  file: string;
  lineStart: number;
  lineEnd: number;
}

const fixes: Fix[] = [];
let totalFiles = 0;
let totalFixes = 0;

console.log('🔧 Automated Fix: Wrapping case declarations in blocks\n');

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

  // Split into lines
  const lines = content.split('\n');
  const newLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect case statements that need wrapping
    // Pattern: case 'x': or case "x": or default:
    if (/^case\s+['"]\w+['"]:\s*$/.test(trimmed) || /^case\s+\w+:\s*$/.test(trimmed) || /^default:\s*$/.test(trimmed)) {
      // Check if next line has a declaration (const, let, var, function, class)
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

      if (nextLine && /^(const|let|var|function|class)\s/.test(nextLine)) {
        // Found a case that needs wrapping
        const indent = line.match(/^(\s*)/)?.[1] || '';
        const caseIndent = indent;
        const bodyIndent = lines[i + 1].match(/^(\s*)/)?.[1] || indent + '  ';

        // Add opening brace
        newLines.push(line.replace(/:(\s*)$/, ': {$1'));

        // Find where case body ends (break, return, or next case/default)
        let endIndex = i + 1;
        let foundEnd = false;

        while (endIndex < lines.length && !foundEnd) {
          const currentLine = lines[endIndex];
          const currentTrimmed = currentLine.trim();

          // Check if we've reached the end of this case
          if (/^(case\s+|default:)/.test(currentTrimmed)) {
            // Next case found, close before it
            newLines.push(`${caseIndent}}`);
            foundEnd = true;
            fileModified = true;
            fixes.push({
              file: file,
              lineStart: i + 1,
              lineEnd: endIndex
            });
            break;
          } else if (currentTrimmed === 'break;' || currentTrimmed.startsWith('return')) {
            // Add the break/return line
            newLines.push(currentLine);
            // Add closing brace after break/return
            newLines.push(`${caseIndent}}`);
            foundEnd = true;
            fileModified = true;
            endIndex++;
            fixes.push({
              file: file,
              lineStart: i + 1,
              lineEnd: endIndex
            });
            i = endIndex - 1; // Will be incremented at end of loop
            break;
          } else if (endIndex === lines.length - 1) {
            // End of file
            newLines.push(currentLine);
            newLines.push(`${caseIndent}}`);
            foundEnd = true;
            fileModified = true;
            endIndex++;
            fixes.push({
              file: file,
              lineStart: i + 1,
              lineEnd: endIndex
            });
            i = endIndex - 1;
            break;
          } else {
            // Regular line in case body
            newLines.push(currentLine);
          }

          endIndex++;
        }

        if (!foundEnd) {
          // Fallback: just add the case line without modification
          newLines.push(line);
        }
      } else {
        // No declaration on next line, no need to wrap
        newLines.push(line);
      }
    } else {
      // Not a case statement
      newLines.push(line);
    }

    i++;
  }

  if (fileModified) {
    content = newLines.join('\n');

    // Only write if content actually changed
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf8');
      const fileFixes = fixes.filter(f => f.file === file).length;
      totalFixes += fileFixes;
      console.log(`✅ ${file}: ${fileFixes} case(s) wrapped`);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   Files scanned: ${totalFiles}`);
console.log(`   Files modified: ${fixes.length > 0 ? new Set(fixes.map(f => f.file)).size : 0}`);
console.log(`   Total fixes: ${totalFixes}`);

if (fixes.length > 0) {
  console.log(`\n✅ Successfully wrapped ${totalFixes} case declarations in blocks!`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review changes: git diff`);
  console.log(`   2. Run linter: pnpm run lint`);
  console.log(`   3. Run tests: pnpm test`);
  console.log(`   4. Commit: git commit -am "fix: wrap case declarations in blocks"`);
} else {
  console.log(`\n✨ No unwrapped case declarations found!`);
}

console.log('\n' + '='.repeat(60) + '\n');
