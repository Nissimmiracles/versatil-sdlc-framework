#!/usr/bin/env node

/**
 * VERSATIL MCP Server Binary
 * Starts the VERSATIL Model Context Protocol server for full repository access
 */

import { startMCPServer } from '../dist/mcp-server.js';
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
  console.error('Usage in Claude Desktop config:');
  console.error('{');
  console.error('  "mcpServers": {');
  console.error('    "versatil": {');
  console.error(`      "command": "node",`);
  console.error(`      "args": ["${__filename}", "${projectPath}"]`);
  console.error('    }');
  console.error('  }');
  console.error('}');
  console.error('');

  try {
    await startMCPServer(projectPath);
  } catch (error) {
    console.error('❌ MCP Server failed to start:', error);
    process.exit(1);
  }
}

main().catch(console.error);