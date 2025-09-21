/**
 * Tests for Enhanced Marcus - Advanced Backend Specialist
 */

import { EnhancedMarcus } from '../../src/agents/enhanced-marcus';
import { AgentActivationContext } from '../../src/agents/base-agent';

// Mock performance monitor
jest.mock('../../src/analytics/performance-monitor', () => ({
  performanceMonitor: {
    recordAgentExecution: jest.fn(),
    getPerformanceDashboard: jest.fn(() => ({
      agents: [],
      system: { overallHealth: 100 }
    }))
  }
}));

describe('Enhanced Marcus Backend Agent', () => {
  let marcus: EnhancedMarcus;
  let mockContext: AgentActivationContext;

  beforeEach(() => {
    marcus = new EnhancedMarcus();
    mockContext = {
      content: 'test content',
      filePath: '/test/api/users.ts',
      userRequest: 'analyze backend code'
    };
  });

  describe('Initialization', () => {
    it('should initialize Enhanced Marcus correctly', () => {
      expect(marcus).toBeInstanceOf(EnhancedMarcus);
      expect(marcus['id']).toBe('enhanced-marcus');
      expect(marcus['specialization']).toBe('Advanced Backend Specialist & Integration Validator');
    });
  });

  describe('Agent Activation', () => {
    it('should activate successfully with valid context', async () => {
      const response = await marcus.activate(mockContext);

      expect(response).toMatchObject({
        agentId: 'enhanced-marcus',
        message: expect.stringContaining('Enhanced Marcus'),
        suggestions: expect.any(Array),
        priority: expect.any(String),
        handoffTo: expect.any(Array),
        context: expect.objectContaining({
          backendHealth: expect.any(Number)
        })
      });
    });

    it('should handle API endpoint analysis', async () => {
      const apiContext = {
        ...mockContext,
        content: `
          import express from 'express';
          const router = express.Router();

          router.get('/api/users', async (req, res) => {
            try {
              const users = await User.findAll();
              res.json(users);
            } catch (error) {
              res.status(500).json({ error: 'Internal server error' });
            }
          });

          export default router;
        `,
        filePath: '/src/routes/users.ts'
      };

      const response = await marcus.activate(apiContext);

      expect(response.agentId).toBe('enhanced-marcus');
      expect(response.context.backendHealth).toBeDefined();
    });

    it('should detect debugging code in API routes', async () => {
      const debugContext = {
        ...mockContext,
        content: `
          import express from 'express';
          const router = express.Router();

          router.post('/api/login', async (req, res) => {
            console.log('🧠 Login attempt:', req.body); // Remove in production!
            debugger; // Debug code detected

            const { username, password } = req.body;
            // Authentication logic
          });
        `,
        filePath: '/src/routes/auth.ts'
      };

      const response = await marcus.activate(debugContext);

      expect(response.priority).toBe('critical');
      expect(response.message).toContain('Critical Issues Detected');
    });
  });

  describe('Backend Validation', () => {
    it('should run backend-specific validation', async () => {
      const result = await marcus['runBackendValidation'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array),
        warnings: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    it('should detect security vulnerabilities', async () => {
      const securityContext = {
        ...mockContext,
        content: `
          app.get('/api/user/:id', (req, res) => {
            const query = 'SELECT * FROM users WHERE id = ' + req.params.id; // SQL injection!
            db.query(query, (err, results) => {
              res.json(results);
            });
          });
        `
      };

      const result = await marcus['runBackendValidation'](securityContext);

      const securityIssues = result.issues?.filter(issue =>
        issue.type === 'security-risk'
      );
      expect(securityIssues?.length).toBeGreaterThan(0);
    });

    it('should detect authentication issues', async () => {
      const authContext = {
        ...mockContext,
        content: `
          app.get('/api/admin/users', (req, res) => {
            // Missing authentication check!
            const users = getUsersFromDB();
            res.json(users);
          });
        `
      };

      const result = await marcus['runBackendValidation'](authContext);

      expect(result.issues).toBeDefined();
    });
  });

  describe('API Integration Validation', () => {
    it('should validate API integration', async () => {
      const result = await marcus['validateAPIIntegration'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array)
      });
    });

    it('should detect API-frontend mismatches', async () => {
      const apiContext = {
        ...mockContext,
        content: `
          // API returns { id, name, email }
          router.get('/api/user/:id', (req, res) => {
            res.json({
              id: user.id,
              name: user.name,
              email: user.email
            });
          });

          // But frontend expects { userId, fullName, emailAddress }
          // This mismatch should be detected
        `
      };

      const result = await marcus['validateAPIIntegration'](apiContext);

      expect(result.score).toBeDefined();
      expect(result.issues).toBeDefined();
    });
  });

  describe('Configuration Consistency', () => {
    it('should check configuration consistency', async () => {
      const result = await marcus['checkConfigurationConsistency'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array)
      });
    });

    it('should detect configuration drift', async () => {
      const configContext = {
        ...mockContext,
        content: `
          const config = {
            database: {
              host: process.env.DB_HOST || "localhost", // Inconsistent fallback
              port: 5432, // Hardcoded value
              ssl: process.env.NODE_ENV === 'production' // Environment-dependent
            },
            redis: {
              host: "redis.example.com", // Hardcoded value!
              port: process.env.REDIS_PORT || 6379
            }
          };
        `
      };

      const result = await marcus['checkConfigurationConsistency'](configContext);

      const configIssues = result.issues?.filter(issue =>
        issue.message.toLowerCase().includes('configuration') ||
        issue.message.toLowerCase().includes('hardcoded')
      );
      expect(configIssues).toBeDefined();
    });
  });

  describe('Service Validation', () => {
    it('should validate service consistency', async () => {
      const result = await marcus['validateServiceConsistency'](mockContext);

      expect(result).toMatchObject({
        score: expect.any(Number),
        issues: expect.any(Array)
      });
    });

    it('should detect service dependency issues', async () => {
      const serviceContext = {
        ...mockContext,
        content: `
          class UserService {
            async getUser(id) {
              // Calling external service without error handling
              const profile = await profileService.getProfile(id);
              const preferences = await settingsService.getSettings(id);

              return { ...profile, ...preferences };
            }
          }
        `
      };

      const result = await marcus['validateServiceConsistency'](serviceContext);

      expect(result.score).toBeDefined();
    });
  });

  describe('Enhanced Reporting', () => {
    it('should generate enhanced backend report', () => {
      const mockBackendValidation = {
        score: 80,
        issues: [],
        warnings: [],
        recommendations: []
      };

      const mockIntegrationValidation = {
        score: 75,
        issues: []
      };

      const mockConfigConsistency = {
        score: 85,
        issues: []
      };

      const mockServiceValidation = {
        score: 90,
        issues: []
      };

      const mockIssues = [
        { type: 'test-issue', severity: 'medium' as const, message: 'Test issue', file: 'test.ts' }
      ];

      const report = marcus['generateEnhancedReport'](mockIssues, mockBackendValidation);

      expect(report).toContain('Enhanced Marcus');
      expect(report).toContain('Backend Analysis');
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(100);
    });
  });

  describe('Actionable Recommendations', () => {
    it('should generate actionable recommendations', () => {
      const mockIssues = [
        { type: 'security-risk', severity: 'critical' as const, message: 'SQL injection vulnerability', file: 'api.ts' },
        { type: 'api-mismatch', severity: 'high' as const, message: 'API contract mismatch', file: 'routes.ts' }
      ];

      const recommendations = marcus['generateActionableRecommendations'](mockIssues);

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            priority: expect.any(String),
            message: expect.any(String)
          })
        ])
      );
    });

    it('should prioritize security issues', () => {
      const securityIssues = [
        { type: 'security-risk', severity: 'critical' as const, message: 'Critical security issue', file: 'auth.ts' }
      ];

      const recommendations = marcus['generateActionableRecommendations'](securityIssues);

      const securityRecommendation = recommendations.find(r =>
        r.message.toLowerCase().includes('security')
      );
      expect(securityRecommendation).toBeDefined();
      expect(securityRecommendation?.priority).toBe('critical');
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate priority based on issue severity', () => {
      const criticalIssues = [
        { type: 'security-risk', severity: 'critical' as const, message: 'Security vulnerability', file: 'auth.ts' }
      ];

      const priority = marcus['calculatePriority'](criticalIssues);
      expect(priority).toBe('critical');
    });

    it('should handle multiple security issues', () => {
      const securityIssues = [
        { type: 'security-risk', severity: 'high' as const, message: 'Security issue 1', file: 'auth.ts' },
        { type: 'security-risk', severity: 'high' as const, message: 'Security issue 2', file: 'api.ts' },
        { type: 'authentication', severity: 'high' as const, message: 'Auth issue', file: 'middleware.ts' }
      ];

      const priority = marcus['calculatePriority'](securityIssues);
      expect(['high', 'critical']).toContain(priority);
    });
  });

  describe('Agent Handoff Determination', () => {
    it('should determine correct handoffs', () => {
      const mockIssues = [
        { type: 'security-risk', severity: 'high' as const, message: 'Security issue', file: 'auth.ts' },
        { type: 'frontend-integration', severity: 'medium' as const, message: 'Frontend issue', file: 'api.ts' }
      ];

      const handoffs = marcus['determineHandoffs'](mockIssues);

      expect(handoffs).toEqual(
        expect.arrayContaining([
          expect.any(String)
        ])
      );
    });

    it('should include security agent for security issues', () => {
      const securityIssues = [
        { type: 'security-risk', severity: 'high' as const, message: 'Security vulnerability', file: 'auth.ts' }
      ];

      const handoffs = marcus['determineHandoffs'](securityIssues);
      expect(handoffs).toContain('security-sam');
    });

    it('should include frontend agent for API integration issues', () => {
      const integrationIssues = [
        { type: 'frontend-integration', severity: 'medium' as const, message: 'API integration issue', file: 'api.ts' }
      ];

      const handoffs = marcus['determineHandoffs'](integrationIssues);
      expect(handoffs).toContain('enhanced-james');
    });
  });

  describe('Database Analysis', () => {
    it('should analyze database queries', async () => {
      const dbContext = {
        ...mockContext,
        content: `
          const getUserById = async (id) => {
            const query = 'SELECT * FROM users WHERE id = $1';
            return db.query(query, [id]);
          };

          const updateUser = async (id, data) => {
            const query = 'UPDATE users SET name = $1, email = $2 WHERE id = $3';
            return db.query(query, [data.name, data.email, id]);
          };
        `
      };

      const result = await marcus['runBackendValidation'](dbContext);
      expect(result.score).toBeDefined();
    });

    it('should detect N+1 query problems', async () => {
      const n1Context = {
        ...mockContext,
        content: `
          const getUsersWithPosts = async () => {
            const users = await User.findAll();

            for (const user of users) {
              user.posts = await Post.findByUserId(user.id); // N+1 problem!
            }

            return users;
          };
        `
      };

      const result = await marcus['runBackendValidation'](n1Context);
      expect(result.issues).toBeDefined();
    });
  });

  describe('Performance Analysis', () => {
    it('should detect performance bottlenecks', async () => {
      const performanceContext = {
        ...mockContext,
        content: `
          app.get('/api/heavy-operation', async (req, res) => {
            // Expensive operation without caching
            const results = [];
            for (let i = 0; i < 10000; i++) {
              const data = await expensiveDBQuery(i);
              results.push(processData(data));
            }
            res.json(results);
          });
        `
      };

      const result = await marcus['runBackendValidation'](performanceContext);

      const performanceIssues = result.issues?.filter(issue =>
        issue.type === 'performance'
      );
      expect(performanceIssues).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidContext = {
        content: null,
        filePath: '',
        userRequest: ''
      };

      const response = await marcus.activate(invalidContext);
      expect(response.agentId).toBe('enhanced-marcus');
    });

    it('should handle malformed code', async () => {
      const malformedContext = {
        ...mockContext,
        content: 'this is not valid javascript {{{ async await'
      };

      const response = await marcus.activate(malformedContext);
      expect(response.agentId).toBe('enhanced-marcus');
    });
  });

  describe('Framework Detection', () => {
    it('should detect Express.js framework', () => {
      const expressCode = `
        import express from 'express';
        const app = express();
        app.get('/', (req, res) => res.send('Hello'));
      `;

      const framework = marcus['detectFramework'](expressCode);
      expect(framework).toContain('express');
    });

    it('should detect Fastify framework', () => {
      const fastifyCode = `
        const fastify = require('fastify')();
        fastify.get('/', async (request, reply) => {
          return { hello: 'world' };
        });
      `;

      const framework = marcus['detectFramework'](fastifyCode);
      expect(framework).toContain('fastify');
    });
  });

  describe('API Documentation Analysis', () => {
    it('should validate API documentation', async () => {
      const apiDocContext = {
        ...mockContext,
        content: `
          /**
           * @swagger
           * /api/users:
           *   get:
           *     summary: Get all users
           *     responses:
           *       200:
           *         description: Success
           */
          router.get('/api/users', async (req, res) => {
            const users = await User.findAll();
            res.json(users);
          });
        `
      };

      const result = await marcus['runBackendValidation'](apiDocContext);
      expect(result.score).toBeDefined();
    });
  });
});