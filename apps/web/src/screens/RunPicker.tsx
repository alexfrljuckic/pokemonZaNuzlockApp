import { Fragment, useState, type CSSProperties } from 'react';
import { buildRuleset, deriveState, specialAppliesToVersion, type RunEvent } from '@nuzlocke/engine';
import { listGames, speciesToLine } from '../lib/datasets';
import { VERSION_MASCOT, cardColorFor } from '../games';
import { createRun, loadEvents, type RunSummary } from '../lib/db';
import { SpriteImg } from '../components/SpriteImg';
import { StarterPicker, starterHeading } from '../components/SpecialsSection';

const PRESETS = ['standard', 'hardcore', 'casual'] as const;

const PRESET_DESC: Record<(typeof PRESETS)[number], string> = {
  standard: 'First-encounter + dupes clause',
  hardcore: 'Level caps + set mode',
  casual: 'Relaxed — nothing enforced',
};

const prettyVersion = (v: string) => v.replace(/-/g, ' ');

/** "Continue" flow: just the existing runs. */
export function ContinueScreen({
  runs,
  onSelect,
}: {
  runs: RunSummary[];
  onSelect: (runId: string) => void;
}) {
  return (
    <section>
      <h2>Continue a run</h2>
      {runs.length === 0 && <p className="muted">No runs yet — start a new game.</p>}
      {runs.map((r) => (
        <div key={r.id} className="run-list-item" onClick={() => onSelect(r.id)}>
          <span>
            {r.gameId} · {r.version}
          </span>
          <span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
      ))}
    </section>
  );
}

/** "New Game" flow: pick a game by card, then its subsettings appear. */
export function NewGameScreen({ onCreated }: { onCreated: (runId: string) => void }) {
  const games = listGames();
  const [gameId, setGameId] = useState<string | null>(null);
  const game = games.find((g) => g.gameId === gameId) ?? null;
  const [version, setVersion] = useState('');
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>('standard');
  const [houseRulesText, setHouseRulesText] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingRun, setPendingRun] = useState<{ id: string; events: RunEvent[] } | null>(null);

  function pickGame(id: string) {
    // toggle: clicking the open card collapses it
    if (id === gameId) {
      setGameId(null);
      return;
    }
    setGameId(id);
    setVersion(games.find((g) => g.gameId === id)?.versions[0] ?? '');
  }

  async function handleCreate() {
    if (!game || !version) return;
    setCreating(true);
    try {
      const ruleset = buildRuleset(preset, game.gameId);
      ruleset.houseRules = houseRulesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const id = await createRun(game.gameId, version, ruleset);
      const starters = (game.specials ?? []).filter(
        (s) => s.id.startsWith('starter-') && specialAppliesToVersion(s, version),
      );
      if (starters.length > 0) {
        setPendingRun({ id, events: await loadEvents(id) });
      } else {
        onCreated(id);
      }
    } finally {
      setCreating(false);
    }
  }

  // Between run creation and landing on the tracker: if the game has starter
  // choices, claim one here (before any route/area is even visible) rather
  // than burying it in the Routes tab later.
  if (pendingRun && game) {
    const ctx = { dataset: game, speciesToLine };
    const state = deriveState(pendingRun.events, ctx);
    const starters = (game.specials ?? []).filter(
      (s) => s.id.startsWith('starter-') && specialAppliesToVersion(s, state.version),
    );
    return (
      <section>
        <h2>{starterHeading(starters)}</h2>
        <StarterPicker
          runId={pendingRun.id}
          state={state}
          starters={starters}
          onChange={async () => onCreated(pendingRun.id)}
        />
        <button className="secondary" onClick={() => onCreated(pendingRun.id)}>
          Skip for now
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2>Choose your game</h2>
      <div className="game-card-grid">
        {games.map((g) => (
          <Fragment key={g.gameId}>
            <button
              className={`game-card${g.gameId === gameId ? ' selected' : ''}`}
              style={{ '--card-color': cardColorFor(g.gameId) } as CSSProperties}
              onClick={() => pickGame(g.gameId)}
              aria-expanded={g.gameId === gameId}
            >
              <img className="game-card-logo" src={`/logos/${g.gameId}.svg`} alt="" width={52} height={52} />
              <span className="game-card-name">{g.name}</span>
              <span className="muted">{g.areas.length} areas</span>
            </button>

            {/* run settings expand in place, right under the picked card */}
            {gameId === g.gameId && game && (
              <div className="game-settings-inline">
                <span className="picker-label">Version</span>
                <div className="picker-tiles">
                  {game.versions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`picker-tile${version === v ? ' selected' : ''}`}
                      onClick={() => setVersion(v)}
                      aria-pressed={version === v}
                    >
                      {VERSION_MASCOT[v] && <SpriteImg species={VERSION_MASCOT[v]} size={56} />}
                      <span className="picker-tile-label">{prettyVersion(v)}</span>
                    </button>
                  ))}
                </div>

                <span className="picker-label">Ruleset preset</span>
                <div className="picker-tiles">
                  {PRESETS.map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      className={`picker-tile picker-tile-preset${preset === pr ? ' selected' : ''}`}
                      onClick={() => setPreset(pr)}
                      aria-pressed={preset === pr}
                    >
                      <span className="picker-tile-label">{pr}</span>
                      <span className="picker-tile-desc muted">{PRESET_DESC[pr]}</span>
                    </button>
                  ))}
                </div>

                <label htmlFor="house-rules">
                  House rules (optional, one per line — honor rules, shown but not enforced)
                </label>
                <textarea
                  id="house-rules"
                  rows={3}
                  value={houseRulesText}
                  onChange={(e) => setHouseRulesText(e.target.value)}
                  placeholder="e.g. no legendaries&#10;shiny clause"
                />

                <button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Starting…' : 'Start Run'}
                </button>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
