// Deterministic subprocess release fixtures. Every unmatched fetch fails before egress.
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { syncBuiltinESMExports } from 'node:module';
if (!process.env.VERSATIL_TEST_HOME) throw new Error('CLI fixture directory is required');
os.homedir = () => process.env.VERSATIL_TEST_HOME;
syncBuiltinESMExports();
const version = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).version;
const release = {
  tag_name: `v${version}`, published_at: '2026-01-01T00:00:00Z',
  body: 'Integration test release', tarball_url: 'https://example.invalid/release.tar.gz',
  assets: [], prerelease: false, draft: false,
};
globalThis.fetch = async (input) => {
  const url = String(input);
  if (!/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/releases(?:\/latest)?$/.test(url)) {
    throw new Error('Unexpected network request in CLI fixture');
  }
  return new Response(JSON.stringify(url.endsWith('/latest') ? release : [release]), {
    status: 200, headers: { 'content-type': 'application/json' },
  });
};
