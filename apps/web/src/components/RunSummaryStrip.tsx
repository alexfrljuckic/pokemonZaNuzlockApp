import { RULES, nextBoss, type EngineContext, type RunEvent, type RunState } from '@nuzlocke/engine';
import { SpriteImg } from './SpriteImg';

interface SummaryItem {
  key: string;
  text: string;
  species?: string;
  tone: 'catch' | 'faint' | 'milestone' | 'wipe' | 'neutral';
}

/** Turns the last ~5 "major" events into a plain-language, sprite-annotated line. */
function describe(event: RunEvent, ctx: EngineContext): SummaryItem | null {
  switch (event.type) {
    case 'encounter_resolved': {
      if (event.payload.outcome !== 'caught') return null;
      const area = ctx.dataset?.areas.find((a) => a.id === event.payload.areaId);
      const name = event.payload.nickname && event.payload.nickname !== event.payload.species
        ? `${event.payload.nickname} the ${event.payload.species}`
        : event.payload.species;
      return {
        key: `${event.seq}`,
        text: `Caught ${name}${area ? ` on ${area.name}` : ''}`,
        species: event.payload.species,
        tone: 'catch',
      };
    }
    case 'special_claimed': {
      const special = ctx.dataset?.specials?.find((s) => s.id === event.payload.specialId);
      const isStarter = special?.id.startsWith('starter-') ?? false;
      const name = event.payload.nickname && event.payload.nickname !== event.payload.species
        ? `${event.payload.nickname} the ${event.payload.species}`
        : event.payload.species;
      return {
        key: `${event.seq}`,
        text: isStarter ? `Chose ${name} as starter` : `Claimed ${name}${special ? ` (${special.type})` : ''}`,
        species: event.payload.species,
        tone: 'catch',
      };
    }
    case 'faint': {
      const milestone = event.payload.milestoneId
        ? ctx.dataset?.milestones.find((m) => m.id === event.payload.milestoneId)
        : null;
      return {
        key: `${event.seq}`,
        text: `A Pokémon fainted${milestone ? ` to ${milestone.name}` : event.payload.killer ? ` to ${event.payload.killer}` : ''}`,
        tone: 'faint',
      };
    }
    case 'milestone_cleared': {
      const milestone = ctx.dataset?.milestones.find((m) => m.id === event.payload.milestoneId);
      return {
        key: `${event.seq}`,
        text: `Cleared: ${milestone?.name ?? event.payload.milestoneId}`,
        tone: 'milestone',
      };
    }
    case 'wipe_decision': {
      return {
        key: `${event.seq}`,
        text: event.payload.decision === 'reset' ? 'Run wiped — starting over' : 'Wiped, but continuing',
        tone: 'wipe',
      };
    }
    case 'run_ended': {
      return {
        key: `${event.seq}`,
        text: event.payload.result === 'victory' ? 'Victory!' : 'Run abandoned',
        tone: event.payload.result === 'victory' ? 'milestone' : 'neutral',
      };
    }
    default:
      return null;
  }
}

export function RunSummaryStrip({
  events,
  state,
  ctx,
  limit = 5,
}: {
  events: RunEvent[];
  state: RunState;
  ctx: EngineContext;
  limit?: number;
}) {
  const items: SummaryItem[] = [];
  for (let i = events.length - 1; i >= 0 && items.length < limit; i--) {
    const item = describe(events[i], ctx);
    if (item) items.push(item);
  }

  const party = Object.values(state.pokemon).filter((p) => p.status === 'party');

  // Current enforced level cap = next boss's ace (+ offset), when the rule is on.
  const capRule = state.ruleset.rules['level-cap'];
  const boss = nextBoss(state, ctx);
  const levelCap =
    capRule?.enabled && boss?.aceLevel != null ? boss.aceLevel + Number(capRule.params.offset ?? 0) : null;
  const overCap = levelCap != null && party.some((p) => p.level > levelCap);

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
        {levelCap != null && (
          <div className={`summary-cap${overCap ? ' over' : ''}`} title={boss ? `Next: ${boss.name}` : undefined}>
            <span className="summary-cap-label">Level cap</span>
            <span className="summary-cap-value">Lv {levelCap}</span>
            {boss && <span className="summary-cap-boss muted">next: {boss.name}</span>}
          </div>
        )}
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
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
