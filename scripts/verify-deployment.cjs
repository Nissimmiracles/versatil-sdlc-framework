#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Post-Deployment Verification
 *
 * Verifies that all planned changes were actually deployed:
 * - Source files created
 * - Modifications applied
 * - Dist files compiled
 * - Version consistency
 * - Build succeeded
 * - Tests passed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple color functions
const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

class DeploymentVerifier {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.results = {
      filesCreated: [],
      filesModified: [],
      filesMissing: [],
      integrationsVerified: [],
      integrationsFailed: [],
      distFilesCompiled: [],
      distFilesMissing: [],
      versionConsistent: false,
      versionDetails: null,
      buildSucceeded: false,
      buildErrors: [],
      testsExecuted: false,
      testsPassed: false,
      testResults: null
    };
  }

  async verify(deploymentPlan = null) {
    console.log(chalk.bold(chalk.blue('\n🔍 VERSATIL Post-Deployment Verification\n')));

    // If no deployment plan provided, verify current state
    if (!deploymentPlan) {
      console.log(chalk.yellow('📋 No deployment plan provided - verifying current state\n'));
      await this.verifyCurrentState();
    } else {
      console.log(chalk.cyan(`📋 Verifying deployment: ${deploymentPlan.name}\n`));
      await this.verifyDeploymentPlan(deploymentPlan);
    }

    // Always check these
    await this.verifyVersionConsistency();
    await this.verifyBuild();
    await this.verifyTests();

    // Generate report
    return this.generateReport();
  }

  async verifyCurrentState() {
    console.log(chalk.cyan('🔍 Checking current state...'));

    // Check key directories exist
    const keyDirs = ['src', 'dist', 'scripts', 'tests'];
    keyDirs.forEach(dir => {
      const dirPath = path.join(this.rootDir, dir);
      if (fs.existsSync(dirPath)) {
        this.results.integrationsVerified.push(`Directory exists: ${dir}/`);
      } else {
        this.results.integrationsFailed.push({
          type: 'missing_directory',
          path: dir,
          reason: 'Key directory not found'
        });
      }
    });

    // Check package.json exists
    const packagePath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      this.results.filesCreated.push('package.json');
    } else {
      this.results.filesMissing.push('package.json');
    }

    console.log(chalk.green('  ✅ Current state checked\n'));
  }

  async verifyDeploymentPlan(plan) {
    // Verify new files
    if (plan.newFiles && plan.newFiles.length > 0) {
      console.log(chalk.cyan(`🆕 Verifying ${plan.newFiles.length} new files...`));

      plan.newFiles.forEach(fileInfo => {
        const filePath = typeof fileInfo === 'string' ? fileInfo : fileInfo.path;
        const fullPath = path.join(this.rootDir, filePath);

        if (fs.existsSync(fullPath)) {
          this.results.filesCreated.push(filePath);

          // Check if dist file exists
          if (filePath.startsWith('src/') && filePath.endsWith('.ts')) {
            const distPath = filePath.replace('src/', 'dist/').replace('.ts', '.js');
            const fullDistPath = path.join(this.rootDir, distPath);

            if (fs.existsSync(fullDistPath)) {
              this.results.distFilesCompiled.push(distPath);
            } else {
              this.results.distFilesMissing.push(distPath);
            }
          }
        } else {
          this.results.filesMissing.push(filePath);
        }
      });

      console.log(chalk.green(`  ✅ Created: ${this.results.filesCreated.length}/${plan.newFiles.length}`));
      if (this.results.filesMissing.length > 0) {
        console.log(chalk.red(`  ❌ Missing: ${this.results.filesMissing.length}`));
      }
      console.log();
    }

    // Verify modified files
    if (plan.modifiedFiles && plan.modifiedFiles.length > 0) {
      console.log(chalk.cyan(`📝 Verifying ${plan.modifiedFiles.length} modified files...`));

      plan.modifiedFiles.forEach(fileInfo => {
        const filePath = typeof fileInfo === 'string' ? fileInfo : fileInfo.path;
        const fullPath = path.join(this.rootDir, filePath);

        if (fs.existsSync(fullPath)) {
          // If changes specified, verify them
          if (fileInfo.changes) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const allChangesPresent = fileInfo.changes.every(change => {
              if (change.newCode) {
                return content.includes(change.newCode);
              }
              return true;
            });

            if (allChangesPresent) {
              this.results.filesModified.push(filePath);
            } else {
              this.results.integrationsFailed.push({
                type: 'modification_incomplete',
                path: filePath,
                reason: 'Expected changes not found in file'
              });
            }
          } else {
            // Just check file exists
            this.results.filesModified.push(filePath);
          }
        } else {
          this.results.filesMissing.push(filePath);
        }
      });

      console.log(chalk.green(`  ✅ Modified: ${this.results.filesModified.length}/${plan.modifiedFiles.length}`));
      console.log();
    }

    // Verify integrations
    if (plan.integrations && plan.integrations.length > 0) {
      console.log(chalk.cyan(`🔗 Verifying ${plan.integrations.length} integrations...`));

      plan.integrations.forEach(integration => {
        const filePath = integration.file;
        const fullPath = path.join(this.rootDir, filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Check if integration code is present
          const hasIntegration = integration.checks.every(check => {
            if (check.type === 'import') {
              return content.includes(check.pattern);
            } else if (check.type === 'usage') {
              return content.includes(check.pattern);
            }
            return false;
          });

          if (hasIntegration) {
            this.results.integrationsVerified.push(`${filePath}: ${integration.name}`);
          } else {
            this.results.integrationsFailed.push({
              type: 'integration_missing',
              path: filePath,
              name: integration.name,
              reason: 'Integration code not found'
            });
          }
        } else {
          this.results.integrationsFailed.push({
            type: 'file_missing',
            path: filePath,
            name: integration.name,
            reason: 'Integration file not found'
          });
        }
      });

      console.log(chalk.green(`  ✅ Verified: ${this.results.integrationsVerified.length}/${plan.integrations.length}`));
      if (this.results.integrationsFailed.length > 0) {
        console.log(chalk.red(`  ❌ Failed: ${this.results.integrationsFailed.length}`));
      }
      console.log();
    }
  }

  async verifyVersionConsistency() {
    console.log(chalk.cyan('📦 Verifying version consistency...'));

    try {
      const result = execSync('node scripts/version-check.cjs --json', {
        cwd: this.rootDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      this.results.versionDetails = JSON.parse(result);
      this.results.versionConsistent = this.results.versionDetails.success;

      if (this.results.versionConsistent) {
        console.log(chalk.green(`  ✅ Version consistent: v${this.results.versionDetails.version}`));
      } else {
        console.log(chalk.red(`  ❌ Version inconsistencies detected: ${this.results.versionDetails.errorCount} errors`));
        this.results.versionDetails.errors.forEach(error => {
          console.log(chalk.red(`     - ${error}`));
        });
      }
    } catch (error) {
      console.log(chalk.yellow('  ⚠️  Version check failed to execute'));
      this.results.versionConsistent = false;
    }

    console.log();
  }

  async verifyBuild() {
    console.log(chalk.cyan('🔨 Verifying build...'));

    try {
      const result = execSync('npm run build', {
        cwd: this.rootDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      this.results.buildSucceeded = true;
      console.log(chalk.green('  ✅ Build succeeded'));
    } catch (error) {
      this.results.buildSucceeded = false;
      this.results.buildErrors.push(error.message);
      console.log(chalk.red('  ❌ Build failed'));

      // Try to extract specific errors
      if (error.stdout) {
        const lines = error.stdout.split('\n');
        const errorLines = lines.filter(line => line.includes('error TS'));
        if (errorLines.length > 0) {
          console.log(chalk.red(`     ${errorLines.length} TypeScript errors detected`));
        }
      }
    }

    console.log();
  }

  async verifyTests() {
    console.log(chalk.cyan('🧪 Verifying tests...'));

    try {
      const result = execSync('npm test -- --passWithNoTests', {
        cwd: this.rootDir,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout
      });

      this.results.testsExecuted = true;
      this.results.testsPassed = true;
      this.results.testResults = 'All tests passed';
      console.log(chalk.green('  ✅ Tests passed'));
    } catch (error) {
      this.results.testsExecuted = true;
      this.results.testsPassed = false;

      if (error.signal === 'SIGTERM') {
        this.results.testResults = 'Tests timed out after 60s';
        console.log(chalk.yellow('  ⏱️  Tests timed out (skipped)'));
      } else {
        this.results.testResults = error.message;
        console.log(chalk.red('  ❌ Tests failed'));
      }
    }

    console.log();
  }

  generateReport() {
    console.log(chalk.bold(chalk.blue('📊 Deployment Verification Report\n')));
    console.log(chalk.blue('='.repeat(55)));

    // File verification
    console.log(chalk.bold('\n📁 File Verification:'));
    console.log(`   Created: ${chalk.green(this.results.filesCreated.length)}`);
    console.log(`   Modified: ${chalk.green(this.results.filesModified.length)}`);
    console.log(`   Missing: ${this.results.filesMissing.length > 0 ? chalk.red(this.results.filesMissing.length) : chalk.green('0')}`);

    if (this.results.filesMissing.length > 0) {
      console.log(chalk.red('\n   Missing Files:'));
      this.results.filesMissing.forEach(file => {
        console.log(chalk.red(`     - ${file}`));
      });
    }

    // Compilation verification
    console.log(chalk.bold('\n🔨 Compilation Verification:'));
    console.log(`   Compiled: ${chalk.green(this.results.distFilesCompiled.length)}`);
    console.log(`   Missing: ${this.results.distFilesMissing.length > 0 ? chalk.red(this.results.distFilesMissing.length) : chalk.green('0')}`);

    if (this.results.distFilesMissing.length > 0) {
      console.log(chalk.red('\n   Missing Dist Files:'));
      this.results.distFilesMissing.forEach(file => {
        console.log(chalk.red(`     - ${file}`));
      });
    }

    // Integration verification
    console.log(chalk.bold('\n🔗 Integration Verification:'));
    console.log(`   Verified: ${chalk.green(this.results.integrationsVerified.length)}`);
    console.log(`   Failed: ${this.results.integrationsFailed.length > 0 ? chalk.red(this.results.integrationsFailed.length) : chalk.green('0')}`);

    if (this.results.integrationsFailed.length > 0) {
      console.log(chalk.red('\n   Failed Integrations:'));
      this.results.integrationsFailed.forEach(failure => {
        console.log(chalk.red(`     - ${failure.path}: ${failure.reason}`));
      });
    }

    // Version consistency
    console.log(chalk.bold('\n📦 Version Consistency:'));
    if (this.results.versionConsistent) {
      console.log(chalk.green(`   ✅ Consistent (v${this.results.versionDetails.version})`));
    } else {
      console.log(chalk.red('   ❌ Inconsistent'));
      if (this.results.versionDetails && this.results.versionDetails.errors) {
        console.log(chalk.red(`      ${this.results.versionDetails.errorCount} errors, ${this.results.versionDetails.warningCount} warnings`));
      }
    }

    // Build verification
    console.log(chalk.bold('\n🔨 Build Status:'));
    console.log(this.results.buildSucceeded ? chalk.green('   ✅ Build succeeded') : chalk.red('   ❌ Build failed'));

    // Test verification
    console.log(chalk.bold('\n🧪 Test Status:'));
    if (this.results.testsPassed) {
      console.log(chalk.green('   ✅ Tests passed'));
    } else if (this.results.testsExecuted) {
      console.log(chalk.red('   ❌ Tests failed'));
    } else {
      console.log(chalk.yellow('   ⏭️  Tests skipped'));
    }

    // Overall status
    const allPassed =
      this.results.filesMissing.length === 0 &&
      this.results.distFilesMissing.length === 0 &&
      this.results.integrationsFailed.length === 0 &&
      this.results.versionConsistent &&
      this.results.buildSucceeded &&
      this.results.testsPassed;

    console.log(chalk.bold('\n' + '='.repeat(55)));
    if (allPassed) {
      console.log(chalk.bold(chalk.green('\n✅ DEPLOYMENT FULLY VERIFIED\n')));
      console.log(chalk.green('All checks passed successfully!'));
    } else {
      console.log(chalk.bold(chalk.red('\n❌ DEPLOYMENT VERIFICATION FAILED\n')));
      console.log(chalk.red('Please address the issues above before deployment.'));
    }

    console.log();

    return {
      success: allPassed,
      results: this.results
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 VERSATIL Post-Deployment Verification

Usage: node scripts/verify-deployment.cjs [options]

Options:
  --plan <file>    Path to deployment plan JSON file
  --help, -h       Show this help

Examples:
  node scripts/verify-deployment.cjs
  node scripts/verify-deployment.cjs --plan deployment-plan.json
`);
    process.exit(0);
  }

  const verifier = new DeploymentVerifier();

  // Load deployment plan if provided
  let deploymentPlan = null;
  const planIndex = args.indexOf('--plan');
  if (planIndex !== -1 && args[planIndex + 1]) {
    const planPath = path.join(process.cwd(), args[planIndex + 1]);
    if (fs.existsSync(planPath)) {
      deploymentPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    } else {
      console.error(chalk.red(`Deployment plan not found: ${planPath}`));
      process.exit(1);
    }
  }

  verifier.verify(deploymentPlan).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red(`Verification failed: ${error.message}`));
    process.exit(1);
  });
}

module.exports = DeploymentVerifier;
