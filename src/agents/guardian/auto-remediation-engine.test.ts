/**
 * VERSATIL SDLC Framework - Auto-Remediation Engine Tests
 * Wave 1 Day 3: Guardian System Testing
 *
 * Test Coverage:
 * - Singleton pattern
 * - Scenario registration
 * - Issue matching (FRAMEWORK/PROJECT/SHARED contexts)
 * - Auto-fixable vs manual scenarios
 * - Confidence thresholds
 * - Remediation execution
 * - Result structure
 * - Error handling
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoRemediationEngine } from './auto-remediation-engine.js';
import type { RemediationIssue, RemediationResult } from './auto-remediation-engine.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AutoRemediationEngine', () => {
  let engine: AutoRemediationEngine;
  let testDir: string;

  beforeEach(() => {
    engine = AutoRemediationEngine.getInstance();
    testDir = path.join(os.tmpdir(), 'versatil-test-remediation');

    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AutoRemediationEngine.getInstance();
      const instance2 = AutoRemediationEngine.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should have scenarios registered on initialization', () => {
      const scenarios = engine.getScenarios();
      expect(scenarios.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario Registration', () => {
    it('should register FRAMEWORK_CONTEXT scenarios', () => {
      const scenarios = engine.getScenariosByContext('FRAMEWORK_CONTEXT');

      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios.some(s => s.id === 'framework-build-failure')).toBe(true);
      expect(scenarios.some(s => s.id === 'framework-typescript-errors')).toBe(true);
      expect(scenarios.some(s => s.id === 'framework-missing-dependencies')).toBe(true);
      expect(scenarios.some(s => s.id === 'framework-security-vulnerabilities')).toBe(true);
      expect(scenarios.some(s => s.id === 'framework-missing-hooks')).toBe(true);
    });

    it('should register PROJECT_CONTEXT scenarios', () => {
      const scenarios = engine.getScenariosByContext('PROJECT_CONTEXT');

      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios.some(s => s.id === 'project-missing-config')).toBe(true);
      expect(scenarios.some(s => s.id === 'project-outdated-framework')).toBe(true);
      expect(scenarios.some(s => s.id === 'project-agent-not-activating')).toBe(true);
      expect(scenarios.some(s => s.id === 'project-no-agents-configured')).toBe(true);
      expect(scenarios.some(s => s.id === 'project-rag-not-initialized')).toBe(true);
    });

    it('should register SHARED scenarios', () => {
      const scenarios = engine.getScenariosByContext('SHARED');

      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios.some(s => s.id === 'shared-vector-store-connection-lost')).toBe(true);
      expect(scenarios.some(s => s.id === 'shared-agent-timeout')).toBe(true);
    });

    it('should include SHARED scenarios for all contexts', () => {
      const frameworkScenarios = engine.getScenariosByContext('FRAMEWORK_CONTEXT');
      const projectScenarios = engine.getScenariosByContext('PROJECT_CONTEXT');

      const sharedInFramework = frameworkScenarios.filter(s => s.context === 'SHARED');
      const sharedInProject = projectScenarios.filter(s => s.context === 'SHARED');

      expect(sharedInFramework.length).toBeGreaterThan(0);
      expect(sharedInProject.length).toBeGreaterThan(0);
    });
  });

  describe('Issue Matching', () => {
    it('should match framework build failure', () => {
      const issue: RemediationIssue = {
        id: 'test-1',
        component: 'build',
        severity: 'critical',
        description: 'Build failed with TypeScript errors',
        context: 'FRAMEWORK_CONTEXT'
      };

      const scenarios = engine.getScenarios();
      const match = scenarios.find(s => s.matcher(issue));

      expect(match).toBeDefined();
      expect(match?.id).toBe('framework-build-failure');
    });

    it('should match missing dependencies', () => {
      const issue: RemediationIssue = {
        id: 'test-2',
        component: 'dependencies',
        severity: 'high',
        description: 'Cannot find module @anthropic-ai/sdk',
        context: 'FRAMEWORK_CONTEXT'
      };

      const scenarios = engine.getScenarios();
      const match = scenarios.find(s => s.matcher(issue));

      expect(match).toBeDefined();
      expect(match?.id).toBe('framework-missing-dependencies');
    });

    it('should match security vulnerabilities', () => {
      const issue: RemediationIssue = {
        id: 'test-3',
        component: 'dependencies',
        severity: 'critical',
        description: '5 critical vulnerabilities found',
        context: 'FRAMEWORK_CONTEXT'
      };

      const scenarios = engine.getScenarios();
      const match = scenarios.find(s => s.matcher(issue));

      expect(match).toBeDefined();
      expect(match?.id).toBe('framework-security-vulnerabilities');
    });

    it('should match missing project config', () => {
      const issue: RemediationIssue = {
        id: 'test-4',
        component: 'framework_config',
        severity: 'medium',
        description: 'Missing .versatil-project.json',
        context: 'PROJECT_CONTEXT'
      };

      const scenarios = engine.getScenarios();
      const match = scenarios.find(s => s.matcher(issue));

      expect(match).toBeDefined();
      expect(match?.id).toBe('project-missing-config');
    });

    it('should match vector store connection loss', () => {
      const issue: RemediationIssue = {
        id: 'test-5',
        component: 'rag_system',
        severity: 'medium',
        description: 'Vector store connection lost',
        context: 'SHARED'
      };

      const scenarios = engine.getScenarios();
      const match = scenarios.find(s => s.matcher(issue));

      expect(match).toBeDefined();
      expect(match?.id).toBe('shared-vector-store-connection-lost');
    });

    it('should not match unknown issues', () => {
      const issue: RemediationIssue = {
        id: 'test-6',
        component: 'unknown',
        severity: 'low',
        description: 'Some unknown issue',
        context: 'FRAMEWORK_CONTEXT'
      };

      const scenarios = engine.getScenarios();
      const match = scenarios.find(s => s.matcher(issue));

      expect(match).toBeUndefined();
    });
  });

  describe('Auto-Fixable Scenarios', () => {
    it('should identify auto-fixable scenarios', () => {
      const scenarios = engine.getScenarios();
      const autoFixable = scenarios.filter(s => s.auto_fixable);

      expect(autoFixable.length).toBeGreaterThan(0);
      expect(autoFixable.some(s => s.id === 'framework-build-failure')).toBe(true);
      expect(autoFixable.some(s => s.id === 'framework-missing-dependencies')).toBe(true);
      expect(autoFixable.some(s => s.id === 'project-missing-config')).toBe(true);
    });

    it('should identify manual scenarios', () => {
      const scenarios = engine.getScenarios();
      const manual = scenarios.filter(s => !s.auto_fixable);

      expect(manual.length).toBeGreaterThan(0);
      expect(manual.some(s => s.id === 'framework-typescript-errors')).toBe(true);
      expect(manual.some(s => s.id === 'project-agent-not-activating')).toBe(true);
      expect(manual.some(s => s.id === 'shared-agent-timeout')).toBe(true);
    });
  });

  describe('Confidence Thresholds', () => {
    it('should have high confidence (90+) for deterministic fixes', () => {
      const scenarios = engine.getScenarios();

      const highConfidence = scenarios.filter(s => s.confidence >= 90);
      expect(highConfidence.length).toBeGreaterThan(0);

      // Build failures, missing dependencies, missing configs should have 90+ confidence
      expect(highConfidence.some(s => s.id === 'framework-build-failure')).toBe(true);
      expect(highConfidence.some(s => s.id === 'framework-missing-dependencies')).toBe(true);
      expect(highConfidence.some(s => s.id === 'project-missing-config')).toBe(true);
    });

    it('should have medium confidence (70-89) for contextual fixes', () => {
      const scenarios = engine.getScenarios();

      const mediumConfidence = scenarios.filter(s => s.confidence >= 70 && s.confidence < 90);
      expect(mediumConfidence.length).toBeGreaterThan(0);

      // TypeScript errors, agent activation issues should have medium confidence
      expect(mediumConfidence.some(s => s.id === 'framework-typescript-errors')).toBe(true);
      expect(mediumConfidence.some(s => s.id === 'shared-agent-timeout')).toBe(true);
    });

    it('all scenarios should have confidence >= 70', () => {
      const scenarios = engine.getScenarios();

      scenarios.forEach(scenario => {
        expect(scenario.confidence).toBeGreaterThanOrEqual(70);
      });
    });
  });

  describe('Remediation Execution', () => {
    it('should return "no matching scenario" for unknown issues', async () => {
      const issue: RemediationIssue = {
        id: 'unknown-1',
        component: 'unknown',
        severity: 'low',
        description: 'Unknown issue',
        context: 'FRAMEWORK_CONTEXT'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.action_taken).toContain('No matching remediation scenario');
      expect(result.next_steps).toContain('Manual investigation required');
    });

    it('should skip non-auto-fixable scenarios', async () => {
      const issue: RemediationIssue = {
        id: 'typescript-1',
        component: 'typescript',
        severity: 'high',
        description: 'TypeScript error in src/agents/guardian/test.ts',
        context: 'FRAMEWORK_CONTEXT'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(false);
      expect(result.action_taken).toContain('manual fix required');
      expect(result.learned).toContain('manual intervention');
    });

    it('should create missing project config', async () => {
      const issue: RemediationIssue = {
        id: 'config-1',
        component: 'framework_config',
        severity: 'medium',
        description: 'Missing .versatil-project.json',
        context: 'PROJECT_CONTEXT'
      };

      // Create package.json
      const packageJson = { name: 'test-project', version: '1.0.0' };
      fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(true);
      expect(result.confidence).toBe(95);
      expect(result.action_taken).toContain('Created .versatil-project.json');
      expect(result.learned).toContain('Maria-QA, James-Frontend, Marcus-Backend');

      // Verify file was created
      const configPath = path.join(testDir, '.versatil-project.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.projectName).toBe('test-project');
      expect(config.agents).toContain('maria-qa');
    });

    it('should initialize RAG storage', async () => {
      const issue: RemediationIssue = {
        id: 'rag-1',
        component: 'rag_usage',
        severity: 'medium',
        description: 'RAG not initialized',
        context: 'PROJECT_CONTEXT'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(true);
      expect(result.confidence).toBe(90);
      expect(result.action_taken).toContain('Initialized RAG storage');
      expect(result.learned).toContain('ready to store patterns');
      expect(result.next_steps?.[0]).toContain('/learn'); // Check first step contains /learn
    });

    it('should handle Supabase connection loss', async () => {
      const issue: RemediationIssue = {
        id: 'supabase-1',
        component: 'rag_system',
        severity: 'medium',
        description: 'Supabase connection lost',
        context: 'FRAMEWORK_CONTEXT'
      };

      const startTime = Date.now();
      const result = await engine.remediate(issue, testDir);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.confidence).toBe(85);
      expect(result.action_taken).toContain('auto-reconnect');
      expect(result.learned).toContain('automatically via retry logic');
      expect(duration).toBeGreaterThan(2000); // Should wait 2 seconds
    });

    it('should handle vector store connection loss', async () => {
      const issue: RemediationIssue = {
        id: 'vector-1',
        component: 'rag_system',
        severity: 'medium',
        description: 'Vector store connection lost',
        context: 'SHARED'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(true);
      expect(result.confidence).toBe(85);
      expect(result.action_taken).toContain('auto-reconnect');
      expect(result.learned).toContain('retry logic');
    });

    it('should identify agent activation issues', async () => {
      const issue: RemediationIssue = {
        id: 'agent-1',
        component: 'agent_activation',
        severity: 'medium',
        description: 'Maria-QA not activating',
        context: 'PROJECT_CONTEXT'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(false); // Not auto-fixable
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.next_steps?.length).toBeGreaterThan(0);
    });
  });

  describe('Result Structure', () => {
    it('should return complete result structure', async () => {
      const issue: RemediationIssue = {
        id: 'test-result',
        component: 'rag_system',
        severity: 'medium',
        description: 'Vector store connection lost',
        context: 'SHARED'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('issue_id');
      expect(result).toHaveProperty('action_taken');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('duration_ms');
      expect(result).toHaveProperty('before_state');
      expect(result).toHaveProperty('after_state');
      expect(result).toHaveProperty('learned');

      expect(result.issue_id).toBe('test-result');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.duration_ms).toBe('number');
    });

    it('should include next_steps for failed remediations', async () => {
      const issue: RemediationIssue = {
        id: 'unknown-2',
        component: 'unknown',
        severity: 'low',
        description: 'Unknown issue',
        context: 'FRAMEWORK_CONTEXT'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(false);
      expect(result.next_steps).toBeDefined();
      expect(result.next_steps!.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing package.json gracefully', async () => {
      const emptyDir = path.join(os.tmpdir(), 'versatil-empty-dir');
      if (!fs.existsSync(emptyDir)) {
        fs.mkdirSync(emptyDir, { recursive: true });
      }

      const issue: RemediationIssue = {
        id: 'config-2',
        component: 'framework_config',
        severity: 'medium',
        description: 'Missing .versatil-project.json',
        context: 'PROJECT_CONTEXT'
      };

      const result = await engine.remediate(issue, emptyDir);

      expect(result.success).toBe(true); // Should still create config with defaults
      expect(result.confidence).toBe(95);

      const config = JSON.parse(fs.readFileSync(path.join(emptyDir, '.versatil-project.json'), 'utf-8'));
      expect(config.projectName).toBe('my-project'); // Default name
    });

    it('should handle missing .claude/agents/ directory', async () => {
      const issue: RemediationIssue = {
        id: 'agent-2',
        component: 'agent_activation',
        severity: 'medium',
        description: 'Agent not activating',
        context: 'PROJECT_CONTEXT'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.success).toBe(false);
      expect(result.action_taken).toContain('manual fix required'); // Not auto-fixable
      expect(result.learned).toContain('manual intervention');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete remediation within 100ms (excluding exec)', async () => {
      const issue: RemediationIssue = {
        id: 'perf-1',
        component: 'rag_system',
        severity: 'medium',
        description: 'GraphRAG query failed',
        context: 'FRAMEWORK_CONTEXT'
      };

      const startTime = Date.now();
      const result = await engine.remediate(issue, testDir);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should be very fast (no exec)
    });

    it('should track remediation duration', async () => {
      const issue: RemediationIssue = {
        id: 'perf-2',
        component: 'rag_system',
        severity: 'medium',
        description: 'Vector store connection lost',
        context: 'SHARED'
      };

      const result = await engine.remediate(issue, testDir);

      expect(result.duration_ms).toBeGreaterThan(0);
      expect(result.duration_ms).toBeGreaterThan(2000); // Includes 2s wait
    });
  });
});
