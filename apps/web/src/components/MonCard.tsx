import { useState } from 'react';
import type { PokemonInstance } from '@nuzlocke/engine';
import { appendEvent } from '../lib/db';
import { NATURES } from '../lib/sprites';
import { HELD_ITEMS, evolutionSummary, machineType, movesFor, typesFor } from '../lib/speciesData';
import { SpriteImg } from './SpriteImg';
import { Combobox } from './Combobox';
import { MoveChips } from './MoveChips';
import { TypeBadges } from './TypeBadge';
import { WeaknessRow } from './WeaknessRow';

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
            badge={(m) => machineType(m, gameId)}
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
 * nickname + species + type, with action buttons below. Click the card to
 * expand full-width into details (+ the edit form when editable).
 *
 * Read-only mode (SpectatorView): omit runId/onChange — the edit form and
 * actions disappear, everything else renders identically. */
export function MonCard({
  p,
  gameId,
  runId,
  onChange,
  actions = [],
}: {
  p: PokemonInstance;
  gameId: string;
  runId?: string;
  onChange?: () => Promise<void>;
  actions?: { label: string; onClick: () => void; secondary?: boolean }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const editable = p.status !== 'dead' && runId != null && onChange != null;

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
          {p.status === 'dead' && p.death && (
            <span className="muted">
              Fell to {p.death.cause ?? 'unknown cause'}
              {p.death.killer ? ` — ${p.death.killer}` : ''}
            </span>
          )}
          <WeaknessRow types={typesFor(p.species)} />
          <span className="muted">
            {p.heldItem ? `Holding: ${p.heldItem}` : 'No held item'}
            {p.nature ? ` · ${p.nature}` : ''}
          </span>
          {evolutionSummary(p.species) && (
            <span className="poke-evo muted">↗ Evolves into {evolutionSummary(p.species)}</span>
          )}
          <MoveChips moves={p.moves} gameId={gameId} />
          {editable && <EditForm p={p} runId={runId} gameId={gameId} onSaved={onChange} />}
        </div>
      )}
    </div>
  );
}
