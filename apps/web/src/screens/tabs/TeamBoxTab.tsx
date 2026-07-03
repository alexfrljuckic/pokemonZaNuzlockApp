import type { EngineContext, PokemonInstance, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

function PokemonCard({
  p,
  actions,
}: {
  p: PokemonInstance;
  actions: { label: string; onClick: () => void; secondary?: boolean }[];
}) {
  return (
    <div className="pokemon-card">
      <span>
        {p.nickname} <span className="muted">({p.species}, Lv {p.level})</span>
      </span>
      {p.status === 'dead' && p.death && (
        <span className="muted">
          {p.death.cause ?? 'unknown cause'}
          {p.death.killer ? ` — ${p.death.killer}` : ''}
        </span>
      )}
      <span className="pokemon-actions">
        {actions.map((a) => (
          <button key={a.label} className={a.secondary ? 'secondary' : ''} onClick={a.onClick}>
            {a.label}
          </button>
        ))}
      </span>
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

  async function move(id: string, to: 'party' | 'box') {
    await appendEvent(runId, { type: 'moved', payload: { pokemonId: id, to } });
    await onChange();
  }

  async function markFaint(id: string) {
    // No cause/killer prompts — fainting is one seamless click (Alex's UX
    // feedback). The event payload still supports those fields for later.
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
        <h2>Team ({party.length})</h2>
        {party.length === 0 && <p className="muted">No party members yet.</p>}
        {party.map((p) => (
          <PokemonCard
            key={p.id}
            p={p}
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
        {box.map((p) => (
          <PokemonCard
            key={p.id}
            p={p}
            actions={[
              { label: 'Party', onClick: () => move(p.id, 'party') },
              { label: 'Fainted', onClick: () => markFaint(p.id), secondary: true },
            ]}
          />
        ))}
      </section>

      <section>
        <h2>Graveyard ({graveyard.length})</h2>
        <p className="muted">Revive tokens available: {state.reviveTokens}</p>
        {graveyard.length === 0 && <p className="muted">No losses yet.</p>}
        {graveyard.map((p) => (
          <PokemonCard
            key={p.id}
            p={p}
            actions={
              state.reviveTokens > 0
                ? [{ label: 'Revive (to box)', onClick: () => revive(p.id) }]
                : []
            }
          />
        ))}
      </section>
    </>
  );
}
