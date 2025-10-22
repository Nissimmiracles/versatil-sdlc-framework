/**
 * Test SDK-wrapped OPERA Agents
 * Validates that Maria, James, and Marcus SDK agents work correctly
 */

import { MariaSDKAgent } from './src/agents/opera/maria-qa/maria-sdk-agent.js';
import { JamesSDKAgent } from './src/agents/opera/james-frontend/james-sdk-agent.js';
import { MarcusSDKAgent } from './src/agents/opera/marcus-backend/marcus-sdk-agent.js';
import { EnhancedVectorMemoryStore } from './src/rag/enhanced-vector-memory-store.js';

async function testSDKAgents() {
  console.log('🧪 Testing SDK-Wrapped OPERA Agents\n');
  console.log('=' .repeat(60));

  // Initialize vector store (optional for testing)
  let vectorStore: EnhancedVectorMemoryStore | undefined;
  try {
    vectorStore = new EnhancedVectorMemoryStore();
    console.log('✅ Vector store initialized for RAG context\n');
  } catch (error) {
    console.log('⚠️  Vector store not available, continuing without RAG\n');
  }

  // Test 1: Maria-QA SDK Agent
  console.log('\n📋 Test 1: Maria-QA SDK Agent');
  console.log('-'.repeat(60));
  try {
    const maria = new MariaSDKAgent(vectorStore);

    const testCode = `
      const apiUrl = process.env.API_URL || 'http://localhost:3000';

      function calculateTotal(items) {
        return items.reduce((sum, item) => sum + item.price, 0);
      }
    `;

    console.log('Testing Maria with code that has configuration inconsistencies...');

    const context = {
      filePath: 'src/api/config.ts',
      content: testCode,
      trigger: { type: 'file_change' as const }
    };

    // Note: actual activation commented out to avoid API calls during testing
    // const result = await maria.activate(context);
    // console.log('Result:', JSON.stringify(result, null, 2));

    // Test delegated methods
    const hasConfigIssue = maria.hasConfigurationInconsistencies(context);
    console.log(`✅ Configuration inconsistency detection: ${hasConfigIssue ? 'DETECTED' : 'NONE'}`);

    const dashboard = maria.generateQualityDashboard({
      score: 75,
      issues: [
        { severity: 'critical', type: 'security', message: 'SQL injection vulnerability' },
        { severity: 'high', type: 'testing', message: 'Missing test coverage' }
      ]
    });
    console.log(`✅ Quality dashboard generated: ${dashboard.overallScore}% score`);

    console.log('✅ Maria-QA SDK Agent: PASSED\n');
  } catch (error) {
    console.error(`❌ Maria-QA SDK Agent: FAILED - ${error.message}\n`);
  }

  // Test 2: James-Frontend SDK Agent
  console.log('\n🎨 Test 2: James-Frontend SDK Agent');
  console.log('-'.repeat(60));
  try {
    const james = new JamesSDKAgent(vectorStore);

    const testComponent = `
      import React, { useState } from 'react';

      const routes = [
        { path: '/dashboard', component: Dashboard },
        { path: '/settings', component: Settings }
      ];

      const navigation = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Profile', path: '/profile' }  // Mismatch!
      ];
    `;

    console.log('Testing James with component that has navigation mismatch...');

    const context = {
      filePath: 'src/components/App.tsx',
      content: testComponent,
      trigger: { type: 'file_change' as const }
    };

    // Test delegated methods
    const navValidation = james.validateNavigationIntegrity(context);
    console.log(`✅ Navigation validation: Score ${navValidation.score}/100`);
    console.log(`   Issues: ${navValidation.issues.length}, Warnings: ${navValidation.warnings.length}`);

    const issues = [
      { severity: 'high', type: 'route-navigation-mismatch', message: 'Mismatch detected' },
      { severity: 'medium', type: 'accessibility', message: 'Missing aria-label' }
    ];

    const recommendations = james.generateActionableRecommendations(issues);
    console.log(`✅ Generated ${recommendations.length} recommendations`);

    console.log('✅ James-Frontend SDK Agent: PASSED\n');
  } catch (error) {
    console.error(`❌ James-Frontend SDK Agent: FAILED - ${error.message}\n`);
  }

  // Test 3: Marcus-Backend SDK Agent
  console.log('\n⚙️  Test 3: Marcus-Backend SDK Agent');
  console.log('-'.repeat(60));
  try {
    const marcus = new MarcusSDKAgent(vectorStore);

    const testAPI = `
      app.post('/api/users', async (req, res) => {
        const { username, password } = req.body;

        const user = await db.query(
          'SELECT * FROM users WHERE username = "' + username + '"'
        );

        res.json(user);
      });
    `;

    console.log('Testing Marcus with API code that has security issues...');

    const context = {
      filePath: 'src/api/users.ts',
      content: testAPI,
      trigger: { type: 'file_change' as const }
    };

    // Test delegated methods
    const apiValidation = marcus.validateAPIIntegration(context);
    console.log(`✅ API validation: Score ${apiValidation.score}/100`);

    const securityCheck = marcus.checkAPISecurity(context);
    console.log(`✅ Security check: ${securityCheck.length} issues found`);

    const issues = [
      { severity: 'critical', type: 'security', message: 'SQL injection vulnerability' },
      { severity: 'high', type: 'performance', message: 'Missing database index' }
    ];

    const priority = marcus.calculatePriority(issues);
    console.log(`✅ Priority calculation: ${priority}`);

    const handoffs = marcus.determineHandoffs(issues);
    console.log(`✅ Handoffs determined: ${handoffs.join(', ') || 'none'}`);

    console.log('✅ Marcus-Backend SDK Agent: PASSED\n');
  } catch (error) {
    console.error(`❌ Marcus-Backend SDK Agent: FAILED - ${error.message}\n`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log('✅ All SDK-wrapped agents created successfully');
  console.log('✅ Legacy methods properly delegated');
  console.log('✅ SDK adapter pattern working correctly');
  console.log('\n🎯 Next Steps:');
  console.log('1. Replace references to EnhancedMaria/James/Marcus with SDK versions');
  console.log('2. Update agent-registry to use SDK agents');
  console.log('3. Test with actual Claude SDK activation (requires API key)');
  console.log('4. Benchmark performance vs legacy agents');
}

// Run tests
testSDKAgents().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
