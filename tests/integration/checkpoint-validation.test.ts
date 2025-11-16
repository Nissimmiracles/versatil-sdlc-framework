/**
 * Checkpoint Validation Integration Tests
 * Tests the CheckpointValidator service for quality gates and coordination
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CheckpointValidator,
  Checkpoint,
} from '../../src/orchestration/checkpoint-validator.js';

describe('Checkpoint Validation Integration Tests', () => {
  let validator: CheckpointValidator;

  beforeEach(() => {
    validator = new CheckpointValidator();
  });

  describe('Basic Checkpoint Validation', () => {
    it('should validate checkpoint with passing quality gates', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Basic Validation',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['All tests passing'],
        validation_steps: ['echo "Tests passed"'],
      };

      const result = await validator.validate(checkpoint);

      expect(result.checkpoint_name).toBe('Basic Validation');
      expect(result.passed).toBe(true);
      expect(result.blocking).toBe(true);
      expect(result.quality_gate_results.length).toBe(1);
      expect(result.total_execution_time).toBeGreaterThan(0);
    });

    it('should handle empty quality gates', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Empty Checkpoint',
        location: 'After Wave 1',
        blocking: false,
        quality_gates: [],
        validation_steps: [],
      };

      const result = await validator.validate(checkpoint);

      expect(result.passed).toBe(true);
      expect(result.quality_gate_results.length).toBe(0);
      expect(result.warnings.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Blocking vs Warning Checkpoints', () => {
    it('should create errors for blocking checkpoint failures', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Blocking Checkpoint',
        location: 'After Wave 2',
        blocking: true,
        quality_gates: ['Coverage >= 80%'],
        validation_steps: ['exit 1'], // Force failure
      };

      const result = await validator.validate(checkpoint);

      expect(result.passed).toBe(false);
      expect(result.blocking).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should create warnings for non-blocking checkpoint failures', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Warning Checkpoint',
        location: 'After Wave 3',
        blocking: false,
        quality_gates: ['Performance check'],
        validation_steps: ['exit 1'], // Force failure
      };

      const result = await validator.validate(checkpoint);

      expect(result.passed).toBe(false);
      expect(result.blocking).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Quality Gate Validation', () => {
    it('should validate multiple quality gates', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Multi-Gate Checkpoint',
        location: 'After Wave 2',
        blocking: true,
        quality_gates: [
          'All tests passing',
          'Coverage >= 80%',
          'Security scan clean',
        ],
        validation_steps: [
          'echo "Tests passed"',
          'echo "Coverage: 85%"',
          'echo "No vulnerabilities"',
        ],
      };

      const result = await validator.validate(checkpoint);

      expect(result.quality_gate_results.length).toBe(3);
      expect(result.quality_gate_results.every(qg => qg.execution_time !== undefined)).toBe(true);
    });

    it('should track execution time for each quality gate', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Timed Checkpoint',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['Test execution'],
        validation_steps: ['echo "Testing"'],
      };

      const result = await validator.validate(checkpoint);

      expect(result.quality_gate_results[0].execution_time).toBeGreaterThan(0);
      expect(result.total_execution_time).toBeGreaterThan(0);
    });
  });

  describe('Agent Handoff Validation', () => {
    it('should validate agent handoffs', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Handoff Checkpoint',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['Database ready'],
        validation_steps: ['echo "DB ready"'],
        handoff_agents: [
          {
            from: 'Dana-Database',
            to: 'Marcus-Backend',
            context: 'Database schema and migrations',
          },
        ],
      };

      const result = await validator.validate(checkpoint);

      expect(result.handoff_results.length).toBe(1);
      expect(result.handoff_results[0].from).toBe('Dana-Database');
      expect(result.handoff_results[0].to).toBe('Marcus-Backend');
      expect(result.handoff_results[0].passed).toBe(true);
    });

    it('should handle multiple agent handoffs', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Multi-Handoff Checkpoint',
        location: 'After Wave 2',
        blocking: false,
        quality_gates: ['API ready'],
        validation_steps: ['echo "API ready"'],
        handoff_agents: [
          {
            from: 'Dana-Database',
            to: 'Marcus-Backend',
            context: 'Database schema',
          },
          {
            from: 'Marcus-Backend',
            to: 'James-Frontend',
            context: 'API endpoints',
          },
        ],
      };

      const result = await validator.validate(checkpoint);

      expect(result.handoff_results.length).toBe(2);
      expect(result.handoff_results.every(h => h.passed)).toBe(true);
    });
  });

  describe('Report Generation', () => {
    it('should generate report for passing checkpoint', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Success Checkpoint',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['All tests passing'],
        validation_steps: ['echo "Pass"'],
      };

      const result = await validator.validate(checkpoint);
      const report = validator.generateReport(result);

      expect(report).toContain('Success Checkpoint');
      expect(report).toContain('PASSED');
      expect(report).toContain('✅');
    });

    it('should generate report for failing blocking checkpoint', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Failing Checkpoint',
        location: 'After Wave 2',
        blocking: true,
        quality_gates: ['Tests'],
        validation_steps: ['exit 1'],
      };

      const result = await validator.validate(checkpoint);
      const report = validator.generateReport(result);

      expect(report).toContain('Failing Checkpoint');
      expect(report).toContain('FAILED (BLOCKING)');
      expect(report).toContain('⛔');
      expect(report).toContain('Errors:');
    });

    it('should generate report for failing warning checkpoint', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Warning Checkpoint',
        location: 'After Wave 3',
        blocking: false,
        quality_gates: ['Performance'],
        validation_steps: ['exit 1'],
      };

      const result = await validator.validate(checkpoint);
      const report = validator.generateReport(result);

      expect(report).toContain('Warning Checkpoint');
      expect(report).toContain('FAILED (WARNING)');
      expect(report).toContain('⚠️');
      expect(report).toContain('Warnings:');
    });

    it('should include agent handoffs in report', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Handoff Report',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['Ready'],
        validation_steps: ['echo "Ready"'],
        handoff_agents: [
          {
            from: 'Dana-Database',
            to: 'Marcus-Backend',
            context: 'Schema',
          },
        ],
      };

      const result = await validator.validate(checkpoint);
      const report = validator.generateReport(result);

      expect(report).toContain('Agent Handoffs:');
      expect(report).toContain('Dana-Database');
      expect(report).toContain('Marcus-Backend');
      expect(report).toContain('Schema');
    });
  });

  describe('Complex Scenarios', () => {
    it('should track all quality gates in result', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Multi-Gate Tracking',
        location: 'After Wave 2',
        blocking: false,
        quality_gates: ['Gate 1', 'Gate 2', 'Gate 3'],
        validation_steps: ['echo "1"', 'echo "2"', 'echo "3"'],
      };

      const result = await validator.validate(checkpoint);

      // Should track all quality gates
      expect(result.quality_gate_results.length).toBe(3);
      expect(result.checkpoint_name).toBe('Multi-Gate Tracking');
    });

    it('should validate full-stack checkpoint', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Full-Stack Quality Gates',
        location: 'After Wave 3',
        blocking: true,
        quality_gates: [
          'All tests passing',
          'Coverage >= 80%',
          'Security scan clean',
          'Performance benchmarks met',
        ],
        validation_steps: [
          'echo "Tests: PASSED"',
          'echo "Coverage: 85%"',
          'echo "Security: No vulnerabilities"',
          'echo "Performance: OK"',
        ],
        handoff_agents: [
          {
            from: 'Dana-Database',
            to: 'Marcus-Backend',
            context: 'Database ready',
          },
          {
            from: 'Marcus-Backend',
            to: 'James-Frontend',
            context: 'API ready',
          },
          {
            from: 'James-Frontend',
            to: 'Maria-QA',
            context: 'UI ready for testing',
          },
        ],
      };

      const result = await validator.validate(checkpoint);

      expect(result.quality_gate_results.length).toBe(4);
      expect(result.handoff_results.length).toBe(3);
      expect(result.checkpoint_name).toBe('Full-Stack Quality Gates');
    });
  });

  describe('Validation Step Matching', () => {
    it('should match validation steps to quality gates', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Step Matching',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['All tests passing', 'Coverage >= 80%'],
        validation_steps: ['echo "test"', 'echo "coverage"'],
      };

      const result = await validator.validate(checkpoint);

      expect(result.quality_gate_results.length).toBe(2);
      // Both gates should find matching validation steps
      expect(result.quality_gate_results.every(qg => qg.execution_time !== undefined)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation step failures gracefully', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Error Handling',
        location: 'After Wave 1',
        blocking: true,
        quality_gates: ['Failing gate'],
        validation_steps: ['exit 1'],
      };

      const result = await validator.validate(checkpoint);

      expect(result.passed).toBe(false);
      expect(result.quality_gate_results[0].passed).toBe(false);
      expect(result.quality_gate_results[0].error).toBeDefined();
    });

    it('should handle missing validation steps', async () => {
      const checkpoint: Checkpoint = {
        checkpoint_name: 'Missing Steps',
        location: 'After Wave 1',
        blocking: false,
        quality_gates: ['Some gate'],
        validation_steps: [],
      };

      const result = await validator.validate(checkpoint);

      // Should pass when no validation step found
      expect(result.passed).toBe(true);
      expect(result.quality_gate_results[0].message).toContain('No validation step');
    });
  });
});
