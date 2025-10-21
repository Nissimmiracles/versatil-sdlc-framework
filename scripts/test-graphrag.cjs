#!/usr/bin/env node
/**
 * Test GraphRAG Knowledge Graph Queries
 *
 * Tests semantic search using graph traversal instead of vector embeddings
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testGraphRAG() {
  console.log(`\n${colors.bright}${colors.blue}🕸️  Testing GraphRAG Knowledge Graph${colors.reset}\n`);

  // Load GraphRAG store
  let graphRAGStore;
  try {
    const module = await import('../dist/lib/graphrag-store.js');
    graphRAGStore = module.graphRAGStore;
    await graphRAGStore.initialize();
    console.log(`${colors.green}✓${colors.reset} GraphRAG Store initialized\n`);
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to load GraphRAG:`, error.message);
    process.exit(1);
  }

  // Show statistics
  try {
    const stats = await graphRAGStore.getStatistics();
    console.log(`${colors.cyan}📊 Knowledge Graph Statistics:${colors.reset}`);
    console.log(`   Total nodes: ${stats.totalNodes}`);
    console.log(`   Total edges: ${stats.totalEdges}`);
    console.log(`   Avg connections: ${stats.avgConnections.toFixed(1)}`);
    console.log(`   Patterns: ${stats.nodesByType.pattern}`);
    console.log(`   Agents: ${stats.nodesByType.agent}`);
    console.log(`   Technologies: ${stats.nodesByType.technology}`);
    console.log(`   Categories: ${stats.nodesByType.category}\n`);
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Failed to get statistics:`, error.message);
  }

  // Test queries
  const testQueries = [
    {
      query: 'testing and quality assurance',
      description: 'Test-related patterns'
    },
    {
      query: 'react components and UI',
      description: 'Frontend patterns',
      tags: ['frontend']
    },
    {
      query: 'API security and backend',
      description: 'Backend security patterns',
      agent: 'marcus-backend'
    },
    {
      query: 'database schema',
      description: 'Database patterns',
      category: 'backend'
    },
    {
      query: 'user stories and requirements',
      description: 'Requirements patterns',
      agent: 'alex-ba'
    }
  ];

  console.log(`${colors.bright}${colors.blue}🔍 Running Test Queries${colors.reset}\n`);

  for (const testQuery of testQueries) {
    console.log(`${colors.cyan}Query:${colors.reset} "${testQuery.query}"`);
    if (testQuery.agent) console.log(`  Agent filter: ${testQuery.agent}`);
    if (testQuery.category) console.log(`  Category filter: ${testQuery.category}`);
    if (testQuery.tags) console.log(`  Tags filter: ${testQuery.tags.join(', ')}`);

    try {
      const results = await graphRAGStore.query({
        query: testQuery.query,
        limit: 5,
        minRelevance: 0.3,
        agent: testQuery.agent,
        category: testQuery.category,
        tags: testQuery.tags
      });

      if (results.length === 0) {
        console.log(`  ${colors.yellow}⚠${colors.reset} No results found\n`);
        continue;
      }

      console.log(`  ${colors.green}✓${colors.reset} Found ${results.length} results:\n`);

      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.pattern.properties.pattern}`);
        console.log(`     Relevance: ${(result.relevanceScore * 100).toFixed(1)}%`);
        console.log(`     Agent: ${result.pattern.properties.agent}`);
        console.log(`     Category: ${result.pattern.properties.category}`);
        console.log(`     Effectiveness: ${(result.pattern.properties.effectiveness * 100).toFixed(0)}%`);
        console.log(`     ${colors.cyan}Path:${colors.reset} ${result.explanation}`);
        console.log();
      });
    } catch (error) {
      console.error(`  ${colors.red}✗${colors.reset} Query failed:`, error.message, '\n');
    }
  }

  await graphRAGStore.close();
  console.log(`${colors.green}✓${colors.reset} GraphRAG tests complete\n`);
}

testGraphRAG().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
