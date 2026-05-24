import { ZD, BD } from './data.js';
import { state, save } from './state.js';
import { sync } from './sync.js';
import { renderZones } from './zones.js';
import { renderTeam } from './team.js';
import { renderBosses } from './bosses.js';

let notesBound = false;

export function renderStats() {
  const caught = Object.values(state.zs).filter(s => s.caught).length;
  const done = Object.values(state.zs).filter(s => s.caught || s.visited || s.skipped).length;
  const rolled = Object.values(state.zs).filter(s => s.rolled || s.caught || s.visited || s.skipped).length;
  const tot = state.party.length + state.box.length + state.dead.length;
  const surv = tot > 0 ? Math.round(((state.party.length + state.box.length) / tot) * 100) : 100;
  const bBeaten = BD.filter(b => state.bossBeaten[b.id]).length;

  document.getElementById('stats-grid').innerHTML =
    '<div class="stb"><div class="stl">Zones done</div><div class="stv">' + done + '</div></div>' +
    '<div class="stb"><div class="stl">Caught</div><div class="stv">' + caught + '</div></div>' +
    '<div class="stb"><div class="stl">Party</div><div class="stv">' + state.party.length + '</div></div>' +
    '<div class="stb"><div class="stl">Fallen</div><div class="stv" style="color:' + (state.dead.length > 0 ? 'var(--red)' : 'var(--tx)') + '">' + state.dead.length + '</div></div>';

  const bars = [
    { l: 'Zones assigned', v: rolled, t: ZD.length, c: 'var(--pur)' },
    { l: 'Zones completed', v: done, t: ZD.length, c: 'var(--grn)' },
    { l: 'Bosses defeated', v: bBeaten, t: BD.length, c: 'var(--amb)' },
    { l: 'Survival rate', v: surv, t: 100, c: 'var(--blu)', pct: true },
  ];
  document.getElementById('stat-bars').innerHTML = bars.map(b =>
    '<div class="pw"><div class="pl"><span>' + b.l + '</span>' +
    '<strong>' + (b.pct ? b.v + '%' : b.v + ' / ' + b.t) + '</strong></div>' +
    '<div class="ptr"><div class="pf" style="width:' + Math.round(b.pct ? b.v : b.v / b.t * 100) + '%;background:' + b.c + '"></div></div></div>'
  ).join('');

  const n = document.getElementById('run-notes');
  if (n && !notesBound) {
    notesBound = true;
    n.value = state.notes;
    n.addEventListener('input', () => { state.notes = n.value; save(); });
  }
}

export function resetRun() {
  if (sync.isViewMode) return;
  if (!confirm('Reset the ENTIRE run? This deletes all zones, team, box, bosses, revives, and notes.')) return;
  if (!confirm('Are you sure? This cannot be undone.')) return;
  state.zs = {};
  state.party = [];
  state.box = [];
  state.dead = [];
  state.bossBeaten = {};
  state.revives = 0;
  state.notes = '';
  const n = document.getElementById('run-notes');
  if (n) n.value = '';
  save();
  renderZones();
  renderTeam();
  renderBosses();
  renderStats();
}
