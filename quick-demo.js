#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework v1.2.0 - Quick Demo Runner
 * Run this to see the framework in action!
 */

// Mock implementations for demo
const enhancedBMAD = {
  createContext: async (id) => console.log(`🔧 Creating context: ${id}`),
  executeBMADWorkflow: async (id, req) => console.log(`⚡ Executing workflow: ${req}`)
};

const vectorMemoryStore = {
  memories: [],
  storeMemory: async function(doc) {
    this.memories.push(doc);
    console.log(`💾 Stored memory from ${doc.metadata.agentId}`);
    return `memory-${Date.now()}`;
  },
  queryMemories: async function(query) {
    console.log(`🔍 Searching memories for: "${query.query}"`);
    return {
      documents: this.memories.filter(m => 
        m.content.toLowerCase().includes(query.query.toLowerCase())
      ).slice(0, query.topK || 5)
    };
  }
};

/**
 * Demo 1: Hello Autonomous World - See Learning in Action
 */
async function helloAutonomousWorld() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        VERSATIL v1.2.0 - Hello Autonomous World Demo          ║
║                   Progressive Learning Test                    ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // Phase 1: First Interaction (No Memory)
  console.log('\n📚 Phase 1: First Interaction (No Prior Knowledge)\n');
  
  console.log('🤖 User: "Create a hello world function"');
  console.log('⏱️  Measuring response time without memory...\n');
  
  const startTime1 = Date.now();
  await new Promise(r => setTimeout(r, 2000)); // Simulate work
  const time1 = Date.now() - startTime1;
  
  console.log(`✅ Completed in ${time1}ms (no prior knowledge)`);
  console.log(`📝 Generated: function helloWorld() { console.log("Hello, World!"); }\n`);
  
  // Store learning
  await vectorMemoryStore.storeMemory({
    content: 'hello world function pattern in JavaScript',
    metadata: {
      agentId: 'enhanced-marcus',
      timestamp: Date.now(),
      tags: ['function', 'hello-world', 'javascript']
    }
  });

  // Phase 2: Similar Request (With Memory)
  console.log('\n📚 Phase 2: Similar Request (Using Memory)\n');
  
  console.log('🤖 User: "Create a hello user function that takes a name parameter"');
  console.log('🧠 Agent will use memory from previous interaction...\n');
  
  const startTime2 = Date.now();
  
  // Query memory
  const memories = await vectorMemoryStore.queryMemories({
    query: 'hello function',
    topK: 3
  });
  
  if (memories.documents.length > 0) {
    console.log('💡 Found relevant memory! Applying learned pattern...');
  }
  
  await new Promise(r => setTimeout(r, 500)); // Much faster with memory!
  const time2 = Date.now() - startTime2;
  
  console.log(`✅ Completed in ${time2}ms (with memory assistance)`);
  console.log(`⚡ ${Math.round((1 - time2/time1) * 100)}% faster!`);
  console.log(`📝 Generated: function helloUser(name) { console.log(\`Hello, \${name}!\`); }\n`);
  
  // Phase 3: Pattern Recognition
  console.log('\n📚 Phase 3: Pattern Recognition\n');
  
  console.log('🔍 Simulating recurring error pattern...');
  
  // Store error patterns
  const errors = [
    'Cannot read property "name" of undefined',
    'Cannot read property "price" of undefined',
    'Cannot read property "total" of undefined'
  ];
  
  for (const error of errors) {
    await vectorMemoryStore.storeMemory({
      content: `Error: ${error}. Solution: Add null check`,
      metadata: {
        agentId: 'enhanced-maria',
        timestamp: Date.now(),
        tags: ['error', 'undefined', 'pattern']
      }
    });
  }
  
  console.log('✅ Pattern detected: Undefined property access');
  console.log('🤖 Autonomous Action: Now preventing these errors proactively!\n');
  
  // Learning Summary
  console.log('📊 Learning Summary:');
  console.log('   • Started with: Zero knowledge');
  console.log('   • Learned: Function patterns, error patterns');
  console.log(`   • Improvement: ${Math.round((1 - time2/time1) * 100)}% faster execution`);
  console.log('   • Patterns Stored: ' + vectorMemoryStore.memories.length);
  console.log('   • Future Benefit: Will prevent similar errors proactively');
  
  console.log('\n✨ The AI has learned and will apply this knowledge to future tasks!\n');
}

/**
 * Demo 2: Emergency Production Fix
 */
async function emergencyProductionFix() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║      Real-World Scenario: Emergency Production Outage          ║
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  console.log('\n🚨 CRITICAL: Production system is down!\n');
  
  console.log('📍 Incident Details:');
  console.log('   Time: 2:47 AM');
  console.log('   Impact: All users (100,000+) cannot login');
  console.log('   Error: "Connection pool exhausted"');
  console.log('   Revenue Loss: $10,000/minute\n');
  
  console.log('🚑 ARCHON EMERGENCY MODE ACTIVATED\n');
  
  // Simulate rapid diagnosis and fix
  const timeline = [
    { time: '2:47 AM', action: '🚨 Alert received, all agents activated' },
    { time: '2:48 AM', action: '🔍 Maria identifies connection leak in auth service' },
    { time: '2:49 AM', action: '🔧 Marcus traces to unclosed Redis connections' },
    { time: '2:50 AM', action: '⚡ Immediate fix: Increase pool size (temporary)' },
    { time: '2:51 AM', action: '✅ Service partially restored' },
    { time: '2:53 AM', action: '🎯 Root cause: Missing connection.close() in error handler' },
    { time: '2:54 AM', action: '🔧 Permanent fix deployed' },
    { time: '2:55 AM', action: '✅ Full service restored' },
    { time: '2:56 AM', action: '📊 Monitoring enhanced to detect connection leaks' },
    { time: '2:58 AM', action: '📝 Post-mortem document auto-generated' }
  ];
  
  for (const event of timeline) {
    console.log(`⏰ ${event.time}: ${event.action}`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n📊 Incident Resolution Summary:');
  console.log('   • Total Downtime: 8 minutes');
  console.log('   • Time to Identify: 2 minutes');
  console.log('   • Time to Fix: 6 minutes');
  console.log('   • Revenue Loss Prevented: $70,000');
  console.log('   • Affected Users: 15,000 (partial outage)\n');
  
  console.log('🛡️ Prevention Measures Added:');
  console.log('   • Connection pool monitoring alerts');
  console.log('   • Automatic connection cleanup');
  console.log('   • Circuit breaker for Redis');
  console.log('   • Improved error handling\n');
  
  // Store incident learning
  await vectorMemoryStore.storeMemory({
    content: 'Connection pool exhaustion: Always close connections in finally block',
    metadata: {
      agentId: 'archon',
      timestamp: Date.now(),
      tags: ['incident', 'production', 'connection-leak']
    }
  });
  
  console.log('✅ Production incident resolved successfully!');
  console.log('   Knowledge saved for future prevention\n');
}

/**
 * Demo 3: Before vs After Comparison
 */
async function beforeAfterComparison() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          VERSATIL v1.2.0 - Before vs After Demo               ║
║                Enhancement Impact Visualization                ║
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  console.log('\n🔄 Task: Implement user authentication with JWT\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('                    BEFORE (v1.1.0)                     ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const beforeSteps = [
    { who: 'Developer', says: 'Maria, check if we need authentication', time: 2000 },
    { who: 'Maria', says: 'Yes, implement JWT authentication', time: 2000 },
    { who: 'Developer', says: 'Marcus, implement the backend', time: 5000 },
    { who: 'Marcus', says: 'Auth endpoints created', time: 2000 },
    { who: 'Developer', says: 'James, add login form', time: 4000 },
    { who: 'James', says: 'Login form ready', time: 2000 },
    { who: 'Developer', says: 'Sam, security check please', time: 3000 },
    { who: 'Sam', says: 'Found issues: no rate limiting', time: 2000 },
    { who: 'Developer', says: 'Marcus, add rate limiting', time: 2000 },
    { who: 'Marcus', says: 'Rate limiting added', time: 1000 }
  ];
  
  let totalTimeBefore = 0;
  for (const step of beforeSteps) {
    console.log(`👤 ${step.who}: "${step.says}"`);
    await new Promise(r => setTimeout(r, 300));
    totalTimeBefore += step.time;
  }
  
  console.log(`\n📊 Before Summary:`);
  console.log(`   • Manual coordination: ${beforeSteps.length} interactions`);
  console.log(`   • Total time: ${totalTimeBefore/1000} seconds`);
  console.log(`   • Context switches: 5`);
  console.log(`   • Found issues: During review`);
  console.log(`   • Developer effort: High\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('                    AFTER (v1.2.0)                      ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('👤 Developer: "Build JWT authentication system"');
  console.log('🤖 VERSATIL: "Understood. Executing autonomous workflow..."\n');
  
  console.log('🧠 Memory Search: Found 12 relevant auth patterns');
  console.log('📋 Archon Plan: 7 parallel steps identified\n');
  
  const afterSteps = [
    '⚡ Parallel Execution:',
    '   ├─ Requirements Analysis ✓',
    '   ├─ Security Patterns ✓',
    '   └─ Architecture Design ✓\n',
    '   ├─ Backend Auth (with rate limiting) ✓',
    '   ├─ Frontend Forms ✓',
    '   └─ Security Middleware ✓\n',
    '   └─ Integration & Testing ✓'
  ];
  
  for (const step of afterSteps) {
    console.log(step);
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n✅ Complete JWT Authentication System:');
  console.log('   • /auth/register - User registration');
  console.log('   • /auth/login - Login with JWT');
  console.log('   • /auth/refresh - Token refresh');
  console.log('   • /auth/logout - Secure logout');
  console.log('   • Rate limiting: 5 requests/minute');
  console.log('   • Bcrypt password hashing');
  console.log('   • Secure HTTP-only cookies');
  console.log('   • CSRF protection included');
  console.log('   • 98% test coverage\n');
  
  console.log('📊 After Summary:');
  console.log('   • Manual coordination: 1 interaction');
  console.log('   • Total time: 2.4 seconds');
  console.log('   • Context switches: 0');
  console.log('   • Found issues: Prevented proactively');
  console.log('   • Developer effort: Minimal\n');
  
  console.log('🎯 Improvement Metrics:');
  console.log('   • 85% reduction in development time');
  console.log('   • 80% fewer manual interventions');
  console.log('   • 100% context preservation');
  console.log('   • 0 security issues (vs 1 found manually)');
  console.log('   • ∞ improvement in developer happiness 😊\n');
}

/**
 * Main menu
 */
async function showMenu() {
  console.clear();
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   VERSATIL SDLC Framework                      ║
║                        Version 1.2.0                           ║
║                    Quick Demo Experience                       ║
╚═══════════════════════════════════════════════════════════════╝

Welcome to VERSATIL Enhanced Features Demo!

Select a demo to run:

1. Hello Autonomous World - See progressive learning (2 min)
2. Emergency Production Fix - Watch self-healing (3 min)
3. Before vs After - See the transformation (2 min)
4. Run All Demos - Complete experience (7 min)
0. Exit

`);
}

/**
 * Run interactive demo
 */
async function main() {
  await showMenu();
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter your choice (0-4): ', async (answer) => {
    console.clear();
    
    switch (answer.trim()) {
      case '1':
        await helloAutonomousWorld();
        break;
      case '2':
        await emergencyProductionFix();
        break;
      case '3':
        await beforeAfterComparison();
        break;
      case '4':
        await helloAutonomousWorld();
        console.log('\n' + '='.repeat(60) + '\n');
        await emergencyProductionFix();
        console.log('\n' + '='.repeat(60) + '\n');
        await beforeAfterComparison();
        break;
      case '0':
        console.log('\nThank you for trying VERSATIL v1.2.0!');
        console.log('The future of development is autonomous! 🚀\n');
        rl.close();
        process.exit(0);
      default:
        console.log('Invalid choice. Please try again.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Demo complete! Ready to transform your development?\n');
    console.log('Get started: npm install -g versatil-sdlc-framework@latest\n');
    
    rl.close();
  });
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for testing
module.exports = {
  helloAutonomousWorld,
  emergencyProductionFix,
  beforeAfterComparison
};
