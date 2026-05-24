import { POKE_DEDUP } from './data.js?v=1';
import { state, save } from './state.js?v=1';
import { sync } from './sync.js?v=1';
import { renderStats } from './stats.js?v=1';

let acTimeout = null;

export function renderTeam() {
  const ps = [...state.party];
  while (ps.length < 6) ps.push(null);
  document.getElementById('pty-cnt').textContent = '(' + state.party.length + '/6)';
  document.getElementById('box-cnt').textContent = '(' + state.box.length + ')';

  document.getElementById('party-grid').innerHTML = ps.map((p, i) => {
    if (!p) return '<div class="ps emp" data-action="focus-add"><div class="el">+ Empty</div></div>';
    return '<div class="ps' + (p.fainted ? ' fnt' : '') + '">' +
      '<div class="ss">' + p.species + '</div>' +
      '<div class="sn">&quot;' + p.nick + '&quot;</div>' +
      '<div class="sm">Lv.' + p.level + ' · ' + p.zone + '</div>' +
      (p.fainted ? '<div class="fb">FAINTED</div>' : '') +
      '<div class="sa">' +
      '<button class="sb" data-action="edit-poke" data-source="party" data-i="' + i + '">Edit</button>' +
      (!p.fainted
        ? '<button class="sb fnt" data-action="faint-p" data-i="' + i + '">Faint</button>'
        : '<button class="sb hl" data-action="heal-fnt" data-i="' + i + '">Heal</button>') +
      '<button class="sb tbx" data-action="to-box" data-i="' + i + '">Box</button>' +
      '</div></div>';
  }).join('');

  document.getElementById('box-grid').innerHTML = state.box.length
    ? state.box.map((p, i) =>
        '<div class="ps bx">' +
        '<div class="ss">' + p.species + '</div>' +
        '<div class="sn">&quot;' + p.nick + '&quot;</div>' +
        '<div class="sm">Lv.' + p.level + ' · ' + p.zone + '</div>' +
        '<div class="sa">' +
        '<button class="sb" data-action="edit-poke" data-source="box" data-i="' + i + '">Edit</button>' +
        '<button class="sb tpy" data-action="to-pty" data-i="' + i + '"' + (state.party.length >= 6 ? ' disabled style="opacity:.35"' : '') + '>Party</button>' +
        '<button class="sb rm" data-action="rm-box" data-i="' + i + '">Remove</button>' +
        '</div></div>'
      ).join('')
    : '<div class="es">Box is empty</div>';

  document.getElementById('rv-cnt').textContent = state.revives;
  document.getElementById('rv-lbl').textContent = '(' + state.revives + ' available)';

  document.getElementById('rvbl-list').innerHTML = state.dead.length
    ? state.dead.map((p, i) =>
        '<div class="dr">' +
        '<span class="dnm">' + p.species + ' &quot;' + p.nick + '&quot;</span>' +
        '<span class="dzn">' + p.zone + '</span>' +
        '<button class="rvbtn" data-action="revive-poke" data-i="' + i + '">Revive</button>' +
        '</div>'
      ).join('')
    : '<div class="es">No fallen Pokemon</div>';

  document.getElementById('grave-cnt').textContent = '(' + state.dead.length + ')';
  document.getElementById('dead-list').innerHTML = state.dead.length
    ? state.dead.map(p =>
        '<div class="dr">' +
        '<span class="dnm">' + p.species + ' &quot;' + p.nick + '&quot;</span>' +
        '<span class="dzn">' + p.zone + '</span>' +
        '</div>'
      ).join('')
    : '<div class="es">No fallen Pokemon — keep it that way</div>';
}

export function faintP(i) {
  if (sync.isViewMode) return;
  const p = state.party[i];
  p.fainted = true;
  state.dead.push(p);
  state.party.splice(i, 1);
  save();
  renderTeam();
  renderStats();
}

export function healFnt(i) {
  if (sync.isViewMode) return;
  state.party[i].fainted = false;
  save();
  renderTeam();
}

export function toBox(i) {
  if (sync.isViewMode) return;
  if (state.box.length >= 30) { alert('Box full (30 max).'); return; }
  state.box.push(state.party[i]);
  state.party.splice(i, 1);
  save();
  renderTeam();
}

export function toPty(i) {
  if (sync.isViewMode) return;
  if (state.party.length >= 6) { alert('Party full!'); return; }
  state.party.push(state.box[i]);
  state.box.splice(i, 1);
  save();
  renderTeam();
}

export function rmBox(i) {
  if (sync.isViewMode) return;
  if (confirm('Remove ' + state.box[i].species + ' permanently?')) {
    state.box.splice(i, 1);
    save();
    renderTeam();
  }
}

export function revivePoke(i) {
  if (sync.isViewMode) return;
  if (state.revives <= 0) { alert('No revive tokens!'); return; }
  const p = state.dead[i];
  p.fainted = false;
  if (state.party.length < 6) state.party.push(p);
  else state.box.push(p);
  state.dead.splice(i, 1);
  state.revives = Math.max(0, state.revives - 1);
  save();
  renderTeam();
  renderStats();
}

export function chRv(d) {
  if (sync.isViewMode) return;
  state.revives = Math.max(0, state.revives + d);
  save();
  renderTeam();
}

export function addPokemon() {
  if (sync.isViewMode) return;
  const sp = document.getElementById('ns').value.trim();
  const nk = document.getElementById('nn').value.trim();
  const lv = document.getElementById('nl').value.trim();
  const zn = document.getElementById('nz').value.trim();
  if (!sp || !nk) { alert('Species and nickname required.'); return; }
  const np = { species: sp, nick: nk, level: lv || '?', zone: zn || '?', fainted: false };
  if (state.party.length < 6) state.party.push(np);
  else state.box.push(np);
  ['ns', 'nn', 'nl', 'nz'].forEach(id => { document.getElementById(id).value = ''; });
  save();
  renderTeam();
  renderStats();
}

export function focusAdd() {
  document.getElementById('ns').focus();
}

export function acInput(inp) {
  clearTimeout(acTimeout);
  const v = inp.value.trim().toLowerCase();
  const list = document.getElementById('ac-list');
  if (!v) { list.style.display = 'none'; return; }
  const matches = POKE_DEDUP.filter(p => p.toLowerCase().startsWith(v)).slice(0, 8);
  if (!matches.length) { list.style.display = 'none'; return; }
  list.innerHTML = matches.map(p => '<div class="ac-item" data-action="ac-pick" data-poke="' + p + '">' + p + '</div>').join('');
  list.style.display = 'block';
}

export function acPick(p) {
  document.getElementById('ns').value = p;
  document.getElementById('ac-list').style.display = 'none';
}

export function acBlur() {
  acTimeout = setTimeout(() => {
    const l = document.getElementById('ac-list');
    if (l) l.style.display = 'none';
  }, 200);
}

let editSource = null;
let editIndex = -1;

export function openEdit(source, i) {
  if (sync.isViewMode) return;
  const list = source === 'party' ? state.party : state.box;
  const p = list[i];
  if (!p) return;
  editSource = source;
  editIndex = i;
  document.getElementById('em-s').textContent = source === 'party' ? 'In active party' : 'In box';
  document.getElementById('em-species').value = p.species;
  document.getElementById('em-nick').value = p.nick;
  document.getElementById('em-level').value = p.level === '?' ? '' : p.level;
  document.getElementById('em-zone').value = p.zone === '?' ? '' : p.zone;
  document.getElementById('edit-mo').classList.add('on');
  setTimeout(() => document.getElementById('em-nick').focus(), 50);
}

export function saveEdit() {
  if (sync.isViewMode) return;
  if (editIndex < 0 || !editSource) return;
  const list = editSource === 'party' ? state.party : state.box;
  const p = list[editIndex];
  if (!p) return;
  const sp = document.getElementById('em-species').value.trim();
  const nk = document.getElementById('em-nick').value.trim();
  const lv = document.getElementById('em-level').value.trim();
  const zn = document.getElementById('em-zone').value.trim();
  if (!sp || !nk) { alert('Species and nickname required.'); return; }
  p.species = sp;
  p.nick = nk;
  p.level = lv || '?';
  p.zone = zn || '?';
  editSource = null;
  editIndex = -1;
  document.getElementById('edit-mo').classList.remove('on');
  save();
  renderTeam();
}
