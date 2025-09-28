#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework v1.2.0
 * Migration Script for Upgrading from v1.1.x
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
};

class VersatilMigration {
  constructor() {
    this.currentVersion = null;
    this.targetVersion = '1.2.0';
    this.backupDir = '.versatil-backup-' + Date.now();
    this.migrationSteps = [];
  }

  async run() {
    try {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          VERSATIL SDLC Framework Migration Tool                ║
║                    v1.1.x → v1.2.0                            ║
╚═══════════════════════════════════════════════════════════════╝

This tool will help you migrate to VERSATIL v1.2.0 with:
- 🧠 RAG Memory System
- 🤖 Archon Autonomous Orchestration
- 🚀 Enhanced BMAD Agents

`);

      // Step 1: Check current version
      await this.checkCurrentVersion();

      // Step 2: Backup existing configuration
      await this.backupConfiguration();

      // Step 3: Update dependencies
      await this.updateDependencies();

      // Step 4: Create new directories
      await this.createNewDirectories();

      // Step 5: Migrate configuration
      await this.migrateConfiguration();

      // Step 6: Initialize RAG memory
      await this.initializeRAGMemory();

      // Step 7: Set up Archon
      await this.setupArchon();

      // Step 8: Update agent configurations
      await this.updateAgentConfigurations();

      // Step 9: Run validation
      await this.validateMigration();

      // Step 10: Show completion
      await this.showCompletion();

    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      console.log('\n🔄 Rolling back changes...');
      await this.rollback();
    } finally {
      rl.close();
    }
  }

  async checkCurrentVersion() {
    console.log('\n📌 Step 1: Checking current version...');
    
    try {
      const packagePath = path.join(process.cwd(), 'node_modules', 'versatil-sdlc-framework', 'package.json');
      const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      this.currentVersion = packageData.version;
      
      console.log(`   Current version: ${this.currentVersion}`);
      
      if (this.currentVersion.startsWith('1.2')) {
        console.log('   ✅ Already on v1.2.x - no migration needed!');
        process.exit(0);
      }
      
      if (!this.currentVersion.startsWith('1.0') && !this.currentVersion.startsWith('1.1')) {
        throw new Error(`Unsupported version: ${this.currentVersion}`);
      }
      
      console.log(`   Target version: ${this.targetVersion}`);
      
    } catch (error) {
      console.log('   ⚠️  Could not detect VERSATIL version');
      const answer = await prompt('   Continue anyway? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(0);
      }
    }
  }

  async backupConfiguration() {
    console.log('\n📌 Step 2: Backing up configuration...');
    
    const filesToBackup = [
      '.versatil',
      '.cursorrules',
      'versatil.config.js',
      'versatil.config.json'
    ];
    
    // Create backup directory
    await fs.mkdir(this.backupDir, { recursive: true });
    this.migrationSteps.push({ action: 'backup', path: this.backupDir });
    
    for (const file of filesToBackup) {
      try {
        const sourcePath = path.join(process.cwd(), file);
        const stats = await fs.stat(sourcePath);
        
        if (stats.isDirectory()) {
          await this.copyDirectory(sourcePath, path.join(this.backupDir, file));
        } else {
          await fs.copyFile(sourcePath, path.join(this.backupDir, file));
        }
        
        console.log(`   ✅ Backed up ${file}`);
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async updateDependencies() {
    console.log('\n📌 Step 3: Updating dependencies...');
    
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r   ${spinner[i]} Updating to v${this.targetVersion}...`);
      i = (i + 1) % spinner.length;
    }, 100);
    
    try {
      await execAsync(`npm install versatil-sdlc-framework@${this.targetVersion}`);
      clearInterval(interval);
      process.stdout.write('\r   ✅ Dependencies updated successfully\n');
    } catch (error) {
      clearInterval(interval);
      throw new Error('Failed to update dependencies');
    }
  }

  async createNewDirectories() {
    console.log('\n📌 Step 4: Creating new directories...');
    
    const newDirs = [
      '.versatil/rag',
      '.versatil/rag/vector-index',
      '.versatil/archon',
      '.versatil/archon/goals',
      '.versatil/archon/decisions',
      '.versatil/learning',
      '.versatil/metrics'
    ];
    
    for (const dir of newDirs) {
      const dirPath = path.join(process.cwd(), dir);
      await fs.mkdir(dirPath, { recursive: true });
      this.migrationSteps.push({ action: 'create_dir', path: dirPath });
      console.log(`   ✅ Created ${dir}`);
    }
  }

  async migrateConfiguration() {
    console.log('\n📌 Step 5: Migrating configuration...');
    
    // Check for existing config
    let existingConfig = {};
    
    try {
      const configPath = path.join(process.cwd(), '.versatil', 'config.json');
      existingConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    } catch (error) {
      // No existing config
    }
    
    // Create enhanced config
    const enhancedConfig = {
      version: '1.2.0',
      ...existingConfig,
      features: {
        ...existingConfig.features,
        rag: {
          enabled: true,
          memoryDepth: 10,
          embeddingDimension: 384
        },
        archon: {
          enabled: true,
          autonomousMode: false,
          maxConcurrentExecutions: 3,
          decisionConfidenceThreshold: 0.7
        },
        enhancedBMAD: {
          enabled: true,
          learningRate: 0.1,
          contextWindowSize: 5
        }
      },
      agents: {
        ...existingConfig.agents,
        enhanced: true,
        memoryEnabled: true,
        learningEnabled: true
      }
    };
    
    const configPath = path.join(process.cwd(), '.versatil', 'config.json');
    await fs.writeFile(configPath, JSON.stringify(enhancedConfig, null, 2));
    this.migrationSteps.push({ action: 'update_config', path: configPath });
    
    console.log('   ✅ Configuration migrated');
  }

  async initializeRAGMemory() {
    console.log('\n📌 Step 6: Initializing RAG memory...');
    
    // Create initial memory entries for common patterns
    const initialMemories = [
      {
        content: 'Always validate user input to prevent SQL injection',
        agentId: 'security-sam',
        tags: ['security', 'validation', 'best-practice']
      },
      {
        content: 'Use async/await instead of callbacks for better readability',
        agentId: 'enhanced-marcus',
        tags: ['backend', 'async', 'best-practice']
      },
      {
        content: 'Implement lazy loading for better performance',
        agentId: 'enhanced-james',
        tags: ['frontend', 'performance', 'optimization']
      },
      {
        content: 'Aim for 85% test coverage minimum',
        agentId: 'enhanced-maria',
        tags: ['testing', 'quality', 'standard']
      }
    ];
    
    const memoryDir = path.join(process.cwd(), '.versatil', 'rag', 'vector-index');
    
    for (const memory of initialMemories) {
      const id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const memoryDoc = {
        id,
        content: memory.content,
        metadata: {
          agentId: memory.agentId,
          timestamp: Date.now(),
          tags: memory.tags
        }
      };
      
      await fs.writeFile(
        path.join(memoryDir, `${id}.json`),
        JSON.stringify(memoryDoc, null, 2)
      );
    }
    
    console.log(`   ✅ Initialized RAG with ${initialMemories.length} seed memories`);
  }

  async setupArchon() {
    console.log('\n📌 Step 7: Setting up Archon orchestrator...');
    
    const archonConfig = {
      version: '1.2.0',
      autonomousMode: false,
      maxConcurrentExecutions: 3,
      decisionConfidenceThreshold: 0.7,
      riskTolerance: 0.3,
      learningRate: 0.1,
      memoryQueryDepth: 10
    };
    
    const archonConfigPath = path.join(process.cwd(), '.versatil', 'archon', 'config.json');
    await fs.writeFile(archonConfigPath, JSON.stringify(archonConfig, null, 2));
    
    console.log('   ✅ Archon orchestrator configured');
  }

  async updateAgentConfigurations() {
    console.log('\n📌 Step 8: Updating agent configurations...');
    
    const agentEnhancements = {
      'enhanced-maria': { memoryTags: ['testing', 'quality', 'validation'] },
      'enhanced-marcus': { memoryTags: ['backend', 'api', 'database'] },
      'enhanced-james': { memoryTags: ['frontend', 'ui', 'react'] },
      'security-sam': { memoryTags: ['security', 'vulnerability', 'audit'] },
      'dr-ai-ml': { memoryTags: ['ml', 'optimization', 'data'] },
      'sarah-pm': { memoryTags: ['planning', 'management', 'timeline'] },
      'alex-ba': { memoryTags: ['requirements', 'analysis', 'business'] }
    };
    
    const agentConfigPath = path.join(process.cwd(), '.versatil', 'agent-config.json');
    await fs.writeFile(agentConfigPath, JSON.stringify(agentEnhancements, null, 2));
    
    console.log('   ✅ Agent configurations enhanced');
  }

  async validateMigration() {
    console.log('\n📌 Step 9: Validating migration...');
    
    const checks = [
      { name: 'RAG directories', path: '.versatil/rag/vector-index' },
      { name: 'Archon configuration', path: '.versatil/archon/config.json' },
      { name: 'Enhanced configuration', path: '.versatil/config.json' },
      { name: 'Agent configurations', path: '.versatil/agent-config.json' }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      try {
        await fs.access(path.join(process.cwd(), check.path));
        console.log(`   ✅ ${check.name}`);
      } catch (error) {
        console.log(`   ❌ ${check.name}`);
        allPassed = false;
      }
    }
    
    if (!allPassed) {
      throw new Error('Validation failed');
    }
    
    console.log('\n   ✅ All validations passed!');
  }

  async showCompletion() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              Migration Completed Successfully!                 ║
╚═══════════════════════════════════════════════════════════════╝

✨ Your VERSATIL framework has been upgraded to v1.2.0!

New Features Available:
- 🧠 RAG Memory System - Agents now learn from experience
- 🤖 Archon Orchestrator - Autonomous goal execution
- 🚀 Enhanced Agents - With memory and learning capabilities

Next Steps:
1. Test the new features:
   npm run test:demo

2. Enable autonomous mode (optional):
   npx versatil-sdlc autonomous

3. Start with enhanced features:
   npx versatil-sdlc enhanced

4. Read the migration guide:
   https://docs.versatil-framework.com/migration

Backup Location: ${this.backupDir}

Thank you for upgrading to VERSATIL v1.2.0! 🎉
`);

    const startNow = await prompt('\nWould you like to start VERSATIL in enhanced mode now? (y/n): ');
    
    if (startNow.toLowerCase() === 'y') {
      console.log('\n🚀 Starting VERSATIL enhanced mode...\n');
      exec('npx versatil-sdlc enhanced', { stdio: 'inherit' });
    }
  }

  async rollback() {
    console.log('\n🔄 Rolling back changes...');
    
    // Reverse migration steps
    for (const step of this.migrationSteps.reverse()) {
      try {
        if (step.action === 'create_dir') {
          await fs.rmdir(step.path, { recursive: true });
        } else if (step.action === 'update_config') {
          // Restore from backup
          const backupPath = path.join(this.backupDir, path.basename(step.path));
          await fs.copyFile(backupPath, step.path);
        }
      } catch (error) {
        // Continue rollback even if individual steps fail
      }
    }
    
    console.log('   ✅ Rollback completed');
    console.log(`   Backup preserved at: ${this.backupDir}`);
  }
}

// Run migration
if (require.main === module) {
  const migration = new VersatilMigration();
  migration.run().catch(console.error);
}

module.exports = VersatilMigration;
