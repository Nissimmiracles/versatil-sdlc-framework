/** Local operator console assets. The server supplies authorization and selects the database. */
export const recoveryHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Graph recovery · Operator console</title><link rel="stylesheet" href="/recovery.css"><script src="/recovery.js" defer></script></head>
<body><a class="skip" href="#main">Skip to recovery items</a>
<header><div class="eyebrow">LOCAL OPERATOR CONSOLE</div><h1>Graph recovery</h1><p>Review masked records and restore their original graph documents.</p><p id="target" class="target">Database target will appear after session verification.</p></header>
<main id="main"><div class="notice">Restoration is guaranteed for 30 days after deletion. After that period, recovery remains available while the original document exists.</div>
<div class="toolbar"><label for="search">Filter current page<input id="search" type="search" placeholder="ID, label or kind" disabled></label><button id="refresh" type="button" disabled>Refresh</button></div>
<p id="message" role="status" aria-live="polite">Loading recovery items…</p>
<div class="workspace"><section aria-labelledby="list-title" class="list"><h2 id="list-title">Recovery items</h2><div id="table-wrap"><table><caption class="sr-only">Masked graph records on the current page</caption><thead><tr><th scope="col">ID / Label</th><th scope="col">Kind</th><th scope="col">Deleted</th><th scope="col">Guarantee ends</th></tr></thead><tbody id="items"></tbody></table></div><p id="empty" hidden>No recovery items.</p>
<nav class="pagination" aria-label="Recovery pages"><button id="previous" type="button" disabled>Previous</button><span id="range">No items loaded</span><button id="next" type="button" disabled>Next</button></nav></section>
<section class="detail" aria-labelledby="detail-title"><h2 id="detail-title" tabindex="-1">Record details</h2><p id="selection-hint">Select a record to inspect its recovery state.</p><div id="detail-body" hidden><h3 id="record-label"></h3><dl><dt>ID</dt><dd id="record-id" class="mono"></dd><dt>Kind</dt><dd id="record-kind"></dd><dt>Deleted at</dt><dd id="record-deleted"></dd><dt>Restoration guaranteed until</dt><dd id="record-guarantee"></dd><dt>Original document</dt><dd id="record-original"></dd></dl><p id="guarantee-state" class="state"></p><div id="dependencies"><h3 id="dependencies-title"></h3><p id="dependencies-explanation"></p><ul id="dependency-ids"></ul></div><p id="restore-reason"></p><button id="restore" class="primary" type="button" disabled>Restore record</button></div></section></div>
</main><dialog id="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-description"><h2 id="confirm-title">Confirm restoration</h2><p id="confirm-description"></p><p>This restores the existing original document. Related records may still be masked.</p><div class="dialog-actions"><button id="cancel" type="button" autofocus>Cancel</button><button id="confirm" class="primary" type="button">Confirm restore</button></div></dialog>
<footer>Recovery markers control visibility. This console does not permanently delete records.</footer></body></html>`;

export const recoveryCss = `
:root{color-scheme:light;--ink:#182638;--muted:#536476;--blue:#075dcc;--line:#d7e0eb;--wash:#f3f7fc}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font:15px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}header,main,footer{max-width:1360px;margin:auto;padding:28px 36px}header{border-bottom:1px solid var(--line)}h1{font-size:34px;line-height:1.15;margin:8px 0 12px;letter-spacing:-1px}h2{font-size:18px;margin:0 0 16px}h3{font-size:16px;margin:12px 0}p{margin:10px 0}.eyebrow{font-size:12px;letter-spacing:.12em;color:var(--blue);font-weight:700}.target,.mono{font:13px/1.6 ui-monospace,monospace;overflow-wrap:anywhere}.target{color:var(--muted)}.notice{background:var(--wash);padding:14px 18px;border-left:3px solid var(--blue)}.toolbar{display:flex;align-items:end;gap:16px;margin:22px 0 14px}.toolbar label{display:grid;gap:6px;max-width:500px;flex:1;font-weight:600}input,button{font:inherit}input{width:100%;padding:10px 12px;border:1px solid #9daec2;border-radius:3px}button{border:1px solid #9daec2;border-radius:3px;background:white;color:var(--ink);padding:9px 14px;cursor:pointer;min-height:42px}button:hover:not(:disabled){background:var(--wash)}button:disabled{color:#647487;background:#f2f4f7;cursor:not-allowed}.primary{background:var(--blue);border-color:var(--blue);color:#fff}.primary:hover:not(:disabled){background:#00489f}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid var(--blue);outline-offset:3px}.workspace{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,1fr);gap:28px;margin-top:24px}.list,.detail{min-width:0}.detail{border-left:1px solid var(--line);padding-left:28px}#table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;text-align:left;font-size:14px}th{font-size:12px;color:var(--muted);font-weight:600}th,td{padding:12px 10px;vertical-align:top;border-bottom:1px solid var(--line)}th:first-child,td:first-child{padding-left:0}tr.selected{background:var(--wash)}.record-button{text-align:left;border:0;background:transparent;padding:0;color:var(--blue);min-height:32px;max-width:100%;overflow-wrap:anywhere}.record-label{display:block;color:var(--ink);font-size:13px;font-weight:400}.record-id{display:block;font:13px ui-monospace,monospace}.pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}#range{font-size:13px;color:var(--muted)}dl{display:grid;grid-template-columns:1fr;gap:3px;margin:18px 0}dt{font-size:12px;color:var(--muted);margin-top:10px}dd{margin:0;overflow-wrap:anywhere}.state{border-left:3px solid var(--blue);padding-left:12px}#dependency-ids{padding-left:20px;font:13px/1.7 ui-monospace,monospace;overflow-wrap:anywhere}#restore-reason{color:var(--muted)}#record-label{overflow-wrap:anywhere}dialog{border:1px solid var(--line);border-radius:5px;max-width:520px;width:calc(100% - 40px);padding:26px;color:var(--ink)}dialog::backdrop{background:rgb(24 38 56 / .35)}.dialog-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:22px}footer{font-size:12px;color:var(--muted);border-top:1px solid var(--line);margin-top:30px}.sr-only,.skip{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}.skip:focus{position:fixed;left:12px;top:12px;width:auto;height:auto;padding:10px;background:#fff;z-index:2}[hidden]{display:none!important}#message[data-error="true"]{color:#98272b;font-weight:600}@media(max-width:860px){header,main,footer{padding:22px}.workspace{grid-template-columns:1fr}.detail{border-left:0;border-top:1px solid var(--line);padding:24px 0 0}.pagination{flex-wrap:wrap}th,td{padding:10px 8px}}
`;

export const recoveryJs = String.raw`(() => {
  'use strict';
  // The capability lives only in this closure. Remove its fragment before any request.
  const capability = new URLSearchParams(window.location.hash.slice(1)).get('session') || '';
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  const byId = id => document.getElementById(id);
  const message = byId('message');
  const dialog = byId('confirm-dialog');
  const search = byId('search');
  const limit = 50;
  let offset = 0;
  let total = 0;
  let items = [];
  let selected = null;
  let restoring = false;
  let loading = false;
  let pendingRestore = null;
  let requestSequence = 0;

  const text = (id, value) => { byId(id).textContent = value; };
  const date = value => {
    if (!value) return 'Not recorded';
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : 'Not recorded';
  };
  const expired = item => {
    if (!item.restorationGuaranteedUntil) return false;
    const end = new Date(item.restorationGuaranteedUntil).getTime();
    return Number.isFinite(end) && end <= Date.now();
  };
  const sameItem = (a,b) => a && b && a.kind === b.kind && a.id === b.id;
  function status(value, error = false) {
    message.textContent = value;
    message.dataset.error = String(error);
  }
  function controls() {
    byId('refresh').disabled = loading || restoring || !capability;
    byId('previous').disabled = loading || restoring || offset === 0 || !capability;
    byId('next').disabled = loading || restoring || offset + limit >= total || !capability;
    search.disabled = loading || restoring || !capability;
    byId('restore').disabled = loading || restoring || !selected || selected.originalAvailable !== true;
  }
  async function api(path, options = {}) {
    let response;
    try { response = await fetch(path, {
      ...options, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { ...options.headers, 'X-Recovery-Capability': capability }
    }); } catch { throw new Error('Recovery request could not be sent.'); }
    if (!response.ok) throw new Error('Request failed (' + response.status + ').');
    try { return await response.json(); }
    catch { throw new Error('The server returned invalid JSON.'); }
  }
  function detail() {
    byId('selection-hint').hidden = Boolean(selected);
    byId('detail-body').hidden = !selected;
    if (!selected) { controls(); return; }
    text('record-label', selected.label || selected.id);
    text('record-id', selected.id);
    text('record-kind', selected.kind === 'edge' ? 'Edge' : 'Node');
    text('record-deleted', date(selected.deletedAt));
    text('record-guarantee', date(selected.restorationGuaranteedUntil));
    text('record-original', selected.originalAvailable === true ? 'Available' : 'Missing');
    text('guarantee-state', expired(selected) ? 'Guarantee period ended; recovery still available' : 'Within the guarantee period');
    const ids = selected.kind === 'node' ? selected.relatedMaskedEdgeIds : selected.maskedEndpointIds;
    text('dependencies-title', selected.kind === 'node' ? 'Related masked edges' : 'Masked endpoints');
    text('dependencies-explanation', selected.kind === 'node'
      ? 'Restoring this node does not restore separately masked edges.'
      : 'Restoring this edge can leave it hidden until its masked endpoints are restored.');
    const list = byId('dependency-ids');
    list.replaceChildren();
    for (const id of Array.isArray(ids) ? ids : []) {
      const entry = document.createElement('li'); entry.textContent = id; list.append(entry);
    }
    if (!list.childElementCount) {
      const entry = document.createElement('li'); entry.textContent = 'None recorded'; list.append(entry);
    }
    text('restore-reason', selected.originalAvailable === true
      ? 'Restore removes this record’s recovery marker.'
      : 'Original document is missing. Restore is unavailable.');
    text('restore', 'Restore ' + selected.kind);
    controls();
  }
  function render() {
    const body = byId('items'); body.replaceChildren();
    const term = search.value.trim().toLowerCase();
    const filtered = items.filter(item => [item.id, item.label, item.kind].some(value => String(value || '').toLowerCase().includes(term)));
    for (const item of filtered) {
      const row = document.createElement('tr');
      row.classList.toggle('selected', Boolean(sameItem(item, selected)));
      const cell = document.createElement('td');
      const button = document.createElement('button'); button.type = 'button'; button.className = 'record-button';
      button.setAttribute('aria-label', 'Inspect ' + item.kind + ' ' + item.id);
      button.setAttribute('aria-pressed', String(Boolean(sameItem(item, selected))));
      const id = document.createElement('span'); id.className = 'record-id'; id.textContent = item.id;
      const label = document.createElement('span'); label.className = 'record-label'; label.textContent = item.label || 'No label';
      button.append(id, label);
      button.addEventListener('click', () => { selected = item; render(); detail(); byId('detail-title').focus(); });
      cell.append(button); row.append(cell);
      for (const value of [item.kind, date(item.deletedAt), date(item.restorationGuaranteedUntil)]) {
        const field = document.createElement('td'); field.textContent = value; row.append(field);
      }
      body.append(row);
    }
    byId('empty').hidden = filtered.length > 0;
    text('empty', items.length && term ? 'No matching records on this page.' : 'No recovery items.');
    text('range', total === 0 ? '0 records' : (offset + 1) + '–' + Math.min(offset + items.length, total) + ' of ' + total);
    controls();
  }
  async function load(restoreMessage) {
    const sequence = ++requestSequence;
    loading = true; controls(); status('Loading recovery items…');
    try {
      const data = await api('/api/recovery/items?offset=' + offset + '&limit=' + limit);
      if (sequence !== requestSequence) return;
      if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total) || data.total < 0 || !data.target ||
          data.items.some(item => !item || typeof item.id !== 'string' || !['node','edge'].includes(item.kind))) {
        throw new Error('The server returned an invalid recovery list.');
      }
      total = data.total;
      if (offset > 0 && offset >= total) { offset = Math.max(0, Math.floor((total - 1) / limit) * limit); return await load(restoreMessage); }
      items = data.items;
      selected = items.find(item => sameItem(item, selected)) || null;
      text('target', 'Project: ' + String(data.target.projectId) + ' · Database: ' + String(data.target.databaseId));
      render(); detail();
      status(restoreMessage || (total ? 'Recovery items loaded. Select a record to inspect it.' : 'No recovery items.'));
    } catch (error) {
      if (sequence !== requestSequence) return;
      items = []; selected = null; total = 0; render(); detail();
      status((restoreMessage ? restoreMessage + ' Reload failed. ' : '') + error.message + ' Use Refresh to try again.', true);
    } finally {
      if (sequence === requestSequence) { loading = false; controls(); }
    }
  }
  search.addEventListener('input', render);
  byId('refresh').addEventListener('click', () => load());
  byId('previous').addEventListener('click', () => { offset = Math.max(0, offset-limit); selected = null; load(); });
  byId('next').addEventListener('click', () => { offset += limit; selected = null; load(); });
  byId('restore').addEventListener('click', () => {
    if (!selected || selected.originalAvailable !== true || loading || restoring) return;
    pendingRestore = { kind: selected.kind, id: selected.id };
    text('confirm-description', 'Restore ' + selected.kind + ' “' + selected.id + '”?');
    dialog.showModal(); byId('cancel').focus();
  });
  byId('cancel').addEventListener('click', () => { pendingRestore = null; dialog.close(); });
  dialog.addEventListener('cancel', () => { pendingRestore = null; });
  dialog.addEventListener('close', () => {
    if (selected) (byId('restore').disabled ? byId('detail-title') : byId('restore')).focus();
  });
  byId('confirm').addEventListener('click', async () => {
    if (!pendingRestore || restoring) return;
    const record = pendingRestore; pendingRestore = null;
    restoring = true; dialog.close(); controls(); status('Restoring ' + record.kind + '…');
    try {
      const result = await api('/api/recovery/restore', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record)
      });
      if (result.id !== record.id || result.kind !== record.kind || typeof result.visible !== 'boolean' || !['restored','already-visible','absent'].includes(result.outcome)) {
        throw new Error('The server returned an invalid restoration result.');
      }
      const outcome = result.outcome === 'restored' ? 'Restored' : 'Recovery marker already cleared for';
      const state = result.visible ? ' The record is visible.' : record.kind === 'edge'
        ? ' The edge remains hidden until its masked endpoints are restored.'
        : ' The node remains hidden by another recovery marker.';
      await load(result.outcome === 'absent'
        ? 'Original document is missing; restoration was not performed for ' + record.kind + ' “' + record.id + '”.'
        : outcome + ' ' + record.kind + ' “' + record.id + '”.' + state);
    } catch (error) { status(error.message + ' Refresh the list before trying again.', true); }
    finally { restoring = false; controls(); }
  });
  if (!capability) {
    status('Session capability missing. Open the local console URL provided by the operator server.', true);
    text('empty', 'Recovery data is unavailable without an operator session.'); byId('empty').hidden = false;
    loading = false; controls();
  } else { load(); }
})();`;
