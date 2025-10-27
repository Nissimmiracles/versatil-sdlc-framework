#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Phase 2 Testing
 * Enhanced Maria Integration Tests
 *
 * End-to-end testing of full analysis workflow
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║       Enhanced Maria - Integration Test Suite               ║
║                    Phase 2 Testing                          ║
╚══════════════════════════════════════════════════════════════╝
`);

const fs = require('fs');

async function runTests() {
  const { createOrchestrator } = await import('../dist/intelligence/agent-orchestrator.js');

  const orchestrator = createOrchestrator();

  const testCases = [
    {
      name: 'End-to-end: Real sample.js analysis',
      input: {
        filePath: 'test/sample.js',
        content: fs.readFileSync('test/sample.js', 'utf8'),
        language: 'javascript',
        projectName: 'Integration Test',
        userRequest: 'Full QA analysis'
      },
      validate: (result) => {
        return result.agent === 'enhanced-maria' &&
               result.level1.score < 100 &&
               result.level1.patterns.length > 0 &&
               result.level2.prompt.length > 500;
      }
    },

    {
      name: 'Agent selection: Test file triggers Maria',
      input: {
        filePath: 'test/auth.spec.js',
        content: 'test("login", () => {});',
        language: 'javascript',
        projectName: 'Integration Test'
      },
      validate: (result) => result.agent.includes('maria')
    },

    {
      name: 'Orchestrator provides prompt and analysis',
      input: {
        filePath: 'src/api.js',
        content: 'debugger; console.log("test");',
        language: 'javascript',
        projectName: 'Integration Test'
      },
      validate: (result) => {
        return result.level1 && result.level2 &&
               result.level2.prompt && result.nextSteps.length > 0;
      }
    },

    {
      name: 'Recommendations include actionable steps',
      input: {
        filePath: 'test/broken.test.js',
        content: 'it("test", () => { doSomething(); });',
        language: 'javascript',
        projectName: 'Integration Test'
      },
      validate: (result) => {
        return result.level1.recommendations.length > 0 &&
               result.level1.recommendations.some(r => r.includes('assertion'));
      }
    },

    {
      name: 'Mode detection: patterns-only when no API',
      input: {
        filePath: 'src/utils.js',
        content: 'function add(a, b) { return a + b; }',
        language: 'javascript',
        projectName: 'Integration Test'
      },
      validate: (result) => {
        return result.mode === 'patterns-only' || result.mode === 'prompt-ready';
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  console.log(`Running ${testCases.length} integration tests...\n`);

  for (const testCase of testCases) {
    process.stdout.write(`${testCase.name}... `);

    try {
      const result = await orchestrator.analyzeFile(testCase.input);

      if (testCase.validate(result)) {
        console.log('✅ PASS');
        passed++;
      } else {
        console.log('❌ FAIL');
        console.log(`   Agent: ${result.agent}, Mode: ${result.mode}`);
        failed++;
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.log(`   ${error.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Integration Test Results:`);
  console.log(`  ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`  ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`  Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (passed === testCases.length) {
    console.log(`✅ ALL INTEGRATION TESTS PASSED!\n`);
    console.log(`🎉 Full workflow validated end-to-end\n`);
    process.exit(0);
  } else {
    console.log(`❌ SOME TESTS FAILED\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Integration test error:', err);
  process.exit(1);
});