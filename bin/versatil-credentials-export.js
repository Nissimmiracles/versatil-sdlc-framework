#!/usr/bin/env node

/**
 * VERSATIL Framework - Credential Export Tool
 * Export encrypted credentials for team sharing
 */

import path from 'path';
import fs from 'fs/promises';
import readline from 'readline';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  try {
    const { getCredentialEncryptor } = await import(`${projectRoot}/dist/security/credential-encryptor.js`);
    const encryptor = getCredentialEncryptor();

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  📤 VERSATIL Credentials Export                   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Parse arguments
    const args = process.argv.slice(2);
    const serviceFlag = args.indexOf('--service');
    const passwordFlag = args.indexOf('--password');
    const outputFlag = args.indexOf('--output');

    const serviceName = serviceFlag !== -1 ? args[serviceFlag + 1] : null;
    const password = passwordFlag !== -1 ? args[passwordFlag + 1] : null;
    const outputPath = outputFlag !== -1 ? args[outputFlag + 1] : null;

    if (!password) {
      console.error('❌ Error: --password flag is required for team sharing\n');
      console.log('Usage: versatil-credentials-export --password <team-password> [options]\n');
      console.log('Options:');
      console.log('  --service <name>    Export specific service only');
      console.log('  --output <path>     Custom output path\n');
      process.exit(1);
    }

    // Get project context
    const projectPath = process.cwd();
    const projectId = crypto.createHash('sha256')
      .update(projectPath)
      .digest('hex')
      .substring(0, 16);

    const credentialsPath = path.join(projectPath, '.versatil', 'credentials.json');

    // Check if credentials exist
    try {
      await fs.access(credentialsPath);
    } catch {
      console.error('❌ No credentials found in this project\n');
      console.log('Run: versatil-credentials setup\n');
      process.exit(1);
    }

    console.log('📂 Project:', projectPath);
    console.log('🔐 Credentials file:', credentialsPath);
    console.log('');

    // Load and decrypt credentials
    const context = { projectPath, projectId: `project-${projectId}` };
    const credentials = await encryptor.decryptFromFile(credentialsPath, context);

    // Filter by service if specified
    let exportCredentials = credentials;
    if (serviceName) {
      if (!credentials[serviceName]) {
        console.error(`❌ Service '${serviceName}' not found in credentials\n`);
        console.log('Available services:', Object.keys(credentials).join(', '));
        process.exit(1);
      }
      exportCredentials = { [serviceName]: credentials[serviceName] };
      console.log(`📦 Exporting service: ${serviceName}`);
    } else {
      console.log(`📦 Exporting all services: ${Object.keys(credentials).join(', ')}`);
    }
    console.log('');

    // Re-encrypt with team password
    const exportPath = outputPath || path.join(
      projectPath,
      '.versatil',
      serviceName ? `credentials-export-${serviceName}.json.enc` : 'credentials-export.json.enc'
    );

    const encrypted = await encryptor.encrypt(exportCredentials, context, password);

    await fs.writeFile(exportPath, JSON.stringify(encrypted, null, 2), { mode: 0o600 });

    console.log('✅ Credentials exported successfully!\n');
    console.log('📍 Export file:', exportPath);
    console.log('🔒 Encryption: AES-256-GCM with team password');
    console.log('📊 Services exported:', Object.keys(exportCredentials).length);
    console.log('');
    console.log('📤 Share this file with your team:');
    console.log(`   ${path.basename(exportPath)}`);
    console.log('');
    console.log('🔑 Team members import with:');
    console.log(`   versatil-credentials-import ${path.basename(exportPath)}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

main();
