# 🚀 VERSATIL SDLC Framework - 5-Minute Quickstart

**Get started with AI-native development in 5 minutes!**

---

## Prerequisites

- Node.js 18+ installed
- Claude Code (VSCode extension or CLI)
- Git (optional)

---

## 🎯 Installation (2 minutes)

### Step 1: Clone or Install Framework

```bash
# Option A: Clone from GitHub
git clone https://github.com/your-org/versatil-sdlc-framework.git
cd versatil-sdlc-framework

# Option B: Install as npm package (when published)
npm install -g versatil-sdlc-framework
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build Framework

```bash
npm run build
```

**✅ Installation Complete!** Framework is now ready to use.

---

## 🧪 Verify Installation (1 minute)

### Test 1: Run Health Check

```bash
npm run recover
```

**Expected Output:**
```
✅ No issues detected - Framework is healthy!
```

### Test 2: Check Isolation

Framework data lives in `~/.versatil/`, not in your project. Verify:

```bash
ls -la ~/.versatil/
```

**Expected Output:**
```
agents/  backups/  cache/  config/  logs/  memory/
```

---

## 🎨 First Agent Test (2 minutes)

### Open Claude Code

If using VSCode:
1. Open Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: "Claude Code"
3. Start new session

### Test Maria-QA (Quality Agent)

In Claude Code, type:

```
/maria-qa check code quality
```

**Expected Output:**
- Maria-QA activates
- Runs code quality checks
- Shows test coverage analysis
- Provides quality recommendations

### Test Quick Validation

```
/framework:doctor
```

**Expected Output:**
```
✅ Framework properly isolated
✅ All agents configured
✅ Hooks functional
Health: 9/10 (Excellent)
```

---

## 🎓 What Just Happened?

You've successfully:

1. ✅ Installed VERSATIL SDLC Framework
2. ✅ Verified framework isolation (no project pollution)
3. ✅ Activated your first agent (Maria-QA)
4. ✅ Ran health diagnostics

---

## 🚀 Next Steps

### Try More Agents

```bash
# Frontend UI expert
/james-frontend optimize this React component

# Backend API expert
/marcus-backend review API security

# Project coordinator
/sarah-pm generate sprint report

# Business analyst
/alex-ba extract requirements from this document

# AI/ML specialist
/dr-ai-ml validate model performance
```

### Enable Proactive Mode

Agents can work **automatically** without slash commands!

**How it works:**
- Edit a `.test.ts` file → Maria-QA auto-activates
- Edit a `.tsx` component → James-Frontend auto-activates
- Edit API route → Marcus-Backend auto-activates

**Already configured in:** [.cursor/settings.json:178-310](.cursor/settings.json#L178-L310)

**Test it:**
1. Open any test file (e.g., `tests/example.test.ts`)
2. Make a change and save
3. Watch statusline for Maria-QA activity

### Explore Documentation

- **Full Documentation**: [CLAUDE.md](./CLAUDE.md)
- **Agent Details**: [.claude/AGENTS.md](./.claude/AGENTS.md)
- **5-Rule System**: [.claude/rules/README.md](./.claude/rules/README.md)
- **Slash Commands**: [.claude/commands/](./.claude/commands/)

---

## ❓ Troubleshooting

### Issue: `npm run build` fails

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Framework not isolated

**Solution:**
```bash
# Auto-fix isolation violations
npm run recover
```

### Issue: Agent not activating

**Solution:**
```bash
# Check agent configuration
ls -la .claude/agents/

# Run debug diagnostics
/framework:debug
```

### Issue: Tests failing

**Solution:**
```bash
# Check test suite
npm test

# View detailed errors
npm run test:coverage
```

### Get Help

If issues persist:

1. **Generate Debug Report:**
   ```
   /framework:debug
   ```

2. **Run Recovery:**
   ```bash
   npm run recover
   ```

3. **Report Issue:**
   - Open GitHub issue: [github.com/your-org/versatil-sdlc-framework/issues](https://github.com/your-org/versatil-sdlc-framework/issues)
   - Attach `versatil-debug-report.json`
   - Include `VERSATIL_DEBUG_REPORT.md`

---

## 🎯 Quick Reference Card

```bash
# Health & Diagnostics
npm run recover                # Auto-fix framework issues
/framework:doctor              # Health check
/framework:debug               # Generate debug report

# Agent Activation (Slash Commands)
/maria-qa [task]               # Quality assurance
/james-frontend [task]         # UI/UX development
/marcus-backend [task]         # API/backend
/sarah-pm [task]               # Project management
/alex-ba [task]                # Business analysis
/dr-ai-ml [task]               # AI/ML tasks

# Framework Validation
/framework:validate            # Validate isolation & config
npm run validate:isolation     # Check isolation only

# Testing
npm test                       # Run unit tests
npm run test:coverage          # With coverage
npm run test:e2e               # End-to-end tests

# Development
npm run build                  # Compile TypeScript
npm run build:watch            # Watch mode
npm run dev                    # Dev mode

# Security
npm run security:start         # Start security daemon
npm run security:test          # Run security tests
```

---

## 🎉 You're Ready!

The VERSATIL SDLC Framework is now active. Your AI-powered development team is ready to assist.

**What makes VERSATIL different:**
- 🤖 **6 Specialized Agents** - Each expert in their domain
- 🔄 **Proactive Intelligence** - Agents work automatically
- 🧠 **Zero Context Loss** - RAG + Claude memory integration
- 🔒 **Isolated Architecture** - No project pollution
- ⚡ **3x Faster Development** - Parallel task execution
- 🎯 **Quality-First** - Automated testing & validation

**Time to Installation:** ~5 minutes ✅
**Time to First Agent:** ~2 minutes ✅
**Time to Production:** Start building! 🚀

---

**Version:** 2.0.0
**Last Updated:** 2025-09-30
**Support:** [GitHub Issues](https://github.com/your-org/versatil-sdlc-framework/issues)
**Documentation:** [CLAUDE.md](./CLAUDE.md)
**License:** MIT