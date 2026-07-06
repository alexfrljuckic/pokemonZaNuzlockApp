import { boxed, fallen, party, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { MonCard } from '../../components/MonCard';

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
  const team = party(state);
  const box = boxed(state);
  const graveyard = fallen(state);

  async function move(id: string, to: 'party' | 'box') {
    await appendEvent(runId, { type: 'moved', payload: { pokemonId: id, to } });
    await onChange();
  }

  async function markFaint(id: string) {
    // Payload still supports cause/killer later.
    await appendEvent(runId, { type: 'faint', payload: { pokemonId: id } });
    await onChange();
  }

  // A faint is the most consequential act in a nuzlocke — inline confirm
  // (via MonCard's ConfirmAction rendering), never a bare one-click.
  const faintAction = (p: { id: string; nickname: string }) => ({
    label: 'Fainted',
    onClick: () => markFaint(p.id),
    secondary: true,
    confirm: {
      prompt: `Mark ${p.nickname} as fainted?`,
      ariaLabel: `Mark ${p.nickname} as fainted`,
    },
  });

  async function revive(id: string) {
    await appendEvent(runId, { type: 'revive', payload: { pokemonId: id } });
    await onChange();
  }

  return (
    <>
      <section>
        <h2>Team ({team.length}/6)</h2>
        {team.length === 0 && <p className="muted">No party members yet.</p>}
        <div className="mon-grid">
          {team.map((p) => (
            <MonCard
              key={p.id}
              p={p}
              runId={runId}
              gameId={gameId}
              onChange={onChange}
              actions={[
                { label: 'Box', onClick: () => move(p.id, 'box'), secondary: true },
                faintAction(p),
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
                faintAction(p),
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
