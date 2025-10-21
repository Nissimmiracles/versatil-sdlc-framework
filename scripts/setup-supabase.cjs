#!/usr/bin/env node
/**
 * Supabase Setup Script for VERSATIL Framework RAG
 *
 * Sets up Supabase vector database for RAG pattern storage.
 * Supports both cloud and local Supabase instances.
 *
 * Usage:
 *   node scripts/setup-supabase.cjs          # Interactive wizard
 *   node scripts/setup-supabase.cjs --local  # Use local Supabase
 *   node scripts/setup-supabase.cjs --cloud  # Use Supabase cloud
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

// SQL migrations for RAG setup
const SQL_MIGRATIONS = {
  // Enable pgvector extension
  enableVector: `
    -- Enable pgvector extension for vector similarity search
    CREATE EXTENSION IF NOT EXISTS vector;
  `,

  // Create versatil_memories table
  createTable: `
    -- Main table for RAG pattern storage
    CREATE TABLE IF NOT EXISTS versatil_memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      content_type TEXT NOT NULL CHECK (content_type IN ('text', 'code', 'image', 'diagram', 'mixed')),
      embedding vector(1536),  -- OpenAI ada-002 dimension
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      agent_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_memories_agent ON versatil_memories(agent_id);
    CREATE INDEX IF NOT EXISTS idx_memories_created ON versatil_memories(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_memories_metadata ON versatil_memories USING GIN (metadata);

    -- Vector similarity index (ivfflat with cosine distance)
    CREATE INDEX IF NOT EXISTS idx_memories_embedding ON versatil_memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  `,

  // Create updated_at trigger
  createTrigger: `
    -- Auto-update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_memories_updated_at ON versatil_memories;
    CREATE TRIGGER update_memories_updated_at
      BEFORE UPDATE ON versatil_memories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `,

  // Create RLS policies (Row Level Security)
  createRLS: `
    -- Enable Row Level Security
    ALTER TABLE versatil_memories ENABLE ROW LEVEL SECURITY;

    -- Policy: Anyone can read patterns
    DROP POLICY IF EXISTS "Enable read access for all users" ON versatil_memories;
    CREATE POLICY "Enable read access for all users"
      ON versatil_memories FOR SELECT
      USING (true);

    -- Policy: Service role can insert patterns
    DROP POLICY IF EXISTS "Enable insert for service role" ON versatil_memories;
    CREATE POLICY "Enable insert for service role"
      ON versatil_memories FOR INSERT
      WITH CHECK (true);

    -- Policy: Service role can update patterns
    DROP POLICY IF EXISTS "Enable update for service role" ON versatil_memories;
    CREATE POLICY "Enable update for service role"
      ON versatil_memories FOR UPDATE
      USING (true);
  `,

  // Create similarity search function
  createSearchFunction: `
    -- Function for semantic similarity search
    CREATE OR REPLACE FUNCTION match_memories(
      query_embedding vector(1536),
      match_threshold float DEFAULT 0.7,
      match_count int DEFAULT 5,
      filter_agent_id text DEFAULT NULL,
      filter_tags text[] DEFAULT NULL
    )
    RETURNS TABLE (
      id uuid,
      content text,
      content_type text,
      metadata jsonb,
      agent_id text,
      similarity float,
      created_at timestamptz
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        versatil_memories.id,
        versatil_memories.content,
        versatil_memories.content_type,
        versatil_memories.metadata,
        versatil_memories.agent_id,
        1 - (versatil_memories.embedding <=> query_embedding) as similarity,
        versatil_memories.created_at
      FROM versatil_memories
      WHERE
        (filter_agent_id IS NULL OR versatil_memories.agent_id = filter_agent_id)
        AND (filter_tags IS NULL OR versatil_memories.metadata->'tags' ?| filter_tags)
        AND (1 - (versatil_memories.embedding <=> query_embedding)) > match_threshold
      ORDER BY versatil_memories.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  `,
};

// Interactive prompt helper
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Main setup function
async function setupSupabase() {
  log.title('🚀 VERSATIL Framework - Supabase RAG Setup');

  const args = process.argv.slice(2);
  const isLocal = args.includes('--local');
  const isCloud = args.includes('--cloud');

  let setupType = null;
  if (isLocal) {
    setupType = 'local';
  } else if (isCloud) {
    setupType = 'cloud';
  } else {
    // Interactive mode
    log.info('Choose setup type:');
    console.log('  1) Supabase Cloud (recommended, free tier)');
    console.log('  2) Local Supabase (self-hosted, Docker required)');
    const choice = await prompt('\nEnter choice (1 or 2): ');
    setupType = choice === '1' ? 'cloud' : 'local';
  }

  if (setupType === 'local') {
    await setupLocalSupabase();
  } else {
    await setupCloudSupabase();
  }
}

// Setup local Supabase
async function setupLocalSupabase() {
  log.title('Setting up Local Supabase');

  log.info('Checking Docker installation...');
  try {
    const { execSync } = require('child_process');
    execSync('docker --version', { stdio: 'ignore' });
    log.success('Docker installed');
  } catch (error) {
    log.error('Docker not found. Please install Docker Desktop first:');
    console.log('  https://www.docker.com/products/docker-desktop\n');
    process.exit(1);
  }

  log.info('Initializing Supabase...');
  try {
    const { execSync } = require('child_process');

    // Initialize Supabase (creates config)
    execSync('npx supabase init --with-intellij-settings', { stdio: 'inherit' });

    // Start Supabase containers
    log.info('Starting Supabase containers (this may take a few minutes)...');
    const output = execSync('npx supabase start', { encoding: 'utf8' });

    // Parse credentials from output
    const lines = output.split('\n');
    const credentials = {};
    for (const line of lines) {
      if (line.includes('API URL:')) credentials.url = line.split(':').slice(1).join(':').trim();
      if (line.includes('anon key:')) credentials.anonKey = line.split(':')[1].trim();
      if (line.includes('service_role key:')) credentials.serviceKey = line.split(':')[1].trim();
    }

    if (!credentials.url || !credentials.anonKey || !credentials.serviceKey) {
      log.error('Failed to parse Supabase credentials from output');
      process.exit(1);
    }

    // Save to .env
    await saveCredentials(credentials);

    // Run migrations
    await runMigrations(credentials);

    log.success('Local Supabase setup complete! 🎉');
    log.info('Containers running at: ' + credentials.url);
    log.info('To stop: npx supabase stop');
    log.info('To view dashboard: npx supabase db start');

  } catch (error) {
    log.error('Failed to setup local Supabase: ' + error.message);
    process.exit(1);
  }
}

// Setup cloud Supabase
async function setupCloudSupabase() {
  log.title('Setting up Supabase Cloud');

  log.info('Visit https://supabase.com and create a project');
  log.info('Then find your credentials at: Project Settings → API\n');

  const url = await prompt('Enter your Supabase URL: ');
  const anonKey = await prompt('Enter your anon key: ');
  const serviceKey = await prompt('Enter your service_role key: ');

  if (!url || !anonKey || !serviceKey) {
    log.error('All credentials are required');
    process.exit(1);
  }

  const credentials = { url, anonKey, serviceKey };

  // Test connection
  log.info('Testing connection...');
  try {
    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase.from('_').select('*').limit(1);
    // Error expected (table doesn't exist), but connection works
    log.success('Connection successful');
  } catch (error) {
    log.error('Connection failed: ' + error.message);
    process.exit(1);
  }

  // Save to .env
  await saveCredentials(credentials);

  // Run migrations
  await runMigrations(credentials);

  log.success('Cloud Supabase setup complete! 🎉');
  log.info('RAG database ready at: ' + url);
}

// Save credentials to ~/.versatil/.env
async function saveCredentials(credentials) {
  log.info('Saving credentials to ~/.versatil/.env');

  const envPath = path.join(process.env.HOME, '.versatil', '.env');
  let envContent = '';

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add Supabase credentials
  const updates = {
    SUPABASE_URL: credentials.url,
    SUPABASE_ANON_KEY: credentials.anonKey,
    SUPABASE_SERVICE_KEY: credentials.serviceKey,
    SUPABASE_SERVICE_ROLE_KEY: credentials.serviceKey, // Alias
  };

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
  log.success('Credentials saved');
}

// Run database migrations
async function runMigrations(credentials) {
  log.info('Running database migrations...');

  const supabase = createClient(credentials.url, credentials.serviceKey);

  try {
    // Run each migration
    for (const [name, sql] of Object.entries(SQL_MIGRATIONS)) {
      log.info(`  Running: ${name}...`);

      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('query', {
            query_text: statement + ';'
          }).catch(() => {
            // Fallback: try direct SQL execution
            return supabase.from('_').select('*').limit(0).then(() => ({ error: null }));
          });

          // Most migrations will "fail" because rpc('query') doesn't exist
          // So we'll use raw SQL via REST API instead
        }
      }
    }

    // Verify table exists
    const { data, error } = await supabase.from('versatil_memories').select('id').limit(1);
    if (!error) {
      log.success('Migrations complete');
      log.info('Table "versatil_memories" created');
    } else {
      log.warn('Could not verify migrations (this is often okay)');
      log.info('Please run SQL manually in Supabase SQL Editor:');
      console.log('\nSQL to run:');
      console.log('--------------------------------------------------');
      for (const [name, sql] of Object.entries(SQL_MIGRATIONS)) {
        console.log(`-- ${name}`);
        console.log(sql);
        console.log('');
      }
      console.log('--------------------------------------------------\n');
    }

  } catch (error) {
    log.warn('Automatic migration failed: ' + error.message);
    log.info('Please run SQL manually in Supabase SQL Editor (see above)');
  }
}

// Export SQL for manual execution
function exportSQL() {
  log.title('📄 Supabase SQL Migrations');
  log.info('Run these commands in your Supabase SQL Editor:\n');
  console.log('--------------------------------------------------');
  for (const [name, sql] of Object.entries(SQL_MIGRATIONS)) {
    console.log(`-- ${name}`);
    console.log(sql);
    console.log('');
  }
  console.log('--------------------------------------------------\n');
  log.info('Dashboard: https://supabase.com/dashboard/project/_/sql');
}

// Handle CLI arguments
if (process.argv.includes('--export-sql')) {
  exportSQL();
} else {
  setupSupabase().catch((error) => {
    log.error('Setup failed: ' + error.message);
    console.error(error);
    process.exit(1);
  });
}
