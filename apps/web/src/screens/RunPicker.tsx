import { useState } from 'react';
import { buildRuleset } from '@nuzlocke/engine';
import { listGames } from '../lib/datasets';
import { createRun, type RunSummary } from '../lib/db';

const PRESETS = ['standard', 'hardcore', 'casual'] as const;

export function RunPicker({
  runs,
  onSelect,
  onCreated,
}: {
  runs: RunSummary[];
  onSelect: (runId: string) => void;
  onCreated: (runId: string) => void;
}) {
  const games = listGames();
  const [gameId, setGameId] = useState(games[0]?.gameId ?? '');
  const game = games.find((g) => g.gameId === gameId) ?? games[0];
  const [version, setVersion] = useState(game?.versions[0] ?? '');
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>('standard');
  const [creating, setCreating] = useState(false);

  function handleGameChange(id: string) {
    setGameId(id);
    const next = games.find((g) => g.gameId === id);
    setVersion(next?.versions[0] ?? '');
  }

  async function handleCreate() {
    if (!game || !version) return;
    setCreating(true);
    try {
      const ruleset = buildRuleset(preset, gameId);
      const runId = await createRun(gameId, version, ruleset);
      onCreated(runId);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {runs.length > 0 && (
        <section>
          <h2>Continue a run</h2>
          {runs.map((r) => (
            <div key={r.id} className="run-list-item" onClick={() => onSelect(r.id)}>
              <span>
                {r.gameId} · {r.version}
              </span>
              <span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2>Start a new run</h2>
        <label htmlFor="game">Game</label>
        <select id="game" value={gameId} onChange={(e) => handleGameChange(e.target.value)}>
          {games.map((g) => (
            <option key={g.gameId} value={g.gameId}>
              {g.name}
            </option>
          ))}
        </select>

        <label htmlFor="version">Version</label>
        <select id="version" value={version} onChange={(e) => setVersion(e.target.value)}>
          {game?.versions.map((v) => (
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

        <button onClick={handleCreate} disabled={creating || !game}>
          {creating ? 'Starting…' : 'Start Run'}
        </button>
      </section>
    </>
  );
}
