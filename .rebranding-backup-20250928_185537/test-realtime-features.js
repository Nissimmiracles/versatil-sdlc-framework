/**
 * Test script for VERSATIL Real-time SDLC Tracking & Auto-Update
 * Demonstrates Archon MCP, automatic MCP discovery, and real-time progress tracking
 */

const { VERSATILLogger } = require('./dist/utils/logger');
const { MCPAutoDiscoveryAgent } = require('./dist/agents/mcp/mcp-auto-discovery-agent');
const { MCPAutoUpdateSystem } = require('./dist/mcp/auto-update-system');
const { EnhancedArchonOrchestrator } = require('./dist/archon/enhanced-archon-orchestrator');
const { createArchonMCP } = require('./dist/mcp/archon-mcp');
const { AgentRegistry } = require('./dist/agents/agent-registry');
const { SDLCOrchestrator } = require('./dist/flywheel/sdlc-orchestrator');
const { EnhancedBMADCoordinator } = require('./dist/bmad/enhanced-bmad-coordinator');
const { RealTimeSDLCTracker } = require('./dist/tracking/realtime-sdlc-tracker');

async function testRealTimeFeatures() {
  console.log('🚀 Testing VERSATIL Real-time Features\n');
  
  const logger = new VERSATILLogger();
  const agentRegistry = new AgentRegistry();
  
  try {
    // Step 1: Initialize core components
    console.log('1️⃣ Initializing Core Components...');
    
    // Initialize SDLC Orchestrator
    const sdlcOrchestrator = new SDLCOrchestrator(agentRegistry, logger);
    
    // Initialize Enhanced BMAD Coordinator
    const bmadCoordinator = new EnhancedBMADCoordinator({
      ragEnabled: true,
      archonEnabled: true,
      autonomousMode: true
    });
    
    console.log('✅ Core components initialized\n');
    
    // Step 2: Initialize MCP Discovery and Auto-Update
    console.log('2️⃣ Starting MCP Auto-Discovery & Update System...');
    
    const discoveryAgent = new MCPAutoDiscoveryAgent(logger);
    const autoUpdateSystem = new MCPAutoUpdateSystem(discoveryAgent, {
      enabled: true,
      checkInterval: 5000, // 5 seconds for demo
      autoInstall: true,
      maxAutoInstalls: 3
    });
    
    // Listen for MCP updates
    autoUpdateSystem.on('update-applied', (update) => {
      console.log(`   ✅ MCP Update Applied: ${update.mcp.name} (${update.type})`);
    });
    
    autoUpdateSystem.on('updates-checked', (summary) => {
      console.log(`   📊 Update Check: ${summary.total} found, ${summary.applied} applied\n`);
    });
    
    console.log('✅ MCP Auto-Update system active\n');
    
    // Step 3: Initialize Archon MCP
    console.log('3️⃣ Starting Archon MCP with Auto-Updates...');
    
    const archon = new EnhancedArchonOrchestrator(agentRegistry);
    const archonMCP = createArchonMCP(archon, {
      autoUpdate: true,
      updateInterval: 10000 // 10 seconds for demo
    });
    
    await archonMCP.start();
    console.log('✅ Archon MCP operational\n');
    
    // Step 4: Initialize Real-time SDLC Tracker
    console.log('4️⃣ Starting Real-time SDLC Progress Tracker...');
    
    const realtimeTracker = new RealTimeSDLCTracker(
      sdlcOrchestrator,
      bmadCoordinator,
      agentRegistry,
      {
        updateInterval: 1000, // 1 second updates
        enableWebSocket: true,
        wsPort: 8080
      }
    );
    
    // Listen for real-time events
    realtimeTracker.on('task:started', (task) => {
      console.log(`   🔄 Task Started: ${task.taskName} by ${task.agentId}`);
    });
    
    realtimeTracker.on('task:completed', (task) => {
      console.log(`   ✅ Task Completed: ${task.taskName} (${Date.now() - task.startTime}ms)`);
    });
    
    realtimeTracker.on('phase:started', (data) => {
      console.log(`   📍 Phase Started: ${data.phase}`);
    });
    
    realtimeTracker.on('alert:task-timeout', (alert) => {
      console.log(`   ⚠️ Task Timeout Alert: ${alert.task.taskName}`);
    });
    
    console.log('✅ Real-time tracking active (WebSocket on port 8080)\n');
    
    // Step 5: Simulate SDLC Activity
    console.log('5️⃣ Simulating SDLC Activity...\n');
    
    // Create a test goal via Archon
    console.log('   Creating test goal via Archon MCP...');
    const goalResponse = await simulateArchonGoal(archon);
    console.log(`   ✅ Goal Created: ${goalResponse.goalId}\n`);
    
    // Trigger MCP discovery based on project needs
    console.log('   Discovering MCPs for current project...');
    const discoveryResult = await discoveryAgent.activate({
      trigger: 'discover-mcps'
    });
    console.log(`   ✅ Discovered ${discoveryResult.suggestions.length} MCPs\n`);
    
    // Get current SDLC context
    console.log('6️⃣ Current SDLC Context:\n');
    const context = realtimeTracker.getCurrentContext();
    
    console.log('   📊 Overall Progress:', `${context.metrics.overallProgress}%`);
    console.log('   🚀 Velocity:', `${context.metrics.velocity} tasks/hour`);
    console.log('   📅 Est. Completion:', new Date(context.metrics.estimatedCompletion).toLocaleString());
    console.log('   🚧 Blockers:', context.metrics.blockers.length);
    console.log('   ⚠️  Risks:', context.metrics.risks.length);
    
    console.log('\n   Phase Status:');
    Object.entries(context.phases).forEach(([phase, status]) => {
      console.log(`   - ${phase}: ${status.status} (${status.progress}%)`);
    });
    
    console.log('\n   Agent Status:');
    Object.entries(context.agents).forEach(([agent, status]) => {
      console.log(`   - ${agent}: ${status.status} (${status.performance.tasksCompleted} tasks completed)`);
    });
    
    // Step 7: Check MCP Auto-Update Status
    console.log('\n7️⃣ MCP Auto-Update Status:');
    const pendingUpdates = autoUpdateSystem.getPendingUpdates();
    console.log(`   📋 Pending Updates: ${pendingUpdates.length}`);
    if (pendingUpdates.length > 0) {
      pendingUpdates.forEach(update => {
        console.log(`   - ${update.mcp.name} (${update.type})`);
      });
    }
    
    // Step 8: Performance Metrics
    console.log('\n8️⃣ Performance Metrics:');
    const perfMetrics = realtimeTracker.getPerformanceMetrics();
    console.log(`   ⚡ Avg Task Duration: ${Math.round(perfMetrics.avgTaskDuration)}ms`);
    console.log(`   ✅ Success Rate: ${Math.round(perfMetrics.successRate)}%`);
    console.log(`   📈 Velocity Trend: ${perfMetrics.velocityTrend > 0 ? '+' : ''}${Math.round(perfMetrics.velocityTrend)}%`);
    
    // Wait for some activity
    console.log('\n⏳ Monitoring for 15 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Final status
    console.log('9️⃣ Final Status Check:');
    const finalContext = realtimeTracker.getCurrentContext();
    console.log(`   📊 Final Progress: ${finalContext.metrics.overallProgress}%`);
    console.log(`   ✅ Tasks Completed: ${Object.values(finalContext.agents).reduce((sum, a) => sum + a.performance.tasksCompleted, 0)}`);
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    realtimeTracker.stop();
    autoUpdateSystem.stop();
    await archonMCP.stop();
    
    console.log('\n✨ Real-time Features Test Complete!');
    console.log('\n💡 To view real-time updates, connect to WebSocket at ws://localhost:8080');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Helper function to simulate Archon goal creation
async function simulateArchonGoal(archon) {
  // In a real implementation, this would use the MCP interface
  const goal = await archon.createGoal({
    type: 'feature',
    description: 'Implement real-time progress tracking dashboard',
    priority: 'high',
    constraints: ['Use WebSocket for live updates', 'Support multiple concurrent users']
  });
  
  return {
    goalId: goal.id,
    status: goal.status,
    message: `Goal created: ${goal.type} - ${goal.description}`
  };
}

// Run test
testRealTimeFeatures().catch(console.error);
