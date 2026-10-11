import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export function createHookFixture() {
  const root = mkdtempSync(join(tmpdir(), "versatil hook ' fixture-"));
  mkdirSync(join(root, '.home'), { recursive: true });
  const repo = resolve(__dirname, '../../..');
  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
    run(hook: 'before-prompt' | 'post-file-edit', input: Record<string, unknown>) {
      // JSON goes to stdin as bytes; no shell evaluates quotes, dollar signs or newlines.
      const request = { ...input, workingDirectory: root.replace(/\\/g, '/') };
      const result = spawnSync(process.execPath, [join(__dirname, 'runner.cjs'), join(repo, '.claude/hooks', `${hook}.ts`), root], {
        input: JSON.stringify(request), encoding: 'utf8', cwd: root, timeout: 10000,
        env: { PATH: process.env.PATH, NODE_ENV: 'test', HOME: join(root, '.home'), USERPROFILE: join(root, '.home'), SystemRoot: process.env.SystemRoot }
      });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(`Fixture subprocess failed: ${result.stderr || result.stdout}`);
      const output = JSON.parse(result.stdout);
      if (output.code !== 0) throw new Error(`Hook source failed: ${output.stderr}`);
      return output as { code: number; stdout: string; stderr: string; executionMs: number };
    }
  };
}
