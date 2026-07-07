import { useState } from 'react';
import type { PokemonInstance, RunEvent } from '@nuzlocke/engine';
import { appendEvent } from '../lib/db';
import { NATURES, itemSpriteUrl } from '../lib/sprites';
import {
  HELD_ITEMS,
  abilitiesFor,
  evolutionOptionsFor,
  evolutionSummary,
  learnLevel,
  machineType,
  moveType,
  orderedMovesFor,
  typesFor,
} from '../lib/speciesData';
import { hasAbilitiesFor } from '../games';
import { evoItemHint, tradeHint } from '../lib/evolutionHints';
import { clampLevel } from './CatchFields';
import { SpriteImg } from './SpriteImg';
import { Combobox } from './Combobox';
import { ItemSprite } from './ItemSprite';
import { ConfirmAction } from './ConfirmAction';
import { LevelUpMoves } from './LevelUpMoves';
import { MoveChips } from './MoveChips';
import { StatBars } from './StatBars';
import { TypeBadges, TypeDot } from './TypeBadge';
import { WeaknessRow } from './WeaknessRow';

/** Compact move list for the condensed row: type-dotted chips, no TM tags (the
 * full tagged list lives in the expanded detail). Renders nothing when the mon
 * has no moves recorded yet. */
function MonMoves({ moves }: { moves?: string[] }) {
  if (!moves || moves.length === 0) return null;
  return (
    <span className="mon-card-moves">
      {moves.slice(0, 4).map((m) => (
        <span key={m} className="mon-move-chip">
          <TypeDot type={moveType(m)} />
          {m.replace(/-/g, ' ')}
        </span>
      ))}
    </span>
  );
}

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
  const [ability, setAbility] = useState(p.ability ?? '');
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
      const payload: Extract<RunEvent, { type: 'pokemon_updated' }>['payload'] = { pokemonId: p.id };
      if (nickname.trim() && nickname.trim() !== p.nickname) payload.nickname = nickname.trim();
      // only touch the level when something numeric was entered — an empty
      // field means "leave it alone", not "reset to 1"
      if (level.trim() !== '' && Number.isFinite(Number(level))) {
        const lvl = clampLevel(level);
        if (lvl !== p.level) payload.level = lvl;
      }
      if (heldItem.trim() !== (p.heldItem ?? '')) payload.heldItem = heldItem.trim() || null;
      if (nature !== (p.nature ?? '')) payload.nature = nature || null;
      if (ability.trim() !== (p.ability ?? '')) payload.ability = ability.trim() || null;
      const cleanMoves = moves.map((m) => m.trim()).filter(Boolean);
      if (JSON.stringify(cleanMoves) !== JSON.stringify(p.moves ?? [])) payload.moves = cleanMoves;
      if (Object.keys(payload).length > 1) {
        await appendEvent(runId, { type: 'pokemon_updated', payload });
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
          <Combobox value={heldItem} onChange={setHeldItem} options={HELD_ITEMS} placeholder="none" icon={itemSpriteUrl} />
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
        {hasAbilitiesFor(gameId) && (
          <label>
            Ability
            <Combobox
              value={ability}
              onChange={setAbility}
              options={abilitiesFor(p.species, gameId)}
              placeholder="none"
            />
          </label>
        )}
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
      });
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
        await appendEvent(runId, { type: 'pokemon_evolution_reverted', payload: { pokemonId: p.id } });
        await onReverted();
      }}
    />
  );
}

/** Unified Pokémon card (team, box, graveyard) rendered as a full-width
 * horizontal row — mirrors the boss-fight rows (MilestoneCard): fixed head
 * column (sprite + name) on the left, an at-a-glance detail strip in the
 * middle (types · status · held item · nature · stat spark · next evolution),
 * and action buttons on the right. Clicking the head expands the row
 * DOWNWARD in place (no grid reflow) into full detail + the edit form.
 *
 * Rows stack vertically (one per line), so expanding one never mis-spaces its
 * neighbours the way the old wrapping grid did.
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
  const types = typesFor(p.species, gameId);
  const nextEvo = evolutionSummary(p.species);
  // condensed-row status word: box/graveyard get a chip; party is the default
  // (unmarked) state, so no chip there to keep the row uncluttered.
  const statusLabel = p.status === 'dead' ? 'Fainted' : p.status === 'box' ? 'Boxed' : null;

  return (
    <div className={`mon-card${expanded ? ' expanded' : ''}${p.status === 'dead' ? ' dead' : ''}`}>
      {/* the whole condensed row toggles expand; interactive children — the
          head button (keyboard target) and the action buttons — stop the click
          from bubbling so they don't also toggle */}
      <div className="mon-card-main" onClick={() => setExpanded((e) => !e)}>
        <button
          type="button"
          className="mon-card-head"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          aria-expanded={expanded}
        >
          <SpriteImg
            species={p.species}
            size={56}
            shiny={p.shiny}
            className={p.status === 'dead' ? 'sprite-dead' : ''}
          />
          <span className="mon-card-title">
            <span className="mon-card-name">
              {p.nickname}
              {p.shiny && (
                <span className="shiny-star" title="Shiny">
                  {' '}
                  ✦
                </span>
              )}
            </span>
            <span className="mon-card-species muted">
              {p.species} · Lv {p.level}
            </span>
          </span>
        </button>

        {/* at-a-glance strip — the full-width row lets us surface here what
            used to hide behind an expand: types, status, item, nature, a
            compact stat spark and the next-evolution nudge */}
        <div className="mon-card-glance">
          <TypeBadges types={types} />
          {statusLabel && <span className={`mon-status-chip mon-status-${p.status}`}>{statusLabel}</span>}
          {p.status === 'dead' && p.death && (
            <span className="mon-card-death">
              Fell to {p.death.cause ?? 'unknown cause'}
              {p.death.killer ? ` — ${p.death.killer}` : ''}
            </span>
          )}
          <span className="mon-card-meta muted">
            {p.heldItem ? <ItemSprite item={p.heldItem} /> : 'No item'}
            {p.nature ? ` · ${p.nature}` : ''}
            {p.ability ? ` · ${p.ability.replace(/-/g, ' ')}` : ''}
          </span>
          {/* moves + next-evolution always drop to their own second line so
              the row reads consistently, however short the meta line is */}
          {((p.moves && p.moves.length > 0) || nextEvo) && (
            <div className="mon-card-glance-row2">
              <MonMoves moves={p.moves} />
              {nextEvo && (
                <span className="mon-card-evo muted" title={`Evolves into ${nextEvo}`}>
                  ↗ {nextEvo}
                </span>
              )}
            </div>
          )}
        </div>

        {actions.length > 0 && (
          <div className="mon-card-actions" onClick={(e) => e.stopPropagation()}>
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
      </div>

      {expanded && (
        <div className="mon-card-detail">
          {p.status === 'dead' && p.death && (
            <span className="muted">
              Fell to {p.death.cause ?? 'unknown cause'}
              {p.death.killer ? ` — ${p.death.killer}` : ''}
            </span>
          )}
          <WeaknessRow types={types} />
          <StatBars species={p.species} nature={p.nature} gameId={gameId} />
          {editable ? (
            <>
              <EvolvePanel p={p} runId={runId} gameId={gameId} onEvolved={onChange} />
              <UnevolveButton p={p} runId={runId} onReverted={onChange} />
            </>
          ) : (
            nextEvo && <span className="poke-evo muted">↗ Evolves into {nextEvo}</span>
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
