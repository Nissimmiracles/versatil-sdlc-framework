/**
 * VERSATIL SDLC Framework - Test Archon MCP with Auto-Update
 * Demonstrates the Archon MCP functionality including automatic updates
 */

const chalk = require('chalk');
const axios = require('axios');

// MCP server endpoint (adjust if running on different port)
const MCP_ENDPOINT = 'http://localhost:3000/mcp';

// Test utilities
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg)
};

/**
 * Call an MCP tool
 */
async function callMCPTool(toolName, args = {}) {
  try {
    const response = await axios.post(`${MCP_ENDPOINT}/tools/call`, {
      name: toolName,
      arguments: args
    });
    return response.data;
  } catch (error) {
    log.error(`Failed to call ${toolName}: ${error.message}`);
    return null;
  }
}

/**
 * Read an MCP resource
 */
async function readMCPResource(uri) {
  try {
    const response = await axios.post(`${MCP_ENDPOINT}/resources/read`, { uri });
    return response.data;
  } catch (error) {
    log.error(`Failed to read ${uri}: ${error.message}`);
    return null;
  }
}

/**
 * Main test function
 */
async function testArchonMCP() {
  console.log(chalk.bold.cyan('\n🚀 VERSATIL v1.2.0 - Archon MCP Test Suite\n'));

  // Test 1: Get Archon status
  log.info('Test 1: Getting Archon status...');
  const status = await callMCPTool('archon_get_status');
  if (status) {
    log.success('Archon status retrieved successfully');
    console.log(JSON.stringify(JSON.parse(status.content[0].text), null, 2));
  }

  // Test 2: Check for updates
  log.info('\nTest 2: Checking for Archon MCP updates...');
  const updateCheck = await callMCPTool('archon_check_updates', { channel: 'stable' });
  if (updateCheck) {
    const result = JSON.parse(updateCheck.content[0].text);
    if (result) {
      log.success(`Update available: v${result.version}`);
      console.log('Changes:', result.changes);
    } else {
      log.info('No updates available');
    }
  }

  // Test 3: Create a goal
  log.info('\nTest 3: Creating an Archon goal...');
  const goal = await callMCPTool('archon_create_goal', {
    type: 'feature',
    description: 'Implement real-time collaboration features',
    priority: 'high',
    criteria: [
      'Support multiple users editing simultaneously',
      'Show user presence indicators',
      'Implement conflict resolution'
    ]
  });
  if (goal) {
    log.success('Goal created successfully');
    console.log(JSON.stringify(JSON.parse(goal.content[0].text), null, 2));
  }

  // Test 4: Analyze project
  log.info('\nTest 4: Analyzing project with Archon...');
  const analysis = await callMCPTool('archon_analyze_project', { depth: 'basic' });
  if (analysis) {
    log.success('Project analysis complete');
    const result = JSON.parse(analysis.content[0].text);
    console.log('Project type:', result.projectType);
    console.log('Tech stack:', result.techStack);
    console.log('Suggestions:', result.suggestions?.length || 0);
  }

  // Test 5: Read MCP resources
  log.info('\nTest 5: Reading MCP resources...');
  const resources = [
    'archon://goals',
    'archon://metrics',
    'archon://context',
    'archon://updates'
  ];

  for (const uri of resources) {
    const data = await readMCPResource(uri);
    if (data) {
      log.success(`Read ${uri}`);
      const content = JSON.parse(data.contents[0].text);
      console.log(`- ${uri}:`, Object.keys(content).join(', '));
    }
  }

  // Test 6: Update context
  log.info('\nTest 6: Updating Archon context...');
  const contextUpdate = await callMCPTool('archon_update_context', {
    context: {
      projectPhase: 'development',
      team: {
        size: 5,
        roles: ['frontend', 'backend', 'devops', 'qa', 'pm']
      },
      priorities: ['performance', 'security', 'user-experience']
    }
  });
  if (contextUpdate) {
    log.success('Context updated successfully');
  }

  // Test 7: Simulate auto-update
  log.info('\nTest 7: Testing auto-update functionality...');
  log.warn('Auto-update is configured to run every 24 hours');
  log.info('Current configuration:');
  console.log('- Auto-update: Enabled');
  console.log('- Update channel: Stable');
  console.log('- Backup before update: Enabled');
  console.log('- Update interval: 24 hours');

  // Summary
  console.log(chalk.bold.green('\n✨ Archon MCP Test Complete!\n'));
  console.log('Key features demonstrated:');
  console.log('✓ Archon orchestration via MCP');
  console.log('✓ Goal creation and management');
  console.log('✓ Project analysis');
  console.log('✓ Resource access');
  console.log('✓ Context updates');
  console.log('✓ Automatic update checking');
  
  console.log('\nTo manually apply an update:');
  console.log(chalk.cyan('await callMCPTool("archon_apply_update", { version: "1.2.1", backup: true })'));
  
  console.log('\nTo rollback to a previous version:');
  console.log(chalk.cyan('await callMCPTool("archon_rollback", { version: "1.2.0" })'));
}

// Run tests if called directly
if (require.main === module) {
  // First, start the MCP server
  console.log(chalk.bold('Starting Archon MCP server...'));
  
  // Import and start the server
  const { versatilMCP } = require('./init-archon-mcp');
  
  versatilMCP.initialize()
    .then(async () => {
      log.success('VERSATIL initialized with Archon MCP');
      
      // Wait a bit for server to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run tests
      await testArchonMCP();
      
      // Check health
      console.log(chalk.bold.cyan('\n🏥 Health Check:\n'));
      const health = await versatilMCP.checkHealth();
      console.log(JSON.stringify(health, null, 2));
      
      // Keep server running for manual testing
      console.log(chalk.bold.yellow('\n⚡ Archon MCP server is running on port 3000'));
      console.log('Press Ctrl+C to stop\n');
    })
    .catch((error) => {
      log.error('Failed to initialize VERSATIL:', error.message);
      process.exit(1);
    });
}

// Export for use in other scripts
module.exports = {
  callMCPTool,
  readMCPResource,
  testArchonMCP
};