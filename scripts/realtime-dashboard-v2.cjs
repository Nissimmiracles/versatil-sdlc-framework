#!/usr/bin/env node
/**
 * VERSATIL Framework - Interactive Workflow Dashboard v2
 *
 * Responsive, interactive n8n-style workflow visualization
 * Large nodes, clear connections, animated data flow
 *
 * Controls:
 *   q - Quit
 *   ↑/↓ - Scroll workflow view
 *   + - Zoom in (larger nodes)
 *   - - Zoom out (smaller nodes)
 *   space - Pause/Resume animation
 */

const fs = require('fs');
const blessed = require('blessed');

// Configuration
const PROJECT_ROOT = process.cwd();
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const STATUS_FILE = `/tmp/versatil-sync-status-${SESSION_ID}.json`;

// Animation state
let animationFrame = 0;
let isPaused = false;
let zoomLevel = 1; // 1 = normal, 2 = large, 0.5 = compact

// Workflow nodes with connections
const workflow = {
  nodes: [
    { id: 'input', name: '📥 User Request', type: 'trigger', row: 0, col: 2, status: 'active' },

    { id: 'sarah', name: '👔 Sarah-PM', role: 'Project Manager', type: 'agent', row: 1, col: 1, status: 'idle', task: 'Coordinate team' },
    { id: 'alex', name: '📊 Alex-BA', role: 'Business Analyst', type: 'agent', row: 1, col: 3, status: 'idle', task: 'Analyze requirements' },

    { id: 'james', name: '🎨 James-Frontend', role: 'Frontend Dev', type: 'agent', row: 2, col: 0, status: 'idle', task: 'Build UI components' },
    { id: 'marcus', name: '⚙️  Marcus-Backend', role: 'Backend Dev', type: 'agent', row: 2, col: 2, status: 'idle', task: 'Create APIs' },
    { id: 'dr-ai', name: '🤖 Dr.AI-ML', role: 'ML Engineer', type: 'agent', row: 2, col: 4, status: 'idle', task: 'Train models' },

    { id: 'maria', name: '✅ Maria-QA', role: 'QA Engineer', type: 'agent', row: 3, col: 2, status: 'idle', task: 'Test & validate' },

    { id: 'deploy', name: '🚀 Deploy', type: 'action', row: 4, col: 2, status: 'idle' }
  ],

  connections: [
    { from: 'input', to: 'sarah' },
    { from: 'input', to: 'alex' },
    { from: 'sarah', to: 'james' },
    { from: 'sarah', to: 'marcus' },
    { from: 'alex', to: 'james' },
    { from: 'alex', to: 'marcus' },
    { from: 'alex', to: 'dr-ai' },
    { from: 'james', to: 'maria' },
    { from: 'marcus', to: 'maria' },
    { from: 'dr-ai', to: 'maria' },
    { from: 'maria', to: 'deploy' }
  ]
};

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'VERSATIL Interactive Workflow Dashboard',
  fullUnicode: true
});

// Main workflow canvas
const workflowBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '85%',
  tags: true,
  border: { type: 'line', fg: 'cyan' },
  label: ' VERSATIL SDLC Workflow Pipeline ',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: '█',
    style: { fg: 'cyan' }
  },
  keys: true,
  vi: true,
  mouse: true
});

// Status bar
const statusBar = blessed.box({
  parent: screen,
  bottom: 4,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  border: { type: 'line', fg: 'cyan' }
});

// Help bar
const helpBar = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  content: '{center}{cyan-fg}Q{/}: Quit  {cyan-fg}↑↓{/}: Scroll  {cyan-fg}+/-{/}: Zoom  {cyan-fg}Space{/}: Pause/Resume  {cyan-fg}R{/}: Refresh{/center}',
  style: { border: { fg: 'cyan' } }
});

// Read framework status
function readFrameworkStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore
  }
  return { score: 0, orchestrators_active: 0, orchestrators_total: 8 };
}

// Render workflow with large, responsive nodes
function renderWorkflow() {
  const nodeWidth = 24 * zoomLevel;
  const nodeHeight = 6 * zoomLevel;
  const colSpacing = 28 * zoomLevel;
  const rowSpacing = 8 * zoomLevel;

  let output = '\n\n';

  // Group nodes by row
  const rows = {};
  workflow.nodes.forEach(node => {
    if (!rows[node.row]) rows[node.row] = [];
    rows[node.row].push(node);
  });

  // Render each row
  Object.keys(rows).sort().forEach(rowNum => {
    const nodesInRow = rows[rowNum];
    const maxCol = Math.max(...nodesInRow.map(n => n.col));

    // Calculate centering offset
    const totalWidth = (maxCol + 1) * colSpacing;
    const screenCenter = 50; // Approximate center
    const offset = Math.max(0, screenCenter - totalWidth / 2);

    // Render node boxes
    for (let line = 0; line < nodeHeight; line++) {
      let rowLine = ' '.repeat(offset);

      nodesInRow.forEach(node => {
        const x = node.col * colSpacing;
        const padding = ' '.repeat(x);

        // Node border and content
        if (line === 0) {
          // Top border
          rowLine += padding + '╔' + '═'.repeat(nodeWidth - 2) + '╗';
        } else if (line === nodeHeight - 1) {
          // Bottom border
          rowLine += padding + '╚' + '═'.repeat(nodeWidth - 2) + '╝';
        } else if (line === 1) {
          // Node name
          const statusIcon = node.status === 'active' ? '{green-fg}⚙{/}' :
                            node.status === 'processing' ? '{yellow-fg}⚙{/}' : '{white-fg}○{/}';
          const name = node.name.padEnd(nodeWidth - 4);
          rowLine += padding + `║ ${statusIcon} {bold}${name.substring(0, nodeWidth - 6)}{/} ║`;
        } else if (line === 2 && node.role) {
          // Role
          const role = node.role.padEnd(nodeWidth - 4);
          rowLine += padding + `║  {cyan-fg}${role.substring(0, nodeWidth - 4)}{/}  ║`;
        } else if (line === 3 && node.task) {
          // Current task
          const task = node.task.padEnd(nodeWidth - 4);
          rowLine += padding + `║  {gray-fg}${task.substring(0, nodeWidth - 4)}{/}  ║`;
        } else {
          // Empty line
          rowLine += padding + '║' + ' '.repeat(nodeWidth - 2) + '║';
        }
      });

      output += rowLine + '\n';
    }

    // Render connections to next row
    if (parseInt(rowNum) < 4) {
      output += '\n';

      // Draw connecting lines
      nodesInRow.forEach(sourceNode => {
        const connections = workflow.connections.filter(c => c.from === sourceNode.id);
        connections.forEach(conn => {
          const targetNode = workflow.nodes.find(n => n.id === conn.to);
          if (targetNode) {
            const sourceX = offset + sourceNode.col * colSpacing + nodeWidth / 2;
            const targetX = offset + targetNode.col * colSpacing + nodeWidth / 2;

            // Simple vertical line for now
            const spaces = ' '.repeat(Math.floor(sourceX));
            output += spaces + '│\n';
          }
        });
      });

      output += '\n';
    }
  });

  // Legend
  output += '\n{cyan-fg}Legend:{/} ⚙ = Processing  ○ = Idle  │ = Data Flow\n';

  return output;
}

// Update workflow animation
function updateWorkflow() {
  if (isPaused) return;

  animationFrame++;

  // Simulate workflow progression
  const activeNodeIndex = animationFrame % workflow.nodes.length;

  workflow.nodes.forEach((node, index) => {
    if (index === activeNodeIndex) {
      node.status = 'processing';
    } else if (index < activeNodeIndex) {
      node.status = 'active';
    } else {
      node.status = 'idle';
    }
  });

  // Render
  const content = renderWorkflow();
  workflowBox.setContent(content);

  // Update status bar
  const status = readFrameworkStatus();
  const syncIcon = status.score >= 95 ? '🟢' : status.score >= 85 ? '🟡' : '🔴';

  statusBar.setContent(
    `  ${syncIcon} Sync: {bold}${status.score}%{/}  |  ` +
    `Orchestrators: {bold}${status.orchestrators_active}/${status.orchestrators_total}{/}  |  ` +
    `Frame: ${animationFrame}  |  ` +
    `Zoom: ${zoomLevel}x  |  ` +
    `${isPaused ? '{yellow-fg}⏸ PAUSED{/}' : '{green-fg}▶ LIVE{/}'}`
  );

  screen.render();
}

// Keyboard controls
screen.key(['escape', 'q', 'Q', 'C-c'], () => {
  process.exit(0);
});

screen.key(['r', 'R'], () => {
  updateWorkflow();
});

screen.key(['space'], () => {
  isPaused = !isPaused;
  updateWorkflow();
});

screen.key(['+', '='], () => {
  zoomLevel = Math.min(2, zoomLevel + 0.25);
  updateWorkflow();
});

screen.key(['-', '_'], () => {
  zoomLevel = Math.max(0.5, zoomLevel - 0.25);
  updateWorkflow();
});

// Mouse support
workflowBox.on('wheeldown', () => {
  workflowBox.scroll(3);
  screen.render();
});

workflowBox.on('wheelup', () => {
  workflowBox.scroll(-3);
  screen.render();
});

// Initialize
updateWorkflow();
const intervalId = setInterval(updateWorkflow, 2000);

// Cleanup
process.on('exit', () => {
  clearInterval(intervalId);
});

screen.render();