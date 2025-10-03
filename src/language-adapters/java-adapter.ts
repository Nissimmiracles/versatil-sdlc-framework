/**
 * VERSATIL Framework v3.0.0 - Java Language Adapter
 *
 * Enables VERSATIL to work with Java projects, supporting Maven, Gradle, JUnit,
 * Checkstyle, SpotBugs, and the entire Java ecosystem.
 *
 * BMAD agents can now orchestrate Java development workflows.
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

export class JavaAdapter extends BaseLanguageAdapter {
  private buildTool: 'maven' | 'gradle' | null = null;
  private javaVersion?: string;

  /**
   * Detect if this is a Java project
   */
  async detect(): Promise<boolean> {
    const indicators = [
      'pom.xml',           // Maven
      'build.gradle',      // Gradle
      'build.gradle.kts',  // Gradle Kotlin DSL
      'gradlew',
      'mvnw'
    ];

    // Check for Java project indicators
    for (const file of indicators) {
      if (existsSync(join(this.rootPath, file))) {
        return true;
      }
    }

    // Check for Java source files
    const javaDirs = ['src/main/java', 'src/test/java', 'src/'];
    for (const dir of javaDirs) {
      const dirPath = join(this.rootPath, dir);
      if (existsSync(dirPath)) {
        try {
          const { stdout } = await execAsync(`find "${dirPath}" -name "*.java" | head -1`, {
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
   * Get Java-specific capabilities
   */
  getCapabilities(): LanguageCapabilities {
    return {
      testing: true,         // JUnit, TestNG
      linting: true,         // Checkstyle, SpotBugs
      formatting: true,      // google-java-format
      typeChecking: true,    // Native Java type checking
      packageManagement: true, // Maven, Gradle
      buildSystem: true      // Maven, Gradle
    };
  }

  /**
   * Analyze Java project structure
   */
  async analyzeProject(): Promise<ProjectStructure> {
    // Detect build tool
    await this.detectBuildTool();

    // Get Java version
    try {
      const { stdout } = await execAsync('java -version 2>&1');
      this.javaVersion = stdout.split('\n')[0];
    } catch {
      this.javaVersion = 'Unknown';
    }

    // Find Java source files
    const mainFiles = await this.findJavaFiles([
      'src/main/java/**/*.java',
      'src/**/*.java'
    ]);

    // Find test files
    const testFiles = await this.findJavaFiles([
      'src/test/java/**/*.java',
      'test/**/*.java',
      '**/Test*.java',
      '**/*Test.java'
    ]);

    // Find config files
    const configFiles: string[] = [];
    const configs = [
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'settings.gradle',
      'settings.gradle.kts',
      'gradle.properties',
      'checkstyle.xml',
      'spotbugs.xml',
      'junit-platform.properties'
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
      language: 'java',
      packageManager: this.buildTool || undefined,
      mainFiles: mainFiles.filter(f => !f.includes('/test/') && !f.includes('Test.java')),
      testFiles,
      configFiles,
      buildOutput: this.buildTool === 'maven' ? 'target/' : 'build/',
      dependencies
    };
  }

  /**
   * Run Java tests using JUnit
   */
  async runTests(options?: {
    pattern?: string;
    coverage?: boolean;
    watch?: boolean;
  }): Promise<TestResult> {
    try {
      let command = '';
      const coverageArg = options?.coverage ? 'jacoco:report' : '';

      if (this.buildTool === 'maven') {
        command = `mvn test ${coverageArg}`;
      } else if (this.buildTool === 'gradle') {
        command = options?.coverage ? 'gradle test jacocoTestReport' : 'gradle test';
      } else {
        throw new Error('No build tool detected');
      }

      const { stdout, stderr } = await execAsync(command, { cwd: this.rootPath });

      // Parse test results
      let passed = 0;
      let failed = 0;
      let skipped = 0;

      if (this.buildTool === 'maven') {
        // Parse Maven test output
        const passedMatch = stdout.match(/Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)/);
        if (passedMatch) {
          const total = parseInt(passedMatch[1]);
          const failures = parseInt(passedMatch[2]);
          const errors = parseInt(passedMatch[3]);
          skipped = parseInt(passedMatch[4]);
          failed = failures + errors;
          passed = total - failed - skipped;
        }
      } else {
        // Parse Gradle test output
        const resultMatch = stdout.match(/(\d+) tests? completed, (\d+) failed, (\d+) skipped/);
        if (resultMatch) {
          const total = parseInt(resultMatch[1]);
          failed = parseInt(resultMatch[2]);
          skipped = parseInt(resultMatch[3]);
          passed = total - failed - skipped;
        }
      }

      // Get coverage if requested
      let coverage: number | undefined;
      if (options?.coverage) {
        try {
          const coverageFile = this.buildTool === 'maven'
            ? join(this.rootPath, 'target/site/jacoco/index.html')
            : join(this.rootPath, 'build/reports/jacoco/test/html/index.html');

          if (existsSync(coverageFile)) {
            const content = readFileSync(coverageFile, 'utf8');
            const coverageMatch = content.match(/Total.*?(\d+)%/);
            coverage = coverageMatch ? parseInt(coverageMatch[1]) : undefined;
          }
        } catch {
          coverage = undefined;
        }
      }

      return {
        passed,
        failed,
        skipped,
        coverage,
        duration: 0,
        details: []
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
   * Build Java project using Maven or Gradle
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

      if (this.buildTool === 'maven') {
        const skipTests = options?.mode === 'production' ? '' : '-DskipTests';
        buildCommand = `mvn clean package ${skipTests}`;
      } else if (this.buildTool === 'gradle') {
        const buildType = options?.mode === 'production' ? 'assembleRelease' : 'assemble';
        buildCommand = `gradle clean ${buildType}`;
      } else {
        throw new Error('No build tool detected');
      }

      const { stdout, stderr } = await execAsync(buildCommand, { cwd: this.rootPath });

      // Parse warnings
      const warningPattern = /\[WARNING\]|warning:/gi;
      if (warningPattern.test(stderr)) {
        warnings.push('Build completed with warnings');
      }

      // Check for artifacts
      const artifactDir = this.buildTool === 'maven' ? 'target' : 'build/libs';
      const artifactPath = join(this.rootPath, artifactDir);

      if (existsSync(artifactPath)) {
        try {
          const { stdout: files } = await execAsync(`ls "${artifactPath}"`, {
            cwd: this.rootPath
          });
          const jars = files.split('\n').filter(f => f.endsWith('.jar') || f.endsWith('.war'));
          artifacts.push(...jars.map(j => `${artifactDir}/${j}`));
        } catch {
          // No artifacts found
        }
      }

      return {
        success: true,
        output: stdout,
        errors,
        warnings,
        artifacts,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      // Parse error output
      const errorPattern = /\[ERROR\]|error:/gi;
      if (errorPattern.test(error.stderr || '')) {
        errors.push('Build failed with errors');
      }

      return {
        success: false,
        output: error.stdout || '',
        errors: [...errors, error.message],
        warnings,
        artifacts,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Lint Java code using Checkstyle and SpotBugs
   */
  async lint(options?: {
    fix?: boolean;
    files?: string[];
  }): Promise<LintResult> {
    try {
      let command = '';

      if (this.buildTool === 'maven') {
        command = 'mvn checkstyle:check spotbugs:check';
      } else if (this.buildTool === 'gradle') {
        command = 'gradle checkstyleMain checkstyleTest spotbugsMain spotbugsTest';
      } else {
        throw new Error('No build tool detected');
      }

      const { stdout, stderr } = await execAsync(command, { cwd: this.rootPath });

      // Parse checkstyle/spotbugs output
      const issues: any[] = [];
      let errors = 0;
      let warnings = 0;

      // Try to parse XML reports if available
      const checkstyleReport = join(this.rootPath,
        this.buildTool === 'maven' ? 'target/checkstyle-result.xml' : 'build/reports/checkstyle/main.xml'
      );

      if (existsSync(checkstyleReport)) {
        try {
          const content = readFileSync(checkstyleReport, 'utf8');
          const errorPattern = /<error[^>]+severity="error"[^>]+message="([^"]+)"/g;
          const warningPattern = /<error[^>]+severity="warning"[^>]+message="([^"]+)"/g;

          let match;
          while ((match = errorPattern.exec(content)) !== null) {
            errors++;
            issues.push({
              file: 'unknown',
              line: 0,
              column: 0,
              severity: 'error' as const,
              message: match[1],
              rule: 'checkstyle'
            });
          }

          while ((match = warningPattern.exec(content)) !== null) {
            warnings++;
            issues.push({
              file: 'unknown',
              line: 0,
              column: 0,
              severity: 'warning' as const,
              message: match[1],
              rule: 'checkstyle'
            });
          }
        } catch {
          // Could not parse report
        }
      }

      return {
        errors,
        warnings,
        issues
      };
    } catch (error: any) {
      // Linting failed, return minimal info
      return {
        errors: 1,
        warnings: 0,
        issues: [{
          file: 'unknown',
          line: 0,
          column: 0,
          severity: 'error' as const,
          message: error.message,
          rule: 'lint'
        }]
      };
    }
  }

  /**
   * Format Java code using google-java-format
   */
  async format(options?: {
    files?: string[];
    check?: boolean;
  }): Promise<{ formatted: number; errors: string[] }> {
    try {
      // Check if google-java-format is available
      const files = options?.files?.join(' ') || 'src/**/*.java';
      const checkArg = options?.check ? '--dry-run' : '-i';

      try {
        await execAsync(`google-java-format ${checkArg} ${files}`, { cwd: this.rootPath });
        return { formatted: 1, errors: [] };
      } catch {
        // google-java-format not available, try Maven/Gradle plugins
        if (this.buildTool === 'maven') {
          await execAsync('mvn spotless:apply', { cwd: this.rootPath });
        } else if (this.buildTool === 'gradle') {
          await execAsync('gradle spotlessApply', { cwd: this.rootPath });
        }

        return { formatted: 1, errors: [] };
      }
    } catch (error: any) {
      return { formatted: 0, errors: [error.message] };
    }
  }

  /**
   * Install Java dependencies
   */
  async installDependencies(): Promise<{
    success: boolean;
    installed: string[];
    errors: string[];
  }> {
    try {
      let command = '';

      if (this.buildTool === 'maven') {
        command = 'mvn dependency:resolve';
      } else if (this.buildTool === 'gradle') {
        command = 'gradle dependencies';
      } else {
        throw new Error('No build tool detected');
      }

      const { stdout } = await execAsync(command, { cwd: this.rootPath });

      // Parse installed dependencies
      const installed = await this.parseDependencyNames();

      return { success: true, installed, errors: [] };
    } catch (error: any) {
      return { success: false, installed: [], errors: [error.message] };
    }
  }

  /**
   * Get recommended BMAD agents for Java projects
   */
  getRecommendedAgents(): string[] {
    return [
      'maria-qa',          // Testing with JUnit
      'marcus-backend',    // Backend development (Spring Boot, etc.)
      'architecture-dan',  // Enterprise architecture
      'devops-dan',        // Deployment (Docker, Kubernetes)
      'security-sam'       // Security (OWASP, SpotBugs)
    ];
  }

  /**
   * Get Java-specific quality metrics
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
      const coverageFile = this.buildTool === 'maven'
        ? join(this.rootPath, 'target/site/jacoco/index.html')
        : join(this.rootPath, 'build/reports/jacoco/test/html/index.html');

      if (existsSync(coverageFile)) {
        const content = readFileSync(coverageFile, 'utf8');
        const coverageMatch = content.match(/Total.*?(\d+)%/);
        testCoverage = coverageMatch ? parseInt(coverageMatch[1]) : 0;
      }
    } catch {
      testCoverage = 0;
    }

    // Run lint for score
    let lintScore = 100;
    try {
      const lintResult = await this.lint();
      const totalIssues = lintResult.errors + lintResult.warnings;
      lintScore = Math.max(0, 100 - (totalIssues * 5)); // Deduct 5 points per issue
    } catch {
      lintScore = 100;
    }

    // TODO: Implement cyclomatic complexity analysis
    const complexityScore = 80;

    return {
      testCoverage,
      lintScore,
      complexityScore,
      maintainability: (testCoverage + lintScore + complexityScore) / 3
    };
  }

  /**
   * Execute Java-specific command
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

  private async detectBuildTool(): Promise<void> {
    if (existsSync(join(this.rootPath, 'pom.xml'))) {
      this.buildTool = 'maven';
    } else if (existsSync(join(this.rootPath, 'build.gradle')) ||
               existsSync(join(this.rootPath, 'build.gradle.kts'))) {
      this.buildTool = 'gradle';
    } else {
      this.buildTool = null;
    }
  }

  private async findJavaFiles(patterns: string[]): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of patterns) {
      try {
        const { stdout } = await execAsync(`find . -name "*.java" -type f`, {
          cwd: this.rootPath
        });

        files.push(...stdout.split('\n').filter(f => f.trim() && f.endsWith('.java')));
      } catch {
        // Pattern not found, continue
      }
    }

    return Array.from(new Set(files)); // Remove duplicates
  }

  private async parseDependencies(): Promise<Record<string, string>> {
    const deps: Record<string, string> = {};

    if (this.buildTool === 'maven') {
      const pomPath = join(this.rootPath, 'pom.xml');
      if (existsSync(pomPath)) {
        const content = readFileSync(pomPath, 'utf8');
        const depPattern = /<dependency>[\s\S]*?<groupId>([^<]+)<\/groupId>[\s\S]*?<artifactId>([^<]+)<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>[\s\S]*?<\/dependency>/g;

        let match;
        while ((match = depPattern.exec(content)) !== null) {
          deps[`${match[1]}:${match[2]}`] = match[3];
        }
      }
    } else if (this.buildTool === 'gradle') {
      const buildFile = existsSync(join(this.rootPath, 'build.gradle'))
        ? join(this.rootPath, 'build.gradle')
        : join(this.rootPath, 'build.gradle.kts');

      if (existsSync(buildFile)) {
        const content = readFileSync(buildFile, 'utf8');
        const depPattern = /implementation\s+['"]([^'"]+)['"]/g;

        let match;
        while ((match = depPattern.exec(content)) !== null) {
          const parts = match[1].split(':');
          if (parts.length >= 3) {
            deps[`${parts[0]}:${parts[1]}`] = parts[2];
          }
        }
      }
    }

    return deps;
  }

  private async parseDependencyNames(): Promise<string[]> {
    const deps = await this.parseDependencies();
    return Object.keys(deps);
  }
}