#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - IDE Integration Tests
 * Tests BMAD coordinator's ability to generate IDE-ready prompts
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║              IDE Integration Test Suite                     ║
║                  BMAD Coordinator Testing                   ║
╚══════════════════════════════════════════════════════════════╝
`);

// BMAD Coordinator simulation (simplified)
class BMADCoordinator {
  async processRequest(userRequest, context) {
    // Import the actual orchestrator
    const { createOrchestrator } = await import('../dist/intelligence/agent-orchestrator.js');
    const orchestrator = createOrchestrator();

    // Run analysis
    const result = await orchestrator.analyzeFile({
      filePath: context.filePath,
      content: context.content,
      language: this.detectLanguage(context.filePath),
      projectName: 'IDE Integration Test',
      userRequest
    });

    // Generate IDE-ready response
    return {
      idePrompt: this.generateIDEPrompt(result, context),
      analysis: result.level1.patterns,
      suggestedActions: this.generateActions(result),
      agent: result.agent,
      score: result.level1.score
    };
  }

  generateIDEPrompt(result, context) {
    const agent = result.agent === 'enhanced-maria' ? 'Enhanced Maria' : result.agent;

    return `## Current Context
File: ${context.filePath}
Language: ${result.level1.summary ? 'Detected' : 'Unknown'}
Quality Score: ${result.level1.score}/100
Issues Found: ${result.level1.patterns.length}

## Code to Analyze
\`\`\`javascript
${context.content}
\`\`\`

## Analysis Request
You are ${agent}, a specialized QA engineer. Please analyze the code above and provide:

1. **Quality Assessment** (Score: ${result.level1.score}/100)
2. **Issues Detected** (${result.level1.patterns.length} found)
3. **Recommendations** for improvement
4. **Next Steps** for the developer

${result.level1.patterns.length > 0 ? `
## Detected Issues:
${result.level1.patterns.map(p => `- Line ${p.line}: ${p.message} (${p.severity})`).join('\n')}
` : ''}

Please provide a comprehensive review following your expertise in quality assurance and testing.`;
  }

  generateActions(result) {
    const actions = [];

    if (result.level1.patterns.some(p => p.severity === 'critical')) {
      actions.push('Fix critical issues immediately');
    }

    if (result.level1.patterns.some(p => p.type === 'missing-assertion')) {
      actions.push('Add test assertions');
    }

    if (result.level1.patterns.some(p => p.type === 'debug-code')) {
      actions.push('Remove debug statements');
    }

    if (result.handoffTo && result.handoffTo.length > 0) {
      actions.push(`Coordinate with: ${result.handoffTo.join(', ')}`);
    }

    return actions;
  }

  detectLanguage(filePath) {
    const ext = filePath.split('.').pop();
    return ext === 'js' ? 'javascript' : ext || 'plaintext';
  }
}

async function testIDEIntegration() {
  const tests = [
    {
      name: 'Test 1: Generate prompt for problematic code',
      input: {
        request: 'review this code',
        context: {
          filePath: 'test.js',
          content: 'function test() { console.log("no tests"); debugger; }'
        }
      },
      validate: (result) => {
        const hasPrompt = result.idePrompt.length > 100;
        const hasAnalysis = result.analysis.length > 0;
        const hasActions = result.suggestedActions.length > 0;
        return hasPrompt && hasAnalysis && hasActions;
      }
    },

    {
      name: 'Test 2: Verify prompt structure',
      input: {
        request: 'analyze code quality',
        context: {
          filePath: 'src/utils.js',
          content: 'function add(a, b) { return a + b; }'
        }
      },
      validate: (result) => {
        const hasContext = result.idePrompt.includes('## Current Context');
        const hasCode = result.idePrompt.includes('## Code to Analyze');
        const hasAgent = result.idePrompt.includes('Enhanced Maria');
        return hasContext && hasCode && hasAgent;
      }
    },

    {
      name: 'Test 3: Test file analysis with missing assertions',
      input: {
        request: 'check test quality',
        context: {
          filePath: 'test/auth.test.js',
          content: 'describe("auth", () => { it("should work", () => { login(); }); });'
        }
      },
      validate: (result) => {
        const hasAssertionAction = result.suggestedActions.some(a =>
          a.includes('assertion')
        );
        const detectsMissingAssertion = result.analysis.some(p =>
          p.type === 'missing-assertion'
        );
        return hasAssertionAction && detectsMissingAssertion;
      }
    },

    {
      name: 'Test 4: Critical issue detection and actions',
      input: {
        request: 'security review',
        context: {
          filePath: 'src/payment.js',
          content: 'function pay() { debugger; console.log("processing"); }'
        }
      },
      validate: (result) => {
        const hasCriticalAction = result.suggestedActions.some(a =>
          a.includes('critical')
        );
        const hasDebugAction = result.suggestedActions.some(a =>
          a.includes('debug')
        );
        return result.score < 90 && (hasCriticalAction || hasDebugAction);
      }
    },

    {
      name: 'Test 5: Clean code produces positive prompt',
      input: {
        request: 'quality check',
        context: {
          filePath: 'test/clean.test.js',
          content: 'test("validates input", () => expect(validate("test")).toBe(true));'
        }
      },
      validate: (result) => {
        return result.score >= 95 &&
               result.idePrompt.includes('Score: ' + result.score) &&
               result.analysis.length === 0;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  console.log(`Running ${tests.length} IDE integration tests...\n`);

  const bmad = new BMADCoordinator();

  for (const test of tests) {
    process.stdout.write(`${test.name}... `);

    try {
      const result = await bmad.processRequest(
        test.input.request,
        test.input.context
      );

      if (test.validate(result)) {
        console.log('✅ PASS');
        passed++;

        // Log some details for verification
        if (test.name === 'Test 1: Generate prompt for problematic code') {
          console.log(`   Generated Prompt Length: ${result.idePrompt.length}`);
          console.log(`   Has Level 1 Analysis: ${result.analysis.length > 0}`);
          console.log(`   Suggests Handoffs: ${result.suggestedActions.length > 0}`);
        }

        if (test.name === 'Test 2: Verify prompt structure') {
          const hasContext = result.idePrompt.includes('## Current Context');
          const hasCode = result.idePrompt.includes('## Code to Analyze');
          const hasTemplate = result.idePrompt.includes('Enhanced Maria');
          console.log(`   ✅ Prompt Structure Valid: ${hasContext && hasCode && hasTemplate}`);
        }

      } else {
        console.log('❌ FAIL');
        console.log(`   Score: ${result.score}, Analysis: ${result.analysis.length}, Actions: ${result.suggestedActions.length}`);
        failed++;
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.log(`   ${error.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`IDE Integration Test Results:`);
  console.log(`  ✅ Passed: ${passed}/${tests.length}`);
  console.log(`  ❌ Failed: ${failed}/${tests.length}`);
  console.log(`  Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (passed === tests.length) {
    console.log(`✅ ALL IDE INTEGRATION TESTS PASSED!\n`);
    console.log(`🎉 BMAD Coordinator ready for IDE integration\n`);
    process.exit(0);
  } else {
    console.log(`❌ SOME TESTS FAILED\n`);
    console.log(`⚠️  Review failures before IDE deployment\n`);
    process.exit(1);
  }
}

testIDEIntegration().catch(err => {
  console.error('IDE integration test error:', err);
  process.exit(1);
});