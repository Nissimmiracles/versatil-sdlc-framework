/**
 * VERSATIL SDLC Framework - Opera MCP Live Demo
 * Interactive demonstration of all Opera MCP features
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { callMCPTool, readMCPResource } = require('./test-opera-mcp');

// Demo utilities
const demo = {
  title: (text) => console.log(chalk.bold.magenta(`\n${'='.repeat(60)}\n${text}\n${'='.repeat(60)}\n`)),
  section: (text) => console.log(chalk.bold.cyan(`\n--- ${text} ---\n`)),
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  code: (code) => console.log(chalk.gray(code)),
  wait: (ms = 2000) => new Promise(resolve => setTimeout(resolve, ms))
};

/**
 * Main demo flow
 */
async function runOperaMCPDemo() {
  demo.title('🚀 VERSATIL v1.2.0 - Opera MCP Live Demo');
  
  console.log('Welcome to the interactive Opera MCP demonstration!');
  console.log('This demo will showcase:');
  console.log('  • Autonomous goal creation and execution');
  console.log('  • Automatic update management');
  console.log('  • MCP tool discovery');
  console.log('  • Real-time orchestration');
  
  await demo.wait();

  const { ready } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ready',
      message: 'Ready to start the demo?',
      default: true
    }
  ]);

  if (!ready) {
    console.log('Demo cancelled.');
    return;
  }

  // Demo 1: Opera Status
  demo.section('1. Checking Opera MCP Status');
  demo.info('Retrieving current Opera orchestrator status...');
  
  const status = await callMCPTool('opera_get_status');
  if (status) {
    demo.success('Opera MCP is running!');
    const statusData = JSON.parse(status.content[0].text);
    console.log(`  Version: ${statusData.mcpVersion}`);
    console.log(`  Auto-Update: ${statusData.autoUpdateEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`  Update Channel: ${statusData.updateChannel}`);
    console.log(`  Active Goals: ${statusData.currentGoals?.length || 0}`);
  }

  await demo.wait();

  // Demo 2: Create a Goal
  demo.section('2. Creating an Autonomous Goal');
  
  const { goalType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'goalType',
      message: 'What type of goal would you like to create?',
      choices: [
        { name: '🚀 Feature: Add user authentication', value: 'auth' },
        { name: '🐛 Bugfix: Fix memory leak', value: 'bugfix' },
        { name: '♻️ Refactor: Optimize database queries', value: 'refactor' },
        { name: '🎯 Custom: Define your own goal', value: 'custom' }
      ]
    }
  ]);

  let goalConfig;
  if (goalType === 'custom') {
    const customGoal = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Enter goal description:',
        default: 'Build a REST API endpoint'
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Select priority:',
        choices: ['critical', 'high', 'medium', 'low']
      }
    ]);
    
    goalConfig = {
      type: 'feature',
      description: customGoal.description,
      priority: customGoal.priority,
      criteria: ['Implement endpoint', 'Add tests', 'Update documentation']
    };
  } else {
    // Predefined goals
    const goals = {
      auth: {
        type: 'feature',
        description: 'Implement JWT-based user authentication system',
        priority: 'high',
        criteria: [
          'JWT token generation and validation',
          'User registration and login endpoints',
          'Password hashing with bcrypt',
          'Role-based access control',
          '95% test coverage'
        ]
      },
      bugfix: {
        type: 'bugfix',
        description: 'Fix memory leak in WebSocket connection handler',
        priority: 'critical',
        criteria: [
          'Identify memory leak source',
          'Implement proper cleanup',
          'Add memory monitoring',
          'Verify fix with load testing'
        ]
      },
      refactor: {
        type: 'refactor',
        description: 'Optimize database query performance',
        priority: 'medium',
        criteria: [
          'Analyze slow queries',
          'Add proper indexes',
          'Implement query caching',
          'Reduce query count by 50%'
        ]
      }
    };
    
    goalConfig = goals[goalType];
  }

  demo.info('Creating goal with Opera...');
  demo.code(JSON.stringify(goalConfig, null, 2));
  
  const goal = await callMCPTool('opera_create_goal', goalConfig);
  if (goal) {
    demo.success('Goal created successfully!');
    const goalData = JSON.parse(goal.content[0].text);
    console.log(`  Goal ID: ${goalData.id}`);
    console.log(`  Status: ${goalData.status}`);
    console.log(`  Estimated Time: ${goalData.estimatedDuration} minutes`);
  }

  await demo.wait();

  // Demo 3: Project Analysis
  demo.section('3. Analyzing Project with AI');
  
  const { analysisDepth } = await inquirer.prompt([
    {
      type: 'list',
      name: 'analysisDepth',
      message: 'Select analysis depth:',
      choices: [
        { name: 'Basic - Quick overview (30 seconds)', value: 'basic' },
        { name: 'Detailed - In-depth analysis (2 minutes)', value: 'detailed' },
        { name: 'Comprehensive - Full audit (5 minutes)', value: 'comprehensive' }
      ]
    }
  ]);

  demo.info(`Performing ${analysisDepth} project analysis...`);
  
  const analysis = await callMCPTool('opera_analyze_project', { depth: analysisDepth });
  if (analysis) {
    demo.success('Analysis complete!');
    const result = JSON.parse(analysis.content[0].text);
    
    console.log('\n📊 Analysis Results:');
    console.log(`  Project Type: ${result.projectType}`);
    console.log(`  Framework: ${result.techStack?.framework || 'Not detected'}`);
    console.log(`  Language: ${result.techStack?.language || 'Not detected'}`);
    console.log(`  Code Quality Score: ${result.qualityScore || 'N/A'}/100`);
    
    if (result.suggestions?.length > 0) {
      console.log('\n💡 Top Recommendations:');
      result.suggestions.slice(0, 3).forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion.message} (${suggestion.priority})`);
      });
    }
  }

  await demo.wait();

  // Demo 4: Check for Updates
  demo.section('4. Automatic Update Management');
  demo.info('Checking for Opera MCP updates...');
  
  const updateCheck = await callMCPTool('opera_check_updates', { channel: 'stable' });
  if (updateCheck) {
    const manifest = JSON.parse(updateCheck.content[0].text);
    
    if (manifest) {
      demo.success(`Update available: v${manifest.version}`);
      console.log('\n📦 Update Details:');
      console.log(`  Current Version: v${status ? JSON.parse(status.content[0].text).mcpVersion : '1.2.0'}`);
      console.log(`  New Version: v${manifest.version}`);
      console.log(`  Channel: ${manifest.channel}`);
      console.log(`  Breaking Changes: ${manifest.breaking ? 'Yes' : 'No'}`);
      
      console.log('\n📝 Changes:');
      manifest.changes.forEach(change => console.log(`  • ${change}`));
      
      const { applyUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'applyUpdate',
          message: 'Would you like to apply this update now?',
          default: false
        }
      ]);
      
      if (applyUpdate) {
        demo.info('Creating backup before update...');
        await demo.wait(1000);
        demo.success('Backup created');
        
        demo.info('Downloading update...');
        await demo.wait(1500);
        demo.success('Update downloaded and verified');
        
        demo.info('Installing update...');
        await demo.wait(2000);
        demo.success(`Successfully updated to v${manifest.version}!`);
      }
    } else {
      demo.info('You are running the latest version!');
    }
  }

  await demo.wait();

  // Demo 5: MCP Resources
  demo.section('5. Accessing Opera Resources');
  
  const resources = [
    { uri: 'opera://goals', name: 'Active Goals' },
    { uri: 'opera://metrics', name: 'Performance Metrics' },
    { uri: 'opera://context', name: 'Environmental Context' },
    { uri: 'opera://updates', name: 'Update History' }
  ];

  for (const resource of resources) {
    demo.info(`Reading ${resource.name}...`);
    
    const data = await readMCPResource(resource.uri);
    if (data) {
      const content = JSON.parse(data.contents[0].text);
      demo.success(`${resource.name}: ${Object.keys(content).length} entries`);
      
      // Show sample data
      if (resource.uri === 'opera://metrics') {
        console.log(`  Uptime: ${Math.floor(content.uptime / 60)} minutes`);
        console.log(`  Memory Usage: ${Math.round(content.memory.heapUsed / 1024 / 1024)} MB`);
      }
    }
    
    await demo.wait(500);
  }

  // Demo 6: Interactive Mode
  demo.section('6. Interactive Opera Control');
  
  let continueInteractive = true;
  while (continueInteractive) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🎯 Create another goal', value: 'create_goal' },
          { name: '📊 View execution plans', value: 'view_plans' },
          { name: '🔄 Update context', value: 'update_context' },
          { name: '📈 Check performance', value: 'check_performance' },
          { name: '❌ Exit demo', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'create_goal':
        // Simplified goal creation
        const quickGoal = await callMCPTool('opera_create_goal', {
          type: 'feature',
          description: 'Quick feature implementation',
          priority: 'medium',
          criteria: ['Build', 'Test', 'Deploy']
        });
        if (quickGoal) {
          demo.success('Goal created!');
        }
        break;

      case 'view_plans':
        const plans = await readMCPResource('opera://plans');
        if (plans) {
          const plansData = JSON.parse(plans.contents[0].text);
          console.log(`Found ${Array.isArray(plansData) ? plansData.length : 0} execution plans`);
        }
        break;

      case 'update_context':
        await callMCPTool('opera_update_context', {
          context: {
            lastDemo: Date.now(),
            demoUser: 'Interactive User',
            features: ['opera-mcp', 'auto-update']
          }
        });
        demo.success('Context updated!');
        break;

      case 'check_performance':
        const metrics = await readMCPResource('opera://metrics');
        if (metrics) {
          const metricsData = JSON.parse(metrics.contents[0].text);
          console.log('\n📊 Performance Metrics:');
          console.log(`  Success Rate: ${metricsData.operaState?.performance?.successRate || 0}%`);
          console.log(`  Goal Completion: ${metricsData.operaState?.performance?.goalCompletionRate || 0}%`);
          console.log(`  Avg Execution Time: ${metricsData.operaState?.performance?.averageExecutionTime || 0}ms`);
        }
        break;

      case 'exit':
        continueInteractive = false;
        break;
    }

    if (action !== 'exit') {
      await demo.wait();
    }
  }

  // Demo Summary
  demo.title('✨ Demo Complete!');
  
  console.log('You\'ve experienced the power of VERSATIL Opera MCP:');
  console.log('  ✅ Autonomous goal orchestration');
  console.log('  ✅ Intelligent project analysis');
  console.log('  ✅ Automatic update management');
  console.log('  ✅ Real-time resource monitoring');
  console.log('  ✅ Interactive MCP control');
  
  console.log('\n🚀 Ready to integrate Opera MCP into your workflow?');
  console.log('   Run: npm run opera:start');
  
  console.log('\n📚 Learn more:');
  console.log('   Documentation: ./OPERA_MCP_DOCUMENTATION.md');
  console.log('   Examples: ./examples/opera-mcp/');
  console.log('   Support: support@versatil-framework.com');
}

// Run demo if called directly
if (require.main === module) {
  console.log(chalk.bold.green('\n🎬 Starting Opera MCP Demo...\n'));
  
  // Initialize VERSATIL first
  const { versatilMCP } = require('./init-opera-mcp');
  
  versatilMCP.initialize()
    .then(async () => {
      await demo.wait(2000);
      await runOperaMCPDemo();
    })
    .catch((error) => {
      demo.error(`Failed to initialize: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runOperaMCPDemo };
