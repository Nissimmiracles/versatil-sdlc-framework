/**
 * VERSATIL SDLC Framework - Update Validator
 * Post-update validation and health checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  checks: ValidationCheck[];
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface ValidationCheck {
  category: string;
  name: string;
  passed: boolean;
  score: number;
  message: string;
  details?: string;
  critical: boolean;
}

export interface PerformanceMetrics {
  startupTime: number;
  memoryUsage: number;
  commandResponseTime: number;
  fileAccessTime: number;
}

export interface PerformanceComparison {
  before: PerformanceMetrics;
  after: PerformanceMetrics;
  improvements: string[];
  regressions: string[];
}

export interface FeatureStatus {
  feature: string;
  working: boolean;
  message: string;
}

export class UpdateValidator {
  private versatilHome: string;

  constructor() {
    this.versatilHome = path.join(os.homedir(), '.versatil');
  }

  /**
   * Run complete post-update validation
   */
  async validatePostUpdate(): Promise<ValidationResult> {
    console.log('\n🔍 Running post-update validation...\n');

    const checks: ValidationCheck[] = [];

    // Run all validation checks
    checks.push(await this.checkFrameworkIntegrity());
    checks.push(await this.checkCommandAvailability());
    checks.push(await this.checkAgentConfigurations());
    checks.push(await this.checkDependencyResolution());
    checks.push(await this.checkFilePermissions());
    checks.push(await this.checkConfigurationValidity());
    checks.push(await this.checkIsolationIntegrity());
    checks.push(await this.checkMemorySystem());

    // Calculate overall score
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    const score = Math.round(totalScore / checks.length);

    // Collect errors and warnings
    const errors = checks.filter(c => !c.passed && c.critical).map(c => c.message);
    const warnings = checks.filter(c => !c.passed && !c.critical).map(c => c.message);

    // Generate recommendations
    const recommendations = this.generateRecommendations(checks);

    const passed = errors.length === 0;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Validation Score: ${score}/100`);
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Errors: ${errors.length} | Warnings: ${warnings.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (errors.length > 0) {
      console.log('❌ Critical Issues:');
      errors.forEach(err => console.log(`   • ${err}`));
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach(warn => console.log(`   • ${warn}`));
      console.log('');
    }

    return {
      passed,
      score,
      checks,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Run health checks
   */
  async runHealthChecks(): Promise<ValidationCheck[]> {
    return [
      await this.checkFrameworkIntegrity(),
      await this.checkCommandAvailability(),
      await this.checkAgentConfigurations(),
      await this.checkDependencyResolution()
    ];
  }

  /**
   * Compare performance before/after update
   */
  async comparePerformance(before: PerformanceMetrics, after: PerformanceMetrics): Promise<PerformanceComparison> {
    const improvements: string[] = [];
    const regressions: string[] = [];

    // Startup time
    if (after.startupTime < before.startupTime) {
      const improvement = ((before.startupTime - after.startupTime) / before.startupTime * 100).toFixed(1);
      improvements.push(`Startup time improved by ${improvement}%`);
    } else if (after.startupTime > before.startupTime) {
      const regression = ((after.startupTime - before.startupTime) / before.startupTime * 100).toFixed(1);
      regressions.push(`Startup time regressed by ${regression}%`);
    }

    // Memory usage
    if (after.memoryUsage < before.memoryUsage) {
      const improvement = ((before.memoryUsage - after.memoryUsage) / before.memoryUsage * 100).toFixed(1);
      improvements.push(`Memory usage reduced by ${improvement}%`);
    } else if (after.memoryUsage > before.memoryUsage) {
      const regression = ((after.memoryUsage - before.memoryUsage) / before.memoryUsage * 100).toFixed(1);
      regressions.push(`Memory usage increased by ${regression}%`);
    }

    // Command response time
    if (after.commandResponseTime < before.commandResponseTime) {
      const improvement = ((before.commandResponseTime - after.commandResponseTime) / before.commandResponseTime * 100).toFixed(1);
      improvements.push(`Command response ${improvement}% faster`);
    }

    return {
      before,
      after,
      improvements,
      regressions
    };
  }

  /**
   * Verify all features still work
   */
  async verifyFeatures(): Promise<FeatureStatus[]> {
    const features: FeatureStatus[] = [];

    // Test basic commands
    features.push(await this.testFeature('version', 'versatil --version'));
    features.push(await this.testFeature('doctor', 'versatil doctor'));
    features.push(await this.testFeature('config', 'versatil config'));

    return features;
  }

  /**
   * Check framework integrity
   */
  private async checkFrameworkIntegrity(): Promise<ValidationCheck> {
    try {
      const requiredDirs = ['agents', 'config', 'logs', 'memory', 'backups'];
      const missingDirs: string[] = [];

      for (const dir of requiredDirs) {
        try {
          await fs.access(path.join(this.versatilHome, dir));
        } catch {
          missingDirs.push(dir);
        }
      }

      const score = ((requiredDirs.length - missingDirs.length) / requiredDirs.length) * 100;

      return {
        category: 'Framework',
        name: 'Integrity Check',
        passed: missingDirs.length === 0,
        score,
        message: missingDirs.length === 0
          ? 'All framework directories present'
          : `Missing directories: ${missingDirs.join(', ')}`,
        critical: missingDirs.length > 2
      };

    } catch (error) {
      return {
        category: 'Framework',
        name: 'Integrity Check',
        passed: false,
        score: 0,
        message: `Failed: ${(error as Error).message}`,
        critical: true
      };
    }
  }

  /**
   * Check command availability
   */
  private async checkCommandAvailability(): Promise<ValidationCheck> {
    try {
      const { stdout } = await execAsync('versatil --version');
      const hasVersion = stdout.trim().length > 0;

      return {
        category: 'Commands',
        name: 'Availability',
        passed: hasVersion,
        score: hasVersion ? 100 : 0,
        message: hasVersion
          ? `Framework commands available (v${stdout.trim()})`
          : 'Framework commands not responding',
        critical: true
      };

    } catch (error) {
      return {
        category: 'Commands',
        name: 'Availability',
        passed: false,
        score: 0,
        message: 'Framework commands not found in PATH',
        critical: true
      };
    }
  }

  /**
   * Check agent configurations
   */
  private async checkAgentConfigurations(): Promise<ValidationCheck> {
    try {
      const agentsDir = path.join(this.versatilHome, 'agents');
      const files = await fs.readdir(agentsDir);

      const expectedAgents = ['maria-qa', 'james-frontend', 'marcus-backend', 'alex-ba', 'sarah-pm', 'dr-ai-ml'];
      const foundAgents = files.filter(f => expectedAgents.some(a => f.includes(a)));

      const score = (foundAgents.length / expectedAgents.length) * 100;

      return {
        category: 'Agents',
        name: 'Configuration',
        passed: foundAgents.length >= expectedAgents.length / 2, // At least 50%
        score,
        message: `${foundAgents.length}/${expectedAgents.length} agent configurations present`,
        details: `Found: ${foundAgents.join(', ')}`,
        critical: foundAgents.length === 0
      };

    } catch (error) {
      return {
        category: 'Agents',
        name: 'Configuration',
        passed: false,
        score: 0,
        message: 'Agent configurations not accessible',
        critical: false
      };
    }
  }

  /**
   * Check dependency resolution
   */
  private async checkDependencyResolution(): Promise<ValidationCheck> {
    try {
      const { stdout } = await execAsync('npm list -g versatil-sdlc-framework --depth=0 2>&1');

      const isInstalled = stdout.includes('versatil-sdlc-framework@');

      return {
        category: 'Dependencies',
        name: 'Resolution',
        passed: isInstalled,
        score: isInstalled ? 100 : 0,
        message: isInstalled
          ? 'Framework properly installed in npm global'
          : 'Framework not found in npm global',
        critical: !isInstalled
      };

    } catch (error) {
      return {
        category: 'Dependencies',
        name: 'Resolution',
        passed: false,
        score: 0,
        message: 'Unable to check npm installation',
        critical: true
      };
    }
  }

  /**
   * Check file permissions
   */
  private async checkFilePermissions(): Promise<ValidationCheck> {
    try {
      // Try to write to versatil home
      const testFile = path.join(this.versatilHome, '.permission-test');

      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);

      return {
        category: 'System',
        name: 'Permissions',
        passed: true,
        score: 100,
        message: 'File permissions correct',
        critical: false
      };

    } catch (error) {
      return {
        category: 'System',
        name: 'Permissions',
        passed: false,
        score: 0,
        message: 'Insufficient file permissions',
        details: `Cannot write to ${this.versatilHome}`,
        critical: true
      };
    }
  }

  /**
   * Check configuration validity
   */
  private async checkConfigurationValidity(): Promise<ValidationCheck> {
    try {
      const configFile = path.join(this.versatilHome, 'config', 'framework-config.json');

      try {
        const data = await fs.readFile(configFile, 'utf-8');
        JSON.parse(data); // Validate JSON

        return {
          category: 'Configuration',
          name: 'Validity',
          passed: true,
          score: 100,
          message: 'Configuration file valid',
          critical: false
        };

      } catch {
        return {
          category: 'Configuration',
          name: 'Validity',
          passed: false,
          score: 50,
          message: 'Configuration file missing or invalid (will be regenerated)',
          critical: false
        };
      }

    } catch (error) {
      return {
        category: 'Configuration',
        name: 'Validity',
        passed: false,
        score: 0,
        message: 'Configuration check failed',
        critical: false
      };
    }
  }

  /**
   * Check isolation integrity
   */
  private async checkIsolationIntegrity(): Promise<ValidationCheck> {
    try {
      const projectDir = process.cwd();
      const forbiddenDirs = ['.versatil', 'versatil', 'supabase', '.versatil-memory'];

      const violations: string[] = [];

      for (const dir of forbiddenDirs) {
        try {
          await fs.access(path.join(projectDir, dir));
          violations.push(dir);
        } catch {
          // Good - directory doesn't exist in project
        }
      }

      const score = ((forbiddenDirs.length - violations.length) / forbiddenDirs.length) * 100;

      return {
        category: 'Isolation',
        name: 'Integrity',
        passed: violations.length === 0,
        score,
        message: violations.length === 0
          ? 'Framework properly isolated from project'
          : `Isolation violations: ${violations.join(', ')}`,
        details: violations.length > 0
          ? 'Run: npm run validate:isolation --fix'
          : undefined,
        critical: violations.length > 0
      };

    } catch (error) {
      return {
        category: 'Isolation',
        name: 'Integrity',
        passed: true,
        score: 100,
        message: 'Isolation check skipped (not in project directory)',
        critical: false
      };
    }
  }

  /**
   * Check memory system
   */
  private async checkMemorySystem(): Promise<ValidationCheck> {
    try {
      const memoryDir = path.join(this.versatilHome, 'memory');
      await fs.access(memoryDir);

      return {
        category: 'Memory',
        name: 'System',
        passed: true,
        score: 100,
        message: 'RAG memory system accessible',
        critical: false
      };

    } catch {
      return {
        category: 'Memory',
        name: 'System',
        passed: false,
        score: 50,
        message: 'Memory directory missing (will be created)',
        critical: false
      };
    }
  }

  /**
   * Test feature availability
   */
  private async testFeature(name: string, command: string): Promise<FeatureStatus> {
    try {
      const { stdout, stderr } = await execAsync(command);

      return {
        feature: name,
        working: true,
        message: `✅ ${name} command works`
      };

    } catch (error) {
      return {
        feature: name,
        working: false,
        message: `❌ ${name} command failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Generate recommendations based on checks
   */
  private generateRecommendations(checks: ValidationCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(c => !c.passed);

    if (failedChecks.some(c => c.category === 'Framework')) {
      recommendations.push('Run: versatil doctor --fix to repair framework files');
    }

    if (failedChecks.some(c => c.category === 'Commands')) {
      recommendations.push('Reinstall framework: npm install -g versatil-sdlc-framework');
    }

    if (failedChecks.some(c => c.category === 'Isolation')) {
      recommendations.push('Run: npm run validate:isolation --fix');
    }

    if (failedChecks.some(c => c.category === 'Permissions')) {
      recommendations.push('Check file permissions on ~/.versatil/ directory');
    }

    if (recommendations.length === 0 && checks.every(c => c.passed)) {
      recommendations.push('All checks passed! Framework is healthy.');
    }

    return recommendations;
  }

  /**
   * Measure performance metrics
   */
  async measurePerformance(): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    // Measure startup time
    await execAsync('versatil --version');
    const startupTime = Date.now() - startTime;

    // Measure memory usage
    const memoryUsage = process.memoryUsage().heapUsed;

    // Measure command response time
    const cmdStart = Date.now();
    await execAsync('versatil --version');
    const commandResponseTime = Date.now() - cmdStart;

    // Measure file access time
    const fileStart = Date.now();
    await fs.readdir(this.versatilHome);
    const fileAccessTime = Date.now() - fileStart;

    return {
      startupTime,
      memoryUsage,
      commandResponseTime,
      fileAccessTime
    };
  }
}

/**
 * Default validator instance
 */
export const defaultUpdateValidator = new UpdateValidator();
