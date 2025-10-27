#!/usr/bin/env node

/**
 * VERSATIL Framework - Credential Import Tool
 * Import team-shared encrypted credentials
 */

import path from 'path';
import fs from 'fs/promises';
import readline from 'readline';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function askPassword(prompt) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(prompt);

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    const onData = (char) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          rl.close();
          resolve(password);
          break;

        case '\u0003':
          stdin.setRawMode(false);
          process.exit(0);
          break;

        case '\u007f':
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;

        default:
          password += char;
          stdout.write('*');
          break;
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  try {
    const { getCredentialEncryptor } = await import(`${projectRoot}/dist/security/credential-encryptor.js`);
    const encryptor = getCredentialEncryptor();

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  📥 VERSATIL Credentials Import                   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Parse arguments
    const args = process.argv.slice(2);
    const importFile = args[0];

    if (!importFile) {
      console.error('❌ Error: Import file path is required\n');
      console.log('Usage: versatil-credentials-import <export-file.json.enc>\n');
      console.log('Example:');
      console.log('  versatil-credentials-import credentials-export.json.enc');
      console.log('  versatil-credentials-import .versatil/credentials-export-github.json.enc\n');
      process.exit(1);
    }

    // Resolve import file path
    const importPath = path.isAbsolute(importFile) ? importFile : path.join(process.cwd(), importFile);

    // Check if import file exists
    try {
      await fs.access(importPath);
    } catch {
      console.error(`❌ Import file not found: ${importPath}\n`);
      process.exit(1);
    }

    console.log('📂 Import file:', importPath);
    console.log('📍 Current project:', process.cwd());
    console.log('');

    // Ask for team password
    const password = await askPassword('🔑 Enter team password: ');

    if (!password) {
      console.error('\n❌ Password is required\n');
      process.exit(1);
    }

    // Get project context
    const projectPath = process.cwd();
    const projectId = crypto.createHash('sha256')
      .update(projectPath)
      .digest('hex')
      .substring(0, 16);

    const context = { projectPath, projectId: `project-${projectId}` };

    // Read encrypted export
    const exportContent = await fs.readFile(importPath, 'utf8');
    const encrypted = JSON.parse(exportContent);

    console.log('🔓 Decrypting credentials...');

    // Decrypt with team password
    const importedCredentials = await encryptor.decrypt(encrypted, context, password);

    console.log('✅ Decryption successful!');
    console.log('');

    // Load existing credentials
    const credentialsPath = path.join(projectPath, '.versatil', 'credentials.json');
    let existingCredentials = {};

    try {
      existingCredentials = await encryptor.decryptFromFile(credentialsPath, context);
      console.log('📦 Found existing credentials');
    } catch {
      console.log('📦 No existing credentials (creating new)');
    }

    // Merge credentials
    const mergedCredentials = {
      ...existingCredentials,
      ...importedCredentials
    };

    const services = Object.keys(importedCredentials);
    console.log('');
    console.log(`📥 Importing ${services.length} service(s):`);
    services.forEach(service => {
      const action = existingCredentials[service] ? '🔄 Updating' : '➕ Adding';
      console.log(`   ${action}: ${service}`);
    });
    console.log('');

    // Save merged credentials
    await encryptor.encryptToFile(mergedCredentials, credentialsPath, context);

    console.log('✅ Credentials imported successfully!\n');
    console.log('📍 Location:', credentialsPath);
    console.log('🔒 Encryption: AES-256-GCM (project-specific key)');
    console.log('📊 Total services:', Object.keys(mergedCredentials).length);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('  • Credentials are ready to use immediately');
    console.log('  • Run: npm run mcp:health (to verify MCP connections)');
    console.log('  • Run: versatil-daemon start (to enable agents)');
    console.log('');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    if (error.message.includes('Decryption failed')) {
      console.log('');
      console.log('💡 Common issues:');
      console.log('  • Incorrect team password');
      console.log('  • Corrupted export file');
      console.log('  • Export from different project\n');
    }
    process.exit(1);
  }
}

main();
