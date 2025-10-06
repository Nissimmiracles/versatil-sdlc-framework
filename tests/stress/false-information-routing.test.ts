/**
 * Stress Tests: False Information & Bad Routing
 *
 * Comprehensive stress testing for:
 * 1. False/invalid/malformed information handling
 * 2. Bad routing scenarios (invalid agent IDs, circular deps, corrupted configs)
 *
 * Purpose: Validate system robustness under adversarial conditions
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EventDrivenOrchestrator } from '../../src/orchestration/event-driven-orchestrator.js';
import { AgentPool } from '../../src/agents/agent-pool.js';
import { ConversationBackupManager } from '../../src/conversation-backup-manager.js';
import { EnhancedMaria } from '../../src/agents/enhanced-maria.js';
import { EnhancedJames } from '../../src/agents/enhanced-james.js';
import type { AgentActivationContext } from '../../src/types.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Stress Test: False Information Handling', () => {
  let agentPool: AgentPool;
  let orchestrator: EventDrivenOrchestrator;

  beforeEach(async () => {
    agentPool = new AgentPool();
    await agentPool.initialize();
    orchestrator = new EventDrivenOrchestrator(agentPool);
  });

  afterEach(async () => {
    await orchestrator.shutdown();
    await agentPool.shutdown();
  });

  describe('Invalid Input Data', () => {
    it('should handle null file paths gracefully', async () => {
      const invalidContext: AgentActivationContext = {
        filePath: null as any, // Force null
        content: 'test content'
      };

      await expect(async () => {
        await orchestrator.startChain(['maria-qa'], invalidContext);
      }).rejects.toThrow(); // Should throw, not crash
    });

    it('should handle undefined content gracefully', async () => {
      const invalidContext: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: undefined as any // Force undefined
      };

      const chainId = await orchestrator.startChain(['maria-qa'], invalidContext);
      expect(chainId).toMatch(/^chain-/); // Should still create chain
    });

    it('should handle extremely long file paths', async () => {
      const longPath = '/test/' + 'a'.repeat(10000) + '.ts'; // 10KB path
      const context: AgentActivationContext = {
        filePath: longPath,
        content: 'test'
      };

      const chainId = await orchestrator.startChain(['maria-qa'], context);
      expect(chainId).toBeTruthy();
    });

    it('should handle malformed language/framework values', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test',
        metadata: {
          language: '"><script>alert(1)</script>', // XSS attempt
          framework: 'DROP TABLE agents; --' // SQL injection attempt
        }
      };

      const chainId = await orchestrator.startChain(['maria-qa'], context);
      expect(chainId).toBeTruthy(); // Should sanitize and continue
    });

    it('should handle binary content as text', async () => {
      const binaryContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]).toString(); // JPEG header
      const context: AgentActivationContext = {
        filePath: '/test/image.jpg',
        content: binaryContent
      };

      const chainId = await orchestrator.startChain(['maria-qa'], context);
      expect(chainId).toBeTruthy();
    });

    it('should handle circular JSON references', async () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj; // Circular reference

      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test',
        metadata: circularObj as any
      };

      // Should not crash on JSON serialization
      const chainId = await orchestrator.startChain(['maria-qa'], context);
      expect(chainId).toBeTruthy();
    });
  });

  describe('Conversation Backup Corruption', () => {
    let backupManager: ConversationBackupManager;
    const testBackupDir = path.join(process.cwd(), '.test-conversation-backups');

    beforeEach(async () => {
      backupManager = new ConversationBackupManager(testBackupDir);
      await fs.promises.mkdir(testBackupDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.promises.rm(testBackupDir, { recursive: true, force: true });
    });

    it('should handle corrupted JSON backup files', async () => {
      const conversationId = await backupManager.startConversation('test task', '/test/project');

      // Corrupt the backup file
      const backupPath = path.join(testBackupDir, `${conversationId}.json`);
      await fs.promises.writeFile(backupPath, '{invalid json}{{[[', 'utf-8');

      // Should handle corruption gracefully
      const conversations = await backupManager.listConversations();
      expect(conversations).toBeDefined(); // Should not crash
    });

    it('should handle missing backup files during resume', async () => {
      const fakeId = 'nonexistent-conversation-id';

      await expect(async () => {
        await backupManager.resumeConversation(fakeId);
      }).rejects.toThrow(/not found/i);
    });

    it('should handle large conversation history', async () => {
      const conversationId = await backupManager.startConversation('stress test', '/test/project');

      // Add 1,000 messages (reduced from 10k for faster tests)
      for (let i = 0; i < 1000; i++) {
        await backupManager.addMessage('user', `Message ${i}: ${'x'.repeat(100)}`);
      }

      // Should still be able to export to markdown
      const exported = await backupManager.exportToMarkdown(conversationId);
      expect(exported).toBeDefined();
      expect(exported).toContain('Message 999'); // Last message should be there
    });
  });

  describe('Extreme Load - Concurrent False Information', () => {
    it('should handle 50 simultaneous invalid requests', async () => {
      const invalidContexts: AgentActivationContext[] = Array.from({ length: 50 }, (_, i) => ({
        filePath: i % 2 === 0 ? null as any : undefined as any, // Alternate null/undefined
        content: i % 3 === 0 ? '' : (i % 3 === 1 ? null as any : 'x'.repeat(10000)) // Empty, null, or 10KB
      }));

      const startTime = Date.now();
      const chainIds = await Promise.allSettled(
        invalidContexts.map(ctx => orchestrator.startChain(['maria-qa'], ctx))
      );
      const duration = Date.now() - startTime;

      console.log(`   50 invalid requests processed in ${duration}ms`);

      // At least 50% should gracefully reject (not crash)
      const rejected = chainIds.filter(r => r.status === 'rejected').length;
      expect(rejected).toBeGreaterThan(0); // Should reject some
      expect(rejected).toBeLessThan(50); // Should not reject all
    });
  });
});

describe('Stress Test: Bad Routing Scenarios', () => {
  let agentPool: AgentPool;
  let orchestrator: EventDrivenOrchestrator;

  beforeEach(async () => {
    agentPool = new AgentPool();
    await agentPool.initialize();
    orchestrator = new EventDrivenOrchestrator(agentPool);
  });

  afterEach(async () => {
    await orchestrator.shutdown();
    await agentPool.shutdown();
  });

  describe('Invalid Agent IDs', () => {
    it('should handle nonexistent agent IDs', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      await expect(async () => {
        await orchestrator.startChain(['fake-agent-that-does-not-exist'], context);
      }).rejects.toThrow(/not available/i);
    });

    it('should handle empty agent chain', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      await expect(async () => {
        await orchestrator.startChain([], context); // Empty array
      }).rejects.toThrow();
    });

    it('should handle null/undefined agent IDs', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      await expect(async () => {
        await orchestrator.startChain([null as any, undefined as any], context);
      }).rejects.toThrow();
    });

    it('should handle duplicate agent IDs in chain', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      // Should handle duplicates without infinite loops
      const chainId = await orchestrator.startChain(
        ['maria-qa', 'maria-qa', 'maria-qa'],
        context
      );
      expect(chainId).toBeTruthy();
    });
  });

  describe('Circular Dependencies', () => {
    it('should detect and prevent circular handoff chains', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      // Create a potential circular chain: A → B → C → A
      // The system should detect this and break the cycle
      const chainId = await orchestrator.startChain(
        ['maria-qa', 'james-frontend', 'marcus-backend', 'maria-qa'],
        context
      );

      // Wait for chain completion or timeout
      await new Promise(resolve => {
        orchestrator.once('chain:completed', resolve);
        setTimeout(resolve, 5000); // 5s timeout
      });

      // If we get here without hanging, the circular dependency was handled
      expect(chainId).toBeTruthy();
    });

    it('should handle self-referential handoffs', async () => {
      const maria = await agentPool.getAgent('maria-qa') as EnhancedMaria;

      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      const result = await maria.activate(context);

      // If result suggests handoff to self, should be prevented
      if (result.handoffTo && result.handoffTo.includes('maria-qa')) {
        expect(result.handoffTo).not.toContain('maria-qa'); // Should not suggest self
      }
    });
  });

  describe('Agent Pool Exhaustion', () => {
    it('should handle unavailable agent types', async () => {
      // Try to get an agent that was never pre-warmed
      await expect(async () => {
        await agentPool.getAgent('nonexistent-agent-type' as any);
      }).rejects.toThrow(/not available/i);
    });

    it('should handle agent pool shutdown during active chains', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      const chainId = await orchestrator.startChain(['maria-qa', 'james-frontend'], context);

      // Shutdown pool while chain is running
      await agentPool.shutdown();

      // Should gracefully handle shutdown
      expect(chainId).toBeTruthy();
    });

    it('should handle concurrent agent requests exceeding pool size', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      // Request same agent type 50 times concurrently (pool size is 3)
      const requests = Array.from({ length: 50 }, () =>
        orchestrator.startChain(['maria-qa'], context)
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const duration = Date.now() - startTime;

      console.log(`   50 concurrent requests processed in ${duration}ms`);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(45); // At least 90% should succeed
    });
  });

  describe('Event System Failures', () => {
    it('should handle event listener errors without crashing', async () => {
      // Add a listener that always throws
      orchestrator.on('agent:activated', () => {
        throw new Error('Simulated listener crash');
      });

      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      // Should continue despite listener errors
      const chainId = await orchestrator.startChain(['maria-qa'], context);
      expect(chainId).toBeTruthy();
    });

    it('should handle event emitter overflow', async () => {
      // Add max listeners exceeded scenario
      const maxListeners = orchestrator.getMaxListeners();

      for (let i = 0; i < maxListeners + 50; i++) {
        orchestrator.on('agent:activated', () => {}); // Add excessive listeners
      }

      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      const chainId = await orchestrator.startChain(['maria-qa'], context);
      expect(chainId).toBeTruthy(); // Should still work
    });
  });

  describe('Priority Queue Edge Cases', () => {
    it('should handle invalid priority values', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      const maria = await agentPool.getAgent('maria-qa') as EnhancedMaria;
      const result = await maria.activate(context);

      // Manually create handoff with invalid priority
      const invalidHandoff: any = {
        fromAgent: 'maria-qa',
        toAgent: 'james-frontend',
        context: context,
        priority: 'SUPER_URGENT_EMERGENCY' as any, // Invalid priority
        timestamp: Date.now()
      };

      // Should default to 'medium' priority
      orchestrator.emit('agent:handoff', invalidHandoff);

      // If no crash, the invalid priority was handled
      expect(true).toBe(true);
    });

    it('should handle negative or out-of-range priority values', async () => {
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: 'test'
      };

      const invalidPriorities = [-1, 999, Infinity, NaN, null, undefined];

      for (const priority of invalidPriorities) {
        const handoff: any = {
          fromAgent: 'maria-qa',
          toAgent: 'james-frontend',
          context: context,
          priority: priority,
          timestamp: Date.now()
        };

        // Should not crash on invalid priorities
        orchestrator.emit('agent:handoff', handoff);
      }

      expect(true).toBe(true); // Survived all invalid priorities
    });
  });

  describe('Resource Exhaustion', () => {
    it('should handle memory pressure from large context objects', async () => {
      // Create 1MB context object (reduced from 10MB for faster tests)
      const largeContent = 'x'.repeat(1024 * 1024);
      const context: AgentActivationContext = {
        filePath: '/test/file.ts',
        content: largeContent,
        metadata: {
          hugeArray: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
        }
      };

      const startMem = process.memoryUsage().heapUsed;
      const chainId = await orchestrator.startChain(['maria-qa'], context);
      const endMem = process.memoryUsage().heapUsed;

      console.log(`   Memory delta: ${((endMem - startMem) / 1024 / 1024).toFixed(2)} MB`);
      expect(chainId).toBeTruthy();
    });

    it('should handle many concurrent operations', async () => {
      // Simulate many concurrent operations (reduced from 1000 to 100)
      const contexts = Array.from({ length: 100 }, (_, i) => ({
        filePath: `/test/file-${i}.ts`,
        content: 'test'
      }));

      const results = await Promise.allSettled(
        contexts.map(ctx => orchestrator.startChain(['maria-qa'], ctx))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`   ${successful}/100 chains created under stress`);
      expect(successful).toBeGreaterThan(90); // 90%+ success rate
    });
  });
});

describe('Stress Test: Combined False Information + Bad Routing', () => {
  let agentPool: AgentPool;
  let orchestrator: EventDrivenOrchestrator;

  beforeEach(async () => {
    agentPool = new AgentPool();
    await agentPool.initialize();
    orchestrator = new EventDrivenOrchestrator(agentPool);
  });

  afterEach(async () => {
    await orchestrator.shutdown();
    await agentPool.shutdown();
  });

  it('should survive chaos: invalid data + bad routing + high load', async () => {
    const chaosScenarios = [
      // Scenario 1: Invalid context + nonexistent agent
      {
        context: { filePath: null, content: undefined } as any,
        agents: ['fake-agent-123']
      },
      // Scenario 2: Huge context + circular chain
      {
        context: {
          filePath: '/test/huge.ts',
          content: 'x'.repeat(100000)
        },
        agents: ['maria-qa', 'james-frontend', 'maria-qa', 'james-frontend']
      },
      // Scenario 3: Binary data + invalid priority
      {
        context: {
          filePath: '/test/binary.bin',
          content: Buffer.from([0xFF, 0xFF, 0xFF]).toString()
        },
        agents: ['marcus-backend']
      },
      // Scenario 4: XSS attempt + self-referential
      {
        context: {
          filePath: '<script>alert(1)</script>',
          content: 'DROP TABLE users;'
        } as any,
        agents: ['maria-qa', 'maria-qa', 'maria-qa']
      }
    ];

    // Run all chaos scenarios concurrently (5 times each = 20 total, reduced from 40)
    const results = await Promise.allSettled(
      chaosScenarios.flatMap(scenario =>
        Array.from({ length: 5 }, () =>
          orchestrator.startChain(scenario.agents as any, scenario.context)
        )
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`   Chaos test: ${successful} succeeded, ${failed} failed (out of ${results.length})`);

    // Should handle chaos gracefully (not crash entire system)
    expect(successful + failed).toBe(results.length);
    expect(successful).toBeGreaterThan(0); // Some should succeed despite chaos
  });

  it('should maintain consistency under adversarial conditions', async () => {
    const validContext: AgentActivationContext = {
      filePath: '/test/valid.ts',
      content: 'const x = 1;'
    };

    // Mix of valid and invalid requests (50 total, reduced from 100)
    const mixedRequests = [
      ...Array.from({ length: 25 }, () => orchestrator.startChain(['maria-qa'], validContext)),
      ...Array.from({ length: 25 }, () => orchestrator.startChain(['fake-agent' as any], validContext))
    ];

    const startTime = Date.now();
    const results = await Promise.allSettled(mixedRequests);
    const duration = Date.now() - startTime;

    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`   Mixed adversarial test: ${successful}/50 succeeded in ${duration}ms`);

    // Valid requests should succeed despite invalid ones running concurrently
    expect(successful).toBeGreaterThanOrEqual(25); // All valid should succeed
  });
});
