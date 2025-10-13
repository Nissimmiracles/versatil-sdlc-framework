#!/usr/bin/env node

/**
 * VERSATIL Slash Command Validator
 *
 * Validates .claude/commands/*.md files for:
 * 1. Valid YAML frontmatter
 * 2. Required fields
 * 3. Correct bash pre-execution syntax (!)
 * 4. Invalid MCP invocation patterns
 * 5. Proper natural language for MCP tools
 * 6. Tool availability
 *
 * Usage:
 *   node scripts/validate-slash-commands.js [--fix] [--verbose] [file.md]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COMMANDS_DIR = path.join(__dirname, '../.claude/commands');
const KNOWN_BASH_COMMANDS = ['git', 'npm', 'node', 'ls', 'cat', 'grep', 'find', 'curl', 'echo'];
const KNOWN_TOOLS = ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'Task', 'TodoWrite', 'SlashCommand'];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  file: args.find(arg => !arg.startsWith('--'))
};

// Error tracking
let totalErrors = 0;
let totalWarnings = 0;
let filesChecked = 0;

/**
 * Main validation function
 */
async function main() {
  console.log(`${colors.cyan}${colors.bold}🔍 VERSATIL Slash Command Validator${colors.reset}\n`);

  // Get files to validate
  const files = options.file
    ? [path.resolve(options.file)]
    : getAllCommandFiles();

  if (files.length === 0) {
    console.log(`${colors.yellow}⚠️  No command files found in ${COMMANDS_DIR}${colors.reset}`);
    return 0;
  }

  console.log(`Validating ${files.length} command file(s)...\n`);

  // Validate each file
  for (const file of files) {
    await validateCommandFile(file);
    filesChecked++;
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.bold}Validation Summary:${colors.reset}`);
  console.log(`  Files checked: ${filesChecked}`);
  console.log(`  ${colors.red}Errors: ${totalErrors}${colors.reset}`);
  console.log(`  ${colors.yellow}Warnings: ${totalWarnings}${colors.reset}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`\n${colors.green}${colors.bold}✅ All checks passed!${colors.reset}`);
    return 0;
  } else if (totalErrors === 0) {
    console.log(`\n${colors.yellow}${colors.bold}⚠️  Validation passed with warnings${colors.reset}`);
    return 0;
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ Validation failed${colors.reset}`);
    return 1;
  }
}

/**
 * Get all command files
 */
function getAllCommandFiles() {
  const files = [];

  function scan(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  scan(COMMANDS_DIR);
  return files;
}

/**
 * Validate a single command file
 */
async function validateCommandFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`${colors.cyan}Checking${colors.reset} ${relativePath}`);

  // Read file
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    reportError(filePath, null, `Failed to read file: ${error.message}`);
    return;
  }

  // Parse frontmatter
  const { frontmatter, body, errors: parseErrors } = parseFrontmatter(content);

  if (parseErrors.length > 0) {
    parseErrors.forEach(err => reportError(filePath, null, err));
    return;
  }

  // Run validators
  validateFrontmatter(filePath, frontmatter);
  validateBody(filePath, body, frontmatter);
  validateMCPSyntax(filePath, content);
  validateBashPreExecution(filePath, content);
  validateTools(filePath, frontmatter);

  if (options.verbose && totalErrors === 0 && totalWarnings === 0) {
    console.log(`  ${colors.green}✓ No issues found${colors.reset}`);
  }
}

/**
 * Simple YAML parser for frontmatter
 */
function parseSimpleYAML(yamlText) {
  const result = {};
  const lines = yamlText.split('\n');
  let currentKey = null;
  let currentArray = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Array item
    if (trimmed.startsWith('- ')) {
      if (currentArray) {
        currentArray.push(trimmed.substring(2).trim().replace(/^["']|["']$/g, ''));
      }
      continue;
    }

    // Key: value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (value) {
        // Simple value
        result[key] = value.replace(/^["']|["']$/g, '');
        currentKey = null;
        currentArray = null;
      } else {
        // Array starts on next line
        currentKey = key;
        currentArray = [];
        result[key] = currentArray;
      }
    }
  }

  return result;
}

/**
 * Parse YAML frontmatter
 */
function parseFrontmatter(content) {
  const errors = [];
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    errors.push('Missing or invalid YAML frontmatter. Expected format:\n---\nfield: value\n---\n');
    return { frontmatter: {}, body: content, errors };
  }

  let frontmatter;
  try {
    // Simple YAML parser (handles basic key: value pairs and arrays)
    frontmatter = parseSimpleYAML(match[1]);
  } catch (error) {
    errors.push(`Invalid YAML in frontmatter: ${error.message}`);
    return { frontmatter: {}, body: match[2], errors };
  }

  return { frontmatter, body: match[2], errors };
}

/**
 * Validate frontmatter fields
 */
function validateFrontmatter(filePath, frontmatter) {
  // Required fields
  if (!frontmatter.description) {
    reportError(filePath, 'frontmatter', 'Missing required field: description');
  }

  // Check description quality
  if (frontmatter.description && frontmatter.description.length < 10) {
    reportWarning(filePath, 'frontmatter', 'Description is too short (< 10 chars)');
  }

  // Model field
  if (frontmatter.model) {
    const validModels = ['claude-sonnet-4-5', 'claude-opus-3-5', 'claude-haiku-3-5'];
    if (!validModels.includes(frontmatter.model)) {
      reportWarning(filePath, 'model', `Unknown model: ${frontmatter.model}`);
    }
  }

  // Allowed tools
  if (!frontmatter['allowed-tools'] || frontmatter['allowed-tools'].length === 0) {
    reportWarning(filePath, 'allowed-tools', 'No tools specified. Command may have limited functionality.');
  }
}

/**
 * Validate command body
 */
function validateBody(filePath, body, frontmatter) {
  // Check for $ARGUMENTS usage
  if (frontmatter['argument-hint'] && !body.includes('$ARGUMENTS')) {
    reportWarning(filePath, 'body', 'Command accepts arguments but $ARGUMENTS placeholder not found');
  }

  // Check if body is too short
  if (body.trim().length < 50) {
    reportWarning(filePath, 'body', 'Command body is very short. Consider adding more context.');
  }
}

/**
 * Validate MCP syntax (catch my mistake!)
 */
function validateMCPSyntax(filePath, content) {
  // Check for invalid !mcp__ pattern
  const invalidPattern = /!\s*mcp__\S+/g;
  const matches = [...content.matchAll(invalidPattern)];

  for (const match of matches) {
    const line = getLineNumber(content, match.index);
    reportError(
      filePath,
      `line ${line}`,
      `Invalid MCP invocation: '${match[0]}'\n` +
      `       The '!' prefix is for bash commands only (e.g., '!git status').\n` +
      `       To use MCP tools, use natural language instead:\n` +
      `       "Use the ${match[0].replace('!', '').replace(/__/g, ' ')} tool..."`
    );
  }

  // Check for mcp__ in allowed-tools (valid usage)
  const allowedToolsMatch = content.match(/allowed-tools:\s*\n([\s\S]*?)(?:\n\w|\n---|\n$)/);
  if (allowedToolsMatch) {
    const toolsList = allowedToolsMatch[1];
    const mcpTools = [...toolsList.matchAll(/["']?(mcp__[\w_]+)["']?/g)];

    if (mcpTools.length > 0 && options.verbose) {
      console.log(`  ${colors.cyan}ℹ  MCP tools referenced: ${mcpTools.map(m => m[1]).join(', ')}${colors.reset}`);
    }
  }
}

/**
 * Validate bash pre-execution syntax
 */
function validateBashPreExecution(filePath, content) {
  // Find all ! prefixed commands
  const bashPattern = /^!\s*([^\s]+)/gm;
  const matches = [...content.matchAll(bashPattern)];

  for (const match of matches) {
    const command = match[1];
    const line = getLineNumber(content, match.index);

    // Skip if it's in frontmatter (YAML syntax)
    const beforeMatch = content.substring(0, match.index);
    if (beforeMatch.indexOf('---') >= 0 && beforeMatch.lastIndexOf('---') > beforeMatch.indexOf('---')) {
      continue;
    }

    // Check if it's an MCP pattern (already caught above)
    if (command.startsWith('mcp__')) {
      continue; // Already reported
    }

    // Extract base command
    const baseCommand = command.split(/[\/\s]/)[0];

    // Validate it's a known bash command
    if (!KNOWN_BASH_COMMANDS.includes(baseCommand)) {
      reportWarning(
        filePath,
        `line ${line}`,
        `Unknown bash command: '!${command}'. Verify this is correct.`
      );
    }

    if (options.verbose) {
      console.log(`  ${colors.cyan}ℹ  Found bash pre-execution: !${command}${colors.reset}`);
    }
  }
}

/**
 * Validate tools
 */
function validateTools(filePath, frontmatter) {
  const allowedTools = frontmatter['allowed-tools'] || [];

  for (const tool of allowedTools) {
    // Skip MCP tools (validated separately)
    if (typeof tool === 'string' && tool.startsWith('mcp__')) {
      continue;
    }

    // Extract tool name from patterns like "Bash(git:*)"
    let toolName = tool;
    if (typeof tool === 'string') {
      const match = tool.match(/^(\w+)(\(|$)/);
      if (match) {
        toolName = match[1];
      }
    }

    // Check if tool is known
    if (!KNOWN_TOOLS.includes(toolName)) {
      reportWarning(
        filePath,
        'allowed-tools',
        `Unknown tool: '${tool}'. This may cause runtime errors.`
      );
    }
  }
}

/**
 * Get line number from string index
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Report error
 */
function reportError(filePath, location, message) {
  totalErrors++;
  const locationStr = location ? ` [${location}]` : '';
  console.log(`  ${colors.red}✗ ERROR${locationStr}:${colors.reset} ${message}`);
}

/**
 * Report warning
 */
function reportWarning(filePath, location, message) {
  totalWarnings++;
  const locationStr = location ? ` [${location}]` : '';
  console.log(`  ${colors.yellow}⚠  WARNING${locationStr}:${colors.reset} ${message}`);
}

// Run validator
main().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(`${colors.red}${colors.bold}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
