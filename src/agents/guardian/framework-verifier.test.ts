import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { verifyFrameworkIssue } from './framework-verifier.js';
vi.mock('child_process', () => ({ execSync: vi.fn() }));

describe('verifyFrameworkIssue', () => {
  let root: string;
  const issue = { id: 'build-1', component: 'build', severity: 'high' as const, description: 'Build failed' };
  beforeEach(() => { vi.resetAllMocks(); root = mkdtempSync(join(tmpdir(), 'guardian-framework-')); });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  it('leaves unrecognized claims unverified', async () => {
    expect(await verifyFrameworkIssue({ ...issue, component: 'other', description: 'Unrecognized concern' }, root))
      .toMatchObject({ verified: false, confidence: 0, verifications: [], recommended_fix: undefined });
    expect(execSync).not.toHaveBeenCalled();
  });
  it('refutes build failure when the build succeeds', async () => {
    vi.mocked(execSync).mockReturnValue('built');
    const result = await verifyFrameworkIssue(issue, root);
    expect(result.verified).toBe(false);
    expect(result.recommended_fix).toBeUndefined();
    expect(result.verifications[0].evidence).toMatchObject({ exit_code: 0, output: 'built' });
    expect(execSync).toHaveBeenCalledWith('npm run build', expect.objectContaining({ cwd: root }));
  });
  it('records failing build exit code and output as evidence', async () => {
    vi.mocked(execSync).mockImplementation(() => { throw Object.assign(new Error('failed'), { status: 2, stdout: 'compile error', stderr: 'invalid type' }); });
    const result = await verifyFrameworkIssue(issue, root);
    expect(result).toMatchObject({ issue_id: 'build-1', layer: 'framework', verified: true, confidence: 100 });
    expect(result.verifications[0].evidence).toMatchObject({ exit_code: 2, output: 'compile error', error_details: 'invalid type' });
    expect(result.recommended_fix).toBeDefined();
  });
  it('rejects TypeScript errors attributed to absent files without invoking the compiler', async () => {
    const result = await verifyFrameworkIssue({ ...issue, description: 'TypeScript error missing.ts' }, root);
    expect(result.verified).toBe(false);
    expect(result.verifications[0].evidence?.file_exists).toBe(false);
    expect(execSync).not.toHaveBeenCalled();
  });
});
