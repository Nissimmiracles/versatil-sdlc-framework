# VERSATIL MCP Documentation Tools

**Version**: 1.1.0 (Phase 1 Security & Stability)
**Status**: Production-Ready
**MCP Server**: `claude-opera`

Comprehensive documentation access system integrated into the `claude-opera` MCP server, providing fast indexed search across all VERSATIL framework documentation with enterprise-grade security and stability.

---

## Overview

The VERSATIL MCP Documentation Tools enhance the `claude-opera` MCP server with **6 specialized tools** and **1 resource** for accessing framework documentation. This eliminates the need for a separate documentation MCP server while providing powerful search and retrieval capabilities.

### Key Features

- ✅ **In-Memory Indexed Search**: Fast keyword and category-based search (<100ms query time)
- ✅ **Category Organization**: 11 document categories (agents, workflows, rules, mcp, guides, etc.)
- ✅ **Structured Extraction**: Agent capabilities, workflow phases, code examples automatically extracted
- ✅ **Lazy Loading**: Documentation index built on first use (500ms build time)
- ✅ **Relevance Scoring**: Weighted scoring (title: 10, keywords: 5, path: 2)
- ✅ **Context-Aware Excerpts**: Extracts relevant snippets around query terms
- ✅ **Single MCP Architecture**: No separate documentation MCP needed

### Security & Stability (Phase 1 - v1.1.0)

- 🔒 **Path Traversal Protection**: Blocks `../`, absolute paths, Windows-style traversal attacks
- 🔒 **File Size Limits**: 10MB default limit (configurable) prevents DoS attacks
- 🔒 **Path Validation**: All paths validated to stay within `docs/` directory
- 🔄 **Index Rebuild**: 5-minute TTL with automatic refresh capability
- 🔄 **Concurrent Protection**: Promise-based locking prevents race conditions
- 🛡️ **Error Handling**: Structured errors with error codes, no crashes on malformed markdown
- ⚙️ **Configurable**: Security options via constructor (`maxFileSize`, `indexTTL`)

---

## Architecture

```
claude-opera MCP Server (21 tools, 6 resources)
├── Core Framework Tools (15 tools)
│   ├── versatil_activate_agent
│   ├── versatil_orchestrate_phase
│   ├── versatil_run_tests
│   └── ... (12 more)
│
├── Documentation Tools (6 tools) ⭐ NEW
│   ├── versatil_search_docs
│   ├── versatil_get_agent_docs
│   ├── versatil_get_workflow_guide
│   ├── versatil_get_quick_reference
│   ├── versatil_get_integration_guide
│   └── versatil_search_examples
│
└── Resources (6 resources)
    ├── versatil://agent-status/{agentId}
    ├── versatil://quality-metrics
    ├── versatil://performance-metrics
    ├── versatil://sdlc-phase
    ├── versatil://activity-log
    └── versatil://docs-index ⭐ NEW
```

### Implementation Modules

```
src/mcp/
├── versatil-mcp-server-v2.ts      # MCP server (enhanced with doc tools)
├── docs-search-engine.ts          # Search engine (in-memory index)
├── docs-formatter.ts              # Markdown parsing & formatting
└── mcp-onboarding.ts              # Existing onboarding system

tests/mcp/
├── docs-search-engine.test.ts     # Unit tests (DocsSearchEngine)
└── docs-tools-integration.test.ts # Integration tests (MCP tools)

docs/
└── **/*.md                        # 100+ documentation files indexed
```

---

## MCP Tools

### 1. `versatil_search_docs` - Universal Documentation Search

**Purpose**: Search all VERSATIL framework documentation with keyword and category filtering.

**Parameters**:
```typescript
{
  query: string;              // Search query (keywords, agent names, topics)
  category?: DocCategory;     // Optional category filter
}

type DocCategory =
  | 'agents'
  | 'workflows'
  | 'rules'
  | 'mcp'
  | 'guides'
  | 'troubleshooting'
  | 'quick-reference'
  | 'architecture'
  | 'testing'
  | 'security'
  | 'completion'
  | 'all';
```

**Returns**:
```
Found 3 result(s):

1. Maria-QA - Quality Guardian
   Path: agents/maria-qa.md
   Category: agents
   Relevance: 45
   Excerpt:
   Maria-QA is the Quality Guardian agent responsible for:
   - Test coverage analysis (80%+ required)
   - E2E testing via Playwright MCP
   - Accessibility validation (WCAG 2.1 AA)
   ...

2. Enhanced Testing Guide
   Path: guides/testing-guide.md
   Category: guides
   Relevance: 32
   Excerpt:
   ...
```

**Examples**:
```typescript
// Search for Maria-QA agent
versatil_search_docs({ query: "maria qa testing" })

// Search workflows only
versatil_search_docs({ query: "every workflow", category: "workflows" })

// Search MCP integrations
versatil_search_docs({ query: "playwright", category: "mcp" })
```

**Performance**: <100ms query time after index built

---

### 2. `versatil_get_agent_docs` - Agent Documentation Retrieval

**Purpose**: Get complete documentation for a specific OPERA agent with capabilities and examples.

**Parameters**:
```typescript
{
  agentId: string;  // Agent ID (maria-qa, james-frontend, marcus-backend, etc.)
}

// Supported agents (18 total):
// Core: maria-qa, james-frontend, marcus-backend, alex-ba, sarah-pm,
//       dr-ai-ml, oliver-mcp, dana-database
// James Sub-Agents: james-react, james-vue, james-nextjs, james-angular, james-svelte
// Marcus Sub-Agents: marcus-node, marcus-python, marcus-rails, marcus-go, marcus-java
```

**Returns**:
```json
{
  "success": true,
  "agentId": "maria-qa",
  "structured": {
    "agentId": "maria-qa",
    "name": "Maria-QA",
    "role": "Quality Guardian - Testing and QA automation specialist",
    "capabilities": [
      "Test coverage analysis (80%+ enforcement)",
      "E2E testing via Playwright MCP",
      "Accessibility validation (WCAG 2.1 AA)",
      "Visual regression testing",
      "Security compliance checking"
    ],
    "triggers": [
      "*.test.* files edited",
      "__tests__/** directory activity",
      "Quality gate violations"
    ],
    "filePatterns": [
      "*.test.ts", "*.test.tsx", "*.spec.js", "__tests__/**"
    ],
    "examples": [
      "// Test coverage example\njest.config.js...",
      "// E2E test example\ntest('login flow', async () => { ... })"
    ],
    "integration": [
      "Playwright MCP for browser testing",
      "Marcus-Backend for API testing",
      "James-Frontend for UI testing"
    ]
  },
  "fullDocumentation": "# Maria-QA - Quality Guardian\n\n..."
}
```

**Examples**:
```typescript
// Get Maria-QA documentation
versatil_get_agent_docs({ agentId: "maria-qa" })

// Get James-React sub-agent docs
versatil_get_agent_docs({ agentId: "james-react" })

// Get Marcus-Python sub-agent docs
versatil_get_agent_docs({ agentId: "marcus-python" })
```

**Use Cases**:
- Agent capability discovery
- Trigger pattern learning
- Integration pattern research
- Example code retrieval

---

### 3. `versatil_get_workflow_guide` - Workflow Documentation

**Purpose**: Get workflow documentation (EVERY, Three-Tier, Instinctive, Compounding).

**Parameters**:
```typescript
{
  workflowType: 'every' | 'three-tier' | 'instinctive' | 'compounding' | 'all';
}
```

**Returns (for specific workflow)**:
```json
{
  "success": true,
  "workflowType": "three-tier",
  "structured": {
    "workflowType": "three-tier",
    "name": "Three-Tier Parallel Development Workflow",
    "description": "Simultaneous frontend, backend, and database development",
    "phases": [
      {
        "name": "Requirements Analysis",
        "duration": "30 minutes",
        "agents": ["alex-ba"],
        "activities": [
          "Extract requirements",
          "Define API contract",
          "Create acceptance criteria"
        ]
      },
      {
        "name": "Parallel Development",
        "duration": "60 minutes",
        "agents": ["dana-database", "marcus-backend", "james-frontend"],
        "activities": [
          "Dana: Design database schema (45 min)",
          "Marcus: Implement API with mocks (60 min)",
          "James: Build UI with mocks (50 min)"
        ]
      }
    ],
    "timeSavings": "95 minutes (43% faster)",
    "examples": [
      "// Three-tier workflow example\n..."
    ]
  },
  "fullDocumentation": "# Three-Tier Parallel Development\n\n..."
}
```

**Returns (for "all" workflows)**:
```json
{
  "success": true,
  "workflows": [
    {
      "title": "EVERY Workflow - Compounding Engineering",
      "path": "workflows/every-workflow.md",
      "keywords": ["plan", "assess", "delegate", "work", "codify"]
    },
    {
      "title": "Three-Tier Parallel Development",
      "path": "workflows/three-tier-workflow.md",
      "keywords": ["dana", "marcus", "james", "parallel"]
    }
  ],
  "count": 4
}
```

**Examples**:
```typescript
// Get Three-Tier workflow guide
versatil_get_workflow_guide({ workflowType: "three-tier" })

// Get EVERY workflow guide
versatil_get_workflow_guide({ workflowType: "every" })

// List all workflows
versatil_get_workflow_guide({ workflowType: "all" })
```

---

### 4. `versatil_get_quick_reference` - Quick Reference Guides

**Purpose**: Get quick reference guides and cheat sheets for VERSATIL framework.

**Parameters**:
```typescript
{
  topic?: string;  // Optional topic filter (leave empty for all)
}
```

**Returns (with topic)**:
```
# OPERA Agent Quick Reference

## 18 Agents (8 Core + 10 Sub-Agents)

### Core Agents
- **Maria-QA**: Testing & quality assurance
- **James-Frontend**: UI/UX development
- **Marcus-Backend**: API & backend development
...

### Activation Patterns
- `*.test.*` → Maria-QA
- `*.tsx` → James-Frontend
- `*.api.*` → Marcus-Backend
...

### Common Commands
```bash
/maria review test coverage
/james check accessibility
/marcus scan security
```
```

**Returns (without topic)**:
```json
{
  "success": true,
  "quickReferences": [
    {
      "title": "OPERA Agent Quick Reference",
      "path": "quick-reference/agents-cheatsheet.md",
      "keywords": ["agents", "activation", "triggers"]
    },
    {
      "title": "MCP Integration Quick Reference",
      "path": "quick-reference/mcp-cheatsheet.md",
      "keywords": ["mcp", "tools", "resources"]
    }
  ],
  "count": 5
}
```

**Examples**:
```typescript
// Get agent quick reference
versatil_get_quick_reference({ topic: "agents" })

// Get MCP quick reference
versatil_get_quick_reference({ topic: "mcp" })

// List all quick references
versatil_get_quick_reference({})
```

---

### 5. `versatil_get_integration_guide` - MCP Integration Guides

**Purpose**: Get MCP integration guides (Playwright, GitHub, GitMCP, Supabase, etc.).

**Parameters**:
```typescript
{
  mcpName?: string;  // Optional MCP server name
}
```

**Returns (with MCP name)**:
```
# Playwright MCP Integration Guide

## Overview
Playwright MCP provides real browser automation for E2E testing via the `claude-opera` MCP server.

## Configuration
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@playwright/mcp@latest"],
    "description": "Official Microsoft Playwright MCP"
  }
}
```

## Maria-QA Integration
Maria-QA uses Playwright MCP for:
- E2E test execution
- Visual regression testing
- Accessibility audits (axe-core)
- Performance monitoring (Lighthouse)

## Example Usage
```typescript
// Navigate and test
await chrome_navigate({ url: 'http://localhost:3000' });
await chrome_test_component({ component: 'LoginForm' });
```
```

**Returns (without MCP name)**:
```json
{
  "success": true,
  "integrations": [
    {
      "title": "Playwright MCP Integration",
      "path": "mcp/playwright-integration.md",
      "keywords": ["playwright", "testing", "e2e"]
    },
    {
      "title": "GitHub MCP Integration",
      "path": "mcp/github-integration.md",
      "keywords": ["github", "repository", "ci-cd"]
    }
  ],
  "count": 12
}
```

**Examples**:
```typescript
// Get Playwright integration guide
versatil_get_integration_guide({ mcpName: "playwright" })

// Get GitHub integration guide
versatil_get_integration_guide({ mcpName: "github" })

// List all MCP integrations
versatil_get_integration_guide({})
```

---

### 6. `versatil_search_examples` - Code Example Search

**Purpose**: Search code examples across all VERSATIL documentation.

**Parameters**:
```typescript
{
  query: string;           // Search query (language, pattern, use case)
  language?: string;       // Optional language filter (typescript, javascript, python, etc.)
}
```

**Returns**:
```json
{
  "success": true,
  "query": "react testing",
  "language": "typescript",
  "examples": [
    {
      "code": "import { render, screen } from '@testing-library/react';\n\ntest('renders login form', () => {\n  render(<LoginForm />);\n  expect(screen.getByRole('button')).toHaveTextContent('Login');\n});",
      "language": "typescript",
      "source": "Maria-QA Testing Guide",
      "path": "guides/testing-guide.md",
      "category": "guides"
    },
    {
      "code": "// React Testing Library example\nconst user = userEvent.setup();\nawait user.type(screen.getByLabelText('Email'), 'test@example.com');",
      "language": "typescript",
      "source": "React Testing Patterns",
      "path": "agents/maria-qa.md",
      "category": "agents"
    }
  ],
  "totalFound": 15
}
```

**Examples**:
```typescript
// Search TypeScript examples
versatil_search_examples({
  query: "react testing",
  language: "typescript"
})

// Search Python examples
versatil_search_examples({
  query: "fastapi authentication",
  language: "python"
})

// Search all examples
versatil_search_examples({ query: "authentication" })
```

**Use Cases**:
- Find implementation patterns
- Discover best practices
- Learn from existing code
- Copy-paste starting points

---

## MCP Resource

### `versatil://docs-index` - Documentation Index

**Purpose**: Expose complete documentation index as a browsable resource.

**URI**: `versatil://docs-index`

**Returns**:
```json
{
  "stats": {
    "totalDocuments": 127,
    "totalSizeKB": 4523,
    "byCategory": [
      { "category": "agents", "count": 18 },
      { "category": "workflows", "count": 12 },
      { "category": "rules", "count": 5 },
      { "category": "mcp", "count": 15 },
      { "category": "guides", "count": 45 },
      { "category": "troubleshooting", "count": 8 },
      { "category": "quick-reference", "count": 6 },
      { "category": "architecture", "count": 10 },
      { "category": "testing", "count": 5 },
      { "category": "security", "count": 2 },
      { "category": "completion", "count": 1 }
    ],
    "lastIndexed": "2025-10-19T14:30:00.000Z"
  },
  "documents": {
    "agents": [
      {
        "title": "Maria-QA - Quality Guardian",
        "path": "agents/maria-qa.md",
        "keywords": ["maria", "testing", "quality", "coverage"],
        "size": "45KB",
        "lastModified": "2025-10-18T10:15:00.000Z"
      }
    ],
    "workflows": [ ... ],
    "mcp": [ ... ]
  },
  "usage": "Use versatil_search_docs tool to search, versatil_get_agent_docs for agents, versatil_get_workflow_guide for workflows"
}
```

**Access Methods**:
- Via MCP resource URI: `versatil://docs-index`
- Programmatically via DocsSearchEngine: `await searchEngine.getIndex()`

---

## Usage Examples

### Example 1: Discover Agent Capabilities

```typescript
// Step 1: Search for agent
const results = await versatil_search_docs({
  query: "maria testing quality",
  category: "agents"
});

// Step 2: Get detailed agent documentation
const agentDocs = await versatil_get_agent_docs({
  agentId: "maria-qa"
});

// Step 3: Find related code examples
const examples = await versatil_search_examples({
  query: "react testing",
  language: "typescript"
});

// Result: Complete understanding of Maria-QA capabilities with code examples
```

### Example 2: Learn Workflow Patterns

```typescript
// Step 1: List all workflows
const workflows = await versatil_get_workflow_guide({
  workflowType: "all"
});

// Step 2: Get specific workflow details
const threeT tierDocs = await versatil_get_workflow_guide({
  workflowType: "three-tier"
});

// Step 3: Search for workflow examples
const workflowExamples = await versatil_search_examples({
  query: "three-tier parallel"
});

// Result: Deep understanding of three-tier workflow with examples
```

### Example 3: Setup MCP Integration

```typescript
// Step 1: List available MCP integrations
const integrations = await versatil_get_integration_guide({});

// Step 2: Get specific integration guide
const playwrightGuide = await versatil_get_integration_guide({
  mcpName: "playwright"
});

// Step 3: Find integration examples
const integrationExamples = await versatil_search_examples({
  query: "playwright testing"
});

// Result: Complete MCP integration setup with examples
```

---

## Performance Characteristics

### Index Building

```
First Request (Cold Start):
  - Index Build Time: ~500ms
  - Documents Indexed: 100+
  - Memory Usage: ~15MB
  - Disk I/O: Sequential read

Subsequent Requests (Warm):
  - Index Reuse: In-memory
  - Query Time: <100ms
  - No Disk I/O
```

### Search Performance

```
Query Complexity       | Time      | Result Count
----------------------|-----------|-------------
Simple (1 term)       | 20-50ms   | 10 (max)
Complex (3+ terms)    | 50-100ms  | 10 (max)
Category Filtered     | 30-70ms   | 10 (max)
Full Document Fetch   | 10-20ms   | 1 document
Code Block Extraction | 30-60ms   | 10 examples
```

### Scalability

```
Documents Indexed     | Build Time | Query Time
---------------------|------------|------------
100 docs (~5MB)      | 500ms      | 50ms
500 docs (~25MB)     | 2s         | 100ms
1000 docs (~50MB)    | 4s         | 150ms
```

**Optimization**: Index built once on first use, cached for lifetime of MCP server.

---

## Implementation Details

### DocsSearchEngine

**Location**: `src/mcp/docs-search-engine.ts`

**Key Methods**:
```typescript
class DocsSearchEngine {
  async buildIndex(): Promise<void>
  async search(query: string, category?: DocCategory): Promise<SearchResult[]>
  async getDocument(relativePath: string): Promise<string>
  async getDocumentsByCategory(category: DocCategory): Promise<DocumentMetadata[]>
  async getIndex(): Promise<DocumentMetadata[]>
  extractExcerpt(content: string, queryTerms: string[], contextLines: number): string
}
```

**Relevance Scoring**:
```typescript
// Title matches: 10 points per match
// Keyword matches: 5 points per match
// Path matches: 2 points per match
// Results sorted by total relevance score
```

### DocsFormatter

**Location**: `src/mcp/docs-formatter.ts`

**Key Methods**:
```typescript
class DocsFormatter {
  static formatForMCP(markdown: string): string
  static extractCodeBlocks(markdown: string): CodeBlock[]
  static extractSections(markdown: string): FormattedSection[]
  static formatAgentDocs(agentId: string, content: string): AgentDoc
  static formatWorkflowDocs(workflowType: string, content: string): WorkflowDoc
  static formatSearchResults(results: SearchResult[]): string
}
```

**Markdown Parsing**:
- Removes HTML comments
- Extracts headings (## Heading)
- Parses fenced code blocks (```language)
- Identifies list items (- Item)
- Extracts file patterns (`*.test.*`)

---

## Security (Phase 1 - v1.1.0)

### Path Traversal Protection

**Threat**: Attackers using `../` or absolute paths to access files outside `docs/` directory

**Mitigation**:
```typescript
// All paths normalized and validated
const normalizedPath = path.normalize(relativePath);

// Block traversal patterns
if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
  throw new DocsSearchError(
    'Path traversal not allowed',
    DocsErrorCodes.PATH_TRAVERSAL_BLOCKED
  );
}

// Validate resolved path
const resolvedPath = path.resolve(metadata.filePath);
const allowedDocsPath = path.resolve(this.docsPath);

if (!resolvedPath.startsWith(allowedDocsPath)) {
  throw new DocsSearchError(
    'Security violation: Path outside docs directory',
    DocsErrorCodes.PATH_OUTSIDE_DOCS
  );
}
```

**Test Coverage**: 6 tests (blocks `../`, absolute paths, Windows-style traversal)

### File Size Limits

**Threat**: DoS attacks via excessively large files causing memory exhaustion

**Mitigation**:
```typescript
// Configurable size limit (default 10MB)
constructor(projectPath: string, options: {
  maxFileSize?: number;  // Default: 10MB
  indexTTL?: number;     // Default: 5 minutes
} = {}) {
  this.maxFileSize = options.maxFileSize || (10 * 1024 * 1024);
}

// Check before reading
if (metadata.size > this.maxFileSize) {
  throw new DocsSearchError(
    `Document too large: ${size}MB (max ${limit}MB)`,
    DocsErrorCodes.FILE_TOO_LARGE
  );
}
```

**Test Coverage**: 4 tests (enforces limits, configurable, custom limits)

### Index Rebuild Mechanism

**Problem**: Stale documentation index never refreshed

**Solution**:
```typescript
// 5-minute TTL for automatic refresh
private lastIndexBuild: Date | null = null;
private indexTTL: number = 5 * 60 * 1000; // 5 minutes

isIndexStale(): boolean {
  if (!this.lastIndexBuild) return true;
  const now = new Date();
  return (now.getTime() - this.lastIndexBuild.getTime()) >= this.indexTTL;
}

// Manual rebuild
async rebuildIndex(): Promise<void> {
  return this.buildIndex(true); // Force rebuild
}

// Get metadata
getIndexMetadata(): {
  built: boolean;
  lastBuild: Date | null;
  isStale: boolean;
  documentsCount: number;
  ttlMs: number;
}
```

**Test Coverage**: 7 tests (detects staleness, auto-refresh, manual rebuild, metadata)

### Concurrent Build Protection

**Problem**: Race conditions when multiple requests trigger index builds simultaneously

**Solution**:
```typescript
// Promise-based locking
private indexBuildPromise: Promise<void> | null = null;

async buildIndex(force: boolean = false): Promise<void> {
  // Return existing build promise if build is in progress
  if (this.indexBuildPromise) {
    console.log('Index build already in progress, waiting...');
    return this.indexBuildPromise;
  }

  // Create build promise to prevent concurrent builds
  this.indexBuildPromise = (async () => {
    try {
      // ... build logic ...
    } finally {
      this.indexBuildPromise = null;
    }
  })();

  return this.indexBuildPromise;
}
```

**Test Coverage**: 2 tests (concurrent requests handled, single build executed)

### Malformed Markdown Handling

**Problem**: Unterminated code blocks or invalid markdown crashes formatter

**Solution**:
```typescript
static extractCodeBlocks(markdown: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];

  try {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      // Validate match
      if (!match[2]) {
        console.warn('Empty code block found, skipping');
        continue;
      }

      // Prevent excessively large code blocks (100KB limit)
      if (code.length > 100000) {
        console.warn(`Code block exceeds 100KB, truncating`);
        code = code.substring(0, 100000) + '\n// ... (truncated)';
      }

      codeBlocks.push({ language, code, lineNumber });
    }
  } catch (error) {
    console.error('Failed to extract code blocks:', error);
    return []; // Return empty array instead of crashing
  }

  return codeBlocks;
}
```

**Test Coverage**: 5 tests (unterminated blocks, malformed headers, huge blocks)

### Structured Error Handling

**Implementation**: `src/mcp/docs-errors.ts`

```typescript
export class DocsSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DocsSearchError';
  }
}

export const DocsErrorCodes = {
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  PATH_TRAVERSAL_BLOCKED: 'PATH_TRAVERSAL_BLOCKED',
  PATH_OUTSIDE_DOCS: 'PATH_OUTSIDE_DOCS',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INDEX_BUILD_FAILED: 'INDEX_BUILD_FAILED',
  MALFORMED_MARKDOWN: 'MALFORMED_MARKDOWN',
} as const;
```

**Benefits**:
- Machine-readable error codes
- Detailed context in `details` object
- Type-safe error handling
- Consistent error structure across tools

---

## Testing

### Unit Tests (Phase 0 - Original)

**Location**: `tests/mcp/docs-search-engine.test.ts`

**Coverage**:
- ✅ Index building
- ✅ Search functionality
- ✅ Document retrieval
- ✅ Category filtering
- ✅ Excerpt extraction
- ✅ Relevance scoring
- ✅ Performance benchmarks

### Security Tests (Phase 1 - v1.1.0)

**Location**: `tests/mcp/docs-security.test.ts`

**Test Suites**:
- ✅ **Path Traversal Protection** (6 tests)
  - Blocks `../` traversal
  - Blocks absolute paths (`/etc/passwd`)
  - Blocks Windows-style traversal (`..\\`)
  - Throws DocsSearchError with correct code
  - Allows legitimate relative paths
  - Validates resolved paths within docs directory

- ✅ **File Size Limits** (4 tests)
  - Rejects documents exceeding default 10MB limit
  - Allows documents under limit
  - Respects custom size limits (configurable)
  - Throws FILE_TOO_LARGE with size details

- ✅ **Path Validation** (4 tests)
  - Ensures all paths within docs directory
  - Blocks symlink attacks (if applicable)
  - Validates normalized paths
  - Handles edge cases (`.` prefix, trailing slashes)

- ✅ **Error Handling** (4 tests)
  - Structured DocsSearchError instances
  - Correct error codes for each scenario
  - Details object includes relevant context
  - Proper error messages for users

- ✅ **Backwards Compatibility** (4 tests)
  - Default options work (no config required)
  - Existing tests still pass (zero regressions)
  - Optional security features
  - Graceful degradation

**Total**: 22 security tests, 100% passing

### Error Handling Tests (Phase 1 - v1.1.0)

**Location**: `tests/mcp/docs-error-handling.test.ts`

**Test Suites**:
- ✅ **Malformed Markdown** (5 tests)
  - Unterminated code blocks
  - Invalid headings
  - Excessively large code blocks (>100KB)
  - Missing section content
  - Edge cases (empty documents, no content)

- ✅ **Graceful Degradation** (5 tests)
  - Returns empty array instead of crashing
  - Continues processing on single errors
  - Logs warnings for debugging
  - Never throws unhandled exceptions

- ✅ **Regex Safety** (3 tests)
  - Prevents catastrophic backtracking
  - Handles large input efficiently
  - No ReDoS vulnerabilities

- ✅ **Edge Cases** (3 tests)
  - Empty queries handled
  - Special characters in queries
  - Very long queries (>1000 chars)

**Total**: 16 error handling tests, 100% passing

### Index Management Tests (Phase 1 - v1.1.0)

**Location**: `tests/mcp/docs-index-management.test.ts`

**Test Suites**:
- ✅ **Index Freshness (TTL)** (7 tests)
  - Detects stale index after TTL expires
  - Fresh index after recent build
  - Auto-rebuild on stale index
  - Configurable TTL
  - `isIndexStale()` method accuracy
  - `getIndexMetadata()` returns correct data
  - Default 5-minute TTL

- ✅ **Manual Rebuild** (3 tests)
  - `rebuildIndex()` forces rebuild
  - Updates `lastIndexBuild` timestamp
  - Clears old index before rebuilding

- ✅ **Concurrent Build Protection** (2 tests)
  - Multiple concurrent requests handled
  - Single build executes (not multiple)

- ✅ **Metadata Access** (4 tests)
  - `getIndexMetadata()` returns all fields
  - Metadata accurate (built status, doc count)
  - Last build timestamp tracked
  - TTL settings exposed

**Total**: 16 index management tests, 100% passing

### Test Summary (Phase 1)

```
Total Phase 1 Tests: 54 tests
  - Security Tests: 22 (path traversal, size limits, validation)
  - Error Handling Tests: 16 (malformed markdown, graceful degradation)
  - Index Management Tests: 16 (TTL, rebuild, concurrent protection)

Status: 54/54 PASSING (100%)
Execution Time: 1.578s
```
- ✅ Edge cases
- ✅ Concurrent access

**Run Tests**:
```bash
npm run test:unit -- tests/mcp/docs-search-engine.test.ts
```

### Integration Tests

**Location**: `tests/mcp/docs-tools-integration.test.ts`

**Coverage**:
- ✅ MCP server initialization
- ✅ Tool registration
- ✅ Resource registration
- ✅ End-to-end workflows
- ✅ Error handling
- ✅ Performance testing

**Run Tests**:
```bash
npm run test:unit -- tests/mcp/docs-tools-integration.test.ts
```

---

## Configuration

### MCP Server Configuration

**File**: `.cursor/mcp_config.json`

```json
{
  "mcpServers": {
    "claude-opera": {
      "command": "node",
      "args": ["/path/to/bin/versatil-mcp.js", "/path/to/project"],
      "env": {
        "VERSATIL_MCP_MODE": "true"
      }
    }
  }
}
```

**No additional configuration needed** - Documentation tools are built into the `claude-opera` MCP server.

### Documentation Location

```
docs/
├── agents/              # Agent documentation (18 files)
├── workflows/           # Workflow guides (EVERY, Three-Tier, etc.)
├── rules/               # 5-Rule system documentation
├── mcp/                 # MCP integration guides (12 MCPs)
├── guides/              # General guides and tutorials
├── troubleshooting/     # Troubleshooting guides
├── quick-reference/     # Cheat sheets and quick refs
├── architecture/        # Architecture documentation
├── testing/             # Testing guides
├── security/            # Security documentation
└── completion/          # Completion summaries
```

**Index Scope**: All `**/*.md` files in `docs/` directory.

---

## Troubleshooting

### Issue: "Index Not Built" Error

**Symptom**: First documentation tool call takes 500ms+

**Cause**: Index built lazily on first use

**Solution**: This is expected behavior. Index is built once and cached for subsequent requests.

### Issue: "Document Not Found" Error

**Symptom**: Tool returns error when requesting specific document

**Cause**: Document path incorrect or document not indexed

**Solution**:
1. Check document exists in `docs/` directory
2. Verify path uses relative path (not absolute)
3. Run `versatil_search_docs` to find correct path

### Issue: "No Results Found" Error

**Symptom**: Search returns empty array

**Cause**: Query terms don't match any documents

**Solution**:
1. Try broader search terms
2. Remove category filter
3. Check spelling of search terms
4. Use `versatil://docs-index` resource to browse available docs

### Issue: Slow Search Performance

**Symptom**: Queries take >1 second

**Cause**: Too many documents or complex query

**Solution**:
1. Use category filtering to reduce search scope
2. Simplify query (fewer terms)
3. Check system resources (CPU, memory)

---

## Best Practices

### Search Strategy

1. **Start Broad, Narrow Down**:
   ```typescript
   // Broad search
   versatil_search_docs({ query: "testing" })

   // Narrow to category
   versatil_search_docs({ query: "testing", category: "agents" })

   // Get specific agent
   versatil_get_agent_docs({ agentId: "maria-qa" })
   ```

2. **Use Category Filters**:
   - `agents`: Agent documentation
   - `workflows`: Workflow guides
   - `mcp`: MCP integration guides
   - `quick-reference`: Cheat sheets

3. **Combine Multiple Tools**:
   ```typescript
   // Workflow: Search → Get Docs → Find Examples
   const results = await versatil_search_docs({ query: "react" });
   const agentDocs = await versatil_get_agent_docs({ agentId: "james-react" });
   const examples = await versatil_search_examples({ query: "react hooks" });
   ```

### Query Optimization

1. **Use Specific Terms**: "maria qa testing" > "quality"
2. **Include Context**: "react testing library" > "testing"
3. **Filter Language**: Always specify `language` for code examples
4. **Check Index First**: Browse `versatil://docs-index` before searching

---

## Future Enhancements

### Planned Features (v1.1)

- [ ] Fuzzy search support (typo tolerance)
- [ ] Semantic search via embeddings
- [ ] Documentation versioning support
- [ ] Real-time index updates (watch mode)
- [ ] Advanced filtering (date, size, author)
- [ ] Full-text search with highlighting
- [ ] Documentation graph visualization
- [ ] Related documents suggestions

### Performance Improvements

- [ ] Incremental index updates
- [ ] Parallel document processing
- [ ] LRU cache for frequent queries
- [ ] Index persistence to disk
- [ ] Multi-language support

---

## Summary

**VERSATIL MCP Documentation Tools** provide comprehensive, fast, and structured access to all framework documentation through the unified `claude-opera` MCP server. With **6 specialized tools** and **1 resource**, users can:

✅ Search documentation by keyword and category
✅ Retrieve structured agent capabilities and examples
✅ Discover workflow patterns with phase details
✅ Access quick references and cheat sheets
✅ Find MCP integration guides
✅ Search code examples by language and pattern

**Performance**: <100ms queries after 500ms index build
**Architecture**: Single MCP server (no separate docs MCP needed)
**Coverage**: 100+ documentation files across 11 categories

---

**Status**: ✅ Production-Ready (v1.0.0)
**Tests**: ✅ Comprehensive unit + integration tests
**Documentation**: ✅ Complete user + developer guides

For questions or issues, see [Troubleshooting](#troubleshooting) section or file an issue.
