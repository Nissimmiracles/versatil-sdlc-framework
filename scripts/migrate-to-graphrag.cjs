#!/usr/bin/env node
/**
 * Migrate Local Patterns to GraphRAG Knowledge Graph
 *
 * Migrates existing patterns from local JSON storage to GraphRAG
 * using entity extraction and graph relationships.
 *
 * Benefits over Vector RAG:
 * - No API quota limits
 * - Works offline (no external API calls)
 * - Better semantic understanding via graph relationships
 * - Explainable results (shows graph paths)
 *
 * Usage:
 *   node scripts/migrate-to-graphrag.cjs
 *   npm run rag:migrate:graph
 */

const fs = require('fs');
const path = require('path');

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
};

async function migrateToGraphRAG() {
  log.title('🕸️  Migrating Patterns to GraphRAG Knowledge Graph');

  // Check GCP configuration
  const gcpProject = process.env.GOOGLE_CLOUD_PROJECT;

  if (!gcpProject) {
    log.error('GOOGLE_CLOUD_PROJECT not set. Please configure GCP environment variables.');
    log.info('Set GOOGLE_CLOUD_PROJECT to your GCP project ID.');
    process.exit(1);
  }

  log.info(`GCP Project: ${gcpProject}`);

  // Find local patterns
  const learningPatternsDir = path.join(process.env.HOME, '.versatil', 'learning', 'patterns');

  if (!fs.existsSync(learningPatternsDir)) {
    log.error(`Pattern directory not found: ${learningPatternsDir}`);
    log.info('No patterns to migrate.');
    process.exit(0);
  }

  const patternFiles = fs.readdirSync(learningPatternsDir).filter(f => f.endsWith('.json'));

  if (patternFiles.length === 0) {
    log.warn('No pattern files found to migrate.');
    log.info('Generate patterns by using VELOCITY workflow and running /learn command.');
    process.exit(0);
  }

  log.info(`Found ${patternFiles.length} patterns to migrate\n`);

  // Load GraphRAG store (using dynamic import for ESM)
  let graphRAGStore;
  try {
    const module = await import('../dist/lib/graphrag-store.js');
    graphRAGStore = module.graphRAGStore;
    await graphRAGStore.initialize();
    log.success('GraphRAG Store initialized\n');
  } catch (error) {
    log.error(`Failed to initialize GraphRAG Store: ${error.message}`);
    log.info('Make sure the framework is compiled: npm run build');
    process.exit(1);
  }

  // Migrate each pattern
  let migratedCount = 0;
  let failedCount = 0;

  for (const file of patternFiles) {
    const filePath = path.join(learningPatternsDir, file);

    try {
      const pattern = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      log.info(`Migrating: ${pattern.pattern || file}...`);

      // Prepare pattern data
      const patternData = {
        pattern: pattern.pattern,
        category: pattern.category || 'general',
        agent: pattern.agent || 'unknown',
        effectiveness: pattern.effectiveness || 0.8,
        timeSaved: pattern.timeSaved || 0,
        tags: pattern.tags || [],
        usageCount: pattern.usageCount || 0,
        lastUsed: pattern.lastUsed ? new Date(pattern.lastUsed) : new Date()
      };

      // Add optional fields
      if (pattern.code) patternData.code = pattern.code;
      if (pattern.description || pattern.context) {
        patternData.description = pattern.description || pattern.context;
      }

      // Add to knowledge graph
      await graphRAGStore.addPattern(patternData);

      log.success(`  ✓ Migrated: ${pattern.pattern}`);
      migratedCount++;
    } catch (error) {
      log.error(`  ✗ Failed to migrate ${file}: ${error.message}`);
      failedCount++;
    }
  }

  log.title('📊 Migration Summary');
  log.success(`Migrated: ${migratedCount}/${patternFiles.length} patterns`);

  if (failedCount > 0) {
    log.warn(`Failed: ${failedCount} patterns`);
  }

  // Show statistics
  try {
    const stats = await graphRAGStore.getStatistics();
    log.info(`\nGraphRAG Knowledge Graph Statistics:`);
    log.info(`  Total nodes: ${stats.totalNodes}`);
    log.info(`  Total edges: ${stats.totalEdges}`);
    log.info(`  Avg connections per node: ${stats.avgConnections.toFixed(1)}`);
    log.info(`\n  Nodes by type:`);
    log.info(`    Patterns: ${stats.nodesByType.pattern}`);
    log.info(`    Agents: ${stats.nodesByType.agent}`);
    log.info(`    Technologies: ${stats.nodesByType.technology}`);
    log.info(`    Concepts: ${stats.nodesByType.concept}`);
    log.info(`    Categories: ${stats.nodesByType.category}`);
  } catch (error) {
    log.warn('Could not retrieve statistics');
  }

  await graphRAGStore.close();
  log.success('\n✅ GraphRAG migration complete!');
  log.info('\nBenefits of GraphRAG:');
  log.info('  ✓ No API quota limits (works offline)');
  log.info('  ✓ No embedding generation needed');
  log.info('  ✓ Better semantic understanding via relationships');
  log.info('  ✓ Explainable results (shows graph paths)');
}

migrateToGraphRAG().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
