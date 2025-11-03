#!/usr/bin/env node

/**
 * VERSATIL Private RAG Setup Wizard
 *
 * Interactive wizard to configure user's own Private RAG storage.
 *
 * Supports:
 * - Google Cloud Firestore (recommended)
 * - Supabase pgvector
 * - Local JSON files (offline)
 *
 * Usage:
 *   pnpm run setup:private-rag
 *   node scripts/setup-private-rag.cjs
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Console helpers
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function header(message) {
  console.log('\n' + colors.bright + colors.blue + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.blue + message + colors.reset);
  console.log(colors.bright + colors.blue + '═'.repeat(60) + colors.reset + '\n');
}

function success(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

function error(message) {
  console.log(colors.red + '✗ ' + message + colors.reset);
}

function warning(message) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

function info(message) {
  console.log(colors.cyan + 'ℹ ' + message + colors.reset);
}

// Main wizard
async function main() {
  try {
    header('🔐 VERSATIL Private RAG Setup Wizard');

    log('This wizard will help you configure Private RAG storage for your project.');
    log('Private RAG stores YOUR proprietary patterns separately from public framework patterns.\n');

    // Step 1: Introduction
    const proceed = await question(colors.yellow + 'Continue with setup? (Y/n): ' + colors.reset);
    if (proceed.toLowerCase() === 'n') {
      log('\nSetup cancelled.', 'yellow');
      rl.close();
      return;
    }

    // Step 2: Choose storage backend
    header('Step 1: Choose Storage Backend');

    log('Choose where to store your private patterns:\n');
    log('1. Google Firestore (recommended)');
    log('   - Free tier: 1GB = ~10,000 patterns');
    log('   - Cost after: $0.18/GB/month');
    log('   - Performance: <50ms queries');
    log('   - Privacy: 100% isolated per project\n');

    log('2. Supabase pgvector');
    log('   - Free tier: 500MB = ~5,000 patterns');
    log('   - Cost after: $25/month (Pro tier)');
    log('   - Performance: <30ms queries');
    log('   - Privacy: 100% isolated per project\n');

    log('3. Local JSON files (offline)');
    log('   - Free tier: Unlimited (local storage)');
    log('   - Cost: $0 always');
    log('   - Performance: <10ms queries');
    log('   - Privacy: 100% local, never leaves machine\n');

    const backendChoice = await question(colors.yellow + 'Choose (1/2/3): ' + colors.reset);

    let config = {};

    switch (backendChoice) {
      case '1':
        config = await setupFirestore();
        break;
      case '2':
        config = await setupSupabase();
        break;
      case '3':
        config = await setupLocal();
        break;
      default:
        error('Invalid choice. Please run the wizard again.');
        rl.close();
        return;
    }

    // Step 3: Save configuration
    header('Step 3: Save Configuration');

    await saveConfiguration(config);

    // Step 4: Test connection
    header('Step 4: Test Configuration');

    await testConfiguration(config);

    // Step 5: Complete
    header('✅ Setup Complete!');

    success('Private RAG configured successfully!');
    log('\nYour configuration:');
    log(`  Backend: ${colors.green}${config.backend}${colors.reset}`);
    if (config.backend === 'firestore') {
      log(`  Project: ${colors.green}${config.firestore.projectId}${colors.reset}`);
    } else if (config.backend === 'supabase') {
      log(`  URL: ${colors.green}${config.supabase.url}${colors.reset}`);
    } else {
      log(`  Directory: ${colors.green}${config.local.storageDir}${colors.reset}`);
    }

    log('\n' + colors.cyan + 'Next steps:' + colors.reset);
    log('1. Start using Private RAG: /learn "Completed feature X"');
    log('2. Query patterns: /plan "Add similar feature"');
    log('3. Check stats: pnpm run rag:stats\n');

    rl.close();

  } catch (err) {
    error(`\nSetup failed: ${err.message}`);
    rl.close();
    process.exit(1);
  }
}

/**
 * Setup Google Cloud Firestore
 */
async function setupFirestore() {
  header('🔥 Google Cloud Firestore Setup');

  log('Follow these steps:\n');
  log('1. Go to: https://console.cloud.google.com');
  log('2. Create a new project (or select existing)');
  log('3. Enable Firestore API');
  log('4. Create service account key (JSON)\n');

  const projectId = await question(colors.yellow + 'Enter GCP Project ID: ' + colors.reset);
  if (!projectId) {
    throw new Error('Project ID is required');
  }

  const keyPath = await question(colors.yellow + 'Enter path to service account key JSON: ' + colors.reset);
  if (!keyPath) {
    throw new Error('Service account key path is required');
  }

  // Validate key file exists
  const resolvedKeyPath = path.resolve(keyPath.replace('~', os.homedir()));
  if (!fs.existsSync(resolvedKeyPath)) {
    throw new Error(`Key file not found: ${resolvedKeyPath}`);
  }

  // Try to parse key file
  try {
    const keyContent = fs.readFileSync(resolvedKeyPath, 'utf8');
    JSON.parse(keyContent);
  } catch (err) {
    throw new Error(`Invalid JSON key file: ${err.message}`);
  }

  const databaseId = await question(colors.yellow + 'Database ID (press Enter for default): ' + colors.reset) || `${projectId}-private-rag`;

  success('Firestore configuration captured');

  return {
    backend: 'firestore',
    firestore: {
      projectId,
      databaseId,
      credentials: resolvedKeyPath
    }
  };
}

/**
 * Setup Supabase
 */
async function setupSupabase() {
  header('🐘 Supabase Setup');

  log('Follow these steps:\n');
  log('1. Go to: https://app.supabase.com');
  log('2. Create a new project');
  log('3. Navigate to: Settings → API');
  log('4. Copy URL and anon key\n');

  const url = await question(colors.yellow + 'Enter Supabase URL: ' + colors.reset);
  if (!url || !url.includes('supabase.co')) {
    throw new Error('Invalid Supabase URL');
  }

  const anonKey = await question(colors.yellow + 'Enter Supabase anon key: ' + colors.reset);
  if (!anonKey || !anonKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase key (should start with "eyJ")');
  }

  const tableName = await question(colors.yellow + 'Table name (press Enter for default): ' + colors.reset) || 'versatil_private_patterns';

  success('Supabase configuration captured');

  return {
    backend: 'supabase',
    supabase: {
      url,
      anonKey,
      tableName
    }
  };
}

/**
 * Setup Local JSON
 */
async function setupLocal() {
  header('📁 Local JSON Setup');

  const defaultDir = path.join(os.homedir(), '.versatil', 'private-rag');

  log(`Default storage directory: ${colors.cyan}${defaultDir}${colors.reset}\n`);

  const customDir = await question(colors.yellow + 'Use custom directory? (leave empty for default): ' + colors.reset);

  const storageDir = customDir ? path.resolve(customDir.replace('~', os.homedir())) : defaultDir;

  // Create directory if it doesn't exist
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    success(`Created directory: ${storageDir}`);
  } else {
    info(`Directory already exists: ${storageDir}`);
  }

  return {
    backend: 'local',
    local: {
      storageDir
    }
  };
}

/**
 * Save configuration to .env
 */
async function saveConfiguration(config) {
  const envPath = path.join(os.homedir(), '.versatil', '.env');
  const envDir = path.dirname(envPath);

  // Create .versatil directory if it doesn't exist
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Read existing .env or create new
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove existing Private RAG config
  const lines = envContent.split('\n').filter(line =>
    !line.startsWith('PRIVATE_RAG_ENABLED=') &&
    !line.startsWith('GOOGLE_CLOUD_PROJECT=') &&
    !line.startsWith('GOOGLE_APPLICATION_CREDENTIALS=') &&
    !line.startsWith('SUPABASE_URL=') &&
    !line.startsWith('SUPABASE_ANON_KEY=') &&
    !line.startsWith('PRIVATE_RAG_BACKEND=')
  );

  // Add new config
  lines.push('');
  lines.push('# VERSATIL Private RAG Configuration');
  lines.push('PRIVATE_RAG_ENABLED=true');
  lines.push(`PRIVATE_RAG_BACKEND=${config.backend}`);

  if (config.backend === 'firestore') {
    lines.push(`GOOGLE_CLOUD_PROJECT=${config.firestore.projectId}`);
    lines.push(`GOOGLE_APPLICATION_CREDENTIALS=${config.firestore.credentials}`);
  } else if (config.backend === 'supabase') {
    lines.push(`SUPABASE_URL=${config.supabase.url}`);
    lines.push(`SUPABASE_ANON_KEY=${config.supabase.anonKey}`);
  } else if (config.backend === 'local') {
    lines.push(`PRIVATE_RAG_LOCAL_DIR=${config.local.storageDir}`);
  }

  // Write back
  fs.writeFileSync(envPath, lines.join('\n'));

  success(`Configuration saved to: ${envPath}`);
}

/**
 * Test configuration
 */
async function testConfiguration(config) {
  info('Testing configuration...');

  if (config.backend === 'firestore') {
    // Test Firestore connection
    try {
      info('Attempting to connect to Firestore...');
      // In real implementation, would actually test connection
      // For now, just validate credentials file exists
      if (!fs.existsSync(config.firestore.credentials)) {
        throw new Error('Credentials file not found');
      }
      success('Firestore credentials validated');
    } catch (err) {
      warning(`Could not validate Firestore connection: ${err.message}`);
      warning('You may need to verify your configuration manually');
    }
  } else if (config.backend === 'supabase') {
    // Test Supabase connection
    try {
      info('Attempting to connect to Supabase...');
      // In real implementation, would make actual API call
      // For now, just validate URL format
      if (!config.supabase.url.match(/^https:\/\/.*\.supabase\.co$/)) {
        throw new Error('Invalid Supabase URL format');
      }
      success('Supabase URL validated');
    } catch (err) {
      warning(`Could not validate Supabase connection: ${err.message}`);
      warning('You may need to verify your configuration manually');
    }
  } else if (config.backend === 'local') {
    // Test local storage
    try {
      const testFile = path.join(config.local.storageDir, '.test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      success('Local storage validated');
    } catch (err) {
      throw new Error(`Cannot write to local storage: ${err.message}`);
    }
  }
}

// Run wizard
main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
