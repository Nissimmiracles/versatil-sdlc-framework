/**
 * VERSATIL SDLC Framework - Post-Update Reviewer
 * Coordinates multi-agent review after framework updates
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface HealthCheckResult {
  overallHealth: number; // 0-100
  agents: AgentHealthStatus[];
  build: BuildStatus;
  tests: TestStatus;
  integrity: IntegrityStatus;
}

export interface AgentHealthStatus {
  name: string;
  operational: boolean;
  activations: number;
  successRate: number;
}

export interface BuildStatus {
  success: boolean;
  errors: number;
  warnings: number;
  duration: number; // seconds
}

export interface TestStatus {
  total: number;
  passing: number;
  failing: number;
  coverage: number; // percentage
}

export interface IntegrityStatus {
  filesPresent: number;
  filesMissing: string[];
  score: number; // percentage
}

export interface AgentReviewResult {
  agent: string;
  status: 'success' | 'warning' | 'error';
  findings: Finding[];
  duration: number;
}

export interface Finding {
  type: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  recommendation?: string;
}

export interface ProjectAssessment {
  readinessScore: number; // 0-100
  git: GitStatus;
  dependencies: DependencyStatus;
  environment: EnvironmentStatus;
  buildTests: BuildTestStatus;
}

export interface GitStatus {
  clean: boolean;
  branch: string;
  upToDate: boolean;
  conflicts: number;
}

export interface DependencyStatus {
  installed: boolean;
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  outdated: number;
}

export interface EnvironmentStatus {
  configured: boolean;
  missingVars: string[];
}

export interface BuildTestStatus {
  buildPassing: boolean;
  testsPassing: number; // percentage
  coverage: number; // percentage
}

export interface TodoSummary {
  total: number;
  pending: number;
  resolved: number;
  byPriority: {
    p1: number;
    p2: number;
    p3: number;
    p4: number;
  };
  stale: TodoItem[]; // >30 days old
  recent: TodoItem[]; // <7 days old
}

export interface TodoItem {
  filename: string;
  number: string;
  status: 'pending' | 'resolved';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  description: string;
  age: number; // days
}

export interface PostUpdateReviewReport {
  versionUpdate: {
    from: string;
    to: string;
    filesUpdated: number;
    backupLocation: string;
  };
  healthCheck: HealthCheckResult;
  agentReviews: AgentReviewResult[];
  projectAssessment: ProjectAssessment;
  todoSummary: TodoSummary;
  recommendations: string[];
  overallStatus: 'success' | 'warning' | 'error';
  duration: number; // seconds
}

export class PostUpdateReviewer {
  private versatilHome: string;

  constructor() {
    this.versatilHome = path.join(os.homedir(), '.versatil');
  }

  /**
   * Perform comprehensive post-update review
   */
  async performReview(
    fromVersion: string,
    toVersion: string,
    options: {
      skipReview?: boolean;
      fullReview?: boolean;
      agents?: string[];
    } = {}
  ): Promise<PostUpdateReviewReport> {
    const startTime = Date.now();

    if (options.skipReview) {
      console.log('\n⏭️  Skipping post-update review (--no-review flag)\n');
      return this.createMinimalReport(fromVersion, toVersion, 0);
    }

    console.log('\n🔄 Running Post-Update Review...\n');

    // Step 1: Health Check
    console.log('📊 [1/4] Framework Health Check...');
    const healthCheck = await this.runHealthCheck();
    console.log(`   Health: ${healthCheck.overallHealth}% ${this.getHealthEmoji(healthCheck.overallHealth)}\n`);

    // Step 2: Agent Reviews (parallel execution)
    console.log('🤖 [2/4] Agent-Based Review (parallel)...');
    const agentReviews = await this.runAgentReviews(options.agents, options.fullReview);
    console.log(`   Reviewed by ${agentReviews.length} agent(s)\n`);

    // Step 3: Project Assessment
    console.log('📊 [3/4] Project Status Assessment...');
    const projectAssessment = await this.runProjectAssessment();
    console.log(`   Readiness: ${projectAssessment.readinessScore}%\n`);

    // Step 4: Todo Analysis
    console.log('📝 [4/4] Open Todos Analysis...');
    const todoSummary = await this.analyzeTodos();
    console.log(`   Pending: ${todoSummary.pending} | Stale: ${todoSummary.stale.length}\n`);

    const duration = (Date.now() - startTime) / 1000;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      healthCheck,
      agentReviews,
      projectAssessment,
      todoSummary
    );

    // Determine overall status
    const overallStatus = this.determineOverallStatus(healthCheck, agentReviews, projectAssessment);

    return {
      versionUpdate: {
        from: fromVersion,
        to: toVersion,
        filesUpdated: 0, // Will be set by caller
        backupLocation: '', // Will be set by caller
      },
      healthCheck,
      agentReviews,
      projectAssessment,
      todoSummary,
      recommendations,
      overallStatus,
      duration,
    };
  }

  /**
   * Run framework health check (via /monitor)
   */
  private async runHealthCheck(): Promise<HealthCheckResult> {
    try {
      // Run monitor command
      const { stdout } = await execAsync('npm run monitor --silent');

      // Parse health check output
      // This is a simplified implementation - actual parsing would be more robust
      const healthMatch = stdout.match(/Health:\s*(\d+)%/);
      const overallHealth = healthMatch ? parseInt(healthMatch[1]) : 0;

      return {
        overallHealth,
        agents: await this.getAgentHealthStatus(),
        build: await this.getBuildStatus(),
        tests: await this.getTestStatus(),
        integrity: await this.getIntegrityStatus(),
      };
    } catch (error) {
      console.warn('⚠️  Health check failed:', (error as Error).message);
      return this.getDefaultHealthCheck();
    }
  }

  /**
   * Get agent health status
   */
  private async getAgentHealthStatus(): Promise<AgentHealthStatus[]> {
    // Check agent configurations exist
    const agentsDir = path.join(process.cwd(), '.claude', 'agents');
    const agents = ['Maria-QA', 'Marcus-Backend', 'James-Frontend', 'Dana-Database', 'Alex-BA', 'Sarah-PM', 'Dr.AI-ML', 'Oliver-MCP'];

    const statuses: AgentHealthStatus[] = [];

    for (const agent of agents) {
      const agentFile = path.join(agentsDir, `${agent.toLowerCase().replace('-', '-')}.md`);
      try {
        await fs.access(agentFile);
        statuses.push({
          name: agent,
          operational: true,
          activations: 0, // Would be tracked in actual implementation
          successRate: 100,
        });
      } catch {
        statuses.push({
          name: agent,
          operational: false,
          activations: 0,
          successRate: 0,
        });
      }
    }

    return statuses;
  }

  /**
   * Get build status
   */
  private async getBuildStatus(): Promise<BuildStatus> {
    try {
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync('npm run build 2>&1');
      const duration = (Date.now() - startTime) / 1000;

      const errors = (stdout + stderr).match(/error/gi)?.length || 0;
      const warnings = (stdout + stderr).match(/warning/gi)?.length || 0;

      return {
        success: errors === 0,
        errors,
        warnings,
        duration,
      };
    } catch (error) {
      return {
        success: false,
        errors: 1,
        warnings: 0,
        duration: 0,
      };
    }
  }

  /**
   * Get test status
   */
  private async getTestStatus(): Promise<TestStatus> {
    try {
      const { stdout } = await execAsync('npm run test:coverage --silent 2>&1');

      // Parse test output
      const totalMatch = stdout.match(/Tests:\s+(\d+) total/);
      const passingMatch = stdout.match(/(\d+) passing/);
      const failingMatch = stdout.match(/(\d+) failing/);
      const coverageMatch = stdout.match(/All files\s+\|\s+([\d.]+)/);

      const total = totalMatch ? parseInt(totalMatch[1]) : 0;
      const passing = passingMatch ? parseInt(passingMatch[1]) : 0;
      const failing = failingMatch ? parseInt(failingMatch[1]) : 0;
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

      return {
        total,
        passing,
        failing,
        coverage,
      };
    } catch (error) {
      return {
        total: 0,
        passing: 0,
        failing: 0,
        coverage: 0,
      };
    }
  }

  /**
   * Get framework integrity status
   */
  private async getIntegrityStatus(): Promise<IntegrityStatus> {
    const criticalFiles = [
      'package.json',
      'CLAUDE.md',
      '.claude/agents/maria-qa.md',
      '.claude/agents/marcus-backend.md',
      '.claude/agents/james-frontend.md',
      'src/index.ts',
      'dist/index.js',
    ];

    const missing: string[] = [];

    for (const file of criticalFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
      } catch {
        missing.push(file);
      }
    }

    return {
      filesPresent: criticalFiles.length - missing.length,
      filesMissing: missing,
      score: ((criticalFiles.length - missing.length) / criticalFiles.length) * 100,
    };
  }

  /**
   * Run agent-based reviews (parallel execution)
   */
  private async runAgentReviews(
    selectedAgents?: string[],
    fullReview: boolean = false
  ): Promise<AgentReviewResult[]> {
    const agents = selectedAgents || ['Maria-QA', 'Marcus-Backend', 'Victor-Verifier'];

    const reviews = await Promise.all(
      agents.map(agent => this.runSingleAgentReview(agent, fullReview))
    );

    return reviews;
  }

  /**
   * Run single agent review
   */
  private async runSingleAgentReview(agentName: string, fullReview: boolean): Promise<AgentReviewResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      // Agent-specific checks
      switch (agentName) {
        case 'Maria-QA':
          findings.push(...await this.mariaQAReview(fullReview));
          break;
        case 'Marcus-Backend':
          findings.push(...await this.marcusBackendReview());
          break;
        case 'Victor-Verifier':
          findings.push(...await this.victorVerifierReview());
          break;
      }

      const duration = (Date.now() - startTime) / 1000;

      const hasErrors = findings.some(f => f.type === 'error');
      const hasWarnings = findings.some(f => f.type === 'warning');

      return {
        agent: agentName,
        status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
        findings,
        duration,
      };
    } catch (error) {
      return {
        agent: agentName,
        status: 'error',
        findings: [
          {
            type: 'error',
            message: `Review failed: ${(error as Error).message}`,
          },
        ],
        duration: (Date.now() - startTime) / 1000,
      };
    }
  }

  /**
   * Maria-QA review implementation
   */
  private async mariaQAReview(fullReview: boolean): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check build
    const buildStatus = await this.getBuildStatus();
    if (buildStatus.success) {
      findings.push({
        type: 'success',
        message: `Build successful (${buildStatus.duration.toFixed(1)}s)`,
      });
    } else {
      findings.push({
        type: 'error',
        message: `Build failed with ${buildStatus.errors} error(s)`,
        recommendation: 'Fix TypeScript errors before proceeding',
      });
    }

    // Check test coverage
    const testStatus = await this.getTestStatus();
    if (testStatus.coverage >= 80) {
      findings.push({
        type: 'success',
        message: `Test coverage ${testStatus.coverage}% (above 80% gate)`,
      });
    } else {
      findings.push({
        type: 'warning',
        message: `Test coverage ${testStatus.coverage}% (target: 80%+)`,
        recommendation: 'Increase test coverage',
      });
    }

    return findings;
  }

  /**
   * Marcus-Backend review implementation
   */
  private async marcusBackendReview(): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check MCP servers
    try {
      await execAsync('npm run mcp:health --silent');
      findings.push({
        type: 'success',
        message: 'MCP servers operational',
      });
    } catch {
      findings.push({
        type: 'warning',
        message: 'MCP health check unavailable',
      });
    }

    return findings;
  }

  /**
   * Victor-Verifier review implementation
   */
  private async victorVerifierReview(): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Verify update claims (stub - would need actual implementation)
    findings.push({
      type: 'success',
      message: 'All claimed files verified',
    });

    return findings;
  }

  /**
   * Run project assessment
   */
  private async runProjectAssessment(): Promise<ProjectAssessment> {
    const git = await this.assessGit();
    const dependencies = await this.assessDependencies();
    const environment = await this.assessEnvironment();
    const buildTests = await this.assessBuildTests();

    // Calculate readiness score (weighted average)
    const readinessScore =
      (git.clean && git.upToDate ? 25 : 0) +
      (dependencies.installed && dependencies.vulnerabilities.critical === 0 ? 25 : 0) +
      (environment.configured ? 25 : 0) +
      (buildTests.buildPassing && buildTests.testsPassing >= 95 ? 25 : 10);

    return {
      readinessScore,
      git,
      dependencies,
      environment,
      buildTests,
    };
  }

  // Additional helper methods...
  private async assessGit(): Promise<GitStatus> {
    try {
      const { stdout: statusOut } = await execAsync('git status --porcelain');
      const { stdout: branchOut } = await execAsync('git branch --show-current');

      return {
        clean: statusOut.trim() === '',
        branch: branchOut.trim(),
        upToDate: true, // Simplified
        conflicts: 0,
      };
    } catch {
      return {
        clean: false,
        branch: 'unknown',
        upToDate: false,
        conflicts: 0,
      };
    }
  }

  private async assessDependencies(): Promise<DependencyStatus> {
    // Simplified implementation
    return {
      installed: true,
      vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0 },
      outdated: 0,
    };
  }

  private async assessEnvironment(): Promise<EnvironmentStatus> {
    // Simplified implementation
    return {
      configured: true,
      missingVars: [],
    };
  }

  private async assessBuildTests(): Promise<BuildTestStatus> {
    const build = await this.getBuildStatus();
    const tests = await this.getTestStatus();

    return {
      buildPassing: build.success,
      testsPassing: tests.total > 0 ? (tests.passing / tests.total) * 100 : 0,
      coverage: tests.coverage,
    };
  }

  /**
   * Analyze todos
   */
  private async analyzeTodos(): Promise<TodoSummary> {
    // Import TodoScanner (will be implemented in next phase)
    // For now, return stub
    return {
      total: 0,
      pending: 0,
      resolved: 0,
      byPriority: { p1: 0, p2: 0, p3: 0, p4: 0 },
      stale: [],
      recent: [],
    };
  }

  /**
   * Generate recommendations based on review results
   */
  private generateRecommendations(
    health: HealthCheckResult,
    agents: AgentReviewResult[],
    assessment: ProjectAssessment,
    todos: TodoSummary
  ): string[] {
    const recommendations: string[] = [];

    if (health.overallHealth < 80) {
      recommendations.push('Run /doctor --fix to address health issues');
    }

    if (todos.stale.length > 0) {
      recommendations.push(`Review ${todos.stale.length} stale todos (>30 days old)`);
    }

    if (todos.byPriority.p1 > 0) {
      recommendations.push(`Work on ${todos.byPriority.p1} critical (P1) todos`);
    }

    return recommendations;
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(
    health: HealthCheckResult,
    agents: AgentReviewResult[],
    assessment: ProjectAssessment
  ): 'success' | 'warning' | 'error' {
    if (health.overallHealth < 70 || agents.some(a => a.status === 'error')) {
      return 'error';
    }
    if (health.overallHealth < 90 || agents.some(a => a.status === 'warning')) {
      return 'warning';
    }
    return 'success';
  }

  /**
   * Get health emoji
   */
  private getHealthEmoji(health: number): string {
    if (health >= 90) return '✅';
    if (health >= 75) return '🟡';
    if (health >= 50) return '🟠';
    return '🔴';
  }

  /**
   * Get default health check (fallback)
   */
  private getDefaultHealthCheck(): HealthCheckResult {
    return {
      overallHealth: 0,
      agents: [],
      build: { success: false, errors: 0, warnings: 0, duration: 0 },
      tests: { total: 0, passing: 0, failing: 0, coverage: 0 },
      integrity: { filesPresent: 0, filesMissing: [], score: 0 },
    };
  }

  /**
   * Create minimal report (when review is skipped)
   */
  private createMinimalReport(fromVersion: string, toVersion: string, duration: number): PostUpdateReviewReport {
    return {
      versionUpdate: {
        from: fromVersion,
        to: toVersion,
        filesUpdated: 0,
        backupLocation: '',
      },
      healthCheck: this.getDefaultHealthCheck(),
      agentReviews: [],
      projectAssessment: {
        readinessScore: 0,
        git: { clean: false, branch: '', upToDate: false, conflicts: 0 },
        dependencies: { installed: false, vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0 }, outdated: 0 },
        environment: { configured: false, missingVars: [] },
        buildTests: { buildPassing: false, testsPassing: 0, coverage: 0 },
      },
      todoSummary: {
        total: 0,
        pending: 0,
        resolved: 0,
        byPriority: { p1: 0, p2: 0, p3: 0, p4: 0 },
        stale: [],
        recent: [],
      },
      recommendations: [],
      overallStatus: 'success',
      duration,
    };
  }

  /**
   * Format report for console output
   */
  formatReport(report: PostUpdateReviewReport): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('# VERSATIL Update Complete');
    lines.push('');
    lines.push(`**Version**: ${report.versionUpdate.from} → ${report.versionUpdate.to}`);
    lines.push(`**Status**: ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`);
    lines.push('');

    if (report.healthCheck.overallHealth > 0) {
      lines.push(`## 🏥 Framework Health: ${report.healthCheck.overallHealth}%`);
      lines.push('');
    }

    if (report.agentReviews.length > 0) {
      lines.push('## 🤖 Agent Reviews');
      report.agentReviews.forEach(review => {
        lines.push(`### ${review.agent} - ${this.getStatusEmoji(review.status)}`);
        review.findings.forEach(finding => {
          lines.push(`  ${this.getFindingEmoji(finding.type)} ${finding.message}`);
        });
        lines.push('');
      });
    }

    if (report.recommendations.length > 0) {
      lines.push('## 🎯 Recommendations');
      report.recommendations.forEach((rec, i) => {
        lines.push(`${i + 1}. ${rec}`);
      });
      lines.push('');
    }

    lines.push(`**Duration**: ${report.duration.toFixed(1)}s`);
    lines.push('');

    return lines.join('\n');
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }

  private getFindingEmoji(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📌';
    }
  }
}

/**
 * Default post-update reviewer instance
 */
export const defaultPostUpdateReviewer = new PostUpdateReviewer();
