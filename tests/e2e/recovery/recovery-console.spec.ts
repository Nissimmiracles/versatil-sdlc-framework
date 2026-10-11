/** Real Chromium harness for local recovery assets. Backend integration has a separate lane. */
import { test, expect, type Page } from '@playwright/test';
import { injectAxe, getViolations } from 'axe-playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import { createRecoveryApp, type RecoveryStore } from '../../../src/dashboard/graph-recovery-console.js';
import { recoveryHtml, recoveryCss, recoveryJs } from '../../../src/dashboard/graph-recovery-ui.js';

type Item = {
  kind: 'node' | 'edge'; id: string; label: string; deletedAt: string;
  restorationGuaranteedUntil: string; originalAvailable: boolean;
  relatedMaskedEdgeIds?: string[]; maskedEndpointIds?: string[];
};
const node = (id = 'node-1'): Item => ({ kind: 'node', id, label: 'Reference node',
  deletedAt: '2020-01-01T00:00:00Z', restorationGuaranteedUntil: '2020-01-31T00:00:00Z',
  originalAvailable: true, relatedMaskedEdgeIds: ['edge-1'] });
const edge: Item = { ...node('edge-1'), kind: 'edge', label: 'Reference relationship', maskedEndpointIds: ['node-1'], relatedMaskedEdgeIds: undefined };
const capability = 'harness-capability';
async function harness(page: Page, initial: Item[]) {
  let items = initial;
  let failure = false;
  let outcome = 'restored';
  let visible: boolean | undefined;
  const calls: { method: string; capability: string | undefined; hash: string; body: any }[] = [];
  const posts: { kind: string; id: string }[] = [];
  await page.route('http://recovery.test/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/')) {
      calls.push({ method: request.method(), capability: request.headers()['x-recovery-capability'], hash: await page.evaluate(() => location.hash), body: request.method() === 'POST' ? request.postDataJSON() : null });
      if (failure) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      if (url.pathname === '/api/recovery/restore') {
        const restored = request.postDataJSON(); posts.push(restored);
        if (outcome === 'restored' || outcome === 'already-visible') {
          items = items.filter(item => !(item.id === restored.id && item.kind === restored.kind));
        } else if (outcome === 'absent') {
          items = items.map(item => item.id === restored.id && item.kind === restored.kind ? { ...item, originalAvailable:false } : item);
        }
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...restored, outcome, visible: visible ?? restored.kind !== 'edge' }) });
      }
      const offset = Number(url.searchParams.get('offset'));
      const limit = Number(url.searchParams.get('limit'));
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ items: items.slice(offset,offset+limit), total: items.length, offset, limit, target: { projectId: 'harness-project', databaseId: 'harness-db' } }) });
    }
    if (url.pathname === '/recovery.css') return route.fulfill({ contentType: 'text/css', body: recoveryCss });
    if (url.pathname === '/recovery.js') return route.fulfill({ contentType: 'text/javascript', body: recoveryJs });
    return route.fulfill({ contentType: 'text/html', body: recoveryHtml,
      headers: { 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" } });
  });
  return { calls, posts, fail: (value: boolean) => { failure = value; }, result: (next: string, nextVisible: boolean) => { outcome = next; visible = nextVisible; } };
}
async function open(page: Page) { await page.goto('http://recovery.test/#session=' + capability); }

test.describe('Recovery console browser harness', () => {
  test('removes bootstrap fragment before fetching and keeps capability out of storage', async ({ page }) => {
    const server = await harness(page,[node()]);
    await open(page);
    await expect(page.getByRole('button', { name: 'Inspect node node-1' })).toBeVisible();
    await expect(page).toHaveURL('http://recovery.test/');
    expect(server.calls.every(call => call.capability === capability && call.hash === '')).toBe(true);
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local:0, session:0 });
    expect(await page.content()).not.toContain(capability);
    await expect(page.locator('#target')).toHaveText('Project: harness-project · Database: harness-db');
  });

  test('missing capability refuses all API requests', async ({ page }) => {
    const server = await harness(page,[node()]);
    await page.goto('http://recovery.test/');
    await expect(page.getByRole('status')).toContainText('Session capability missing');
    expect(server.calls).toEqual([]);
    await expect(page.getByRole('button', { name: 'Refresh', exact:true })).toBeDisabled();
  });

  test('renders malicious labels as text and passes tagged accessibility checks', async ({ page }) => {
    await harness(page,[{ ...node(), label: '<img src=x onerror="window.injected=true">' }]);
    await open(page);
    await page.getByRole('button', { name:'Inspect node node-1' }).click();
    await expect(page.locator('#record-label')).toHaveText('<img src=x onerror="window.injected=true">');
    expect(await page.locator('img').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).injected)).toBeUndefined();
    // Inject locally for the audit; no CDN, and no inline page assets are required.
    await injectAxe(page);
    expect(await getViolations(page, null, { runOnly: { type:'tag', values:['wcag2a','wcag2aa','wcag21a','wcag21aa'] } })).toEqual([]);
  });

  test('expired guarantees retain restore while missing originals show a clear refusal', async ({ page }) => {
    await harness(page,[node(), { ...node('missing'), originalAvailable:false }]);
    await open(page);
    await page.getByRole('button',{ name:'Inspect node node-1' }).click();
    await expect(page.locator('#guarantee-state')).toHaveText('Guarantee period ended; recovery still available');
    await expect(page.getByRole('button',{ name:'Restore node',exact:true })).toBeEnabled();
    await expect(page.locator('#dependency-ids')).toContainText('edge-1');
    await page.getByRole('button',{ name:'Inspect node missing' }).click();
    await expect(page.getByRole('button',{ name:'Restore node',exact:true })).toBeDisabled();
    await expect(page.locator('#restore-reason')).toHaveText('Original document is missing. Restore is unavailable.');
    await expect(page.locator('#detail-title')).toBeFocused();
  });

  test('confirmation is explicit, keyboard dismissible, and posts only the selected identity', async ({ page }) => {
    const server = await harness(page,[node()]);
    await open(page);
    await page.getByRole('button',{ name:'Inspect node node-1' }).click();
    await page.getByRole('button',{ name:'Restore node',exact:true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button',{ name:'Cancel',exact:true })).toBeFocused();
    expect(server.posts).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button',{ name:'Restore node',exact:true })).toBeFocused();
    expect(server.posts).toEqual([]);
    await page.getByRole('button',{ name:'Restore node',exact:true }).click();
    await page.getByRole('button',{ name:'Confirm restore',exact:true }).click();
    await expect(page.getByRole('status')).toContainText('The record is visible.');
    expect(server.posts).toEqual([{ kind:'node', id:'node-1' }]);
    expect(server.calls.every(call => call.capability === capability)).toBe(true);
    await expect(page.locator('#items')).toBeEmpty();
  });

  test('edge detail names masked endpoints and restore reports continued hiding', async ({ page }) => {
    const server = await harness(page,[node(),edge]);
    await open(page);
    await page.getByRole('button',{ name:'Inspect edge edge-1' }).click();
    await expect(page.locator('#dependencies-title')).toHaveText('Masked endpoints');
    await expect(page.locator('#dependency-ids')).toHaveText('node-1');
    await page.getByRole('button',{ name:'Restore edge',exact:true }).click();
    await page.getByRole('button',{ name:'Confirm restore',exact:true }).click();
    await expect(page.getByRole('status')).toContainText('The edge remains hidden until its masked endpoints are restored.');
    expect(server.posts).toEqual([{ kind:'edge',id:'edge-1' }]);
    await expect(page.getByRole('button',{ name:'Inspect node node-1' })).toBeVisible();
  });

  test('pagination and filtering remain scoped to the loaded page', async ({ page }) => {
    const server = await harness(page,Array.from({ length:51 }, (_,index) => ({ ...node('record-' + index),label:'Record ' + index })));
    await open(page);
    await expect(page.locator('#range')).toHaveText('1–50 of 51');
    await page.getByRole('searchbox',{ name:'Filter current page' }).fill('record-50');
    await expect(page.locator('#empty')).toHaveText('No matching records on this page.');
    expect(server.calls).toHaveLength(1);
    await page.getByRole('searchbox',{ name:'Filter current page' }).fill('');
    await page.getByRole('button',{ name:'Next',exact:true }).click();
    await expect(page.getByRole('button',{ name:'Inspect node record-50' })).toBeVisible();
    await expect(page.locator('#range')).toHaveText('51–51 of 51');
    await expect(page.getByRole('button',{ name:'Next',exact:true })).toBeDisabled();
    await page.getByRole('button',{ name:'Previous',exact:true }).click();
    await expect(page.locator('#range')).toHaveText('1–50 of 51');
  });

  test('empty and failed lists have usable state and refresh recovers', async ({ page }) => {
    const server = await harness(page,[]);
    server.fail(true);
    await open(page);
    await expect(page.getByRole('status')).toContainText('Request failed (503).');
    await expect(page.locator('#restore')).toBeDisabled();
    server.fail(false);
    await page.getByRole('button',{ name:'Refresh',exact:true }).click();
    await expect(page.getByRole('status')).toHaveText('No recovery items.');
    await expect(page.locator('#empty')).toHaveText('No recovery items.');
    await expect(page.locator('#next')).toBeDisabled();
  });

  test('loading disables mutations until the list is observed', async ({ page }) => {
    await harness(page,[node()]);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('http://recovery.test/api/recovery/items?*', async route => { await gate; await route.fallback(); });
    await open(page);
    await expect(page.getByRole('status')).toHaveText('Loading recovery items…');
    await expect(page.locator('#refresh')).toBeDisabled();
    await expect(page.locator('#restore')).toBeDisabled();
    release();
    await expect(page.getByRole('button',{ name:'Inspect node node-1' })).toBeVisible();
    await expect(page.locator('#refresh')).toBeEnabled();
  });

  for (const outcome of ['already-visible','absent','unknown']) {
    test('handles backend outcome ' + outcome + ' without inventing restoration success', async ({ page }) => {
      const server = await harness(page,[edge]);
      server.result(outcome,false);
      await open(page);
      await page.getByRole('button',{ name:'Inspect edge edge-1' }).click();
      await page.getByRole('button',{ name:'Restore edge',exact:true }).click();
      await page.getByRole('button',{ name:'Confirm restore',exact:true }).click();
      if (outcome === 'already-visible') {
        await expect(page.getByRole('status')).toContainText('Recovery marker already cleared');
        await expect(page.getByRole('status')).toContainText('The edge remains hidden until its masked endpoints are restored.');
      } else if (outcome === 'absent') {
        await expect(page.getByRole('status')).toContainText('restoration was not performed');
        await expect(page.locator('#restore')).toBeDisabled();
      } else {
        await expect(page.getByRole('status')).toContainText('invalid restoration result');
        await expect(page.getByRole('status')).not.toContainText('Restored');
      }
    });
  }

  test('real local app serves CSP assets and accepts only an explicit browser-confirmed restore', async ({ page }) => {
    let inventory = [node(),edge,{ ...node('missing-original'),label:'Unavailable original',originalAvailable:false }];
    const restored: { kind:string;id:string }[] = [];
    // Storage adapter fixture. This exercises the actual Express app, not the actual Firestore store.
    const store = {
      listSoftDeletedTargets: async ({ offset,limit }: { offset:number;limit:number }) => ({ items:inventory.slice(offset,offset+limit),total:inventory.length }),
      restoreNode: async (id:string) => { restored.push({ kind:'node',id });inventory=inventory.filter(item=>item.kind!=='node'||item.id!==id);return { outcomes:[{kind:'node',id,outcome:'restored'}] }; },
      restoreEdge: async (id:string) => { restored.push({ kind:'edge',id });inventory=inventory.filter(item=>item.kind!=='edge'||item.id!==id);return { outcomes:[{kind:'edge',id,outcome:'restored'}] }; },
      getNode: () => ({ id:'node-1' }),getEdge: () => undefined,
    } as unknown as RecoveryStore;
    const session = 'ab'.repeat(32);
    const app = createRecoveryApp({ store,capability:session,target:{ projectId:'harness-project',databaseId:'harness-db' } });
    const server = await new Promise<Server>(resolveServer => { const listener=app.listen(0,'127.0.0.1',()=>resolveServer(listener)); });
    try {
      const address=server.address();
      if (!address || typeof address === 'string') throw new Error('Harness listener unavailable');
      const origin='http://127.0.0.1:'+address.port;
      const errors:string[]=[];
      page.on('pageerror',error=>errors.push(error.message));
      const response=await page.goto(origin+'/#session='+session);
      expect(response?.headers()['content-security-policy']).toContain("script-src 'self'");
      await expect(page.getByRole('button',{name:'Inspect edge edge-1'})).toBeVisible();
      await expect(page).toHaveURL(origin+'/');
      await page.getByRole('button',{name:'Inspect edge edge-1'}).click();
      await page.setViewportSize({width:1440,height:960});
      const output=resolve(process.cwd(),'..','..','outputs');await mkdir(output,{recursive:true});
      await page.screenshot({path:resolve(output,'graph-recovery-console-desktop.png'),fullPage:true});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:resolve(output,'graph-recovery-console-mobile.png'),fullPage:true});
      await expect(page.locator('#dependency-ids')).toHaveText('node-1');
      await page.getByRole('button',{name:'Restore edge',exact:true}).click();
      expect(restored).toEqual([]);
      await page.getByRole('button',{name:'Confirm restore',exact:true}).click();
      await expect(page.getByRole('status')).toContainText('The edge remains hidden until its masked endpoints are restored.');
      expect(restored).toEqual([{kind:'edge',id:'edge-1'}]);
      await expect(page.getByRole('button',{name:'Inspect edge edge-1'})).toHaveCount(0);
      const denied=await page.request.get(origin+'/api/recovery/items');
      expect(denied.status()).toBe(403);
      expect(errors).toEqual([]);
    } finally {
      await page.goto('about:blank');
      await new Promise<void>((resolveClose,reject)=>server.close(error=>error?reject(error):resolveClose()));
    }
  });

  test('mobile list and detail remain within viewport', async ({ page }) => {
    await page.setViewportSize({ width:375,height:800 });
    await harness(page,[node()]);
    await open(page);
    await page.getByRole('button',{ name:'Inspect node node-1' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await expect(page.locator('#restore')).toBeVisible();
  });
});
