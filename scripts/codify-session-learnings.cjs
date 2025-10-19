#!/usr/bin/env node
/**
 * VERSATIL Session Learning Codification Script
 *
 * Called by stop.sh hook to codify session learnings to RAG.
 * Runs the complete learning workflow: Analyze → Extract → Codify → Report
 *
 * Usage: node codify-session-learnings.cjs <session-date>
 */

const path = require('path');
const fs = require('fs/promises');
const os = require('os');

async function codifySessionLearnings() {
  const sessionDate = process.argv[2] || new Date().toISOString().split('T')[0];

  console.log(`[Codify] Starting learning codification for session ${sessionDate}`);

  try {
    // Import modules (ESM in CJS wrapper)
    const { createSessionAnalyzer } = await import('../dist/workflows/session-analyzer.js');
    const { createLearningExtractor } = await import('../dist/workflows/learning-extractor.js');
    const { createLearningCodifier } = await import('../dist/workflows/learning-codifier.js');
    const { createSessionReportGenerator } = await import('../dist/workflows/session-report-generator.js');

    // Load session summary
    const sessionPath = path.join(os.homedir(), '.versatil', 'sessions', `session-${sessionDate}.json`);
    const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));

    console.log(`[Codify] Loaded session data: ${sessionData.agentActivations} activations`);

    // Step 1: Analyze session
    const analyzer = createSessionAnalyzer();
    const analysis = await analyzer.analyzeSession(sessionData);
    console.log(`[Codify] Analysis complete: ${analysis.codeChanges.length} code changes`);

    // Step 2: Extract learnings
    const extractor = createLearningExtractor();
    const learnings = await extractor.extractLearnings(analysis);
    console.log(`[Codify] Extracted: ${learnings.codePatterns.length} patterns, ${learnings.lessons.length} lessons`);

    // Step 3: Codify to RAG
    const codifier = createLearningCodifier();
    const codificationResult = await codifier.codifyLearnings(learnings);
    console.log(`[Codify] Codified: ${codificationResult.ragEntriesCreated} RAG entries`);

    // Step 4: Generate report
    const reportGen = createSessionReportGenerator();
    const report = await reportGen.generateReport(analysis, learnings, codificationResult);
    console.log(`[Codify] Report generated: ${report.sessionId}`);

    // Display brief summary
    console.log(report.brief);

    // Save summary for quick access
    const summaryPath = path.join(os.homedir(), '.versatil', 'sessions', sessionDate, 'summary.json');
    await fs.mkdir(path.dirname(summaryPath), { recursive: true });
    await fs.writeFile(summaryPath, JSON.stringify(report.summary, null, 2));

    console.log(`[Codify] ✅ Learning codification complete`);
    console.log(`[Codify] Full report: ~/.versatil/sessions/${sessionDate}/report.md`);

    process.exit(0);
  } catch (error) {
    console.error(`[Codify] ❌ Learning codification failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  codifySessionLearnings().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { codifySessionLearnings };
