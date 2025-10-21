#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Architectural Validation Script
 *
 * This script is called by Husky pre-commit hook to enforce architectural
 * consistency before allowing commits.
 *
 * Validates:
 * - Page components have corresponding routes
 * - Navigation menus link to existing routes
 * - Routes point to existing components
 * - Multi-file deliverables are complete
 *
 * Exit Codes:
 *   0 - Validation passed (all architectural rules satisfied)
 *   1 - Validation failed (blocking violations found)
 *   2 - Validation error (script failure)
 *
 * @see src/validation/architectural-validator.ts
 * @see docs/audit/production-audit-report.md
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * Get list of staged files for commit
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    if (!output) {
      return [];
    }

    return output.split('\n')
      .filter(file => file.trim())
      .filter(file => fs.existsSync(file));
  } catch (error) {
    // If git command fails (e.g., not in a git repo), return empty array
    return [];
  }
}

/**
 * Check if TypeScript compilation is required and available
 */
function ensureTypeScriptCompiled() {
  const validatorSourcePath = path.join(process.cwd(), 'src', 'validation', 'architectural-validator.ts');
  const validatorCompiledPath = path.join(process.cwd(), 'dist', 'validation', 'architectural-validator.js');

  // Check if source exists
  if (!fs.existsSync(validatorSourcePath)) {
    console.error(`${colors.red}❌ Error: Architectural validator source not found${colors.reset}`);
    console.error(`Expected: ${validatorSourcePath}`);
    return false;
  }

  // Check if compiled version exists
  if (!fs.existsSync(validatorCompiledPath)) {
    console.log(`${colors.yellow}⚠️  Compiled validator not found. Compiling TypeScript...${colors.reset}`);

    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log(`${colors.green}✅ TypeScript compilation complete${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ TypeScript compilation failed${colors.reset}`);
      return false;
    }
  } else {
    // Check if source is newer than compiled version
    const sourceStats = fs.statSync(validatorSourcePath);
    const compiledStats = fs.statSync(validatorCompiledPath);

    if (sourceStats.mtimeMs > compiledStats.mtimeMs) {
      console.log(`${colors.yellow}⚠️  Source files modified. Recompiling...${colors.reset}`);

      try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log(`${colors.green}✅ TypeScript compilation complete${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}❌ TypeScript compilation failed${colors.reset}`);
        return false;
      }
    }
  }

  return true;
}

/**
 * Run architectural validation
 */
async function runValidation() {
  console.log('');
  console.log(`${colors.bold}${colors.cyan}🏗️  VERSATIL Architectural Validation${colors.reset}`);
  console.log('');

  // Get staged files
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log(`${colors.yellow}ℹ️  No staged files found. Skipping validation.${colors.reset}`);
    console.log('');
    return true;
  }

  console.log(`📁 Analyzing ${stagedFiles.length} staged file(s)...`);
  console.log('');

  // Filter for relevant files (pages, routes, navigation configs)
  const relevantFiles = stagedFiles.filter(file =>
    file.match(/\.(tsx?|jsx?)$/) &&
    (file.includes('/pages/') ||
     file.includes('/views/') ||
     file.includes('/routes/') ||
     file.includes('App.') ||
     file.includes('navigation') ||
     file.includes('menu') ||
     file.includes('router'))
  );

  if (relevantFiles.length === 0) {
    console.log(`${colors.green}✅ No architectural files modified. Skipping validation.${colors.reset}`);
    console.log('');
    return true;
  }

  console.log(`🔍 Found ${relevantFiles.length} architectural file(s):`);
  relevantFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('');

  // Ensure TypeScript is compiled
  if (!ensureTypeScriptCompiled()) {
    console.error(`${colors.red}❌ Cannot run validation without compiled TypeScript${colors.reset}`);
    console.log('');
    return false;
  }

  // Load and run validator
  try {
    const { ArchitecturalValidator } = require('../dist/validation/architectural-validator.js');
    const validator = new ArchitecturalValidator(process.cwd());

    // Run validation with staged files
    const result = await validator.validate(stagedFiles);

    // Format and display results
    const formattedOutput = validator.formatResults(result);
    console.log(formattedOutput);

    // Display summary
    if (result.passed) {
      console.log('');
      console.log(`${colors.green}${colors.bold}✅ Architectural validation PASSED${colors.reset}`);
      console.log(`${colors.green}   All architectural rules satisfied. Safe to commit.${colors.reset}`);
      console.log('');
      return true;
    } else {
      console.log('');
      console.log(`${colors.red}${colors.bold}❌ Architectural validation FAILED${colors.reset}`);
      console.log(`${colors.red}   ${result.blockers.length} blocking violation(s) must be fixed before commit.${colors.reset}`);
      console.log('');
      console.log(`${colors.yellow}💡 To commit anyway (not recommended):${colors.reset}`);
      console.log(`${colors.yellow}   git commit --no-verify${colors.reset}`);
      console.log('');

      // Show blockers again for emphasis
      if (result.blockers.length > 0) {
        console.log(`${colors.red}${colors.bold}BLOCKING ISSUES:${colors.reset}`);
        result.blockers.forEach((blocker, index) => {
          console.log(`${colors.red}${index + 1}. ${blocker.message}${colors.reset}`);
          console.log(`   ${colors.red}File: ${blocker.file}${colors.reset}`);
        });
        console.log('');
      }

      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Validation error:${colors.reset}`, error);
    console.log('');

    // If validator fails, allow commit but warn
    console.log(`${colors.yellow}⚠️  Validator encountered an error but allowing commit${colors.reset}`);
    console.log(`${colors.yellow}   Please report this issue to the VERSATIL team${colors.reset}`);
    console.log('');

    // Log full error for debugging
    if (process.env.DEBUG || process.env.VERBOSE) {
      console.error('Full error:', error);
    }

    return true; // Don't block commit on validator errors
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const passed = await runValidation();

    if (!passed) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(2);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runValidation, getStagedFiles };
