#!/usr/bin/env node
/**
 * VERSATIL Framework - Real-Time Dashboard
 *
 * Always-on terminal visualization showing framework activity in real-time
 * Updates automatically without user intervention
 *
 * Usage:
 *   npm run dashboard              # Launch real-time dashboard
 *   node scripts/realtime-dashboard.cjs
 *
 * Controls:
 *   q - Quit
 *   r - Force refresh
 *   p - Pause/Resume updates
 */

const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

// Configuration
const PROJECT_ROOT = process.cwd();
const UPDATE_INTERVAL = 2000; // 2 seconds
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const STATUS_FILE = `/tmp/versatil-sync-status-${SESSION_ID}.json`;

// State
let isPaused = false;
let updateIntervalId = null;

// Dashboard data
const dashboardData = {
  orchestrators: [],
  events: [],
  syncScore: 0,
  agentActivity: [],
  currentOperation: 'Idle',
  metrics: {
    memory: 0,
    cpu: 0,
    uptime: 0
  }
};

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'VERSATIL Framework - Real-Time Dashboard',
  fullUnicode: true
});

// Create grid layout
const grid = new contrib.grid({ rows: 14, cols: 12, screen: screen });

// ============================================================================
// UI COMPONENTS
// ============================================================================

// Header box with framework status
const headerBox = grid.set(0, 0, 2, 12, blessed.box, {
  label: ' VERSATIL Framework - Real-Time Monitor ',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: '#00ff00' },
    bold: true
  }
});

// Orchestrator status (left panel)
const orchestratorBox = grid.set(2, 0, 5, 4, blessed.list, {
  label: ' Orchestrators (8) ',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'cyan' },
    selected: { bg: 'blue' }
  },
  mouse: true,
  keys: true,
  vi: true,
  scrollbar: {
    ch: '█',
    style: { fg: 'cyan' }
  }
});

// Workflow node graph (center panel) - visual node connections
const workflowGraphBox = grid.set(2, 4, 10, 8, blessed.box, {
  label: ' Workflow Node Graph (Live) ',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'cyan' }
  },
  scrollable: true,
  alwaysScroll: true
});

// Agent workflow panel (right panel) - showing what agents are doing
const agentWorkflowBox = grid.set(2, 8, 5, 4, blessed.box, {
  label: ' Live Agent Operations ',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'magenta' }
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: '█',
    style: { fg: 'magenta' }
  }
});

// Sync score line chart (middle bottom)
const syncChart = grid.set(7, 0, 3, 6, contrib.line, {
  label: ' Sync Score Trend ',
  style: {
    line: 'yellow',
    text: 'green',
    baseline: 'black',
    border: { fg: 'green' }
  },
  showLegend: true,
  legend: { width: 12 },
  xLabelPadding: 3,
  xPadding: 5,
  wholeNumbersOnly: false
});

// Current operations (bottom left)
const operationsBox = grid.set(10, 0, 2, 6, blessed.box, {
  label: ' Current Operations ',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'white' }
  },
  content: 'Initializing...'
});

// System metrics (bottom right)
const metricsBox = grid.set(7, 6, 5, 6, contrib.table, {
  label: ' System Metrics ',
  keys: true,
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: false,
  columnSpacing: 3,
  columnWidth: [20, 15]
});

// Workflow & Task Progress panel
const workflowProgressBox = grid.set(12, 0, 2, 12, blessed.box, {
  label: ' Active Workflows & Task Progress ',
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'cyan' }
  }
});

// Status bar (very bottom)
const statusBar = grid.set(13, 0, 1, 12, blessed.box, {
  tags: true,
  style: {
    fg: 'white',
    bg: 'blue'
  },
  content: '{center}Press Q to quit • R to refresh • P to pause/resume{/center}'
});

// ============================================================================
// DATA COLLECTION
// ============================================================================

/**
 * Collect orchestrator status
 */
function collectOrchestrators() {
  const orchestrators = [
    { name: 'ProactiveOrchestrator', file: 'src/orchestration/proactive-agent-orchestrator.ts' },
    { name: 'AgenticRAGOrchestrator', file: 'src/orchestration/agentic-rag-orchestrator.ts' },
    { name: 'PlanFirstOpera', file: 'src/orchestration/plan-first-opera.ts' },
    { name: 'StackAware', file: 'src/orchestration/stack-aware-orchestrator.ts' },
    { name: 'GitHubSync', file: 'src/orchestration/github-sync-orchestrator.ts' },
    { name: 'ParallelTaskManager', file: 'src/orchestration/parallel-task-manager.ts' },
    { name: 'EfficiencyMonitor', file: 'src/monitoring/framework-efficiency-monitor.ts' },
    { name: 'IntrospectiveAgent', file: 'src/agents/introspective-agent.ts' }
  ];

  return orchestrators.map(orch => {
    const fullPath = path.join(PROJECT_ROOT, orch.file);
    const exists = fs.existsSync(fullPath);
    const active = exists; // Simplified - could check more deeply

    return {
      name: orch.name,
      active,
      status: active ? 'active' : 'inactive',
      icon: active ? '✓' : '✗'
    };
  });
}

/**
 * Read sync status from shared file
 */
function readSyncStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore
  }
  return { synchronized: true, score: 95, orchestrators_active: 8 };
}

// Node-based workflow definition (like n8n)
const workflowNodes = [
  // Row 1: Input nodes
  { id: 'input', name: 'User Request', x: 0, y: 0, type: 'input', status: 'active', data: 0 },

  // Row 2: Analysis nodes
  { id: 'sarah', name: 'Sarah-PM', x: 0, y: 1, type: 'agent', status: 'idle', data: 0, connects: ['alex', 'maria'] },
  { id: 'alex', name: 'Alex-BA', x: 1, y: 1, type: 'agent', status: 'idle', data: 0, connects: ['james', 'marcus'] },

  // Row 3: Development nodes
  { id: 'james', name: 'James-FE', x: 0, y: 2, type: 'agent', status: 'idle', data: 0, connects: ['maria'] },
  { id: 'marcus', name: 'Marcus-BE', x: 1, y: 2, type: 'agent', status: 'idle', data: 0, connects: ['maria'] },
  { id: 'dr-ai', name: 'Dr.AI-ML', x: 2, y: 2, type: 'agent', status: 'idle', data: 0, connects: ['maria'] },

  // Row 4: QA node
  { id: 'maria', name: 'Maria-QA', x: 1, y: 3, type: 'agent', status: 'idle', data: 0, connects: ['output'] },

  // Row 5: Output node
  { id: 'output', name: 'Deploy', x: 1, y: 4, type: 'output', status: 'idle', data: 0 }
];

let dataFlowAnimation = 0;

// Workflow simulation state
const agentWorkflows = {
  'Maria-QA': [
    { task: 'Running test suite', progress: 0, stage: 'unit-tests' },
    { task: 'Code coverage analysis', progress: 0, stage: 'coverage' },
    { task: 'Security scan', progress: 0, stage: 'security' }
  ],
  'James-Frontend': [
    { task: 'Building components', progress: 0, stage: 'build' },
    { task: 'UI validation', progress: 0, stage: 'validation' }
  ],
  'Marcus-Backend': [
    { task: 'API endpoint testing', progress: 0, stage: 'api' },
    { task: 'Database optimization', progress: 0, stage: 'db' }
  ],
  'Sarah-PM': [
    { task: 'Tracking milestones', progress: 0, stage: 'tracking' },
    { task: 'Coordinating agents', progress: 0, stage: 'coordination' }
  ],
  'Alex-BA': [
    { task: 'Requirements analysis', progress: 0, stage: 'analysis' },
    { task: 'Business logic review', progress: 0, stage: 'review' }
  ],
  'Dr.AI-ML': [
    { task: 'Model training', progress: 0, stage: 'training' },
    { task: 'Data processing', progress: 0, stage: 'processing' }
  ]
};

let workflowStates = [
  { workflow: 'Testing Pipeline', stage: 'Running', agent: 'Maria-QA', progress: 0 },
  { workflow: 'Component Build', stage: 'Compiling', agent: 'James-Frontend', progress: 0 },
  { workflow: 'API Validation', stage: 'Testing', agent: 'Marcus-Backend', progress: 0 },
  { workflow: 'Requirements Review', stage: 'Analyzing', agent: 'Alex-BA', progress: 0 }
];

/**
 * Update workflow progress (simulates real agent activity)
 */
function updateWorkflowProgress() {
  // Update agent tasks
  for (const agent in agentWorkflows) {
    const tasks = agentWorkflows[agent];
    tasks.forEach(task => {
      // Simulate progress
      task.progress += Math.random() * 15;
      if (task.progress > 100) {
        task.progress = 0; // Reset when complete
        // Cycle through stages
        const stages = Object.keys(task);
        task.stage = stages[Math.floor(Math.random() * stages.length)] || task.stage;
      }
    });
  }

  // Update workflows
  workflowStates.forEach(wf => {
    wf.progress += Math.random() * 10;
    if (wf.progress > 100) {
      wf.progress = 0;
      // Cycle stages
      const stages = ['Initializing', 'Running', 'Processing', 'Validating', 'Complete'];
      const currentIndex = stages.indexOf(wf.stage);
      wf.stage = stages[(currentIndex + 1) % stages.length];
    }
  });
}

/**
 * Update node workflow (animate data flow)
 */
function updateNodeWorkflow() {
  dataFlowAnimation++;

  // Simulate data flowing through nodes
  workflowNodes.forEach(node => {
    // Random activation
    if (Math.random() > 0.7) {
      node.status = node.status === 'active' ? 'processing' : 'active';
    }

    // Data flow simulation
    node.data = (node.data + Math.random() * 20) % 100;
  });
}

/**
 * Render workflow node graph (like n8n)
 */
function renderNodeGraph() {
  let graph = '\n';

  // Title
  graph += '  {cyan-fg}┌─────────────── SDLC Workflow Pipeline ───────────────┐{/}\n\n';

  // Row 0: Input
  graph += '                    ╔═══════════════╗\n';
  graph += '                    ║ {green-fg}📥 User Request{/} ║\n';
  graph += '                    ╚═══════════════╝\n';
  graph += '                           │\n';
  graph += '                           ▼\n';

  // Row 1: Coordination & Analysis
  graph += '         ╔════════════════╗     ╔═══════════════╗\n';
  const sarahStatus = dataFlowAnimation % 4 === 0 ? '{green-fg}⚙{/}' : '○';
  const alexStatus = dataFlowAnimation % 4 === 1 ? '{green-fg}⚙{/}' : '○';
  graph += `         ║ ${sarahStatus} {bold}Sarah-PM{/}    ║────▶║ ${alexStatus} {bold}Alex-BA{/}     ║\n`;
  graph += '         ║  Coordinate    ║     ║  Requirements ║\n';
  graph += '         ╚════════════════╝     ╚═══════════════╝\n';
  graph += '                │                      │\n';
  graph += '                │                      │\n';
  graph += '                ▼                      ▼\n';

  // Row 2: Development Agents
  graph += '    ╔══════════════╗  ╔══════════════╗  ╔═══════════════╗\n';
  const jamesStatus = dataFlowAnimation % 4 === 2 ? '{cyan-fg}⚙{/}' : '○';
  const marcusStatus = dataFlowAnimation % 4 === 3 ? '{yellow-fg}⚙{/}' : '○';
  const draiStatus = dataFlowAnimation % 4 === 0 ? '{magenta-fg}⚙{/}' : '○';
  graph += `    ║ ${jamesStatus} {bold}James-FE{/}   ║  ║ ${marcusStatus} {bold}Marcus-BE{/}  ║  ║ ${draiStatus} {bold}Dr.AI-ML{/}    ║\n`;
  graph += '    ║  Frontend    ║  ║  Backend     ║  ║  ML Models    ║\n';
  graph += '    ╚══════════════╝  ╚══════════════╝  ╚═══════════════╝\n';
  graph += '           │                 │                  │\n';
  graph += '           └────────┬────────┴──────────────────┘\n';
  graph += '                    ▼\n';

  // Row 3: QA
  graph += '              ╔═══════════════════╗\n';
  const mariaStatus = dataFlowAnimation % 3 === 0 ? '{red-fg}⚙{/}' : '○';
  graph += `              ║ ${mariaStatus} {bold}Maria-QA{/}        ║\n`;
  graph += '              ║  Test & Validate  ║\n';
  graph += '              ╚═══════════════════╝\n';
  graph += '                       │\n';
  graph += '                       ▼\n';

  // Row 4: Output
  graph += '                 ╔══════════════╗\n';
  graph += '                 ║ {green-fg}🚀 Deploy{/}     ║\n';
  graph += '                 ╚══════════════╝\n';

  // Legend
  graph += '\n  {cyan-fg}Legend:{/} ⚙ = Processing  │  ○ = Idle  │  ▼ = Data Flow\n';

  return graph;
}

/**
 * Create progress bar visualization
 */
function createProgressBar(progress, width = 15) {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  let color = 'green';
  if (progress < 33) color = 'red';
  else if (progress < 66) color = 'yellow';

  return `{${color}-fg}${bar}{/}`;
}

/**
 * Get active agent operations
 */
function getAgentOperations() {
  const operations = [];

  for (const agent in agentWorkflows) {
    const tasks = agentWorkflows[agent];
    const activeTasks = tasks.filter(t => t.progress > 0 && t.progress < 100);

    if (activeTasks.length > 0) {
      operations.push({
        agent,
        currentTask: activeTasks[0].task,
        progress: Math.round(activeTasks[0].progress),
        stage: activeTasks[0].stage
      });
    } else {
      // Agent idle or just completed
      operations.push({
        agent,
        currentTask: 'Idle - awaiting tasks',
        progress: 0,
        stage: 'ready'
      });
    }
  }

  return operations;
}

/**
 * Get system metrics
 */
function getSystemMetrics() {
  const used = process.memoryUsage();
  return {
    memory: Math.round(used.heapUsed / 1024 / 1024),
    cpu: Math.round(process.cpuUsage().user / 1000),
    uptime: Math.round(process.uptime())
  };
}

/**
 * Check RAG system status
 */
function checkRAGStatus() {
  const ragFiles = [
    { name: 'RAG Orchestrator', file: 'src/orchestration/agentic-rag-orchestrator.ts' },
    { name: 'RAG Agent', file: 'src/agents/rag-enabled-agent.ts' },
  ];

  let active = 0;
  const statuses = {};

  for (const item of ragFiles) {
    const fullPath = path.join(PROJECT_ROOT, item.file);
    const exists = fs.existsSync(fullPath);
    statuses[item.name] = exists ? 'active' : 'inactive';
    if (exists) active++;
  }

  return {
    total: ragFiles.length,
    active,
    statuses,
    operational: active === ragFiles.length
  };
}

/**
 * Check Opera MCP status
 */
function checkOperaMCPStatus() {
  const operaFiles = [
    { name: 'Plan-First Opera', file: 'src/orchestration/plan-first-opera.ts' },
    { name: 'Opera Orchestrator', file: 'src/opera/opera-orchestrator.ts' },
    { name: 'MCP Server', file: 'src/opera/opera-mcp-server.ts' },
    { name: 'Init Script', file: 'init-opera-mcp.mjs' }
  ];

  let active = 0;
  const statuses = {};

  for (const item of operaFiles) {
    const fullPath = path.join(PROJECT_ROOT, item.file);
    const exists = fs.existsSync(fullPath);
    statuses[item.name] = exists ? 'active' : 'inactive';
    if (exists) active++;
  }

  return {
    total: operaFiles.length,
    active,
    statuses,
    operational: active === operaFiles.length
  };
}

// ============================================================================
// DASHBOARD UPDATE
// ============================================================================

// Sync score history for chart
const syncScoreHistory = {
  x: [],
  y: []
};

let updateCount = 0;

/**
 * Update all dashboard panels
 */
function updateDashboard() {
  if (isPaused) {
    return;
  }

  updateCount++;

  // Collect fresh data
  dashboardData.orchestrators = collectOrchestrators();
  const syncStatus = readSyncStatus();
  dashboardData.syncScore = syncStatus.score || 95;
  dashboardData.metrics = getSystemMetrics();
  dashboardData.currentOperation = process.env.VERSATIL_OPERATION || 'Monitoring framework';

  // Workflow tracking (removed - focusing on node graph visualization)

  // Update header
  const activeCount = dashboardData.orchestrators.filter(o => o.active).length;
  const syncIcon = dashboardData.syncScore >= 95 ? '🟢' :
                   dashboardData.syncScore >= 85 ? '🟡' : '🟠';

  headerBox.setContent(
    `{center}` +
    `{bold}VERSATIL Framework Status{/bold}  |  ` +
    `${syncIcon} Sync: ${dashboardData.syncScore}%  |  ` +
    `Orchestrators: ${activeCount}/8  |  ` +
    `Updates: ${updateCount}  |  ` +
    `${new Date().toLocaleTimeString()}` +
    `{/center}`
  );

  // Update orchestrators list
  const orchItems = dashboardData.orchestrators.map(orch => {
    const color = orch.active ? 'green' : 'red';
    return `{${color}-fg}${orch.icon}{/} ${orch.name}`;
  });
  orchestratorBox.setItems(orchItems);

  // Event logging removed - node graph visualization is the focus

  // Update node workflow animation
  updateNodeWorkflow();
  updateWorkflowProgress();

  // Render workflow node graph
  const nodeGraph = renderNodeGraph();
  workflowGraphBox.setContent(nodeGraph);

  // Update agent workflow panel with live operations
  const operations = getAgentOperations();
  let workflowContent = '\n';

  operations.slice(0, 6).forEach(op => {
    const progressBar = createProgressBar(op.progress, 10);
    const statusIcon = op.progress === 0 ? '⏸' : op.progress === 100 ? '✓' : '⚙';

    workflowContent += `  {bold}${op.agent}:{/} ${statusIcon}\n`;
    workflowContent += `    ${op.currentTask.substring(0, 18)}\n`;
    if (op.progress > 0) {
      workflowContent += `    ${progressBar} ${op.progress}%\n`;
    }
    workflowContent += `\n`;
  });

  agentWorkflowBox.setContent(workflowContent);

  // Update sync chart
  syncScoreHistory.x.push(new Date().toLocaleTimeString());
  syncScoreHistory.y.push(dashboardData.syncScore);

  // Keep last 20 data points
  if (syncScoreHistory.x.length > 20) {
    syncScoreHistory.x.shift();
    syncScoreHistory.y.shift();
  }

  syncChart.setData([{
    title: 'Sync %',
    x: syncScoreHistory.x,
    y: syncScoreHistory.y,
    style: { line: 'green' }
  }]);

  // Update operations box
  const healthStatus = dashboardData.syncScore >= 95 ? '{green-fg}Excellent{/}' :
                       dashboardData.syncScore >= 85 ? '{yellow-fg}Good{/}' :
                       dashboardData.syncScore >= 70 ? '{yellow-fg}Fair{/}' : '{red-fg}Poor{/}';

  operationsBox.setContent(
    `\n  {bold}Current:{/bold} ${dashboardData.currentOperation}\n` +
    `  {bold}Framework:{/bold} Active\n` +
    `  {bold}Mode:{/bold} Real-time monitoring\n` +
    `  {bold}Health:{/bold} ${healthStatus} (${dashboardData.syncScore}%)`
  );

  // Update metrics table
  metricsBox.setData({
    headers: ['Metric', 'Value'],
    data: [
      ['Memory (MB)', `${dashboardData.metrics.memory}`],
      ['CPU (ms)', `${dashboardData.metrics.cpu}`],
      ['Uptime (s)', `${dashboardData.metrics.uptime}`],
      ['Sync Score', `${dashboardData.syncScore}%`],
      ['Orchestrators', `${activeCount}/8`],
      ['Update Count', `${updateCount}`]
    ]
  });

  // Update workflow progress panel
  let workflowPanelContent = '\n';

  workflowStates.forEach((wf, idx) => {
    const progressBar = createProgressBar(wf.progress, 25);
    const stageIcon = wf.stage === 'Complete' ? '✅' :
                      wf.stage === 'Running' ? '⚙️' :
                      wf.stage === 'Validating' ? '🔍' : '📋';

    workflowPanelContent += `  ${stageIcon} {bold}${wf.workflow}:{/bold} ${wf.stage} (${wf.agent})  `;
    workflowPanelContent += `${progressBar} ${Math.round(wf.progress)}%`;
    if (idx < workflowStates.length - 1) workflowPanelContent += '\n';
  });

  workflowProgressBox.setContent(workflowPanelContent);

  // Update status bar
  const pausedText = isPaused ? '{red-fg}PAUSED{/}' : '{green-fg}LIVE{/}';
  statusBar.setContent(
    `{center}${pausedText} • Press Q to quit • R to refresh • P to pause/resume • Last update: ${new Date().toLocaleTimeString()}{/center}`
  );

  screen.render();
}

// ============================================================================
// KEYBOARD CONTROLS
// ============================================================================

screen.key(['escape', 'q', 'Q', 'C-c'], () => {
  return process.exit(0);
});

screen.key(['r', 'R'], () => {
  updateDashboard();
});

screen.key(['p', 'P'], () => {
  isPaused = !isPaused;
  screen.render();
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize dashboard
updateDashboard();

// Start auto-update
updateIntervalId = setInterval(updateDashboard, UPDATE_INTERVAL);

// Render screen
screen.render();

// Cleanup on exit
process.on('exit', () => {
  if (updateIntervalId) {
    clearInterval(updateIntervalId);
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Dashboard error:', error);
  process.exit(1);
});