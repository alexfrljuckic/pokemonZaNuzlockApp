import { OPT } from './data.js?v=1';
import { scheduleSync } from './sync.js?v=1';

export const KEY = 'nuzlocke_za_v7';

export const state = {
  zs: {},
  party: [],
  box: [],
  dead: [],
  opts: {},
  notes: '',
  revives: 0,
  capMode: 'strict',
  bossBeaten: {},
  zFilter: 'all',
  bSort: 'story',
};

OPT.forEach(r => { state.opts[r.id] = r.d; });

export function stateObj() {
  return {
    zs: state.zs, party: state.party, box: state.box, dead: state.dead,
    opts: state.opts, notes: state.notes, revives: state.revives,
    capMode: state.capMode, bossBeaten: state.bossBeaten,
    zFilter: state.zFilter, bSort: state.bSort,
  };
}

export function applyState(o) {
  state.zs = o.zs || {};
  state.party = o.party || [];
  state.box = o.box || [];
  state.dead = o.dead || [];
  state.opts = o.opts || state.opts;
  state.notes = o.notes || '';
  state.revives = o.revives || 0;
  state.capMode = o.capMode || 'strict';
  state.bossBeaten = o.bossBeaten || {};
  state.zFilter = o.zFilter || 'all';
  state.bSort = o.bSort || 'story';
}

export function localSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}

export function localLoad() {
  try {
    const d = localStorage.getItem(KEY);
    return d ? JSON.parse(d) : null;
  } catch (e) { return null; }
}

export function save() {
  const data = stateObj();
  localSave(data);
  scheduleSync(data);
}
