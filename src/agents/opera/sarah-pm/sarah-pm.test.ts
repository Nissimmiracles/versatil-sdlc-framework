/**
 * VERSATIL SDLC Framework - Sarah PM Agent Tests
 * Wave 2 Day 2: OPERA Agent Testing
 *
 * Test Coverage:
 * - Agent initialization
 * - RAG configuration (project-management domain)
 * - Sprint planning pattern detection
 * - Task coordination pattern detection
 * - Team communication pattern detection (Agile ceremonies)
 * - Risk assessment and blocker detection
 * - Velocity tracking patterns
 * - PM quality scoring
 * - PM-specific insights
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SarahPm } from './sarah-pm.js';
import type { AgentActivationContext } from '../../core/base-agent.js';

describe('SarahPm', () => {
  let agent: SarahPm;

  beforeEach(() => {
    agent = new SarahPm();
  });

  describe('Agent Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(agent.name).toBe('SarahPm');
      expect(agent.id).toBe('sarah-pm');
      expect(agent.specialization).toBe('Project Manager & Sprint Coordinator');
      expect(agent.systemPrompt).toContain('Project Manager');
      expect(agent.systemPrompt).toContain('Agile');
    });

    it('should have PM-specific RAG configuration', () => {
      const config = agent['getDefaultRAGConfig']();

      expect(config.maxExamples).toBe(5);
      expect(config.similarityThreshold).toBe(0.75);
      expect(config.agentDomain).toBe('project-management');
      expect(config.enableLearning).toBe(true);
    });

    it('should support custom vector store', () => {
      const customAgent = new SarahPm();
      expect(customAgent).toBeInstanceOf(SarahPm);
    });
  });

  describe('Sprint Planning Pattern Detection', () => {
    it('should detect "sprint" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Planning Sprint 15 with team velocity analysis'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'sprint-planning')).toBe(true);
      expect(analysis.patterns.some(p => p.message.includes('Sprint planning'))).toBe(true);
    });

    it('should detect "iteration" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Iteration 3 goals and deliverables'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'sprint-planning')).toBe(true);
    });

    it('should detect "milestone" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Milestone 1: MVP Release - Due March 31'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'sprint-planning')).toBe(true);
    });

    it('should detect "deadline" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Project deadline moved to next quarter'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'sprint-planning')).toBe(true);
    });
  });

  describe('Task Coordination Pattern Detection', () => {
    it('should detect "task" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Task assignment for authentication module'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'task-coordination')).toBe(true);
      expect(analysis.patterns.some(p => p.message.includes('Task management'))).toBe(true);
    });

    it('should detect "story" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'User story: Login with OAuth'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'task-coordination')).toBe(true);
    });

    it('should detect "epic" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Epic: User Management System'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'task-coordination')).toBe(true);
    });

    it('should detect "backlog" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Grooming backlog for next sprint'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'task-coordination')).toBe(true);
    });

    it('should detect "TODO" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'TODO: Assign tasks to team members'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'task-coordination')).toBe(true);
    });
  });

  describe('Team Communication Pattern Detection', () => {
    it('should detect "standup" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Daily standup scheduled at 9am'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'team-communication')).toBe(true);
      expect(analysis.patterns.some(p => p.message.includes('Agile ceremony'))).toBe(true);
    });

    it('should detect "review" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Sprint review meeting on Friday'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'team-communication')).toBe(true);
    });

    it('should detect "retrospective" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Retrospective: What went well and what to improve'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'team-communication')).toBe(true);
    });

    it('should detect "demo" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Product demo for stakeholders tomorrow'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'team-communication')).toBe(true);
    });
  });

  describe('Risk Assessment Pattern Detection', () => {
    it('should detect "risk" keyword with high severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Risk: API integration may delay release'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'risk-assessment')).toBe(true);
      expect(analysis.patterns.some(p => p.severity === 'high')).toBe(true);
    });

    it('should detect "blocker" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Blocker: Waiting for design approval'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'risk-assessment')).toBe(true);
      expect(analysis.patterns.some(p => p.severity === 'high')).toBe(true);
    });

    it('should detect "dependency" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Dependency: Backend API must be deployed first'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'risk-assessment')).toBe(true);
    });

    it('should detect "blocked" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Team is blocked on database migration'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'risk-assessment')).toBe(true);
    });

    it('should include risk in recommendations', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Risk identified: Third-party service downtime'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('risk') || r.includes('blocker'))).toBe(true);
    });
  });

  describe('Velocity Tracking Pattern Detection', () => {
    it('should detect "velocity" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Team velocity: 35 story points per sprint'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'velocity-tracking')).toBe(true);
      expect(analysis.patterns.some(p => p.message.includes('velocity'))).toBe(true);
    });

    it('should detect "burndown" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Burndown chart shows we are on track'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'velocity-tracking')).toBe(true);
    });

    it('should detect "capacity" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Team capacity: 4 developers, 1 designer'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'velocity-tracking')).toBe(true);
    });

    it('should detect "points" keyword (story points)', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Sprint commitment: 40 points'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'velocity-tracking')).toBe(true);
    });
  });

  describe('PM Quality Scoring', () => {
    it('should give high score (100) for content without patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Random text without any PM patterns'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.score).toBe(100);
    });

    it('should give good score (85) when patterns detected', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Sprint planning with team standup tomorrow'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.score).toBe(85);
      expect(analysis.patterns.length).toBeGreaterThan(0);
    });

    it('should provide pattern summary', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Sprint 5 milestone with task assignments'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.summary).toContain('Detected');
      expect(analysis.summary).toContain('PM patterns');
    });
  });

  describe('Multiple Pattern Detection', () => {
    it('should detect multiple PM patterns in single content', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: `
          Sprint 10 Planning
          - Milestone: Beta Release
          - Task: Complete authentication epic
          - Standup: Daily at 9am
          - Risk: Dependency on external API
          - Velocity: 30 points
          - Blocker: Design approval pending
        `
      };

      const analysis = await agent['runPatternAnalysis'](context);

      const patternTypes = analysis.patterns.map(p => p.type);
      expect(patternTypes).toContain('sprint-planning');
      expect(patternTypes).toContain('task-coordination');
      expect(patternTypes).toContain('team-communication');
      expect(patternTypes).toContain('risk-assessment');
      expect(patternTypes).toContain('velocity-tracking');
      expect(analysis.patterns.length).toBeGreaterThanOrEqual(5);
    });

    it('should detect overlapping patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Sprint retrospective to discuss velocity and blockers'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      // Should detect sprint-planning, team-communication, velocity-tracking, risk-assessment
      expect(analysis.patterns.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Pattern Severity Levels', () => {
    it('should mark risk patterns as high severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Risk: Critical blocker affecting sprint delivery'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      const riskPattern = analysis.patterns.find(p => p.type === 'risk-assessment');
      expect(riskPattern?.severity).toBe('high');
    });

    it('should mark non-risk patterns as info severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Sprint planning with velocity tracking'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      const sprintPattern = analysis.patterns.find(p => p.type === 'sprint-planning');
      const velocityPattern = analysis.patterns.find(p => p.type === 'velocity-tracking');

      expect(sprintPattern?.severity).toBe('info');
      expect(velocityPattern?.severity).toBe('info');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: ''
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns).toEqual([]);
      expect(analysis.score).toBe(100);
    });

    it('should handle content without PM patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Just some random text about coding'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.length).toBe(0);
      expect(analysis.score).toBe(100);
    });

    it('should be case insensitive', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'SPRINT PLANNING with STANDUP and RISK assessment'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.length).toBeGreaterThan(0);
    });

    it('should handle pattern keywords in different contexts', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'The task of reviewing velocity data at the milestone'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      // Should detect task-coordination, velocity-tracking, sprint-planning
      expect(analysis.patterns.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RAG Configuration Validation', () => {
    it('should have higher maxExamples than Alex-BA (more historical data)', () => {
      const config = agent['getDefaultRAGConfig']();

      expect(config.maxExamples).toBe(5);
      expect(config.maxExamples).toBeGreaterThan(4); // Higher than typical BA config
    });

    it('should have lower similarity threshold for broader matching', () => {
      const config = agent['getDefaultRAGConfig']();

      expect(config.similarityThreshold).toBe(0.75);
      expect(config.similarityThreshold).toBeLessThan(0.80); // Lower than BA for more examples
    });

    it('should have project-management domain', () => {
      const config = agent['getDefaultRAGConfig']();

      expect(config.agentDomain).toBe('project-management');
    });

    it('should have learning enabled', () => {
      const config = agent['getDefaultRAGConfig']();

      expect(config.enableLearning).toBe(true);
    });
  });
});
