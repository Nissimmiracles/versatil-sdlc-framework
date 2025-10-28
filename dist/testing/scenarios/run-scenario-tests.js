/**
 * VERSATIL Framework - Scenario Test Execution Script
 * Run comprehensive multi-agent scenario tests and generate enhancement report
 */
import { scenarioRunner } from './multi-agent-scenario-runner.js';
import * as fs from 'fs';
import * as path from 'path';
async function main() {
    console.log('🚀 Starting VERSATIL Multi-Agent Scenario Testing...\n');
    try {
        // Run all scenarios
        const results = await scenarioRunner.runAllScenarios();
        console.log('\n\n📊 Generating Comprehensive Analysis Report...\n');
        // Generate report
        const report = scenarioRunner.generateComprehensiveReport(results);
        // Print report to console
        console.log(report);
        // Save report to file
        const reportsDir = path.join(process.cwd(), 'docs', 'scenario-reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportsDir, `next-gen-enhancements-${timestamp}.md`);
        fs.writeFileSync(reportPath, report, 'utf8');
        console.log(`\n✅ Report saved to: ${reportPath}\n`);
        // Exit with appropriate code
        const failedCount = Array.from(results.values()).filter(r => r.status === 'failed').length;
        process.exit(failedCount > 0 ? 1 : 0);
    }
    catch (error) {
        console.error('\n❌ Scenario testing failed:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=run-scenario-tests.js.map