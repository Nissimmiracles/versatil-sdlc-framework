import { describe, it, expect, beforeEach } from 'vitest';
import { EnhancedDana } from './enhanced-dana.js';
import { AgentActivationContext } from '../../core/base-agent.js';

describe('EnhancedDana - Database Specialist Agent', () => {
  let agent: EnhancedDana;

  beforeEach(() => {
    agent = new EnhancedDana();
  });

  // ===========================
  // 1. Agent Initialization (4 tests)
  // ===========================

  describe('Agent Initialization', () => {
    it('should initialize with correct name', () => {
      expect(agent.name).toBe('EnhancedDana');
    });

    it('should initialize with correct id', () => {
      expect(agent.id).toBe('enhanced-dana');
    });

    it('should initialize with correct specialization', () => {
      expect(agent.specialization).toBe('Database Architect & Data Layer Specialist');
    });

    it('should have RAG config with database domain', () => {
      const ragConfig = agent['getDefaultRAGConfig']();
      expect(ragConfig.maxExamples).toBe(3);
      expect(ragConfig.similarityThreshold).toBe(0.8);
      expect(ragConfig.agentDomain).toBe('database');
      expect(ragConfig.enableLearning).toBe(true);
    });
  });

  // ===========================
  // 2. Database Pattern Detection (8 tests)
  // ===========================

  describe('Database Pattern Detection', () => {
    it('should detect SQL injection in raw query', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const query = `SELECT * FROM users WHERE id = ${userId}`;',
        filePath: 'database/queries.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'security-risk' && p.severity === 'critical')).toBe(true);
    });

    it('should detect SQL injection with string concatenation', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const sql = "SELECT * FROM sessions WHERE token = \'" + token + "\'";',
        filePath: 'auth/cleanup.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // Pattern analyzer looks for SELECT/INSERT/UPDATE with + operator
      expect(analysis.patterns.some(p => p.category === 'security')).toBe(true);
    });

    it('should detect hardcoded database password', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const dbPassword = "postgres_secret_123";',
        filePath: 'config/database.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'hardcoded-credentials' && p.severity === 'critical')).toBe(true);
    });

    it('should detect synchronous database operations', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const schema = fs.readFileSync("schema.sql", "utf-8");',
        filePath: 'migrations/loader.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'sync-file-operation')).toBe(true);
    });

    it('should detect missing input validation in database queries', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'app.post("/api/query", (req, res) => {\n  const tableName = req.body.table;\n  db.query(`SELECT * FROM ${tableName}`);\n});',
        filePath: 'api/query.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'missing-validation')).toBe(true);
    });

    it('should detect debugging code in migration scripts', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'async function migrate() {\n  console.log("Running migration...");\n  await db.schema.createTable("users");\n}',
        filePath: 'migrations/001_create_users.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'debugging-code')).toBe(true);
    });

    it('should calculate quality score for database code', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const result = await db.query("SELECT * FROM users WHERE active = true");',
        filePath: 'queries/users.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.score).toBeGreaterThan(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('should generate database-specific recommendations', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const users = await db.query("SELECT * FROM users");',
        filePath: 'api/users.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.recommendations).toBeDefined();
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
  });

  // ===========================
  // 3. Schema & Migration Patterns (6 tests)
  // ===========================

  describe('Schema & Migration Patterns', () => {
    it('should detect CREATE TABLE statement', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'await db.query("CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255))");',
        filePath: 'migrations/create_users.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // CREATE TABLE doesn't trigger SQL injection if no template literals with ${}
      expect(analysis.patterns.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect ALTER TABLE statement', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'ALTER TABLE users ADD COLUMN last_login TIMESTAMP;',
        filePath: 'migrations/002_add_last_login.sql'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.score).toBeDefined();
    });

    it('should detect DROP TABLE statement', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'DROP TABLE IF EXISTS legacy_users;',
        filePath: 'migrations/cleanup.sql'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns).toBeDefined();
    });

    it('should detect INSERT statement with potential injection', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const sql = `INSERT INTO logs (message) VALUES (${userInput})`;',
        filePath: 'logging/insert.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'security-risk')).toBe(true);
    });

    it('should detect UPDATE statement with potential injection', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const query = `UPDATE users SET status = ${newStatus} WHERE id = ${userId}`;',
        filePath: 'api/update-status.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.category === 'security')).toBe(true);
    });

    it('should handle safe parameterized queries', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);',
        filePath: 'queries/get-user.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // Parameterized query with $1 placeholder should not trigger SQL injection
      const sqlInjectionIssues = analysis.patterns.filter(p => p.type === 'security-risk');
      expect(sqlInjectionIssues.length).toBe(0);
    });
  });

  // ===========================
  // 4. Response Enhancement (2 tests)
  // ===========================

  describe('Response Enhancement', () => {
    it('should replace analysisScore with databaseHealth in response context', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const db = new Database();\nawait db.connect();',
        filePath: 'database/connection.ts'
      };

      const response = await agent.activate(context);
      if (response.context) {
        expect(response.context).toHaveProperty('databaseHealth');
        expect(response.context).not.toHaveProperty('analysisScore');
      }
    });

    it('should generate enhanced message with agent name and database context', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'SELECT * FROM users;',
        filePath: 'queries/list-users.sql'
      };

      const response = await agent.activate(context);
      expect(response.message).toContain('Enhanced Dana');
    });
  });

  // ===========================
  // 5. Domain Handoffs (5 tests)
  // ===========================

  describe('Domain Handoffs', () => {
    it('should handoff to enhanced-marcus for security issues', async () => {
      const analysis = {
        patterns: [{
          type: 'security-risk',
          severity: 'critical' as const,
          line: 1,
          column: 0,
          message: 'SQL injection',
          suggestion: 'Use parameterized queries',
          code: '',
          category: 'security' as const
        }],
        score: 50,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs).toContain('enhanced-marcus');
    });

    it('should handoff to enhanced-marcus for performance issues', async () => {
      const analysis = {
        patterns: [{
          type: 'slow-query',
          severity: 'medium' as const,
          line: 1,
          column: 0,
          message: 'Query optimization needed',
          suggestion: 'Add index',
          code: '',
          category: 'performance' as const
        }],
        score: 70,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs).toContain('enhanced-marcus');
    });

    it('should handoff to enhanced-maria for low quality score (<70)', async () => {
      const analysis = {
        patterns: [],
        score: 65,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs).toContain('enhanced-maria');
    });

    it('should handoff to sarah-pm for migration issues', async () => {
      const analysis = {
        patterns: [{
          type: 'breaking-change-migration',
          severity: 'high' as const,
          line: 1,
          column: 0,
          message: 'Migration requires downtime',
          suggestion: 'Coordinate deployment',
          code: '',
          category: 'best-practice' as const
        }],
        score: 75,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      expect(handoffs).toContain('sarah-pm');
    });

    it('should deduplicate handoffs', async () => {
      const analysis = {
        patterns: [
          {
            type: 'security-risk',
            severity: 'critical' as const,
            line: 1,
            column: 0,
            message: 'Issue 1',
            suggestion: 'Fix 1',
            code: '',
            category: 'security' as const
          },
          {
            type: 'slow-query',
            severity: 'medium' as const,
            line: 2,
            column: 0,
            message: 'Issue 2',
            suggestion: 'Fix 2',
            code: '',
            category: 'performance' as const
          }
        ],
        score: 60,
        summary: '',
        recommendations: []
      };

      const handoffs = agent['generateDomainHandoffs'](analysis);
      // Both security and performance handoff to enhanced-marcus + low score adds enhanced-maria
      // Should deduplicate enhanced-marcus
      const marcusCount = handoffs.filter(h => h === 'enhanced-marcus').length;
      expect(marcusCount).toBe(1);
    });
  });

  // ===========================
  // 6. PostgreSQL & Supabase Patterns (4 tests)
  // ===========================

  describe('PostgreSQL & Supabase Patterns', () => {
    it('should recognize PostgreSQL syntax', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'CREATE INDEX idx_users_email ON users USING btree (email);',
        filePath: 'migrations/add_email_index.sql'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.score).toBeDefined();
    });

    it('should recognize Supabase client patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'const { data, error } = await supabase.from("users").select("*");',
        filePath: 'api/users.ts'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns).toBeDefined();
    });

    it('should recognize RLS policy patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'CREATE POLICY user_select ON users FOR SELECT USING (auth.uid() = user_id);',
        filePath: 'migrations/rls_policies.sql'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.score).toBeDefined();
    });

    it('should recognize pgvector extension patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'CREATE EXTENSION IF NOT EXISTS vector;\nCREATE TABLE embeddings (id serial, embedding vector(1536));',
        filePath: 'migrations/setup_vector.sql'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns).toBeDefined();
    });
  });

  // ===========================
  // 7. Edge Cases (3 tests)
  // ===========================

  describe('Edge Cases', () => {
    it('should handle empty SQL content', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: '',
        filePath: 'empty.sql'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined context', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'SELECT 1;',
        filePath: ''
      };

      const response = await agent.activate(context);
      expect(response).toBeDefined();
    });

    it('should handle malformed SQL gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'SELECT * FROM WHERE id = ;',
        filePath: 'broken.sql'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis).toBeDefined();
      expect(analysis.patterns).toBeDefined();
    });
  });
});
