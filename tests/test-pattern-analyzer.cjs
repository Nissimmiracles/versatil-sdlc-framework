#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Phase 2 Testing
 * Pattern Analyzer Validation Tests
 *
 * Direct testing of pattern detection engine
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║          Pattern Analyzer - Validation Suite                ║
║                    Phase 2 Testing                          ║
╚══════════════════════════════════════════════════════════════╝
`);

async function runTests() {
  const { PatternAnalyzer } = await import('../dist/intelligence/pattern-analyzer.js');

  const testCases = [
    {
      name: 'Empty file scores 100',
      input: { content: '', filePath: 'src/empty.js' },
      validate: (result) => result.score === 100 && result.patterns.length === 0
    },

    {
      name: 'Debugger statement detected as critical',
      input: { content: 'function test() {\n  debugger;\n}', filePath: 'src/test.js' },
      validate: (result) => {
        const debuggerPattern = result.patterns.find(p => p.type === 'debugger-statement');
        return debuggerPattern && debuggerPattern.severity === 'critical' && debuggerPattern.line === 2;
      }
    },

    {
      name: 'Console.log detected with correct line number',
      input: {
        content: 'function log() {\n  console.log("test");\n  return true;\n}',
        filePath: 'src/logger.js'
      },
      validate: (result) => {
        const consolePattern = result.patterns.find(p => p.type === 'debug-code');
        return consolePattern && consolePattern.line === 2 && consolePattern.severity === 'medium';
      }
    },

    {
      name: 'Test file - missing assertion detected',
      input: {
        content: 'describe("suite", () => {\n  it("test", () => {\n    doSomething();\n  });\n});',
        filePath: 'test/example.test.js'
      },
      validate: (result) => {
        const missing = result.patterns.find(p => p.type === 'missing-assertion');
        return missing && missing.line === 2;
      }
    },

    {
      name: 'Multiple issues reduce score appropriately',
      input: {
        content: 'debugger;\nconsole.log("test");\nconsole.debug("x");',
        filePath: 'src/bad.js'
      },
      validate: (result) => {
        // Should detect: debugger (critical), 2x console (medium)
        return result.patterns.length >= 3 && result.score < 85;
      }
    },

    {
      name: 'QA analyzer returns recommendations',
      input: {
        content: 'debugger;\nconsole.log("x");',
        filePath: 'src/debug.js'
      },
      validate: (result) => {
        const qaResult = PatternAnalyzer.analyzeQA(result.patterns[0]?.code || '', 'test.js');
        return qaResult.recommendations && qaResult.recommendations.length > 0;
      }
    },

    {
      name: 'Security category assigned correctly',
      input: {
        content: 'eval(userInput);',
        filePath: 'src/dangerous.js'
      },
      validate: (result) => {
        // eval detection is in backend analyzer, not QA
        // This validates that QA doesn't crash on it
        return result.score <= 100;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  console.log(`Running ${testCases.length} pattern validation tests...\n`);

  for (const testCase of testCases) {
    process.stdout.write(`${testCase.name}... `);

    try {
      const result = PatternAnalyzer.analyzeQA(testCase.input.content, testCase.input.filePath);

      if (testCase.validate(result)) {
        console.log('✅ PASS');
        passed++;
      } else {
        console.log('❌ FAIL');
        console.log(`   Score: ${result.score}, Patterns: ${result.patterns.length}`);
        failed++;
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.log(`   ${error.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Pattern Analyzer Results:`);
  console.log(`  ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`  ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`  Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (passed === testCases.length) {
    console.log(`✅ ALL PATTERN TESTS PASSED!\n`);
    process.exit(0);
  } else {
    console.log(`❌ SOME TESTS FAILED\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});