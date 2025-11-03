/**
 * VERSATIL SDLC Framework - Marcus-Node Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Node.js/Express pattern detection
 * - API design best practices
 * - Security validation (OWASP)
 * - Performance optimization
 * - Error handling patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarcusNode } from './marcus-node.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('MarcusNode', () => {
  let agent: MarcusNode;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new MarcusNode();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Node.js specialization', () => {
      expect(agent.name).toBe('Marcus-Node');
      expect(agent.id).toBe('marcus-node');
      expect(agent.specialization).toContain('Node.js');
    });

    it('should have Node.js-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('Express');
      expect(agent.systemPrompt).toContain('async/await');
    });
  });

  describe('Security Pattern Detection', () => {
    it('should detect SQL injection vulnerabilities', () => {
      const content = `
        app.get('/users', (req, res) => {
          const query = "SELECT * FROM users WHERE id = " + req.query.id;
          db.query(query); // SQL injection!
        });
      `;

      const hasSQLInjection = agent['detectSQLInjection'](content);
      expect(hasSQLInjection).toBe(true);
    });

    it('should detect missing input validation', () => {
      const content = `
        app.post('/user', (req, res) => {
          const user = req.body; // No validation!
          saveUser(user);
        });
      `;

      const hasMissingValidation = agent['detectMissingValidation'](content);
      expect(hasMissingValidation).toBe(true);
    });

    it('should detect exposed secrets', () => {
      const content = `
        const API_KEY = "sk_live_12345abcde";
        const PASSWORD = "hardcoded_password";
      `;

      const hasExposedSecrets = agent['detectExposedSecrets'](content);
      expect(hasExposedSecrets).toBe(true);
    });

    it('should detect missing authentication', () => {
      const content = `
        app.delete('/admin/users/:id', (req, res) => {
          deleteUser(req.params.id); // No auth check!
        });
      `;

      const hasMissingAuth = agent['detectMissingAuth'](content);
      expect(hasMissingAuth).toBe(true);
    });
  });

  describe('API Design Patterns', () => {
    it('should validate RESTful routing', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          app.get('/api/users', getUsers);
          app.post('/api/users', createUser);
          app.put('/api/users/:id', updateUser);
          app.delete('/api/users/:id', deleteUser);
        `,
        filePath: 'routes.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis).toHaveProperty('bestPractices');
      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect proper error handling', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          app.get('/users', async (req, res, next) => {
            try {
              const users = await getUsers();
              res.json(users);
            } catch (error) {
              next(error);
            }
          });
        `,
        filePath: 'routes.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis.score).toBeGreaterThan(70);
    });

    it('should detect missing async/await error handling', () => {
      const content = `
        app.get('/users', async (req, res) => {
          const users = await getUsers(); // No try/catch!
          res.json(users);
        });
      `;

      const hasMissingErrorHandling = agent['detectMissingErrorHandling'](content);
      expect(hasMissingErrorHandling).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect N+1 query problems', () => {
      const content = `
        users.forEach(async user => {
          const posts = await getPosts(user.id); // N+1!
        });
      `;

      const hasNPlusOne = agent['detectNPlusOne'](content);
      expect(hasNPlusOne).toBe(true);
    });

    it('should recommend caching for repeated queries', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          app.get('/stats', async (req, res) => {
            const stats = await calculateExpensiveStats();
            res.json(stats);
          });
        `,
        filePath: 'routes.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis.bestPractices).toBeDefined();
    });

    it('should detect blocking synchronous operations', () => {
      const content = `
        app.get('/data', (req, res) => {
          const data = fs.readFileSync('large-file.json'); // Blocking!
          res.json(data);
        });
      `;

      const hasBlockingOps = agent['detectBlockingOperations'](content);
      expect(hasBlockingOps).toBe(true);
    });
  });

  describe('Middleware Patterns', () => {
    it('should detect proper middleware usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          app.use(express.json());
          app.use(helmet());
          app.use(cors());
          app.use('/api', authMiddleware);
        `,
        filePath: 'app.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect missing security middleware', () => {
      const content = `
        const app = express();
        app.use(express.json());
        // Missing: helmet, cors, rate limiting
      `;

      const hasMissingSecurityMiddleware = agent['detectMissingSecurityMiddleware'](content);
      expect(hasMissingSecurityMiddleware).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    it('should detect proper env variable usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const PORT = process.env.PORT || 3000;
          const DB_URL = process.env.DATABASE_URL;
        `,
        filePath: 'config.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis).toBeDefined();
    });

    it('should detect missing env validation', () => {
      const content = `
        const API_KEY = process.env.API_KEY; // No validation!
        makeRequest(API_KEY);
      `;

      const hasMissingEnvValidation = agent['detectMissingEnvValidation'](content);
      expect(hasMissingEnvValidation).toBe(true);
    });
  });

  describe('Database Patterns', () => {
    it('should detect parameterized queries (good)', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        `,
        filePath: 'db.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis.score).toBeGreaterThan(80);
    });

    it('should detect missing connection pooling', () => {
      const content = `
        app.get('/users', async (req, res) => {
          const client = new Client(); // New connection each time!
          await client.connect();
          const result = await client.query('SELECT * FROM users');
          await client.end();
        });
      `;

      const hasMissingPooling = agent['detectMissingConnectionPooling'](content);
      expect(hasMissingPooling).toBe(true);
    });
  });

  describe('Error Handling Best Practices', () => {
    it('should detect global error handler', () => {
      const content = `
        app.use((err, req, res, next) => {
          console.error(err);
          res.status(500).json({ error: 'Internal Server Error' });
        });
      `;

      const hasGlobalErrorHandler = agent['hasGlobalErrorHandler'](content);
      expect(hasGlobalErrorHandler).toBe(true);
    });

    it('should detect proper error logging', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          try {
            await riskyOperation();
          } catch (error) {
            logger.error('Operation failed', { error, context });
            throw error;
          }
        `,
        filePath: 'service.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Node.js-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          app.get('/api/users', async (req, res, next) => {
            try {
              const users = await User.findAll();
              res.json(users);
            } catch (error) {
              next(error);
            }
          });
        `,
        filePath: 'routes.ts'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide OWASP-based security suggestions', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          app.post('/login', (req, res) => {
            const { username, password } = req.body;
            const query = \`SELECT * FROM users WHERE username='\${username}'\`;
            db.query(query);
          });
        `,
        filePath: 'auth.ts'
      };

      const response = await agent.activate(context);

      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: '',
        filePath: 'empty.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Node.js content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.ts'
      };

      const analysis = await agent['analyzeNodePatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
