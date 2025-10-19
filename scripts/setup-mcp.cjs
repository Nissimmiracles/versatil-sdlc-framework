#!/usr/bin/env node

/**
 * MCP Setup Wizard
 *
 * Interactive CLI tool for configuring VERSATIL Framework MCP servers.
 *
 * Features:
 * - Interactive MCP selection
 * - API key validation
 * - Auto-detect existing configurations
 * - Isolation enforcement (credentials → ~/.versatil/.env)
 * - Automatic health check after setup
 *
 * Usage:
 *   npm run mcp:setup
 *   node scripts/setup-mcp.cjs
 *   node scripts/setup-mcp.cjs --only=github
 *   node scripts/setup-mcp.cjs --no-validate
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const os = require('os');

// ============================================================================
// Configuration
// ============================================================================

const VERSATIL_HOME = path.join(os.homedir(), '.versatil');
const ENV_FILE = path.join(VERSATIL_HOME, '.env');
const MCP_CONFIG_FILE = path.join(process.cwd(), '.cursor', 'mcp_config.json');

const MCP_DEFINITIONS = {
  // Critical MCPs (required)
  github: {
    name: 'GitHub MCP',
    description: 'Repository operations, PR automation',
    category: 'critical',
    agents: ['Marcus', 'Sarah', 'Alex'],
    env_vars: ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'],
    package: '@modelcontextprotocol/server-github',
    setupTime: 5
  },
  playwright: {
    name: 'Playwright MCP',
    description: 'Browser automation, E2E testing',
    category: 'critical',
    agents: ['Maria-QA', 'James'],
    env_vars: ['PLAYWRIGHT_BROWSERS_PATH', 'PLAYWRIGHT_MCP_HEADLESS', 'PLAYWRIGHT_MCP_TIMEOUT'],
    package: '@playwright/mcp',
    setupTime: 10
  },
  supabase: {
    name: 'Supabase MCP',
    description: 'Vector database, RAG memory',
    category: 'critical',
    agents: ['All agents'],
    env_vars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'],
    package: 'supabase-mcp',
    setupTime: 15
  },

  // High-priority MCPs (recommended)
  gitmcp: {
    name: 'GitMCP',
    description: 'GitHub docs, anti-hallucination',
    category: 'high-priority',
    agents: ['Alex', 'Marcus', 'James', 'Dr.AI'],
    env_vars: [],  // Uses GitHub token
    package: 'mcp-remote',
    setupTime: 3
  },
  semgrep: {
    name: 'Semgrep MCP',
    description: 'Security scanning (30+ languages)',
    category: 'high-priority',
    agents: ['Marcus', 'Maria', 'Dr.AI'],
    env_vars: ['SEMGREP_API_KEY', 'SEMGREP_CONFIG'],
    package: 'semgrep-mcp',
    setupTime: 5
  },
  sentry: {
    name: 'Sentry MCP',
    description: 'Error monitoring, performance tracking',
    category: 'high-priority',
    agents: ['Maria', 'Marcus', 'Sarah'],
    env_vars: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG'],
    package: 'sentry-mcp-stdio',
    setupTime: 10
  },

  // Optional MCPs
  exa: {
    name: 'Exa Search MCP',
    description: 'AI-powered web search',
    category: 'optional',
    agents: ['Alex', 'Dr.AI'],
    env_vars: ['EXA_API_KEY'],
    package: 'exa-mcp-server',
    setupTime: 5
  },
  'vertex-ai': {
    name: 'Vertex AI MCP',
    description: 'Google Cloud AI (Gemini models)',
    category: 'optional',
    agents: ['Dr.AI', 'Marcus'],
    env_vars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS'],
    package: 'vertex-ai-mcp-server',
    setupTime: 15
  },
  n8n: {
    name: 'n8n MCP',
    description: 'Workflow automation (525+ nodes)',
    category: 'optional',
    agents: ['Sarah', 'Marcus', 'Maria'],
    env_vars: ['N8N_BASE_URL', 'N8N_API_KEY'],
    package: 'n8n-nodes-mcp',
    setupTime: 10
  },
  shadcn: {
    name: 'Shadcn MCP',
    description: 'Component library integration',
    category: 'optional',
    agents: ['James'],
    env_vars: ['SHADCN_MCP_ENABLED', 'SHADCN_COMPONENTS_PATH'],
    package: 'shadcn-mcp',
    setupTime: 3
  },
  'ant-design': {
    name: 'Ant Design MCP',
    description: 'React component system',
    category: 'optional',
    agents: ['James'],
    env_vars: ['ANT_DESIGN_TOKEN'],
    package: 'ant-design-mcp',
    setupTime: 3
  },
  'claude-code': {
    name: 'Claude Code MCP',
    description: 'Enhanced Claude integration',
    category: 'optional',
    agents: ['All agents'],
    env_vars: ['MCP_CLAUDE_DEBUG'],
    package: '@steipete/claude-code-mcp',
    setupTime: 2
  }
};

// ============================================================================
// ANSI Colors
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function drawLine(char = '─', length = 60) {
  log(char.repeat(length), 'dim');
}

function drawHeader(title) {
  console.log();
  drawLine('━');
  log(`  ${title}`, 'bright');
  drawLine('━');
  console.log();
}

// ============================================================================
// Utility Functions
// ============================================================================

function ensureDirectories() {
  const dirs = [VERSATIL_HOME, path.dirname(MCP_CONFIG_FILE)];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`✓ Created directory: ${dir}`, 'green');
    }
  });
}

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }

  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

function saveEnvFile(env) {
  const lines = Object.entries(env).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(ENV_FILE, lines.join('\n'), 'utf-8');

  // Secure permissions
  fs.chmodSync(ENV_FILE, 0o600);
  log(`✓ Credentials saved to ${ENV_FILE}`, 'green');
}

function loadMCPConfig() {
  if (!fs.existsSync(MCP_CONFIG_FILE)) {
    return { mcpServers: {} };
  }

  return JSON.parse(fs.readFileSync(MCP_CONFIG_FILE, 'utf-8'));
}

function saveMCPConfig(config) {
  fs.writeFileSync(MCP_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  log(`✓ MCP config updated at ${MCP_CONFIG_FILE}`, 'green');
}

// ============================================================================
// Interactive Prompts
// ============================================================================

class InteractivePrompt {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(prompt) {
    return new Promise(resolve => {
      this.rl.question(`${prompt} `, resolve);
    });
  }

  async confirm(prompt, defaultValue = true) {
    const answer = await this.question(`${prompt} (${defaultValue ? 'Y/n' : 'y/N'})`);
    if (!answer) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  async select(prompt, options) {
    console.log(`\n${prompt}\n`);
    options.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt}`);
    });

    const answer = await this.question('\nSelect option (number)');
    const index = parseInt(answer) - 1;

    if (index >= 0 && index < options.length) {
      return options[index];
    }

    return null;
  }

  async multiSelect(prompt, options) {
    console.log(`\n${prompt}`);
    console.log('(Press space to toggle, enter to confirm)\n');

    const selected = [];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const answer = await this.confirm(`  ${opt.name}`, opt.default || false);
      if (answer) {
        selected.push(opt.id);
      }
    }

    return selected;
  }

  close() {
    this.rl.close();
  }
}

// ============================================================================
// MCP Configuration
// ============================================================================

class MCPSetupWizard {
  constructor() {
    this.prompt = new InteractivePrompt();
    this.env = loadEnvFile();
    this.mcpConfig = loadMCPConfig();
  }

  async run(options = {}) {
    try {
      ensureDirectories();

      drawHeader('VERSATIL Framework - MCP Setup Wizard');

      log('This wizard will help you configure MCP servers for the framework.', 'cyan');
      log('Credentials will be stored in ~/.versatil/.env (secure isolation).\n', 'cyan');

      // Select MCPs to configure
      const selectedMCPs = options.only ?
        [options.only] :
        await this.selectMCPs();

      if (selectedMCPs.length === 0) {
        log('No MCPs selected. Exiting.', 'yellow');
        return;
      }

      // Configure each MCP
      for (const mcpId of selectedMCPs) {
        await this.configureMCP(mcpId);
      }

      // Save configurations
      saveEnvFile(this.env);
      saveMCPConfig(this.mcpConfig);

      // Validate isolation
      log('');
      drawHeader('Validating Configuration');
      await this.validateIsolation();

      // Run health check
      if (!options.noValidate) {
        log('');
        drawHeader('Running Health Checks');
        await this.runHealthCheck();
      }

      log('');
      drawHeader('Setup Complete!');
      log('✅ MCPs configured successfully', 'green');
      log('');
      log('Next steps:', 'bright');
      log('  1. Run health check: npm run mcp:health', 'dim');
      log('  2. Test integration: npm run test:integration', 'dim');
      log('  3. Start daemon: versatil-daemon start', 'dim');

    } catch (error) {
      log(`\n❌ Error: ${error.message}`, 'red');
      process.exit(1);
    } finally {
      this.prompt.close();
    }
  }

  async selectMCPs() {
    const categories = {
      critical: [],
      'high-priority': [],
      optional: []
    };

    // Group MCPs by category
    Object.entries(MCP_DEFINITIONS).forEach(([id, mcp]) => {
      categories[mcp.category].push({ id, ...mcp });
    });

    // Create selection options
    const options = [];

    log('Critical MCPs (Required):', 'bright');
    categories.critical.forEach(mcp => {
      options.push({
        id: mcp.id,
        name: `${mcp.name} - ${mcp.description}`,
        default: true
      });
      log(`  ◉ ${mcp.name} - ${mcp.description}`, 'green');
    });

    log('\nHigh-Priority MCPs (Recommended):', 'bright');
    categories['high-priority'].forEach(mcp => {
      options.push({
        id: mcp.id,
        name: `${mcp.name} - ${mcp.description}`,
        default: true
      });
      log(`  ○ ${mcp.name} - ${mcp.description}`, 'yellow');
    });

    log('\nOptional MCPs:', 'bright');
    categories.optional.forEach(mcp => {
      options.push({
        id: mcp.id,
        name: `${mcp.name} - ${mcp.description}`,
        default: false
      });
      log(`  ○ ${mcp.name} - ${mcp.description}`, 'dim');
    });

    const selected = await this.prompt.multiSelect(
      '\nWhich MCPs would you like to configure?',
      options
    );

    return selected;
  }

  async configureMCP(mcpId) {
    const mcp = MCP_DEFINITIONS[mcpId];
    if (!mcp) {
      log(`Unknown MCP: ${mcpId}`, 'red');
      return;
    }

    drawHeader(`Configuring ${mcp.name}`);
    log(`Description: ${mcp.description}`, 'dim');
    log(`Agents: ${mcp.agents.join(', ')}`, 'dim');
    log(`Setup Time: ~${mcp.setupTime} minutes`, 'dim');
    console.log();

    // Check if already configured
    const hasExisting = mcp.env_vars.some(envVar => this.env[envVar]);
    if (hasExisting) {
      const reconfigure = await this.prompt.confirm(
        'MCP already configured. Reconfigure?',
        false
      );
      if (!reconfigure) {
        log('Skipping...', 'yellow');
        return;
      }
    }

    // Configure environment variables
    for (const envVar of mcp.env_vars) {
      await this.configureEnvVar(envVar, mcpId);
    }

    // Add MCP to config
    this.addMCPToConfig(mcpId);

    log(`✓ ${mcp.name} configured`, 'green');
  }

  async configureEnvVar(envVar, mcpId) {
    const existing = this.env[envVar];
    const prompt = existing ?
      `${envVar} (current: ${existing.substring(0, 10)}...):` :
      `${envVar}:`;

    const value = await this.prompt.question(prompt);

    if (value) {
      this.env[envVar] = value;

      // Validate if possible
      const isValid = await this.validateEnvVar(envVar, value, mcpId);
      if (!isValid) {
        log(`⚠️  Warning: ${envVar} validation failed`, 'yellow');
        const retry = await this.prompt.confirm('Retry?', true);
        if (retry) {
          await this.configureEnvVar(envVar, mcpId);
        }
      }
    } else if (!existing) {
      log(`⚠️  Warning: ${envVar} not set`, 'yellow');
    }
  }

  async validateEnvVar(envVar, value, mcpId) {
    // Basic validation
    if (!value || value.trim() === '') {
      return false;
    }

    // Specific validations
    if (envVar === 'GITHUB_TOKEN') {
      return value.startsWith('ghp_') && value.length === 40;
    }

    if (envVar === 'SUPABASE_URL') {
      return value.startsWith('https://') && value.includes('.supabase.co');
    }

    if (envVar === 'SENTRY_DSN') {
      return value.startsWith('https://') && value.includes('.ingest.sentry.io');
    }

    return true;
  }

  addMCPToConfig(mcpId) {
    const mcp = MCP_DEFINITIONS[mcpId];

    // MCP config structure varies by server
    const configs = {
      github: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: '${GITHUB_TOKEN}'
        },
        description: 'Official GitHub MCP for repository operations'
      },
      playwright: {
        command: 'npx',
        args: ['-y', '@playwright/mcp@latest'],
        env: {
          PLAYWRIGHT_BROWSERS_PATH: '${PLAYWRIGHT_BROWSERS_PATH}'
        },
        description: 'Browser automation for E2E testing'
      },
      supabase: {
        command: 'npx',
        args: ['-y', 'supabase-mcp'],
        env: {
          SUPABASE_URL: '${SUPABASE_URL}',
          SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
          SUPABASE_SERVICE_KEY: '${SUPABASE_SERVICE_KEY}'
        },
        description: 'Vector database for RAG memory'
      },
      gitmcp: {
        command: 'npx',
        args: ['-y', 'mcp-remote', 'https://gitmcp.io/docs'],
        description: 'GitMCP for GitHub repository documentation'
      },
      semgrep: {
        command: 'npx',
        args: ['-y', 'semgrep-mcp'],
        env: {
          SEMGREP_API_KEY: '${SEMGREP_API_KEY}',
          SEMGREP_APP_URL: '${SEMGREP_APP_URL}'
        },
        description: 'Security scanning for 30+ languages'
      },
      sentry: {
        command: 'npx',
        args: ['-y', 'sentry-mcp-stdio'],
        env: {
          SENTRY_DSN: '${SENTRY_DSN}',
          SENTRY_AUTH_TOKEN: '${SENTRY_AUTH_TOKEN}',
          SENTRY_ORG: '${SENTRY_ORG}'
        },
        description: 'Error monitoring with AI-powered analysis'
      }
    };

    if (configs[mcpId]) {
      this.mcpConfig.mcpServers[mcpId] = configs[mcpId];
    }
  }

  async validateIsolation() {
    // Check credentials are in ~/.versatil/
    const projectEnv = path.join(process.cwd(), '.env');
    if (fs.existsSync(projectEnv)) {
      log('⚠️  Warning: .env file found in project directory', 'yellow');
      log('   Credentials should be in ~/.versatil/.env', 'yellow');

      const move = await this.prompt.confirm('Move to ~/.versatil/.env?', true);
      if (move) {
        const projectEnvContent = fs.readFileSync(projectEnv, 'utf-8');
        fs.appendFileSync(ENV_FILE, '\n' + projectEnvContent);
        fs.unlinkSync(projectEnv);
        log('✓ Credentials moved to ~/.versatil/.env', 'green');
      }
    } else {
      log('✓ Isolation validated', 'green');
    }
  }

  async runHealthCheck() {
    log('Running MCP health checks...\n', 'cyan');

    return new Promise((resolve) => {
      const healthCheck = spawn('npm', ['run', 'mcp:health'], {
        stdio: 'inherit',
        shell: true
      });

      healthCheck.on('close', (code) => {
        if (code === 0) {
          log('\n✓ All MCPs healthy', 'green');
        } else {
          log('\n⚠️  Some MCPs unhealthy - check output above', 'yellow');
        }
        resolve();
      });
    });
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const options = {
    only: null,
    noValidate: false,
    show: false
  };

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--only=')) {
      options.only = arg.split('=')[1];
    } else if (arg === '--no-validate') {
      options.noValidate = true;
    } else if (arg === '--show') {
      options.show = true;
    }
  }

  // Show current config
  if (options.show) {
    const config = loadMCPConfig();
    const env = loadEnvFile();

    drawHeader('Current MCP Configuration');
    log(JSON.stringify(config, null, 2));

    drawHeader('Environment Variables');
    Object.keys(env).forEach(key => {
      if (!key.includes('KEY') && !key.includes('TOKEN') && !key.includes('SECRET')) {
        log(`${key}=${env[key]}`, 'dim');
      } else {
        log(`${key}=${env[key].substring(0, 10)}...`, 'dim');
      }
    });

    return;
  }

  // Run wizard
  const wizard = new MCPSetupWizard();
  await wizard.run(options);
}

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MCPSetupWizard, MCP_DEFINITIONS };
