#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Enhanced Features Setup
 * Quick setup script for RAG and Opera features
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
🚀 VERSATIL SDLC Framework v1.2.0 - Enhanced Setup
==================================================

This script will help you set up the new enhanced features:
- 🧠 RAG Memory System
- 🤖 Opera Autonomous Orchestrator
- 🚀 Enhanced OPERA Integration

`);

// Check if running in a project directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: No package.json found in current directory');
  console.log('Please run this script from your project root directory\n');
  process.exit(1);
}

// Function to prompt user
function prompt(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Main setup function
async function setup() {
  try {
    // Step 1: Check VERSATIL installation
    console.log('📦 Checking VERSATIL installation...');
    try {
      execSync('npx versatil-sdlc --version', { stdio: 'ignore' });
      console.log('✅ VERSATIL SDLC Framework detected\n');
    } catch {
      console.log('Installing VERSATIL SDLC Framework...');
      execSync('pnpm install versatil-sdlc-framework@latest', { stdio: 'inherit' });
      console.log('✅ VERSATIL SDLC Framework installed\n');
    }
    
    // Step 2: Create directories
    console.log('📁 Creating enhanced feature directories...');
    const dirs = [
      '.versatil',
      '.versatil/rag',
      '.versatil/rag/vector-index',
      '.versatil/opera',
      '.versatil/opera/goals',
      '.versatil/learning'
    ];
    
    for (const dir of dirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created ${dir}`);
      }
    }
    
    // Step 3: Create enhanced configuration
    console.log('\n⚙️  Creating enhanced configuration...');
    const config = {
      version: '1.2.0',
      features: {
        rag: {
          enabled: true,
          memoryDepth: 10,
          embeddingDimension: 384
        },
        opera: {
          enabled: true,
          autonomousMode: false,
          maxConcurrentExecutions: 3,
          decisionConfidenceThreshold: 0.7
        },
        enhancedOPERA: {
          enabled: true,
          learningRate: 0.1,
          contextWindowSize: 5
        }
      },
      performance: {
        memoryLimit: '2GB',
        cachingEnabled: true,
        parallelExecution: true
      }
    };
    
    const configPath = path.join(process.cwd(), '.versatil', 'enhanced-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Configuration created at .versatil/enhanced-config.json\n');
    
    // Step 4: Ask about autonomous mode
    const enableAuto = await prompt('🤖 Enable autonomous mode? (y/n): ');
    if (enableAuto === 'y' || enableAuto === 'yes') {
      config.features.opera.autonomousMode = true;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✅ Autonomous mode enabled\n');
    } else {
      console.log('ℹ️  Autonomous mode disabled (can be enabled later)\n');
    }
    
    // Step 5: Create example enhanced script
    console.log('📝 Creating example script...');
    const exampleScript = `/**
 * VERSATIL Enhanced Features Example
 * Demonstrates RAG memory and Opera orchestration
 */

import { 
  enhancedOPERA, 
  vectorMemoryStore 
} from 'versatil-sdlc-framework';

async function main() {
  console.log('🚀 VERSATIL Enhanced Features Demo\\n');
  
  // Create project context
  const projectId = 'enhanced-demo-' + Date.now();
  const context = await enhancedOPERA.createContext(projectId);
  console.log(\`✅ Created project: \${projectId}\\n\`);
  
  // Store some knowledge in RAG memory
  console.log('🧠 Storing knowledge in RAG memory...');
  await vectorMemoryStore.storeMemory({
    content: JSON.stringify({
      bestPractice: 'Always use TypeScript for type safety',
      applies: 'All JavaScript projects'
    }),
    metadata: {
      agentId: 'enhanced-james',
      timestamp: Date.now(),
      tags: ['typescript', 'best-practice', 'frontend']
    }
  });
  console.log('✅ Knowledge stored\\n');
  
  // Execute an enhanced workflow
  console.log('🤖 Starting enhanced workflow...');
  await enhancedOPERA.executeOPERAWorkflow(
    projectId,
    'Create a TypeScript utility function for data validation'
  );
  
  console.log('✅ Workflow initiated!');
  console.log('   Agents will work autonomously to complete the task');
  console.log('   Check logs for detailed progress\\n');
  
  // Get performance metrics
  const metrics = await enhancedOPERA.getPerformanceMetrics();
  console.log('📊 Current metrics:');
  console.log(\`   Enhanced Agents: \${metrics.enhancedAgents}\`);
  console.log(\`   RAG Enabled: \${metrics.ragEnabled}\`);
  console.log(\`   Autonomous Mode: \${metrics.autonomousMode}\`);
  
  if (metrics.memoryStats) {
    console.log(\`   Total Memories: \${metrics.memoryStats.totalMemories}\`);
  }
}

// Run the demo
main().catch(console.error);
`;
    
    const examplePath = path.join(process.cwd(), 'versatil-enhanced-demo.js');
    fs.writeFileSync(examplePath, exampleScript);
    console.log('✅ Created versatil-enhanced-demo.js\n');
    
    // Step 6: Add npm scripts
    console.log('📦 Adding npm scripts...');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['versatil:enhanced'] = 'npx versatil-sdlc enhanced';
    packageJson.scripts['versatil:auto'] = 'npx versatil-sdlc autonomous';
    packageJson.scripts['versatil:demo'] = 'node versatil-enhanced-demo.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added VERSATIL scripts to package.json\n');
    
    // Step 7: Initial memory seed (optional)
    const seedMemory = await prompt('🌱 Seed initial memories for agents? (y/n): ');
    if (seedMemory === 'y' || seedMemory === 'yes') {
      console.log('\n📚 Seeding agent memories...');
      
      // Import dynamically
      const { vectorMemoryStore } = await import('versatil-sdlc-framework');
      
      const seedData = [
        {
          agent: 'enhanced-maria',
          content: 'Always aim for 85%+ test coverage',
          tags: ['testing', 'quality', 'standard']
        },
        {
          agent: 'enhanced-marcus',
          content: 'Use dependency injection for better testability',
          tags: ['backend', 'architecture', 'pattern']
        },
        {
          agent: 'enhanced-james',
          content: 'Prefer functional components with hooks in React',
          tags: ['frontend', 'react', 'best-practice']
        },
        {
          agent: 'security-sam',
          content: 'Never store sensitive data in localStorage',
          tags: ['security', 'web', 'vulnerability']
        }
      ];
      
      for (const seed of seedData) {
        await vectorMemoryStore.storeMemory({
          content: seed.content,
          metadata: {
            agentId: seed.agent,
            timestamp: Date.now(),
            tags: seed.tags
          }
        });
        console.log(`  ✅ Seeded memory for ${seed.agent}`);
      }
      console.log('\n');
    }
    
    // Complete!
    console.log(`
✨ Enhanced Setup Complete!
==========================

Your project is now configured with:
- 🧠 RAG Memory System
- 🤖 Opera Orchestrator${config.features.opera.autonomousMode ? ' (Autonomous Mode)' : ''}
- 🚀 Enhanced OPERA Agents

Quick Start Commands:
--------------------
  pnpm run versatil:enhanced    # Start in enhanced mode
  pnpm run versatil:auto        # Start in autonomous mode
  pnpm run versatil:demo        # Run the demo script

Next Steps:
-----------
1. Try the demo: pnpm run versatil:demo
2. Read the guide: ENHANCED_FEATURES_GUIDE.md
3. Start building with enhanced agents!

Documentation: https://docs.versatil-framework.com/enhanced
Support: https://discord.gg/versatil-enhanced

Happy coding with VERSATIL! 🚀
`);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setup();
