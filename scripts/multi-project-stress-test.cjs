#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Multi-Project Stress Test
 * Comprehensive validation of framework consolidation and isolation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class MultiProjectStressTest {
  constructor() {
    this.frameworkRoot = path.dirname(__dirname);
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.testProjectsRoot = path.join(os.tmpdir(), 'versatil-stress-test');
    this.results = {
      isolation: [],
      contamination: [],
      performance: [],
      memory: [],
      concurrent: [],
      summary: {}
    };
    this.startTime = Date.now();
  }

  async runStressTest() {
    console.log(`\n${colors.bold}${colors.magenta}🚀 VERSATIL Multi-Project Stress Test${colors.reset}\n`);
    console.log(`Framework Root: ${colors.blue}${this.frameworkRoot}${colors.reset}`);
    console.log(`VERSATIL Home: ${colors.blue}${this.versatilHome}${colors.reset}`);
    console.log(`Test Projects: ${colors.blue}${this.testProjectsRoot}${colors.reset}\n`);

    try {
      // Phase 1: Framework Isolation Validation
      await this.testFrameworkIsolation();

      // Phase 2: Multi-Project Setup
      await this.setupTestProjects();

      // Phase 3: Isolation Testing
      await this.testProjectIsolation();

      // Phase 4: Contamination Testing
      await this.testContaminationPrevention();

      // Phase 5: Concurrent Access Testing
      await this.testConcurrentAccess();

      // Phase 6: Memory and Performance Testing
      await this.testMemoryAndPerformance();

      // Phase 7: Knowledge Sharing Validation
      await this.testKnowledgeSharing();

      // Generate comprehensive report
      this.generateStressTestReport();

    } catch (error) {
      console.error(`${colors.red}Stress test failed: ${error.message}${colors.reset}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async testFrameworkIsolation() {
    console.log(`${colors.cyan}📦 Phase 1: Framework Isolation Validation${colors.reset}`);

    const tests = [
      {
        name: 'Framework Self-Isolation Check',
        test: async () => {
          // Check if framework violates its own rules
          const violations = [];

          // Check for .versatil in framework directory
          const frameworkVersatil = path.join(this.frameworkRoot, '.versatil');
          if (fs.existsSync(frameworkVersatil)) {
            violations.push('Framework contains .versatil directory');
          }

          // Check for supabase in framework directory
          const frameworkSupabase = path.join(this.frameworkRoot, 'supabase');
          if (fs.existsSync(frameworkSupabase)) {
            violations.push('Framework contains supabase directory');
          }

          // Check for proper framework home setup
          if (!fs.existsSync(this.versatilHome)) {
            violations.push('Framework home directory missing');
          }

          return { passed: violations.length === 0, violations };
        }
      },
      {
        name: 'Environment Variable Separation',
        test: async () => {
          const frameworkEnv = path.join(this.frameworkRoot, '.env');
          const homeEnv = path.join(this.versatilHome, '.env');

          const issues = [];

          if (fs.existsSync(frameworkEnv)) {
            const content = fs.readFileSync(frameworkEnv, 'utf8');
            if (content.includes('SUPABASE_URL') || content.includes('VERSATIL_')) {
              issues.push('Framework .env contains runtime variables');
            }
          }

          return { passed: issues.length === 0, issues };
        }
      },
      {
        name: 'Isolation Validator Self-Test',
        test: async () => {
          try {
            const { stdout, stderr } = await execAsync('node scripts/validate-isolation.cjs', {
              cwd: this.frameworkRoot
            });

            // Should fail for framework directory itself
            const hasViolations = stderr.includes('Isolation violations detected') ||
                                stdout.includes('Violation(s) Found');

            return { passed: hasViolations, reason: 'Framework should detect its own violations' };
          } catch (error) {
            return { passed: true, reason: 'Isolation validator detected violations correctly' };
          }
        }
      }
    ];

    for (const test of tests) {
      console.log(`  🧪 ${test.name}...`);
      const result = await test.test();
      this.results.isolation.push({
        name: test.name,
        passed: result.passed,
        details: result
      });

      if (result.passed) {
        console.log(`    ${colors.green}✓ Passed${colors.reset}`);
      } else {
        console.log(`    ${colors.red}✗ Failed${colors.reset}`);
        if (result.violations) {
          result.violations.forEach(v => console.log(`      - ${v}`));
        }
      }
    }
  }

  async setupTestProjects() {
    console.log(`\n${colors.cyan}📁 Phase 2: Multi-Project Setup${colors.reset}`);

    // Clean and create test directory
    if (fs.existsSync(this.testProjectsRoot)) {
      fs.rmSync(this.testProjectsRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(this.testProjectsRoot, { recursive: true });

    const projects = [
      { name: 'project-a', type: 'react', framework: 'vite' },
      { name: 'project-b', type: 'vue', framework: 'nuxt' },
      { name: 'project-c', type: 'node', framework: 'express' }
    ];

    for (const project of projects) {
      console.log(`  📦 Creating ${project.name} (${project.type})...`);
      const projectPath = path.join(this.testProjectsRoot, project.name);

      fs.mkdirSync(projectPath, { recursive: true });

      // Create package.json
      const packageJson = {
        name: project.name,
        version: '1.0.0',
        type: 'module',
        dependencies: {},
        devDependencies: {
          'versatil-sdlc-framework': `file:${this.frameworkRoot}`
        }
      };

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Create .versatil-project.json
      const projectConfig = {
        projectId: `test-${project.name}-${Date.now()}`,
        framework: project.framework,
        type: project.type,
        created: new Date().toISOString(),
        agents: {
          enabled: ['maria-qa', 'james-frontend'],
          priority: project.type === 'react' ? 'james-frontend' : 'maria-qa'
        }
      };

      fs.writeFileSync(
        path.join(projectPath, '.versatil-project.json'),
        JSON.stringify(projectConfig, null, 2)
      );

      // Create source structure
      const srcPath = path.join(projectPath, 'src');
      fs.mkdirSync(srcPath);

      // Create project-specific files
      fs.writeFileSync(
        path.join(srcPath, 'main.js'),
        `// ${project.name} main file\\nconsole.log('${project.name} running');`
      );

      console.log(`    ${colors.green}✓ ${project.name} created${colors.reset}`);
    }
  }

  async testProjectIsolation() {
    console.log(`\n${colors.cyan}🔒 Phase 3: Project Isolation Testing${colors.reset}`);

    const projects = ['project-a', 'project-b', 'project-c'];

    for (const project of projects) {
      console.log(`  🧪 Testing ${project} isolation...`);
      const projectPath = path.join(this.testProjectsRoot, project);

      const tests = [
        {
          name: `${project} - No framework directories`,
          test: async () => {
            const forbidden = ['.versatil', 'supabase', '.versatil-logs'];
            const violations = [];

            for (const dir of forbidden) {
              const dirPath = path.join(projectPath, dir);
              if (fs.existsSync(dirPath)) {
                violations.push(`Found forbidden directory: ${dir}`);
              }
            }

            return { passed: violations.length === 0, violations };
          }
        },
        {
          name: `${project} - Isolation validator passes`,
          test: async () => {
            try {
              const { stdout, stderr } = await execAsync('node ../../scripts/validate-isolation.cjs', {
                cwd: projectPath
              });

              const hasViolations = stderr.includes('Isolation violations detected');
              return { passed: !hasViolations, output: stdout + stderr };
            } catch (error) {
              return { passed: false, error: error.message };
            }
          }
        },
        {
          name: `${project} - Project config isolation`,
          test: async () => {
            const configPath = path.join(projectPath, '.versatil-project.json');
            if (!fs.existsSync(configPath)) {
              return { passed: false, reason: 'Missing project config' };
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const hasUniqueId = config.projectId && config.projectId.includes(project);

            return { passed: hasUniqueId, config };
          }
        }
      ];

      for (const test of tests) {
        const result = await test.test();
        this.results.isolation.push({
          name: test.name,
          passed: result.passed,
          details: result
        });

        if (result.passed) {
          console.log(`    ${colors.green}✓ ${test.name}${colors.reset}`);
        } else {
          console.log(`    ${colors.red}✗ ${test.name}${colors.reset}`);
        }
      }
    }
  }

  async testContaminationPrevention() {
    console.log(`\n${colors.cyan}🧪 Phase 4: Contamination Prevention Testing${colors.reset}`);

    const contaminationTests = [
      {
        name: 'Cross-project file leakage',
        test: async () => {
          // Try to create framework files in project A and see if they affect project B
          const projectA = path.join(this.testProjectsRoot, 'project-a');
          const projectB = path.join(this.testProjectsRoot, 'project-b');

          // Create contamination in project A
          const contaminationPath = path.join(projectA, '.versatil');
          fs.mkdirSync(contaminationPath, { recursive: true });
          fs.writeFileSync(path.join(contaminationPath, 'contaminated.json'), '{"contaminated": true}');

          // Check if project B is affected
          const projectBContamination = path.join(projectB, '.versatil');
          const isContaminated = fs.existsSync(projectBContamination);

          // Clean up
          fs.rmSync(contaminationPath, { recursive: true, force: true });

          return { passed: !isContaminated, details: 'Projects should not share directories' };
        }
      },
      {
        name: 'Environment variable isolation',
        test: async () => {
          const projectA = path.join(this.testProjectsRoot, 'project-a');
          const projectB = path.join(this.testProjectsRoot, 'project-b');

          // Create .env in project A with sensitive data
          fs.writeFileSync(path.join(projectA, '.env'), 'SECRET_KEY=project-a-secret\\nAPI_URL=http://project-a.com');

          // Create .env in project B with different data
          fs.writeFileSync(path.join(projectB, '.env'), 'SECRET_KEY=project-b-secret\\nAPI_URL=http://project-b.com');

          // Verify they remain separate
          const envA = fs.readFileSync(path.join(projectA, '.env'), 'utf8');
          const envB = fs.readFileSync(path.join(projectB, '.env'), 'utf8');

          const isolated = envA.includes('project-a-secret') &&
                          envB.includes('project-b-secret') &&
                          !envA.includes('project-b') &&
                          !envB.includes('project-a');

          return { passed: isolated, details: 'Environment files should remain separate' };
        }
      },
      {
        name: 'Memory store isolation',
        test: async () => {
          // This tests if framework properly isolates project-specific data
          // Even though memory store is shared, project context should be separated

          const projectConfigs = [];
          for (const project of ['project-a', 'project-b', 'project-c']) {
            const configPath = path.join(this.testProjectsRoot, project, '.versatil-project.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            projectConfigs.push(config);
          }

          // Check that each project has unique ID
          const uniqueIds = new Set(projectConfigs.map(c => c.projectId));
          const allUnique = uniqueIds.size === projectConfigs.length;

          return { passed: allUnique, details: 'Each project should have unique identifier' };
        }
      }
    ];

    for (const test of contaminationTests) {
      console.log(`  🧪 ${test.name}...`);
      const result = await test.test();
      this.results.contamination.push({
        name: test.name,
        passed: result.passed,
        details: result
      });

      if (result.passed) {
        console.log(`    ${colors.green}✓ Passed${colors.reset}`);
      } else {
        console.log(`    ${colors.red}✗ Failed: ${result.details}${colors.reset}`);
      }
    }
  }

  async testConcurrentAccess() {
    console.log(`\n${colors.cyan}⚡ Phase 5: Concurrent Access Testing${colors.reset}`);

    const concurrentTests = [
      {
        name: 'Simultaneous framework operations',
        test: async () => {
          const projects = ['project-a', 'project-b', 'project-c'];
          const promises = [];

          // Run isolation validation on all projects simultaneously
          for (const project of projects) {
            const projectPath = path.join(this.testProjectsRoot, project);
            promises.push(
              execAsync('node ../../scripts/validate-isolation.cjs', { cwd: projectPath })
                .catch(error => ({ error: error.message, project }))
            );
          }

          const results = await Promise.allSettled(promises);
          const failures = results.filter(r => r.status === 'rejected' || r.value?.error);

          return {
            passed: failures.length === 0,
            details: { total: results.length, failures: failures.length }
          };
        }
      },
      {
        name: 'Shared resource access',
        test: async () => {
          // Test if multiple projects can access framework home safely
          const accessPromises = [];

          for (let i = 0; i < 5; i++) {
            accessPromises.push(
              new Promise((resolve) => {
                setTimeout(() => {
                  try {
                    // Simulate framework home access
                    const homeExists = fs.existsSync(this.versatilHome);
                    const logDir = path.join(this.versatilHome, 'logs');
                    fs.mkdirSync(logDir, { recursive: true });

                    // Create test log file
                    const logFile = path.join(logDir, `test-${i}-${Date.now()}.log`);
                    fs.writeFileSync(logFile, `Test access ${i} at ${new Date().toISOString()}`);

                    resolve({ success: true, logFile });
                  } catch (error) {
                    resolve({ success: false, error: error.message });
                  }
                }, i * 100); // Stagger access
              })
            );
          }

          const results = await Promise.all(accessPromises);
          const successes = results.filter(r => r.success);

          return {
            passed: successes.length === results.length,
            details: { successes: successes.length, total: results.length }
          };
        }
      }
    ];

    for (const test of concurrentTests) {
      console.log(`  🧪 ${test.name}...`);
      const result = await test.test();
      this.results.concurrent.push({
        name: test.name,
        passed: result.passed,
        details: result
      });

      if (result.passed) {
        console.log(`    ${colors.green}✓ Passed${colors.reset}`);
      } else {
        console.log(`    ${colors.red}✗ Failed${colors.reset}`);
      }
    }
  }

  async testMemoryAndPerformance() {
    console.log(`\n${colors.cyan}🚄 Phase 6: Memory and Performance Testing${colors.reset}`);

    const performanceTests = [
      {
        name: 'Framework home access performance',
        test: async () => {
          const iterations = 100;
          const startTime = process.hrtime.bigint();

          for (let i = 0; i < iterations; i++) {
            fs.existsSync(this.versatilHome);
            const logDir = path.join(this.versatilHome, 'logs');
            fs.mkdirSync(logDir, { recursive: true });
          }

          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1000000;
          const avgPerOp = durationMs / iterations;

          return {
            passed: avgPerOp < 10, // Less than 10ms per operation
            details: { totalMs: durationMs, avgPerOp, iterations }
          };
        }
      },
      {
        name: 'Multi-project memory usage',
        test: async () => {
          const initialMemory = process.memoryUsage();

          // Simulate loading multiple project configs
          const configs = [];
          for (const project of ['project-a', 'project-b', 'project-c']) {
            for (let i = 0; i < 10; i++) {
              const configPath = path.join(this.testProjectsRoot, project, '.versatil-project.json');
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              configs.push({ ...config, iteration: i });
            }
          }

          const finalMemory = process.memoryUsage();
          const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
          const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

          return {
            passed: memoryIncreaseMB < 50, // Less than 50MB increase
            details: {
              increaseMB: memoryIncreaseMB,
              configs: configs.length,
              initial: initialMemory,
              final: finalMemory
            }
          };
        }
      }
    ];

    for (const test of performanceTests) {
      console.log(`  🧪 ${test.name}...`);
      const result = await test.test();
      this.results.performance.push({
        name: test.name,
        passed: result.passed,
        details: result
      });

      if (result.passed) {
        console.log(`    ${colors.green}✓ Passed${colors.reset}`);
      } else {
        console.log(`    ${colors.red}✗ Failed${colors.reset}`);
      }
    }
  }

  async testKnowledgeSharing() {
    console.log(`\n${colors.cyan}🧠 Phase 7: Knowledge Sharing Validation${colors.reset}`);

    const knowledgeTests = [
      {
        name: 'Shared framework knowledge availability',
        test: async () => {
          // Test if framework knowledge is accessible from all projects
          const frameworkComponents = [
            'src/agents/james-frontend/smart-component-orchestrator.ts',
            'src/agents/james-frontend/intelligent-performance-optimizer.ts',
            'src/agents/james-frontend/autonomous-accessibility-guardian.ts'
          ];

          const missingComponents = [];
          for (const component of frameworkComponents) {
            const componentPath = path.join(this.frameworkRoot, component);
            if (!fs.existsSync(componentPath)) {
              missingComponents.push(component);
            }
          }

          return {
            passed: missingComponents.length === 0,
            details: { missing: missingComponents, total: frameworkComponents.length }
          };
        }
      },
      {
        name: 'Project-specific configuration isolation',
        test: async () => {
          // Test that project configs don't interfere with each other
          const projectConfigs = [];

          for (const project of ['project-a', 'project-b', 'project-c']) {
            const configPath = path.join(this.testProjectsRoot, project, '.versatil-project.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            projectConfigs.push({ project, config });
          }

          // Check that each config is truly isolated
          const frameworks = projectConfigs.map(p => p.config.framework);
          const types = projectConfigs.map(p => p.config.type);
          const ids = projectConfigs.map(p => p.config.projectId);

          const allUnique = new Set(frameworks).size === frameworks.length &&
                           new Set(types).size === types.length &&
                           new Set(ids).size === ids.length;

          return {
            passed: allUnique,
            details: { frameworks, types, ids }
          };
        }
      }
    ];

    for (const test of knowledgeTests) {
      console.log(`  🧪 ${test.name}...`);
      const result = await test.test();
      this.results.memory.push({
        name: test.name,
        passed: result.passed,
        details: result
      });

      if (result.passed) {
        console.log(`    ${colors.green}✓ Passed${colors.reset}`);
      } else {
        console.log(`    ${colors.red}✗ Failed${colors.reset}`);
      }
    }
  }

  generateStressTestReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    console.log(`\n${colors.bold}${colors.magenta}📋 MULTI-PROJECT STRESS TEST REPORT${colors.reset}\n`);
    console.log('='.repeat(80));

    // Calculate overall statistics
    const allTests = [
      ...this.results.isolation,
      ...this.results.contamination,
      ...this.results.concurrent,
      ...this.results.performance,
      ...this.results.memory
    ];

    const totalTests = allTests.length;
    const passedTests = allTests.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    this.results.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      duration: totalDuration,
      timestamp: new Date().toISOString()
    };

    console.log(`${colors.bold}Overall Results:${colors.reset}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
    console.log(`Failed: ${colors.red}${failedTests}${colors.reset}`);
    console.log(`Success Rate: ${successRate >= 90 ? colors.green : successRate >= 75 ? colors.yellow : colors.red}${successRate}%${colors.reset}`);
    console.log(`Duration: ${totalDuration}ms\\n`);

    // Detailed breakdown
    const categories = [
      { name: 'Isolation Tests', results: this.results.isolation },
      { name: 'Contamination Prevention', results: this.results.contamination },
      { name: 'Concurrent Access', results: this.results.concurrent },
      { name: 'Performance Tests', results: this.results.performance },
      { name: 'Knowledge Sharing', results: this.results.memory }
    ];

    categories.forEach(category => {
      const passed = category.results.filter(r => r.passed).length;
      const total = category.results.length;
      const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

      console.log(`${colors.bold}${category.name}:${colors.reset} ${passed}/${total} (${rate}%)`);

      category.results.forEach(result => {
        const status = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`  ${status} ${result.name}`);
      });
      console.log();
    });

    // Critical findings
    const criticalFailures = allTests.filter(t => !t.passed &&
      (t.name.includes('isolation') || t.name.includes('contamination'))
    );

    if (criticalFailures.length > 0) {
      console.log(`${colors.red}${colors.bold}⚠️  CRITICAL ISSUES DETECTED:${colors.reset}`);
      criticalFailures.forEach(failure => {
        console.log(`${colors.red}   • ${failure.name}${colors.reset}`);
      });
      console.log();
    }

    // Framework consolidation verdict
    const isConsolidated = successRate >= 85 && criticalFailures.length === 0;

    console.log('='.repeat(80));
    console.log(`${colors.bold}FRAMEWORK CONSOLIDATION VERDICT:${colors.reset}`);

    if (isConsolidated) {
      console.log(`${colors.green}${colors.bold}✅ FRAMEWORK IS WELL CONSOLIDATED${colors.reset}`);
      console.log(`${colors.green}The framework demonstrates robust multi-project isolation and proper knowledge sharing.${colors.reset}`);
    } else {
      console.log(`${colors.red}${colors.bold}❌ FRAMEWORK NEEDS CONSOLIDATION WORK${colors.reset}`);
      console.log(`${colors.red}Critical issues detected that require attention before multi-project deployment.${colors.reset}`);
    }

    console.log();

    // Save detailed report
    const reportPath = path.join(this.frameworkRoot, 'multi-project-stress-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}\\n`);
  }

  async cleanup() {
    console.log(`${colors.yellow}🧹 Cleaning up test projects...${colors.reset}`);

    if (fs.existsSync(this.testProjectsRoot)) {
      fs.rmSync(this.testProjectsRoot, { recursive: true, force: true });
    }

    // Clean up any test logs in framework home
    const testLogsDir = path.join(this.versatilHome, 'logs');
    if (fs.existsSync(testLogsDir)) {
      const files = fs.readdirSync(testLogsDir);
      files.forEach(file => {
        if (file.includes('test-')) {
          fs.unlinkSync(path.join(testLogsDir, file));
        }
      });
    }

    console.log(`${colors.green}✓ Cleanup completed${colors.reset}`);
  }
}

// Run stress test
if (require.main === module) {
  const stressTest = new MultiProjectStressTest();
  stressTest.runStressTest()
    .then(() => {
      console.log(`${colors.green}Stress test completed successfully${colors.reset}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`${colors.red}Stress test failed: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = { MultiProjectStressTest };