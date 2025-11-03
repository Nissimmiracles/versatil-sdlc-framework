#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Clean Uninstall
 * Safely remove all framework data
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const versatilHome = path.join(os.homedir(), '.versatil');

/**
 * Main uninstall function
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🗑️  VERSATIL SDLC Framework - Uninstall Wizard    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const keepData = args.includes('--keep-data');

  if (!force) {
    console.log('⚠️  This will remove the VERSATIL SDLC Framework from your system.\n');

    if (!keepData) {
      console.log('The following will be deleted:');
      console.log(`  • Framework directory: ${versatilHome}`);
      console.log('  • All agent configurations');
      console.log('  • All RAG memory data');
      console.log('  • User preferences');
      console.log('  • Rollback backups\n');
      console.log('To keep your data, use: --keep-data\n');
    } else {
      console.log(`✅ Your data in ${versatilHome} will be preserved.\n`);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Are you sure you want to continue? (yes/no): ', answer => {
        rl.close();
        resolve(answer);
      });
    });

    if (answer.toLowerCase() !== 'yes') {
      console.log('\nUninstall cancelled.\n');
      process.exit(0);
    }

    console.log('');
  }

  // Step 1: Uninstall package
  console.log('📦 Uninstalling package...');
  try {
    await execAsync('pnpm remove -g versatil-sdlc-framework');
    console.log('✅ Package uninstalled\n');
  } catch (error) {
    console.log('⚠️  Could not uninstall package (may not be installed globally)');
    console.log(`   Error: ${error.message}\n`);
  }

  // Step 2: Remove framework data (if not keeping)
  if (!keepData) {
    if (fs.existsSync(versatilHome)) {
      console.log('🗑️  Removing framework data...');

      // List what will be removed
      const items = fs.readdirSync(versatilHome);
      console.log(`   Found ${items.length} item(s) in ${versatilHome}`);

      // Calculate size
      const size = await getDirectorySize(versatilHome);
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      console.log(`   Total size: ${sizeMB} MB\n`);

      try {
        fs.rmSync(versatilHome, { recursive: true, force: true });
        console.log('✅ Framework data removed\n');
      } catch (error) {
        console.log(`⚠️  Could not remove framework data: ${error.message}\n`);
        console.log(`   You may need to manually delete: ${versatilHome}\n`);
      }
    } else {
      console.log('ℹ️  No framework data found to remove\n');
    }
  }

  // Step 3: Clean up any project-level pollution (safety check)
  console.log('🔍 Checking for project directory pollution...');
  const cwd = process.cwd();
  const forbiddenDirs = ['.versatil', 'versatil', '.versatil-memory', '.versatil-logs'];
  let foundPollution = false;

  for (const dir of forbiddenDirs) {
    const dirPath = path.join(cwd, dir);
    if (fs.existsSync(dirPath) && dirPath !== versatilHome) {
      foundPollution = true;
      console.log(`   Found: ${dirPath}`);

      if (!force) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          rl.question(`   Remove ${dirPath}? (y/N): `, answer => {
            rl.close();
            resolve(answer);
          });
        });

        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          fs.rmSync(dirPath, { recursive: true, force: true });
          console.log(`   ✅ Removed\n`);
        } else {
          console.log(`   ⏭️  Skipped\n`);
        }
      } else {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`   ✅ Removed\n`);
      }
    }
  }

  if (!foundPollution) {
    console.log('✅ No pollution found\n');
  }

  // Step 4: Remove global commands (verify)
  console.log('🔍 Verifying command removal...');
  const commands = ['versatil', 'versatil-mcp', 'versatil-sdlc'];
  let commandsRemoved = true;

  for (const cmd of commands) {
    try {
      await execAsync(`which ${cmd}`);
      console.log(`   ⚠️  ${cmd} still exists`);
      commandsRemoved = false;
    } catch {
      // Command not found - good
    }
  }

  if (commandsRemoved) {
    console.log('✅ All commands removed\n');
  } else {
    console.log('⚠️  Some commands may still exist');
    console.log('   Try: pnpm remove -g versatil-sdlc-framework\n');
  }

  // Step 5: Show summary
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ Uninstall Complete\n');

  if (keepData) {
    console.log(`ℹ️  Your data is preserved in: ${versatilHome}`);
    console.log('   To remove it later: rm -rf ~/.versatil\n');
  }

  console.log('Thank you for using VERSATIL SDLC Framework!\n');
  console.log('We\'d love to hear your feedback:');
  console.log('  https://github.com/MiraclesGIT/versatil-sdlc-framework/issues\n');
  console.log('To reinstall:');
  console.log('  pnpm add -g versatil-sdlc-framework\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Get directory size recursively
 */
async function getDirectorySize(dirPath) {
  let size = 0;

  function getSizeSync(itemPath) {
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      items.forEach(item => {
        getSizeSync(path.join(itemPath, item));
      });
    } else {
      size += stats.size;
    }
  }

  try {
    getSizeSync(dirPath);
  } catch (error) {
    // Ignore errors
  }

  return size;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
VERSATIL SDLC Framework - Uninstall

Usage: versatil-uninstall [options]

Options:
  --force       Skip confirmation prompts
  --keep-data   Keep framework data (~/.versatil)
  --help        Show this help message

Examples:
  versatil-uninstall
  versatil-uninstall --force
  versatil-uninstall --keep-data
  versatil-uninstall --force --keep-data

What gets removed:
  • Global package (versatil-sdlc-framework)
  • Framework directory (~/.versatil) unless --keep-data
  • All agent configurations
  • All RAG memory data
  • User preferences
  • Rollback backups

What is preserved:
  • Your project code (framework never touches your code)
  • Git repositories
  • Project-specific configs (.versatil-project.json if exists)

For help: https://github.com/MiraclesGIT/versatil-sdlc-framework
  `);
}

// Parse args
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run
main().catch(error => {
  console.error(`Uninstall error: ${error.message}`);
  console.log('\nPartial uninstall may have occurred.');
  console.log('Please check manually and try again.\n');
  process.exit(1);
});
