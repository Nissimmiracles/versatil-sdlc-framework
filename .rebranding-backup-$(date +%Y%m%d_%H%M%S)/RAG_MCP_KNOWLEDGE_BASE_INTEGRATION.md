# RAG MCP Knowledge Base Integration

## Overview

This document describes the integration of external knowledge bases into the VERSATIL SDLC Framework's RAG system through Model Context Protocol (MCP) servers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERSATIL RAG System                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Enhanced Vector Memory Store                      │  │
│  │  - Code patterns                                          │  │
│  │  - Team-specific winning patterns                         │  │
│  │  - Historical decisions                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         MCP Knowledge Base Orchestrator                   │  │
│  │  - Query routing                                          │  │
│  │  - Response caching (LRU)                                 │  │
│  │  - Multi-source aggregation                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                     │
│  ┌────────────────────┬─────────────────┬──────────────────┐  │
│  │   GitHub MCP       │  JIRA MCP      │  StackOverflow   │  │
│  │   - Issues         │  - Tickets     │  - Q&A          │  │
│  │   - PRs            │  - Stories     │  - Best answers  │  │
│  │   - Discussions    │  - Bugs        │  - Tags         │  │
│  └────────────────────┴─────────────────┴──────────────────┘  │
│  ┌────────────────────┬─────────────────┬──────────────────┐  │
│  │   GitLab MCP       │  Reddit MCP    │  Confluence MCP  │  │
│  │   - MRs            │  - r/coding    │  - Docs         │  │
│  │   - Issues         │  - r/devops    │  - Best practices│ │
│  │   - Wiki           │  - r/ai        │  - Decisions     │  │
│  └────────────────────┴─────────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Supported Knowledge Bases

### 1. GitHub MCP
- **Access**: Issues, Pull Requests, Discussions, Code Search
- **Use Cases**:
  - Finding similar bugs/issues in project history
  - Discovering code patterns from other projects
  - Learning from community discussions
- **Configuration**: `.cursor/mcp_config.json` → `github` server

### 2. JIRA MCP
- **Access**: Tickets, Stories, Bugs, Epics
- **Use Cases**:
  - Understanding business requirements context
  - Tracking bug patterns over time
  - Linking code changes to business outcomes
- **Configuration**: Custom MCP server (needs JIRA API credentials)

### 3. StackOverflow MCP
- **Access**: Questions, Answers, Tags, User Expertise
- **Use Cases**:
  - Finding solutions to common coding problems
  - Learning industry best practices
  - Discovering framework-specific patterns
- **Configuration**: Custom MCP server (StackOverflow API)

### 4. Reddit MCP
- **Access**: r/coding, r/devops, r/ai, r/programming subreddits
- **Use Cases**:
  - Learning emerging trends
  - Finding real-world experiences
  - Discovering tool comparisons
- **Configuration**: Custom MCP server (Reddit API)

### 5. GitLab MCP
- **Access**: Merge Requests, Issues, Wiki, CI/CD
- **Use Cases**:
  - Similar to GitHub MCP for GitLab users
  - CI/CD pipeline patterns
  - DevOps best practices
- **Configuration**: Custom MCP server (GitLab API)

### 6. Confluence MCP
- **Access**: Documentation, Decision Logs, Best Practices
- **Use Cases**:
  - Company-specific knowledge base
  - Architecture decision records (ADRs)
  - Team processes and standards
- **Configuration**: Custom MCP server (Confluence API)

## Implementation Plan

### Phase 1: Core MCP Knowledge Base Orchestrator (8 hours)

Create `src/rag/mcp-knowledge-base-orchestrator.ts`:

```typescript
export class MCPKnowledgeBaseOrchestrator {
  private mcpServers: Map<string, MCPServer> = new Map();
  private cache: LRUCache<string, KBQueryResult>;

  constructor() {
    this.initializeMCPServers();
    this.cache = new LRUCache(100, 3600000); // 100 items, 1 hour TTL
  }

  /**
   * Query multiple knowledge bases simultaneously
   */
  async queryKnowledgeBases(
    query: string,
    sources: KBSource[] = ['github', 'stackoverflow', 'reddit'],
    options: KBQueryOptions = {}
  ): Promise<KBQueryResult> {
    const cacheKey = `${query}:${sources.join(',')}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Query all sources in parallel
    const results = await Promise.all(
      sources.map(source => this.querySource(source, query, options))
    );

    // Aggregate and rank results
    const aggregated = this.aggregateResults(results);

    // Cache result
    this.cache.set(cacheKey, aggregated);

    return aggregated;
  }

  /**
   * Query specific knowledge base source
   */
  private async querySource(
    source: KBSource,
    query: string,
    options: KBQueryOptions
  ): Promise<SourceResult> {
    const server = this.mcpServers.get(source);
    if (!server) {
      console.warn(`MCP server for ${source} not configured`);
      return { source, items: [], confidence: 0 };
    }

    try {
      const result = await server.query(query, options);
      return {
        source,
        items: result.items,
        confidence: result.confidence || 0.8
      };
    } catch (error) {
      console.error(`Failed to query ${source}:`, error.message);
      return { source, items: [], confidence: 0 };
    }
  }

  /**
   * Aggregate results from multiple sources
   */
  private aggregateResults(results: SourceResult[]): KBQueryResult {
    const allItems: KBItem[] = [];

    for (const result of results) {
      for (const item of result.items) {
        allItems.push({
          ...item,
          source: result.source,
          confidence: result.confidence
        });
      }
    }

    // Sort by relevance score * confidence
    allItems.sort((a, b) =>
      (b.relevanceScore * b.confidence) - (a.relevanceScore * a.confidence)
    );

    return {
      items: allItems.slice(0, 10), // Top 10
      sources: results.map(r => r.source),
      totalResults: allItems.length,
      timestamp: Date.now()
    };
  }
}
```

### Phase 2: GitHub MCP Integration (3 hours)

Leverage existing GitHub MCP from `.cursor/mcp_config.json`:

```typescript
export class GitHubKnowledgeBase implements KnowledgeBaseSource {
  private mcpClient: MCPClient;

  async query(query: string, options: KBQueryOptions): Promise<SourceResult> {
    // Use GitHub MCP to search issues
    const issues = await this.mcpClient.searchIssues(query, {
      state: 'all',
      sort: 'relevance',
      per_page: 10
    });

    // Convert to KB items
    const items = issues.map(issue => ({
      id: issue.url,
      title: issue.title,
      content: issue.body,
      url: issue.html_url,
      relevanceScore: this.calculateRelevance(query, issue),
      metadata: {
        type: 'github-issue',
        state: issue.state,
        labels: issue.labels,
        created: issue.created_at
      }
    }));

    return {
      source: 'github',
      items,
      confidence: 0.9 // High confidence for project-specific issues
    };
  }
}
```

### Phase 3: StackOverflow MCP Integration (4 hours)

Create custom MCP server for StackOverflow:

```typescript
export class StackOverflowKnowledgeBase implements KnowledgeBaseSource {
  private apiClient: StackOverflowAPIClient;

  async query(query: string, options: KBQueryOptions): Promise<SourceResult> {
    // Extract tags from query (e.g., "typescript async error" → ["typescript", "async"])
    const tags = this.extractTags(query, options.language);

    // Search StackOverflow
    const questions = await this.apiClient.search({
      intitle: query,
      tagged: tags.join(';'),
      sort: 'votes',
      accepted: true
    });

    // Get top answers
    const items = await Promise.all(
      questions.items.slice(0, 5).map(async q => {
        const answers = await this.apiClient.getAnswers(q.question_id);
        const topAnswer = answers.items[0];

        return {
          id: q.link,
          title: q.title,
          content: `Q: ${q.body}\n\nA: ${topAnswer?.body || 'No accepted answer'}`,
          url: q.link,
          relevanceScore: q.score / 100, // Normalize
          metadata: {
            type: 'stackoverflow-qa',
            votes: q.score,
            answerAccepted: q.is_answered,
            tags: q.tags
          }
        };
      })
    );

    return {
      source: 'stackoverflow',
      items,
      confidence: 0.85 // High confidence for general programming
    };
  }
}
```

### Phase 4: Reddit MCP Integration (3 hours)

```typescript
export class RedditKnowledgeBase implements KnowledgeBaseSource {
  private subreddits = ['programming', 'coding', 'devops', 'ai', 'MachineLearning'];

  async query(query: string, options: KBQueryOptions): Promise<SourceResult> {
    // Search across relevant subreddits
    const posts = await Promise.all(
      this.subreddits.map(sub =>
        this.searchSubreddit(sub, query, options)
      )
    );

    const items = posts
      .flat()
      .filter(post => post.score > 50) // Quality threshold
      .map(post => ({
        id: post.permalink,
        title: post.title,
        content: post.selftext + '\n\nTop Comment: ' + post.topComment,
        url: `https://reddit.com${post.permalink}`,
        relevanceScore: Math.log(post.score) / 10, // Log scale
        metadata: {
          type: 'reddit-post',
          subreddit: post.subreddit,
          upvotes: post.score,
          comments: post.num_comments
        }
      }));

    return {
      source: 'reddit',
      items,
      confidence: 0.7 // Medium confidence, more anecdotal
    };
  }
}
```

### Phase 5: JIRA MCP Integration (4 hours)

```typescript
export class JIRAKnowledgeBase implements KnowledgeBaseSource {
  private jiraClient: JIRAAPIClient;

  async query(query: string, options: KBQueryOptions): Promise<SourceResult> {
    // Search JIRA using JQL
    const jql = `text ~ "${query}" AND project = ${options.project || '*'} ORDER BY updated DESC`;

    const issues = await this.jiraClient.search(jql, {
      maxResults: 10,
      fields: ['summary', 'description', 'status', 'priority', 'labels']
    });

    const items = issues.issues.map(issue => ({
      id: issue.key,
      title: `[${issue.key}] ${issue.fields.summary}`,
      content: issue.fields.description,
      url: `${this.jiraClient.baseUrl}/browse/${issue.key}`,
      relevanceScore: this.calculateJIRARelevance(query, issue),
      metadata: {
        type: 'jira-ticket',
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name,
        labels: issue.fields.labels
      }
    }));

    return {
      source: 'jira',
      items,
      confidence: 0.95 // Very high confidence for project-specific context
    };
  }
}
```

### Phase 6: Integration with Agent RAG Context (2 hours)

Update `src/orchestration/ai-era-dev-orchestrator.ts`:

```typescript
export class AIEraDeveloperOrchestrator {
  private mcpKB: MCPKnowledgeBaseOrchestrator;

  async enrichWithFullContext(
    context: AgentActivationContext,
    agentId: string
  ): Promise<EnrichedContext> {
    // Existing RAG queries
    const relatedCode = await this.ragStore.queryMemories({ ... });

    // NEW: Query external knowledge bases
    const kbResults = await this.mcpKB.queryKnowledgeBases(
      context.content || context.userRequest || '',
      ['github', 'stackoverflow', 'jira'],
      {
        language: this.detectLanguage(context.filePath),
        project: this.getProjectName()
      }
    );

    return {
      ...context,
      fullCodebaseContext: {
        relatedFiles: relatedCode.documents,
        architecture: architecture.documents
      },
      externalKnowledge: {
        github: kbResults.items.filter(i => i.source === 'github'),
        stackoverflow: kbResults.items.filter(i => i.source === 'stackoverflow'),
        jira: kbResults.items.filter(i => i.source === 'jira'),
        totalSources: kbResults.sources.length
      }
    };
  }
}
```

## Configuration

### `.cursor/mcp_config.json` Extension

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
      }
    },
    "stackoverflow": {
      "command": "node",
      "args": ["~/.versatil/mcp-servers/stackoverflow/index.js"],
      "env": {
        "STACKOVERFLOW_API_KEY": "<your-key>"
      }
    },
    "reddit": {
      "command": "node",
      "args": ["~/.versatil/mcp-servers/reddit/index.js"],
      "env": {
        "REDDIT_CLIENT_ID": "<your-client-id>",
        "REDDIT_CLIENT_SECRET": "<your-secret>"
      }
    },
    "jira": {
      "command": "node",
      "args": ["~/.versatil/mcp-servers/jira/index.js"],
      "env": {
        "JIRA_HOST": "https://your-company.atlassian.net",
        "JIRA_EMAIL": "your-email@company.com",
        "JIRA_API_TOKEN": "<your-token>"
      }
    },
    "gitlab": {
      "command": "node",
      "args": ["~/.versatil/mcp-servers/gitlab/index.js"],
      "env": {
        "GITLAB_TOKEN": "<your-token>",
        "GITLAB_HOST": "https://gitlab.com"
      }
    },
    "confluence": {
      "command": "node",
      "args": ["~/.versatil/mcp-servers/confluence/index.js"],
      "env": {
        "CONFLUENCE_HOST": "https://your-company.atlassian.net/wiki",
        "CONFLUENCE_EMAIL": "your-email@company.com",
        "CONFLUENCE_API_TOKEN": "<your-token>"
      }
    }
  }
}
```

## Usage Examples

### Example 1: Context-Aware Bug Fix

```typescript
// User: "Fix the async/await error in authentication"

// AI-Era Dev Orchestrator enriches context:
const enrichedContext = {
  userRequest: "Fix the async/await error in authentication",
  filePath: "src/auth/login.ts",

  // Internal RAG
  relatedFiles: [
    { path: "src/auth/session.ts", similarity: 0.92 },
    { path: "tests/auth/login.test.ts", similarity: 0.88 }
  ],

  // External Knowledge Bases
  externalKnowledge: {
    github: [
      {
        title: "[Bug] Async/await in authentication causing race condition",
        url: "https://github.com/project/issues/456",
        solution: "Added Promise.all() to wait for all auth checks",
        relevanceScore: 0.95
      }
    ],
    stackoverflow: [
      {
        title: "How to handle async/await in Express middleware?",
        url: "https://stackoverflow.com/q/12345678",
        topAnswer: "Use express-async-handler wrapper...",
        relevanceScore: 0.89
      }
    ],
    jira: [
      {
        key: "PROJ-123",
        title: "Authentication timing issues in production",
        resolution: "Changed to async middleware pattern",
        relevanceScore: 0.97
      }
    ]
  }
};

// Agent uses ALL this context to generate comprehensive fix
```

### Example 2: Learning Industry Best Practices

```typescript
// Continuous Web Learning System queries knowledge bases daily

await patternLearningSystem.learnFromExternalKB({
  query: "TypeScript best practices 2025",
  sources: ['stackoverflow', 'reddit', 'github'],
  filters: {
    minVotes: 100,
    dateAfter: '2025-01-01'
  }
});

// System automatically updates RAG with:
// - New TypeScript patterns from GitHub trending repos
// - Highly-voted StackOverflow answers
// - Popular Reddit discussions on r/typescript
```

## Performance Optimization

1. **LRU Caching**: Knowledge base queries cached for 1 hour
2. **Parallel Queries**: All sources queried simultaneously
3. **Smart Routing**: Only query relevant sources based on context
4. **Rate Limiting**: Respect API limits (GitHub: 5000/hr, StackOverflow: 10000/day)
5. **Fallback Strategy**: If external KB fails, continue with internal RAG only

## Privacy & Security

1. **API Keys**: Stored in `~/.versatil/.env` (never in project)
2. **Data Filtering**: Only public data, no private company info in external queries
3. **Audit Logging**: All external KB queries logged for compliance
4. **Opt-In**: Users can disable external KB in settings
5. **Caching**: Cached responses stored locally, never sent to third parties

## Metrics

Track knowledge base effectiveness:

```typescript
interface KBMetrics {
  queriesPerSource: { [source: string]: number };
  avgConfidence: { [source: string]: number };
  cacheHitRate: number;
  avgResponseTime: { [source: string]: number };
  usefulnessRating: number; // User feedback
}
```

## Future Enhancements

1. **Custom Knowledge Bases**: Allow users to add company-specific sources
2. **ML-Powered Routing**: Learn which sources are best for which queries
3. **Real-Time Updates**: Subscribe to knowledge base changes (GitHub webhooks, etc.)
4. **Cross-Reference Learning**: Connect related issues across platforms
5. **Semantic Caching**: Cache by semantic similarity, not just exact match

## Implementation Timeline

- **Week 1**: Core MCP Knowledge Base Orchestrator + GitHub integration
- **Week 2**: StackOverflow + Reddit integration
- **Week 3**: JIRA + GitLab + Confluence integration
- **Week 4**: Agent integration + testing + documentation
- **Week 5**: Performance optimization + monitoring

**Total Estimated Effort**: 24-30 hours

---

**Status**: Ready for Implementation
**Priority**: High (aligns with user's continuous learning requirement)
**Dependencies**: MCP server infrastructure, API credentials