import { BD } from './data.js?v=1';
import { state, save } from './state.js?v=1';
import { sync } from './sync.js?v=1';
import { renderTeam } from './team.js?v=1';
import { renderStats } from './stats.js?v=1';

export function toggleBoss(id) {
  if (sync.isViewMode) return;
  const wasBeaten = !!state.bossBeaten[id];
  state.bossBeaten[id] = !wasBeaten;
  const b = BD.find(b => b.id === id);
  if (b && (b.cat === 'Promotion Matches' || b.cat === 'Rogue Mega Battles')) {
    if (!wasBeaten) state.revives++;
    else state.revives = Math.max(0, state.revives - 1);
    renderTeam();
  }
  save();
  renderBosses();
  renderStats();
}

export function setBSort(s, el) {
  state.bSort = s;
  document.querySelectorAll('.btab').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  save();
  renderBosses();
}

export function setCap(m) {
  state.capMode = m;
  save();
  renderBosses();
}

function bossRow(b) {
  const done = !!state.bossBeaten[b.id];
  let cp = '';
  if (state.capMode !== 'none') {
    const l = state.capMode === 'strict' ? b.ace - 1 : b.ace;
    const cl = l <= 24 ? 'cplo' : l <= 47 ? 'cpmi' : 'cphi';
    cp = '<span class="cp ' + cl + '">Cap Lv.' + l + '</span>';
  }
  return '<div class="bi' + (done ? ' dn' : '') + '">' +
    '<button class="bck' + (done ? ' on' : '') + '" data-action="toggle-boss" data-id="' + b.id + '">' + (done ? '✓' : '') + '</button>' +
    '<div class="bif">' +
    '<div class="bhr"><span class="brk ' + b.rkc + '">' + b.rk + '</span>' +
    '<span class="bn">' + b.n + '</span>' + cp + '</div>' +
    '<div class="btm">' + b.team + (b.mega ? ' <span style="color:var(--pur)">· Mega</span>' : '') + '</div>' +
    '<div class="bts">M' + b.ms + ' · ' + b.type + '</div>' +
    (b.note ? '<div class="btp">' + b.note + '</div>' : '') +
    '</div></div>';
}

export function renderBosses() {
  ['strict', 'loose', 'none'].forEach(m => {
    const btn = document.getElementById('cap-' + m);
    if (!btn) return;
    btn.style.background = state.capMode === m ? 'var(--bb)' : 'none';
    btn.style.color = state.capMode === m ? 'var(--blu)' : 'var(--t3)';
    btn.style.borderColor = state.capMode === m ? 'rgba(107,133,245,.25)' : 'var(--bd)';
  });

  const total = BD.length;
  const beaten = BD.filter(b => state.bossBeaten[b.id]).length;
  document.getElementById('bpnum').textContent = beaten + ' / ' + total;
  document.getElementById('bpbar').style.width = Math.round(beaten / total * 100) + '%';

  let sorted = [...BD];
  if (state.bSort === 'level') sorted.sort((a, b) => a.ace - b.ace);
  else if (state.bSort === 'story') sorted.sort((a, b) => a.ms - b.ms || a.ace - b.ace);
  else if (state.bSort === 'todo') sorted = sorted.filter(b => !state.bossBeaten[b.id]).sort((a, b) => a.ms - b.ms);

  let lastCat = '', h = '';
  if (state.bSort === 'cat') {
    const cats = [...new Set(BD.map(b => b.cat))];
    cats.forEach(cat => {
      h += '<div class="bcat">' + cat + '</div>';
      BD.filter(b => b.cat === cat).forEach(b => { h += bossRow(b); });
    });
  } else if (state.bSort === 'level') {
    h = '<div class="bcat">Sorted by ace level (lowest first)</div>';
    sorted.forEach(b => { h += bossRow(b); });
  } else {
    sorted.forEach(b => {
      if (b.cat !== lastCat && state.bSort === 'story') {
        h += '<div class="bcat">Mission ' + b.ms + (b.cat ? ' · ' + b.cat : '') + '</div>';
        lastCat = b.cat;
      } else if (state.bSort === 'todo' && !lastCat) {
        h += '<div class="bcat">Remaining bosses in story order</div>';
        lastCat = 'set';
      }
      h += bossRow(b);
    });
    if (state.bSort === 'todo' && !sorted.length) h = '<div class="es">All bosses defeated!</div>';
  }

  document.getElementById('bosses-list').innerHTML = h;
}
