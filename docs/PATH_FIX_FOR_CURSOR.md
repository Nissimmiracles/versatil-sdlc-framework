# PATH Fix for Cursor - VERSATIL Commands

**Issue**: Running `versatil` commands in Cursor terminal shows "command not found"
**Root Cause**: `~/.npm-global/bin` not in Cursor's PATH
**Status**: ✅ Fixed

---

## Problem

When running VERSATIL commands in Cursor's integrated terminal:

```bash
$ versatil --version
zsh: command not found: versatil

$ versatil-daemon start
zsh: command not found: versatil-daemon
```

**But** commands work with full path:
```bash
$ ~/.npm-global/bin/versatil --version
VERSATIL SDLC Framework v6.5.0  ✅
```

---

## Root Cause

**Issue**: Cursor's terminal doesn't automatically load shell configuration files (`.zshrc`, `.bash_profile`)
**Result**: `~/.npm-global/bin` not in PATH when using Cursor terminal

**Why This Happens**:
- Cursor launches its integrated terminal with a minimal environment
- Shell config files (`.zshrc`, `.bash_profile`) may not be sourced automatically
- PATH doesn't include custom npm global bin directory
- VERSATIL binaries are installed but not accessible via short commands

---

## Solution Applied

### Step 1: Add npm-global bin to Shell Configuration ✅

**Added to `~/.zshrc`**:
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

**Added to `~/.bash_profile`**:
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

**Verification**:
```bash
$ tail -3 ~/.zshrc
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
export PATH="$HOME/.npm-global/bin:$PATH"  ✅
```

### Step 2: Reload Shell Configuration

```bash
# For zsh users
source ~/.zshrc

# For bash users
source ~/.bash_profile
```

### Step 3: Verify Commands Work

```bash
$ versatil --version
VERSATIL SDLC Framework v6.5.0  ✅

$ which versatil
/Users/nissimmenashe/.npm-global/bin/versatil  ✅
```

---

## How to Use in Cursor

### Option 1: Restart Cursor (RECOMMENDED)

**Steps**:
1. Quit Cursor completely (`Cmd+Q`)
2. Reopen Cursor
3. Open integrated terminal
4. Test: `versatil --version`

**Why This Works**:
- Cursor reloads environment variables on restart
- Shell config is sourced when new terminal is created
- PATH includes `~/.npm-global/bin` automatically

---

### Option 2: Source Shell Config in Cursor Terminal

**If you don't want to restart Cursor**:

```bash
# In Cursor's integrated terminal
source ~/.zshrc  # or source ~/.bash_profile for bash
versatil --version
```

**Pros**:
- Quick fix without restart
- Works immediately

**Cons**:
- Must run every time you open a new terminal in Cursor
- Tedious for multiple terminal tabs

---

### Option 3: Use Full Path (Quick Workaround)

**Until Cursor is restarted**, use full paths:

```bash
~/.npm-global/bin/versatil --version
~/.npm-global/bin/versatil-daemon start
~/.npm-global/bin/versatil-config wizard
```

**Pros**:
- Works immediately without any changes
- Reliable

**Cons**:
- Verbose and inconvenient
- Not a permanent solution

---

### Option 4: Add to Cursor Settings (Most Permanent)

**Configure Cursor to always load shell config**:

1. Open Cursor Settings (`Cmd+,`)
2. Search for "terminal integrated shell args"
3. Add shell argument to source config:

**For zsh**:
```json
{
  "terminal.integrated.shellArgs.osx": ["-l"]
}
```

**For bash**:
```json
{
  "terminal.integrated.shellArgs.osx": ["--login"]
}
```

**Why This Works**:
- `-l` or `--login` flag tells shell to load profile files
- Cursor terminal will always have correct PATH
- Permanent fix (survives Cursor updates)

---

## Verification Checklist

After applying fix, verify these work in Cursor terminal:

```bash
✅ versatil --version
   → Output: VERSATIL SDLC Framework v6.5.0

✅ versatil-daemon --help
   → Output: Daemon usage instructions

✅ versatil-config --help
   → Output: Config wizard help

✅ which versatil
   → Output: /Users/nissimmenashe/.npm-global/bin/versatil

✅ echo $PATH | grep npm-global
   → Output: /Users/nissimmenashe/.npm-global/bin
```

If **all 5 checks pass**, PATH is correctly configured! ✅

---

## Available VERSATIL Commands

Once PATH is fixed, these commands work in Cursor terminal:

### Core Commands
```bash
versatil                    # Main CLI
versatil --version          # Show version
versatil --help             # Show help
```

### Daemon Commands
```bash
versatil-daemon start       # Start proactive agent daemon
versatil-daemon stop        # Stop daemon
versatil-daemon status      # Check daemon status
versatil-daemon restart     # Restart daemon
```

### Configuration Commands
```bash
versatil-config wizard      # Configuration wizard
versatil-config show        # Show current config
versatil-credentials        # Manage credentials
```

### MCP Commands
```bash
versatil-mcp               # MCP server
versatil-mcp-setup         # MCP setup wizard
```

### Utility Commands
```bash
versatil-audit-daemon      # Daily audit daemon
versatil-conversation      # Conversation manager
versatil-rollback          # Rollback to previous version
versatil-sdlc              # Enhanced SDLC index
```

---

## Troubleshooting

### Issue: Commands Still Not Found After Restart

**Check 1: Verify PATH in Cursor Terminal**
```bash
echo $PATH | grep npm-global
```
- **Expected**: `/Users/nissimmenashe/.npm-global/bin` appears in PATH
- **If missing**: Shell config not loading, try Option 4 (Cursor settings)

**Check 2: Verify Binaries Exist**
```bash
ls -la ~/.npm-global/bin/versatil*
```
- **Expected**: List of versatil-* symlinks
- **If missing**: Reinstall framework (`npm install -g .`)

**Check 3: Verify Symlinks Are Valid**
```bash
readlink ~/.npm-global/bin/versatil
```
- **Expected**: `../lib/node_modules/@versatil/sdlc-framework/bin/versatil.js`
- **If broken**: Reinstall framework

**Check 4: Verify Script Is Executable**
```bash
ls -l "/Users/nissimmenashe/VERSATIL SDLC FW/bin/versatil.js"
```
- **Expected**: `-rwxr-xr-x` (executable permissions)
- **If not executable**: `chmod +x "/Users/nissimmenashe/VERSATIL SDLC FW/bin/versatil.js"`

---

### Issue: Commands Work in External Terminal, Not in Cursor

**Diagnosis**: Cursor not loading shell config files

**Solution**: Add to Cursor settings (Option 4 above)

**Alternative**: Create `~/.cursorrc` file:
```bash
# ~/.cursorrc
export PATH="$HOME/.npm-global/bin:$PATH"
```

Then add to Cursor settings:
```json
{
  "terminal.integrated.shellArgs.osx": ["-c", "source ~/.cursorrc && exec zsh"]
}
```

---

### Issue: Different Shell (bash vs zsh)

**Check Your Shell**:
```bash
echo $SHELL
```

**If bash**: Make sure you edited `~/.bash_profile` or `~/.bashrc`
**If zsh**: Make sure you edited `~/.zshrc`

**Universal Fix**: Add to BOTH files
```bash
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bash_profile
```

---

## Summary

**What Was Fixed**:
1. ✅ Added `~/.npm-global/bin` to PATH in shell config files
2. ✅ Verified versatil commands work with PATH set
3. ✅ Documented solutions for Cursor terminal integration

**What User Needs to Do**:
1. **Restart Cursor** (recommended) - OR -
2. **Source shell config** in Cursor terminal: `source ~/.zshrc` - OR -
3. **Add Cursor settings** for permanent fix (Option 4)

**Expected Result**:
- All `versatil-*` commands work in Cursor terminal ✅
- No need for full paths ✅
- Matches behavior of external terminals ✅

---

**Fixed**: 2025-10-20 06:10 UTC
**Framework Version**: v6.5.0
**Status**: ✅ PATH configured, restart Cursor to apply
