import { useState } from 'react';
import type { EngineContext, RunState, SpecialEncounter } from '@nuzlocke/engine';
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

/** Inline claim form for one special: nickname / level / shiny. */
function ClaimForm({ species, onClaim }: { species: string; onClaim: (nickname: string, level: number, shiny: boolean) => void }) {
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('5');
  const [shiny, setShiny] = useState(false);
  return (
    <div className="special-claim-form">
      <SpriteImg species={species} size={72} shiny={shiny} />
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
          <input type="checkbox" checked={shiny} onChange={(e) => setShiny(e.target.checked)} />
          Shiny ✦
        </label>
      </div>
      <button onClick={() => onClaim(nickname || species, Number(level) || 1, shiny)}>Claim</button>
    </div>
  );
}

export function SpecialsSection({
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
  const [openId, setOpenId] = useState<string | null>(null);
  const specials = ctx.dataset.specials ?? [];
  if (specials.length === 0) return null;

  const claimedBy = (specialId: string) =>
    Object.values(state.pokemon).find((p) => p.origin?.specialId === specialId) ?? null;

  const starters = specials.filter((s) => s.id.startsWith('starter-'));
  const others = specials.filter((s) => !s.id.startsWith('starter-'));
  const chosenStarter = starters.find((s) => claimedBy(s.id));

  async function claim(s: SpecialEncounter, nickname: string, level: number, shiny: boolean) {
    await appendEvent(runId, {
      type: 'special_claimed',
      payload: { specialId: s.id, species: s.species, pokemonId: crypto.randomUUID(), nickname, level, ...(shiny ? { shiny: true } : {}) },
    } as never);
    setOpenId(null);
    await onChange();
  }

  async function reset(s: SpecialEncounter) {
    await appendEvent(runId, { type: 'special_reset', payload: { specialId: s.id } } as never);
    setOpenId(null);
    await onChange();
  }

  function SpecialCard({ s, badge }: { s: SpecialEncounter; badge?: string }) {
    const mon = claimedBy(s.id);
    const open = openId === s.id;
    if (mon) {
      return (
        <div className="special-card claimed">
          <div className="special-card-head">
            <SpriteImg species={s.species} size={48} shiny={mon.shiny} />
            <div className="special-card-title">
              <strong>{mon.nickname}</strong>
              <span className="muted">
                {s.species} · Lv {mon.level}
                {mon.shiny ? ' ✦' : ''}
              </span>
            </div>
            <button className="secondary" onClick={() => reset(s)}>
              Reset
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className={`special-card${open ? ' open' : ''}`}>
        <button className="special-card-head special-card-pick" onClick={() => setOpenId(open ? null : s.id)}>
          <SpriteImg species={s.species} size={48} />
          <div className="special-card-title">
            <strong>{s.species}</strong>
            <span className="muted">{badge ?? TYPE_LABEL[s.type]}</span>
            <TypeBadges types={typesFor(s.species)} />
          </div>
        </button>
        {open && <ClaimForm species={s.species} onClaim={(n, l, sh) => claim(s, n, l, sh)} />}
      </div>
    );
  }

  return (
    <div className="specials-section">
      <h3 className="route-offmap-title">Gifts &amp; Specials</h3>

      {starters.length > 0 && (
        <div className="specials-group">
          <p className="muted specials-group-label">{chosenStarter ? 'Your starter' : 'Starter — choose one'}</p>
          <div className="specials-grid">
            {(chosenStarter ? [chosenStarter] : starters).map((s) => (
              <SpecialCard key={s.id} s={s} badge="Starter" />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="specials-grid">
          {others.map((s) => (
            <SpecialCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
