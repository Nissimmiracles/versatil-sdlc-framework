# 📦 pnpm Migration Status Report

**Date**: 2025-11-03
**Framework**: VERSATIL SDLC v7.16.2
**Migration**: npm → pnpm@10.17.0

---

## ✅ Completed Changes

### 1. **Core Configuration**
- ✅ `package.json` - `"packageManager": "pnpm@10.17.0"` already set
- ✅ `.npmrc` - Configured for pnpm (shamefully-hoist, node-linker=hoisted)
- ✅ `pnpm-lock.yaml` - Present (lockfileVersion 9.0)
- ✅ `.vscode/settings.json` - Performance optimizations added

### 2. **GitHub Actions Workflows**
**STATUS**: ✅ PARTIALLY COMPLETE - cache updated, npm ci replaced

#### Updated Files:
- ✅ `.github/workflows/ci.yml` - pnpm setup added, cache: 'pnpm', pnpm install --frozen-lockfile
- ✅ `.github/workflows/quality-gates.yml` - cache and install commands updated

#### Remaining Work:
All workflow files need the **pnpm setup step** added before Node.js setup:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v3
  with:
    version: 10.17.0
```

**Files needing pnpm setup step:**
- `.github/workflows/agent-performance.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/mcp-health-check.yml`
- `.github/workflows/mcp-integration.yml`
- `.github/workflows/npm-publish.yml` ⚠️ Keep npm for publishing
- `.github/workflows/rag-contribution.yml`
- `.github/workflows/release.yml`
- `.github/workflows/security-scan.yml`
- `.github/workflows/test-updates.yml`
- `.github/workflows/quality-gates.yml` (7 more jobs need pnpm setup)

---

## 🔄 Pending Changes

### Category 1: Critical Infrastructure (NEXT PRIORITY)

#### 1.1 GitHub Actions - Add pnpm Setup Steps
**Command to add pnpm setup before each Node.js setup:**

```bash
# Pattern to search for:
# - name: Setup Node.js

# Insert before it:
#       - name: Setup pnpm
#         uses: pnpm/action-setup@v3
#         with:
#           version: 10.17.0
```

**Total instances**: ~40 jobs across 11 workflow files

#### 1.2 Dockerfiles
**Files**:
- `docs/deployment/Dockerfile` (Line 60, 64, 72)
- `templates/enterprise/Dockerfile.prod` (Line 10, 14, 24)

**Changes needed**:
```dockerfile
# OLD:
COPY package*.json ./
RUN npm ci --only=production
RUN npm run build

# NEW:
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
RUN pnpm build
```

---

### Category 2: Shell Scripts

**Files to update** (8 total):

1. **scripts/install.sh**
   - Line 214: `npm install -g` → `pnpm add -g`
   - Line 244: `npm install --save-dev` → `pnpm add -D`

2. **scripts/install-mcps.sh**
   - Line 26: `npm install "${package}"` → `pnpm add "${package}"`

3. **scripts/setup-mcp-modules.sh**
   - Line 10: `npm install @context7/mcp --save` → `pnpm add @context7/mcp`

4. **scripts/deploy-production.sh**
   - Line 13: `npm install -g supabase` → `pnpm add -g supabase`

5. **scripts/install-versatil-mcp.sh**
   - Line 21: `npm install` → `pnpm install`
   - Line 25: `npm install @modelcontextprotocol/sdk` → `pnpm add @modelcontextprotocol/sdk`

6. **scripts/run-accessibility-tests.sh**
   - Line 122: `npm install` → `pnpm install`

7. **scripts/install.ps1** (PowerShell)
   - Line 95: `npm install -g versatil-sdlc-framework` → `pnpm add -g versatil-sdlc-framework`
   - Line 98: `npm install versatil-sdlc-framework` → `pnpm add versatil-sdlc-framework`

---

### Category 3: JavaScript/CommonJS Scripts

**Files to update** (12 total):

1. **scripts/postinstall-wizard.cjs**
   - Line 5 comment: Update to mention pnpm
   - Line 312: `Don't fail npm install` → `Don't fail pnpm install`

2. **scripts/recover-framework.cjs**
   - Line 317: `'Run npm install'` → `'Run pnpm install'`
   - Line 424: `execSync('npm install')` → `execSync('pnpm install')`
   - Line 428: `'Ran npm install'` → `'Ran pnpm install'`

3. **scripts/release.cjs**
   - Line 251: `npm install -g` → `pnpm add -g`

4. **scripts/setup-enhanced.cjs**
   - Line 56: `'npm install versatil-sdlc-framework@latest'` → `'pnpm add -g versatil-sdlc-framework@latest'`

5. **scripts/migrate-to-1.2.0.cjs**
   - Line 180: `npm install versatil-sdlc-framework@` → `pnpm install versatil-sdlc-framework@`

6. **scripts/uninstall.cjs**
   - Line 179: `npm install -g` → `pnpm add -g`

7. **scripts/setup-supabase-auto.cjs**
   - Line 6 comment: Update to mention pnpm
   - Line 138: `'npm install -g supabase'` → `'pnpm add -g supabase'`

8. **scripts/deploy-edge-functions.cjs**
   - Line 350: `'npm install -g @supabase/cli'` → `'pnpm add -g @supabase/cli'`

9-12. **Other CJS scripts** - Review for npm commands

---

### Category 4: Documentation

#### 4.1 High Priority User-Facing Docs

**Files**:
1. **README.md** (Line 22-23)
   - Update if npx command needs pnpm equivalent

2. **docs/getting-started/installation.md**
   - Lines 29, 51, 54, 320-334: `npm` → `pnpm`
   - Add pnpm-specific setup section

3. **docs/getting-started/quick-start.md**
   - Lines 26, 33, 56: `npm install` → `pnpm install`
   - Update examples

4. **docs/INSTALLATION.md**
   - Multiple npm references throughout
   - Create pnpm installation guide

5. **docs/CONTRIBUTING.md**
   - Lines 56, 62-71: Update development workflow

#### 4.2 Command Reference Documentation

**Decision needed**: Keep `npm run` vs switch to `pnpm`?

| Command | npm | pnpm | Notes |
|---------|-----|------|-------|
| Run script | `npm run build` | `pnpm build` | pnpm allows omitting 'run' |
| Run script (explicit) | `npm run build` | `pnpm run build` | Both work, explicit is clearer |

**Recommendation**:
- For user-facing docs: Show both options
- For internal scripts: Use `pnpm` (shorter)

**Files affected** (100+ files):
- All release notes (`docs/v7.*.md`)
- All testing documentation (`docs/testing/*.md`)
- All memory/RAG documentation (`docs/memory/*.md`)
- All guides (`docs/guides/*.md`)
- All feature docs (`docs/features/*.md`)

**Pattern to update**:
```markdown
# OLD:
npm run build

# NEW (Option A - Show both):
pnpm build  # or: npm run build (if using npm)

# NEW (Option B - pnpm only):
pnpm build
```

---

## 🎯 Migration Command Reference

| Task | npm Command | pnpm Equivalent |
|------|-------------|-----------------|
| Install dependencies | `npm install` | `pnpm install` |
| CI install | `npm ci` | `pnpm install --frozen-lockfile` |
| Global install | `npm install -g <pkg>` | `pnpm add -g <pkg>` |
| Add dependency | `npm install <pkg>` | `pnpm add <pkg>` |
| Add dev dependency | `npm install --save-dev <pkg>` | `pnpm add -D <pkg>` |
| Remove dependency | `npm uninstall <pkg>` | `pnpm remove <pkg>` |
| Run script | `npm run <script>` | `pnpm <script>` or `pnpm run <script>` |
| Run tests | `npm test` | `pnpm test` |
| Clean cache | `npm cache clean` | `pnpm store prune` |
| **Publish to registry** | `npm publish` | **`npm publish`** (KEEP npm!) |

---

## ⚠️ Special Cases

### 1. npm Registry Publishing
**DO NOT** change `npm publish` to `pnpm publish` in:
- `.github/workflows/npm-publish.yml`
- `package.json` publish-related scripts

**Reason**: `npm publish` is the standard for npm registry, works correctly with pnpm projects.

### 2. Security Audits
Current: `npm audit`
Options:
- Keep `npm audit` (works with pnpm projects)
- Use `pnpm audit` (pnpm native command)

**Recommendation**: Update to `pnpm audit` for consistency.

---

## 📊 Migration Progress

| Category | Total Files | Updated | Remaining | % Complete |
|----------|-------------|---------|-----------|------------|
| Core Config | 3 | 3 | 0 | 100% |
| GitHub Actions | 11 | 2 | 9 | 18% |
| Dockerfiles | 2 | 0 | 2 | 0% |
| Shell Scripts | 8 | 0 | 8 | 0% |
| JS/CJS Scripts | 12 | 0 | 12 | 0% |
| Documentation | 142 | 0 | 142 | 0% |
| **TOTAL** | **178** | **5** | **173** | **3%** |

---

## 🚀 Next Steps (Priority Order)

### Phase 1: Complete Critical Infrastructure
1. ✅ Add pnpm setup steps to all GitHub Actions workflows
2. ✅ Update Dockerfiles with corepack + pnpm
3. ✅ Update shell scripts with pnpm commands
4. ✅ Update JS/CJS scripts with pnpm logic

**Est. Time**: 4-6 hours

### Phase 2: Update User-Facing Documentation
1. ✅ Update installation guides
2. ✅ Update README.md
3. ✅ Update quick start guide
4. ✅ Update CONTRIBUTING.md

**Est. Time**: 2-3 hours

### Phase 3: Update Reference Documentation
1. ✅ Decide on `npm run` vs `pnpm` strategy
2. ✅ Update command reference docs
3. ✅ Update examples and demos
4. ✅ Update release notes

**Est. Time**: 4-5 hours

### Phase 4: Validation
1. ✅ Test CI/CD builds with pnpm
2. ✅ Test Docker builds
3. ✅ Test installation scripts
4. ✅ Verify documentation accuracy

**Est. Time**: 2-3 hours

---

## ✅ Validation Checklist

- [ ] All GitHub Actions workflows have pnpm setup
- [ ] All workflows use `pnpm install --frozen-lockfile`
- [ ] Dockerfiles use corepack + pnpm
- [ ] Shell scripts use pnpm commands
- [ ] JS/CJS scripts use pnpm in execSync calls
- [ ] Installation docs mention pnpm first
- [ ] No `package-lock.json` references in docs
- [ ] npm-publish workflow still uses `npm publish`
- [ ] CI builds pass
- [ ] Docker images build successfully

---

## 🔍 Automated Update Script

For bulk documentation updates, use this approach:

```bash
# Backup all docs
cp -r docs docs.backup

# Replace npm install patterns
find docs -name "*.md" -exec sed -i.bak 's/npm install -g/pnpm add -g/g' {} \;
find docs -name "*.md" -exec sed -i.bak 's/npm install --save-dev/pnpm add -D/g' {} \;
find docs -name "*.md" -exec sed -i.bak 's/npm install/pnpm install/g' {} \;

# Replace npm ci
find docs -name "*.md" -exec sed -i.bak 's/npm ci/pnpm install --frozen-lockfile/g' {} \;

# Clean up backup files
find docs -name "*.bak" -delete

# Review changes
git diff docs/
```

---

**Last Updated**: 2025-11-03 21:42 PST
**Status**: Migration 3% complete (Core + 2 workflows)
**Next Action**: Add pnpm setup to remaining 9 GitHub Actions workflows
