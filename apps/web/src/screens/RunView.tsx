import { useEffect, useMemo, useState } from 'react';
import { deriveState, pendingWipeDecision, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { loadEvents, type RunSummary } from '../lib/db';
import { AreasTab } from './tabs/AreasTab';
import { TeamBoxTab } from './tabs/TeamBoxTab';
import { MilestonesTab } from './tabs/MilestonesTab';
import { RulesTab } from './tabs/RulesTab';
import { StatsTab } from './tabs/StatsTab';
import { WipeScreen } from './WipeScreen';

const TABS = ['Areas', 'Team & Box', 'Milestones', 'Rules', 'Stats'] as const;
type Tab = (typeof TABS)[number];

export function RunView({ run, onBack }: { run: RunSummary; onBack: () => void }) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [tab, setTab] = useState<Tab>('Areas');

  async function refresh() {
    setEvents(await loadEvents(run.id));
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

          {tab === 'Areas' && <AreasTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Team & Box' && <TeamBoxTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Milestones' && <MilestonesTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Rules' && <RulesTab runId={run.id} state={state} ctx={ctx} onChange={refresh} />}
          {tab === 'Stats' && <StatsTab events={events} state={state} ctx={ctx} />}
        </>
      )}
    </>
  );
}
