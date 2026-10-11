import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { IDEPerformanceDetector } from './ide-performance-detector.js';
const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('child_process', () => {
  const exec = Object.assign(vi.fn(), { [Symbol.for('nodejs.util.promisify.custom')]: execute });
  return { exec };
});

describe('IDEPerformanceDetector crash-risk contract', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'guardian-ide-'));
    execute.mockReset().mockImplementation(async (command: string) => {
      if (command.startsWith('sysctl')) return { stdout: `hw.memsize: ${16 * 1024 ** 3}` };
      if (command.startsWith('du')) return { stdout: `${10 * 1024 ** 2}\tnode_modules` };
      if (command.includes('sum+=$4')) return { stdout: '80' };
      return { stdout: 'Cursor' };
    });
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  it('detects critical risk from missing ignores, large directories and memory pressure', async () => {
    mkdirSync(join(root, 'node_modules'));
    const result = await new IDEPerformanceDetector(root).detectCrashRisk();
    expect(result).toMatchObject({ ide_type: 'cursor', crash_risk: 'critical', confidence: 100, auto_fixable: true });
    expect(result.evidence.total_indexable_size_gb).toBe(10);
    expect(result.evidence.missing_ignore_files).toEqual(['.cursorignore', '.vscode/settings.json']);
    expect(result.suggested_fixes.some(fix => fix.includes('.cursorignore'))).toBe(true);
  });
  it('reports low risk with ignore files configured and never suggests auto-fixing them', async () => {
    writeFileSync(join(root, '.cursorignore'), 'node_modules');
    mkdirSync(join(root, '.vscode'));
    writeFileSync(join(root, '.vscode/settings.json'), '{}');
    const result = await new IDEPerformanceDetector(root).detectCrashRisk();
    expect(result.crash_risk).toBe('low');
    expect(result.evidence.missing_ignore_files).toEqual([]);
    expect(result.auto_fixable).toBe(false);
  });
  it('checks JetBrains ignore configuration separately', async () => {
    execute.mockResolvedValue({ stdout: 'idea' });
    const result = await new IDEPerformanceDetector(root).detectCrashRisk();
    expect(result.ide_type).toBe('jetbrains');
    expect(result.evidence.missing_ignore_files).toEqual(['.idea/.gitignore']);
  });
  it('keeps unknown IDE confidence below automatic repair threshold', async () => {
    execute.mockRejectedValue(new Error('process probe unavailable'));
    const result = await new IDEPerformanceDetector(root).detectCrashRisk();
    expect(result.ide_type).toBe('unknown');
    expect(result.confidence).toBe(50);
    expect(result.auto_fixable).toBe(false);
  });
});
