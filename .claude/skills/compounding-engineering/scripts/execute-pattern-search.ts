#!/usr/bin/env tsx
/**
 * Pattern Search Service - Bash Executable Wrapper (Enhanced with Store Router)
 *
 * Wraps EnhancedPatternSearch with Store Router integration.
 * Returns real JSON data from GraphRAG/Vector stores with anti-hallucination validation.
 *
 * Features:
 * - Intelligent store routing (GraphRAG → Vector → Local)
 * - Anti-hallucination validation (5 quality gates)
 * - Quality scoring (0-100) and verification status
 * - Statistics (average effort, confidence intervals, consolidated lessons)
 *
 * Usage:
 *   npx tsx execute-pattern-search.ts \
 *     --description "Add user auth" \
 *     --category "auth" \
 *     --min-similarity 0.75
 */

import { enhancedPatternSearch } from '../../../../src/rag/pattern-search-enhanced.js';

interface CLIArgs {
  description: string;
  category?: string;
  minSimilarity?: number;
  limit?: number;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    description: '',
    minSimilarity: 0.75,
    limit: 5
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--description' && args[i + 1]) {
      parsed.description = args[i + 1];
      i++;
    } else if (arg === '--category' && args[i + 1]) {
      parsed.category = args[i + 1];
      i++;
    } else if (arg === '--min-similarity' && args[i + 1]) {
      parsed.minSimilarity = parseFloat(args[i + 1]);
      i++;
    } else if (arg === '--limit' && args[i + 1]) {
      parsed.limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return parsed;
}

async function main() {
  try {
    const args = parseArgs();

    if (!args.description) {
      console.error(JSON.stringify({
        error: 'Missing required argument: --description'
      }, null, 2));
      process.exit(1);
    }

    // Execute enhanced pattern search with Store Router
    const searchResult = await enhancedPatternSearch.search({
      description: args.description,
      min_similarity: args.minSimilarity || 0.75,
      limit: args.limit || 5
    });

    // Format output with Store Router metadata
    const result = {
      query: args.description,
      category: args.category || 'auto-detect',
      patterns: searchResult.patterns.map(p => ({
        feature_name: p.feature_name,
        similarity_score: p.similarity_score || 0,
        effort_hours: p.effort_hours,
        lessons_learned: p.lessons_learned,
        code_examples: p.code_examples,
        tags: p.tags || []
      })),
      total_found: searchResult.patterns_retrieved,
      search_method: searchResult.search_method,
      quality_score: searchResult.quality_score,
      verification_status: searchResult.verification_status,
      avg_effort: searchResult.average_effort || null,
      avg_confidence: searchResult.confidence_interval
        ? Math.round(searchResult.confidence_interval.confidence * 100)
        : null,
      confidence_interval: searchResult.confidence_interval,
      consolidated_lessons: searchResult.consolidated_lessons || [],
      recommended_approach: searchResult.patterns_retrieved > 0
        ? `Use historical patterns as reference (${searchResult.quality_score}/100 quality, ${searchResult.verification_status})`
        : 'No historical data - proceed with template-based planning',
      issues: searchResult.issues || []
    };

    // Output JSON to stdout (Claude will capture this)
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      patterns: [],
      total_found: 0,
      search_method: 'error',
      avg_effort: null,
      avg_confidence: null,
      consolidated_lessons: [],
      recommended_approach: 'Proceed with template-based planning due to search error'
    }, null, 2));
    process.exit(1);
  }
}

main();
