#!/usr/bin/env node

/**
 * VERSATIL Conversation Manager CLI
 * Manage conversation backups for Claude's native /resume command
 */

import { getConversationBackupManager } from '../dist/conversation-backup-manager.js';

const manager = getConversationBackupManager(process.cwd());

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  await manager.initialize();

  switch (command) {
    case 'start':
      const title = args.join(' ') || 'Untitled Conversation';
      const id = await manager.startConversation(title, process.cwd());
      console.log(`\n✅ Conversation started: ${id}`);
      console.log(`   Title: "${title}"`);
      console.log(`\n📝 Messages will be auto-saved every 30 seconds`);
      break;

    case 'list':
      const conversations = await manager.listConversations();
      if (conversations.length === 0) {
        console.log('\n📭 No conversations found');
      } else {
        console.log(`\n📚 Found ${conversations.length} conversation(s):\n`);
        conversations.forEach(conv => {
          const date = new Date(conv.createdAt).toLocaleDateString();
          const time = new Date(conv.createdAt).toLocaleTimeString();
          console.log(`   ${conv.id}`);
          console.log(`   ├─ Title: ${conv.title}`);
          console.log(`   ├─ Created: ${date} ${time}`);
          console.log(`   ├─ Messages: ${conv.metadata.messageCount}`);
          console.log(`   └─ Duration: ${conv.metadata.duration / 1000 / 60}min\n`);
        });
      }
      break;

    case 'resume':
      const resumeId = args[0];
      if (!resumeId) {
        console.error('❌ Error: Conversation ID required');
        console.log('Usage: versatil-conversation resume <conversation-id>');
        process.exit(1);
      }

      const resumed = await manager.resumeConversation(resumeId);
      console.log(`\n✅ Conversation resumed: ${resumed.id}`);
      console.log(`   Title: "${resumed.title}"`);
      console.log(`   Messages: ${resumed.metadata.messageCount}`);
      console.log(`\n💡 Use this context with Claude's /resume command:\n`);

      const context = await manager.generateResumeContext(resumeId);
      console.log(context);
      break;

    case 'export':
      const exportId = args[0];
      const outputPath = args[1] || `conversation-${exportId}.md`;

      if (!exportId) {
        console.error('❌ Error: Conversation ID required');
        console.log('Usage: versatil-conversation export <conversation-id> [output-path]');
        process.exit(1);
      }

      const markdown = await manager.exportToMarkdown(exportId);
      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, markdown, 'utf-8');

      console.log(`\n✅ Conversation exported to: ${outputPath}`);
      break;

    case 'search':
      const query = args.join(' ');
      if (!query) {
        console.error('❌ Error: Search query required');
        console.log('Usage: versatil-conversation search <query>');
        process.exit(1);
      }

      const results = await manager.searchConversations(query);
      if (results.length === 0) {
        console.log(`\n🔍 No conversations found matching "${query}"`);
      } else {
        console.log(`\n🔍 Found ${results.length} conversation(s) matching "${query}":\n`);
        results.forEach(conv => {
          console.log(`   ${conv.id} - "${conv.title}"`);
          console.log(`   Messages: ${conv.metadata.messageCount}\n`);
        });
      }
      break;

    case 'cleanup':
      const keepCount = parseInt(args[0]) || 50;
      const deleted = await manager.cleanupOldConversations(keepCount);
      console.log(`\n✅ Cleanup complete: ${deleted} conversation(s) deleted`);
      console.log(`   Kept most recent: ${keepCount} conversations`);
      break;

    case 'help':
    default:
      console.log(`
╔════════════════════════════════════════════════════════════╗
║  🗨️  VERSATIL Conversation Manager                        ║
║  Compatible with Claude's native /resume command          ║
╚════════════════════════════════════════════════════════════╝

USAGE:
  versatil-conversation <command> [options]

COMMANDS:
  start <title>              Start new conversation
  list                       List all conversations
  resume <id>                Resume conversation (generates context)
  export <id> [path]         Export conversation to markdown
  search <query>             Search conversations by title/tags
  cleanup [keep-count]       Delete old conversations (default: keep 50)
  help                       Show this help

EXAMPLES:
  # Start new conversation
  versatil-conversation start "Sprint 1 Implementation"

  # List all conversations
  versatil-conversation list

  # Resume conversation (copy output to Claude)
  versatil-conversation resume conv-123abc

  # Export to markdown
  versatil-conversation export conv-123abc ./docs/session.md

  # Search conversations
  versatil-conversation search "Sprint 1"

  # Cleanup old conversations (keep last 30)
  versatil-conversation cleanup 30

INTEGRATION WITH CLAUDE:
  1. Start conversation: versatil-conversation start "My Task"
  2. Work with Claude (messages auto-save every 30s)
  3. Resume later: versatil-conversation resume <id>
  4. Copy generated context and use /resume in Claude

STORAGE:
  Conversations stored in: ${process.cwd()}/.versatil/conversations/

For more info: https://docs.versatil.dev/conversation-backup
      `);
      break;
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
