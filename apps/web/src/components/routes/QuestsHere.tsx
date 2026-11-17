import type { Area, EngineContext, RunState } from '@nuzlocke/engine';
import { useOpenQuest } from '../../lib/openQuest';

/** Side quests picked up in this area — a compact reference list. In the
 * owner view each row opens the quest in the Quests tab. */
export function QuestsHere({ area, state, ctx }: { area: Area; state: RunState; ctx: EngineContext }) {
  const openQuest = useOpenQuest();
  const here = (ctx.dataset.quests ?? []).filter((q) => q.area === area.id);
  if (here.length === 0) return null;
  const done = here.filter((q) => state.questsCompleted.includes(q.id)).length;
  return (
    <div className="quests-here">
      <p className="muted specials-group-label">
        Quests here ({done}/{here.length} done)
      </p>
      <ul className="quests-here-list">
        {here.map((q) => {
          const isDone = state.questsCompleted.includes(q.id);
          const label = (
            <>
              <span className={`quest-check${isDone ? ' done' : ''}`} aria-hidden="true">
                {isDone ? '✓' : '○'}
              </span>
              <span className="quest-num">#{q.number}</span> {q.name}
              {q.rewardPokemon?.length ? <span className="quest-mon-flag"> · Pokémon reward</span> : null}
            </>
          );
          return (
            <li key={q.id}>
              {openQuest ? (
                <button type="button" className="link-button quest-here-row" onClick={() => openQuest(q.id)} title={`Open #${q.number} in Quests`}>
                  {label}
                </button>
              ) : (
                <span className="quest-here-row">{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
