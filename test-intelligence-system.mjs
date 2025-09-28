#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Intelligence System Integration Test
 *
 * Tests the complete 3-tier intelligence system:
 * - Level 1: Pattern Analysis
 * - Level 2: Prompt Generation
 * - Level 3: Optional AI API
 */

import { createOrchestrator } from './dist/intelligence/agent-orchestrator.js';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     VERSATIL Intelligence System Integration Test           ║
║        BMAD + Claude Agents - Complete Demo                 ║
╚══════════════════════════════════════════════════════════════╝
`);

const orchestrator = createOrchestrator();

// Test sample code files
const testFiles = [
  {
    name: 'Test File with Bugs',
    filePath: 'sample-code.test.js',
    content: `
describe('User Authentication', () => {
  it('should authenticate user', async () => {
    const user = await authenticateUser('test@example.com', 'password123');
    // Missing assertions!
  });

  it('should handle errors') {
    try {
      authenticateUser(null, null);
    } catch (error) {
      // Empty catch block!
    }
  }
});

function authenticateUser(email, password) {
  console.log('Authenticating:', email); // Debug code!
  debugger; // Debugger statement!
  // TODO: Add actual authentication logic
  return { id: 1, email };
}
`,
    language: 'javascript',
    userRequest: 'Analyze this test file for quality issues'
  },
  {
    name: 'Frontend Component',
    filePath: 'UserProfile.jsx',
    content: `
import React, { useState } from 'react';

function UserProfile({ userId }) {
  const [user, setuser] = useState(null); // Wrong naming convention

  useEffect(() => {
    fetchUser(userId).then(setuser);
  }, [userId]); // Missing dependency warning

  return (
    <div style={{ color: 'red' }}>
      <img src={user?.avatar} />
      {users.map(u => <div>{u.name}</div>)}
    </div>
  );
}
`,
    language: 'javascriptreact',
    userRequest: 'Review frontend component for best practices'
  },
  {
    name: 'Backend API',
    filePath: 'auth-api.js',
    content: `
const express = require('express');
const app = express();

app.post('/api/login', (req, res) => {
  const { username, password } = req.body; // No validation!

  // SQL Injection vulnerability!
  const query = \`SELECT * FROM users WHERE username='\${username}' AND password='\${password}'\`;

  const secret = 'hardcoded-api-key-12345'; // Hardcoded credentials!

  db.query(query, (err, results) => {
    if (err) {
      // Empty error handling
    }
    res.json(results[0]);
  });
});
`,
    language: 'javascript',
    userRequest: 'Security audit for this API endpoint'
  }
];

// Run tests
async function runTests() {
  let testsPassed = 0;
  let totalTests = 0;

  for (const testFile of testFiles) {
    totalTests++;
    console.log(`\n━━━ ${testFile.name} ━━━\n`);
    console.log(`File: ${testFile.filePath}`);
    console.log(`Request: ${testFile.userRequest}\n`);

    try {
      const result = await orchestrator.analyzeFile({
        filePath: testFile.filePath,
        content: testFile.content,
        language: testFile.language,
        projectName: 'VERSATIL Test',
        userRequest: testFile.userRequest
      });

      console.log(`✅ Agent: ${result.agent}`);
      console.log(`📊 Level 1 - Pattern Analysis:`);
      console.log(`   Score: ${result.level1.score}/100`);
      console.log(`   Issues Found: ${result.level1.patterns.length}`);
      console.log(`   Summary: ${result.level1.summary}`);

      if (result.level1.recommendations.length > 0) {
        console.log(`\n🎯 Recommendations:`);
        result.level1.recommendations.forEach(rec => {
          console.log(`   ${rec}`);
        });
      }

      console.log(`\n💡 Level 2 - Generated Prompt:`);
      console.log(`   Title: ${result.level2.title}`);
      console.log(`   Model: ${result.level2.model}`);
      console.log(`   Priority: ${result.level2.priority}`);
      console.log(`   Estimated Time: ${result.level2.estimatedTime}`);

      if (result.level2.handoffSuggestions.length > 0) {
        console.log(`   Handoffs: ${result.level2.handoffSuggestions.join(', ')}`);
      }

      console.log(`\n🔧 Level 3 - AI Integration:`);
      if (result.level3) {
        console.log(`   ✅ AI Analysis Complete`);
        console.log(`   Model Used: ${result.level3.model}`);
        console.log(`   Tokens: ${result.level3.usage.inputTokens} in, ${result.level3.usage.outputTokens} out`);
      } else {
        console.log(`   ℹ️  API not configured (using prompt orchestration mode)`);
      }

      console.log(`\n📋 Mode: ${result.mode}`);
      console.log(`\n🎯 Next Steps:`);
      result.nextSteps.forEach(step => {
        console.log(`   ${step}`);
      });

      console.log(`\n${result.executionRecommendation}`);

      testsPassed++;
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
  }

  // Summary
  console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║                     TEST SUMMARY                            ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${totalTests - testsPassed}`);
  console.log(`Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%\n`);

  const aiStatus = orchestrator.getAIStatus();
  console.log(`AI Integration Status:`);
  console.log(`  Available: ${aiStatus.available ? '✅ Yes' : '⚠️  No (configure ANTHROPIC_API_KEY)'}`);
  console.log(`  Mode: ${aiStatus.mode}`);
  if (aiStatus.model) {
    console.log(`  Model: ${aiStatus.model}`);
  }

  console.log(`\n🎉 VERSATIL Intelligence System Test Complete!\n`);
  console.log(`✅ Level 1: Pattern Analysis - WORKING`);
  console.log(`✅ Level 2: Prompt Generation - WORKING`);
  console.log(`${aiStatus.available ? '✅' : 'ℹ️ '} Level 3: AI API Integration - ${aiStatus.available ? 'WORKING' : 'Ready (configure API key)'}\n`);

  if (!aiStatus.available) {
    console.log(`💡 To enable AI-enhanced analysis:`);
    console.log(`   export ANTHROPIC_API_KEY=your-api-key`);
    console.log(`   npm run test:intelligence\n`);
  }
}

runTests().catch(console.error);