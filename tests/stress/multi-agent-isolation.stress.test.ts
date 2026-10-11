// Keep stress fixtures away from account memory and statistics.
jest.mock('os', () => {
  const os = jest.requireActual('os');
  const fs = jest.requireActual('fs');
  const path = jest.requireActual('path');
  const fixtureHome = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-stress-home-'));
  return { ...os, homedir: () => fixtureHome };
});
afterAll(() => {
  const fs = jest.requireActual('fs');
  fs.rmSync(require('os').homedir(), { recursive: true, force: true });
});

/** Supported agent file isolation; no claim of 18 live agent executions. */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContextBudgetManager } from '../../src/tracking/context-budget-manager.js';
import { ContextSentinel } from '../../src/agents/monitoring/context-sentinel.js';
import { AgentMemoryManager } from '../../src/memory/agent-memory-manager.js';
import { getAllAgentIds, getAgentMemoryPath } from '../../src/memory/memory-tool-config.js';
import { promises as fs } from 'fs';
let memory: AgentMemoryManager;
beforeEach(async () => { jest.spyOn(console, 'log').mockImplementation(() => {}); memory = new AgentMemoryManager(); await memory.initialize(); });
afterEach(() => { jest.restoreAllMocks(); });

describe('Supported agent memory isolation', () => {
  test('keeps agent-specific content isolated despite identical filenames', async () => {
    const agents = getAllAgentIds();
    expect(agents).toHaveLength(8);
    await Promise.all(agents.map(agent => memory.storePattern(agent, 'same-name', `# Owner ${agent}`)));
    for (const agent of agents) {
      const patterns = await memory.loadPatterns(agent);
      expect(patterns).toContain(`# Owner ${agent}`);
      for (const other of agents.filter(value => value !== agent)) expect(patterns).not.toContain(`# Owner ${other}`);
    }
  });
  test('maintains distinct directories and metadata for all supported agents', async () => {
    const agents = getAllAgentIds();
    expect(new Set(agents.map(getAgentMemoryPath)).size).toBe(agents.length);
    for (const agent of agents) {
      await memory.storePattern(agent, 'directory-fixture', `# ${agent}`);
      expect(await fs.readFile(getAgentMemoryPath(agent) + '/directory-fixture.md', 'utf8')).toBe(`# ${agent}`);
      expect((await memory.getAgentStats(agent)).agentId).toBe(agent);
    }
  });
  test('overwriting one agent never changes another agent content', async () => {
    await memory.storePattern('maria-qa', 'isolated', '# Maria');
    await memory.storePattern('james-frontend', 'isolated', '# James');
    await memory.storePattern('maria-qa', 'isolated', '# Maria updated');
    expect(await memory.loadPatterns('james-frontend')).toContain('# James');
    expect(await memory.loadPatterns('maria-qa')).toContain('# Maria updated');
  });
});


describe('Budget accounting under an unavailable measurement fixture', () => {
  let manager: ContextBudgetManager;
  beforeEach(() => {
    jest.spyOn(ContextSentinel.prototype, 'startMonitoring').mockImplementation(() => {});
    jest.spyOn(ContextSentinel.prototype, 'runContextCheck').mockRejectedValue(new Error('Offline measurement fixture'));
    manager = new ContextBudgetManager();
  });
  afterEach(() => { manager.destroy(); });
  test('accounts for 18 independent task allocations, without claiming live agent execution', async () => {
    for (let i = 0; i < 18; i++) expect(await manager.requestAllocation({ taskId: `task-${i}`, description: 'fixture', estimatedTokens: 10000, priority: 'high', canDefer: false })).toBe(true);
    expect(manager.getAllocationSummary().total).toBe(180000);
    expect(await manager.getBudgetStatus()).toMatchObject({ used: 180000, reserved: 15000, remaining: 5000 });
  });
  test('rejects an allocation that would consume the reserved buffer', async () => {
    expect(await manager.requestAllocation({ taskId: 'too-large', description: 'fixture', estimatedTokens: 185001, priority: 'high', canDefer: false })).toBe(false);
    expect(manager.getAllocationSummary().total).toBe(0);
  });
  test('releases allocation space when a task completes', async () => {
    await manager.requestAllocation({ taskId: 'first', description: 'fixture', estimatedTokens: 10000, priority: 'high', canDefer: false });
    manager.deallocate('first');
    expect(await manager.getBudgetStatus()).toMatchObject({ allocated: 0, remaining: 185000 });
  });
});
