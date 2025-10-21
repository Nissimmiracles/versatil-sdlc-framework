#!/usr/bin/env node
/**
 * RAG Framework Pattern Seeding Script
 *
 * Extracts patterns from VERSATIL framework codebase and populates RAG database.
 *
 * Usage:
 *   node scripts/seed-rag-framework.cjs           # Seed all patterns
 *   node scripts/seed-rag-framework.cjs --dry-run # Preview without storing
 *   node scripts/seed-rag-framework.cjs --agent maria-qa  # Seed specific agent
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
  progress: (current, total, msg) => {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    process.stdout.write(`\r${colors.cyan}[${bar}]${colors.reset} ${percent}% ${msg}  `);
  }
};

// Pattern extraction configuration
const PATTERN_CONFIG = {
  // Directories to scan
  scanDirs: [
    'src/agents/opera',           // OPERA agents
    'src/agents/core',            // Core agent infrastructure
    'src/testing',                // Testing utilities
    'src/orchestration',          // Orchestration patterns
    'src/rag',                    // RAG infrastructure
    'src/memory',                 // Memory management
    'src/mcp',                    // MCP integrations
    'src/automation',             // Automation workflows
  ],

  // File patterns to include
  includePatterns: [
    /\.ts$/,                      // TypeScript files
    /\.js$/,                      // JavaScript files
    /\.md$/,                      // Markdown docs
  ],

  // File patterns to exclude
  excludePatterns: [
    /\.test\.ts$/,                // Test files (separate patterns)
    /\.spec\.ts$/,
    /node_modules/,
    /dist\//,
    /\.d\.ts$/,                   // Type definitions
  ],

  // Minimum pattern size (characters)
  minPatternSize: 100,
  maxPatternSize: 5000,

  // Agent domain mapping
  agentDomains: {
    'maria-qa': ['testing', 'quality', 'qa', 'test', 'coverage', 'jest', 'playwright'],
    'james-frontend': ['frontend', 'ui', 'ux', 'react', 'component', 'accessibility', 'a11y'],
    'marcus-backend': ['backend', 'api', 'security', 'endpoint', 'auth', 'middleware'],
    'dana-database': ['database', 'schema', 'migration', 'sql', 'supabase', 'postgres'],
    'alex-ba': ['requirements', 'business', 'analysis', 'user-story', 'acceptance-criteria'],
    'sarah-pm': ['project', 'management', 'orchestration', 'coordination', 'planning'],
    'dr-ai-ml': ['ai', 'ml', 'machine-learning', 'model', 'rag', 'embedding'],
    'oliver-mcp': ['mcp', 'integration', 'chrome', 'playwright', 'github'],
  },
};

/**
 * Load environment variables from ~/.versatil/.env
 */
function loadEnv() {
  const envPath = path.join(process.env.HOME, '.versatil', '.env');
  if (!fs.existsSync(envPath)) {
    log.error('No .env file found at ~/.versatil/.env');
    log.info('Run: node scripts/setup-supabase.cjs');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  return env;
}

/**
 * Recursively scan directory for pattern files
 */
function scanDirectory(dir, baseDir) {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      // Check if file matches include patterns
      const shouldInclude = PATTERN_CONFIG.includePatterns.some(pattern => pattern.test(entry.name));
      const shouldExclude = PATTERN_CONFIG.excludePatterns.some(pattern => pattern.test(relativePath));

      if (shouldInclude && !shouldExclude) {
        results.push({
          path: fullPath,
          relativePath: relativePath,
          name: entry.name,
          ext: path.extname(entry.name),
        });
      }
    }
  }

  return results;
}

/**
 * Extract patterns from a file
 */
function extractPatterns(file) {
  const content = fs.readFileSync(file.path, 'utf8');
  const patterns = [];

  if (file.ext === '.md') {
    // Extract markdown sections as patterns
    const sections = content.split(/^#{1,3}\s+/m);
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      if (section.length >= PATTERN_CONFIG.minPatternSize &&
          section.length <= PATTERN_CONFIG.maxPatternSize) {
        patterns.push({
          content: section,
          contentType: 'text',
          filePath: file.relativePath,
          metadata: {
            type: 'documentation',
            language: 'markdown',
          }
        });
      }
    }
  } else if (file.ext === '.ts' || file.ext === '.js') {
    // Extract code blocks (classes, functions, interfaces)
    const classMatches = content.matchAll(/(?:export\s+)?(?:class|interface)\s+(\w+)[\s\S]*?\{[\s\S]*?\n\}/g);
    for (const match of classMatches) {
      if (match[0].length >= PATTERN_CONFIG.minPatternSize &&
          match[0].length <= PATTERN_CONFIG.maxPatternSize) {
        patterns.push({
          content: match[0],
          contentType: 'code',
          filePath: file.relativePath,
          metadata: {
            type: 'class',
            name: match[1],
            language: file.ext === '.ts' ? 'typescript' : 'javascript',
          }
        });
      }
    }

    // Extract standalone functions
    const functionMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)[\s\S]*?\{[\s\S]*?\n\}/g);
    for (const match of functionMatches) {
      if (match[0].length >= PATTERN_CONFIG.minPatternSize &&
          match[0].length <= PATTERN_CONFIG.maxPatternSize) {
        patterns.push({
          content: match[0],
          contentType: 'code',
          filePath: file.relativePath,
          metadata: {
            type: 'function',
            name: match[1],
            language: file.ext === '.ts' ? 'typescript' : 'javascript',
          }
        });
      }
    }
  }

  return patterns;
}

/**
 * Determine agent domain from file path
 */
function getAgentDomain(filePath) {
  const pathLower = filePath.toLowerCase();

  // Check agent-specific directories
  for (const [agent, keywords] of Object.entries(PATTERN_CONFIG.agentDomains)) {
    if (pathLower.includes(agent.replace('-', ''))) {
      return agent;
    }

    // Check keywords
    for (const keyword of keywords) {
      if (pathLower.includes(keyword)) {
        return agent;
      }
    }
  }

  // Default to general if no specific domain
  return 'general';
}

/**
 * Generate tags from content and metadata
 */
function generateTags(pattern, agentDomain) {
  const tags = [agentDomain];

  // Add type tag
  if (pattern.metadata.type) {
    tags.push(pattern.metadata.type);
  }

  // Add language tag
  if (pattern.metadata.language) {
    tags.push(pattern.metadata.language);
  }

  // Add framework tags based on content
  const contentLower = pattern.content.toLowerCase();
  if (contentLower.includes('react')) tags.push('react');
  if (contentLower.includes('jest')) tags.push('jest');
  if (contentLower.includes('playwright')) tags.push('playwright');
  if (contentLower.includes('supabase')) tags.push('supabase');
  if (contentLower.includes('api')) tags.push('api');
  if (contentLower.includes('security')) tags.push('security');
  if (contentLower.includes('test')) tags.push('test');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate simple hash-based embedding (fallback if no OpenAI)
 * Uses deterministic hash for consistent embeddings
 */
function generateHashEmbedding(content) {
  const hash = crypto.createHash('sha256').update(content).digest();
  const embedding = new Array(1536); // OpenAI dimension

  // Distribute hash bytes across embedding dimensions
  for (let i = 0; i < 1536; i++) {
    const byteIndex = i % hash.length;
    embedding[i] = (hash[byteIndex] / 255) * 2 - 1; // Normalize to [-1, 1]
  }

  // Normalize vector to unit length (cosine similarity compatible)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

/**
 * Store patterns in Supabase
 */
async function storePatterns(supabase, patterns, dryRun = false) {
  if (dryRun) {
    log.info(`DRY RUN: Would store ${patterns.length} patterns`);
    return { success: patterns.length, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];

    try {
      // Generate embedding
      const embedding = generateHashEmbedding(pattern.content);

      // Prepare record
      const record = {
        content: pattern.content,
        content_type: pattern.contentType,
        embedding: embedding,
        metadata: {
          ...pattern.metadata,
          tags: pattern.tags,
          file_path: pattern.filePath,
          seeded_at: new Date().toISOString(),
          source: 'framework',
        },
        agent_id: pattern.agentDomain,
      };

      // Insert into Supabase
      const { error } = await supabase
        .from('versatil_memories')
        .insert([record]);

      if (error) {
        log.warn(`Failed to store pattern from ${pattern.filePath}: ${error.message}`);
        failed++;
      } else {
        success++;
      }

      // Progress update
      log.progress(i + 1, patterns.length, `Storing patterns (${success} success, ${failed} failed)`);

    } catch (error) {
      log.warn(`Error processing pattern: ${error.message}`);
      failed++;
    }
  }

  console.log(''); // New line after progress bar
  return { success, failed };
}

/**
 * Main seeding function
 */
async function seedFrameworkPatterns() {
  log.title('🌱 Seeding VERSATIL Framework Patterns to RAG');

  // Parse arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const agentFilter = args.find(arg => arg.startsWith('--agent='))?.split('=')[1];

  if (dryRun) {
    log.warn('DRY RUN MODE - Patterns will not be stored');
  }

  // Load environment
  log.info('Loading Supabase credentials...');
  const env = loadEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    log.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in ~/.versatil/.env');
    process.exit(1);
  }

  if (env.SUPABASE_URL.includes('your-') || env.SUPABASE_SERVICE_KEY.includes('your-')) {
    log.error('Placeholder credentials detected. Please run: node scripts/setup-supabase.cjs');
    process.exit(1);
  }

  // Connect to Supabase
  log.info('Connecting to Supabase...');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Test connection
  try {
    const { data, error } = await supabase.from('versatil_memories').select('id').limit(1);
    if (error) {
      log.error(`Connection failed: ${error.message}`);
      log.info('Run: node scripts/setup-supabase.cjs');
      process.exit(1);
    }
    log.success('Connected to Supabase');
  } catch (error) {
    log.error(`Connection test failed: ${error.message}`);
    process.exit(1);
  }

  // Scan directories
  log.info('Scanning framework directories...');
  const baseDir = path.resolve(__dirname, '..');
  const allFiles = [];

  for (const scanDir of PATTERN_CONFIG.scanDirs) {
    const fullPath = path.join(baseDir, scanDir);
    const files = scanDirectory(fullPath, baseDir);
    allFiles.push(...files);
  }

  log.success(`Found ${allFiles.length} files to analyze`);

  // Extract patterns
  log.info('Extracting patterns...');
  const allPatterns = [];

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const patterns = extractPatterns(file);

    for (const pattern of patterns) {
      const agentDomain = getAgentDomain(pattern.filePath);

      // Apply agent filter if specified
      if (agentFilter && agentDomain !== agentFilter) {
        continue;
      }

      pattern.agentDomain = agentDomain;
      pattern.tags = generateTags(pattern, agentDomain);
      allPatterns.push(pattern);
    }

    log.progress(i + 1, allFiles.length, 'Extracting patterns');
  }

  console.log(''); // New line after progress
  log.success(`Extracted ${allPatterns.length} patterns`);

  // Show breakdown by agent
  const breakdown = {};
  for (const pattern of allPatterns) {
    breakdown[pattern.agentDomain] = (breakdown[pattern.agentDomain] || 0) + 1;
  }

  log.info('Pattern breakdown by agent:');
  for (const [agent, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${agent.padEnd(20)} : ${count} patterns`);
  }

  // Store patterns
  log.info('\nStoring patterns in Supabase...');
  const { success, failed } = await storePatterns(supabase, allPatterns, dryRun);

  // Summary
  log.title('✅ Seeding Complete');
  log.success(`${success} patterns stored successfully`);
  if (failed > 0) {
    log.warn(`${failed} patterns failed to store`);
  }

  if (!dryRun) {
    log.info('\nVerify patterns: npm run rag:test');
  }
}

// Run
seedFrameworkPatterns().catch(error => {
  log.error('Seeding failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
