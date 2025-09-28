/**
 * VERSATIL SDLC Framework - Initialize Opera MCP
 * Sets up Opera orchestration with MCP interface and automatic updates
 */

import { EnhancedOperaOrchestrator } from './dist/opera/enhanced-opera-orchestrator.js';
import { createOperaMCPServer } from './dist/opera/opera-mcp-server.js';
import { MCPAutoDiscoveryAgent } from './dist/agents/mcp/mcp-auto-discovery-agent.js';
import { VERSATILLogger } from './dist/utils/logger.js';
import { vectorMemoryStore } from './dist/rag/vector-memory-store.js';
import { environmentScanner } from './dist/environment/environment-scanner.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Load environment variables
dotenv.config();

class VERSATILMCPInitializer {
  constructor(config) {
    this.logger = new VERSATILLogger('VERSATILMCPInit');

    // ISOLATION: Framework home in user's home directory
    this.versatilHome = path.join(os.homedir(), '.versatil');

    this.config = {
      opera: {
        enabled: true,
        mcp: {
          autoUpdate: true,
          updateChannel: 'stable',
          updateInterval: 24 * 60 * 60 * 1000, // 24 hours
          backupBeforeUpdate: true
        }
      },
      autoDiscovery: {
        enabled: true,
        scanInterval: 60 * 60 * 1000 // 1 hour
      },
      rag: {
        enabled: true,
        autoIndex: true
      },
      ...config
    };
  }

  /**
   * Initialize VERSATIL with MCP support
   */
  async initialize() {
    try {
      this.logger.info('Initializing VERSATIL v1.2.0 with MCP support', {}, 'Init');

      // Ensure directories exist
      await this.ensureDirectories();

      // Initialize environment scanner
      await this.initializeEnvironmentScanner();

      // Initialize RAG if enabled
      if (this.config.rag.enabled) {
        await this.initializeRAG();
      }

      // Initialize Opera if enabled
      if (this.config.opera.enabled) {
        await this.initializeOpera();
      }

      // Initialize MCP auto-discovery
      if (this.config.autoDiscovery.enabled) {
        await this.initializeMCPDiscovery();
      }

      // Perform initial scan
      await this.performInitialScan();

      // Set up periodic tasks
      this.setupPeriodicTasks();

      this.logger.info('VERSATIL initialization complete', {
        opera: this.config.opera.enabled,
        mcp: this.config.autoDiscovery.enabled,
        rag: this.config.rag.enabled
      }, 'Init');

    } catch (error) {
      this.logger.error('Failed to initialize VERSATIL', { error }, 'Init');
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   * ISOLATION: All directories in ~/.versatil/ (user home), not project directory
   */
  async ensureDirectories() {
    const dirs = [
      this.versatilHome,
      path.join(this.versatilHome, 'backups'),
      path.join(this.versatilHome, 'backups', 'opera-mcp'),
      path.join(this.versatilHome, 'logs'),
      path.join(this.versatilHome, 'rag'),
      path.join(this.versatilHome, 'mcp'),
      path.join(this.versatilHome, 'supabase')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    this.logger.info('Framework directories created in ~/.versatil/', {
      home: this.versatilHome
    }, 'Init');
  }

  /**
   * Initialize environment scanner
   */
  async initializeEnvironmentScanner() {
    // Scanner is already a singleton, just trigger initial scan
    const context = await environmentScanner.scanEnvironment();
    this.logger.info('Environment scan complete', {
      projectType: context.projectInfo?.type,
      framework: context.technology?.framework,
      language: context.technology?.language
    }, 'Init');
  }

  /**
   * Initialize RAG system
   */
  async initializeRAG() {
    this.logger.info('Initializing RAG system', {}, 'Init');

    // Initialize vector store (already singleton)
    await vectorMemoryStore.initialize();

    if (this.config.rag.autoIndex) {
      // Index project documentation
      await this.indexProjectDocumentation();
    }
  }

  /**
   * Initialize Opera orchestrator
   */
  async initializeOpera() {
    this.logger.info('Initializing Opera orchestrator', {}, 'Init');

    // Create Opera instance
    this.opera = new EnhancedOperaOrchestrator(this.logger);
    await this.opera.initialize();

    // Initialize Opera MCP server
    this.operaMCP = createOperaMCPServer(this.opera, this.config.opera.mcp);
    
    // Start MCP server
    const port = process.env.OPERA_MCP_PORT ? parseInt(process.env.OPERA_MCP_PORT) : 3000;
    await this.operaMCP.start(port);

    this.logger.info(`Opera MCP server started on port ${port}`, {
      autoUpdate: this.config.opera.mcp.autoUpdate,
      updateChannel: this.config.opera.mcp.updateChannel
    }, 'Init');
  }

  /**
   * Initialize MCP auto-discovery
   */
  async initializeMCPDiscovery() {
    this.logger.info('Initializing MCP auto-discovery', {}, 'Init');

    this.mcpDiscovery = new MCPAutoDiscoveryAgent(this.logger);
    
    // Perform initial discovery
    const response = await this.mcpDiscovery.activate({
      agentId: 'mcp-discovery-agent',
      trigger: 'discover-mcps'
    });

    this.logger.info('Initial MCP discovery complete', {
      discovered: response.context?.discoveredMCPs?.length || 0
    }, 'Init');
  }

  /**
   * Index project documentation for RAG
   */
  async indexProjectDocumentation() {
    const docsToIndex = [
      'README.md',
      'ARCHITECTURE.md',
      'FULL_CONTEXT_AWARENESS_GUIDE.md',
      'COMPREHENSIVE_ANALYSIS_REPORT.md',
      'docs/**/*.md',
      'src/**/*.ts'
    ];

    let indexed = 0;
    for (const pattern of docsToIndex) {
      if (pattern.includes('*')) {
        // Glob pattern - would need glob library in production
        this.logger.debug(`Skipping glob pattern: ${pattern}`, {}, 'Init');
        continue;
      }

      try {
        const content = await fs.readFile(path.join(process.cwd(), pattern), 'utf-8');
        await vectorMemoryStore.storeMemory({
          content: JSON.stringify({
            type: 'documentation',
            path: pattern,
            content,
            indexed: Date.now()
          }),
          metadata: {
            agentId: 'system',
            timestamp: Date.now(),
            tags: ['documentation', 'project', path.extname(pattern).slice(1)]
          }
        });
        indexed++;
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    this.logger.info(`Indexed ${indexed} documentation files`, {}, 'Init');
  }

  /**
   * Perform initial project scan
   */
  async performInitialScan() {
    this.logger.info('Performing initial project scan', {}, 'Init');

    if (this.opera) {
      // Analyze project with Opera
      const analysis = await this.opera.analyzeProject('comprehensive');
      
      // Store analysis in RAG
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify({
          type: 'project_analysis',
          analysis,
          timestamp: Date.now()
        }),
        metadata: {
          agentId: 'opera',
          timestamp: Date.now(),
          tags: ['analysis', 'project', 'comprehensive']
        }
      });

      // Generate improvement suggestions
      if (analysis.suggestions?.length > 0) {
        this.logger.info('Project improvement suggestions:', {
          count: analysis.suggestions.length
        }, 'Init');

        for (const suggestion of analysis.suggestions.slice(0, 3)) {
          this.logger.info(`- ${suggestion.message}`, {
            priority: suggestion.priority
          }, 'Init');
        }
      }
    }
  }

  /**
   * Set up periodic tasks
   */
  setupPeriodicTasks() {
    // MCP discovery scan
    if (this.config.autoDiscovery.enabled && this.mcpDiscovery) {
      setInterval(async () => {
        try {
          await this.mcpDiscovery.activate({
            agentId: 'mcp-discovery-agent',
            trigger: 'discover-mcps'
          });
        } catch (error) {
          this.logger.error('MCP discovery scan failed', { error }, 'Init');
        }
      }, this.config.autoDiscovery.scanInterval);
    }

    // Environment scan
    setInterval(async () => {
      try {
        await environmentScanner.scanEnvironment();
        
        // Update Opera context
        if (this.opera) {
          const context = await environmentScanner.getLatestScan();
          await this.opera.updateEnvironmentContext(context);
        }
      } catch (error) {
        this.logger.error('Environment scan failed', { error }, 'Init');
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Check VERSATIL health status
   */
  async checkHealth() {
    const health = {
      status: 'healthy',
      version: '1.2.0',
      components: {
        opera: {
          enabled: this.config.opera.enabled,
          status: 'unknown'
        },
        mcp: {
          enabled: this.config.autoDiscovery.enabled,
          status: 'unknown'
        },
        rag: {
          enabled: this.config.rag.enabled,
          status: 'unknown'
        }
      },
      timestamp: Date.now()
    };

    // Check Opera
    if (this.opera) {
      try {
        const state = await this.opera.getState();
        health.components.opera.status = state ? 'healthy' : 'unhealthy';
      } catch {
        health.components.opera.status = 'error';
      }
    }

    // Check MCP
    if (this.operaMCP) {
      try {
        const metrics = await this.operaMCP.getMetrics();
        health.components.mcp.status = metrics ? 'healthy' : 'unhealthy';
      } catch {
        health.components.mcp.status = 'error';
      }
    }

    // Check RAG
    try {
      const memories = await vectorMemoryStore.searchMemories('health_check', { limit: 1 });
      health.components.rag.status = 'healthy';
    } catch {
      health.components.rag.status = 'error';
    }

    // Overall status
    const statuses = Object.values(health.components).map(c => c.status);
    if (statuses.includes('error')) {
      health.status = 'error';
    } else if (statuses.includes('unhealthy')) {
      health.status = 'unhealthy';
    }

    return health;
  }

  /**
   * Shutdown VERSATIL gracefully
   */
  async shutdown() {
    this.logger.info('Shutting down VERSATIL', {}, 'Init');

    // Stop Opera MCP
    if (this.operaMCP) {
      await this.operaMCP.stop();
    }

    // Stop other services
    // ...

    this.logger.info('VERSATIL shutdown complete', {}, 'Init');
  }
}

// Export initializer
export const versatilMCP = new VERSATILMCPInitializer();

// Auto-initialize (run directly)
if (require.main === module) {
  versatilMCP.initialize()
    .then(() => {
      console.log('🚀 VERSATIL v1.2.1 with MCP initialized successfully');
      console.log('📡 Opera MCP server running');
      console.log('🔄 Auto-update enabled');
      console.log('🔍 MCP auto-discovery active');
      console.log('\n✅ Press Ctrl+C to stop');
    })
    .catch((error) => {
      console.error('❌ Failed to initialize VERSATIL:', error);
      process.exit(1);
    });
}