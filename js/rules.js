import { CR_RULES, ZA_RULES, RV_RULES, OPT } from './data.js?v=1';
import { state, save } from './state.js?v=1';
import { sync } from './sync.js?v=1';

export function renderRules() {
  document.getElementById('cr-list').innerHTML = CR_RULES.map(t =>
    '<div class="ri2"><div class="ric" style="background:var(--rb);color:var(--red)">!</div><div class="rt2">' + t + '</div></div>'
  ).join('');
  document.getElementById('za-list').innerHTML = ZA_RULES.map(t =>
    '<div class="ri2"><div class="ric" style="background:var(--pb);color:var(--pur)">Z</div><div class="rt2">' + t + '</div></div>'
  ).join('');
  document.getElementById('rv-list').innerHTML = RV_RULES.map(t =>
    '<div class="ri2"><div class="ric" style="background:var(--gb);color:var(--grn)">+</div><div class="rt2">' + t + '</div></div>'
  ).join('');
  document.getElementById('opt-list').innerHTML = OPT.map(r =>
    '<div class="ri2" data-action="toggle-opt" data-id="' + r.id + '" style="cursor:pointer">' +
    '<div class="ric" style="background:var(--bb);color:var(--blu);' + (state.opts[r.id] ? '' : 'opacity:.35') + '">' +
    (state.opts[r.id] ? '✓' : 'o') + '</div>' +
    '<div class="rt2' + (state.opts[r.id] ? '' : ' off') + '">' + r.t + '</div></div>'
  ).join('');
}

export function toggleOpt(id) {
  if (sync.isViewMode) return;
  state.opts[id] = !state.opts[id];
  save();
  renderRules();
}
