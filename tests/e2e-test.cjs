#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Phase 3 Testing
 * End-to-End System Integration Tests
 *
 * Validates complete workflow from script execution to agent orchestration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Chalk compatibility handling (ES module wrapper)
const chalkModule = require('chalk');
const chalk = chalkModule.default || chalkModule;

// Create color wrapper functions to prevent "not a function" errors
const colors = {
  blue: (text) => chalk.blue(text),
  green: (text) => chalk.green(text),
  red: (text) => chalk.red(text),
  yellow: (text) => chalk.yellow(text),
  cyan: (text) => chalk.cyan(text),
  magenta: (text) => chalk.magenta(text)
};

console.log(`
╔══════════════════════════════════════════════════════════════╗
║            VERSATIL Phase 3 - E2E Test Suite                ║
║              Full System Integration Testing                ║
╚══════════════════════════════════════════════════════════════╝
`);

async function runE2ETests() {
  console.log(colors.blue('🧪 Running End-to-End System Integration Tests...\n'));

  const tests = [
    {
      name: 'Test 1: Script Execution Validation',
      description: 'Verify core npm scripts execute without errors',
      test: async () => {
        try {
          // Test critical scripts that should work
          execSync('npm run show-agents', { stdio: 'pipe', timeout: 10000 });
          execSync('npm run build', { stdio: 'pipe', timeout: 15000 });

          // Verify test scripts exist and can be called
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          const requiredScripts = ['test:maria', 'test:phase2', 'validate:scripts'];

          for (const script of requiredScripts) {
            if (!packageJson.scripts[script]) {
              throw new Error(`Required script missing: ${script}`);
            }
          }

          return true;
        } catch (error) {
          throw new Error(`Script execution failed: ${error.message}`);
        }
      }
    },

    {
      name: 'Test 2: Agent Registry Loading',
      description: 'Validate all agents load correctly from registry',
      test: async () => {
        try {
          // Import and test agent registry
          const { createOrchestrator } = await import('../dist/intelligence/agent-orchestrator.js');
          const orchestrator = createOrchestrator();

          // Test agent selection for different file types
          const testCases = [
            { filePath: 'test.js', expectedAgent: 'enhanced-maria' },
            { filePath: 'component.tsx', expectedAgent: 'enhanced-james' },
            { filePath: 'api.js', expectedAgent: 'enhanced-marcus' },
            { filePath: 'README.md', expectedAgent: 'sarah-pm' }
          ];

          for (const testCase of testCases) {
            const result = await orchestrator.analyzeFile({
              filePath: testCase.filePath,
              content: '// test content',
              language: 'javascript'
            });

            if (!result.agent.includes(testCase.expectedAgent.split('-')[1])) {
              throw new Error(`Agent selection failed for ${testCase.filePath}: expected ${testCase.expectedAgent}, got ${result.agent}`);
            }
          }

          return true;
        } catch (error) {
          throw new Error(`Agent loading failed: ${error.message}`);
        }
      }
    },

    {
      name: 'Test 3: Pattern Analysis End-to-End',
      description: 'Test complete pattern detection workflow',
      test: async () => {
        try {
          const { createOrchestrator } = await import('../dist/intelligence/agent-orchestrator.js');
          const orchestrator = createOrchestrator();

          // Test with problematic code that should trigger patterns
          const testCode = `
function problematic() {
  console.log("debug message");
  debugger;
  // TODO: fix this
}
          `.trim();

          const result = await orchestrator.analyzeFile({
            filePath: 'test.js',
            content: testCode,
            language: 'javascript',
            userRequest: 'analyze code quality'
          });

          // Validate pattern detection
          if (!result.level1.patterns || result.level1.patterns.length === 0) {
            throw new Error('Pattern detection failed - no patterns found');
          }

          // Should detect console.log and debugger (check pattern type or message)
          const hasConsoleLog = result.level1.patterns.some(p =>
            p.message.includes('console.log') || p.type === 'debug-code' || p.message.includes('debug')
          );
          const hasDebugger = result.level1.patterns.some(p =>
            p.message.includes('debugger') || p.type === 'debugger-statement' || p.message.includes('debugger')
          );

          if (!hasConsoleLog && !hasDebugger) {
            throw new Error(`Pattern detection incomplete - expected debug patterns, found: ${result.level1.patterns.map(p => p.type || p.message).join(', ')}`);
          }

          // Quality score should be reduced due to issues
          if (result.level1.score >= 90) {
            throw new Error(`Quality scoring failed - score too high: ${result.level1.score}`);
          }

          return true;
        } catch (error) {
          throw new Error(`Pattern analysis failed: ${error.message}`);
        }
      }
    },

    {
      name: 'Test 4: Prompt Generation Validation',
      description: 'Verify IDE-ready prompt generation',
      test: async () => {
        try {
          const { createOrchestrator } = await import('../dist/intelligence/agent-orchestrator.js');
          const orchestrator = createOrchestrator();

          const result = await orchestrator.analyzeFile({
            filePath: 'src/component.tsx',
            content: 'function TestComponent() { return <div>test</div>; }',
            language: 'javascript',
            projectName: 'E2E Test Project',
            userRequest: 'review component quality'
          });

          // Validate prompt structure and content
          if (!result.level2.prompt || result.level2.prompt.length < 500) {
            throw new Error(`Prompt too short: ${result.level2.prompt?.length || 0} characters`);
          }

          // Check for key prompt content (flexible matching)
          const hasAgent = result.level2.prompt.includes('Enhanced');
          const hasAnalysis = result.level2.prompt.includes('Analysis');
          const hasCode = result.level2.prompt.includes('```');

          if (!hasAgent) {
            throw new Error('Prompt missing agent identification');
          }
          if (!hasAnalysis) {
            throw new Error('Prompt missing analysis section');
          }
          if (!hasCode) {
            throw new Error('Prompt missing code block');
          }

          // Verify agent identification in prompt (flexible matching)
          if (!result.level2.prompt.includes('Enhanced') && !result.level2.prompt.includes('Maria') && !result.level2.prompt.includes('QA')) {
            throw new Error('Agent identification missing from prompt');
          }

          return true;
        } catch (error) {
          throw new Error(`Prompt generation failed: ${error.message}`);
        }
      }
    },

    {
      name: 'Test 5: Agent Handoff Mechanisms',
      description: 'Test agent coordination and next step recommendations',
      test: async () => {
        try {
          const { createOrchestrator } = await import('../dist/intelligence/agent-orchestrator.js');
          const orchestrator = createOrchestrator();

          // Test with code that should trigger handoffs
          const criticalCode = `
function securityRisk() {
  debugger;
  eval("dangerous code");
  console.log(process.env.SECRET_KEY);
}
          `.trim();

          const result = await orchestrator.analyzeFile({
            filePath: 'src/security.js',
            content: criticalCode,
            language: 'javascript',
            userRequest: 'security review'
          });

          // Should have next steps and recommendations
          if (!result.nextSteps || result.nextSteps.length === 0) {
            throw new Error('No next steps provided');
          }

          // Should detect critical issues and suggest handoffs
          if (!result.level1.recommendations || result.level1.recommendations.length === 0) {
            throw new Error('No recommendations provided');
          }

          // Should have execution recommendation
          if (!result.executionRecommendation) {
            throw new Error('No execution recommendation provided');
          }

          // For critical code, should recommend enhanced analysis
          const hasSecurityRecommendation = result.nextSteps.some(step =>
            step.includes('security') || step.includes('critical') || step.includes('review')
          );

          if (!hasSecurityRecommendation) {
            throw new Error('Missing security/critical issue handling in next steps');
          }

          return true;
        } catch (error) {
          throw new Error(`Agent handoff failed: ${error.message}`);
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();

  console.log(`Running ${tests.length} end-to-end tests...\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  for (const test of tests) {
    process.stdout.write(`📋 ${test.name}: ${test.description}... `);

    try {
      const success = await test.test();
      if (success) {
        console.log(colors.green('✅ PASS'));
        passed++;
      } else {
        console.log(colors.red('❌ FAIL'));
        failed++;
      }
    } catch (error) {
      console.log(colors.red('❌ FAIL'));
      console.log(colors.red(`   Error: ${error.message}`));
      failed++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Phase 3 E2E Test Summary:\n`);
  console.log(`  Test Cases:   ${passed}/${tests.length} passed`);
  console.log(`  ✅ Passed:    ${passed}`);
  console.log(`  ❌ Failed:    ${failed}`);
  console.log(`  ⏱️  Duration:   ${duration}s\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (passed === tests.length) {
    console.log(colors.green(`✅ ALL E2E TESTS PASSED!\n`));
    console.log(colors.green(`🎉 Full system integration validated - Production ready\n`));
    process.exit(0);
  } else {
    console.log(colors.red(`❌ ${failed} E2E TEST(S) FAILED\n`));
    console.log(colors.yellow(`⚠️  Review failures before production deployment\n`));
    process.exit(1);
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  runE2ETests().catch(err => {
    console.error(colors.red('E2E test error:'), err);
    process.exit(1);
  });
}

module.exports = { runE2ETests };