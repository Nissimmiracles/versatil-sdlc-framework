#!/usr/bin/env node
/**
 * RAG Storage Verification Script
 *
 * Verifies RAG database is working and patterns are stored correctly.
 *
 * Usage:
 *   node scripts/test-rag.cjs                 # Quick verification
 *   node scripts/test-rag.cjs --verbose       # Detailed output
 *   node scripts/test-rag.cjs --agent maria-qa # Test specific agent
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

/**
 * Load environment variables
 */
function loadEnv() {
  const envPath = path.join(process.env.HOME, '.versatil', '.env');
  if (!fs.existsSync(envPath)) {
    log.error('No .env file found at ~/.versatil/.env');
    log.info('Run: npm run rag:setup');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  return env;
}

/**
 * Test RAG storage
 */
async function testRAG() {
  log.title('🧪 Testing VERSATIL RAG Storage');

  // Parse arguments
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const agentFilter = args.find(arg => arg.startsWith('--agent='))?.split('=')[1];

  // Load environment
  log.info('Loading Supabase credentials...');
  const env = loadEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    log.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    log.info('Run: npm run rag:setup');
    process.exit(1);
  }

  if (env.SUPABASE_URL.includes('your-') || env.SUPABASE_SERVICE_KEY.includes('your-')) {
    log.error('Placeholder credentials detected');
    log.info('Run: npm run rag:setup');
    process.exit(1);
  }

  // Connect to Supabase
  log.info('Connecting to Supabase...');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  let allPassed = true;

  // Test 1: Connection
  log.info('\n[Test 1] Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('versatil_memories').select('id').limit(1);
    if (error) {
      log.error(`Connection failed: ${error.message}`);
      allPassed = false;
    } else {
      log.success('Connection successful');
    }
  } catch (error) {
    log.error(`Connection test failed: ${error.message}`);
    allPassed = false;
  }

  // Test 2: Table exists
  log.info('\n[Test 2] Checking versatil_memories table...');
  try {
    const { data, error } = await supabase
      .from('versatil_memories')
      .select('id, agent_id, content_type')
      .limit(1);

    if (error) {
      log.error(`Table check failed: ${error.message}`);
      log.info('Run migrations: npm run rag:setup');
      allPassed = false;
    } else {
      log.success('Table exists with correct schema');
    }
  } catch (error) {
    log.error(`Table test failed: ${error.message}`);
    allPassed = false;
  }

  // Test 3: Pattern count
  log.info('\n[Test 3] Counting stored patterns...');
  try {
    const query = supabase
      .from('versatil_memories')
      .select('id', { count: 'exact', head: true });

    if (agentFilter) {
      query.eq('agent_id', agentFilter);
    }

    const { count, error } = await query;

    if (error) {
      log.error(`Count query failed: ${error.message}`);
      allPassed = false;
    } else if (count === 0) {
      log.warn('No patterns found in database');
      log.info('Seed patterns: npm run rag:seed-framework');
      allPassed = false;
    } else {
      log.success(`Found ${count} patterns`);
    }
  } catch (error) {
    log.error(`Count test failed: ${error.message}`);
    allPassed = false;
  }

  // Test 4: Agent breakdown
  log.info('\n[Test 4] Analyzing pattern distribution by agent...');
  try {
    const { data, error } = await supabase
      .from('versatil_memories')
      .select('agent_id');

    if (error) {
      log.error(`Agent breakdown failed: ${error.message}`);
      allPassed = false;
    } else {
      const breakdown = {};
      for (const record of data) {
        breakdown[record.agent_id] = (breakdown[record.agent_id] || 0) + 1;
      }

      if (Object.keys(breakdown).length === 0) {
        log.warn('No agents have patterns');
        allPassed = false;
      } else {
        log.success(`Patterns across ${Object.keys(breakdown).length} agents:`);
        for (const [agent, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
          console.log(`  ${agent.padEnd(20)} : ${count} patterns`);
        }
      }
    }
  } catch (error) {
    log.error(`Agent breakdown failed: ${error.message}`);
    allPassed = false;
  }

  // Test 5: Embedding dimension
  log.info('\n[Test 5] Verifying embedding dimensions...');
  try {
    const { data, error } = await supabase
      .from('versatil_memories')
      .select('embedding')
      .not('embedding', 'is', null)
      .limit(1);

    if (error) {
      log.error(`Embedding check failed: ${error.message}`);
      allPassed = false;
    } else if (!data || data.length === 0) {
      log.warn('No patterns with embeddings found');
      allPassed = false;
    } else {
      const embedding = data[0].embedding;
      if (Array.isArray(embedding) && embedding.length === 1536) {
        log.success(`Embeddings are 1536 dimensions (OpenAI ada-002 compatible)`);
      } else {
        log.error(`Invalid embedding dimension: ${embedding?.length || 'null'}`);
        allPassed = false;
      }
    }
  } catch (error) {
    log.error(`Embedding test failed: ${error.message}`);
    allPassed = false;
  }

  // Test 6: Semantic search function
  log.info('\n[Test 6] Testing semantic search function...');
  try {
    // Generate dummy embedding for test
    const testEmbedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);

    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: testEmbedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (error) {
      log.error(`Semantic search failed: ${error.message}`);
      log.info('Function may not exist. Run: npm run rag:setup');
      allPassed = false;
    } else {
      log.success(`Semantic search working (returned ${data?.length || 0} results)`);
    }
  } catch (error) {
    log.error(`Semantic search test failed: ${error.message}`);
    allPassed = false;
  }

  // Test 7: Sample pattern retrieval (verbose mode)
  if (verbose) {
    log.info('\n[Test 7] Retrieving sample patterns...');
    try {
      const { data, error } = await supabase
        .from('versatil_memories')
        .select('agent_id, content_type, metadata')
        .limit(5);

      if (error) {
        log.error(`Sample retrieval failed: ${error.message}`);
        allPassed = false;
      } else if (!data || data.length === 0) {
        log.warn('No patterns available');
        allPassed = false;
      } else {
        log.success(`Sample patterns:`);
        for (let i = 0; i < data.length; i++) {
          const pattern = data[i];
          const tags = pattern.metadata?.tags?.join(', ') || 'none';
          const type = pattern.metadata?.type || 'unknown';
          console.log(`\n  Pattern ${i + 1}:`);
          console.log(`    Agent: ${pattern.agent_id}`);
          console.log(`    Type: ${type}`);
          console.log(`    Content Type: ${pattern.content_type}`);
          console.log(`    Tags: ${tags}`);
        }
      }
    } catch (error) {
      log.error(`Sample retrieval failed: ${error.message}`);
      allPassed = false;
    }
  }

  // Summary
  log.title(allPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed');

  if (!allPassed) {
    log.info('\nTroubleshooting:');
    console.log('  1. Setup Supabase: npm run rag:setup');
    console.log('  2. Seed patterns: npm run rag:seed-framework');
    console.log('  3. Re-run tests: npm run rag:test');
    process.exit(1);
  } else {
    log.success('RAG storage is fully functional!');
    log.info('\nNext steps:');
    console.log('  • Add more patterns: npm run rag:seed-defaults');
    console.log('  • Test agents: npm run test');
    console.log('  • Monitor usage: npm run context:stats');
  }
}

// Run
testRAG().catch(error => {
  log.error('Test failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
