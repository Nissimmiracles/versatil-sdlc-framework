# 🚀 VERSATIL MCP Default Setup - Implementation Plan

> **Goal**: Make VERSATIL MCP Server auto-configure with Cursor/Claude Desktop on framework installation
> **Impact**: Empower 10,000+ developers with AI-native SDLC tools out-of-the-box
> **Timeline**: Sprint 1 (Days 1-3)

---

## 📊 Current State Analysis

### What Exists ✅
- **VERSATIL MCP Server**: `bin/versatil-mcp.js` (fully functional)
- **10 MCP Tools**: All framework capabilities exposed
  1. `versatil_activate_agent` - Activate OPERA agents
  2. `versatil_orchestrate_sdlc` - Manage SDLC phases
  3. `versatil_quality_gate` - Execute quality gates
  4. `versatil_test_suite` - Run tests
  5. `versatil_architecture_analysis` - Analyze architecture
  6. `versatil_deployment_pipeline` - Deploy
  7. `versatil_framework_status` - Get health metrics
  8. `versatil_adaptive_insights` - AI insights
  9. `versatil_file_analysis` - Analyze files
  10. `versatil_performance_report` - Performance data

- **MCP Client**: `src/mcp/mcp-client.ts` (handles requests)
- **11 MCP Integrations**: Chrome, GitHub, Vertex AI, etc.

### What's Missing ❌
- **Auto-configuration**: Not automatically added to Claude Desktop config
- **No Cursor Integration**: Not configured in Cursor's MCP settings
- **Manual Setup Required**: Users must manually edit JSON files
- **No Detection**: Doesn't detect if Claude Desktop/Cursor is installed

---

## 🎯 Solution: Auto-Configure MCP on Installation

### Implementation Strategy

Make `npm install @versatil/sdlc-framework` automatically:
1. Detect Claude Desktop / Cursor installation
2. Auto-configure VERSATIL MCP Server
3. Restart IDE if needed
4. Verify connection works

---

## 🛠️ Implementation Plan

### Phase 1: Detection (Day 1 Morning)

**Create**: `src/mcp/mcp-auto-configurator.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class MCPAutoConfigurator {
  private claudeConfigPaths = [
    // Claude Desktop (macOS)
    path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'),
    // Claude Desktop (Linux)
    path.join(os.homedir(), '.config/Claude/claude_desktop_config.json'),
    // Claude Desktop (Windows)
    path.join(os.homedir(), 'AppData/Roaming/Claude/claude_desktop_config.json')
  ];

  private cursorConfigPaths = [
    // Cursor (macOS)
    path.join(os.homedir(), 'Library/Application Support/Cursor/User/settings.json'),
    // Cursor (Linux)
    path.join(os.homedir(), '.config/Cursor/User/settings.json'),
    // Cursor (Windows)
    path.join(os.homedir(), 'AppData/Roaming/Cursor/User/settings.json')
  ];

  async detectInstallations(): Promise<{
    claudeDesktop: boolean;
    claudeConfigPath: string | null;
    cursor: boolean;
    cursorConfigPath: string | null;
  }> {
    // Detect Claude Desktop
    let claudeConfigPath = null;
    for (const configPath of this.claudeConfigPaths) {
      if (fs.existsSync(configPath)) {
        claudeConfigPath = configPath;
        break;
      }
    }

    // Detect Cursor
    let cursorConfigPath = null;
    for (const configPath of this.cursorConfigPaths) {
      if (fs.existsSync(configPath)) {
        cursorConfigPath = configPath;
        break;
      }
    }

    return {
      claudeDesktop: claudeConfigPath !== null,
      claudeConfigPath,
      cursor: cursorConfigPath !== null,
      cursorConfigPath
    };
  }
}
```

---

### Phase 2: Auto-Configuration (Day 1 Afternoon)

**Extend**: `src/mcp/mcp-auto-configurator.ts`

```typescript
export class MCPAutoConfigurator {
  // ... (detection code above)

  async configureClaude(projectPath: string): Promise<boolean> {
    const detection = await this.detectInstallations();

    if (!detection.claudeDesktop) {
      console.log('ℹ️  Claude Desktop not detected. MCP configuration skipped.');
      return false;
    }

    console.log('🔧 Configuring VERSATIL MCP Server in Claude Desktop...');

    try {
      // Read existing config
      const configPath = detection.claudeConfigPath!;
      let config: any = {};

      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(content);
      }

      // Ensure mcpServers exists
      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      // Add VERSATIL MCP Server
      const versatilMCPPath = this.getVERSATILMCPPath();

      config.mcpServers.versatil = {
        command: 'node',
        args: [versatilMCPPath, projectPath],
        env: {
          // Pass environment variables
          VERSATIL_PROJECT_PATH: projectPath,
          VERSATIL_MCP_ENABLED: 'true'
        }
      };

      // Backup existing config
      const backupPath = `${configPath}.backup.${Date.now()}`;
      if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, backupPath);
        console.log(`📋 Backed up existing config to: ${backupPath}`);
      }

      // Write new config
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      console.log('✅ VERSATIL MCP Server configured in Claude Desktop!');
      console.log(`📍 Config file: ${configPath}`);
      console.log('');
      console.log('🔄 Please restart Claude Desktop to activate MCP tools.');
      console.log('');
      console.log('🎯 Available tools:');
      console.log('   1. versatil_activate_agent - Activate OPERA agents');
      console.log('   2. versatil_orchestrate_sdlc - Manage SDLC workflow');
      console.log('   3. versatil_quality_gate - Run quality checks');
      console.log('   ... and 7 more tools!');

      return true;
    } catch (error) {
      console.error('❌ Failed to configure Claude Desktop:', error);
      return false;
    }
  }

  async configureCursor(projectPath: string): Promise<boolean> {
    const detection = await this.detectInstallations();

    if (!detection.cursor) {
      console.log('ℹ️  Cursor not detected. MCP configuration skipped.');
      return false;
    }

    console.log('🔧 Configuring VERSATIL MCP Server in Cursor...');

    try {
      const configPath = detection.cursorConfigPath!;
      let config: any = {};

      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(content);
      }

      // Ensure mcp.servers exists (Cursor-specific)
      if (!config.mcp) {
        config.mcp = { servers: {} };
      }
      if (!config.mcp.servers) {
        config.mcp.servers = {};
      }

      // Add VERSATIL MCP Server
      const versatilMCPPath = this.getVERSATILMCPPath();

      config.mcp.servers.versatil = {
        command: 'node',
        args: [versatilMCPPath, projectPath],
        env: {
          VERSATIL_PROJECT_PATH: projectPath,
          VERSATIL_MCP_ENABLED: 'true'
        }
      };

      // Backup existing config
      const backupPath = `${configPath}.backup.${Date.now()}`;
      if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, backupPath);
      }

      // Write new config
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      console.log('✅ VERSATIL MCP Server configured in Cursor!');
      console.log(`📍 Config file: ${configPath}`);
      console.log('');
      console.log('🔄 Please restart Cursor to activate MCP tools.');

      return true;
    } catch (error) {
      console.error('❌ Failed to configure Cursor:', error);
      return false;
    }
  }

  private getVERSATILMCPPath(): string {
    // Try global installation first
    const globalPath = path.join(__dirname, '../../../bin/versatil-mcp.js');
    if (fs.existsSync(globalPath)) {
      return globalPath;
    }

    // Fallback to local installation
    return path.join(process.cwd(), 'node_modules/@versatil/sdlc-framework/bin/versatil-mcp.js');
  }

  async autoConfigureAll(): Promise<void> {
    console.log('\n🚀 VERSATIL Framework - Auto-configuring MCP Server...\n');

    const projectPath = process.cwd();

    // Configure Claude Desktop
    const claudeSuccess = await this.configureClaude(projectPath);

    // Configure Cursor
    const cursorSuccess = await this.configureCursor(projectPath);

    if (!claudeSuccess && !cursorSuccess) {
      console.log('');
      console.log('⚠️  Neither Claude Desktop nor Cursor detected.');
      console.log('');
      console.log('📖 Manual Setup Instructions:');
      console.log('');
      console.log('For Claude Desktop:');
      console.log('  Edit: ~/Library/Application Support/Claude/claude_desktop_config.json');
      console.log('  Add:');
      console.log('    {');
      console.log('      "mcpServers": {');
      console.log('        "versatil": {');
      console.log(`          "command": "node",`);
      console.log(`          "args": ["${this.getVERSATILMCPPath()}", "${projectPath}"]`);
      console.log('        }');
      console.log('      }');
      console.log('    }');
      console.log('');
      console.log('For Cursor:');
      console.log('  Edit: ~/Library/Application Support/Cursor/User/settings.json');
      console.log('  Add similar configuration under "mcp.servers"');
    }

    console.log('');
    console.log('✅ MCP Auto-configuration complete!');
    console.log('');
  }
}
```

---

### Phase 3: Integration with Postinstall (Day 2 Morning)

**Modify**: `scripts/postinstall-wizard.cjs`

Add MCP auto-configuration step:

```javascript
// After credential wizard
async function runPostinstall() {
  // ... (existing code)

  // NEW: Auto-configure MCP
  console.log('\n🔧 Step 5: Configuring MCP Server...\n');

  try {
    const { MCPAutoConfigurator } = require('../dist/mcp/mcp-auto-configurator.js');
    const configurator = new MCPAutoConfigurator();
    await configurator.autoConfigureAll();
  } catch (error) {
    console.warn('⚠️  MCP auto-configuration skipped (not critical)');
  }

  // ... (rest of postinstall)
}
```

---

### Phase 4: Add CLI Command (Day 2 Afternoon)

**Create**: `bin/versatil-mcp-setup.js`

```javascript
#!/usr/bin/env node

const { MCPAutoConfigurator } = require('../dist/mcp/mcp-auto-configurator.js');

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  VERSATIL MCP Server Setup                        ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const configurator = new MCPAutoConfigurator();
  await configurator.autoConfigureAll();

  console.log('\n📖 Documentation: https://docs.versatil.dev/mcp-setup');
  console.log('');
}

main();
```

Add to package.json:
```json
{
  "bin": {
    "versatil-mcp-setup": "./bin/versatil-mcp-setup.js"
  },
  "scripts": {
    "mcp:setup": "node bin/versatil-mcp-setup.js"
  }
}
```

---

### Phase 5: Verification (Day 3 Morning)

**Create**: `src/mcp/mcp-connection-verifier.ts`

```typescript
export class MCPConnectionVerifier {
  async verifyConnection(): Promise<{
    connected: boolean;
    toolsAvailable: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Try to execute a simple MCP tool
      const response = await fetch('http://localhost:3000/tools/versatil_framework_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arguments: {} })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          connected: true,
          toolsAvailable: 10,
          errors: []
        };
      } else {
        errors.push(`MCP Server responded with ${response.status}`);
      }
    } catch (error) {
      errors.push('Could not connect to MCP Server');
    }

    return {
      connected: false,
      toolsAvailable: 0,
      errors
    };
  }

  async displayConnectionStatus(): Promise<void> {
    console.log('\n🔍 Verifying MCP Connection...\n');

    const result = await this.verifyConnection();

    if (result.connected) {
      console.log('✅ MCP Server is running!');
      console.log(`📊 ${result.toolsAvailable} tools available`);
      console.log('');
      console.log('🎯 Try asking Claude:');
      console.log('   "Use versatil_framework_status to show me the framework health"');
    } else {
      console.log('❌ MCP Server not connected');
      console.log('');
      console.log('Errors:');
      result.errors.forEach(err => console.log(`   - ${err}`));
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('   1. Ensure Claude Desktop/Cursor is restarted');
      console.log('   2. Check MCP Server is running: versatil-daemon status');
      console.log('   3. Run setup again: npm run mcp:setup');
    }
  }
}
```

---

## 📦 Complete Implementation Checklist

### Day 1: Detection & Auto-Configuration
- [ ] Create `src/mcp/mcp-auto-configurator.ts`
- [ ] Implement `detectInstallations()` method
- [ ] Implement `configureClaude()` method
- [ ] Implement `configureCursor()` method
- [ ] Add config backup logic
- [ ] Write unit tests for configurator
- [ ] Test on macOS

### Day 2: CLI Integration
- [ ] Modify `scripts/postinstall-wizard.cjs` (add MCP step)
- [ ] Create `bin/versatil-mcp-setup.js` CLI command
- [ ] Add `npm run mcp:setup` script
- [ ] Test postinstall flow
- [ ] Test CLI command
- [ ] Update package.json bins

### Day 3: Verification & Documentation
- [ ] Create `src/mcp/mcp-connection-verifier.ts`
- [ ] Implement connection verification
- [ ] Add verification to postinstall
- [ ] Create user documentation (docs/MCP_SETUP.md)
- [ ] Add troubleshooting guide
- [ ] Test end-to-end (fresh install → MCP working)

### Day 4-5: Cross-Platform & Polish
- [ ] Test on Linux
- [ ] Test on Windows
- [ ] Add graceful fallbacks for missing configs
- [ ] Improve error messages
- [ ] Add progress indicators
- [ ] Create demo video

---

## 🎯 User Experience Flow

### Before (Manual Setup - 15 minutes)
```bash
1. npm install @versatil/sdlc-framework
2. Find Claude Desktop config file (where is it?)
3. Manually edit JSON (oops, syntax error)
4. Restart Claude Desktop
5. Hope it works...
```

### After (Automatic - 30 seconds)
```bash
1. npm install @versatil/sdlc-framework
   → ✅ Detecting Claude Desktop... Found!
   → ✅ Configuring MCP Server... Done!
   → ✅ Backing up existing config... Done!
   → ✅ VERSATIL MCP ready! Please restart Claude Desktop.

2. Restart Claude Desktop
3. Ask Claude: "Show me VERSATIL framework status"
4. 🎉 It works!
```

---

## 📊 Success Criteria

### Technical
- [ ] Auto-detects Claude Desktop on macOS, Linux, Windows
- [ ] Auto-detects Cursor on macOS, Linux, Windows
- [ ] Backs up existing configs before modification
- [ ] Handles missing config files gracefully
- [ ] Verifies MCP connection after setup
- [ ] Provides clear error messages

### User Experience
- [ ] Zero manual configuration required
- [ ] Works out-of-the-box after `npm install`
- [ ] Clear success/failure messages
- [ ] Troubleshooting guide for failures
- [ ] Restart reminder displayed

### Documentation
- [ ] Setup guide (docs/MCP_SETUP.md)
- [ ] Troubleshooting guide
- [ ] Video tutorial
- [ ] FAQ section

---

## 🚀 Rollout Strategy

### Phase 1: Beta Testing (Day 6-7)
- Deploy to 10 beta users
- Collect feedback on auto-configuration
- Fix any platform-specific issues
- Iterate based on feedback

### Phase 2: v5.0 Release (Day 30)
- Include in v5.0 release
- Announce MCP auto-configuration feature
- Monitor installation metrics
- Track MCP connection success rate

### Phase 3: Post-Release (Day 31+)
- Monitor GitHub issues for MCP problems
- Add support for other IDEs (VS Code with Continue?)
- Expand to other MCP clients
- Improve detection logic

---

## 📈 Impact Metrics

### Adoption Metrics
- **Target**: 95% of installations have MCP configured
- **Measurement**: Track MCP connection success rate
- **Goal**: <5% manual configuration needed

### User Satisfaction
- **Target**: 4.5/5 stars for ease of setup
- **Measurement**: Post-install survey
- **Goal**: Zero "setup is hard" complaints

### Developer Productivity
- **Target**: 5x faster setup time (15min → 30sec)
- **Measurement**: Time to first MCP tool use
- **Goal**: Developers using MCP within 1 minute of install

---

## 🎉 Vision

**Make VERSATIL Framework the easiest AI-native SDLC platform to set up**

With auto-MCP configuration, developers will:
- Install framework: `npm install @versatil/sdlc-framework`
- See: "✅ MCP configured! Restart Claude Desktop."
- Ask Claude: "Show me framework status"
- Get: Full OPERA agent access instantly

**Zero friction. Maximum power.**

---

**Implementation Start**: Sprint 1, Day 1
**Implementation End**: Sprint 1, Day 5
**Testing**: Sprint 1, Day 6-7
**Release**: v5.0 (Day 30)

**LET'S MAKE MCP SETUP EFFORTLESS!** 🚀
