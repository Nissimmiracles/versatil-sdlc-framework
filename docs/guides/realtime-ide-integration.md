# Real-Time IDE Integration Guide

**Version**: 6.4.0
**Last Updated**: 2025-10-15
**Purpose**: Guide for integrating VERSATIL framework visualization with Cursor IDE in real-time

---

## Table of Contents

1. [Current Integration Status](#current-integration-status)
2. [Existing Terminal-Based Visualization](#existing-terminal-based-visualization)
3. [Cursor IDE Webview Limitations](#cursor-ide-webview-limitations)
4. [Recommended Integration Approaches](#recommended-integration-approaches)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Alternative Visualization Strategies](#alternative-visualization-strategies)

---

## Current Integration Status

### ✅ Working: Terminal-Based Visualization

VERSATIL framework currently provides **full real-time visualization** through terminal-based interfaces:

| Component | Status | Location | Update Frequency | Technology |
|-----------|--------|----------|------------------|------------|
| **Quick Status Check** | ✅ Operational | Terminal (exits immediately) | On-demand | Node.js |
| **Interactive Dashboard** | ✅ Operational | Terminal (stays open) | 500ms | Node.js + blessed |
| **StatuslineManager** | ✅ Operational | Terminal statusline | 100ms | TypeScript |
| **Cursor Hooks Integration** | ✅ Operational | Background (5 hooks) | Event-driven | Bash scripts |
| **Progress Tracking** | ✅ Operational | Real-time logs | Real-time | File system + logs |

### ❌ Not Working: Cursor IDE Native Webview Integration

Based on research (October 2025), Cursor IDE has **known compatibility issues** with VS Code webview extensions:

**Issue**: Webview panels and commands do not function in Cursor IDE
- Reported in Cursor forum: [Issue #115748](https://forum.cursor.com/t/webview-panels-and-commands-not-supported-in-cursor-breaks-extensions/115748)
- **Symptoms**:
  - Webview panels do not appear in UI
  - Webview commands missing from Command Palette
  - No error logs generated
- **Impact**: Extensions using `createWebviewPanel()` or `registerWebviewViewProvider()` may fail silently
- **Status**: Ongoing compatibility issue (as of October 2025)

**Cursor's Extension Support**:
- ✅ Supports VS Code extensions via Open VSX registry
- ✅ Independent security/compatibility verification
- ⚠️ Not all VS Code extensions work identically
- ❌ Webview panels specifically problematic

---

## Existing Terminal-Based Visualization

### 1. Quick Status Check (⭐ NEW - Recommended for First-Time Users)

**Launch Command**: `npm run status`

**Technology**: Node.js (simple console output)

**Features**:
- Framework health score (0-100%)
- Active agent list with progress bars
- Recent activity log (last 5 events)
- **Exits immediately** - no hanging, no blocking
- Color-coded status indicators (🟢 green, 🟡 yellow, 🔴 red)
- Command reference for next steps

**Performance**:
- Execution time: < 1 second
- CPU usage: Negligible (< 0.1%)
- Memory: < 10MB
- **Guaranteed exit** - perfect for scripts and quick checks

**Example Output**:
```
╔═══════════════════════════════════════════════════════════════════════╗
║            VERSATIL Framework - Quick Status Check                   ║
╚═══════════════════════════════════════════════════════════════════════╝

🟢 Framework Health: 95%
   Orchestrators: 8/8 active
   Last Update: 2m 15s ago

🤖 Active Agents: 3/7

   🤖 Maria-QA           ████████░░ 80%
      Test coverage analysis

   🤖 James-Frontend     ██████░░░░ 60%
      Component optimization

   🤖 Marcus-Backend     ████░░░░░░ 40%
      API security scan

📊 Recent Activity:

   14:32:15 │ Maria-QA completed test analysis (85% coverage)
   14:32:10 │ James-Frontend optimizing Button.tsx component
   14:31:58 │ Marcus-Backend completed security scan (A+ score)

───────────────────────────────────────────────────────────────────────

Commands:
  npm run status            Show this quick status check
  npm run dashboard         Launch full interactive dashboard
  npm run monitor           Run comprehensive health check
```

**When to Use**:
- ✅ Quick check before starting work
- ✅ Verify framework is running
- ✅ Check if agents are active
- ✅ View recent events
- ✅ **Perfect for beginners** - no terminal UI complexity
- ✅ **Safe for scripts** - guaranteed to exit

**Why This Was Added**:
Users reported `npm run dashboard` "hanging" - but it was actually working correctly as a continuous UI. This new `npm run status` command provides a quick, non-blocking alternative for status checks.

---

### 2. Interactive Dashboard (Advanced Real-Time Monitoring)

**Launch Command**: `npm run dashboard`

**Technology**: Node.js + blessed library (terminal UI framework)

**⚠️ Important Behavior**: This is a **continuous interactive UI** that runs until you press 'q' or ESC. It does **not exit automatically** - this is by design for real-time monitoring. If you want a quick check that exits immediately, use `npm run status` instead.

**Features**:
- Real-time agent progress bars (7 OPERA agents)
- 5-Rule system status indicators
- Framework health score (0-100%)
- Recent activity log (scrollable)
- Split-panel adaptive layout
- Node selection and drill-down
- Animated data flow visualization
- Keyboard controls (Arrow keys, Tab, Space, Q)

**Performance**:
- Update frequency: 500ms (configurable)
- CPU usage: < 1%
- Memory: < 50MB
- Latency: < 50ms

**Example Output**:
```
┌─ VERSATIL Framework Dashboard v3 ───────────────────────────────────┐
│                                                                      │
│  🟢 Framework Health: 95%           🕐 Uptime: 4h 23m               │
│  📊 Active Agents: 3/7              💾 Memory: 120 MB / 500 MB      │
│                                                                      │
│  Agent Progress:                                                     │
│  🤖 Maria-QA       │ ████████░░ 80% │ Test coverage analysis        │
│     └─ Subtask 1: Run Jest tests     [████████░░] 85%              │
│     └─ Subtask 2: Coverage report    [██████░░░░] 60%              │
│                                                                      │
│  🤖 James-Frontend │ ██████░░░░ 60% │ Component optimization        │
│     └─ React optimization            [████████░░] 75%              │
│                                                                      │
│  🤖 Marcus-Backend │ ████░░░░░░ 40% │ API security scan             │
│     └─ OWASP validation              [████░░░░░░] 45%              │
│                                                                      │
│  5-Rule System Status:                                              │
│  ✅ Rule 1: Parallel Execution      │ 3 tasks running              │
│  ✅ Rule 2: Stress Testing           │ Last run: 2m ago             │
│  ✅ Rule 3: Daily Health Audit       │ Score: 95%                   │
│  ✅ Rule 4: Intelligent Onboarding   │ Ready                        │
│  ✅ Rule 5: Automated Releases       │ v6.4.0 published             │
│                                                                      │
│  Recent Activity (last 10 events):                                  │
│  14:32:15 │ ✅ Maria-QA completed test analysis (85% coverage)     │
│  14:32:10 │ 🔄 James-Frontend optimizing Button.tsx component      │
│  14:31:58 │ ✅ Marcus-Backend completed security scan (A+ score)   │
│  14:31:45 │ 📊 Parallel execution: 3 tasks running simultaneously  │
│  14:31:30 │ 🔍 RAG search: Found 5 similar test patterns           │
│                                                                      │
│  Press: [↑↓] Navigate │ [Tab] Next panel │ [Space] Pause │ [Q] Quit│
└──────────────────────────────────────────────────────────────────────┘
```

**Dashboard Versions**:
- `npm run dashboard` - Latest v3 (adaptive layout, node selection)
- `npm run dashboard:v1` - Original version (simple metrics)
- `npm run dashboard:v2` - Enhanced version (progress bars)

### 2. StatuslineManager (Lightweight Progress)

**Location**: Terminal statusline (bottom of terminal)

**Update Frequency**: 100ms (10 updates/second)

**Features**:
- Compact multi-agent progress display
- Emoji indicators for status (🤖 active, ✅ success, ⚠️ warning, ❌ error)
- Real-time percentage updates
- RAG retrieval count
- MCP tool usage indicators
- Task ID tracking

**Example Output**:
```bash
# Single agent
🤖 Maria-QA analyzing... │ ████████░░ 80% coverage │ ⚠️ 2 missing tests

# Multiple agents (parallel)
🤖 3 agents │ Maria: ████████░░ 80% │ James: ██████░░░░ 60% │ Marcus: ████░░░░░░ 40%

# With RAG context
🤖 James │ ██████░░░░ 60% │ 📚 RAG: 3 patterns │ 🔌 MCP: Chrome

# Error state
❌ Maria-QA │ Test failed │ Coverage: 75% (target: 80%)
```

**Configuration**:
```json
// .cursor/settings.json
{
  "claude": {
    "statusline": {
      "enabled": true,
      "script": ".claude/hooks/statusline/sync-status.sh",
      "refresh_interval": 5000
    }
  }
}
```

**Implementation**: [src/ui/statusline-manager.ts](../../src/ui/statusline-manager.ts) (488 lines)

### 3. Background Monitoring

**Launch Command**: `npm run dashboard:background`

**Purpose**: Continuous monitoring without visible UI

**Features**:
- Runs silently in background
- Logs to `~/.versatil/logs/background-monitor.log`
- Alerts on critical issues (health < 70%)
- Auto-recovery on failures
- Systemd/launchd integration for auto-start

**View Logs**: `npm run dashboard:logs` (tail -f logs)

**Stop**: `npm run dashboard:stop`

---

## Cursor IDE Webview Limitations

### Research Findings (October 2025)

#### 1. Cursor's Webview Support Status

**Official Cursor Documentation**:
- Cursor is a VS Code fork with "independent security/compatibility verification"
- Uses Open VSX registry for extensions
- Not all VS Code extensions work identically

**Community Reports**:
- **Forum Issue #115748** (July 2025): "Webview Panels and Commands Not Supported in Cursor"
  - Webview panels do not appear in Cursor UI
  - Commands missing from Command Palette
  - No error logs generated
  - Works correctly in official VS Code

#### 2. VS Code Webview API Overview

For context, here's how webviews work in VS Code (and should work in Cursor if supported):

**Editor Webview Panel**:
```typescript
// VS Code API (may not work in Cursor)
const panel = vscode.window.createWebviewPanel(
  'versatilDashboard',
  'VERSATIL Framework',
  vscode.ViewColumn.Two,
  {
    enableScripts: true,
    retainContextWhenHidden: true
  }
);

panel.webview.html = getWebviewContent();

// Real-time updates via message passing
panel.webview.postMessage({
  type: 'agentProgress',
  agent: 'Maria-QA',
  progress: 80
});
```

**Sidebar Webview View**:
```typescript
// VS Code API for sidebar (may not work in Cursor)
vscode.window.registerWebviewViewProvider(
  'versatilSidebar',
  {
    resolveWebviewView(webviewView) {
      webviewView.webview.html = getSidebarContent();

      // Update every 500ms
      setInterval(() => {
        webviewView.webview.postMessage({
          type: 'healthUpdate',
          health: getFrameworkHealth()
        });
      }, 500);
    }
  }
);
```

**Why This Matters for VERSATIL**:
- Would allow real-time dashboard inside Cursor IDE
- Could display agent progress in sidebar
- WebSocket integration for live updates
- Better UX than switching to terminal

**Current Blocker**: Cursor does not reliably support these APIs (as of October 2025)

#### 3. Alternative VS Code APIs That May Work

Even without webviews, some VS Code APIs might work in Cursor:

**Status Bar Items** (Likely Works):
```typescript
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);

statusBarItem.text = '$(pulse) 3 agents active';
statusBarItem.tooltip = 'Maria: 80% | James: 60% | Marcus: 40%';
statusBarItem.command = 'versatil.openDashboard';
statusBarItem.show();

// Update every 100ms
setInterval(() => {
  const health = getFrameworkHealth();
  statusBarItem.text = `$(pulse) ${health}% framework health`;
}, 100);
```

**Output Channels** (Likely Works):
```typescript
const outputChannel = vscode.window.createOutputChannel('VERSATIL Framework');

outputChannel.appendLine('[14:32:15] ✅ Maria-QA completed test analysis (85% coverage)');
outputChannel.appendLine('[14:32:10] 🔄 James-Frontend optimizing Button.tsx component');

// Can be updated in real-time
outputChannel.show(true); // Show but don't steal focus
```

**Terminal Integration** (Likely Works):
```typescript
const terminal = vscode.window.createTerminal({
  name: 'VERSATIL Dashboard',
  shellPath: 'node',
  shellArgs: ['scripts/realtime-dashboard-v3.cjs']
});

terminal.show(false); // Show in terminal panel, don't steal focus
```

---

## Recommended Integration Approaches

Given Cursor's webview limitations, here are **practical approaches** for real-time IDE integration:

### Approach 1: Enhanced Status Bar (Recommended)

**Why**: Status bar API is stable in VS Code forks, minimal development effort

**Implementation**:
1. Create Cursor extension with status bar item
2. Update every 100ms with agent progress
3. Click to open terminal dashboard
4. Show alerts for critical issues

**Prototype**:
```typescript
// extensions/versatil-statusbar/src/extension.ts

import * as vscode from 'vscode';
import { StatuslineManager } from '../../../src/ui/statusline-manager';

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  const statusline = new StatuslineManager();

  // Update every 100ms
  const interval = setInterval(async () => {
    const status = await statusline.getCurrentStatus();

    if (status.activeAgents > 0) {
      statusBarItem.text = `$(pulse) ${status.activeAgents} agents`;
      statusBarItem.tooltip = formatTooltip(status);
      statusBarItem.backgroundColor = getStatusColor(status);
    } else {
      statusBarItem.text = `$(check) VERSATIL Ready`;
      statusBarItem.tooltip = `Health: ${status.health}%`;
    }

    statusBarItem.show();
  }, 100);

  // Click to open dashboard in terminal
  statusBarItem.command = 'versatil.openDashboard';

  context.subscriptions.push(
    statusBarItem,
    vscode.commands.registerCommand('versatil.openDashboard', () => {
      const terminal = vscode.window.createTerminal({
        name: 'VERSATIL Dashboard',
        shellPath: 'npm',
        shellArgs: ['run', 'dashboard']
      });
      terminal.show();
    })
  );
}

function formatTooltip(status: any): string {
  let tooltip = `VERSATIL Framework\n\n`;
  tooltip += `Health: ${status.health}%\n`;
  tooltip += `Active Agents: ${status.activeAgents}/7\n\n`;

  for (const agent of status.agents) {
    if (agent.status === 'active') {
      tooltip += `• ${agent.name}: ${agent.progress}% - ${agent.activity}\n`;
    }
  }

  tooltip += `\nClick to open dashboard`;
  return tooltip;
}

function getStatusColor(status: any): vscode.ThemeColor | undefined {
  if (status.health < 50) {
    return new vscode.ThemeColor('statusBarItem.errorBackground');
  } else if (status.health < 80) {
    return new vscode.ThemeColor('statusBarItem.warningBackground');
  }
  return undefined; // Default color
}
```

**Pros**:
- ✅ Works reliably in Cursor
- ✅ Always visible in IDE
- ✅ Minimal CPU/memory overhead
- ✅ Quick development (1-2 days)

**Cons**:
- ⚠️ Limited visual space
- ⚠️ Cannot show detailed metrics
- ⚠️ Requires terminal for full dashboard

### Approach 2: Output Channel with ANSI Colors (Fallback)

**Why**: Output channels work in all VS Code forks, can show structured logs

**Implementation**:
1. Create dedicated "VERSATIL Framework" output channel
2. Stream real-time logs with ANSI color codes
3. Update every 500ms with formatted status
4. Auto-scroll to show latest activity

**Prototype**:
```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('VERSATIL Framework');
  outputChannel.show(true); // Show but don't steal focus

  // Real-time log streaming
  const interval = setInterval(async () => {
    const status = await getFrameworkStatus();

    // Clear and redraw (creates "live" effect)
    outputChannel.clear();

    outputChannel.appendLine('╔═══════════════════════════════════════════════════════╗');
    outputChannel.appendLine('║         VERSATIL Framework - Real-Time Status        ║');
    outputChannel.appendLine('╚═══════════════════════════════════════════════════════╝');
    outputChannel.appendLine('');
    outputChannel.appendLine(`Health: ${status.health}%  |  Uptime: ${status.uptime}  |  Agents: ${status.activeAgents}/7`);
    outputChannel.appendLine('');

    for (const agent of status.agents) {
      if (agent.status === 'active') {
        const bar = createProgressBar(agent.progress);
        outputChannel.appendLine(`🤖 ${agent.name.padEnd(15)} ${bar} ${agent.progress}%`);
        outputChannel.appendLine(`   ${agent.activity}`);
      }
    }

    outputChannel.appendLine('');
    outputChannel.appendLine('Recent Activity:');
    for (const event of status.recentEvents.slice(0, 5)) {
      outputChannel.appendLine(`  ${event.timestamp} | ${event.message}`);
    }
  }, 500);

  context.subscriptions.push(outputChannel);
}

function createProgressBar(progress: number): string {
  const filled = Math.floor(progress / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
```

**Pros**:
- ✅ Reliable cross-platform
- ✅ Can show detailed logs
- ✅ Real-time streaming
- ✅ No external dependencies

**Cons**:
- ⚠️ Less visually appealing than terminal dashboard
- ⚠️ Requires clearing/redrawing for "live" effect
- ⚠️ Limited interactivity

### Approach 3: Integrated Terminal Dashboard (Current Best Option)

**Why**: Leverages existing blessed dashboard, works today without changes

**Implementation**:
1. Create Cursor command to launch terminal dashboard
2. Auto-launch on workspace open (optional)
3. Integrate with Cursor's terminal panel
4. Keep dashboard terminal open in bottom panel

**Configuration**:
```json
// .vscode/tasks.json (or .cursor/tasks.json)
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "VERSATIL Dashboard",
      "type": "shell",
      "command": "npm run dashboard",
      "isBackground": true,
      "presentation": {
        "reveal": "always",
        "panel": "dedicated",
        "focus": false
      },
      "runOptions": {
        "runOn": "folderOpen"
      }
    }
  ]
}
```

**Pros**:
- ✅ Works today (zero development needed)
- ✅ Full feature set (interactive dashboard)
- ✅ Reliable and tested
- ✅ Auto-launch on workspace open

**Cons**:
- ⚠️ Takes up terminal panel space
- ⚠️ Not "native" IDE integration
- ⚠️ Requires keeping terminal open

### Approach 4: Future Webview Extension (If Cursor Fixes Support)

**Why**: Best UX if/when Cursor fixes webview support

**Implementation Plan**:
1. Monitor Cursor forum for webview fix announcements
2. Prototype webview panel extension
3. Test in VS Code first, then Cursor
4. Migrate blessed dashboard to HTML/CSS/JS
5. Use WebSocket for real-time updates

**Prototype** (when webview support available):
```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Create webview panel
  const panel = vscode.window.createWebviewPanel(
    'versatilDashboard',
    'VERSATIL Framework',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'webview')
      ]
    }
  );

  // Load HTML dashboard (convert blessed → HTML)
  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

  // WebSocket connection for real-time updates
  const ws = new WebSocket('ws://localhost:3001/versatil-status');

  ws.onmessage = (event) => {
    const status = JSON.parse(event.data);
    panel.webview.postMessage({
      type: 'statusUpdate',
      status
    });
  };

  // Handle messages from webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'pauseAgent':
          pauseAgent(message.agentId);
          break;
        case 'viewLogs':
          showAgentLogs(message.agentId);
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'webview', 'dashboard.js')
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'webview', 'dashboard.css')
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
    </head>
    <body>
      <div id="dashboard">
        <div id="header">
          <h1>VERSATIL Framework</h1>
          <div id="health-indicator"></div>
        </div>
        <div id="agents-container"></div>
        <div id="activity-log"></div>
      </div>
      <script src="${scriptUri}"></script>
    </body>
    </html>
  `;
}
```

**Pros**:
- ✅ Native IDE integration
- ✅ Rich interactive UI (HTML/CSS/JS)
- ✅ Real-time WebSocket updates
- ✅ Best user experience

**Cons**:
- ❌ Not currently supported in Cursor
- ⚠️ Requires significant development effort
- ⚠️ Depends on Cursor fixing webview support
- ⚠️ Maintenance overhead

---

## Implementation Roadmap

### Phase 1: Immediate (Working Today)

**Goal**: Maximize existing terminal integration

**Tasks**:
1. ✅ Auto-launch dashboard in Cursor terminal (`.vscode/tasks.json`)
2. ✅ Document terminal dashboard usage in README
3. ✅ Add keyboard shortcuts for dashboard commands
4. ✅ Create demo video showing real-time visualization

**Timeline**: Already complete

**Deliverables**:
- Task configuration for auto-launch
- Updated documentation
- Demo video/GIF

### Phase 2: Short-Term (1-2 Weeks)

**Goal**: Create Cursor extension with status bar integration

**Tasks**:
1. Create Cursor extension project structure
2. Implement StatuslineManager integration
3. Add status bar item with real-time updates
4. Add command to open terminal dashboard
5. Publish to Open VSX registry
6. Test in Cursor IDE

**Timeline**: 1-2 weeks

**Deliverables**:
- `versatil-statusbar` extension
- Open VSX listing
- Installation guide

**Implementation Files**:
```
extensions/versatil-statusbar/
├── package.json          # Extension manifest
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── statusbar.ts      # Status bar integration
│   └── commands.ts       # Command handlers
├── README.md             # Extension documentation
└── CHANGELOG.md          # Version history
```

### Phase 3: Medium-Term (1-2 Months)

**Goal**: Enhanced output channel with formatted logs

**Tasks**:
1. Create dedicated "VERSATIL Framework" output channel
2. Implement real-time log streaming
3. Add ANSI color support
4. Create structured log format
5. Add filtering and search

**Timeline**: 1-2 months

**Deliverables**:
- Enhanced output channel integration
- Log filtering UI
- Documentation

### Phase 4: Long-Term (3-6 Months)

**Goal**: Native webview panel (if Cursor adds support)

**Prerequisites**:
- Cursor announces webview support
- Community confirms webview panels working

**Tasks**:
1. Monitor Cursor releases for webview fix
2. Prototype webview panel extension
3. Convert blessed dashboard to HTML/CSS/JS
4. Implement WebSocket server for real-time updates
5. Add interactive features (agent control, log filtering)
6. Publish to Open VSX

**Timeline**: 3-6 months (depends on Cursor)

**Deliverables**:
- `versatil-webview-dashboard` extension
- WebSocket server
- HTML dashboard UI

---

## Alternative Visualization Strategies

If Cursor webview support remains unavailable, consider these alternatives:

### Strategy 1: Standalone Electron App

**Concept**: Desktop app running alongside Cursor IDE

**Pros**:
- Full control over UI
- Native OS integration
- Real-time updates via WebSocket
- Cross-platform (Windows, macOS, Linux)

**Cons**:
- Separate window (not embedded in IDE)
- Higher resource usage
- Additional installation step

**Implementation**:
```bash
# New project
mkdir versatil-dashboard-app
cd versatil-dashboard-app
npm init -y
npm install electron electron-builder

# Convert blessed dashboard to Electron
# Add WebSocket connection to framework
# Package as standalone app
```

### Strategy 2: Web Dashboard (Browser-Based)

**Concept**: Web app accessible via localhost:3001

**Pros**:
- Works everywhere (no IDE dependency)
- Can be embedded in iframe (if Cursor allows)
- Easy to develop (React/Vue/Svelte)
- Mobile-friendly

**Cons**:
- Requires running web server
- Not "native" to IDE experience
- Extra browser tab

**Implementation**:
```bash
# Create Next.js dashboard
npx create-next-app@latest versatil-web-dashboard
cd versatil-web-dashboard

# Add WebSocket client
# Add Chart.js for visualizations
# Deploy to localhost:3001
```

### Strategy 3: VS Code Desktop Companion

**Concept**: Use official VS Code for dashboard, Cursor for coding

**Pros**:
- VS Code has full webview support
- Can run dashboard extension in VS Code
- Keep Cursor for AI coding features

**Cons**:
- Requires running two IDEs
- Not ideal UX
- Sync issues between IDEs

### Strategy 4: IDE-Agnostic CLI Tool

**Concept**: Enhance existing terminal dashboard with more features

**Pros**:
- Works in any terminal
- Already implemented
- Reliable and tested
- No IDE dependencies

**Cons**:
- Terminal-only (no GUI embedding)
- Limited visual design

**Enhancements**:
- Add more interactive controls
- Improve keyboard navigation
- Add filtering and search
- Export reports (HTML/PDF)

---

## Conclusion

**Current Best Practice** (October 2025):

1. **Use Existing Terminal Dashboard** (`npm run dashboard`)
   - ✅ Works today, fully featured, reliable
   - Auto-launch in Cursor terminal via tasks.json
   - Keep terminal panel open in bottom pane

2. **Develop Status Bar Extension** (Short-term priority)
   - Quick wins for IDE integration
   - Always-visible agent status
   - Click to open full dashboard

3. **Monitor Cursor Webview Support** (Long-term)
   - Watch for Cursor fixes to webview API
   - Prototype webview extension when available
   - Migrate to native IDE panels

**Recommendation**: Focus on **Approach 1 (Status Bar) + Approach 3 (Terminal Dashboard)** for immediate value, then migrate to **Approach 4 (Webview)** when Cursor adds support.

---

## References

- [Cursor Forum - Webview Panels Issue](https://forum.cursor.com/t/webview-panels-and-commands-not-supported-in-cursor-breaks-extensions/115748)
- [Cursor Documentation - Extensions](https://cursor.com/docs/configuration/extensions)
- [VS Code Extension API - Webview](https://code.visualstudio.com/api/extension-guides/webview)
- [VERSATIL StatuslineManager Implementation](../../src/ui/statusline-manager.ts)
- [VERSATIL Dashboard Implementation](../../scripts/realtime-dashboard-v3.cjs)

---

**Last Updated**: 2025-10-15
**Next Review**: When Cursor announces webview support updates
**Maintained By**: VERSATIL Framework Team
