#!/usr/bin/env node
/**
 * VERSATIL Session Learnings Viewer
 *
 * CLI tool to view, search, and export session learnings.
 *
 * Commands:
 *   list                      - List all sessions with learnings
 *   view <session-id>         - View detailed learnings for a session
 *   search <pattern>          - Search learnings by pattern/keyword
 *   export [--format=json|md] - Export all learnings
 *
 * Examples:
 *   node view-session-learnings.cjs list
 *   node view-session-learnings.cjs view 2025-10-19
 *   node view-session-learnings.cjs search "react testing"
 *   node view-session-learnings.cjs export --format=md
 */

const path = require('path');
const fs = require('fs/promises');
const os = require('os');

class SessionLearningsViewer {
  constructor() {
    this.sessionsDir = path.join(os.homedir(), '.versatil', 'sessions');
  }

  /**
   * List all sessions with learnings
   */
  async listSessions() {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionDirs = files.filter(f => f.startsWith('session-') && f.endsWith('.json') === false);

      if (sessionDirs.length === 0) {
        console.log('No sessions with learnings found.');
        return;
      }

      console.log('\n📚 Available Session Learnings:\n');

      for (const dir of sessionDirs.sort().reverse()) {
        const sessionId = dir;
        const summaryPath = path.join(this.sessionsDir, dir, 'summary.json');

        try {
          const summary = JSON.parse(await fs.readFile(summaryPath, 'utf-8'));
          console.log(`📅 ${sessionId}`);
          console.log(`   Time Saved: ${summary.timeSaved} min | Quality: ${summary.qualityScore}% | Compounding: ${summary.compoundingScore}/100`);
          console.log(`   Patterns: ${summary.topPatterns.slice(0, 2).join(', ')}`);
          console.log('');
        } catch (error) {
          console.log(`📅 ${sessionId} (summary unavailable)`);
        }
      }

      console.log(`Total sessions: ${sessionDirs.length}\n`);
    } catch (error) {
      console.error('Error listing sessions:', error.message);
    }
  }

  /**
   * View detailed learnings for a session
   */
  async viewSession(sessionId) {
    try {
      const sessionDir = path.join(this.sessionsDir, sessionId);
      const reportPath = path.join(sessionDir, 'report.md');
      const summaryPath = path.join(sessionDir, 'summary.json');

      // Check if session exists
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      if (!exists) {
        console.error(`Session '${sessionId}' not found or has no learnings.`);
        console.log('\nAvailable sessions:');
        await this.listSessions();
        return;
      }

      // Load and display report
      const report = await fs.readFile(reportPath, 'utf-8');
      console.log(report);

      // Display quick actions
      console.log('\n─────────────────────────────────────────');
      console.log('Quick Actions:');
      console.log(`  View in editor: code ~/.versatil/sessions/${sessionId}/report.md`);
      console.log(`  View summary: cat ~/.versatil/sessions/${sessionId}/summary.json`);
      console.log(`  View learnings: ls ~/.versatil/memories/*/session-${sessionId}-*.md`);
      console.log('─────────────────────────────────────────\n');
    } catch (error) {
      console.error('Error viewing session:', error.message);
    }
  }

  /**
   * Search learnings by pattern/keyword
   */
  async searchLearnings(pattern) {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionDirs = files.filter(f => f.startsWith('session-') && f.endsWith('.json') === false);

      console.log(`\n🔍 Searching for "${pattern}" in ${sessionDirs.length} sessions...\n`);

      const results = [];

      for (const dir of sessionDirs) {
        const reportPath = path.join(this.sessionsDir, dir, 'report.md');

        try {
          const report = await fs.readFile(reportPath, 'utf-8');

          if (report.toLowerCase().includes(pattern.toLowerCase())) {
            const summaryPath = path.join(this.sessionsDir, dir, 'summary.json');
            const summary = JSON.parse(await fs.readFile(summaryPath, 'utf-8'));

            // Extract context around match
            const lines = report.split('\n');
            const matchLines = lines.filter(l => l.toLowerCase().includes(pattern.toLowerCase()));

            results.push({
              sessionId: dir,
              summary,
              matches: matchLines.slice(0, 3)
            });
          }
        } catch (error) {
          // Skip sessions without reports
        }
      }

      if (results.length === 0) {
        console.log(`No results found for "${pattern}"`);
        return;
      }

      console.log(`Found ${results.length} session(s) with matches:\n`);

      for (const result of results) {
        console.log(`📅 ${result.sessionId}`);
        console.log(`   Time Saved: ${result.summary.timeSaved} min | Compounding: ${result.summary.compoundingScore}/100`);
        console.log(`   Matches:`);
        result.matches.forEach(m => console.log(`     ${m.trim()}`));
        console.log('');
      }

      console.log(`\nView details: node view-session-learnings.cjs view <session-id>\n`);
    } catch (error) {
      console.error('Error searching learnings:', error.message);
    }
  }

  /**
   * Export all learnings
   */
  async exportLearnings(format = 'md') {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionDirs = files.filter(f => f.startsWith('session-') && f.endsWith('.json') === false);

      console.log(`\n📦 Exporting ${sessionDirs.length} sessions as ${format.toUpperCase()}...\n`);

      if (format === 'json') {
        await this.exportAsJSON(sessionDirs);
      } else {
        await this.exportAsMarkdown(sessionDirs);
      }
    } catch (error) {
      console.error('Error exporting learnings:', error.message);
    }
  }

  /**
   * Export as JSON
   */
  async exportAsJSON(sessionDirs) {
    const allLearnings = [];

    for (const dir of sessionDirs) {
      const summaryPath = path.join(this.sessionsDir, dir, 'summary.json');

      try {
        const summary = JSON.parse(await fs.readFile(summaryPath, 'utf-8'));
        allLearnings.push({
          sessionId: dir,
          ...summary
        });
      } catch (error) {
        // Skip sessions without summaries
      }
    }

    const exportPath = path.join(os.homedir(), '.versatil', 'exports', `learnings-export-${Date.now()}.json`);
    await fs.mkdir(path.dirname(exportPath), { recursive: true });
    await fs.writeFile(exportPath, JSON.stringify(allLearnings, null, 2));

    console.log(`✅ Exported ${allLearnings.length} sessions to:`);
    console.log(`   ${exportPath}\n`);
  }

  /**
   * Export as Markdown
   */
  async exportAsMarkdown(sessionDirs) {
    let markdown = `# VERSATIL Session Learnings Export\n\n`;
    markdown += `**Generated**: ${new Date().toLocaleDateString()}\n`;
    markdown += `**Total Sessions**: ${sessionDirs.length}\n\n`;
    markdown += `---\n\n`;

    for (const dir of sessionDirs.sort().reverse()) {
      const reportPath = path.join(this.sessionsDir, dir, 'report.md');

      try {
        const report = await fs.readFile(reportPath, 'utf-8');
        markdown += report + '\n\n---\n\n';
      } catch (error) {
        markdown += `## ${dir}\n\n*Report unavailable*\n\n---\n\n`;
      }
    }

    const exportPath = path.join(os.homedir(), '.versatil', 'exports', `learnings-export-${Date.now()}.md`);
    await fs.mkdir(path.dirname(exportPath), { recursive: true });
    await fs.writeFile(exportPath, markdown);

    console.log(`✅ Exported ${sessionDirs.length} sessions to:`);
    console.log(`   ${exportPath}\n`);
  }
}

// CLI Entry Point
async function main() {
  const viewer = new SessionLearningsViewer();
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'list':
      await viewer.listSessions();
      break;

    case 'view':
      if (!arg) {
        console.error('Usage: view-session-learnings.cjs view <session-id>');
        process.exit(1);
      }
      await viewer.viewSession(arg);
      break;

    case 'search':
      if (!arg) {
        console.error('Usage: view-session-learnings.cjs search <pattern>');
        process.exit(1);
      }
      await viewer.searchLearnings(arg);
      break;

    case 'export':
      const format = process.argv.find(a => a.startsWith('--format='))?.split('=')[1] || 'md';
      await viewer.exportLearnings(format);
      break;

    default:
      console.log(`
VERSATIL Session Learnings Viewer

Usage:
  node view-session-learnings.cjs <command> [options]

Commands:
  list                      List all sessions with learnings
  view <session-id>         View detailed learnings for a session
  search <pattern>          Search learnings by pattern/keyword
  export [--format=json|md] Export all learnings

Examples:
  node view-session-learnings.cjs list
  node view-session-learnings.cjs view 2025-10-19
  node view-session-learnings.cjs search "react testing"
  node view-session-learnings.cjs export --format=md
`);
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { SessionLearningsViewer };
