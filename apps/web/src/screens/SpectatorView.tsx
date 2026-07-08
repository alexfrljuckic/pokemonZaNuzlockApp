import { useEffect, useMemo, useState } from 'react';
import { deriveState, pendingWipeDecision, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { TAB_SLUGS, tabLabelForSlug, type TabSlug } from '../lib/route';
import { fetchSharedRun, subscribeToRunChanges, type SharedRun } from '../lib/shareLinks';
import { RunSummaryStrip } from '../components/RunSummaryStrip';
import { RunTimeline } from '../components/RunTimeline';
import { MilestonesTab } from './tabs/MilestonesTab';
import { RulesTab } from './tabs/RulesTab';
import { StatsTab } from './tabs/StatsTab';
import { TeamBoxTab } from './tabs/TeamBoxTab';

export function SpectatorView({
  token,
  tab = 'routes',
  onTabChange,
}: {
  token: string;
  /** Active tab as a url slug (from #share/<token>/<tab>). */
  tab?: TabSlug;
  /** Switch tabs by writing the URL; new slug flows back down as `tab`. */
  onTabChange?: (tab: TabSlug) => void;
}) {
  const [shared, setShared] = useState<SharedRun | null | 'loading'>('loading');

  async function refresh() {
    setShared(await fetchSharedRun(token));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (shared === 'loading' || !shared) return;
    return subscribeToRunChanges(shared.runId, refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared === 'loading' || !shared ? null : shared.runId]);

  if (shared === 'loading') {
    return <p className="muted">Loading…</p>;
  }
  if (!shared) {
    return (
      <section>
        <h2>Link not found</h2>
        <p className="muted">This share link is invalid or has been revoked by its owner.</p>
      </section>
    );
  }

  return <SpectatorRun shared={shared} tab={tab} onTabChange={onTabChange} />;
}

function SpectatorRun({
  shared,
  tab,
  onTabChange,
}: {
  shared: SharedRun;
  tab: TabSlug;
  onTabChange?: (tab: TabSlug) => void;
}) {
  const ctx = useMemo(() => ({ dataset: DATASETS[shared.gameId], speciesToLine }), [shared.gameId]);
  const state = useMemo(
    () => (shared.events.length ? deriveState(shared.events as RunEvent[], ctx) : null),
    [shared.events, ctx],
  );

  if (!state || !ctx.dataset) {
    return <p className="muted">Unsupported or empty run.</p>;
  }

  const events = shared.events as RunEvent[];
  const showWipeScreen = pendingWipeDecision(state);

  return (
    <>
      <section>
        <h2>{ctx.dataset.name}</h2>
        <p className="muted">
          {shared.version} · preset {state.ruleset.presetId} ·{' '}
          <span className={`status-${state.status}`}>{state.status}</span> · <span className="muted">read-only</span>
        </p>
      </section>

      {showWipeScreen && (
        <section className="wipe-screen">
          <h2>Team wiped</h2>
          <p>Waiting on the owner to decide whether to continue or end this run.</p>
        </section>
      )}

      <RunSummaryStrip events={events} state={state} ctx={ctx} />

      {/* Spectator mirrors the owner's five read-only tabs so #share/<token>/<tab>
          deep-links to the same section. When no onTabChange is supplied (e.g.
          embedded/preview contexts) the bar is inert but still selects a tab. */}
      <nav className="tabs" role="tablist" aria-label="Run sections">
        {TAB_SLUGS.map((slug) => (
          <button
            key={slug}
            role="tab"
            className={slug === tab ? '' : 'secondary'}
            aria-selected={slug === tab}
            onClick={() => onTabChange?.(slug)}
          >
            {tabLabelForSlug(slug)}
          </button>
        ))}
      </nav>

      {/* Spectator reuses the owner's tab components in read-only mode (no
          runId/onChange) so any change to them lands in both views at once. */}
      {tab === 'team' && <TeamBoxTab state={state} ctx={ctx} />}

      {tab === 'bosses' && <MilestonesTab state={state} ctx={ctx} />}

      {tab === 'rules' && <RulesTab state={state} ctx={ctx} />}

      {tab === 'stats' && <StatsTab events={events} state={state} ctx={ctx} />}

      {tab === 'routes' && (
        <section>
          <h2>Timeline</h2>
          <RunTimeline events={events} ctx={ctx} pokemon={state.pokemon} />
        </section>
      )}
    </>
  );
}
