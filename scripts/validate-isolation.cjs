#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Isolation Validator
 * Ensures framework and user projects remain completely separated
 * Runs automatically during operations to prevent mixing
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

class IsolationValidator {
  constructor() {
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.projectRoot = process.cwd();
    this.frameworkRoot = path.dirname(path.dirname(__filename));
    this.violations = [];
    this.warnings = [];
  }

  async validate() {
    console.log('\n🔒 VERSATIL Isolation Validator\n');
    console.log(`Framework Home: ${colors.blue}${this.versatilHome}${colors.reset}`);
    console.log(`Project Root: ${colors.blue}${this.projectRoot}${colors.reset}`);
    console.log(`Framework Installation: ${colors.blue}${this.frameworkRoot}${colors.reset}\n`);

    // Run all validation checks
    this.checkProjectNotInFramework();
    this.checkFrameworkNotInProject();
    this.checkForbiddenFilesInProject();
    this.checkFrameworkDataLocation();
    this.checkEnvironmentVariables();
    this.checkGitignore();

    // Report results
    this.report();

    return this.violations.length === 0;
  }

  checkProjectNotInFramework() {
    if (this.projectRoot.startsWith(this.versatilHome)) {
      this.violations.push({
        type: 'CRITICAL',
        message: 'Project is inside framework home directory',
        path: this.projectRoot,
        solution: 'Move your project outside of ~/.versatil/ directory'
      });
    }

    if (this.projectRoot.startsWith(this.frameworkRoot) && this.projectRoot !== this.frameworkRoot) {
      this.violations.push({
        type: 'CRITICAL',
        message: 'Project is inside framework installation directory',
        path: this.projectRoot,
        solution: 'Your project should be in a separate directory'
      });
    }
  }

  checkFrameworkNotInProject() {
    if (this.versatilHome.startsWith(this.projectRoot) && this.versatilHome !== this.versatilHome) {
      this.violations.push({
        type: 'CRITICAL',
        message: 'Framework home is inside project directory',
        path: this.versatilHome,
        solution: 'Framework data must be in ~/.versatil/ (user home directory)'
      });
    }
  }

  checkForbiddenFilesInProject() {
    const forbidden = [
      '.versatil',           // Old installation method
      'versatil',            // Framework directory
      '.versatil-framework', // Framework data
      'supabase',           // Supabase should be in ~/.versatil/supabase/
      '.versatil-logs',
      '.versatil-memory',
    ];

    for (const item of forbidden) {
      const itemPath = path.join(this.projectRoot, item);
      if (fs.existsSync(itemPath)) {
        this.violations.push({
          type: 'ERROR',
          message: `Forbidden directory found in project: ${item}`,
          path: itemPath,
          solution: `Remove ${item} from project. Framework data belongs in ~/.versatil/`
        });
      }
    }

    // Check for .env in project (should warn, not error)
    const projectEnv = path.join(this.projectRoot, '.env');
    if (fs.existsSync(projectEnv)) {
      const content = fs.readFileSync(projectEnv, 'utf8');
      if (content.includes('SUPABASE_URL') || content.includes('OPERA_MCP') || content.includes('VERSATIL')) {
        this.warnings.push({
          type: 'WARNING',
          message: 'Project .env contains framework variables',
          path: projectEnv,
          solution: 'Framework environment variables should be in ~/.versatil/.env'
        });
      }
    }
  }

  checkFrameworkDataLocation() {
    const requiredDirs = [
      'supabase',
      'rag-memory',
      'agents',
      'logs',
      'config'
    ];

    for (const dir of requiredDirs) {
      const frameworkPath = path.join(this.versatilHome, dir);
      const projectPath = path.join(this.projectRoot, dir);

      // Check if exists in project (bad)
      if (fs.existsSync(projectPath) && this.projectRoot !== this.frameworkRoot) {
        const stat = fs.statSync(projectPath);
        if (stat.isDirectory()) {
          // Check if it might be framework data
          const files = fs.readdirSync(projectPath);
          const hasVersatilFiles = files.some(f =>
            f.includes('versatil') ||
            f.includes('opera') ||
            f.includes('opera')
          );

          if (hasVersatilFiles) {
            this.violations.push({
              type: 'ERROR',
              message: `Framework ${dir} directory found in project`,
              path: projectPath,
              solution: `Move to ${frameworkPath} or delete if it's old framework data`
            });
          }
        }
      }

      // Check if should exist in framework home (create if missing)
      if (!fs.existsSync(frameworkPath)) {
        this.warnings.push({
          type: 'INFO',
          message: `Framework ${dir} directory will be created`,
          path: frameworkPath,
          solution: 'Auto-creating during next framework operation'
        });
      }
    }
  }

  checkEnvironmentVariables() {
    // Check that framework env is in the right place
    const frameworkEnv = path.join(this.versatilHome, '.env');
    const projectEnv = path.join(this.projectRoot, '.env');

    if (!fs.existsSync(frameworkEnv)) {
      this.warnings.push({
        type: 'INFO',
        message: 'Framework .env not found in ~/.versatil/',
        path: frameworkEnv,
        solution: 'Will be created automatically on first run'
      });
    }
  }

  checkGitignore() {
    // Check project .gitignore includes proper exclusions
    const gitignorePath = path.join(this.projectRoot, '.gitignore');

    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');

      const shouldIgnore = [
        '.versatil',
        '.versatil-project.json', // This is OK to commit, but some might want to ignore
      ];

      for (const item of shouldIgnore) {
        if (!content.includes(item) && item !== '.versatil-project.json') {
          this.warnings.push({
            type: 'WARNING',
            message: `.gitignore missing ${item}`,
            path: gitignorePath,
            solution: `Add "${item}" to .gitignore to prevent accidental commits`
          });
        }
      }
    }

    // Check framework .gitignore exists
    const frameworkGitignore = path.join(this.versatilHome, '.gitignore');
    if (!fs.existsSync(frameworkGitignore)) {
      this.warnings.push({
        type: 'INFO',
        message: 'Framework .gitignore will be created',
        path: frameworkGitignore,
        solution: 'Auto-creating to protect framework data'
      });
    }
  }

  report() {
    console.log('='.repeat(70));
    console.log('\n📋 Validation Results:\n');

    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log(`${colors.green}✓ All isolation checks passed!${colors.reset}\n`);
      console.log('Framework and project are properly isolated.\n');
      return;
    }

    // Report violations (errors)
    if (this.violations.length > 0) {
      console.log(`${colors.red}✗ ${this.violations.length} Violation(s) Found:${colors.reset}\n`);

      this.violations.forEach((v, i) => {
        console.log(`${i + 1}. [${v.type}] ${v.message}`);
        console.log(`   Path: ${v.path}`);
        console.log(`   ${colors.yellow}Solution: ${v.solution}${colors.reset}\n`);
      });
    }

    // Report warnings
    if (this.warnings.length > 0) {
      console.log(`${colors.yellow}⚠ ${this.warnings.length} Warning(s):${colors.reset}\n`);

      this.warnings.forEach((w, i) => {
        console.log(`${i + 1}. [${w.type}] ${w.message}`);
        console.log(`   Path: ${w.path}`);
        console.log(`   ${colors.blue}${w.solution}${colors.reset}\n`);
      });
    }

    console.log('='.repeat(70));

    if (this.violations.length > 0) {
      console.log(`\n${colors.red}⛔ Isolation violations detected!${colors.reset}`);
      console.log('Please fix the issues above to ensure proper framework isolation.\n');
    } else {
      console.log(`\n${colors.green}✓ No critical issues. Warnings are informational.${colors.reset}\n`);
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new IsolationValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { IsolationValidator };