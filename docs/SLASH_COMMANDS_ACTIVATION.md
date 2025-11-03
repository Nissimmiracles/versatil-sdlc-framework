# Activating New Slash Commands

## Issue
After creating new slash commands (`.claude/commands/*.md`), they may show as "Unknown slash command" until the Claude Code SDK is reloaded.

## Solution

### Option 1: Reload Cursor Window (Recommended)
```
1. Open Command Palette (Cmd+Shift+P on Mac, Ctrl+Shift+P on Windows)
2. Type: "Developer: Reload Window"
3. Press Enter
```

**Time**: 5 seconds
**Impact**: Reloads entire Cursor window, picks up new commands

---

### Option 2: Restart Cursor Completely
```
1. Quit Cursor (Cmd+Q on Mac, Alt+F4 on Windows)
2. Reopen Cursor
3. Open your project
```

**Time**: 10-15 seconds
**Impact**: Full restart, guaranteed to work

---

### Option 3: Use SlashCommand Tool (If Available)
If the command exists but isn't recognized, you can invoke it via the `SlashCommand` tool in Claude Code SDK.

---

## Verify Commands Are Loaded

After reloading, check available commands:

```
/help
```

You should see:
- `/onboard` - Interactive onboarding wizard
- `/update` - Version update wizard
- `/config-wizard` - Configuration wizard

---

## New Commands Added (v7.3.0)

| Command | Description | File |
|---------|-------------|------|
| `/onboard` | Interactive onboarding wizard (chat-based GUI) | [.claude/commands/onboard.md](.claude/commands/onboard.md) |
| `/update` | Version update wizard with visual changelog | [.claude/commands/update.md](.claude/commands/update.md) |
| `/config-wizard` | Visual configuration interface | [.claude/commands/config-wizard.md](.claude/commands/config-wizard.md) |

---

## Troubleshooting

### Command Still Not Found After Reload

1. **Check file exists**:
   ```bash
   ls -la .claude/commands/onboard.md
   ```

2. **Verify frontmatter**:
   ```bash
   head -6 .claude/commands/onboard.md
   ```

   Should show:
   ```yaml
   ---
   name: onboard
   description: Interactive onboarding wizard for new users (chat-based GUI experience)
   tags: [setup, onboarding, configuration, wizard, gui]
   ---
   ```

3. **Check for YAML syntax errors**:
   - Frontmatter must start/end with `---`
   - `name` field is required
   - No tabs, only spaces for indentation

4. **Verify file permissions**:
   ```bash
   chmod 644 .claude/commands/onboard.md
   ```

### Commands Work in Terminal But Not in Chat

This is expected! The `.md` files are **slash commands for Claude Code SDK chat interface**, not terminal commands.

**Terminal commands** (still work):
```bash
pnpm run onboard
versatil update check
versatil config wizard
```

**Chat commands** (new):
```
/onboard
/update
/config-wizard
```

---

## How Slash Commands Work

1. **File location**: `.claude/commands/{name}.md`
2. **Frontmatter**: YAML metadata at top of file
3. **Content**: Markdown instructions for Claude
4. **Discovery**: Claude Code SDK scans `.claude/commands/` on startup
5. **Invocation**: User types `/{name}` in chat
6. **Execution**: Claude reads the `.md` file and follows instructions

---

## Creating New Slash Commands

1. **Create file**: `.claude/commands/my-command.md`
2. **Add frontmatter**:
   ```yaml
   ---
   name: my-command
   description: What this command does
   tags: [category1, category2]
   ---
   ```
3. **Write instructions**: Markdown content telling Claude what to do
4. **Reload Cursor**: Developer: Reload Window
5. **Test**: Type `/my-command` in chat

**Template**: Use [.claude/skills/code-generators/command-creator/assets/command-template.md](.claude/skills/code-generators/command-creator/assets/command-template.md)

---

## Summary

**To use new slash commands**:
1. ✅ Files created in `.claude/commands/` with proper frontmatter
2. ⚡ **Reload Cursor window** (Cmd+Shift+P → "Developer: Reload Window")
3. 🎉 Type `/{command-name}` in chat

**That's it!** The commands are now active and ready to use.

---

**Note**: This is a Claude Code SDK limitation, not a VERSATIL issue. All VSCode/Cursor extensions require a reload to pick up new files in certain directories.
