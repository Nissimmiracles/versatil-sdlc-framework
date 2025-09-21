/**
 * Tests for VERSATIL Server and Health Endpoints
 */

import request from 'supertest';
import express from 'express';
import { createServer } from '../src/server';

// Mock dependencies
jest.mock('../src/analytics/performance-monitor', () => ({
  performanceMonitor: {
    getPerformanceDashboard: jest.fn(() => ({
      system: {
        overallHealth: 95,
        uptime: 3600000,
        memoryUsage: {
          used: 50,
          total: 100,
          percentage: 50
        },
        cpuUsage: 25,
        responseTime: 150
      },
      agents: [
        {
          agentId: 'enhanced-maria',
          activations: 100,
          avgExecutionTime: 1200,
          successRate: 0.95,
          lastActive: Date.now()
        }
      ]
    })),
    recordAgentExecution: jest.fn(),
    start: jest.fn(),
    getPrometheusMetrics: jest.fn(() => `
# HELP versatil_agent_activations_total Total number of agent activations
# TYPE versatil_agent_activations_total counter
versatil_agent_activations_total{agent="enhanced-maria"} 100
    `.trim())
  }
}));

jest.mock('../src/agents/agent-registry', () => ({
  AgentRegistry: jest.fn().mockImplementation(() => ({
    getAllAgents: jest.fn(() => new Map([
      ['enhanced-maria', { id: 'enhanced-maria', specialization: 'QA Lead' }],
      ['enhanced-james', { id: 'enhanced-james', specialization: 'Frontend Specialist' }]
    ])),
    getAgentMetadata: jest.fn(() => new Map([
      ['enhanced-maria', {
        id: 'enhanced-maria',
        name: 'Enhanced Maria',
        version: '2.0.0',
        status: 'active'
      }]
    ]))
  }))
}));

jest.mock('../src/intelligence/intelligence-dashboard', () => ({
  intelligenceDashboard: {
    getDashboardData: jest.fn(() => ({
      systemOverview: {
        totalAgentsWrapped: 3,
        learningEnabled: true,
        totalInteractions: 1247,
        avgUserSatisfaction: 4.2,
        systemUptime: 3600000
      },
      agentMetrics: [
        {
          agentId: 'enhanced-maria',
          adaptationsApplied: 5,
          successRate: 0.95,
          avgExecutionTime: 1200,
          userSatisfactionScore: 4.5,
          activationCount: 100
        }
      ],
      usageInsights: {
        topFileTypes: [{ fileType: 'tsx', usage: 50, successRate: 0.9 }],
        falsePositiveRate: 0.05,
        userEngagementTrend: 'increasing'
      },
      learningProgress: {
        patternsDiscovered: 24,
        adaptationsApplied: 12,
        learningEffectiveness: 0.78
      }
    })),
    getSystemHealth: jest.fn(() => ({
      status: 'healthy',
      issues: [],
      recommendations: [],
      overallScore: 94
    }))
  }
}));

describe('VERSATIL Server', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createServer();
  });

  describe('Health Endpoints', () => {
    describe('GET /health', () => {
      it('should return basic health status', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.any(String),
          version: expect.any(String),
          uptime: expect.any(Number)
        });
      });

      it('should include system metrics', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.system).toMatchObject({
          memory: expect.objectContaining({
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number)
          }),
          cpu: expect.any(Number)
        });
      });
    });

    describe('GET /health/detailed', () => {
      it('should return detailed health information', async () => {
        const response = await request(app)
          .get('/health/detailed')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.any(String),
          version: expect.any(String),
          uptime: expect.any(Number),
          agents: expect.objectContaining({
            total: expect.any(Number),
            active: expect.any(Number),
            details: expect.any(Array)
          }),
          performance: expect.objectContaining({
            overallHealth: expect.any(Number),
            system: expect.any(Object)
          }),
          intelligence: expect.objectContaining({
            learningEnabled: expect.any(Boolean),
            totalInteractions: expect.any(Number),
            systemHealth: expect.any(Object)
          })
        });
      });

      it('should include agent details', async () => {
        const response = await request(app)
          .get('/health/detailed')
          .expect(200);

        expect(response.body.agents.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              status: expect.any(String)
            })
          ])
        );
      });
    });

    describe('GET /health/agents', () => {
      it('should return agent-specific health', async () => {
        const response = await request(app)
          .get('/health/agents')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.any(String),
          agents: expect.objectContaining({
            total: expect.any(Number),
            active: expect.any(Number),
            details: expect.any(Array)
          }),
          performance: expect.any(Object)
        });
      });

      it('should include performance metrics for each agent', async () => {
        const response = await request(app)
          .get('/health/agents')
          .expect(200);

        const agentDetails = response.body.agents.details;
        expect(agentDetails.length).toBeGreaterThan(0);

        agentDetails.forEach((agent: any) => {
          expect(agent).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            status: expect.any(String)
          });
        });
      });
    });

    describe('GET /health/intelligence', () => {
      it('should return intelligence system health', async () => {
        const response = await request(app)
          .get('/health/intelligence')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          timestamp: expect.any(String),
          intelligence: expect.objectContaining({
            learningEnabled: true,
            totalInteractions: 1247,
            avgUserSatisfaction: 4.2,
            systemHealth: expect.objectContaining({
              status: 'healthy',
              overallScore: 94
            }),
            agentMetrics: expect.any(Array),
            learningProgress: expect.objectContaining({
              patternsDiscovered: 24,
              adaptationsApplied: 12,
              learningEffectiveness: 0.78
            })
          })
        });
      });

      it('should include learning insights', async () => {
        const response = await request(app)
          .get('/health/intelligence')
          .expect(200);

        const intelligence = response.body.intelligence;
        expect(intelligence.learningProgress).toBeDefined();
        expect(intelligence.agentMetrics).toBeInstanceOf(Array);
        expect(intelligence.agentMetrics[0]).toMatchObject({
          agentId: 'enhanced-maria',
          adaptationsApplied: 5,
          successRate: 0.95
        });
      });
    });
  });

  describe('Metrics Endpoints', () => {
    describe('GET /metrics', () => {
      it('should return Prometheus metrics', async () => {
        const response = await request(app)
          .get('/metrics')
          .expect(200);

        expect(response.text).toContain('versatil_agent_activations_total');
        expect(response.headers['content-type']).toContain('text/plain');
      });

      it('should include agent-specific metrics', async () => {
        const response = await request(app)
          .get('/metrics')
          .expect(200);

        expect(response.text).toContain('enhanced-maria');
      });
    });

    describe('GET /api/status', () => {
      it('should return comprehensive system status', async () => {
        const response = await request(app)
          .get('/api/status')
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'operational',
          timestamp: expect.any(String),
          version: expect.any(String),
          environment: expect.any(String),
          uptime: expect.any(Number),
          agents: expect.any(Object),
          performance: expect.any(Object),
          intelligence: expect.any(Object)
        });
      });

      it('should indicate system operational status', async () => {
        const response = await request(app)
          .get('/api/status')
          .expect(200);

        expect(['operational', 'degraded', 'down']).toContain(response.body.status);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        timestamp: expect.any(String),
        path: '/unknown-route'
      });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS requests', async () => {
      await request(app)
        .options('/health')
        .expect(200);
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON for API endpoints', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should return plain text for metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times', async () => {
      const start = Date.now();

      await request(app)
        .get('/health')
        .expect(200);

      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should include response time in headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-response-time']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple rapid requests', async () => {
      const requests = Array(10).fill(0).map(() =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Health Check Dependencies', () => {
    it('should verify agent registry availability', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.agents.total).toBeGreaterThan(0);
    });

    it('should verify performance monitor availability', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.performance).toBeDefined();
      expect(response.body.performance.overallHealth).toBeGreaterThan(0);
    });

    it('should verify intelligence system availability', async () => {
      const response = await request(app)
        .get('/health/intelligence')
        .expect(200);

      expect(response.body.intelligence.learningEnabled).toBe(true);
      expect(response.body.intelligence.totalInteractions).toBeGreaterThan(0);
    });
  });

  describe('Environment Information', () => {
    it('should include environment details', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.environment).toBeDefined();
      expect(response.body.version).toBeDefined();
    });

    it('should not expose sensitive information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('password');
      expect(responseString).not.toContain('secret');
      expect(responseString).not.toContain('key');
    });
  });
});