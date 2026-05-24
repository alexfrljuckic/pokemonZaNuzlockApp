import { stateObj } from './state.js';

const JBURL = 'https://api.jsonbin.io/v3/b';
const SYNC_META_KEY = 'nuzlocke_za_sync';

export const sync = {
  binId: null,
  masterKey: null,
  isViewMode: false,
  timer: null,
};

export function loadSyncMeta() {
  const raw = localStorage.getItem(SYNC_META_KEY);
  if (!raw) return;
  try {
    const m = JSON.parse(raw);
    sync.binId = m.binId;
    sync.masterKey = m.masterKey;
  } catch (e) {}
}

export function scheduleSync(data) {
  if (sync.isViewMode || !sync.binId || !sync.masterKey) return;
  clearTimeout(sync.timer);
  sync.timer = setTimeout(() => pushToCloud(data), 1500);
  setSyncStatus('busy', 'Saving...', false);
}

export async function pushToCloud(data) {
  try {
    const r = await fetch(JBURL + '/' + sync.binId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': sync.masterKey },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(r.status);
    setSyncStatus('ok', 'Synced · friends can see your run', true);
  } catch (e) {
    setSyncStatus('err', 'Sync failed · saved locally', true);
  }
}

export async function pullFromCloud(id, key) {
  setSyncStatus('busy', 'Loading...', false);
  try {
    const headers = { 'X-Access-Key': key || '' };
    if (sync.masterKey) headers['X-Master-Key'] = sync.masterKey;
    const r = await fetch(JBURL + '/' + id + '/latest', { headers });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    return j.record;
  } catch (e) { return null; }
}

export function setSyncStatus(state, msg, showShare) {
  const dot = document.getElementById('sync-dot');
  const lbl = document.getElementById('sync-label');
  const bar = document.getElementById('sync-bar');
  if (!dot) return;
  dot.className = 'sync-dot ' + state;
  lbl.innerHTML = msg;
  bar.style.display = 'flex';
  if (showShare && sync.binId && !sync.isViewMode) {
    const url = location.href.split('?')[0] + '?view=' + sync.binId;
    document.getElementById('share-url-text').textContent = url;
    document.getElementById('share-url-box').style.display = 'block';
  }
}

export function syncAction() {
  const setup = document.getElementById('sync-setup');
  const showing = setup.style.display !== 'none';
  if (showing) { setup.style.display = 'none'; return; }
  const msg = document.getElementById('sync-setup-msg');
  if (sync.binId && sync.masterKey) {
    msg.innerHTML = 'Connected to bin <code>' + sync.binId + '</code>. Paste a new key to reconnect, or leave blank and click Connect to disconnect.<br><br>Your friends’ share link:';
    const url = location.href.split('?')[0] + '?view=' + sync.binId;
    document.getElementById('sync-bin-input').value = '';
    document.getElementById('share-url-text').textContent = url;
    document.getElementById('share-url-box').style.display = 'block';
  } else {
    msg.textContent = 'To sync, you need a free JSONBin.io account. Create one at jsonbin.io, copy your Master Key from the API Keys page, and paste it below. A bin will be created automatically.';
    document.getElementById('sync-bin-input').value = '';
    document.getElementById('share-url-box').style.display = 'none';
  }
  setup.style.display = 'block';
  document.getElementById('sync-bin-input').focus();
}

export async function doSetupSync() {
  const key = document.getElementById('sync-bin-input').value.trim();
  if (!key) {
    sync.binId = null;
    sync.masterKey = null;
    localStorage.removeItem(SYNC_META_KEY);
    setSyncStatus('off', 'Not synced — offline only', false);
    document.getElementById('sync-action-btn').textContent = 'Set up';
    cancelSetup();
    return;
  }
  setSyncStatus('busy', 'Creating bin...', false);
  cancelSetup();
  try {
    const r = await fetch(JBURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': key,
        'X-Bin-Name': 'ZA Nuzlocke',
        'X-Bin-Private': 'false',
      },
      body: JSON.stringify(stateObj()),
    });
    if (!r.ok) throw new Error('Bad key or network error (' + r.status + ')');
    const j = await r.json();
    sync.binId = j.metadata.id;
    sync.masterKey = key;
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ binId: sync.binId, masterKey: sync.masterKey }));
    const url = location.href.split('?')[0] + '?view=' + sync.binId;
    document.getElementById('share-url-text').textContent = url;
    document.getElementById('share-url-box').style.display = 'block';
    document.getElementById('sync-setup').style.display = 'block';
    document.getElementById('sync-setup-msg').textContent = 'All set! Share this link with friends:';
    document.getElementById('sync-bin-input').value = '';
    setSyncStatus('ok', 'Synced · share link ready', true);
    document.getElementById('sync-action-btn').textContent = 'Manage';
  } catch (e) {
    setSyncStatus('err', 'Setup failed: ' + e.message, false);
  }
}

export function cancelSetup() {
  document.getElementById('sync-setup').style.display = 'none';
}

export function copyShareUrl() {
  const url = document.getElementById('share-url-text').textContent;
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(url).then(() => {
    const b = document.getElementById('share-url-box');
    const orig = b.querySelector('strong').textContent;
    b.querySelector('strong').textContent = 'Copied!';
    setTimeout(() => { b.querySelector('strong').textContent = orig; }, 1500);
  });
}

export function lockUI() {
  const s = document.createElement('style');
  s.id = 'view-lock';
  s.textContent = `
    .view-lock-block, .view-lock-block *{pointer-events:none !important;cursor:default !important;}
    .nb{pointer-events:auto !important;cursor:pointer !important;}
  `;
  document.head.appendChild(s);
  document.querySelectorAll('button,input,textarea,.zi,.bi,.pt,.ps,.bck,.ztab,.btab,.sb,.rall').forEach(el => {
    el.classList.add('view-lock-block');
  });
  document.querySelectorAll('.nb').forEach(el => el.classList.remove('view-lock-block'));
}
