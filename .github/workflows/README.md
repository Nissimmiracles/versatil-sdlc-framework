# VERSATIL GitHub Actions Workflows

## Overview

This directory contains GitHub Actions workflows for the VERSATIL SDLC Framework. These workflows automate quality checks, testing, and Public RAG enrichment.

---

## Workflows

### 1. Public RAG Auto-Contribution

**File**: [rag-contribution.yml](rag-contribution.yml)

**Purpose**: Automatically contributes framework patterns to Public RAG when PRs are merged to main.

**Triggers**:
- Push to `main` branch
- Only when files in `src/`, `.claude/`, `docs/`, or `scripts/` are modified
- Manual trigger via commit message containing `[rag-contribute]`

**What it does**:
1. Detects framework context (skips if not framework repository)
2. Extracts patterns from PR diff
3. Classifies patterns (public-safe, requires-sanitization, private-only, etc.)
4. Sanitizes patterns if needed
5. Stores in Public RAG
6. Comments on PR with contribution summary
7. Uploads contribution logs as artifacts

**Example PR Comment**:
```markdown
## 🌍 Public RAG Contribution

**Patterns Extracted**: 8
**Patterns Stored**: 7
**Sanitized**: 2

### Top Contributions:
1. OPERA Agent: Maria-QA (public_safe)
2. Slash Command: /plan (requires_sanitization)
3. Skill: compounding-engineering (public_safe)

✅ These patterns are now available to all VERSATIL users via Public RAG!
```

**Configuration**:

Required GitHub Secrets:
- `PUBLIC_RAG_PROJECT_ID` - GCP project ID for Public RAG Firestore
- `PUBLIC_RAG_DATABASE` - Firestore database name (e.g., `versatil-public-rag`)
- `GITHUB_TOKEN` - Auto-provided by GitHub Actions

**Testing Locally**:
```bash
npm run rag:contribute-from-pr
```

**Artifacts**:
- `rag-contribution-summary.json` - Latest contribution summary
- Retained for 30 days

**Related Files**:
- Extraction script: [scripts/auto-learn-from-pr.ts](../scripts/auto-learn-from-pr.ts)
- Documentation: [docs/AUTO_LEARNING.md](../docs/AUTO_LEARNING.md)

---

## Workflow Guidelines

### Adding New Workflows

1. **Name convention**: Use kebab-case (e.g., `test-quality.yml`)
2. **Documentation**: Update this README with workflow details
3. **Secrets**: Document all required secrets
4. **Testing**: Test locally before committing (use `act` or manual scripts)

### Best Practices

- ✅ Use specific triggers (don't trigger on every push)
- ✅ Add timeout limits to prevent runaway jobs
- ✅ Use caching for dependencies (`cache: 'npm'`)
- ✅ Upload artifacts for debugging (logs, reports)
- ✅ Add status badges to main README if user-facing

### Security

- ⚠️ Never commit secrets to workflow files
- ⚠️ Use `secrets` context for sensitive data
- ⚠️ Validate all inputs before execution
- ⚠️ Use minimal permissions (`permissions` key)

---

## Future Workflows (Planned)

### Test Automation
- Unit/integration/e2e tests on PR
- Coverage reports and quality gates
- Performance regression detection

### Security Scanning
- Dependency vulnerability scanning
- SAST (Static Application Security Testing)
- Secret detection

### Release Automation
- Semantic versioning
- Changelog generation
- npm package publishing

---

## Related Documentation

- **Auto-Learning Guide**: [docs/AUTO_LEARNING.md](../docs/AUTO_LEARNING.md)
- **Sanitization Policy**: [docs/SANITIZATION_POLICY.md](../docs/SANITIZATION_POLICY.md)
- **Framework Architecture**: [docs/VERSATIL_ARCHITECTURE.md](../docs/VERSATIL_ARCHITECTURE.md)

---

**Last Updated**: v7.8.0 (2025-10-27)
