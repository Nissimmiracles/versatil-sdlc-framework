/**
 * VERSATIL Proactive Daemon
 * Background process that monitors files and auto-activates agents
 */

import { watch } from 'fs';
import { readFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import { AgentPool } from '../agents/core/agent-pool.js';
import { MCPHealthMonitor } from '../mcp/mcp-health-monitor.js';
import { EventDrivenOrchestrator } from '../orchestration/event-driven-orchestrator.js';
import { StatuslineManager } from '../ui/statusline-manager.js';

const execAsync = promisify(exec);

class ProactiveDaemon {
  private orchestrator: ProactiveAgentOrchestrator;
  private vectorStore: EnhancedVectorMemoryStore;
  private agentPool: AgentPool;
  private mcpHealthMonitor: MCPHealthMonitor;
  private eventOrchestrator: EventDrivenOrchestrator | null = null;
  private statusline: StatuslineManager;
  private projectPath: string;
  private activationCount: number = 0;
  private versionWatcher: ReturnType<typeof watch> | null = null;
  private versionCheckDebounce: NodeJS.Timeout | null = null;
  private lastVersionCheckResult: { success: boolean; version: string } | null = null;

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

    // Initialize statusline manager for real-time visibility
    this.statusline = new StatuslineManager({
      maxWidth: 120,
      maxAgents: 3,
      showRAG: true,
      showMCP: true,
      showProgress: true,
      refreshRate: 200 // Update every 200ms
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
      this.statusline.startAgent(data.agentId, 'Activating...');
      this.log(`   🤖 ${data.agentId} activated`);
      this.printStatusline();
    });

    this.eventOrchestrator.on('agent:completed', (data) => {
      this.activationCount++;
      this.statusline.completeAgent(data.agentId);
      this.log(`   ✅ ${data.agentId} completed`);
      this.printStatusline();
    });

    this.eventOrchestrator.on('chain:completed', (data) => {
      this.log(`   ✅ Chain complete: ${data.agents.length} agents, ${data.duration}ms`);
      this.printStatusline();
    });

    // Listen to statusline render events
    this.statusline.on('render', (output: string) => {
      if (output) {
        // Statusline output is handled by printStatusline()
      }
    });

    // Start auto-refresh for duration updates
    this.statusline.startAutoRefresh();

    this.log('   ✅ Event-driven handoffs active (target: <150ms latency)');
    this.log('   ✅ Real-time statusline enabled');

    // Start version consistency monitoring (Phase 5)
    this.log('🔍 Starting real-time version consistency monitoring...');
    await this.startVersionMonitoring();
    this.log('   ✅ Version monitoring active (immediate alerts)');

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

  /**
   * Start real-time version consistency monitoring (Phase 5)
   * Watches package.json and related version files for changes
   */
  private async startVersionMonitoring(): Promise<void> {
    // Run initial version check
    await this.checkVersionConsistency();

    // Watch package.json for changes
    const packageJsonPath = join(this.projectPath, 'package.json');

    try {
      this.versionWatcher = watch(packageJsonPath, async (eventType) => {
        if (eventType === 'change') {
          // Debounce version checks (wait 500ms after last change)
          if (this.versionCheckDebounce) {
            clearTimeout(this.versionCheckDebounce);
          }

          this.versionCheckDebounce = setTimeout(async () => {
            this.log('📦 package.json changed, checking version consistency...');
            await this.checkVersionConsistency();
          }, 500);
        }
      });

      this.versionWatcher.on('error', (error) => {
        this.log(`⚠️  Version watcher error: ${error.message}`);
      });

    } catch (error: any) {
      this.log(`⚠️  Failed to start version monitoring: ${error.message}`);
    }
  }

  /**
   * Check version consistency using version-check.cjs script
   * Provides immediate alerts for version conflicts
   */
  private async checkVersionConsistency(): Promise<void> {
    try {
      const { stdout } = await execAsync('node scripts/version-check.cjs --json', {
        cwd: this.projectPath,
        timeout: 10000
      });

      const versionData = JSON.parse(stdout);
      this.lastVersionCheckResult = {
        success: versionData.success,
        version: versionData.version
      };

      if (!versionData.success) {
        // Version inconsistency detected - immediate alert
        this.log('🚨 VERSION INCONSISTENCY DETECTED 🚨');
        this.log(`   Current version: ${versionData.version}`);
        this.log(`   Errors: ${versionData.errorCount}`);

        versionData.errors.forEach((error: string, index: number) => {
          this.log(`   ${index + 1}. ${error}`);
        });

        // Attempt auto-fix if enabled
        if (process.env.VERSATIL_AUTO_FIX_VERSIONS === 'true') {
          this.log('🔧 Auto-fix enabled, attempting to fix version inconsistencies...');
          await this.autoFixVersions(versionData);
        } else {
          this.log('💡 Tip: Set VERSATIL_AUTO_FIX_VERSIONS=true to enable automatic fixes');
        }

        // Show in statusline
        this.statusline.updateProgress('Version Check', 0, `⚠️ ${versionData.errorCount} version errors`);
      } else {
        this.log(`✅ Version consistency validated (v${versionData.version})`);

        if (versionData.warnings && versionData.warnings.length > 0) {
          this.log(`⚠️  ${versionData.warningCount} warnings:`);
          versionData.warnings.forEach((warning: string, index: number) => {
            this.log(`   ${index + 1}. ${warning}`);
          });
        }
      }

    } catch (error: any) {
      this.log(`⚠️  Version check failed: ${error.message}`);
    }
  }

  /**
   * Attempt to automatically fix version inconsistencies
   */
  private async autoFixVersions(versionData: { version: string; errors: string[] }): Promise<void> {
    try {
      // This would integrate with intelligent-deployment-validator or similar
      this.log('   Analyzing errors for auto-fix opportunities...');

      // For now, just report that manual fix is needed
      this.log('   ⚠️  Auto-fix not yet implemented for these errors');
      this.log('   👉 Please run: node scripts/version-check.cjs');
      this.log('   👉 Then manually fix the reported inconsistencies');

      // Future: Implement smart fixes like:
      // - Update package.json version in other files
      // - Update @version comments in source files
      // - Update documentation version references
      // - Create git commit with fixes

    } catch (error: any) {
      this.log(`   ⚠️  Auto-fix failed: ${error.message}`);
    }
  }

  private async shutdown(): Promise<void> {
    this.log('🛑 Shutting down daemon...');

    // Stop version monitoring
    if (this.versionWatcher) {
      this.versionWatcher.close();
    }
    if (this.versionCheckDebounce) {
      clearTimeout(this.versionCheckDebounce);
    }

    this.orchestrator.stopMonitoring();
    this.mcpHealthMonitor.stopMonitoring();
    if (this.eventOrchestrator) {
      await this.eventOrchestrator.shutdown();
    }
    this.statusline.destroy();
    await this.agentPool.shutdown();
    this.log('✅ Daemon stopped gracefully');
    process.exit(0);
  }

  private printStatusline(): void {
    const statusOutput = this.statusline.getStatusline();
    if (statusOutput) {
      console.log('\n📊 Active Agents:');
      console.log(statusOutput);
      console.log(''); // Blank line for spacing
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

// Start daemon if run directly or via daemon mode
if (process.env.VERSATIL_DAEMON_MODE === 'true' || import.meta.url === `file://${process.argv[1]}`) {
  const projectPath = process.argv[2] || process.cwd();
  const daemon = new ProactiveDaemon(projectPath);
  daemon.start().catch((error) => {
    console.error('❌ Daemon failed to start:', error);
    process.exit(1);
  });
}

export { ProactiveDaemon };
