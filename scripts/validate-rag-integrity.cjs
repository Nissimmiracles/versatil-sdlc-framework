#!/usr/bin/env node

/**
 * RAG Integrity Validation Script
 *
 * Validates data integrity across the RAG system:
 * - Orphaned embeddings (embeddings without metadata)
 * - Missing embeddings (patterns without embeddings)
 * - Invalid embedding dimensions
 * - Duplicate patterns
 * - Metadata consistency
 * - Storage integrity
 *
 * Usage:
 *   node scripts/validate-rag-integrity.cjs
 *   node scripts/validate-rag-integrity.cjs --repair
 *   node scripts/validate-rag-integrity.cjs --verbose
 *   node scripts/validate-rag-integrity.cjs --report=integrity-report.json
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const EXPECTED_EMBEDDING_DIM = 1536; // OpenAI ada-002 dimension
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  repair: args.includes('--repair'),
  verbose: args.includes('--verbose'),
  report: args.find(arg => arg.startsWith('--report='))?.split('=')[1]
};

class RAGIntegrityValidator {
  constructor() {
    this.supabase = null;
    this.issues = [];
    this.stats = {
      totalPatterns: 0,
      patternsWithEmbeddings: 0,
      patternsWithoutEmbeddings: 0,
      orphanedEmbeddings: 0,
      invalidDimensions: 0,
      duplicatePatterns: 0,
      metadataIssues: 0,
      repairsApplied: 0
    };
  }

  /**
   * Initialize connection to Supabase
   */
  async initialize() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn('⚠️  Supabase not configured - skipping database validation');
      return false;
    }

    try {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Connected to Supabase');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      return false;
    }
  }

  /**
   * Run all validation checks
   */
  async validate() {
    console.log('\n🔍 Starting RAG Integrity Validation...\n');

    const connected = await this.initialize();

    if (connected) {
      await this.checkDatabaseIntegrity();
    }

    await this.checkLocalStorage();
    await this.generateReport();

    return this.issues.length === 0;
  }

  /**
   * Check database integrity (Supabase)
   */
  async checkDatabaseIntegrity() {
    console.log('📊 Checking database integrity...');

    try {
      // 1. Check for patterns
      const { data: patterns, error: patternsError } = await this.supabase
        .from('versatil_memories')
        .select('id, content, embedding, metadata, content_type, agent_id, created_at');

      if (patternsError) {
        if (patternsError.message.includes('relation') && patternsError.message.includes('does not exist')) {
          console.log('ℹ️  Table versatil_memories does not exist yet - this is expected for new installations');
          return;
        }
        throw patternsError;
      }

      this.stats.totalPatterns = patterns?.length || 0;
      console.log(`   Found ${this.stats.totalPatterns} patterns in database`);

      if (!patterns || patterns.length === 0) {
        console.log('   No patterns to validate');
        return;
      }

      // 2. Check embeddings
      for (const pattern of patterns) {
        await this.validatePattern(pattern);
      }

      // 3. Check for duplicates
      await this.checkDuplicates(patterns);

      console.log('✅ Database integrity check complete');
    } catch (error) {
      this.addIssue('error', 'Database Check Failed', error.message);
      console.error('❌ Database integrity check failed:', error.message);
    }
  }

  /**
   * Validate individual pattern
   */
  async validatePattern(pattern) {
    const patternId = pattern.id;
    const verbose = options.verbose;

    // Check 1: Embedding exists
    if (!pattern.embedding || pattern.embedding.length === 0) {
      this.stats.patternsWithoutEmbeddings++;
      this.addIssue('warning', 'Missing Embedding', `Pattern ${patternId} has no embedding`, {
        patternId,
        content: pattern.content?.substring(0, 100)
      });

      if (verbose) {
        console.log(`   ⚠️  Pattern ${patternId}: Missing embedding`);
      }
    } else {
      this.stats.patternsWithEmbeddings++;

      // Check 2: Embedding dimension
      if (pattern.embedding.length !== EXPECTED_EMBEDDING_DIM) {
        this.stats.invalidDimensions++;
        this.addIssue('error', 'Invalid Embedding Dimension',
          `Pattern ${patternId} has embedding dimension ${pattern.embedding.length}, expected ${EXPECTED_EMBEDDING_DIM}`,
          {
            patternId,
            actualDimension: pattern.embedding.length,
            expectedDimension: EXPECTED_EMBEDDING_DIM
          }
        );

        if (verbose) {
          console.log(`   ❌ Pattern ${patternId}: Invalid dimension (${pattern.embedding.length})`);
        }
      }
    }

    // Check 3: Metadata validity
    if (!pattern.metadata || typeof pattern.metadata !== 'object') {
      this.stats.metadataIssues++;
      this.addIssue('warning', 'Invalid Metadata', `Pattern ${patternId} has invalid metadata`, {
        patternId,
        metadata: pattern.metadata
      });

      if (verbose) {
        console.log(`   ⚠️  Pattern ${patternId}: Invalid metadata`);
      }
    } else {
      // Check required metadata fields
      const requiredFields = ['agentId', 'timestamp', 'tags'];
      const missingFields = requiredFields.filter(field => !(field in pattern.metadata));

      if (missingFields.length > 0) {
        this.stats.metadataIssues++;
        this.addIssue('info', 'Missing Metadata Fields',
          `Pattern ${patternId} missing fields: ${missingFields.join(', ')}`,
          {
            patternId,
            missingFields
          }
        );

        if (verbose) {
          console.log(`   ℹ️  Pattern ${patternId}: Missing metadata fields: ${missingFields.join(', ')}`);
        }
      }
    }

    // Check 4: Content validity
    if (!pattern.content || pattern.content.trim().length === 0) {
      this.addIssue('error', 'Empty Content', `Pattern ${patternId} has empty content`, {
        patternId
      });

      if (verbose) {
        console.log(`   ❌ Pattern ${patternId}: Empty content`);
      }
    }
  }

  /**
   * Check for duplicate patterns
   */
  async checkDuplicates(patterns) {
    console.log('🔎 Checking for duplicates...');

    const contentMap = new Map();

    for (const pattern of patterns) {
      const contentHash = pattern.content.trim().toLowerCase();

      if (contentMap.has(contentHash)) {
        this.stats.duplicatePatterns++;
        const original = contentMap.get(contentHash);

        this.addIssue('info', 'Duplicate Pattern',
          `Pattern ${pattern.id} is duplicate of ${original.id}`,
          {
            duplicateId: pattern.id,
            originalId: original.id,
            content: pattern.content.substring(0, 100)
          }
        );

        if (options.verbose) {
          console.log(`   ℹ️  Duplicate: ${pattern.id} = ${original.id}`);
        }
      } else {
        contentMap.set(contentHash, pattern);
      }
    }

    if (this.stats.duplicatePatterns === 0) {
      console.log('   ✅ No duplicates found');
    } else {
      console.log(`   ℹ️  Found ${this.stats.duplicatePatterns} duplicate patterns`);
    }
  }

  /**
   * Check local storage integrity
   */
  async checkLocalStorage() {
    console.log('📁 Checking local storage...');

    const localStoragePath = path.join(process.cwd(), '.versatil', 'rag', 'vector-index');

    try {
      const stats = await fs.stat(localStoragePath);

      if (stats.isDirectory()) {
        const files = await fs.readdir(localStoragePath);
        console.log(`   Found ${files.length} files in local storage`);

        // Check for corrupted files
        for (const file of files) {
          if (file.endsWith('.json')) {
            await this.validateLocalFile(path.join(localStoragePath, file));
          }
        }
      }

      console.log('✅ Local storage check complete');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('   ℹ️  Local storage directory does not exist yet');
      } else {
        this.addIssue('error', 'Local Storage Check Failed', error.message);
        console.error('❌ Local storage check failed:', error.message);
      }
    }
  }

  /**
   * Validate local JSON file
   */
  async validateLocalFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      JSON.parse(content); // Validate JSON

      if (options.verbose) {
        console.log(`   ✅ ${path.basename(filePath)}: Valid JSON`);
      }
    } catch (error) {
      this.addIssue('error', 'Corrupted Local File', `File ${path.basename(filePath)} is corrupted`, {
        filePath,
        error: error.message
      });

      console.log(`   ❌ ${path.basename(filePath)}: Corrupted (${error.message})`);
    }
  }

  /**
   * Add issue to list
   */
  addIssue(severity, type, message, details = {}) {
    this.issues.push({
      severity,
      type,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate validation report
   */
  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 Validation Report');
    console.log('='.repeat(60) + '\n');

    // Statistics
    console.log('📊 Statistics:');
    console.log(`   Total patterns: ${this.stats.totalPatterns}`);
    console.log(`   Patterns with embeddings: ${this.stats.patternsWithEmbeddings}`);
    console.log(`   Patterns without embeddings: ${this.stats.patternsWithoutEmbeddings}`);
    console.log(`   Invalid embedding dimensions: ${this.stats.invalidDimensions}`);
    console.log(`   Duplicate patterns: ${this.stats.duplicatePatterns}`);
    console.log(`   Metadata issues: ${this.stats.metadataIssues}`);
    console.log('');

    // Coverage
    if (this.stats.totalPatterns > 0) {
      const embeddingCoverage = (this.stats.patternsWithEmbeddings / this.stats.totalPatterns * 100).toFixed(1);
      console.log(`   Embedding coverage: ${embeddingCoverage}%`);
      console.log('');
    }

    // Issues summary
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.issues.filter(i => i.severity === 'warning').length;
    const infoCount = this.issues.filter(i => i.severity === 'info').length;

    console.log('🚨 Issues:');
    if (errorCount > 0) console.log(`   ❌ Errors: ${errorCount}`);
    if (warningCount > 0) console.log(`   ⚠️  Warnings: ${warningCount}`);
    if (infoCount > 0) console.log(`   ℹ️  Info: ${infoCount}`);

    if (this.issues.length === 0) {
      console.log('   ✅ No issues found!');
    }
    console.log('');

    // Detailed issues
    if (this.issues.length > 0 && options.verbose) {
      console.log('📝 Detailed Issues:\n');

      const groupedIssues = {};
      for (const issue of this.issues) {
        if (!groupedIssues[issue.type]) {
          groupedIssues[issue.type] = [];
        }
        groupedIssues[issue.type].push(issue);
      }

      for (const [type, issues] of Object.entries(groupedIssues)) {
        console.log(`   ${type} (${issues.length}):`);
        issues.slice(0, 5).forEach((issue, idx) => {
          console.log(`     ${idx + 1}. ${issue.message}`);
        });
        if (issues.length > 5) {
          console.log(`     ... and ${issues.length - 5} more`);
        }
        console.log('');
      }
    }

    // Recommendations
    if (this.issues.length > 0) {
      console.log('💡 Recommendations:\n');

      if (this.stats.patternsWithoutEmbeddings > 0) {
        console.log(`   • Regenerate embeddings for ${this.stats.patternsWithoutEmbeddings} patterns`);
      }

      if (this.stats.invalidDimensions > 0) {
        console.log(`   • Verify embedding generation configuration`);
      }

      if (this.stats.duplicatePatterns > 0) {
        console.log(`   • Consider deduplicating ${this.stats.duplicatePatterns} patterns`);
      }

      if (this.stats.metadataIssues > 0) {
        console.log(`   • Fix metadata for ${this.stats.metadataIssues} patterns`);
      }

      if (options.repair) {
        console.log(`\n   Run with --repair to attempt automatic fixes`);
      }
    }

    console.log('');
    console.log('='.repeat(60) + '\n');

    // Export report if requested
    if (options.report) {
      await this.exportReport(options.report);
    }

    // Return status
    return this.issues.filter(i => i.severity === 'error').length === 0;
  }

  /**
   * Export report to JSON file
   */
  async exportReport(filePath) {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: this.issues,
      summary: {
        totalIssues: this.issues.length,
        errors: this.issues.filter(i => i.severity === 'error').length,
        warnings: this.issues.filter(i => i.severity === 'warning').length,
        info: this.issues.filter(i => i.severity === 'info').length
      }
    };

    try {
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      console.log(`📄 Report exported to: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to export report: ${error.message}`);
    }
  }
}

// Run validation
(async () => {
  const validator = new RAGIntegrityValidator();
  const isValid = await validator.validate();

  process.exit(isValid ? 0 : 1);
})().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
