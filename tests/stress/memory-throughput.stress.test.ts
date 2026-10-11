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

/** Bounded local file operations, not a product throughput or heap benchmark. */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgentMemoryManager } from '../../src/memory/agent-memory-manager.js';
import { getAllAgentIds, getAgentMemoryPath } from '../../src/memory/memory-tool-config.js';
import { promises as fs } from 'fs';
let memory: AgentMemoryManager;
beforeEach(async () => { jest.spyOn(console, 'log').mockImplementation(() => {}); memory = new AgentMemoryManager(); await memory.initialize(); });
afterEach(() => { jest.restoreAllMocks(); });

describe('Local memory operation batches', () => {
  test('round-trips 1000 distinct patterns across supported agent directories', async () => {
    const agents = getAllAgentIds();
    const batchSize = Math.min(8, agents.length);
    expect(batchSize).toBeGreaterThan(0);
    const inputs = Array.from({ length: 1000 }, (_, index) => ({
      agent: agents[index % agents.length],
      name: `batch-${index}.md`,
      content: `# Batch ${index}\nfixture-${index}`,
    }));
    // Each batch has one write per agent: distinct files overlap, shared metadata never does.
    for (let start = 0; start < inputs.length; start += batchSize) {
      const outcomes = await Promise.allSettled(inputs.slice(start, start + batchSize).map(input =>
        memory.storePattern(input.agent, input.name, input.content)
      ));
      // Drain all writes before propagating a failure so cleanup cannot race active I/O.
      for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
    }
    const files = (await Promise.all(agents.map(async agent =>
      (await fs.readdir(getAgentMemoryPath(agent)))
        .filter(name => /^batch-\d+\.md$/.test(name))
        .map(name => `${agent}/${name}`)
    ))).flat();
    expect(files).toHaveLength(1000);
    expect(files.sort()).toEqual(inputs.map(input => `${input.agent}/${input.name}`).sort());
    const readback = (await Promise.all(agents.map(agent => memory.loadPatterns(agent)))).flat()
      .filter(content => content.startsWith('# Batch '));
    expect(readback).toHaveLength(1000);
    expect(readback.sort()).toEqual(inputs.map(input => input.content).sort());
  }, 60000);
  test('writes across all supported agent directories concurrently', async () => {
    const agents = getAllAgentIds();
    await Promise.all(agents.map(async agent => {
      for (let i = 0; i < 20; i++) await memory.storePattern(agent, `parallel-${i}`, `${agent}-fixture-${i}`);
    }));
    for (const agent of agents) {
      const patterns = await memory.loadPatterns(agent);
      expect(patterns.filter(value => value.startsWith(`${agent}-fixture-`))).toHaveLength(20);
    }
  });
  test('round-trips large content and overwrites the same named pattern', async () => {
    const large = `# Large fixture
` + 'x'.repeat(12000);
    await memory.storePattern('marcus-backend', 'large', large);
    expect(await memory.loadPatterns('marcus-backend')).toContain(large);
    await memory.storePattern('marcus-backend', 'large', '# Updated fixture');
    const patterns = await memory.loadPatterns('marcus-backend');
    expect(patterns).toContain('# Updated fixture'); expect(patterns).not.toContain(large);
  });
  test('propagates failed file writes and can store again after storage is restored', async () => {
    const dir = getAgentMemoryPath('maria-qa');
    await fs.rm(dir, { recursive: true, force: true });
    await expect(memory.storePattern('maria-qa', 'missing', '# Failure')).rejects.toThrow();
    await fs.mkdir(dir, { recursive: true });
    await memory.storePattern('maria-qa', 'restored', '# Restored');
    expect(await memory.loadPatterns('maria-qa')).toContain('# Restored');
  });
});
