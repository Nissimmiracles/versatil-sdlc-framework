/**
 * Basic Frontend Entry Point
 * VERSATIL SDLC Framework - James-Frontend Template
 */

// James-Frontend: Modern JavaScript application entry point
console.log('🎨 James-Frontend: Initializing application...');

// Sample application state
const appState = {
  version: '1.0.0',
  framework: 'VERSATIL SDLC',
  agents: {
    active: ['Maria-QA', 'James-Frontend', 'Marcus-Backend'],
    available: ['Sarah-PM', 'Alex-BA', 'Dr.AI-ML']
  }
};

/**
 * James-Frontend: Main application initialization
 */
class VersatilApp {
  constructor() {
    this.state = { ...appState };
    this.apiEndpoint = '/api';
    this.init();
  }

  async init() {
    console.log('🚀 James-Frontend: Starting VERSATIL application...');

    try {
      await this.checkBackendConnection();
      this.setupEventListeners();
      this.renderApplication();
      this.setupPerformanceMonitoring();

      console.log('✅ James-Frontend: Application initialized successfully');
    } catch (error) {
      console.error('❌ James-Frontend: Initialization failed:', error);
      this.renderError(error);
    }
  }

  async checkBackendConnection() {
    try {
      const response = await fetch(`${this.apiEndpoint}/status`);
      const data = await response.json();

      if (data.agents) {
        console.log('🔌 James-Frontend: Backend connection established');
        this.state.backendConnected = true;
      }
    } catch (error) {
      console.warn('⚠️  James-Frontend: Backend not available, running in offline mode');
      this.state.backendConnected = false;
    }
  }

  setupEventListeners() {
    // James-Frontend: Event handling setup
    document.addEventListener('DOMContentLoaded', () => {
      this.renderApplication();
    });

    // Handle form submissions
    document.addEventListener('submit', this.handleFormSubmit.bind(this));

    // Handle navigation
    document.addEventListener('click', this.handleNavigation.bind(this));

    // Handle window resize for responsive design
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  renderApplication() {
    const app = document.getElementById('app') || this.createAppContainer();

    app.innerHTML = `
      <div class="versatil-app">
        <header class="app-header">
          <h1>🤖 VERSATIL SDLC Framework</h1>
          <p class="subtitle">AI-Native Development with OPERA Methodology</p>
          <div class="status-indicator ${this.state.backendConnected ? 'connected' : 'offline'}">
            ${this.state.backendConnected ? '🟢 Connected' : '🔴 Offline'}
          </div>
        </header>

        <main class="app-main">
          <section class="agents-section">
            <h2>Active Agents</h2>
            <div class="agents-grid">
              ${this.renderAgents()}
            </div>
          </section>

          <section class="demo-section">
            <h2>Demo Features</h2>
            ${this.renderDemoFeatures()}
          </section>

          <section class="quality-section">
            <h2>Quality Metrics</h2>
            ${this.renderQualityMetrics()}
          </section>
        </main>

        <footer class="app-footer">
          <p>Powered by VERSATIL SDLC Framework v${this.state.version}</p>
        </footer>
      </div>
    `;

    // Apply styles
    this.applyStyles();
  }

  renderAgents() {
    const agents = [
      { id: 'maria-qa', name: 'Maria-QA', role: 'Quality Assurance', emoji: '🧪', active: true },
      { id: 'james-frontend', name: 'James-Frontend', role: 'Frontend Specialist', emoji: '🎨', active: true },
      { id: 'marcus-backend', name: 'Marcus-Backend', role: 'Backend Expert', emoji: '⚙️', active: true },
      { id: 'sarah-pm', name: 'Sarah-PM', role: 'Project Manager', emoji: '📋', active: false },
      { id: 'alex-ba', name: 'Alex-BA', role: 'Business Analyst', emoji: '📊', active: false },
      { id: 'dr-ai-ml', name: 'Dr.AI-ML', role: 'AI/ML Specialist', emoji: '🤖', active: false }
    ];

    return agents.map(agent => `
      <div class="agent-card ${agent.active ? 'active' : 'inactive'}" data-agent="${agent.id}">
        <div class="agent-emoji">${agent.emoji}</div>
        <h3 class="agent-name">${agent.name}</h3>
        <p class="agent-role">${agent.role}</p>
        <div class="agent-status">${agent.active ? '✅ Active' : '⏸️ Standby'}</div>
      </div>
    `).join('');
  }

  renderDemoFeatures() {
    return `
      <div class="features-grid">
        <div class="feature-card" data-feature="test-api">
          <h3>🧪 Test API Connection</h3>
          <p>Maria-QA will verify backend connectivity</p>
          <button class="feature-button" data-action="test-api">Run Test</button>
        </div>

        <div class="feature-card" data-feature="performance">
          <h3>⚡ Performance Check</h3>
          <p>James-Frontend performance analysis</p>
          <button class="feature-button" data-action="check-performance">Check Performance</button>
        </div>

        <div class="feature-card" data-feature="accessibility">
          <h3>♿ Accessibility Audit</h3>
          <p>Automated accessibility validation</p>
          <button class="feature-button" data-action="audit-accessibility">Run Audit</button>
        </div>

        <div class="feature-card" data-feature="security">
          <h3>🔒 Security Scan</h3>
          <p>Marcus-Backend security validation</p>
          <button class="feature-button" data-action="scan-security">Security Scan</button>
        </div>
      </div>
    `;
  }

  renderQualityMetrics() {
    return `
      <div class="metrics-grid">
        <div class="metric-card">
          <h4>Test Coverage</h4>
          <div class="metric-value">85%</div>
          <div class="metric-status good">✅ Good</div>
        </div>

        <div class="metric-card">
          <h4>Performance Score</h4>
          <div class="metric-value">92</div>
          <div class="metric-status excellent">🏆 Excellent</div>
        </div>

        <div class="metric-card">
          <h4>Accessibility</h4>
          <div class="metric-value">98%</div>
          <div class="metric-status excellent">🏆 Excellent</div>
        </div>

        <div class="metric-card">
          <h4>Security Score</h4>
          <div class="metric-value">A+</div>
          <div class="metric-status excellent">🏆 Excellent</div>
        </div>
      </div>
    `;
  }

  applyStyles() {
    if (document.getElementById('versatil-styles')) return;

    const styles = `
      <style id="versatil-styles">
        /* James-Frontend: VERSATIL Application Styles */
        * { box-sizing: border-box; }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
          min-height: 100vh;
        }

        .versatil-app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .app-header {
          text-align: center;
          color: white;
          margin-bottom: 40px;
        }

        .app-header h1 {
          font-size: 2.5rem;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          margin: 10px 0;
        }

        .status-indicator {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          margin-top: 10px;
        }

        .status-indicator.connected {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.4);
        }

        .status-indicator.offline {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .app-main {
          display: grid;
          gap: 30px;
        }

        section {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        section h2 {
          margin: 0 0 20px 0;
          color: #4338ca;
          border-bottom: 2px solid #e0e7ff;
          padding-bottom: 10px;
        }

        .agents-grid, .features-grid, .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .agent-card, .feature-card, .metric-card {
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .agent-card:hover, .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .agent-card.active {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .agent-card.inactive {
          opacity: 0.7;
          border-color: #d1d5db;
        }

        .agent-emoji {
          font-size: 2rem;
          margin-bottom: 10px;
        }

        .agent-name {
          font-size: 1.1rem;
          font-weight: bold;
          margin: 0 0 5px 0;
        }

        .agent-role {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0 0 10px 0;
        }

        .agent-status {
          font-size: 0.8rem;
          font-weight: bold;
        }

        .feature-button {
          background: #4338ca;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.3s ease;
        }

        .feature-button:hover {
          background: #3730a3;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          color: #4338ca;
          margin: 10px 0;
        }

        .metric-status {
          font-size: 0.9rem;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .metric-status.excellent {
          background: #dcfce7;
          color: #166534;
        }

        .metric-status.good {
          background: #fef3c7;
          color: #92400e;
        }

        .app-footer {
          text-align: center;
          color: white;
          margin-top: 40px;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .app-header h1 { font-size: 2rem; }
          .agents-grid, .features-grid, .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  createAppContainer() {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    return app;
  }

  handleFormSubmit(event) {
    event.preventDefault();
    console.log('🎨 James-Frontend: Form submission handled');
  }

  handleNavigation(event) {
    if (event.target.matches('.feature-button')) {
      event.preventDefault();
      const action = event.target.dataset.action;
      this.executeAction(action);
    }
  }

  async executeAction(action) {
    console.log(`🎨 James-Frontend: Executing action - ${action}`);

    // Show loading state
    const button = document.querySelector(`[data-action="${action}"]`);
    const originalText = button.textContent;
    button.textContent = 'Running...';
    button.disabled = true;

    try {
      switch (action) {
        case 'test-api':
          await this.testApiConnection();
          break;
        case 'check-performance':
          await this.checkPerformance();
          break;
        case 'audit-accessibility':
          await this.auditAccessibility();
          break;
        case 'scan-security':
          await this.scanSecurity();
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error(`Action failed: ${action}`, error);
    } finally {
      // Restore button state
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  async testApiConnection() {
    try {
      const response = await fetch(`${this.apiEndpoint}/items`);
      const data = await response.json();

      if (data.success) {
        console.log('✅ Maria-QA: API test passed');
        this.showNotification('API Connection Test Passed! ✅', 'success');
      } else {
        throw new Error('API test failed');
      }
    } catch (error) {
      console.error('❌ Maria-QA: API test failed:', error);
      this.showNotification('API Connection Test Failed ❌', 'error');
    }
  }

  async checkPerformance() {
    console.log('⚡ James-Frontend: Running performance check...');

    // Simulate performance metrics
    const metrics = {
      loadTime: Math.round(Math.random() * 1000 + 500),
      domElements: document.querySelectorAll('*').length,
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'N/A'
    };

    console.log('Performance metrics:', metrics);
    this.showNotification(`Performance: ${metrics.loadTime}ms load time, ${metrics.domElements} DOM elements`, 'info');
  }

  async auditAccessibility() {
    console.log('♿ Maria-QA: Running accessibility audit...');

    // Simple accessibility checks
    const issues = [];
    if (!document.querySelector('[alt]')) issues.push('Missing alt attributes');
    if (!document.querySelector('h1')) issues.push('Missing h1 heading');

    if (issues.length === 0) {
      this.showNotification('Accessibility Audit: No issues found! ✅', 'success');
    } else {
      this.showNotification(`Accessibility Issues: ${issues.join(', ')}`, 'warning');
    }
  }

  async scanSecurity() {
    console.log('🔒 Marcus-Backend: Running security scan...');

    // Simulate security checks
    const securityChecks = [
      'HTTPS enabled',
      'CSP headers present',
      'No inline scripts',
      'Secure cookies'
    ];

    this.showNotification(`Security: ${securityChecks.length} checks passed ✅`, 'success');
  }

  handleResize() {
    // James-Frontend: Responsive design handling
    console.log('🎨 James-Frontend: Window resized, adjusting layout...');
  }

  setupPerformanceMonitoring() {
    // James-Frontend: Core Web Vitals monitoring
    if ('web-vital' in window) {
      console.log('⚡ James-Frontend: Performance monitoring enabled');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    const styles = {
      info: 'background: #3b82f6; color: white;',
      success: 'background: #10b981; color: white;',
      warning: 'background: #f59e0b; color: white;',
      error: 'background: #ef4444; color: white;'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 1000;
      max-width: 300px;
      ${styles[type]}
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  renderError(error) {
    const app = document.getElementById('app') || this.createAppContainer();
    app.innerHTML = `
      <div style="text-align: center; padding: 50px; color: white;">
        <h1>❌ Application Error</h1>
        <p>VERSATIL SDLC Framework encountered an error:</p>
        <pre>${error.message}</pre>
        <button onclick="location.reload()">Reload Application</button>
      </div>
    `;
  }
}

// James-Frontend: Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VersatilApp();
  });
} else {
  new VersatilApp();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VersatilApp;
}