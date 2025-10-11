#!/usr/bin/env ts-node
/**
 * Test script for Repository Organization System
 * Tests RepositoryAnalyzer and StructureOptimizer
 */

import { RepositoryAnalyzer } from '../dist/agents/opera/sarah-pm/repository-analyzer.js';
import { StructureOptimizer } from '../dist/agents/opera/sarah-pm/structure-optimizer.js';

async function testRepositoryAnalysis() {
  console.log('🧪 Testing Repository Organization System\n');

  const projectPath = process.cwd();

  // Initialize analyzer
  console.log('📊 Initializing Repository Analyzer...');
  const analyzer = new RepositoryAnalyzer({
    ignorePaths: ['node_modules', 'dist', 'build', '.git', 'coverage'],
    standardDirectories: ['src', 'docs', 'tests', '.github'],
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    checkGitignore: true
  });

  // Listen to events
  analyzer.on('analysis:started', ({ projectPath }) => {
    console.log(`   → Analyzing: ${projectPath}`);
  });

  analyzer.on('analysis:completed', (result) => {
    const grade = result.health.score >= 90 ? 'A' : result.health.score >= 80 ? 'B' :
                 result.health.score >= 70 ? 'C' : result.health.score >= 60 ? 'D' : 'F';
    console.log(`   ✅ Analysis complete: Health ${result.health.score}/100 (${grade})`);
  });

  // Run analysis
  console.log('\n📈 Running repository analysis...\n');
  const analysis = await analyzer.analyze(projectPath);

  // Display results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ANALYSIS RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const grade = analysis.health.score >= 90 ? 'A' : analysis.health.score >= 80 ? 'B' :
               analysis.health.score >= 70 ? 'C' : analysis.health.score >= 60 ? 'D' : 'F';

  console.log(`🎯 Health Score: ${analysis.health.score}/100 (Grade: ${grade})`);
  console.log(`📁 Total Files: ${analysis.statistics.totalFiles}`);
  console.log(`📂 Total Directories: ${analysis.statistics.totalDirectories}`);
  console.log(`⚠️  Total Issues: ${analysis.issues.length}\n`);

  // Issues by severity
  console.log('📋 Issues by Severity:');
  console.log(`   🔴 P0 (Critical): ${analysis.health.issuesBySeverity.P0}`);
  console.log(`   🟡 P1 (High): ${analysis.health.issuesBySeverity.P1}`);
  console.log(`   🟢 P2 (Medium): ${analysis.health.issuesBySeverity.P2}`);
  console.log(`   ⚪ P3 (Low): ${analysis.health.issuesBySeverity.P3}\n`);

  // Issues by category
  console.log('🏷️  Issues by Category:');
  console.log(`   📐 Structure: ${analysis.health.categories.structure}`);
  console.log(`   🗂️  Organization: ${analysis.health.categories.organization}`);
  console.log(`   🧹 Cleanup: ${analysis.health.categories.cleanup}`);
  console.log(`   ❓ Missing: ${analysis.health.categories.missing}`);
  console.log(`   🔒 Security: ${analysis.health.categories.security}\n`);

  // File type distribution (top 10)
  console.log('📄 File Type Distribution (Top 10):');
  const sortedExtensions = Object.entries(analysis.statistics.filesByExtension)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  for (const [ext, count] of sortedExtensions) {
    const extDisplay = ext || '(no extension)';
    console.log(`   ${extDisplay}: ${count} files`);
  }
  console.log();

  // Documentation coverage
  console.log(`📖 Documentation Coverage: ${analysis.statistics.documentationCoverage.toFixed(1)}%`);

  // Test coverage
  if (analysis.statistics.testCoverage.hasTests) {
    const testRatio = analysis.statistics.testCoverage.testFiles / analysis.statistics.testCoverage.sourceFiles;
    console.log(`🧪 Test Coverage: ${analysis.statistics.testCoverage.testFiles} test files, ${analysis.statistics.testCoverage.sourceFiles} source files (ratio: ${testRatio.toFixed(2)})`);
  } else {
    console.log('🧪 Test Coverage: No tests detected');
  }
  console.log();

  // Show critical issues
  const criticalIssues = analysis.issues.filter(i => i.severity === 'P0');
  if (criticalIssues.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 CRITICAL ISSUES (P0)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    criticalIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.title}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Recommendation: ${issue.recommendation}`);
      console.log(`   Auto-fixable: ${issue.autoFixable ? '✅ Yes' : '❌ No'}`);
      if (issue.files && issue.files.length > 0) {
        console.log(`   Files affected: ${issue.files.length}`);
      }
      console.log();
    });
  }

  // Show recommendations
  if (analysis.recommendations.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    analysis.recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });
    console.log();
  }

  // Test StructureOptimizer if there are issues
  if (analysis.issues.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 GENERATING MIGRATION PLAN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const optimizer = new StructureOptimizer({
      requireApproval: true,
      createBackup: true,
      generateScripts: true,
      dryRun: true
    });

    const plan = await optimizer.generatePlan(analysis);
    const preview = optimizer.formatPlanPreview(plan);
    console.log(preview);
  } else {
    console.log('\n✅ Repository is healthy - no migration plan needed!');
  }

  console.log('\n✅ Test completed successfully!\n');
}

// Run test
testRepositoryAnalysis().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
