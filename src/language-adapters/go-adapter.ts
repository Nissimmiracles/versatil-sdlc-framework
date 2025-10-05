/**
 * VERSATIL Framework v3.0.0 - Go Language Adapter
 *
 * Enables VERSATIL to work with Go projects, supporting go test, go build,
 * golint, gofmt, and the entire Go toolchain.
 *
 * OPERA agents can now orchestrate Go development workflows.
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

export class GoAdapter extends BaseLanguageAdapter {
  private goVersion?: string;
  private modulePath?: string;

  /**
   * Detect if this is a Go project
   */
  async detect(): Promise<boolean> {
    // Primary indicator: go.mod file
    if (existsSync(join(this.rootPath, 'go.mod'))) {
      return true;
    }

    // Secondary indicators
    const indicators = [
      'go.sum',
      'main.go',
      'Makefile' // Often used in Go projects
    ];

    for (const file of indicators) {
      if (existsSync(join(this.rootPath, file))) {
        // Verify it's actually a Go project
        try {
          const { stdout } = await execAsync(`find . -name "*.go" | head -1`, {
            cwd: this.rootPath
          });
          if (stdout.trim()) {
            return true;
          }
        } catch {
          continue;
        }
      }
    }

    return false;
  }

  /**
   * Get Go-specific capabilities
   */
  getCapabilities(): LanguageCapabilities {
    return {
      testing: true,         // go test
      linting: true,         // golint, staticcheck
      formatting: true,      // gofmt, goimports
      typeChecking: true,    // Native Go type checking
      packageManagement: true, // go modules
      buildSystem: true      // go build
    };
  }

  /**
   * Analyze Go project structure
   */
  async analyzeProject(): Promise<ProjectStructure> {
    // Get Go version
    try {
      const { stdout } = await execAsync('go version');
      this.goVersion = stdout.trim();
    } catch {
      this.goVersion = 'Unknown';
    }

    // Parse go.mod for module path
    const goModPath = join(this.rootPath, 'go.mod');
    if (existsSync(goModPath)) {
      const content = readFileSync(goModPath, 'utf8');
      const moduleMatch = content.match(/^module\s+(.+)$/m);
      if (moduleMatch) {
        this.modulePath = moduleMatch[1];
      }
    }

    // Find Go source files
    const mainFiles = await this.findGoFiles(['*.go', 'cmd/**/*.go', 'internal/**/*.go', 'pkg/**/*.go']);

    // Find test files
    const testFiles = await this.findGoFiles(['*_test.go', '**/*_test.go']);

    // Find config files
    const configFiles: string[] = [];
    const configs = [
      'go.mod',
      'go.sum',
      'Makefile',
      '.golangci.yml',
      '.golangci.yaml'
    ];

    for (const config of configs) {
      if (existsSync(join(this.rootPath, config))) {
        configFiles.push(config);
      }
    }

    // Parse dependencies from go.mod
    const dependencies = await this.parseDependencies();

    return {
      rootPath: this.rootPath,
      language: 'go',
      packageManager: 'go modules',
      mainFiles: mainFiles.filter(f => !f.endsWith('_test.go')),
      testFiles,
      configFiles,
      buildOutput: 'bin/',
      dependencies
    };
  }

  /**
   * Run Go tests
   */
  async runTests(options?: {
    pattern?: string;
    coverage?: boolean;
    watch?: boolean;
  }): Promise<TestResult> {
    const coverageArg = options?.coverage ? '-cover -coverprofile=coverage.out' : '';
    const patternArg = options?.pattern ? `-run ${options.pattern}` : '';

    try {
      const { stdout } = await execAsync(
        `go test ./... -v -json ${coverageArg} ${patternArg}`,
        { cwd: this.rootPath }
      );

      // Parse Go test JSON output
      const lines = stdout.split('\n').filter(l => l.trim());
      const testResults: any[] = [];
      let passed = 0;
      let failed = 0;
      let skipped = 0;
      let totalDuration = 0;

      for (const line of lines) {
        try {
          const event = JSON.parse(line);

          if (event.Action === 'pass' && event.Test) {
            passed++;
            testResults.push({
              name: event.Test,
              status: 'passed',
              duration: event.Elapsed || 0
            });
            totalDuration += event.Elapsed || 0;
          } else if (event.Action === 'fail' && event.Test) {
            failed++;
            testResults.push({
              name: event.Test,
              status: 'failed',
              duration: event.Elapsed || 0,
              error: event.Output
            });
            totalDuration += event.Elapsed || 0;
          } else if (event.Action === 'skip' && event.Test) {
            skipped++;
            testResults.push({
              name: event.Test,
              status: 'skipped',
              duration: 0
            });
          }
        } catch {
          // Not JSON, skip
        }
      }

      // Get coverage if requested
      let coverage: number | undefined;
      if (options?.coverage && existsSync(join(this.rootPath, 'coverage.out'))) {
        try {
          const { stdout: covOut } = await execAsync('go tool cover -func=coverage.out', {
            cwd: this.rootPath
          });
          const match = covOut.match(/total:\s+\(statements\)\s+([\d.]+)%/);
          coverage = match ? parseFloat(match[1]) : undefined;
        } catch {
          coverage = undefined;
        }
      }

      return {
        passed,
        failed,
        skipped,
        coverage,
        duration: totalDuration,
        details: testResults
      };
    } catch (error: any) {
      // Parse error output
      return {
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        details: [{
          name: 'test execution',
          status: 'failed',
          duration: 0,
          error: error.message
        }]
      };
    }
  }

  /**
   * Build Go project
   */
  async build(options?: {
    mode?: 'development' | 'production';
    target?: string;
    optimization?: boolean;
  }): Promise<BuildResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const artifacts: string[] = [];

    try {
      const outputDir = options?.target || './bin';
      const optimizationFlags = options?.optimization
        ? '-ldflags="-s -w"'  // Strip debug info and symbol table
        : '';

      const buildCmd = `go build ${optimizationFlags} -o ${outputDir}/ ./...`;

      const { stdout, stderr } = await execAsync(buildCmd, { cwd: this.rootPath });

      // Check for built binaries
      try {
        const { stdout: files } = await execAsync(`ls "${outputDir}"`);
        artifacts.push(...files.split('\n').filter(f => f));
      } catch {
        // No artifacts found
      }

      return {
        success: true,
        output: stdout,
        errors,
        warnings: stderr ? [stderr] : [],
        artifacts,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        output: error.stdout || '',
        errors,
        warnings: error.stderr ? [error.stderr] : [],
        artifacts,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Lint Go code using golangci-lint
   */
  async lint(options?: {
    fix?: boolean;
    files?: string[];
  }): Promise<LintResult> {
    const fixArg = options?.fix ? '--fix' : '';
    const files = options?.files?.join(' ') || './...';

    try {
      // Try golangci-lint first (comprehensive linter)
      const { stdout } = await execAsync(
        `golangci-lint run ${fixArg} --out-format=json ${files}`,
        { cwd: this.rootPath }
      );

      const result = JSON.parse(stdout);
      const issues = result.Issues || [];

      return {
        errors: issues.filter((i: any) => i.Severity === 'error').length,
        warnings: issues.filter((i: any) => i.Severity === 'warning').length,
        issues: issues.map((issue: any) => ({
          file: issue.Pos.Filename,
          line: issue.Pos.Line,
          column: issue.Pos.Column,
          severity: issue.Severity === 'error' ? 'error' : 'warning',
          message: issue.Text,
          rule: issue.FromLinter
        }))
      };
    } catch {
      // Fallback to go vet
      try {
        const { stdout } = await execAsync(`go vet ${files}`, { cwd: this.rootPath });

        // Parse go vet output
        const issues = stdout.split('\n')
          .filter(line => line.includes(':'))
          .map(line => {
            const match = line.match(/^(.+):(\d+):(\d+): (.+)$/);
            if (!match) return null;

            return {
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              severity: 'warning' as const,
              message: match[4],
              rule: 'go vet'
            };
          })
          .filter(i => i !== null) as any[];

        return {
          errors: 0,
          warnings: issues.length,
          issues
        };
      } catch {
        return { errors: 0, warnings: 0, issues: [] };
      }
    }
  }

  /**
   * Format Go code using gofmt
   */
  async format(options?: {
    files?: string[];
    check?: boolean;
  }): Promise<{ formatted: number; errors: string[] }> {
    const files = options?.files?.join(' ') || '.';

    try {
      if (options?.check) {
        // Check formatting without modifying
        const { stdout } = await execAsync(`gofmt -l ${files}`, { cwd: this.rootPath });
        const unformatted = stdout.split('\n').filter(f => f.trim()).length;
        return { formatted: 0, errors: unformatted > 0 ? [`${unformatted} files need formatting`] : [] };
      } else {
        // Format files
        await execAsync(`gofmt -w ${files}`, { cwd: this.rootPath });

        // Also run goimports if available
        try {
          await execAsync(`goimports -w ${files}`, { cwd: this.rootPath });
        } catch {
          // goimports not available, skip
        }

        return { formatted: 1, errors: [] };
      }
    } catch (error: any) {
      return { formatted: 0, errors: [error.message] };
    }
  }

  /**
   * Install Go dependencies
   */
  async installDependencies(): Promise<{
    success: boolean;
    installed: string[];
    errors: string[];
  }> {
    try {
      // Download dependencies
      const { stdout } = await execAsync('go mod download', { cwd: this.rootPath });

      // Tidy dependencies
      await execAsync('go mod tidy', { cwd: this.rootPath });

      // Parse installed modules
      const { stdout: listOut } = await execAsync('go list -m all', { cwd: this.rootPath });
      const installed = listOut.split('\n')
        .filter(line => line.trim() && !line.startsWith(this.modulePath || ''))
        .map(line => line.split(' ')[0]);

      return { success: true, installed, errors: [] };
    } catch (error: any) {
      return { success: false, installed: [], errors: [error.message] };
    }
  }

  /**
   * Get recommended OPERA agents for Go projects
   */
  getRecommendedAgents(): string[] {
    return [
      'maria-qa',          // Testing with go test
      'marcus-backend',    // Backend/API development (common in Go)
      'devops-dan',        // Deployment (Docker, Kubernetes - Go's strength)
      'security-sam',      // Security (gosec, nancy)
      'architecture-dan'   // System design (Go for microservices)
    ];
  }

  /**
   * Get Go-specific quality metrics
   */
  async getQualityMetrics(): Promise<{
    testCoverage: number;
    lintScore: number;
    complexityScore: number;
    maintainability: number;
  }> {
    // Run coverage
    let testCoverage = 0;
    try {
      const { stdout } = await execAsync('go test ./... -cover', { cwd: this.rootPath });
      const match = stdout.match(/coverage: ([\d.]+)% of statements/);
      testCoverage = match ? parseFloat(match[1]) : 0;
    } catch {
      testCoverage = 0;
    }

    // Run lint for score (golangci-lint or go vet)
    let lintScore = 100;
    try {
      const lintResult = await this.lint();
      const totalIssues = lintResult.errors + lintResult.warnings;
      lintScore = Math.max(0, 100 - (totalIssues * 5)); // Deduct 5 points per issue
    } catch {
      lintScore = 100;
    }

    // TODO: Implement cyclomatic complexity analysis using gocyclo
    const complexityScore = 80;

    return {
      testCoverage,
      lintScore,
      complexityScore,
      maintainability: (testCoverage + lintScore + complexityScore) / 3
    };
  }

  /**
   * Execute Go-specific command
   */
  async executeCommand(command: string, args?: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
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

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async findGoFiles(patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of patterns) {
      try {
        const { stdout } = await execAsync(`find . -name "${pattern}" -type f`, {
          cwd: this.rootPath
        });

        files.push(...stdout.split('\n').filter(f => f.trim() && f.endsWith('.go')));
      } catch {
        // Pattern not found, continue
      }
    }

    return Array.from(new Set(files)); // Remove duplicates
  }

  private async parseDependencies(): Promise<Record<string, string>> {
    const deps: Record<string, string> = {};

    const goModPath = join(this.rootPath, 'go.mod');
    if (!existsSync(goModPath)) {
      return deps;
    }

    const content = readFileSync(goModPath, 'utf8');

    // Parse require block
    const requireMatch = content.match(/require\s*\(([^)]+)\)/s);
    if (requireMatch) {
      const requireBlock = requireMatch[1];
      const lines = requireBlock.split('\n');

      for (const line of lines) {
        const match = line.trim().match(/^([^\s]+)\s+v?([^\s]+)/);
        if (match) {
          deps[match[1]] = match[2];
        }
      }
    }

    // Parse single-line requires
    const singleRequires = content.matchAll(/require\s+([^\s]+)\s+v?([^\s]+)/g);
    for (const match of singleRequires) {
      deps[match[1]] = match[2];
    }

    return deps;
  }
}