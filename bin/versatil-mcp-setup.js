#!/usr/bin/env node

/**
 * VERSATIL Framework - MCP Auto-Setup CLI
 * Automatically configures VERSATIL MCP Server in Claude Desktop and Cursor
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import the auto-configurator (after build)
async function main() {
  try {
    const { mcpAutoConfigurator } = await import(`${projectRoot}/dist/mcp/mcp-auto-configurator.js`);

    const projectPath = process.argv[2] || process.cwd();
    await mcpAutoConfigurator.autoConfigureAll(projectPath);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ MCP Auto-configuration failed:',error.message);
    console.error('\nPlease ensure the framework is built:');
    console.error('  npm run build\n');
    process.exit(1);
  }
}

main();
