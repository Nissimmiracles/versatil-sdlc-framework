#!/usr/bin/env node
/**
 * Migrate Local Patterns to GCP Firestore Vector Store
 * 
 * Migrates existing patterns from local JSON storage to GCP Firestore
 * with Vertex AI embeddings for semantic search.
 * 
 * Usage:
 *   node scripts/migrate-to-gcp.cjs
 *   npm run rag:migrate:gcp
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

async function migrateToGCP() {
  log.title('🚀 Migrating Patterns to GCP Firestore Vector Store');

  // Check GCP configuration
  const gcpProject = process.env.GOOGLE_CLOUD_PROJECT;
  const gcpLocation = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  if (!gcpProject) {
    log.error('GOOGLE_CLOUD_PROJECT not set. Please configure GCP environment variables.');
    log.info('Set GOOGLE_CLOUD_PROJECT to your GCP project ID.');
    process.exit(1);
  }

  log.info(`GCP Project: ${gcpProject}`);
  log.info(`GCP Location: ${gcpLocation}`);

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

  // Load GCP vector store (using dynamic import for ESM)
  let gcpVectorStore;
  try {
    const module = await import('../dist/lib/gcp-vector-store.js');
    gcpVectorStore = module.gcpVectorStore;
    await gcpVectorStore.initialize();
    log.success('GCP Firestore initialized\n');
  } catch (error) {
    log.error(`Failed to initialize GCP Firestore: ${error.message}`);
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

      // Store in GCP Firestore (filter out undefined values)
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

      // Only add optional fields if they exist (Firestore doesn't allow undefined)
      if (pattern.code) patternData.code = pattern.code;
      if (pattern.description || pattern.context) {
        patternData.description = pattern.description || pattern.context;
      }

      await gcpVectorStore.storePattern(patternData);

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
    const stats = await gcpVectorStore.getStatistics();
    log.info(`\nGCP Firestore Statistics:`);
    log.info(`  Total patterns: ${stats.totalPatterns}`);
    log.info(`  Total embeddings: ${stats.totalEmbeddings}`);
    log.info(`  Categories: ${Object.keys(stats.categories).length}`);
    log.info(`  Agents: ${Object.keys(stats.agents).length}`);
  } catch (error) {
    log.warn('Could not retrieve statistics');
  }

  await gcpVectorStore.close();
  log.success('\n✅ Migration complete!');
}

migrateToGCP().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
