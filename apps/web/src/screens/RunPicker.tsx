import { useState } from 'react';
import { buildRuleset } from '@nuzlocke/engine';
import { listGames } from '../lib/datasets';
import { createRun, type RunSummary } from '../lib/db';

const PRESETS = ['standard', 'hardcore', 'casual'] as const;

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

  function pickGame(id: string) {
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
      onCreated(await createRun(game.gameId, version, ruleset));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <section>
        <h2>Choose your game</h2>
        <div className="game-card-grid">
          {games.map((g) => (
            <button
              key={g.gameId}
              className={`game-card game-card-${g.gameId}${g.gameId === gameId ? ' selected' : ''}`}
              onClick={() => pickGame(g.gameId)}
            >
              <span className="game-card-name">{g.name}</span>
              <span className="muted">{g.areas.length} areas</span>
            </button>
          ))}
        </div>
      </section>

      {game && (
        <section>
          <h2>{game.name} — run settings</h2>

          <label htmlFor="version">Version</label>
          <select id="version" value={version} onChange={(e) => setVersion(e.target.value)}>
            {game.versions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <label htmlFor="preset">Ruleset preset</label>
          <select id="preset" value={preset} onChange={(e) => setPreset(e.target.value as (typeof PRESETS)[number])}>
            {PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label htmlFor="house-rules">House rules (optional, one per line — honor rules, shown but not enforced)</label>
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
        </section>
      )}
    </>
  );
}
