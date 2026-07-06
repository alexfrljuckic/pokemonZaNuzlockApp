import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { deriveState, pendingWipeDecision, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { appendEvent, loadEvents, type RunSummary } from '../lib/db';
import { downloadRunExport } from '../lib/exportRun';
import { syncRun, SYNC_AVAILABLE } from '../lib/sync';
import { applyVersionTheme } from '../lib/theme';
import { RunSummaryStrip } from '../components/RunSummaryStrip';
import { SharePopover } from '../components/SharePopover';
import { RoutesTab } from './tabs/RoutesTab';
import { TeamBoxTab } from './tabs/TeamBoxTab';
import { MilestonesTab } from './tabs/MilestonesTab';
import { RulesTab } from './tabs/RulesTab';
import { StatsTab } from './tabs/StatsTab';
import { WipeScreen } from './WipeScreen';

const TABS = ['Routes', 'Team & Box', 'Boss Fights', 'Rules', 'Stats'] as const;
type Tab = (typeof TABS)[number];

// End a run from any tab. Inline expanding confirm (no window.confirm — Alex
// hates browser prompts). Hidden once the run is already finished
// (victory/wiped/abandoned); available for active and wiped-continuing runs.
function EndRunControl({
  runId,
  status,
  onEnded,
}: {
  runId: string;
  status: string;
  onEnded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (status === 'victory' || status === 'wiped' || status === 'abandoned') return null;

  async function end(result: 'victory' | 'abandoned') {
    setBusy(true);
    await appendEvent(runId, { type: 'run_ended', payload: { result } });
    setBusy(false);
    setOpen(false);
    onEnded();
  }

  if (!open) {
    return (
      <button className="secondary end-run-btn" onClick={() => setOpen(true)}>
        End run
      </button>
    );
  }

  return (
    <div className="end-run-confirm" role="group" aria-label="End this run">
      <span className="muted">End run as…</span>
      <button disabled={busy} onClick={() => end('victory')}>
        Mark as victory
      </button>
      <button className="danger" disabled={busy} onClick={() => end('abandoned')}>
        Abandon run
      </button>
      <button className="secondary" disabled={busy} onClick={() => setOpen(false)}>
        Cancel
      </button>
    </div>
  );
}

export function RunView({ run, session }: { run: RunSummary; session: Session | null }) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [tab, setTab] = useState<Tab>('Routes');

  // Opening a run themes the app to that game's version, unless the user has
  // explicitly picked a theme from the header dropdown.
  useEffect(() => {
    applyVersionTheme(run.version);
  }, [run.version]);

  async function refresh() {
    setEvents(await loadEvents(run.id));
    // Best-effort background sync: push local changes, pull anything new from
    // other devices, then re-read if the pull actually added events. Network
    // failures are swallowed — IndexedDB stays the source of truth regardless,
    // per the local-first invariant (nothing here can break offline use).
    if (SYNC_AVAILABLE && session) {
      syncRun(run, session.user.id)
        .then(async (changed) => {
          if (changed) setEvents(await loadEvents(run.id));
        })
        .catch(() => {});
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id]);

  const ctx = useMemo(() => ({ dataset: DATASETS[run.gameId], speciesToLine }), [run.gameId]);

  // The engine's deriveState is the ONLY place run state is computed — nothing here
  // stores or mutates derived fields; every render replays the same events fresh.
  // Guarded on the dataset existing: deriveState against an undefined dataset throws.
  const state = useMemo(
    () => (events.length && ctx.dataset ? deriveState(events, ctx) : null),
    [events, ctx],
  );

  // A run whose gameId has no dataset in this build (removed game, legacy id)
  // can't be opened, but it must never white-screen the app — its event log is
  // intact, so offer export and a way back instead.
  if (!ctx.dataset) {
    return (
      <section>
        <h2>Unsupported run</h2>
        <p className="muted">
          This run was created for “{run.gameId}” ({run.version}), which this version of the app
          has no game data for. It can't be opened, but its full event log is safe — export it
          below, or use the ← button above to go back to your runs.
        </p>
        <p className="muted">Started {new Date(run.createdAt).toLocaleDateString()}</p>
        <div className="panel-actions">
          <button
            className="secondary"
            onClick={async () => downloadRunExport(run, await loadEvents(run.id))}
          >
            Export JSON
          </button>
        </div>
      </section>
    );
  }

  if (!state) {
    return <p className="muted">Loading run…</p>;
  }

  const showWipeScreen = pendingWipeDecision(state);

  return (
    <>
      <section>
        <div className="run-header-row">
          <div>
            <h2>{ctx.dataset?.name ?? run.gameId}</h2>
            <p className="muted">
              {run.version} · preset {state.ruleset.presetId} ·{' '}
              <span className={`status-${state.status}`}>{state.status}</span>
            </p>
          </div>
          <div className="run-header-actions">
            {SYNC_AVAILABLE && session && <SharePopover runId={run.id} />}
            <EndRunControl runId={run.id} status={state.status} onEnded={refresh} />
          </div>
        </div>
      </section>

      {showWipeScreen ? (
        <WipeScreen runId={run.id} onResolved={refresh} />
      ) : (
        <>
          <RunSummaryStrip events={events} state={state} ctx={ctx} />

          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={t === tab ? '' : 'secondary'}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          {tab === 'Routes' && <RoutesTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Team & Box' && <TeamBoxTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Boss Fights' && <MilestonesTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Rules' && <RulesTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Stats' && <StatsTab events={events} state={state} ctx={ctx} timeline />}
        </>
      )}
    </>
  );
}
