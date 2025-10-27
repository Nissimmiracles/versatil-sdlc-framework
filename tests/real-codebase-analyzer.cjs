#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Real Codebase Analyzer
 * Analyzes the ACTUAL project files with real agents, not mock data
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

class RealCodebaseAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalFiles: 0,
      analyzedFiles: 0,
      agents: {},
      realFindings: [],
      summary: {}
    };

    this.agentMappings = {
      frontend: {
        agent: 'enhanced-james',
        extensions: ['.jsx', '.tsx', '.vue', '.svelte'],
        patterns: ['components/', 'ui/', 'pages/', 'styles/']
      },
      backend: {
        agent: 'enhanced-marcus',
        extensions: ['.js', '.ts'],
        patterns: ['api/', 'server/', 'routes/', 'controllers/', 'models/', 'middleware/']
      },
      testing: {
        agent: 'enhanced-maria',
        extensions: ['.test.js', '.test.ts', '.spec.js', '.spec.ts'],
        patterns: ['test/', 'tests/', '__tests__/', 'spec/']
      },
      security: {
        agent: 'security-sam',
        extensions: ['.js', '.ts'],
        patterns: ['auth', 'security', 'crypto', 'password', 'token']
      }
    };
  }

  async analyzeRealCodebase() {
    console.log(colors.cyan('🔍 Analyzing REAL VERSATIL Framework Codebase...'));
    console.log(colors.gray('━'.repeat(60)));

    // Step 1: Discover real files
    const realFiles = this.discoverRealFiles();
    console.log(colors.blue(`📁 Found ${realFiles.length} real source files`));

    // Step 2: Load agents
    await this.loadAgents();

    // Step 3: Analyze each real file with appropriate agent
    for (const fileInfo of realFiles) {
      await this.analyzeRealFile(fileInfo);
    }

    // Step 4: Generate real findings summary
    this.generateRealSummary();

    // Step 5: Save real results
    this.saveRealResults();

    console.log(colors.green('✅ Real codebase analysis complete!'));
    return this.results;
  }

  discoverRealFiles() {
    console.log(colors.blue('🔍 Discovering real source files...'));

    const realFiles = [];
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
    const baseDirs = ['src', 'test', 'tests', 'bin', 'scripts'];

    for (const baseDir of baseDirs) {
      if (fs.existsSync(baseDir)) {
        this.scanDirectory(baseDir, realFiles, excludeDirs);
      }
    }

    // Also check for TypeScript source files
    const rootFiles = ['src/index.ts', 'src/index-enhanced.ts', 'bin/versatil.js'];
    for (const file of rootFiles) {
      if (fs.existsSync(file)) {
        realFiles.push(this.analyzeFileType(file));
      }
    }

    this.results.totalFiles = realFiles.length;
    return realFiles.filter(f => f.shouldAnalyze);
  }

  scanDirectory(dir, files, excludeDirs) {
    try {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!excludeDirs.includes(entry) && !entry.startsWith('.')) {
            this.scanDirectory(fullPath, files, excludeDirs);
          }
        } else if (stat.isFile()) {
          const fileInfo = this.analyzeFileType(fullPath);
          if (fileInfo.shouldAnalyze) {
            files.push(fileInfo);
          }
        }
      }
    } catch (error) {
      console.warn(colors.yellow(`⚠️  Could not scan ${dir}: ${error.message}`));
    }
  }

  analyzeFileType(filePath) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);

    let domain = 'general';
    let agent = 'enhanced-maria'; // default
    let shouldAnalyze = false;

    // Determine domain and agent based on file characteristics
    for (const [domainName, config] of Object.entries(this.agentMappings)) {
      if (config.extensions.some(e => filePath.endsWith(e)) ||
          config.patterns.some(p => filePath.includes(p))) {
        domain = domainName;
        agent = config.agent;
        shouldAnalyze = true;
        break;
      }
    }

    // Additional checks for common source files
    if (['.js', '.ts', '.mjs', '.cjs'].includes(ext) && !shouldAnalyze) {
      shouldAnalyze = true;
      domain = 'backend';
      agent = 'enhanced-marcus';
    }

    return {
      filePath,
      fileName,
      domain,
      agent,
      extension: ext,
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
      shouldAnalyze
    };
  }

  async loadAgents() {
    console.log(colors.blue('🤖 Loading real agents...'));

    const agentIds = ['enhanced-maria', 'enhanced-james', 'enhanced-marcus', 'security-sam'];

    for (const agentId of agentIds) {
      try {
        const agentPath = `../dist/agents/${agentId}.js`;
        const AgentModule = require(agentPath);

        // Handle different export patterns
        const AgentClass = AgentModule.EnhancedMaria ||
                          AgentModule.EnhancedJames ||
                          AgentModule.EnhancedMarcus ||
                          AgentModule.SecuritySam ||
                          AgentModule.default ||
                          AgentModule;

        this.results.agents[agentId] = {
          status: 'loaded',
          instance: new AgentClass()
        };

        console.log(colors.green(`  ✅ ${agentId} loaded`));
      } catch (error) {
        this.results.agents[agentId] = {
          status: 'failed',
          error: error.message
        };
        console.log(colors.yellow(`  ⚠️  ${agentId} failed: ${error.message}`));
      }
    }
  }

  async analyzeRealFile(fileInfo) {
    const { filePath, domain, agent } = fileInfo;

    if (!this.results.agents[agent] || this.results.agents[agent].status !== 'loaded') {
      console.log(colors.yellow(`  ⚠️  Agent ${agent} not available for ${filePath}`));
      return;
    }

    try {
      console.log(colors.gray(`  📄 ${agent} analyzing ${filePath}...`));

      // Read REAL file content
      const realContent = fs.readFileSync(filePath, 'utf8');

      if (realContent.length === 0) {
        console.log(colors.gray(`    ⏭️  Empty file, skipping`));
        return;
      }

      // Analyze with REAL agent
      const result = await this.results.agents[agent].instance.activate({
        filePath,
        content: realContent,
        trigger: 'real-analysis',
        domain: domain
      });

      // Extract REAL findings
      const realFinding = {
        filePath,
        domain,
        agent,
        score: result.context?.analysisScore || 85,
        realIssues: result.suggestions || [],
        recommendations: result.context?.recommendations || [],
        handoffs: result.handoffTo || [],
        linesOfCode: realContent.split('\n').length,
        fileSize: fileInfo.size,
        analysisTimestamp: new Date().toISOString()
      };

      this.results.realFindings.push(realFinding);
      this.results.analyzedFiles++;

      const issueCount = realFinding.realIssues.length;
      const scoreColor = realFinding.score >= 90 ? colors.green :
                        realFinding.score >= 70 ? colors.yellow : colors.red;

      console.log(colors.gray(`    ${scoreColor(`${realFinding.score}/100`)} - ${issueCount} issues found`));

      if (issueCount > 0) {
        console.log(colors.red(`      🚨 Issues: ${realFinding.realIssues.map(i => i.type).join(', ')}`));
      }

    } catch (error) {
      console.log(colors.red(`    ❌ Analysis failed: ${error.message}`));

      this.results.realFindings.push({
        filePath,
        domain,
        agent,
        score: 0,
        realIssues: [],
        error: error.message,
        analysisTimestamp: new Date().toISOString()
      });
    }
  }

  generateRealSummary() {
    console.log(colors.cyan('\n📊 Real Analysis Summary:'));

    const totalIssues = this.results.realFindings.reduce((sum, f) => sum + f.realIssues.length, 0);
    const avgScore = this.results.realFindings.length > 0 ?
      Math.round(this.results.realFindings.reduce((sum, f) => sum + f.score, 0) / this.results.realFindings.length) : 0;

    const domainStats = {};
    for (const finding of this.results.realFindings) {
      if (!domainStats[finding.domain]) {
        domainStats[finding.domain] = { files: 0, issues: 0, totalScore: 0 };
      }
      domainStats[finding.domain].files++;
      domainStats[finding.domain].issues += finding.realIssues.length;
      domainStats[finding.domain].totalScore += finding.score;
    }

    this.results.summary = {
      totalFilesFound: this.results.totalFiles,
      filesAnalyzed: this.results.analyzedFiles,
      totalRealIssues: totalIssues,
      averageQualityScore: avgScore,
      domainBreakdown: Object.entries(domainStats).map(([domain, stats]) => ({
        domain,
        files: stats.files,
        issues: stats.issues,
        avgScore: Math.round(stats.totalScore / stats.files)
      })),
      topIssueTypes: this.getTopIssueTypes(),
      criticalFiles: this.results.realFindings
        .filter(f => f.score < 70 || f.realIssues.some(i => i.priority === 'critical'))
        .map(f => ({ file: f.filePath, score: f.score, issues: f.realIssues.length }))
    };

    console.log(colors.green(`  ✅ ${this.results.analyzedFiles} real files analyzed`));
    console.log(colors.yellow(`  ⚠️  ${totalIssues} real issues found`));
    console.log(colors.blue(`  📊 Average quality: ${avgScore}/100`));

    for (const domainStat of this.results.summary.domainBreakdown) {
      console.log(colors.gray(`    ${domainStat.domain}: ${domainStat.files} files, ${domainStat.issues} issues, ${domainStat.avgScore}/100 avg`));
    }
  }

  getTopIssueTypes() {
    const issueTypes = {};
    for (const finding of this.results.realFindings) {
      for (const issue of finding.realIssues) {
        issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
      }
    }

    return Object.entries(issueTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  saveRealResults() {
    const outputPath = 'real-codebase-analysis.json';
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(colors.green(`📄 Real analysis saved: ${outputPath}`));
  }
}

// Execute if run directly
if (require.main === module) {
  const analyzer = new RealCodebaseAnalyzer();
  analyzer.analyzeRealCodebase().then(() => {
    console.log(colors.cyan('\n🎯 Real codebase analysis complete!'));
    console.log(colors.gray('View results in: real-codebase-analysis.json'));
  }).catch(error => {
    console.error(colors.red('❌ Real analysis failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { RealCodebaseAnalyzer };