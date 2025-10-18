/**
 * Tests for SDK Agent Definitions (v6.4.0)
 * Tests the agent definitions without importing SDK classes
 */

import { MARIA_QA_AGENT, JAMES_FRONTEND_AGENT, MARCUS_BACKEND_AGENT } from '../../src/agents/sdk/agent-definitions';

describe('SDK Agent Definitions', () => {
  describe('Maria-QA Agent', () => {
    it('should have valid agent definition', () => {
      expect(MARIA_QA_AGENT).toBeDefined();
      expect(MARIA_QA_AGENT.description).toBeDefined();
      expect(MARIA_QA_AGENT.prompt).toBeDefined();
    });

    it('should describe Quality Guardian role', () => {
      expect(MARIA_QA_AGENT.description).toContain('Quality Guardian');
      expect(MARIA_QA_AGENT.description).toContain('80%');
    });

    it('should have comprehensive prompt', () => {
      expect(MARIA_QA_AGENT.prompt).toContain('Maria-QA');
      expect(MARIA_QA_AGENT.prompt).toContain('Quality Guardian');
      expect(MARIA_QA_AGENT.prompt).toContain('test');
      expect(MARIA_QA_AGENT.prompt).toContain('coverage');
    });
  });

  describe('James-Frontend Agent', () => {
    it('should have valid agent definition', () => {
      expect(JAMES_FRONTEND_AGENT).toBeDefined();
      expect(JAMES_FRONTEND_AGENT.description).toBeDefined();
      expect(JAMES_FRONTEND_AGENT.prompt).toBeDefined();
    });

    it('should describe Frontend Expert role', () => {
      const desc = JAMES_FRONTEND_AGENT.description.toLowerCase();
      expect(desc).toMatch(/frontend|ui|ux|component/);
    });

    it('should have UI/UX focus in prompt', () => {
      expect(JAMES_FRONTEND_AGENT.prompt).toContain('James');
      const prompt = JAMES_FRONTEND_AGENT.prompt.toLowerCase();
      expect(prompt).toMatch(/ui|accessibility|component/);
    });
  });

  describe('Marcus-Backend Agent', () => {
    it('should have valid agent definition', () => {
      expect(MARCUS_BACKEND_AGENT).toBeDefined();
      expect(MARCUS_BACKEND_AGENT.description).toBeDefined();
      expect(MARCUS_BACKEND_AGENT.prompt).toBeDefined();
    });

    it('should describe Backend Architect role', () => {
      const desc = MARCUS_BACKEND_AGENT.description.toLowerCase();
      expect(desc).toMatch(/api|backend|server/);
    });

    it('should have API and security focus in prompt', () => {
      expect(MARCUS_BACKEND_AGENT.prompt).toContain('Marcus');
      const prompt = MARCUS_BACKEND_AGENT.prompt.toLowerCase();
      expect(prompt).toMatch(/api|security|owasp/);
    });
  });

  describe('All Agent Definitions', () => {
    const agents = [MARIA_QA_AGENT, JAMES_FRONTEND_AGENT, MARCUS_BACKEND_AGENT];

    it('should all have required fields', () => {
      agents.forEach(agent => {
        expect(agent.description).toBeDefined();
        expect(agent.prompt).toBeDefined();
        expect(typeof agent.description).toBe('string');
        expect(typeof agent.prompt).toBe('string');
      });
    });

    it('should all have non-empty prompts', () => {
      agents.forEach(agent => {
        expect(agent.prompt.length).toBeGreaterThan(100);
      });
    });
  });
});
