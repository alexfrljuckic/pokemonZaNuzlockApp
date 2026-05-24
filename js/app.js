import { applyState, localLoad } from './state.js?v=1';
import {
  sync, loadSyncMeta, pullFromCloud, setSyncStatus, lockUI,
  syncAction, doSetupSync, cancelSetup, copyShareUrl,
} from './sync.js?v=1';
import * as zones from './zones.js?v=1';
import * as team from './team.js?v=1';
import * as bosses from './bosses.js?v=1';
import * as rules from './rules.js?v=1';
import * as stats from './stats.js?v=1';

const VIEW_REFRESH_MS = 60000;

function render() {
  zones.renderZones();
  team.renderTeam();
  bosses.renderBosses();
  rules.renderRules();
  stats.renderStats();
}

function showTab(tab, el) {
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.getElementById(tab).classList.add('on');
  el.classList.add('on');
  render();
}

// ---- Click dispatch ----

const actions = {
  // Nav & tabs
  'show-tab': (el) => showTab(el.dataset.tab, el),

  // Zones
  'roll-all': () => zones.rollAll(),
  'set-zone-filter': (el) => zones.setZFilter(el.dataset.filter, el),
  'reset-all-zones': () => zones.resetAllZones(),
  'open-zone': (el) => zones.openZone(el.dataset.id),
  'do-roll': (el) => zones.doRoll(el.dataset.id),
  'reroll-z': (el) => zones.rerollZ(el.dataset.id),
  'clear-roll': (el) => zones.clearRoll(el.dataset.id),
  'clear-outcome': (el) => zones.clearOutcome(el.dataset.id),
  'confirm-catch': (el) => zones.confirmCatch(el.dataset.id, el.dataset.poke),
  'set-zs': (el) => zones.setZS(el.dataset.id, el.dataset.status),
  'reset-this-zone': () => zones.resetThisZone(),
  'close-mo': (el) => zones.closeMo(el.dataset.modal),

  // Sync
  'sync-action': () => syncAction(),
  'do-setup-sync': () => doSetupSync(),
  'cancel-setup': () => cancelSetup(),
  'copy-share-url': () => copyShareUrl(),

  // Team
  'faint-p': (el) => team.faintP(parseInt(el.dataset.i, 10)),
  'heal-fnt': (el) => team.healFnt(parseInt(el.dataset.i, 10)),
  'to-box': (el) => team.toBox(parseInt(el.dataset.i, 10)),
  'to-pty': (el) => team.toPty(parseInt(el.dataset.i, 10)),
  'rm-box': (el) => team.rmBox(parseInt(el.dataset.i, 10)),
  'revive-poke': (el) => team.revivePoke(parseInt(el.dataset.i, 10)),
  'ch-rv': (el) => team.chRv(parseInt(el.dataset.delta, 10)),
  'add-pokemon': () => team.addPokemon(),
  'focus-add': () => team.focusAdd(),
  'ac-pick': (el) => team.acPick(el.dataset.poke),
  'edit-poke': (el) => team.openEdit(el.dataset.source, parseInt(el.dataset.i, 10)),
  'save-edit': () => team.saveEdit(),

  // Bosses
  'toggle-boss': (el) => bosses.toggleBoss(el.dataset.id),
  'set-b-sort': (el) => bosses.setBSort(el.dataset.sort, el),
  'set-cap': (el) => bosses.setCap(el.dataset.cap),

  // Rules
  'toggle-opt': (el) => rules.toggleOpt(el.dataset.id),

  // Stats
  'reset-run': () => stats.resetRun(),
};

document.addEventListener('click', (e) => {
  // Close modal when background (the .mo overlay) is clicked
  if (e.target.classList.contains('mo')) {
    e.target.classList.remove('on');
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el, e);
});

// Autocomplete input/focus/blur (delegated)
document.addEventListener('input', (e) => {
  if (e.target.id === 'ns') team.acInput(e.target);
});
document.addEventListener('focusin', (e) => {
  if (e.target.id === 'ns') team.acInput(e.target);
});
document.addEventListener('focusout', (e) => {
  if (e.target.id === 'ns') team.acBlur();
});

// ---- Boot ----

async function load() {
  const params = new URLSearchParams(location.search);
  const viewBin = params.get('view');

  if (viewBin) {
    sync.isViewMode = true;
    document.getElementById('hd-sub').textContent = 'Nuzlocke Tracker · Read-only view';
    document.getElementById('sync-bar').className = 'sync-bar view-mode';
    document.getElementById('sync-bar').style.display = 'flex';
    document.getElementById('sync-action-btn').style.display = 'none';
    setSyncStatus('busy', 'Loading run...', false);
    const data = await pullFromCloud(viewBin, '');
    if (data) {
      applyState(data);
      setSyncStatus('ok', 'Live view · auto-refreshes every 60s', false);
    } else {
      setSyncStatus('err', 'Could not load — check the link', false);
    }
    lockUI();
    setInterval(async () => {
      const d = await pullFromCloud(viewBin, '');
      if (d) { applyState(d); render(); }
    }, VIEW_REFRESH_MS);
    render();
    return;
  }

  loadSyncMeta();
  const local = localLoad();
  if (local) applyState(local);
  document.getElementById('sync-bar').style.display = 'flex';
  if (sync.binId && sync.masterKey) {
    setSyncStatus('ok', 'Cloud sync on · friends can view', true);
    document.getElementById('sync-action-btn').textContent = 'Manage';
  } else {
    setSyncStatus('off', 'Not synced — tap to share with friends', false);
  }
  render();
}

load();
