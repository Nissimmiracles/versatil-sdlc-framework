# pnpm Migration Notice

**Date:** 2025-11-03
**Version:** v7.16.2+
**Audience:** Contributors and Framework Developers

---

## Summary

The VERSATIL Framework has migrated from npm to pnpm@10.17.0 for **internal development only**. This change **does not affect end users**.

---

## Impact by User Type

### ✅ End Users (No Action Required)

**If you use:**
- **npx installation** - No change needed
- **npm global install** - No change needed
- **Claude Desktop MCP** - No change needed
- **Cursor IDE integration** - No change needed

**Why?** The framework is published as a universal package to npm registry. It works with all package managers (npm, pnpm, yarn, bun).

**Installation commands remain the same:**
```bash
# npx (recommended)
npx --yes --package=github:Nissimmiracles/versatil-sdlc-framework#v7.16.2 versatil-mcp

# npm global install
npm install -g @versatil/sdlc-framework

# Both still work exactly as before
```

---

### 📝 Contributors & Developers (Action Required)

**If you contribute to the framework or run from source:**

**Old workflow:**
```bash
git clone https://github.com/Nissimmiracles/versatil-sdlc-framework.git
cd versatil-sdlc-framework
npm install
npm run build
```

**New workflow:**
```bash
git clone https://github.com/Nissimmiracles/versatil-sdlc-framework.git
cd versatil-sdlc-framework

# Install pnpm first (if not already installed)
npm install -g pnpm

# Then use pnpm for all operations
pnpm install
pnpm run build
pnpm test
```

**All npm scripts now use pnpm:**
- `pnpm run build` (instead of `npm run build`)
- `pnpm test` (instead of `npm test`)
- `pnpm run lint` (instead of `npm run lint`)

---

## What Changed

### Technical Changes
1. **Package Manager:** npm → pnpm@10.17.0
2. **Lock File:** package-lock.json → pnpm-lock.yaml
3. **Scripts:** 945+ references updated from npm to pnpm
4. **CI/CD:** GitHub Actions workflows updated to use pnpm

### Files Changed
- `package.json` - Updated engines and scripts (14 changes)
- `scripts/*.cjs` - Updated 51 utility scripts
- `docs/**/*.md` - Updated 144 documentation files
- `.github/workflows/*.yml` - Updated 4 CI/CD workflows

---

## Why pnpm?

**Benefits for Framework Development:**
- ✅ **Faster installs** - Up to 2x faster than npm
- ✅ **Disk space** - Content-addressable storage (shared between projects)
- ✅ **Strict** - Better dependency resolution and peer dependency handling
- ✅ **Security** - Prevents dependency hoisting issues
- ✅ **Monorepo-ready** - Better workspace support for future scaling

**Published packages remain universal** - Works with all package managers for end users.

---

## Migration Timeline

| Date | Milestone |
|------|-----------|
| 2025-10-28 | Initial migration (commit 1befb17) |
| 2025-11-03 | Complete migration (commit 33b3201) |
| 2025-11-03 | TypeScript fixes (commit ef0bd96) |
| 2025-11-03 | Documentation updates |

---

## Frequently Asked Questions

### Do I need to uninstall and reinstall?
**No.** If you use npx or npm global install, nothing changes.

### Will my Claude Desktop/Cursor config break?
**No.** Your config files use npx, which still works exactly the same.

### What if I have an existing local clone?
Delete `node_modules` and `package-lock.json`, then run `pnpm install`.

### Can I still use npm?
**For end users:** Yes, npm still works for global installs from the registry.
**For contributors:** No, use pnpm for development to match the team workflow.

### Will the next update auto-work?
**Yes.** The next npm/npx update will work seamlessly. The package is built with pnpm but published to npm registry as a universal package.

---

## Resources

- **pnpm Documentation:** https://pnpm.io/
- **Installation Guide:** [docs/INSTALLATION.md](docs/INSTALLATION.md)
- **Contributing Guide:** [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **Migration Commit:** [33b3201](https://github.com/Nissimmiracles/versatil-sdlc-framework/commit/33b3201)

---

## Questions?

Open an issue: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues

---

**TL;DR:** Users don't need to do anything. Contributors should use `pnpm` instead of `npm` for development.
