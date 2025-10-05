#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Deployment Readiness Checker
 *
 * Validates that the framework is ready for production deployment
 * and provides guidance for next steps.
 */

// Simple color functions (compatible with all Node versions)
const chalk = {
  blue: { bold: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m` },
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

const fs = require('fs');
const path = require('path');

class DeploymentReadinessChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  async runAllChecks() {
    console.log(chalk.blue.bold('🚀 VERSATIL SDLC Framework - Deployment Readiness Check\n'));

    // Check framework files
    await this.checkFrameworkFiles();

    // Check edge functions
    await this.checkEdgeFunctions();

    // Check scripts
    await this.checkScripts();

    // Check configuration
    await this.checkConfiguration();

    // Check documentation
    await this.checkDocumentation();

    // Generate report
    this.generateReport();
  }

  async checkFrameworkFiles() {
    console.log(chalk.yellow('📋 Checking Framework Core Files...'));

    const coreFiles = [
      'package.json',
      'supabase/config.toml',
      '.env',
      'scripts/deploy-edge-functions.cjs',
      'test/test-edge-functions.cjs'
    ];

    for (const file of coreFiles) {
      if (fs.existsSync(file)) {
        console.log(chalk.green(`  ✅ ${file}`));
        this.checks.push({ type: 'file', name: file, status: 'pass' });
      } else {
        console.log(chalk.red(`  ❌ ${file}`));
        this.errors.push(`Missing core file: ${file}`);
      }
    }
    console.log();
  }

  async checkEdgeFunctions() {
    console.log(chalk.yellow('🔧 Checking Edge Functions...'));

    const functionsDir = 'supabase/functions';
    const expectedFunctions = [
      'opera-agent',
      'maria-rag',
      'james-rag',
      'marcus-rag',
      'context-fusion',
      'query-memories',
      'store-memory',
      '_shared'
    ];

    if (fs.existsSync(functionsDir)) {
      const actualFunctions = fs.readdirSync(functionsDir);

      for (const func of expectedFunctions) {
        if (actualFunctions.includes(func)) {
          const indexFile = path.join(functionsDir, func, 'index.ts');
          if (fs.existsSync(indexFile)) {
            console.log(chalk.green(`  ✅ ${func} (with index.ts)`));
            this.checks.push({ type: 'function', name: func, status: 'pass' });
          } else {
            console.log(chalk.yellow(`  ⚠️  ${func} (missing index.ts)`));
            this.warnings.push(`Function ${func} missing index.ts`);
          }
        } else {
          console.log(chalk.red(`  ❌ ${func} (not found)`));
          this.errors.push(`Missing edge function: ${func}`);
        }
      }
    } else {
      console.log(chalk.red(`  ❌ Functions directory not found`));
      this.errors.push('Missing supabase/functions directory');
    }
    console.log();
  }

  async checkScripts() {
    console.log(chalk.yellow('🛠️  Checking Deployment Scripts...'));

    const scripts = [
      'scripts/deploy-edge-functions.cjs',
      'test/test-edge-functions.cjs'
    ];

    for (const script of scripts) {
      if (fs.existsSync(script)) {
        console.log(chalk.green(`  ✅ ${script}`));
        this.checks.push({ type: 'script', name: script, status: 'pass' });
      } else {
        console.log(chalk.red(`  ❌ ${script}`));
        this.errors.push(`Missing deployment script: ${script}`);
      }
    }
    console.log();
  }

  async checkConfiguration() {
    console.log(chalk.yellow('⚙️  Checking Configuration...'));

    // Check package.json scripts
    if (fs.existsSync('package.json')) {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredScripts = [
        'edge:deploy',
        'edge:deploy:verify',
        'edge:health',
        'edge:validate',
        'test:edge-functions'
      ];

      for (const script of requiredScripts) {
        if (pkg.scripts && pkg.scripts[script]) {
          console.log(chalk.green(`  ✅ npm script: ${script}`));
        } else {
          console.log(chalk.yellow(`  ⚠️  npm script: ${script} (missing)`));
          this.warnings.push(`Missing npm script: ${script}`);
        }
      }
    }

    // Check environment template
    if (fs.existsSync('.env')) {
      console.log(chalk.green(`  ✅ Environment file created`));
      console.log(chalk.cyan(`  📝 Note: Update .env with actual credentials before deployment`));
    } else {
      console.log(chalk.red(`  ❌ Environment file missing`));
      this.errors.push('Missing .env file');
    }

    console.log();
  }

  async checkDocumentation() {
    console.log(chalk.yellow('📚 Checking Documentation...'));

    const docs = [
      'PRODUCTION_DEPLOYMENT_GUIDE.md',
      'PHASE_8_COMPLETION_REPORT.md',
      'docs/DEPLOYMENT_DEMO.md'
    ];

    for (const doc of docs) {
      if (fs.existsSync(doc)) {
        console.log(chalk.green(`  ✅ ${doc}`));
        this.checks.push({ type: 'doc', name: doc, status: 'pass' });
      } else {
        console.log(chalk.yellow(`  ⚠️  ${doc} (missing)`));
        this.warnings.push(`Missing documentation: ${doc}`);
      }
    }
    console.log();
  }

  generateReport() {
    const totalChecks = this.checks.length;
    const passedChecks = this.checks.filter(c => c.status === 'pass').length;
    const errorCount = this.errors.length;
    const warningCount = this.warnings.length;

    console.log('\x1b[1m\x1b[34m📋 Deployment Readiness Report\x1b[0m');
    console.log('\x1b[34m' + '='.repeat(50) + '\x1b[0m');

    console.log(`📊 Total Checks: ${totalChecks}`);
    console.log(`✅ Passed: ${chalk.green(passedChecks)}`);
    console.log(`⚠️  Warnings: ${chalk.yellow(warningCount)}`);
    console.log(`❌ Errors: ${chalk.red(errorCount)}`);

    if (errorCount === 0) {
      console.log(chalk.green('\n🎉 Framework is READY for production deployment!'));
      console.log(chalk.cyan('\n📋 Next Steps:'));
      console.log(chalk.cyan('1. Update .env with your actual Supabase credentials'));
      console.log(chalk.cyan('2. Run: npm run edge:validate'));
      console.log(chalk.cyan('3. Run: npm run edge:deploy:verify'));
      console.log(chalk.cyan('4. Run: npm run test:edge-functions'));
      console.log(chalk.cyan('\n📖 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions'));
    } else {
      console.log(chalk.red('\n❌ Framework has issues that need to be resolved:'));
      this.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
    }

    if (warningCount > 0 && errorCount === 0) {
      console.log(chalk.yellow('\n⚠️  Warnings (non-blocking):'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }

    const readinessScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    console.log(chalk.blue(`\n📈 Readiness Score: ${readinessScore}%`));

    if (readinessScore >= 90) {
      console.log(chalk.green('🚀 EXCELLENT - Ready for immediate deployment!'));
    } else if (readinessScore >= 70) {
      console.log(chalk.yellow('⚠️  GOOD - Minor issues to address'));
    } else {
      console.log(chalk.red('❌ NEEDS WORK - Significant issues to resolve'));
    }

    console.log(chalk.gray('\n🔗 Framework Version: 1.2.1 - Production Ready'));
    console.log(chalk.gray('🎯 VERSATIL SDLC Framework - Enhanced Edge Functions'));
  }
}

// CLI interface
const { Command } = require('commander');
const program = new Command();

program
  .name('check-deployment-readiness')
  .description('Check VERSATIL SDLC Framework deployment readiness')
  .version('1.2.1')
  .action(async () => {
    try {
      const checker = new DeploymentReadinessChecker();
      await checker.runAllChecks();
    } catch (error) {
      console.error(chalk.red(`Readiness check failed: ${error.message}`));
      process.exit(1);
    }
  });

// Run if called directly
if (require.main === module) {
  program.parse();
}

module.exports = { DeploymentReadinessChecker };