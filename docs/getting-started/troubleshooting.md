# Installation Troubleshooting Guide

**VERSATIL SDLC Framework v4.1.0** - Complete Installation Reference

This guide helps diagnose and fix installation issues, PATH problems, and command availability errors.

---

## 🎯 Quick Diagnosis

```bash
# Test installation
versatil --version

# Expected output:
# VERSATIL SDLC Framework v4.1.0

# If you get "command not found", jump to PATH Issues section
```

---

## 📋 Table of Contents

1. [Installation Methods](#installation-methods)
2. [Common Installation Issues](#common-installation-issues)
3. [PATH Configuration](#path-configuration)
4. [Platform-Specific Issues](#platform-specific-issues)
5. [Verification Commands](#verification-commands)
6. [Uninstall & Reinstall](#uninstall--reinstall)
7. [Offline Installation](#offline-installation)

---

## Installation Methods

### Method 1: Global Installation (Recommended)

```bash
# Install globally with npm
npm install -g @versatil/sdlc-framework

# Verify installation
versatil --version
which versatil

# Initialize in your project
cd /path/to/your/project
versatil init
```

**Advantages**:
- ✅ Available from any directory
- ✅ Single installation for all projects
- ✅ Easy updates

**Requirements**:
- Node.js >= 18.0.0
- npm >= 9.0.0
- Write permissions to global npm directory

---

### Method 2: Project-Local Installation

```bash
# Install as dev dependency
npm install --save-dev @versatil/sdlc-framework

# Add to package.json scripts
{
  "scripts": {
    "versatil": "versatil",
    "versatil:init": "versatil init",
    "versatil:doctor": "versatil doctor"
  }
}

# Run via npm
pnpm run versatil -- --version
pnpm run versatil:init
```

**Advantages**:
- ✅ Version locked per-project
- ✅ No global permissions needed
- ✅ Works in CI/CD

**Disadvantages**:
- ❌ Must use `npm run` prefix
- ❌ Separate installation per project

---

### Method 3: npx (One-Time Use)

```bash
# Run without installation
npx @versatil/sdlc-framework init
npx @versatil/sdlc-framework doctor

# Always uses latest version
```

**Use Case**: Testing framework before committing to installation

---

## Common Installation Issues

### Issue 1: "Command Not Found" After Global Install

**Symptoms**:
```bash
$ npm install -g @versatil/sdlc-framework
# Installation succeeds

$ versatil --version
# bash: versatil: command not found
```

**Cause**: npm global bin directory not in PATH

**Diagnosis**:
```bash
# Find where npm installs global packages
npm config get prefix
# Example output: /usr/local

# Check if bin directory is in PATH
echo $PATH | grep -o '/usr/local/bin'
# Should output: /usr/local/bin

# Find where versatil was installed
npm list -g @versatil/sdlc-framework
```

**Fix**:

#### macOS/Linux:

```bash
# Step 1: Find npm global bin directory
NPM_BIN=$(npm config get prefix)/bin

# Step 2: Add to PATH in your shell config
# For bash (~/.bashrc or ~/.bash_profile):
echo "export PATH=\"$NPM_BIN:\$PATH\"" >> ~/.bashrc
source ~/.bashrc

# For zsh (~/.zshrc):
echo "export PATH=\"$NPM_BIN:\$PATH\"" >> ~/.zshrc
source ~/.zshrc

# For fish (~/.config/fish/config.fish):
echo "set -gx PATH $NPM_BIN \$PATH" >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish

# Step 3: Verify
versatil --version
```

#### Windows:

```powershell
# Find npm global bin directory
npm config get prefix
# Example output: C:\Users\YourName\AppData\Roaming\npm

# Add to PATH:
# 1. Search "Environment Variables" in Start Menu
# 2. Click "Environment Variables" button
# 3. Under "User variables", select "Path"
# 4. Click "Edit"
# 5. Click "New"
# 6. Add: C:\Users\YourName\AppData\Roaming\npm
# 7. Click "OK" on all dialogs
# 8. Restart terminal

# Verify
versatil --version
```

---

### Issue 2: Permission Denied During Installation

**Symptoms**:
```bash
$ npm install -g @versatil/sdlc-framework
# EACCES: permission denied, mkdir '/usr/local/lib/node_modules/@versatil'
```

**Cause**: No write permissions to global npm directory

**Fix**:

#### Option A: Use Node Version Manager (Recommended)

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then:
nvm install 20
nvm use 20

# Now install without sudo
npm install -g @versatil/sdlc-framework
```

#### Option B: Change npm Default Directory

```bash
# Create directory for global packages
mkdir -p ~/.npm-global

# Configure npm to use new directory
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Install without sudo
npm install -g @versatil/sdlc-framework
```

#### Option C: Use sudo (Not Recommended)

```bash
# Only if you understand the security implications
sudo npm install -g @versatil/sdlc-framework
```

---

### Issue 3: Multiple Binary Commands Confusion

**Symptoms**:
```bash
$ versatil-sdlc --version
# Command not found

$ versatil --version
# Works
```

**Cause**: Legacy binary naming (v4.0.0 had multiple commands)

**Current v4.1.0 Commands**:
- ✅ `versatil` - Main CLI (use this)
- ✅ `versatil-mcp` - MCP server (separate use case)

**Removed in v4.1.0**:
- ❌ `versatil-sdlc` (consolidated into `versatil`)
- ❌ `versatil-update` (now `versatil update`)
- ❌ `versatil-rollback` (now `versatil rollback`)
- ❌ `versatil-config` (now `versatil config`)

**Fix**: Always use `versatil` for CLI commands

---

### Issue 4: Old Version Installed

**Symptoms**:
```bash
$ versatil --version
# 3.5.0  (old version)

# But you want v4.1.0
```

**Diagnosis**:
```bash
# Check installed version
npm list -g @versatil/sdlc-framework

# Check latest available version
npm view @versatil/sdlc-framework version
```

**Fix**:
```bash
# Update to latest
pnpm update -g @versatil/sdlc-framework

# Or uninstall and reinstall
npm uninstall -g @versatil/sdlc-framework
npm install -g @versatil/sdlc-framework

# Verify
versatil --version
```

---

### Issue 5: Installation Fails with Network Errors

**Symptoms**:
```bash
$ npm install -g @versatil/sdlc-framework
# npm ERR! network timeout
# npm ERR! network This is a problem related to network connectivity
```

**Diagnosis**:
```bash
# Test npm registry connectivity
npm ping

# Check npm registry
npm config get registry
```

**Fix**:

#### Option A: Retry with Increased Timeout

```bash
npm install -g @versatil/sdlc-framework --fetch-timeout=60000
```

#### Option B: Use Different Registry

```bash
# Try different npm registry
npm config set registry https://registry.npmjs.org/
npm install -g @versatil/sdlc-framework
```

#### Option C: Use Proxy (if behind corporate firewall)

```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

npm install -g @versatil/sdlc-framework
```

---

### Issue 6: Node.js Version Too Old

**Symptoms**:
```bash
$ npm install -g @versatil/sdlc-framework
# npm ERR! engine Unsupported engine
# npm ERR! Required: {"node":">=18.0.0"}
```

**Diagnosis**:
```bash
# Check current Node.js version
node --version
# Example: v16.14.0 (too old)
```

**Fix**:

#### macOS/Linux:

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should be >= v18.0.0
```

#### Windows:

```bash
# Download from nodejs.org
# https://nodejs.org/en/download/

# Or use nvm-windows
# https://github.com/coreybutler/nvm-windows

# Verify
node --version
```

---

## PATH Configuration

### Understanding PATH

The PATH environment variable tells your shell where to find executable commands.

**Check current PATH**:
```bash
echo $PATH
# Example output:
# /usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

**Check if versatil is in PATH**:
```bash
which versatil
# Expected: /usr/local/bin/versatil
# If empty: versatil not in PATH
```

---

### Fix PATH Issues

#### Temporary Fix (Current Session Only)

```bash
# Add npm bin to PATH for current session
export PATH="$(npm config get prefix)/bin:$PATH"

# Test
versatil --version
```

#### Permanent Fix (All Sessions)

**Bash** (~/.bashrc or ~/.bash_profile):
```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Zsh** (~/.zshrc):
```bash
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Fish** (~/.config/fish/config.fish):
```bash
echo 'set -gx PATH (npm config get prefix)/bin $PATH' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

---

## Platform-Specific Issues

### macOS

#### Issue: Gatekeeper Blocking Execution

**Symptoms**:
```bash
$ versatil init
# "versatil" cannot be opened because the developer cannot be verified
```

**Fix**:
```bash
# Remove quarantine attribute
xattr -d com.apple.quarantine $(which versatil)

# Or allow in System Preferences
# System Preferences → Security & Privacy → General → "Allow Anyway"
```

#### Issue: Homebrew Node vs System Node Conflict

**Diagnosis**:
```bash
# Check which node is being used
which node
# /usr/local/bin/node (Homebrew)
# /usr/bin/node (System)

# Check npm prefix
npm config get prefix
```

**Fix**: Use consistent Node.js installation (prefer Homebrew or nvm)

```bash
# Uninstall conflicting versions
brew uninstall node

# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
```

---

### Linux

#### Issue: npm Command Not Found

**Fix**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm

# Arch Linux
sudo pacman -S nodejs npm

# Verify
node --version
npm --version
```

#### Issue: Insufficient Permissions on /usr/local

**Fix**:
```bash
# Option 1: Change ownership (if you're the only user)
sudo chown -R $(whoami) /usr/local

# Option 2: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
```

---

### Windows

#### Issue: PowerShell Execution Policy

**Symptoms**:
```powershell
versatil : File C:\Users\...\versatil.ps1 cannot be loaded because running scripts is disabled
```

**Fix**:
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verify
Get-ExecutionPolicy
```

#### Issue: Path Spaces Breaking Commands

**Fix**: Use quotes for paths with spaces
```powershell
# Wrong
cd C:\Program Files\My Project
versatil init

# Correct
cd "C:\Program Files\My Project"
versatil init
```

#### Issue: npm Not in PATH After Node.js Install

**Fix**:
```powershell
# Add to PATH manually
$env:Path += ";C:\Program Files\nodejs"

# Permanent (Environment Variables):
# Settings → System → About → Advanced system settings
# → Environment Variables → Path → Edit
# → Add: C:\Program Files\nodejs
```

---

## Verification Commands

### Complete Installation Check

```bash
# Run comprehensive check
versatil doctor:install

# Expected output:
# ✅ Node.js version: 20.10.0 (>= 18.0.0 required)
# ✅ npm version: 10.2.3 (>= 9.0.0 required)
# ✅ VERSATIL installed: 4.1.0
# ✅ Command in PATH: /usr/local/bin/versatil
# ✅ Global npm directory: /usr/local/lib/node_modules
# ✅ Write permissions: OK
```

### Manual Verification Steps

```bash
# 1. Check Node.js version
node --version
# Expected: >= v18.0.0

# 2. Check npm version
npm --version
# Expected: >= 9.0.0

# 3. Check VERSATIL installation
npm list -g @versatil/sdlc-framework
# Expected: @versatil/sdlc-framework@4.1.0

# 4. Check command availability
which versatil
# Expected: /usr/local/bin/versatil or similar

# 5. Test command execution
versatil --version
# Expected: VERSATIL SDLC Framework v4.1.0

# 6. Run health check
versatil doctor
# Expected: Health score >= 90/100
```

---

## Uninstall & Reinstall

### Complete Uninstall

```bash
# 1. Uninstall global package
npm uninstall -g @versatil/sdlc-framework

# 2. Remove global configuration (optional)
rm -rf ~/.versatil

# 3. Remove project configuration (optional)
rm -f .versatil-project.json .cursorrules
rm -rf .cursor/settings.json

# 4. Clear npm cache
npm cache clean --force

# 5. Verify uninstallation
which versatil
# Expected: (empty output)

npm list -g @versatil/sdlc-framework
# Expected: (empty)
```

### Clean Reinstall

```bash
# 1. Complete uninstall (see above)

# 2. Reinstall
npm install -g @versatil/sdlc-framework

# 3. Verify installation
versatil --version

# 4. Run health check
versatil doctor

# 5. Initialize in project
cd /path/to/project
versatil init
```

---

## Offline Installation

### Download Package for Offline Install

```bash
# On machine with internet:
# 1. Download package and dependencies
npm pack @versatil/sdlc-framework
# Creates: versatil-sdlc-framework-4.1.0.tgz

# 2. Transfer .tgz file to offline machine

# On offline machine:
npm install -g versatil-sdlc-framework-4.1.0.tgz
```

### Create Local Registry Mirror

```bash
# For enterprise environments:
# 1. Set up Verdaccio (private npm registry)
npm install -g verdaccio
verdaccio

# 2. Configure npm to use local registry
npm config set registry http://localhost:4873

# 3. Publish VERSATIL to local registry
npm publish @versatil/sdlc-framework --registry http://localhost:4873

# 4. Install from local registry
npm install -g @versatil/sdlc-framework
```

---

## Docker Installation (Alternative)

```dockerfile
# Dockerfile
FROM node:20-alpine

# Install VERSATIL globally
RUN npm install -g @versatil/sdlc-framework

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Initialize VERSATIL
RUN versatil init --no-git-hooks

# Default command
CMD ["versatil", "doctor"]
```

**Build and run**:
```bash
docker build -t versatil-dev .
docker run -v $(pwd):/app versatil-dev
```

---

## CI/CD Installation

### GitHub Actions

```yaml
name: VERSATIL CI

on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install VERSATIL
        run: npm install -g @versatil/sdlc-framework

      - name: Verify Installation
        run: versatil --version

      - name: Run Quality Gate
        run: versatil quality-gate pre-deploy
```

### GitLab CI

```yaml
image: node:20

before_script:
  - npm install -g @versatil/sdlc-framework
  - versatil --version

test:
  script:
    - versatil quality-gate pre-deploy
```

---

## Common Error Messages

### "EACCES: permission denied"

**Fix**: Use nvm or change npm prefix (see Issue 2)

### "ENOTFOUND registry.npmjs.org"

**Fix**: Check network/proxy settings (see Issue 5)

### "Unsupported engine"

**Fix**: Update Node.js version (see Issue 6)

### "versatil: command not found"

**Fix**: Add npm bin to PATH (see Issue 1)

### "Cannot find module '@versatil/sdlc-framework'"

**Fix**: Reinstall package
```bash
npm uninstall -g @versatil/sdlc-framework
npm install -g @versatil/sdlc-framework
```

---

## Getting Help

### Debug Information to Collect

```bash
# Generate installation debug report
cat > versatil-install-debug.txt << EOF
Node.js Version: $(node --version)
npm Version: $(npm --version)
OS: $(uname -a)
npm Prefix: $(npm config get prefix)
PATH: $PATH
Global Packages: $(npm list -g --depth=0)
VERSATIL Location: $(which versatil)
VERSATIL Version: $(versatil --version 2>&1)
EOF

# Share this file when reporting issues
```

### Community Support

1. **GitHub Issues**: [Report installation issues](https://github.com/versatil-sdlc-framework/issues/new?template=installation.md)
2. **GitHub Discussions**: [Ask questions](https://github.com/versatil-sdlc-framework/discussions)
3. **Documentation**: [docs.versatil.dev](https://docs.versatil.dev)

---

## Quick Reference

### Installation Commands

```bash
# Global install (recommended)
npm install -g @versatil/sdlc-framework

# Project install
npm install --save-dev @versatil/sdlc-framework

# One-time use
npx @versatil/sdlc-framework init

# Update
pnpm update -g @versatil/sdlc-framework

# Uninstall
npm uninstall -g @versatil/sdlc-framework
```

### Verification Commands

```bash
# Check versions
node --version
npm --version
versatil --version

# Check installation
which versatil
npm list -g @versatil/sdlc-framework

# Run health check
versatil doctor
versatil doctor:install
```

### PATH Commands

```bash
# Check PATH
echo $PATH

# Find npm bin
npm config get prefix

# Add to PATH (bash)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

**Framework Version**: 4.1.0
**Last Updated**: 2025-10-05
**Maintained By**: VERSATIL Development Team

**Related Documentation**:
- [Getting Started Guide](GET_STARTED.md)
- [Agent Activation Troubleshooting](AGENT_ACTIVATION_TROUBLESHOOTING.md)
- [Cursor Integration Guide](CURSOR_INTEGRATION.md)
- [Commands Reference](../reference/commands.md)
