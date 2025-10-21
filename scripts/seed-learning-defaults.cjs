#!/usr/bin/env node
/**
 * Learning System Default Patterns Seeding Script
 *
 * Seeds universal learnings and effectiveness patterns for VERSATIL's
 * Compounding Engineering system. These patterns provide baseline knowledge
 * for new users about what works (and what doesn't).
 *
 * Usage:
 *   node scripts/seed-learning-defaults.cjs           # Seed all defaults
 *   node scripts/seed-learning-defaults.cjs --dry-run # Preview without storing
 *   node scripts/seed-learning-defaults.cjs --silent  # Silent mode (for postinstall)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

/**
 * Default learning patterns categorized by type
 */
const DEFAULT_LEARNINGS = {
  // Testing effectiveness patterns
  testing: [
    {
      pattern: 'React Testing Library over Enzyme',
      effectiveness: 0.92,
      timeSaved: 45, // minutes per feature
      category: 'testing',
      agent: 'maria-qa',
      evidence: 'Better accessibility testing, easier to write, less brittle',
      antiPattern: 'Enzyme shallow rendering',
      recommendation: 'Always use RTL with accessible queries (getByRole)',
    },
    {
      pattern: 'AAA test structure (Arrange-Act-Assert)',
      effectiveness: 0.88,
      timeSaved: 30,
      category: 'testing',
      agent: 'maria-qa',
      evidence: 'Clear test intent, easier to debug, consistent structure',
      antiPattern: 'Mixed setup, action, and assertion code',
      recommendation: 'Comment each section if not obvious',
    },
    {
      pattern: '80%+ test coverage for business logic',
      effectiveness: 0.95,
      timeSaved: 120, // time saved by catching bugs early
      category: 'testing',
      agent: 'maria-qa',
      evidence: 'Catches 89% of bugs before production',
      antiPattern: 'Testing only happy paths',
      recommendation: 'Focus on edge cases and error paths',
    },
  ],

  // Frontend development patterns
  frontend: [
    {
      pattern: 'WCAG 2.1 AA compliance from start',
      effectiveness: 0.90,
      timeSaved: 60, // vs retrofitting accessibility
      category: 'accessibility',
      agent: 'james-frontend',
      evidence: 'Retrofitting accessibility costs 3x more time',
      antiPattern: 'Adding accessibility as afterthought',
      recommendation: 'Use semantic HTML, ARIA labels, keyboard navigation',
    },
    {
      pattern: 'Mobile-first responsive design',
      effectiveness: 0.87,
      timeSaved: 40,
      category: 'ui',
      agent: 'james-frontend',
      evidence: 'Easier to scale up than scale down',
      antiPattern: 'Desktop-first then squishing for mobile',
      recommendation: 'Start with 320px breakpoint, add complexity at larger sizes',
    },
    {
      pattern: 'React.memo for expensive components',
      effectiveness: 0.85,
      timeSaved: 50,
      category: 'performance',
      agent: 'james-frontend',
      evidence: 'Prevents unnecessary re-renders, improves performance',
      antiPattern: 'Memoizing everything (overhead)',
      recommendation: 'Profile first, memoize components with expensive renders',
    },
  ],

  // Backend API patterns
  backend: [
    {
      pattern: 'Rate limiting on all public APIs',
      effectiveness: 0.98,
      timeSaved: 180, // prevents DDoS, reduces incident response
      category: 'security',
      agent: 'marcus-backend',
      evidence: 'Prevents 95%+ of abuse attempts',
      antiPattern: 'No rate limiting (open to abuse)',
      recommendation: '100 requests per 15 min window for authenticated, 20 for anon',
    },
    {
      pattern: 'Input validation with express-validator',
      effectiveness: 0.93,
      timeSaved: 90,
      category: 'security',
      agent: 'marcus-backend',
      evidence: 'Catches injection attacks, malformed data',
      antiPattern: 'Trusting client input',
      recommendation: 'Validate type, format, length, sanitize all inputs',
    },
    {
      pattern: 'API response time < 200ms (p95)',
      effectiveness: 0.89,
      timeSaved: 70,
      category: 'performance',
      agent: 'marcus-backend',
      evidence: 'User perception: <200ms feels instant',
      antiPattern: 'Slow queries, N+1 problems',
      recommendation: 'Use database indexes, connection pooling, caching',
    },
  ],

  // Database patterns
  database: [
    {
      pattern: 'Row Level Security (RLS) on all user tables',
      effectiveness: 0.96,
      timeSaved: 150,
      category: 'security',
      agent: 'dana-database',
      evidence: 'Prevents unauthorized data access at database level',
      antiPattern: 'Application-level security only',
      recommendation: 'Use auth.uid() in RLS policies, test with different users',
    },
    {
      pattern: 'Database migrations over direct schema changes',
      effectiveness: 0.94,
      timeSaved: 100,
      category: 'schema',
      agent: 'dana-database',
      evidence: 'Reproducible, trackable, rollback-able',
      antiPattern: 'Manual ALTER TABLE in production',
      recommendation: 'Version migrations (YYYYMMDD_description.sql), test rollback',
    },
    {
      pattern: 'Indexes on foreign keys and query columns',
      effectiveness: 0.91,
      timeSaved: 80,
      category: 'performance',
      agent: 'dana-database',
      evidence: '10-100x query speedup for large tables',
      antiPattern: 'Full table scans',
      recommendation: 'EXPLAIN ANALYZE queries, index columns in WHERE/JOIN',
    },
  ],

  // Requirements analysis patterns
  requirements: [
    {
      pattern: 'Gherkin syntax for acceptance criteria',
      effectiveness: 0.86,
      timeSaved: 50,
      category: 'requirements',
      agent: 'alex-ba',
      evidence: 'Reduces ambiguity, directly maps to tests',
      antiPattern: 'Vague requirements ("should work well")',
      recommendation: 'Given-When-Then format, specific measurable outcomes',
    },
    {
      pattern: 'User stories over technical specs',
      effectiveness: 0.84,
      timeSaved: 40,
      category: 'requirements',
      agent: 'alex-ba',
      evidence: 'Focuses on user value, easier to prioritize',
      antiPattern: 'Implementation-focused specs',
      recommendation: 'As a [role] I want [feature] so that [benefit]',
    },
  ],

  // Project management patterns
  management: [
    {
      pattern: '2-week sprints with clear goals',
      effectiveness: 0.83,
      timeSaved: 60,
      category: 'planning',
      agent: 'sarah-pm',
      evidence: 'Balances planning overhead vs flexibility',
      antiPattern: 'No sprints (continuous chaos) or 1-month sprints (too long)',
      recommendation: 'Sprint goal in 1-2 sentences, trackable deliverables',
    },
    {
      pattern: 'Daily standups < 15 minutes',
      effectiveness: 0.80,
      timeSaved: 30,
      category: 'coordination',
      agent: 'sarah-pm',
      evidence: 'Keeps team aligned without wasting time',
      antiPattern: 'Hour-long status meetings',
      recommendation: 'Yesterday, today, blockers. Discussions happen offline.',
    },
  ],

  // AI/ML patterns
  ai: [
    {
      pattern: 'RAG over fine-tuning for knowledge retrieval',
      effectiveness: 0.92,
      timeSaved: 200,
      category: 'ai',
      agent: 'dr-ai-ml',
      evidence: 'Faster iteration, easier to update, cheaper',
      antiPattern: 'Fine-tuning for every knowledge update',
      recommendation: 'Use embeddings, vector DB, retrieve top-k, inject into prompt',
    },
    {
      pattern: 'Chunk size 500-1500 tokens for RAG',
      effectiveness: 0.88,
      timeSaved: 40,
      category: 'ai',
      agent: 'dr-ai-ml',
      evidence: 'Balances context vs precision',
      antiPattern: 'Too small (lacks context) or too large (loses precision)',
      recommendation: '1000 tokens with 200 overlap works for most docs',
    },
  ],

  // General development patterns
  general: [
    {
      pattern: 'Conventional Commits (feat, fix, docs, etc.)',
      effectiveness: 0.82,
      timeSaved: 25,
      category: 'git',
      agent: 'general',
      evidence: 'Enables automated changelogs, semantic versioning',
      antiPattern: 'Random commit messages',
      recommendation: 'type(scope): subject, present tense, imperative mood',
    },
    {
      pattern: 'Environment variables for secrets',
      effectiveness: 0.99,
      timeSaved: 300, // prevents security breaches
      category: 'security',
      agent: 'general',
      evidence: 'Prevents accidental exposure in version control',
      antiPattern: 'Hardcoded secrets in code',
      recommendation: '.env in .gitignore, .env.example for templates',
    },
    {
      pattern: 'Code reviews before merge',
      effectiveness: 0.87,
      timeSaved: 90,
      category: 'quality',
      agent: 'general',
      evidence: 'Catches bugs, shares knowledge, improves code quality',
      antiPattern: 'Pushing directly to main',
      recommendation: 'At least one approval, focus on logic and security',
    },
  ],
};

/**
 * Generate unique ID for learning pattern
 */
function generatePatternId(pattern) {
  const content = JSON.stringify(pattern);
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Store learning pattern to local filesystem
 */
function storePatternLocally(pattern, category, dryRun = false) {
  const learningDir = path.join(process.env.HOME, '.versatil', 'learning', 'patterns');

  if (!fs.existsSync(learningDir)) {
    fs.mkdirSync(learningDir, { recursive: true });
  }

  const patternId = generatePatternId(pattern);
  const filePath = path.join(learningDir, `${patternId}.json`);

  const learningRecord = {
    id: patternId,
    ...pattern,
    category,
    source: 'defaults',
    createdAt: new Date().toISOString(),
  };

  if (!dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(learningRecord, null, 2));
  }

  return { id: patternId, path: filePath };
}

/**
 * Create search index for learnings
 */
function createSearchIndex(patterns, dryRun = false) {
  const indexDir = path.join(process.env.HOME, '.versatil', 'learning', 'indexes');

  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }

  const index = {
    patterns: patterns.map(p => ({
      id: p.id,
      pattern: p.pattern,
      category: p.category,
      agent: p.agent,
      effectiveness: p.effectiveness,
      timeSaved: p.timeSaved,
    })),
    byCategory: {},
    byAgent: {},
    byEffectiveness: {},
    updatedAt: new Date().toISOString(),
  };

  // Group by category
  patterns.forEach(p => {
    if (!index.byCategory[p.category]) {
      index.byCategory[p.category] = [];
    }
    index.byCategory[p.category].push(p.id);
  });

  // Group by agent
  patterns.forEach(p => {
    if (!index.byAgent[p.agent]) {
      index.byAgent[p.agent] = [];
    }
    index.byAgent[p.agent].push(p.id);
  });

  // Group by effectiveness (high > 0.9, medium 0.8-0.9, low < 0.8)
  patterns.forEach(p => {
    const level = p.effectiveness >= 0.9 ? 'high' : p.effectiveness >= 0.8 ? 'medium' : 'low';
    if (!index.byEffectiveness[level]) {
      index.byEffectiveness[level] = [];
    }
    index.byEffectiveness[level].push(p.id);
  });

  if (!dryRun) {
    fs.writeFileSync(
      path.join(indexDir, 'search.json'),
      JSON.stringify(index, null, 2)
    );
  }

  return index;
}

/**
 * Main seeding function
 */
async function seedLearningDefaults() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const silent = args.includes('--silent');

  if (!silent) {
    log.title('🌱 Seeding Default Learning Patterns');
  }

  if (dryRun && !silent) {
    log.warn('DRY RUN MODE - Patterns will not be stored');
  }

  // Flatten all learning patterns
  const allPatterns = [];
  for (const [category, patterns] of Object.entries(DEFAULT_LEARNINGS)) {
    for (const pattern of patterns) {
      allPatterns.push({ ...pattern, category });
    }
  }

  if (!silent) {
    log.info(`Preparing ${allPatterns.length} default learning patterns...`);
  }

  // Store patterns
  const storedPatterns = [];
  let success = 0;
  let failed = 0;

  for (const pattern of allPatterns) {
    try {
      const result = storePatternLocally(pattern, pattern.category, dryRun);
      storedPatterns.push({ ...pattern, id: result.id });
      success++;
    } catch (error) {
      if (!silent) {
        log.warn(`Failed to store pattern "${pattern.pattern}": ${error.message}`);
      }
      failed++;
    }
  }

  if (!silent) {
    log.success(`Stored ${success} patterns to ~/.versatil/learning/patterns/`);
  }

  // Create search index
  try {
    const index = createSearchIndex(storedPatterns, dryRun);
    if (!silent) {
      log.success('Created search index');
      log.info('Pattern breakdown by category:');
      for (const [category, ids] of Object.entries(index.byCategory)) {
        console.log(`  ${category.padEnd(20)} : ${ids.length} patterns`);
      }
    }
  } catch (error) {
    if (!silent) {
      log.warn(`Failed to create index: ${error.message}`);
    }
  }

  // Summary
  if (!silent) {
    log.title('✅ Learning Defaults Seeded');
    log.success(`${success} patterns stored successfully`);
    if (failed > 0) {
      log.warn(`${failed} patterns failed to store`);
    }

    log.info('\nNext steps:');
    console.log('  • Verify patterns: npm run learning:test');
    console.log('  • Use VERSATIL normally (learning accumulates automatically)');
    console.log('  • Monitor growth: ls ~/.versatil/learning/patterns/ | wc -l');
  }
}

// Run
seedLearningDefaults().catch(error => {
  log.error('Seeding failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
