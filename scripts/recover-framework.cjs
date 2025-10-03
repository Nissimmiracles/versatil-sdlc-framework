#!/usr/bin/env node
/**
 * VERSATIL Framework Recovery System
 * Auto-detects and fixes common framework issues
 *
 * Usage: npm run recover
 *        node scripts/recover-framework.cjs
 *
 * Features:
 * - Detects ~/.versatil/ corruption
 * - Rebuilds framework structure
 * - Validates integrity
 * - Fixes isolation violations
 * - Recovers from agent failures
 * - Restores configuration
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const FRAMEWORK_HOME = path.join(os.homedir(), '.versatil');
const PROJECT_ROOT = process.cwd();

class FrameworkRecoverySystem {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  logSection(title) {
    this.log(`\n${'='.repeat(70)}`, 'cyan');
    this.log(`${COLORS.bold}${title}${COLORS.reset}`, 'cyan');
    this.log(`${'='.repeat(70)}`, 'cyan');
  }

  async run() {
    this.logSection('🔧 VERSATIL Framework Recovery System');
    this.log(`Starting recovery process at ${new Date().toLocaleString()}`, 'blue');
    this.log(`Framework Home: ${FRAMEWORK_HOME}`, 'blue');
    this.log(`Project Root: ${PROJECT_ROOT}`, 'blue');

    try {
      // Phase 1: Detection
      await this.detectIssues();

      // Phase 2: Recovery
      if (this.issues.length > 0) {
        await this.recoverFramework();
      } else {
        this.log('\n✅ No issues detected - Framework is healthy!', 'green');
      }

      // Phase 3: Validation
      await this.validateFramework();

      // Phase 4: Report
      this.generateReport();

    } catch (error) {
      this.log(`\n❌ Recovery failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    }
  }

  async detectIssues() {
    this.logSection('🔍 Phase 1: Issue Detection');

    // Check 1: Framework home exists
    await this.checkFrameworkHome();

    // Check 2: Isolation violations
    await this.checkIsolationViolations();

    // Check 3: Configuration integrity
    await this.checkConfigurationIntegrity();

    // Check 4: Agent configurations
    await this.checkAgentConfigurations();

    // Check 5: Required directories
    await this.checkRequiredDirectories();

    // Check 6: Node modules
    await this.checkNodeModules();

    this.log(`\n📊 Detection Summary:`, 'yellow');
    this.log(`   Issues found: ${this.issues.length}`, this.issues.length > 0 ? 'red' : 'green');
    this.log(`   Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'green');
  }

  async checkFrameworkHome() {
    this.log('Checking framework home directory...', 'blue');

    try {
      const exists = await this.pathExists(FRAMEWORK_HOME);
      if (!exists) {
        this.issues.push({
          type: 'missing_framework_home',
          severity: 'high',
          message: 'Framework home directory ~/.versatil/ does not exist',
          fix: 'Create framework home directory with proper structure'
        });
        this.log('   ❌ Framework home missing', 'red');
      } else {
        this.log('   ✅ Framework home exists', 'green');
      }
    } catch (error) {
      this.issues.push({
        type: 'framework_home_error',
        severity: 'critical',
        message: `Cannot access framework home: ${error.message}`,
        fix: 'Recreate framework home directory'
      });
      this.log('   ❌ Framework home inaccessible', 'red');
    }
  }

  async checkIsolationViolations() {
    this.log('Checking for isolation violations...', 'blue');

    const forbiddenPaths = [
      '.versatil',
      'versatil',
      'supabase',
      '.versatil-memory',
      '.versatil-logs'
    ];

    for (const forbidden of forbiddenPaths) {
      const fullPath = path.join(PROJECT_ROOT, forbidden);
      const exists = await this.pathExists(fullPath);

      if (exists) {
        this.issues.push({
          type: 'isolation_violation',
          severity: 'high',
          message: `Isolation violation: ${forbidden}/ exists in project`,
          path: fullPath,
          fix: `Remove ${forbidden}/ from project root`
        });
        this.log(`   ❌ Found ${forbidden}/ in project (violation)`, 'red');
      }
    }

    if (this.issues.filter(i => i.type === 'isolation_violation').length === 0) {
      this.log('   ✅ No isolation violations', 'green');
    }
  }

  async checkConfigurationIntegrity() {
    this.log('Checking configuration integrity...', 'blue');

    // Check .cursor/settings.json
    const cursorSettings = path.join(PROJECT_ROOT, '.cursor/settings.json');
    if (await this.pathExists(cursorSettings)) {
      try {
        const content = await fs.readFile(cursorSettings, 'utf-8');
        JSON.parse(content);
        this.log('   ✅ .cursor/settings.json valid', 'green');
      } catch (error) {
        this.issues.push({
          type: 'invalid_config',
          severity: 'high',
          message: '.cursor/settings.json is corrupted',
          path: cursorSettings,
          fix: 'Restore from backup or regenerate'
        });
        this.log('   ❌ .cursor/settings.json corrupted', 'red');
      }
    } else {
      this.warnings.push({
        message: '.cursor/settings.json not found',
        suggestion: 'Consider creating Cursor configuration'
      });
      this.log('   ⚠️  .cursor/settings.json missing', 'yellow');
    }

    // Check package.json
    const packageJson = path.join(PROJECT_ROOT, 'package.json');
    if (await this.pathExists(packageJson)) {
      try {
        const content = await fs.readFile(packageJson, 'utf-8');
        const pkg = JSON.parse(content);

        // Check for VERSATIL scripts
        const requiredScripts = ['validate', 'recover'];
        const missingScripts = requiredScripts.filter(s => !pkg.scripts || !pkg.scripts[s]);

        if (missingScripts.length > 0) {
          this.warnings.push({
            message: `Missing npm scripts: ${missingScripts.join(', ')}`,
            suggestion: 'Add VERSATIL convenience scripts'
          });
          this.log(`   ⚠️  Missing scripts: ${missingScripts.join(', ')}`, 'yellow');
        } else {
          this.log('   ✅ package.json scripts present', 'green');
        }
      } catch (error) {
        this.issues.push({
          type: 'invalid_package_json',
          severity: 'critical',
          message: 'package.json is corrupted',
          path: packageJson,
          fix: 'Cannot auto-fix - manual intervention required'
        });
        this.log('   ❌ package.json corrupted', 'red');
      }
    }
  }

  async checkAgentConfigurations() {
    this.log('Checking agent configurations...', 'blue');

    const agentDir = path.join(PROJECT_ROOT, '.claude/agents');
    if (!(await this.pathExists(agentDir))) {
      this.warnings.push({
        message: '.claude/agents/ directory not found',
        suggestion: 'Create agent configurations for BMAD agents'
      });
      this.log('   ⚠️  .claude/agents/ not found', 'yellow');
      return;
    }

    const expectedAgents = [
      'maria-qa.json',
      'james-frontend.json',
      'marcus-backend.json',
      'sarah-pm.json',
      'alex-ba.json',
      'dr-ai-ml.json'
    ];

    let validCount = 0;
    for (const agent of expectedAgents) {
      const agentPath = path.join(agentDir, agent);
      if (await this.pathExists(agentPath)) {
        try {
          const content = await fs.readFile(agentPath, 'utf-8');
          JSON.parse(content);
          validCount++;
        } catch (error) {
          this.issues.push({
            type: 'invalid_agent_config',
            severity: 'medium',
            message: `Agent config ${agent} is corrupted`,
            path: agentPath,
            fix: 'Regenerate agent configuration'
          });
          this.log(`   ❌ ${agent} corrupted`, 'red');
        }
      }
    }

    this.log(`   ✅ ${validCount}/${expectedAgents.length} agent configs valid`, 'green');
  }

  async checkRequiredDirectories() {
    this.log('Checking required directories...', 'blue');

    const requiredDirs = [
      '.claude',
      '.claude/agents',
      '.claude/commands',
      '.claude/hooks',
      'src',
      'tests'
    ];

    let missingCount = 0;
    for (const dir of requiredDirs) {
      const dirPath = path.join(PROJECT_ROOT, dir);
      if (!(await this.pathExists(dirPath))) {
        this.warnings.push({
          message: `Directory ${dir}/ not found`,
          suggestion: `Create ${dir}/ directory`
        });
        missingCount++;
      }
    }

    if (missingCount === 0) {
      this.log(`   ✅ All required directories present`, 'green');
    } else {
      this.log(`   ⚠️  ${missingCount} directories missing`, 'yellow');
    }
  }

  async checkNodeModules() {
    this.log('Checking node_modules...', 'blue');

    const nodeModules = path.join(PROJECT_ROOT, 'node_modules');
    if (!(await this.pathExists(nodeModules))) {
      this.issues.push({
        type: 'missing_node_modules',
        severity: 'high',
        message: 'node_modules not found',
        fix: 'Run npm install'
      });
      this.log('   ❌ node_modules missing', 'red');
    } else {
      this.log('   ✅ node_modules present', 'green');
    }
  }

  async recoverFramework() {
    this.logSection('🔧 Phase 2: Framework Recovery');

    const criticalIssues = this.issues.filter(i => i.severity === 'critical' || i.severity === 'high');
    this.log(`Attempting to fix ${criticalIssues.length} critical/high severity issues...`, 'yellow');

    for (const issue of criticalIssues) {
      try {
        await this.fixIssue(issue);
      } catch (error) {
        this.log(`   ❌ Failed to fix ${issue.type}: ${error.message}`, 'red');
      }
    }

    this.log(`\n✅ Recovery completed - ${this.fixes.length} fixes applied`, 'green');
  }

  async fixIssue(issue) {
    this.log(`\n   Fixing: ${issue.message}`, 'cyan');

    switch (issue.type) {
      case 'missing_framework_home':
        await this.createFrameworkHome();
        break;

      case 'isolation_violation':
        await this.fixIsolationViolation(issue.path);
        break;

      case 'missing_node_modules':
        await this.installNodeModules();
        break;

      default:
        this.log(`   ⚠️  No auto-fix available for ${issue.type}`, 'yellow');
        this.log(`   Manual fix required: ${issue.fix}`, 'yellow');
    }
  }

  async createFrameworkHome() {
    this.log('   Creating framework home directory...', 'blue');

    await fs.mkdir(FRAMEWORK_HOME, { recursive: true });

    // Create subdirectories
    const subdirs = ['agents', 'logs', 'memory', 'cache', 'backups', 'config'];
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(FRAMEWORK_HOME, subdir), { recursive: true });
    }

    // Create .gitignore
    const gitignore = path.join(FRAMEWORK_HOME, '.gitignore');
    await fs.writeFile(gitignore, '*\n!.gitignore\n');

    this.fixes.push({
      issue: 'missing_framework_home',
      action: 'Created ~/.versatil/ with proper structure',
      timestamp: new Date().toISOString()
    });

    this.log('   ✅ Framework home created', 'green');
  }

  async fixIsolationViolation(violationPath) {
    this.log(`   Removing isolation violation: ${violationPath}`, 'blue');

    // Safety check - don't delete if it contains important data
    const basename = path.basename(violationPath);
    if (['.versatil', 'versatil', '.versatil-memory', '.versatil-logs'].includes(basename)) {
      // Check if directory is empty or has only cache/temp files
      try {
        const files = await fs.readdir(violationPath);
        if (files.length > 0) {
          // Backup before deletion
          const backupPath = path.join(FRAMEWORK_HOME, 'backups', `${basename}-${Date.now()}`);
          await fs.mkdir(path.join(FRAMEWORK_HOME, 'backups'), { recursive: true });
          await fs.rename(violationPath, backupPath);
          this.log(`   ℹ️  Backed up to ${backupPath}`, 'cyan');
        } else {
          await fs.rm(violationPath, { recursive: true, force: true });
        }

        this.fixes.push({
          issue: 'isolation_violation',
          action: `Removed ${basename}/ from project root`,
          timestamp: new Date().toISOString()
        });

        this.log('   ✅ Isolation violation fixed', 'green');
      } catch (error) {
        this.log(`   ❌ Could not remove ${violationPath}: ${error.message}`, 'red');
      }
    }
  }

  async installNodeModules() {
    this.log('   Installing node_modules...', 'blue');

    try {
      execSync('npm install', { cwd: PROJECT_ROOT, stdio: 'inherit' });

      this.fixes.push({
        issue: 'missing_node_modules',
        action: 'Ran npm install',
        timestamp: new Date().toISOString()
      });

      this.log('   ✅ node_modules installed', 'green');
    } catch (error) {
      this.log(`   ❌ npm install failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async validateFramework() {
    this.logSection('✅ Phase 3: Validation');

    // Re-run checks to verify fixes
    const validationResults = {
      frameworkHome: await this.pathExists(FRAMEWORK_HOME),
      isolationViolations: 0,
      nodeModules: await this.pathExists(path.join(PROJECT_ROOT, 'node_modules'))
    };

    // Count remaining isolation violations
    const forbiddenPaths = ['.versatil', 'versatil', 'supabase', '.versatil-memory'];
    for (const forbidden of forbiddenPaths) {
      if (await this.pathExists(path.join(PROJECT_ROOT, forbidden))) {
        validationResults.isolationViolations++;
      }
    }

    // Report validation results
    this.log('\nValidation Results:', 'cyan');
    this.log(`   Framework Home: ${validationResults.frameworkHome ? '✅' : '❌'}`,
              validationResults.frameworkHome ? 'green' : 'red');
    this.log(`   Isolation: ${validationResults.isolationViolations === 0 ? '✅' : '❌'} (${validationResults.isolationViolations} violations)`,
              validationResults.isolationViolations === 0 ? 'green' : 'red');
    this.log(`   Node Modules: ${validationResults.nodeModules ? '✅' : '❌'}`,
              validationResults.nodeModules ? 'green' : 'red');

    const allValid = validationResults.frameworkHome &&
                     validationResults.isolationViolations === 0 &&
                     validationResults.nodeModules;

    if (allValid) {
      this.log('\n🎉 Framework validation passed!', 'green');
    } else {
      this.log('\n⚠️  Some issues remain - manual intervention may be required', 'yellow');
    }
  }

  generateReport() {
    this.logSection('📊 Recovery Report');

    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    this.log(`\n${COLORS.bold}Summary:${COLORS.reset}`, 'cyan');
    this.log(`   Duration: ${duration}s`, 'blue');
    this.log(`   Issues Detected: ${this.issues.length}`, this.issues.length > 0 ? 'red' : 'green');
    this.log(`   Fixes Applied: ${this.fixes.length}`, this.fixes.length > 0 ? 'green' : 'blue');
    this.log(`   Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'green');

    if (this.fixes.length > 0) {
      this.log(`\n${COLORS.bold}Fixes Applied:${COLORS.reset}`, 'green');
      this.fixes.forEach((fix, i) => {
        this.log(`   ${i + 1}. ${fix.action}`, 'green');
      });
    }

    if (this.warnings.length > 0) {
      this.log(`\n${COLORS.bold}Warnings:${COLORS.reset}`, 'yellow');
      this.warnings.forEach((warning, i) => {
        this.log(`   ${i + 1}. ${warning.message}`, 'yellow');
        this.log(`      → ${warning.suggestion}`, 'cyan');
      });
    }

    const remainingIssues = this.issues.length - this.fixes.length;
    if (remainingIssues > 0) {
      this.log(`\n${COLORS.bold}Remaining Issues (Manual Intervention Required):${COLORS.reset}`, 'red');
      const unfixed = this.issues.filter(issue =>
        !this.fixes.some(fix => fix.issue === issue.type)
      );
      unfixed.forEach((issue, i) => {
        this.log(`   ${i + 1}. ${issue.message}`, 'red');
        this.log(`      Fix: ${issue.fix}`, 'cyan');
      });
    }

    this.log('\n' + '='.repeat(70), 'cyan');
    this.log('Recovery process completed.', 'green');

    if (remainingIssues === 0) {
      this.log('✅ Framework is healthy and ready to use!', 'green');
    } else {
      this.log(`⚠️  ${remainingIssues} issue(s) require manual attention.`, 'yellow');
    }

    this.log('='.repeat(70), 'cyan');
  }

  async pathExists(p) {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
}

// Run recovery
const recovery = new FrameworkRecoverySystem();
recovery.run().catch(error => {
  console.error(`${COLORS.red}Fatal error:${COLORS.reset}`, error);
  process.exit(1);
});