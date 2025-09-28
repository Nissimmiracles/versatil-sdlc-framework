#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Visual HTML Test Report Generator
 * Creates interactive, browser-viewable test dashboards from JSON data
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
  gray: (text) => chalk.gray(text)
};

class VisualReportGenerator {
  constructor(options = {}) {
    this.options = {
      outputFile: options.outputFile || 'versatil-test-report.html',
      openBrowser: options.openBrowser !== false,
      includeRawData: options.includeRawData || false,
      ...options
    };

    this.testData = null;
    this.generatedAt = new Date().toISOString();
  }

  loadTestData() {
    const jsonFiles = [
      'enhanced-test-report.json',
      'test-results.json'
    ];

    for (const file of jsonFiles) {
      if (fs.existsSync(file)) {
        try {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          this.testData = data;
          console.log(colors.green(`✅ Loaded test data from: ${file}`));

          // Load Enhanced Maria intelligence data
          this.loadEnhancedMariaInsights();
          return true;
        } catch (error) {
          console.warn(colors.yellow(`⚠️  Could not parse ${file}: ${error.message}`));
        }
      }
    }

    console.error(colors.red('❌ No valid test data found. Run tests first with npm run test:all'));
    return false;
  }

  loadEnhancedMariaInsights() {
    try {
      if (fs.existsSync('enhanced-maria-insights.json')) {
        const insights = JSON.parse(fs.readFileSync('enhanced-maria-insights.json', 'utf8'));
        this.mariaInsights = insights;
        console.log(colors.green(`✅ Loaded Enhanced Maria insights: ${Object.keys(insights.qualityAnalysis).length} analyses`));
      } else {
        // Generate insights if not available
        const { IntelligentDataExtractor } = require('./intelligent-data-extractor.cjs');
        console.log(colors.yellow('⚠️  Generating Enhanced Maria insights...'));
        // Use fallback insights for now
        this.mariaInsights = null;
      }
    } catch (error) {
      console.warn(colors.yellow(`⚠️  Could not load Maria insights: ${error.message}`));
      this.mariaInsights = null;
    }
  }

  generateCSS() {
    return `
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
  max-width: 1200px;
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

.timestamp {
  font-size: 0.9rem;
  color: #888;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.card h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.success-rate {
  color: #22c55e;
}

.duration {
  color: #3b82f6;
}

.memory {
  color: #8b5cf6;
}

.phases {
  color: #f59e0b;
}

.phase-list {
  margin-top: 20px;
}

.phase-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.phase-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(5px);
}

.phase-name {
  font-weight: 600;
  color: #333;
}

.phase-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-pass {
  background: #dcfce7;
  color: #166534;
}

.status-fail {
  background: #fef2f2;
  color: #991b1b;
}

.duration-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 4px;
  transition: width 1s ease;
}

.system-info {
  background: linear-gradient(135deg, #1f2937, #374151);
  color: white;
  border-radius: 15px;
  padding: 25px;
  margin-top: 20px;
}

.system-info h3 {
  color: #f9fafb;
  margin-bottom: 15px;
}

.system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.system-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.error-section {
  margin-top: 30px;
}

.error-item {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
}

.error-title {
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 10px;
}

.error-details {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9rem;
  color: #666;
  background: #f9fafb;
  padding: 10px;
  border-radius: 6px;
  white-space: pre-wrap;
  overflow-x: auto;
}

.footer {
  text-align: center;
  padding: 30px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.emoji {
  font-style: normal;
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .header h1 {
    font-size: 2rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .metric-value {
    font-size: 2rem;
  }
}

.collapsible {
  cursor: pointer;
  user-select: none;
}

.collapsible:hover {
  background: rgba(0, 0, 0, 0.05);
}

.collapsible-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.collapsible-content.active {
  max-height: 1000px;
}

.toggle-icon {
  transition: transform 0.3s ease;
}

.toggle-icon.active {
  transform: rotate(180deg);
}
</style>
`;
  }

  generateJavaScript() {
    return `
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Animate progress bars
  const progressBars = document.querySelectorAll('.progress-fill');
  progressBars.forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.width = width;
    }, 500);
  });

  // Add collapsible functionality
  const collapsibles = document.querySelectorAll('.collapsible');
  collapsibles.forEach(collapsible => {
    collapsible.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.toggle-icon');

      content.classList.toggle('active');
      icon.classList.toggle('active');
    });
  });

  // Add hover effects and animations
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  console.log('VERSATIL Test Dashboard loaded successfully!');
});

// Utility functions for interactive features
function toggleSection(element) {
  const content = element.nextElementSibling;
  const icon = element.querySelector('.toggle-icon');

  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
}

function filterPhases(status) {
  const phases = document.querySelectorAll('.phase-item');
  phases.forEach(phase => {
    if (status === 'all' || phase.dataset.status === status) {
      phase.style.display = 'flex';
    } else {
      phase.style.display = 'none';
    }
  });
}

// Performance metrics calculation
function calculatePerformanceGrade(successRate) {
  if (successRate >= 95) return { grade: 'A+', color: '#22c55e' };
  if (successRate >= 90) return { grade: 'A', color: '#16a34a' };
  if (successRate >= 80) return { grade: 'B', color: '#ca8a04' };
  if (successRate >= 70) return { grade: 'C', color: '#ea580c' };
  return { grade: 'F', color: '#dc2626' };
}
</script>
`;
  }

  formatDuration(milliseconds) {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    const seconds = (milliseconds / 1000).toFixed(1);
    return `${seconds}s`;
  }

  formatMemory(bytes) {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  generateHTML() {
    if (!this.testData) {
      throw new Error('No test data loaded');
    }

    const data = this.testData;
    const summary = data.summary || {};
    const phases = data.phases || {};
    const systemInfo = data.systemInfo || {};

    const successRate = summary.successRate || 0;
    const totalDuration = this.formatDuration(summary.totalDuration || 0);
    const successfulPhases = summary.successfulPhases || 0;
    const totalPhases = summary.totalPhases || 0;

    // Generate phase items
    const phaseItems = Object.entries(phases).map(([name, phase]) => {
      const status = phase.success ? 'pass' : 'fail';
      const statusClass = phase.success ? 'status-pass' : 'status-fail';
      const statusText = phase.success ? '✅ PASS' : '❌ FAIL';
      const duration = this.formatDuration(phase.duration || 0);

      return `
        <div class="phase-item" data-status="${status}">
          <div class="phase-name">${name}</div>
          <div class="phase-status">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <span class="duration-badge">${duration}</span>
          </div>
        </div>
      `;
    }).join('');

    // Generate error details for failed phases
    const errorDetails = Object.entries(phases)
      .filter(([name, phase]) => !phase.success)
      .map(([name, phase]) => `
        <div class="error-item">
          <div class="error-title">❌ ${name}</div>
          <div class="error-details">${phase.error || 'Unknown error'}</div>
        </div>
      `).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VERSATIL Framework Test Dashboard</title>
  ${this.generateCSS()}
</head>
<body>
  <div class="container">
    <!-- Header Section -->
    <div class="header">
      <h1><span class="emoji">🚀</span> VERSATIL Framework Test Dashboard</h1>
      <div class="subtitle">Comprehensive AI-Native SDLC Framework Validation</div>
      <div class="timestamp">Generated: ${new Date(this.generatedAt).toLocaleString()}</div>
    </div>

    <!-- Executive Summary Dashboard -->
    <div class="dashboard-grid">
      <div class="card">
        <h3><span class="emoji">📊</span> Success Rate</h3>
        <div class="metric-value success-rate">${successRate.toFixed(1)}%</div>
        <div class="metric-label">Overall Test Success</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${successRate}%"></div>
        </div>
      </div>

      <div class="card">
        <h3><span class="emoji">⏱️</span> Duration</h3>
        <div class="metric-value duration">${totalDuration}</div>
        <div class="metric-label">Total Execution Time</div>
      </div>

      <div class="card">
        <h3><span class="emoji">🔧</span> Test Phases</h3>
        <div class="metric-value phases">${successfulPhases}/${totalPhases}</div>
        <div class="metric-label">Phases Completed</div>
      </div>

      <div class="card">
        <h3><span class="emoji">💾</span> Memory Usage</h3>
        <div class="metric-value memory">${systemInfo.memoryTotal || 'N/A'}</div>
        <div class="metric-label">System Memory</div>
      </div>
    </div>

    <!-- Phase Breakdown -->
    <div class="card">
      <h3><span class="emoji">📋</span> Phase Breakdown</h3>
      <div class="phase-list">
        ${phaseItems}
      </div>
    </div>

    ${this.generateEnhancedMariaIntelligence()}

    <!-- System Information -->
    <div class="system-info">
      <h3><span class="emoji">🖥️</span> System Information</h3>
      <div class="system-grid">
        <div class="system-item">
          <span>Platform:</span>
          <span>${systemInfo.platform || 'Unknown'} ${systemInfo.architecture || ''}</span>
        </div>
        <div class="system-item">
          <span>Node Version:</span>
          <span>${systemInfo.nodeVersion || 'Unknown'}</span>
        </div>
        <div class="system-item">
          <span>CPU Cores:</span>
          <span>${systemInfo.cpuCount || 'Unknown'}</span>
        </div>
        <div class="system-item">
          <span>Framework:</span>
          <span>${data.framework || 'VERSATIL SDLC'} v${data.version || '1.2.1'}</span>
        </div>
      </div>
    </div>

    ${errorDetails ? `
    <!-- Error Analysis -->
    <div class="card error-section">
      <h3><span class="emoji">🐛</span> Error Analysis</h3>
      ${errorDetails}
    </div>
    ` : ''}

    <!-- Raw Data (Optional) -->
    ${this.options.includeRawData ? `
    <div class="card">
      <h3 class="collapsible"><span class="emoji">📄</span> Raw Test Data <span class="toggle-icon">▼</span></h3>
      <div class="collapsible-content">
        <pre class="error-details">${JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p>Generated by VERSATIL Enhanced Test Runner • Framework v${data.version || '1.2.1'}</p>
    <p>🎯 Comprehensive AI-Native SDLC Framework with Enhanced BMAD Agent System</p>
  </div>

  ${this.generateJavaScript()}
</body>
</html>
`;

    return html;
  }

  async generate() {
    console.log(colors.blue('🎨 Generating visual HTML test report...'));

    if (!this.loadTestData()) {
      return false;
    }

    try {
      const html = this.generateHTML();
      const outputPath = path.resolve(this.options.outputFile);

      fs.writeFileSync(outputPath, html, 'utf8');

      console.log(colors.green(`✅ Visual report generated: ${outputPath}`));
      console.log(colors.gray(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)}KB`));

      if (this.options.openBrowser) {
        this.openInBrowser(outputPath);
      }

      return true;

    } catch (error) {
      console.error(colors.red(`❌ Error generating report: ${error.message}`));
      return false;
    }
  }

  generateEnhancedMariaIntelligence() {
    if (!this.mariaInsights) {
      return `
    <!-- Enhanced Maria Intelligence Not Available -->
    <div class="card">
      <h3><span class="emoji">🤖</span> Enhanced Maria Intelligence</h3>
      <div style="text-align: center; padding: 30px;">
        <p style="color: #666; margin-bottom: 15px;">Enhanced Maria insights not available</p>
        <p style="font-size: 0.9rem; color: #888;">Run <code>node test/intelligent-data-extractor.cjs</code> to generate AI insights</p>
      </div>
    </div>`;
    }

    const { qualityAnalysis, agentCoordination, recommendations } = this.mariaInsights;

    // Generate Quality Analysis Cards
    const qualityCards = Object.entries(qualityAnalysis).map(([analysisName, analysis]) => {
      const scoreColor = analysis.score >= 90 ? '#22c55e' :
                        analysis.score >= 75 ? '#f59e0b' :
                        analysis.score >= 50 ? '#ef4444' : '#dc2626';

      const issuesList = analysis.issues.map(issue => `
        <div style="background: #f8fafc; border-left: 4px solid ${issue.priority === 'critical' ? '#dc2626' : issue.priority === 'high' ? '#ef4444' : '#f59e0b'}; padding: 12px; margin: 8px 0; border-radius: 0 8px 8px 0;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${issue.description}</div>
          <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 6px;">📍 ${issue.location}</div>
          <div style="font-size: 0.9rem; color: #374151;">💡 ${issue.action}</div>
        </div>
      `).join('');

      const recommendationsList = analysis.recommendations.map(rec => `
        <li style="margin: 4px 0; color: #374151;">${rec}</li>
      `).join('');

      return `
        <div class="card" style="margin-bottom: 20px;">
          <h4 style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <span style="font-size: 1.1rem;">${analysisName.includes('Debug') ? '🐛' :
                                                analysisName.includes('Test') ? '🧪' :
                                                analysisName.includes('Security') ? '🔒' :
                                                analysisName.includes('Clean') ? '✨' : '📊'}</span>
            ${analysisName}
          </h4>

          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            <div style="font-size: 2.5rem; font-weight: bold; color: ${scoreColor};">${analysis.score}</div>
            <div>
              <div style="font-size: 0.9rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Quality Score</div>
              <div style="font-size: 0.85rem; color: #888;">📁 ${analysis.file}</div>
            </div>
          </div>

          ${analysis.criticalIssues > 0 ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <strong style="color: #991b1b;">🚨 ${analysis.criticalIssues} Critical Issue${analysis.criticalIssues > 1 ? 's' : ''} Detected</strong>
          </div>
          ` : ''}

          ${analysis.issues.length > 0 ? `
          <div style="margin-bottom: 15px;">
            <h5 style="margin-bottom: 10px; color: #374151;">📋 Detected Issues:</h5>
            ${issuesList}
          </div>
          ` : `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <span style="color: #166534;">✅ No issues detected - excellent code quality!</span>
          </div>
          `}

          ${analysis.recommendations.length > 0 ? `
          <div>
            <h5 style="margin-bottom: 8px; color: #374151;">💡 Recommendations:</h5>
            <ul style="margin-left: 20px;">
              ${recommendationsList}
            </ul>
          </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Generate Agent Coordination Section
    const coordinationItems = agentCoordination.map(coord => `
      <div style="background: rgba(255, 255, 255, 0.7); border-radius: 10px; padding: 15px; margin-bottom: 10px; border-left: 4px solid ${coord.priority === 'high' ? '#ef4444' : coord.priority === 'medium' ? '#f59e0b' : '#22c55e'};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1f2937;">${coord.trigger}</span>
          <span style="background: ${coord.priority === 'high' ? '#fef2f2' : coord.priority === 'medium' ? '#fef3c7' : '#f0fdf4'};
                       color: ${coord.priority === 'high' ? '#991b1b' : coord.priority === 'medium' ? '#92400e' : '#166534'};
                       padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
            ${coord.priority.toUpperCase()}
          </span>
        </div>
        <div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 6px;">
          🤝 ${coord.from} → ${coord.to.join(', ')}
        </div>
        <div style="font-size: 0.85rem; color: #374151;">
          📝 ${coord.reason}
        </div>
        <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 4px;">
          📁 ${coord.file}
        </div>
      </div>
    `).join('');

    // Generate Actionable Recommendations
    const actionableRecs = recommendations.filter(rec => rec.actionable).map(rec => {
      const priorityColor = rec.message.priority === 'critical' ? '#dc2626' :
                           rec.message.priority === 'high' ? '#ef4444' : '#f59e0b';
      const impactIcon = rec.impact === 'high' ? '🔥' : rec.impact === 'medium' ? '⚡' : '💡';

      return `
        <div style="background: rgba(255, 255, 255, 0.8); border-radius: 10px; padding: 15px; margin-bottom: 12px; border-left: 4px solid ${priorityColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #1f2937; text-transform: capitalize;">${rec.type.replace('-', ' ')}</span>
            <div style="display: flex; gap: 8px;">
              <span style="background: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">
                ${impactIcon} ${rec.impact.toUpperCase()}
              </span>
              <span style="background: ${priorityColor}; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem;">
                ${rec.message.priority.toUpperCase()}
              </span>
            </div>
          </div>
          <div style="font-size: 0.9rem; color: #374151; margin-bottom: 6px;">
            ${rec.message.description}
          </div>
          <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 6px;">
            📍 ${rec.message.location}
          </div>
          <div style="background: #f8fafc; border-radius: 6px; padding: 8px; font-size: 0.85rem; color: #374151;">
            ✨ <strong>Action:</strong> ${rec.message.action}
          </div>
        </div>
      `;
    }).join('');

    return `
    <!-- Enhanced Maria Intelligence Dashboard -->
    <div class="card" style="margin-bottom: 30px;">
      <h3><span class="emoji">🤖</span> Enhanced Maria - AI Quality Intelligence</h3>
      <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="font-size: 3rem;">🧠</div>
          <div>
            <div style="font-size: 1.2rem; font-weight: 600; color: #166534;">AI-Powered Code Quality Analysis</div>
            <div style="color: #16a34a;">Pattern detection • Quality scoring • Agent coordination</div>
          </div>
        </div>
      </div>

      <!-- Quality Analysis Results -->
      <h4 style="margin-bottom: 15px; color: #374151;">📊 Quality Analysis Results</h4>
      ${qualityCards}

      ${agentCoordination.length > 0 ? `
      <!-- Agent Coordination -->
      <h4 style="margin-bottom: 15px; color: #374151; margin-top: 25px;">🤝 Agent Coordination & Handoffs</h4>
      ${coordinationItems}
      ` : ''}

      ${recommendations.filter(rec => rec.actionable).length > 0 ? `
      <!-- Actionable Recommendations -->
      <h4 style="margin-bottom: 15px; color: #374151; margin-top: 25px;">💡 Actionable Recommendations</h4>
      ${actionableRecs}
      ` : ''}

      <!-- Summary Statistics -->
      <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 10px; padding: 20px; margin-top: 25px;">
        <h4 style="margin-bottom: 15px; color: #374151;">📈 Intelligence Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
          <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #3b82f6;">${Object.keys(qualityAnalysis).length}</div>
            <div style="font-size: 0.9rem; color: #6b7280;">Analysis Types</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #ef4444;">${Object.values(qualityAnalysis).reduce((sum, a) => sum + (a.criticalIssues || 0), 0)}</div>
            <div style="font-size: 0.9rem; color: #6b7280;">Critical Issues</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #f59e0b;">${agentCoordination.length}</div>
            <div style="font-size: 0.9rem; color: #6b7280;">Agent Handoffs</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #22c55e;">${recommendations.filter(rec => rec.actionable).length}</div>
            <div style="font-size: 0.9rem; color: #6b7280;">Recommendations</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  openInBrowser(filePath) {
    const { execSync } = require('child_process');
    const platform = process.platform;

    try {
      let command;
      if (platform === 'darwin') {
        command = `open "${filePath}"`;
      } else if (platform === 'win32') {
        command = `start "${filePath}"`;
      } else {
        command = `xdg-open "${filePath}"`;
      }

      execSync(command);
      console.log(colors.cyan('🌐 Opening report in browser...'));
    } catch (error) {
      console.warn(colors.yellow(`⚠️  Could not open browser: ${error.message}`));
      console.log(colors.gray(`   Open manually: file://${filePath}`));
    }
  }
}

// Handle command line execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    outputFile: args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'versatil-test-report.html',
    openBrowser: !args.includes('--no-browser'),
    includeRawData: args.includes('--include-raw-data')
  };

  const generator = new VisualReportGenerator(options);
  generator.generate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { VisualReportGenerator };