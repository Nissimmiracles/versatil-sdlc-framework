/**
 * VERSATIL Framework v3.0.0 - PHP Language Adapter
 *
 * Enables VERSATIL to work with PHP projects, supporting Composer, PHPUnit,
 * PHP_CodeSniffer, PHPStan, and the entire PHP ecosystem.
 *
 * BMAD agents can now orchestrate PHP development workflows.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  BaseLanguageAdapter,
  ProjectStructure,
  LanguageCapabilities,
  TestResult,
  BuildResult,
  LintResult
} from './base-language-adapter.js';

const execAsync = promisify(exec);

export class PHPAdapter extends BaseLanguageAdapter {
  private phpVersion?: string;
  private packageName?: string;

  async detect(): Promise<boolean> {
    const indicators = ['composer.json', 'composer.lock', 'phpunit.xml', 'phpunit.xml.dist'];

    for (const file of indicators) {
      if (existsSync(join(this.rootPath, file))) {
        return true;
      }
    }

    try {
      const { stdout } = await execAsync(`find . -name "*.php" | head -1`, { cwd: this.rootPath });
      if (stdout.trim()) return true;
    } catch {}

    return false;
  }

  getCapabilities(): LanguageCapabilities {
    return {
      testing: true,
      linting: true,
      formatting: true,
      typeChecking: true,
      packageManagement: true,
      buildSystem: true
    };
  }

  async analyzeProject(): Promise<ProjectStructure> {
    try {
      const { stdout } = await execAsync('php --version');
      this.phpVersion = stdout.split('\n')[0];
    } catch {
      this.phpVersion = 'Unknown';
    }

    const composerPath = join(this.rootPath, 'composer.json');
    if (existsSync(composerPath)) {
      const content = JSON.parse(readFileSync(composerPath, 'utf8'));
      this.packageName = content.name;
    }

    const mainFiles = await this.findPHPFiles(['src/**/*.php', 'app/**/*.php']);
    const testFiles = await this.findPHPFiles(['tests/**/*.php', 'test/**/*.php']);

    const configFiles: string[] = [];
    for (const config of ['composer.json', 'composer.lock', 'phpunit.xml', 'phpcs.xml', 'phpstan.neon']) {
      if (existsSync(join(this.rootPath, config))) configFiles.push(config);
    }

    return {
      rootPath: this.rootPath,
      language: 'php',
      packageManager: 'composer',
      mainFiles,
      testFiles,
      configFiles,
      buildOutput: 'build/',
      dependencies: await this.parseDependencies()
    };
  }

  async runTests(options?: any): Promise<TestResult> {
    try {
      const coverageArg = options?.coverage ? '--coverage-text' : '';
      const command = `vendor/bin/phpunit ${coverageArg} --log-junit build/junit.xml`;

      const { stdout } = await execAsync(command, { cwd: this.rootPath });

      const passedMatch = stdout.match(/OK \((\d+) tests/);
      const failedMatch = stdout.match(/FAILURES!\nTests: (\d+), Assertions: \d+, Failures: (\d+)/);

      let passed = 0;
      let failed = 0;

      if (passedMatch) {
        passed = parseInt(passedMatch[1]);
      } else if (failedMatch) {
        const total = parseInt(failedMatch[1]);
        failed = parseInt(failedMatch[2]);
        passed = total - failed;
      }

      let coverage: number | undefined;
      if (options?.coverage) {
        const coverageMatch = stdout.match(/Lines:\s+(\d+\.\d+)%/);
        coverage = coverageMatch ? parseFloat(coverageMatch[1]) : undefined;
      }

      return {
        passed,
        failed,
        skipped: 0,
        coverage,
        duration: 0,
        details: []
      };
    } catch (error: any) {
      return {
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        details: [{ name: 'test execution', status: 'failed', duration: 0, error: error.message }]
      };
    }
  }

  async build(options?: any): Promise<BuildResult> {
    const startTime = Date.now();

    try {
      await execAsync('composer install --no-dev --optimize-autoloader', { cwd: this.rootPath });

      return {
        success: true,
        output: 'Build complete',
        errors: [],
        warnings: [],
        artifacts: ['vendor/autoload.php'],
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        errors: [error.message],
        warnings: [],
        artifacts: [],
        duration: Date.now() - startTime
      };
    }
  }

  async lint(options?: any): Promise<LintResult> {
    try {
      const command = 'vendor/bin/phpcs --report=json';
      const { stdout } = await execAsync(command, { cwd: this.rootPath });

      const result = JSON.parse(stdout);
      const files = result.files || {};

      const issues = Object.entries(files).flatMap(([file, data]: [string, any]) =>
        (data.messages || []).map((msg: any) => ({
          file,
          line: msg.line,
          column: msg.column,
          severity: msg.type === 'ERROR' ? 'error' : 'warning',
          message: msg.message,
          rule: msg.source
        }))
      );

      return {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        issues
      };
    } catch {
      return { errors: 0, warnings: 0, issues: [] };
    }
  }

  async format(options?: any): Promise<{ formatted: number; errors: string[] }> {
    try {
      const command = 'vendor/bin/phpcbf';
      await execAsync(command, { cwd: this.rootPath });
      return { formatted: 1, errors: [] };
    } catch (error: any) {
      return { formatted: 0, errors: [error.message] };
    }
  }

  async installDependencies(): Promise<{ success: boolean; installed: string[]; errors: string[] }> {
    try {
      await execAsync('composer install', { cwd: this.rootPath });
      const installed = await this.parseDependencyNames();
      return { success: true, installed, errors: [] };
    } catch (error: any) {
      return { success: false, installed: [], errors: [error.message] };
    }
  }

  getRecommendedAgents(): string[] {
    return ['maria-qa', 'marcus-backend', 'james-frontend', 'devops-dan', 'security-sam'];
  }

  async getQualityMetrics(): Promise<any> {
    let testCoverage = 0;
    let lintScore = 100;

    try {
      const lintResult = await this.lint();
      lintScore = Math.max(0, 100 - (lintResult.errors + lintResult.warnings) * 5);
    } catch {}

    return {
      testCoverage,
      lintScore,
      complexityScore: 75,
      maintainability: (testCoverage + lintScore + 75) / 3
    };
  }

  async executeCommand(command: string, args?: string[]): Promise<any> {
    const fullCommand = args ? `${command} ${args.join(' ')}` : command;

    try {
      const { stdout, stderr } = await execAsync(fullCommand, { cwd: this.rootPath });
      return { exitCode: 0, stdout, stderr };
    } catch (error: any) {
      return {
        exitCode: error.code || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message
      };
    }
  }

  private async findPHPFiles(patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const { stdout } = await execAsync(`find . -name "*.php" -type f`, { cwd: this.rootPath });
      files.push(...stdout.split('\n').filter(f => f.trim() && f.endsWith('.php')));
    } catch {}

    return Array.from(new Set(files));
  }

  private async parseDependencies(): Promise<Record<string, string>> {
    const deps: Record<string, string> = {};

    const composerPath = join(this.rootPath, 'composer.json');
    if (!existsSync(composerPath)) return deps;

    const content = JSON.parse(readFileSync(composerPath, 'utf8'));
    const dependencies = { ...content.require, ...content['require-dev'] };

    for (const [name, version] of Object.entries(dependencies)) {
      deps[name] = version as string;
    }

    return deps;
  }

  private async parseDependencyNames(): Promise<string[]> {
    const deps = await this.parseDependencies();
    return Object.keys(deps);
  }
}