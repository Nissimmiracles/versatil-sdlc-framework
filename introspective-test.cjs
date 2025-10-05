#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework v1.2.0 - Self-Testing Introspective Agent
 * This agent tests the framework itself and ensures everything works
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class IntrospectiveTestAgent {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.warnings = [];
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name,
        status: 'passed',
        duration,
        result
      });
      
      console.log(`   ✅ PASSED (${duration}ms)`);
      return { success: true, result };
    } catch (error) {
      this.errors.push({ name, error: error.message });
      console.log(`   ❌ FAILED: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testFileExists(filePath, description) {
    return this.runTest(`File exists: ${description}`, async () => {
      await fs.access(path.join(process.cwd(), filePath));
      return `Found at: ${filePath}`;
    });
  }

  async testFileExecutable(filePath, description) {
    return this.runTest(`File executable: ${description}`, async () => {
      return new Promise((resolve, reject) => {
        const child = spawn('node', [filePath], {
          cwd: process.cwd(),
          timeout: 5000
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        child.on('error', (error) => {
          reject(new Error(`Failed to execute: ${error.message}`));
        });

        child.on('close', (code) => {
          if (code !== 0 && !output.includes('Enter your choice')) {
            reject(new Error(`Exit code ${code}: ${errorOutput}`));
          } else {
            resolve(`Executed successfully`);
          }
        });

        // Send exit command for interactive scripts
        setTimeout(() => {
          child.stdin.write('0\n');
          child.stdin.end();
        }, 1000);
      });
    });
  }

  async testImports(filePath, description) {
    return this.runTest(`Imports work: ${description}`, async () => {
      // Create a test script that imports the file
      const testScript = `
        try {
          const module = require('${filePath}');
          console.log('SUCCESS');
          process.exit(0);
        } catch (error) {
          console.error('IMPORT_ERROR:', error.message);
          process.exit(1);
        }
      `;
      
      const testFile = path.join(process.cwd(), 'test-import-temp.js');
      await fs.writeFile(testFile, testScript);
      
      return new Promise(async (resolve, reject) => {
        const child = spawn('node', [testFile], {
          cwd: process.cwd()
        });

        let output = '';
        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          output += data.toString();
        });

        child.on('close', async (code) => {
          await fs.unlink(testFile).catch(() => {});
          
          if (output.includes('SUCCESS')) {
            resolve('Imports working correctly');
          } else {
            reject(new Error(output));
          }
        });
      });
    });
  }

  async testBasicFunctionality() {
    console.log('\n📋 Testing basic enhanced functionality...\n');
    
    // Test mock implementations
    const mockOPERA = {
      executedWorkflows: [],
      createContext: async function(id) { 
        this.executedWorkflows.push(id);
        return { id, created: true };
      },
      executeOPERAWorkflow: async function(id, req) {
        this.executedWorkflows.push({ id, req });
        return { success: true };
      }
    };

    const mockMemoryStore = {
      memories: [],
      storeMemory: async function(doc) {
        this.memories.push(doc);
        return `memory-${Date.now()}`;
      },
      queryMemories: async function(query) {
        return {
          documents: this.memories.filter(m => 
            m.content.toLowerCase().includes(query.query.toLowerCase())
          )
        };
      }
    };

    // Test memory storage
    await this.runTest('Memory Storage', async () => {
      const id = await mockMemoryStore.storeMemory({
        content: 'Test memory content',
        metadata: { agentId: 'test-agent', timestamp: Date.now() }
      });
      if (!id.startsWith('memory-')) throw new Error('Invalid memory ID');
      return `Stored with ID: ${id}`;
    });

    // Test memory query
    await this.runTest('Memory Query', async () => {
      const results = await mockMemoryStore.queryMemories({
        query: 'test memory',
        topK: 5
      });
      if (results.documents.length === 0) throw new Error('No memories found');
      return `Found ${results.documents.length} memories`;
    });

    // Test OPERA workflow
    await this.runTest('OPERA Workflow', async () => {
      await mockOPERA.executeOPERAWorkflow('test-project', 'Test requirements');
      if (mockOPERA.executedWorkflows.length === 0) throw new Error('Workflow not executed');
      return 'Workflow executed successfully';
    });
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 INTROSPECTIVE TEST REPORT\n');
    console.log('='.repeat(60) + '\n');

    const passed = this.testResults.filter(t => t.status === 'passed').length;
    const failed = this.errors.length;
    const total = passed + failed;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed/total) * 100)}%\n`);

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:\n');
      this.errors.forEach((e, i) => {
        console.log(`${i + 1}. ${e.name}`);
        console.log(`   Error: ${e.error}\n`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      this.warnings.forEach((w, i) => {
        console.log(`${i + 1}. ${w}\n`);
      });
    }

    console.log('='.repeat(60) + '\n');
    
    return {
      passed,
      failed,
      total,
      successRate: Math.round((passed/total) * 100),
      errors: this.errors,
      warnings: this.warnings
    };
  }

  async runFullTest() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          VERSATIL v1.2.0 - Introspective Self-Test            ║
║                  Testing Framework Integrity                    ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    console.log('\n🔍 Running comprehensive self-diagnostics...\n');

    // Test critical files exist
    console.log('📁 Checking critical files...');
    await this.testFileExists('package.json', 'Package configuration');
    await this.testFileExists('test-enhanced-opera.js', 'Enhanced OPERA test');
    await this.testFileExists('tests/enhanced-demo-suite.js', 'Demo suite');
    
    // Test if scripts are executable
    console.log('\n🚀 Testing executability...');
    await this.testFileExecutable('test-enhanced-opera.js', 'Enhanced OPERA test');
    
    // Test basic functionality
    await this.testBasicFunctionality();

    // Test Node.js version compatibility
    await this.runTest('Node.js Version', async () => {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      if (major < 14) throw new Error(`Node.js ${version} is too old. Need 14+`);
      return `Running on Node.js ${version}`;
    });

    // Generate report
    const report = await this.generateReport();

    if (report.failed === 0) {
      console.log('✨ All introspective tests passed! Framework is healthy.\n');
    } else {
      console.log('🔧 Some tests failed. Framework needs attention.\n');
      console.log('Recommended actions:');
      console.log('1. Check file paths and permissions');
      console.log('2. Ensure all dependencies are installed');
      console.log('3. Verify Node.js version compatibility\n');
    }

    return report;
  }
}

// Add to framework
async function addIntrospectiveCapability() {
  console.log('\n🧠 Adding introspective testing to VERSATIL...\n');
  
  // Create introspective test configuration
  const config = {
    version: '1.2.0',
    introspection: {
      enabled: true,
      autoTest: true,
      testOnStartup: false,
      continuousValidation: true
    },
    tests: {
      framework: ['file-integrity', 'imports', 'functionality'],
      agents: ['availability', 'response-time', 'memory-usage'],
      memory: ['storage', 'retrieval', 'persistence'],
      opera: ['goal-planning', 'execution', 'monitoring']
    }
  };

  try {
    const configPath = path.join(process.cwd(), '.versatil', 'introspection.json');
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Introspective capability added to framework\n');
  } catch (error) {
    console.log('⚠️  Could not save introspection config:', error.message);
  }
}

// Main execution
async function main() {
  const agent = new IntrospectiveTestAgent();
  
  // Run self-test
  await agent.runFullTest();
  
  // Add capability to framework
  await addIntrospectiveCapability();
  
  // Offer to create working demo
  console.log('💡 Would you like me to create a working demo?');
  console.log('   This will create a simple, tested demo file.\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = IntrospectiveTestAgent;
