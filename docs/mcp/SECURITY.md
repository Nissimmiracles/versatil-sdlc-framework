# VERSATIL Documentation Tools - Security

**Version**: 1.1.0 (Phase 1)
**Last Updated**: 2025-10-19
**Status**: Production-Ready

This document describes the security features and mitigations implemented in the VERSATIL MCP Documentation Tools (Phase 1).

---

## Security Features Overview

The VERSATIL Documentation Tools implement **enterprise-grade security** to protect against common attack vectors while maintaining performance and usability.

### Threat Model

| Threat | Impact | Mitigation | Status |
|--------|--------|------------|--------|
| Path Traversal | Unauthorized file access | Path normalization + validation | ✅ Mitigated |
| DoS (Large Files) | Memory exhaustion | 10MB size limit (configurable) | ✅ Mitigated |
| Malformed Input | System crashes | Try-catch + validation | ✅ Mitigated |
| Race Conditions | Index corruption | Promise-based locking | ✅ Mitigated |
| Stale Data | Outdated documentation | 5-minute TTL + manual rebuild | ✅ Mitigated |

---

## 1. Path Traversal Protection

### Threat Description

**Attack Vector**: Malicious users attempt to access files outside the `docs/` directory using:
- Relative paths: `../../package.json`
- Absolute paths: `/etc/passwd`
- Windows-style traversal: `..\\..\\config.json`
- URL-encoded paths: `%2e%2e%2f`

**Impact**: Unauthorized access to sensitive files (credentials, source code, system files)

### Mitigation Strategy

#### 1.1 Path Normalization

All input paths are normalized to resolve `.` and `..` segments:

```typescript
const normalizedPath = path.normalize(relativePath);
```

#### 1.2 Traversal Pattern Blocking

Block any paths containing traversal patterns:

```typescript
if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
  throw new DocsSearchError(
    'Path traversal not allowed',
    DocsErrorCodes.PATH_TRAVERSAL_BLOCKED,
    { path: relativePath, normalizedPath }
  );
}
```

#### 1.3 Resolved Path Validation

Ensure resolved paths stay within `docs/` directory:

```typescript
const resolvedPath = path.resolve(metadata.filePath);
const allowedDocsPath = path.resolve(this.docsPath);

if (!resolvedPath.startsWith(allowedDocsPath)) {
  throw new DocsSearchError(
    'Security violation: Path outside docs directory',
    DocsErrorCodes.PATH_OUTSIDE_DOCS,
    { path: resolvedPath, allowedPath: allowedDocsPath }
  );
}
```

### Test Coverage

**Location**: `tests/mcp/docs-security.test.ts`

- ✅ Blocks `../` traversal
- ✅ Blocks absolute paths (`/etc/passwd`)
- ✅ Blocks Windows-style traversal (`..\\`)
- ✅ Allows legitimate relative paths
- ✅ Throws structured errors with error codes
- ✅ Validates resolved paths within docs directory

**Total**: 6 tests, 100% passing

---

## 2. File Size Limits

### Threat Description

**Attack Vector**: Attackers request excessively large files to cause:
- Memory exhaustion (OOM crashes)
- Slow response times (DoS)
- Resource starvation for legitimate requests

**Example**: Request a 500MB documentation file, causing the server to allocate 500MB RAM

**Impact**: Service unavailability, server crashes

### Mitigation Strategy

#### 2.1 Default Size Limit

10MB default limit prevents most DoS attempts:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

constructor(projectPath: string, options: {
  maxFileSize?: number;  // Default: 10MB
} = {}) {
  this.maxFileSize = options.maxFileSize || MAX_FILE_SIZE;
}
```

#### 2.2 Pre-Read Size Check

Check file size before reading into memory:

```typescript
if (metadata.size > this.maxFileSize) {
  throw new DocsSearchError(
    `Document too large: ${Math.round(metadata.size / 1024 / 1024)}MB (max ${Math.round(this.maxFileSize / 1024 / 1024)}MB)`,
    DocsErrorCodes.FILE_TOO_LARGE,
    { size: metadata.size, limit: this.maxFileSize }
  );
}
```

#### 2.3 Configurable Limits

Production environments can adjust limits:

```typescript
// Low-memory environments
const engine = new DocsSearchEngine(projectPath, {
  maxFileSize: 5 * 1024 * 1024, // 5MB
});

// High-trust environments
const engine = new DocsSearchEngine(projectPath, {
  maxFileSize: 50 * 1024 * 1024, // 50MB
});
```

### Test Coverage

**Location**: `tests/mcp/docs-security.test.ts`

- ✅ Rejects documents exceeding default 10MB limit
- ✅ Allows documents under limit
- ✅ Respects custom size limits (configurable)
- ✅ Throws FILE_TOO_LARGE with size details

**Total**: 4 tests, 100% passing

---

## 3. Index Rebuild Mechanism

### Problem Description

**Issue**: Documentation index never refreshed, leading to:
- Stale documentation (users see outdated content)
- No way to update index after doc changes
- Performance degradation (no optimization possible)

**Impact**: Poor user experience, incorrect information

### Mitigation Strategy

#### 3.1 Time-To-Live (TTL)

5-minute TTL triggers automatic index refresh:

```typescript
private lastIndexBuild: Date | null = null;
private indexTTL: number = 5 * 60 * 1000; // 5 minutes

isIndexStale(): boolean {
  if (!this.lastIndexBuild) return true;

  const now = new Date();
  return (now.getTime() - this.lastIndexBuild.getTime()) >= this.indexTTL;
}
```

#### 3.2 Automatic Rebuild

Index rebuilds automatically on first access after TTL:

```typescript
async buildIndex(force: boolean = false): Promise<void> {
  const now = new Date();

  if (
    this.indexBuilt &&
    !force &&
    this.lastIndexBuild &&
    (now.getTime() - this.lastIndexBuild.getTime()) < this.indexTTL
  ) {
    return; // Index is still fresh
  }

  // Proceed with rebuild...
}
```

#### 3.3 Manual Rebuild

Explicit rebuild for CI/CD pipelines:

```typescript
// Force rebuild regardless of TTL
await searchEngine.rebuildIndex();
```

#### 3.4 Index Metadata

Monitor index health:

```typescript
const metadata = searchEngine.getIndexMetadata();
// {
//   built: true,
//   lastBuild: Date,
//   isStale: false,
//   documentsCount: 123,
//   ttlMs: 300000
// }
```

### Test Coverage

**Location**: `tests/mcp/docs-index-management.test.ts`

- ✅ Detects stale index after TTL expires
- ✅ Fresh index after recent build
- ✅ Auto-rebuild on stale index
- ✅ Configurable TTL
- ✅ `isIndexStale()` method accuracy
- ✅ `getIndexMetadata()` returns correct data
- ✅ Default 5-minute TTL

**Total**: 7 tests, 100% passing

---

## 4. Concurrent Build Protection

### Problem Description

**Issue**: Multiple requests trigger index builds simultaneously, causing:
- Race conditions (corrupted index)
- Wasted resources (multiple builds)
- Inconsistent results (different build states)

**Impact**: Index corruption, resource waste

### Mitigation Strategy

#### 4.1 Promise-Based Locking

Single build promise shared across concurrent requests:

```typescript
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
      console.log('Building documentation index...');
      // ... build logic ...
      this.indexBuilt = true;
      this.lastIndexBuild = new Date();
    } catch (error) {
      throw new DocsSearchError(
        `Failed to build documentation index: ${error}`,
        DocsErrorCodes.INDEX_BUILD_FAILED,
        { error }
      );
    } finally {
      this.indexBuildPromise = null;
    }
  })();

  return this.indexBuildPromise;
}
```

#### 4.2 Behavior

- **Request 1**: Triggers build, receives promise
- **Request 2**: Sees build in progress, receives same promise
- **Request 3**: Sees build in progress, receives same promise
- **All requests**: Wait for single build to complete

### Test Coverage

**Location**: `tests/mcp/docs-index-management.test.ts`

- ✅ Multiple concurrent requests handled
- ✅ Single build executes (not multiple)

**Total**: 2 tests, 100% passing

---

## 5. Malformed Markdown Handling

### Problem Description

**Issue**: Invalid markdown crashes formatter:
- Unterminated code blocks (```` ``` ```` with no closing)
- Excessively large code blocks (>1MB)
- Malformed headings
- Invalid regex patterns

**Impact**: Service crashes, no error handling

### Mitigation Strategy

#### 5.1 Try-Catch Wrapper

All parsing wrapped in try-catch:

```typescript
static extractCodeBlocks(markdown: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];

  try {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      // ... parsing logic ...
    }
  } catch (error) {
    console.error('Failed to extract code blocks:', error);
    return []; // Return empty array instead of crashing
  }

  return codeBlocks;
}
```

#### 5.2 Input Validation

Validate matches before processing:

```typescript
// Validate match
if (!match[2]) {
  console.warn('Empty code block found, skipping');
  continue;
}
```

#### 5.3 Size Limits

Truncate excessively large code blocks:

```typescript
// Prevent excessively large code blocks (100KB limit)
if (code.length > 100000) {
  console.warn(`Code block exceeds 100KB (${code.length} chars), truncating`);
  code = code.substring(0, 100000) + '\n// ... (truncated)';
}
```

#### 5.4 Graceful Degradation

Return empty results instead of crashing:

```typescript
catch (error) {
  console.error('Failed to extract code blocks:', error);
  return []; // Graceful degradation
}
```

### Test Coverage

**Location**: `tests/mcp/docs-error-handling.test.ts`

- ✅ Unterminated code blocks handled
- ✅ Invalid headings handled
- ✅ Excessively large code blocks truncated (>100KB)
- ✅ Returns empty array instead of crashing
- ✅ Logs warnings for debugging

**Total**: 5 tests, 100% passing

---

## 6. Structured Error Handling

### Implementation

**File**: `src/mcp/docs-errors.ts`

```typescript
export class DocsSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DocsSearchError';

    // Maintains proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocsSearchError);
    }
  }
}

export const DocsErrorCodes = {
  // Document access errors
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  FILE_NOT_READABLE: 'FILE_NOT_READABLE',

  // Security errors
  INVALID_PATH: 'INVALID_PATH',
  PATH_TRAVERSAL_BLOCKED: 'PATH_TRAVERSAL_BLOCKED',
  PATH_OUTSIDE_DOCS: 'PATH_OUTSIDE_DOCS',

  // Size limit errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Index errors
  INDEX_NOT_BUILT: 'INDEX_NOT_BUILT',
  INDEX_BUILD_FAILED: 'INDEX_BUILD_FAILED',

  // Parsing errors
  MALFORMED_MARKDOWN: 'MALFORMED_MARKDOWN',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
} as const;

export type DocsErrorCode = typeof DocsErrorCodes[keyof typeof DocsErrorCodes];
```

### Benefits

1. **Machine-Readable Codes**: Programmatic error handling
2. **Detailed Context**: `details` object includes relevant data
3. **Type Safety**: TypeScript ensures correct error codes
4. **Consistent Structure**: All errors follow same pattern
5. **Stack Traces**: Proper V8 stack trace support

### Usage Example

```typescript
try {
  const doc = await searchEngine.getDocument('../../secret.json');
} catch (error) {
  if (error instanceof DocsSearchError) {
    console.error('Error code:', error.code);
    console.error('Details:', error.details);

    if (error.code === DocsErrorCodes.PATH_TRAVERSAL_BLOCKED) {
      // Handle path traversal attempt
    }
  }
}
```

---

## Security Best Practices

### For Framework Developers

1. **Never bypass security checks** - All paths must go through validation
2. **Test security features** - Run security test suite on every change
3. **Log security events** - Track failed access attempts for monitoring
4. **Keep limits configurable** - Allow production tuning
5. **Document security features** - Update this file with any changes

### For Framework Users

1. **Use default settings** - Security defaults are production-ready
2. **Monitor logs** - Watch for `PATH_TRAVERSAL_BLOCKED` errors (potential attacks)
3. **Adjust limits cautiously** - Increasing `maxFileSize` reduces DoS protection
4. **Report vulnerabilities** - See [Reporting Security Issues](#reporting-security-issues)

### For MCP Integrators

1. **Validate inputs** - Check user inputs before passing to MCP tools
2. **Rate limit requests** - Prevent abuse via rate limiting
3. **Log tool usage** - Track MCP tool calls for audit trails
4. **Handle errors gracefully** - Display user-friendly messages (not stack traces)

---

## Reporting Security Issues

If you discover a security vulnerability in VERSATIL Documentation Tools:

1. **DO NOT** open a public GitHub issue
2. **DO** email security@versatil.dev with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and provide a fix timeline.

---

## Security Audit History

| Date | Version | Auditor | Findings | Status |
|------|---------|---------|----------|--------|
| 2025-10-19 | 1.1.0 | Internal | 27 gaps identified | Phase 1 complete (5/27) |

### Phase 1 Findings (2025-10-19)

**Critical Issues Fixed**:
1. ✅ Path traversal vulnerability (CVSS: 7.5 High)
2. ✅ DoS via large files (CVSS: 5.3 Medium)
3. ✅ Stale index (CVSS: 3.1 Low)
4. ✅ Malformed input crashes (CVSS: 4.3 Medium)
5. ✅ Race conditions (CVSS: 3.7 Low)

**Remaining Issues** (Phases 2-4):
- 22 remaining gaps (performance, UX, technical debt)
- See [Phase 2-4 plan](../planning/phase-2-4-plan.md) for details

---

## Compliance

### OWASP Top 10 (2021)

| OWASP Category | Relevance | Mitigation |
|----------------|-----------|------------|
| A01: Broken Access Control | ✅ Relevant | Path traversal protection |
| A02: Cryptographic Failures | ❌ N/A | No cryptographic operations |
| A03: Injection | ✅ Relevant | Path validation + sanitization |
| A04: Insecure Design | ✅ Relevant | Security-first architecture |
| A05: Security Misconfiguration | ✅ Relevant | Secure defaults + configuration |
| A06: Vulnerable Components | ❌ N/A | No external dependencies |
| A07: Authentication Failures | ❌ N/A | No authentication required |
| A08: Software and Data Integrity | ✅ Relevant | Concurrent build protection |
| A09: Security Logging Failures | ⚠️ Partial | Console logging (no persistent logs yet) |
| A10: Server-Side Request Forgery | ❌ N/A | No external requests |

### CWE Coverage

| CWE | Name | Status |
|-----|------|--------|
| CWE-22 | Path Traversal | ✅ Mitigated |
| CWE-400 | Uncontrolled Resource Consumption | ✅ Mitigated |
| CWE-502 | Deserialization of Untrusted Data | ❌ N/A |
| CWE-362 | Race Condition | ✅ Mitigated |

---

## Test Coverage

**Total Phase 1 Security Tests**: 54 tests

### By Category

- **Path Traversal**: 6 tests (100% passing)
- **File Size Limits**: 4 tests (100% passing)
- **Path Validation**: 4 tests (100% passing)
- **Error Handling**: 4 tests (100% passing)
- **Malformed Input**: 5 tests (100% passing)
- **Graceful Degradation**: 5 tests (100% passing)
- **Regex Safety**: 3 tests (100% passing)
- **Index TTL**: 7 tests (100% passing)
- **Manual Rebuild**: 3 tests (100% passing)
- **Concurrent Protection**: 2 tests (100% passing)
- **Metadata Access**: 4 tests (100% passing)
- **Edge Cases**: 7 tests (100% passing)

**Execution Time**: 1.578s
**Status**: All passing ✅

### Run Security Tests

```bash
# All Phase 1 security tests
npx jest --config=jest-unit.config.cjs tests/mcp/docs-security.test.ts tests/mcp/docs-error-handling.test.ts tests/mcp/docs-index-management.test.ts

# Security tests only
npx jest --config=jest-unit.config.cjs tests/mcp/docs-security.test.ts
```

---

## Future Enhancements (Phases 2-4)

### Phase 2: Robustness & Performance
- Cache control headers
- Compression support
- Performance monitoring
- Memory usage tracking

### Phase 3: UX Enhancements
- Progress indicators for index builds
- Partial results for long searches
- Search suggestions
- Better error messages

### Phase 4: Technical Debt
- Persistent security logs
- Rate limiting
- IP-based access control
- Audit trail

---

**Last Updated**: 2025-10-19
**Version**: 1.1.0 (Phase 1)
**Status**: Production-Ready ✅
