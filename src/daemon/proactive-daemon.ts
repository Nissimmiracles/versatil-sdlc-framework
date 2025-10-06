/**
 * VERSATIL Proactive Daemon
 * Background process that monitors files and auto-activates agents
 */

import { watch } from 'fs';
import { readFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { AgentPool } from '../agents/agent-pool.js';
import { MCPHealthMonitor } from '../mcp/mcp-health-monitor.js';
import { EventDrivenOrchestrator } from '../orchestration/event-driven-orchestrator.js';

class ProactiveDaemon {
  private orchestrator: ProactiveAgentOrchestrator;
  private vectorStore: EnhancedVectorMemoryStore;
  private agentPool: AgentPool;
  private mcpHealthMonitor: MCPHealthMonitor;
  private eventOrchestrator: EventDrivenOrchestrator | null = null;
  private projectPath: string;
  private activationCount: number = 0;

  constructor(projectPath: string) {
    this.projectPath = projectPath;

    // Initialize with proactive configuration
    this.orchestrator = new ProactiveAgentOrchestrator({
      enabled: true,
      autoActivation: true,
      backgroundMonitoring: true,
      inlineSuggestions: true,
      statuslineUpdates: true,
      slashCommandsFallback: true
    });

    // Initialize vector store for RAG context
    this.vectorStore = new EnhancedVectorMemoryStore();

    // Initialize agent pool for warm-up (50% performance boost)
    this.agentPool = new AgentPool({
      poolSize: 3, // 3 instances per agent type
      warmUpOnInit: true,
      enableAdaptive: true,
      minPoolSize: 2,
      maxPoolSize: 5
    });

    // Initialize MCP health monitoring
    this.mcpHealthMonitor = new MCPHealthMonitor({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      backoffMultiplier: 2
    });

    this.log('🚀 VERSATIL Proactive Daemon initialized');
    this.log(`   Project: ${projectPath}`);
    this.log(`   PID: ${process.pid}`);
  }

  async start(): Promise<void> {
    this.log('▶️  Starting file system monitoring...');

    // Initialize agent pool (lazy warm-up mode)
    this.log('🔥 Initializing agent pool...');
    try {
      await this.agentPool.initialize();
      this.log('   ✅ Agent pool ready (lazy warm-up mode)');
      this.log('   ℹ️  Agents will warm up in background');
    } catch (error: any) {
      this.log(`   ⚠️  Agent pool initialization warning: ${error.message}`);
      this.log('   ℹ️  Agents will be created on-demand (degraded mode)');
    }

    // Start MCP health monitoring
    this.log('🏥 Starting MCP health monitoring...');
    this.mcpHealthMonitor.startMonitoring();
    this.mcpHealthMonitor.on('mcp-health-changed', (event) => {
      if (!event.health.healthy) {
        this.log(`⚠️  MCP unhealthy: ${event.mcpId} (consecutive failures: ${event.health.consecutiveFailures})`);
      }
    });
    this.log('   ✅ MCP monitoring active (95% reliability target)');

    // Initialize event-driven orchestrator (30% faster handoffs)
    this.log('⚡ Initializing event-driven orchestrator...');
    this.eventOrchestrator = new EventDrivenOrchestrator(this.agentPool);

    // Setup event listeners for statusline updates
    this.eventOrchestrator.on('agent:activated', (data) => {
      this.log(`   🤖 ${data.agentId} activated`);
    });
    this.eventOrchestrator.on('agent:completed', (data) => {
      this.activationCount++;
      this.log(`   ✅ ${data.agentId} completed`);
    });
    this.eventOrchestrator.on('chain:completed', (data) => {
      this.log(`   ✅ Chain complete: ${data.agents.length} agents, ${data.duration}ms`);
    });

    this.log('   ✅ Event-driven handoffs active (target: <150ms latency)');

    // Start orchestrator monitoring
    this.orchestrator.startMonitoring(this.projectPath);

    // Listen for agent activations
    this.orchestrator.on('agents-completed', (event) => {
      this.activationCount++;
      this.log(`✅ Agents completed: ${event.agentIds.join(', ')}`);
      this.log(`   File: ${event.filePath}`);
      this.log(`   Results: ${JSON.stringify(event.results.map(r => ({ agent: r.agent, score: r.context?.qualityScore || r.context?.analysisScore })))}`);
    });

    this.orchestrator.on('agents-failed', (event) => {
      this.log(`❌ Agent activation failed: ${event.agentIds.join(', ')}`);
      this.log(`   Error: ${event.error.message}`);
    });

    this.log('✅ Daemon started successfully');
    this.log('   Monitoring for file changes...');

    // Keep process alive with an infinite loop that yields to event loop
    const keepAlive = () => {
      setTimeout(keepAlive, 1000); // Re-schedule itself
    };
    keepAlive();

    // Handle shutdown signals
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());

    // Periodic status reports
    setInterval(() => this.reportStatus(), 5 * 60 * 1000); // Every 5 minutes
  }

  private reportStatus(): void {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    this.log('📊 Status Report:');
    this.log(`   Uptime: ${hours}h ${minutes}m`);
    this.log(`   Agent activations: ${this.activationCount}`);
    this.log(`   Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

    // Agent pool statistics
    const poolStats = this.agentPool.getStats();
    const totalHits = Number(Object.values(poolStats.hits).reduce((a: number, b: number) => a + b, 0));
    const totalMisses = Number(Object.values(poolStats.misses).reduce((a: number, b: number) => a + b, 0));
    const hitRate = (totalHits + totalMisses) > 0 ? (totalHits / (totalHits + totalMisses) * 100) : 0;
    this.log(`   Agent pool hit rate: ${hitRate.toFixed(1)}%`);

    // MCP health status
    const mcpStats = this.mcpHealthMonitor.getOverallHealth();
    const healthyMCPs = Object.values(mcpStats).filter(h => h.healthy).length;
    this.log(`   MCP health: ${healthyMCPs}/${Object.keys(mcpStats).length} healthy`);

    // Event orchestrator metrics
    if (this.eventOrchestrator) {
      const eventMetrics = this.eventOrchestrator.getMetrics();
      this.log(`   Handoff latency: ${eventMetrics.averageLatency.toFixed(0)}ms (target: <150ms)`);
      this.log(`   Handoff improvement: ${eventMetrics.improvement} faster than polling`);
      this.log(`   Active chains: ${this.eventOrchestrator.getActiveChains().length}`);
    }
  }

  private async shutdown(): Promise<void> {
    this.log('🛑 Shutting down daemon...');
    this.orchestrator.stopMonitoring();
    this.mcpHealthMonitor.stopMonitoring();
    if (this.eventOrchestrator) {
      await this.eventOrchestrator.shutdown();
    }
    await this.agentPool.shutdown();
    this.log('✅ Daemon stopped gracefully');
    process.exit(0);
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

// Start daemon if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  const daemon = new ProactiveDaemon(projectPath);
  daemon.start().catch((error) => {
    console.error('❌ Daemon failed to start:', error);
    process.exit(1);
  });
}

export { ProactiveDaemon };
