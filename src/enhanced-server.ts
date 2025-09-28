/**
 * VERSATIL SDLC Framework v1.2.0
 * Enhanced Server Implementation
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { SDLCOrchestrator } from './flywheel/sdlc-orchestrator';
import { AgentRegistry } from './agents/agent-registry';
import { VERSATILLogger } from './utils/logger';
import { PerformanceMonitor } from './analytics/performance-monitor';
import { VERSATILMCPServer } from './mcp/versatil-mcp-server';
import { enhancedBMAD } from './bmad/enhanced-bmad-coordinator';
import { vectorMemoryStore } from './rag/vector-memory-store';
import { ArchonOrchestrator } from './archon/archon-orchestrator';
import * as path from 'path';

export async function startEnhancedServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer);
  
  // Initialize components
  const logger = new VERSATILLogger();
  const performanceMonitor = new PerformanceMonitor();
  const agentRegistry = new AgentRegistry();
  const orchestrator = new SDLCOrchestrator();
  
  // Initialize enhanced features
  await vectorMemoryStore.initialize();
  const archon = ArchonOrchestrator.getInstance();
  
  // Initialize MCP server
  const mcpServer = new VERSATILMCPServer({} as any);
  
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
        archon: true,
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
  
  // Archon endpoints
  app.post('/api/archon/goal', async (req, res) => {
    try {
      await archon.addGoal(req.body);
      res.json({ success: true, status: archon.getState() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/archon/status', (req, res) => {
    res.json(archon.getState());
  });
  
  // BMAD endpoints
  app.post('/api/bmad/execute', async (req, res) => {
    try {
      const { projectId, requirements } = req.body;
      await enhancedBMAD.executeBMADWorkflow(projectId, requirements);
      const context = await enhancedBMAD.getContext(projectId);
      res.json({ success: true, context });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // WebSocket for real-time updates
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Subscribe to Archon events
    archon.on('goal_completed', (data) => {
      socket.emit('archon:goal_completed', data);
    });
    
    archon.on('decision_made', (data) => {
      socket.emit('archon:decision', data);
    });
    
    // Subscribe to learning events
    enhancedBMAD.on('learning_milestone', (data) => {
      socket.emit('learning:milestone', data);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  // Start services
  await mcpServer.start();
  
  const PORT = process.env.PORT || 3788;
  httpServer.listen(PORT, () => {
    logger.info(`VERSATIL Enhanced Server running on port ${PORT}`, {
      mode: 'enhanced',
      features: ['rag', 'archon', 'enhanced-agents']
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
  enhancedBMAD.setAutonomousMode(true);
  const archon = ArchonOrchestrator.getInstance();
  archon.startAutonomous();
  
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
    archon.addGoal({
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
