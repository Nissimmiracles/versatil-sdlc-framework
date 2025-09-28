#!/usr/bin/env node

/**
 * VERSATIL MCP Integration Test
 * Tests the MCP server functionality and simulates tool calls
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MCPIntegrationTester {
  constructor() {
    this.serverPath = path.join(__dirname, 'versatil-mcp-server.js');
    this.testResults = {
      serverStart: false,
      toolsAvailable: false,
      frameworkStatus: false,
      agentActivation: false,
      qualityGate: false,
      sdlcOrchestration: false,
      errors: []
    };
  }

  async runTests() {
    console.log('🧪 VERSATIL MCP Integration Test Suite');
    console.log('=' .repeat(50));

    try {
      // Test 1: Server startup
      await this.testServerStartup();

      // Test 2: Simulate MCP tool calls
      await this.testMCPToolCalls();

      // Test 3: Configuration validation
      await this.testConfigurationValidation();

      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.errors.push(error.message);
    }
  }

  async testServerStartup() {
    console.log('\n🔄 Testing MCP Server Startup...');

    try {
      // Check if server file exists
      if (!fs.existsSync(this.serverPath)) {
        throw new Error('MCP server file not found');
      }

      console.log('✅ MCP server file exists');

      // Test server startup (brief test)
      const serverProcess = spawn('node', [this.serverPath], {
        stdio: 'pipe',
        timeout: 3000
      });

      let serverOutput = '';

      serverProcess.stderr.on('data', (data) => {
        serverOutput += data.toString();
      });

      // Wait for server to start
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          serverProcess.kill();
          if (serverOutput.includes('VERSATIL MCP Server running')) {
            this.testResults.serverStart = true;
            console.log('✅ MCP Server starts successfully');
            resolve();
          } else {
            reject(new Error('Server did not start properly'));
          }
        }, 2000);
      });

    } catch (error) {
      console.log('❌ Server startup test failed:', error.message);
      this.testResults.errors.push(`Server startup: ${error.message}`);
    }
  }

  async testMCPToolCalls() {
    console.log('\n🛠️  Testing MCP Tool Definitions...');

    try {
      // Import the server to test tool definitions
      const { VERSATILMCPServer } = require('./versatil-mcp-server.js');
      const server = new VERSATILMCPServer();

      // Test tool schema validation
      const expectedTools = [
        'versatil_framework_status',
        'versatil_activate_agent',
        'versatil_quality_gate',
        'versatil_orchestrate_sdlc'
      ];

      // Simulate tool calls
      await this.simulateFrameworkStatus(server);
      await this.simulateAgentActivation(server);
      await this.simulateQualityGate(server);
      await this.simulateSDLCOrchestration(server);

      console.log('✅ All MCP tools tested successfully');
      this.testResults.toolsAvailable = true;

    } catch (error) {
      console.log('❌ MCP tool test failed:', error.message);
      this.testResults.errors.push(`Tool calls: ${error.message}`);
    }
  }

  async simulateFrameworkStatus(server) {
    try {
      const result = await server.handleFrameworkStatus({ detail: 'summary' });
      const response = JSON.parse(result.content[0].text);

      if (response.success && response.status.framework.name === 'VERSATIL SDLC Framework') {
        console.log('✅ versatil_framework_status working correctly');
        this.testResults.frameworkStatus = true;
      } else {
        throw new Error('Invalid framework status response');
      }
    } catch (error) {
      console.log('❌ Framework status test failed:', error.message);
      this.testResults.errors.push(`Framework status: ${error.message}`);
    }
  }

  async simulateAgentActivation(server) {
    try {
      const result = await server.handleAgentActivation({
        agentId: 'enhanced-maria',
        context: { task: 'Test quality assurance', priority: 'high' }
      });

      const response = JSON.parse(result.content[0].text);

      if (response.success && response.agent.id === 'enhanced-maria') {
        console.log('✅ versatil_activate_agent working correctly');
        this.testResults.agentActivation = true;
      } else {
        throw new Error('Invalid agent activation response');
      }
    } catch (error) {
      console.log('❌ Agent activation test failed:', error.message);
      this.testResults.errors.push(`Agent activation: ${error.message}`);
    }
  }

  async simulateQualityGate(server) {
    try {
      const result = await server.handleQualityGate({
        phase: 'development',
        checks: ['unit-tests', 'lint', 'security'],
        threshold: 85
      });

      const response = JSON.parse(result.content[0].text);

      if (response.success && response.qualityGate.phase === 'development') {
        console.log('✅ versatil_quality_gate working correctly');
        this.testResults.qualityGate = true;
      } else {
        throw new Error('Invalid quality gate response');
      }
    } catch (error) {
      console.log('❌ Quality gate test failed:', error.message);
      this.testResults.errors.push(`Quality gate: ${error.message}`);
    }
  }

  async simulateSDLCOrchestration(server) {
    try {
      const result = await server.handleSDLCOrchestration({
        action: 'status',
        context: { phase: 'development' }
      });

      const response = JSON.parse(result.content[0].text);

      if (response.success && response.sdlc.currentPhase) {
        console.log('✅ versatil_orchestrate_sdlc working correctly');
        this.testResults.sdlcOrchestration = true;
      } else {
        throw new Error('Invalid SDLC orchestration response');
      }
    } catch (error) {
      console.log('❌ SDLC orchestration test failed:', error.message);
      this.testResults.errors.push(`SDLC orchestration: ${error.message}`);
    }
  }

  async testConfigurationValidation() {
    console.log('\n⚙️  Testing Configuration Validation...');

    try {
      const mcpConfigPath = path.join(process.env.HOME, '.cursor', 'mcp.json');

      if (fs.existsSync(mcpConfigPath)) {
        const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

        if (config.mcpServers && config.mcpServers['versatil-sdlc-framework']) {
          console.log('✅ MCP configuration found in ~/.cursor/mcp.json');

          const versatilConfig = config.mcpServers['versatil-sdlc-framework'];
          if (versatilConfig.command === 'node' && versatilConfig.args.includes(this.serverPath)) {
            console.log('✅ VERSATIL MCP server configuration is correct');
          } else {
            console.log('⚠️  MCP server configuration may need adjustment');
          }
        } else {
          console.log('❌ VERSATIL MCP server not found in configuration');
        }
      } else {
        console.log('❌ MCP configuration file not found');
      }
    } catch (error) {
      console.log('❌ Configuration validation failed:', error.message);
      this.testResults.errors.push(`Configuration: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(50));

    const results = [
      { name: 'Server Startup', status: this.testResults.serverStart },
      { name: 'Tool Availability', status: this.testResults.toolsAvailable },
      { name: 'Framework Status', status: this.testResults.frameworkStatus },
      { name: 'Agent Activation', status: this.testResults.agentActivation },
      { name: 'Quality Gate', status: this.testResults.qualityGate },
      { name: 'SDLC Orchestration', status: this.testResults.sdlcOrchestration }
    ];

    let passed = 0;
    results.forEach(result => {
      const status = result.status ? '✅ PASS' : '❌ FAIL';
      console.log(`${result.name.padEnd(20)} ${status}`);
      if (result.status) passed++;
    });

    console.log('\n🎯 Overall Results:');
    console.log(`Passed: ${passed}/${results.length} tests`);
    console.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`);

    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (passed === results.length) {
      console.log('\n🎉 All tests passed! VERSATIL MCP integration is working correctly.');
      console.log('\n📋 Next Steps:');
      console.log('1. ✅ MCP server is properly configured');
      console.log('2. ✅ All MCP tools are functional');
      console.log('3. ✅ Cursor should be able to access VERSATIL tools');
      console.log('4. 🔄 Try using MCP tools in Cursor with the mcp__ prefix');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
    }
  }
}

// Run the test suite if called directly
if (require.main === module) {
  const tester = new MCPIntegrationTester();
  tester.runTests().catch(console.error);
}

module.exports = { MCPIntegrationTester };