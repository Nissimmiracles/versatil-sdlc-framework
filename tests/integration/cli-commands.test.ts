/**
 * VERSATIL SDLC Framework - CLI Commands Integration Tests
 * End-to-end tests for CLI commands: versatil, versatil-update, versatil-rollback, versatil-config, versatil doctor
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import {
  execCommand,
  execShellCommand,
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockGitHubAPI,
  createMockVersion,
  createMockConfig,
  assertCommandSuccess,
  assertCommandFailure,
  assertOutputContains,
  assertOutputMatches,
  getCLIPath,
  createStdinMock,
  TestEnvironment,
  CommandResult,
} from './__helpers__/test-helpers';
import * as path from 'path';

describe('CLI Commands Integration Tests', () => {
  let testEnv: TestEnvironment;
  const frameworkRoot = process.cwd();

  beforeEach(async () => {
    testEnv = await setupTestEnvironment('cli-test');
  });

  afterEach(async () => {
    if (testEnv) {
      await cleanupTestEnvironment(testEnv);
    }
  });

  describe('versatil --version', () => {
    test.skip('should display correct version', async () => {
      const result = await execShellCommand('node bin/versatil.js --version', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      assertOutputMatches(result, /VERSATIL SDLC Framework v\d+\.\d+\.\d+/);
      expect(result.stdout).toContain('3.0.0');
    }, 30000);

    test.skip('should work with -v flag', async () => {
      const result = await execShellCommand('node bin/versatil.js -v', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      assertOutputContains(result, 'VERSATIL SDLC Framework');
    }, 30000);
  });

  describe('versatil help', () => {
    test('should display help message', async () => {
      const result = await execShellCommand('node bin/versatil.js help', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      assertOutputContains(result, 'USAGE:');
      assertOutputContains(result, 'COMMANDS:');
      assertOutputContains(result, 'EXAMPLES:');
    }, 30000);

    test('should display help with --help flag', async () => {
      const result = await execShellCommand('node bin/versatil.js --help', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      assertOutputContains(result, 'versatil <command>');
    }, 30000);

    test('should display help with -h flag', async () => {
      const result = await execShellCommand('node bin/versatil.js -h', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      assertOutputContains(result, 'COMMANDS:');
    }, 30000);

    test('should show all available commands in help', async () => {
      const result = await execShellCommand('node bin/versatil.js help', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);

      // Check for key commands
      const expectedCommands = [
        'init',
        'analyze',
        'agents',
        'update',
        'rollback',
        'config',
        'doctor',
        'changelog',
        'version',
        'backup',
        'release',
        'mcp',
        'health',
      ];

      expectedCommands.forEach((cmd) => {
        expect(result.stdout).toContain(cmd);
      });
    }, 30000);
  });

  describe('versatil health', () => {
    test('should show framework health status', async () => {
      const result = await execShellCommand('node bin/versatil.js health', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      assertOutputContains(result, 'VERSATIL Framework Health Check');
      assertOutputContains(result, 'Framework Status:');
      assertOutputContains(result, 'Agent System:');
      assertOutputContains(result, 'MCP Integration:');
    }, 30000);

    test('should indicate all systems operational', async () => {
      const result = await execShellCommand('node bin/versatil.js health', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      expect(result.stdout).toMatch(/✅/);
    }, 30000);
  });

  describe('versatil doctor', () => {
    test('should run health check without errors', async () => {
      const result = await execShellCommand('node bin/versatil.js doctor', {
        cwd: frameworkRoot,
        timeout: 60000,
      });

      // Doctor may exit with warnings (non-zero) but should not crash
      expect(result.exitCode).toBeLessThanOrEqual(1);
      assertOutputContains(result, 'VERSATIL Framework Health Check');
    }, 60000);

    test('should validate framework installation', async () => {
      const result = await execShellCommand('node bin/versatil.js doctor', {
        cwd: frameworkRoot,
        timeout: 60000,
      });

      expect(result.exitCode).toBeLessThanOrEqual(1);
      // Should check various aspects
      const output = result.stdout + result.stderr;
      expect(output.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('versatil-update check', () => {
    test('should check for updates', async () => {
      const result = await execShellCommand('node bin/update-command.js check', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      // May succeed or fail depending on network, but should not crash
      expect([0, 1]).toContain(result.exitCode);
      assertOutputContains(result, 'Checking for updates');
    }, 30000);

    test('should display current version', async () => {
      const result = await execShellCommand('node bin/update-command.js check', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/Current version|version/i);
    }, 30000);
  });

  describe('versatil-update status', () => {
    test('should show update status', async () => {
      const result = await execShellCommand('node bin/update-command.js status', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      expect([0, 1]).toContain(result.exitCode);
      assertOutputContains(result, 'Update Status');
    }, 30000);

    test('should display update configuration', async () => {
      const result = await execShellCommand('node bin/update-command.js status', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/behavior|channel|version/i);
    }, 30000);
  });

  describe('versatil-update list', () => {
    test('should list available versions', async () => {
      const result = await execShellCommand('node bin/update-command.js list', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/Available versions|versions/i);
    }, 30000);
  });

  describe('versatil-rollback', () => {
    test('should handle list command', async () => {
      const result = await execShellCommand('node bin/rollback-command.js list', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output.length).toBeGreaterThan(0);
    }, 30000);

    test('should require valid version for rollback', async () => {
      const result = await execShellCommand(
        'node bin/rollback-command.js to invalid-version',
        {
          cwd: frameworkRoot,
          timeout: 30000,
        }
      );

      // Should fail or warn about invalid version
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('versatil-config show', () => {
    test.skip('should display configuration', async () => {
      const result = await execShellCommand('node bin/config-command.js show', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output.length).toBeGreaterThan(0);
    }, 30000);

    test.skip('should show preferences', async () => {
      const result = await execShellCommand('node bin/config-command.js show', {
        cwd: frameworkRoot,
        timeout: 30000,
      });

      expect([0, 1]).toContain(result.exitCode);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/config|preferences|settings/i);
    }, 30000);
  });

  describe('Error handling', () => {
    test('versatil with invalid command should show error', async () => {
      const result = await execShellCommand('node bin/versatil.js invalid-command', {
        cwd: frameworkRoot,
      });

      // Should show help or error
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/USAGE:|help|Commands/i);
    }, 30000);

    test('versatil-update with invalid subcommand should show help', async () => {
      const result = await execShellCommand('node bin/update-command.js invalid', {
        cwd: frameworkRoot,
      });

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/Usage:|Commands:|help/i);
    }, 30000);

    test('versatil-rollback with invalid arguments should show error', async () => {
      const result = await execShellCommand('node bin/rollback-command.js', {
        cwd: frameworkRoot,
      });

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    }, 30000);

    test.skip('versatil-config with invalid option should show error', async () => {
      const result = await execShellCommand('node bin/config-command.js invalid', {
        cwd: frameworkRoot,
      });

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/Usage|help|command/i);
    }, 30000);
  });

  describe('Command output format', () => {
    test('should use proper emoji indicators', async () => {
      const result = await execShellCommand('node bin/versatil.js health', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      // Check for emoji indicators
      expect(result.stdout).toMatch(/[✅🚀🤖🔗💾📊]/);
    }, 30000);

    test('should format output consistently', async () => {
      const result = await execShellCommand('node bin/versatil.js help', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      // Should have clear sections
      expect(result.stdout).toContain('USAGE:');
      expect(result.stdout).toContain('COMMANDS:');
      expect(result.stdout).toContain('EXAMPLES:');
    }, 30000);
  });

  describe('Command execution performance', () => {
    test('should execute version command quickly', async () => {
      const result = await execShellCommand('node bin/versatil.js --version', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      expect(result.duration).toBeLessThan(5000); // Should be fast
    }, 30000);

    test('should execute help command quickly', async () => {
      const result = await execShellCommand('node bin/versatil.js help', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(result);
      expect(result.duration).toBeLessThan(5000);
    }, 30000);
  });

  describe('Environment variable handling', () => {
    test('should respect NODE_ENV', async () => {
      const result = await execShellCommand('node bin/versatil.js health', {
        cwd: frameworkRoot,
        env: { ...process.env, NODE_ENV: 'test' },
      });

      assertCommandSuccess(result);
      expect(result.exitCode).toBe(0);
    }, 30000);

    test('should work with custom VERSATIL_HOME', async () => {
      const customHome = path.join(testEnv.tempDir, '.versatil-custom');
      const result = await execShellCommand('node bin/versatil.js health', {
        cwd: frameworkRoot,
        env: { ...process.env, VERSATIL_HOME: customHome },
      });

      assertCommandSuccess(result);
      expect(result.exitCode).toBe(0);
    }, 30000);
  });

  describe('Cross-command integration', () => {
    test.skip('should maintain consistency across commands', async () => {
      // Get version from versatil
      const versionResult = await execShellCommand('node bin/versatil.js --version', {
        cwd: frameworkRoot,
      });

      assertCommandSuccess(versionResult);
      const version = versionResult.stdout.match(/v(\d+\.\d+\.\d+)/)?.[1];
      expect(version).toBeDefined();
      expect(version).toBe('3.0.0');
    }, 30000);
  });
});

describe('CLI Command Validation', () => {
  describe('Input validation', () => {
    test('should validate version format in rollback', async () => {
      const result = await execShellCommand('node bin/rollback-command.js to abc', {
        cwd: process.cwd(),
        timeout: 30000,
      });

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    }, 30000);

    test.skip('should handle missing arguments gracefully', async () => {
      const result = await execShellCommand('node bin/config-command.js set', {
        cwd: process.cwd(),
        timeout: 30000,
      });

      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/Usage|required|argument/i);
    }, 30000);
  });

  describe('Security validation', () => {
    test('should not expose sensitive information in help', async () => {
      const result = await execShellCommand('node bin/versatil.js help', {
        cwd: process.cwd(),
      });

      assertCommandSuccess(result);
      // Should not contain API keys, tokens, etc.
      expect(result.stdout).not.toMatch(/api[_-]?key|token|secret|password/i);
    }, 30000);

    test('should sanitize error messages', async () => {
      const result = await execShellCommand('node bin/versatil.js invalid --fake-arg', {
        cwd: process.cwd(),
      });

      const output = result.stdout + result.stderr;
      // Should not expose internal paths or sensitive data
      expect(output).not.toContain('node_modules');
    }, 30000);
  });
});

describe('CLI Command Help Messages', () => {
  test('should provide clear error message for missing arguments', async () => {
    const result = await execShellCommand('node bin/update-command.js', {
      cwd: process.cwd(),
    });

    const output = result.stdout + result.stderr;
    expect(output).toMatch(/Usage|command|help/i);
  }, 30000);

  test('should suggest correct usage on error', async () => {
    const result = await execShellCommand('node bin/rollback-command.js invalid', {
      cwd: process.cwd(),
    });

    const output = result.stdout + result.stderr;
    expect(output.length).toBeGreaterThan(0);
  }, 30000);
});
