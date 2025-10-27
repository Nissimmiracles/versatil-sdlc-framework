#!/usr/bin/env node

/**
 * VERSATIL Framework - MCP Credentials Manager
 * Interactive credential setup for MCP servers
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_FILE = path.join(process.env.HOME, '.versatil', 'mcp-credentials.json');
const ENV_FILE = path.join(process.env.HOME, '.versatil', '.env');

// MCP credential requirements
const MCP_CREDENTIALS = {
  github: {
    name: 'GitHub',
    required: ['GITHUB_TOKEN'],
    optional: [],
    instructions: {
      GITHUB_TOKEN: 'Create at https://github.com/settings/tokens (needs repo, workflow scopes)'
    }
  },
  exa: {
    name: 'Exa Labs',
    required: ['EXA_API_KEY'],
    optional: [],
    instructions: {
      EXA_API_KEY: 'Get API key from https://exa.ai/dashboard'
    }
  },
  'vertex-ai': {
    name: 'Google Vertex AI',
    required: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_CLOUD_LOCATION', 'GOOGLE_APPLICATION_CREDENTIALS'],
    optional: [],
    instructions: {
      GOOGLE_CLOUD_PROJECT: 'Your GCP project ID',
      GOOGLE_CLOUD_LOCATION: 'Region (e.g., us-central1)',
      GOOGLE_APPLICATION_CREDENTIALS: 'Path to service account JSON file'
    }
  },
  supabase: {
    name: 'Supabase',
    required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    optional: ['SUPABASE_SERVICE_KEY'],
    instructions: {
      SUPABASE_URL: 'Project URL from https://app.supabase.com',
      SUPABASE_ANON_KEY: 'Anon/public key from project settings',
      SUPABASE_SERVICE_KEY: '(Optional) Service role key for admin operations'
    }
  },
  n8n: {
    name: 'n8n',
    required: ['N8N_BASE_URL', 'N8N_API_KEY'],
    optional: [],
    instructions: {
      N8N_BASE_URL: 'Your n8n instance URL (e.g., https://your-instance.app.n8n.cloud)',
      N8N_API_KEY: 'API key from n8n settings'
    }
  },
  semgrep: {
    name: 'Semgrep',
    required: ['SEMGREP_API_KEY'],
    optional: ['SEMGREP_APP_URL'],
    instructions: {
      SEMGREP_API_KEY: 'Get from https://semgrep.dev/manage/settings/tokens',
      SEMGREP_APP_URL: '(Optional) Custom Semgrep instance URL'
    }
  },
  sentry: {
    name: 'Sentry',
    required: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG'],
    optional: [],
    instructions: {
      SENTRY_DSN: 'DSN from project settings',
      SENTRY_AUTH_TOKEN: 'Auth token from https://sentry.io/settings/account/api/auth-tokens/',
      SENTRY_ORG: 'Your organization slug'
    }
  }
};

class CredentialManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(prompt) {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  async setupCredentials(mcpName) {
    const config = MCP_CREDENTIALS[mcpName];
    if (!config) {
      console.error(`❌ Unknown MCP: ${mcpName}`);
      return null;
    }

    console.log(`\n╔════════════════════════════════════════════════════╗`);
    console.log(`║  🔐 ${config.name} Credentials Setup`);
    console.log(`╚════════════════════════════════════════════════════╝\n`);

    const credentials = {};

    // Required credentials
    for (const key of config.required) {
      console.log(`📝 ${key}`);
      console.log(`   ${config.instructions[key]}\n`);
      const value = await this.question(`   Enter value (required): `);
      if (!value.trim()) {
        console.log(`   ⚠️  Skipping ${mcpName} - required field empty\n`);
        return null;
      }
      credentials[key] = value.trim();
    }

    // Optional credentials
    for (const key of config.optional) {
      console.log(`\n📝 ${key} (optional)`);
      console.log(`   ${config.instructions[key]}\n`);
      const value = await this.question(`   Enter value (press Enter to skip): `);
      if (value.trim()) {
        credentials[key] = value.trim();
      }
    }

    return credentials;
  }

  async saveCredentials(allCredentials) {
    // Ensure .versatil directory exists
    const versatilDir = path.dirname(CREDENTIALS_FILE);
    if (!fs.existsSync(versatilDir)) {
      fs.mkdirSync(versatilDir, { recursive: true });
    }

    // Save as JSON (encrypted in production)
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(allCredentials, null, 2), 'utf8');
    fs.chmodSync(CREDENTIALS_FILE, 0o600); // Restrict permissions

    // Also create .env file for easy sourcing
    const envContent = Object.entries(allCredentials)
      .flatMap(([mcp, creds]) =>
        Object.entries(creds).map(([key, value]) => `${key}="${value}"`)
      )
      .join('\n');

    fs.writeFileSync(ENV_FILE, envContent, 'utf8');
    fs.chmodSync(ENV_FILE, 0o600);

    console.log(`\n✅ Credentials saved securely:`);
    console.log(`   📍 ${CREDENTIALS_FILE}`);
    console.log(`   📍 ${ENV_FILE}\n`);
  }

  async loadCredentials() {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  }

  async interactiveSetup() {
    console.log(`\n╔════════════════════════════════════════════════════╗`);
    console.log(`║  🚀 VERSATIL MCP Credentials Manager             ║`);
    console.log(`╚════════════════════════════════════════════════════╝\n`);

    console.log(`Select MCPs to configure:\n`);
    const mcps = Object.keys(MCP_CREDENTIALS);
    mcps.forEach((mcp, i) => {
      console.log(`  ${i + 1}. ${MCP_CREDENTIALS[mcp].name} (${mcp})`);
    });
    console.log(`  0. Configure all`);
    console.log(`  q. Quit\n`);

    const choice = await this.question(`Enter choice: `);

    if (choice === 'q') {
      console.log(`\n👋 Goodbye!\n`);
      this.close();
      return;
    }

    let selectedMcps = [];
    if (choice === '0') {
      selectedMcps = mcps;
    } else {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < mcps.length) {
        selectedMcps = [mcps[index]];
      } else {
        console.log(`\n❌ Invalid choice\n`);
        this.close();
        return;
      }
    }

    const allCredentials = await this.loadCredentials();

    for (const mcp of selectedMcps) {
      const creds = await this.setupCredentials(mcp);
      if (creds) {
        allCredentials[mcp] = creds;
        console.log(`\n✅ ${MCP_CREDENTIALS[mcp].name} configured\n`);
      }
    }

    await this.saveCredentials(allCredentials);

    console.log(`\n📋 Next steps:`);
    console.log(`   1. Source environment variables: source ~/.versatil/.env`);
    console.log(`   2. Or export manually: export GITHUB_TOKEN="..."`);
    console.log(`   3. Restart Claude/Cursor to activate MCPs`);
    console.log(`   4. Test with: npm run mcp:health\n`);

    this.close();
  }

  async listCredentials() {
    const creds = await this.loadCredentials();
    console.log(`\n╔════════════════════════════════════════════════════╗`);
    console.log(`║  🔐 Configured MCP Credentials                    ║`);
    console.log(`╚═══════════════════��════════════════════════════════╝\n`);

    if (Object.keys(creds).length === 0) {
      console.log(`   No credentials configured yet.\n`);
      console.log(`   Run: versatil-credentials setup\n`);
      return;
    }

    Object.entries(creds).forEach(([mcp, config]) => {
      console.log(`  ✅ ${MCP_CREDENTIALS[mcp]?.name || mcp}`);
      Object.keys(config).forEach(key => {
        const masked = config[key].substring(0, 8) + '...';
        console.log(`     ${key}: ${masked}`);
      });
      console.log();
    });
  }

  close() {
    this.rl.close();
  }
}

async function main() {
  const manager = new CredentialManager();
  const command = process.argv[2];

  try {
    if (command === 'setup' || !command) {
      await manager.interactiveSetup();
    } else if (command === 'list') {
      await manager.listCredentials();
      manager.close();
    } else {
      console.log(`\nUsage: versatil-credentials [command]\n`);
      console.log(`Commands:`);
      console.log(`  setup    Interactive credential setup (default)`);
      console.log(`  list     List configured credentials\n`);
      manager.close();
    }
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    manager.close();
    process.exit(1);
  }
}

main();
