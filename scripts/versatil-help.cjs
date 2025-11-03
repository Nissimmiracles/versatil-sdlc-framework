#!/usr/bin/env node

/**
 * VERSATIL Help CLI Tool
 *
 * Interactive help system for VERSATIL Framework
 *
 * Usage:
 *   versatil-help                    # Interactive mode
 *   versatil-help quick-start        # Show quick start guide
 *   versatil-help agents             # Show agents guide
 *   versatil-help search "testing"   # Search help content
 *   versatil-help examples maria-qa  # Show agent examples
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Help topics database
const HELP_TOPICS = {
  'quick-start': {
    title: 'Quick Start (5 Minutes)',
    file: '../.claude/commands/help.md',
    section: 'Quick Start',
  },
  agents: {
    title: 'OPERA Agents (18 Total)',
    file: '../docs/quick-reference/AGENTS_CHEAT_SHEET.md',
  },
  rules: {
    title: '5-Rule Automation System',
    file: '../docs/quick-reference/RULES_CHEAT_SHEET.md',
  },
  mcp: {
    title: 'MCP Ecosystem (12 Integrations)',
    file: '../docs/quick-reference/MCP_CHEAT_SHEET.md',
  },
  workflows: {
    title: 'VERSATIL Workflows',
    file: '../docs/quick-reference/WORKFLOW_CHEAT_SHEET.md',
  },
  troubleshooting: {
    title: 'Troubleshooting',
    file: '../.claude/commands/help.md',
    section: 'Troubleshooting',
  },
};

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive mode
    startInteractiveMode();
  } else if (args[0] === 'search') {
    // Search mode
    const query = args.slice(1).join(' ');
    searchHelp(query);
  } else if (args[0] === 'examples') {
    // Examples mode
    const agent = args[1];
    showExamples(agent);
  } else {
    // Show specific topic
    const topic = args[0];
    showTopic(topic);
  }
}

/**
 * Start interactive mode
 */
function startInteractiveMode() {
  console.log(formatHeader('VERSATIL Help System - Interactive Mode'));
  console.log('');
  showMainMenu();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt(
    `${colors.cyan}versatil-help>${colors.reset} `
  );
  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === 'exit' || input === 'quit' || input === 'q') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    if (input === 'menu' || input === 'help') {
      showMainMenu();
    } else if (input.startsWith('search ')) {
      const query = input.substring(7);
      searchHelp(query);
    } else if (input.startsWith('examples ')) {
      const agent = input.substring(9);
      showExamples(agent);
    } else {
      showTopic(input);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

/**
 * Show main menu
 */
function showMainMenu() {
  console.log(colors.bright + 'Available Commands:' + colors.reset);
  console.log('');
  console.log('  ' + colors.cyan + 'quick-start' + colors.reset + '        - 5-minute getting started guide');
  console.log('  ' + colors.cyan + 'agents' + colors.reset + '             - All 18 OPERA agents');
  console.log('  ' + colors.cyan + 'rules' + colors.reset + '              - 5-Rule automation system');
  console.log('  ' + colors.cyan + 'mcp' + colors.reset + '                - 12 MCP integrations');
  console.log('  ' + colors.cyan + 'workflows' + colors.reset + '          - EVERY workflow (5 phases)');
  console.log('  ' + colors.cyan + 'troubleshooting' + colors.reset + '    - Common issues & fixes');
  console.log('');
  console.log('  ' + colors.cyan + 'search <query>' + colors.reset + '    - Search help content');
  console.log('  ' + colors.cyan + 'examples <agent>' + colors.reset + '  - Show agent examples');
  console.log('  ' + colors.cyan + 'menu' + colors.reset + '               - Show this menu');
  console.log('  ' + colors.cyan + 'exit' + colors.reset + '               - Exit interactive mode');
  console.log('');
}

/**
 * Show specific topic
 */
function showTopic(topic) {
  const topicConfig = HELP_TOPICS[topic];

  if (!topicConfig) {
    console.log(
      colors.red + `Unknown topic: ${topic}` + colors.reset
    );
    console.log('');
    console.log('Available topics: ' + Object.keys(HELP_TOPICS).join(', '));
    return;
  }

  const filePath = path.join(__dirname, topicConfig.file);

  if (!fs.existsSync(filePath)) {
    console.log(
      colors.red + `Help file not found: ${filePath}` + colors.reset
    );
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  if (topicConfig.section) {
    // Extract specific section
    const section = extractSection(content, topicConfig.section);
    console.log(formatSection(topicConfig.title, section));
  } else {
    // Show entire file
    console.log(formatContent(content));
  }
}

/**
 * Search help content
 */
function searchHelp(query) {
  if (!query) {
    console.log(colors.red + 'Please provide a search query' + colors.reset);
    return;
  }

  console.log(formatHeader(`Search Results: "${query}"`));
  console.log('');

  const results = [];
  const lowerQuery = query.toLowerCase();

  // Search all help files
  for (const [topicKey, topicConfig] of Object.entries(HELP_TOPICS)) {
    const filePath = path.join(__dirname, topicConfig.file);

    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(lowerQuery)) {
        results.push({
          topic: topicKey,
          title: topicConfig.title,
          lineNumber: i + 1,
          line: line.trim(),
        });
      }
    }
  }

  if (results.length === 0) {
    console.log(colors.yellow + 'No results found' + colors.reset);
    return;
  }

  // Show results (limit to 20)
  const limit = Math.min(results.length, 20);
  for (let i = 0; i < limit; i++) {
    const result = results[i];
    console.log(
      colors.cyan + `[${result.topic}]` + colors.reset +
      ' ' + colors.dim + `(line ${result.lineNumber})` + colors.reset
    );
    console.log('  ' + highlightQuery(result.line, query));
    console.log('');
  }

  if (results.length > limit) {
    console.log(
      colors.dim + `... and ${results.length - limit} more results` + colors.reset
    );
  }

  console.log(
    colors.bright + `Total results: ${results.length}` + colors.reset
  );
}

/**
 * Show examples for specific agent
 */
function showExamples(agent) {
  if (!agent) {
    console.log(colors.red + 'Please specify an agent' + colors.reset);
    console.log('Example: examples maria-qa');
    return;
  }

  const agentExamples = {
    'maria-qa': [
      '/maria review test coverage',
      '/maria generate tests src/api/users.ts',
      'pnpm run test:coverage',
    ],
    'marcus-backend': [
      '/marcus review API security',
      '/marcus optimize endpoint /api/users',
      'pnpm run test:stress',
    ],
    'james-frontend': [
      '/james optimize component performance',
      '/james check accessibility',
      '/james review responsive design',
    ],
    'dana-database': [
      '/dana optimize database queries',
      '/dana design schema for users',
      '/dana create migration',
    ],
  };

  const examples = agentExamples[agent];

  if (!examples) {
    console.log(
      colors.red + `No examples found for agent: ${agent}` + colors.reset
    );
    console.log('');
    console.log('Available agents: ' + Object.keys(agentExamples).join(', '));
    return;
  }

  console.log(formatHeader(`Examples: ${agent}`));
  console.log('');

  for (const example of examples) {
    console.log('  ' + colors.cyan + example + colors.reset);
  }

  console.log('');
}

/**
 * Extract section from markdown content
 */
function extractSection(content, sectionTitle) {
  const lines = content.split('\n');
  const result = [];
  let inSection = false;
  let sectionLevel = 0;

  for (const line of lines) {
    // Check if this is the section we want
    if (line.startsWith('#')) {
      const currentLevel = line.match(/^#+/)[0].length;
      const currentTitle = line.replace(/^#+\s*/, '');

      if (currentTitle === sectionTitle) {
        inSection = true;
        sectionLevel = currentLevel;
        result.push(line);
        continue;
      }

      // If we're in the section and hit a header of same/higher level, stop
      if (inSection && currentLevel <= sectionLevel) {
        break;
      }
    }

    if (inSection) {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Format header
 */
function formatHeader(title) {
  const width = 60;
  const border = '═'.repeat(width);

  return (
    '\n' +
    colors.cyan + border + colors.reset + '\n' +
    colors.bright + title.padStart((width + title.length) / 2).padEnd(width) + colors.reset + '\n' +
    colors.cyan + border + colors.reset + '\n'
  );
}

/**
 * Format section
 */
function formatSection(title, content) {
  return formatHeader(title) + '\n' + formatContent(content);
}

/**
 * Format markdown content for terminal
 */
function formatContent(content) {
  let formatted = content;

  // Headers
  formatted = formatted.replace(/^### (.+)$/gm, colors.cyan + colors.bright + '$1' + colors.reset);
  formatted = formatted.replace(/^## (.+)$/gm, '\n' + colors.cyan + colors.bright + '$1' + colors.reset);
  formatted = formatted.replace(/^# (.+)$/gm, '\n' + colors.cyan + colors.bright + '$1' + colors.reset);

  // Bold
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, colors.bright + '$1' + colors.reset);

  // Code blocks (basic handling)
  formatted = formatted.replace(/```(.+?)```/gs, colors.dim + '$1' + colors.reset);

  // Inline code
  formatted = formatted.replace(/`(.+?)`/g, colors.green + '$1' + colors.reset);

  // Bullets
  formatted = formatted.replace(/^- (.+)$/gm, '  • $1');

  return formatted;
}

/**
 * Highlight query in line
 */
function highlightQuery(line, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return line.replace(
    regex,
    colors.yellow + colors.bright + '$1' + colors.reset
  );
}

// Run main
main();
