import { useState } from 'react';
import type { RunState, SpecialEncounter } from '@nuzlocke/engine';
import { appendEvent } from '../lib/db';
import { typesFor } from '../lib/speciesData';
import { SpriteImg } from './SpriteImg';
import { TypeBadges } from './TypeBadge';

const TYPE_LABEL: Record<SpecialEncounter['type'], string> = {
  gift: 'Gift',
  static: 'Static',
  trade: 'Trade',
  fossil: 'Fossil',
  egg: 'Egg',
};

/** Inline claim form for one special: nickname / level / shiny. Its sprite is
 * already shown in the card head above (which reflects the shiny toggle
 * live) — no need to repeat it here. */
function ClaimForm({
  species,
  shiny,
  onShinyChange,
  onClaim,
}: {
  species: string;
  shiny: boolean;
  onShinyChange: (shiny: boolean) => void;
  onClaim: (nickname: string, level: number, shiny: boolean) => void;
}) {
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('5');
  return (
    <div className="special-claim-form">
      <div className="special-claim-fields">
        <label>
          Nickname
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={species} />
        </label>
        <label>
          Level
          <input type="text" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
        <label className="shiny-toggle">
          <input type="checkbox" checked={shiny} onChange={(e) => onShinyChange(e.target.checked)} />
          Shiny ✦
        </label>
      </div>
      <button onClick={() => onClaim(nickname || species, Number(level) || 1, shiny)}>Claim</button>
    </div>
  );
}

/** The (if any) Pokémon in `state` claimed for a given special id. */
export function claimedSpecial(specialId: string, state: RunState) {
  return Object.values(state.pokemon).find((p) => p.origin?.specialId === specialId) ?? null;
}

/**
 * One claimable/claimed special card — self-contained (owns its own claim/
 * reset via appendEvent), so it can be dropped in wherever a special is
 * contextually relevant: the game-picker starter step, or a route/area's
 * panel in the Routes tab for gifts/fossils/statics found there.
 */
export function SpecialCard({
  s,
  runId,
  state,
  onChange,
  badge,
  hideBadge,
}: {
  s: SpecialEncounter;
  runId: string;
  state: RunState;
  onChange: () => Promise<void>;
  badge?: string;
  hideBadge?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [shiny, setShiny] = useState(false);
  const mon = claimedSpecial(s.id, state);

  async function claim(nickname: string, level: number, shiny: boolean) {
    await appendEvent(runId, {
      type: 'special_claimed',
      payload: { specialId: s.id, species: s.species, pokemonId: crypto.randomUUID(), nickname, level, ...(shiny ? { shiny: true } : {}) },
    } as never);
    setOpen(false);
    setShiny(false);
    await onChange();
  }

  async function reset() {
    await appendEvent(runId, { type: 'special_reset', payload: { specialId: s.id } } as never);
    setOpen(false);
    await onChange();
  }

  if (mon) {
    return (
      <div className="special-card claimed">
        <div className="special-card-head">
          <SpriteImg species={s.species} size={88} shiny={mon.shiny} />
          <div className="special-card-title">
            <strong>{mon.nickname}</strong>
            <span className="muted">
              {s.species} · Lv {mon.level}
              {mon.shiny ? ' ✦' : ''}
            </span>
          </div>
        </div>
        <button className="secondary special-card-reset" onClick={reset}>
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className={`special-card${open ? ' open' : ''}`}>
      <button className="special-card-head special-card-pick" onClick={() => setOpen((o) => !o)}>
        <SpriteImg species={s.species} size={88} shiny={open && shiny} />
        <div className="special-card-title">
          <strong>{s.species}</strong>
          {!hideBadge && <span className="muted">{badge ?? TYPE_LABEL[s.type]}</span>}
          <TypeBadges types={typesFor(s.species)} />
        </div>
      </button>
      {open && <ClaimForm species={s.species} shiny={shiny} onShinyChange={setShiny} onClaim={claim} />}
    </div>
  );
}

/** Starter picker: a grid of mutually-exclusive starter choices, or the
 * claimed one once picked. Used both by the game-picker "choose your
 * starter" step and as a Routes-tab fallback for runs where it was skipped. */
export function StarterPicker({
  runId,
  state,
  starters,
  onChange,
}: {
  runId: string;
  state: RunState;
  starters: SpecialEncounter[];
  onChange: () => Promise<void>;
}) {
  const chosen = starters.find((s) => claimedSpecial(s.id, state));
  return (
    <div className="specials-group">
      <p className="muted specials-group-label">{chosen ? 'Your starter' : 'Starter — choose one'}</p>
      <div className="specials-grid">
        {(chosen ? [chosen] : starters).map((s) => (
          <SpecialCard key={s.id} s={s} runId={runId} state={state} onChange={onChange} badge="Starter" hideBadge />
        ))}
      </div>
    </div>
  );
}
