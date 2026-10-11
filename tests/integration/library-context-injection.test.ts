/** Real hook subprocess contract: plain-text library guide notifications, not full file injection. */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pathToFileURL } from 'node:url';
const hook = path.join(process.cwd(), '.claude/hooks/before-prompt.ts');
const preload = path.join(process.cwd(), 'tests/integration/helpers/cli-offline-fixture.mjs');
let root: string;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-guide-'));
  fs.mkdirSync(path.join(root, '.versatil'), { recursive: true });
  // Select the lightweight health path; no guardian agent/provider starts in this fixture.
  fs.writeFileSync(path.join(root, '.versatil', '.last-guardian-check'), String(Date.now()));
  fs.writeFileSync(path.join(root, '.versatil-project.json'), JSON.stringify({ name: 'hook fixture' }));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
function run(prompt: string): string {
  return execFileSync(process.execPath, ['--import', pathToFileURL(preload).href, '--import', 'tsx', hook], {
    input: JSON.stringify({ prompt, workingDirectory: root }), cwd: process.cwd(), encoding: 'utf8',
    env: { ...process.env, VERSATIL_TEST_HOME: root }, timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
describe('Library guide hook notifications', () => {
  it.each(['agents', 'rag', 'testing', 'orchestration', 'planning', 'templates', 'mcp', 'hooks'])('notifies about the %s library', library => {
    const output = run(`Explain the ${library}/ library`);
    expect(output).toContain('# Available Library Guides');
    expect(output).toContain(`library-guides/${library}-library`);
    expect(output).not.toContain('"role":"system"');
  });
  it('includes multiple primary library guides in one response', () => {
    const output = run('How do agents/ and rag/ work together?');
    expect(output).toContain('library-guides/agents-library'); expect(output).toContain('library-guides/rag-library');
  });
  it('includes related library recommendations', () => {
    const output = run('Explain agents/');
    expect(output).toContain('Related Libraries');
    expect(output).toContain('testing-library');
  });
  it('does not invent library guides for an unrelated prompt', () => {
    expect(run('hello')).not.toContain('# Available Library Guides');
  });
  it('returns no context for an empty prompt', () => { expect(run('')).toBe(''); });
  it('handles quotes as input data instead of shell syntax', () => {
    expect(run("Explain agents/ and the user's context; $(false)")).toContain('library-guides/agents-library');
  });
});
