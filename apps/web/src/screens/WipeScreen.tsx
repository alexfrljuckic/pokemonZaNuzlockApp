import { appendEvent } from '../lib/db';

export function WipeScreen({ runId, onResolved }: { runId: string; onResolved: () => Promise<void> }) {
  async function choose(decision: 'reset' | 'continue') {
    // 'continue' derives to 'wiped-continuing'; 'reset' derives to 'wiped' —
    // both resolve the pending decision in the engine fold, and the wipe stays
    // in history either way (a wipe is an event, not a silent reset). The
    // player starts a fresh run for the next attempt.
    await appendEvent(runId, { type: 'wipe_decision', payload: { decision } });
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
