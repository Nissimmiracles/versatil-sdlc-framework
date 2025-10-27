#!/usr/bin/env node

/**
 * Fix MCP configurations for Claude Desktop and Cursor
 * Adds proper timeout and alwaysAllow settings
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const CLAUDE_CONFIG_PATHS = [
  path.join(os.homedir(), '.config/Claude/claude_desktop_config.json'),
  path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'),
];

const CURSOR_CONFIG_PATHS = [
  path.join(os.homedir(), '.cursor/mcp.json'),
  path.join(os.homedir(), 'Library/Application Support/Cursor/User/mcp.json'),
];

const VERSATIL_BIN = path.join(__dirname, '../bin/versatil-mcp.js');
const VERSATIL_ROOT = path.join(__dirname, '..');

function updateConfig(configPath, isClaudeDesktop = true) {
  if (!fs.existsSync(configPath)) {
    console.log(`⏭️  Config not found: ${configPath}`);
    return false;
  }

  console.log(`📝 Updating: ${configPath}`);

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    // Update opera MCP server config
    const serverKey = isClaudeDesktop ? 'mcpServers' : 'mcpServers';
    if (!config[serverKey]) {
      config[serverKey] = {};
    }

    // Enhanced configuration with timeout and alwaysAllow
    config[serverKey]['claude-opera'] = {
      command: 'node',
      args: [VERSATIL_BIN, VERSATIL_ROOT],
      cwd: VERSATIL_ROOT,
      env: {
        VERSATIL_PROJECT_PATH: VERSATIL_ROOT,
        VERSATIL_MCP_MODE: 'true',
        VERSATIL_HOME: path.join(os.homedir(), '.versatil'),
        VERSATIL_RULES_ENABLED: 'true',
        RULE_1_PARALLEL_EXECUTION: 'true',
        RULE_2_STRESS_TESTING: 'true',
        RULE_3_DAILY_AUDIT: 'true',
        NODE_ENV: 'production'
      },
      timeout: 60000, // 60 seconds (increased from default 30s)
      alwaysAllow: [
        'versatil_health_check',
        'versatil_get_status',
        'opera_get_status',
        'opera_get_goals',
        'opera_health_check'
      ]
    };

    // Write back
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Updated: ${configPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${configPath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   🔧 Fix MCP Configurations   🔧                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let updated = 0;

  // Update Claude Desktop configs
  console.log('📱 Claude Desktop:');
  for (const configPath of CLAUDE_CONFIG_PATHS) {
    if (updateConfig(configPath, true)) {
      updated++;
    }
  }

  // Update Cursor configs
  console.log('\n💻 Cursor:');
  for (const configPath of CURSOR_CONFIG_PATHS) {
    if (updateConfig(configPath, false)) {
      updated++;
    }
  }

  console.log(`\n✨ Updated ${updated} configuration(s)`);
  console.log('\n🔄 Next steps:');
  console.log('1. Restart Claude Desktop and/or Cursor');
  console.log('2. Test with: call versatil_health_check');
  console.log('3. Check logs: tail -f ~/.versatil/mcp-server.log\n');
}

main();
