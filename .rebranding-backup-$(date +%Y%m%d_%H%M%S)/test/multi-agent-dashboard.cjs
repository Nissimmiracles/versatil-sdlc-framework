#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Multi-Agent Collaboration Dashboard
 * Shows real results from all BMAD agents working together
 */

const fs = require('fs');
const path = require('path');

// Chalk compatibility handling
const chalkModule = require('chalk');
const chalk = chalkModule.default || chalkModule;

const colors = {
  blue: (text) => chalk.blue(text),
  green: (text) => chalk.green(text),
  red: (text) => chalk.red(text),
  yellow: (text) => chalk.yellow(text),
  cyan: (text) => chalk.cyan(text),
  gray: (text) => chalk.gray(text),
  magenta: (text) => chalk.magenta(text)
};

class MultiAgentDashboard {
  constructor() {
    this.outputFile = 'multi-agent-dashboard.html';
  }

  loadMultiAgentResults() {
    try {
      const results = JSON.parse(fs.readFileSync('multi-agent-results.json', 'utf8'));
      console.log(colors.green('✅ Loaded multi-agent results'));
      return results;
    } catch (error) {
      console.warn(colors.yellow('⚠️  No multi-agent results found. Run multi-agent-orchestrator.cjs first.'));
      return null;
    }
  }

  generateHTML(results) {
    if (!results) {
      return this.generateNoResultsHTML();
    }

    const { agents, coordination, summary, frontend, backend, qa, security } = results;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VERSATIL Multi-Agent Collaboration Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }

    .header .subtitle {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 20px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    .summary-card:hover {
      transform: translateY(-5px);
    }

    .summary-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .summary-label {
      font-size: 0.9rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .agent-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .agent-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .agent-icon {
      font-size: 2rem;
    }

    .agent-name {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
    }

    .agent-domain {
      font-size: 0.9rem;
      color: #666;
    }

    .agent-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: auto;
    }

    .status-loaded {
      background: #dcfce7;
      color: #166534;
    }

    .status-failed {
      background: #fef2f2;
      color: #991b1b;
    }

    .domain-results {
      margin-top: 15px;
    }

    .file-result {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .file-path {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #374151;
      margin-bottom: 8px;
    }

    .score-display {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .score-value {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .score-excellent { color: #22c55e; }
    .score-good { color: #f59e0b; }
    .score-poor { color: #ef4444; }

    .issues-list {
      margin-top: 10px;
    }

    .issue-item {
      background: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #ef4444;
      padding: 8px 12px;
      margin-bottom: 6px;
      border-radius: 0 6px 6px 0;
      font-size: 0.85rem;
    }

    .issue-high { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    .issue-medium { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .issue-low { border-left-color: #6b7280; background: rgba(107, 114, 128, 0.1); }

    .coordination-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .coordination-item {
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 10px;
      border-left: 4px solid #22c55e;
    }

    .handoff-flow {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .arrow {
      color: #22c55e;
      font-size: 1.2rem;
    }

    .coordination-reason {
      color: #374151;
      font-size: 0.9rem;
    }

    .priority-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 10px;
    }

    .priority-high { background: #fef2f2; color: #991b1b; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-low { background: #f0fdf4; color: #166534; }

    .footer {
      text-align: center;
      padding: 30px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .container { padding: 10px; }
      .header h1 { font-size: 2rem; }
      .agents-grid { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🤖 VERSATIL Multi-Agent Collaboration Dashboard</h1>
      <div class="subtitle">Real-time BMAD Agent System Analysis & Coordination</div>
      <div style="font-size: 0.9rem; color: #888; margin-top: 10px;">
        Generated: ${new Date().toLocaleString()}
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-value" style="color: #3b82f6;">${summary.activeAgents}/${summary.totalAgents}</div>
        <div class="summary-label">Active Agents</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" style="color: #22c55e;">${summary.activeDomains}/${summary.totalDomains}</div>
        <div class="summary-label">Domains Tested</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" style="color: #f59e0b;">${summary.totalPatterns}</div>
        <div class="summary-label">Issues Found</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" style="color: #ef4444;">${summary.criticalIssues}</div>
        <div class="summary-label">Critical Issues</div>
      </div>
      <div class="summary-card">
        <div class="summary-value" style="color: #8b5cf6;">${summary.coordinationEvents}</div>
        <div class="summary-label">Agent Handoffs</div>
      </div>
    </div>

    <!-- Agent Results -->
    <div class="agents-grid">
      ${this.generateAgentCards(agents, { frontend, backend, qa, security })}
    </div>

    ${coordination.length > 0 ? `
    <!-- Agent Coordination -->
    <div class="coordination-section">
      <h3 style="margin-bottom: 20px; color: #374151;">🤝 Agent Coordination & Handoffs</h3>
      ${coordination.map(coord => this.generateCoordinationItem(coord)).join('')}
    </div>
    ` : ''}

  </div>

  <div class="footer">
    <p>🎭 VERSATIL Multi-Agent System • Real BMAD Agent Collaboration</p>
    <p>Enhanced Maria • Enhanced James • Enhanced Marcus • Security Sam</p>
  </div>

  <script>
    console.log('🤖 VERSATIL Multi-Agent Dashboard loaded successfully!');

    // Add interactive hover effects
    document.querySelectorAll('.agent-card, .summary-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
      });

      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
      });
    });
  </script>
</body>
</html>`;
  }

  generateAgentCards(agents, domainResults) {
    return Object.entries(agents).map(([agentId, agent]) => {
      const domainKey = this.getDomainKey(agentId);
      const domain = domainResults[domainKey];

      return `
        <div class="agent-card">
          <div class="agent-header">
            <div class="agent-icon">${agent.icon}</div>
            <div>
              <div class="agent-name">${agent.name}</div>
              <div class="agent-domain">${agent.domain}</div>
            </div>
            <div class="agent-status status-${agent.status}">
              ${agent.status === 'loaded' ? '✅ ACTIVE' : '❌ FAILED'}
            </div>
          </div>

          ${agent.status === 'loaded' && domain ? `
          <div class="domain-results">
            <h4 style="margin-bottom: 10px; color: #374151;">📊 Domain Analysis</h4>
            ${domain.files.map(file => this.generateFileResult(file)).join('')}

            ${domain.patterns.length > 0 ? `
            <div style="margin-top: 15px;">
              <h5 style="color: #374151; margin-bottom: 8px;">⚠️ Issues Detected:</h5>
              ${domain.patterns.map(pattern => `
                <div class="issue-item issue-${pattern.priority}">
                  <strong>${pattern.type}:</strong> ${pattern.description}
                  <br><small>📍 ${pattern.location}</small>
                </div>
              `).join('')}
            </div>
            ` : `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 15px;">
              <span style="color: #166534;">✅ No issues detected - excellent work!</span>
            </div>
            `}
          </div>
          ` : agent.status === 'failed' ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px;">
            <span style="color: #991b1b;">❌ ${agent.error}</span>
          </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  generateFileResult(file) {
    const scoreClass = file.score >= 90 ? 'score-excellent' :
                      file.score >= 70 ? 'score-good' : 'score-poor';

    return `
      <div class="file-result">
        <div class="file-path">📄 ${file.filePath}</div>
        <div class="score-display">
          <div class="score-value ${scoreClass}">${file.score}/100</div>
          <div style="font-size: 0.85rem; color: #6b7280;">Quality Score</div>
        </div>
        ${file.issues.length > 0 ? `
          <div style="font-size: 0.8rem; color: #ef4444;">
            🚨 ${file.issues.length} issue${file.issues.length > 1 ? 's' : ''} found
          </div>
        ` : `
          <div style="font-size: 0.8rem; color: #22c55e;">
            ✅ No issues detected
          </div>
        `}
      </div>
    `;
  }

  generateCoordinationItem(coord) {
    return `
      <div class="coordination-item">
        <div class="handoff-flow">
          <span>${this.getAgentIcon(coord.from)} ${this.getAgentName(coord.from)}</span>
          <span class="arrow">→</span>
          <span>${coord.handoffs.map(h => this.getAgentIcon(h) + ' ' + this.getAgentName(h)).join(', ')}</span>
          <span class="priority-badge priority-${coord.priority}">${coord.priority}</span>
        </div>
        <div class="coordination-reason">
          📝 ${coord.reason} in ${coord.domain} domain
        </div>
      </div>
    `;
  }

  getDomainKey(agentId) {
    const mapping = {
      'enhanced-james': 'frontend',
      'enhanced-marcus': 'backend',
      'enhanced-maria': 'qa',
      'security-sam': 'security',
      'alex-ba': 'business',
      'sarah-pm': 'project'
    };
    return mapping[agentId];
  }

  getAgentIcon(agentId) {
    const icons = {
      'enhanced-james': '🎨',
      'enhanced-marcus': '⚙️',
      'enhanced-maria': '🧪',
      'security-sam': '🔒',
      'alex-ba': '📊',
      'sarah-pm': '📋'
    };
    return icons[agentId] || '🤖';
  }

  getAgentName(agentId) {
    const names = {
      'enhanced-james': 'Enhanced James',
      'enhanced-marcus': 'Enhanced Marcus',
      'enhanced-maria': 'Enhanced Maria',
      'security-sam': 'Security Sam',
      'alex-ba': 'Alex BA',
      'sarah-pm': 'Sarah PM'
    };
    return names[agentId] || agentId;
  }

  generateNoResultsHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VERSATIL Multi-Agent Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 50px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .message {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
    }
  </style>
</head>
<body>
  <div class="message">
    <h1>🤖 Multi-Agent Dashboard</h1>
    <p>No multi-agent results found.</p>
    <p>Run the multi-agent orchestrator first:</p>
    <code>node test/multi-agent-orchestrator.cjs</code>
  </div>
</body>
</html>`;
  }

  async generate() {
    console.log(colors.cyan('🎨 Generating Multi-Agent Collaboration Dashboard...'));

    const results = this.loadMultiAgentResults();
    const html = this.generateHTML(results);

    fs.writeFileSync(this.outputFile, html, 'utf8');
    console.log(colors.green(`✅ Dashboard generated: ${this.outputFile}`));

    return this.outputFile;
  }
}

// Execute if run directly
if (require.main === module) {
  const dashboard = new MultiAgentDashboard();
  dashboard.generate().then(outputFile => {
    console.log(colors.cyan(`🎭 Multi-Agent Dashboard ready: ${outputFile}`));

    // Open dashboard
    const { execSync } = require('child_process');
    try {
      execSync(`open "${outputFile}"`);
      console.log(colors.cyan('🌐 Opening dashboard in browser...'));
    } catch (error) {
      console.log(colors.gray(`   Open manually: file://${path.resolve(outputFile)}`));
    }
  }).catch(error => {
    console.error(colors.red('❌ Dashboard generation failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { MultiAgentDashboard };