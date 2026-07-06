import { useState } from 'react';
import type { Ruleset } from '@nuzlocke/engine';
import { appendEvent, createRun } from '../lib/db';

/** Shown while a wipe decision is pending. 'continue' derives to
 * 'wiped-continuing'; 'reset' derives to 'wiped' — both resolve the pending
 * decision in the engine fold, and the wipe stays in history either way (a
 * wipe is an event, not a silent reset — the log is append-only, so "restart"
 * can never scrub this run). What a restart really means is a FRESH run of
 * the same game and rules, so after ending we offer exactly that instead of
 * dumping the player back into the dead run wondering why nothing reset. */
export function WipeScreen({
  runId,
  gameId,
  version,
  ruleset,
  onResolved,
  onSwitchRun,
}: {
  runId: string;
  gameId: string;
  version: string;
  ruleset: Ruleset;
  onResolved: () => Promise<void>;
  onSwitchRun: (runId: string) => Promise<void> | void;
}) {
  const [ended, setEnded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function continueForFun() {
    setBusy(true);
    await appendEvent(runId, { type: 'wipe_decision', payload: { decision: 'continue' } });
    await onResolved();
  }

  async function endRun() {
    setBusy(true);
    await appendEvent(runId, { type: 'wipe_decision', payload: { decision: 'reset' } });
    setBusy(false);
    // hold off onResolved(): keep this panel up to offer the fresh start
    setEnded(true);
  }

  async function startFreshRun() {
    setBusy(true);
    // same game, version and CURRENT rules (incl. mid-run changes + house
    // rules); a brand-new event log — starter picker comes up via Routes
    const newId = await createRun(gameId, version, structuredClone(ruleset));
    await onSwitchRun(newId);
  }

  if (ended) {
    return (
      <section className="wipe-screen">
        <h2>Run ended.</h2>
        <p>
          The wipe stays in this run's history — it will show as <em>wiped</em> in your stats.
          Ready for the next attempt?
        </p>
        <div className="encounter-actions">
          <button disabled={busy} onClick={startFreshRun}>
            Start a fresh run (same game &amp; rules)
          </button>
          <button className="secondary" disabled={busy} onClick={() => onResolved()}>
            Not now
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="wipe-screen">
      <h2>Your team has wiped.</h2>
      <p>
        Every party member has fainted. This wipe stays in the run's history either way — keep
        playing for fun, or end this run and start the next attempt.
      </p>
      <div className="encounter-actions">
        <button disabled={busy} onClick={continueForFun}>
          Continue for fun
        </button>
        <button className="secondary" disabled={busy} onClick={endRun}>
          End this run
        </button>
      </div>
    </section>
  );
}
