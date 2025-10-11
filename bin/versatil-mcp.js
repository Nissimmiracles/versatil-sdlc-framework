#!/usr/bin/env node

/**
 * VERSATIL MCP Server Binary
 * Starts the VERSATIL Model Context Protocol server for full repository access
 */

import { VERSATILMCPServerV2 } from '../dist/mcp/versatil-mcp-server-v2.js';
import { AgentRegistry } from '../dist/agents/core/agent-registry.js';
import { SDLCOrchestrator } from '../dist/flywheel/sdlc-orchestrator.js';
import { VERSATILLogger } from '../dist/utils/logger.js';
import { PerformanceMonitor } from '../dist/analytics/performance-monitor.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const projectPath = process.argv[2] || process.cwd();

  console.error('🚀 Starting VERSATIL MCP Server...');
  console.error(`📁 Project Path: ${projectPath}`);
  console.error('🔗 Ready for MCP connections');
  console.error('');

  try {
    // Initialize framework components
    const logger = new VERSATILLogger({ level: 'info', name: 'mcp-server' });
    const performanceMonitor = new PerformanceMonitor({ logger });
    const agents = new AgentRegistry({ logger });
    const orchestrator = new SDLCOrchestrator({
      agents,
      logger,
      performanceMonitor,
      projectPath
    });

    // Create and start MCP server
    const server = new VERSATILMCPServerV2({
      name: 'claude-opera',
      version: '1.0.0',
      agents,
      orchestrator,
      logger,
      performanceMonitor,
    });

    await server.start();

    console.error('✅ VERSATIL MCP Server running');
    console.error('');
    console.error('Configuration example for Claude Desktop:');
    console.error('{');
    console.error('  "mcpServers": {');
    console.error('    "versatil": {');
    console.error(`      "command": "node",`);
    console.error(`      "args": ["${__filename}", "${projectPath}"]`);
    console.error('    }');
    console.error('  }');
    console.error('}');
  } catch (error) {
    console.error('❌ MCP Server failed to start:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);