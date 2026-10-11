import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { request } from 'node:http';
import { lstat, readFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createRecoveryApp, startLocalRecoveryConsole, type RecoveryStore } from './graph-recovery-console.js';

const capability = 'a'.repeat(64);
const target = { projectId: 'fixture-project', databaseId: 'fixture-rag' };
const sessions: Server[] = [];
afterEach(async () => { await Promise.all(sessions.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve())))); });
function fixture(): RecoveryStore {
  return { listSoftDeletedTargets: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    restoreNode: vi.fn().mockResolvedValue({ outcomes: [{ id: 'n1', outcome: 'restored' }], warnings: [], acceptedAt: 0 }),
    restoreEdge: vi.fn().mockResolvedValue({ outcomes: [{ id: 'e1', outcome: 'restored' }], warnings: [], acceptedAt: 0 }),
    getNode: vi.fn().mockReturnValue({ id: 'n1' }), getEdge: vi.fn().mockReturnValue(undefined) } as unknown as RecoveryStore;
}
async function listen(store = fixture()) {
  const server = await new Promise<Server>(resolve => { const instance = createRecoveryApp({ store, capability, target }).listen(0, '127.0.0.1', () => resolve(instance)); });
  sessions.push(server); const address = server.address();
  if (!address || typeof address === 'string') throw Error('No TCP address');
  return { url: `http://127.0.0.1:${address.port}`, store, port: address.port };
}
describe('local operator recovery boundary', () => {
  it('requires a session and never embeds capability in public assets', async () => {
    const { url, store } = await listen();
    const page = await fetch(url); expect(page.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(await page.text()).not.toContain(capability);
    for (const token of [undefined, 'b'.repeat(64), 'é'.repeat(64)]) {
      const response = await fetch(url + '/api/recovery/items', { headers: token ? { 'X-Recovery-Capability': token } : {} });
      expect(response.status).toBe(403);
    }
    expect(store.listSoftDeletedTargets).not.toHaveBeenCalled();
    for (const path of ['/API/recovery/items', '/Api/recovery/items', '/api/Recovery/items']) {
      expect((await fetch(url + path)).status).toBe(403);
    }
    expect((await fetch(url + '/API/recovery/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"kind":"node","id":"n1"}' })).status).toBe(403);
    expect(store.restoreNode).not.toHaveBeenCalled();
    for (const id of ['bad/id', 'bad\u0000id', 'bad\u001fid']) {
      const response = await fetch(url + '/api/recovery/restore', { method: 'POST', headers: { 'X-Recovery-Capability': capability, Origin: url, 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'node', id }) });
      expect(response.status).toBe(400);
    }
    expect(store.restoreNode).not.toHaveBeenCalled();
  });
  it('rejects foreign Host even with capability', async () => {
    const { port, store } = await listen();
    const status = await new Promise<number>(resolve => { request({ hostname: '127.0.0.1', port, path: '/api/recovery/items', headers: { Host: 'attacker.example', 'X-Recovery-Capability': capability } }, res => { res.resume(); resolve(res.statusCode!); }).end(); });
    expect(status).toBe(403); expect(store.listSoftDeletedTargets).not.toHaveBeenCalled();
  });
  it('rejects cross-origin and simple restore requests before mutation', async () => {
    const { url, store } = await listen();
    for (const [origin, type] of [['https://attacker.example', 'application/json'], ['', 'application/json'], [url, 'text/plain']]) {
      const response = await fetch(url + '/api/recovery/restore', { method: 'POST', headers: { 'X-Recovery-Capability': capability, Origin: origin, 'Content-Type': type }, body: JSON.stringify({ kind: 'node', id: 'n1' }) });
      expect(response.status).toBe(403);
    }
    expect(store.restoreNode).not.toHaveBeenCalled();
  });
  it('uses bounded fresh inventory and fails closed on unavailable storage', async () => {
    const { url, store } = await listen(); const headers = { 'X-Recovery-Capability': capability };
    const response = await fetch(url + '/api/recovery/items?offset=10&limit=20', { headers });
    expect(await response.json()).toEqual({ items: [], total: 0, offset: 10, limit: 20, target });
    expect(store.listSoftDeletedTargets).toHaveBeenCalledWith({ offset: 10, limit: 20 });
    for (const query of ['limit=101', 'offset=-1', 'offset=0&offset=1', 'scope=private']) expect((await fetch(url + '/api/recovery/items?' + query, { headers })).status).toBe(400);
    vi.mocked(store.listSoftDeletedTargets).mockRejectedValueOnce(Error('provider confidential details'));
    const failure = await fetch(url + '/api/recovery/items', { headers }); expect(failure.status).toBe(503);
    expect(await failure.text()).not.toContain('confidential');
  });
  it('returns actual visibility when restored edge still has a masked endpoint', async () => {
    const { url, store } = await listen();
    const response = await fetch(url + '/api/recovery/restore', { method: 'POST', headers: { 'X-Recovery-Capability': capability, Origin: url, 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'edge', id: 'e1' }) });
    expect(await response.json()).toEqual({ kind: 'edge', id: 'e1', outcome: 'restored', visible: false });
    expect(store.restoreEdge).toHaveBeenCalledWith('e1'); expect(store.restoreNode).not.toHaveBeenCalled();
    expect((await fetch(url + '/api/recovery/purge', { method: 'POST', headers: { 'X-Recovery-Capability': capability, Origin: url, 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(404);
  });
  it('binds loopback with a private launcher, and removes it on close', async () => {
    if (process.platform === 'win32') { await expect(startLocalRecoveryConsole({ store: fixture(), target })).rejects.toThrow('POSIX'); return; }
    const session = await startLocalRecoveryConsole({ store: fixture(), target });
    try {
      expect((session.server.address() as any).address).toBe('127.0.0.1');
      expect((await lstat(session.launchPath)).mode & 0o777).toBe(0o600);
      expect((await lstat(dirname(session.launchPath))).mode & 0o777).toBe(0o700);
      const html = await readFile(session.launchPath, 'utf8');
      const token = html.match(/#session=([a-f0-9]{64})/)![1];
      expect((await fetch(session.url + '/api/recovery/items', { headers: { 'X-Recovery-Capability': token } })).status).toBe(200);
    } finally { await session.close(); }
    await expect(access(session.launchPath)).rejects.toThrow();
  });
});
