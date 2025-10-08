/**
 * Ant Design MCP Integration Example
 * Demonstrates community MCP server setup with health monitoring
 *
 * Part of VERSATIL SDLC Framework v5.3.0
 * Production-tested in VERSSAI Enterprise VC Platform
 */

// Note: In actual usage, import from the framework
// const { CommunityMCPHealthMonitor } = require('../../tools/mcp/community-mcp-health-monitor.cjs');

/**
 * Basic Health Check Example
 */
async function basicHealthCheck() {
  console.log('🔍 Running Ant Design MCP health check...\n');

  const CommunityMCPHealthMonitor = require('../../tools/mcp/community-mcp-health-monitor.cjs');

  const config = {
    mcpServers: {
      'antd-components': {
        package: '@jzone-mcp/antd-components-mcp',
        timeout: 10000,
        criticalityLevel: 'medium',
      }
    },
    checkInterval: 300000, // 5 minutes
    logFile: './logs/mcp-health.log',
    alertThreshold: 3,
  };

  const monitor = new CommunityMCPHealthMonitor(config);

  // Run single health check
  const results = await monitor.checkHealth();

  // Handle results
  for (const [serverName, result] of Object.entries(results)) {
    if (result.available) {
      console.log(`✅ ${serverName} is healthy (${result.responseTime}ms)`);
    } else {
      console.error(`❌ ${serverName} failed: ${result.error}`);
    }
  }

  // Print full report
  monitor.printReport();
}

/**
 * Continuous Monitoring Example
 */
async function continuousMonitoring() {
  console.log('👀 Starting continuous MCP monitoring...\n');

  const CommunityMCPHealthMonitor = require('../../tools/mcp/community-mcp-health-monitor.cjs');

  const config = {
    mcpServers: {
      'antd-components': {
        package: '@jzone-mcp/antd-components-mcp',
        timeout: 10000,
        criticalityLevel: 'medium',
      }
    },
    checkInterval: 60000, // Check every minute for demo
    logFile: './logs/mcp-health.log',
    alertThreshold: 3,
  };

  const monitor = new CommunityMCPHealthMonitor(config);

  // Start watching (runs forever)
  await monitor.startWatching();
}

/**
 * Multi-MCP Monitoring Example
 */
async function multiMCPMonitoring() {
  console.log('🔍 Monitoring multiple community MCPs...\n');

  const CommunityMCPHealthMonitor = require('../../tools/mcp/community-mcp-health-monitor.cjs');

  const config = {
    mcpServers: {
      'antd-components': {
        package: '@jzone-mcp/antd-components-mcp',
        timeout: 10000,
        criticalityLevel: 'high', // Critical for frontend development
      },
      // Add more MCPs as needed
      // 'material-ui': {
      //   package: '@example/mui-components-mcp',
      //   timeout: 10000,
      //   criticalityLevel: 'medium',
      // },
    },
    checkInterval: 300000,
    logFile: './logs/mcp-health.log',
    alertThreshold: 3,
  };

  const monitor = new CommunityMCPHealthMonitor(config);
  const results = await monitor.checkHealth();

  monitor.printReport();

  return results;
}

/**
 * Framework Integration Example
 * Shows how to use with VERSATIL agents
 */
async function frameworkIntegration() {
  console.log('🏗️ Framework integration example...\n');

  const CommunityMCPHealthMonitor = require('../../tools/mcp/community-mcp-health-monitor.cjs');

  const monitor = new CommunityMCPHealthMonitor();

  // Check health before generating code
  const health = await monitor.checkHealth();

  if (health['antd-components']?.available) {
    console.log('✅ Ant Design MCP available - using accurate component generation');

    // James (Frontend Agent) can now generate Ant Design code confidently
    // const antdCode = await jamesAgent.generateAntDesignComponent();

  } else {
    console.log('⚠️ Ant Design MCP unavailable - using fallback React code');

    // Fall back to generic React components
    // const genericCode = await jamesAgent.generateGenericReactComponent();
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);

  switch (args[0]) {
    case 'basic':
      await basicHealthCheck();
      break;
    case 'watch':
      await continuousMonitoring();
      break;
    case 'multi':
      await multiMCPMonitoring();
      break;
    case 'framework':
      await frameworkIntegration();
      break;
    default:
      console.log(`
Ant Design MCP Integration Examples

Usage:
  ts-node antd-mcp-example.ts [command]

Commands:
  basic       Run single health check
  watch       Continuous monitoring (every minute)
  multi       Monitor multiple MCPs
  framework   Framework integration example

Examples:
  ts-node antd-mcp-example.ts basic
  ts-node antd-mcp-example.ts watch
      `);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other modules
module.exports = {
  basicHealthCheck,
  continuousMonitoring,
  multiMCPMonitoring,
  frameworkIntegration,
};
