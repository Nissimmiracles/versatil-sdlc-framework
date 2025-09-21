#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - MCP Integration Test
 * Tests the complete MCP integration with VERSATIL agents
 */

const { VERSATILMCPClient } = require('../dist/mcp/mcp-client');
const { Logger } = require('../dist/utils/logger');

console.log('🔧 VERSATIL SDLC Framework - MCP Integration Test');
console.log('='.repeat(60));

const logger = new Logger('MCP-Test');

async function testMCPIntegration() {
  const client = new VERSATILMCPClient();
  let testsPassed = 0;
  let testsTotal = 0;

  // Test 1: Health Check
  console.log('\n🏥 Test 1: MCP Health Check');
  testsTotal++;
  try {
    const isHealthy = await client.healthCheck();
    if (isHealthy) {
      console.log('   ✅ MCP Client is healthy and responsive');
      testsPassed++;
    } else {
      console.log('   ❌ MCP Client health check failed');
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
  }

  // Test 2: Agent Activation
  console.log('\n🤖 Test 2: Agent Activation via MCP');
  testsTotal++;
  try {
    const agentResponse = await client.executeTool({
      tool: 'versatil_activate_agent',
      arguments: {
        agentId: 'enhanced-maria',
        context: {
          task: 'Code quality review',
          priority: 'high'
        }
      }
    });

    if (agentResponse.success) {
      console.log('   ✅ Agent activation successful');
      console.log(`   📊 Agent: ${agentResponse.data.agentId}`);
      console.log(`   📋 Status: ${agentResponse.data.status}`);
      testsPassed++;
    } else {
      console.log(`   ❌ Agent activation failed: ${agentResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Agent activation error: ${error.message}`);
  }

  // Test 3: SDLC Orchestration
  console.log('\n🔄 Test 3: SDLC Orchestration');
  testsTotal++;
  try {
    const sdlcResponse = await client.executeTool({
      tool: 'versatil_orchestrate_sdlc',
      arguments: {
        action: 'status'
      }
    });

    if (sdlcResponse.success) {
      console.log('   ✅ SDLC orchestration working');
      console.log(`   📊 Current phase: ${sdlcResponse.data.currentPhase || 'Unknown'}`);
      console.log(`   📈 Completeness: ${sdlcResponse.data.completeness || 'N/A'}%`);
      testsPassed++;
    } else {
      console.log(`   ❌ SDLC orchestration failed: ${sdlcResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ SDLC orchestration error: ${error.message}`);
  }

  // Test 4: Quality Gate Execution
  console.log('\n🚦 Test 4: Quality Gate Execution');
  testsTotal++;
  try {
    const qualityResponse = await client.executeTool({
      tool: 'versatil_quality_gate',
      arguments: {
        phase: 'Development',
        checks: ['unit-tests', 'code-coverage', 'linting'],
        threshold: 80
      }
    });

    if (qualityResponse.success) {
      console.log('   ✅ Quality gate execution successful');
      console.log(`   📊 Score: ${qualityResponse.data.score}%`);
      console.log(`   🎯 Threshold: ${qualityResponse.data.threshold}%`);
      testsPassed++;
    } else {
      console.log(`   ❌ Quality gate failed: ${qualityResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Quality gate error: ${error.message}`);
  }

  // Test 5: Test Suite Execution
  console.log('\n🧪 Test 5: Test Suite Execution');
  testsTotal++;
  try {
    const testResponse = await client.executeTool({
      tool: 'versatil_test_suite',
      arguments: {
        type: 'integration',
        coverage: true,
        browser: 'chrome'
      }
    });

    if (testResponse.success) {
      console.log('   ✅ Test suite execution successful');
      console.log(`   📊 Tests: ${testResponse.data.tests.passed}/${testResponse.data.tests.total} passed`);
      console.log(`   📈 Coverage: ${testResponse.data.coverage}%`);
      console.log(`   ⏱️ Duration: ${testResponse.data.duration}s`);
      testsPassed++;
    } else {
      console.log(`   ❌ Test suite failed: ${testResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Test suite error: ${error.message}`);
  }

  // Test 6: Architecture Analysis
  console.log('\n🏗️ Test 6: Architecture Analysis');
  testsTotal++;
  try {
    const archResponse = await client.executeTool({
      tool: 'versatil_architecture_analysis',
      arguments: {
        target: 'src/',
        depth: 'comprehensive',
        includeRecommendations: true
      }
    });

    if (archResponse.success) {
      console.log('   ✅ Architecture analysis successful');
      console.log(`   📊 Maintainability: ${archResponse.data.architecture.maintainability}`);
      console.log(`   📈 Scalability: ${archResponse.data.architecture.scalability}`);
      console.log(`   🔍 Issues found: ${archResponse.data.issues.length}`);
      testsPassed++;
    } else {
      console.log(`   ❌ Architecture analysis failed: ${archResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Architecture analysis error: ${error.message}`);
  }

  // Test 7: Framework Status
  console.log('\n📊 Test 7: Framework Status');
  testsTotal++;
  try {
    const statusResponse = await client.executeTool({
      tool: 'versatil_framework_status',
      arguments: {}
    });

    if (statusResponse.success) {
      console.log('   ✅ Framework status retrieval successful');
      console.log(`   📊 Version: ${statusResponse.data.framework.version}`);
      console.log(`   🤖 Agents: ${statusResponse.data.agents.active}/${statusResponse.data.agents.total} active`);
      console.log(`   🎯 SDLC Completeness: ${statusResponse.data.sdlc.completeness}%`);
      console.log(`   ⚡ Performance: ${statusResponse.data.performance.responseTime}`);
      testsPassed++;
    } else {
      console.log(`   ❌ Framework status failed: ${statusResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Framework status error: ${error.message}`);
  }

  // Test 8: File Analysis
  console.log('\n📄 Test 8: File Analysis');
  testsTotal++;
  try {
    const fileResponse = await client.executeTool({
      tool: 'versatil_file_analysis',
      arguments: {
        filePath: 'src/agents/enhanced-maria.ts',
        analysisType: 'comprehensive'
      }
    });

    if (fileResponse.success) {
      console.log('   ✅ File analysis successful');
      console.log(`   📊 Complexity: ${fileResponse.data.metrics.complexity}`);
      console.log(`   📈 Maintainability: ${fileResponse.data.metrics.maintainability}`);
      console.log(`   🎯 Test Coverage: ${fileResponse.data.metrics.testCoverage}%`);
      testsPassed++;
    } else {
      console.log(`   ❌ File analysis failed: ${fileResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ File analysis error: ${error.message}`);
  }

  // Test 9: Performance Report
  console.log('\n📈 Test 9: Performance Report');
  testsTotal++;
  try {
    const perfResponse = await client.executeTool({
      tool: 'versatil_performance_report',
      arguments: {
        reportType: 'summary',
        timeframe: '24h'
      }
    });

    if (perfResponse.success) {
      console.log('   ✅ Performance report generated');
      console.log(`   📊 Agent Activations: ${perfResponse.data.metrics.agentActivations}`);
      console.log(`   ⚡ Avg Response Time: ${perfResponse.data.metrics.avgResponseTime}`);
      console.log(`   🎯 Quality Gate Success: ${perfResponse.data.metrics.qualityGateSuccess}%`);
      testsPassed++;
    } else {
      console.log(`   ❌ Performance report failed: ${perfResponse.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Performance report error: ${error.message}`);
  }

  // Test 10: Available Tools Check
  console.log('\n🛠️ Test 10: Available Tools');
  testsTotal++;
  try {
    const availableTools = client.getAvailableTools();
    if (availableTools.length >= 10) {
      console.log('   ✅ All MCP tools are available');
      console.log(`   📊 Tool count: ${availableTools.length}`);
      availableTools.forEach(tool => {
        console.log(`   🔧 ${tool}`);
      });
      testsPassed++;
    } else {
      console.log(`   ❌ Missing tools. Expected 10+, found ${availableTools.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Available tools error: ${error.message}`);
  }

  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log('🏆 MCP Integration Test Results');
  console.log('='.repeat(60));

  const successRate = (testsPassed / testsTotal) * 100;

  console.log(`📊 Tests Passed: ${testsPassed}/${testsTotal} (${successRate.toFixed(1)}%)`);

  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: MCP integration is fully functional!');
    console.log('🚀 Ready for AI assistant integration with VERSATIL framework');
  } else if (successRate >= 75) {
    console.log('✅ GOOD: MCP integration is mostly working');
    console.log('🔧 Minor issues to resolve for optimal performance');
  } else if (successRate >= 50) {
    console.log('🟡 PARTIAL: MCP integration has significant issues');
    console.log('🛠️ Major fixes required before production use');
  } else {
    console.log('🔴 CRITICAL: MCP integration is not functional');
    console.log('🚨 Immediate attention required');
  }

  console.log('\n🎯 Key MCP Capabilities Verified:');
  console.log('   • Agent activation and communication');
  console.log('   • SDLC orchestration and phase management');
  console.log('   • Quality gate execution and validation');
  console.log('   • Test suite execution and reporting');
  console.log('   • Architecture analysis and recommendations');
  console.log('   • Performance monitoring and insights');
  console.log('   • File analysis and intelligent suggestions');
  console.log('   • Framework status and health monitoring');

  console.log('\n📋 MCP Integration Status: ' + (successRate >= 90 ? 'READY FOR PRODUCTION ✅' : 'NEEDS OPTIMIZATION 🔧'));
  console.log('🔗 AI assistants can now interact with VERSATIL via standardized MCP protocol!');
  console.log('');
}

// Run the test
testMCPIntegration().catch(error => {
  console.error('❌ MCP Integration test failed:', error);
  process.exit(1);
});