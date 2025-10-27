#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Critical Issues Dashboard
 * Shows ONLY the most severe issues that need immediate attention
 */

const fs = require('fs');

// Chalk compatibility handling
const chalkModule = require('chalk');
const chalk = chalkModule.default || chalkModule;

const colors = {
  blue: (text) => chalk.blue(text),
  green: (text) => chalk.green(text),
  red: (text) => chalk.red(text),
  yellow: (text) => chalk.yellow(text),
  cyan: (text) => chalk.cyan(text),
  gray: (text) => chalk.gray(text),
  magenta: (text) => chalk.magenta(text)
};

class CriticalIssuesDashboard {
  constructor() {
    this.criticalTypes = [
      'sql-injection',
      'hardcoded-credentials',
      'debugger-statement',
      'missing-rate-limit',
      'eval-usage',
      'path-traversal'
    ];

    this.severityMapping = {
      'sql-injection': { severity: 'CRITICAL', color: colors.red, icon: '🚨' },
      'hardcoded-credentials': { severity: 'CRITICAL', color: colors.red, icon: '🔑' },
      'debugger-statement': { severity: 'HIGH', color: colors.yellow, icon: '🐛' },
      'missing-rate-limit': { severity: 'HIGH', color: colors.yellow, icon: '⏱️' },
      'eval-usage': { severity: 'CRITICAL', color: colors.red, icon: '⚠️' },
      'path-traversal': { severity: 'CRITICAL', color: colors.red, icon: '📁' }
    };
  }

  loadRealResults() {
    try {
      const results = JSON.parse(fs.readFileSync('real-codebase-analysis.json', 'utf8'));
      console.log(colors.green('✅ Loaded real codebase analysis'));
      return results;
    } catch (error) {
      console.warn(colors.yellow('⚠️  No real analysis found. Run: npm run analyze:real'));
      return null;
    }
  }

  extractCriticalIssues(results) {
    const criticalIssues = [];

    for (const finding of results.realFindings) {
      for (const issue of finding.realIssues) {
        if (this.criticalTypes.includes(issue.type) || issue.priority === 'critical') {
          criticalIssues.push({
            ...issue,
            filePath: finding.filePath,
            agent: finding.agent,
            fileScore: finding.score
          });
        }
      }
    }

    return criticalIssues.sort((a, b) => {
      // Sort by severity (critical first)
      const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2 };
      return severityOrder[a.priority] - severityOrder[b.priority];
    });
  }

  displayCriticalIssues(criticalIssues) {
    console.log(colors.red('\n🚨 CRITICAL SECURITY & QUALITY ISSUES'));
    console.log(colors.gray('=' * 60));

    if (criticalIssues.length === 0) {
      console.log(colors.green('✅ No critical issues found!'));
      return;
    }

    const criticalCount = criticalIssues.filter(i => i.priority === 'critical').length;
    const highCount = criticalIssues.filter(i => i.priority === 'high').length;

    console.log(colors.red(`🚨 ${criticalCount} CRITICAL issues require IMMEDIATE action`));
    console.log(colors.yellow(`⚠️  ${highCount} HIGH priority issues need attention`));
    console.log('');

    // Group by severity
    const bySeverity = this.groupBy(criticalIssues, 'priority');

    for (const [priority, issues] of Object.entries(bySeverity)) {
      const priorityColor = priority === 'critical' ? colors.red : colors.yellow;
      console.log(priorityColor(`\n${priority.toUpperCase()} PRIORITY (${issues.length} issues):`));
      console.log(priorityColor('─'.repeat(40)));

      for (const issue of issues) {
        const mapping = this.severityMapping[issue.type];
        const icon = mapping?.icon || '❗';
        const typeColor = mapping?.color || colors.white;

        console.log(`\n${icon} ${typeColor(issue.type.toUpperCase())}`);
        console.log(`   📄 File: ${colors.cyan(issue.filePath)}`);
        console.log(`   📍 Location: ${colors.gray(issue.location)}`);
        console.log(`   🔍 Issue: ${issue.description}`);
        console.log(`   🛠️  Action: ${colors.green(issue.action)}`);
        console.log(`   🏥 Agent: ${issue.agent}`);
      }
    }
  }

  displayTopVulnerableFiles(results) {
    console.log(colors.red('\n📊 MOST VULNERABLE FILES'));
    console.log(colors.gray('=' * 40));

    const vulnerableFiles = results.realFindings
      .filter(f => f.score < 70 || f.realIssues.some(i => i.priority === 'critical'))
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);

    for (const file of vulnerableFiles) {
      const scoreColor = file.score < 50 ? colors.red :
                        file.score < 70 ? colors.yellow : colors.green;

      const criticalIssues = file.realIssues.filter(i => i.priority === 'critical').length;

      console.log(`\n${scoreColor(file.score + '/100')} ${colors.cyan(file.filePath)}`);
      if (criticalIssues > 0) {
        console.log(`   🚨 ${criticalIssues} critical issue${criticalIssues > 1 ? 's' : ''}`);
      }
      console.log(`   📊 Total issues: ${file.realIssues.length}`);
      console.log(`   🤖 Analyzed by: ${file.agent}`);
    }
  }

  generateActionPlan(criticalIssues) {
    console.log(colors.cyan('\n🎯 IMMEDIATE ACTION PLAN'));
    console.log(colors.gray('=' * 30));

    const actionsByType = this.groupBy(criticalIssues, 'type');
    let priority = 1;

    for (const [issueType, issues] of Object.entries(actionsByType)) {
      if (issues.some(i => i.priority === 'critical')) {
        console.log(`\n${priority}. ${colors.red('CRITICAL:')} Fix ${issueType} (${issues.length} occurrences)`);

        // Show specific files
        const files = [...new Set(issues.map(i => i.filePath))];
        if (files.length <= 3) {
          files.forEach(file => {
            console.log(`   📄 ${colors.cyan(file)}`);
          });
        } else {
          console.log(`   📄 ${colors.cyan(files[0])} and ${files.length - 1} other files`);
        }

        console.log(`   🛠️  ${colors.green(issues[0].action)}`);
        priority++;
      }
    }

    if (priority === 1) {
      console.log(colors.green('✅ No critical issues require immediate action'));
    }
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  run() {
    console.log(colors.cyan('🔍 VERSATIL Critical Issues Analysis'));
    console.log(colors.gray('Scanning for severe security and quality issues...\n'));

    const results = this.loadRealResults();
    if (!results) return;

    const criticalIssues = this.extractCriticalIssues(results);

    this.displayCriticalIssues(criticalIssues);
    this.displayTopVulnerableFiles(results);
    this.generateActionPlan(criticalIssues);

    console.log(colors.cyan('\n🎭 Analysis complete. Address critical issues first!'));
  }
}

// Execute if run directly
if (require.main === module) {
  const dashboard = new CriticalIssuesDashboard();
  dashboard.run();
}

module.exports = { CriticalIssuesDashboard };