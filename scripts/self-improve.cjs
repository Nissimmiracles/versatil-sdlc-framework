#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Self-Improvement Script
 *
 * Applies Enhanced OPERA methodology to our own codebase
 * Demonstrates "eating our own dog food" by using Enhanced Maria
 * to validate and improve the VERSATIL framework itself
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VERSATILSelfImprovement {
  constructor() {
    this.rootDir = process.cwd();
    this.issues = [];
    this.improvements = [];
  }

  async runSelfAnalysis() {
    console.log('🔍 VERSATIL Self-Improvement Analysis');
    console.log('=====================================');
    console.log('Applying Enhanced OPERA methodology to our own codebase...\n');

    // Run Enhanced Maria analysis on our own code
    await this.runEnhancedMariaAnalysis();

    // Run Enhanced James analysis on our frontend code
    await this.runEnhancedJamesAnalysis();

    // Run Enhanced Marcus analysis on our backend code
    await this.runEnhancedMarcusAnalysis();

    // Generate improvement report
    this.generateImprovementReport();
  }

  async runEnhancedMariaAnalysis() {
    console.log('🔍 Enhanced Maria - Configuration & Quality Analysis');
    console.log('---------------------------------------------------');

    // Check for debugging code in our own codebase
    this.checkDebuggingCode();

    // Check configuration consistency
    this.checkConfigurationConsistency();

    // Check cross-file dependencies
    this.checkCrossFileDependencies();

    // Check test coverage
    this.checkTestCoverage();
  }

  async runEnhancedJamesAnalysis() {
    console.log('\n🎨 Enhanced James - Frontend Analysis');
    console.log('------------------------------------');

    // Check for frontend consistency (our CLI tools)
    this.checkCLIConsistency();

    // Check for accessibility in our documentation
    this.checkDocumentationAccessibility();
  }

  async runEnhancedMarcusAnalysis() {
    console.log('\n🛠️ Enhanced Marcus - Backend Analysis');
    console.log('-------------------------------------');

    // Check API consistency (our MCP integration)
    this.checkMCPConsistency();

    // Check service interfaces
    this.checkServiceInterfaces();

    // Check configuration management
    this.checkConfigurationManagement();
  }

  checkDebuggingCode() {
    console.log('   Checking for debugging code...');

    const srcFiles = this.getAllSourceFiles();
    let debuggingCodeFound = false;

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for console.log (except in specific allowed files)
      if (content.includes('console.log') && !file.includes('scripts/') && !file.includes('test')) {
        this.issues.push({
          type: 'debugging-code',
          severity: 'medium',
          file: file,
          message: 'Console.log detected in production code',
          fix: 'Replace with proper logging mechanism'
        });
        debuggingCodeFound = true;
      }

      // Check for TODO comments with urgent markers
      if (/TODO.*urgent|FIXME.*urgent|XXX.*urgent/i.test(content)) {
        this.issues.push({
          type: 'urgent-todo',
          severity: 'high',
          file: file,
          message: 'Urgent TODO/FIXME found',
          fix: 'Address urgent technical debt'
        });
      }
    });

    if (!debuggingCodeFound) {
      console.log('   ✅ No debugging code found in production files');
    } else {
      console.log(`   ⚠️  Found debugging code in ${this.issues.filter(i => i.type === 'debugging-code').length} files`);
    }
  }

  checkConfigurationConsistency() {
    console.log('   Checking configuration consistency...');

    // Check package.json vs actual dependencies
    const packageJson = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));
    const srcFiles = this.getAllSourceFiles();

    let configInconsistencies = 0;

    // Check for hardcoded versions vs package.json
    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Look for version references
      const versionMatches = content.match(/['"`](\d+\.\d+\.\d+)['"`]/g);
      if (versionMatches) {
        versionMatches.forEach(match => {
          const version = match.replace(/['"`]/g, '');
          if (version !== packageJson.version && !version.startsWith('0.') && !version.startsWith('1.0.')) {
            this.issues.push({
              type: 'version-inconsistency',
              severity: 'low',
              file: file,
              message: `Hardcoded version ${version} may be inconsistent`,
              fix: 'Use package.json version or environment variable'
            });
            configInconsistencies++;
          }
        });
      }
    });

    if (configInconsistencies === 0) {
      console.log('   ✅ Configuration consistency looks good');
    } else {
      console.log(`   ⚠️  Found ${configInconsistencies} potential configuration inconsistencies`);
    }
  }

  checkCrossFileDependencies() {
    console.log('   Checking cross-file dependencies...');

    const srcFiles = this.getAllSourceFiles();
    let dependencyIssues = 0;

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for unused imports
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
      const importedItems = [];

      importLines.forEach(line => {
        const match = line.match(/import\s+\{([^}]+)\}/);
        if (match) {
          const items = match[1].split(',').map(item => item.trim());
          importedItems.push(...items);
        }
      });

      // Check if imported items are used
      importedItems.forEach(item => {
        if (!content.includes(item) || content.indexOf(item) === content.lastIndexOf(item)) {
          this.issues.push({
            type: 'unused-import',
            severity: 'low',
            file: file,
            message: `Potentially unused import: ${item}`,
            fix: 'Remove unused import'
          });
          dependencyIssues++;
        }
      });
    });

    if (dependencyIssues === 0) {
      console.log('   ✅ Cross-file dependencies look clean');
    } else {
      console.log(`   ⚠️  Found ${dependencyIssues} potential dependency issues`);
    }
  }

  checkTestCoverage() {
    console.log('   Checking test coverage...');

    const srcFiles = this.getAllSourceFiles().filter(f => !f.includes('test') && !f.includes('spec'));
    const testFiles = this.getAllSourceFiles().filter(f => f.includes('test') || f.includes('spec'));

    const coverageRatio = testFiles.length / srcFiles.length;

    if (coverageRatio < 0.3) {
      this.issues.push({
        type: 'low-test-coverage',
        severity: 'high',
        file: 'test coverage',
        message: `Test coverage appears low: ${Math.round(coverageRatio * 100)}%`,
        fix: 'Add more comprehensive tests'
      });
      console.log(`   ❌ Low test coverage: ${Math.round(coverageRatio * 100)}%`);
    } else {
      console.log(`   ✅ Test coverage looks reasonable: ${Math.round(coverageRatio * 100)}%`);
    }
  }

  checkCLIConsistency() {
    console.log('   Checking CLI tool consistency...');

    // Check that all CLI commands are documented
    const cliFiles = ['bin/versatil.js', 'bin/versatil-mcp.js'].filter(f => fs.existsSync(f));
    const readmeContent = fs.readFileSync('README.md', 'utf8');

    let cliInconsistencies = 0;

    cliFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Look for command definitions
      const commands = content.match(/\.command\s*\(\s*['"`]([^'"`]+)['"`]/g);
      if (commands) {
        commands.forEach(cmd => {
          const commandName = cmd.match(/['"`]([^'"`]+)['"`]/)[1];
          if (!readmeContent.includes(commandName)) {
            this.issues.push({
              type: 'undocumented-command',
              severity: 'medium',
              file: file,
              message: `Command ${commandName} not documented in README`,
              fix: 'Add command documentation to README.md'
            });
            cliInconsistencies++;
          }
        });
      }
    });

    if (cliInconsistencies === 0) {
      console.log('   ✅ CLI consistency looks good');
    } else {
      console.log(`   ⚠️  Found ${cliInconsistencies} CLI documentation issues`);
    }
  }

  checkDocumentationAccessibility() {
    console.log('   Checking documentation accessibility...');

    const mdFiles = this.getAllMarkdownFiles();
    let accessibilityIssues = 0;

    mdFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for images without alt text
      const imageMatches = content.match(/!\[([^\]]*)\]\([^)]+\)/g);
      if (imageMatches) {
        imageMatches.forEach(match => {
          const altText = match.match(/!\[([^\]]*)\]/)[1];
          if (!altText.trim()) {
            this.issues.push({
              type: 'missing-alt-text',
              severity: 'low',
              file: file,
              message: 'Image missing alt text',
              fix: 'Add descriptive alt text for accessibility'
            });
            accessibilityIssues++;
          }
        });
      }
    });

    if (accessibilityIssues === 0) {
      console.log('   ✅ Documentation accessibility looks good');
    } else {
      console.log(`   ⚠️  Found ${accessibilityIssues} accessibility issues`);
    }
  }

  checkMCPConsistency() {
    console.log('   Checking MCP integration consistency...');

    const mcpFiles = this.getAllSourceFiles().filter(f => f.includes('mcp'));
    let mcpInconsistencies = 0;

    mcpFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for proper error handling in MCP calls
      if (content.includes('mcp') && !content.includes('try') && !content.includes('catch')) {
        this.issues.push({
          type: 'missing-mcp-error-handling',
          severity: 'medium',
          file: file,
          message: 'MCP integration missing error handling',
          fix: 'Add proper try-catch blocks for MCP operations'
        });
        mcpInconsistencies++;
      }
    });

    if (mcpInconsistencies === 0) {
      console.log('   ✅ MCP integration consistency looks good');
    } else {
      console.log(`   ⚠️  Found ${mcpInconsistencies} MCP consistency issues`);
    }
  }

  checkServiceInterfaces() {
    console.log('   Checking service interface consistency...');

    const serviceFiles = this.getAllSourceFiles().filter(f => f.includes('service') || f.includes('Service'));
    let interfaceIssues = 0;

    serviceFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');

      // Check for consistent interface patterns
      if (content.includes('class') && content.includes('Service') && !content.includes('interface')) {
        this.issues.push({
          type: 'missing-service-interface',
          severity: 'low',
          file: file,
          message: 'Service class missing TypeScript interface',
          fix: 'Add TypeScript interface for service contract'
        });
        interfaceIssues++;
      }
    });

    if (interfaceIssues === 0) {
      console.log('   ✅ Service interfaces look consistent');
    } else {
      console.log(`   ⚠️  Found ${interfaceIssues} interface issues`);
    }
  }

  checkConfigurationManagement() {
    console.log('   Checking configuration management...');

    // Check if we have proper environment variable handling
    const configFiles = ['.env.example', 'package.json', 'tsconfig.json'];
    let configIssues = 0;

    configFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.issues.push({
          type: 'missing-config-file',
          severity: 'medium',
          file: file,
          message: `Missing configuration file: ${file}`,
          fix: `Create ${file} with proper configuration`
        });
        configIssues++;
      }
    });

    if (configIssues === 0) {
      console.log('   ✅ Configuration management looks good');
    } else {
      console.log(`   ⚠️  Found ${configIssues} configuration issues`);
    }
  }

  generateImprovementReport() {
    console.log('\n📊 VERSATIL Self-Improvement Report');
    console.log('=====================================');

    const totalIssues = this.issues.length;
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;

    console.log(`Total Issues Found: ${totalIssues}`);
    console.log(`  🚨 Critical: ${criticalIssues}`);
    console.log(`  ⚠️  High: ${highIssues}`);
    console.log(`  ⚡ Medium: ${mediumIssues}`);
    console.log(`  💡 Low: ${lowIssues}`);

    if (totalIssues === 0) {
      console.log('\n🎉 Excellent! No issues found. VERSATIL is following its own best practices!');
    } else {
      console.log('\n📋 Issues to Address:');
      console.log('---------------------');

      // Group issues by type
      const issuesByType = this.issues.reduce((groups, issue) => {
        groups[issue.type] = groups[issue.type] || [];
        groups[issue.type].push(issue);
        return groups;
      }, {});

      Object.entries(issuesByType).forEach(([type, issues]) => {
        console.log(`\n${type.replace(/-/g, ' ').toUpperCase()}:`);
        issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue.message}`);
          console.log(`     File: ${issue.file}`);
          console.log(`     Fix: ${issue.fix}`);
          console.log(`     Severity: ${issue.severity}`);
        });
      });

      console.log('\n💡 Recommendations:');
      console.log('-------------------');

      if (criticalIssues > 0) {
        console.log('🚨 Address critical issues immediately');
      }
      if (highIssues > 0) {
        console.log('⚠️  Schedule high-priority issues for next sprint');
      }
      if (mediumIssues > 0) {
        console.log('⚡ Include medium-priority issues in backlog');
      }
      if (lowIssues > 0) {
        console.log('💡 Address low-priority issues during refactoring');
      }

      console.log('\n🔄 Next Steps:');
      console.log('1. Fix critical and high-priority issues first');
      console.log('2. Run Enhanced OPERA agents on codebase changes');
      console.log('3. Implement automated quality gates');
      console.log('4. Schedule regular self-improvement analysis');
    }

    // Calculate quality score
    const qualityScore = Math.max(0, 100 - (criticalIssues * 25) - (highIssues * 10) - (mediumIssues * 5) - (lowIssues * 1));
    console.log(`\n📊 VERSATIL Quality Score: ${qualityScore}%`);

    if (qualityScore >= 90) {
      console.log('🟢 Excellent quality!');
    } else if (qualityScore >= 80) {
      console.log('🟡 Good quality, room for improvement');
    } else if (qualityScore >= 70) {
      console.log('🟠 Needs improvement');
    } else {
      console.log('🔴 Requires immediate attention');
    }

    // Save report
    this.saveReport({
      timestamp: new Date().toISOString(),
      totalIssues,
      issuesBySeverity: { critical: criticalIssues, high: highIssues, medium: mediumIssues, low: lowIssues },
      qualityScore,
      issues: this.issues
    });
  }

  getAllSourceFiles() {
    const extensions = ['.ts', '.js'];
    const excludeDirs = ['node_modules', 'dist', '.git', '.versatil'];

    return this.getFilesRecursively(this.rootDir, extensions, excludeDirs);
  }

  getAllMarkdownFiles() {
    const extensions = ['.md'];
    const excludeDirs = ['node_modules', 'dist', '.git'];

    return this.getFilesRecursively(this.rootDir, extensions, excludeDirs);
  }

  getFilesRecursively(dir, extensions, excludeDirs) {
    let files = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !excludeDirs.includes(item)) {
          files = files.concat(this.getFilesRecursively(fullPath, extensions, excludeDirs));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return files;
  }

  saveReport(report) {
    const reportDir = path.join(this.rootDir, '.versatil', 'self-improvement');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📄 Report saved to: ${reportFile}`);
  }
}

// Run self-improvement analysis
if (require.main === module) {
  const analyzer = new VERSATILSelfImprovement();
  analyzer.runSelfAnalysis().catch(console.error);
}

module.exports = VERSATILSelfImprovement;