/**
 * VERSATIL Proactive Daemon
 * Background process that monitors files and auto-activates agents
 */

import { watch } from 'fs';
import { readFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

class ProactiveDaemon {
  private orchestrator: ProactiveAgentOrchestrator;
  private vectorStore: EnhancedVectorMemoryStore;
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

    this.log('🚀 VERSATIL Proactive Daemon initialized');
    this.log(`   Project: ${projectPath}`);
    this.log(`   PID: ${process.pid}`);
  }

  async start(): Promise<void> {
    this.log('▶️  Starting file system monitoring...');

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
  }

  private async shutdown(): Promise<void> {
    this.log('🛑 Shutting down daemon...');
    this.orchestrator.stopMonitoring();
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
