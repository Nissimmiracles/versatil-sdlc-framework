# VERSATIL SDLC Framework - GitHub Repository & Branch Strategy

## 🎯 Objective

Isolate what we use to **develop the framework** from what users will **install/clone for their projects**.

---

## 🏗️ Repository Structure (Best Practice)

### Option 1: Monorepo with Two Branches (RECOMMENDED)

```
Repository: versatil-sdlc-framework

Branches:
├── develop/          # Framework development (PRIVATE - what we build)
├── main/             # Public release (PUBLIC - what users clone)
└── release/*         # Release candidates
```

**Advantages**:
- Single repository to manage
- Clear separation between development and release
- Easy to cherry-pick features from develop → main
- Users clone `main` branch by default

**Branch Strategy**:

```yaml
develop/:
  purpose: "Framework development - all new features go here"
  visibility: Private (until ready for public)
  contains:
    - Full source code with comments
    - Development scripts (scripts/*)
    - Internal documentation
    - Test infrastructure (tests/*)
    - Build configurations
    - Supabase Edge Functions (supabase/*)
    - RAG implementation details
    - All .versatil/ framework files

  workflow:
    - Feature branches merge here
    - All tests must pass
    - Code review required
    - Continuous integration runs

main/:
  purpose: "Public release - what users install"
  visibility: Public
  contains:
    - Compiled/transpiled code (dist/)
    - User-facing documentation
    - Installation scripts
    - Public API only
    - Examples and templates
    - Quick start guide

  workflow:
    - Only accept merges from develop/ via release PR
    - Must pass all quality gates
    - Semantic versioning tags (v1.0.0, v2.0.0)
    - Published to npm as @versatil/sdlc-framework

release/*:
  purpose: "Release candidates before merging to main"
  examples: release/v2.0.0, release/v2.1.0
  workflow:
    - Branch from develop/
    - Final testing and QA
    - Documentation review
    - If approved → merge to main + tag
    - If issues → fix and re-test
```

---

### Option 2: Separate Repositories (ALTERNATIVE)

```
Organization: versatil-sdlc

Repositories:
├── versatil-framework (PRIVATE)     # Framework development
└── versatil-sdlc (PUBLIC)           # Public release
```

**Advantages**:
- Complete separation (cleaner)
- Different permissions (framework team vs. community)
- Easier to manage secrets (framework repo has all credentials)
- Public repo shows only production-ready code

**Disadvantages**:
- Need to sync between repos
- More complex release process
- Harder to track changes

---

## 📂 Directory Structure (What Goes Where)

### Development Repository/Branch (develop/)

```
versatil-sdlc-framework (develop branch)
├── .github/
│   ├── workflows/
│   │   ├── ci-develop.yml              # CI for development
│   │   ├── build-and-test.yml
│   │   └── publish-to-npm.yml
│   └── CODEOWNERS                      # Framework team
│
├── .cursor/                            # Development configuration
│   ├── settings.json
│   ├── mcp_config.json
│   └── rules/
│
├── src/                                # Full source code
│   ├── agents/                         # All agent implementations
│   │   ├── enhanced-maria.ts
│   │   ├── enhanced-james.ts
│   │   ├── enhanced-marcus.ts
│   │   ├── introspective-agent.ts
│   │   └── ... (all internal agents)
│   │
│   ├── rag/                            # RAG implementation
│   │   ├── enhanced-vector-memory-store.ts
│   │   ├── bidirectional-sync.ts
│   │   ├── pattern-learning-system.ts
│   │   ├── continuous-web-learning.ts
│   │   └── ... (all RAG systems)
│   │
│   ├── orchestration/                  # Internal orchestration
│   │   ├── ai-era-dev-orchestrator.ts
│   │   ├── agent-rag-sync.ts
│   │   └── parallel-task-manager.ts
│   │
│   ├── testing/                        # Testing infrastructure
│   ├── monitoring/
│   ├── security/
│   └── ... (all framework internals)
│
├── tests/                              # Full test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                            # Development scripts
│   ├── build-framework.cjs
│   ├── deploy-supabase.sh
│   ├── run-migrations.sh
│   └── ... (internal tooling)
│
├── supabase/                           # Supabase Edge Functions
│   ├── functions/
│   │   ├── maria-rag/
│   │   ├── james-rag/
│   │   └── marcus-rag/
│   └── migrations/
│
├── docs/                               # Internal documentation
│   ├── DEVELOPMENT.md
│   ├── ARCHITECTURE.md
│   ├── RAG-IMPLEMENTATION.md
│   └── ... (developer docs)
│
├── .versatil/                          # Framework internal data
│   ├── agents/
│   ├── rules/
│   └── templates/
│
├── CLAUDE.md                           # Framework development guide
├── package.json                        # All dependencies
├── tsconfig.json                       # TypeScript config
└── jest.config.cjs                     # Test configuration
```

### Public Repository/Branch (main/)

```
versatil-sdlc-framework (main branch)
├── .github/
│   ├── workflows/
│   │   └── ci-public.yml               # CI for public releases
│   └── ISSUE_TEMPLATE/
│
├── dist/                               # Compiled/transpiled code
│   ├── agents/                         # Public agent interfaces only
│   ├── core/                           # Core public API
│   ├── testing-patterns/               # Dependency injection patterns
│   └── index.js                        # Main entry point
│
├── templates/                          # User project templates
│   ├── express-typescript/
│   ├── react-nextjs/
│   └── python-fastapi/
│
├── examples/                           # Example projects
│   ├── getting-started/
│   ├── advanced-rag/
│   └── multi-agent-workflow/
│
├── docs/                               # User documentation
│   ├── README.md                       # Main documentation
│   ├── GETTING_STARTED.md
│   ├── API_REFERENCE.md
│   ├── CONFIGURATION.md
│   └── TROUBLESHOOTING.md
│
├── .versatil-project.json              # Example project config
├── package.json                        # Production dependencies only
├── LICENSE                             # MIT License
└── CONTRIBUTING.md                     # How to contribute
```

---

## 🔒 What to Keep Private vs. Public

### PRIVATE (develop/ branch only) ❌

1. **Internal Implementation Details**
   - RAG implementation internals
   - Supabase Edge Function code
   - Continuous web learning scraper
   - Pattern learning algorithms
   - Connection pool implementation
   - LRU cache internals

2. **Development Infrastructure**
   - Test infrastructure code
   - Build scripts
   - Deployment automation
   - Migration scripts
   - Internal monitoring

3. **Secrets & Configuration**
   - Supabase credentials
   - API keys for web scraping
   - MCP server configurations
   - Development environment variables

4. **Internal Documentation**
   - Architecture decision records
   - Development planning docs
   - Performance optimization notes
   - Internal brainstorming

### PUBLIC (main/ branch) ✅

1. **Compiled/Dist Code**
   - Transpiled JavaScript (from TypeScript)
   - Minified production builds
   - Public API interfaces
   - Type definitions (.d.ts files)

2. **User-Facing Documentation**
   - Getting started guide
   - API reference
   - Configuration guide
   - Examples and tutorials
   - Best practices

3. **Templates & Examples**
   - Project scaffolding templates
   - Example integrations
   - Sample configurations
   - Demo applications

4. **Public Testing Utilities**
   - Dependency injection patterns
   - Test helper functions
   - Mock data generators
   - Testing best practices

---

## 🚀 Release Workflow (develop/ → main/)

### Step 1: Development (On develop/ branch)

```bash
# Developer workflow
git checkout develop
git checkout -b feature/bidirectional-rag
# ... implement feature ...
git add .
git commit -m "feat: Add bidirectional RAG sync"
git push origin feature/bidirectional-rag

# Create PR to develop/
# → Code review
# → Tests pass
# → Merge to develop/
```

### Step 2: Release Preparation (release/ branch)

```bash
# When ready for public release
git checkout develop
git checkout -b release/v2.0.0

# 1. Run build process (create dist/)
npm run build:public

# What build:public does:
# - Transpile TypeScript → JavaScript
# - Bundle public APIs only
# - Minify code
# - Generate .d.ts files
# - Copy user-facing docs
# - Create templates

# 2. Update version
npm version 2.0.0

# 3. Run full test suite
npm test

# 4. Generate changelog
npm run changelog

# 5. Create release PR
git add dist/ docs/ package.json CHANGELOG.md
git commit -m "chore: Release v2.0.0"
git push origin release/v2.0.0

# Create PR: release/v2.0.0 → main
```

### Step 3: QA & Review (On release/ branch)

```yaml
Release Checklist:
  - ✅ All tests passing (133/133)
  - ✅ Documentation reviewed
  - ✅ Examples tested
  - ✅ Breaking changes documented
  - ✅ Migration guide created (if needed)
  - ✅ Security audit passed
  - ✅ Performance benchmarks acceptable
  - ✅ License headers present
  - ✅ Dependencies vetted
  - ✅ No secrets in dist/
```

### Step 4: Publish (Merge to main/)

```bash
# After PR approved
git checkout main
git merge release/v2.0.0 --no-ff

# Tag release
git tag -a v2.0.0 -m "Release v2.0.0: RAG 100% Intelligence System"
git push origin main --tags

# Publish to npm
npm publish

# Create GitHub release
gh release create v2.0.0 \
  --title "v2.0.0 - RAG 100% Intelligence System" \
  --notes-file CHANGELOG.md

# Update develop/ with any release fixes
git checkout develop
git merge main
git push origin develop
```

---

## 📦 Package Structure (What Users Install)

### package.json (Public Release)

```json
{
  "name": "@versatil/sdlc-framework",
  "version": "2.0.0",
  "description": "AI-Native SDLC Framework with Intelligent RAG",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/",
    "templates/",
    "examples/",
    "docs/",
    "LICENSE",
    "README.md"
  ],
  "scripts": {
    "postinstall": "node dist/postinstall.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.20.0"
  },
  "peerDependencies": {
    "typescript": ">=5.0.0"
  },
  "keywords": [
    "sdlc",
    "ai",
    "rag",
    "agents",
    "development",
    "framework"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/versatil-sdlc/versatil-framework.git",
    "directory": "main"
  },
  "license": "MIT"
}
```

### What Gets Installed

```bash
# User runs:
npm install @versatil/sdlc-framework

# They get:
node_modules/@versatil/sdlc-framework/
├── dist/                    # Compiled framework
├── templates/               # Project templates
├── examples/                # Example code
├── docs/                    # Documentation
└── package.json
```

---

## 🔧 Build Process (develop/ → main/)

### `scripts/build-public.cjs`

```javascript
/**
 * Build script to prepare public release
 * Transforms framework development code → user-installable package
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function buildPublic() {
  console.log('🏗️  Building public release...');

  // 1. Clean dist/ directory
  await fs.emptyDir('dist');

  // 2. Transpile TypeScript
  console.log('📝 Transpiling TypeScript...');
  execSync('tsc -p tsconfig.public.json', { stdio: 'inherit' });

  // 3. Bundle public APIs only
  console.log('📦 Bundling public APIs...');
  const publicExports = {
    // Core public APIs
    agents: [
      'src/agents/base-agent.ts',
      'src/agents/enhanced-maria.ts',   // Export interface, not implementation
      'src/agents/enhanced-james.ts',
      'src/agents/enhanced-marcus.ts'
    ],
    testing: [
      'src/agents/introspective-agent.ts'  // Export test patterns
    ],
    rag: [
      'src/rag/enhanced-vector-memory-store.ts'  // Public API only
    ]
  };

  // Only copy public-facing code
  for (const [category, files] of Object.entries(publicExports)) {
    for (const file of files) {
      await copyToPublic(file, category);
    }
  }

  // 4. Generate type definitions
  console.log('📚 Generating type definitions...');
  execSync('tsc --emitDeclarationOnly -p tsconfig.public.json', { stdio: 'inherit' });

  // 5. Copy documentation
  console.log('📄 Copying documentation...');
  await fs.copy('docs/public', 'dist/docs');
  await fs.copy('README.md', 'dist/README.md');
  await fs.copy('LICENSE', 'dist/LICENSE');

  // 6. Copy templates
  console.log('📁 Copying templates...');
  await fs.copy('templates', 'dist/templates');

  // 7. Copy examples
  console.log('💡 Copying examples...');
  await fs.copy('examples', 'dist/examples');

  // 8. Create public package.json
  const packageJson = await fs.readJson('package.json');
  const publicPackage = {
    ...packageJson,
    main: 'index.js',
    types: 'index.d.ts',
    // Remove dev dependencies
    devDependencies: undefined,
    scripts: {
      postinstall: 'node postinstall.js'
    }
  };
  await fs.writeJson('dist/package.json', publicPackage, { spaces: 2 });

  // 9. Verify no secrets in dist/
  console.log('🔒 Verifying no secrets...');
  await verifyNoSecrets('dist');

  console.log('✅ Public build complete!');
}

async function copyToPublic(file, category) {
  const content = await fs.readFile(file, 'utf-8');

  // Strip internal comments
  const cleaned = content.replace(/\/\* INTERNAL:.*?\*\//gs, '');

  // Write to dist/
  const distPath = path.join('dist', category, path.basename(file, '.ts') + '.js');
  await fs.ensureDir(path.dirname(distPath));
  await fs.writeFile(distPath, cleaned);
}

async function verifyNoSecrets(dir) {
  const secretPatterns = [
    /SUPABASE_KEY/,
    /API_KEY/,
    /SECRET/,
    /PASSWORD/,
    /TOKEN/
  ];

  const files = await fs.readdir(dir, { recursive: true });
  for (const file of files) {
    const content = await fs.readFile(path.join(dir, file), 'utf-8');
    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        throw new Error(`Secret found in ${file}: ${pattern}`);
      }
    }
  }
}

buildPublic().catch(console.error);
```

---

## 🎯 User Experience (What They Install)

### Installation

```bash
# Users install from npm
npm install @versatil/sdlc-framework

# Or clone from GitHub (main branch)
git clone https://github.com/versatil-sdlc/versatil-framework.git
cd versatil-framework
npm install
```

### Initialization

```bash
# Create new project with VERSATIL
npx @versatil/create-project my-app

# Or add to existing project
cd my-existing-app
npx versatil init
```

### What Users See

```
my-app/
├── node_modules/
│   └── @versatil/sdlc-framework/      # Installed package
│       ├── dist/                       # Compiled code
│       ├── docs/                       # User docs
│       └── templates/
│
├── .versatil-project.json              # User's project config
├── package.json
└── src/
    └── ... (user's code)
```

### What Users DON'T See

- ❌ Framework source code (src/)
- ❌ Internal RAG implementation details
- ❌ Supabase Edge Functions
- ❌ Test infrastructure
- ❌ Build scripts
- ❌ Development documentation
- ❌ Internal agent implementations

---

## 🔐 Security & Permissions

### Repository Permissions

```yaml
versatil-sdlc-framework (Single Repo, Two Branches):

  develop/:
    visibility: Private
    permissions:
      - Framework core team: Admin
      - Contributors: Write (via PR)
      - Public: No access

  main/:
    visibility: Public
    permissions:
      - Framework core team: Admin
      - Contributors: Read + PR
      - Public: Read + Fork

  Protected Branches:
    - develop/: Require PR + 2 approvals
    - main/: Require PR + 3 approvals + passing tests
```

### Secrets Management

```yaml
GitHub Secrets (for CI/CD):
  - SUPABASE_URL
  - SUPABASE_KEY
  - NPM_TOKEN (for publishing)
  - GITHUB_TOKEN (for releases)

Never in Code:
  - API keys
  - Database credentials
  - Supabase service role keys
  - Web scraping credentials
```

---

## 📊 Maintenance Strategy

### Daily

```bash
# Automated via GitHub Actions
- Run tests on develop/
- Security scans
- Dependency updates (Dependabot)
```

### Weekly

```bash
# Manual
- Review open PRs
- Triage issues
- Update roadmap
```

### Monthly

```bash
# Release cycle
- Freeze develop/ (no new features)
- Create release/ branch
- QA testing
- Documentation review
- Publish to main/
- Tag release
- Publish to npm
```

---

## 🎓 Best Practices Summary

1. ✅ **Keep develop/ private** until features are production-ready
2. ✅ **Only publish dist/ to main/**, never source code
3. ✅ **Semantic versioning** (v2.0.0, v2.1.0, v2.1.1)
4. ✅ **Changelog** for every release
5. ✅ **Security audit** before publishing
6. ✅ **No secrets** in public branch
7. ✅ **Comprehensive docs** for users
8. ✅ **Examples and templates** to get started quickly
9. ✅ **Clear contribution guidelines**
10. ✅ **Responsive issue triage**

---

## 🚀 Next Actions

### Immediate (Week 1)

1. Create `develop/` branch from current state
2. Rename current `main` to `develop-backup` (safety)
3. Create new empty `main` branch
4. Write `scripts/build-public.cjs` script
5. Test build process locally
6. Document branch strategy in CONTRIBUTING.md

### Short Term (Week 2)

1. Set up GitHub Actions for develop/
2. Create release/ branch workflow
3. Write user-facing documentation
4. Create example projects
5. Test npm publish process (dry run)

### Long Term (Weeks 3-4)

1. First public release (v2.0.0)
2. Publish to npm
3. Create GitHub release page
4. Announce on community channels
5. Monitor feedback and iterate

---

**Document Created**: 2025-09-30
**Purpose**: Organize GitHub repository for framework development vs. public release
**Status**: Ready for Implementation
**Next Step**: Create develop/ branch and build pipeline