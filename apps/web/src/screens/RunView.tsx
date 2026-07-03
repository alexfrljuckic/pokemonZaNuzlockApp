import { useEffect, useMemo, useState } from 'react';
import { deriveState, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { appendEvent, loadEvents, type RunSummary } from '../lib/db';

export function RunView({ run, onBack }: { run: RunSummary; onBack: () => void }) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [note, setNote] = useState('');

  async function refresh() {
    setEvents(await loadEvents(run.id));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id]);

  const ctx = useMemo(() => ({ dataset: DATASETS[run.gameId], speciesToLine }), [run.gameId]);

  // The engine's deriveState is the ONLY place run state is computed — nothing
  // here stores or mutates derived fields; a reload just replays the same events.
  const state = useMemo(() => (events.length ? deriveState(events, ctx) : null), [events, ctx]);

  async function handleAddNote() {
    if (!note.trim()) return;
    await appendEvent(run.id, { type: 'note', payload: { text: note.trim() } });
    setNote('');
    await refresh();
  }

  const party = state ? Object.values(state.pokemon).filter((p) => p.status === 'party') : [];

  return (
    <>
      <button className="secondary" onClick={onBack}>
        ← Back to runs
      </button>

      <section>
        <h2>{ctx.dataset?.name ?? run.gameId}</h2>
        <p className="muted">
          {run.version} · preset {state?.ruleset.presetId} ·{' '}
          <span className={`status-${state?.status}`}>{state?.status}</span>
        </p>
        <p className="muted">
          Party: {party.length ? party.map((p) => `${p.nickname} (Lv ${p.level})`).join(', ') : 'none yet'}
        </p>
      </section>

      <section>
        <h2>Log a note</h2>
        <p className="muted">
          Appends a `note` event to this run's log and reloads it from IndexedDB — proves events survive a
          page refresh.
        </p>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. reached Route 203"
        />
        <button onClick={handleAddNote} disabled={!note.trim()}>
          Add note
        </button>
      </section>

      <section>
        <h2>Event log ({events.length})</h2>
        <div className="event-log">
          {events.map((ev) => (
            <div key={ev.seq}>
              #{ev.seq} {ev.type} — {new Date(ev.at).toLocaleTimeString()}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
