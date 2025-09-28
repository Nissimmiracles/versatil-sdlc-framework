#!/usr/bin/env node
/**
 * Analyze a file using VERSATIL Intelligence System
 */

const fs = require('fs');
const path = require('path');

async function analyzeFile() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log('Usage: npm run analyze -- <file-path>');
    console.log('Example: npm run analyze -- ./test/sample.js');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              VERSATIL File Analysis                         ║
╚══════════════════════════════════════════════════════════════╝

Analyzing: ${filePath}
File size: ${content.length} bytes
Lines: ${content.split('\n').length}

Running intelligence system...
`);

  // Dynamic import for ESM modules
  const { createOrchestrator } = await import('../dist/intelligence/agent-orchestrator.js');

  const orchestrator = createOrchestrator();

  const result = await orchestrator.analyzeFile({
    filePath,
    content,
    language: detectLanguage(filePath),
    projectName: 'VERSATIL Test',
    userRequest: 'Analyze this file'
  });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Agent Selected: ${result.agent}

📊 Level 1 - Pattern Analysis Results:
   Quality Score: ${result.level1.score}/100
   Issues Found: ${result.level1.patterns.length}
   Summary: ${result.level1.summary}
`);

  if (result.level1.patterns.length > 0) {
    console.log(`\n🔍 Detected Issues:\n`);
    result.level1.patterns.forEach((pattern, idx) => {
      const icon = pattern.severity === 'critical' ? '🚨' :
                   pattern.severity === 'high' ? '⚠️ ' :
                   pattern.severity === 'medium' ? '⚡' : 'ℹ️ ';
      console.log(`   ${icon} [${pattern.severity.toUpperCase()}] Line ${pattern.line}`);
      console.log(`      ${pattern.message}`);
      console.log(`      💡 ${pattern.suggestion}\n`);
    });
  }

  if (result.level1.recommendations.length > 0) {
    console.log(`\n🎯 Recommendations:\n`);
    result.level1.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
  }

  console.log(`\n💡 Level 2 - Generated Prompt:`);
  console.log(`   Title: ${result.level2.title}`);
  console.log(`   Model: ${result.level2.model}`);
  console.log(`   Priority: ${result.level2.priority}`);
  console.log(`   Estimated Time: ${result.level2.estimatedTime}`);

  if (result.level2.handoffSuggestions.length > 0) {
    console.log(`\n🤝 Suggested Agent Handoffs:`);
    result.level2.handoffSuggestions.forEach(handoff => {
      console.log(`   → ${handoff}`);
    });
  }

  console.log(`\n📋 Analysis Mode: ${result.mode}`);

  console.log(`\n🎯 Next Steps:\n`);
  result.nextSteps.forEach(step => {
    console.log(`   ${step}`);
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`✅ Analysis Complete!\n`);

  const statusEmoji = result.level1.score >= 80 ? '🟢' :
                      result.level1.score >= 60 ? '🟡' : '🔴';
  console.log(`${statusEmoji} Overall Quality: ${result.level1.score}/100\n`);
}

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const langMap = {
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.vue': 'vue',
    '.svelte': 'svelte'
  };
  return langMap[ext] || 'plaintext';
}

analyzeFile().catch(err => {
  console.error('Error during analysis:', err.message);
  process.exit(1);
});