/**
 * VERSATIL Framework v3.0.0 - Python Language Adapter
 *
 * Enables VERSATIL to work with Python projects, supporting pytest, poetry, pip,
 * pylint, black, mypy, and other Python ecosystem tools.
 *
 * OPERA agents can now orchestrate Python development workflows.
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

export class PythonAdapter extends BaseLanguageAdapter {
  private packageManager: 'pip' | 'poetry' | 'pipenv' | null = null;
  private pythonVersion?: string;

  /**
   * Detect if this is a Python project
   */
  async detect(): Promise<boolean> {
    const indicators = [
      'setup.py',
      'pyproject.toml',
      'requirements.txt',
      'Pipfile',
      'poetry.lock',
      'setup.cfg',
      'tox.ini',
      '.python-version'
    ];

    // Check for Python project indicators
    for (const file of indicators) {
      if (existsSync(join(this.rootPath, file))) {
        return true;
      }
    }

    // Check for common Python directories
    const pythonDirs = ['src/', 'tests/', 'test/'];
    for (const dir of pythonDirs) {
      const dirPath = join(this.rootPath, dir);
      if (existsSync(dirPath)) {
        // Look for .py files
        try {
          const { stdout } = await execAsync(`find "${dirPath}" -name "*.py" | head -1`, {
            cwd: this.rootPath
          });
          if (stdout.trim()) {
            return true;
          }
        } catch {
          // Continue checking
        }
      }
    }

    return false;
  }

  /**
   * Get Python-specific capabilities
   */
  getCapabilities(): LanguageCapabilities {
    return {
      testing: true,         // pytest
      linting: true,         // pylint, flake8
      formatting: true,      // black, autopep8
      typeChecking: true,    // mypy
      packageManagement: true, // pip, poetry
      buildSystem: true      // setup.py, pyproject.toml
    };
  }

  /**
   * Analyze Python project structure
   */
  async analyzeProject(): Promise<ProjectStructure> {
    // Detect package manager
    await this.detectPackageManager();

    // Get Python version
    try {
      const { stdout } = await execAsync('python3 --version');
      this.pythonVersion = stdout.trim();
    } catch {
      this.pythonVersion = 'Unknown';
    }

    // Find main Python files
    const mainFiles = await this.findPythonFiles(['*.py', 'src/**/*.py', 'app/**/*.py']);

    // Find test files
    const testFiles = await this.findPythonFiles([
      'test_*.py',
      'tests/**/*.py',
      'test/**/*.py',
      '*_test.py'
    ]);

    // Find config files
    const configFiles: string[] = [];
    const configs = [
      'setup.py',
      'setup.cfg',
      'pyproject.toml',
      'requirements.txt',
      'requirements-dev.txt',
      'Pipfile',
      'poetry.lock',
      'tox.ini',
      'pytest.ini',
      '.pylintrc',
      'mypy.ini'
    ];

    for (const config of configs) {
      if (existsSync(join(this.rootPath, config))) {
        configFiles.push(config);
      }
    }

    // Parse dependencies
    const dependencies = await this.parseDependencies();

    return {
      rootPath: this.rootPath,
      language: 'python',
      packageManager: this.packageManager || undefined,
      mainFiles,
      testFiles,
      configFiles,
      buildOutput: 'dist/',
      dependencies
    };
  }

  /**
   * Run Python tests using pytest
   */
  async runTests(options?: {
    pattern?: string;
    coverage?: boolean;
    watch?: boolean;
  }): Promise<TestResult> {
    const coverageArg = options?.coverage ? '--cov --cov-report=term' : '';
    const patternArg = options?.pattern ? `-k "${options.pattern}"` : '';

    try {
      const { stdout, stderr } = await execAsync(
        `pytest ${coverageArg} ${patternArg} --tb=short --json-report --json-report-file=/tmp/pytest-report.json`,
        { cwd: this.rootPath }
      );

      // Parse pytest JSON report
      try {
        const report = JSON.parse(readFileSync('/tmp/pytest-report.json', 'utf8'));

        return {
          passed: report.summary.passed || 0,
          failed: report.summary.failed || 0,
          skipped: report.summary.skipped || 0,
          coverage: report.coverage?.totals?.percent_covered,
          duration: report.duration,
          details: (report.tests || []).map((test: any) => ({
            name: test.nodeid,
            status: test.outcome,
            duration: test.duration || 0,
            error: test.call?.longrepr
          }))
        };
      } catch {
        // Fallback parsing from stdout
        return this.parseTestOutput(stdout);
      }
    } catch (error: any) {
      // Tests failed, parse error output
      return this.parseTestOutput(error.stdout || '');
    }
  }

  /**
   * Build Python package
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
      let buildCommand = '';

      if (this.packageManager === 'poetry') {
        buildCommand = 'poetry build';
      } else if (existsSync(join(this.rootPath, 'setup.py'))) {
        buildCommand = 'python setup.py sdist bdist_wheel';
      } else if (existsSync(join(this.rootPath, 'pyproject.toml'))) {
        buildCommand = 'python -m build';
      } else {
        throw new Error('No build configuration found');
      }

      const { stdout, stderr } = await execAsync(buildCommand, { cwd: this.rootPath });

      // Check for artifacts
      const distPath = join(this.rootPath, 'dist');
      if (existsSync(distPath)) {
        const { stdout: files } = await execAsync(`ls "${distPath}"`);
        artifacts.push(...files.split('\n').filter(f => f));
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
        warnings,
        artifacts,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Lint Python code using pylint/flake8
   */
  async lint(options?: {
    fix?: boolean;
    files?: string[];
  }): Promise<LintResult> {
    const files = options?.files?.join(' ') || '.';

    try {
      // Try pylint first
      const { stdout } = await execAsync(`pylint ${files} --output-format=json`, {
        cwd: this.rootPath
      });

      const issues = JSON.parse(stdout);

      return {
        errors: issues.filter((i: any) => i.type === 'error').length,
        warnings: issues.filter((i: any) => i.type === 'warning').length,
        issues: issues.map((issue: any) => ({
          file: issue.path,
          line: issue.line,
          column: issue.column,
          severity: issue.type === 'error' ? 'error' : 'warning',
          message: issue.message,
          rule: issue['message-id']
        }))
      };
    } catch {
      // Fallback to flake8
      try {
        const { stdout } = await execAsync(`flake8 ${files}`, { cwd: this.rootPath });

        const issues = stdout.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const match = line.match(/^(.+):(\d+):(\d+): (\w)(\d+) (.+)$/);
            if (!match) return null;

            return {
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              severity: match[4] === 'E' ? 'error' : 'warning',
              message: match[6],
              rule: `${match[4]}${match[5]}`
            };
          })
          .filter(i => i !== null) as any[];

        return {
          errors: issues.filter(i => i.severity === 'error').length,
          warnings: issues.filter(i => i.severity === 'warning').length,
          issues
        };
      } catch {
        return { errors: 0, warnings: 0, issues: [] };
      }
    }
  }

  /**
   * Format Python code using black
   */
  async format(options?: {
    files?: string[];
    check?: boolean;
  }): Promise<{ formatted: number; errors: string[] }> {
    const files = options?.files?.join(' ') || '.';
    const checkArg = options?.check ? '--check --diff' : '';

    try {
      const { stdout } = await execAsync(`black ${checkArg} ${files}`, { cwd: this.rootPath });

      const formatted = stdout.match(/reformatted/g)?.length || 0;

      return { formatted, errors: [] };
    } catch (error: any) {
      return { formatted: 0, errors: [error.message] };
    }
  }

  /**
   * Install Python dependencies
   */
  async installDependencies(): Promise<{
    success: boolean;
    installed: string[];
    errors: string[];
  }> {
    try {
      let command = '';

      if (this.packageManager === 'poetry') {
        command = 'poetry install';
      } else if (this.packageManager === 'pipenv') {
        command = 'pipenv install';
      } else {
        command = 'pip install -r requirements.txt';
      }

      const { stdout } = await execAsync(command, { cwd: this.rootPath });

      // Parse installed packages
      const installed = stdout.match(/Installing (.+)/g)?.map(line => {
        const match = line.match(/Installing (.+)/);
        return match ? match[1] : '';
      }).filter(p => p) || [];

      return { success: true, installed, errors: [] };
    } catch (error: any) {
      return { success: false, installed: [], errors: [error.message] };
    }
  }

  /**
   * Get recommended OPERA agents for Python projects
   */
  getRecommendedAgents(): string[] {
    return [
      'maria-qa',          // Testing with pytest
      'marcus-backend',    // Backend development (FastAPI, Django, Flask)
      'dr-ai-ml',          // ML/AI development (common in Python)
      'devops-dan',        // Deployment (Docker, cloud)
      'security-sam'       // Security scanning (bandit, safety)
    ];
  }

  /**
   * Get Python-specific quality metrics
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
      const { stdout } = await execAsync('pytest --cov --cov-report=term', { cwd: this.rootPath });
      const match = stdout.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/);
      testCoverage = match ? parseInt(match[1]) : 0;
    } catch {
      testCoverage = 0;
    }

    // Run lint for score
    let lintScore = 100;
    try {
      const { stdout } = await execAsync('pylint . --exit-zero', { cwd: this.rootPath });
      const match = stdout.match(/Your code has been rated at ([\d.]+)\//);
      lintScore = match ? parseFloat(match[1]) * 10 : 100;
    } catch {
      lintScore = 100;
    }

    // Run radon for complexity and maintainability
    let complexityScore = 75;
    let maintainability = 80;

    try {
      // Radon CC (Cyclomatic Complexity)
      const { stdout: ccOutput } = await execAsync('radon cc . -a -s', { cwd: this.rootPath });
      // Parse average complexity: "Average complexity: A (2.5)"
      const ccMatch = ccOutput.match(/Average complexity:\s+([A-F])\s+\(([\d.]+)\)/);
      if (ccMatch) {
        const grade = ccMatch[1];
        const avgComplexity = parseFloat(ccMatch[2]);
        // Convert grade to score: A=100, B=85, C=70, D=55, F=40
        const gradeScores: Record<string, number> = { 'A': 100, 'B': 85, 'C': 70, 'D': 55, 'F': 40 };
        complexityScore = gradeScores[grade] || 75;
      }

      // Radon MI (Maintainability Index)
      const { stdout: miOutput } = await execAsync('radon mi . -s', { cwd: this.rootPath });
      // Parse average MI score
      const miMatch = miOutput.match(/Average MI:\s+([\d.]+)\s+\(([A-C])\)/);
      if (miMatch) {
        const miValue = parseFloat(miMatch[1]);
        // MI ranges: 100-20 (A=good, B=moderate, C=poor)
        // Convert to 0-100 scale
        maintainability = Math.min(100, Math.max(0, miValue));
      }
    } catch {
      // Radon not installed or failed - use defaults
      complexityScore = 75;
      maintainability = 80;
    }

    return {
      testCoverage,
      lintScore,
      complexityScore,
      maintainability
    };
  }

  /**
   * Execute Python-specific command
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

  private async detectPackageManager(): Promise<void> {
    if (existsSync(join(this.rootPath, 'poetry.lock'))) {
      this.packageManager = 'poetry';
    } else if (existsSync(join(this.rootPath, 'Pipfile'))) {
      this.packageManager = 'pipenv';
    } else {
      this.packageManager = 'pip';
    }
  }

  private async findPythonFiles(patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of patterns) {
      try {
        const { stdout } = await execAsync(`find . -name "${pattern}" -type f`, {
          cwd: this.rootPath
        });

        files.push(...stdout.split('\n').filter(f => f.trim() && f.endsWith('.py')));
      } catch {
        // Pattern not found, continue
      }
    }

    return Array.from(new Set(files)); // Remove duplicates
  }

  private async parseDependencies(): Promise<Record<string, string>> {
    const deps: Record<string, string> = {};

    // Parse requirements.txt
    const reqFile = join(this.rootPath, 'requirements.txt');
    if (existsSync(reqFile)) {
      const content = readFileSync(reqFile, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([a-zA-Z0-9-_]+)([=<>~]+)([\d.]+)/);
        if (match) {
          deps[match[1]] = match[3];
        }
      });
    }

    // Parse pyproject.toml (poetry)
    const pyproject = join(this.rootPath, 'pyproject.toml');
    if (existsSync(pyproject)) {
      try {
        import toml from '@iarna/toml';
        const content = readFileSync(pyproject, 'utf-8');
        const parsed: any = toml.parse(content);

        // Poetry dependencies
        if (parsed.tool?.poetry?.dependencies) {
          Object.keys(parsed.tool.poetry.dependencies).forEach(dep => {
            if (dep !== 'python') {
              const version = parsed.tool.poetry.dependencies[dep];
              deps[dep] = typeof version === 'string' ? version : 'latest';
            }
          });
        }

        // PEP 621 dependencies
        if (parsed.project?.dependencies && Array.isArray(parsed.project.dependencies)) {
          parsed.project.dependencies.forEach((dep: string) => {
            const parts = dep.split('==');
            const name = parts[0];
            const version = parts[1] || 'latest';
            deps[name] = version;
          });
        }
      } catch (error) {
        console.warn('Failed to parse pyproject.toml:', error);
      }
    }

    return deps;
  }

  private parseTestOutput(output: string): TestResult {
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);

    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
      duration: 0,
      details: []
    };
  }
}