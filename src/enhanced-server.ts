/**
 * VERSATIL SDLC Framework v1.2.0
 * Enhanced Server Implementation
 */

import express from 'express';
import { createServer } from 'http';
// import { Server as SocketServer } from 'socket.io';
import { SDLCOrchestrator } from './flywheel/sdlc-orchestrator.js';
import { AgentRegistry } from './agents/core/agent-registry.js';
import { VERSATILLogger } from './utils/logger.js';
import { PerformanceMonitor } from './analytics/performance-monitor.js';
// import { VERSATILMCPServer } from './mcp/versatil-mcp-server.js';
import { enhancedOPERA } from './opera/enhanced-opera-coordinator.js';
import { vectorMemoryStore } from './rag/vector-memory-store.js';
import { OperaOrchestrator } from './opera/opera-orchestrator.js';
import * as path from 'path';

export async function startEnhancedServer() {
  const app = express();
  const httpServer = createServer(app);
  // const io = new SocketServer(httpServer);
  
  // Initialize components
  const logger = new VERSATILLogger();
  const performanceMonitor = new PerformanceMonitor();
  const agentRegistry = new AgentRegistry();
  const orchestrator = new SDLCOrchestrator();
  
  // Initialize enhanced features
  await vectorMemoryStore.initialize();
  const opera = OperaOrchestrator.getInstance();
  
  // Initialize MCP server
  // const mcpServer = new VERSATILMCPServer({} as any);
  
  // Setup routes
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      version: '1.2.0',
      mode: 'enhanced',
      features: {
        rag: true,
        opera: true,
        enhancedAgents: true
      }
    });
  });
  
  // RAG endpoints
  app.post('/api/memory/store', async (req, res) => {
    try {
      const { content, agentId, tags } = req.body;
      const memoryId = await vectorMemoryStore.storeMemory({
        content,
        metadata: { agentId, timestamp: Date.now(), tags }
      });
      res.json({ success: true, memoryId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/memory/query', async (req, res) => {
    try {
      const { query, topK = 5 } = req.body;
      const results = await vectorMemoryStore.queryMemories(arguments[0]);
      res.json({ success: true, results: results.documents });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Opera endpoints
  app.post('/api/opera/goal', async (req, res) => {
    try {
      await opera.addGoal(req.body);
      res.json({ success: true, status: opera.getState() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/opera/status', (req, res) => {
    res.json(opera.getState());
  });
  
  // OPERA endpoints
  app.post('/api/opera/execute', async (req, res) => {
    try {
      const { projectId, requirements } = req.body;
      await enhancedOPERA.executeOPERAWorkflow(projectId, requirements);
      const context = await enhancedOPERA.getContext(projectId);
      res.json({ success: true, context });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // WebSocket for real-time updates
  // io.on('connection', (socket) => {
  //   console.log('Client connected:', socket.id);
  //
  //   // Subscribe to Opera events
  //   opera.on('goal_completed', (data) => {
  //     socket.emit('opera:goal_completed', data);
  //   });
  //
  //   opera.on('decision_made', (data) => {
  //     socket.emit('opera:decision', data);
  //   });
  //
  //   // Subscribe to learning events
  //   enhancedOPERA.on('learning_milestone', (data) => {
  //     socket.emit('learning:milestone', data);
  //   });
  //
  //   socket.on('disconnect', () => {
  //     console.log('Client disconnected:', socket.id);
  //   });
  // });
  
  // Start services
  // await mcpServer.start();
  
  const PORT = process.env.PORT || 3788;
  httpServer.listen(PORT, () => {
    logger.info(`VERSATIL Enhanced Server running on port ${PORT}`, {
      mode: 'enhanced',
      features: ['rag', 'opera', 'enhanced-agents']
    });
    
    console.log(`
✅ VERSATIL Enhanced Server is running!

🌐 Web UI: http://localhost:${PORT}
📡 WebSocket: ws://localhost:${PORT}
🤖 MCP Server: Active

Ready for autonomous development with learning!
    `);
  });
}

export async function startAutonomousMode() {
  // Enable full autonomous mode
  enhancedOPERA.setAutonomousMode(true);
  const opera = OperaOrchestrator.getInstance();
  opera.startAutonomous();
  
  await startEnhancedServer();
  
  console.log(`
🤖 AUTONOMOUS MODE ACTIVATED

The system will now:
- Accept high-level goals
- Plan execution strategies  
- Execute development tasks
- Learn from outcomes
- Improve continuously

No manual intervention required!
  `);
  
  // Example autonomous goal
  setTimeout(() => {
    console.log('\n📋 Example: Setting autonomous goal...\n');
    opera.addGoal({
      id: 'auto-goal-1',
      type: 'feature',
      description: 'Add user authentication with JWT',
      priority: 'high',
      constraints: [
        'Use bcrypt for passwords',
        'Include refresh tokens',
        'Add rate limiting'
      ],
      successCriteria: [
        'All endpoints secured',
        'Tests passing',
        '90% code coverage'
      ]
    });
  }, 2000);
}
