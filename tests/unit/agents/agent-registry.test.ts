/**
 * VERSATIL SDLC Framework - Agent Registry Unit Tests
 * Enhanced Maria-QA Quality Assurance Testing
 *
 * Framework is testing itself using its own methodology!
 */

import { AgentRegistry } from '../../../src/agents/agent-registry';
import { BaseAgent } from '../../../src/agents/base-agent';
import { VERSATILLogger } from '../../../src/utils/logger';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let mockLogger: jest.Mocked<VERSATILLogger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    registry = new AgentRegistry(mockLogger);
  });

  describe('registerAgent', () => {
    it('should register a new agent successfully', () => {
      const mockAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for unit testing',
        activationPatterns: ['*.test.ts'],
        activate: jest.fn()
      } as BaseAgent;

      registry.registerAgent(mockAgent);

      const agents = registry.getRegisteredAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe('test-agent');
    });

    it('should prevent duplicate agent registration', () => {
      const mockAgent1 = {
        id: 'duplicate-agent',
        name: 'First Agent',
        activate: jest.fn()
      } as BaseAgent;

      const mockAgent2 = {
        id: 'duplicate-agent',
        name: 'Second Agent',
        activate: jest.fn()
      } as BaseAgent;

      registry.registerAgent(mockAgent1);

      expect(() => {
        registry.registerAgent(mockAgent2);
      }).toThrow('Agent with ID duplicate-agent is already registered');
    });
  });

  describe('getAgentForFile', () => {
    it('should return appropriate agent for file pattern', () => {
      const mockAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        activationPatterns: ['*.test.ts', '**/__tests__/**'],
        activate: jest.fn()
      } as BaseAgent;

      registry.registerAgent(mockAgent);

      const agent = registry.getAgentForFile('example.test.ts');
      expect(agent).toBeDefined();
      expect(agent?.id).toBe('test-agent');
    });

    it('should return null for unmatched file patterns', () => {
      const mockAgent = {
        id: 'specific-agent',
        name: 'Specific Agent',
        activationPatterns: ['*.specific.ts'],
        activate: jest.fn()
      } as BaseAgent;

      registry.registerAgent(mockAgent);

      const agent = registry.getAgentForFile('regular.ts');
      expect(agent).toBeNull();
    });
  });

  describe('Framework Self-Testing', () => {
    it('should validate that framework is testing itself', () => {
      // This test validates the self-referential nature
      expect(registry).toBeInstanceOf(AgentRegistry);
      expect(mockLogger.debug).toBeDefined();

      // Framework using its own quality standards
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should meet BMAD methodology quality standards', () => {
      // Enhanced Maria-QA standards applied to framework itself
      const startTime = Date.now();

      const mockAgent = {
        id: 'performance-test-agent',
        activate: jest.fn().mockResolvedValue({ success: true })
      } as BaseAgent;

      registry.registerAgent(mockAgent);

      const executionTime = Date.now() - startTime;

      // BMAD performance requirement: registration should be fast
      expect(executionTime).toBeLessThan(100);

      // Verify agent was registered correctly
      const agents = registry.getRegisteredAgents();
      expect(agents).toHaveLength(1);
    });
  });
});