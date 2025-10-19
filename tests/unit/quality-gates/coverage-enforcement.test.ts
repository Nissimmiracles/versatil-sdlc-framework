/**
 * Coverage Enforcement Tests
 *
 * Validates the pre-commit coverage threshold checker
 * Tests various coverage scenarios and error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Coverage Enforcement', () => {
  const testCoverageDir = path.join(process.cwd(), 'test-coverage-temp');
  const checkerScript = path.join(process.cwd(), 'scripts', 'check-coverage-threshold.cjs');

  beforeEach(() => {
    // Create temporary directory for test coverage reports
    if (!fs.existsSync(testCoverageDir)) {
      fs.mkdirSync(testCoverageDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(testCoverageDir)) {
      fs.rmSync(testCoverageDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper: Create mock coverage report
   */
  function createMockCoverageReport(
    statements: number,
    branches: number,
    functions: number,
    lines: number
  ): string {
    const coverageData = {
      total: {
        statements: { total: 100, covered: statements, skipped: 0, pct: statements },
        branches: { total: 100, covered: branches, skipped: 0, pct: branches },
        functions: { total: 100, covered: functions, skipped: 0, pct: functions },
        lines: { total: 100, covered: lines, skipped: 0, pct: lines },
      },
    };

    const reportPath = path.join(testCoverageDir, 'coverage-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(coverageData, null, 2));
    return reportPath;
  }

  /**
   * Helper: Run coverage checker script
   */
  function runCoverageChecker(coverageReportPath: string): { exitCode: number; output: string } {
    try {
      // Temporarily symlink coverage directory to test location
      const coverageDir = path.join(process.cwd(), 'coverage');
      const coverageBackup = coverageDir + '.backup';

      // Backup existing coverage if it exists
      if (fs.existsSync(coverageDir)) {
        fs.renameSync(coverageDir, coverageBackup);
      }

      // Create symlink to test coverage
      fs.symlinkSync(testCoverageDir, coverageDir, 'dir');

      const output = execSync(`node "${checkerScript}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Cleanup symlink
      fs.unlinkSync(coverageDir);

      // Restore original coverage
      if (fs.existsSync(coverageBackup)) {
        fs.renameSync(coverageBackup, coverageDir);
      }

      return { exitCode: 0, output };
    } catch (error: any) {
      // Cleanup symlink
      const coverageDir = path.join(process.cwd(), 'coverage');
      const coverageBackup = coverageDir + '.backup';

      if (fs.existsSync(coverageDir) && fs.lstatSync(coverageDir).isSymbolicLink()) {
        fs.unlinkSync(coverageDir);
      }

      if (fs.existsSync(coverageBackup)) {
        fs.renameSync(coverageBackup, coverageDir);
      }

      // Combine stdout and stderr
      const stdout = error.stdout?.toString() || '';
      const stderr = error.stderr?.toString() || '';
      const combinedOutput = stdout + '\n' + stderr;

      return {
        exitCode: error.status || 1,
        output: combinedOutput || error.message,
      };
    }
  }

  describe('Coverage Threshold Validation', () => {
    it('should PASS when all coverage metrics are >= 80%', () => {
      // Create coverage report with 85% coverage across all metrics
      createMockCoverageReport(85, 85, 85, 85);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('✅');
      expect(result.output).toContain('Coverage meets 80% threshold');
    });

    it('should FAIL when statements coverage is below 80%', () => {
      // Create coverage report with 75% statements coverage
      createMockCoverageReport(75, 85, 85, 85);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌');
      expect(result.output).toContain('Coverage below 80% threshold');
      expect(result.output).toContain('Statements');
    });

    it('should FAIL when branches coverage is below 80%', () => {
      // Create coverage report with 72% branches coverage
      createMockCoverageReport(85, 72, 85, 85);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌');
      expect(result.output).toContain('Branches');
    });

    it('should FAIL when functions coverage is below 80%', () => {
      // Create coverage report with 78% functions coverage
      createMockCoverageReport(85, 85, 78, 85);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌');
      expect(result.output).toContain('Functions');
    });

    it('should FAIL when lines coverage is below 80%', () => {
      // Create coverage report with 76% lines coverage
      createMockCoverageReport(85, 85, 85, 76);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌');
      expect(result.output).toContain('Lines');
    });

    it('should FAIL when multiple metrics are below 80%', () => {
      // Create coverage report with multiple low metrics
      createMockCoverageReport(75, 72, 78, 76);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('❌');
      expect(result.output).toContain('Coverage below 80% threshold');

      // Should mention all failed metrics
      expect(result.output).toContain('Statements');
      expect(result.output).toContain('Branches');
      expect(result.output).toContain('Functions');
      expect(result.output).toContain('Lines');
    });

    it('should PASS with exactly 80% coverage (boundary case)', () => {
      // Create coverage report with exactly 80% across all metrics
      createMockCoverageReport(80, 80, 80, 80);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('✅');
    });
  });

  describe('Error Handling', () => {
    it('should ERROR when coverage report is missing', () => {
      // Don't create any coverage report
      const result = runCoverageChecker('non-existent.json');

      expect(result.exitCode).toBe(2);
      expect(result.output).toContain('❌');
      expect(result.output).toContain('Coverage report not found');
    });

    it('should provide helpful suggestions when coverage is low', () => {
      createMockCoverageReport(75, 75, 75, 75);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('💡');
      expect(result.output).toContain('Add tests');
      expect(result.output).toContain('npm run test:coverage');
    });
  });

  describe('Output Format', () => {
    it('should display all four coverage metrics', () => {
      createMockCoverageReport(85, 85, 85, 85);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.output).toContain('Statements');
      expect(result.output).toContain('Branches');
      expect(result.output).toContain('Functions');
      expect(result.output).toContain('Lines');
    });

    it('should show percentage values in output', () => {
      createMockCoverageReport(85, 85, 85, 85);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.output).toContain('85');
      expect(result.output).toContain('%');
    });

    it('should indicate threshold requirement', () => {
      createMockCoverageReport(85, 85, 85, 85);

      const result = runCoverageChecker(path.join(testCoverageDir, 'coverage-summary.json'));

      expect(result.output).toContain('80%');
      expect(result.output).toContain('threshold');
    });
  });
});
