import { useEffect, useState } from 'react';
import { questRewardStatus, type EngineContext, type Quest, type RunState, type SpecialEncounter } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { SpecialCard, claimedSpecial } from '../../components/SpecialsSection';

type Filter = 'all' | 'todo' | 'done' | 'pokemon';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To do' },
  { id: 'done', label: 'Done' },
  { id: 'pokemon', label: 'Pokémon rewards' },
];

const MODE_TEXT = {
  'area-encounter': "use up the encounter of the area where you get the quest",
  free: 'are free to keep (no encounter used)',
  banned: "are banned — they can't join your team",
} as const;

/** One claimable card per reward Pokémon. Ids are stable per quest + slot. */
export const rewardSpecials = (q: Quest): SpecialEncounter[] =>
  (q.rewardPokemon ?? []).map((species, i) => ({ id: `${q.id}-${i}-${species}`, type: 'gift', species, area: q.area }));

const domIdFor = (questId: string) => `quest-${questId}`;

/** Side quests (PLA requests) grouped by the area you pick them up in.
 * Completion is display-only; reward Pokémon are claimed under the
 * 'quest-reward-pokemon' rule. */
export function QuestsTab({
  runId,
  state,
  ctx,
  onChange,
  focusQuestId,
  onOpenArea,
}: {
  /** owner run id; omit (with onChange) for the read-only spectator view */
  runId?: string;
  state: RunState;
  ctx: EngineContext;
  onChange?: () => Promise<void>;
  /** quest to scroll to and highlight (from a Routes area) */
  focusQuestId?: string | null;
  /** jump to an area in Routes */
  onOpenArea?: (areaId: string) => void;
}) {
  const editable = runId != null && onChange != null;
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const quests = ctx.dataset.quests ?? [];
  const done = (id: string) => state.questsCompleted.includes(id);
  const doneCount = quests.filter((q) => done(q.id)).length;
  const mode = questRewardStatus(state, { area: '' }).mode;

  useEffect(() => {
    if (!focusQuestId) return;
    setFilter('all');
    setQuery('');
    requestAnimationFrame(() =>
      document.getElementById(domIdFor(focusQuestId))?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
    );
  }, [focusQuestId]);

  async function toggle(q: Quest) {
    if (!runId || !onChange) return;
    await appendEvent(
      runId,
      done(q.id) ? { type: 'quest_reset', payload: { questId: q.id } } : { type: 'quest_completed', payload: { questId: q.id } },
    );
    await onChange();
  }

  const needle = query.trim().toLowerCase();
  const visible = quests.filter((q) => {
    if (filter === 'todo' && done(q.id)) return false;
    if (filter === 'done' && !done(q.id)) return false;
    if (filter === 'pokemon' && !q.rewardPokemon?.length) return false;
    if (!needle) return true;
    return [String(q.number), q.name, q.giver ?? '', q.location, ...q.rewards].some((t) => t.toLowerCase().includes(needle));
  });
  const groups = ctx.dataset.areas
    .map((area) => ({ area, quests: visible.filter((q) => q.area === area.id) }))
    .filter((g) => g.quests.length > 0);

  return (
    <section>
      <h2>
        Quests ({doneCount}/{quests.length} done)
      </h2>
      <p className="muted">
        Side requests, grouped by the area where you pick them up. Reward Pokémon {MODE_TEXT[mode]}
        {editable ? ' (change this in Rules)' : ''}.
      </p>
      <div className="quests-toolbar">
        <div className="quests-filters" role="group" aria-label="Filter quests">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`zone-chip${filter === f.id ? ' selected' : ''}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="quests-search"
          placeholder="Search # , name, reward…"
          aria-label="Search quests"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {groups.length === 0 && <p className="muted">No quests match.</p>}
      {groups.map(({ area, quests: list }) => (
        <div key={area.id} className="quests-area">
          <div className="quests-area-head">
            <h3 className="chart-heading">{area.name}</h3>
            {onOpenArea && (
              <button type="button" className="secondary quests-area-link" onClick={() => onOpenArea(area.id)}>
                📍 Open in Routes
              </button>
            )}
          </div>
          <div className="quest-list">
            {list.map((q) => {
              const isDone = done(q.id);
              const status = questRewardStatus(state, q);
              return (
                <article
                  key={q.id}
                  id={domIdFor(q.id)}
                  className={`quest-card${isDone ? ' done' : ''}${focusQuestId === q.id ? ' focused' : ''}`}
                >
                  <div className="quest-card-head">
                    {editable ? (
                      <button
                        type="button"
                        className={`quest-check-btn${isDone ? ' done' : ''}`}
                        aria-pressed={isDone}
                        aria-label={isDone ? `Mark #${q.number} not done` : `Mark #${q.number} done`}
                        onClick={() => toggle(q)}
                      >
                        {isDone ? '✓' : ''}
                      </button>
                    ) : (
                      <span className={`quest-check${isDone ? ' done' : ''}`} aria-label={isDone ? 'done' : 'not done'}>
                        {isDone ? '✓' : '○'}
                      </span>
                    )}
                    <div className="quest-card-title">
                      <strong>
                        <span className="quest-num">#{q.number}</span> {q.name}
                      </strong>
                      <span className="muted">
                        {q.giver ? `${q.giver} · ` : ''}
                        {q.location}
                      </span>
                    </div>
                    {q.group === 'daybreak' && <span className="quest-badge">Daybreak</span>}
                  </div>
                  <p className="quest-unlock muted">Unlock: {q.unlock}</p>
                  <div className="quest-rewards">
                    {q.rewards.map((r, i) => (
                      <span key={i} className="quest-reward-chip">
                        {r}
                      </span>
                    ))}
                  </div>
                  {q.rewardPokemon?.length ? (
                    editable ? (
                      <div className="specials-grid quest-reward-mons">
                        {rewardSpecials(q).map((s) => {
                          const claimed = claimedSpecial(s.id, state);
                          return (
                            <SpecialCard
                              key={s.id}
                              s={s}
                              runId={runId!}
                              state={state}
                              gameId={ctx.dataset.gameId}
                              onChange={onChange!}
                              badge={`Reward · #${q.number}`}
                              claimAreaId={status.areaId}
                              blockedReason={!claimed && !status.allowed ? status.reason : undefined}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <p className="muted">
                        Reward Pokémon:{' '}
                        {rewardSpecials(q)
                          .map((s) => `${s.species}${claimedSpecial(s.id, state) ? ' (claimed)' : ''}`)
                          .join(', ')}
                      </p>
                    )
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
