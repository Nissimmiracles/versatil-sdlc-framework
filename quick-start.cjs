#!/usr/bin/env node

/**
 * VERSATIL Quick Start - Run without building
 * This starts VERSATIL immediately without TypeScript compilation
 */

const chalk = require('chalk');
const { spawn } = require('child_process');

console.log(chalk.bold.cyan(`
╔════════════════════════════════════════════════════════════════╗
║              VERSATIL v1.2.1 - Quick Start                     ║
║                  No Build Required! 🚀                         ║
╚════════════════════════════════════════════════════════════════╝
`));

console.log(chalk.yellow('Starting VERSATIL without TypeScript compilation...\n'));

// Install minimal required dependencies
console.log(chalk.blue('📦 Installing minimal dependencies...'));
const installDeps = spawn('npm', ['install', '--no-save', 'chalk', 'dotenv', 'inquirer'], {
  stdio: 'inherit',
  shell: true
});

installDeps.on('close', (code) => {
  if (code !== 0) {
    console.log(chalk.red('⚠️  Some dependencies might already be installed'));
  }
  
  console.log(chalk.green('\n✅ Ready to start!\n'));
  
  console.log(chalk.bold('Choose what to run:\n'));
  console.log(chalk.cyan('1. Self-Referential Test') + ' - VERSATIL analyzes itself');
  console.log(chalk.cyan('2. Enhanced Onboarding') + ' - Interactive project setup');
  console.log(chalk.cyan('3. Archon MCP Test') + ' - Test the orchestrator');
  console.log(chalk.cyan('4. Context Awareness Demo') + ' - See full context scanning');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question(chalk.yellow('\nEnter your choice (1-4): '), (answer) => {
    rl.close();
    
    let script;
    switch(answer) {
      case '1':
        script = 'test-self-referential.cjs';
        break;
      case '2':
        script = 'enhanced-onboarding.cjs';
        break;
      case '3':
        script = 'test-archon-mcp.js';
        break;
      case '4':
        script = 'context-awareness-demo.cjs';
        break;
      default:
        console.log(chalk.red('Invalid choice!'));
        process.exit(1);
    }
    
    console.log(chalk.green(`\n🚀 Starting ${script}...\n`));
    
    const child = spawn('node', [script], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        DEBUG_MODE: 'true',
        LOG_LEVEL: 'debug'
      }
    });
    
    child.on('error', (error) => {
      console.error(chalk.red(`Error: ${error.message}`));
    });
  });
});
