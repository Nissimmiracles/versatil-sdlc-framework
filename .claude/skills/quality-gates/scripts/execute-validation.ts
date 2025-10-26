#!/usr/bin/env tsx
/**
 * Quality Gates Validation - Bash Executable Wrapper
 *
 * Executes quality gate checks: test coverage, TypeScript compilation,
 * code quality metrics, and contract validation.
 *
 * Usage:
 *   npx tsx execute-validation.ts \
 *     --check coverage \
 *     --threshold 80
 *
 *   npx tsx execute-validation.ts \
 *     --check all \
 *     --output json
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CLIArgs {
  check: 'coverage' | 'typescript' | 'contracts' | 'all';
  threshold?: number;
  output?: 'json' | 'text';
}

interface ValidationResult {
  check: string;
  passed: boolean;
  score?: number;
  threshold?: number;
  message: string;
  details?: any;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    check: 'all',
    threshold: 80,
    output: 'json'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--check' && args[i + 1]) {
      parsed.check = args[i + 1] as any;
      i++;
    } else if (arg === '--threshold' && args[i + 1]) {
      parsed.threshold = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--output' && args[i + 1]) {
      parsed.output = args[i + 1] as any;
      i++;
    }
  }

  return parsed;
}

function checkCoverage(threshold: number): ValidationResult {
  try {
    // Run tests with coverage
    execSync('npm run test:coverage --silent', { stdio: 'pipe' });

    // Read coverage summary
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

    if (!fs.existsSync(coveragePath)) {
      return {
        check: 'coverage',
        passed: false,
        message: 'Coverage file not found - tests may not have run',
        score: 0,
        threshold
      };
    }

    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    const totalCoverage = coverageData.total;
    const avgCoverage = Math.round(
      (totalCoverage.lines.pct + totalCoverage.statements.pct +
       totalCoverage.functions.pct + totalCoverage.branches.pct) / 4
    );

    return {
      check: 'coverage',
      passed: avgCoverage >= threshold,
      score: avgCoverage,
      threshold,
      message: `Test coverage: ${avgCoverage}% (threshold: ${threshold}%)`,
      details: totalCoverage
    };

  } catch (error) {
    return {
      check: 'coverage',
      passed: false,
      message: `Coverage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      score: 0,
      threshold
    };
  }
}

function checkTypeScript(): ValidationResult {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });

    return {
      check: 'typescript',
      passed: true,
      message: 'TypeScript compilation successful - no type errors'
    };

  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorCount = (output.match(/error TS/g) || []).length;

    return {
      check: 'typescript',
      passed: false,
      message: `TypeScript compilation failed with ${errorCount} error(s)`,
      details: output.split('\n').slice(0, 10) // First 10 lines
    };
  }
}

function checkContracts(): ValidationResult {
  try {
    // Check if contract validation tests exist and pass
    const result = execSync('npm test -- tests/validation/contract-validation.test.ts --silent', {
      stdio: 'pipe'
    });

    return {
      check: 'contracts',
      passed: true,
      message: 'Agent contract validation passed'
    };

  } catch (error) {
    return {
      check: 'contracts',
      passed: false,
      message: 'Agent contract validation failed - check handoff contracts',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  try {
    const args = parseArgs();
    const results: ValidationResult[] = [];

    if (args.check === 'coverage' || args.check === 'all') {
      results.push(checkCoverage(args.threshold || 80));
    }

    if (args.check === 'typescript' || args.check === 'all') {
      results.push(checkTypeScript());
    }

    if (args.check === 'contracts' || args.check === 'all') {
      results.push(checkContracts());
    }

    const allPassed = results.every(r => r.passed);
    const summary = {
      overall_status: allPassed ? 'PASSED' : 'FAILED',
      checks_run: results.length,
      checks_passed: results.filter(r => r.passed).length,
      checks_failed: results.filter(r => !r.passed).length,
      results
    };

    console.log(JSON.stringify(summary, null, 2));
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error(JSON.stringify({
      overall_status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      results: []
    }, null, 2));
    process.exit(1);
  }
}

main();
