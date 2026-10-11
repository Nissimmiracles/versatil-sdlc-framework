#!/usr/bin/env node
/**
 * Migration Script: Public/Private RAG Separation
 *
 * This script:
 * 1. Scans existing RAG store for all patterns
 * 2. Classifies each pattern as public or private
 * 3. Migrates patterns to appropriate stores
 * 4. Generates detailed migration report
 *
 * Usage:
 *   npm run migrate:rag
 *   npm run migrate:rag -- --dry-run
 *   npm run migrate:rag -- --force
 */

import { PublicRAGStore } from '../src/rag/public-rag-store.js';
import { PrivateRAGStore } from '../src/rag/private-rag-store.js';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationStats {
  totalPatterns: number;
  publicPatterns: number;
  privatePatterns: number;
  skippedPatterns: number;
  errors: Array<{ pattern: string; error: string }>;
  classificationDetails: Array<{
    pattern: string;
    classification: 'public' | 'private';
    reason: string;
    confidence: number;
  }>;
}

interface PatternData {
  id: string;
  description: string;
  code?: string;
  category?: string;
  agent?: string;
  tags?: string[];
  created_at?: string;
  effort_hours?: number;
}

class RAGMigrationService {
  private publicRAG: PublicRAGStore;
  private privateRAG: PrivateRAGStore;
  private stats: MigrationStats;

  // Private pattern indicators
  private readonly PRIVATE_KEYWORDS = [
    'password', 'secret', 'api-key', 'token', 'credential',
    'proprietary', 'internal', 'company', 'client',
    'confidential', 'private', 'sensitive', 'auth-token',
    'database-url', 'connection-string', 'env-var',
    'prod', 'production', 'staging', 'my-company'
  ];

  // Public pattern indicators
  private readonly PUBLIC_KEYWORDS = [
    'react', 'vue', 'angular', 'svelte', 'next.js',
    'authentication', 'authorization', 'jwt', 'oauth',
    'rest', 'graphql', 'api', 'crud', 'testing',
    'jest', 'vitest', 'playwright', 'cypress',
    'typescript', 'javascript', 'node.js', 'express',
    'best practice', 'design pattern', 'architecture',
    'optimization', 'performance', 'accessibility',
    'security', 'validation', 'error handling'
  ];

  constructor() {
    this.publicRAG = new PublicRAGStore();
    this.privateRAG = new PrivateRAGStore();
    this.stats = {
      totalPatterns: 0,
      publicPatterns: 0,
      privatePatterns: 0,
      skippedPatterns: 0,
      errors: [],
      classificationDetails: []
    };
  }

  /**
   * Classify pattern as public or private
   */
  private classifyPattern(pattern: PatternData): {
    classification: 'public' | 'private';
    reason: string;
    confidence: number;
  } {
    const text = `${pattern.description} ${pattern.code || ''} ${pattern.category || ''} ${(pattern.tags || []).join(' ')}`.toLowerCase();

    // Check for private indicators (HIGHEST PRIORITY)
    const privateMatches = this.PRIVATE_KEYWORDS.filter(keyword => text.includes(keyword));
    if (privateMatches.length > 0) {
      return {
        classification: 'private',
        reason: `Contains private keywords: ${privateMatches.join(', ')}`,
        confidence: Math.min(0.95, 0.7 + (privateMatches.length * 0.1))
      };
    }

    // Check for public indicators
    const publicMatches = this.PUBLIC_KEYWORDS.filter(keyword => text.includes(keyword));
    if (publicMatches.length >= 2) {
      return {
        classification: 'public',
        reason: `Contains public keywords: ${publicMatches.slice(0, 3).join(', ')}`,
        confidence: Math.min(0.9, 0.6 + (publicMatches.length * 0.05))
      };
    }

    // Check category
    const publicCategories = ['authentication', 'testing', 'api-design', 'frontend', 'backend'];
    if (pattern.category && publicCategories.includes(pattern.category.toLowerCase())) {
      return {
        classification: 'public',
        reason: `Public category: ${pattern.category}`,
        confidence: 0.75
      };
    }

    // Default: Private (safety-first approach)
    return {
      classification: 'private',
      reason: 'Default to private (no clear public indicators)',
      confidence: 0.5
    };
  }

  /**
   * Load all patterns from existing RAG store
   */
  private async loadExistingPatterns(): Promise<PatternData[]> {
    // Canonical GraphRAG query is entity retrieval, not an inventory API.
    // A wildcard query cannot establish either completeness or source visibility.
    throw new Error('RAG_MIGRATION_SOURCE_ENUMERATION_UNSUPPORTED: default GraphRAG has no authorized inventory API; migration requires an explicit source inventory and visibility scope');
  }

  /**
   * Migrate a single pattern to appropriate store
   */
  private async migratePattern(
    pattern: PatternData,
    classification: 'public' | 'private',
    dryRun: boolean
  ): Promise<boolean> {
    try {
      const targetStore = classification === 'public' ? this.publicRAG : this.privateRAG;

      if (!dryRun) {
        await targetStore.store({
          description: pattern.description,
          code: pattern.code,
          category: pattern.category,
          agent: pattern.agent,
          tags: pattern.tags,
          effort_hours: pattern.effort_hours
        });
      }

      return true;

    } catch (error) {
      this.stats.errors.push({
        pattern: pattern.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Run migration
   */
  async migrate(options: { dryRun?: boolean; force?: boolean } = {}): Promise<MigrationStats> {
    const { dryRun = false, force = false } = options;

    console.log('\n🚀 Starting RAG Migration');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}\n`);

    // Step 1: Load existing patterns
    const patterns = await this.loadExistingPatterns();
    this.stats.totalPatterns = patterns.length;

    if (patterns.length === 0) {
      console.log('⚠️  No patterns found to migrate');
      return this.stats;
    }

    // Step 2: Classify and migrate each pattern
    console.log('📊 Classifying patterns...\n');

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const { classification, reason, confidence } = this.classifyPattern(pattern);

      // Store classification details
      this.stats.classificationDetails.push({
        pattern: pattern.description.substring(0, 50) + '...',
        classification,
        reason,
        confidence
      });

      // Log progress
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${patterns.length} patterns classified`);
      }

      // Migrate pattern
      const success = await this.migratePattern(pattern, classification, dryRun);

      if (success) {
        if (classification === 'public') {
          this.stats.publicPatterns++;
        } else {
          this.stats.privatePatterns++;
        }
      } else {
        this.stats.skippedPatterns++;
      }
    }

    console.log('\n✅ Migration complete!\n');
    return this.stats;
  }

  /**
   * Generate detailed migration report
   */
  generateReport(): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('         RAG MIGRATION REPORT');
    lines.push('═══════════════════════════════════════════════════════\n');

    // Summary
    lines.push('📊 SUMMARY');
    lines.push('─────────────────────────────────────────────────────');
    lines.push(`Total Patterns:    ${this.stats.totalPatterns}`);
    lines.push(`Public Patterns:   ${this.stats.publicPatterns} (${((this.stats.publicPatterns / this.stats.totalPatterns) * 100).toFixed(1)}%)`);
    lines.push(`Private Patterns:  ${this.stats.privatePatterns} (${((this.stats.privatePatterns / this.stats.totalPatterns) * 100).toFixed(1)}%)`);
    lines.push(`Skipped:           ${this.stats.skippedPatterns}`);
    lines.push(`Errors:            ${this.stats.errors.length}\n`);

    // Classification breakdown
    if (this.stats.classificationDetails.length > 0) {
      lines.push('🔍 CLASSIFICATION DETAILS (Top 20)');
      lines.push('─────────────────────────────────────────────────────');

      const topClassifications = this.stats.classificationDetails.slice(0, 20);
      for (const detail of topClassifications) {
        const icon = detail.classification === 'public' ? '🌍' : '🔒';
        const confidence = (detail.confidence * 100).toFixed(0);
        lines.push(`${icon} ${detail.pattern}`);
        lines.push(`   → ${detail.classification.toUpperCase()} (${confidence}% confidence)`);
        lines.push(`   Reason: ${detail.reason}\n`);
      }
    }

    // Errors
    if (this.stats.errors.length > 0) {
      lines.push('❌ ERRORS');
      lines.push('─────────────────────────────────────────────────────');
      for (const error of this.stats.errors) {
        lines.push(`Pattern: ${error.pattern}`);
        lines.push(`Error: ${error.error}\n`);
      }
    }

    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Save report to file
   */
  saveReport(reportPath: string): void {
    const report = this.generateReport();
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`📄 Report saved to: ${reportPath}`);
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  if (!force && !dryRun) {
    console.log('\n⚠️  WARNING: This will migrate all patterns to Public/Private RAG stores');
    console.log('Run with --dry-run to preview changes first, or --force to proceed\n');
    process.exit(1);
  }

  const migrationService = new RAGMigrationService();
  const stats = await migrationService.migrate({ dryRun, force });

  // Display report
  console.log(migrationService.generateReport());

  // Save report to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(process.cwd(), `migration-report-${timestamp}.txt`);
  migrationService.saveReport(reportPath);

  // Exit with appropriate code
  const success = stats.errors.length === 0;
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { RAGMigrationService, MigrationStats, PatternData };
