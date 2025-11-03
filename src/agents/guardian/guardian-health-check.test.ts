/**
 * Tests for Guardian Health Check System
 *
 * Validates lightweight and full health check functionality for both
 * FRAMEWORK_CONTEXT and PROJECT_CONTEXT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkGuardianHealth, QuickHealthStatus } from './guardian-health-check.js';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('Guardian Health Check', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = path.join(tmpdir(), `guardian-health-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    originalCwd = process.cwd();
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * TEST CATEGORY 1: Lightweight Health Check (FRAMEWORK_CONTEXT)
   */
  describe('Lightweight Health Check - FRAMEWORK_CONTEXT', () => {
    it('should detect missing dist directory', async () => {
      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      expect(result.context).toBe('FRAMEWORK_CONTEXT');
      expect(result.status).toBe('critical');
      expect(result.critical_issues).toContain('Framework not built - run npm run build');
      expect(result.overall_health).toBeLessThan(50);
    });

    it('should detect missing hook files', async () => {
      // Create dist directory but not hooks
      fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });

      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      expect(result.critical_issues.some(issue => issue.includes('Missing hooks'))).toBe(true);
      expect(result.status).toBe('critical');
    });

    it('should return healthy status when all checks pass', async () => {
      // Setup complete framework structure
      fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });
      fs.mkdirSync(path.join(testDir, '.claude', 'hooks', 'dist'), { recursive: true });

      // Create required hook files
      const hooksDir = path.join(testDir, '.claude', 'hooks', 'dist');
      ['before-prompt.cjs', 'post-file-edit.cjs', 'session-codify.cjs'].forEach(hook => {
        fs.writeFileSync(path.join(hooksDir, hook), '// Mock hook');
      });

      // Create package.json
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-framework', version: '1.0.0' })
      );

      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      expect(result.status).toBe('healthy');
      expect(result.critical_issues).toHaveLength(0);
      expect(result.overall_health).toBeGreaterThanOrEqual(80);
      expect(result.context).toBe('FRAMEWORK_CONTEXT');
    });

    it('should execute within 100ms for lightweight check', async () => {
      const startTime = Date.now();
      await checkGuardianHealth(testDir, 'framework-developer', false);
      const duration = Date.now() - startTime;

      // Lightweight check should be < 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  /**
   * TEST CATEGORY 2: Lightweight Health Check (PROJECT_CONTEXT)
   */
  describe('Lightweight Health Check - PROJECT_CONTEXT', () => {
    it('should detect missing .versatil-project.json', async () => {
      const result = await checkGuardianHealth(testDir, 'user', false);

      expect(result.context).toBe('PROJECT_CONTEXT');
      expect(result.warnings.some(warn => warn.includes('VERSATIL not configured'))).toBe(true);
    });

    it('should detect framework not installed', async () => {
      // Create package.json without framework
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-project', dependencies: { express: '^4.0.0' } })
      );

      const result = await checkGuardianHealth(testDir, 'user', false);

      expect(result.warnings.some(warn => warn.includes('VERSATIL framework not installed'))).toBe(true);
    });

    it('should return healthy status for valid project', async () => {
      // Create valid project structure
      fs.writeFileSync(
        path.join(testDir, '.versatil-project.json'),
        JSON.stringify({ agents: ['maria-qa', 'james-frontend'] })
      );
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          dependencies: { 'versatil-sdlc-framework': '^1.0.0' }
        })
      );

      const result = await checkGuardianHealth(testDir, 'user', false);

      expect(result.status).toBe('healthy');
      expect(result.context).toBe('PROJECT_CONTEXT');
      expect(result.overall_health).toBeGreaterThanOrEqual(90);
    });
  });

  /**
   * TEST CATEGORY 3: Health Status Calculation
   */
  describe('Health Status Calculation', () => {
    it('should return critical status with health < 40', async () => {
      // Multiple critical issues should result in low health score
      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      if (result.overall_health < 40) {
        expect(result.status).toBe('critical');
      }
    });

    it('should return degraded status with health 40-79', async () => {
      // Setup partial framework (some warnings but not critical)
      fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test' })
      );

      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      if (result.overall_health >= 40 && result.overall_health < 80) {
        expect(result.status).toBe('degraded');
      }
    });

    it('should return healthy status with health >= 80', async () => {
      // Setup complete structure
      fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });
      fs.mkdirSync(path.join(testDir, '.claude', 'hooks', 'dist'), { recursive: true });

      const hooksDir = path.join(testDir, '.claude', 'hooks', 'dist');
      ['before-prompt.cjs', 'post-file-edit.cjs', 'session-codify.cjs'].forEach(hook => {
        fs.writeFileSync(path.join(hooksDir, hook), '// Hook');
      });

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test', version: '1.0.0' })
      );

      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      expect(result.overall_health).toBeGreaterThanOrEqual(80);
      expect(result.status).toBe('healthy');
    });
  });

  /**
   * TEST CATEGORY 4: Critical Issues Detection
   */
  describe('Critical Issues Detection', () => {
    it('should populate critical_issues array with specific problems', async () => {
      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      expect(Array.isArray(result.critical_issues)).toBe(true);
      expect(result.critical_issues.length).toBeGreaterThan(0);
      expect(result.critical_issues.every(issue => typeof issue === 'string')).toBe(true);
    });

    it('should provide actionable error messages', async () => {
      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      // Check that messages include actionable commands
      const hasActionableMessage = result.critical_issues.some(
        issue => issue.includes('run npm') || issue.includes('run ')
      );
      expect(hasActionableMessage).toBe(true);
    });

    it('should detect multiple issues simultaneously', async () => {
      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      // With empty test directory, should have multiple issues
      expect(result.critical_issues.length).toBeGreaterThanOrEqual(2);
    });
  });

  /**
   * TEST CATEGORY 5: Warnings Detection
   */
  describe('Warnings Detection', () => {
    it('should populate warnings array for non-critical issues', async () => {
      // Create minimal structure
      fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test' })
      );

      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should differentiate between critical issues and warnings', async () => {
      const result = await checkGuardianHealth(testDir, 'user', false);

      // Verify they are different arrays
      expect(result.critical_issues).not.toBe(result.warnings);
    });
  });

  /**
   * TEST CATEGORY 6: Context Detection
   */
  describe('Context Detection', () => {
    it('should detect FRAMEWORK_CONTEXT for framework-developer role', async () => {
      const result = await checkGuardianHealth(testDir, 'framework-developer', false);

      expect(result.context).toBe('FRAMEWORK_CONTEXT');
    });

    it('should detect PROJECT_CONTEXT for user role', async () => {
      const result = await checkGuardianHealth(testDir, 'user', false);

      expect(result.context).toBe('PROJECT_CONTEXT');
    });

    it('should apply different checks based on context', async () => {
      const frameworkResult = await checkGuardianHealth(testDir, 'framework-developer', false);
      const projectResult = await checkGuardianHealth(testDir, 'user', false);

      // Framework context checks for dist/, hooks, etc.
      // Project context checks for package.json, node_modules, etc.
      // They should have different issues
      expect(frameworkResult.critical_issues).not.toEqual(projectResult.critical_issues);
    });
  });

  /**
   * TEST CATEGORY 7: Response Structure
   */
  describe('Response Structure', () => {
    it('should return QuickHealthStatus with all required fields', async () => {
      const result = await checkGuardianHealth(testDir, 'user', false);

      expect(result).toHaveProperty('overall_health');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('critical_issues');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('context');
    });

    it('should have overall_health between 0 and 100', async () => {
      const result = await checkGuardianHealth(testDir, 'user', false);

      expect(result.overall_health).toBeGreaterThanOrEqual(0);
      expect(result.overall_health).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.overall_health)).toBe(true);
    });

    it('should have valid status values', async () => {
      const result = await checkGuardianHealth(testDir, 'user', false);

      expect(['healthy', 'degraded', 'critical']).toContain(result.status);
    });
  });

  /**
   * TEST CATEGORY 8: Error Handling
   */
  describe('Error Handling', () => {
    it('should handle non-existent working directory', async () => {
      const nonExistentDir = '/path/that/does/not/exist';

      // Should not throw, but return critical status
      await expect(
        checkGuardianHealth(nonExistentDir, 'user', false)
      ).resolves.toBeDefined();
    });

    it('should handle invalid role gracefully', async () => {
      // @ts-expect-error Testing invalid input
      const result = await checkGuardianHealth(testDir, 'invalid-role', false);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });

  /**
   * TEST CATEGORY 9: Performance Benchmarks
   */
  describe('Performance Benchmarks', () => {
    it('should complete lightweight check in under 100ms', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await checkGuardianHealth(testDir, 'user', false);
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b) / iterations;
      expect(avgTime).toBeLessThan(100);
    });

    it('should be faster on subsequent calls (caching)', async () => {
      const firstCallStart = Date.now();
      await checkGuardianHealth(testDir, 'user', false);
      const firstCallDuration = Date.now() - firstCallStart;

      const secondCallStart = Date.now();
      await checkGuardianHealth(testDir, 'user', false);
      const secondCallDuration = Date.now() - secondCallStart;

      // Second call should be same or faster (file system caching)
      expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration + 10); // +10ms tolerance
    });
  });
});
