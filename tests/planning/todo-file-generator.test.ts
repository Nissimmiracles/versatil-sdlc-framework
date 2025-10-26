/**
 * Todo File Generator Service - Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TodoFileGenerator, TodoFileSpec } from '../../src/planning/todo-file-generator.js';
import * as fs from 'fs';
import * as path from 'path';

describe('TodoFileGenerator', () => {
  let generator: TodoFileGenerator;
  const testTodosDir = path.join(process.cwd(), 'todos-test');

  beforeEach(() => {
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

    generator = new TodoFileGenerator(testTodosDir);
  });

  afterEach(() => {
    // Cleanup test files
    if (fs.existsSync(testTodosDir)) {
      fs.rmSync(testTodosDir, { recursive: true, force: true });
    }
  });

  it('should generate todo file with correct naming', async () => {
    const specs: TodoFileSpec[] = [{
      title: 'Implement authentication API',
      priority: 'p1',
      assigned_agent: 'Marcus-Backend',
      estimated_effort: 'Medium',
      acceptance_criteria: ['Create JWT endpoints', 'Add bcrypt hashing'],
      dependencies: { depends_on: [], blocks: [] },
      implementation_notes: 'Use existing user table',
      files_involved: ['src/auth/auth-controller.ts'],
      context: { feature_description: 'User authentication system' }
    }];

    const result = await generator.generateTodos(specs);

    expect(result.files_created.length).toBe(1);
    expect(result.files_created[0]).toMatch(/\d{3}-pending-p1-implement-authentication-api\.md/);
  });

  it('should generate TodoWrite items', async () => {
    const specs: TodoFileSpec[] = [{
      title: 'Create database schema',
      priority: 'p1',
      assigned_agent: 'Dana-Database',
      estimated_effort: 'Small',
      acceptance_criteria: ['Create users table'],
      dependencies: { depends_on: [], blocks: [] },
      implementation_notes: 'Add RLS policies',
      files_involved: ['migrations/001_users.sql'],
      context: { feature_description: 'Database setup' }
    }];

    const result = await generator.generateTodos(specs);

    expect(result.todowrite_items.length).toBe(1);
    expect(result.todowrite_items[0].content).toBe('Create database schema');
    expect(result.todowrite_items[0].status).toBe('pending');
  });

  it('should generate Mermaid dependency graph', async () => {
    const specs: TodoFileSpec[] = [
      {
        title: 'Task A',
        priority: 'p1',
        assigned_agent: 'Marcus',
        estimated_effort: 'Small',
        acceptance_criteria: ['Done'],
        dependencies: { depends_on: [], blocks: ['002'] },
        implementation_notes: 'Notes',
        files_involved: ['file.ts'],
        context: { feature_description: 'Desc' }
      },
      {
        title: 'Task B',
        priority: 'p1',
        assigned_agent: 'James',
        estimated_effort: 'Medium',
        acceptance_criteria: ['Done'],
        dependencies: { depends_on: ['001'], blocks: [] },
        implementation_notes: 'Notes',
        files_involved: ['file2.ts'],
        context: { feature_description: 'Desc 2' }
      }
    ];

    const result = await generator.generateTodos(specs);

    expect(result.dependency_graph).toContain('```mermaid');
    expect(result.dependency_graph).toContain('graph TD');
    expect(result.dependency_graph).toContain('001');
    expect(result.dependency_graph).toContain('002');
  });

  it('should calculate total effort correctly', async () => {
    const specs: TodoFileSpec[] = [
      {
        title: 'Task 1',
        priority: 'p1',
        assigned_agent: 'Marcus',
        estimated_effort: 'Small', // 2 hours
        acceptance_criteria: ['Done'],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'Desc' }
      },
      {
        title: 'Task 2',
        priority: 'p1',
        assigned_agent: 'James',
        estimated_effort: 'Large', // 8 hours
        acceptance_criteria: ['Done'],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: 'Desc' }
      }
    ];

    const result = await generator.generateTodos(specs);

    expect(result.total_estimated_hours).toBe(10); // 2 + 8
  });

  it('should detect execution waves', async () => {
    const specs: TodoFileSpec[] = [
      {
        title: 'Independent Task 1',
        priority: 'p1',
        assigned_agent: 'Marcus',
        estimated_effort: 'Small',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: '' }
      },
      {
        title: 'Independent Task 2',
        priority: 'p1',
        assigned_agent: 'James',
        estimated_effort: 'Small',
        acceptance_criteria: [],
        dependencies: { depends_on: [], blocks: [] },
        implementation_notes: '',
        files_involved: [],
        context: { feature_description: '' }
      }
    ];

    const result = await generator.generateTodos(specs);

    expect(result.execution_waves.length).toBeGreaterThan(0);
    expect(result.execution_waves[0].can_run_parallel).toBe(true);
    expect(result.execution_waves[0].todos.length).toBe(2);
  });
});
