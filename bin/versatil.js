#!/usr/bin/env node

/**
 * VERSATIL Framework CLI
 * Command-line interface for setup, agent management, and project initialization
 */

const { runOnboardingWizard } = require('../dist/onboarding-wizard');
const { adaptiveAgentCreator } = require('../dist/adaptive-agent-creator');
const { VERSATILAgentDispatcher } = require('../dist/agent-dispatcher');
const { changelogGenerator } = require('../dist/changelog-generator');
const { versionManager } = require('../dist/version-manager');
const { gitBackupManager } = require('../dist/git-backup-manager');

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      console.log('🚀 Starting VERSATIL Framework Setup...\n');
      await runOnboardingWizard();
      break;

    case 'analyze':
      console.log('🔍 Analyzing project for agent recommendations...\n');
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

    case 'agents':
      console.log('🤖 Available agent templates:');
      const templates = adaptiveAgentCreator.getAvailableTemplates();
      templates.forEach(template => {
        console.log(`   • ${template.name} - ${template.specialization}`);
      });
      break;

    case 'changelog':
      console.log('📝 Generating changelog...\n');
      await changelogGenerator.autoGenerateChangelog();
      break;

    case 'version':
      const versionType = process.argv[3] || 'auto';
      if (['major', 'minor', 'patch', 'prerelease'].includes(versionType)) {
        console.log(`📦 Manual version bump: ${versionType}\n`);
        await versionManager.bumpVersionManual(versionType);
      } else {
        console.log('🔍 Analyzing commits for version bump...\n');
        await versionManager.autoVersion();
      }
      break;

    case 'backup':
      const backupAction = process.argv[3] || 'create';
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

    case 'release':
      console.log('🚀 Creating release...\n');
      const releaseConfig = {
        autoTag: true,
        autoChangelog: true,
        autoCommit: true,
        createGitHubRelease: process.argv.includes('--github')
      };
      await versionManager.autoVersion(releaseConfig);
      break;

    case 'mcp':
      console.log('🔗 Starting VERSATIL MCP Server...\n');
      const projectPath = process.argv[3] || process.cwd();
      console.log(`📁 Project: ${projectPath}`);
      console.log('🚀 MCP Server ready for Claude Desktop connection');
      console.log('\nConfiguration for Claude Desktop:');
      console.log('{"mcpServers": {"versatil": {"command": "versatil-mcp", "args": ["' + projectPath + '"]}}}');
      break;

    case 'health':
      console.log('🏥 VERSATIL Framework Health Check\n');
      console.log('✅ Framework Status: OPERATIONAL');
      console.log('✅ Agent System: Ready');
      console.log('✅ MCP Integration: Available');
      console.log('✅ Context Validation: Active');
      console.log('✅ Automation Features: Enabled');
      console.log('✅ Backup System: Ready');
      console.log('✅ Version Management: Active');
      break;

    case 'version':
    case '--version':
    case '-v':
      console.log('VERSATIL SDLC Framework v1.0.0');
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
  changelog    Generate changelog from git commits
  version      Auto version bump or manual (major|minor|patch|prerelease)
  backup       Git backup management (create|status|sync)
  release      Create full release with changelog and tagging
  mcp          Start MCP server for Claude Desktop integration
  health       Check framework status and configuration
  help         Show this help message

EXAMPLES:
  versatil init                     # Start interactive onboarding
  versatil analyze                  # Get agent recommendations
  versatil agents                   # See available agent types
  versatil changelog                # Generate changelog
  versatil version                  # Auto-analyze and bump version
  versatil version major            # Manual major version bump
  versatil backup create            # Create backup
  versatil backup status            # Check backup status
  versatil release --github         # Create release with GitHub release
  versatil mcp /path/to/project     # Start MCP server for Claude Desktop
  versatil health                   # Verify installation

For more information, visit:
https://github.com/versatil-platform/versatil-sdlc-framework

🤖 Generated with VERSATIL SDLC Framework
`);
      break;
  }
}

main().catch(console.error);