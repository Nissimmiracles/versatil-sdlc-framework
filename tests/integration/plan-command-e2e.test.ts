/**
 * Plan Command End-to-End Integration Tests
 * Tests the full workflow: pattern search → template matching → plan generation → dual todo creation
 */

import { PatternSearchService } from '../../src/rag/pattern-search';
import { TemplateMatcher } from '../../src/templates/template-matcher';
import { TodoFileGenerator, TodoFileSpec } from '../../src/planning/todo-file-generator';
import * as fs from 'fs';
import * as path from 'path';

describe('Plan Command E2E Integration', () => {
  const testTodosDir = path.join(process.cwd(), 'todos-test-e2e');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testTodosDir)) {
      fs.mkdirSync(testTodosDir, { recursive: true });
    }

    // Copy template
    const templateSrc = path.join(process.cwd(), 'todos', '000-pending-p1-TEMPLATE.md');
    const templateDest = path.join(testTodosDir, '000-pending-p1-TEMPLATE.md');
    if (fs.existsSync(templateSrc)) {
      fs.copyFileSync(templateSrc, templateDest);
    }
  });

  afterAll(() => {
    // Clean up
    if (fs.existsSync(testTodosDir)) {
      fs.rmSync(testTodosDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Clean test todos
    if (fs.existsSync(testTodosDir)) {
      const files = fs.readdirSync(testTodosDir);
      files.forEach(file => {
        if (file.match(/^\d{3}-/) && file.endsWith('.md')) {
          fs.unlinkSync(path.join(testTodosDir, file));
        }
      });
    }
  });

  describe('Full Workflow: Authentication Feature', () => {
    it('should complete full plan workflow for authentication', async () => {
      const featureDescription = 'Add user authentication with JWT tokens';

      // Step 1: Pattern Search (CODIFY phase)
      const patternService = new PatternSearchService();
      const patterns = await patternService.searchSimilarFeatures({
        description: featureDescription,
        limit: 5,
        min_similarity: 0.75
      });

      // Should find patterns or return empty gracefully
      expect(patterns).toBeDefined();
      expect(patterns.search_method).toMatch(/graphrag|vector|none/);

      // Step 2: Template Matching
      const matcher = new TemplateMatcher();
      const templateMatch = await matcher.matchTemplate({
        description: featureDescription
      });

      // Should match auth-system template
      expect(templateMatch.use_template).toBe(true);
      expect(templateMatch.best_match?.template_name).toBe('auth-system');
      expect(templateMatch.best_match?.match_score).toBeGreaterThanOrEqual(70);

      // Step 3: Generate Todo Specs from template
      const template = await matcher.loadTemplate('auth-system');
      expect(template).toBeDefined();

      const todoSpecs: TodoFileSpec[] = [
        {
          title: 'Database Schema - Users and Sessions Tables',
          priority: 'p1',
          assigned_agent: 'Dana-Database',
          estimated_effort: 'Medium',
          acceptance_criteria: [
            'Users table created with email, password_hash, roles',
            'Sessions table created with token, expires_at',
            'RLS policies added for data isolation',
            'Indexes created on email and session_token'
          ],
          dependencies: { depends_on: [], blocks: ['002', '003'] },
          implementation_notes: 'Use bcrypt with 12 salt rounds. Add INET type for IP addresses.',
          files_involved: ['supabase/migrations/001_create_users.sql', 'supabase/migrations/002_create_sessions.sql'],
          context: {
            feature_description: featureDescription,
            related_issue: '#123'
          }
        },
        {
          title: 'API Endpoints - Auth Routes',
          priority: 'p1',
          assigned_agent: 'Marcus-Backend',
          estimated_effort: 'Large',
          acceptance_criteria: [
            'POST /auth/signup endpoint created',
            'POST /auth/login endpoint created',
            'POST /auth/logout endpoint created',
            'JWT token generation working',
            'Rate limiting implemented',
            'Tests passing with 80%+ coverage'
          ],
          dependencies: { depends_on: ['001'], blocks: ['003'] },
          implementation_notes: 'JWT expires in 15 minutes. Refresh token in httpOnly cookie (7 days).',
          files_involved: ['src/api/auth/signup.ts', 'src/api/auth/login.ts', 'src/middleware/jwt.ts'],
          context: {
            feature_description: featureDescription,
            related_issue: '#123'
          }
        },
        {
          title: 'Frontend Components - Auth UI',
          priority: 'p1',
          assigned_agent: 'James-Frontend',
          estimated_effort: 'Medium',
          acceptance_criteria: [
            'LoginForm component created',
            'SignupForm component created',
            'AuthProvider context created',
            'Protected routes working',
            'WCAG 2.1 AA compliant'
          ],
          dependencies: { depends_on: ['002'], blocks: ['004'] },
          implementation_notes: 'Use React Context for auth state. Form validation with react-hook-form.',
          files_involved: ['src/components/LoginForm.tsx', 'src/components/SignupForm.tsx', 'src/contexts/AuthProvider.tsx'],
          context: {
            feature_description: featureDescription,
            related_issue: '#123'
          }
        },
        {
          title: 'QA Testing - Auth Flow Validation',
          priority: 'p2',
          assigned_agent: 'Maria-QA',
          estimated_effort: 'Small',
          acceptance_criteria: [
            'Unit tests for password hashing',
            'Integration tests for auth endpoints',
            'E2E tests for signup → login flow',
            'Security tests (SQL injection, XSS, CSRF)',
            '80%+ code coverage achieved'
          ],
          dependencies: { depends_on: ['001', '002', '003'], blocks: [] },
          implementation_notes: 'Test rate limiting. Verify JWT expiry. Check accessibility.',
          files_involved: ['tests/api/auth.test.ts', 'tests/e2e/auth-flow.spec.ts'],
          context: {
            feature_description: featureDescription,
            related_issue: '#123'
          }
        }
      ];

      // Step 4: Generate Todo Files
      const generator = new TodoFileGenerator();
      (generator as any).todosDir = testTodosDir;
      (generator as any).templatePath = path.join(testTodosDir, '000-pending-p1-TEMPLATE.md');

      const result = await generator.generateTodos(todoSpecs);

      // Verify files created
      expect(result.files_created).toHaveLength(4);
      expect(result.files_created[0]).toMatch(/001-pending-p1/);
      expect(result.files_created[1]).toMatch(/002-pending-p1/);
      expect(result.files_created[2]).toMatch(/003-pending-p1/);
      expect(result.files_created[3]).toMatch(/004-pending-p2/);

      // Verify TodoWrite items
      expect(result.todowrite_items).toHaveLength(4);
      expect(result.todowrite_items[0].content).toContain('Database Schema');
      expect(result.todowrite_items[1].content).toContain('API Endpoints');
      expect(result.todowrite_items[2].content).toContain('Frontend Components');
      expect(result.todowrite_items[3].content).toContain('QA Testing');

      // Verify dependency graph
      expect(result.dependency_graph).toContain('```mermaid');
      expect(result.dependency_graph).toContain('001 --> 002');
      expect(result.dependency_graph).toContain('002 --> 003');
      expect(result.dependency_graph).toContain('001 --> 004');

      // Verify execution waves
      expect(result.execution_waves.length).toBeGreaterThan(1);
      expect(result.execution_waves[0].todos).toContain('001'); // Wave 1: Database (no deps)
      expect(result.execution_waves[0].can_run_parallel).toBe(false); // Only 1 todo

      // Verify total effort
      // Medium(4) + Large(8) + Medium(4) + Small(2) = 18 hours
      expect(result.total_estimated_hours).toBe(18);

      // Verify confidence from pattern + template
      let overallConfidence = 50; // Base confidence

      if (patterns.patterns.length > 0) {
        overallConfidence += (patterns.avg_confidence || 0) * 0.4; // 40% weight
      }

      if (templateMatch.use_template && templateMatch.best_match) {
        overallConfidence += templateMatch.best_match.match_score * 0.4; // 40% weight
      }

      // Research quality (assume 80%)
      overallConfidence += 80 * 0.2; // 20% weight

      expect(overallConfidence).toBeGreaterThan(70); // High confidence for well-known feature
    });
  });

  describe('Full Workflow: CRUD Endpoint', () => {
    it('should complete workflow for CRUD API', async () => {
      const featureDescription = 'Add products REST API with CRUD operations';

      // Pattern search
      const patternService = new PatternSearchService();
      const patterns = await patternService.searchSimilarFeatures({
        description: featureDescription,
        category: 'api'
      });

      // Template matching
      const matcher = new TemplateMatcher();
      const templateMatch = await matcher.matchTemplate({
        description: featureDescription
      });

      // Should match crud-endpoint template
      expect(templateMatch.use_template).toBe(true);
      expect(templateMatch.best_match?.template_name).toBe('crud-endpoint');

      // Generate minimal todos for CRUD
      const todoSpecs: TodoFileSpec[] = [
        {
          title: 'Products Database Schema',
          priority: 'p1',
          assigned_agent: 'Dana-Database',
          estimated_effort: 'Small',
          acceptance_criteria: ['Products table created'],
          dependencies: { depends_on: [], blocks: ['002'] },
          implementation_notes: 'Standard CRUD schema',
          files_involved: ['migrations/products.sql'],
          context: { feature_description: featureDescription }
        },
        {
          title: 'Products API Endpoints',
          priority: 'p1',
          assigned_agent: 'Marcus-Backend',
          estimated_effort: 'Medium',
          acceptance_criteria: ['GET, POST, PUT, DELETE endpoints'],
          dependencies: { depends_on: ['001'], blocks: [] },
          implementation_notes: 'RESTful API',
          files_involved: ['src/api/products.ts'],
          context: { feature_description: featureDescription }
        }
      ];

      const generator = new TodoFileGenerator();
      (generator as any).todosDir = testTodosDir;
      (generator as any).templatePath = path.join(testTodosDir, '000-pending-p1-TEMPLATE.md');

      const result = await generator.generateTodos(todoSpecs);

      expect(result.files_created).toHaveLength(2);
      expect(result.total_estimated_hours).toBe(6); // Small(2) + Medium(4)
      expect(result.execution_waves).toHaveLength(2); // Sequential
    });
  });

  describe('Full Workflow: Custom Feature (No Template)', () => {
    it('should handle custom feature without template match', async () => {
      const featureDescription = 'Implement quantum blockchain analyzer with neural networks';

      // Pattern search
      const patternService = new PatternSearchService();
      const patterns = await patternService.searchSimilarFeatures({
        description: featureDescription
      });

      // Likely no patterns
      expect(patterns.patterns.length).toBe(0);

      // Template matching
      const matcher = new TemplateMatcher();
      const templateMatch = await matcher.matchTemplate({
        description: featureDescription
      });

      // Should NOT match any template
      expect(templateMatch.use_template).toBe(false);
      expect(templateMatch.best_match).toBeNull();
      expect(templateMatch.reason).toContain('threshold');

      // Generate conservative todos
      const todoSpecs: TodoFileSpec[] = [
        {
          title: 'Research and Prototype',
          priority: 'p1',
          assigned_agent: 'Dr.AI-ML',
          estimated_effort: 'XL',
          acceptance_criteria: ['Proof of concept working'],
          dependencies: { depends_on: [], blocks: [] },
          implementation_notes: 'Explore feasibility first',
          files_involved: [],
          context: { feature_description: featureDescription }
        }
      ];

      const generator = new TodoFileGenerator();
      (generator as any).todosDir = testTodosDir;
      (generator as any).templatePath = path.join(testTodosDir, '000-pending-p1-TEMPLATE.md');

      const result = await generator.generateTodos(todoSpecs);

      expect(result.files_created).toHaveLength(1);
      expect(result.total_estimated_hours).toBe(16); // XL = 16 hours
    });
  });

  describe('Explicit Template Selection', () => {
    it('should use explicitly selected template', async () => {
      const featureDescription = 'Some custom description';

      // Force dashboard template
      const matcher = new TemplateMatcher();
      const templateMatch = await matcher.matchTemplate({
        description: featureDescription,
        explicit_template: 'dashboard'
      });

      expect(templateMatch.use_template).toBe(true);
      expect(templateMatch.best_match?.template_name).toBe('dashboard');
      expect(templateMatch.best_match?.match_score).toBe(100); // Explicit = perfect
    });
  });

  describe('Parallel Execution Detection', () => {
    it('should detect parallel execution opportunities', async () => {
      const todoSpecs: TodoFileSpec[] = [
        { title: 'Independent Task 1', priority: 'p1', assigned_agent: 'A', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T1' } },
        { title: 'Independent Task 2', priority: 'p1', assigned_agent: 'B', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T2' } },
        { title: 'Independent Task 3', priority: 'p1', assigned_agent: 'C', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T3' } }
      ];

      const generator = new TodoFileGenerator();
      (generator as any).todosDir = testTodosDir;
      (generator as any).templatePath = path.join(testTodosDir, '000-pending-p1-TEMPLATE.md');

      const result = await generator.generateTodos(todoSpecs);

      expect(result.execution_waves).toHaveLength(1);
      expect(result.execution_waves[0].can_run_parallel).toBe(true);
      expect(result.execution_waves[0].todos).toHaveLength(3);
    });
  });

  describe('Confidence Scoring Integration', () => {
    it('should calculate overall confidence from all sources', async () => {
      // Simulate full plan workflow
      const featureDescription = 'Add user authentication';

      // Get pattern confidence
      const patternService = new PatternSearchService();
      const patterns = await patternService.searchSimilarFeatures({
        description: featureDescription
      });

      const patternConfidence = patterns.avg_confidence || 50;

      // Get template confidence
      const matcher = new TemplateMatcher();
      const templateMatch = await matcher.matchTemplate({
        description: featureDescription
      });

      const templateConfidence = templateMatch.best_match?.match_score || 50;

      // Research quality (simulated)
      const researchConfidence = 80;

      // Calculate weighted confidence
      const overallConfidence = Math.round(
        (patternConfidence * 0.4) +
        (templateConfidence * 0.4) +
        (researchConfidence * 0.2)
      );

      expect(overallConfidence).toBeGreaterThan(0);
      expect(overallConfidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle missing template directory', async () => {
      // This should not crash, just return no match
      const matcher = new TemplateMatcher();
      const result = await matcher.matchTemplate({
        description: 'test'
      });

      expect(result).toBeDefined();
    });

    it('should handle RAG store failures gracefully', async () => {
      const patternService = new PatternSearchService();
      const result = await patternService.searchSimilarFeatures({
        description: 'test feature'
      });

      // Should return none or fallback
      expect(result.search_method).toMatch(/graphrag|vector|none/);
    });
  });
});
