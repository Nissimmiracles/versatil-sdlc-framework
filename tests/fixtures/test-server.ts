/**
 * VERSATIL SDLC Framework - Test Server for E2E Testing
 * Simple Express server for UI/UX testing validation
 */

import express from 'express';
import { createServer } from 'http';

export class VERSATILTestServer {
  private app: express.Application;
  private server: any;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.setupRoutes();
    this.setupSecurityHeaders();
  }

  private setupSecurityHeaders() {
    this.app.use((req, res, next) => {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  private setupRoutes() {
    // Home page for UI testing
    this.app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VERSATIL SDLC Framework - Test Environment</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        nav { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        .quality-dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status-working { color: #28a745; }
        .status-partial { color: #ffc107; }
        .status-broken { color: #dc3545; }
    </style>
</head>
<body>
    <nav>
        <h1>🚀 VERSATIL SDLC Framework</h1>
        <p>Enhanced OPERA Testing Environment</p>
    </nav>

    <main>
        <h1>Framework Quality Dashboard</h1>

        <div class="quality-dashboard">
            <div class="metric-card">
                <h2>🤖 Agent System</h2>
                <p class="status-working">✅ Enhanced Maria-QA: Active</p>
                <p class="status-working">✅ Enhanced James: Active</p>
                <p class="status-working">✅ Enhanced Marcus: Active</p>
                <p class="status-working">✅ SimulationQA: Active</p>
            </div>

            <div class="metric-card">
                <h2>🔌 MCP Integration</h2>
                <p class="status-working">✅ Server: Running</p>
                <p class="status-working">✅ Chrome MCP: Connected</p>
                <p class="status-working">✅ Agent Detection: Working</p>
            </div>

            <div class="metric-card">
                <h2>🧪 Testing Infrastructure</h2>
                <p class="status-working">✅ Jest: Configured</p>
                <p class="status-working">✅ Playwright: Active</p>
                <p class="status-partial">⚠️ Coverage: 70%+</p>
            </div>

            <div class="metric-card">
                <h2>📊 Framework Reality Score</h2>
                <p><strong>70/100</strong> (Honest Assessment)</p>
                <p class="status-partial">⚠️ CLI Operations: 40% functional</p>
                <p class="status-working">✅ Agent System: 85% functional</p>
                <p class="status-working">✅ MCP Integration: 90% functional</p>
            </div>
        </div>

        <h2>OPERA Methodology Status</h2>
        <ul>
            <li>✅ Agent Specialization: Working</li>
            <li>⚠️ Context Preservation: Partial</li>
            <li>✅ Quality Gates: Configured</li>
            <li>✅ Real-time Testing: Active</li>
        </ul>
    </main>

    <script>
        // OPERA Context for testing
        window.operaContext = {
            framework: 'VERSATIL SDLC',
            version: '1.1.0',
            agents: ['Enhanced-Maria', 'Enhanced-James', 'Enhanced-Marcus', 'SimulationQA'],
            realityScore: 70,
            qualityGates: {
                performance: true,
                accessibility: true,
                security: true,
                visual: true
            }
        };

        // Performance monitoring
        if ('performance' in window) {
            const observer = new PerformanceObserver((list) => {
                console.log('Performance entries:', list.getEntries());
            });
            observer.observe({ entryTypes: ['navigation', 'paint'] });
        }
    </script>
</body>
</html>
      `);
    });

    // API health endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        framework: 'VERSATIL SDLC',
        version: '1.1.0',
        agents: {
          'enhanced-maria': 'active',
          'enhanced-james': 'active',
          'enhanced-marcus': 'active',
          'simulation-qa': 'active'
        },
        testing: {
          jest: 'working',
          playwright: 'working',
          coverage: '70%+'
        },
        timestamp: new Date().toISOString()
      });
    });

    // Framework status endpoint
    this.app.get('/api/framework/status', (req, res) => {
      res.json({
        realityScore: 70,
        capabilities: {
          agentActivation: { score: 85, status: 'working' },
          mcpIntegration: { score: 90, status: 'working' },
          operaMethodology: { score: 60, status: 'partial' },
          testingInfrastructure: { score: 75, status: 'partial' },
          cliOperations: { score: 40, status: 'broken' }
        },
        recommendations: [
          'Fix CLI hanging scripts',
          'Improve OPERA context preservation',
          'Enhance testing coverage'
        ]
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🧪 VERSATIL Test Server running on http://localhost:${this.port}`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${this.port} in use, trying ${this.port + 1}`);
          this.port += 1;
          this.start().then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🧪 VERSATIL Test Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.port;
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}

// Export for use in test setup
export default VERSATILTestServer;