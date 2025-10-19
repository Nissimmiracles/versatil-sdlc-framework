#!/usr/bin/env node

/**
 * RAG Health Check CLI Tool
 *
 * Comprehensive health monitoring for the RAG pattern storage system.
 *
 * Commands:
 *   check      - Run health check and display status
 *   repair     - Attempt to repair common issues
 *   stats      - Show detailed statistics
 *   test-query - Test query performance with sample data
 *
 * Usage:
 *   node scripts/rag-health-check.cjs check
 *   node scripts/rag-health-check.cjs repair
 *   node scripts/rag-health-check.cjs stats
 *   node scripts/rag-health-check.cjs test-query "authentication patterns"
 *   node scripts/rag-health-check.cjs check --json
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Parse arguments
const args = process.argv.slice(2);
const command = args[0] || 'check';
const commandArgs = args.slice(1);
const isJsonOutput = commandArgs.includes('--json');

class RAGHealthCheck {
  constructor() {
    this.supabase = null;
    this.health = {
      overall: 'unknown',
      database: 'unknown',
      storage: 'unknown',
      embeddings: 'unknown',
      performance: 'unknown',
      issues: []
    };
    this.stats = {
      totalPatterns: 0,
      embeddingCoverage: 0,
      storageSize: 0,
      avgQueryTime: 0,
      p95QueryTime: 0
    };
  }

  /**
   * Run health check
   */
  async check() {
    if (!isJsonOutput) {
      console.log('\n🏥 RAG Health Check\n');
      console.log('='.repeat(60) + '\n');
    }

    // Check database connection
    await this.checkDatabase();

    // Check storage
    await this.checkStorage();

    // Check embeddings
    await this.checkEmbeddings();

    // Check performance
    await this.checkPerformance();

    // Calculate overall health
    this.calculateOverallHealth();

    // Display results
    if (isJsonOutput) {
      console.log(JSON.stringify({
        health: this.health,
        stats: this.stats,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      this.displayHealth();
    }

    return this.health.overall === 'healthy';
  }

  /**
   * Check database connection and table status
   */
  async checkDatabase() {
    if (!isJsonOutput) {
      console.log('🔌 Checking database connection...');
    }

    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        this.health.database = 'not_configured';
        this.health.issues.push({
          severity: 'info',
          component: 'database',
          message: 'Supabase not configured - using local storage only'
        });

        if (!isJsonOutput) {
          console.log('   ℹ️  Supabase not configured (local storage mode)\n');
        }
        return;
      }

      this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      // Test connection by querying the table
      const { data, error } = await this.supabase
        .from('versatil_memories')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.health.database = 'table_missing';
          this.health.issues.push({
            severity: 'warning',
            component: 'database',
            message: 'Table versatil_memories does not exist - run migrations'
          });

          if (!isJsonOutput) {
            console.log('   ⚠️  Table versatil_memories does not exist\n');
          }
        } else {
          throw error;
        }
      } else {
        this.health.database = 'healthy';

        if (!isJsonOutput) {
          console.log('   ✅ Database connection healthy\n');
        }
      }
    } catch (error) {
      this.health.database = 'error';
      this.health.issues.push({
        severity: 'error',
        component: 'database',
        message: `Database connection failed: ${error.message}`
      });

      if (!isJsonOutput) {
        console.log(`   ❌ Database connection failed: ${error.message}\n`);
      }
    }
  }

  /**
   * Check local storage
   */
  async checkStorage() {
    if (!isJsonOutput) {
      console.log('📁 Checking local storage...');
    }

    const storagePath = path.join(process.cwd(), '.versatil', 'rag', 'vector-index');

    try {
      await fs.mkdir(storagePath, { recursive: true });

      const files = await fs.readdir(storagePath);
      this.stats.storageFiles = files.length;

      // Calculate storage size
      let totalSize = 0;
      for (const file of files) {
        const stats = await fs.stat(path.join(storagePath, file));
        totalSize += stats.size;
      }

      this.stats.storageSize = totalSize;
      this.health.storage = 'healthy';

      if (!isJsonOutput) {
        console.log(`   ✅ Storage healthy (${files.length} files, ${formatBytes(totalSize)})\n`);
      }
    } catch (error) {
      this.health.storage = 'error';
      this.health.issues.push({
        severity: 'error',
        component: 'storage',
        message: `Storage check failed: ${error.message}`
      });

      if (!isJsonOutput) {
        console.log(`   ❌ Storage check failed: ${error.message}\n`);
      }
    }
  }

  /**
   * Check embeddings coverage and quality
   */
  async checkEmbeddings() {
    if (!isJsonOutput) {
      console.log('🧠 Checking embeddings...');
    }

    if (!this.supabase || this.health.database !== 'healthy') {
      this.health.embeddings = 'skipped';

      if (!isJsonOutput) {
        console.log('   ⏭️  Skipped (database not available)\n');
      }
      return;
    }

    try {
      // Get all patterns
      const { data: patterns, error } = await this.supabase
        .from('versatil_memories')
        .select('id, embedding, metadata, content');

      if (error) throw error;

      if (!patterns || patterns.length === 0) {
        this.stats.totalPatterns = 0;
        this.stats.embeddingCoverage = 0;
        this.health.embeddings = 'empty';

        if (!isJsonOutput) {
          console.log('   ℹ️  No patterns found\n');
        }
        return;
      }

      this.stats.totalPatterns = patterns.length;

      // Count patterns with valid embeddings
      const patternsWithEmbeddings = patterns.filter(p =>
        p.embedding && Array.isArray(p.embedding) && p.embedding.length > 0
      );

      this.stats.embeddingCoverage = (patternsWithEmbeddings.length / patterns.length * 100);

      // Check embedding dimensions
      const invalidDimensions = patternsWithEmbeddings.filter(p =>
        p.embedding.length !== 1536 && p.embedding.length !== 3072
      );

      if (invalidDimensions.length > 0) {
        this.health.issues.push({
          severity: 'warning',
          component: 'embeddings',
          message: `${invalidDimensions.length} patterns have invalid embedding dimensions`
        });
      }

      // Determine health status
      if (this.stats.embeddingCoverage >= 95) {
        this.health.embeddings = 'healthy';
      } else if (this.stats.embeddingCoverage >= 80) {
        this.health.embeddings = 'degraded';
        this.health.issues.push({
          severity: 'warning',
          component: 'embeddings',
          message: `Embedding coverage is ${this.stats.embeddingCoverage.toFixed(1)}% (target: 95%)`
        });
      } else {
        this.health.embeddings = 'poor';
        this.health.issues.push({
          severity: 'error',
          component: 'embeddings',
          message: `Low embedding coverage: ${this.stats.embeddingCoverage.toFixed(1)}%`
        });
      }

      if (!isJsonOutput) {
        const icon = this.health.embeddings === 'healthy' ? '✅' :
                     this.health.embeddings === 'degraded' ? '⚠️' : '❌';
        console.log(`   ${icon} Embeddings: ${this.stats.embeddingCoverage.toFixed(1)}% coverage (${patternsWithEmbeddings.length}/${patterns.length})\n`);
      }
    } catch (error) {
      this.health.embeddings = 'error';
      this.health.issues.push({
        severity: 'error',
        component: 'embeddings',
        message: `Embedding check failed: ${error.message}`
      });

      if (!isJsonOutput) {
        console.log(`   ❌ Embedding check failed: ${error.message}\n`);
      }
    }
  }

  /**
   * Check query performance
   */
  async checkPerformance() {
    if (!isJsonOutput) {
      console.log('⚡ Checking performance...');
    }

    if (!this.supabase || this.health.database !== 'healthy') {
      this.health.performance = 'skipped';

      if (!isJsonOutput) {
        console.log('   ⏭️  Skipped (database not available)\n');
      }
      return;
    }

    try {
      // Run sample queries
      const queries = [
        'authentication security patterns',
        'React component best practices',
        'database optimization techniques'
      ];

      const queryTimes = [];

      for (const query of queries) {
        const startTime = Date.now();

        // Note: This requires the match_memories RPC function
        try {
          await this.supabase.rpc('match_memories', {
            query_embedding: Array(1536).fill(0.5), // Dummy embedding
            match_threshold: 0.7,
            match_count: 5
          });

          queryTimes.push(Date.now() - startTime);
        } catch (error) {
          // RPC function might not exist yet
          if (!isJsonOutput) {
            console.log('   ℹ️  Performance test skipped (RPC function not available)\n');
          }
          this.health.performance = 'not_available';
          return;
        }
      }

      // Calculate metrics
      this.stats.avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      queryTimes.sort((a, b) => a - b);
      this.stats.p95QueryTime = queryTimes[Math.floor(queryTimes.length * 0.95)];

      // Determine health
      if (this.stats.p95QueryTime < 200) {
        this.health.performance = 'excellent';
      } else if (this.stats.p95QueryTime < 500) {
        this.health.performance = 'good';
      } else if (this.stats.p95QueryTime < 1000) {
        this.health.performance = 'degraded';
        this.health.issues.push({
          severity: 'warning',
          component: 'performance',
          message: `Query p95 latency is ${this.stats.p95QueryTime}ms (target: <500ms)`
        });
      } else {
        this.health.performance = 'poor';
        this.health.issues.push({
          severity: 'error',
          component: 'performance',
          message: `High query latency: p95=${this.stats.p95QueryTime}ms`
        });
      }

      if (!isJsonOutput) {
        const icon = this.health.performance === 'excellent' || this.health.performance === 'good' ? '✅' :
                     this.health.performance === 'degraded' ? '⚠️' : '❌';
        console.log(`   ${icon} Performance: avg=${this.stats.avgQueryTime.toFixed(0)}ms, p95=${this.stats.p95QueryTime.toFixed(0)}ms\n`);
      }
    } catch (error) {
      this.health.performance = 'error';
      this.health.issues.push({
        severity: 'error',
        component: 'performance',
        message: `Performance check failed: ${error.message}`
      });

      if (!isJsonOutput) {
        console.log(`   ❌ Performance check failed: ${error.message}\n`);
      }
    }
  }

  /**
   * Calculate overall health status
   */
  calculateOverallHealth() {
    const statuses = [
      this.health.database,
      this.health.storage,
      this.health.embeddings,
      this.health.performance
    ];

    const hasError = statuses.some(s => s === 'error' || s === 'poor');
    const hasWarning = statuses.some(s => s === 'degraded' || s === 'warning' || s === 'table_missing');

    if (hasError) {
      this.health.overall = 'unhealthy';
    } else if (hasWarning) {
      this.health.overall = 'degraded';
    } else {
      this.health.overall = 'healthy';
    }
  }

  /**
   * Display health status
   */
  displayHealth() {
    console.log('='.repeat(60));
    console.log('📊 Health Summary');
    console.log('='.repeat(60) + '\n');

    // Overall status
    const statusIcon = this.health.overall === 'healthy' ? '✅' :
                       this.health.overall === 'degraded' ? '⚠️' : '❌';
    console.log(`${statusIcon} Overall Status: ${this.health.overall.toUpperCase()}\n`);

    // Component statuses
    console.log('Component Health:');
    console.log(`   Database:    ${getStatusIcon(this.health.database)} ${this.health.database}`);
    console.log(`   Storage:     ${getStatusIcon(this.health.storage)} ${this.health.storage}`);
    console.log(`   Embeddings:  ${getStatusIcon(this.health.embeddings)} ${this.health.embeddings}`);
    console.log(`   Performance: ${getStatusIcon(this.health.performance)} ${this.health.performance}`);
    console.log('');

    // Statistics
    if (this.stats.totalPatterns > 0) {
      console.log('Statistics:');
      console.log(`   Total patterns:       ${this.stats.totalPatterns}`);
      console.log(`   Embedding coverage:   ${this.stats.embeddingCoverage.toFixed(1)}%`);
      if (this.stats.storageSize) {
        console.log(`   Storage size:         ${formatBytes(this.stats.storageSize)}`);
      }
      if (this.stats.avgQueryTime) {
        console.log(`   Avg query time:       ${this.stats.avgQueryTime.toFixed(0)}ms`);
        console.log(`   p95 query time:       ${this.stats.p95QueryTime.toFixed(0)}ms`);
      }
      console.log('');
    }

    // Issues
    if (this.health.issues.length > 0) {
      console.log('Issues:');

      const errors = this.health.issues.filter(i => i.severity === 'error');
      const warnings = this.health.issues.filter(i => i.severity === 'warning');
      const info = this.health.issues.filter(i => i.severity === 'info');

      if (errors.length > 0) {
        console.log(`\n   ❌ Errors (${errors.length}):`);
        errors.forEach(issue => console.log(`      • ${issue.message}`));
      }

      if (warnings.length > 0) {
        console.log(`\n   ⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(issue => console.log(`      • ${issue.message}`));
      }

      if (info.length > 0) {
        console.log(`\n   ℹ️  Info (${info.length}):`);
        info.forEach(issue => console.log(`      • ${issue.message}`));
      }

      console.log('');
    }

    // Recommendations
    if (this.health.overall !== 'healthy') {
      console.log('💡 Recommendations:');

      if (this.health.database === 'not_configured') {
        console.log('   • Configure Supabase for production RAG storage');
        console.log('     Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
      }

      if (this.health.database === 'table_missing') {
        console.log('   • Run database migrations to create versatil_memories table');
      }

      if (this.health.embeddings === 'degraded' || this.health.embeddings === 'poor') {
        console.log('   • Regenerate embeddings for patterns');
        console.log('     Run: node scripts/rag-health-check.cjs repair');
      }

      if (this.health.performance === 'degraded' || this.health.performance === 'poor') {
        console.log('   • Optimize database indexes for vector similarity search');
        console.log('   • Consider upgrading Supabase plan for better performance');
      }

      console.log('');
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Display statistics
   */
  async showStats() {
    await this.check();

    if (!isJsonOutput) {
      console.log('\n📈 Detailed Statistics\n');
      console.log('='.repeat(60) + '\n');

      if (this.supabase && this.health.database === 'healthy') {
        // Get pattern breakdown by agent
        const { data: patterns } = await this.supabase
          .from('versatil_memories')
          .select('metadata, content_type');

        if (patterns && patterns.length > 0) {
          // By agent
          const byAgent = {};
          patterns.forEach(p => {
            const agent = p.metadata?.agentId || 'unknown';
            byAgent[agent] = (byAgent[agent] || 0) + 1;
          });

          console.log('Patterns by Agent:');
          Object.entries(byAgent)
            .sort((a, b) => b[1] - a[1])
            .forEach(([agent, count]) => {
              console.log(`   ${agent.padEnd(25)} ${count}`);
            });
          console.log('');

          // By content type
          const byType = {};
          patterns.forEach(p => {
            const type = p.content_type || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
          });

          console.log('Patterns by Content Type:');
          Object.entries(byType)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
              console.log(`   ${type.padEnd(25)} ${count}`);
            });
          console.log('');
        }
      }

      console.log('='.repeat(60) + '\n');
    }
  }

  /**
   * Test query performance
   */
  async testQuery(queryText) {
    console.log(`\n🔍 Testing Query: "${queryText}"\n`);
    console.log('='.repeat(60) + '\n');

    if (!this.supabase) {
      console.log('❌ Supabase not configured\n');
      return;
    }

    const startTime = Date.now();

    try {
      // Note: This is a simplified test - real implementation would generate actual embeddings
      const { data, error } = await this.supabase
        .from('versatil_memories')
        .select('*')
        .textSearch('content', queryText)
        .limit(5);

      const queryTime = Date.now() - startTime;

      if (error) throw error;

      console.log(`✅ Query completed in ${queryTime}ms\n`);
      console.log(`Found ${data?.length || 0} results:\n`);

      if (data && data.length > 0) {
        data.forEach((result, idx) => {
          console.log(`${idx + 1}. ${result.content.substring(0, 100)}...`);
          console.log(`   Agent: ${result.metadata?.agentId || 'unknown'}`);
          console.log(`   Tags: ${result.metadata?.tags?.join(', ') || 'none'}`);
          console.log('');
        });
      }

      console.log('='.repeat(60) + '\n');
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}\n`);
    }
  }
}

// Utility functions
function getStatusIcon(status) {
  if (status === 'healthy' || status === 'excellent' || status === 'good') return '✅';
  if (status === 'degraded' || status === 'warning' || status === 'table_missing') return '⚠️';
  if (status === 'error' || status === 'unhealthy' || status === 'poor') return '❌';
  return 'ℹ️';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Main execution
(async () => {
  const healthCheck = new RAGHealthCheck();

  try {
    switch (command) {
      case 'check':
        const isHealthy = await healthCheck.check();
        process.exit(isHealthy ? 0 : 1);
        break;

      case 'stats':
        await healthCheck.showStats();
        break;

      case 'test-query':
        const query = commandArgs.filter(arg => !arg.startsWith('--')).join(' ');
        if (!query) {
          console.error('Usage: rag-health-check.cjs test-query "your query here"');
          process.exit(1);
        }
        await healthCheck.testQuery(query);
        break;

      case 'repair':
        console.log('🔧 Repair functionality coming soon...');
        console.log('   Use scripts/validate-rag-integrity.cjs --repair for now');
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Available commands: check, repair, stats, test-query');
        process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
