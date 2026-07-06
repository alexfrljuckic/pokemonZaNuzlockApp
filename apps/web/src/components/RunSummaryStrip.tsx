import { RULES, nextBoss, party, type EngineContext, type RunEvent, type RunState } from '@nuzlocke/engine';
import { describeEvent, visibleEvents, type DescribedEvent } from '../lib/describeEvent';
import { SpriteImg } from './SpriteImg';
import { TrainerSprite } from './TrainerSprite';

export function RunSummaryStrip({
  events,
  state,
  ctx,
  limit = 5,
  onGoToBosses,
}: {
  events: RunEvent[];
  state: RunState;
  ctx: EngineContext;
  limit?: number;
  /** Jump to the Boss Fights tab; wired from RunView so the hash stays in sync. */
  onGoToBosses?: () => void;
}) {
  // reverted evolutions are netted out of history entirely (visibleEvents)
  const shown = visibleEvents(events);
  const items: DescribedEvent[] = [];
  for (let i = shown.length - 1; i >= 0 && items.length < limit; i--) {
    const item = describeEvent(shown[i], ctx, state.pokemon);
    if (item) items.push(item);
  }

  // Current enforced level cap = next boss's ace (+ offset), when the rule is on.
  const capRule = state.ruleset.rules['level-cap'];
  const boss = nextBoss(state, ctx);
  const levelCap =
    capRule?.enabled && boss?.aceLevel != null ? boss.aceLevel + Number(capRule.params.offset ?? 0) : null;
  const overCap = levelCap != null && party(state).some((p) => p.level > levelCap);

  // Every other active rule (level-cap gets its own richer badge above), so a
  // player can see at a glance what's actually enforced/tracked this run
  // without opening the Rules tab.
  const otherActiveRules = Object.values(RULES).filter(
    (r) =>
      r.id !== 'level-cap' &&
      (r.appliesTo === 'all' || r.appliesTo.includes(ctx.dataset.gameId)) &&
      state.ruleset.rules[r.id]?.enabled,
  );

  // Nothing to show yet on a brand-new run.
  if (items.length === 0 && levelCap == null && otherActiveRules.length === 0) return null;

  return (
    <section className="summary-strip">
      <h3 className="chart-heading">Active rules</h3>
      <div className="summary-rules">
        {levelCap != null &&
          (boss && onGoToBosses ? (
            // With a next boss we make the cap a real control that jumps to the
            // Boss Fights tab (through RunView's tab-change/navigate path).
            <button
              type="button"
              className={`summary-cap summary-cap-button${overCap ? ' over' : ''}`}
              title={`Next: ${boss.name}`}
              aria-label="Go to Boss Fights"
              onClick={onGoToBosses}
            >
              <span className="summary-cap-label">Level cap</span>
              <span className="summary-cap-value">Lv {levelCap}</span>
              <span className="summary-cap-boss muted">next: {boss.name}</span>
            </button>
          ) : (
            <div className={`summary-cap${overCap ? ' over' : ''}`} title={boss ? `Next: ${boss.name}` : undefined}>
              <span className="summary-cap-label">Level cap</span>
              <span className="summary-cap-value">Lv {levelCap}</span>
              {boss && <span className="summary-cap-boss muted">next: {boss.name}</span>}
            </div>
          ))}
        {otherActiveRules.map((r) => (
          <span key={r.id} className={`rule-chip rule-chip-${r.enforcement}`} title={r.description}>
            {r.name}
          </span>
        ))}
        {levelCap == null && otherActiveRules.length === 0 && (
          <span className="muted">No rules enforced this run</span>
        )}
      </div>

      {items.length > 0 && (
        <>
          <h3 className="chart-heading">Recent events</h3>
          <ul className="summary-list">
            {items.map((item) => (
              <li key={item.key} className={`summary-item summary-${item.tone}`}>
                {item.species && <SpriteImg species={item.species} size={28} />}
                {!item.species && item.trainerKey && <TrainerSprite trainerKey={item.trainerKey} size={28} />}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
