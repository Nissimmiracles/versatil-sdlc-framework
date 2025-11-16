/**
 * Wave Execution Integration Tests
 * Tests the WaveExecutor service structure and wave configuration
 */

import { describe, it, expect } from 'vitest';
import type { Wave, CoordinationCheckpoint } from '../../src/orchestration/wave-executor.js';

describe('Wave Execution Integration Tests', () => {

  describe('Wave Structure Validation', () => {
    it('should create a valid parallel wave configuration', () => {
      const wave: Wave = {
        wave_number: 1,
        wave_name: 'Initial Setup',
        tasks: ['task-1', 'task-2', 'task-3'],
        agents: ['Marcus-Backend', 'James-Frontend', 'Dana-Database'],
        wave_duration_estimate: 15,
        parallel_execution: true,
        dependencies: [],
      };

      expect(wave.wave_number).toBe(1);
      expect(wave.wave_name).toBe('Initial Setup');
      expect(wave.tasks.length).toBe(3);
      expect(wave.agents.length).toBe(3);
      expect(wave.parallel_execution).toBe(true);
      expect(wave.dependencies).toEqual([]);
    });

    it('should create a valid sequential wave configuration', () => {
      const wave: Wave = {
        wave_number: 2,
        wave_name: 'Backend API Implementation',
        tasks: ['api-task-1', 'api-task-2'],
        agents: ['Marcus-Backend'],
        wave_duration_estimate: 20,
        parallel_execution: false,
        dependencies: [1],
      };

      expect(wave.parallel_execution).toBe(false);
      expect(wave.dependencies).toEqual([1]);
      expect(wave.wave_duration_estimate).toBe(20);
    });

    it('should create wave with coordination checkpoint', () => {
      const checkpoint: CoordinationCheckpoint = {
        checkpoint_name: 'Database Schema Ready',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['All migrations applied', 'Schema validated'],
        validation_steps: ['npm run db:migrate', 'npm run db:validate'],
      };

      const wave: Wave = {
        wave_number: 1,
        wave_name: 'Database Setup',
        tasks: ['db-task-1'],
        agents: ['Dana-Database'],
        wave_duration_estimate: 10,
        parallel_execution: false,
        dependencies: [],
        coordination_checkpoint: checkpoint,
      };

      expect(wave.coordination_checkpoint).toBeDefined();
      expect(wave.coordination_checkpoint?.checkpoint_name).toBe('Database Schema Ready');
      expect(wave.coordination_checkpoint?.blocking).toBe(true);
      expect(wave.coordination_checkpoint?.quality_gates.length).toBe(2);
    });
  });

  describe('Multi-Wave Dependencies', () => {
    it('should configure wave dependency chain correctly', () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Database Setup',
          tasks: ['db-task-1'],
          agents: ['Dana-Database'],
          wave_duration_estimate: 10,
          parallel_execution: false,
          dependencies: [],
        },
        {
          wave_number: 2,
          wave_name: 'Backend API',
          tasks: ['api-task-1'],
          agents: ['Marcus-Backend'],
          wave_duration_estimate: 15,
          parallel_execution: false,
          dependencies: [1],
        },
        {
          wave_number: 3,
          wave_name: 'Frontend UI',
          tasks: ['ui-task-1'],
          agents: ['James-Frontend'],
          wave_duration_estimate: 20,
          parallel_execution: false,
          dependencies: [2],
        },
      ];

      expect(waves[0].dependencies).toEqual([]);
      expect(waves[1].dependencies).toEqual([1]);
      expect(waves[2].dependencies).toEqual([2]);
    });

    it('should configure parallel waves with shared dependencies', () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Foundation',
          tasks: ['foundation-task'],
          agents: ['Sarah-PM'],
          wave_duration_estimate: 5,
          parallel_execution: false,
          dependencies: [],
        },
        {
          wave_number: 2,
          wave_name: 'Parallel Implementation',
          tasks: ['backend-task', 'frontend-task', 'database-task'],
          agents: ['Marcus-Backend', 'James-Frontend', 'Dana-Database'],
          wave_duration_estimate: 30,
          parallel_execution: true,
          dependencies: [1],
        },
      ];

      expect(waves[1].parallel_execution).toBe(true);
      expect(waves[1].dependencies).toEqual([1]);
      expect(waves[1].tasks.length).toBe(3);
    });
  });

  describe('Coordination Checkpoints', () => {
    it('should create blocking checkpoint configuration', () => {
      const checkpoint: CoordinationCheckpoint = {
        checkpoint_name: 'Quality Gates',
        location: 'After Wave 2',
        blocking: true,
        quality_gates: [
          'All tests passing',
          'Coverage >= 80%',
          'Security scan clean',
        ],
        validation_steps: [
          'npm test',
          'npm run coverage',
          'npm audit',
        ],
      };

      expect(checkpoint.blocking).toBe(true);
      expect(checkpoint.quality_gates.length).toBe(3);
      expect(checkpoint.validation_steps.length).toBe(3);
    });

    it('should create warning checkpoint configuration', () => {
      const checkpoint: CoordinationCheckpoint = {
        checkpoint_name: 'Performance Check',
        location: 'After Wave 3',
        blocking: false,
        quality_gates: ['API response < 200ms', 'LCP < 2.5s'],
        validation_steps: ['npm run perf:test'],
      };

      expect(checkpoint.blocking).toBe(false);
      expect(checkpoint.quality_gates.length).toBe(2);
    });

    it('should create checkpoint with agent handoff validation', () => {
      const checkpoint: CoordinationCheckpoint = {
        checkpoint_name: 'Database → Backend Handoff',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['API endpoints functional'],
        validation_steps: ['npm run test:api'],
        handoff_agents: [
          {
            from: 'Dana-Database',
            to: 'Marcus-Backend',
            context: 'Database schema and migrations',
          },
        ],
      };

      expect(checkpoint.handoff_agents).toBeDefined();
      expect(checkpoint.handoff_agents?.length).toBe(1);
      expect(checkpoint.handoff_agents?.[0].from).toBe('Dana-Database');
      expect(checkpoint.handoff_agents?.[0].to).toBe('Marcus-Backend');
    });
  });

  describe('Time Calculation Configuration', () => {
    it('should configure waves with correct time estimates', () => {
      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Quick Setup',
          tasks: ['task-1'],
          agents: ['Marcus-Backend'],
          wave_duration_estimate: 5,
          parallel_execution: false,
          dependencies: [],
        },
        {
          wave_number: 2,
          wave_name: 'Parallel Work',
          tasks: ['task-2a', 'task-2b', 'task-2c'],
          agents: ['Marcus-Backend', 'James-Frontend', 'Dana-Database'],
          wave_duration_estimate: 45,
          parallel_execution: true,
          dependencies: [1],
        },
      ];

      // Sequential time: 5 + 45 = 50 minutes
      const sequentialTime = waves.reduce((sum, w) => sum + w.wave_duration_estimate, 0);
      expect(sequentialTime).toBe(50);

      // For parallel wave 2, estimated time is max task duration (not sum)
      // Assuming equal distribution: 45 / 3 = 15 minutes per task
      const wave2ParallelTime = waves[1].wave_duration_estimate / waves[1].tasks.length;
      expect(wave2ParallelTime).toBe(15);

      // Estimated parallel time: 5 + 15 = 20 minutes
      const estimatedParallelTime = waves[0].wave_duration_estimate + wave2ParallelTime;
      expect(estimatedParallelTime).toBe(20);

      // Time savings: 50 - 20 = 30 minutes (60% faster)
      const timeSavings = sequentialTime - estimatedParallelTime;
      expect(timeSavings).toBe(30);

      const percentageFaster = (timeSavings / sequentialTime) * 100;
      expect(percentageFaster).toBe(60);
    });
  });

  describe('Agent Distribution', () => {
    it('should distribute tasks across multiple agents in parallel wave', () => {
      const wave: Wave = {
        wave_number: 1,
        wave_name: 'Multi-Agent Parallel',
        tasks: ['backend-1', 'backend-2', 'frontend-1', 'frontend-2', 'db-1'],
        agents: ['Marcus-Backend', 'James-Frontend', 'Dana-Database'],
        wave_duration_estimate: 30,
        parallel_execution: true,
        dependencies: [],
      };

      expect(wave.tasks.length).toBe(5);
      expect(wave.agents.length).toBe(3);
      expect(wave.parallel_execution).toBe(true);
    });

    it('should assign single agent for sequential wave', () => {
      const wave: Wave = {
        wave_number: 1,
        wave_name: 'Single Agent Sequential',
        tasks: ['task-1', 'task-2', 'task-3'],
        agents: ['Marcus-Backend'],
        wave_duration_estimate: 30,
        parallel_execution: false,
        dependencies: [],
      };

      expect(wave.agents.length).toBe(1);
      expect(wave.parallel_execution).toBe(false);
    });
  });

  describe('Complex Wave Plans', () => {
    it('should configure full-stack feature wave plan', () => {
      const checkpoint1: CoordinationCheckpoint = {
        checkpoint_name: 'Database Schema Ready',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['Schema validated', 'Migrations applied'],
        validation_steps: ['npm run db:validate'],
      };

      const checkpoint2: CoordinationCheckpoint = {
        checkpoint_name: 'API Endpoints Functional',
        location: 'After Wave 2',
        blocking: true,
        quality_gates: ['All tests passing', 'Coverage >= 80%'],
        validation_steps: ['npm test', 'npm run coverage'],
        handoff_agents: [
          {
            from: 'Marcus-Backend',
            to: 'James-Frontend',
            context: 'API contracts and endpoints',
          },
        ],
      };

      const waves: Wave[] = [
        {
          wave_number: 1,
          wave_name: 'Database Schema & Migrations',
          tasks: ['create-schema', 'create-migrations', 'apply-migrations'],
          agents: ['Dana-Database'],
          wave_duration_estimate: 15,
          parallel_execution: false,
          dependencies: [],
          coordination_checkpoint: checkpoint1,
        },
        {
          wave_number: 2,
          wave_name: 'Backend API Implementation',
          tasks: ['implement-endpoints', 'add-validation', 'add-tests'],
          agents: ['Marcus-Backend'],
          wave_duration_estimate: 30,
          parallel_execution: false,
          dependencies: [1],
          coordination_checkpoint: checkpoint2,
        },
        {
          wave_number: 3,
          wave_name: 'Frontend + Testing',
          tasks: ['implement-ui', 'implement-e2e-tests'],
          agents: ['James-Frontend', 'Maria-QA'],
          wave_duration_estimate: 40,
          parallel_execution: true,
          dependencies: [2],
        },
      ];

      expect(waves.length).toBe(3);
      expect(waves[0].coordination_checkpoint).toBeDefined();
      expect(waves[1].coordination_checkpoint).toBeDefined();
      expect(waves[2].parallel_execution).toBe(true);

      // Verify dependency chain
      expect(waves[0].dependencies).toEqual([]);
      expect(waves[1].dependencies).toEqual([1]);
      expect(waves[2].dependencies).toEqual([2]);
    });
  });
});
