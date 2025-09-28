#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Vector Store Migration CLI
 *
 * Command-line interface for migrating from Enhanced Vector Memory Store
 * to Supabase Vector Store with progress tracking and validation.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { VectorStoreMigration } = require('../dist/migration/vector-store-migration.js');

class MigrationCLI {
  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  setupCommands() {
    this.program
      .name('migrate-vector-store')
      .description('Migrate VERSATIL vector store from local to Supabase')
      .version('1.2.1');

    // Main migration command
    this.program
      .command('migrate')
      .description('Execute vector store migration')
      .option('--dry-run', 'Show what would be migrated without making changes')
      .option('--no-backup', 'Skip creating backup (not recommended)')
      .option('--no-preserve-local', 'Remove local data after migration')
      .option('--batch-size <number>', 'Number of items to process in each batch', '50')
      .option('--no-skip-duplicates', 'Migrate duplicate patterns')
      .option('--no-preserve-embeddings', 'Regenerate all embeddings')
      .option('--agent-filter <agents...>', 'Only migrate specified agents')
      .option('--time-range <start,end>', 'Migrate only items in time range (timestamps)')
      .option('--no-validate-integrity', 'Skip post-migration validation')
      .option('--progress-interval <ms>', 'Progress update interval in milliseconds', '5000')
      .action(this.handleMigrate.bind(this));

    // Status command
    this.program
      .command('status')
      .description('Check migration prerequisites and current state')
      .action(this.handleStatus.bind(this));

    // Validate command
    this.program
      .command('validate')
      .description('Validate migration results')
      .action(this.handleValidate.bind(this));

    // Rollback command (future)
    this.program
      .command('rollback')
      .description('Rollback migration (if supported)')
      .action(this.handleRollback.bind(this));
  }

  async handleMigrate(options) {
    console.log(chalk.blue.bold('\n🚀 VERSATIL Vector Store Migration\n'));

    try {
      // Parse options
      const migrationOptions = {
        dryRun: options.dryRun || false,
        preserveLocal: options.preserveLocal !== false,
        batchSize: parseInt(options.batchSize) || 50,
        skipDuplicates: options.skipDuplicates !== false,
        preserveEmbeddings: options.preserveEmbeddings !== false,
        agentFilter: options.agentFilter || undefined,
        timeRange: this.parseTimeRange(options.timeRange),
        validateIntegrity: options.validateIntegrity !== false,
        createBackup: options.backup !== false
      };

      if (migrationOptions.dryRun) {
        console.log(chalk.yellow('🔍 Running in DRY RUN mode - no changes will be made\n'));
      }

      // Initialize migration
      const migration = new VectorStoreMigration();

      // Setup progress tracking
      let lastUpdate = 0;
      const progressInterval = parseInt(options.progressInterval) || 5000;

      const unsubscribe = migration.onProgress((progress) => {
        const now = Date.now();
        if (now - lastUpdate >= progressInterval) {
          this.displayProgress(progress);
          lastUpdate = now;
        }
      });

      // Execute migration
      console.log(chalk.green('Starting migration...\n'));
      const report = await migration.migrate(migrationOptions);

      // Cleanup
      unsubscribe();

      // Display results
      this.displayReport(report);

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Migration failed:'));
      console.error(chalk.red(error.message));

      if (error.stack) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  }

  async handleStatus() {
    console.log(chalk.blue.bold('\n📊 Migration Status Check\n'));

    try {
      // Check Supabase configuration
      const { supabaseConfig } = require('../dist/config/supabase-config.js');
      const status = supabaseConfig.getConfigStatus();

      console.log(chalk.blue('🔧 Configuration Status:'));
      console.log(`  Supabase Configured: ${status.isConfigured ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`  Embedding Provider: ${chalk.cyan(status.embeddingProvider)}`);
      console.log(`  Environment: ${chalk.cyan(status.environment)}`);
      console.log(`  Features Enabled: ${status.featuresEnabled.join(', ') || 'none'}`);

      if (status.missingRequirements.length > 0) {
        console.log(chalk.red('\n⚠️  Missing Requirements:'));
        status.missingRequirements.forEach(req => {
          console.log(`  - ${req}`);
        });
      }

      // Check source data
      const { EnhancedVectorMemoryStore } = require('../dist/rag/enhanced-vector-memory-store.js');
      const sourceStore = new EnhancedVectorMemoryStore();
      await sourceStore.initialize();
      const memories = await sourceStore.getAllMemories();

      console.log(chalk.blue('\n📁 Source Data:'));
      console.log(`  Total Memories: ${chalk.cyan(memories.length)}`);

      const agentBreakdown = {};
      memories.forEach(m => {
        const agent = m.metadata.agentId;
        agentBreakdown[agent] = (agentBreakdown[agent] || 0) + 1;
      });

      console.log(`  Agent Breakdown:`);
      Object.entries(agentBreakdown).forEach(([agent, count]) => {
        console.log(`    ${agent}: ${chalk.cyan(count)}`);
      });

      // Check target availability
      console.log(chalk.blue('\n🎯 Target Store:'));
      if (status.isConfigured) {
        console.log(chalk.green('  ✓ Supabase Vector Store available'));
      } else {
        console.log(chalk.red('  ✗ Supabase Vector Store not configured'));
      }

    } catch (error) {
      console.error(chalk.red('Error checking status:'), error.message);
      process.exit(1);
    }
  }

  async handleValidate() {
    console.log(chalk.blue.bold('\n🔍 Validating Migration Results\n'));

    try {
      // Implementation would check migration integrity
      console.log(chalk.yellow('Validation functionality coming soon...'));

    } catch (error) {
      console.error(chalk.red('Validation failed:'), error.message);
      process.exit(1);
    }
  }

  async handleRollback() {
    console.log(chalk.yellow.bold('\n⏪ Migration Rollback\n'));
    console.log(chalk.yellow('Rollback functionality is not yet implemented.'));
    console.log(chalk.gray('If you need to rollback, restore from backup manually.'));
  }

  displayProgress(progress) {
    const percent = progress.totalItems > 0
      ? Math.round((progress.processed / progress.totalItems) * 100)
      : 0;

    const bar = this.createProgressBar(percent);
    const estimated = progress.estimated > 0
      ? ` (${Math.round(progress.estimated / 1000)}s remaining)`
      : '';

    console.log(
      `${chalk.blue(progress.phase)} ${bar} ${percent}% ` +
      `(${progress.processed}/${progress.totalItems})` +
      `${estimated}`
    );

    if (progress.errors > 0) {
      console.log(chalk.red(`  Errors: ${progress.errors}`));
    }
    if (progress.warnings > 0) {
      console.log(chalk.yellow(`  Warnings: ${progress.warnings}`));
    }
  }

  displayReport(report) {
    console.log(chalk.green.bold('\n✅ Migration Completed\n'));

    // Summary
    console.log(chalk.blue('📈 Summary:'));
    console.log(`  Status: ${report.success ? chalk.green('Success') : chalk.red('Failed')}`);
    console.log(`  Duration: ${chalk.cyan(Math.round(report.duration / 1000))}s`);

    // Statistics
    console.log(chalk.blue('\n📊 Statistics:'));
    const stats = report.finalStats;
    console.log(`  Total Memories: ${chalk.cyan(stats.totalMemories)}`);
    console.log(`  Migrated Patterns: ${chalk.cyan(stats.migratedPatterns)}`);
    console.log(`  Migrated Solutions: ${chalk.cyan(stats.migratedSolutions)}`);
    console.log(`  Migrated Interactions: ${chalk.cyan(stats.migratedInteractions)}`);
    console.log(`  Preserved Embeddings: ${chalk.cyan(stats.preservedEmbeddings)}`);
    console.log(`  Duplicates Skipped: ${chalk.cyan(stats.duplicatesSkipped)}`);

    // Phase breakdown
    console.log(chalk.blue('\n🔄 Phase Results:'));
    Object.entries(report.phases).forEach(([phase, data]) => {
      const status = data.completed ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${phase}: ${data.success}/${data.items} (${data.errors} errors)`);

      if (data.warnings.length > 0) {
        data.warnings.forEach(warning => {
          console.log(`    ${chalk.yellow('⚠️')} ${warning}`);
        });
      }
    });

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 Recommendations:'));
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    console.log(chalk.green('\n🎉 Migration process completed successfully!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Test agent RAG functionality'));
    console.log(chalk.gray('  2. Update agent configurations'));
    console.log(chalk.gray('  3. Monitor Supabase performance'));
  }

  createProgressBar(percent, width = 30) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;

    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  parseTimeRange(timeRange) {
    if (!timeRange) return undefined;

    try {
      const [start, end] = timeRange.split(',').map(t => parseInt(t.trim()));
      return { start, end };
    } catch {
      console.warn(chalk.yellow('Invalid time range format. Use: start,end'));
      return undefined;
    }
  }

  run() {
    this.program.parse();
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new MigrationCLI();
  cli.run();
}

module.exports = { MigrationCLI };