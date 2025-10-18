/**
 * VERSATIL SDLC Framework - Adaptive Learning System Demo
 *
 * This example demonstrates how the Enhanced OPERA agents automatically
 * improve based on user interactions and feedback.
 */

import { enhancedMaria } from '../src/agents/enhanced-maria';
import { enhancedJames } from '../src/agents/enhanced-james';
import { enhancedMarcus } from '../src/agents/enhanced-marcus';
import { agentIntelligence } from '../src/intelligence/agent-intelligence';
import { intelligenceDashboard } from '../src/intelligence/intelligence-dashboard';
import { usageAnalytics } from '../src/intelligence/usage-analytics';
import { adaptiveLearning } from '../src/intelligence/adaptive-learning';

/**
 * Demo: Adaptive Learning in Action
 */
export async function demonstrateAdaptiveLearning() {
  console.log('🧠 VERSATIL Adaptive Learning System Demo\n');
  console.log('=' .repeat(60));

  // Step 1: Simulate Enhanced Maria analyzing a React component
  console.log('\n📋 Step 1: Enhanced Maria analyzes React component...\n');

  const reactContext = {
    content: `
      import React, { useState } from 'react';

      const UserProfile = () => {
        const [user, setUser] = useState(null);

        // FIXME: This should be in a service
        const fetchUser = () => {
          console.log('Fetching user data...');
          // Some user fetching logic
        };

        return (
          <div>
            <h1>User Profile</h1>
            {user && <div>{user.name}</div>}
          </div>
        );
      };

      export default UserProfile;
    `,
    filePath: '/src/components/UserProfile.tsx',
    userRequest: 'Review this React component for quality issues'
  };

  const mariaResponse = await enhancedMaria.activate(reactContext);
  console.log('Enhanced Maria Response:');
  console.log(`Priority: ${mariaResponse.priority}`);
  console.log(`Issues Found: ${mariaResponse.suggestions.length}`);
  console.log(`Intelligence Context: Learning enabled = ${mariaResponse.context?.intelligence?.learningEnabled}`);

  // Step 2: Simulate user feedback
  console.log('\n💬 Step 2: Recording user feedback...\n');

  if (mariaResponse.context?.intelligence?.activationId) {
    // Positive feedback
    agentIntelligence.recordUserFeedback('enhanced-maria', 'suggestion-1', {
      wasHelpful: true,
      wasAccurate: true,
      rating: 4,
      wasFollowed: true,
      comments: 'Good catch on the console.log!'
    });

    // Mixed feedback
    agentIntelligence.recordUserFeedback('enhanced-maria', 'suggestion-2', {
      wasHelpful: false,
      wasAccurate: true,
      rating: 2,
      wasFollowed: false,
      comments: 'Too many low-priority suggestions'
    });

    console.log('✅ User feedback recorded and learning system updated');
  }

  // Step 3: Simulate Enhanced James with navigation issues
  console.log('\n🎨 Step 3: Enhanced James analyzes navigation component...\n');

  const navigationContext = {
    content: `
      const routes = [
        { path: '/dashboard', component: Dashboard },
        { path: '/profile', component: Profile },
        { path: '/settings', component: Settings }
      ];

      const navigation = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Profile', path: '/profile' },
        { label: 'Settings', path: '/config' } // Mismatch!
      ];

      console.log('🧠 Navigation test - debugging active');
    `,
    filePath: '/src/components/Navigation.tsx',
    userRequest: 'Check route consistency'
  };

  const jamesResponse = await enhancedJames.activate(navigationContext);
  console.log('Enhanced James Response:');
  console.log(`Priority: ${jamesResponse.priority}`);
  console.log(`Route Issues: ${jamesResponse.suggestions.filter(s => s.message.includes('route')).length}`);

  // Step 4: Report false positive
  console.log('\n🚫 Step 4: Reporting false positive...\n');

  agentIntelligence.reportFalsePositive(
    'enhanced-james',
    'route-mismatch',
    '/src/components/Navigation.tsx',
    'This route difference was intentional - /config is an alias for /settings'
  );
  console.log('✅ False positive reported - system will learn to avoid similar mistakes');

  // Step 5: Simulate Enhanced Marcus with API issues
  console.log('\n🛠️  Step 5: Enhanced Marcus analyzes API configuration...\n');

  const apiContext = {
    content: `
      const config = {
        apiUrl: process.env.API_URL || "http://localhost:3000",
        timeout: 5000,
        retries: 3
      };

      // Development only debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('API Config:', config);
        debugger; // Remove in production
      }
    `,
    filePath: '/src/config/api.ts',
    userRequest: 'Validate API configuration'
  };

  const marcusResponse = await enhancedMarcus.activate(apiContext);
  console.log('Enhanced Marcus Response:');
  console.log(`Priority: ${marcusResponse.priority}`);
  console.log(`Config Issues: ${marcusResponse.suggestions.length}`);

  // Step 6: Show learning patterns discovery
  console.log('\n🔍 Step 6: Learning system discovering patterns...\n');

  // Simulate multiple interactions for pattern discovery
  for (let i = 0; i < 10; i++) {
    const interaction = {
      id: `demo-interaction-${i}`,
      timestamp: Date.now() + i * 1000,
      agentId: 'enhanced-maria',
      actionType: 'activation' as const,
      context: {
        filePath: `/src/components/Component${i}.tsx`,
        fileType: 'tsx',
        projectType: 'react'
      },
      outcome: {
        problemSolved: Math.random() > 0.3, // 70% success rate
        timeToResolution: Math.random() * 2000 + 500,
        userSatisfaction: Math.random() * 2 + 3, // 3-5 rating
        agentAccuracy: Math.random() * 0.3 + 0.7 // 70-100% accuracy
      }
    };

    adaptiveLearning.recordInteraction(interaction);
  }

  const learningInsights = adaptiveLearning.getLearningInsights();
  console.log('Learning Insights Discovered:');
  console.log(`- Patterns found: ${learningInsights.totalPatterns}`);
  console.log(`- Adaptations proposed: ${learningInsights.adaptationsProposed}`);
  console.log(`- Learning effectiveness: ${(learningInsights.learningEffectiveness * 100).toFixed(1)}%`);

  // Step 7: Display intelligence dashboard
  console.log('\n📊 Step 7: Intelligence Dashboard Summary\n');
  console.log('=' .repeat(60));

  const dashboardData = intelligenceDashboard.getDashboardData();
  const systemHealth = intelligenceDashboard.getSystemHealth();

  console.log('System Overview:');
  console.log(`- Agents with Intelligence: ${dashboardData.systemOverview.totalAgentsWrapped}`);
  console.log(`- Total Interactions: ${dashboardData.systemOverview.totalInteractions}`);
  console.log(`- User Satisfaction: ${(dashboardData.systemOverview.avgUserSatisfaction * 20).toFixed(1)}%`);
  console.log(`- System Health: ${systemHealth.status.toUpperCase()} (${systemHealth.overallScore}%)`);

  console.log('\nAgent Performance:');
  dashboardData.agentMetrics.forEach(agent => {
    console.log(`- ${agent.agentId}: ${(agent.successRate * 100).toFixed(1)}% success, ${agent.activationCount} activations`);
  });

  console.log('\nLearning Progress:');
  console.log(`- Patterns Discovered: ${dashboardData.learningProgress.patternsDiscovered}`);
  console.log(`- Adaptations Applied: ${dashboardData.learningProgress.adaptationsApplied}`);
  console.log(`- Learning Effectiveness: ${(dashboardData.learningProgress.learningEffectiveness * 100).toFixed(1)}%`);

  if (systemHealth.issues.length > 0) {
    console.log('\nSystem Recommendations:');
    systemHealth.recommendations.forEach(rec => {
      console.log(`- 💡 ${rec}`);
    });
  }

  // Step 8: Generate comprehensive learning report
  console.log('\n📄 Step 8: Generating Learning Report...\n');
  console.log('=' .repeat(60));

  const learningReport = intelligenceDashboard.generateLearningReport();
  console.log(learningReport);

  console.log('\n🎉 Demo Complete!\n');
  console.log('Key Takeaways:');
  console.log('✅ Enhanced OPERA agents automatically learn from user interactions');
  console.log('✅ System adapts agent behavior based on feedback patterns');
  console.log('✅ False positive reporting improves agent accuracy over time');
  console.log('✅ Real-time intelligence dashboard provides actionable insights');
  console.log('✅ Continuous improvement without manual intervention');

  return {
    mariaResponse,
    jamesResponse,
    marcusResponse,
    learningInsights,
    dashboardData,
    systemHealth
  };
}

/**
 * Demo: How adaptations are automatically applied
 */
export async function demonstrateAdaptationApplication() {
  console.log('\n🔧 ADAPTATION APPLICATION DEMO\n');
  console.log('=' .repeat(50));

  // Before adaptation
  console.log('Before Adaptation:');
  const beforeContext = {
    content: 'const test = true;',
    filePath: '/src/utils/helper.ts',
    userRequest: 'check code quality'
  };

  const beforeResponse = await enhancedMaria.activate(beforeContext);
  console.log(`- Keywords matched: ${beforeContext.matchedKeywords?.length || 0}`);
  console.log(`- Context clarity: ${beforeContext.contextClarity || 'default'}`);

  // Simulate adaptation being applied
  const wrapper = agentIntelligence['wrappedAgents'].get('enhanced-maria');
  if (wrapper) {
    // Add context enhancement adaptation
    wrapper.adaptations.set('context_enhancement', {
      additionalKeywords: ['typescript', 'utility', 'helper']
    });

    // Add file type specialization
    wrapper.adaptations.set('file_type_specialization', {
      fileTypeRules: {
        'ts': { specialized: true, confidence: 0.9 }
      }
    });

    console.log('\n✨ Adaptations Applied:');
    console.log('- Context Enhancement: Added TypeScript-related keywords');
    console.log('- File Type Specialization: Optimized for .ts files');
  }

  // After adaptation
  console.log('\nAfter Adaptation:');
  const afterResponse = await enhancedMaria.activate(beforeContext);
  console.log(`- Keywords matched: ${beforeContext.matchedKeywords?.length || 0}`);
  console.log(`- Context clarity: ${beforeContext.contextClarity || 'default'}`);
  console.log(`- Intelligence applied: ${afterResponse.context?.intelligence?.adaptationsApplied || 0} adaptations`);

  console.log('\n🎯 Result: Agent now provides more targeted analysis for TypeScript files!');
}

// Export for potential usage in other demos or tests
export {
  enhancedMaria,
  enhancedJames,
  enhancedMarcus,
  agentIntelligence,
  intelligenceDashboard
};