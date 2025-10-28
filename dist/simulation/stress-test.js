#!/usr/bin/env node
/**
 * SimulationQA Stress Test CLI
 *
 * Direct command-line interface to run SimulationQA validation
 * against the VERSATIL SDLC Framework and expose architectural theater.
 */
import { SimulationQA } from '../agents/opera/maria-qa/simulation-qa.js';
async function runStressTest() {
    console.log('🔥 Starting SimulationQA Stress Test...\n');
    try {
        const simulationQA = new SimulationQA();
        const context = {
            trigger: 'cli-stress-test',
            userRequest: 'Validate all framework promises vs reality',
            contextClarity: 'clear',
            testing: true,
            urgency: 'high'
        };
        const response = await simulationQA.activate(context);
        console.log('📊 SimulationQA Results:');
        console.log('========================\n');
        console.log(response.message);
        console.log('\n🔧 Recommendations:');
        response.suggestions.forEach((suggestion, index) => {
            console.log(`${index + 1}. [${suggestion.priority.toUpperCase()}] ${suggestion.message}`);
        });
        if (response.context && response.context['capabilityMatrix']) {
            const matrix = response.context['capabilityMatrix'];
            console.log('\n📈 Capability Matrix Summary:');
            console.log(`Overall Score: ${matrix.overallScore}/100`);
            console.log(`GitHub Ready: ${matrix.readyForGitHub ? '✅ YES' : '❌ NO'}`);
            console.log('\nCategory Scores:');
            Object.entries(matrix.categories).forEach(([category, score]) => {
                const emoji = score.status === 'working' ? '✅' : score.status === 'vapor' ? '🌫️' : '⚠️';
                console.log(`${emoji} ${category}: ${score.percentage}% (${score.status})`);
            });
            if (matrix.blockers && matrix.blockers.length > 0) {
                console.log('\n🚨 Critical Blockers:');
                matrix.blockers.forEach((blocker) => console.log(`  - ${blocker}`));
            }
        }
        if (response.handoffTo && response.handoffTo.length > 0) {
            console.log(`\n🤖 Recommended Next Agents: ${response.handoffTo.join(', ')}`);
        }
        // Exit with error code if critical issues found
        const hasCriticalIssues = response.suggestions.some(s => s.priority === 'critical');
        process.exit(hasCriticalIssues ? 1 : 0);
    }
    catch (error) {
        console.error('❌ SimulationQA Stress Test Failed:');
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runStressTest().catch(console.error);
}
export { runStressTest };
//# sourceMappingURL=stress-test.js.map