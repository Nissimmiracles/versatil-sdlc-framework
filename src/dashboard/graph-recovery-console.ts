import express from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdtemp, writeFile, lstat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import type { GraphRAGStore } from '../lib/graphrag-store.js';
import { recoveryHtml, recoveryCss, recoveryJs } from './graph-recovery-ui.js';

export interface RecoveryTarget { projectId: string; databaseId: string }
export type RecoveryStore = Pick<GraphRAGStore, 'listSoftDeletedTargets' | 'restoreNode' | 'restoreEdge' | 'getNode' | 'getEdge'>;

/** The capability admits this local operator session, never a public/tenant identity. */
export function createRecoveryApp(options: { store: RecoveryStore; capability: string; target: RecoveryTarget }) {
  if (!/^[a-f0-9]{64}$/.test(options.capability)) throw new Error('Recovery capability required');
  const capability = Buffer.from(options.capability);
  const app = express();
  app.disable('x-powered-by');
  app.set('case sensitive routing', true);
  app.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" });
    const host = `127.0.0.1:${req.socket.localPort}`;
    if (req.headers.host !== host) { res.status(403).json({ error: 'Local host required' }); return; }
    if (!['/', '/recovery.css', '/recovery.js'].includes(req.path)) {
      const provided = req.headers['x-recovery-capability'];
      if (typeof provided !== 'string' || !/^[a-f0-9]{64}$/.test(provided) || !timingSafeEqual(Buffer.from(provided), capability)) {
        res.status(403).json({ error: 'Operator session required' }); return;
      }
      if (req.headers.origin && req.headers.origin !== `http://${host}`) { res.status(403).json({ error: 'Local origin required' }); return; }
      if (req.method !== 'GET' && (req.headers.origin !== `http://${host}` || !req.is('application/json'))) {
        res.status(403).json({ error: 'Local JSON request required' }); return;
      }
    }
    next();
  });
  app.get('/', (_req, res) => res.type('html').send(recoveryHtml));
  app.get('/recovery.css', (_req, res) => res.type('css').send(recoveryCss));
  app.get('/recovery.js', (_req, res) => res.type('js').send(recoveryJs));
  app.get('/api/recovery/items', async (req, res) => {
    const keys = Object.keys(req.query);
    if (keys.some(key => key !== 'offset' && key !== 'limit') || keys.some(key => typeof req.query[key] !== 'string' || !/^\d+$/.test(req.query[key] as string))) {
      res.status(400).json({ error: 'Invalid pagination' }); return;
    }
    const offset = Number(req.query.offset ?? 0); const limit = Number(req.query.limit ?? 50);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Invalid pagination' }); return;
    }
    try { res.json({ ...await options.store.listSoftDeletedTargets({ offset, limit }), offset, limit, target: options.target }); }
    catch { res.status(503).json({ error: 'Recovery inventory unavailable; no cached result is shown' }); }
  });
  app.post('/api/recovery/restore', express.json({ limit: '2kb', strict: true }), async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).sort().join(',') !== 'id,kind' ||
        !['node', 'edge'].includes(body.kind) || typeof body.id !== 'string' || !body.id || body.id.length > 512 ||
        body.id.includes('/') || Array.from(body.id as string).some(character => character.charCodeAt(0) < 32)) {
      res.status(400).json({ error: 'Explicit recovery target required' }); return;
    }
    try {
      const result = await (body.kind === 'node' ? options.store.restoreNode(body.id) : options.store.restoreEdge(body.id));
      const outcome = result.outcomes[0]?.outcome;
      const visible = (body.kind === 'node' ? options.store.getNode(body.id) : options.store.getEdge(body.id)) !== undefined;
      res.json({ kind: body.kind, id: body.id, outcome, visible });
    } catch { res.status(503).json({ error: 'Restoration could not be confirmed; refresh inventory before retrying' }); }
  });
  app.use((_req, res) => { res.status(404).json({ error: 'Unknown recovery route' }); });
  app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'Invalid recovery request' });
  });
  return app;
}

export async function startLocalRecoveryConsole(options: { store: RecoveryStore; target: RecoveryTarget; port?: number }): Promise<{ server: Server; url: string; launchPath: string; close: () => Promise<void> }> {
  // POSIX private-file ownership is required; do not claim Windows ACL isolation.
  if (process.platform === 'win32' || typeof process.getuid !== 'function') throw new Error('Recovery launcher requires POSIX owner-only file permissions');
  const capability = randomBytes(32).toString('hex');
  const app = createRecoveryApp({ ...options, capability });
  const server = await new Promise<Server>((resolve, reject) => {
    const listener = app.listen(options.port ?? 0, '127.0.0.1', () => resolve(listener));
    listener.once('error', reject);
  });
  let directory: string | undefined;
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Local listener unavailable');
    const url = `http://127.0.0.1:${address.port}`;
    directory = await mkdtemp(join(tmpdir(), 'versatil-recovery-'));
    const launchPath = join(directory, 'open.html');
    await writeFile(launchPath, `<!doctype html><meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0;url=${url}/#session=${capability}"><title>Open local recovery console</title>`, { mode: 0o600, flag: 'wx' });
    for (const [path, mode] of [[directory, 0o700], [launchPath, 0o600]] as const) {
      const stat = await lstat(path);
      if (stat.isSymbolicLink() || stat.uid !== process.getuid() || (stat.mode & 0o777) !== mode) throw new Error('Private recovery launcher permissions unavailable');
    }
    const cleanup = () => { void rm(directory!, { recursive: true, force: true }); };
    server.once('close', cleanup);
    return { server, url, launchPath, close: async () => {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await rm(directory!, { recursive: true, force: true });
    } };
  } catch (error) {
    server.close();
    if (directory) await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
