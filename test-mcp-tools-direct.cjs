#!/usr/bin/env node

/**
 * Direct MCP Tools Test
 * Tests direct communication with MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

class DirectMCPTester {
  constructor() {
    this.serverPath = path.join(__dirname, 'versatil-mcp-server.js');
  }

  async testDirectCommunication() {
    console.log('🔌 Testing Direct MCP Communication');
    console.log('=' .repeat(50));

    try {
      const server = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Test 1: List Tools Request
      await this.testListTools(server);

      // Test 2: Call Framework Status Tool
      await this.testFrameworkStatusTool(server);

      // Test 3: Call Agent Activation Tool
      await this.testAgentActivationTool(server);

      server.kill();
      console.log('\n✅ Direct MCP communication test completed successfully');

    } catch (error) {
      console.error('❌ Direct MCP test failed:', error.message);
    }
  }

  async testListTools(server) {
    console.log('\n📋 Testing List Tools Request...');

    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    return new Promise((resolve, reject) => {
      let response = '';

      server.stdout.on('data', (data) => {
        response += data.toString();
        try {
          const parsed = JSON.parse(response.trim());
          if (parsed.id === 1) {
            console.log('✅ Received tools list response');
            console.log(`📊 Found ${parsed.result.tools.length} tools:`);
            parsed.result.tools.forEach(tool => {
              console.log(`   - ${tool.name}: ${tool.description}`);
            });
            resolve(parsed);
          }
        } catch (e) {
          // JSON might be incomplete, continue reading
        }
      });

      server.stderr.on('data', (data) => {
        console.log('Server started:', data.toString());
      });

      setTimeout(() => {
        server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
      }, 1000);

      setTimeout(() => {
        if (!response) {
          reject(new Error('No response received for list tools'));
        }
      }, 5000);
    });
  }

  async testFrameworkStatusTool(server) {
    console.log('\n🏛️  Testing Framework Status Tool...');

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'versatil_framework_status',
        arguments: { detail: 'summary' }
      }
    };

    return new Promise((resolve, reject) => {
      let response = '';
      let responseReceived = false;

      server.stdout.on('data', (data) => {
        response += data.toString();
        try {
          const lines = response.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed.id === 2 && !responseReceived) {
              responseReceived = true;
              console.log('✅ Framework status tool responded successfully');
              const content = JSON.parse(parsed.result.content[0].text);
              console.log(`📊 Framework: ${content.status.framework.name} v${content.status.framework.version}`);
              console.log(`📊 Status: ${content.status.framework.status}`);
              console.log(`📊 Active Agents: ${content.status.agents.active}/${content.status.agents.total}`);
              resolve(parsed);
              break;
            }
          }
        } catch (e) {
          // JSON might be incomplete or mixed with other data
        }
      });

      setTimeout(() => {
        server.stdin.write(JSON.stringify(toolCallRequest) + '\n');
      }, 2000);

      setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('No response received for framework status'));
        }
      }, 8000);
    });
  }

  async testAgentActivationTool(server) {
    console.log('\n🤖 Testing Agent Activation Tool...');

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'versatil_activate_agent',
        arguments: {
          agentId: 'enhanced-maria',
          context: {
            task: 'Quality assurance testing',
            priority: 'high'
          }
        }
      }
    };

    return new Promise((resolve, reject) => {
      let response = '';
      let responseReceived = false;

      server.stdout.on('data', (data) => {
        response += data.toString();
        try {
          const lines = response.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed.id === 3 && !responseReceived) {
              responseReceived = true;
              console.log('✅ Agent activation tool responded successfully');
              const content = JSON.parse(parsed.result.content[0].text);
              console.log(`🤖 Activated: ${content.agent.name}`);
              console.log(`📋 Specialization: ${content.agent.specialization}`);
              console.log(`⚡ Status: ${content.agent.status}`);
              resolve(parsed);
              break;
            }
          }
        } catch (e) {
          // JSON might be incomplete or mixed with other data
        }
      });

      setTimeout(() => {
        server.stdin.write(JSON.stringify(toolCallRequest) + '\n');
      }, 3000);

      setTimeout(() => {
        if (!responseReceived) {
          reject(new Error('No response received for agent activation'));
        }
      }, 10000);
    });
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new DirectMCPTester();
  tester.testDirectCommunication().catch(console.error);
}

module.exports = { DirectMCPTester };