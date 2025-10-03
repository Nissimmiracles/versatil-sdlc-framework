# Get Started with VERSATIL SDLC Framework

🚀 **AI-Native Development Framework** with BMAD Methodology, RAG Memory, and Zero Context Loss

This guide will help you install and configure VERSATIL in **less than 5 minutes**.

---

## Quick Start (Recommended)

```bash
# 1. Install globally
npm install -g versatil-sdlc-framework

# 2. Run the setup wizard (optional)
versatil config wizard

# 3. Verify installation
versatil doctor

# 4. Initialize in your project
cd your-project
versatil init
```

**That's it!** The framework is ready to use. Agents will activate automatically as you work.

---

## Installation Options

### Option 1: Global Installation (Recommended)

Best for most users. Provides `versatil` command globally.

```bash
npm install -g versatil-sdlc-framework
```

**Verify:**
```bash
versatil --version
# Should show: VERSATIL SDLC Framework v3.0.0
```

### Option 2: Project-Local Installation

For project-specific installations or CI/CD environments.

```bash
cd your-project
npm install --save-dev versatil-sdlc-framework
```

**Use with:**
```bash
npx versatil --version
```

### Option 3: From GitHub Source

For contributors or cutting-edge features.

```bash
git clone https://github.com/MiraclesGIT/versatil-sdlc-framework.git
cd versatil-sdlc-framework
npm install
npm run build
npm link
```

---

## Platform-Specific Setup

### macOS / Linux

```bash
# Install
npm install -g versatil-sdlc-framework

# If you get permission errors, use one of these:
sudo npm install -g versatil-sdlc-framework
# OR (recommended - no sudo needed)
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g versatil-sdlc-framework
```

### Windows

**PowerShell (Recommended):**
```powershell
# Run our Windows installer
.\scripts\install.ps1

# Or use npm directly
npm install -g versatil-sdlc-framework
```

**CMD:**
```cmd
npm install -g versatil-sdlc-framework
```

**Note for Windows users:**
- Run PowerShell/CMD as Administrator for global installs
- Add npm global bin directory to PATH if `versatil` command not found

---

## First-Time Configuration

### Option 1: Interactive Wizard (Recommended)

The wizard will guide you through all preferences:

```bash
versatil config wizard
```

You'll be asked about:
- **Update behavior**: Auto, notify, or manual
- **Update channel**: Stable, beta, or alpha
- **Safety level**: Conservative, balanced, or fast
- **Backup settings**: Automatic backups before updates
- **Notifications**: What you want to be notified about
- **Telemetry**: Help improve the framework (anonymous data)

### Option 2: Use a Profile

Quick setup with pre-configured profiles:

```bash
# Conservative (maximum safety)
versatil config profile conservative

# Balanced (recommended for most users)
versatil config profile balanced

# Aggressive (latest features)
versatil config profile aggressive
```

### Option 3: Manual Configuration

Set individual preferences:

```bash
versatil config set updateBehavior notify
versatil config set updateChannel stable
versatil config set safetyLevel balanced
```

---

## Verify Installation

Run comprehensive health checks:

```bash
versatil doctor
```

**Expected output:**
```
🔍 VERSATIL Installation Verification

Checking: Framework directory exists... ✅
Checking: Framework directory is writable... ✅
Checking: versatil command available... ✅
Checking: Node.js version >= 18.0.0... ✅
Checking: npm is available... ✅
Checking: Core dependencies installed... ✅
Checking: Agent configurations present... ✅
Checking: Memory system initialized... ✅
Checking: Preferences file created... ✅
Checking: No project directory pollution... ✅

📊 Verification Results:
  ✅ Passed: 10
  ❌ Failed: 0
  ⚠️  Warnings: 0

✅ Installation verified successfully!
```

---

## Initialize in Your Project

Once installed, initialize the framework in your project:

```bash
cd your-project
versatil init
```

This will:
1. Detect your project type (React, Vue, Node.js, etc.)
2. Configure BMAD agents for your stack
3. Create `.versatil-project.json` (the ONLY file added to your project)
4. Set up quality gates and automation

**IMPORTANT:** The framework follows **strict isolation**:
- ✅ All framework data in `~/.versatil/` (your home directory)
- ✅ Only `.versatil-project.json` added to your project
- ✅ No framework pollution in your codebase
- ✅ Git-safe (won't commit framework files)

---

## Understanding Your Setup

### Where Things Are Stored

```
~/.versatil/                    # Framework home (NOT in your project)
├── agents/                     # Agent configurations
│   ├── maria-qa/
│   ├── james-frontend/
│   ├── marcus-backend/
│   ├── alex-ba/
│   ├── sarah-pm/
│   └── dr-ai-ml/
├── memory/                     # RAG memory (vector database)
├── logs/                       # Framework logs
├── preferences.json            # Your preferences
└── update-history.json         # Update history

your-project/
├── .versatil-project.json      # ONLY framework file (project config)
├── ... your code ...
```

### Configuration File Location

```bash
# View your preferences
cat ~/.versatil/preferences.json

# Edit preferences
versatil config show
versatil config set <key> <value>

# Reset to defaults
versatil config reset
```

---

## Meet the BMAD Agents

The framework includes **6 specialized agents** that work proactively:

### 1. **Maria-QA** 🧪 - Quality Guardian
- **Auto-activates on**: `*.test.*`, `__tests__/**`
- **Does**: Test coverage analysis, bug detection, quality validation
- **Example**: Edit `LoginForm.test.tsx` → Maria analyzes coverage automatically

### 2. **James-Frontend** 🎨 - UI/UX Expert
- **Auto-activates on**: `*.tsx`, `*.jsx`, `*.vue`, `*.css`
- **Does**: Accessibility checks (WCAG 2.1 AA), responsive design, performance
- **Example**: Edit `Button.tsx` → James validates accessibility on save

### 3. **Marcus-Backend** ⚙️ - API Architect
- **Auto-activates on**: `*.api.*`, `routes/**`, `controllers/**`
- **Does**: Security scans (OWASP Top 10), stress tests, < 200ms response time
- **Example**: Create `/api/users.ts` → Marcus generates security tests

### 4. **Sarah-PM** 📊 - Project Coordinator
- **Auto-activates on**: `*.md`, `docs/**`, project events
- **Does**: Sprint reports, milestone tracking, documentation
- **Example**: Update `README.md` → Sarah tracks project progress

### 5. **Alex-BA** 📋 - Requirements Analyst
- **Auto-activates on**: `requirements/**`, `*.feature`, issues
- **Does**: Extract requirements, create user stories, acceptance criteria
- **Example**: Create feature request → Alex generates user stories

### 6. **Dr.AI-ML** 🤖 - AI/ML Specialist
- **Auto-activates on**: `*.py`, `*.ipynb`, `models/**`
- **Does**: Model validation, performance monitoring, training optimization
- **Example**: Update ML model → Dr.AI validates and optimizes

**Key Point:** Agents work **automatically**. You don't need to call them manually.

---

## Essential Commands

### Framework Management

```bash
# Check version
versatil --version

# Health check
versatil doctor

# View help
versatil --help

# Show all commands
versatil help
```

### Updates

```bash
# Check for updates
versatil update check

# Install latest update
versatil update install

# View update status
versatil update status

# List available versions
versatil update list

# View changelog
versatil update changelog
```

### Rollback

```bash
# Rollback to previous version
versatil rollback previous

# List rollback points
versatil rollback list

# Rollback to specific version
versatil rollback to 3.0.0

# Validate current installation
versatil rollback validate
```

### Configuration

```bash
# Show current preferences
versatil config show

# Get specific preference
versatil config get updateBehavior

# Set preference
versatil config set updateBehavior notify

# Run wizard
versatil config wizard

# Apply profile
versatil config profile balanced

# Validate configuration
versatil config validate

# Export/import preferences
versatil config export ./my-config.json
versatil config import ./my-config.json
```

### Project Management

```bash
# Initialize framework in project
versatil init

# Analyze project for recommendations
versatil analyze

# List available agents
versatil agents

# View MCP server status
versatil mcp
```

---

## Update Channels

Choose how you receive updates:

### Stable (Recommended)
- Production-ready releases only
- Thoroughly tested
- Updated every few weeks

```bash
versatil config set updateChannel stable
```

### Beta
- Early access to new features
- Generally stable
- Updated weekly

```bash
versatil config set updateChannel beta
```

### Alpha
- Bleeding edge features
- May have bugs
- Updated frequently

```bash
versatil config set updateChannel alpha
```

**Change channel anytime:**
```bash
versatil config channel <stable|beta|alpha>
```

---

## Update Behavior

### Auto
Updates install automatically (use with caution).

```bash
versatil config set updateBehavior auto
```

### Notify (Recommended)
You're notified when updates are available. You approve before installation.

```bash
versatil config set updateBehavior notify
```

### Manual
You check for updates manually.

```bash
versatil config set updateBehavior manual
```

---

## Troubleshooting

### Command Not Found

**Problem:** `versatil: command not found`

**Solutions:**

1. **Check if installed:**
   ```bash
   npm list -g versatil-sdlc-framework
   ```

2. **Install if missing:**
   ```bash
   npm install -g versatil-sdlc-framework
   ```

3. **Check PATH (macOS/Linux):**
   ```bash
   echo $PATH | grep npm
   npm config get prefix
   ```

4. **Add to PATH if needed:**
   ```bash
   export PATH=$(npm config get prefix)/bin:$PATH
   # Add to ~/.bashrc or ~/.zshrc to make permanent
   ```

5. **Windows - Check PATH:**
   - Open System Properties → Environment Variables
   - Ensure npm global bin directory is in PATH
   - Restart terminal after changes

### Permission Errors (macOS/Linux)

**Problem:** `EACCES` permission denied

**Solution:**
```bash
# Option 1: Use npx (no installation)
npx versatil-sdlc-framework --version

# Option 2: Change npm global directory (recommended)
mkdir ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g versatil-sdlc-framework

# Option 3: Use sudo (not recommended)
sudo npm install -g versatil-sdlc-framework
```

### Framework Directory Issues

**Problem:** Framework not creating `~/.versatil/` directory

**Solution:**
```bash
# Manually create and verify
mkdir -p ~/.versatil
ls -la ~/.versatil

# Run verification
versatil doctor

# Check permissions
ls -ld ~/.versatil
# Should show: drwxr-xr-x (you have write access)
```

### Update Issues

**Problem:** Updates failing or interrupted

**Solution:**
```bash
# Check for interrupted updates
versatil update status

# Recover interrupted update
versatil update recover

# Force unlock if stuck
versatil update force-unlock

# Validate current installation
versatil rollback validate

# Rollback if needed
versatil rollback previous
```

### Health Check Failures

**Problem:** `versatil doctor` shows failures

**Solution:**
```bash
# Run doctor with verbose output
versatil doctor

# Check specific issues
versatil config validate
npm list -g versatil-sdlc-framework

# Reinstall if corrupted
npm uninstall -g versatil-sdlc-framework
npm install -g versatil-sdlc-framework
versatil config wizard
```

---

## Uninstallation

### Clean Removal

```bash
# Option 1: Use our uninstaller (recommended)
versatil-uninstall

# Option 2: Keep framework data
versatil-uninstall --keep-data

# Option 3: Manual removal
npm uninstall -g versatil-sdlc-framework
rm -rf ~/.versatil  # Removes all framework data
```

### What Gets Removed

- ✅ Global npm package
- ✅ Framework directory (`~/.versatil/`)
- ✅ All agent configurations
- ✅ RAG memory data
- ✅ User preferences
- ✅ Rollback backups

### What Stays Safe

- ✅ Your project code (framework never touches it)
- ✅ Git repositories
- ✅ Project-specific configs (`.versatil-project.json` if you want to keep it)

---

## Next Steps

### 1. Learn the Basics
- Read [CLAUDE.md](./CLAUDE.md) - Core methodology
- Read [QUICKSTART.md](./QUICKSTART.md) - Quick reference
- Explore [docs/](./docs/) - Detailed documentation

### 2. Configure for Your Workflow
```bash
# Run the wizard
versatil config wizard

# Or set up manually
versatil config set updateBehavior notify
versatil config set updateChannel stable
versatil config set safetyLevel balanced
```

### 3. Initialize in Your Project
```bash
cd your-project
versatil init
versatil analyze
```

### 4. Start Coding
Agents will activate automatically as you work! No manual intervention needed.

### 5. Join the Community
- **GitHub**: [MiraclesGIT/versatil-sdlc-framework](https://github.com/MiraclesGIT/versatil-sdlc-framework)
- **Issues**: Report bugs or request features
- **Discussions**: Share your experience

---

## Frequently Asked Questions

### Q: Do I need to run agents manually?
**A:** No! Agents activate automatically based on file patterns and context.

### Q: Where is framework data stored?
**A:** In `~/.versatil/` in your home directory. Never in your project.

### Q: Will the framework pollute my project?
**A:** No. Only `.versatil-project.json` is added to your project. Everything else is in `~/.versatil/`.

### Q: Can I use it in CI/CD?
**A:** Yes! The framework detects CI environments and uses automated configuration.

### Q: How do I update the framework?
**A:** Run `versatil update check` then `versatil update install`. Or enable auto-updates.

### Q: What if an update breaks something?
**A:** Run `versatil rollback previous` to instantly restore the previous version.

### Q: Is telemetry required?
**A:** No. You can disable it during setup or anytime with `versatil config set enableTelemetry false`.

### Q: Can I customize agent behavior?
**A:** Yes! Edit agent configs in `~/.versatil/agents/` or use `versatil config`.

### Q: Does it work with my IDE?
**A:** Yes! Works with Cursor, VS Code, and any IDE. Cursor integration is optimized.

### Q: Can I use it with multiple projects?
**A:** Yes! One framework installation works with unlimited projects.

---

## Support

### Get Help

- 📖 **Documentation**: [GitHub Wiki](https://github.com/MiraclesGIT/versatil-sdlc-framework/wiki)
- 🐛 **Report Bug**: [GitHub Issues](https://github.com/MiraclesGIT/versatil-sdlc-framework/issues)
- 💡 **Request Feature**: [GitHub Discussions](https://github.com/MiraclesGIT/versatil-sdlc-framework/discussions)
- 💬 **Ask Question**: [GitHub Discussions Q&A](https://github.com/MiraclesGIT/versatil-sdlc-framework/discussions/categories/q-a)

### Quick Help Commands

```bash
versatil --help          # General help
versatil <command> --help  # Command-specific help
versatil doctor          # Diagnose issues
versatil config show     # View current setup
```

---

## What's Next?

🎉 **You're ready to go!** The framework is installed and configured.

**Recommended next steps:**
1. ✅ Run `versatil doctor` to verify everything works
2. ✅ Run `versatil init` in your project
3. ✅ Start coding - agents will help automatically
4. ✅ Run `versatil update check` periodically
5. ✅ Star us on [GitHub](https://github.com/MiraclesGIT/versatil-sdlc-framework) ⭐

---

**Framework Version**: 3.0.0
**Last Updated**: 2025-01-03
**Maintained By**: VERSATIL Development Team
**License**: MIT

🚀 Happy coding with VERSATIL!
