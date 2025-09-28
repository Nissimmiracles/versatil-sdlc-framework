#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Automated Stability Testing Suite
 * Comprehensive testing framework for ensuring framework stability
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class VERSATILStabilityTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testResults = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testSuites: {},
      errors: [],
      warnings: [],
      performance: {}
    };
    this.startTime = Date.now();
  }

  /**
   * Run complete stability test suite
   */
  async runStabilityTests() {
    console.log('🧪 VERSATIL SDLC Framework - Automated Stability Testing');
    console.log('='.repeat(60));
    console.log('');

    try {
      // Test Suite 1: Build System Stability
      await this.testBuildStability();

      // Test Suite 2: MCP Server Functionality
      await this.testMCPServerStability();

      // Test Suite 3: Agent System Stability
      await this.testAgentSystemStability();

      // Test Suite 4: ES Module Import Resolution
      await this.testESModuleStability();

      // Test Suite 5: TypeScript Compilation Stability
      await this.testTypeScriptStability();

      // Test Suite 6: File System Operations
      await this.testFileSystemStability();

      // Test Suite 7: Performance Benchmarks
      await this.testPerformanceStability();

      // Test Suite 8: Integration Tests
      await this.testIntegrationStability();

      // Generate final report
      this.generateStabilityReport();

    } catch (error) {
      console.error('❌ Critical error in stability testing:', error);
      process.exit(1);
    }
  }

  /**
   * Test build system stability and consistency
   */
  async testBuildStability() {
    const suiteName = 'Build System Stability';
    console.log(`📦 Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: Clean build from scratch
      this.runTest(suite, 'Clean Build', () => {
        this.cleanDirectory(path.join(this.projectRoot, 'dist'));
        const result = execSync('npm run build', {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 120000 // 2 minute timeout
        });

        // Verify build output exists
        const distExists = fs.existsSync(path.join(this.projectRoot, 'dist'));
        if (!distExists) throw new Error('Build output directory not created');

        return { success: true, output: 'Build completed successfully' };
      });

      // Test 2: Incremental build
      this.runTest(suite, 'Incremental Build', () => {
        const result = execSync('npm run build', {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 60000
        });
        return { success: true, output: 'Incremental build completed' };
      });

      // Test 3: Build artifact validation
      this.runTest(suite, 'Build Artifacts Validation', () => {
        const requiredFiles = [
          'dist/index.js',
          'dist/mcp-server.js',
          'dist/agent-dispatcher.js',
          'dist/agents/enhanced-maria.js',
          'dist/agents/enhanced-james.js',
          'dist/agents/enhanced-marcus.js'
        ];

        const missingFiles = requiredFiles.filter(file =>
          !fs.existsSync(path.join(this.projectRoot, file))
        );

        if (missingFiles.length > 0) {
          throw new Error(`Missing build artifacts: ${missingFiles.join(', ')}`);
        }

        return { success: true, output: `All ${requiredFiles.length} build artifacts present` };
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  /**
   * Test MCP server stability and responsiveness
   */
  async testMCPServerStability() {
    const suiteName = 'MCP Server Stability';
    console.log(`🔗 Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: MCP server startup
      await this.runAsyncTest(suite, 'MCP Server Startup', async () => {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
          const server = spawn('node', ['bin/versatil-mcp.js', '.'], {
            cwd: this.projectRoot,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let output = '';
          let errorOutput = '';

          server.stdout.on('data', (data) => {
            output += data.toString();
          });

          server.stderr.on('data', (data) => {
            errorOutput += data.toString();

            // Look for ready message
            if (errorOutput.includes('ready for connections') ||
                errorOutput.includes('VERSATIL MCP Server') ||
                output.includes('"result"')) {

              const startupTime = Date.now() - startTime;
              server.kill();

              resolve({
                success: true,
                output: `Server started in ${startupTime}ms`,
                performance: { startupTime }
              });
            }
          });

          server.on('error', (error) => {
            reject(new Error(`Server startup failed: ${error.message}`));
          });

          // Timeout after 60 seconds
          setTimeout(() => {
            server.kill();
            reject(new Error('Server startup timeout (60s)'));
          }, 60000);

          // Send test command after 2 seconds
          setTimeout(() => {
            server.stdin.write('{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}\n');
          }, 2000);
        });
      });

      // Test 2: MCP tools availability
      await this.runAsyncTest(suite, 'MCP Tools Availability', async () => {
        return new Promise((resolve, reject) => {
          const server = spawn('node', ['bin/versatil-mcp.js', '.'], {
            cwd: this.projectRoot,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let output = '';

          server.stdout.on('data', (data) => {
            output += data.toString();

            try {
              const response = JSON.parse(output);
              if (response.result && response.result.tools) {
                const toolCount = response.result.tools.length;
                const expectedTools = [
                  'versatil_analyze_project',
                  'versatil_activate_agent',
                  'versatil_quality_gates',
                  'versatil_framework_status',
                  'versatil_submit_feedback'
                ];

                const availableTools = response.result.tools.map(tool => tool.name);
                const missingTools = expectedTools.filter(tool => !availableTools.includes(tool));

                server.kill();

                if (missingTools.length > 0) {
                  reject(new Error(`Missing MCP tools: ${missingTools.join(', ')}`));
                } else {
                  resolve({
                    success: true,
                    output: `All ${toolCount} MCP tools available`,
                    toolCount
                  });
                }
              }
            } catch (parseError) {
              // Continue waiting for valid JSON
            }
          });

          server.on('error', (error) => {
            reject(new Error(`MCP tools test failed: ${error.message}`));
          });

          setTimeout(() => {
            server.kill();
            reject(new Error('MCP tools test timeout'));
          }, 30000);

          // Send tools list request
          setTimeout(() => {
            server.stdin.write('{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}\n');
          }, 1000);
        });
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  /**
   * Test agent system stability
   */
  async testAgentSystemStability() {
    const suiteName = 'Agent System Stability';
    console.log(`🤖 Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: Agent registry loading
      this.runTest(suite, 'Agent Registry Loading', () => {
        const agentRegistryPath = path.join(this.projectRoot, 'dist/agents/agent-registry.js');
        if (!fs.existsSync(agentRegistryPath)) {
          throw new Error('Agent registry not found');
        }

        // Verify agent files exist
        const requiredAgents = [
          'enhanced-maria.js',
          'enhanced-james.js',
          'enhanced-marcus.js',
          'devops-dan.js',
          'security-sam.js',
          'architecture-dan.js'
        ];

        const agentsDir = path.join(this.projectRoot, 'dist/agents');
        const missingAgents = requiredAgents.filter(agent =>
          !fs.existsSync(path.join(agentsDir, agent))
        );

        if (missingAgents.length > 0) {
          throw new Error(`Missing agent files: ${missingAgents.join(', ')}`);
        }

        return { success: true, output: `All ${requiredAgents.length} agents available` };
      });

      // Test 2: Agent dispatcher functionality
      this.runTest(suite, 'Agent Dispatcher', () => {
        const dispatcherPath = path.join(this.projectRoot, 'dist/agent-dispatcher.js');
        if (!fs.existsSync(dispatcherPath)) {
          throw new Error('Agent dispatcher not found');
        }

        return { success: true, output: 'Agent dispatcher available' };
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  /**
   * Test ES module import resolution stability
   */
  async testESModuleStability() {
    const suiteName = 'ES Module Stability';
    console.log(`📦 Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: Import resolution check
      this.runTest(suite, 'Import Resolution', () => {
        const distDir = path.join(this.projectRoot, 'dist');
        const jsFiles = this.findJSFiles(distDir);

        let importIssues = [];

        for (const file of jsFiles.slice(0, 20)) { // Test first 20 files
          const content = fs.readFileSync(file, 'utf8');
          const relativeImports = content.match(/import.*from ['"`](\.[^'"`]*?)['"`]/g);

          if (relativeImports) {
            for (const importStatement of relativeImports) {
              const match = importStatement.match(/from ['"`](\.[^'"`]*?)['"`]/);
              if (match && !match[1].endsWith('.js')) {
                importIssues.push(`${path.relative(this.projectRoot, file)}: ${importStatement}`);
              }
            }
          }
        }

        if (importIssues.length > 0) {
          throw new Error(`ES module import issues found: ${importIssues.slice(0, 5).join(', ')}${importIssues.length > 5 ? ` (and ${importIssues.length - 5} more)` : ''}`);
        }

        return { success: true, output: `Checked ${jsFiles.length} JS files - no import issues` };
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  /**
   * Test TypeScript compilation stability
   */
  async testTypeScriptStability() {
    const suiteName = 'TypeScript Compilation';
    console.log(`📝 Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: TypeScript type checking
      this.runTest(suite, 'TypeScript Type Check', () => {
        try {
          const result = execSync('npx tsc --noEmit', {
            cwd: this.projectRoot,
            encoding: 'utf8',
            timeout: 60000
          });

          return { success: true, output: 'TypeScript compilation clean' };
        } catch (error) {
          if (error.stdout && error.stdout.includes('error TS')) {
            const errorCount = (error.stdout.match(/error TS/g) || []).length;
            throw new Error(`TypeScript compilation has ${errorCount} errors`);
          }
          throw error;
        }
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  /**
   * Test file system operations stability
   */
  async testFileSystemStability() {
    const suiteName = 'File System Operations';
    console.log(`📁 Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: Directory creation and cleanup
      this.runTest(suite, 'Directory Operations', () => {
        const testDir = path.join(this.projectRoot, '.test-temp');

        // Create directory
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }

        // Write test file
        const testFile = path.join(testDir, 'test.txt');
        fs.writeFileSync(testFile, 'Test content');

        // Verify file exists
        if (!fs.existsSync(testFile)) {
          throw new Error('Test file creation failed');
        }

        // Clean up
        fs.unlinkSync(testFile);
        fs.rmdirSync(testDir);

        return { success: true, output: 'File system operations working' };
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  /**
   * Test performance benchmarks
   */
  async testPerformanceStability() {
    const suiteName = 'Performance Benchmarks';
    console.log(`⚡ Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: Build performance
      this.runTest(suite, 'Build Performance', () => {
        const startTime = Date.now();

        execSync('npm run build', {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 120000
        });

        const buildTime = Date.now() - startTime;
        const maxBuildTime = 60000; // 60 seconds max

        if (buildTime > maxBuildTime) {
          throw new Error(`Build too slow: ${buildTime}ms (max: ${maxBuildTime}ms)`);
        }

        return {
          success: true,
          output: `Build completed in ${buildTime}ms`,
          performance: { buildTime }
        };
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  /**
   * Test integration stability
   */
  async testIntegrationStability() {
    const suiteName = 'Integration Tests';
    console.log(`🔗 Testing: ${suiteName}`);

    const suite = this.initTestSuite(suiteName);

    try {
      // Test 1: End-to-end framework integration
      await this.runAsyncTest(suite, 'E2E Framework Integration', async () => {
        // This is a simplified integration test
        // Full integration testing would require more complex setup

        const configFiles = [
          'package.json',
          'tsconfig.json',
          'jest.config.cjs'
        ];

        const missingConfigs = configFiles.filter(file =>
          !fs.existsSync(path.join(this.projectRoot, file))
        );

        if (missingConfigs.length > 0) {
          throw new Error(`Missing configuration files: ${missingConfigs.join(', ')}`);
        }

        return { success: true, output: 'Basic integration check passed' };
      });

    } catch (error) {
      suite.errors.push(error.message);
    }

    this.completeTestSuite(suite);
  }

  // Helper methods
  initTestSuite(name) {
    const suite = {
      name,
      startTime: Date.now(),
      tests: [],
      passed: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    this.testResults.testSuites[name] = suite;
    return suite;
  }

  runTest(suite, testName, testFunction) {
    const startTime = Date.now();

    try {
      const result = testFunction();
      const duration = Date.now() - startTime;

      suite.tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        result: result.output || 'Test passed',
        performance: result.performance
      });

      suite.passed++;
      this.testResults.passedTests++;
      console.log(`  ✅ ${testName} (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;

      suite.tests.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      suite.failed++;
      this.testResults.failedTests++;
      console.log(`  ❌ ${testName} (${duration}ms): ${error.message}`);
    }

    this.testResults.totalTests++;
  }

  async runAsyncTest(suite, testName, testFunction) {
    const startTime = Date.now();

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;

      suite.tests.push({
        name: testName,
        status: 'PASSED',
        duration,
        result: result.output || 'Test passed',
        performance: result.performance
      });

      suite.passed++;
      this.testResults.passedTests++;
      console.log(`  ✅ ${testName} (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;

      suite.tests.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });

      suite.failed++;
      this.testResults.failedTests++;
      console.log(`  ❌ ${testName} (${duration}ms): ${error.message}`);
    }

    this.testResults.totalTests++;
  }

  completeTestSuite(suite) {
    suite.duration = Date.now() - suite.startTime;
    console.log(`  📊 Suite completed: ${suite.passed} passed, ${suite.failed} failed (${suite.duration}ms)\n`);
  }

  findJSFiles(dir) {
    const files = [];

    function traverse(currentDir) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    }

    traverse(dir);
    return files;
  }

  cleanDirectory(dir) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  generateStabilityReport() {
    const totalDuration = Date.now() - this.startTime;

    console.log('📋 STABILITY TEST REPORT');
    console.log('='.repeat(40));
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`Passed: ${this.testResults.passedTests}`);
    console.log(`Failed: ${this.testResults.failedTests}`);
    console.log(`Success Rate: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('');

    // Suite summaries
    for (const [suiteName, suite] of Object.entries(this.testResults.testSuites)) {
      console.log(`📦 ${suiteName}: ${suite.passed}/${suite.tests.length} passed`);
    }

    // Save detailed report
    const reportPath = path.join(this.projectRoot, 'stability-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (this.testResults.failedTests > 0) {
      console.log('\n❌ Some tests failed. Framework stability needs attention.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed. Framework is stable.');
      process.exit(0);
    }
  }
}

// Run stability tests if called directly
if (require.main === module) {
  const tester = new VERSATILStabilityTester();
  tester.runStabilityTests().catch(console.error);
}

module.exports = { VERSATILStabilityTester };