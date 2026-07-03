import { appendEvent } from '../lib/db';

export function WipeScreen({ runId, onResolved }: { runId: string; onResolved: () => Promise<void> }) {
  async function choose(decision: 'reset' | 'continue') {
    await appendEvent(runId, { type: 'wipe_decision', payload: { decision } });
    // 'continue' sets status to 'wiped-continuing' in deriveState, which resolves the
    // pending decision. 'reset' has no dedicated status transition in the engine (a
    // wipe is never erased from history) — this run is instead marked abandoned so it
    // drops out of "pending decision" and the player starts a fresh run for the next
    // attempt, per the domain invariant that a wipe is an event, not a silent reset.
    if (decision === 'reset') {
      await appendEvent(runId, { type: 'run_ended', payload: { result: 'abandoned' } });
    }
    await onResolved();
  }

  return (
    <section className="wipe-screen">
      <h2>Your team has wiped.</h2>
      <p>
        Every party member has fainted. This wipe stays in the run's history either way — choose whether to
        keep playing for fun, or end this run and start a new one.
      </p>
      <div className="encounter-actions">
        <button onClick={() => choose('continue')}>Continue for fun</button>
        <button className="secondary" onClick={() => choose('reset')}>
          End this run
        </button>
      </div>
    </section>
  );
}
