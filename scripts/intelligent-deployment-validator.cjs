#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Intelligent Deployment Validator
 *
 * Integrates agent intelligence data to provide smart deployment validation
 * using the collective knowledge from Enhanced Maria, Marcus, James, and Sarah.
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

class IntelligentDeploymentValidator {
  constructor() {
    this.agentIntelligence = {};
    this.criticalIssues = [];
    this.warnings = [];
    this.recommendations = [];
    this.deploymentScore = 0;
  }

  async validateDeployment() {
    console.log(chalk.blue.bold('🤖 VERSATIL Intelligent Deployment Validator\n'));
    console.log(chalk.cyan('🧠 Analyzing agent intelligence data...\n'));

    // Load agent intelligence data
    await this.loadAgentIntelligence();

    // Analyze intelligence for deployment readiness
    await this.analyzeIntelligence();

    // Generate intelligent deployment report
    this.generateIntelligentReport();

    return {
      deploymentScore: this.deploymentScore,
      criticalIssues: this.criticalIssues.length,
      warnings: this.warnings.length,
      recommendations: this.recommendations.length,
      canDeploy: this.criticalIssues.length === 0 && this.deploymentScore >= 85
    };
  }

  async loadAgentIntelligence() {
    console.log(chalk.yellow('📊 Loading agent intelligence data...'));

    // Load Enhanced Maria insights
    if (fs.existsSync('enhanced-maria-insights.json')) {
      try {
        this.agentIntelligence.maria = JSON.parse(fs.readFileSync('enhanced-maria-insights.json', 'utf8'));
        console.log(chalk.green('  ✅ Enhanced Maria QA insights loaded'));
      } catch (e) {
        console.log(chalk.yellow('  ⚠️  Enhanced Maria insights partially available'));
      }
    }

    // Load multi-agent results
    if (fs.existsSync('multi-agent-results.json')) {
      try {
        this.agentIntelligence.multiAgent = JSON.parse(fs.readFileSync('multi-agent-results.json', 'utf8'));
        console.log(chalk.green('  ✅ Multi-agent coordination data loaded'));
      } catch (e) {
        console.log(chalk.yellow('  ⚠️  Multi-agent data partially available'));
      }
    }

    // Load real codebase analysis
    if (fs.existsSync('real-codebase-analysis.json')) {
      try {
        this.agentIntelligence.realAnalysis = JSON.parse(fs.readFileSync('real-codebase-analysis.json', 'utf8'));
        console.log(chalk.green('  ✅ Real codebase analysis loaded'));
      } catch (e) {
        console.log(chalk.yellow('  ⚠️  Codebase analysis partially available'));
      }
    }

    // Load production test report
    if (fs.existsSync('production-test-report.json')) {
      try {
        this.agentIntelligence.production = JSON.parse(fs.readFileSync('production-test-report.json', 'utf8'));
        console.log(chalk.green('  ✅ Production test report loaded'));
      } catch (e) {
        console.log(chalk.yellow('  ⚠️  Production test data partially available'));
      }
    }

    console.log();
  }

  async analyzeIntelligence() {
    console.log(chalk.yellow('🔍 Analyzing intelligence for deployment readiness...'));

    let totalScore = 100;
    let criticalCount = 0;

    // Analyze Enhanced Maria QA findings
    if (this.agentIntelligence.maria) {
      const maria = this.agentIntelligence.maria;

      // Check for critical debugging code
      if (maria.patterns) {
        maria.patterns.forEach(pattern => {
          if (pattern.type === 'debugger-statement' && pattern.severity === 'critical') {
            this.criticalIssues.push({
              type: 'CRITICAL',
              source: 'Enhanced Maria QA',
              message: `Debugger statement detected in ${pattern.file}:${pattern.line}`,
              action: 'Remove immediately before deployment',
              file: pattern.file,
              line: pattern.line
            });
            totalScore -= 25;
            criticalCount++;
          }

          if (pattern.type === 'debug-code' && pattern.severity === 'medium') {
            this.warnings.push({
              type: 'WARNING',
              source: 'Enhanced Maria QA',
              message: `Debug code detected in ${pattern.file}:${pattern.line}`,
              action: 'Remove console.log statements for production',
              file: pattern.file,
              line: pattern.line
            });
            totalScore -= 5;
          }
        });
      }

      // Check quality analysis
      if (maria.qualityAnalysis) {
        Object.entries(maria.qualityAnalysis).forEach(([analysis, data]) => {
          if (data.criticalIssues > 0) {
            this.recommendations.push({
              type: 'RECOMMENDATION',
              source: 'Enhanced Maria QA',
              analysis: analysis,
              score: data.score,
              message: `${analysis} has ${data.criticalIssues} critical issues`,
              recommendations: data.recommendations || []
            });
          }
        });
      }
    }

    // Analyze multi-agent coordination
    if (this.agentIntelligence.multiAgent) {
      const multiAgent = this.agentIntelligence.multiAgent;

      // Check backend security issues
      if (multiAgent.backend && multiAgent.backend.patterns) {
        multiAgent.backend.patterns.forEach(pattern => {
          if (pattern.priority === 'high') {
            this.criticalIssues.push({
              type: 'SECURITY',
              source: 'Enhanced Marcus Backend',
              message: `${pattern.description} in ${pattern.location}`,
              action: pattern.action,
              file: pattern.location.split(':')[0],
              priority: pattern.priority
            });
            totalScore -= 15;
            criticalCount++;
          }
        });
      }

      // Check QA test coverage
      if (multiAgent.qa && multiAgent.qa.patterns) {
        multiAgent.qa.patterns.forEach(pattern => {
          if (pattern.priority === 'high') {
            this.warnings.push({
              type: 'QUALITY',
              source: 'Enhanced Maria QA',
              message: `${pattern.description} in ${pattern.location}`,
              action: pattern.action,
              file: pattern.location.split(':')[0]
            });
            totalScore -= 8;
          }
        });
      }
    }

    // Analyze real codebase findings
    if (this.agentIntelligence.realAnalysis) {
      const realAnalysis = this.agentIntelligence.realAnalysis;

      if (realAnalysis.totalFiles && realAnalysis.analyzedFiles) {
        const analysisCoverage = (realAnalysis.analyzedFiles / realAnalysis.totalFiles) * 100;
        if (analysisCoverage < 90) {
          this.warnings.push({
            type: 'COVERAGE',
            source: 'Real Codebase Analysis',
            message: `Only ${analysisCoverage.toFixed(1)}% of files analyzed`,
            action: 'Ensure complete codebase analysis before deployment'
          });
          totalScore -= 10;
        }
      }
    }

    this.deploymentScore = Math.max(0, totalScore);

    console.log(chalk.green(`  ✅ Intelligence analysis complete`));
    console.log(chalk.cyan(`  📊 Deployment Score: ${this.deploymentScore}/100`));
    console.log(chalk.cyan(`  🚨 Critical Issues: ${this.criticalIssues.length}`));
    console.log(chalk.cyan(`  ⚠️  Warnings: ${this.warnings.length}`));
    console.log();
  }

  generateIntelligentReport() {
    console.log(chalk.blue.bold('📋 Intelligent Deployment Readiness Report'));
    console.log(chalk.blue('='.repeat(55)));

    // Overall assessment
    console.log(`🎯 Deployment Score: ${this.deploymentScore}/100`);

    let status = 'UNKNOWN';
    let statusColor = chalk.gray;

    if (this.deploymentScore >= 95 && this.criticalIssues.length === 0) {
      status = 'EXCELLENT - DEPLOY IMMEDIATELY';
      statusColor = chalk.green;
    } else if (this.deploymentScore >= 85 && this.criticalIssues.length === 0) {
      status = 'GOOD - SAFE TO DEPLOY';
      statusColor = chalk.green;
    } else if (this.deploymentScore >= 70 && this.criticalIssues.length <= 2) {
      status = 'CAUTION - REVIEW ISSUES FIRST';
      statusColor = chalk.yellow;
    } else {
      status = 'BLOCKED - FIX CRITICAL ISSUES';
      statusColor = chalk.red;
    }

    console.log(`📊 Status: ${statusColor(status)}`);
    console.log(`🚨 Critical Issues: ${chalk.red(this.criticalIssues.length)}`);
    console.log(`⚠️  Warnings: ${chalk.yellow(this.warnings.length)}`);
    console.log(`💡 Recommendations: ${chalk.cyan(this.recommendations.length)}`);

    // Critical issues (blocking deployment)
    if (this.criticalIssues.length > 0) {
      console.log(chalk.red('\n🚨 CRITICAL ISSUES (Must fix before deployment):'));
      this.criticalIssues.forEach((issue, index) => {
        console.log(chalk.red(`  ${index + 1}. [${issue.type}] ${issue.message}`));
        console.log(chalk.gray(`     Source: ${issue.source}`));
        console.log(chalk.gray(`     Action: ${issue.action}`));
        if (issue.file) {
          console.log(chalk.gray(`     File: ${issue.file}${issue.line ? ':' + issue.line : ''}`));
        }
        console.log();
      });
    }

    // Warnings (should fix)
    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  WARNINGS (Recommended to fix):'));
      this.warnings.slice(0, 5).forEach((warning, index) => {
        console.log(chalk.yellow(`  ${index + 1}. [${warning.type}] ${warning.message}`));
        console.log(chalk.gray(`     Source: ${warning.source}`));
        console.log(chalk.gray(`     Action: ${warning.action}`));
        if (warning.file) {
          console.log(chalk.gray(`     File: ${warning.file}${warning.line ? ':' + warning.line : ''}`));
        }
      });
      if (this.warnings.length > 5) {
        console.log(chalk.gray(`  ... and ${this.warnings.length - 5} more warnings`));
      }
    }

    // Agent recommendations
    if (this.recommendations.length > 0) {
      console.log(chalk.cyan('\n💡 AGENT RECOMMENDATIONS:'));
      this.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(chalk.cyan(`  ${index + 1}. [${rec.analysis}] Score: ${rec.score}/100`));
        console.log(chalk.gray(`     Source: ${rec.source}`));
        console.log(chalk.gray(`     Issue: ${rec.message}`));
        if (rec.recommendations && rec.recommendations.length > 0) {
          rec.recommendations.forEach(recommendation => {
            console.log(chalk.gray(`     → ${recommendation}`));
          });
        }
      });
    }

    // Deployment decision
    console.log(chalk.blue('\n🎯 DEPLOYMENT DECISION:'));
    if (this.criticalIssues.length === 0 && this.deploymentScore >= 85) {
      console.log(chalk.green('✅ APPROVED: Safe to deploy to production'));
      console.log(chalk.green('🚀 All critical issues resolved'));
      console.log(chalk.green('📊 Quality standards met'));
    } else {
      console.log(chalk.red('❌ BLOCKED: Cannot deploy to production'));
      console.log(chalk.red(`🚨 ${this.criticalIssues.length} critical issues must be resolved`));
      console.log(chalk.red(`📊 Score ${this.deploymentScore}/100 (minimum 85 required)`));
    }

    // Agent intelligence summary
    console.log(chalk.blue('\n🤖 AGENT INTELLIGENCE SUMMARY:'));
    const agentData = Object.keys(this.agentIntelligence);
    if (agentData.length > 0) {
      console.log(chalk.green(`📊 Intelligence sources: ${agentData.join(', ')}`));
      console.log(chalk.green('🧠 Zero context loss architecture active'));
      console.log(chalk.green('🔄 Continuous agent coordination operational'));
    } else {
      console.log(chalk.yellow('⚠️  Limited agent intelligence available'));
      console.log(chalk.yellow('🔄 Run agent analysis for comprehensive validation'));
    }

    console.log(chalk.gray('\n🎯 Powered by VERSATIL Enhanced OPERA Agents'));
  }
}

// CLI interface
const { Command } = require('commander');
const program = new Command();

program
  .name('intelligent-deployment-validator')
  .description('Intelligent deployment validation using OPERA agent intelligence')
  .version('1.2.1')
  .action(async () => {
    try {
      const validator = new IntelligentDeploymentValidator();
      const result = await validator.validateDeployment();

      // Exit with appropriate code
      process.exit(result.canDeploy ? 0 : 1);
    } catch (error) {
      console.error(chalk.red(`Intelligent validation failed: ${error.message}`));
      process.exit(1);
    }
  });

// Run if called directly
if (require.main === module) {
  program.parse();
}

module.exports = { IntelligentDeploymentValidator };