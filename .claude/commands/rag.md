---
name: rag
description: Manage RAG storage, patterns, and privacy settings
tags: [rag, memory, patterns, storage, privacy]
---

# RAG Management Command

**Manage your Public and Private RAG stores** - view status, configure storage, migrate patterns, and verify privacy isolation.

---

## Quick Start

```bash
/rag status          # View RAG configuration and health
/rag configure       # Run Private RAG setup wizard
/rag migrate         # Migrate patterns to Public/Private stores
/rag verify          # Verify privacy separation
/rag query "auth"    # Test pattern search
/rag stats           # View detailed statistics
```

---

## Subcommands

### 1. `/rag status` - View Configuration

**Shows current RAG configuration and health status**

```markdown
# RAG Storage Status

## 🌍 Public RAG (Framework Patterns)
✅ **Status**: Connected
- **Backend**: Google Cloud Firestore
- **Project**: centering-vine-454613-b3
- **Database**: versatil-public-rag
- **Patterns stored**: 1,247 framework patterns
- **Edge acceleration**: ✅ Cloud Run (68ms avg query time)
- **Cache hit rate**: 87% (15min TTL)

**Recent patterns** (top 5):
1. 🌍 React component optimization (added 2 days ago)
2. 🌍 JWT authentication best practices (added 5 days ago)
3. 🌍 Database indexing strategies (added 1 week ago)
4. 🌍 Testing patterns with Jest (added 1 week ago)
5. 🌍 API rate limiting implementation (added 2 weeks ago)

---

## 🔒 Private RAG (Your Proprietary Patterns)
✅ **Status**: Connected
- **Backend**: Google Cloud Firestore
- **Project**: my-google-project-id
- **Database**: my-project-rag
- **Patterns stored**: 127 proprietary patterns
- **Privacy**: ✅ Verified (zero leaks to Public RAG)
- **Prioritization**: ✅ Private patterns ranked first in search results

**Recent patterns** (top 5):
1. 🔒 Company-specific auth workflow (added 1 day ago)
2. 🔒 Internal API integration patterns (added 3 days ago)
3. 🔒 Client dashboard customization (added 1 week ago)
4. 🔒 Proprietary data processing (added 2 weeks ago)
5. 🔒 Custom deployment pipeline (added 3 weeks ago)

**Privacy metrics**:
- Zero private data in Public RAG: ✅ Verified
- Pattern classification accuracy: 96%
- Private pattern priority: 100% (always ranked first)

---

## ⚠️ Private RAG Not Configured
❌ **Status**: Not configured
**Impact**:
- All patterns stored in Public RAG (shared framework storage)
- Cannot store proprietary company patterns privately
- Less accurate planning (generic patterns vs your context)

**Recommended action**:
```bash
npm run setup:private-rag  # Takes 2-3 minutes
```

**Benefits of Private RAG**:
- ✅ Store company-specific patterns privately (100% data privacy)
- ✅ 40% more accurate plans (your patterns prioritized)
- ✅ Zero data leaks (patterns never leave your storage)
- ✅ Free tier available (Firestore 1GB, Supabase 500MB, Local unlimited)
```

---

### 2. `/rag configure` - Setup Private RAG

**Runs interactive wizard to configure Private RAG storage**

Launches the Private RAG setup wizard:

```bash
npm run setup:private-rag
```

**Wizard steps**:
1. Choose storage backend (Firestore/Supabase/Local)
2. Enter credentials (project ID, service account, etc.)
3. Save configuration to `~/.versatil/.env`
4. Test connection
5. Verify pattern storage

**See**: [docs/guides/PRIVATE_RAG_SETUP.md](docs/guides/PRIVATE_RAG_SETUP.md) for full guide

---

### 3. `/rag migrate` - Migrate Patterns

**Migrate existing patterns to Public/Private RAG stores**

```bash
/rag migrate          # Dry-run (preview changes)
/rag migrate --force  # Execute migration
```

**What happens**:
1. Scans existing RAG store for all patterns
2. Classifies each pattern (public vs private)
3. Migrates patterns to appropriate stores:
   - **Public patterns** → Public RAG (framework best practices)
   - **Private patterns** → Private RAG (proprietary code)
4. Generates detailed migration report

**Classification logic**:
- **Private keywords**: password, secret, api-key, proprietary, internal, company, client
- **Public keywords**: react, vue, authentication, testing, best practice, optimization
- **Default**: Private (safety-first approach)

**Example output**:

```markdown
# Migration Report

## Summary
- Total patterns: 342
- Public patterns: 215 (63%)
- Private patterns: 127 (37%)
- Errors: 0

## Top Classifications

1. 🔒 "Company auth workflow" → Private (95% confidence)
   Reason: Contains private keywords: company, internal

2. 🌍 "React component patterns" → Public (90% confidence)
   Reason: Contains public keywords: react, best practice

3. 🔒 "Client API integration" → Private (85% confidence)
   Reason: Contains private keywords: client, proprietary

## Actions
✅ Migrated 215 patterns to Public RAG
✅ Migrated 127 patterns to Private RAG
✅ Backup created: ~/.versatil/backups/rag-migration-2025-10-27.json
```

**Rollback**:
If migration has issues, restore from backup:
```bash
/rag restore ~/.versatil/backups/rag-migration-2025-10-27.json
```

---

### 4. `/rag verify` - Verify Privacy Separation

**Run comprehensive verification tests to ensure zero data leaks**

```bash
/rag verify          # Standard verification
/rag verify --strict # Strict mode (fail on warnings)
```

**Tests performed**:

1. **Public RAG Privacy** (CRITICAL)
   - Scans 50 random Public RAG patterns
   - Checks for private data indicators (passwords, secrets, client names)
   - ✅ Pass: Zero private data found
   - ❌ Fail: Private data detected → Show violations

2. **Classification Accuracy**
   - Tests known public patterns (JWT, React, testing)
   - Tests known private patterns (company-specific, client code)
   - ✅ Pass: ≥85% accuracy
   - ⚠️ Warning: 70-84% accuracy
   - ❌ Fail: <70% accuracy

3. **RAG Router Prioritization**
   - Queries patterns that exist in both stores
   - Verifies private patterns ranked before public
   - ✅ Pass: Private patterns always first
   - ❌ Fail: Public patterns ranked higher

4. **Query Performance**
   - Measures average query time
   - Target: <200ms (local), <100ms (Cloud Run)
   - ✅ Pass: Within target
   - ⚠️ Warning: Exceeds target (still works)

5. **Deduplication**
   - Checks for duplicate patterns in results
   - ✅ Pass: All results unique
   - ⚠️ Warning: Duplicates found

**Example output**:

```markdown
# Verification Report

## Summary
- Total tests: 5
- Passed: 5 (100%)
- Failed: 0
- Warnings: 0

## Test Results

✅ Public RAG Privacy: PASSED
   No private data detected (sampled 50 patterns)

✅ Classification Accuracy: PASSED
   Public patterns: 95% accuracy
   Private patterns: 100% accuracy
   Overall: 97%

✅ RAG Router Prioritization: PASSED
   Private patterns correctly prioritized

✅ Query Performance: PASSED
   Average: 68ms (target: <100ms)
   Max: 142ms (target: <300ms)
   Mode: Cloud Run

✅ Deduplication: PASSED
   All 20 results unique

## Overall Status: ✅ PASSED

---

### Step 5: Validate Pattern Quality (MANDATORY)

**After displaying verification results, ALWAYS invoke Victor-Verifier for pattern quality assessment:**

```typescript
await Task({
  subagent_type: "Victor-Verifier",
  description: "Pattern quality validation",
  prompt: `
You are Victor-Verifier, the anti-hallucination and pattern quality validation agent. Your role is to ensure RAG patterns are accurate, useful, and not outdated.

## Your Task

Analyze patterns in Public and Private RAG stores for quality, accuracy, and usefulness.

## Context

RAG Configuration:
- Public RAG backend: [insert from /rag status]
- Private RAG backend: [insert from /rag status]
- Total patterns stored: [public count + private count]
- Recent query metrics: [avg response time, cache hit rate]

## Steps to Execute

### 1. Pattern Quality Scoring
Score patterns based on quality metrics (0-100):
- **Completeness** (0-100): Has description, code examples, file references
- **Freshness** (0-100): Recency score (newer = higher)
- **Usage** (0-100): How often pattern is retrieved in queries
- **Accuracy** (0-100): Based on success rate (if tracked)
- **Evidence** (0-100): Has concrete file:line references vs vague

### 2. Duplicate Detection
Identify near-duplicate patterns (≥80% similarity):
- Check both within same store (Public/Private)
- Check cross-store (Public vs Private - should be different)
- Recommend consolidation for duplicates
- Estimate token savings from deduplication

### 3. Outdated Pattern Detection
Detect patterns that may be obsolete:
- Patterns referencing removed files/functions
- Patterns using deprecated APIs or old versions
- Patterns contradicting current codebase
- Patterns older than 6 months with zero usage

### 4. Pattern Recommendation Accuracy
Verify pattern recommendations are useful:
- Sample 10 recent queries
- Check if retrieved patterns were relevant
- Score relevance (0-100%)
- Identify "always-retrieved-but-never-used" patterns (noise)

### 5. Missing Pattern Detection
Identify topics with insufficient patterns:
- Areas with < 3 patterns (thin coverage)
- Common query terms with zero results
- Suggest high-value patterns to create

## Expected Output

Return a TypeScript interface with quality analysis:

\`\`\`typescript
interface PatternQualityAnalysis {
  // Pattern quality scores
  quality_scores: {
    public_rag: {
      average_quality: number;  // 0-100
      total_patterns: number;
      high_quality_count: number;  // Score ≥ 80
      low_quality_count: number;  // Score < 50
      patterns_needing_improvement: Array<{
        pattern_id: string;
        title: string;
        quality_score: number;
        issues: string[];
        improvement_suggestions: string[];
      }>;
    };
    private_rag: {
      average_quality: number;
      total_patterns: number;
      high_quality_count: number;
      low_quality_count: number;
      patterns_needing_improvement: Array<{
        pattern_id: string;
        title: string;
        quality_score: number;
        issues: string[];
        improvement_suggestions: string[];
      }>;
    };
  };

  // Duplicates
  duplicates_detected: Array<{
    pattern_1_id: string;
    pattern_2_id: string;
    similarity: number;  // 0-100%
    store_1: 'public' | 'private';
    store_2: 'public' | 'private';
    recommendation: 'merge' | 'keep_both' | 'delete_one';
    token_savings_if_merged: number;
  }>;

  // Outdated patterns
  outdated_patterns: Array<{
    pattern_id: string;
    title: string;
    age_days: number;
    reason: 'references_removed_file' | 'deprecated_api' | 'contradicts_current' | 'zero_usage_6mo';
    evidence: string[];
    recommendation: 'update' | 'archive' | 'delete';
  }>;

  // Recommendation accuracy
  recommendation_accuracy: {
    queries_analyzed: number;
    average_relevance: number;  // 0-100%
    high_relevance_count: number;  // ≥80%
    low_relevance_count: number;  // <50%
    noise_patterns: Array<{
      pattern_id: string;
      title: string;
      retrieval_count: number;
      usage_rate: number;  // 0-100% (how often used after retrieval)
      recommendation: string;
    }>;
  };

  // Missing pattern opportunities
  missing_patterns: Array<{
    topic: string;
    query_count: number;  // How many times queried
    current_pattern_count: number;  // How many patterns exist
    priority: 'high' | 'medium' | 'low';
    suggested_patterns: string[];
  }>;

  // Overall assessment
  overall_assessment: {
    public_rag_health: number;  // 0-100
    private_rag_health: number;  // 0-100
    combined_health: number;  // 0-100
    critical_issues: number;
    high_issues: number;
    medium_issues: number;
    low_issues: number;
    actions_required: Array<{
      action: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      estimated_effort: string;
      impact: string;
    }>;
    safe_to_proceed: boolean;  // BLOCKING if critical issues
  };
}
\`\`\`

## Example Output

\`\`\`typescript
{
  quality_scores: {
    public_rag: {
      average_quality: 78,
      total_patterns: 1247,
      high_quality_count: 892,
      low_quality_count: 42,
      patterns_needing_improvement: [
        {
          pattern_id: "pub-789",
          title: "React component optimization",
          quality_score: 45,
          issues: [
            "No code examples (completeness: 20/100)",
            "Vague description, no file references (evidence: 30/100)"
          ],
          improvement_suggestions: [
            "Add concrete code examples",
            "Add file:line references to real components"
          ]
        }
      ]
    },
    private_rag: {
      average_quality: 85,
      total_patterns: 127,
      high_quality_count: 108,
      low_quality_count: 3,
      patterns_needing_improvement: [
        {
          pattern_id: "priv-42",
          title: "Internal API integration",
          quality_score: 48,
          issues: [
            "Pattern is 9 months old with zero usage (freshness: 10/100, usage: 0/100)"
          ],
          improvement_suggestions: [
            "Update to reflect current API version",
            "Archive if no longer relevant"
          ]
        }
      ]
    }
  },

  duplicates_detected: [
    {
      pattern_1_id: "pub-123",
      pattern_2_id: "pub-456",
      similarity: 87,
      store_1: "public",
      store_2: "public",
      recommendation: "merge",
      token_savings_if_merged: 342
    }
  ],

  outdated_patterns: [
    {
      pattern_id: "pub-234",
      title: "JWT auth with class-based components",
      age_days: 287,
      reason: "deprecated_api",
      evidence: [
        "References React class components (deprecated since v16.8)",
        "No usage in last 180 days"
      ],
      recommendation: "update"
    }
  ],

  recommendation_accuracy: {
    queries_analyzed: 10,
    average_relevance: 82,
    high_relevance_count: 7,
    low_relevance_count: 1,
    noise_patterns: [
      {
        pattern_id: "pub-567",
        title: "Generic testing patterns",
        retrieval_count: 87,
        usage_rate: 12,  // Only 12% used after retrieval
        recommendation: "Lower ranking or archive (retrieved often but rarely useful)"
      }
    ]
  },

  missing_patterns: [
    {
      topic: "GraphQL subscription patterns",
      query_count: 15,
      current_pattern_count: 1,
      priority: "high",
      suggested_patterns: [
        "GraphQL subscription with WebSockets",
        "GraphQL subscription error handling",
        "GraphQL subscription performance optimization"
      ]
    }
  ],

  overall_assessment: {
    public_rag_health: 78,
    private_rag_health: 85,
    combined_health: 80,
    critical_issues: 0,
    high_issues: 2,
    medium_issues: 5,
    low_issues: 8,
    actions_required: [
      {
        action: "Update 1 outdated pattern (pub-234: JWT auth)",
        priority: "high",
        estimated_effort: "10 minutes",
        impact: "Prevents outdated implementation patterns from being recommended"
      },
      {
        action: "Merge 1 duplicate pattern (pub-123, pub-456)",
        priority: "medium",
        estimated_effort: "5 minutes",
        impact: "Saves 342 tokens, reduces confusion"
      },
      {
        action: "Create 3 GraphQL subscription patterns",
        priority: "high",
        estimated_effort: "30 minutes",
        impact: "Fills high-demand gap (15 queries with thin coverage)"
      }
    ],
    safe_to_proceed: true
  }
}
\`\`\`

Return the complete pattern quality analysis.
`
});
```

**Process Victor-Verifier Results**:

```typescript
// Display quality scores
console.log("\n📊 PATTERN QUALITY ANALYSIS");
console.log(`\nPublic RAG Health: ${analysis.overall_assessment.public_rag_health}/100`);
console.log(`  Average quality: ${analysis.quality_scores.public_rag.average_quality}/100`);
console.log(`  High-quality patterns: ${analysis.quality_scores.public_rag.high_quality_count}/${analysis.quality_scores.public_rag.total_patterns}`);

console.log(`\nPrivate RAG Health: ${analysis.overall_assessment.private_rag_health}/100`);
console.log(`  Average quality: ${analysis.quality_scores.private_rag.average_quality}/100`);
console.log(`  High-quality patterns: ${analysis.quality_scores.private_rag.high_quality_count}/${analysis.quality_scores.private_rag.total_patterns}`);

console.log(`\nOverall RAG Health: ${analysis.overall_assessment.combined_health}/100`);

// Show critical issues
if (analysis.overall_assessment.critical_issues > 0 ||
    analysis.overall_assessment.high_issues > 0) {
  console.log("\n⚠️ ISSUES DETECTED");
  console.log(`Critical: ${analysis.overall_assessment.critical_issues}`);
  console.log(`High: ${analysis.overall_assessment.high_issues}`);
  console.log(`Medium: ${analysis.overall_assessment.medium_issues}`);
  console.log(`Low: ${analysis.overall_assessment.low_issues}`);
}

// Show duplicates
if (analysis.duplicates_detected.length > 0) {
  console.log(`\n🔄 ${analysis.duplicates_detected.length} duplicate patterns detected`);
  const total_savings = analysis.duplicates_detected.reduce(
    (sum, dup) => sum + dup.token_savings_if_merged, 0
  );
  console.log(`Potential token savings: ${total_savings} tokens`);
}

// Show outdated patterns
if (analysis.outdated_patterns.length > 0) {
  console.log(`\n📅 ${analysis.outdated_patterns.length} outdated patterns detected`);
  analysis.outdated_patterns.forEach(pattern => {
    console.log(`  - ${pattern.title} (${pattern.age_days} days old) → ${pattern.recommendation}`);
  });
}

// Show missing patterns
if (analysis.missing_patterns.length > 0) {
  console.log(`\n🔍 ${analysis.missing_patterns.length} pattern gaps detected`);
  analysis.missing_patterns
    .filter(gap => gap.priority === 'high')
    .forEach(gap => {
      console.log(`  - ${gap.topic} (${gap.query_count} queries, ${gap.current_pattern_count} patterns)`);
    });
}

// Show action plan
if (analysis.overall_assessment.actions_required.length > 0) {
  console.log("\n🔧 RECOMMENDED ACTIONS");
  analysis.overall_assessment.actions_required
    .filter(action => action.priority === 'critical' || action.priority === 'high')
    .forEach((action, index) => {
      console.log(`\n${index + 1}. [${action.priority.toUpperCase()}] ${action.action}`);
      console.log(`   Effort: ${action.estimated_effort}`);
      console.log(`   Impact: ${action.impact}`);
    });
}

// Safe to proceed check
if (!analysis.overall_assessment.safe_to_proceed) {
  console.error("\n❌ CRITICAL ISSUES DETECTED - Address critical issues before continuing");
}
```

Your RAG separation is secure and functioning correctly.
```

---

### 5. `/rag query` - Test Pattern Search

**Test RAG search with a query to see results from both stores**

```bash
/rag query "authentication"
/rag query --public-only "react patterns"
/rag query --private-only "company auth"
```

**Example output**:

```markdown
# RAG Query Results: "authentication"

## Pattern Sources
- 🔒 Private patterns: 3 (your proprietary learnings)
- 🌍 Public patterns: 7 (framework best practices)

## Top Matches (10 total)

1. 🔒 "Company SSO auth workflow" (92% similar)
   - Source: Private RAG
   - Effort: 12h
   - Success: 95%
   - Added: 3 days ago

2. 🔒 "Client OAuth2 integration" (88% similar)
   - Source: Private RAG
   - Effort: 8h
   - Success: 98%
   - Added: 1 week ago

3. 🔒 "Internal API authentication" (85% similar)
   - Source: Private RAG
   - Effort: 6h
   - Success: 90%
   - Added: 2 weeks ago

4. 🌍 "JWT authentication with refresh tokens" (84% similar)
   - Source: Public RAG
   - Effort: 10h
   - Success: 93%
   - Added: 1 month ago

5. 🌍 "OAuth2 flow implementation" (82% similar)
   - Source: Public RAG
   - Effort: 12h
   - Success: 95%
   - Added: 2 months ago

...

## Query Performance
- Search time: 68ms
- Method: graphrag (Cloud Run)
- Cache: HIT (15min TTL)
```

**Flags**:
- `--public-only`: Search Public RAG only
- `--private-only`: Search Private RAG only
- `--min-similarity=N`: Minimum similarity score (default: 0.75)
- `--limit=N`: Max results (default: 10)

---

### 6. `/rag stats` - Detailed Statistics

**View comprehensive RAG usage statistics and analytics**

```markdown
# RAG Statistics

## Storage Breakdown

### Public RAG
- Total patterns: 1,247
- Categories:
  - Authentication: 142 patterns (11%)
  - Testing: 218 patterns (17%)
  - React/Frontend: 312 patterns (25%)
  - API Design: 187 patterns (15%)
  - Database: 156 patterns (13%)
  - Other: 232 patterns (19%)
- Total storage: 24.3 MB
- Average pattern size: 19.5 KB

### Private RAG
- Total patterns: 127
- Categories:
  - Company-specific: 48 patterns (38%)
  - Client work: 32 patterns (25%)
  - Internal tools: 27 patterns (21%)
  - Proprietary APIs: 20 patterns (16%)
- Total storage: 3.1 MB
- Average pattern size: 24.4 KB

## Query Analytics (Last 30 Days)

### Performance
- Total queries: 1,342
- Average query time: 72ms
- Cache hit rate: 87%
- Edge acceleration: Cloud Run

### Sources
- Private-only queries: 412 (31%)
- Public-only queries: 523 (39%)
- Mixed queries: 407 (30%)

### Top Queries
1. "authentication" - 127 queries
2. "testing patterns" - 98 queries
3. "react component" - 84 queries
4. "api design" - 67 queries
5. "database optimization" - 53 queries

## Pattern Quality

### Classification Accuracy
- Public patterns: 96% (verified via sampling)
- Private patterns: 98% (verified via sampling)
- Overall accuracy: 97%

### Privacy Compliance
- Last verification: 2 hours ago
- Status: ✅ Passed (zero leaks)
- Next verification: Automatic (every 24h)

## Growth Trends

### Public RAG
- Patterns added (last 30 days): 47
- Growth rate: 3.9% monthly
- Top contributors: Framework updates, community patterns

### Private RAG
- Patterns added (last 30 days): 12
- Growth rate: 10.4% monthly
- Top sources: /learn command (8), manual additions (4)

## Recommendations

💡 **Pattern Cleanup**: 23 patterns older than 1 year with <5% usage
   Run: `/rag cleanup --dry-run` to review

✅ **Good Pattern Coverage**: Authentication, testing, and frontend well-covered

⚠️ **Low Coverage**: DevOps patterns (only 8 patterns)
   Consider adding deployment, CI/CD, and infrastructure patterns
```

---

## Advanced Options

### `/rag backup` - Backup RAG Data

```bash
/rag backup          # Backup both Public and Private RAG
/rag backup --private-only
/rag backup --public-only
```

Creates timestamped backup at `~/.versatil/backups/rag-backup-YYYY-MM-DD.json`

---

### `/rag restore` - Restore from Backup

```bash
/rag restore ~/.versatil/backups/rag-backup-2025-10-27.json
```

---

### `/rag cleanup` - Remove Stale Patterns

```bash
/rag cleanup --dry-run     # Preview changes
/rag cleanup --force       # Execute cleanup
```

**Cleanup criteria**:
- Patterns older than 1 year with <5% usage
- Duplicate patterns (exact matches)
- Invalid patterns (missing required fields)

---

## Related Commands

- `/plan` - Uses RAG for pattern search during planning
- `/learn` - Stores patterns in RAG after completion
- `/monitor` - Shows RAG health in dashboard
- `/setup` - Shows RAG configuration status

---

## Documentation

- **Private RAG Setup**: [docs/guides/PRIVATE_RAG_SETUP.md](docs/guides/PRIVATE_RAG_SETUP.md)
- **Migration Guide**: [scripts/migrate-to-public-private.ts](scripts/migrate-to-public-private.ts)
- **Verification Tests**: [scripts/verify-rag-separation.ts](scripts/verify-rag-separation.ts)
- **Architecture**: [CLAUDE.md](CLAUDE.md#public-private-rag-architecture)

---

**Version**: 7.7.0+
**Status**: ✅ Production Ready
**Implementation**: Chat-based (no VSCode extension required)
