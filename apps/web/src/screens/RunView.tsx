import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { deriveState, pendingWipeDecision, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { loadEvents, type RunSummary } from '../lib/db';
import { syncRun, SYNC_AVAILABLE } from '../lib/sync';
import { AreasTab } from './tabs/AreasTab';
import { TeamBoxTab } from './tabs/TeamBoxTab';
import { MilestonesTab } from './tabs/MilestonesTab';
import { RulesTab } from './tabs/RulesTab';
import { StatsTab } from './tabs/StatsTab';
import { ShareTab } from './tabs/ShareTab';
import { WipeScreen } from './WipeScreen';

const TABS = ['Areas', 'Team & Box', 'Milestones', 'Rules', 'Stats'] as const;
type Tab = (typeof TABS)[number] | 'Share';

export function RunView({
  run,
  session,
  onBack,
}: {
  run: RunSummary;
  session: Session | null;
  onBack: () => void;
}) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [tab, setTab] = useState<Tab>('Areas');

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
  const state = useMemo(() => (events.length ? deriveState(events, ctx) : null), [events, ctx]);

  if (!state) {
    return (
      <button className="secondary" onClick={onBack}>
        ← Back to runs
      </button>
    );
  }

  const showWipeScreen = pendingWipeDecision(state);

  return (
    <>
      <button className="secondary" onClick={onBack}>
        ← Back to runs
      </button>

      <section>
        <h2>{ctx.dataset?.name ?? run.gameId}</h2>
        <p className="muted">
          {run.version} · preset {state.ruleset.presetId} ·{' '}
          <span className={`status-${state.status}`}>{state.status}</span>
        </p>
      </section>

      {showWipeScreen ? (
        <WipeScreen runId={run.id} onResolved={refresh} />
      ) : (
        <>
          <nav className="tabs">
            {[...TABS, ...(SYNC_AVAILABLE && session ? (['Share'] as const) : [])].map((t) => (
              <button
                key={t}
                className={t === tab ? '' : 'secondary'}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          {tab === 'Areas' && <AreasTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Team & Box' && <TeamBoxTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Milestones' && <MilestonesTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Rules' && <RulesTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Stats' && <StatsTab events={events} state={state} ctx={ctx} />}
          {tab === 'Share' && <ShareTab runId={run.id} />}
        </>
      )}
    </>
  );
}
