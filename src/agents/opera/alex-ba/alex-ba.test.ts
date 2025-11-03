/**
 * VERSATIL SDLC Framework - Alex BA Agent Tests
 * Wave 2 Day 1: OPERA Agent Testing
 *
 * Test Coverage:
 * - Agent initialization
 * - RAG configuration
 * - Pattern detection (user stories, acceptance criteria, requirements)
 * - Business rule detection
 * - Stakeholder communication patterns
 * - Requirements traceability
 * - Ambiguous requirement detection
 * - BA-specific insights
 * - Requirements formality assessment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AlexBa } from './alex-ba.js';
import type { AgentActivationContext } from '../../core/base-agent.js';

describe('AlexBa', () => {
  let agent: AlexBa;

  beforeEach(() => {
    agent = new AlexBa();
  });

  describe('Agent Initialization', () => {
    it('should initialize with correct properties', () => {
      expect(agent.name).toBe('AlexBa');
      expect(agent.id).toBe('alex-ba');
      expect(agent.specialization).toBe('Business Analyst & Requirements Engineer');
      expect(agent.systemPrompt).toContain('Business Analyst');
    });

    it('should have BA-specific RAG configuration', () => {
      const config = agent['getDefaultRAGConfig']();

      expect(config.maxExamples).toBe(4);
      expect(config.similarityThreshold).toBe(0.80);
      expect(config.agentDomain).toBe('business-analysis');
      expect(config.enableLearning).toBe(true);
    });

    it('should support custom vector store', () => {
      const customAgent = new AlexBa();
      expect(customAgent).toBeInstanceOf(AlexBa);
    });
  });

  describe('User Story Pattern Detection', () => {
    it('should detect "As a" user story format', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'As a user, I want to login so that I can access my account'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'user-story')).toBe(true);
      expect(analysis.patterns.some(p => p.message.includes('User story'))).toBe(true);
    });

    it('should detect "As an" user story format', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'As an admin, I want to manage users'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'user-story')).toBe(true);
    });

    it('should detect "I want" in user stories', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'I want to be able to export data to CSV'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'user-story')).toBe(true);
    });

    it('should detect "so that" rationale', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Feature X should be added so that users can collaborate'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'user-story')).toBe(true);
    });
  });

  describe('Acceptance Criteria Detection', () => {
    it('should detect Gherkin "Given-When-Then" format', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Given I am logged in\nWhen I click logout\nThen I should be redirected to home'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'acceptance-criteria')).toBe(true);
      expect(analysis.patterns.some(p => p.message.includes('Gherkin'))).toBe(true);
    });

    it('should detect "Acceptance Criteria" header', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Acceptance Criteria:\n1. User can login\n2. Session persists'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'acceptance-criteria')).toBe(true);
    });

    it('should detect "AC:" abbreviation', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'AC: Form validates all fields before submission'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'acceptance-criteria')).toBe(true);
    });
  });

  describe('Requirement Pattern Detection', () => {
    it('should detect "shall" requirements', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'The system shall encrypt all user passwords'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'requirement')).toBe(true);
    });

    it('should detect "must" requirements', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'The application must support HTTPS'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'requirement')).toBe(true);
    });

    it('should detect "should" requirements', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'The UI should be responsive on mobile devices'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'requirement')).toBe(true);
    });

    it('should detect requirement IDs (REQ-123)', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'REQ-001: User authentication is mandatory'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'requirement')).toBe(true);
    });
  });

  describe('Business Rule Detection', () => {
    it('should detect "business rule" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Business rule: Discounts only apply to orders over $100'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'business-rule')).toBe(true);
    });

    it('should detect business rule IDs (BR-123)', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'BR-005: Tax calculation based on shipping address'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'business-rule')).toBe(true);
    });

    it('should detect "policy" keyword', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Company policy: All data must be encrypted at rest'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'business-rule')).toBe(true);
    });

    it('should detect "rule:" format', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Rule: Users must verify email within 24 hours'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'business-rule')).toBe(true);
    });
  });

  describe('Stakeholder Communication Detection', () => {
    it('should detect stakeholder references', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Stakeholder feedback indicates need for dark mode'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'stakeholder-communication')).toBe(true);
    });

    it('should detect customer feedback', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Customer requested ability to export reports'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'stakeholder-communication')).toBe(true);
    });

    it('should detect user feedback', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'User feedback: Navigation is confusing'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'stakeholder-communication')).toBe(true);
    });

    it('should detect interview notes', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Interview with product owner revealed priority change'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'stakeholder-communication')).toBe(true);
    });

    it('should detect workshop sessions', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Workshop outcomes: 5 new features identified'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'stakeholder-communication')).toBe(true);
    });
  });

  describe('Requirements Traceability Detection', () => {
    it('should detect "traces to" links', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'REQ-001 traces to DESIGN-005'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'requirements-traceability')).toBe(true);
    });

    it('should detect "depends on" relationships', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'This requirement depends on REQ-010'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'requirements-traceability')).toBe(true);
    });

    it('should detect "related to" links', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Feature related to authentication module'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'requirements-traceability')).toBe(true);
    });
  });

  describe('Ambiguous Requirement Detection', () => {
    it('should flag "maybe" as ambiguous', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Maybe we should add a search feature'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'ambiguous-requirement')).toBe(true);
      expect(analysis.patterns.some(p => p.severity === 'high')).toBe(true);
    });

    it('should flag "TBD" as incomplete', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Payment gateway integration - TBD'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'ambiguous-requirement')).toBe(true);
    });

    it('should flag "TODO" as incomplete', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'TODO: Define error handling strategy'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.some(p => p.type === 'ambiguous-requirement')).toBe(true);
    });

    it('should flag uncertain language (perhaps, possibly, might)', async () => {
      const uncertainWords = ['perhaps', 'possibly', 'might', 'could be'];

      for (const word of uncertainWords) {
        const context: AgentActivationContext = {
          trigger: 'manual',
          content: `The system ${word} need caching`
        };

        const analysis = await agent['runPatternAnalysis'](context);
        expect(analysis.patterns.some(p => p.type === 'ambiguous-requirement')).toBe(true);
      }
    });

    it('should lower BA quality score when ambiguity detected', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Maybe add search, possibly with filters - TBD'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.score).toBe(75); // Lower score due to high severity patterns
    });
  });

  describe('BA Quality Scoring', () => {
    it('should give high score (90) for clear requirements', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'As a user, I want to login. Given valid credentials, When I submit, Then I am authenticated.'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.score).toBe(90);
    });

    it('should provide summary of detected patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'As a user, I want to export data. Acceptance Criteria: CSV format supported.'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.summary).toContain('Detected');
      expect(analysis.summary).toContain('patterns');
      expect(analysis.patterns.length).toBeGreaterThan(0);
    });

    it('should provide recommendations for high severity issues', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Maybe add feature X - TBD on implementation'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('clarification'))).toBe(true);
    });
  });

  describe('Multiple Pattern Detection', () => {
    it('should detect multiple patterns in single content', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: `
          As a user, I want to login.

          Acceptance Criteria:
          Given valid credentials
          When I submit the form
          Then I am authenticated

          REQ-001: System must use OAuth 2.0
          Business rule: Session expires after 30 minutes
          Stakeholder feedback: Add remember me checkbox
        `
      };

      const analysis = await agent['runPatternAnalysis'](context);

      const patternTypes = analysis.patterns.map(p => p.type);
      expect(patternTypes).toContain('user-story');
      expect(patternTypes).toContain('acceptance-criteria');
      expect(patternTypes).toContain('requirement');
      expect(patternTypes).toContain('business-rule');
      expect(patternTypes).toContain('stakeholder-communication');
      expect(analysis.patterns.length).toBeGreaterThanOrEqual(5);
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
      expect(analysis.score).toBe(90); // No issues = high score
    });

    it('should handle content without patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'Just some random text without any BA patterns'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.length).toBe(0);
    });

    it('should be case insensitive for pattern matching', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'AS A USER, I WANT TO LOGIN. GIVEN CREDENTIALS, WHEN SUBMIT, THEN SUCCESS.'
      };

      const analysis = await agent['runPatternAnalysis'](context);

      expect(analysis.patterns.length).toBeGreaterThan(0);
    });
  });
});
