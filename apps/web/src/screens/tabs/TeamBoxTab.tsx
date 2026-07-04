import { useState } from 'react';
import type { EngineContext, PokemonInstance, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { NATURES } from '../../lib/sprites';
import { HELD_ITEMS, evolutionSummary, movesFor } from '../../lib/speciesData';
import { SpriteImg } from '../../components/SpriteImg';

function EditForm({
  p,
  runId,
  onSaved,
}: {
  p: PokemonInstance;
  runId: string;
  onSaved: () => Promise<void>;
}) {
  const [nickname, setNickname] = useState(p.nickname);
  const [level, setLevel] = useState(String(p.level));
  const [heldItem, setHeldItem] = useState(p.heldItem ?? '');
  const [nature, setNature] = useState(p.nature ?? '');
  const [moves, setMoves] = useState<string[]>([0, 1, 2, 3].map((i) => p.moves?.[i] ?? ''));
  const [saving, setSaving] = useState(false);
  const movePool = movesFor(p.species);
  const heldListId = 'held-items-list';
  const moveListId = `moves-${p.species}`;

  async function save() {
    setSaving(true);
    try {
      // Emit only what changed; null explicitly clears an optional field.
      const payload: Record<string, unknown> = { pokemonId: p.id };
      if (nickname.trim() && nickname.trim() !== p.nickname) payload.nickname = nickname.trim();
      const lvl = Number(level);
      if (Number.isFinite(lvl) && lvl >= 1 && lvl !== p.level) payload.level = Math.floor(lvl);
      if (heldItem.trim() !== (p.heldItem ?? '')) payload.heldItem = heldItem.trim() || null;
      if (nature !== (p.nature ?? '')) payload.nature = nature || null;
      const cleanMoves = moves.map((m) => m.trim()).filter(Boolean);
      if (JSON.stringify(cleanMoves) !== JSON.stringify(p.moves ?? [])) payload.moves = cleanMoves;
      if (Object.keys(payload).length > 1) {
        await appendEvent(runId, { type: 'pokemon_updated', payload } as never);
      }
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="poke-edit-form">
      <div className="poke-edit-grid">
        <label>
          Nickname
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </label>
        <label>
          Level
          <input type="number" min={1} max={100} value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
        <label>
          Held item
          <input
            type="text"
            list={heldListId}
            value={heldItem}
            onChange={(e) => setHeldItem(e.target.value)}
            placeholder="none"
          />
          <datalist id={heldListId}>
            {HELD_ITEMS.map((it) => (
              <option key={it} value={it} />
            ))}
          </datalist>
        </label>
        <label>
          Nature
          <select value={nature} onChange={(e) => setNature(e.target.value)}>
            <option value="">—</option>
            {NATURES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>Moves</label>
      <div className="poke-edit-moves">
        {moves.map((m, i) => (
          <input
            key={i}
            type="text"
            list={movePool.length ? moveListId : undefined}
            value={m}
            placeholder={`Move ${i + 1}`}
            onChange={(e) => setMoves(moves.map((old, j) => (j === i ? e.target.value : old)))}
          />
        ))}
        {movePool.length > 0 && (
          <datalist id={moveListId}>
            {movePool.map((mv) => (
              <option key={mv} value={mv} />
            ))}
          </datalist>
        )}
      </div>
      <button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function PokemonDetail({
  p,
  runId,
  onChange,
  actions,
}: {
  p: PokemonInstance;
  runId: string;
  onChange: () => Promise<void>;
  actions: { label: string; onClick: () => void; secondary?: boolean }[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="poke-detail">
      <div className="poke-detail-head">
        <SpriteImg species={p.species} size={72} className={p.status === 'dead' ? 'sprite-dead' : ''} />
        <div className="poke-detail-summary">
          <strong>{p.nickname}</strong>
          <span className="muted">
            {p.species} · Lv {p.level}
            {p.nature ? ` · ${p.nature}` : ''}
          </span>
          <span className="muted">{p.heldItem ? `Holding: ${p.heldItem}` : 'No held item'}</span>
          {evolutionSummary(p.species) && (
            <span className="poke-evo muted">↗ Evolves into {evolutionSummary(p.species)}</span>
          )}
          {p.moves && p.moves.length > 0 && (
            <span className="poke-moves">
              {p.moves.map((m) => (
                <span key={m} className="move-chip">
                  {m}
                </span>
              ))}
            </span>
          )}
        </div>
        <span className="pokemon-actions">
          {p.status !== 'dead' && (
            <button className="secondary" onClick={() => setEditing(!editing)}>
              {editing ? 'Close' : 'Edit'}
            </button>
          )}
          {actions.map((a) => (
            <button key={a.label} className={a.secondary ? 'secondary' : ''} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </span>
      </div>
      {editing && (
        <EditForm
          p={p}
          runId={runId}
          onSaved={async () => {
            setEditing(false);
            await onChange();
          }}
        />
      )}
    </div>
  );
}

export function TeamBoxTab({
  runId,
  state,
  onChange,
}: {
  runId: string;
  state: RunState;
  ctx: EngineContext;
  onChange: () => Promise<void>;
}) {
  const party = Object.values(state.pokemon).filter((p) => p.status === 'party');
  const box = Object.values(state.pokemon).filter((p) => p.status === 'box');
  const graveyard = Object.values(state.pokemon).filter((p) => p.status === 'dead');
  const [boxSelection, setBoxSelection] = useState<string | null>(null);
  const selectedBoxMon = box.find((p) => p.id === boxSelection) ?? null;

  async function move(id: string, to: 'party' | 'box') {
    await appendEvent(runId, { type: 'moved', payload: { pokemonId: id, to } });
    setBoxSelection(null);
    await onChange();
  }

  async function markFaint(id: string) {
    // One seamless click — no prompts. Payload still supports cause/killer later.
    await appendEvent(runId, { type: 'faint', payload: { pokemonId: id } });
    setBoxSelection(null);
    await onChange();
  }

  async function revive(id: string) {
    await appendEvent(runId, { type: 'revive', payload: { pokemonId: id } });
    await onChange();
  }

  return (
    <>
      <section>
        <h2>Team ({party.length}/6)</h2>
        {party.length === 0 && <p className="muted">No party members yet.</p>}
        {party.map((p) => (
          <PokemonDetail
            key={p.id}
            p={p}
            runId={runId}
            onChange={onChange}
            actions={[
              { label: 'Box', onClick: () => move(p.id, 'box'), secondary: true },
              { label: 'Fainted', onClick: () => markFaint(p.id), secondary: true },
            ]}
          />
        ))}
      </section>

      <section>
        <h2>Box ({box.length})</h2>
        {box.length === 0 && <p className="muted">Empty.</p>}
        {box.length > 0 && (
          <div className="box-grid">
            {box.map((p) => (
              <button
                key={p.id}
                className={`box-slot${p.id === boxSelection ? ' selected' : ''}`}
                onClick={() => setBoxSelection(p.id === boxSelection ? null : p.id)}
                title={`${p.nickname} (${p.species}, Lv ${p.level})`}
              >
                <SpriteImg species={p.species} size={72} />
                <span className="box-slot-lv muted">Lv{p.level}</span>
              </button>
            ))}
          </div>
        )}
        {selectedBoxMon && (
          <PokemonDetail
            p={selectedBoxMon}
            runId={runId}
            onChange={onChange}
            actions={[
              { label: 'Party', onClick: () => move(selectedBoxMon.id, 'party') },
              { label: 'Fainted', onClick: () => markFaint(selectedBoxMon.id), secondary: true },
            ]}
          />
        )}
      </section>

      <section>
        <h2>Graveyard ({graveyard.length})</h2>
        <p className="muted">Revive tokens available: {state.reviveTokens}</p>
        {graveyard.length === 0 && <p className="muted">No losses yet.</p>}
        {graveyard.map((p) => (
          <PokemonDetail
            key={p.id}
            p={p}
            runId={runId}
            onChange={onChange}
            actions={state.reviveTokens > 0 ? [{ label: 'Revive (to box)', onClick: () => revive(p.id) }] : []}
          />
        ))}
      </section>
    </>
  );
}
