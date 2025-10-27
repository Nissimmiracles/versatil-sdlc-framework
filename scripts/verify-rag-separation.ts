#!/usr/bin/env node
/**
 * Verification Script: RAG Separation Integrity
 *
 * This script verifies:
 * 1. Zero private data in Public RAG
 * 2. Pattern classification accuracy (spot-check)
 * 3. RAG Router prioritization (private over public)
 * 4. Query performance and edge acceleration
 *
 * Usage:
 *   npm run verify:rag
 *   npm run verify:rag -- --verbose
 *   npm run verify:rag -- --strict
 */

import { PublicRAGStore } from '../src/rag/public-rag-store.js';
import { PrivateRAGStore } from '../src/rag/private-rag-store.js';
import { RAGRouter } from '../src/rag/rag-router.js';

interface VerificationResult {
  test: string;
  passed: boolean;
  details: string;
  severity: 'critical' | 'warning' | 'info';
}

interface VerificationReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: VerificationResult[];
}

class RAGSeparationVerifier {
  private publicRAG: PublicRAGStore;
  private privateRAG: PrivateRAGStore;
  private ragRouter: RAGRouter;
  private report: VerificationReport;

  // Private data indicators (CRITICAL if found in Public RAG)
  private readonly PRIVATE_INDICATORS = [
    'password', 'secret', 'api-key', 'token', 'credential',
    'proprietary', 'internal', 'company-specific', 'client-name',
    'confidential', 'prod-db', 'staging-url', 'env-var'
  ];

  constructor() {
    this.publicRAG = new PublicRAGStore();
    this.privateRAG = new PrivateRAGStore();
    this.ragRouter = new RAGRouter({
      preferPrivate: true,
      includePublic: true,
      deduplicateResults: true
    });
    this.report = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      results: []
    };
  }

  /**
   * Add test result to report
   */
  private addResult(result: VerificationResult): void {
    this.report.results.push(result);
    this.report.totalTests++;

    if (result.passed) {
      this.report.passed++;
    } else {
      this.report.failed++;
      if (result.severity === 'warning') {
        this.report.warnings++;
      }
    }
  }

  /**
   * Test 1: Verify zero private data in Public RAG
   */
  private async testPublicRAGPrivacy(): Promise<void> {
    console.log('🔍 Test 1: Checking Public RAG for private data...');

    try {
      // Sample 50 random patterns from Public RAG
      const sampleQueries = [
        'authentication', 'testing', 'react', 'api-design', 'performance',
        'security', 'typescript', 'database', 'frontend', 'backend'
      ];

      let privateDataFound = false;
      const violations: string[] = [];

      for (const query of sampleQueries) {
        const results = await this.publicRAG.query({
          query,
          limit: 5,
          minRelevance: 0.6
        });

        if (results && results.results) {
          for (const pattern of results.results) {
            const text = `${pattern.description} ${pattern.code || ''}`.toLowerCase();

            // Check for private indicators
            for (const indicator of this.PRIVATE_INDICATORS) {
              if (text.includes(indicator)) {
                privateDataFound = true;
                violations.push(`Pattern "${pattern.description.substring(0, 50)}..." contains "${indicator}"`);
              }
            }
          }
        }
      }

      this.addResult({
        test: 'Public RAG Privacy',
        passed: !privateDataFound,
        details: privateDataFound
          ? `CRITICAL: Found ${violations.length} privacy violations:\n${violations.slice(0, 5).join('\n')}`
          : 'No private data detected in Public RAG (sampled 50 patterns)',
        severity: 'critical'
      });

    } catch (error) {
      this.addResult({
        test: 'Public RAG Privacy',
        passed: false,
        details: `Error during privacy check: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical'
      });
    }
  }

  /**
   * Test 2: Verify pattern classification accuracy
   */
  private async testClassificationAccuracy(): Promise<void> {
    console.log('🔍 Test 2: Verifying pattern classification accuracy...');

    try {
      // Test known public patterns
      const publicTestCases = [
        'Implement JWT authentication with refresh tokens',
        'Create React component with TypeScript',
        'Write unit tests using Jest',
        'Design REST API with Express'
      ];

      let publicCorrect = 0;
      for (const testCase of publicTestCases) {
        const results = await this.publicRAG.query({
          query: testCase,
          limit: 1,
          minRelevance: 0.7
        });

        if (results && results.results && results.results.length > 0) {
          publicCorrect++;
        }
      }

      const publicAccuracy = (publicCorrect / publicTestCases.length) * 100;

      // Test known private patterns (should NOT be in Public RAG)
      const privateTestCases = [
        'acme-corp database credentials',
        'production API keys for client-xyz',
        'internal company authentication flow'
      ];

      let privateCorrect = 0;
      for (const testCase of privateTestCases) {
        const results = await this.publicRAG.query({
          query: testCase,
          limit: 1,
          minRelevance: 0.5
        });

        // Correct if NOT found in Public RAG
        if (!results || !results.results || results.results.length === 0) {
          privateCorrect++;
        }
      }

      const privateAccuracy = (privateCorrect / privateTestCases.length) * 100;
      const overallAccuracy = ((publicCorrect + privateCorrect) / (publicTestCases.length + privateTestCases.length)) * 100;

      this.addResult({
        test: 'Classification Accuracy',
        passed: overallAccuracy >= 85,
        details: `Public patterns: ${publicAccuracy.toFixed(1)}% accuracy\nPrivate patterns: ${privateAccuracy.toFixed(1)}% accuracy\nOverall: ${overallAccuracy.toFixed(1)}%`,
        severity: overallAccuracy >= 70 ? 'warning' : 'critical'
      });

    } catch (error) {
      this.addResult({
        test: 'Classification Accuracy',
        passed: false,
        details: `Error during classification test: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical'
      });
    }
  }

  /**
   * Test 3: Verify RAG Router prioritization
   */
  private async testRAGRouterPrioritization(): Promise<void> {
    console.log('🔍 Test 3: Testing RAG Router prioritization...');

    try {
      // Query that should exist in both Public and Private RAG
      const testQuery = 'authentication implementation';

      const results = await this.ragRouter.query({
        query: testQuery,
        limit: 10,
        minRelevance: 0.6
      });

      if (!results || results.length === 0) {
        this.addResult({
          test: 'RAG Router Prioritization',
          passed: false,
          details: 'No results returned from RAG Router',
          severity: 'critical'
        });
        return;
      }

      // Check if private patterns come first
      let privateFirst = true;
      let firstPublicIndex = -1;
      let lastPrivateIndex = -1;

      for (let i = 0; i < results.length; i++) {
        if (results[i].source === 'private') {
          lastPrivateIndex = i;
        } else if (results[i].source === 'public' && firstPublicIndex === -1) {
          firstPublicIndex = i;
        }
      }

      if (firstPublicIndex !== -1 && lastPrivateIndex > firstPublicIndex) {
        privateFirst = false;
      }

      this.addResult({
        test: 'RAG Router Prioritization',
        passed: privateFirst,
        details: privateFirst
          ? 'Private patterns correctly prioritized over public patterns'
          : `FAILED: Public patterns found before private patterns (first public: ${firstPublicIndex}, last private: ${lastPrivateIndex})`,
        severity: 'critical'
      });

    } catch (error) {
      this.addResult({
        test: 'RAG Router Prioritization',
        passed: false,
        details: `Error during prioritization test: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical'
      });
    }
  }

  /**
   * Test 4: Verify query performance
   */
  private async testQueryPerformance(): Promise<void> {
    console.log('🔍 Test 4: Measuring query performance...');

    try {
      const testQueries = [
        'authentication', 'testing', 'react component', 'api design', 'database optimization'
      ];

      const queryTimes: number[] = [];

      for (const query of testQueries) {
        const startTime = Date.now();

        await this.ragRouter.query({
          query,
          limit: 5,
          minRelevance: 0.6
        });

        const endTime = Date.now();
        queryTimes.push(endTime - startTime);
      }

      const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      const maxQueryTime = Math.max(...queryTimes);

      // Target: <200ms avg, <500ms max (local), or <100ms avg (Cloud Run)
      const targetAvg = process.env.GRAPHRAG_USE_EDGE === 'true' ? 100 : 200;
      const targetMax = process.env.GRAPHRAG_USE_EDGE === 'true' ? 300 : 500;

      const passed = avgQueryTime < targetAvg && maxQueryTime < targetMax;

      this.addResult({
        test: 'Query Performance',
        passed,
        details: `Average: ${avgQueryTime.toFixed(0)}ms (target: <${targetAvg}ms)\nMax: ${maxQueryTime.toFixed(0)}ms (target: <${targetMax}ms)\nMode: ${process.env.GRAPHRAG_USE_EDGE === 'true' ? 'Cloud Run' : 'Local'}`,
        severity: 'warning'
      });

    } catch (error) {
      this.addResult({
        test: 'Query Performance',
        passed: false,
        details: `Error during performance test: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'warning'
      });
    }
  }

  /**
   * Test 5: Verify deduplication
   */
  private async testDeduplication(): Promise<void> {
    console.log('🔍 Test 5: Testing result deduplication...');

    try {
      const testQuery = 'jwt authentication';

      const results = await this.ragRouter.query({
        query: testQuery,
        limit: 20,
        minRelevance: 0.5
      });

      if (!results || results.length === 0) {
        this.addResult({
          test: 'Deduplication',
          passed: true,
          details: 'No results to deduplicate',
          severity: 'info'
        });
        return;
      }

      // Check for duplicate descriptions
      const descriptions = new Set<string>();
      let duplicatesFound = 0;

      for (const result of results) {
        const desc = result.description.toLowerCase().trim();
        if (descriptions.has(desc)) {
          duplicatesFound++;
        } else {
          descriptions.add(desc);
        }
      }

      this.addResult({
        test: 'Deduplication',
        passed: duplicatesFound === 0,
        details: duplicatesFound > 0
          ? `Found ${duplicatesFound} duplicate results out of ${results.length} total`
          : `All ${results.length} results are unique`,
        severity: 'warning'
      });

    } catch (error) {
      this.addResult({
        test: 'Deduplication',
        passed: false,
        details: `Error during deduplication test: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'warning'
      });
    }
  }

  /**
   * Run all verification tests
   */
  async verify(options: { verbose?: boolean; strict?: boolean } = {}): Promise<VerificationReport> {
    const { verbose = false, strict = false } = options;

    console.log('\n🚀 Starting RAG Separation Verification');
    console.log(`Mode: ${strict ? 'STRICT' : 'STANDARD'}\n`);

    // Run all tests
    await this.testPublicRAGPrivacy();
    await this.testClassificationAccuracy();
    await this.testRAGRouterPrioritization();
    await this.testQueryPerformance();
    await this.testDeduplication();

    console.log('\n✅ Verification complete!\n');
    return this.report;
  }

  /**
   * Generate verification report
   */
  generateReport(verbose: boolean = false): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('     RAG SEPARATION VERIFICATION REPORT');
    lines.push('═══════════════════════════════════════════════════════\n');

    // Summary
    lines.push('📊 SUMMARY');
    lines.push('─────────────────────────────────────────────────────');
    lines.push(`Total Tests:       ${this.report.totalTests}`);
    lines.push(`Passed:            ${this.report.passed} (${((this.report.passed / this.report.totalTests) * 100).toFixed(1)}%)`);
    lines.push(`Failed:            ${this.report.failed}`);
    lines.push(`Warnings:          ${this.report.warnings}`);
    lines.push(`Timestamp:         ${this.report.timestamp}\n`);

    // Overall status
    const overallPassed = this.report.failed === 0;
    lines.push(`Overall Status:    ${overallPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test results
    lines.push('🔍 TEST RESULTS');
    lines.push('─────────────────────────────────────────────────────');

    for (const result of this.report.results) {
      const icon = result.passed ? '✅' : (result.severity === 'critical' ? '❌' : '⚠️');
      lines.push(`${icon} ${result.test}: ${result.passed ? 'PASSED' : 'FAILED'}`);

      if (verbose || !result.passed) {
        lines.push(`   ${result.details.split('\n').join('\n   ')}`);
      }
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const strict = args.includes('--strict');

  const verifier = new RAGSeparationVerifier();
  const report = await verifier.verify({ verbose, strict });

  // Display report
  console.log(verifier.generateReport(verbose));

  // Exit with appropriate code
  const success = report.failed === 0 || (!strict && report.warnings === report.failed);
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { RAGSeparationVerifier, VerificationReport, VerificationResult };
