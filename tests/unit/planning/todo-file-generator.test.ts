/**
 * Todo File Generator Service - Unit Tests
 * Tests for todo file creation, numbering, and dependency management
 */

import { TodoFileGenerator, TodoFileSpec, TodoGenerationResult } from '../../src/planning/todo-file-generator';
import * as fs from 'fs';
import * as path from 'path';

describe('TodoFileGenerator', () => {
  let generator: TodoFileGenerator;
  const testTodosDir = path.join(process.cwd(), 'todos-test');

  beforeAll(() => {
    // Create test todos directory
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
    // Clean up test directory
    if (fs.existsSync(testTodosDir)) {
      fs.rmSync(testTodosDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Monkey-patch the todosDir to use test directory
    generator = new TodoFileGenerator();
    (generator as any).todosDir = testTodosDir;
    (generator as any).templatePath = path.join(testTodosDir, '000-pending-p1-TEMPLATE.md');

    // Clean up test todos before each test
    const files = fs.readdirSync(testTodosDir);
    files.forEach(file => {
      if (file.match(/^\d{3}-/) && file.endsWith('.md')) {
        fs.unlinkSync(path.join(testTodosDir, file));
      }
    });
  });

  describe('Todo File Generation', () => {
    it('should create todo files from specs', async () => {
      const specs: TodoFileSpec[] = [
        {
          title: 'Implement Authentication API',
          priority: 'p1',
          assigned_agent: 'Marcus-Backend',
          estimated_effort: 'Medium',
          acceptance_criteria: [
            'POST /auth/login endpoint created',
            'JWT token generation working',
            'Tests passing with 80%+ coverage'
          ],
          dependencies: {
            depends_on: [],
            blocks: ['002']
          },
          implementation_notes: 'Use bcrypt for password hashing',
          files_involved: ['src/api/auth.ts', 'src/middleware/jwt.ts'],
          context: {
            feature_description: 'Add user authentication with JWT tokens',
            related_issue: '#123'
          }
        }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.files_created).toHaveLength(1);
      expect(result.files_created[0]).toMatch(/001-pending-p1-implement-authentication-api\.md/);
      expect(result.todowrite_items).toHaveLength(1);
      expect(result.todowrite_items[0].content).toBe('Implement Authentication API');
      expect(result.total_estimated_hours).toBe(4); // Medium = 4 hours
    });

    it('should auto-number files sequentially', async () => {
      const spec: TodoFileSpec = {
        title: 'First Todo',
        priority: 'p1',
        assigned_agent: 'Test',
        estimated_effort: 'Small',
        acceptance_criteria: ['Done'],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: 'Test',
        files_involved: [],
        context: { feature_description: 'Test' }
      };

      const result1 = await generator.generateTodos([spec]);
      expect(result1.files_created[0]).toMatch(/^001-/);

      const result2 = await generator.generateTodos([spec]);
      expect(result2.files_created[0]).toMatch(/^002-/);

      const result3 = await generator.generateTodos([spec]);
      expect(result3.files_created[0]).toMatch(/^003-/);
    });

    it('should generate correct file names', async () => {
      const spec: TodoFileSpec = {
        title: 'Create User Database Schema',
        priority: 'p2',
        assigned_agent: 'Dana-Database',
        estimated_effort: 'Large',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'Schema' }
      };

      const result = await generator.generateTodos([spec]);

      expect(result.files_created[0]).toMatch(/\d{3}-pending-p2-create-user-database-schema\.md/);
    });

    it('should sanitize file names (remove special chars)', async () => {
      const spec: TodoFileSpec = {
        title: 'Fix: API @Error #123 (Bug!)',
        priority: 'p1',
        assigned_agent: 'Marcus',
        estimated_effort: 'Small',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'Fix' }
      };

      const result = await generator.generateTodos([spec]);

      expect(result.files_created[0]).toMatch(/\d{3}-pending-p1-fix-api-error-123-bug\.md/);
    });
  });

  describe('Template Population', () => {
    it('should populate template with spec data', async () => {
      const spec: TodoFileSpec = {
        title: 'Test Task',
        priority: 'p1',
        assigned_agent: 'Maria-QA',
        estimated_effort: 'Medium',
        acceptance_criteria: ['Criterion 1', 'Criterion 2'],
        dependencies: {
          depends_on: ['001'],
          blocks: ['003']
        },
        implementation_notes: 'Important notes here',
        files_involved: ['file1.ts', 'file2.ts'],
        context: {
          feature_description: 'Test feature description',
          related_issue: '#456',
          related_pr: '#789'
        }
      };

      const result = await generator.generateTodos([spec]);

      const filePath = path.join(testTodosDir, result.files_created[0]);
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('Test Task');
      expect(content).toContain('P1');
      expect(content).toContain('Maria-QA');
      expect(content).toContain('Medium');
      expect(content).toContain('Criterion 1');
      expect(content).toContain('Criterion 2');
      expect(content).toContain('001');
      expect(content).toContain('003');
      expect(content).toContain('Important notes here');
      expect(content).toContain('file1.ts');
      expect(content).toContain('file2.ts');
      expect(content).toContain('#456');
      expect(content).toContain('#789');
    });

    it('should include creation date', async () => {
      const spec: TodoFileSpec = {
        title: 'Date Test',
        priority: 'p1',
        assigned_agent: 'Test',
        estimated_effort: 'Small',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'Test' }
      };

      const result = await generator.generateTodos([spec]);
      const filePath = path.join(testTodosDir, result.files_created[0]);
      const content = fs.readFileSync(filePath, 'utf-8');

      const today = new Date().toISOString().split('T')[0];
      expect(content).toContain(today);
    });
  });

  describe('TodoWrite Generation', () => {
    it('should create TodoWrite items for each spec', async () => {
      const specs: TodoFileSpec[] = [
        {
          title: 'Task 1',
          priority: 'p1',
          assigned_agent: 'Agent1',
          estimated_effort: 'Small',
          acceptance_criteria: [],
          dependencies: { depends_on: [], blocks: [] },
          implementation_notes: '',
          files_involved: [],
          context: { feature_description: 'T1' }
        },
        {
          title: 'Task 2',
          priority: 'p2',
          assigned_agent: 'Agent2',
          estimated_effort: 'Medium',
          acceptance_criteria: [],
          dependencies: { depends_on: [], blocks: [] },
          implementation_notes: '',
          files_involved: [],
          context: { feature_description: 'T2' }
        }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.todowrite_items).toHaveLength(2);
      expect(result.todowrite_items[0].content).toBe('Task 1');
      expect(result.todowrite_items[1].content).toBe('Task 2');
    });

    it('should convert titles to active form', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'Create API', priority: 'p1', assigned_agent: 'A', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T' } },
        { title: 'Implement auth', priority: 'p1', assigned_agent: 'A', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T' } },
        { title: 'Add tests', priority: 'p1', assigned_agent: 'A', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T' } },
        { title: 'Fix bug', priority: 'p1', assigned_agent: 'A', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.todowrite_items[0].activeForm).toContain('Creating');
      expect(result.todowrite_items[1].activeForm).toContain('Implementing');
      expect(result.todowrite_items[2].activeForm).toContain('Adding');
      expect(result.todowrite_items[3].activeForm).toContain('Fixing');
    });

    it('should include file path in TodoWrite items', async () => {
      const spec: TodoFileSpec = {
        title: 'Test',
        priority: 'p1',
        assigned_agent: 'A',
        estimated_effort: 'Small',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'T' }
      };

      const result = await generator.generateTodos([spec]);

      expect(result.todowrite_items[0].file_path).toBeDefined();
      expect(result.todowrite_items[0].file_path).toContain('todos');
      expect(result.todowrite_items[0].file_path).toContain('.md');
    });

    it('should set status to pending by default', async () => {
      const spec: TodoFileSpec = {
        title: 'Test',
        priority: 'p1',
        assigned_agent: 'A',
        estimated_effort: 'Small',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'T' }
      };

      const result = await generator.generateTodos([spec]);

      expect(result.todowrite_items[0].status).toBe('pending');
    });
  });

  describe('Dependency Graph Generation', () => {
    it('should generate Mermaid dependency graph', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'A', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: ['002'] }, implementation_notes: '', files_involved: [], context: { feature_description: 'A' } },
        { title: 'B', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['001'], blocks: ['003'] }, implementation_notes: '', files_involved: [], context: { feature_description: 'B' } },
        { title: 'C', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['002'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'C' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.dependency_graph).toContain('```mermaid');
      expect(result.dependency_graph).toContain('graph TD');
      expect(result.dependency_graph).toContain('001');
      expect(result.dependency_graph).toContain('002');
      expect(result.dependency_graph).toContain('003');
      expect(result.dependency_graph).toContain('-->');
      expect(result.dependency_graph).toContain('```');
    });

    it('should show dependency relationships in graph', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'Database', priority: 'p1', assigned_agent: 'Dana', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'DB' } },
        { title: 'API', priority: 'p1', assigned_agent: 'Marcus', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['001'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'API' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.dependency_graph).toContain('001 --> 002');
    });
  });

  describe('Execution Wave Detection', () => {
    it('should detect todos with no dependencies as Wave 1', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'Independent 1', priority: 'p1', assigned_agent: 'A', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T' } },
        { title: 'Independent 2', priority: 'p1', assigned_agent: 'B', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T' } },
        { title: 'Independent 3', priority: 'p1', assigned_agent: 'C', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'T' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.execution_waves).toHaveLength(1);
      expect(result.execution_waves[0].wave_number).toBe(1);
      expect(result.execution_waves[0].todos).toHaveLength(3);
      expect(result.execution_waves[0].can_run_parallel).toBe(true);
    });

    it('should detect sequential dependencies as separate waves', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'A', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'A' } },
        { title: 'B', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['001'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'B' } },
        { title: 'C', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['002'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'C' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.execution_waves).toHaveLength(3);
      expect(result.execution_waves[0].todos).toContain('001');
      expect(result.execution_waves[1].todos).toContain('002');
      expect(result.execution_waves[2].todos).toContain('003');
    });

    it('should detect parallel execution within a wave', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'Base', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'Base' } },
        { title: 'Dep1', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['001'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'D1' } },
        { title: 'Dep2', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['001'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'D2' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.execution_waves).toHaveLength(2);
      expect(result.execution_waves[0].can_run_parallel).toBe(false); // Only 1 todo
      expect(result.execution_waves[1].can_run_parallel).toBe(true); // 2 todos can run parallel
      expect(result.execution_waves[1].todos).toHaveLength(2);
    });

    it('should calculate effort per wave', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'Small', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'S' } },
        { title: 'Medium', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Medium', acceptance_criteria: [], dependencies: { depends_on: ['001'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'M' } },
        { title: 'Large', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Large', acceptance_criteria: [], dependencies: { depends_on: ['002'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'L' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.execution_waves[0].estimated_hours).toBe(2); // Small
      expect(result.execution_waves[1].estimated_hours).toBe(4); // Medium
      expect(result.execution_waves[2].estimated_hours).toBe(8); // Large
    });
  });

  describe('Total Effort Calculation', () => {
    it('should calculate total effort from all specs', async () => {
      const specs: TodoFileSpec[] = [
        { title: 'Small', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'S' } },
        { title: 'Medium', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Medium', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'M' } },
        { title: 'Large', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Large', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'L' } },
        { title: 'XL', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'XL', acceptance_criteria: [], dependencies: { depends_on: [], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'XL' } }
      ];

      const result = await generator.generateTodos(specs);

      // Small(2) + Medium(4) + Large(8) + XL(16) = 30
      expect(result.total_estimated_hours).toBe(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty specs array', async () => {
      const result = await generator.generateTodos([]);

      expect(result.files_created).toHaveLength(0);
      expect(result.todowrite_items).toHaveLength(0);
      expect(result.total_estimated_hours).toBe(0);
    });

    it('should handle very long titles (truncate)', async () => {
      const longTitle = 'A'.repeat(100);
      const spec: TodoFileSpec = {
        title: longTitle,
        priority: 'p1',
        assigned_agent: 'Test',
        estimated_effort: 'Small',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'Test' }
      };

      const result = await generator.generateTodos([spec]);

      // File name should be truncated to ~50 chars
      const fileName = result.files_created[0];
      expect(fileName.length).toBeLessThan(100);
    });

    it('should handle circular dependencies gracefully', async () => {
      // Note: Circular deps should be validated before this point,
      // but generator should not crash
      const specs: TodoFileSpec[] = [
        { title: 'A', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['002'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'A' } },
        { title: 'B', priority: 'p1', assigned_agent: 'Test', estimated_effort: 'Small', acceptance_criteria: [], dependencies: { depends_on: ['001'], blocks: [] }, implementation_notes: '', files_involved: [], context: { feature_description: 'B' } }
      ];

      const result = await generator.generateTodos(specs);

      expect(result.files_created).toHaveLength(2);
      // Wave detection should handle circular deps gracefully
    });
  });
});
