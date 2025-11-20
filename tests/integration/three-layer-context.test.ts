/**
 * Three-Layer Context System - Integration Tests
 * Tests the complete context priority system: User > Team > Project > Framework
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userContextManager, type UserCodingPreferences } from '../../src/user/user-context-manager.js';
import { teamContextManager, type TeamConventions } from '../../src/team/team-context-manager.js';
import { projectVisionManager } from '../../src/project/project-vision-manager.js';
import { contextPriorityResolver } from '../../src/context/context-priority-resolver.js';
import { codingStyleDetector } from '../../src/user/coding-style-detector.js';
import { userAgentMemoryStore } from '../../src/user/user-agent-memory-store.js';

describe('Three-Layer Context System', () => {
  const testUserId = 'test-user-001';
  const testTeamId = 'test-team-001';
  const testProjectId = 'test-project-001';

  beforeEach(async () => {
    // Clean up any existing test data
    try {
      await userContextManager.deleteUser(testUserId);
    } catch {}
    try {
      await teamContextManager.deleteTeam(testTeamId, testUserId);
    } catch {}
    try {
      await projectVisionManager.deleteProjectData(testProjectId);
    } catch {}
  });

  afterEach(async () => {
    // Cleanup
    try {
      await userContextManager.deleteUser(testUserId);
    } catch {}
    try {
      await teamContextManager.deleteTeam(testTeamId, testUserId);
    } catch {}
    try {
      await projectVisionManager.deleteProjectData(testProjectId);
    } catch {}
  });

  describe('Layer 1: User Context', () => {
    it('should create user with default preferences', async () => {
      const userContext = await userContextManager.createUser(testUserId, {
        name: 'Test User',
        email: 'test@example.com'
      });

      expect(userContext.profile.userId).toBe(testUserId);
      expect(userContext.profile.name).toBe('Test User');
      expect(userContext.codingPreferences.indentation).toBe('spaces');
      expect(userContext.codingPreferences.indentSize).toBe(2);
    });

    it('should update user preferences', async () => {
      await userContextManager.createUser(testUserId, {
        name: 'Test User'
      });

      await userContextManager.updatePreferences(testUserId, {
        indentation: 'tabs',
        indentSize: 1,
        quotes: 'double'
      });

      const updated = await userContextManager.getUserContext(testUserId);
      expect(updated?.codingPreferences.indentation).toBe('tabs');
      expect(updated?.codingPreferences.quotes).toBe('double');
    });

    it('should store and retrieve user agent memories', async () => {
      await userContextManager.createUser(testUserId, {
        name: 'Test User'
      });

      await userAgentMemoryStore.storeMemory(testUserId, 'marcus-backend', {
        key: 'api-pattern',
        value: { pattern: 'REST API with Express', confidence: 0.95 },
        tags: ['api', 'express']
      });

      const memory = await userAgentMemoryStore.getMemory(testUserId, 'marcus-backend', 'api-pattern');
      expect(memory).toBeTruthy();
      expect(memory?.value.pattern).toBe('REST API with Express');
    });
  });

  describe('Layer 2: Team Context', () => {
    it('should create team with default conventions', async () => {
      const teamContext = await teamContextManager.createTeam(
        testTeamId,
        'Test Team',
        testUserId,
        'A test team'
      );

      expect(teamContext.profile.teamId).toBe(testTeamId);
      expect(teamContext.profile.name).toBe('Test Team');
      expect(teamContext.conventions.codeStyle).toBe('airbnb');
      expect(teamContext.members.length).toBe(1);
      expect(teamContext.members[0].userId).toBe(testUserId);
      expect(teamContext.members[0].role).toBe('owner');
    });

    it('should update team conventions', async () => {
      await teamContextManager.createTeam(testTeamId, 'Test Team', testUserId);

      await teamContextManager.updateConventions(
        testTeamId,
        {
          codeStyle: 'google',
          testingPolicy: {
            required: true,
            minCoverage: 90,
            requiredTests: ['unit', 'integration'],
            blockOnFailure: true,
            autoRunOnPR: true
          }
        },
        testUserId
      );

      const updated = await teamContextManager.getTeamContext(testTeamId);
      expect(updated?.conventions.codeStyle).toBe('google');
      expect(updated?.conventions.testingPolicy.minCoverage).toBe(90);
    });

    it('should add and remove team members', async () => {
      await teamContextManager.createTeam(testTeamId, 'Test Team', testUserId);

      const newMemberId = 'test-user-002';
      await teamContextManager.addTeamMember(testTeamId, newMemberId, 'developer', testUserId);

      let team = await teamContextManager.getTeamContext(testTeamId);
      expect(team?.members.length).toBe(2);

      await teamContextManager.removeTeamMember(testTeamId, newMemberId, testUserId);

      team = await teamContextManager.getTeamContext(testTeamId);
      expect(team?.members.length).toBe(1);
    });
  });

  describe('Layer 3: Project Context', () => {
    it('should store and retrieve project vision', async () => {
      await projectVisionManager.storeVision(testProjectId, {
        mission: 'Build the best product',
        marketOpportunity: 'Huge market',
        targetMarket: 'Developers',
        goals: [
          {
            id: 'goal1',
            description: 'Launch MVP',
            timeframe: '3-months',
            metrics: [],
            status: 'in-progress',
            progress: 50
          }
        ]
      });

      const vision = await projectVisionManager.getVision(testProjectId);
      expect(vision?.mission).toBe('Build the best product');
      expect(vision?.goals.length).toBe(1);
    });

    it('should track project events', async () => {
      await projectVisionManager.trackEvent(testProjectId, {
        type: 'feature_added',
        description: 'User authentication',
        impact: 'Enables secure login',
        agent: 'marcus-backend'
      });

      const history = await projectVisionManager.getProjectHistory(testProjectId);
      expect(history.events.length).toBeGreaterThan(0);
      expect(history.events[0].type).toBe('feature_added');
    });
  });

  describe('Context Priority Resolution', () => {
    it('should resolve context with user > team > project priority', async () => {
      // Create user with preferences
      await userContextManager.createUser(testUserId, {
        name: 'Test User'
      }, {
        indentation: 'tabs',
        quotes: 'double'
      });

      // Create team with different conventions
      await teamContextManager.createTeam(testTeamId, 'Test Team', testUserId, undefined, {
        codeStyle: 'airbnb' // airbnb uses spaces + single quotes
      });

      // Resolve context
      const resolved = await contextPriorityResolver.resolveContext({
        userId: testUserId,
        teamId: testTeamId
      });

      // User preferences should win
      expect(resolved.codingPreferences.indentation).toBe('tabs'); // User override
      expect(resolved.codingPreferences.quotes).toBe('double'); // User override
      expect(resolved.resolution.userOverrides.length).toBeGreaterThan(0);
    });

    it('should apply team conventions when user has no overrides', async () => {
      // Create user with defaults
      await userContextManager.createUser(testUserId, {
        name: 'Test User'
      });

      // Create team with specific conventions
      await teamContextManager.createTeam(testTeamId, 'Test Team', testUserId, undefined, {
        codeStyle: 'standard' // standard uses spaces + single quotes + no semicolons
      });

      // Resolve context
      const resolved = await contextPriorityResolver.resolveContext({
        userId: testUserId,
        teamId: testTeamId
      });

      // Team conventions should apply (since user didn't override)
      expect(resolved.codingPreferences.semicolons).toBe('never'); // From standard style
      expect(resolved.resolution.teamOverrides.length).toBeGreaterThan(0);
    });

    it('should use framework defaults when no user/team context', async () => {
      const resolved = await contextPriorityResolver.resolveContext({});

      // Should be framework defaults
      expect(resolved.codingPreferences.indentation).toBe('spaces');
      expect(resolved.codingPreferences.indentSize).toBe(2);
      expect(resolved.resolution.userOverrides.length).toBe(0);
      expect(resolved.resolution.teamOverrides.length).toBe(0);
    });
  });

  describe('Coding Style Detector', () => {
    it('should analyze code and detect preferences', () => {
      const testCode = `
function helloWorld() {
  const message = 'Hello, World!';
  console.log(message);
}

class MyClass {
  constructor() {
    this.value = 42;
  }
}
`;

      const result = {
        confidence: 0,
        samples: 0,
        detectedPreferences: {},
        analysis: {
          indentation: { tabs: 0, spaces2: 0, spaces4: 0 },
          naming: { camel: 0, snake: 0, pascal: 0 },
          quotes: { single: 0, double: 0, backticks: 0 },
          semicolons: { present: 0, absent: 0 }
        }
      };

      codingStyleDetector.analyzeCode(testCode, result);

      expect(result.analysis.indentation.spaces2).toBeGreaterThan(0);
      expect(result.analysis.naming.camel).toBeGreaterThan(0);
      expect(result.analysis.quotes.single).toBeGreaterThan(0);
      expect(result.analysis.semicolons.present).toBeGreaterThan(0);
    });
  });

  describe('User Agent Memory Store', () => {
    it('should enforce privacy isolation', async () => {
      const user1 = 'user-001';
      const user2 = 'user-002';

      // User 1 stores private memory
      await userAgentMemoryStore.storeMemory(user1, 'marcus-backend', {
        key: 'secret-pattern',
        value: { pattern: 'Private API design' },
        tags: ['private']
      });

      // User 2 should NOT be able to access it
      const memory = await userAgentMemoryStore.getMemory(user2, 'marcus-backend', 'secret-pattern');
      expect(memory).toBeNull();

      // User 1 CAN access it
      const user1Memory = await userAgentMemoryStore.getMemory(user1, 'marcus-backend', 'secret-pattern');
      expect(user1Memory?.value.pattern).toBe('Private API design');

      // Cleanup
      await userAgentMemoryStore.deleteAllMemories(user1, 'marcus-backend');
    });

    it('should support memory expiration', async () => {
      await userAgentMemoryStore.storeMemory(testUserId, 'maria-qa', {
        key: 'temp-pattern',
        value: { pattern: 'Temporary test pattern' },
        ttl: 1 // 1 second TTL
      });

      // Should exist immediately
      let memory = await userAgentMemoryStore.getMemory(testUserId, 'maria-qa', 'temp-pattern');
      expect(memory).toBeTruthy();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired and deleted
      memory = await userAgentMemoryStore.getMemory(testUserId, 'maria-qa', 'temp-pattern');
      expect(memory).toBeNull();
    });
  });
});
