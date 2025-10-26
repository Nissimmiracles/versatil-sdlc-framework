#!/usr/bin/env tsx
/**
 * RAG Query Skill Script
 *
 * Executes RAG query and store operations using Enhanced Pattern Search.
 *
 * Usage:
 *   # Query memories
 *   npx tsx execute-rag-query.ts \
 *     --action query \
 *     --query "How to implement OAuth2?" \
 *     --limit 5 \
 *     --min-score 0.7
 *
 *   # Store memory
 *   npx tsx execute-rag-query.ts \
 *     --action store \
 *     --memory "Google OAuth requires CORS config" \
 *     --tags "auth,oauth,google,cors"
 */

import { enhancedPatternSearch } from '../../../src/rag/pattern-search-enhanced.js';
import { storeRouter } from '../../../src/rag/store-router.js';

interface CLIArgs {
  action: 'query' | 'store';
  query?: string;
  memory?: string;
  tags?: string;
  limit?: number;
  minScore?: number;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    action: 'query',
    limit: 5,
    minScore: 0.7
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--action' && args[i + 1]) {
      parsed.action = args[i + 1] as 'query' | 'store';
      i++;
    } else if (arg === '--query' && args[i + 1]) {
      parsed.query = args[i + 1];
      i++;
    } else if (arg === '--memory' && args[i + 1]) {
      parsed.memory = args[i + 1];
      i++;
    } else if (arg === '--tags' && args[i + 1]) {
      parsed.tags = args[i + 1];
      i++;
    } else if (arg === '--limit' && args[i + 1]) {
      parsed.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--min-score' && args[i + 1]) {
      parsed.minScore = parseFloat(args[i + 1]);
      i++;
    }
  }

  return parsed;
}

async function executeQuery(args: CLIArgs) {
  if (!args.query) {
    throw new Error('Missing required argument: --query');
  }

  const result = await enhancedPatternSearch.search({
    description: args.query,
    min_similarity: args.minScore || 0.7,
    limit: args.limit || 5
  });

  return {
    query: args.query,
    results: result.patterns.map(p => ({
      content: `${p.feature_name}: ${p.description || p.lessons_learned?.join('; ') || ''}`,
      score: p.similarity_score || 0,
      tags: p.tags || [],
      timestamp: p.created_at ? new Date(p.created_at).getTime() : Date.now()
    })),
    total_found: result.patterns_retrieved,
    search_method: result.search_method
  };
}

async function executeStore(args: CLIArgs) {
  if (!args.memory) {
    throw new Error('Missing required argument: --memory');
  }

  const tags = args.tags ? args.tags.split(',').map(t => t.trim()) : [];

  // Store pattern in local store for now
  // In future, this should write to GraphRAG/Vector stores
  storeRouter.addLocalPattern({
    feature_name: args.memory.substring(0, 50) + (args.memory.length > 50 ? '...' : ''),
    description: args.memory,
    effort_hours: 0, // Not applicable for lessons
    lessons_learned: [args.memory],
    code_examples: [],
    tags,
    created_at: new Date()
  });

  return {
    stored: true,
    memory: args.memory,
    tags
  };
}

async function main() {
  try {
    const args = parseArgs();

    let result;
    if (args.action === 'query') {
      result = await executeQuery(args);
    } else if (args.action === 'store') {
      result = await executeStore(args);
    } else {
      throw new Error(`Invalid action: ${args.action}. Use 'query' or 'store'`);
    }

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
      stored: false
    }, null, 2));
    process.exit(1);
  }
}

main();
