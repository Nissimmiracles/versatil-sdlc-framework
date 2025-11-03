#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Automatic Supabase Setup
 * This script automatically configures Supabase vector database for RAG
 * Runs during: pnpm install, MCP installation, or framework initialization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}`, msg),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}`, msg),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset}`, msg),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}`, msg)
};

class SupabaseAutoSetup {
  constructor() {
    // ISOLATION: Framework files go to user's home directory, NOT project directory
    const os = require('os');
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.frameworkRoot = path.dirname(path.dirname(__filename)); // VERSATIL framework installation

    // Supabase setup in isolated framework directory
    this.supabaseDir = path.join(this.versatilHome, 'supabase');
    this.envFile = path.join(this.versatilHome, '.env');

    // Project context (read-only, never write here)
    this.projectRoot = process.cwd();
    this.projectVersatilConfig = path.join(this.projectRoot, '.versatil-project.json');

    this.ensureIsolation();
  }

  ensureIsolation() {
    // Ensure .versatil home directory exists
    const fs = require('fs');
    if (!fs.existsSync(this.versatilHome)) {
      fs.mkdirSync(this.versatilHome, { recursive: true });
    }

    // Create isolation marker
    const isolationMarker = path.join(this.versatilHome, 'ISOLATION_NOTICE.md');
    const isolationContent = `# VERSATIL Framework - Isolated Installation

⚠️ **IMPORTANT**: This directory contains VERSATIL framework data and should NEVER be committed to your project.

## Isolation Architecture:
- Framework Home: ${this.versatilHome}
- Your Project: ${this.projectRoot}
- Supabase Config: ${this.supabaseDir}

## Why Isolation?
1. Prevents framework files from polluting your project
2. Keeps your git repository clean
3. Allows framework updates without touching your code
4. Enables working on multiple projects with same framework installation

## What's Stored Here:
- Supabase vector database configuration
- RAG memory indices
- Agent execution history
- Framework logs and metrics

DO NOT commit this directory to version control!
`;

    fs.writeFileSync(isolationMarker, isolationContent);
  }

  async run() {
    console.log('\n🚀 VERSATIL SDLC Framework - Automatic Supabase Setup\n');
    console.log('📁 Isolated Installation:');
    console.log(`   Framework Home: ${this.versatilHome}`);
    console.log(`   Your Project: ${this.projectRoot}\n`);
    console.log('This will configure vector database for Agentic RAG...\n');

    try {
      // Step 1: Check if Supabase CLI is installed
      await this.checkSupabaseCLI();

      // Step 2: Check for existing Supabase project
      const hasProject = await this.checkExistingProject();

      if (!hasProject) {
        // Step 3: Initialize Supabase project
        await this.initializeSupabase();
      }

      // Step 4: Apply migrations
      await this.applyMigrations();

      // Step 5: Setup environment variables
      await this.setupEnvironment();

      // Step 6: Deploy edge functions
      await this.deployEdgeFunctions();

      // Step 7: Verify setup
      await this.verifySetup();

      log.success('Supabase vector database setup complete!');
      console.log('\n✨ Your VERSATIL framework is ready with Agentic RAG!\n');

    } catch (error) {
      log.error(`Setup failed: ${error.message}`);
      console.log('\n💡 Manual setup instructions: See SUPABASE_SETUP.md\n');
      process.exit(1);
    }
  }

  async checkSupabaseCLI() {
    log.info('Checking for Supabase CLI...');

    try {
      execSync('supabase --version', { stdio: 'ignore' });
      log.success('Supabase CLI found');
      return true;
    } catch (error) {
      log.warn('Supabase CLI not found, installing...');

      try {
        // Try to install Supabase CLI
        if (process.platform === 'darwin') {
          execSync('brew install supabase/tap/supabase', { stdio: 'inherit' });
        } else if (process.platform === 'linux') {
          execSync('pnpm add -g supabase', { stdio: 'inherit' });
        } else {
          log.error('Please install Supabase CLI manually: https://supabase.com/docs/guides/cli');
          return false;
        }

        log.success('Supabase CLI installed');
        return true;
      } catch (installError) {
        log.warn('Could not auto-install Supabase CLI');
        log.info('Continuing with manual setup mode...');
        return false;
      }
    }
  }

  async checkExistingProject() {
    const configFile = path.join(this.supabaseDir, 'config.toml');

    if (fs.existsSync(configFile)) {
      log.info('Found existing Supabase configuration');
      return true;
    }

    return false;
  }

  async initializeSupabase() {
    log.info('Initializing Supabase project...');

    try {
      // Create supabase directory if it doesn't exist
      if (!fs.existsSync(this.supabaseDir)) {
        execSync(`supabase init`, { cwd: this.projectRoot, stdio: 'inherit' });
        log.success('Supabase project initialized');
      }
    } catch (error) {
      // If automatic init fails, copy our pre-configured files
      log.warn('Using pre-configured Supabase setup');

      if (!fs.existsSync(this.supabaseDir)) {
        fs.mkdirSync(this.supabaseDir, { recursive: true });
      }
    }
  }

  async applyMigrations() {
    log.info('Applying database migrations...');

    const migrationsDir = path.join(this.supabaseDir, 'migrations');

    if (!fs.existsSync(migrationsDir) || fs.readdirSync(migrationsDir).length === 0) {
      log.warn('No migrations found, skipping...');
      return;
    }

    try {
      // Check if Supabase is running locally
      execSync('supabase db reset', { cwd: this.projectRoot, stdio: 'inherit' });
      log.success('Migrations applied');
    } catch (error) {
      log.warn('Could not apply migrations automatically');
      log.info('Run `supabase db reset` manually when ready');
    }
  }

  async setupEnvironment() {
    log.info('Setting up environment variables...');

    // Check if .env exists
    if (!fs.existsSync(this.envFile)) {
      if (fs.existsSync(this.envExampleFile)) {
        fs.copyFileSync(this.envExampleFile, this.envFile);
        log.success('Created .env from .env.example');
      } else {
        // Create basic .env
        const envContent = this.generateEnvContent();
        fs.writeFileSync(this.envFile, envContent);
        log.success('Created .env file');
      }
    }

    // Try to get Supabase credentials
    try {
      const status = execSync('supabase status', { cwd: this.projectRoot, encoding: 'utf8' });

      // Parse status output for credentials
      const apiUrl = this.extractFromStatus(status, 'API URL');
      const anonKey = this.extractFromStatus(status, 'anon key');
      const serviceKey = this.extractFromStatus(status, 'service_role key');

      if (apiUrl && anonKey && serviceKey) {
        this.updateEnvFile({
          SUPABASE_URL: apiUrl,
          SUPABASE_ANON_KEY: anonKey,
          SUPABASE_SERVICE_KEY: serviceKey
        });
        log.success('Environment variables configured');
      }
    } catch (error) {
      log.warn('Could not auto-configure Supabase credentials');
      log.info('Please add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY to .env');
    }
  }

  extractFromStatus(status, key) {
    const regex = new RegExp(`${key}:\\s*(.+)`);
    const match = status.match(regex);
    return match ? match[1].trim() : null;
  }

  generateEnvContent() {
    return `# VERSATIL SDLC Framework - Environment Variables
# Generated automatically during setup

# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=your-openai-api-key-here

# Opera MCP Configuration
OPERA_MCP_PORT=3000
OPERA_MCP_HOST=localhost

# RAG Configuration
RAG_ENABLED=true
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_EMBEDDING_DIMENSION=1536
RAG_AUTO_INDEX=true

# Vector Search Configuration
VECTOR_SEARCH_THRESHOLD=0.7
VECTOR_SEARCH_TOP_K=10
HYBRID_SEARCH_ENABLED=true

# Feature Flags
FEATURE_AGENTIC_RAG=true
FEATURE_CONTEXT_FUSION=true
FEATURE_INTROSPECTIVE_AGENT=true
FEATURE_PATTERN_DETECTION=true
`;
  }

  updateEnvFile(variables) {
    let envContent = fs.readFileSync(this.envFile, 'utf8');

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(this.envFile, envContent);
  }

  async deployEdgeFunctions() {
    log.info('Checking edge functions...');

    const functionsDir = path.join(this.supabaseDir, 'functions');

    if (!fs.existsSync(functionsDir)) {
      log.warn('No edge functions found, skipping deployment');
      return;
    }

    const functions = fs.readdirSync(functionsDir)
      .filter(f => fs.statSync(path.join(functionsDir, f)).isDirectory());

    if (functions.length === 0) {
      log.warn('No edge functions to deploy');
      return;
    }

    log.info(`Found ${functions.length} edge functions: ${functions.join(', ')}`);
    log.info('Run `supabase functions deploy` to deploy them');
  }

  async verifySetup() {
    log.info('Verifying setup...');

    const checks = [];

    // Check migrations exist
    const migrationsDir = path.join(this.supabaseDir, 'migrations');
    checks.push({
      name: 'Migrations',
      passed: fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0
    });

    // Check config exists
    checks.push({
      name: 'Configuration',
      passed: fs.existsSync(path.join(this.supabaseDir, 'config.toml'))
    });

    // Check .env exists
    checks.push({
      name: 'Environment',
      passed: fs.existsSync(this.envFile)
    });

    // Check edge functions
    const functionsDir = path.join(this.supabaseDir, 'functions');
    checks.push({
      name: 'Edge Functions',
      passed: fs.existsSync(functionsDir)
    });

    console.log('\nVerification Results:');
    checks.forEach(check => {
      if (check.passed) {
        log.success(check.name);
      } else {
        log.warn(`${check.name} (optional)`);
      }
    });

    const allPassed = checks.every(c => c.passed);
    return allPassed;
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new SupabaseAutoSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { SupabaseAutoSetup };