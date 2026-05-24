import { ZD } from './data.js?v=1';
import { state, save } from './state.js?v=1';
import { sync } from './sync.js?v=1';
import { renderTeam } from './team.js?v=1';
import { renderStats } from './stats.js?v=1';

let czid = null;

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function rollForZone(id) {
  const z = ZD.find(z => String(z.id) === String(id));
  if (!z) return;
  const owned = new Set([
    ...state.party.map(p => p.species),
    ...state.box.map(p => p.species),
    ...state.dead.map(p => p.species),
  ]);
  let pool = z.p.filter(x => !owned.has(x.n));
  if (!pool.length) pool = z.p;
  if (!state.zs[id]) state.zs[id] = {};
  state.zs[id].assigned = rnd(pool).n;
  state.zs[id].rolled = true;
  save();
}

export function rollAll() {
  if (sync.isViewMode) return;
  ZD.forEach(z => {
    const st = state.zs[z.id] || {};
    if (!st.rolled && !st.caught && !st.visited && !st.skipped) rollForZone(z.id);
  });
  renderZones();
}

export function setZFilter(f, el) {
  state.zFilter = f;
  document.querySelectorAll('.ztab').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  save();
  renderZones();
}

export function resetThisZone() {
  if (sync.isViewMode) return;
  if (!czid) return;
  const z = ZD.find(z => String(z.id) === String(czid));
  if (!confirm('Reset ' + (z ? z.n : 'this zone') + '? Clears the roll and outcome.')) return;
  delete state.zs[czid];
  save();
  closeMo('zone-mo');
  renderZones();
  renderStats();
}

export function resetAllZones() {
  if (sync.isViewMode) return;
  if (confirm('Reset ALL zones? This clears every roll and outcome but keeps your team and bosses.')) {
    state.zs = {};
    save();
    renderZones();
    renderStats();
  }
}

export function renderZones() {
  const rolled = Object.values(state.zs).filter(s => s.rolled || s.caught || s.visited || s.skipped).length;
  const done = Object.values(state.zs).filter(s => s.caught || s.visited || s.skipped).length;
  document.getElementById('roll-prog').textContent = rolled + ' assigned · ' + done + ' completed of ' + ZD.length + ' total';

  let visible = ZD;
  if (state.zFilter === 'main') visible = ZD.filter(z => z.cat === 'main');
  else if (state.zFilter === 'special') visible = ZD.filter(z => z.cat === 'special');
  else if (state.zFilter === 'hyper') visible = ZD.filter(z => z.cat === 'hyper');
  else if (state.zFilter === 'rolled') visible = ZD.filter(z => {
    const s = state.zs[z.id] || {};
    return s.rolled && !s.caught && !s.visited && !s.skipped;
  });
  else if (state.zFilter === 'done') visible = ZD.filter(z => {
    const s = state.zs[z.id] || {};
    return s.caught || s.visited || s.skipped;
  });

  document.getElementById('zones-list').innerHTML = visible.map(z => {
    const st = state.zs[z.id] || {};
    let nc = '', badge = '', sub = '';
    const sptag = z.cat !== 'main' ? '<span class="spe-tag">' + (z.cat === 'hyper' ? 'DLC' : 'Gift') + '</span>' : '';
    if (st.caught) { nc = 'zc'; badge = '<span class="zbg c">Caught</span>'; sub = st.caughtPoke || st.assigned || '?'; }
    else if (st.visited) { nc = 'zv'; badge = '<span class="zbg v">Failed</span>'; sub = st.assigned ? 'Was: ' + st.assigned : 'No catch'; }
    else if (st.skipped) { nc = 'zs'; badge = '<span class="zbg s">Skipped</span>'; sub = st.assigned || '-'; }
    else if (st.rolled && st.assigned) { nc = 'za'; badge = '<span class="zbg a">' + st.assigned + '</span>'; sub = 'Assigned — not entered'; }
    else {
      nc = '';
      const label = sync.isViewMode ? 'View' : (String(z.id) === 's0' ? 'Choose' : 'Roll');
      badge = '<span class="zbg p">' + label + '</span>';
      sub = z.u === 'Post-game' ? 'Post-game' : (z.u === 'Start' ? 'Not visited' : 'After ' + z.u);
    }
    const numDisp = z.cat === 'main' ? z.id : (z.cat === 'special' ? 'S' : 'H');
    return '<div class="zi" data-action="open-zone" data-id="' + z.id + '">' +
      '<div class="znum ' + nc + '">' + numDisp + '</div>' +
      '<div class="zinf"><div class="znm">' + z.n + sptag + ' <span style="font-size:11px;color:var(--t3)">Lv.' + z.lv + '</span></div>' +
      '<div class="zsb">' + sub + '</div></div>' + badge + '</div>';
  }).join('') || '<div class="es">No zones in this filter</div>';
}

function pokeTile(id, p, st, interactive) {
  const cls = st.caughtPoke === p.n ? ' cau' : (st.assigned === p.n && !st.caught ? ' tgt' : '');
  const action = interactive ? ' data-action="confirm-catch" data-id="' + id + '" data-poke="' + p.n + '"' : '';
  const lv = p.lv ? ' <span class="pt-lv">Lv ' + p.lv + '</span>' : '';
  const star = st.assigned === p.n && !st.caught ? ' ★' : '';
  return '<div class="pt' + cls + '"' + action + '>' + p.n + lv + star + '</div>';
}

export function openZone(id) {
  const z = ZD.find(z => String(z.id) === String(id));
  if (!z) return;
  czid = id;
  const st = state.zs[id] || {};
  const viewMode = sync.isViewMode;

  document.getElementById('zm-t').textContent = z.n + ' (Lv.' + z.lv + ')';
  const subParts = [z.a, z.u, z.note].filter(Boolean);
  document.getElementById('zm-s').textContent = subParts.join(' · ');

  // Roll / outcome status box — hidden in view mode
  const rEl = document.getElementById('zm-r');
  if (viewMode) {
    rEl.innerHTML = '';
  } else {
    let rh = '';
    const isChoiceZone = z.p && z.p.length <= 4 && z.cat === 'special' && !z.note?.includes('Gift') && String(id) === 's0';
    if (st.caught || st.visited || st.skipped) {
      const lbl = st.caught ? 'Caught: ' + (st.caughtPoke || st.assigned) : (st.visited ? 'Visited — no catch' : 'Skipped');
      rh = '<div class="rb"><div class="rtar" style="color:var(--t2);font-size:15px">' + lbl + '</div>' +
        '<button class="btn brd" style="margin-top:10px;width:100%" data-action="clear-outcome" data-id="' + id + '">Retry / clear outcome</button></div>';
    } else if (isChoiceZone) {
      rh = '<div class="rb"><div class="rdsc">Tap your starter below to record your choice</div></div>';
    } else if (st.rolled && st.assigned) {
      rh = '<div class="rb"><div style="font-size:10px;color:var(--t3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Your target</div>' +
        '<div class="rtar">' + st.assigned + '</div>' +
        '<div class="rdsc">Only this Pokemon may be legally caught in this zone</div>' +
        '<div class="ract">' +
        (!st.rerolled
          ? '<button class="btn bpu" style="flex:1" data-action="reroll-z" data-id="' + id + '">↺ Reroll (once)</button>'
          : '<span style="font-size:11px;color:var(--t3)">Reroll used</span>') +
        '<button class="btn" data-action="clear-roll" data-id="' + id + '">Clear roll</button></div></div>';
    } else {
      rh = '<button class="btn bpu bfw" data-action="do-roll" data-id="' + id + '">🎲 Roll my encounter for this zone</button>';
    }
    rEl.innerHTML = rh;
  }

  // Outcome row — hidden in view mode
  const stEl = document.getElementById('zm-st');
  const stLblEl = document.getElementById('zm-st-label');
  if (viewMode) {
    stEl.innerHTML = '';
    if (stLblEl) stLblEl.style.display = 'none';
  } else {
    if (stLblEl) stLblEl.style.display = '';
    stEl.innerHTML =
      '<button class="btn bam" data-action="set-zs" data-id="' + id + '" data-status="visited" style="' + (st.visited && !st.caught ? 'background:var(--ab)' : '') + '">Failed</button>' +
      '<button class="btn bgn" data-action="set-zs" data-id="' + id + '" data-status="caught" style="' + (st.caught ? 'background:var(--gb)' : '') + '">Caught!</button>' +
      '<button class="btn brd" data-action="set-zs" data-id="' + id + '" data-status="skipped" style="' + (st.skipped ? 'background:var(--rb)' : '') + '">Skipped</button>';
  }

  // Wild spawns
  document.getElementById('zm-pk-label').textContent = z.cat === 'hyper' ? 'Available in this zone' : 'Wild spawns';
  document.getElementById('zm-pk').innerHTML = z.p.map(p => pokeTile(id, p, st, !viewMode)).join('');

  // Alpha section (only when present)
  const alphaEl = document.getElementById('zm-alphas');
  if (z.alphas && z.alphas.length) {
    alphaEl.innerHTML =
      '<div class="msl">★ Guaranteed Alpha encounters</div>' +
      '<div class="pgr">' +
        z.alphas.map(a => '<div class="pt alpha-pt">' + a.n + (a.lv && a.lv !== '?' ? ' <span class="pt-lv">Lv ' + a.lv + '</span>' : '') + '</div>').join('') +
      '</div>' +
      '<div class="alpha-note">All wild spawns also have ~5% chance to appear as an Alpha (~10 levels higher)</div>';
  } else {
    alphaEl.innerHTML = '';
  }

  // Bottom action row — only Done in view mode
  const footEl = document.getElementById('zm-foot');
  if (viewMode) {
    footEl.innerHTML = '<button class="btn bbl bfw" data-action="close-mo" data-modal="zone-mo">Done</button>';
  } else {
    footEl.innerHTML =
      '<div style="display:flex;gap:8px">' +
      '<button class="btn brd" style="flex:1" data-action="reset-this-zone">Reset zone</button>' +
      '<button class="btn bbl" style="flex:2" data-action="close-mo" data-modal="zone-mo">Done</button>' +
      '</div>';
  }

  document.getElementById('zone-mo').classList.add('on');
}

export function doRoll(id) { if (sync.isViewMode) return; rollForZone(id); openZone(id); renderZones(); }

export function rerollZ(id) {
  if (sync.isViewMode) return;
  if ((state.zs[id] || {}).rerolled) { alert('Only one reroll per zone.'); return; }
  if (!state.zs[id]) state.zs[id] = {};
  state.zs[id].rerolled = true;
  rollForZone(id);
  openZone(id);
  renderZones();
}

export function clearRoll(id) {
  if (sync.isViewMode) return;
  if (!state.zs[id]) return;
  state.zs[id].assigned = null;
  state.zs[id].rolled = false;
  state.zs[id].rerolled = false;
  save();
  openZone(id);
  renderZones();
}

export function clearOutcome(id) {
  if (sync.isViewMode) return;
  if (!state.zs[id]) state.zs[id] = {};
  state.zs[id].caught = false;
  state.zs[id].visited = false;
  state.zs[id].skipped = false;
  state.zs[id].caughtPoke = null;
  state.zs[id].rerolled = false;
  save();
  openZone(id);
  renderZones();
  renderStats();
}

function autoAddCatch(id, poke) {
  if (!poke) return;
  const z = ZD.find(z => String(z.id) === String(id));
  const zoneKey = z ? (z.cat === 'main' ? 'Zone ' + String(id) : z.n) : ('Zone ' + String(id));
  const alreadyAdded = [...state.party, ...state.box, ...state.dead].some(p => String(p.zone) === zoneKey);
  if (alreadyAdded) return;
  const np = { species: poke, nick: poke, level: z ? z.lv : '?', zone: zoneKey, fainted: false };
  if (state.party.length < 6) state.party.push(np);
  else state.box.push(np);
  save();
}

export function confirmCatch(id, poke) {
  if (sync.isViewMode) return;
  if (!state.zs[id]) state.zs[id] = {};
  const st = state.zs[id];
  if (st.assigned && st.assigned !== poke && !st.caught) {
    if (!confirm('Target is ' + st.assigned + '. Mark ' + poke + ' caught anyway? (Rule violation unless a clause applies.)')) return;
  }
  state.zs[id].caughtPoke = poke;
  state.zs[id].caught = true;
  state.zs[id].visited = false;
  state.zs[id].skipped = false;
  save();
  autoAddCatch(id, poke);
  openZone(id);
  renderZones();
  renderTeam();
  renderStats();
}

export function setZS(id, status) {
  if (sync.isViewMode) return;
  if (!state.zs[id]) state.zs[id] = {};
  const wasCaught = state.zs[id].caught;
  const assignedPoke = state.zs[id].caughtPoke || state.zs[id].assigned;
  state.zs[id].visited = status === 'visited';
  state.zs[id].caught = status === 'caught';
  state.zs[id].skipped = status === 'skipped';
  if (status !== 'caught') state.zs[id].caughtPoke = null;
  else if (!state.zs[id].caughtPoke && assignedPoke) state.zs[id].caughtPoke = assignedPoke;
  save();
  if (status === 'caught' && !wasCaught && assignedPoke) autoAddCatch(id, assignedPoke);
  openZone(id);
  renderZones();
  renderTeam();
  renderStats();
}

export function closeMo(id) { document.getElementById(id).classList.remove('on'); }
