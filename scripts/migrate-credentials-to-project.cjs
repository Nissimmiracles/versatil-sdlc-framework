#!/usr/bin/env node

/**
 * VERSATIL Framework - Credential Migration Script
 * Migrate credentials from global ~/.versatil/.env to project-level encrypted storage
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  🔄 VERSATIL Credentials Migration                ║');
  console.log('║  Global (~/.versatil/.env) → Project-Level        ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const globalEnvPath = path.join(os.homedir(), '.versatil', '.env');
  const projectPath = process.cwd();
  const projectCredentialsPath = path.join(projectPath, '.versatil', 'credentials.json');

  console.log('📂 Current project:', projectPath);
  console.log('🔍 Looking for global credentials:', globalEnvPath);
  console.log('');

  // Check if global .env exists
  if (!fs.existsSync(globalEnvPath)) {
    console.log('✅ No global credentials found - nothing to migrate!');
    console.log('');
    console.log('💡 To set up credentials for this project:');
    console.log('   versatil-credentials setup\n');
    rl.close();
    return;
  }

  console.log('✅ Found global credentials file');
  console.log('');

  // Check if project already has credentials
  if (fs.existsSync(projectCredentialsPath)) {
    console.log('⚠️  This project already has credentials at:');
    console.log(`   ${projectCredentialsPath}`);
    console.log('');
    const overwrite = await ask('Overwrite existing credentials? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n❌ Migration cancelled\n');
      rl.close();
      return;
    }
  }

  // Parse global .env file
  console.log('📖 Reading global credentials...');
  const envContent = fs.readFileSync(globalEnvPath, 'utf8');
  const envVars = {};

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  }

  console.log(`✅ Found ${Object.keys(envVars).length} environment variables`);
  console.log('');

  // Group by service (simplified mapping)
  const services = {
    github: {},
    supabase: {},
    'vertex-ai': {},
    n8n: {},
    semgrep: {},
    sentry: {},
    exa: {}
  };

  // Map environment variables to services
  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith('GITHUB_')) services.github[key] = value;
    else if (key.startsWith('SUPABASE_')) services.supabase[key] = value;
    else if (key.startsWith('GOOGLE_')) services['vertex-ai'][key] = value;
    else if (key.startsWith('N8N_')) services.n8n[key] = value;
    else if (key.startsWith('SEMGREP_')) services.semgrep[key] = value;
    else if (key.startsWith('SENTRY_')) services.sentry[key] = value;
    else if (key.startsWith('EXA_')) services.exa[key] = value;
  }

  // Remove empty services
  const credentials = {};
  for (const [service, creds] of Object.entries(services)) {
    if (Object.keys(creds).length > 0) {
      credentials[service] = creds;
    }
  }

  if (Object.keys(credentials).length === 0) {
    console.log('⚠️  No recognized service credentials found in .env');
    console.log('');
    console.log('Supported services:');
    console.log('  • GitHub (GITHUB_*)');
    console.log('  • Supabase (SUPABASE_*)');
    console.log('  • Vertex AI (GOOGLE_*)');
    console.log('  • n8n (N8N_*)');
    console.log('  • Semgrep (SEMGREP_*)');
    console.log('  • Sentry (SENTRY_*)');
    console.log('  • Exa (EXA_*)\n');
    rl.close();
    return;
  }

  console.log('📦 Services to migrate:');
  for (const [service, creds] of Object.entries(credentials)) {
    console.log(`   • ${service} (${Object.keys(creds).length} credentials)`);
  }
  console.log('');

  const proceed = await ask('Proceed with migration? (Y/n): ');
  if (proceed.toLowerCase() === 'n') {
    console.log('\n❌ Migration cancelled\n');
    rl.close();
    return;
  }

  console.log('');
  console.log('🔐 Encrypting credentials with AES-256-GCM...');

  // Generate project ID
  const projectId = `project-${crypto.createHash('sha256').update(projectPath).digest('hex').substring(0, 16)}`;

  // Import encryption module (async)
  try {
    const { getCredentialEncryptor } = await import(path.join(projectPath, 'dist', 'security', 'credential-encryptor.js'));
    const encryptor = getCredentialEncryptor();

    const context = {
      projectPath,
      projectId
    };

    // Ensure .versatil directory exists
    const versatilDir = path.join(projectPath, '.versatil');
    if (!fs.existsSync(versatilDir)) {
      fs.mkdirSync(versatilDir, { recursive: true });
    }

    // Encrypt and save
    await encryptor.encryptToFile(credentials, projectCredentialsPath, context);

    console.log('✅ Credentials encrypted and saved!');
    console.log('');
    console.log('📍 Location:', projectCredentialsPath);
    console.log('🔒 Encryption: AES-256-GCM (project-specific key)');
    console.log('📊 Services migrated:', Object.keys(credentials).length);
    console.log('');

    // Backup global .env
    const backupPath = `${globalEnvPath}.backup.${Date.now()}`;
    fs.copyFileSync(globalEnvPath, backupPath);
    console.log('💾 Backup created:', backupPath);
    console.log('');

    // Ask if user wants to delete global .env
    const deleteGlobal = await ask('Delete global ~/.versatil/.env? (recommended) (Y/n): ');
    if (deleteGlobal.toLowerCase() !== 'n') {
      fs.unlinkSync(globalEnvPath);
      console.log('✅ Global .env file deleted');
      console.log('');
      console.log('💡 Global credentials are no longer used.');
      console.log('   Each project now has its own encrypted credentials!');
    } else {
      console.log('ℹ️  Global .env file kept (not recommended)');
      console.log('   Consider deleting it manually after verifying migration');
    }

    console.log('');
    console.log('✨ Migration complete!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  • Run: npm run mcp:health (verify MCP connections)');
    console.log('  • Run: versatil-daemon start (enable agents)');
    console.log('  • All credentials are now project-specific and encrypted!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('');
    console.log('💡 Make sure the framework is built:');
    console.log('   npm run build\n');
    process.exit(1);
  }

  rl.close();
}

main().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
