#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Pre-commit Security Check
 *
 * This script runs VERSATIL security agents on staged files to detect
 * security issues before they are committed to the repository.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import VERSATIL agents if available
let securitySam, enhancedMarcus;
try {
  securitySam = require('../src/agents/security-sam.js');
  enhancedMarcus = require('../src/agents/enhanced-marcus.js');
} catch (error) {
  console.log('⚠️  VERSATIL agents not available in pre-commit context');
}

class PreCommitSecurityChecker {
  constructor() {
    this.criticalIssues = [];
    this.warnings = [];
    this.checkedFiles = [];
  }

  /**
   * Get list of staged files
   */
  getStagedFiles() {
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
        encoding: 'utf8'
      }).trim();

      if (!output) {
        return [];
      }

      return output.split('\n')
        .filter(file => file.trim())
        .filter(file => fs.existsSync(file))
        .filter(file => this.isRelevantFile(file));
    } catch (error) {
      console.error('Error getting staged files:', error.message);
      return [];
    }
  }

  /**
   * Check if file is relevant for security scanning
   */
  isRelevantFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.yaml', '.yml'];

    // Include environment files
    if (filePath.includes('.env')) {
      return true;
    }

    // Include configuration files
    if (['package.json', 'tsconfig.json', 'webpack.config.js'].includes(path.basename(filePath))) {
      return true;
    }

    return relevantExtensions.includes(ext);
  }

  /**
   * Check for hardcoded credentials
   */
  checkHardcodedCredentials(filePath, content) {
    const credentialPatterns = [
      {
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
        type: 'password',
        severity: 'critical'
      },
      {
        pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        type: 'api_key',
        severity: 'critical'
      },
      {
        pattern: /(?:secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
        type: 'secret',
        severity: 'critical'
      },
      {
        pattern: /sk-[a-zA-Z0-9]{32,}/g,
        type: 'openai_key',
        severity: 'critical'
      },
      {
        pattern: /AKIA[0-9A-Z]{16}/g,
        type: 'aws_access_key',
        severity: 'critical'
      },
      {
        pattern: /ghp_[0-9a-zA-Z]{36}/g,
        type: 'github_token',
        severity: 'critical'
      }
    ];

    const issues = [];
    const lines = content.split('\n');

    credentialPatterns.forEach(({ pattern, type, severity }) => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern);
        if (matches) {
          // Skip if it's a placeholder
          if (line.includes('CHANGE_ME') || line.includes('your-') ||
              line.includes('test-fake-key') || line.includes('example')) {
            return;
          }

          issues.push({
            file: filePath,
            line: index + 1,
            type,
            severity,
            message: `Potential ${type} detected`,
            content: line.trim()
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check for debug code in production
   */
  checkDebugCode(filePath, content) {
    // Skip test files
    if (filePath.includes('test') || filePath.includes('spec') ||
        filePath.includes('__tests__') || filePath.includes('cypress')) {
      return [];
    }

    // Skip logger files
    if (filePath.includes('logger') || filePath.includes('log')) {
      return [];
    }

    const debugPatterns = [
      {
        pattern: /console\.(log|debug|info|warn|error)\s*\(/g,
        type: 'console_statement',
        severity: 'medium'
      },
      {
        pattern: /debugger;/g,
        type: 'debugger_statement',
        severity: 'high'
      },
      {
        pattern: /alert\s*\(/g,
        type: 'alert_statement',
        severity: 'medium'
      }
    ];

    const issues = [];
    const lines = content.split('\n');

    debugPatterns.forEach(({ pattern, type, severity }) => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern);
        if (matches && !line.includes('//') && !line.includes('*')) {
          issues.push({
            file: filePath,
            line: index + 1,
            type,
            severity,
            message: `Debug code detected: ${type}`,
            content: line.trim()
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check environment files for security issues
   */
  checkEnvironmentFile(filePath, content) {
    const issues = [];

    // Check if .env.example contains real credentials
    if (filePath.includes('.env.example')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, value] = line.split('=');

          // Check for suspicious values that look like real credentials
          if (value && value.length > 8 &&
              !value.includes('CHANGE_ME') &&
              !value.includes('your-') &&
              !value.includes('example') &&
              !value.includes('localhost') &&
              !value.includes('false') &&
              !value.includes('true') &&
              !value.match(/^\d+$/)) {

            if (key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('key') ||
                key.toLowerCase().includes('token')) {

              issues.push({
                file: filePath,
                line: index + 1,
                type: 'real_credential_in_example',
                severity: 'critical',
                message: `Potential real credential in .env.example: ${key}`,
                content: line.trim()
              });
            }
          }
        }
      });
    }

    return issues;
  }

  /**
   * Analyze a single file
   */
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const issues = [];

      // Run security checks
      issues.push(...this.checkHardcodedCredentials(filePath, content));
      issues.push(...this.checkDebugCode(filePath, content));

      if (filePath.includes('.env')) {
        issues.push(...this.checkEnvironmentFile(filePath, content));
      }

      // Categorize issues
      issues.forEach(issue => {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          this.criticalIssues.push(issue);
        } else {
          this.warnings.push(issue);
        }
      });

      this.checkedFiles.push(filePath);
      return issues;
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Generate security report
   */
  generateReport() {
    console.log('\n🔍 VERSATIL Pre-commit Security Check Results\n');
    console.log(`📁 Files checked: ${this.checkedFiles.length}`);

    if (this.criticalIssues.length === 0 && this.warnings.length === 0) {
      console.log('✅ No security issues detected!\n');
      return true;
    }

    if (this.criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues Found: ${this.criticalIssues.length}`);
      console.log('=' .repeat(60));

      this.criticalIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.message}`);
        console.log(`   File: ${issue.file}:${issue.line}`);
        console.log(`   Type: ${issue.type}`);
        console.log(`   Content: ${issue.content}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${this.warnings.length}`);
      console.log('-'.repeat(60));

      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.message}`);
        console.log(`   File: ${warning.file}:${warning.line}`);
      });
    }

    console.log('\n📋 Security Recommendations:');
    console.log('- Remove hardcoded credentials and use environment variables');
    console.log('- Remove debug code from production files');
    console.log('- Use VERSATIL logging system instead of console statements');
    console.log('- Ensure .env.example files only contain placeholder values');

    return this.criticalIssues.length === 0;
  }

  /**
   * Run security check on all staged files
   */
  run() {
    console.log('🔒 Running VERSATIL pre-commit security check...');

    const stagedFiles = this.getStagedFiles();

    if (stagedFiles.length === 0) {
      console.log('📁 No relevant files staged for commit.');
      return true;
    }

    console.log(`📁 Checking ${stagedFiles.length} staged files...`);

    // Analyze each file
    stagedFiles.forEach(file => {
      this.analyzeFile(file);
    });

    // Generate and display report
    const passed = this.generateReport();

    if (!passed) {
      console.log('\n❌ Pre-commit security check FAILED!');
      console.log('💡 Fix the critical issues above before committing.');
      process.exit(1);
    }

    console.log('✅ Pre-commit security check PASSED!');
    return true;
  }
}

// Run the security check
if (require.main === module) {
  const checker = new PreCommitSecurityChecker();
  checker.run();
}

module.exports = PreCommitSecurityChecker;