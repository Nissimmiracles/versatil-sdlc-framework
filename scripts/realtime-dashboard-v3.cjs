#!/usr/bin/env node
/**
 * VERSATIL Framework - Interactive Dashboard v3
 *
 * Fully responsive, interactive workflow visualization
 * Features:
 * - Adaptive layout that responds to terminal size
 * - Interactive node selection with details
 * - Animated data flow between nodes
 * - Real-time progress tracking
 * - Split-panel view with node details
 *
 * Controls:
 *   q/ESC     - Quit
 *   ↑↓←→      - Navigate nodes
 *   Enter     - Select node / Show details
 *   Tab       - Cycle through nodes
 *   Space     - Pause/Resume animation
 *   +/-       - Zoom in/out
 *   f         - Focus on active node
 *   h         - Toggle help
 *   r         - Refresh
 */

const fs = require('fs');
const blessed = require('blessed');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = process.cwd();
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const STATUS_FILE = `/tmp/versatil-sync-status-${SESSION_ID}.json`;
const UPDATE_INTERVAL = 500; // 500ms for smooth animation

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  selectedNodeId: null,
  isPaused: false,
  showHelp: false,
  zoomLevel: 1.0,
  animationFrame: 0,
  dataFlowParticles: []
};

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

const workflow = {
  nodes: [
    {
      id: 'input',
      name: '📥 User Request',
      type: 'trigger',
      row: 0,
      col: 2,
      status: 'active',
      progress: 100,
      task: 'Receive user input'
    },

    {
      id: 'sarah',
      name: '👔 Sarah-PM',
      role: 'Project Manager',
      type: 'agent',
      row: 1,
      col: 1,
      status: 'idle',
      progress: 0,
      task: 'Coordinate team',
      metrics: { completed: 0, avgTime: 0 }
    },

    {
      id: 'alex',
      name: '📊 Alex-BA',
      role: 'Business Analyst',
      type: 'agent',
      row: 1,
      col: 3,
      status: 'idle',
      progress: 0,
      task: 'Analyze requirements',
      metrics: { completed: 0, avgTime: 0 }
    },

    {
      id: 'james',
      name: '🎨 James-Frontend',
      role: 'Frontend Developer',
      type: 'agent',
      row: 2,
      col: 0,
      status: 'idle',
      progress: 0,
      task: 'Build UI components',
      metrics: { completed: 0, avgTime: 0 }
    },

    {
      id: 'marcus',
      name: '⚙️  Marcus-Backend',
      role: 'Backend Developer',
      type: 'agent',
      row: 2,
      col: 2,
      status: 'idle',
      progress: 0,
      task: 'Create API endpoints',
      metrics: { completed: 0, avgTime: 0 }
    },

    {
      id: 'dr-ai',
      name: '🤖 Dr.AI-ML',
      role: 'ML Engineer',
      type: 'agent',
      row: 2,
      col: 4,
      status: 'idle',
      progress: 0,
      task: 'Train ML models',
      metrics: { completed: 0, avgTime: 0 }
    },

    {
      id: 'maria',
      name: '✅ Maria-QA',
      role: 'QA Engineer',
      type: 'agent',
      row: 3,
      col: 2,
      status: 'idle',
      progress: 0,
      task: 'Test & validate',
      metrics: { completed: 0, avgTime: 0 }
    },

    {
      id: 'deploy',
      name: '🚀 Deploy',
      type: 'action',
      row: 4,
      col: 2,
      status: 'idle',
      progress: 0,
      task: 'Deploy to production'
    }
  ],

  connections: [
    { from: 'input', to: 'sarah', type: 'trigger' },
    { from: 'input', to: 'alex', type: 'requirements' },
    { from: 'sarah', to: 'james', type: 'coordination' },
    { from: 'sarah', to: 'marcus', type: 'coordination' },
    { from: 'alex', to: 'james', type: 'requirements' },
    { from: 'alex', to: 'marcus', type: 'requirements' },
    { from: 'alex', to: 'dr-ai', type: 'requirements' },
    { from: 'james', to: 'maria', type: 'code' },
    { from: 'marcus', to: 'maria', type: 'code' },
    { from: 'dr-ai', to: 'maria', type: 'model' },
    { from: 'maria', to: 'deploy', type: 'approved' }
  ]
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

const screen = blessed.screen({
  smartCSR: true,
  title: 'VERSATIL Interactive Dashboard v3',
  fullUnicode: true,
  autoPadding: true,
  dockBorders: true
});

// Main workflow canvas (70% width)
const workflowCanvas = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '70%',
  height: '100%-3',
  tags: true,
  border: { type: 'line', fg: 'cyan' },
  label: ' Workflow Pipeline ',
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  scrollbar: {
    ch: '█',
    style: { fg: 'cyan' }
  }
});

// Details panel (30% width)
const detailsPanel = blessed.box({
  parent: screen,
  top: 0,
  left: '70%',
  width: '30%',
  height: '100%-3',
  tags: true,
  border: { type: 'line', fg: 'magenta' },
  label: ' Node Details ',
  scrollable: true,
  content: '{center}{gray-fg}Select a node to view details{/}{/center}'
});

// Status bar
const statusBar = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  style: {
    fg: 'white',
    bg: 'blue'
  }
});

// Help overlay (hidden by default)
const helpOverlay = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '60%',
  height: '60%',
  tags: true,
  border: { type: 'double', fg: 'yellow' },
  label: ' Keyboard Shortcuts ',
  hidden: true,
  content: `
  {center}{bold}{yellow-fg}VERSATIL Dashboard v3 - Controls{/}{/center}

  {bold}Navigation:{/}
    ↑↓←→        Navigate between nodes
    Tab         Cycle through nodes
    Enter       Select node / Show details
    f           Focus on active node

  {bold}View:{/}
    +/-         Zoom in/out
    Space       Pause/Resume animation
    h           Toggle this help
    r           Refresh data

  {bold}General:{/}
    q/ESC       Quit dashboard

  {center}Press {bold}{cyan-fg}h{/} to close this help{/center}
`,
  style: {
    bg: 'black'
  }
});

// ============================================================================
// RESPONSIVE LAYOUT ENGINE
// ============================================================================

function getTerminalDimensions() {
  return {
    width: process.stdout.columns || 120,
    height: process.stdout.rows || 40
  };
}

function calculateNodeDimensions() {
  const dims = getTerminalDimensions();
  const canvasWidth = Math.floor(dims.width * 0.7);
  const canvasHeight = dims.height - 5;

  // Adaptive node sizing based on available space
  let nodeWidth = Math.floor(24 * state.zoomLevel);
  let nodeHeight = Math.floor(5 * state.zoomLevel);

  // Ensure nodes fit in canvas
  const maxNodeWidth = Math.floor(canvasWidth / 5) - 2;
  const maxNodeHeight = Math.floor(canvasHeight / 6) - 1;

  nodeWidth = Math.min(nodeWidth, maxNodeWidth);
  nodeHeight = Math.min(nodeHeight, maxNodeHeight);

  return {
    width: Math.max(nodeWidth, 18),
    height: Math.max(nodeHeight, 4),
    colSpacing: Math.floor(canvasWidth / 5),
    rowSpacing: Math.floor(canvasHeight / 5)
  };
}

// ============================================================================
// DATA FLOW ANIMATION
// ============================================================================

function createDataFlowParticle(fromNode, toNode, type) {
  return {
    id: Math.random(),
    from: fromNode.id,
    to: toNode.id,
    type,
    progress: 0,
    color: type === 'requirements' ? 'blue' :
           type === 'code' ? 'green' :
           type === 'coordination' ? 'yellow' : 'cyan'
  };
}

function updateDataFlowAnimation() {
  if (state.isPaused) return;

  // Update existing particles
  state.dataFlowParticles = state.dataFlowParticles.filter(particle => {
    particle.progress += 0.05; // 5% per frame
    return particle.progress < 1.0;
  });

  // Randomly create new particles on active connections
  if (Math.random() < 0.3) { // 30% chance per frame
    const activeConnections = workflow.connections.filter(conn => {
      const fromNode = workflow.nodes.find(n => n.id === conn.from);
      const toNode = workflow.nodes.find(n => n.id === conn.to);
      return fromNode && toNode && (fromNode.status === 'processing' || fromNode.status === 'active');
    });

    if (activeConnections.length > 0) {
      const conn = activeConnections[Math.floor(Math.random() * activeConnections.length)];
      const fromNode = workflow.nodes.find(n => n.id === conn.from);
      const toNode = workflow.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        state.dataFlowParticles.push(createDataFlowParticle(fromNode, toNode, conn.type));
      }
    }
  }
}

// ============================================================================
// NODE RENDERING
// ============================================================================

function renderNode(node, dims, isSelected) {
  const { width, height, colSpacing, rowSpacing } = dims;
  const x = node.col * colSpacing;
  const y = node.row * rowSpacing;

  const borderColor = isSelected ? 'yellow' :
                      node.status === 'processing' ? 'green' :
                      node.status === 'active' ? 'cyan' : 'white';

  const statusIcon = node.status === 'processing' ? '⚙' :
                     node.status === 'active' ? '●' : '○';

  let lines = [];

  // Top border
  lines.push(`{${borderColor}-fg}╔${'═'.repeat(width - 2)}╗{/}`);

  // Node name
  const nameText = (isSelected ? '▶ ' : '  ') + node.name;
  const namePadded = nameText.padEnd(width - 2);
  lines.push(`{${borderColor}-fg}║{/}{bold}${namePadded.substring(0, width - 2)}{/}{${borderColor}-fg}║{/}`);

  // Role (if exists)
  if (node.role && height > 3) {
    const roleText = `  {gray-fg}${node.role}{/}`.padEnd(width - 2);
    lines.push(`{${borderColor}-fg}║{/}${roleText.substring(0, width - 2)}{${borderColor}-fg}║{/}`);
  }

  // Progress bar (if processing)
  if (node.progress > 0 && height > 4) {
    const barWidth = width - 6;
    const filledWidth = Math.floor(barWidth * node.progress / 100);
    const bar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);
    const progressText = `  {${borderColor}-fg}${bar}{/} ${node.progress}%`;
    lines.push(`{${borderColor}-fg}║{/}${progressText.padEnd(width - 2).substring(0, width - 2)}{${borderColor}-fg}║{/}`);
  }

  // Fill remaining height
  while (lines.length < height - 1) {
    lines.push(`{${borderColor}-fg}║${' '.repeat(width - 2)}║{/}`);
  }

  // Bottom border
  lines.push(`{${borderColor}-fg}╚${'═'.repeat(width - 2)}╝{/}`);

  return { x, y, lines };
}

function renderConnections(dims) {
  const { colSpacing, rowSpacing } = dims;
  let connections = [];

  workflow.connections.forEach(conn => {
    const fromNode = workflow.nodes.find(n => n.id === conn.from);
    const toNode = workflow.nodes.find(n => n.id === conn.to);

    if (!fromNode || !toNode) return;

    const fromX = fromNode.col * colSpacing + Math.floor(dims.width / 2);
    const fromY = (fromNode.row * rowSpacing) + dims.height;
    const toX = toNode.col * colSpacing + Math.floor(dims.width / 2);
    const toY = toNode.row * rowSpacing;

    // Simple vertical line for now
    const color = conn.type === 'requirements' ? 'blue' :
                  conn.type === 'code' ? 'green' :
                  conn.type === 'coordination' ? 'yellow' : 'cyan';

    connections.push({
      fromX, fromY, toX, toY, color
    });
  });

  return connections;
}

function renderWorkflow() {
  const dims = calculateNodeDimensions();
  let output = '\n';

  // Group nodes by row
  const rows = {};
  workflow.nodes.forEach(node => {
    if (!rows[node.row]) rows[node.row] = [];
    rows[node.row].push(node);
  });

  // Render each row
  Object.keys(rows).sort((a, b) => a - b).forEach(rowNum => {
    const nodesInRow = rows[rowNum];
    const renderedNodes = nodesInRow.map(node =>
      renderNode(node, dims, state.selectedNodeId === node.id)
    );

    // Render line by line
    const maxLines = Math.max(...renderedNodes.map(n => n.lines.length));
    for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
      let rowLine = '';

      renderedNodes.forEach((rendered, idx) => {
        const node = nodesInRow[idx];
        const spacing = rendered.x - rowLine.length;

        if (spacing > 0) {
          rowLine += ' '.repeat(spacing);
        }

        if (rendered.lines[lineIdx]) {
          rowLine += rendered.lines[lineIdx];
        }
      });

      output += rowLine + '\n';
    }

    // Connection lines between rows
    if (parseInt(rowNum) < 4) {
      output += '\n';
      // Simple downward arrows
      nodesInRow.forEach(node => {
        const conns = workflow.connections.filter(c => c.from === node.id);
        if (conns.length > 0) {
          const x = node.col * dims.colSpacing + Math.floor(dims.width / 2);
          output += ' '.repeat(x) + '│\n';
        }
      });
    }
  });

  return output;
}

// ============================================================================
// DETAILS PANEL
// ============================================================================

function renderDetailsPanel() {
  if (!state.selectedNodeId) {
    return '{center}{gray-fg}Select a node to view details\n\nUse arrow keys or Tab to navigate{/}{/center}';
  }

  const node = workflow.nodes.find(n => n.id === state.selectedNodeId);
  if (!node) return '';

  const statusColor = node.status === 'processing' ? 'green' :
                      node.status === 'active' ? 'cyan' : 'gray';

  let content = `
  {center}{bold}{yellow-fg}${node.name}{/}{/center}

  {bold}Type:{/} ${node.type}
  ${node.role ? `{bold}Role:{/} ${node.role}\n` : ''}
  {bold}Status:{/} {${statusColor}-fg}${node.status.toUpperCase()}{/}
  {bold}Progress:{/} ${node.progress}%

  {bold}Current Task:{/}
  ${node.task}

  ${node.metrics ? `
  {bold}Performance Metrics:{/}
  • Tasks completed: ${node.metrics.completed}
  • Avg time: ${node.metrics.avgTime}s
  ` : ''}

  {bold}Connected To:{/}
`;

  const connections = workflow.connections.filter(c => c.from === node.id);
  connections.forEach(conn => {
    const toNode = workflow.nodes.find(n => n.id === conn.to);
    if (toNode) {
      content += `  → ${toNode.name}\n`;
    }
  });

  return content;
}

// ============================================================================
// STATUS BAR
// ============================================================================

function renderStatusBar() {
  const status = readFrameworkStatus();
  const syncIcon = status.score >= 95 ? '🟢' : status.score >= 85 ? '🟡' : '🔴';
  const pauseIcon = state.isPaused ? '⏸ PAUSED' : '▶ LIVE';

  return (
    `  ${syncIcon} Sync: {bold}${status.score}%{/}  |  ` +
    `Orchestrators: {bold}${status.orchestrators_active}/${status.orchestrators_total}{/}  |  ` +
    `Zoom: {bold}${(state.zoomLevel * 100).toFixed(0)}%{/}  |  ` +
    `${state.isPaused ? '{yellow-fg}' : '{green-fg}'}${pauseIcon}{/}  |  ` +
    `Press {bold}h{/} for help`
  );
}

// ============================================================================
// FRAMEWORK DATA INTEGRATION
// ============================================================================

function readFrameworkStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore
  }
  return {
    score: 0,
    orchestrators_active: 0,
    orchestrators_total: 8,
    current_operation: 'Unknown'
  };
}

// ============================================================================
// MAIN UPDATE LOOP
// ============================================================================

function updateDashboard() {
  if (state.isPaused) {
    screen.render();
    return;
  }

  state.animationFrame++;

  // Update workflow simulation
  const activeNodeIndex = Math.floor(state.animationFrame / 5) % workflow.nodes.length;
  workflow.nodes.forEach((node, index) => {
    if (index === activeNodeIndex) {
      node.status = 'processing';
      node.progress = Math.min(100, (state.animationFrame % 5) * 20);
    } else if (index < activeNodeIndex) {
      node.status = 'active';
      node.progress = 100;
    } else {
      node.status = 'idle';
      node.progress = 0;
    }
  });

  // Update data flow animation
  updateDataFlowAnimation();

  // Render components
  workflowCanvas.setContent(renderWorkflow());
  detailsPanel.setContent(renderDetailsPanel());
  statusBar.setContent(renderStatusBar());

  screen.render();
}

// ============================================================================
// KEYBOARD CONTROLS
// ============================================================================

screen.key(['escape', 'q', 'Q', 'C-c'], () => {
  process.exit(0);
});

screen.key(['h', 'H'], () => {
  state.showHelp = !state.showHelp;
  helpOverlay.toggle();
  screen.render();
});

screen.key(['space'], () => {
  state.isPaused = !state.isPaused;
  updateDashboard();
});

screen.key(['r', 'R'], () => {
  updateDashboard();
});

screen.key(['+', '='], () => {
  state.zoomLevel = Math.min(2.0, state.zoomLevel + 0.1);
  updateDashboard();
});

screen.key(['-', '_'], () => {
  state.zoomLevel = Math.max(0.5, state.zoomLevel - 0.1);
  updateDashboard();
});

screen.key(['tab'], () => {
  const currentIndex = workflow.nodes.findIndex(n => n.id === state.selectedNodeId);
  const nextIndex = (currentIndex + 1) % workflow.nodes.length;
  state.selectedNodeId = workflow.nodes[nextIndex].id;
  updateDashboard();
});

screen.key(['f', 'F'], () => {
  const activeNode = workflow.nodes.find(n => n.status === 'processing');
  if (activeNode) {
    state.selectedNodeId = activeNode.id;
    updateDashboard();
  }
});

// Arrow keys for node navigation
screen.key(['up'], () => {
  const current = workflow.nodes.find(n => n.id === state.selectedNodeId);
  if (!current) {
    state.selectedNodeId = workflow.nodes[0].id;
  } else {
    const candidates = workflow.nodes.filter(n => n.row < current.row);
    if (candidates.length > 0) {
      state.selectedNodeId = candidates[candidates.length - 1].id;
    }
  }
  updateDashboard();
});

screen.key(['down'], () => {
  const current = workflow.nodes.find(n => n.id === state.selectedNodeId);
  if (!current) {
    state.selectedNodeId = workflow.nodes[0].id;
  } else {
    const candidates = workflow.nodes.filter(n => n.row > current.row);
    if (candidates.length > 0) {
      state.selectedNodeId = candidates[0].id;
    }
  }
  updateDashboard();
});

screen.key(['left'], () => {
  const current = workflow.nodes.find(n => n.id === state.selectedNodeId);
  if (!current) {
    state.selectedNodeId = workflow.nodes[0].id;
  } else {
    const candidates = workflow.nodes.filter(n => n.row === current.row && n.col < current.col);
    if (candidates.length > 0) {
      state.selectedNodeId = candidates[candidates.length - 1].id;
    }
  }
  updateDashboard();
});

screen.key(['right'], () => {
  const current = workflow.nodes.find(n => n.id === state.selectedNodeId);
  if (!current) {
    state.selectedNodeId = workflow.nodes[0].id;
  } else {
    const candidates = workflow.nodes.filter(n => n.row === current.row && n.col > current.col);
    if (candidates.length > 0) {
      state.selectedNodeId = candidates[0].id;
    }
  }
  updateDashboard();
});

// ============================================================================
// TERMINAL RESIZE HANDLER
// ============================================================================

process.stdout.on('resize', () => {
  updateDashboard();
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Select first node by default
state.selectedNodeId = workflow.nodes[0].id;

// Initial render
updateDashboard();

// Start animation loop
const intervalId = setInterval(updateDashboard, UPDATE_INTERVAL);

// Cleanup
process.on('exit', () => {
  clearInterval(intervalId);
});

screen.render();