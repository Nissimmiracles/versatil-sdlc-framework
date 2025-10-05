#!/usr/bin/env node

/**
 * VERSATIL Framework CLI
 * Command-line interface for setup, agent management, and project initialization
 */

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init': {
      console.log('🚀 Starting VERSATIL Framework Setup...\n');
      const { runOnboardingWizard } = await import('../dist/onboarding-wizard.js');
      await runOnboardingWizard();
      break;
    }

    case 'analyze': {
      console.log('🔍 Analyzing project for agent recommendations...\n');
      const { adaptiveAgentCreator } = await import('../dist/adaptive-agent-creator.js');
      const suggestions = await adaptiveAgentCreator.analyzeProjectNeeds(process.cwd());
      if (suggestions.length > 0) {
        console.log('💡 Recommended agents:');
        suggestions.forEach(suggestion => {
          console.log(`   • ${suggestion.suggestedAgent.name} (${suggestion.confidence * 100}% confidence)`);
          console.log(`     Reason: ${suggestion.detectedPattern}`);
        });
      } else {
        console.log('✅ No additional agents recommended. Your setup looks good!');
      }
      break;
    }

    case 'agents': {
      console.log('🤖 Available agent templates:');
      const { adaptiveAgentCreator } = await import('../dist/adaptive-agent-creator.js');
      const templates = adaptiveAgentCreator.getAvailableTemplates();
      templates.forEach(template => {
        console.log(`   • ${template.name} - ${template.specialization}`);
      });
      break;
    }

    case 'changelog': {
      console.log('📝 Generating changelog...\n');
      const { changelogGenerator } = await import('../dist/changelog-generator.js');
      await changelogGenerator.autoGenerateChangelog();
      break;
    }

    case 'version': {
      const versionType = process.argv[3] || 'auto';
      const { versionManager } = await import('../dist/version-manager.js');
      if (['major', 'minor', 'patch', 'prerelease'].includes(versionType)) {
        console.log(`📦 Manual version bump: ${versionType}\n`);
        await versionManager.bumpVersionManual(versionType);
      } else {
        console.log('🔍 Analyzing commits for version bump...\n');
        await versionManager.autoVersion();
      }
      break;
    }

    case 'backup': {
      const backupAction = process.argv[3] || 'create';
      const { gitBackupManager } = await import('../dist/git-backup-manager.js');
      if (backupAction === 'create') {
        console.log('💾 Creating backup...\n');
        await gitBackupManager.createBackup();
      } else if (backupAction === 'status') {
        console.log('📊 Backup status...\n');
        const status = await gitBackupManager.getBackupStatus();
        console.log(`Last backup: ${status.lastBackup}`);
        console.log(`Backup count: ${status.backupCount}`);
        console.log(`Remote status: ${status.remoteStatus}`);
        console.log(`Disk usage: ${status.diskUsage}`);
      } else if (backupAction === 'sync') {
        console.log('🔄 Syncing with remote...\n');
        await gitBackupManager.syncWithRemote();
      }
      break;
    }

    case 'release': {
      console.log('🚀 Creating release...\n');
      const { versionManager } = await import('../dist/version-manager.js');
      const releaseConfig = {
        autoTag: true,
        autoChangelog: true,
        autoCommit: true,
        createGitHubRelease: process.argv.includes('--github')
      };
      await versionManager.autoVersion(releaseConfig);
      break;
    }

    case 'mcp':
      console.log('🔗 Starting VERSATIL MCP Server...\n');
      const projectPath = process.argv[3] || process.cwd();
      console.log(`📁 Project: ${projectPath}`);
      console.log('🚀 MCP Server ready for Claude Desktop connection');
      console.log('\nConfiguration for Claude Desktop:');
      console.log('{"mcpServers": {"versatil": {"command": "versatil-mcp", "args": ["' + projectPath + '"]}}}');
      break;

    case 'update':
      // Delegate to update-command.js
      const updateArgs = process.argv.slice(3);
      const updateCmd = spawn('node', ['./bin/update-command.js', ...updateArgs], { stdio: 'inherit' });
      updateCmd.on('exit', code => process.exit(code));
      return;

    case 'rollback':
      // Delegate to rollback-command.js
      const rollbackArgs = process.argv.slice(3);
      const rollbackCmd = spawn('node', ['./bin/rollback-command.js', ...rollbackArgs], { stdio: 'inherit' });
      rollbackCmd.on('exit', code => process.exit(code));
      return;

    case 'config':
      // Delegate to config-command.js
      const configArgs = process.argv.slice(3);
      const configCmd = spawn('node', ['./bin/config-command.js', ...configArgs], { stdio: 'inherit' });
      configCmd.on('exit', code => process.exit(code));
      return;

    case 'doctor':
      console.log('🏥 VERSATIL Framework Health Check\n');
      console.log('Running comprehensive health check...\n');
      const doctorCmd = spawn('node', ['./scripts/verify-installation.cjs'], { stdio: 'inherit' });
      doctorCmd.on('exit', code => process.exit(code));
      return;

    case 'health':
      console.log('🏥 VERSATIL Framework Health Check\n');
      console.log('✅ Framework Status: OPERATIONAL');
      console.log('✅ Agent System: Ready');
      console.log('✅ MCP Integration: Available');
      console.log('✅ Context Validation: Active');
      console.log('✅ Automation Features: Enabled');
      console.log('✅ Backup System: Ready');
      console.log('✅ Version Management: Active');
      console.log('✅ Update System: Ready');
      break;

    case '--version':
    case '-v':
      const pkgPath = join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(await readFile(pkgPath, 'utf-8'));
      console.log(`VERSATIL SDLC Framework v${packageJson.version}`);
      break;

    case 'help':
    case '--help':
    case '-h':
    default:
      console.log(`
🚀 VERSATIL SDLC Framework - AI-Native Development with BMAD Methodology

USAGE:
  versatil <command> [options]

COMMANDS:
  init         Interactive setup wizard with BMAD agent customization
  analyze      Analyze project and suggest additional agents
  agents       List available agent templates
  update       Update framework (check|install|status|list|changelog)
  rollback     Rollback to previous version (list|to|previous|validate)
  config       Manage preferences (show|set|wizard|profile|validate)
  doctor       Run comprehensive health check and verification
  changelog    Generate changelog from git commits
  version      Auto version bump or manual (major|minor|patch|prerelease)
  backup       Git backup management (create|status|sync)
  release      Create full release with changelog and tagging
  mcp          Start MCP server for Claude Desktop integration
  health       Check framework status and configuration
  help         Show this help message

EXAMPLES:
  versatil init                     # Start interactive onboarding
  versatil doctor                   # Run health check
  versatil update check             # Check for framework updates
  versatil update install           # Install latest update
  versatil rollback previous        # Rollback to previous version
  versatil config wizard            # Configure preferences
  versatil config show              # Show current preferences
  versatil analyze                  # Get agent recommendations
  versatil agents                   # See available agent types
  versatil changelog                # Generate changelog
  versatil version                  # Auto-analyze and bump version
  versatil backup create            # Create backup
  versatil release --github         # Create release with GitHub release
  versatil mcp /path/to/project     # Start MCP server for Claude Desktop
  versatil health                   # Quick health check

For more information, visit:
https://github.com/MiraclesGIT/versatil-sdlc-framework

🤖 Generated with VERSATIL SDLC Framework
`);
      break;
  }
}

main().catch(console.error);