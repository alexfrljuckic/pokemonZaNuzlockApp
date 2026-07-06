import { useState } from 'react';
import type { PokemonInstance } from '@nuzlocke/engine';
import { appendEvent } from '../lib/db';
import { NATURES } from '../lib/sprites';
import {
  HELD_ITEMS,
  evolutionOptionsFor,
  evolutionSummary,
  learnLevel,
  machineType,
  orderedMovesFor,
  typesFor,
} from '../lib/speciesData';
import { evoItemHint, tradeHint } from '../lib/evolutionHints';
import { clampLevel } from './CatchFields';
import { SpriteImg } from './SpriteImg';
import { Combobox } from './Combobox';
import { ConfirmAction } from './ConfirmAction';
import { LevelUpMoves } from './LevelUpMoves';
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
  const levelInvalid =
    level.trim() !== '' && (!Number.isInteger(Number(level)) || Number(level) < 1 || Number(level) > 100);
  // level-up moves first (by level), then TM/TR/HM, then tutor/egg — the
  // learnable-by-playing options surface before the machine shopping list
  const movePool = orderedMovesFor(p.species, gameId);

  async function save() {
    setSaving(true);
    try {
      // Emit only what changed; null explicitly clears an optional field.
      const payload: Record<string, unknown> = { pokemonId: p.id };
      if (nickname.trim() && nickname.trim() !== p.nickname) payload.nickname = nickname.trim();
      // only touch the level when something numeric was entered — an empty
      // field means "leave it alone", not "reset to 1"
      if (level.trim() !== '' && Number.isFinite(Number(level))) {
        const lvl = clampLevel(level);
        if (lvl !== p.level) payload.level = lvl;
      }
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
          <input
            type="number"
            min={1}
            max={100}
            value={level}
            aria-invalid={levelInvalid || undefined}
            onChange={(e) => setLevel(e.target.value)}
          />
          {levelInvalid && (
            <span className="field-error" role="alert">
              Levels are 1–100 — this will be saved as Lv {clampLevel(level)}.
            </span>
          )}
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
            badge={(mv) => {
              // learn level is the most useful pick signal; machine tag second
              const lvl = learnLevel(mv, p.species, gameId);
              if (lvl != null) return { text: `Lv ${lvl}`, kind: 'lv' };
              const tag = machineType(mv, gameId);
              return tag ? { text: tag, kind: tag } : null;
            }}
          />
        ))}
      </div>
      <button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

/** Interactive evolve panel: one option per branch (Eevee picks its stone,
 * Applin its apple). Level requirements gate visually but never hard-block —
 * the app can't see stones/friendship, so the player stays the authority.
 * Item/trade requirements carry a where-to-find hint when we have one. */
function EvolvePanel({
  p,
  runId,
  gameId,
  onEvolved,
}: {
  p: PokemonInstance;
  runId: string;
  gameId: string;
  onEvolved: () => Promise<void>;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const options = evolutionOptionsFor(p.species, p.level, gameId);
  if (options.length === 0) return null;
  // the species may have changed since the last pick (chained evolutions) —
  // never let a stale pick target an option that no longer exists
  const picked = options.find((o) => o.to === pick) ?? null;
  // evolving below the documented level requirement raises the mon to it;
  // a higher current level just stays
  const levelAfter = picked?.minLevel != null ? Math.max(p.level, picked.minLevel) : p.level;

  async function evolve() {
    if (!picked) return;
    setSaving(true);
    try {
      await appendEvent(runId, {
        type: 'pokemon_evolved',
        payload: {
          pokemonId: p.id,
          toSpecies: picked.to,
          ...(levelAfter !== p.level ? { level: levelAfter } : {}),
        },
      } as never);
      setPick(null);
      await onEvolved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="evo-panel">
      <span className="muted">Evolve{options.length > 1 ? ' — pick the branch you took in-game' : ''}:</span>
      <div className="evo-options">
        {options.map((o) => {
          const hint =
            o.trigger === 'trade'
              ? [evoItemHint(o.item, gameId), tradeHint(gameId)].filter(Boolean).join(' · ') || null
              : evoItemHint(o.item, gameId);
          return (
            <button
              key={o.to}
              type="button"
              className={`evo-option${pick === o.to ? ' selected' : ''}${o.ready ? '' : ' evo-not-ready'}`}
              title={hint ?? undefined}
              onClick={() => setPick((cur) => (cur === o.to ? null : o.to))}
            >
              <SpriteImg species={o.to} size={48} />
              <span className="evo-name">{o.to}</span>
              <span className={`evo-req${o.ready ? '' : ' evo-req-unmet'}`}>{o.requirement}</span>
              {hint && <span className="evo-hint muted">{hint}</span>}
            </button>
          );
        })}
      </div>
      {picked && (
        <button disabled={saving} onClick={evolve}>
          {saving
            ? 'Evolving…'
            : `Evolve into ${picked.to}${levelAfter !== p.level ? ` (Lv ${p.level} → ${levelAfter})` : ''} ✓`}
        </button>
      )}
    </div>
  );
}

/** Undo for a misclick or wrong branch: pops the latest pre-evolution
 * species. The level is left alone — un-evolving corrects the pick, the
 * mon's actual level never went down (edit it manually if needed). */
function UnevolveButton({
  p,
  runId,
  onReverted,
}: {
  p: PokemonInstance;
  runId: string;
  onReverted: () => Promise<void>;
}) {
  const prev = p.preEvolutions?.[p.preEvolutions.length - 1];
  if (!prev) return null;
  // confirm-gated like every other destructive-ish one-click (UX audit P2)
  return (
    <ConfirmAction
      label={`↩ Un-evolve to ${prev}`}
      triggerClass="secondary evo-undo"
      prompt={`Revert ${p.nickname} to ${prev}? The level stays as it is.`}
      ariaLabel={`Un-evolve ${p.nickname} to ${prev}`}
      onConfirm={async () => {
        await appendEvent(runId, { type: 'pokemon_evolution_reverted', payload: { pokemonId: p.id } } as never);
        await onReverted();
      }}
    />
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
  actions?: {
    label: string;
    onClick: () => void;
    secondary?: boolean;
    /** Destructive actions expand to an inline confirm before firing. */
    confirm?: { prompt: string; ariaLabel?: string };
  }[];
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
          {actions.map((a) =>
            a.confirm ? (
              <ConfirmAction
                key={a.label}
                label={a.label}
                prompt={a.confirm.prompt}
                ariaLabel={a.confirm.ariaLabel}
                onConfirm={a.onClick}
                triggerClass={a.secondary ? 'secondary' : ''}
              />
            ) : (
              <button key={a.label} className={a.secondary ? 'secondary' : ''} onClick={a.onClick}>
                {a.label}
              </button>
            ),
          )}
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
          {editable ? (
            <>
              <EvolvePanel p={p} runId={runId} gameId={gameId} onEvolved={onChange} />
              <UnevolveButton p={p} runId={runId} onReverted={onChange} />
            </>
          ) : (
            evolutionSummary(p.species) && (
              <span className="poke-evo muted">↗ Evolves into {evolutionSummary(p.species)}</span>
            )
          )}
          <MoveChips moves={p.moves} gameId={gameId} />
          <LevelUpMoves species={p.species} gameId={gameId} atLevel={p.level} />
          {/* key re-seeds the form when the mon changes outside it (evolution
              changes species/nickname/level while the card stays expanded) */}
          {editable && (
            <EditForm key={`${p.id}:${p.species}:${p.level}`} p={p} runId={runId} gameId={gameId} onSaved={onChange} />
          )}
        </div>
      )}
    </div>
  );
}
