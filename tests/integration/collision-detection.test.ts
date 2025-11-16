/**
 * Collision Detection Integration Tests
 * Tests the CollisionDetector service for file conflict detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CollisionDetector,
  TaskFileDependency,
  CollisionRisk,
  ResolutionStrategy,
} from '../../src/orchestration/collision-detector.js';

describe('Collision Detection Integration Tests', () => {
  let detector: CollisionDetector;

  beforeEach(() => {
    detector = new CollisionDetector();
  });

  describe('No Collision Scenarios', () => {
    it('should detect no collision when tasks access different files', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Backend API',
          files_read: [],
          files_modified: ['src/api/auth.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Frontend UI',
          files_read: [],
          files_modified: ['src/components/Login.tsx'],
          files_created: [],
          files_deleted: [],
          agent: 'James-Frontend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(false);
      expect(result.risk).toBe(CollisionRisk.NONE);
      expect(result.resolution).toBe(ResolutionStrategy.ALLOW_PARALLEL);
      expect(result.require_serialization).toBe(false);
    });

    it('should allow read-only access by multiple tasks', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Read Config',
          files_read: ['config/app.json'],
          files_modified: [],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Read Config 2',
          files_read: ['config/app.json'],
          files_modified: [],
          files_created: [],
          files_deleted: [],
          agent: 'James-Frontend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(false);
      expect(result.risk).toBe(CollisionRisk.NONE);
      expect(result.resolution).toBe(ResolutionStrategy.ALLOW_PARALLEL);
      // No details when no collision
      expect(result.details.length).toBe(0);
    });
  });

  describe('Low Risk Collisions', () => {
    it('should detect low risk when one writes and others read', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Update API',
          files_read: [],
          files_modified: ['src/api/users.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Read API',
          files_read: ['src/api/users.ts'],
          files_modified: [],
          files_created: [],
          files_deleted: [],
          agent: 'James-Frontend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(true);
      expect(result.risk).toBe(CollisionRisk.LOW);
      expect(result.resolution).toBe(ResolutionStrategy.ALLOW_PARALLEL);
      expect(result.require_serialization).toBe(false);
    });
  });

  describe('Medium Risk Collisions', () => {
    it('should detect medium risk when multiple tasks create same file', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Create Test',
          files_read: [],
          files_modified: [],
          files_created: ['tests/auth.test.ts'],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Create Test 2',
          files_read: [],
          files_modified: [],
          files_created: ['tests/auth.test.ts'],
          files_deleted: [],
          agent: 'Maria-QA',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(true);
      expect(result.risk).toBe(CollisionRisk.MEDIUM);
      expect(result.resolution).toBe(ResolutionStrategy.RESCHEDULE);
      expect(result.conflicting_files).toContain('tests/auth.test.ts');
    });
  });

  describe('High Risk Collisions', () => {
    it('should detect high risk when multiple tasks modify same file', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Update Schema',
          files_read: [],
          files_modified: ['src/database/schema.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Dana-Database',
        },
        {
          task_id: 'task-2',
          task_name: 'Update Schema 2',
          files_read: [],
          files_modified: ['src/database/schema.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(true);
      expect(result.risk).toBe(CollisionRisk.HIGH);
      expect(result.resolution).toBe(ResolutionStrategy.SERIALIZE);
      expect(result.require_serialization).toBe(true);
    });

    it('should identify all conflicting tasks', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Task 1',
          files_read: [],
          files_modified: ['src/api/auth.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Task 2',
          files_read: [],
          files_modified: ['src/api/auth.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-3',
          task_name: 'Task 3',
          files_read: [],
          files_modified: ['src/api/users.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.conflicting_tasks).toContain('task-1');
      expect(result.conflicting_tasks).toContain('task-2');
      expect(result.conflicting_tasks.length).toBe(2);
    });
  });

  describe('Critical Risk Collisions', () => {
    it('should detect critical risk when delete conflicts with modify', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Delete Old File',
          files_read: [],
          files_modified: [],
          files_created: [],
          files_deleted: ['src/api/old-auth.ts'],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Update Old File',
          files_read: [],
          files_modified: ['src/api/old-auth.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(true);
      expect(result.risk).toBe(CollisionRisk.CRITICAL);
      expect(result.details[0]?.reason).toContain('Destructive operation');
    });

    it('should detect critical risk when delete conflicts with create', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Delete File',
          files_read: [],
          files_modified: [],
          files_created: [],
          files_deleted: ['src/temp.ts'],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Create File',
          files_read: [],
          files_modified: [],
          files_created: ['src/temp.ts'],
          files_deleted: [],
          agent: 'James-Frontend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(true);
      expect(result.risk).toBe(CollisionRisk.CRITICAL);
    });
  });

  describe('Task Pair Collision', () => {
    it('should check collision between two specific tasks', async () => {
      const task1: TaskFileDependency = {
        task_id: 'task-1',
        task_name: 'Backend Task',
        files_read: [],
        files_modified: ['src/api/auth.ts'],
        files_created: [],
        files_deleted: [],
        agent: 'Marcus-Backend',
      };

      const task2: TaskFileDependency = {
        task_id: 'task-2',
        task_name: 'Backend Task 2',
        files_read: [],
        files_modified: ['src/api/auth.ts'],
        files_created: [],
        files_deleted: [],
        agent: 'Marcus-Backend',
      };

      const result = await detector.checkTaskPairCollision(task1, task2);

      expect(result.has_collision).toBe(true);
      expect(result.risk).toBe(CollisionRisk.HIGH);
    });
  });

  describe('File Dependency Extraction', () => {
    it('should extract file dependencies from task metadata', () => {
      const taskMetadata = {
        task_id: 'task-1',
        task_name: 'Implement Auth',
        files_involved: [
          'src/api/auth.ts',
          'new-login.tsx',
          'delete-old-auth.ts',
          'read-config.json',
        ],
        agent: 'Marcus-Backend',
      };

      const result = detector.extractFileDependencies(taskMetadata);

      expect(result.task_id).toBe('task-1');
      expect(result.task_name).toBe('Implement Auth');
      expect(result.agent).toBe('Marcus-Backend');

      // Check categorization
      expect(result.files_created.some(f => f.includes('new-'))).toBe(true);
      expect(result.files_deleted.some(f => f.includes('delete-'))).toBe(true);
      expect(result.files_read.some(f => f.includes('read-'))).toBe(true);
    });

    it('should handle task without files_involved', () => {
      const taskMetadata = {
        task_id: 'task-1',
        task_name: 'Test Task',
      };

      const result = detector.extractFileDependencies(taskMetadata);

      expect(result.files_read).toEqual([]);
      expect(result.files_modified).toEqual([]);
      expect(result.files_created).toEqual([]);
      expect(result.files_deleted).toEqual([]);
    });
  });

  describe('Collision Report Generation', () => {
    it('should generate report for no collisions', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Task 1',
          files_read: [],
          files_modified: ['file1.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Agent1',
        },
        {
          task_id: 'task-2',
          task_name: 'Task 2',
          files_read: [],
          files_modified: ['file2.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Agent2',
        },
      ];

      const result = await detector.detectCollisions(tasks);
      const report = detector.generateCollisionReport(result);

      expect(report).toContain('No file collisions detected');
      expect(report).toContain('safe');
    });

    it('should generate detailed report for collisions', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Task 1',
          files_read: [],
          files_modified: ['src/api/auth.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Task 2',
          files_read: [],
          files_modified: ['src/api/auth.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
      ];

      const result = await detector.detectCollisions(tasks);
      const report = detector.generateCollisionReport(result);

      expect(report).toContain('COLLISION DETECTION REPORT');
      expect(report).toContain('HIGH');
      expect(report).toContain('src/api/auth.ts');
      expect(report).toContain('task-1');
      expect(report).toContain('task-2');
      expect(report).toContain('Recommendations');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple files with different collision levels', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Backend Work',
          files_read: ['config.json'],
          files_modified: ['src/api/auth.ts', 'src/api/users.ts'],
          files_created: ['src/api/new-endpoint.ts'],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-2',
          task_name: 'Backend Work 2',
          files_read: ['config.json'],
          files_modified: ['src/api/auth.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Marcus-Backend',
        },
        {
          task_id: 'task-3',
          task_name: 'Frontend Work',
          files_read: [],
          files_modified: ['src/components/Login.tsx'],
          files_created: [],
          files_deleted: [],
          agent: 'James-Frontend',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      expect(result.has_collision).toBe(true);
      expect(result.risk).toBe(CollisionRisk.HIGH);
      expect(result.conflicting_files).toContain('src/api/auth.ts');
      expect(result.conflicting_files).not.toContain('src/components/Login.tsx');
    });

    it('should detect highest risk among multiple conflicts', async () => {
      const tasks: TaskFileDependency[] = [
        {
          task_id: 'task-1',
          task_name: 'Task 1',
          files_read: [],
          files_modified: ['low-risk.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Agent1',
        },
        {
          task_id: 'task-2',
          task_name: 'Task 2',
          files_read: ['low-risk.ts'],
          files_modified: [],
          files_created: [],
          files_deleted: [],
          agent: 'Agent2',
        },
        {
          task_id: 'task-3',
          task_name: 'Task 3',
          files_read: [],
          files_modified: ['high-risk.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Agent3',
        },
        {
          task_id: 'task-4',
          task_name: 'Task 4',
          files_read: [],
          files_modified: ['high-risk.ts'],
          files_created: [],
          files_deleted: [],
          agent: 'Agent4',
        },
      ];

      const result = await detector.detectCollisions(tasks);

      // Should report highest risk level found
      expect(result.risk).toBe(CollisionRisk.HIGH);
      expect(result.require_serialization).toBe(true);
    });
  });
});
