import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ContextVerifier, verifyContextIssue } from './context-verifier.js';

describe('ContextVerifier implemented contract', () => {
  let verifier: ContextVerifier;
  let root: string;
  beforeEach(() => {
    ContextVerifier.resetInstance();
    verifier = ContextVerifier.getInstance();
    root = mkdtempSync(join(tmpdir(), 'guardian-context-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  it('defaults to project context and shares the singleton', () => {
    expect(verifier.getCurrentContext()).toBe('PROJECT_CONTEXT');
    expect(ContextVerifier.getInstance()).toBe(verifier);
  });
  it.each([
    ['/repo/versatil-sdlc-fw/src/index.ts', 'FRAMEWORK_CONTEXT'],
    ['node_modules/@versatil/sdlc-framework/index.js', 'FRAMEWORK_CONTEXT'],
    ['/repo/src/agents/guardian/index.ts', 'FRAMEWORK_CONTEXT'],
    ['/repo/my-project/src/app.ts', 'PROJECT_CONTEXT']
  ] as const)('classifies %s', (file, context) => {
    expect(verifier.detectContextFromPath(file)).toBe(context);
  });
  it('denies framework operations from project context, then allows framework context', () => {
    expect(verifier.validateContextOperation('modify', 'FRAMEWORK_CONTEXT')).toEqual({
      allowed: false, reason: 'Cannot modify framework files from project context'
    });
    expect(verifier.validateContextOperation('modify', 'PROJECT_CONTEXT').allowed).toBe(true);
    verifier.setContext('FRAMEWORK_CONTEXT');
    expect(verifier.validateContextOperation('modify', 'FRAMEWORK_CONTEXT').allowed).toBe(true);
  });
  it('detects modifying leaks without flagging reading or project operations', () => {
    expect(verifier.detectContextLeak('PROJECT_CONTEXT', 'FRAMEWORK_CONTEXT', 'modify file')).toBe(true);
    expect(verifier.detectContextLeak('PROJECT_CONTEXT', 'FRAMEWORK_CONTEXT', 'read file')).toBe(false);
    expect(verifier.detectContextLeak('PROJECT_CONTEXT', 'PROJECT_CONTEXT', 'modify file')).toBe(false);
  });
  it('does not verify a claim without preferences or a recognized claim', async () => {
    const issue = { id: 'test', component: 'context', severity: 'low' as const, description: 'Indentation in file.ts' };
    const missing = await verifier.verifyContextIssue(issue, root);
    expect(missing.verified).toBe(false);
    expect(missing.recommended_fix).toBeUndefined();
    expect(missing.verifications[0].method).toBe('user preferences not found');
    const unknown = await verifyContextIssue({ ...issue, description: 'Unrecognized concern' }, root);
    expect(unknown).toMatchObject({ verified: false, confidence: 0, verifications: [] });
  });
  it('verifies indentation mismatch against explicit resolved preferences', async () => {
    writeFileSync(join(root, 'file.ts'), '\tconst value = 1;\n');
    const result = await verifyContextIssue({ component: 'context', severity: 'low', description: 'Indentation in file.ts' }, root,
      undefined, undefined, undefined, { codingPreferences: { indentation: 'spaces' } });
    expect(result.verified).toBe(true);
    expect(result.verifications[0].evidence).toMatchObject({ actual_value: 'tabs', expected_value: 'spaces' });
  });
});
