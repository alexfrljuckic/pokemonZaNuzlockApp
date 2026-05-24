# Pokemon Legends: Z-A Nuzlocke Tracker

A mobile-first vanilla-JS web app for tracking a nuzlocke run of *Pokemon Legends: Z-A*. Live on GitHub Pages with optional cross-device cloud sync via [JSONBin.io](https://jsonbin.io).

## What it does

Five tabs, all driven from `index.html` + the ES modules in [js/](js/):

- **Zones** — 20 base Wild Zones + special/gift encounters + DLC Hyperspace zones. Tap a zone to roll a randomized legal target from its encounter pool (duplicate clause is always on — species you already own are excluded). One reroll per zone. Mark outcome as Caught / Failed / Skipped; caught Pokemon are auto-added to party or box.
- **Team & Box** — 6-slot active party, 30-slot box, manual add form with species autocomplete, faint/heal/box/party controls, fallen list with revive-token spending.
- **Bosses** — Full Z-A boss list (Promotion Matches, Rival Battles, Rogue Megas, Key Story). Toggleable level-cap modes (strict = ace-1, loose = ace+0, none). Beating a Promotion Match or Rogue Mega grants a revive token automatically.
- **Rules** — Core nuzlocke rules + Z-A-specific rules + revive mechanic + toggleable optional clauses (shiny, level cap, set mode, no items, no TMs, DLC clause).
- **Stats** — Counts, progress bars, run notes textarea, full-run reset.

## Architecture

Pure vanilla — no framework, no bundler, no build step. Files load directly via `<script type="module">`, which works on any static host including GitHub Pages.

```
index.html          # Structure + nav + tab containers + zone modal
styles.css          # Single stylesheet (heavily abbreviated class names)
js/
├── data.js         # Static tables: POKE_ALL, ZD (zones), BD (bosses), rule arrays
├── state.js        # Shared `state` object, localStorage load/save, save() entry point
├── sync.js         # JSONBin REST calls, sync setup UI, view-mode lock
├── zones.js        # renderZones, openZone, roll/reroll/setZS, modal logic
├── team.js         # renderTeam, party/box/dead mutators, autocomplete
├── bosses.js       # renderBosses, toggleBoss (also grants revive tokens), cap/sort
├── rules.js        # renderRules, toggleOpt
├── stats.js        # renderStats, run notes binding, resetRun
└── app.js          # Entry point: load(), render(), event delegation, view mode bootstrap
```

### State

A single mutable object exported from [js/state.js](js/state.js):

```js
export const state = {
  zs: {},          // per-zone outcomes keyed by zone id
  party: [], box: [], dead: [],
  opts: {},        // optional rule toggles
  notes: '',
  revives: 0,
  capMode: 'strict' | 'loose' | 'none',
  bossBeaten: {},
  zFilter, bSort,  // UI filter state
};
```

Each mutator mutates `state` directly, then calls `save()` and its own render function. `save()` writes localStorage and debounces a cloud push via `scheduleSync()`.

### Persistence

- `localStorage["nuzlocke_za_v7"]` — full state object. Bump the suffix on schema-breaking changes.
- `localStorage["nuzlocke_za_sync"]` — `{ binId, masterKey }` for the JSONBin connection.

### Event handling

No inline `onclick`. Every interactive element carries `data-action="..."` plus extra `data-*` payload attributes. A single delegated `click` listener in [js/app.js](js/app.js) maps actions to handlers:

```html
<button data-action="toggle-boss" data-id="zach">…</button>
<button data-action="ch-rv" data-delta="1">+</button>
```

```js
const actions = {
  'toggle-boss': (el) => bosses.toggleBoss(el.dataset.id),
  'ch-rv':       (el) => team.chRv(parseInt(el.dataset.delta, 10)),
  // ...
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el) actions[el.dataset.action]?.(el, e);
});
```

The autocomplete input uses delegated `input`/`focusin`/`focusout` listeners against `#ns`. Modal background-click close is handled by checking `e.target.classList.contains('mo')` in the same root listener.

## Cloud sync (JSONBin.io)

Sync is opt-in and BYO-credentials — there is no backend.

1. User creates a free jsonbin.io account, copies their Master Key from the API Keys page, pastes it into the sync setup form.
2. `doSetupSync()` POSTs the current state to `https://api.jsonbin.io/v3/b` with the key as `X-Master-Key` and a public-bin header. The returned `bin.id` is stored locally.
3. Subsequent `save()` calls debounce by 1.5s and PUT the full state to `/v3/b/{binId}`.
4. Sharing: the app generates a `?view={binId}` link. Anyone opening that link triggers `load()`'s view-mode branch, which pulls from `/v3/b/{binId}/latest` (public bin = no key needed), locks the UI via `lockUI()`, and polls every 60s.

View mode is enforced two ways: every mutator early-returns on `if (sync.isViewMode)`, and `lockUI()` injects a stylesheet that disables pointer events on all interactive elements except the nav tabs.

## Hosting

GitHub Pages serves the static files from `main` directly. No build, no CI — push and refresh.

## Development

There is no local toolchain. To iterate:

1. Open `index.html` in a browser (most browsers allow `file://` for ES modules; if not, run `python -m http.server` from the repo root).
2. Edit any module — refresh.

Testing sync requires a real JSONBin.io account; there is no mock.

## Conventions worth knowing before editing

- CSS uses heavily abbreviated class names (`.zi`, `.bpw`, `.ztab.on`) to keep [styles.css](styles.css) small. Search it before guessing what a class means.
- Zone IDs are mixed: numeric (`1`..`20`) for base zones, `s0`..`s10` for specials, `h1`..`h10` for Hyperspace. Always coerce with `String(id)` when comparing.
- Boss `rkc` is the rank-badge color class (`rg` rogue, `rv` rival, `fn` final, empty for promotion).
- When adding a new piece of persisted state, also add it to `stateObj()` *and* `applyState()` in [js/state.js](js/state.js).
- When bumping the localStorage schema, bump the `KEY` constant suffix (`nuzlocke_za_v7` → `v8`) so old shapes don't crash the loader.
- New interactive UI: add a `data-action="..."` attribute (and `data-*` payload), then add the handler entry to the `actions` table in [js/app.js](js/app.js). Don't reach for inline `onclick`.

## Branches

- `main` — deployed.
- `attemptReact` — abandoned earlier rewrite attempt. Ignore unless revisited.
- `modular-split` — this branch; vanilla split into modules + event delegation.
