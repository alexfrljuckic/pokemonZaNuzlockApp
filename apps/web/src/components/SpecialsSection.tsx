import { useState } from 'react';
import type { RunState, SpecialEncounter } from '@nuzlocke/engine';
import { appendEvent } from '../lib/db';
import { typesFor } from '../lib/speciesData';
import { CatchFields, clampLevel } from './CatchFields';
import { ConfirmAction } from './ConfirmAction';
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
      <CatchFields
        species={species}
        nickname={nickname}
        onNickname={setNickname}
        level={level}
        onLevel={setLevel}
        shiny={shiny}
        onShiny={onShinyChange}
        className="special-claim-fields"
      />
      <button onClick={() => onClaim(nickname || species, clampLevel(level), shiny)}>Claim</button>
    </div>
  );
}

/** Heading text for the starter-claim step — shared by the game-picker flow
 * and the Routes-tab fallback so the wording never drifts. */
export function starterHeading(starters: SpecialEncounter[]): string {
  return starters.length > 1 ? 'Choose your starter' : 'Your partner Pokémon';
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
  gameId,
  onChange,
  badge,
  hideBadge,
}: {
  s: SpecialEncounter;
  runId: string;
  state: RunState;
  /** the run's game — routes type lookups through per-game overrides (Radical
   * Red retypes some species). Optional; falls back to the global dex. */
  gameId?: string;
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
    });
    setOpen(false);
    setShiny(false);
    await onChange();
  }

  async function reset() {
    await appendEvent(runId, { type: 'special_reset', payload: { specialId: s.id } });
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
        <ConfirmAction
          label="Reset"
          triggerClass="secondary special-card-reset"
          prompt={`Reset this claim? Removes ${mon.nickname} from your run.`}
          ariaLabel={`Reset ${s.species} claim`}
          onConfirm={reset}
        />
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
          <TypeBadges types={typesFor(s.species, gameId)} />
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
  gameId,
  onChange,
}: {
  runId: string;
  state: RunState;
  starters: SpecialEncounter[];
  /** the run's game — routes type lookups through per-game overrides (Radical
   * Red retypes some species). Optional; falls back to the global dex. */
  gameId?: string;
  onChange: () => Promise<void>;
}) {
  const chosen = starters.find((s) => claimedSpecial(s.id, state));
  const label = chosen ? 'Your starter' : starters.length > 1 ? 'Starter — choose one' : 'Your partner';
  return (
    <div className="specials-group">
      <p className="muted specials-group-label">{label}</p>
      <div className="specials-grid">
        {(chosen ? [chosen] : starters).map((s) => (
          <SpecialCard key={s.id} s={s} runId={runId} state={state} gameId={gameId} onChange={onChange} badge="Starter" hideBadge />
        ))}
      </div>
    </div>
  );
}
