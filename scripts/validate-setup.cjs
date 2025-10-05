#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Setup Validation Script
 * Validates the complete framework installation and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[⚠]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  check: (msg) => process.stdout.write(`${colors.cyan}[?]${colors.reset} ${msg}... `)
};

class VersatilValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.versatilDir = path.join(this.projectRoot, '.versatil');
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: []
    };
  }

  showHeader() {
    console.clear();
    console.log(`${colors.blue}╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║                   VERSATIL SETUP VALIDATION                 ║`);
    console.log(`║               Verifying Framework Installation               ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log('');
  }

  async runCheck(name, checkFunction, required = true) {
    log.check(name);

    try {
      const result = await checkFunction();
      if (result.success) {
        console.log(`${colors.green}✓${colors.reset}`);
        this.results.passed++;
        this.results.checks.push({ name, status: 'passed', message: result.message });
      } else {
        if (required) {
          console.log(`${colors.red}✗${colors.reset}`);
          this.results.failed++;
          this.results.checks.push({ name, status: 'failed', message: result.message });
        } else {
          console.log(`${colors.yellow}⚠${colors.reset}`);
          this.results.warnings++;
          this.results.checks.push({ name, status: 'warning', message: result.message });
        }
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset}`);
      this.results.failed++;
      this.results.checks.push({ name, status: 'failed', message: error.message });
    }
  }

  async checkCoreFiles() {
    return this.runCheck('Core framework files', async () => {
      const requiredFiles = [
        '.cursorrules',
        'CLAUDE.md',
        '.versatil/project-config.json',
        '.versatil/chrome-mcp-config.md',
        '.versatil/auto-agent-dispatcher.md'
      ];

      const missingFiles = [];
      for (const file of requiredFiles) {
        if (!fs.existsSync(path.join(this.projectRoot, file))) {
          missingFiles.push(file);
        }
      }

      if (missingFiles.length === 0) {
        return { success: true, message: 'All core files present' };
      } else {
        return { success: false, message: `Missing files: ${missingFiles.join(', ')}` };
      }
    });
  }

  async checkAgentConfiguration() {
    return this.runCheck('Agent configuration', async () => {
      const agentsDir = path.join(this.versatilDir, 'agents');

      if (!fs.existsSync(agentsDir)) {
        return { success: false, message: 'Agents directory not found' };
      }

      const expectedAgents = ['maria-qa', 'james-frontend', 'marcus-backend', 'sarah-pm', 'alex-ba', 'dr-ai-ml'];
      const configuredAgents = fs.readdirSync(agentsDir).filter(item =>
        fs.lstatSync(path.join(agentsDir, item)).isDirectory()
      );

      const missingAgents = expectedAgents.filter(agent => !configuredAgents.includes(agent));

      if (missingAgents.length === 0) {
        return { success: true, message: `All 6 agents configured (${configuredAgents.length})` };
      } else {
        return { success: false, message: `Missing agents: ${missingAgents.join(', ')}` };
      }
    });
  }

  async checkNodeEnvironment() {
    return this.runCheck('Node.js environment', async () => {
      try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

        const nodeVersionNumber = parseFloat(nodeVersion.replace('v', ''));
        if (nodeVersionNumber >= 16.0) {
          return { success: true, message: `Node ${nodeVersion}, npm ${npmVersion}` };
        } else {
          return { success: false, message: `Node version ${nodeVersion} is too old (minimum: 16.0)` };
        }
      } catch (error) {
        return { success: false, message: 'Node.js or npm not found' };
      }
    });
  }

  async checkChromeMCP() {
    return this.runCheck('Chrome MCP installation', async () => {
      try {
        // Check if chrome-mcp is installed
        execSync('npm list -g @modelcontextprotocol/server-chrome', { stdio: 'pipe' });
        return { success: true, message: 'Chrome MCP server installed globally' };
      } catch (error) {
        return { success: false, message: 'Chrome MCP server not installed' };
      }
    }, false); // Not required for basic functionality
  }

  async checkTestingSetup() {
    return this.runCheck('Testing framework setup', async () => {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return { success: false, message: 'package.json not found' };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const testDependencies = ['playwright', '@playwright/test', 'jest', 'vitest'];

      const installedTestDeps = testDependencies.filter(dep =>
        packageJson.devDependencies?.[dep] || packageJson.dependencies?.[dep]
      );

      if (installedTestDeps.length > 0) {
        return { success: true, message: `Testing dependencies: ${installedTestDeps.join(', ')}` };
      } else {
        return { success: false, message: 'No testing framework detected' };
      }
    }, false);
  }

  async checkGitRepository() {
    return this.runCheck('Git repository', async () => {
      if (fs.existsSync('.git')) {
        try {
          const hasHooks = fs.existsSync('.git/hooks/pre-commit') || fs.existsSync('.git/hooks/pre-push');
          return {
            success: true,
            message: hasHooks ? 'Git repo with quality hooks' : 'Git repo (no hooks)'
          };
        } catch {
          return { success: true, message: 'Git repository present' };
        }
      } else {
        return { success: false, message: 'Not a Git repository' };
      }
    }, false);
  }

  async checkCursorRules() {
    return this.runCheck('.cursorrules validation', async () => {
      const cursorRulesPath = path.join(this.projectRoot, '.cursorrules');

      if (!fs.existsSync(cursorRulesPath)) {
        return { success: false, message: '.cursorrules file not found' };
      }

      const content = fs.readFileSync(cursorRulesPath, 'utf8');

      // Check for essential sections
      const requiredSections = [
        'OPERA METHODOLOGY',
        'Maria-QA',
        'James-Frontend',
        'Marcus-Backend',
        'agent_collaboration',
        'context_preservation'
      ];

      const missingSections = requiredSections.filter(section =>
        !content.includes(section)
      );

      if (missingSections.length === 0) {
        return { success: true, message: 'All agent activation rules present' };
      } else {
        return { success: false, message: `Missing sections: ${missingSections.join(', ')}` };
      }
    });
  }

  async checkClaudeConfiguration() {
    return this.runCheck('CLAUDE.md configuration', async () => {
      const claudePath = path.join(this.projectRoot, 'CLAUDE.md');

      if (!fs.existsSync(claudePath)) {
        return { success: false, message: 'CLAUDE.md not found' };
      }

      const content = fs.readFileSync(claudePath, 'utf8');

      // Check for OPERA methodology sections
      const requiredSections = [
        'OPERA Methodology',
        'Quality Gates',
        'Chrome MCP Testing',
        'Context Preservation Protocol',
        'Emergency Response Protocol'
      ];

      const missingSections = requiredSections.filter(section =>
        !content.includes(section)
      );

      if (missingSections.length === 0) {
        return { success: true, message: 'OPERA methodology fully documented' };
      } else {
        return { success: false, message: `Missing sections: ${missingSections.join(', ')}` };
      }
    });
  }

  async checkProjectConfiguration() {
    return this.runCheck('Project configuration', async () => {
      const configPath = path.join(this.versatilDir, 'project-config.json');

      if (!fs.existsSync(configPath)) {
        return { success: false, message: 'project-config.json not found' };
      }

      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        const requiredFields = ['project', 'agents'];
        const missingFields = requiredFields.filter(field => !config[field]);

        if (missingFields.length === 0) {
          const agentCount = Object.keys(config.agents || {}).length;
          return { success: true, message: `Configuration valid (${agentCount} agents)` };
        } else {
          return { success: false, message: `Missing fields: ${missingFields.join(', ')}` };
        }
      } catch (error) {
        return { success: false, message: 'Invalid JSON configuration' };
      }
    });
  }

  async checkScriptsAndCommands() {
    return this.runCheck('Scripts and commands', async () => {
      const scriptsDir = path.join(this.projectRoot, 'scripts');
      const requiredScripts = ['install.sh', 'setup-agents.js', 'validate-setup.js'];

      if (!fs.existsSync(scriptsDir)) {
        return { success: false, message: 'Scripts directory not found' };
      }

      const missingScripts = requiredScripts.filter(script =>
        !fs.existsSync(path.join(scriptsDir, script))
      );

      if (missingScripts.length === 0) {
        return { success: true, message: 'All framework scripts present' };
      } else {
        return { success: false, message: `Missing scripts: ${missingScripts.join(', ')}` };
      }
    });
  }

  async checkPackageJsonScripts() {
    return this.runCheck('Package.json scripts', async () => {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return { success: false, message: 'package.json not found' };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      const versatilScripts = Object.keys(scripts).filter(key =>
        key.startsWith('versatil:') || key.startsWith('maria:') ||
        key.startsWith('james:') || key.startsWith('marcus:')
      );

      if (versatilScripts.length >= 3) {
        return { success: true, message: `${versatilScripts.length} VERSATIL scripts available` };
      } else {
        return { success: false, message: 'VERSATIL scripts not configured in package.json' };
      }
    }, false);
  }

  async checkDependencies() {
    return this.runCheck('Framework dependencies', async () => {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        return { success: false, message: 'package.json not found' };
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const recommendedDeps = ['chalk', 'inquirer', 'fs-extra', 'commander'];
      const installedRecommended = recommendedDeps.filter(dep => allDeps[dep]);

      if (installedRecommended.length >= 2) {
        return { success: true, message: `${installedRecommended.length} framework dependencies` };
      } else {
        return { success: false, message: 'Framework dependencies not installed' };
      }
    }, false);
  }

  async validateAgentConfigurations() {
    log.info('Validating individual agent configurations...');

    const agentsDir = path.join(this.versatilDir, 'agents');
    if (!fs.existsSync(agentsDir)) {
      log.error('Agents directory not found');
      return;
    }

    const agents = fs.readdirSync(agentsDir).filter(item =>
      fs.lstatSync(path.join(agentsDir, item)).isDirectory()
    );

    for (const agent of agents) {
      const agentDir = path.join(agentsDir, agent);
      const configPath = path.join(agentDir, 'config.json');

      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          log.success(`${agent}: Configuration valid`);
        } catch {
          log.error(`${agent}: Invalid configuration JSON`);
        }
      } else {
        log.warning(`${agent}: Configuration file missing`);
      }
    }
  }

  async runDiagnostics() {
    log.info('Running system diagnostics...');

    const diagnostics = {
      system: {},
      project: {},
      framework: {}
    };

    try {
      // System information
      diagnostics.system.os = process.platform;
      diagnostics.system.node = process.version;
      diagnostics.system.cwd = process.cwd();

      // Project information
      if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        diagnostics.project.name = pkg.name;
        diagnostics.project.version = pkg.version;
        diagnostics.project.dependencies = Object.keys(pkg.dependencies || {}).length;
        diagnostics.project.devDependencies = Object.keys(pkg.devDependencies || {}).length;
      }

      // Framework information
      if (fs.existsSync(path.join(this.versatilDir, 'project-config.json'))) {
        const config = JSON.parse(fs.readFileSync(path.join(this.versatilDir, 'project-config.json'), 'utf8'));
        diagnostics.framework.version = config.project?.version || 'unknown';
        diagnostics.framework.agents = Object.keys(config.agents || {}).length;
        diagnostics.framework.initialized = config.project?.initialized || 'unknown';
      }

      // Save diagnostics
      fs.writeFileSync(
        path.join(this.versatilDir, 'diagnostics.json'),
        JSON.stringify(diagnostics, null, 2)
      );

      log.success('Diagnostics saved to .versatil/diagnostics.json');

    } catch (error) {
      log.warning('Could not complete diagnostics');
    }
  }

  async generateReport() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

    console.log('\n' + colors.cyan + '╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      VALIDATION REPORT                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝' + colors.reset);
    console.log('');

    // Overall status
    let overallStatus = 'FAILED';
    let statusColor = colors.red;

    if (this.results.failed === 0 && this.results.passed >= 8) {
      overallStatus = 'EXCELLENT';
      statusColor = colors.green;
    } else if (this.results.failed <= 2 && this.results.passed >= 6) {
      overallStatus = 'GOOD';
      statusColor = colors.yellow;
    }

    console.log(`${colors.blue}Overall Status:${colors.reset} ${statusColor}${overallStatus}${colors.reset}`);
    console.log(`${colors.blue}Success Rate:${colors.reset} ${successRate}%`);
    console.log('');

    // Results summary
    console.log(`${colors.green}✓ Passed:${colors.reset} ${this.results.passed}`);
    if (this.results.warnings > 0) {
      console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${this.results.warnings}`);
    }
    if (this.results.failed > 0) {
      console.log(`${colors.red}✗ Failed:${colors.reset} ${this.results.failed}`);
    }
    console.log('');

    // Detailed results
    if (this.results.failed > 0) {
      console.log(`${colors.red}Failed Checks:${colors.reset}`);
      for (const check of this.results.checks) {
        if (check.status === 'failed') {
          console.log(`  • ${check.name}: ${check.message}`);
        }
      }
      console.log('');
    }

    if (this.results.warnings > 0) {
      console.log(`${colors.yellow}Warnings:${colors.reset}`);
      for (const check of this.results.checks) {
        if (check.status === 'warning') {
          console.log(`  • ${check.name}: ${check.message}`);
        }
      }
      console.log('');
    }

    // Recommendations
    console.log(`${colors.blue}Recommendations:${colors.reset}`);

    if (this.results.failed === 0) {
      console.log('🎉 Your VERSATIL setup looks great! Consider:');
      console.log('  • Testing the framework with a small change');
      console.log('  • Exploring agent-specific commands');
      console.log('  • Setting up CI/CD integration');
    } else {
      console.log('🔧 To improve your setup:');
      if (this.results.failed > 0) {
        console.log('  • Fix the failed checks listed above');
        console.log('  • Re-run the installation script if needed');
        console.log('  • Check the documentation for troubleshooting');
      }
    }

    console.log('');
    console.log(`${colors.cyan}Need help?${colors.reset}`);
    console.log('• Documentation: https://versatil-sdlc.dev/docs');
    console.log('• Issues: https://github.com/versatil-platform/versatil-sdlc-framework/issues');
    console.log('• Community: https://github.com/versatil-platform/versatil-sdlc-framework/discussions');

    return overallStatus === 'EXCELLENT' || overallStatus === 'GOOD';
  }

  async run() {
    this.showHeader();

    log.info('Running comprehensive validation checks...');
    console.log('');

    // Core framework validation
    await this.checkCoreFiles();
    await this.checkCursorRules();
    await this.checkClaudeConfiguration();
    await this.checkProjectConfiguration();

    // Agent validation
    await this.checkAgentConfiguration();

    // Environment validation
    await this.checkNodeEnvironment();
    await this.checkChromeMCP();

    // Project setup validation
    await this.checkTestingSetup();
    await this.checkGitRepository();
    await this.checkScriptsAndCommands();
    await this.checkPackageJsonScripts();
    await this.checkDependencies();

    console.log('');

    // Additional validations
    await this.validateAgentConfigurations();
    await this.runDiagnostics();

    // Generate final report
    const success = await this.generateReport();

    return success;
  }
}

// Run validation
if (require.main === module) {
  const validator = new VersatilValidator();
  validator.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(`${colors.red}Validation error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = VersatilValidator;