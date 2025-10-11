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
import { dirname, join } from 'path';
import { appendFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP Server Log File (for debugging without interfering with stdio)
const VERSATIL_HOME = join(homedir(), '.versatil');
const LOG_FILE = join(VERSATIL_HOME, 'mcp-server.log');

// Ensure .versatil directory exists
try {
  mkdirSync(VERSATIL_HOME, { recursive: true });
} catch (err) {
  // Directory already exists, ignore
}

/**
 * Log to file without interfering with stdio protocol
 */
function log(...args) {
  const message = args.join(' ');
  const timestamp = new Date().toISOString();
  try {
    appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  } catch (err) {
    // Silently fail - don't interfere with MCP protocol
  }
}

async function main() {
  const projectPath = process.argv[2] || process.cwd();

  log('🚀 Starting VERSATIL MCP Server...');
  log(`📁 Project Path: ${projectPath}`);
  log('🔗 Ready for MCP connections');
  log('');

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

    log('✅ VERSATIL MCP Server running');
    log(`📊 Log file: ${LOG_FILE}`);
    log('');
    log('MCP Server connected via stdio transport');
    log('Tools: 15 | Resources: 5 | Prompts: 5');
  } catch (error) {
    log('❌ MCP Server failed to start:', error);
    log(error.stack);
    console.error('❌ MCP Server failed to start:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);