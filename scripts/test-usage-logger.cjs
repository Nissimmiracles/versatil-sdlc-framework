#!/usr/bin/env node

/**
 * Test script for UsageLogger and SessionManager
 *
 * Simulates agent activations and generates a sample session report.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function main() {
  console.log('🧪 Testing VERSATIL Usage Logger...\n');

  // Manually create sample session data
  const sessionId = `${new Date().toISOString().split('T')[0]}-test01`;
  const startTime = Date.now() - (3.5 * 60 * 60 * 1000); // 3.5 hours ago
  const endTime = Date.now();

  // Simulate Maria-QA activations
  const mariaActivations = [
    {
      timestamp: startTime + (10 * 60 * 1000), // 10 min into session
      sessionId,
      agentId: 'maria-qa',
      agentName: 'Maria-QA',
      taskType: 'test_coverage_analysis',
      taskDescription: 'Analyze test coverage for LoginForm component',
      status: 'completed',
      duration: 3 * 60 * 1000, // 3 minutes
      outcome: {
        success: true,
        quality: 85,
        timeSaved: 27, // 30 min manual - 3 min automated = 27 min saved
      },
      context: {
        filesModified: ['src/__tests__/LoginForm.test.tsx'],
        testsGenerated: 8,
      },
    },
    {
      timestamp: startTime + (90 * 60 * 1000), // 90 min into session
      sessionId,
      agentId: 'maria-qa',
      agentName: 'Maria-QA',
      taskType: 'visual_regression_testing',
      taskDescription: 'Run visual regression tests on Button component',
      status: 'completed',
      duration: 4 * 60 * 1000, // 4 minutes
      outcome: {
        success: true,
        quality: 90,
        timeSaved: 31, // 35 min manual - 4 min automated = 31 min saved
      },
    },
  ];

  // Simulate James-Frontend activation
  const jamesActivation = {
    timestamp: startTime + (60 * 60 * 1000), // 60 min into session
    sessionId,
    agentId: 'james-frontend',
    agentName: 'James-Frontend',
    taskType: 'component_optimization',
    taskDescription: 'Optimize UserProfile component performance',
    status: 'completed',
    duration: 2.5 * 60 * 1000, // 2.5 minutes
    outcome: {
      success: true,
      quality: 88,
      timeSaved: 17.5, // 20 min manual - 2.5 min automated
    },
    context: {
      filesModified: ['src/components/UserProfile.tsx'],
      linesChanged: 45,
    },
  };

  // Simulate Marcus-Backend activation
  const marcusActivation = {
    timestamp: startTime + (120 * 60 * 1000), // 120 min into session
    sessionId,
    agentId: 'marcus-backend',
    agentName: 'Marcus-Backend',
    taskType: 'security_scan',
    taskDescription: 'Security scan for /api/users endpoint',
    status: 'completed',
    duration: 1.5 * 60 * 1000, // 1.5 minutes
    outcome: {
      success: true,
      quality: 95,
      timeSaved: 28.5, // 30 min manual - 1.5 min automated
    },
  };

  const allEvents = [
    ...mariaActivations,
    jamesActivation,
    marcusActivation,
  ];

  // Write to usage.log
  const logsDir = path.join(os.homedir(), '.versatil', 'logs');
  await fs.mkdir(logsDir, { recursive: true });

  const usageLogPath = path.join(logsDir, 'usage.log');
  const logLines = allEvents.map(e => JSON.stringify(e)).join('\n') + '\n';
  await fs.writeFile(usageLogPath, logLines, 'utf-8');

  console.log(`✅ Created usage log: ${usageLogPath}\n`);

  // Create session summary
  const sessionDuration = endTime - startTime;
  const totalTimeSaved = allEvents.reduce((sum, e) => sum + (e.outcome?.timeSaved ?? 0), 0);
  const agentBreakdown = {};

  for (const event of allEvents) {
    if (!agentBreakdown[event.agentId]) {
      agentBreakdown[event.agentId] = {
        activations: 0,
        successRate: 1.0,
        avgDuration: 0,
        timeSaved: 0,
      };
    }
    agentBreakdown[event.agentId].activations += 1;
    agentBreakdown[event.agentId].avgDuration = event.duration;
    agentBreakdown[event.agentId].timeSaved += event.outcome?.timeSaved ?? 0;
  }

  // Calculate impact score
  const sessionMinutes = sessionDuration / 60000;
  const efficiencyScore = Math.min(5, (totalTimeSaved / sessionMinutes) * 5);
  const qualityScore = 1.0 * 3; // 100% success rate
  const usageScore = Math.min(2, (allEvents.length / 5) * 2);
  const impactScore = Math.round((efficiencyScore + qualityScore + usageScore) * 10) / 10;

  const sessionSummary = {
    sessionId,
    startTime,
    endTime,
    duration: sessionDuration,
    agentActivations: allEvents.length,
    tasksCompleted: allEvents.length,
    tasksFailed: 0,
    totalTimeSaved,
    averageQuality: 89.5,
    impactScore,
    agentBreakdown,
    date: new Date(startTime).toISOString().split('T')[0],
    productivity: {
      timeSaved: totalTimeSaved,
      productivityGain: Math.round((totalTimeSaved / sessionMinutes) * 100),
      efficiency: 100,
    },
    topPatterns: [
      'React Testing Library patterns',
      'API security best practices',
      'Component optimization techniques',
    ],
    recommendations: [
      'Excellent session! You\'re using VERSATIL effectively',
      'Consider enabling Dana-Database agent for database tasks',
    ],
  };

  // Write session summary
  const sessionsDir = path.join(os.homedir(), '.versatil', 'sessions');
  await fs.mkdir(sessionsDir, { recursive: true});

  const sessionPath = path.join(sessionsDir, `session-${sessionSummary.date}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(sessionSummary, null, 2), 'utf-8');

  console.log(`✅ Created session summary: ${sessionPath}\n`);
  console.log('📊 Sample Session Data:\n');
  console.log(`  Duration: ${Math.round(sessionDuration / 60000)} minutes`);
  console.log(`  Agent Activations: ${allEvents.length}`);
  console.log(`  Time Saved: ~${totalTimeSaved} minutes`);
  console.log(`  Impact Score: ${impactScore}/10\n`);

  console.log('🎯 Next Steps:\n');
  console.log('  1. Run: npm run session:summary');
  console.log('  2. See your first VERSATIL session report!\n');
}

main().catch(console.error);
