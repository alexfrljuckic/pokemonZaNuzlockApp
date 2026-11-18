import type { ReactNode } from 'react';
import type { Area, EngineContext, RunState } from '@nuzlocke/engine';
import { useOpenQuest } from '../../lib/openQuest';

/** Side quests tied to this area — a compact reference list. Shows quests
 * picked up here, plus quest Pokémon you catch/receive here for quests picked
 * up elsewhere (e.g. #19's shiny Ponyta on Horseshoe Plains). In the owner
 * view each row opens the quest in the Quests tab. */
export function QuestsHere({ area, state, ctx }: { area: Area; state: RunState; ctx: EngineContext }) {
  const openQuest = useOpenQuest();
  const quests = ctx.dataset.quests ?? [];
  const here = quests.filter((q) => q.area === area.id);
  const rewardsHere = [
    ...new Map(
      quests.flatMap((q) =>
        (q.rewardPokemon ?? [])
          .filter((r) => r.area === area.id && q.area !== area.id)
          .map((r) => [`${q.id}-${r.species}`, { q, r }] as const),
      ),
    ).values(),
  ];
  if (here.length === 0 && rewardsHere.length === 0) return null;
  const done = here.filter((q) => state.questsCompleted.includes(q.id)).length;

  const row = (questId: string, number: number, label: ReactNode) =>
    openQuest ? (
      <button
        type="button"
        className="link-button quest-here-row"
        onClick={() => openQuest(questId)}
        title={`Open #${number} in Quests`}
      >
        {label}
      </button>
    ) : (
      <span className="quest-here-row">{label}</span>
    );

  return (
    <div className="quests-here">
      {rewardsHere.length > 0 && (
        <>
          <p className="muted specials-group-label">Quest Pokémon found here</p>
          <ul className="quests-here-list">
            {rewardsHere.map(({ q, r }) => (
              <li key={`${q.id}-${r.species}`}>
                {row(
                  q.id,
                  q.number,
                  <>
                    <span className="quest-mon-flag">
                      {r.shiny ? '✦ shiny ' : ''}
                      {r.species}
                    </span>{' '}
                    — from <span className="quest-num">#{q.number}</span> {q.name}
                  </>,
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {here.length > 0 && (
        <>
          <p className="muted specials-group-label">
            Quests here ({done}/{here.length} done)
          </p>
          <ul className="quests-here-list">
            {here.map((q) => {
              const isDone = state.questsCompleted.includes(q.id);
              return (
                <li key={q.id}>
                  {row(
                    q.id,
                    q.number,
                    <>
                      <span className={`quest-check${isDone ? ' done' : ''}`} aria-hidden="true">
                        {isDone ? '✓' : '○'}
                      </span>
                      <span className="quest-num">#{q.number}</span> {q.name}
                      {q.rewardPokemon?.length ? <span className="quest-mon-flag"> · Pokémon reward</span> : null}
                    </>,
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
