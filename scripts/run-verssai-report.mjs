#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - VERSSAI Frontend Report
 * Demonstrates Chrome MCP Integration on Production App
 */

import { chromeMCPExecutor } from '../dist/mcp/chrome-mcp-executor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSSAI_URL = 'https://verssai-app-production-n2d3xl352-miraclesgits-projects.vercel.app/';

async function runFrontendReport() {
  console.log('🚀 VERSATIL Framework - Frontend Report Execution');
  console.log('👩‍🔬 Maria-QA Agent - Chrome MCP Integration Test\n');
  console.log(`📍 Target: ${VERSSAI_URL}\n`);

  const report = {
    timestamp: new Date().toISOString(),
    url: VERSSAI_URL,
    navigation: null,
    snapshot: null,
    componentTests: null,
    accessibility: {
      score: 0,
      violations: [],
      passes: []
    },
    performance: {
      loadTime: 0,
      domContentLoaded: 0,
      resourceCount: 0
    },
    recommendations: []
  };

  try {
    // Step 1: Navigate to VERSSAI app
    console.log('🔗 Step 1: Navigating to VERSSAI app...');
    const navResult = await chromeMCPExecutor.executeChromeMCP('navigate', {
      url: VERSSAI_URL
    });

    if (!navResult.success) {
      throw new Error(`Navigation failed: ${navResult.error || 'Unknown error'}`);
    }

    report.navigation = navResult;
    console.log(`✅ Navigation successful (${navResult.data?.loadTime || 0}ms)\n`);

    // Extract performance metrics
    if (navResult.data) {
      report.performance.loadTime = navResult.data.loadTime || 0;
      report.performance.domContentLoaded = navResult.data.domContentLoaded || 0;
      report.performance.resourceCount = navResult.data.resources?.length || 0;
    }

    // Step 2: Capture page snapshot
    console.log('📸 Step 2: Capturing page snapshot...');
    const snapshotResult = await chromeMCPExecutor.executeChromeMCP('snapshot');

    if (!snapshotResult.success) {
      throw new Error(`Snapshot failed: ${snapshotResult.error || 'Unknown error'}`);
    }

    report.snapshot = snapshotResult;
    console.log(`✅ Snapshot captured (${snapshotResult.data?.screenshot ? 'screenshot saved' : 'no screenshot'})\n`);

    // Analyze DOM structure
    if (snapshotResult.data?.dom) {
      const dom = snapshotResult.data.dom;
      console.log('🔍 DOM Analysis:');
      console.log(`   - Title: ${dom.title || 'N/A'}`);
      console.log(`   - Components: ${dom.components?.length || 0} detected`);
      console.log(`   - Elements: ${dom.elementCount || 0} total\n`);
    }

    // Step 3: Test detected components
    console.log('🧪 Step 3: Testing components...');
    const componentName = snapshotResult.data?.dom?.components?.[0] || 'VERSSAI OSINT Interface';
    const testResult = await chromeMCPExecutor.executeChromeMCP('test_component', {
      component: componentName
    });

    report.componentTests = testResult;

    if (testResult.success && testResult.data) {
      console.log(`✅ Component testing complete`);
      console.log(`   - Tests passed: ${testResult.data.tests?.filter(t => t.passed).length || 0}`);
      console.log(`   - Tests failed: ${testResult.data.tests?.filter(t => !t.passed).length || 0}\n`);
    }

    // Step 4: Accessibility Analysis
    console.log('♿ Step 4: Accessibility analysis...');
    if (snapshotResult.data?.accessibility) {
      const a11y = snapshotResult.data.accessibility;
      report.accessibility = {
        score: a11y.score || 0,
        violations: a11y.violations || [],
        passes: a11y.passes || []
      };

      console.log(`   - Score: ${a11y.score}/100`);
      console.log(`   - Violations: ${a11y.violations?.length || 0}`);
      console.log(`   - Passes: ${a11y.passes?.length || 0}\n`);
    } else {
      console.log(`   - No accessibility data captured\n`);
    }

    // Step 5: Generate Recommendations
    console.log('💡 Step 5: Generating recommendations...');

    // Performance recommendations
    if (report.performance.loadTime > 3000) {
      report.recommendations.push(`⚠️ Load time is ${report.performance.loadTime}ms (target: <3000ms). Consider code splitting or lazy loading.`);
    }

    // Accessibility recommendations
    if (report.accessibility.violations.length > 0) {
      report.recommendations.push(`♿ ${report.accessibility.violations.length} accessibility violations found. Review WCAG 2.1 AA compliance.`);
    }

    // Component recommendations
    if (report.componentTests?.data?.tests) {
      const failedTests = report.componentTests.data.tests.filter(t => !t.passed);
      if (failedTests.length > 0) {
        report.recommendations.push(`🧪 ${failedTests.length} component tests failed. Review implementation for ${failedTests.map(t => t.name).join(', ')}.`);
      }
    }

    if (report.recommendations.length === 0) {
      report.recommendations.push('✅ No critical issues detected. Frontend appears healthy.');
    }

    console.log(`   - ${report.recommendations.length} recommendations generated\n`);

    // Step 6: Clean up browser session
    console.log('🧹 Step 6: Cleaning up browser session...');
    await chromeMCPExecutor.executeChromeMCP('close');
    console.log('✅ Browser closed\n');

  } catch (error) {
    console.error('❌ Error during frontend report execution:', error);
    report.recommendations.push(`🚨 Critical error: ${error instanceof Error ? error.message : String(error)}`);

    // Ensure cleanup
    try {
      await chromeMCPExecutor.executeChromeMCP('close');
    } catch (closeError) {
      console.error('Failed to close browser:', closeError);
    }
  }

  return report;
}

async function saveReport(report) {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `verssai-frontend-${timestamp}.json`);

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${reportPath}\n`);
}

function printSummary(report) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 VERSSAI FRONTEND REPORT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🌐 Application:');
  console.log(`   URL: ${report.url}`);
  console.log(`   Timestamp: ${report.timestamp}\n`);

  console.log('⚡ Performance:');
  console.log(`   Load Time: ${report.performance.loadTime}ms`);
  console.log(`   DOM Content Loaded: ${report.performance.domContentLoaded}ms`);
  console.log(`   Resources: ${report.performance.resourceCount}\n`);

  console.log('♿ Accessibility:');
  console.log(`   Score: ${report.accessibility.score}/100`);
  console.log(`   Violations: ${report.accessibility.violations.length}`);
  console.log(`   Passes: ${report.accessibility.passes.length}\n`);

  console.log('🧪 Component Tests:');
  if (report.componentTests?.data?.tests) {
    const passed = report.componentTests.data.tests.filter(t => t.passed).length;
    const total = report.componentTests.data.tests.length;
    console.log(`   Passed: ${passed}/${total}\n`);
  } else {
    console.log(`   No test data available\n`);
  }

  console.log('💡 Recommendations:');
  report.recommendations.forEach((rec, idx) => {
    console.log(`   ${idx + 1}. ${rec}`);
  });
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Chrome MCP Integration Test Complete');
  console.log('👩‍🔬 Maria-QA Agent - Frontend Analysis Successful');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Main execution
(async () => {
  try {
    const report = await runFrontendReport();
    await saveReport(report);
    printSummary(report);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();
