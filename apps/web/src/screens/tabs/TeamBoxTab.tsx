import { useState } from 'react';
import type { EngineContext, PokemonInstance, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { NATURES } from '../../lib/sprites';
import { HELD_ITEMS, evolutionSummary, machineType, moveType, movesFor, typesFor } from '../../lib/speciesData';
import { weaknesses } from '../../lib/typeChart';
import { SpriteImg } from '../../components/SpriteImg';
import { Combobox } from '../../components/Combobox';
import { TypeBadge, TypeBadges, TypeDot } from '../../components/TypeBadge';

function EditForm({
  p,
  runId,
  gameId,
  onSaved,
}: {
  p: PokemonInstance;
  runId: string;
  gameId: string;
  onSaved: () => Promise<void>;
}) {
  const [nickname, setNickname] = useState(p.nickname);
  const [level, setLevel] = useState(String(p.level));
  const [heldItem, setHeldItem] = useState(p.heldItem ?? '');
  const [nature, setNature] = useState(p.nature ?? '');
  const [moves, setMoves] = useState<string[]>([0, 1, 2, 3].map((i) => p.moves?.[i] ?? ''));
  const [saving, setSaving] = useState(false);
  const movePool = movesFor(p.species, gameId);

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
    <div
      className="poke-edit-form"
      onKeyDown={(e) => {
        // Enter saves — unless a combobox suggestion list is open (then Enter
        // is selecting a suggestion) or focus is in a textarea.
        if (e.key === 'Enter' && !e.shiftKey && !document.querySelector('.combobox-list')) {
          e.preventDefault();
          if (!saving) save();
        }
      }}
    >
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
          <Combobox value={heldItem} onChange={setHeldItem} options={HELD_ITEMS} placeholder="none" />
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
          <Combobox
            key={i}
            value={m}
            onChange={(v) => setMoves(moves.map((old, j) => (j === i ? v : old)))}
            options={movePool}
            placeholder={`Move ${i + 1}`}
            badge={machineType}
          />
        ))}
      </div>
      <button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

/** Unified compact Pokémon card (team, box, graveyard). Condensed: sprite +
 * nickname + species + type, with the move buttons below. Click the card to
 * expand full-width into details + the edit form. */
function MonCard({
  p,
  runId,
  gameId,
  onChange,
  actions,
}: {
  p: PokemonInstance;
  runId: string;
  gameId: string;
  onChange: () => Promise<void>;
  actions: { label: string; onClick: () => void; secondary?: boolean }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const editable = p.status !== 'dead';
  const weak = weaknesses(typesFor(p.species));

  return (
    <div className={`mon-card${expanded ? ' expanded' : ''}${p.status === 'dead' ? ' dead' : ''}`}>
      <button type="button" className="mon-card-top" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
        <SpriteImg species={p.species} size={64} shiny={p.shiny} className={p.status === 'dead' ? 'sprite-dead' : ''} />
        <span className="mon-card-name">
          {p.nickname}
          {p.shiny && <span className="shiny-star" title="Shiny"> ✦</span>}
        </span>
        <span className="mon-card-species muted">
          {p.species} · Lv {p.level}
        </span>
        <TypeBadges types={typesFor(p.species)} />
      </button>

      {actions.length > 0 && (
        <div className="mon-card-actions">
          {actions.map((a) => (
            <button key={a.label} className={a.secondary ? 'secondary' : ''} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div className="mon-card-detail">
          {weak.length > 0 && (
            <span className="mrd-weak">
              <span className="mrd-weak-label muted">Weak to</span>
              {weak.map((w) => (
                <span key={w.type} className="mrd-weak-item">
                  <TypeBadge type={w.type} />
                  {w.x >= 4 && <span className="mrd-weak-x">×4</span>}
                </span>
              ))}
            </span>
          )}
          <span className="muted">
            {p.heldItem ? `Holding: ${p.heldItem}` : 'No held item'}
            {p.nature ? ` · ${p.nature}` : ''}
          </span>
          {evolutionSummary(p.species) && (
            <span className="poke-evo muted">↗ Evolves into {evolutionSummary(p.species)}</span>
          )}
          {p.moves && p.moves.length > 0 && (
            <span className="poke-moves">
              {p.moves.map((m) => (
                <span key={m} className="move-chip">
                  <TypeDot type={moveType(m)} />
                  {m}
                  {machineType(m) && <span className={`move-tag badge-${machineType(m)}`}>{machineType(m)}</span>}
                </span>
              ))}
            </span>
          )}
          {editable && <EditForm p={p} runId={runId} gameId={gameId} onSaved={onChange} />}
        </div>
      )}
    </div>
  );
}

export function TeamBoxTab({
  runId,
  state,
  ctx,
  onChange,
}: {
  runId: string;
  state: RunState;
  ctx: EngineContext;
  onChange: () => Promise<void>;
}) {
  const gameId = ctx.dataset.gameId;
  const party = Object.values(state.pokemon).filter((p) => p.status === 'party');
  const box = Object.values(state.pokemon).filter((p) => p.status === 'box');
  const graveyard = Object.values(state.pokemon).filter((p) => p.status === 'dead');

  async function move(id: string, to: 'party' | 'box') {
    await appendEvent(runId, { type: 'moved', payload: { pokemonId: id, to } });
    await onChange();
  }

  async function markFaint(id: string) {
    // One seamless click — no prompts. Payload still supports cause/killer later.
    await appendEvent(runId, { type: 'faint', payload: { pokemonId: id } });
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
        <div className="mon-grid">
          {party.map((p) => (
            <MonCard
              key={p.id}
              p={p}
              runId={runId}
              gameId={gameId}
              onChange={onChange}
              actions={[
                { label: 'Box', onClick: () => move(p.id, 'box'), secondary: true },
                { label: 'Fainted', onClick: () => markFaint(p.id), secondary: true },
              ]}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Box ({box.length})</h2>
        {box.length === 0 && <p className="muted">Empty.</p>}
        <div className="mon-grid">
          {box.map((p) => (
            <MonCard
              key={p.id}
              p={p}
              runId={runId}
              gameId={gameId}
              onChange={onChange}
              actions={[
                { label: 'Party', onClick: () => move(p.id, 'party') },
                { label: 'Fainted', onClick: () => markFaint(p.id), secondary: true },
              ]}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Graveyard ({graveyard.length})</h2>
        <p className="muted">Revive tokens available: {state.reviveTokens}</p>
        {graveyard.length === 0 && <p className="muted">No losses yet.</p>}
        <div className="mon-grid">
          {graveyard.map((p) => (
            <MonCard
              key={p.id}
              p={p}
              runId={runId}
              gameId={gameId}
              onChange={onChange}
              actions={state.reviveTokens > 0 ? [{ label: 'Revive', onClick: () => revive(p.id) }] : []}
            />
          ))}
        </div>
      </section>
    </>
  );
}
